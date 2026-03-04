'use client'

import { useState, useRef, useEffect, type ReactNode } from 'react'
import { Search, Sprout } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import type { Farmer, LocationInfo, WeatherData } from '@/types/kisan'
import { SAMPLE_FARMERS } from '@/lib/kisan-data'
import { loadCustomFarmers } from '@/components/kisan/farmer-form'

interface HeaderProps {
  onFarmerSelect: (farmer: Farmer) => void
  locationInfo: LocationInfo | null
  weatherData: WeatherData | null
  loading: boolean
  apiKeySlot: ReactNode
  addFarmerSlot: ReactNode
  customFarmerCount: number
}

// APIs confirmed working for India
const API_SOURCES = [
  { label: 'Open-Meteo', working: true },
  { label: 'NASA POWER', working: true },
  { label: 'Nominatim',  working: true },
]

export function Header({
  onFarmerSelect, locationInfo, weatherData, loading,
  apiKeySlot, addFarmerSlot, customFarmerCount,
}: HeaderProps) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [time, setTime] = useState('')
  const [allFarmers, setAllFarmers] = useState(SAMPLE_FARMERS)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Reload farmer list whenever custom count changes (farmer added/deleted)
  useEffect(() => {
    const custom = loadCustomFarmers()
    setAllFarmers([...SAMPLE_FARMERS, ...custom])
  }, [customFarmerCount])

  useEffect(() => {
    const update = () => {
      setTime(new Date().toLocaleTimeString('en-IN', {
        hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
      }))
    }
    update()
    const id = setInterval(update, 1000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const q = query.toLowerCase()
  const filtered = query.length > 0
    ? allFarmers.filter(f =>
        f.name.toLowerCase().includes(q) ||
        f.district.toLowerCase().includes(q) ||
        f.khasra.toLowerCase().includes(q) ||
        (f.village ?? '').toLowerCase().includes(q) ||
        (f.tehsil ?? '').toLowerCase().includes(q),
      )
    : allFarmers

  return (
    <header
      className="flex items-center justify-between px-4 border-b shrink-0"
      style={{
        height: 52,
        background: '#050d05',
        borderColor: '#1a2e1a',
      }}
    >
      {/* Logo */}
      <div className="flex items-center gap-2.5 min-w-50">
        <div className="flex items-center justify-center w-7 h-7 rounded-md bg-green-600/20 border border-green-600/30">
          <Sprout className="w-4 h-4 text-green-400" />
        </div>
        <div>
          <div className="text-sm font-bold text-green-300 leading-none font-mono tracking-wide">
            KisanMonitor
          </div>
          <div className="text-[9px] text-green-700 leading-none mt-0.5 tracking-widest uppercase">
            Agricultural Intelligence
          </div>
        </div>
      </div>

      {/* Farmer search */}
      <div ref={dropdownRef} className="relative w-72">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-green-600" />
          <Input
            value={query}
            onChange={e => { setQuery(e.target.value); setOpen(true) }}
            onFocus={() => setOpen(true)}
            placeholder="Search farmer, khasra, district..."
            className="pl-8 h-8 text-xs border-[#1a2e1a] bg-[#0a150a] text-green-200 placeholder:text-green-800 focus-visible:ring-green-700 focus-visible:border-green-700"
          />
          {loading && (
            <div className="absolute right-2.5 top-1/2 -translate-y-1/2">
              <div className="w-3 h-3 border border-green-500 border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </div>

        {open && filtered.length > 0 && (
          <div
            className="absolute top-full left-0 right-0 mt-1 rounded-md border shadow-lg z-50 overflow-hidden"
            style={{ background: '#0f1a0f', borderColor: '#1a2e1a' }}
          >
            {filtered.map(farmer => (
              <button
                key={farmer.id}
                onClick={() => { onFarmerSelect(farmer); setQuery(farmer.name); setOpen(false) }}
                className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-green-900/20 transition-colors"
              >
                <div className="w-6 h-6 rounded-full bg-green-700/20 border border-green-700/30 flex items-center justify-center text-[10px] font-bold text-green-400 shrink-0">
                  {farmer.name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-medium text-green-200">{farmer.name}</span>
                    {farmer.isCustom && (
                      <span className="text-[8px] px-1 rounded bg-yellow-900/30 text-yellow-500 border border-yellow-900/40">
                        registered
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-green-600">
                    {farmer.khasra}
                    {farmer.village ? ` · ${farmer.village}` : ''}
                    {` · ${farmer.district}, ${farmer.state}`}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-[10px] text-green-400 font-medium">{farmer.crop}</div>
                  <div className="text-[10px] text-green-700">{farmer.area} ha</div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Right: location + weather + API status + key config */}
      <div className="flex items-center gap-3 min-w-[320px] justify-end">
        {locationInfo && (
          <div className="text-right hidden lg:block">
            <div className="text-xs font-medium text-green-300">
              {locationInfo.village || locationInfo.district || '—'}
            </div>
            <div className="text-[10px] text-green-700">
              {[locationInfo.district, locationInfo.state].filter(Boolean).join(', ')}
            </div>
          </div>
        )}

        {weatherData && (
          <div
            className="flex items-center gap-2 px-2 py-1 rounded border text-[11px] font-mono"
            style={{ borderColor: '#1a2e1a', background: '#0a150a' }}
          >
            <span className="text-yellow-400">{weatherData.current.temperature}°C</span>
            <span className="text-green-700">·</span>
            <span className="text-blue-400">{weatherData.current.humidity}%</span>
          </div>
        )}

        {/* API status dots — only confirmed-working APIs */}
        <div className="flex items-center gap-1" title="Open-Meteo · NASA POWER · Nominatim — all live">
          {API_SOURCES.map(src => (
            <div
              key={src.label}
              className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"
              title={`${src.label}: live`}
            />
          ))}
          <span className="text-[9px] text-green-700 ml-1">live</span>
        </div>

        {/* Add farmer button */}
        {addFarmerSlot}

        {/* API key button */}
        {apiKeySlot}

        <div className="font-mono text-[11px] text-green-600 tabular-nums">
          {time}
        </div>

        <Badge
          variant="outline"
          className="text-[9px] border-green-800 text-green-600 bg-green-900/10 h-5 px-1.5"
        >
          LIVE
        </Badge>
      </div>
    </header>
  )
}
