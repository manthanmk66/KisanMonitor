'use client'

import { useEffect, useRef, useCallback } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { APMC_MANDIS, DROUGHT_ZONES, KVK_CENTERS, REGION_PRESETS } from '@/lib/kisan-data'
import type { LayerConfig, WeatherData, SoilData, LocationInfo, Farmer } from '@/types/kisan'

// Fix Leaflet default marker icons
// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

interface MapPanelProps {
  onLocationClick: (lat: number, lon: number) => void
  layers: LayerConfig[]
  weatherData: WeatherData | null
  soilData: SoilData | null
  selectedLat: number
  selectedLon: number
  locationInfo: LocationInfo | null
  selectedFarmer: Farmer | null
}

export default function MapPanel({
  onLocationClick,
  layers,
  weatherData,
  soilData,
  selectedLat,
  selectedLon,
  locationInfo,
  selectedFarmer,
}: MapPanelProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const layerGroupsRef = useRef<Record<string, L.LayerGroup>>({})
  const clickMarkerRef = useRef<L.CircleMarker | null>(null)
  const onClickRef = useRef(onLocationClick)

  useEffect(() => { onClickRef.current = onLocationClick }, [onLocationClick])

  // Popup HTML builder
  const buildPopupHtml = (
    loc: LocationInfo | null,
    lat: number,
    lon: number,
    weather: WeatherData | null,
    soil: SoilData | null,
    farmer: Farmer | null,
  ) => {
    const locationLine = loc?.village || loc?.district || 'Selected Location'
    const subLine = [loc?.district, loc?.state].filter(Boolean).join(', ')

    let html = `
      <div style="background:#0f1a0f;border:1px solid #22c55e;border-radius:8px;padding:10px 12px;min-width:180px;font-family:system-ui,sans-serif;font-size:12px">
        <div style="color:#22c55e;font-weight:700;margin-bottom:2px">${locationLine}</div>
        <div style="color:#6ee7b7;font-size:10px;margin-bottom:6px">${subLine}</div>
        <div style="color:#4b7a5a;font-size:10px;margin-bottom:8px">${lat.toFixed(4)}°N · ${lon.toFixed(4)}°E</div>`

    if (farmer) {
      html += `
        <div style="background:#162316;border-radius:4px;padding:6px;margin-bottom:6px">
          <div style="color:#facc15;font-size:10px;font-weight:600">${farmer.name} · ${farmer.khasra}</div>
          <div style="color:#d1fae5;font-size:10px">${farmer.crop} · ${farmer.area} ha</div>
        </div>`
    }

    if (weather) {
      html += `
        <div style="border-top:1px solid #1a2e1a;padding-top:6px;display:flex;gap:12px">
          <span style="color:#d1fae5;font-size:10px">🌡 ${weather.current.temperature}°C</span>
          <span style="color:#d1fae5;font-size:10px">💧 ${weather.current.humidity}%</span>
          <span style="color:#d1fae5;font-size:10px">🌧 ${weather.current.precipitation}mm</span>
        </div>`
    }

    if (soil) {
      html += `
        <div style="border-top:1px solid #1a2e1a;padding-top:6px;margin-top:4px">
          <span style="color:#f97316;font-size:10px">Soil pH ${soil.ph?.toFixed(1) ?? 'N/A'} · OC ${soil.organicCarbon?.toFixed(1) ?? 'N/A'} g/kg</span>
        </div>`
    }

    html += '</div>'
    return html
  }

  // Initialize map once
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    const map = L.map(containerRef.current, {
      center: [20.5937, 78.9629],
      zoom: 5,
      zoomControl: false,
      attributionControl: false,
    })

    // Dark-styled OSM tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      className: 'kisan-tile',
    }).addTo(map)

    L.control.zoom({ position: 'bottomright' }).addTo(map)
    L.control.attribution({ position: 'bottomright', prefix: false })
      .addAttribution('© OpenStreetMap')
      .addTo(map)

    // Layer groups
    const groups: Record<string, L.LayerGroup> = {
      mandis: L.layerGroup().addTo(map),
      drought: L.layerGroup().addTo(map),
      soil: L.layerGroup().addTo(map),
      kvk: L.layerGroup().addTo(map),
    }
    layerGroupsRef.current = groups

    // Mandi markers (yellow)
    APMC_MANDIS.forEach(mandi => {
      const m = L.circleMarker([mandi.lat, mandi.lon], {
        radius: 7, fillColor: '#facc15', color: '#b45309',
        weight: 1.5, fillOpacity: 0.9, opacity: 1,
      })
      m.bindPopup(`
        <div style="background:#0f1a0f;border:1px solid #facc15;border-radius:6px;padding:8px;font-size:12px;min-width:140px">
          <div style="color:#facc15;font-weight:700">${mandi.name}</div>
          <div style="color:#6ee7b7;font-size:10px">${mandi.state}</div>
          <div style="color:#d1fae5;font-size:10px;margin-top:4px">Main: <strong>${mandi.commodity}</strong></div>
        </div>`, { className: 'kisan-popup' })
      groups.mandis.addLayer(m)
    })

    // Drought zones (red dashed circles)
    const droughtColors = { mild: '#f97316', moderate: '#ef4444', severe: '#dc2626' }
    DROUGHT_ZONES.forEach(zone => {
      const color = droughtColors[zone.severity]
      const c = L.circle([zone.lat, zone.lon], {
        radius: 80000, color, fillColor: color,
        fillOpacity: 0.12, weight: 2, dashArray: '6 4',
      })
      c.bindPopup(`
        <div style="background:#0f1a0f;border:1px solid ${color};border-radius:6px;padding:8px;font-size:12px;min-width:160px">
          <div style="color:${color};font-weight:700">⚠ ${zone.name}</div>
          <div style="color:#6ee7b7;font-size:10px;text-transform:uppercase;margin:2px 0">${zone.severity} Drought</div>
          <div style="color:#d1fae5;font-size:10px">${zone.description}</div>
        </div>`, { className: 'kisan-popup' })
      groups.drought.addLayer(c)
    })

    // KVK centers (blue)
    KVK_CENTERS.forEach(kvk => {
      const m = L.circleMarker([kvk.lat, kvk.lon], {
        radius: 5, fillColor: '#3b82f6', color: '#1d4ed8',
        weight: 1.5, fillOpacity: 0.9,
      })
      m.bindPopup(`
        <div style="background:#0f1a0f;border:1px solid #3b82f6;border-radius:6px;padding:8px;font-size:12px">
          <div style="color:#3b82f6;font-weight:700">${kvk.name}</div>
          <div style="color:#6ee7b7;font-size:10px">${kvk.district}, ${kvk.state}</div>
          <div style="color:#4b7a5a;font-size:10px;margin-top:2px">Krishi Vigyan Kendra</div>
        </div>`, { className: 'kisan-popup' })
      groups.kvk.addLayer(m)
    })

    // Click handler
    map.on('click', (e: L.LeafletMouseEvent) => {
      onClickRef.current(e.latlng.lat, e.latlng.lng)
    })

    mapRef.current = map
    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [])

  // Sync layer visibility
  useEffect(() => {
    const map = mapRef.current
    const groups = layerGroupsRef.current
    if (!map) return
    layers.forEach(layer => {
      const group = groups[layer.id]
      if (!group) return
      if (layer.enabled && !map.hasLayer(group)) map.addLayer(group)
      else if (!layer.enabled && map.hasLayer(group)) map.removeLayer(group)
    })
  }, [layers])

  // Update click marker + popup when data changes
  useEffect(() => {
    const map = mapRef.current
    if (!map || (selectedLat === 20.5937 && selectedLon === 78.9629)) return

    if (clickMarkerRef.current) {
      map.removeLayer(clickMarkerRef.current)
    }

    const marker = L.circleMarker([selectedLat, selectedLon], {
      radius: 9, fillColor: '#22c55e', color: '#16a34a',
      weight: 2, fillOpacity: 0.3, className: 'location-pulse',
    })

    const popup = buildPopupHtml(locationInfo, selectedLat, selectedLon, weatherData, soilData, selectedFarmer)
    marker.bindPopup(popup, { className: 'kisan-popup', maxWidth: 240, minWidth: 180 })
    marker.addTo(map)
    marker.openPopup()
    clickMarkerRef.current = marker

    // Update soil layer circle
    const groups = layerGroupsRef.current
    groups.soil.clearLayers()
    const soilCircle = L.circle([selectedLat, selectedLon], {
      radius: 25000, color: '#f97316', fillColor: '#f97316',
      fillOpacity: 0.08, weight: 1.5, dashArray: '4 4',
    })
    soilCircle.bindPopup(soilData
      ? `<div style="background:#0f1a0f;border:1px solid #f97316;border-radius:6px;padding:8px;font-size:12px;min-width:150px">
          <div style="color:#f97316;font-weight:700">Soil Analysis</div>
          <div style="color:#d1fae5;font-size:10px;margin-top:4px">pH: ${soilData.ph?.toFixed(1) ?? 'N/A'}</div>
          <div style="color:#d1fae5;font-size:10px">Clay: ${soilData.clay?.toFixed(0) ?? 'N/A'}%</div>
          <div style="color:#d1fae5;font-size:10px">Sand: ${soilData.sand?.toFixed(0) ?? 'N/A'}%</div>
          <div style="color:#d1fae5;font-size:10px">OC: ${soilData.organicCarbon?.toFixed(1) ?? 'N/A'} g/kg</div>
        </div>`
      : '<div style="color:#6ee7b7;padding:8px">Loading soil data...</div>',
      { className: 'kisan-popup' },
    )
    groups.soil.addLayer(soilCircle)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedLat, selectedLon, weatherData, soilData, locationInfo, selectedFarmer])

  const flyToRegion = useCallback((name: string) => {
    const map = mapRef.current
    const preset = REGION_PRESETS[name]
    if (map && preset) map.flyTo([preset.lat, preset.lon], preset.zoom, { duration: 1.5 })
  }, [])

  return (
    <div className="relative flex-1 overflow-hidden">
      <style>{`
        .kisan-tile { filter: brightness(0.4) saturate(0.3) hue-rotate(70deg) contrast(1.15); }
        .leaflet-container { background: #0a0f0a !important; }
        .kisan-popup .leaflet-popup-content-wrapper,
        .kisan-popup .leaflet-popup-tip-container { display: none !important; }
        .kisan-popup .leaflet-popup-content { margin: 0 !important; }
        .leaflet-control-zoom a {
          background: #0f1a0f !important; color: #22c55e !important;
          border-color: #1a2e1a !important; font-size: 14px !important;
        }
        .leaflet-control-zoom a:hover { background: #162316 !important; }
        .leaflet-attribution-flag { display: none !important; }
        .leaflet-control-attribution {
          background: rgba(5,13,5,0.7) !important; color: #4b7a5a !important; font-size: 9px !important;
        }
        .leaflet-control-attribution a { color: #6ee7b7 !important; }
      `}</style>

      {/* Region preset buttons */}
      <div className="absolute top-3 left-3 z-[1000] flex flex-wrap gap-1.5">
        {Object.keys(REGION_PRESETS).map(name => (
          <button
            key={name}
            onClick={() => flyToRegion(name)}
            className="px-2.5 py-1 text-[10px] font-medium rounded-md border transition-all backdrop-blur-sm"
            style={{
              background: 'rgba(10,20,10,0.85)',
              borderColor: '#1a2e1a',
              color: '#6ee7b7',
            }}
            onMouseOver={e => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = '#22c55e'
              ;(e.currentTarget as HTMLButtonElement).style.color = '#d1fae5'
            }}
            onMouseOut={e => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = '#1a2e1a'
              ;(e.currentTarget as HTMLButtonElement).style.color = '#6ee7b7'
            }}
          >
            {name}
          </button>
        ))}
      </div>

      {/* Hint */}
      <div
        className="absolute bottom-8 left-3 z-[1000] text-[10px] px-2 py-1 rounded border"
        style={{ background: 'rgba(5,13,5,0.8)', borderColor: '#1a2e1a', color: '#4b7a5a' }}
      >
        Click anywhere → live soil & weather
      </div>

      <div ref={containerRef} className="w-full h-full" />
    </div>
  )
}
