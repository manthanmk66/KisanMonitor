'use client'

import { useState } from 'react'
import { Search, TrendingDown, TrendingUp, Minus, Layers, BarChart3, Leaf } from 'lucide-react'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import type { LayerConfig, MandiPrice, WeatherData } from '@/types/kisan'
import { NATIONAL_STATS, INDIAN_STATES, CROP_OPTIONS } from '@/lib/kisan-data'

interface LeftPanelProps {
  layers: LayerConfig[]
  onToggleLayer: (id: string) => void
  weatherData: WeatherData | null   // ERA5-Land soil data lives here now
  weatherLoading: boolean
  mandiData: MandiPrice[]
  mandiLoading: boolean
  onMandiSearch: (state: string, commodity: string) => void
}

function SectionHeading({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
  return (
    <div className="flex items-center gap-1.5 mb-2">
      <Icon className="w-3 h-3 text-green-600" />
      <span className="text-[9px] font-bold tracking-widest text-green-700 uppercase">{label}</span>
    </div>
  )
}

/** Soil moisture bar: value is m³/m³ (0–0.6 typical range) */
function MoistureBar({
  label, value, color = '#22c55e',
}: {
  label: string; value: number | undefined | null; color?: string
}) {
  const pct = value != null ? Math.min((value / 0.55) * 100, 100) : 0
  const satLevel = value == null ? '—'
    : value > 0.4 ? 'Saturated'
    : value > 0.3 ? 'Field cap.'
    : value > 0.15 ? 'Available'
    : value > 0.08 ? 'Low'
    : 'Wilting pt.'

  return (
    <div className="mb-2.5">
      <div className="flex justify-between items-center mb-1">
        <span className="text-[10px] text-green-500">{label}</span>
        <div className="flex items-center gap-1.5">
          <span className="text-[9px] text-green-700">{satLevel}</span>
          <span className="text-[10px] font-mono text-green-300">
            {value != null ? `${(value * 100).toFixed(1)}%` : '—'}
          </span>
        </div>
      </div>
      <div className="h-1.5 rounded-full bg-[#1a2e1a] overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{
            width: `${pct}%`,
            background: value != null && value < 0.1 ? '#ef4444' : color,
          }}
        />
      </div>
    </div>
  )
}

function TempBar({ label, value }: { label: string; value: number | undefined | null }) {
  const pct = value != null ? Math.min(Math.max(((value + 5) / 55) * 100, 0), 100) : 0
  const color = value == null ? '#1a2e1a'
    : value > 40 ? '#ef4444' : value > 30 ? '#f97316'
    : value > 20 ? '#facc15' : value > 10 ? '#22c55e' : '#3b82f6'
  return (
    <div className="mb-2.5">
      <div className="flex justify-between items-center mb-1">
        <span className="text-[10px] text-green-500">{label}</span>
        <span className="text-[10px] font-mono text-green-300">
          {value != null ? `${value.toFixed(1)}°C` : '—'}
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-[#1a2e1a] overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  )
}

export function LeftPanel({
  layers, onToggleLayer, weatherData, weatherLoading, mandiData, mandiLoading, onMandiSearch,
}: LeftPanelProps) {
  const [selectedState, setSelectedState] = useState('Maharashtra')
  const [selectedCrop, setSelectedCrop]   = useState('Wheat')

  const soil = weatherData?.current

  return (
    <aside
      className="kisan-panel-scroll flex flex-col shrink-0 overflow-y-auto overflow-x-hidden border-r"
      style={{ width: 260, background: '#060e06', borderColor: '#1a2e1a' }}
    >
      {/* Mandi Search — data.gov.in */}
      <div className="p-3 border-b" style={{ borderColor: '#1a2e1a' }}>
        <SectionHeading icon={Search} label="Mandi Price Search" />
        <div className="space-y-2">
          <Select value={selectedState} onValueChange={setSelectedState}>
            <SelectTrigger className="h-7 text-xs border-[#1a2e1a] bg-[#0a150a] text-green-200">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="text-xs border-[#1a2e1a]" style={{ background: '#0f1a0f', color: '#d1fae5' }}>
              {INDIAN_STATES.map(s => (
                <SelectItem key={s} value={s} className="text-xs focus:bg-green-900/30 focus:text-green-200">{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedCrop} onValueChange={setSelectedCrop}>
            <SelectTrigger className="h-7 text-xs border-[#1a2e1a] bg-[#0a150a] text-green-200">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="text-xs border-[#1a2e1a]" style={{ background: '#0f1a0f', color: '#d1fae5' }}>
              {CROP_OPTIONS.map(c => (
                <SelectItem key={c} value={c} className="text-xs focus:bg-green-900/30 focus:text-green-200">{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            onClick={() => onMandiSearch(selectedState, selectedCrop)}
            disabled={mandiLoading}
            className="w-full h-7 text-xs bg-green-700 hover:bg-green-600 text-white border-0"
          >
            {mandiLoading ? (
              <span className="flex items-center gap-1.5">
                <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />
                Fetching...
              </span>
            ) : 'Fetch Live Prices'}
          </Button>
        </div>

        {mandiData.length > 0 && (
          <div className="mt-2.5 space-y-1">
            {mandiData.slice(0, 4).map((m, i) => (
              <div key={i} className="flex items-center justify-between px-2 py-1 rounded text-[10px]"
                style={{ background: '#0a150a', border: '1px solid #1a2e1a' }}>
                <span className="text-green-400 truncate max-w-25">{m.market}</span>
                <span className="font-mono text-green-200">₹{m.modalPrice.toLocaleString('en-IN')}</span>
              </div>
            ))}
            {mandiData.length > 4 && (
              <div className="text-[9px] text-green-700 text-center">+{mandiData.length - 4} more · Agmarknet</div>
            )}
          </div>
        )}
      </div>

      {/* Layer Toggles */}
      <div className="p-3 border-b" style={{ borderColor: '#1a2e1a' }}>
        <SectionHeading icon={Layers} label="Map Layers" />
        <div className="space-y-2.5">
          {layers.map(layer => (
            <div key={layer.id} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: layer.color }} />
                <span className="text-[11px] text-green-400">{layer.label}</span>
              </div>
              <Switch
                checked={layer.enabled}
                onCheckedChange={() => onToggleLayer(layer.id)}
                className="h-4 w-7 data-[state=checked]:bg-green-600"
              />
            </div>
          ))}
        </div>
      </div>

      {/* National Overview */}
      <div className="p-3 border-b" style={{ borderColor: '#1a2e1a' }}>
        <SectionHeading icon={BarChart3} label="National Overview" />
        <div className="grid grid-cols-2 gap-1.5">
          {NATIONAL_STATS.map(stat => {
            const isPos = stat.trend.startsWith('+')
            const isNeg = stat.trend.startsWith('-')
            return (
              <div key={stat.label} className="p-2 rounded border" style={{ background: '#0a150a', borderColor: '#1a2e1a' }}>
                <div className="text-[9px] text-green-700 leading-tight mb-1">{stat.label}</div>
                <div className="text-xs font-bold font-mono text-green-300">{stat.value}</div>
                <div className={`flex items-center gap-0.5 text-[9px] mt-0.5 ${isPos ? 'text-green-500' : isNeg ? 'text-red-400' : 'text-yellow-400'}`}>
                  {isPos ? <TrendingUp className="w-2.5 h-2.5" /> : isNeg ? <TrendingDown className="w-2.5 h-2.5" /> : <Minus className="w-2.5 h-2.5" />}
                  {stat.trend}
                </div>
              </div>
            )
          })}
        </div>
        <div className="text-[8px] text-green-800 mt-1.5">Reference data · 2024-25</div>
      </div>

      {/* Soil — ERA5-Land via Open-Meteo (confirmed working for India) */}
      <div className="p-3 flex-1">
        <SectionHeading icon={Leaf} label="Soil Conditions" />

        {weatherLoading && (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i}>
                <Skeleton className="h-2.5 w-full mb-1 bg-green-900/30" />
                <Skeleton className="h-1.5 w-full bg-green-900/20" />
              </div>
            ))}
          </div>
        )}

        {!weatherLoading && !weatherData && (
          <div className="text-[10px] text-green-800 text-center py-4">
            Click map to fetch real-time soil conditions
          </div>
        )}

        {!weatherLoading && weatherData && (
          <div>
            <div className="text-[9px] text-green-700 mb-2">Soil Moisture (ERA5-Land)</div>
            <MoistureBar label="0–1 cm"   value={soil?.soilMoisture0} color="#22c55e" />
            <MoistureBar label="1–3 cm"   value={soil?.soilMoisture1} color="#16a34a" />
            <MoistureBar label="3–9 cm"   value={soil?.soilMoisture3} color="#3b82f6" />
            <MoistureBar label="9–27 cm"  value={soil?.soilMoisture9} color="#2563eb" />

            <div className="text-[9px] text-green-700 mb-2 mt-3">Soil Temperature (ERA5-Land)</div>
            <TempBar label="Surface (0 cm)" value={soil?.soilTemp0} />
            <TempBar label="Shallow (6 cm)" value={soil?.soilTemp6} />

            {/* Quick interpretation */}
            {soil?.soilMoisture0 != null && (
              <div className="mt-2 px-2 py-1.5 rounded text-[10px]"
                style={{ background: '#0a150a', border: '1px solid #1a2e1a' }}>
                <span className="text-green-600">Surface status: </span>
                <span className="text-green-300">
                  {soil.soilMoisture0 > 0.4  ? 'Waterlogged — check drainage'
                    : soil.soilMoisture0 > 0.28 ? 'Optimal — good water availability'
                    : soil.soilMoisture0 > 0.15 ? 'Moderate — monitor closely'
                    : soil.soilMoisture0 > 0.08 ? 'Low — irrigation advised'
                    : 'Wilting point — urgent irrigation'}
                </span>
              </div>
            )}
          </div>
        )}

        <div className="mt-3 flex gap-1 flex-wrap">
          <Badge variant="outline" className="text-[8px] h-4 px-1 border-green-900 text-green-800">
            Open-Meteo
          </Badge>
          <Badge variant="outline" className="text-[8px] h-4 px-1 border-green-900 text-green-800">
            ERA5-Land · 9km
          </Badge>
          <Badge variant="outline" className="text-[8px] h-4 px-1 border-green-900 text-green-800">
            Live
          </Badge>
        </div>
      </div>
    </aside>
  )
}
