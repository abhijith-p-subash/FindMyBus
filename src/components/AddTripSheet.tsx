import { useState, useEffect, useRef } from 'react'
import { CheckCircle2, X, Link2 } from 'lucide-react'
import { parseTrackingKey } from '../utils'
import { AddTripResult } from '../hooks/useTrips'
import { SupportedServices } from './SupportedServices'

interface AddTripSheetProps {
  isOpen: boolean
  onClose: () => void
  onAdd: (url: string, name: string) => AddTripResult
}

export function AddTripSheet({ isOpen, onClose, onAdd }: AddTripSheetProps) {
  const [mounted, setMounted] = useState(false)
  const [visible, setVisible] = useState(false)
  const [url, setUrl] = useState('')
  const [name, setName] = useState('')
  const [parsedKey, setParsedKey] = useState<string | null>(null)
  const [urlError, setUrlError] = useState('')
  const [submitError, setSubmitError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isOpen) {
      setMounted(true)
      requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true)))
      setTimeout(() => inputRef.current?.focus(), 300)
    } else {
      setVisible(false)
      const t = setTimeout(() => {
        setMounted(false)
        setUrl(''); setName(''); setParsedKey(null); setUrlError(''); setSubmitError('')
      }, 300)
      return () => clearTimeout(t)
    }
  }, [isOpen])

  const handleUrlChange = (value: string) => {
    setUrl(value)
    setSubmitError('')
    const key = parseTrackingKey(value)
    setParsedKey(key)
    setUrlError(value.length > 5 && !key ? 'Unrecognised format — try the full URL or just the code' : '')
  }

  const handleSubmit = () => {
    if (!parsedKey) return
    const result = onAdd(url.trim(), name.trim())
    if (!result.success) setSubmitError(result.error ?? 'Failed to add trip')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && parsedKey) handleSubmit()
    if (e.key === 'Escape') onClose()
  }

  if (!mounted) return null

  const content = (
    <div className="px-5 sm:px-6 pt-2 pb-6 sm:pt-5 space-y-4">
      {/* Title */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-zinc-50 light:text-zinc-900">Track a bus</h2>
          <p className="text-xs text-zinc-500 mt-0.5">Paste the URL from your travel agency</p>
        </div>
        <button
          onClick={onClose}
          className="w-8 h-8 flex items-center justify-center rounded-xl text-zinc-500 hover:text-zinc-200 light:hover:text-zinc-800 hover:bg-zinc-800 light:hover:bg-zinc-100 transition-all cursor-pointer shrink-0"
        >
          <X size={16} />
        </button>
      </div>

      {/* URL field */}
      <div className="space-y-2">
        <label className="text-xs font-medium text-zinc-400 light:text-zinc-600">Tracking URL or code</label>
        <div className="relative">
          <Link2 size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-600 light:text-zinc-400 pointer-events-none" />
          <input
            ref={inputRef}
            type="text"
            inputMode="url"
            value={url}
            onChange={e => handleUrlChange(e.target.value)}
            placeholder="Paste URL or enter code…"
            className="w-full bg-zinc-800/60 light:bg-zinc-100 border border-zinc-700 light:border-zinc-300 focus:border-violet-500 focus:bg-zinc-800 light:focus:bg-white
              rounded-xl pl-9 pr-4 py-3 text-sm text-zinc-100 light:text-zinc-900 placeholder:text-zinc-600 light:placeholder:text-zinc-400
              outline-none transition-all"
          />
        </div>
        {parsedKey && (
          <div className="flex items-center gap-1.5 text-xs text-emerald-400 light:text-emerald-600 animate-view-in">
            <CheckCircle2 size={12} />
            <span>Detected: <span className="font-mono font-semibold">{parsedKey}</span></span>
          </div>
        )}
        {urlError && <p className="text-xs text-amber-400 light:text-amber-600">{urlError}</p>}
      </div>

      {/* Name field */}
      <div className="space-y-2">
        <label className="text-xs font-medium text-zinc-400 light:text-zinc-600">
          Trip name <span className="text-zinc-700 light:text-zinc-400 font-normal">(optional)</span>
        </label>
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="e.g. Office trip to Bangalore"
          maxLength={50}
          className="w-full bg-zinc-800/60 light:bg-zinc-100 border border-zinc-700 light:border-zinc-300 focus:border-violet-500 focus:bg-zinc-800 light:focus:bg-white
            rounded-xl px-4 py-3 text-sm text-zinc-100 light:text-zinc-900 placeholder:text-zinc-600 light:placeholder:text-zinc-400
            outline-none transition-all"
        />
      </div>

      {/* Supported services */}
      <SupportedServices compact />

      {submitError && (
        <p className="text-xs text-red-400 text-center bg-red-500/5 border border-red-500/20 rounded-lg py-2">{submitError}</p>
      )}

      <button
        onClick={handleSubmit}
        disabled={!parsedKey}
        className="w-full py-3.5 rounded-xl text-sm font-semibold transition-all cursor-pointer
          bg-violet-600 hover:bg-violet-500 active:bg-violet-700 text-white
          disabled:bg-zinc-800 light:disabled:bg-zinc-200 disabled:text-zinc-600 light:disabled:text-zinc-400 disabled:cursor-not-allowed"
      >
        Start Tracking
      </button>
    </div>
  )

  return (
    <div className="fixed inset-0 z-50" onKeyDown={handleKeyDown}>
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 light:bg-black/30 backdrop-blur-sm transition-opacity duration-300"
        style={{ opacity: visible ? 1 : 0 }}
        onClick={onClose}
      />

      {/* ── Mobile: bottom sheet ─────────────────────────────── */}
      <div
        className="sm:hidden absolute bottom-0 left-0 right-0 bg-zinc-900 light:bg-white border-t border-zinc-800 light:border-zinc-200 rounded-t-3xl pb-safe transition-transform duration-300"
        style={{ transform: visible ? 'translateY(0)' : 'translateY(100%)' }}
      >
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-zinc-700 light:bg-zinc-300 rounded-full" />
        </div>
        {content}
      </div>

      {/* ── Desktop: centered dialog ─────────────────────────── */}
      <div className="hidden sm:flex absolute inset-0 items-center justify-center p-4">
        <div
          className="w-full max-w-md bg-zinc-900 light:bg-white border border-zinc-800 light:border-zinc-200 rounded-2xl shadow-2xl shadow-black/50 light:shadow-zinc-300/50 transition-all duration-300"
          style={{
            opacity: visible ? 1 : 0,
            transform: visible ? 'scale(1) translateY(0)' : 'scale(0.96) translateY(-0.5rem)',
          }}
          onClick={e => e.stopPropagation()}
        >
          {content}
        </div>
      </div>
    </div>
  )
}
