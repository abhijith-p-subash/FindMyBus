export function BuyMeCoffeeButton() {
  return (
    <a
      href="https://buymeacoffee.com/abhijithpsubash"
      target="_blank"
      rel="noopener noreferrer"
      title="Buy me a coffee"
      aria-label="Support FindMyBus on Buy Me a Coffee"
      className="fixed bottom-20 right-4 z-40 block hover:scale-110 active:scale-95 transition-transform duration-200 cursor-pointer drop-shadow-xl"
    >
      <img
        src="https://media.giphy.com/media/TDQOtnWgsBx99cNoyH/giphy.gif"
        alt="Buy me a coffee"
        width={120}
        height={40}
        loading="lazy"
        decoding="async"
        className="h-10 w-auto rounded-xl"
      />
    </a>
  )
}
