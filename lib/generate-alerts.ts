/**
 * Generates real-time alerts derived entirely from live API data:
 * - Weather warnings → Open-Meteo (7-day forecast)
 * - Price alerts → data.gov.in Agmarknet vs government MSP 2025-26
 * - Soil warnings → SoilGrids ISRIC
 *
 * No hardcoded alert text — every alert is data-driven.
 */
import type { WeatherData, SoilData, MandiPrice, Alert } from '@/types/kisan'
import { MSP_2025 } from './kisan-data'

export function generateAlerts(
  weather: WeatherData | null,
  mandi: MandiPrice[],
  soil: SoilData | null,
  locationInfo: { district?: string; state?: string } | null,
): Alert[] {
  const alerts: Alert[] = []
  const loc = locationInfo?.district || locationInfo?.state || 'selected location'

  // ── Weather alerts (Open-Meteo 7-day forecast) ────────────────────────
  if (weather) {
    const maxRain   = Math.max(...weather.daily.precipitation)
    const totalRain = weather.daily.precipitation.reduce((a, b) => a + b, 0)
    const maxTemp   = Math.max(...weather.daily.maxTemp)
    const minTemp   = Math.min(...weather.daily.minTemp)
    const sm        = weather.hourly.soilMoisture[0] ?? 0.3
    const dryDays   = weather.daily.precipitation.filter(r => r < 0.5).length

    if (maxRain > 60) {
      alerts.push({
        id: 'w-extreme-rain', type: 'rain', severity: 'critical',
        message: `Extreme rainfall: ${maxRain.toFixed(0)} mm/day forecast near ${loc} — severe crop damage & flooding risk`,
        time: `Open-Meteo · next 7 days`,
      })
    } else if (maxRain > 25) {
      alerts.push({
        id: 'w-heavy-rain', type: 'rain', severity: 'high',
        message: `Heavy rain: ${maxRain.toFixed(0)} mm/day forecast near ${loc} — ensure field drainage`,
        time: `Open-Meteo · next 7 days`,
      })
    }

    if (dryDays >= 5 && totalRain < 5) {
      alerts.push({
        id: 'w-dry', type: 'drought', severity: 'high',
        message: `Dry spell: only ${totalRain.toFixed(1)} mm total over 7 days near ${loc} — schedule irrigation`,
        time: `Open-Meteo · 7-day forecast`,
      })
    }

    if (maxTemp > 44) {
      alerts.push({
        id: 'w-heat-extreme', type: 'frost', severity: 'critical',
        message: `Extreme heat: ${maxTemp.toFixed(0)}°C forecast near ${loc} — protect crops, increase irrigation`,
        time: `Open-Meteo · 7-day forecast`,
      })
    } else if (maxTemp > 40) {
      alerts.push({
        id: 'w-heat', type: 'frost', severity: 'high',
        message: `Heat stress risk: ${maxTemp.toFixed(0)}°C max near ${loc} — mulching & irrigation advised`,
        time: `Open-Meteo · 7-day forecast`,
      })
    }

    if (minTemp < 2) {
      alerts.push({
        id: 'w-frost', type: 'frost', severity: 'high',
        message: `Frost risk: ${minTemp.toFixed(1)}°C min forecast near ${loc} — protect sensitive crops tonight`,
        time: `Open-Meteo · 7-day forecast`,
      })
    }

    if (sm < 0.10) {
      alerts.push({
        id: 'w-moisture', type: 'drought', severity: 'critical',
        message: `Critical soil moisture: ${(sm * 100).toFixed(0)}% at ${loc} — immediate irrigation required`,
        time: `Open-Meteo · current`,
      })
    } else if (sm < 0.18) {
      alerts.push({
        id: 'w-moisture-low', type: 'drought', severity: 'high',
        message: `Low soil moisture: ${(sm * 100).toFixed(0)}% at ${loc} — irrigation recommended within 48h`,
        time: `Open-Meteo · current`,
      })
    }
  }

  // ── Mandi price vs MSP alerts (data.gov.in Agmarknet) ────────────────
  const seen = new Set<string>()
  for (const m of mandi) {
    if (seen.has(m.commodity)) continue
    const msp = MSP_2025[m.commodity]
    if (!msp || m.modalPrice <= 0) continue
    const gap = ((msp - m.modalPrice) / msp) * 100
    if (gap > 8) {
      seen.add(m.commodity)
      alerts.push({
        id: `mandi-${m.commodity}`,
        type: 'price',
        severity: gap > 20 ? 'critical' : gap > 12 ? 'high' : 'medium',
        message: `${m.commodity} modal price ₹${m.modalPrice.toLocaleString('en-IN')}/q at ${m.market} — ${gap.toFixed(0)}% below MSP (₹${msp.toLocaleString('en-IN')})`,
        time: `Agmarknet · ${m.date || 'latest'}`,
      })
    }
  }

  // ── Soil alerts (SoilGrids ISRIC) ─────────────────────────────────────
  if (soil) {
    if (soil.ph !== null) {
      if (soil.ph < 4.5) {
        alerts.push({
          id: 's-ph-very-low', type: 'pest', severity: 'critical',
          message: `Very acidic soil: pH ${soil.ph.toFixed(1)} at ${loc} — heavy lime application required before next crop`,
          time: `SoilGrids ISRIC · 0–5cm`,
        })
      } else if (soil.ph < 5.5) {
        alerts.push({
          id: 's-ph-low', type: 'pest', severity: 'high',
          message: `Acidic soil: pH ${soil.ph.toFixed(1)} at ${loc} — affects nutrient availability, lime treatment advised`,
          time: `SoilGrids ISRIC · 0–5cm`,
        })
      } else if (soil.ph > 8.5) {
        alerts.push({
          id: 's-ph-high', type: 'pest', severity: 'medium',
          message: `Alkaline soil: pH ${soil.ph.toFixed(1)} at ${loc} — iron/zinc deficiency likely, gypsum or sulfur recommended`,
          time: `SoilGrids ISRIC · 0–5cm`,
        })
      }
    }

    if (soil.organicCarbon !== null && soil.organicCarbon < 2.5) {
      alerts.push({
        id: 's-oc-low', type: 'pest', severity: 'medium',
        message: `Low organic carbon: ${soil.organicCarbon.toFixed(1)} g/kg at ${loc} — soil health declining, add compost/FYM`,
        time: `SoilGrids ISRIC · 0–5cm`,
      })
    }

    if (soil.nitrogen !== null && soil.nitrogen < 0.5) {
      alerts.push({
        id: 's-n-low', type: 'pest', severity: 'medium',
        message: `Nitrogen-deficient soil: ${soil.nitrogen.toFixed(2)} g/kg at ${loc} — top-dress with urea or DAP`,
        time: `SoilGrids ISRIC · 0–5cm`,
      })
    }
  }

  // Sort: critical → high → medium → low
  const order = { critical: 0, high: 1, medium: 2, low: 3 }
  return alerts
    .sort((a, b) => order[a.severity] - order[b.severity])
    .slice(0, 8)
}
