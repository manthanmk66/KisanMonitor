'use client'

import { useMemo } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  AreaChart, Area,
} from 'recharts'
import {
  Thermometer, Droplets, Wind, CloudRain, AlertTriangle,
  TrendingDown, ShoppingCart, Activity, MapPin, History, ExternalLink,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import type {
  WeatherData, SoilData, MandiPrice, LocationInfo, StressData, Farmer, NASAPowerData,
} from '@/types/kisan'
import { MSP_2025 } from '@/lib/kisan-data'
import { generateAlerts } from '@/lib/generate-alerts'
import { getBhulelkhSearchUrl, getBhulelkhPortal } from '@/lib/bhulekh-links'

interface RightPanelProps {
  weatherData: WeatherData | null
  soilData: SoilData | null
  mandiData: MandiPrice[]
  nasaData: NASAPowerData | null
  nasaLoading: boolean
  loading: { weather: boolean; soil: boolean; mandi: boolean }
  selectedFarmer: Farmer | null
  locationInfo: LocationInfo | null
  mandiError: string | null
}

function calculateStress(
  weather: WeatherData | null,
  mandiData: MandiPrice[],
  farmer: Farmer | null,
): StressData {
  let rainfall = 50, moisture = 50, priceGap = 50

  if (weather) {
    const avg = weather.daily.precipitation.reduce((a, b) => a + b, 0) / weather.daily.precipitation.length
    rainfall = avg < 1 ? 85 : avg < 2 ? 65 : avg < 5 ? 40 : avg < 10 ? 25 : 15
    const sm = weather.hourly.soilMoisture[0] ?? 0.25
    moisture = sm < 0.10 ? 90 : sm < 0.18 ? 70 : sm < 0.28 ? 45 : sm < 0.4 ? 25 : 10
  }

  if (farmer && mandiData.length > 0) {
    const msp = MSP_2025[farmer.crop] ?? 0
    if (msp > 0) {
      const avg = mandiData.reduce((s, m) => s + m.modalPrice, 0) / mandiData.length
      const gap = ((msp - avg) / msp) * 100
      priceGap = gap > 25 ? 85 : gap > 15 ? 65 : gap > 5 ? 45 : gap > 0 ? 25 : 10
    }
  }

  const score = Math.round(rainfall * 0.4 + moisture * 0.35 + priceGap * 0.25)
  const level = score > 70 ? 'critical' : score > 50 ? 'high' : score > 30 ? 'moderate' : 'low'
  return { score, level, components: { rainfall, moisture, priceGap } }
}

function SectionHeading({ icon: Icon, label, badge }: {
  icon: React.ElementType; label: string; badge?: string
}) {
  return (
    <div className="flex items-center gap-1.5 mb-2">
      <Icon className="w-3 h-3 text-green-600" />
      <span className="text-[9px] font-bold tracking-widest text-green-700 uppercase">{label}</span>
      {badge && (
        <Badge variant="outline" className="text-[8px] h-3.5 px-1 border-green-900 text-green-700 ml-auto">
          {badge}
        </Badge>
      )}
    </div>
  )
}

const ALERT_ICONS: Record<string, string> = {
  rain: '🌧', price: '💰', drought: '🏜', pest: '🌱', frost: '🌡',
}
const ALERT_COLORS: Record<string, string> = {
  critical: '#ef4444', high: '#f97316', medium: '#facc15', low: '#22c55e',
}

// ─── Land Record Card ────────────────────────────────────────────────────────

function LandRow({ label, value }: { label: string; value?: string | number }) {
  if (!value && value !== 0) return null
  return (
    <div className="flex justify-between items-baseline gap-2">
      <span className="text-[9px] text-green-700 shrink-0">{label}</span>
      <span className="text-[10px] text-green-300 font-mono truncate text-right">{value}</span>
    </div>
  )
}

function FarmerLandCard({ farmer }: { farmer: Farmer }) {
  const bhulekh = getBhulelkhSearchUrl(farmer.state, farmer.district, farmer.khasra, farmer.khataNo)
  const portal  = getBhulelkhPortal(farmer.state)

  return (
    <div className="mt-2 rounded border overflow-hidden" style={{ borderColor: '#1a3a1a' }}>
      {/* Name + crop header */}
      <div className="px-2 py-1.5 flex items-center justify-between" style={{ background: '#0e1f0e' }}>
        <div>
          <div className="text-xs font-semibold text-yellow-400 flex items-center gap-1.5">
            {farmer.name}
            {farmer.isCustom && (
              <span className="text-[8px] px-1 rounded bg-yellow-900/30 text-yellow-600 border border-yellow-900/40">
                registered
              </span>
            )}
          </div>
          {farmer.fatherName && (
            <div className="text-[9px] text-green-700">S/o {farmer.fatherName}</div>
          )}
        </div>
        <div className="text-right">
          <div className="text-[10px] font-medium text-green-300">{farmer.crop}</div>
          <div className="text-[9px] text-green-700">{farmer.area} ha · {farmer.season ?? '—'}</div>
        </div>
      </div>

      {/* Land record details */}
      <div className="px-2 py-2 space-y-0.5" style={{ background: '#0a150a' }}>
        <LandRow label="Khasra / Gat"   value={farmer.khasra} />
        <LandRow label="Khata / Khewat" value={farmer.khataNo} />
        <LandRow label="Survey / Hissa" value={farmer.surveyNo} />
        <LandRow label="Village"        value={farmer.village} />
        <LandRow label="Tehsil"         value={farmer.tehsil} />
        <LandRow label="District"       value={farmer.district} />
        <LandRow label="State"          value={farmer.state} />
        <LandRow label="Land Type"      value={farmer.landType} />
        <LandRow label="Ownership"      value={farmer.ownership} />
        {farmer.phone && <LandRow label="Phone" value={farmer.phone} />}
        <LandRow
          label="Coordinates"
          value={`${farmer.lat.toFixed(4)}, ${farmer.lon.toFixed(4)}`}
        />
      </div>

      {/* Bhulekh portal link */}
      {bhulekh && portal && (
        <div className="px-2 py-1.5 border-t" style={{ borderColor: '#1a2e1a', background: '#0a150a' }}>
          <a
            href={bhulekh}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-[10px] text-blue-400 hover:text-blue-300 transition-colors"
          >
            <ExternalLink className="w-3 h-3 shrink-0" />
            <span>Open {portal.portalName}</span>
            {portal.hasDeepLink
              ? <span className="text-green-700 ml-auto text-[9px]">pre-filled ↗</span>
              : <span className="text-green-800 ml-auto text-[9px]">search manually ↗</span>}
          </a>
        </div>
      )}
    </div>
  )
}

// ─── RightPanel ──────────────────────────────────────────────────────────────

export function RightPanel({
  weatherData, soilData, mandiData, nasaData, nasaLoading,
  loading, selectedFarmer, locationInfo, mandiError,
}: RightPanelProps) {
  const stress = useMemo(
    () => calculateStress(weatherData, mandiData, selectedFarmer),
    [weatherData, mandiData, selectedFarmer],
  )

  // Alerts generated entirely from real API data
  const alerts = useMemo(
    () => generateAlerts(weatherData, mandiData, soilData, locationInfo),
    [weatherData, mandiData, soilData, locationInfo],
  )

  const stressColor = stress.score > 70 ? '#ef4444'
    : stress.score > 50 ? '#f97316'
    : stress.score > 30 ? '#facc15' : '#22c55e'

  const stressLabel = stress.score > 70 ? 'CRITICAL'
    : stress.score > 50 ? 'HIGH STRESS'
    : stress.score > 30 ? 'MODERATE' : 'LOW STRESS'

  const forecastChartData = weatherData?.daily.dates.map((date, i) => ({
    day: new Date(date).toLocaleDateString('en-IN', { weekday: 'short' }),
    rain: weatherData.daily.precipitation[i] ?? 0,
  })) ?? []

  // NASA POWER: last 14 days for a compact chart
  const nasaChartData = nasaData
    ? nasaData.dates.slice(-14).map((d, i) => ({
        day: new Date(d.slice(0, 4) + '-' + d.slice(4, 6) + '-' + d.slice(6, 8))
          .toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
        rain: nasaData.precipitation[nasaData.precipitation.length - 14 + i] ?? 0,
        temp: nasaData.temperature[nasaData.temperature.length - 14 + i] ?? 0,
      }))
    : []

  const nasaTotalRain = nasaData
    ? nasaData.precipitation.reduce((a, b) => a + b, 0).toFixed(1)
    : null
  const nasaAvgTemp = nasaData
    ? (nasaData.temperature.reduce((a, b) => a + b, 0) / nasaData.temperature.length).toFixed(1)
    : null

  return (
    <aside
      className="kisan-panel-scroll flex flex-col shrink-0 overflow-y-auto overflow-x-hidden border-l"
      style={{ width: 280, background: '#060e06', borderColor: '#1a2e1a' }}
    >
      {/* Location + Farmer */}
      <div className="p-3 border-b" style={{ borderColor: '#1a2e1a' }}>
        <SectionHeading icon={MapPin} label="Selected Location" />
        {locationInfo ? (
          <div>
            <div className="text-sm font-semibold text-green-200">
              {locationInfo.village || locationInfo.district || 'Unknown location'}
            </div>
            <div className="text-[11px] text-green-600">
              {[locationInfo.district, locationInfo.state].filter(Boolean).join(', ')}
            </div>
          </div>
        ) : (
          <div className="text-[11px] text-green-800">Click the map to select location</div>
        )}

        {selectedFarmer && (
          <FarmerLandCard farmer={selectedFarmer} />
        )}
      </div>

      {/* Current Weather — Open-Meteo */}
      <div className="p-3 border-b" style={{ borderColor: '#1a2e1a' }}>
        <SectionHeading icon={Thermometer} label="Current Weather" badge="Open-Meteo" />
        {loading.weather && (
          <div className="grid grid-cols-2 gap-2">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-10 bg-green-900/20" />)}
          </div>
        )}
        {!loading.weather && !weatherData && (
          <div className="text-[10px] text-green-800 py-2">Click map to fetch live weather</div>
        )}
        {!loading.weather && weatherData && (
          <div className="grid grid-cols-2 gap-1.5">
            {[
              { icon: Thermometer, label: 'Temperature', value: `${weatherData.current.temperature}°C`, color: '#f97316' },
              { icon: Droplets,    label: 'Humidity',    value: `${weatherData.current.humidity}%`,     color: '#3b82f6' },
              { icon: CloudRain,   label: 'Rainfall',    value: `${weatherData.current.precipitation} mm`, color: '#22c55e' },
              { icon: Wind,        label: 'Wind',        value: `${weatherData.current.windSpeed} km/h`,   color: '#a78bfa' },
            ].map(({ icon: Icon, label, value, color }) => (
              <div key={label} className="p-2 rounded border" style={{ background: '#0a150a', borderColor: '#1a2e1a' }}>
                <div className="flex items-center gap-1 mb-0.5">
                  <Icon className="w-3 h-3" style={{ color }} />
                  <span className="text-[9px] text-green-700">{label}</span>
                </div>
                <div className="text-xs font-mono font-bold" style={{ color }}>{value}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 7-Day Rainfall Forecast — Open-Meteo */}
      <div className="p-3 border-b" style={{ borderColor: '#1a2e1a' }}>
        <SectionHeading icon={CloudRain} label="7-Day Forecast" badge="Open-Meteo" />
        {loading.weather && <Skeleton className="h-20 w-full bg-green-900/20" />}
        {!loading.weather && forecastChartData.length === 0 && (
          <div className="text-[10px] text-green-800 py-4 text-center">Click map to load forecast</div>
        )}
        {!loading.weather && forecastChartData.length > 0 && (
          <>
            <ResponsiveContainer width="100%" height={80}>
              <BarChart data={forecastChartData} margin={{ top: 4, right: 0, bottom: 0, left: -28 }}>
                <XAxis dataKey="day" tick={{ fontSize: 9, fill: '#4b7a5a' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 9, fill: '#4b7a5a' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: '#0f1a0f', border: '1px solid #1a2e1a', borderRadius: 6, fontSize: 10, padding: '4px 8px' }}
                  labelStyle={{ color: '#6ee7b7' }}
                  formatter={(v: number) => [`${v.toFixed(1)} mm`, 'Rainfall']}
                />
                <Bar dataKey="rain" radius={[2, 2, 0, 0]}>
                  {forecastChartData.map((entry, i) => (
                    <Cell key={i} fill={
                      entry.rain > 25 ? '#3b82f6'
                        : entry.rain > 10 ? '#22c55e'
                        : entry.rain > 2  ? '#6ee7b7'
                        : '#1a2e1a'
                    } fillOpacity={0.85} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            {weatherData && (
              <div className="flex justify-between text-[9px] text-green-700 mt-1">
                <span>ET₀: {weatherData.daily.et0[0]?.toFixed(1) ?? '—'} mm/day</span>
                <span>Total: {weatherData.daily.precipitation.reduce((a, b) => a + b, 0).toFixed(1)} mm</span>
              </div>
            )}
          </>
        )}
      </div>

      {/* 30-Day Historical Rainfall — NASA POWER */}
      <div className="p-3 border-b" style={{ borderColor: '#1a2e1a' }}>
        <SectionHeading icon={History} label="30-Day History" badge="NASA POWER" />
        {nasaLoading && (
          <div>
            <Skeleton className="h-16 w-full bg-green-900/20 mb-1" />
            <div className="text-[9px] text-green-800 text-center">Fetching NASA POWER data...</div>
          </div>
        )}
        {!nasaLoading && !nasaData && (
          <div className="text-[10px] text-green-800 py-2">Click map — fetches 30-day agroclimatology</div>
        )}
        {!nasaLoading && nasaData && nasaChartData.length > 0 && (
          <>
            <ResponsiveContainer width="100%" height={60}>
              <AreaChart data={nasaChartData} margin={{ top: 2, right: 0, bottom: 0, left: -28 }}>
                <defs>
                  <linearGradient id="rainGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" tick={{ fontSize: 8, fill: '#4b7a5a' }} axisLine={false} tickLine={false} interval={3} />
                <YAxis tick={{ fontSize: 8, fill: '#4b7a5a' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: '#0f1a0f', border: '1px solid #1a2e1a', borderRadius: 6, fontSize: 10, padding: '4px 8px' }}
                  labelStyle={{ color: '#6ee7b7' }}
                  formatter={(v: number) => [`${v.toFixed(1)} mm`, 'Rainfall']}
                />
                <Area type="monotone" dataKey="rain" stroke="#3b82f6" fill="url(#rainGrad)" strokeWidth={1.5} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
            <div className="flex justify-between text-[9px] text-green-700 mt-1">
              <span>Total: {nasaTotalRain} mm</span>
              <span>Avg Temp: {nasaAvgTemp}°C</span>
              <span>30 days</span>
            </div>
          </>
        )}
      </div>

      {/* Farmer Stress Index */}
      <div className="p-3 border-b" style={{ borderColor: '#1a2e1a' }}>
        <SectionHeading icon={Activity} label="Farmer Stress Index" />
        <div className="flex items-end justify-between mb-1.5">
          <div>
            <div className="text-2xl font-bold font-mono" style={{ color: stressColor }}>{stress.score}</div>
            <div className="text-[9px] font-bold" style={{ color: stressColor }}>{stressLabel}</div>
          </div>
          <div className="text-right text-[9px] text-green-700">
            <div>/ 100</div>
            <div className="text-[8px]">composite</div>
          </div>
        </div>
        <div className="h-2 rounded-full bg-[#1a2e1a] overflow-hidden mb-3">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{ width: `${stress.score}%`, background: `linear-gradient(90deg, #22c55e, ${stressColor})` }}
          />
        </div>
        {[
          { label: 'Rainfall Deficit', value: stress.components.rainfall },
          { label: 'Soil Moisture',    value: stress.components.moisture },
          { label: 'Price vs MSP',     value: stress.components.priceGap },
        ].map(c => (
          <div key={c.label} className="mb-1.5">
            <div className="flex justify-between text-[9px] text-green-700 mb-0.5">
              <span>{c.label}</span>
              <span className="font-mono">{c.value}%</span>
            </div>
            <div className="h-1 rounded-full bg-[#1a2e1a]">
              <div className="h-full rounded-full" style={{
                width: `${c.value}%`,
                background: c.value > 65 ? '#ef4444' : c.value > 45 ? '#f97316' : '#22c55e',
              }} />
            </div>
          </div>
        ))}
        <div className="text-[8px] text-green-800 mt-1.5">
          Sources: Open-Meteo · SoilGrids · Agmarknet
        </div>
      </div>

      {/* Mandi Prices — data.gov.in */}
      <div className="p-3 border-b" style={{ borderColor: '#1a2e1a' }}>
        <SectionHeading icon={ShoppingCart} label="Mandi Prices" badge="Agmarknet" />
        {loading.mandi && (
          <div className="space-y-1.5">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-7 w-full bg-green-900/20" />)}
          </div>
        )}
        {!loading.mandi && mandiError && (
          <div
            className="flex items-start gap-2 p-2 rounded border text-[10px]"
            style={{ background: '#0a150a', borderColor: '#7f1d1d' }}
          >
            <span className="text-red-400 shrink-0">⚠</span>
            <div>
              <div className="text-red-400 font-medium">data.gov.in API unavailable</div>
              <div className="text-green-800 mt-0.5">{mandiError}</div>
              <div className="text-green-700 mt-1">Try a different state/commodity or check your API key</div>
            </div>
          </div>
        )}
        {!loading.mandi && !mandiError && mandiData.length === 0 && (
          <div className="text-[10px] text-green-800 py-2 text-center">
            Use Mandi Search in the left panel
          </div>
        )}
        {!loading.mandi && !mandiError && mandiData.length > 0 && (
          <div className="space-y-1">
            {mandiData.slice(0, 6).map((m, i) => {
              const msp = MSP_2025[m.commodity] ?? null
              const belowMsp = msp && m.modalPrice > 0 && m.modalPrice < msp
              return (
                <div
                  key={i}
                  className="flex items-center justify-between px-2 py-1.5 rounded border"
                  style={{ background: '#0a150a', borderColor: belowMsp ? '#7f1d1d' : '#1a2e1a' }}
                >
                  <div className="min-w-0">
                    <div className="text-[10px] font-medium text-green-300 truncate">{m.market}</div>
                    <div className="text-[9px] text-green-700">{m.commodity} · {m.date}</div>
                  </div>
                  <div className="text-right shrink-0 ml-2">
                    <div className="text-[11px] font-mono font-bold text-green-200">
                      ₹{m.modalPrice.toLocaleString('en-IN')}
                    </div>
                    {belowMsp && (
                      <div className="flex items-center gap-0.5 justify-end">
                        <TrendingDown className="w-2.5 h-2.5 text-red-400" />
                        <span className="text-[8px] text-red-400">below MSP</span>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
            {mandiData.length > 6 && (
              <div className="text-[9px] text-green-800 text-center pt-1">
                +{mandiData.length - 6} more records from API
              </div>
            )}
          </div>
        )}
      </div>

      {/* Live Alerts — generated from real API data */}
      <div className="p-3">
        <SectionHeading icon={AlertTriangle} label="Live Alerts" />
        {alerts.length === 0 ? (
          <div
            className="flex items-center gap-2 p-2 rounded border text-[10px]"
            style={{ background: '#0a150a', borderColor: '#1a2e1a' }}
          >
            <span className="text-green-500">✓</span>
            <span className="text-green-600">
              {weatherData || mandiData.length > 0 || soilData
                ? 'No stress indicators detected from current data'
                : 'Click map to generate data-driven alerts'}
            </span>
          </div>
        ) : (
          <div className="space-y-1.5">
            {alerts.map(alert => (
              <div
                key={alert.id}
                className="flex gap-2 px-2 py-1.5 rounded border text-[10px]"
                style={{
                  background: '#0a150a',
                  borderColor: `${ALERT_COLORS[alert.severity]}25`,
                  borderLeftWidth: 2,
                  borderLeftColor: ALERT_COLORS[alert.severity],
                }}
              >
                <span className="shrink-0 mt-px">{ALERT_ICONS[alert.type]}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-green-300 leading-snug">{alert.message}</div>
                  <div className="text-green-800 mt-0.5 text-[9px]">{alert.time}</div>
                </div>
              </div>
            ))}
          </div>
        )}
        <div className="mt-2 text-[8px] text-green-800">
          Alerts auto-generated from Open-Meteo · SoilGrids · Agmarknet
        </div>
      </div>
    </aside>
  )
}
