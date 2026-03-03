'use client'

import dynamic from 'next/dynamic'
import { useState, useCallback, useEffect } from 'react'
import { Header } from '@/components/kisan/header'
import { LeftPanel } from '@/components/kisan/left-panel'
import { RightPanel } from '@/components/kisan/right-panel'
import { ApiKeyButton } from '@/components/kisan/api-key-modal'
import type {
  WeatherData, SoilData, MandiPrice, LocationInfo, LayerConfig, Farmer, NASAPowerData,
} from '@/types/kisan'
import { DEFAULT_LAYERS, DATA_GOV_API_KEY } from '@/lib/kisan-data'
import { fetchWeather, fetchSoil, fetchMandi, fetchNASAPower, reverseGeocode } from '@/lib/kisan-api'

const MapPanel = dynamic(
  () => import('@/components/kisan/map-panel'),
  {
    ssr: false,
    loading: () => (
      <div className="flex-1 flex items-center justify-center" style={{ background: '#0a0f0a' }}>
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <div className="text-xs text-green-700 font-mono tracking-wider">Initializing map...</div>
        </div>
      </div>
    ),
  },
)

// Delhi — startup location so dashboard shows live data immediately
const STARTUP_LAT = 28.6139
const STARTUP_LON = 77.2090

const DEFAULT_LAT = 20.5937
const DEFAULT_LON = 78.9629

const STORAGE_KEY = 'kisan_data_gov_api_key'

export default function KisanMonitorPage() {
  const [selectedLat, setSelectedLat]       = useState(DEFAULT_LAT)
  const [selectedLon, setSelectedLon]       = useState(DEFAULT_LON)
  const [locationInfo, setLocationInfo]     = useState<LocationInfo | null>(null)
  const [weatherData, setWeatherData]       = useState<WeatherData | null>(null)
  const [soilData, setSoilData]             = useState<SoilData | null>(null)
  const [mandiData, setMandiData]           = useState<MandiPrice[]>([])
  const [nasaData, setNasaData]             = useState<NASAPowerData | null>(null)
  const [mandiError, setMandiError]         = useState<string | null>(null)
  const [selectedFarmer, setSelectedFarmer] = useState<Farmer | null>(null)
  const [layers, setLayers]                 = useState<LayerConfig[]>(DEFAULT_LAYERS)
  const [apiKey, setApiKey]                 = useState(DATA_GOV_API_KEY)
  const [loading, setLoading]               = useState({
    weather: false, soil: false, mandi: false, geocode: false, nasa: false,
  })

  // Read saved API key from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) setApiKey(saved)
  }, [])

  // On mount: fetch live weather for Delhi + mandi + NASA POWER
  useEffect(() => {
    // Open-Meteo weather (confirmed working for India)
    setLoading(s => ({ ...s, weather: true }))
    fetchWeather(STARTUP_LAT, STARTUP_LON)
      .then(w => { setWeatherData(w); setSelectedLat(STARTUP_LAT); setSelectedLon(STARTUP_LON) })
      .catch(e => console.warn('[KisanMonitor] Startup weather:', e))
      .finally(() => setLoading(s => ({ ...s, weather: false })))

    // data.gov.in Agmarknet mandi prices
    const key = localStorage.getItem(STORAGE_KEY) ?? DATA_GOV_API_KEY
    setLoading(s => ({ ...s, mandi: true }))
    setMandiError(null)
    fetchMandi('Maharashtra', 'Wheat', key)
      .then(prices => { setMandiData(prices); setMandiError(null) })
      .catch(err => {
        setMandiData([])
        setMandiError(err instanceof Error ? err.message : 'API error')
        console.warn('[KisanMonitor] Startup mandi:', err)
      })
      .finally(() => setLoading(s => ({ ...s, mandi: false })))

    // NASA POWER 30-day history (slow ~15-25s, runs in background)
    setLoading(s => ({ ...s, nasa: true }))
    fetchNASAPower(STARTUP_LAT, STARTUP_LON)
      .then(setNasaData)
      .catch(e => console.warn('[KisanMonitor] NASA POWER startup:', e))
      .finally(() => setLoading(s => ({ ...s, nasa: false })))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleLocationFetch = useCallback(async (lat: number, lon: number) => {
    setSelectedLat(lat)
    setSelectedLon(lon)
    setLoading(s => ({ ...s, weather: true, soil: true, geocode: true, nasa: true }))

    // Parallel: geocode (Nominatim) + weather/soil (Open-Meteo)
    // SoilGrids removed — returns null for all Indian locations
    const [locResult, weatherResult] = await Promise.allSettled([
      reverseGeocode(lat, lon),
      fetchWeather(lat, lon),
    ])

    if (locResult.status === 'fulfilled')    setLocationInfo(locResult.value)
    else console.warn('[KisanMonitor] Geocode:', locResult.reason)

    if (weatherResult.status === 'fulfilled') setWeatherData(weatherResult.value)
    else console.warn('[KisanMonitor] Weather:', weatherResult.reason)

    // SoilData kept in state for future use (HWSD etc.) but not fetched
    setSoilData(null)

    setLoading(s => ({ ...s, weather: false, soil: false, geocode: false }))

    // NASA POWER — slow, runs in background
    setNasaData(null)
    fetchNASAPower(lat, lon)
      .then(setNasaData)
      .catch(e => console.warn('[KisanMonitor] NASA POWER:', e))
      .finally(() => setLoading(s => ({ ...s, nasa: false })))
  }, [])

  const handleMandiSearch = useCallback(async (state: string, commodity: string) => {
    setLoading(s => ({ ...s, mandi: true }))
    setMandiError(null)
    try {
      const prices = await fetchMandi(state, commodity, apiKey)
      setMandiData(prices)
    } catch (err) {
      setMandiData([])
      setMandiError(err instanceof Error ? err.message : 'Mandi API unavailable')
    } finally {
      setLoading(s => ({ ...s, mandi: false }))
    }
  }, [apiKey])

  const handleFarmerSelect = useCallback(async (farmer: Farmer) => {
    setSelectedFarmer(farmer)
    await handleLocationFetch(farmer.lat, farmer.lon)
    setLoading(s => ({ ...s, mandi: true }))
    setMandiError(null)
    fetchMandi(farmer.state, farmer.crop, apiKey)
      .then(prices => { setMandiData(prices); setMandiError(null) })
      .catch(err => {
        setMandiData([])
        setMandiError(err instanceof Error ? err.message : 'Mandi API unavailable')
      })
      .finally(() => setLoading(s => ({ ...s, mandi: false })))
  }, [handleLocationFetch, apiKey])

  const handleToggleLayer = useCallback((id: string) => {
    setLayers(prev => prev.map(l => l.id === id ? { ...l, enabled: !l.enabled } : l))
  }, [])

  const handleApiKeyChange = useCallback((newKey: string) => {
    setApiKey(newKey)
  }, [])

  const anyLoading = loading.weather || loading.geocode

  return (
    <div className="kisan-dashboard flex flex-col">
      <Header
        onFarmerSelect={handleFarmerSelect}
        locationInfo={locationInfo}
        weatherData={weatherData}
        loading={anyLoading}
        apiKeySlot={<ApiKeyButton onKeyChange={handleApiKeyChange} />}
      />

      <main className="flex flex-1 overflow-hidden">
        <LeftPanel
          layers={layers}
          onToggleLayer={handleToggleLayer}
          weatherData={weatherData}
          weatherLoading={loading.weather}
          mandiData={mandiData}
          mandiLoading={loading.mandi}
          onMandiSearch={handleMandiSearch}
        />

        <MapPanel
          onLocationClick={handleLocationFetch}
          layers={layers}
          weatherData={weatherData}
          soilData={soilData}
          selectedLat={selectedLat}
          selectedLon={selectedLon}
          locationInfo={locationInfo}
          selectedFarmer={selectedFarmer}
        />

        <RightPanel
          weatherData={weatherData}
          soilData={soilData}
          mandiData={mandiData}
          nasaData={nasaData}
          nasaLoading={loading.nasa}
          loading={loading}
          selectedFarmer={selectedFarmer}
          locationInfo={locationInfo}
          mandiError={mandiError}
        />
      </main>
    </div>
  )
}
