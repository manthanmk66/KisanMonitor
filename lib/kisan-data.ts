import type {
  MandiLocation,
  Farmer,
  DroughtZone,
  KVKCenter,
  LayerConfig,
  NationalStat,
  RegionPreset,
} from '@/types/kisan'

export const APMC_MANDIS: MandiLocation[] = [
  { id: 'm1', name: 'Azadpur APMC', state: 'Delhi', lat: 28.7041, lon: 77.1025, commodity: 'Vegetables' },
  { id: 'm2', name: 'Vashi APMC', state: 'Maharashtra', lat: 19.076, lon: 72.9982, commodity: 'Onion' },
  { id: 'm3', name: 'Pune APMC', state: 'Maharashtra', lat: 18.5204, lon: 73.8567, commodity: 'Wheat' },
  { id: 'm4', name: 'Nashik APMC', state: 'Maharashtra', lat: 20.0059, lon: 73.7792, commodity: 'Grapes' },
  { id: 'm5', name: 'Nagpur APMC', state: 'Maharashtra', lat: 21.1458, lon: 79.0882, commodity: 'Orange' },
  { id: 'm6', name: 'Kolhapur APMC', state: 'Maharashtra', lat: 16.705, lon: 74.2433, commodity: 'Sugarcane' },
  { id: 'm7', name: 'Lucknow APMC', state: 'Uttar Pradesh', lat: 26.8467, lon: 80.9462, commodity: 'Wheat' },
  { id: 'm8', name: 'Kanpur APMC', state: 'Uttar Pradesh', lat: 26.4499, lon: 80.3319, commodity: 'Potato' },
  { id: 'm9', name: 'Agra APMC', state: 'Uttar Pradesh', lat: 27.1767, lon: 78.0081, commodity: 'Potato' },
  { id: 'm10', name: 'Amritsar APMC', state: 'Punjab', lat: 31.634, lon: 74.8723, commodity: 'Wheat' },
  { id: 'm11', name: 'Ludhiana APMC', state: 'Punjab', lat: 30.901, lon: 75.8573, commodity: 'Rice' },
  { id: 'm12', name: 'Hubli APMC', state: 'Karnataka', lat: 15.3647, lon: 75.124, commodity: 'Cotton' },
  { id: 'm13', name: 'Bellary APMC', state: 'Karnataka', lat: 15.1394, lon: 76.9214, commodity: 'Maize' },
  { id: 'm14', name: 'Warangal APMC', state: 'Telangana', lat: 17.9784, lon: 79.6008, commodity: 'Cotton' },
  { id: 'm15', name: 'Indore APMC', state: 'Madhya Pradesh', lat: 22.7196, lon: 75.8577, commodity: 'Soybean' },
]

export const SAMPLE_FARMERS: Farmer[] = [
  {
    id: 'f1', name: 'Ramesh Patil', khasra: 'KH-2341',
    district: 'Nashik', state: 'Maharashtra', lat: 20.0059, lon: 73.7792,
    crop: 'Grapes', area: 2.5,
  },
  {
    id: 'f2', name: 'Sukhdev Singh', khasra: 'KH-1187',
    district: 'Amritsar', state: 'Punjab', lat: 31.634, lon: 74.8723,
    crop: 'Wheat', area: 5.0,
  },
  {
    id: 'f3', name: 'Lakshmi Devi', khasra: 'KH-0892',
    district: 'Warangal', state: 'Telangana', lat: 17.9784, lon: 79.6008,
    crop: 'Rice', area: 1.8,
  },
  {
    id: 'f4', name: 'Mohan Verma', khasra: 'KH-3560',
    district: 'Agra', state: 'Uttar Pradesh', lat: 27.1767, lon: 78.0081,
    crop: 'Potato', area: 3.2,
  },
  {
    id: 'f5', name: 'Priya Jadhav', khasra: 'KH-4471',
    district: 'Kolhapur', state: 'Maharashtra', lat: 16.705, lon: 74.2433,
    crop: 'Sugarcane', area: 4.0,
  },
]

export const DROUGHT_ZONES: DroughtZone[] = [
  {
    id: 'd1', name: 'Marathwada', lat: 18.5, lon: 76.5, severity: 'severe',
    description: 'Severe water deficit — 42% below normal rainfall',
  },
  {
    id: 'd2', name: 'Bundelkhand', lat: 25.2, lon: 79.5, severity: 'moderate',
    description: 'Moderate drought — groundwater depletion critical',
  },
  {
    id: 'd3', name: 'Vidarbha', lat: 20.7, lon: 77.7, severity: 'mild',
    description: 'Mild water stress — Cotton crop at risk',
  },
  {
    id: 'd4', name: 'Rayalaseema', lat: 15.0, lon: 78.5, severity: 'severe',
    description: 'Acute drought — 58% deficit, crop failure risk',
  },
]

export const KVK_CENTERS: KVKCenter[] = [
  { id: 'k1', name: 'KVK Nashik', district: 'Nashik', state: 'Maharashtra', lat: 20.0059, lon: 73.7792 },
  { id: 'k2', name: 'KVK Ludhiana', district: 'Ludhiana', state: 'Punjab', lat: 30.901, lon: 75.8573 },
  { id: 'k3', name: 'KVK Warangal', district: 'Warangal', state: 'Telangana', lat: 17.9784, lon: 79.6008 },
  { id: 'k4', name: 'KVK Bhopal', district: 'Bhopal', state: 'Madhya Pradesh', lat: 23.2599, lon: 77.4126 },
  { id: 'k5', name: 'KVK Pune', district: 'Pune', state: 'Maharashtra', lat: 18.5204, lon: 73.8567 },
  { id: 'k6', name: 'KVK Patna', district: 'Patna', state: 'Bihar', lat: 25.5941, lon: 85.1376 },
  { id: 'k7', name: 'KVK Jaipur', district: 'Jaipur', state: 'Rajasthan', lat: 26.9124, lon: 75.7873 },
  { id: 'k8', name: 'KVK Nagpur', district: 'Nagpur', state: 'Maharashtra', lat: 21.1458, lon: 79.0882 },
  { id: 'k9', name: 'KVK Hyderabad', district: 'Hyderabad', state: 'Telangana', lat: 17.385, lon: 78.4867 },
  { id: 'k10', name: 'KVK Bengaluru', district: 'Bengaluru', state: 'Karnataka', lat: 12.9716, lon: 77.5946 },
]

export const MSP_2025: Record<string, number> = {
  Wheat: 2275,
  Rice: 2300,
  Cotton: 7121,
  Soybean: 4892,
  Maize: 2225,
  Sugarcane: 340,
  Onion: 800,
  Grapes: 3500,
  Potato: 600,
}

export const REGION_PRESETS: Record<string, RegionPreset> = {
  'All India': { lat: 20.5937, lon: 78.9629, zoom: 5 },
  Maharashtra: { lat: 19.7515, lon: 75.7139, zoom: 7 },
  'Uttar Pradesh': { lat: 26.8467, lon: 80.9462, zoom: 7 },
  Karnataka: { lat: 15.3173, lon: 75.7139, zoom: 7 },
  Punjab: { lat: 31.1471, lon: 75.3412, zoom: 7 },
  'Madhya Pradesh': { lat: 22.9734, lon: 78.6569, zoom: 7 },
}


export const NATIONAL_STATS: NationalStat[] = [
  { label: 'Registered Farmers', value: '9.3 Cr', trend: '+2.1%' },
  { label: 'Active Mandis', value: '7,539', trend: '+127' },
  { label: 'Kharif Area Sown', value: '108.4M ha', trend: '-1.2%' },
  { label: 'Crop Insurance', value: '5.6 Cr', trend: '+8.4%' },
]

export const DEFAULT_LAYERS: LayerConfig[] = [
  { id: 'mandis', label: 'Mandi Markets', color: '#facc15', enabled: true },
  { id: 'drought', label: 'Drought Zones', color: '#ef4444', enabled: true },
  { id: 'soil', label: 'Soil Points', color: '#f97316', enabled: true },
  { id: 'kvk', label: 'KVK Centers', color: '#3b82f6', enabled: true },
]

export const INDIAN_STATES = [
  'Andhra Pradesh', 'Bihar', 'Chhattisgarh', 'Gujarat', 'Haryana',
  'Karnataka', 'Madhya Pradesh', 'Maharashtra', 'Odisha', 'Punjab',
  'Rajasthan', 'Tamil Nadu', 'Telangana', 'Uttar Pradesh', 'West Bengal',
]

export const CROP_OPTIONS = [
  'Wheat', 'Rice', 'Cotton', 'Soybean', 'Maize',
  'Onion', 'Potato', 'Sugarcane', 'Tomato', 'Grapes',
]

export const DATA_GOV_API_KEY = '579b464db66ec23bdd000001cdd3946e44ce4aab825d0fb4dca9e5e4'
