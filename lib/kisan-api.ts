import type { WeatherData, SoilData, MandiPrice, LocationInfo, NASAPowerData } from '@/types/kisan'

export async function fetchWeather(lat: number, lon: number): Promise<WeatherData> {
  const url = new URL('https://api.open-meteo.com/v1/forecast')
  url.searchParams.set('latitude', String(lat))
  url.searchParams.set('longitude', String(lon))
  url.searchParams.set(
    'current',
    'temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m',
  )
  url.searchParams.set(
    'daily',
    'temperature_2m_max,temperature_2m_min,precipitation_sum,et0_fao_evapotranspiration',
  )
  // ERA5-Land soil moisture (4 depths) + soil temperature (2 depths) — all confirmed working for India
  url.searchParams.set(
    'hourly',
    'soil_moisture_0_to_1cm,soil_moisture_1_to_3cm,soil_moisture_3_to_9cm,soil_moisture_9_to_27cm,soil_temperature_0cm,soil_temperature_6cm',
  )
  url.searchParams.set('timezone', 'Asia/Kolkata')
  url.searchParams.set('forecast_days', '7')

  const res = await fetch(url.toString(), { signal: AbortSignal.timeout(10000) })
  if (!res.ok) throw new Error(`Open-Meteo failed: ${res.status}`)
  const data = await res.json()
  console.log('[KisanMonitor] Open-Meteo:', data)

  // Find current hour index so we report the right hourly soil value
  const nowIso = data.current.time as string
  const hourlyTimes: string[] = data.hourly.time
  const currentIdx = Math.max(0, hourlyTimes.findIndex(t => t >= nowIso))

  const h = data.hourly
  return {
    current: {
      temperature: data.current.temperature_2m,
      humidity: data.current.relative_humidity_2m,
      precipitation: data.current.precipitation,
      windSpeed: data.current.wind_speed_10m,
      // ERA5-Land soil at current hour — replaces SoilGrids (null for India)
      soilMoisture0: h.soil_moisture_0_to_1cm?.[currentIdx],
      soilMoisture1: h.soil_moisture_1_to_3cm?.[currentIdx],
      soilMoisture3: h.soil_moisture_3_to_9cm?.[currentIdx],
      soilMoisture9: h.soil_moisture_9_to_27cm?.[currentIdx],
      soilTemp0:     h.soil_temperature_0cm?.[currentIdx],
      soilTemp6:     h.soil_temperature_6cm?.[currentIdx],
    },
    daily: {
      dates: data.daily.time,
      maxTemp: data.daily.temperature_2m_max,
      minTemp: data.daily.temperature_2m_min,
      precipitation: data.daily.precipitation_sum,
      et0: data.daily.et0_fao_evapotranspiration,
    },
    hourly: {
      soilMoisture: h.soil_moisture_0_to_1cm,
    },
  }
}

export async function fetchSoil(lat: number, lon: number): Promise<SoilData> {
  const params = new URLSearchParams()
  params.set('lon', String(lon))
  params.set('lat', String(lat))
  ;['phh2o', 'soc', 'nitrogen', 'clay', 'sand', 'silt'].forEach(p => params.append('property', p))
  params.append('depth', '0-5cm')
  params.append('value', 'mean')

  const res = await fetch(
    `https://rest.isric.org/soilgrids/v2.0/properties/query?${params}`,
    { signal: AbortSignal.timeout(15000) },
  )
  if (!res.ok) throw new Error(`SoilGrids failed: ${res.status}`)
  const data = await res.json()
  console.log('[KisanMonitor] SoilGrids:', data)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const getVal = (prop: string): number | null => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const layer = data.properties?.layers?.find((l: any) => l.name === prop)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const depth = layer?.depths?.find((d: any) => d.label === '0-5cm')
    const val = depth?.values?.mean
    return val != null ? val : null
  }

  // SoilGrids scaling: pH ×10, SOC ×10, N ×100, texture ×10
  return {
    ph:             getVal('phh2o') != null ? getVal('phh2o')! / 10 : null,
    organicCarbon:  getVal('soc')   != null ? getVal('soc')!   / 10 : null,
    nitrogen:       getVal('nitrogen') != null ? getVal('nitrogen')! / 100 : null,
    clay:           getVal('clay')  != null ? getVal('clay')!  / 10 : null,
    sand:           getVal('sand')  != null ? getVal('sand')!  / 10 : null,
    silt:           getVal('silt')  != null ? getVal('silt')!  / 10 : null,
  }
}

/**
 * Fetch real mandi prices from data.gov.in (Agmarknet).
 * Throws on API failure — callers must handle the error and show an empty/error state.
 * No fake fallback data is used.
 */
export async function fetchMandi(
  state: string,
  commodity: string,
  apiKey: string,
): Promise<MandiPrice[]> {
  const url = new URL('https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070')
  url.searchParams.set('api-key', apiKey)
  url.searchParams.set('format', 'json')
  url.searchParams.set('limit', '25')
  url.searchParams.set('filters[state]', state)
  if (commodity) url.searchParams.set('filters[commodity]', commodity)

  const res = await fetch(url.toString(), { signal: AbortSignal.timeout(10000) })
  if (!res.ok) throw new Error(`data.gov.in Agmarknet failed: ${res.status}`)

  const data = await res.json()
  console.log('[KisanMonitor] data.gov.in Mandi:', data)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const records: any[] = data.records || data.data || []
  if (records.length === 0) throw new Error('No mandi records returned for this state/commodity')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return records.map((r: any) => ({
    market:     r.market     || r.Market     || '',
    district:   r.district   || r.District   || '',
    state:      r.state      || r.State      || state,
    commodity:  r.commodity  || r.Commodity  || commodity,
    variety:    r.variety    || r.Variety    || '-',
    minPrice:   parseFloat(r.min_price   || r['Min Price']   || '0'),
    maxPrice:   parseFloat(r.max_price   || r['Max Price']   || '0'),
    modalPrice: parseFloat(r.modal_price || r['Modal Price'] || '0'),
    date:       r.arrival_date || r['Arrival Date'] || '',
  }))
}

/**
 * Fetch 30-day historical agroclimatology from NASA POWER.
 * Free, no API key, ~15s response time.
 */
export async function fetchNASAPower(lat: number, lon: number): Promise<NASAPowerData> {
  const end = new Date()
  const start = new Date()
  start.setDate(start.getDate() - 30)
  const fmt = (d: Date) => d.toISOString().slice(0, 10).replace(/-/g, '')

  const url = new URL('https://power.larc.nasa.gov/api/temporal/daily/point')
  url.searchParams.set('parameters', 'PRECTOTCORR,T2M,RH2M')
  url.searchParams.set('community', 'AG')
  url.searchParams.set('longitude', String(lon))
  url.searchParams.set('latitude', String(lat))
  url.searchParams.set('start', fmt(start))
  url.searchParams.set('end', fmt(end))
  url.searchParams.set('format', 'JSON')

  const res = await fetch(url.toString(), { signal: AbortSignal.timeout(25000) })
  if (!res.ok) throw new Error(`NASA POWER failed: ${res.status}`)
  const data = await res.json()
  console.log('[KisanMonitor] NASA POWER:', data)

  const params = data.properties?.parameter || {}
  const dates = Object.keys(params.PRECTOTCORR || {})

  return {
    dates,
    precipitation: dates.map(d => Math.max(0, params.PRECTOTCORR?.[d] ?? 0)),
    temperature:   dates.map(d => params.T2M?.[d] ?? 0),
    humidity:      dates.map(d => params.RH2M?.[d] ?? 0),
  }
}

export async function reverseGeocode(lat: number, lon: number): Promise<LocationInfo> {
  const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}&addressdetails=1`
  const res = await fetch(url, {
    headers: { 'Accept-Language': 'en' },
    signal: AbortSignal.timeout(8000),
  })
  if (!res.ok) throw new Error(`Nominatim failed: ${res.status}`)
  const data = await res.json()
  console.log('[KisanMonitor] Nominatim:', data)
  const a = data.address || {}
  return {
    village:  a.village || a.hamlet || a.town || a.suburb || a.city_district,
    district: a.county  || a.state_district || a.district || a.city,
    state:    a.state,
    country:  a.country,
  }
}
