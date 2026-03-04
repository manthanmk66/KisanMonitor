export interface MandiLocation {
  id: string
  name: string
  state: string
  lat: number
  lon: number
  commodity: string
}

export interface Farmer {
  id: string
  name: string
  fatherName?: string
  khasra: string
  khataNo?: string       // Khata / Khewat number
  surveyNo?: string      // Revenue survey number
  village?: string
  tehsil?: string
  district: string
  state: string
  lat: number
  lon: number
  crop: string
  area: number           // hectares
  landType?: 'Irrigated' | 'Rainfed' | 'Partially Irrigated'
  ownership?: 'Owned' | 'Leased' | 'Shared'
  season?: 'Kharif' | 'Rabi' | 'Zaid' | 'Annual'
  phone?: string
  isCustom?: boolean     // true = added by user, false = sample data
}

export interface DroughtZone {
  id: string
  name: string
  lat: number
  lon: number
  severity: 'mild' | 'moderate' | 'severe'
  description: string
}

export interface KVKCenter {
  id: string
  name: string
  district: string
  state: string
  lat: number
  lon: number
}

export interface WeatherData {
  current: {
    temperature: number
    humidity: number
    precipitation: number
    windSpeed: number
    // ERA5-Land soil (from Open-Meteo, first hourly value)
    soilMoisture0?: number   // 0-1 cm  (m³/m³)
    soilMoisture1?: number   // 1-3 cm
    soilMoisture3?: number   // 3-9 cm
    soilMoisture9?: number   // 9-27 cm
    soilTemp0?: number       // 0 cm   (°C)
    soilTemp6?: number       // 6 cm
  }
  daily: {
    dates: string[]
    maxTemp: number[]
    minTemp: number[]
    precipitation: number[]
    et0: number[]
  }
  hourly: {
    soilMoisture: number[]
  }
}

export interface SoilData {
  ph: number | null
  organicCarbon: number | null
  nitrogen: number | null
  clay: number | null
  sand: number | null
  silt: number | null
}

export interface MandiPrice {
  market: string
  district: string
  state: string
  commodity: string
  variety: string
  minPrice: number
  maxPrice: number
  modalPrice: number
  date: string
}

export interface LocationInfo {
  village?: string
  district?: string
  state?: string
  country?: string
}

export interface NASAPowerData {
  dates: string[]
  precipitation: number[]
  temperature: number[]
  humidity: number[]
}

export interface StressData {
  score: number
  level: 'low' | 'moderate' | 'high' | 'critical'
  components: {
    rainfall: number
    moisture: number
    priceGap: number
  }
}

export interface LayerConfig {
  id: string
  label: string
  color: string
  enabled: boolean
}

export interface Alert {
  id: string
  type: 'rain' | 'price' | 'drought' | 'pest' | 'frost'
  severity: 'low' | 'medium' | 'high' | 'critical'
  message: string
  time: string
}

export interface NationalStat {
  label: string
  value: string
  trend: string
}

export interface RegionPreset {
  lat: number
  lon: number
  zoom: number
}
