'use client'

import { useState, useEffect } from 'react'
import { Settings, ExternalLink, X, KeyRound, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const STORAGE_KEY = 'kisan_data_gov_api_key'

interface ApiKeyModalProps {
  onKeyChange: (key: string) => void
}

export function ApiKeyButton({ onKeyChange }: ApiKeyModalProps) {
  const [open, setOpen] = useState(false)
  const [key, setKey] = useState('')
  const [saved, setSaved] = useState(false)
  const [currentKey, setCurrentKey] = useState('')

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) ?? ''
    setCurrentKey(stored)
    if (stored) onKeyChange(stored)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleSave = () => {
    const trimmed = key.trim()
    if (!trimmed) return
    localStorage.setItem(STORAGE_KEY, trimmed)
    setCurrentKey(trimmed)
    onKeyChange(trimmed)
    setSaved(true)
    setTimeout(() => { setSaved(false); setOpen(false) }, 1200)
  }

  const isConfigured = currentKey.length > 10

  return (
    <>
      <button
        onClick={() => { setKey(currentKey); setOpen(true) }}
        title="Configure data.gov.in API key"
        className="flex items-center gap-1 px-2 py-1 rounded border text-[10px] transition-colors"
        style={{
          background: isConfigured ? 'transparent' : '#1a0a0a',
          borderColor: isConfigured ? '#1a2e1a' : '#7f1d1d',
          color: isConfigured ? '#4b7a5a' : '#f87171',
        }}
      >
        {isConfigured
          ? <><KeyRound className="w-3 h-3" /><span className="hidden sm:inline">API Key ✓</span></>
          : <><Settings className="w-3 h-3" /><span>Set API Key</span></>
        }
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.7)' }}
          onClick={e => { if (e.target === e.currentTarget) setOpen(false) }}
        >
          <div
            className="w-96 rounded-xl border p-5 shadow-2xl"
            style={{ background: '#0f1a0f', borderColor: '#1a2e1a' }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-green-500" />
                <span className="text-sm font-semibold text-green-200">data.gov.in API Key</span>
              </div>
              <button onClick={() => setOpen(false)}>
                <X className="w-4 h-4 text-green-700 hover:text-green-400" />
              </button>
            </div>

            <p className="text-[11px] text-green-600 mb-3 leading-relaxed">
              Required for live mandi prices from Agmarknet. Free registration — takes 2 minutes.
            </p>

            <a
              href="https://data.gov.in/user/register"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-[11px] text-blue-400 hover:text-blue-300 mb-4"
            >
              <ExternalLink className="w-3 h-3" />
              Register free at data.gov.in → copy key from your profile
            </a>

            <div className="flex gap-2">
              <Input
                value={key}
                onChange={e => setKey(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleSave() }}
                placeholder="Paste your API key here..."
                className="flex-1 h-8 text-xs border-[#1a2e1a] bg-[#0a150a] text-green-200 placeholder:text-green-900 font-mono"
              />
              <Button
                onClick={handleSave}
                disabled={!key.trim() || saved}
                className="h-8 px-3 text-xs bg-green-700 hover:bg-green-600 text-white shrink-0"
              >
                {saved ? <CheckCircle2 className="w-3.5 h-3.5 text-green-300" /> : 'Save'}
              </Button>
            </div>

            {isConfigured && (
              <div className="mt-3 flex items-center gap-1.5 text-[10px] text-green-700">
                <CheckCircle2 className="w-3 h-3 text-green-600" />
                Current key: {currentKey.slice(0, 8)}…{currentKey.slice(-4)}
              </div>
            )}

            <div
              className="mt-4 p-2.5 rounded border text-[10px] text-green-700 leading-relaxed"
              style={{ borderColor: '#1a2e1a', background: '#0a150a' }}
            >
              The key is stored only in your browser (localStorage). It is never sent to any server other than data.gov.in.
            </div>
          </div>
        </div>
      )}
    </>
  )
}
