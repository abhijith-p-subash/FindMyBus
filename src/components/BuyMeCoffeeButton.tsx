import { Coffee } from 'lucide-react'

export function BuyMeCoffeeButton() {
  return (
    <a
      href="https://buymeacoffee.com/abhijithpsubash"
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-2 px-3 py-2 rounded-chip border border-line
                 text-[12px] text-ink-4 hover:text-signal-text hover:border-signal-edge
                 transition-colors cursor-pointer"
    >
      <Coffee size={13} />
      Buy me a coffee
    </a>
  )
}
