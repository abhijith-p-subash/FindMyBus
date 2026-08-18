import { useState, useEffect, useRef } from 'react'
import { AlertCircle, CheckCircle2 } from 'lucide-react'
import { parseTrackingKey } from '../utils'
import { AddTripResult } from '../hooks/useTrips'
import { ServicesNote } from './SupportedServices'

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
  const [touched, setTouched] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isOpen) {
      // Mount must precede the enter transition by a frame, so these two cannot be
      // collapsed into one render.
      setMounted(true)
      requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true)))
      const t = setTimeout(() => inputRef.current?.focus(), 260)
      return () => clearTimeout(t)
    }
    setVisible(false)
    const t = setTimeout(() => {
      setMounted(false)
      setUrl('')
      setName('')
      setTouched(false)
      setSubmitError('')
    }, 280)
    return () => clearTimeout(t)
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [isOpen, onClose])

  if (!mounted) return null

  const parsed = parseTrackingKey(url)
  const showError = (touched && url.length > 4 && !parsed) || !!submitError
  const errorText = submitError || 'That isn’t a supported tracking link.'
  const ready = parsed !== null

  const submit = () => {
    if (!ready) {
      setTouched(true)
      return
    }
    const result = onAdd(url, name)
    if (!result.success) setSubmitError(result.error ?? 'Could not add that trip.')
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Add a bus"
      className="fixed inset-0 z-50 flex items-end sm:items-center sm:justify-center"
    >
      <div
        onClick={onClose}
        className={`absolute inset-0 bg-canvas/75 backdrop-blur-[3px] transition-opacity duration-280
                    ${visible ? 'opacity-100' : 'opacity-0'}`}
      />

      <div
        className={`relative w-full sm:max-w-md flex flex-col gap-5 px-5 pt-3.5 pb-safe sm:p-6
                    max-h-[92dvh] overflow-y-auto overscroll-contain
                    bg-surface border-t sm:border border-line-strong
                    rounded-t-sheet sm:rounded-hero shadow-[var(--fmb-shadow-pop)]
                    transition-transform duration-280 ease-[cubic-bezier(0.22,1,0.36,1)]
                    ${visible ? 'translate-y-0' : 'translate-y-full sm:translate-y-4'}`}
      >
        <div className="w-11 h-1 rounded-full bg-line-strong mx-auto sm:hidden" />

        <div className="flex flex-col gap-1.5">
          <h2 className="font-display font-semibold text-[26px] leading-tight tracking-[-0.03em] text-ink">
            Add a bus
          </h2>
          <p className="text-sm leading-normal text-ink-3">
            Link, short link, or the code on its own.
          </p>
        </div>

        <div className="flex flex-col gap-2.5">
          <label htmlFor="fmb-url" className="eyebrow">
            Tracking link
          </label>
          <div className="relative">
            <input
              id="fmb-url"
              ref={inputRef}
              value={url}
              onChange={e => {
                setUrl(e.target.value)
                setSubmitError('')
              }}
              onBlur={() => setTouched(true)}
              onKeyDown={e => {
                if (e.key === 'Enter') submit()
              }}
              inputMode="url"
              autoComplete="off"
              autoCapitalize="characters"
              spellCheck={false}
              placeholder="bus.trackingo.in/…?AB1234"
              aria-invalid={showError}
              className={`w-full px-4 py-[15px] pr-10 rounded-field bg-app border font-mono text-base sm:text-sm text-ink
                          placeholder:text-ink-5 focus:outline-none transition-colors
                          ${showError ? 'border-delay' : parsed ? 'border-signal-edge' : 'border-line focus:border-line-strong'}`}
            />
            {showError && (
              <AlertCircle
                size={15}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-delay-text"
              />
            )}
            {!showError && parsed && (
              <CheckCircle2
                size={15}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-signal-text"
              />
            )}
          </div>
          {showError ? (
            <p className="flex items-center gap-1.5 text-[13px] text-delay-text">
              <AlertCircle size={13} className="shrink-0" /> {errorText}
            </p>
          ) : parsed ? (
            <p className="font-mono text-[12px] text-ink-4">
              Detected code <span className="text-signal-text font-medium">{parsed}</span>
            </p>
          ) : null}
        </div>

        <div className="flex flex-col gap-2.5">
          <div className="flex items-center justify-between gap-3">
            <label htmlFor="fmb-name" className="eyebrow">
              Name
            </label>
            <span className="text-[11px] text-ink-5">optional · auto-named from route</span>
          </div>
          <input
            id="fmb-name"
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') submit()
            }}
            placeholder="Morning commute"
            className="w-full px-4 py-[15px] rounded-field bg-app border border-line text-base sm:text-sm text-ink
                       placeholder:text-ink-5 focus:outline-none focus:border-line-strong transition-colors"
          />
        </div>

        <ServicesNote />

        <button
          onClick={submit}
          disabled={!ready}
          className="h-[50px] rounded-field bg-signal text-signal-ink font-semibold text-[15px]
                     transition-all cursor-pointer hover:brightness-105 active:scale-[0.99]
                     disabled:bg-line disabled:text-ink-4 disabled:cursor-not-allowed disabled:active:scale-100"
        >
          Track
        </button>
      </div>
    </div>
  )
}
