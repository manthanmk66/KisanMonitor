'use client'

import { useState, useEffect } from 'react'
import { UserPlus, X, MapPin, CheckCircle2, Loader2, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import type { Farmer } from '@/types/kisan'
import { INDIAN_STATES, CROP_OPTIONS } from '@/lib/kisan-data'

const STORAGE_KEY = 'kisan_custom_farmers'

// ─── localStorage helpers ───────────────────────────────────────────────────

export function loadCustomFarmers(): Farmer[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as Farmer[]) : []
  } catch {
    return []
  }
}

function saveCustomFarmers(farmers: Farmer[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(farmers))
}

// ─── Field row helper ────────────────────────────────────────────────────────

function Field({
  label, children,
}: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[9px] text-green-700 mb-0.5 uppercase tracking-wider">{label}</div>
      {children}
    </div>
  )
}

const inputCls =
  'h-7 text-xs border-[#1a2e1a] bg-[#0a150a] text-green-200 placeholder:text-green-900 font-mono focus-visible:ring-green-700 focus-visible:border-green-700'

const selectCls = 'h-7 text-xs border-[#1a2e1a] bg-[#0a150a] text-green-200'
const selectContentStyle = { background: '#0f1a0f', color: '#d1fae5' }
const selectItemCls = 'text-xs focus:bg-green-900/30 focus:text-green-200'

// ─── Component ───────────────────────────────────────────────────────────────

interface FarmerFormProps {
  onFarmerSaved: (farmer: Farmer) => void
}

export function FarmerFormButton({ onFarmerSaved }: FarmerFormProps) {
  const [open, setOpen] = useState(false)
  const [saved, setSaved] = useState(false)
  const [gpsLoading, setGpsLoading] = useState(false)
  const [gpsError, setGpsError] = useState<string | null>(null)
  const [customFarmers, setCustomFarmers] = useState<Farmer[]>([])

  const empty: Omit<Farmer, 'id' | 'isCustom'> = {
    name: '', fatherName: '', khasra: '', khataNo: '', surveyNo: '',
    village: '', tehsil: '', district: '', state: 'Maharashtra',
    lat: 0, lon: 0,
    crop: 'Wheat', area: 1,
    landType: 'Rainfed', ownership: 'Owned', season: 'Kharif',
    phone: '',
  }

  const [form, setForm] = useState(empty)

  useEffect(() => {
    if (open) setCustomFarmers(loadCustomFarmers())
  }, [open])

  const set = (k: keyof typeof form, v: unknown) =>
    setForm(prev => ({ ...prev, [k]: v }))

  // ── GPS auto-detect ────────────────────────────────────────────────────────
  const detectGPS = () => {
    if (!navigator.geolocation) {
      setGpsError('Geolocation not supported')
      return
    }
    setGpsLoading(true)
    setGpsError(null)
    navigator.geolocation.getCurrentPosition(
      pos => {
        set('lat', parseFloat(pos.coords.latitude.toFixed(6)))
        set('lon', parseFloat(pos.coords.longitude.toFixed(6)))
        setGpsLoading(false)
      },
      err => {
        setGpsError(err.message || 'GPS unavailable')
        setGpsLoading(false)
      },
      { timeout: 10000, maximumAge: 60000 },
    )
  }

  // ── Save ───────────────────────────────────────────────────────────────────
  const handleSave = () => {
    if (!form.name.trim() || !form.khasra.trim() || !form.district.trim()) return
    if (form.lat === 0 && form.lon === 0) return

    const farmer: Farmer = {
      ...form,
      id: `custom_${Date.now()}`,
      isCustom: true,
      area: Number(form.area) || 1,
    }

    const updated = [...loadCustomFarmers(), farmer]
    saveCustomFarmers(updated)
    setCustomFarmers(updated)
    onFarmerSaved(farmer)
    setSaved(true)
    setTimeout(() => {
      setSaved(false)
      setForm(empty)
      setOpen(false)
    }, 1200)
  }

  // ── Delete custom farmer ───────────────────────────────────────────────────
  const handleDelete = (id: string) => {
    const updated = customFarmers.filter(f => f.id !== id)
    saveCustomFarmers(updated)
    setCustomFarmers(updated)
  }

  const canSave =
    form.name.trim() &&
    form.khasra.trim() &&
    form.district.trim() &&
    (form.lat !== 0 || form.lon !== 0)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        title="Register new farmer"
        className="flex items-center gap-1 px-2 py-1 rounded border text-[10px] transition-colors"
        style={{ background: 'transparent', borderColor: '#1a2e1a', color: '#4b7a5a' }}
      >
        <UserPlus className="w-3 h-3" />
        <span className="hidden sm:inline">Add Farmer</span>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.75)' }}
          onClick={e => { if (e.target === e.currentTarget) setOpen(false) }}
        >
          <div
            className="w-[520px] max-h-[90vh] overflow-y-auto rounded-xl border shadow-2xl"
            style={{ background: '#0f1a0f', borderColor: '#1a2e1a' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: '#1a2e1a' }}>
              <div className="flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-green-500" />
                <span className="text-sm font-semibold text-green-200">Register Farmer / Land Record</span>
              </div>
              <button onClick={() => setOpen(false)}>
                <X className="w-4 h-4 text-green-700 hover:text-green-400" />
              </button>
            </div>

            <div className="p-4 space-y-4">

              {/* ── Personal ─────────────────────────────────────────────── */}
              <div>
                <div className="text-[9px] font-bold tracking-widest text-green-700 uppercase mb-2.5">
                  Personal Details
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Field label="Farmer Name *">
                    <Input
                      value={form.name}
                      onChange={e => set('name', e.target.value)}
                      placeholder="Ramesh Patil"
                      className={inputCls}
                    />
                  </Field>
                  <Field label="Father / Husband Name">
                    <Input
                      value={form.fatherName}
                      onChange={e => set('fatherName', e.target.value)}
                      placeholder="Narayan Patil"
                      className={inputCls}
                    />
                  </Field>
                  <Field label="Phone">
                    <Input
                      value={form.phone}
                      onChange={e => set('phone', e.target.value)}
                      placeholder="9876543210"
                      className={inputCls}
                    />
                  </Field>
                </div>
              </div>

              {/* ── Land Record ──────────────────────────────────────────── */}
              <div>
                <div className="text-[9px] font-bold tracking-widest text-green-700 uppercase mb-2.5">
                  Land Records (Bhulekh)
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <Field label="Khasra / Gat No. *">
                    <Input
                      value={form.khasra}
                      onChange={e => set('khasra', e.target.value)}
                      placeholder="KH-2341"
                      className={inputCls}
                    />
                  </Field>
                  <Field label="Khata / Khewat No.">
                    <Input
                      value={form.khataNo}
                      onChange={e => set('khataNo', e.target.value)}
                      placeholder="234"
                      className={inputCls}
                    />
                  </Field>
                  <Field label="Survey / Hissa No.">
                    <Input
                      value={form.surveyNo}
                      onChange={e => set('surveyNo', e.target.value)}
                      placeholder="12/3"
                      className={inputCls}
                    />
                  </Field>
                  <Field label="Village">
                    <Input
                      value={form.village}
                      onChange={e => set('village', e.target.value)}
                      placeholder="Pimpalgaon"
                      className={inputCls}
                    />
                  </Field>
                  <Field label="Tehsil / Taluka">
                    <Input
                      value={form.tehsil}
                      onChange={e => set('tehsil', e.target.value)}
                      placeholder="Dindori"
                      className={inputCls}
                    />
                  </Field>
                  <Field label="District *">
                    <Input
                      value={form.district}
                      onChange={e => set('district', e.target.value)}
                      placeholder="Nashik"
                      className={inputCls}
                    />
                  </Field>
                  <Field label="State *">
                    <Select value={form.state} onValueChange={v => set('state', v)}>
                      <SelectTrigger className={selectCls}><SelectValue /></SelectTrigger>
                      <SelectContent style={selectContentStyle}>
                        {INDIAN_STATES.map(s => (
                          <SelectItem key={s} value={s} className={selectItemCls}>{s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field label="Land Type">
                    <Select value={form.landType ?? 'Rainfed'} onValueChange={v => set('landType', v)}>
                      <SelectTrigger className={selectCls}><SelectValue /></SelectTrigger>
                      <SelectContent style={selectContentStyle}>
                        {['Irrigated', 'Rainfed', 'Partially Irrigated'].map(t => (
                          <SelectItem key={t} value={t} className={selectItemCls}>{t}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field label="Ownership">
                    <Select value={form.ownership ?? 'Owned'} onValueChange={v => set('ownership', v)}>
                      <SelectTrigger className={selectCls}><SelectValue /></SelectTrigger>
                      <SelectContent style={selectContentStyle}>
                        {['Owned', 'Leased', 'Shared'].map(t => (
                          <SelectItem key={t} value={t} className={selectItemCls}>{t}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                </div>
              </div>

              {/* ── Crop ─────────────────────────────────────────────────── */}
              <div>
                <div className="text-[9px] font-bold tracking-widest text-green-700 uppercase mb-2.5">
                  Crop Details
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <Field label="Crop">
                    <Select value={form.crop} onValueChange={v => set('crop', v)}>
                      <SelectTrigger className={selectCls}><SelectValue /></SelectTrigger>
                      <SelectContent style={selectContentStyle}>
                        {CROP_OPTIONS.map(c => (
                          <SelectItem key={c} value={c} className={selectItemCls}>{c}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field label="Area (hectares) *">
                    <Input
                      type="number"
                      min={0.1}
                      step={0.1}
                      value={form.area}
                      onChange={e => set('area', e.target.value)}
                      className={inputCls}
                    />
                  </Field>
                  <Field label="Season">
                    <Select value={form.season ?? 'Kharif'} onValueChange={v => set('season', v)}>
                      <SelectTrigger className={selectCls}><SelectValue /></SelectTrigger>
                      <SelectContent style={selectContentStyle}>
                        {['Kharif', 'Rabi', 'Zaid', 'Annual'].map(s => (
                          <SelectItem key={s} value={s} className={selectItemCls}>{s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                </div>
              </div>

              {/* ── GPS / Coordinates ─────────────────────────────────────── */}
              <div>
                <div className="text-[9px] font-bold tracking-widest text-green-700 uppercase mb-2.5">
                  Field Location *
                </div>
                <div className="flex gap-2 items-end">
                  <Field label="Latitude">
                    <Input
                      type="number"
                      step="0.000001"
                      value={form.lat || ''}
                      onChange={e => set('lat', parseFloat(e.target.value) || 0)}
                      placeholder="20.0059"
                      className={inputCls}
                    />
                  </Field>
                  <Field label="Longitude">
                    <Input
                      type="number"
                      step="0.000001"
                      value={form.lon || ''}
                      onChange={e => set('lon', parseFloat(e.target.value) || 0)}
                      placeholder="73.7792"
                      className={inputCls}
                    />
                  </Field>
                  <div>
                    <Button
                      onClick={detectGPS}
                      disabled={gpsLoading}
                      variant="outline"
                      className="h-7 px-2 text-[10px] border-[#1a2e1a] bg-[#0a150a] text-green-400 hover:bg-green-900/20"
                    >
                      {gpsLoading
                        ? <Loader2 className="w-3 h-3 animate-spin" />
                        : <><MapPin className="w-3 h-3 mr-1" />GPS</>}
                    </Button>
                  </div>
                </div>
                {gpsError && (
                  <div className="text-[10px] text-red-400 mt-1">{gpsError}</div>
                )}
                <div className="text-[9px] text-green-800 mt-1">
                  Or click any location on the map first — your coordinates will auto-populate after clicking.
                </div>
              </div>

              {/* ── Actions ───────────────────────────────────────────────── */}
              <div className="flex gap-2 pt-1">
                <Button
                  onClick={handleSave}
                  disabled={!canSave || saved}
                  className="flex-1 h-8 text-xs bg-green-700 hover:bg-green-600 text-white"
                >
                  {saved
                    ? <><CheckCircle2 className="w-3.5 h-3.5 mr-1" />Saved!</>
                    : 'Register Farmer'}
                </Button>
                <Button
                  onClick={() => setOpen(false)}
                  variant="outline"
                  className="h-8 px-4 text-xs border-[#1a2e1a] text-green-600 hover:bg-green-900/20"
                >
                  Cancel
                </Button>
              </div>

              {/* ── Saved custom farmers list ──────────────────────────────── */}
              {customFarmers.length > 0 && (
                <div className="pt-2 border-t" style={{ borderColor: '#1a2e1a' }}>
                  <div className="text-[9px] font-bold tracking-widest text-green-700 uppercase mb-2">
                    Registered Farmers ({customFarmers.length})
                  </div>
                  <div className="space-y-1 max-h-40 overflow-y-auto">
                    {customFarmers.map(f => (
                      <div
                        key={f.id}
                        className="flex items-center justify-between px-2 py-1.5 rounded border text-[10px]"
                        style={{ background: '#0a150a', borderColor: '#1a2e1a' }}
                      >
                        <div>
                          <span className="text-green-200 font-medium">{f.name}</span>
                          <span className="text-green-700 ml-2">{f.khasra} · {f.district}, {f.state}</span>
                        </div>
                        <button
                          onClick={() => handleDelete(f.id)}
                          className="text-green-800 hover:text-red-400 ml-2"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      )}
    </>
  )
}
