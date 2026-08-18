import { useState } from 'react'
import { ArrowRight, AlertCircle } from 'lucide-react'
import { parseTrackingKey } from '../utils'
import { AddTripResult } from '../hooks/useTrips'
import { SupportedServices } from './SupportedServices'

interface FirstRunProps {
  onAdd: (url: string, name: string) => AddTripResult
  onStartDemo: () => void
}

/**
 * First run has no modal — the paste field is the page. A user arriving with a
 * link in the clipboard should be tracking in two taps.
 */
export function FirstRun({ onAdd, onStartDemo }: FirstRunProps) {
  const [value, setValue] = useState('')
  const [error, setError] = useState('')

  const parsed = parseTrackingKey(value)
  const ready = parsed !== null

  const submit = () => {
    if (!ready) {
      setError('That isn’t a supported tracking link.')
      return
    }
    const result = onAdd(value, '')
    if (!result.success) setError(result.error ?? 'Could not add that trip.')
  }

  return (
    <div className="animate-view-in flex flex-col gap-9 pt-10 sm:pt-16">
      <div className="flex flex-col gap-[18px]">
        <h1 className="font-display font-semibold text-[34px] sm:text-[40px] leading-[1.04] tracking-[-0.035em] text-ink">
          Track any bus.
          <br />
          No sign-up.
        </h1>
        <p className="text-[15px] leading-relaxed text-ink-3 max-w-[29ch] text-pretty">
          Paste the tracking link your operator sent you. Everything stays on this device.
        </p>
      </div>

      <div className="p-4 rounded-card bg-surface border border-line flex flex-col gap-3">
        <input
          value={value}
          onChange={e => {
            setValue(e.target.value)
            setError('')
          }}
          onKeyDown={e => {
            if (e.key === 'Enter') submit()
          }}
          inputMode="url"
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          placeholder="Tracking link or Bus code"
          aria-label="Tracking link or bus code"
          aria-invalid={!!error}
          className={`w-full px-4 py-3.5 rounded-field bg-app border font-mono text-base sm:text-sm text-ink
                      placeholder:text-ink-5 focus:outline-none transition-colors
                      ${error ? 'border-delay' : 'border-line focus:border-signal-edge'}`}
        />

        {error ? (
          <p className="flex items-center gap-2 text-[13px] text-delay-text">
            <AlertCircle size={14} className="shrink-0" />
            {error}
          </p>
        ) : parsed ? (
          <p className="font-mono text-[12px] text-ink-4">
            Detected code <span className="text-signal-text font-medium">{parsed}</span>
          </p>
        ) : null}

        <button
          onClick={submit}
          disabled={!ready}
          className="h-12 rounded-field bg-signal text-signal-ink font-semibold text-[15px]
                     flex items-center justify-center gap-2 transition-all cursor-pointer
                     hover:brightness-105 active:scale-[0.99]
                     disabled:bg-line disabled:text-ink-4 disabled:cursor-not-allowed disabled:active:scale-100"
        >
          Start tracking <ArrowRight size={16} strokeWidth={2.5} />
        </button>

        <button
          onClick={onStartDemo}
          className="text-[12px] text-ink-4 hover:text-signal-text transition-colors cursor-pointer"
        >
          No link yet? Watch a sample trip →
        </button>
      </div>

      <SupportedServices />
    </div>
  )
}
