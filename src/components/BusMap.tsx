import { useEffect, useRef, useState } from 'react'
import { MapPin, Navigation, ExternalLink } from 'lucide-react'

interface BusMapProps {
  lat: number
  lng: number
  speed: number
  location: string
}

let L: typeof import('leaflet') | null = null

export function BusMap({ lat, lng, speed, location }: BusMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<import('leaflet').Map | null>(null)
  const markerRef = useRef<import('leaflet').Marker | null>(null)
  const userMarkerRef = useRef<import('leaflet').Marker | null>(null)
  const [userPos, setUserPos] = useState<{ lat: number; lng: number } | null>(null)
  const [locating, setLocating] = useState(false)

  useEffect(() => {
    if (mapInstanceRef.current || !mapRef.current) return

    import('leaflet').then(leaflet => {
      import('leaflet/dist/leaflet.css')
      L = leaflet

      const map = L.map(mapRef.current!, {
        center: [lat, lng],
        zoom: 15,
        zoomControl: false,
        attributionControl: false,
      })

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
      }).addTo(map)

      L.control.attribution({ prefix: '© OSM' }).addTo(map)

      const busIcon = L.divIcon({
        html: `
          <div style="
            width:44px;height:44px;
            display:flex;align-items:center;justify-content:center;
            filter:drop-shadow(0 0 6px rgba(124,58,237,0.9)) drop-shadow(0 2px 4px rgba(0,0,0,0.5)) drop-shadow(0 0 1px rgba(255,255,255,0.9));
          ">
            <img src="/bus.svg" style="width:44px;height:44px;object-fit:contain;display:block;" />
          </div>`,
        className: '',
        iconSize: [44, 44],
        iconAnchor: [22, 22],
      })

      const marker = L.marker([lat, lng], { icon: busIcon }).addTo(map)
      marker.bindTooltip(`${speed} km/h`, { permanent: false, direction: 'top', offset: [0, -24] })

      mapInstanceRef.current = map
      markerRef.current = marker
    })

    return () => {
      mapInstanceRef.current?.remove()
      mapInstanceRef.current = null
      markerRef.current = null
      userMarkerRef.current = null
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!mapInstanceRef.current || !markerRef.current) return
    const newPos: [number, number] = [lat, lng]
    markerRef.current.setLatLng(newPos)
    markerRef.current.setTooltipContent(`${speed} km/h`)
    mapInstanceRef.current.panTo(newPos, { animate: true, duration: 0.8 })
  }, [lat, lng, speed])

  const locateMe = () => {
    if (!navigator.geolocation) return
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      pos => {
        const { latitude, longitude } = pos.coords
        setUserPos({ lat: latitude, lng: longitude })
        setLocating(false)

        if (!mapInstanceRef.current || !L) return

        const userIcon = L.divIcon({
          html: `
            <div style="
              width:32px;height:32px;
              background:linear-gradient(135deg,#3B82F6,#2563EB);
              border:2.5px solid #fff;border-radius:50%;
              box-shadow:0 2px 10px rgba(59,130,246,0.5);
              display:flex;align-items:center;justify-content:center;
            ">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="4" fill="white"/>
                <path d="M12 2v3M12 19v3M2 12h3M19 12h3" stroke="white" stroke-width="2" stroke-linecap="round"/>
              </svg>
            </div>`,
          className: '',
          iconSize: [32, 32],
          iconAnchor: [16, 16],
        })

        if (userMarkerRef.current) {
          userMarkerRef.current.setLatLng([latitude, longitude])
        } else {
          userMarkerRef.current = L.marker([latitude, longitude], { icon: userIcon })
            .addTo(mapInstanceRef.current!)
          userMarkerRef.current.bindTooltip('Your location', { direction: 'top', offset: [0, -20] })
        }
      },
      () => setLocating(false),
      { timeout: 8000 }
    )
  }

  const openInMaps = () => {
    const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent)
    const url = isIOS
      ? `maps://maps.apple.com/?q=${lat},${lng}`
      : `https://www.google.com/maps?q=${lat},${lng}`
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  return (
    <div className="rounded-2xl overflow-hidden border border-zinc-800 light:border-zinc-200 relative bg-zinc-900 light:bg-zinc-100">
      {/* Map container */}
      <div ref={mapRef} className="w-full" style={{ height: 220 }} />

      {/* Overlay: location info */}
      <div className="absolute top-3 left-3 z-[1000] flex flex-col gap-1.5 max-w-[55%]">
        <div className="flex items-center gap-1.5 bg-zinc-950/80 light:bg-white/85 backdrop-blur-md border border-zinc-800/80 light:border-zinc-200/80 rounded-xl px-2.5 py-1.5">
          <Navigation size={11} className="text-violet-400 light:text-violet-600 shrink-0" />
          <span className="text-xs text-zinc-200 light:text-zinc-700 truncate">{location}</span>
        </div>
      </div>

      {/* Speed badge */}
      <div className="absolute bottom-3 right-3 z-[1000] bg-zinc-950/80 light:bg-white/85 backdrop-blur-md border border-zinc-800/80 light:border-zinc-200/80 rounded-xl px-2.5 py-1.5 flex items-center gap-1.5">
        <span className="text-sm font-bold text-zinc-50 light:text-zinc-900">{speed}</span>
        <span className="text-xs text-zinc-500">&nbsp;km/h</span>
      </div>

      {/* Locate me button */}
      <button
        onClick={locateMe}
        disabled={locating}
        title="Show my location"
        className="absolute bottom-3 left-14 z-[1000] w-9 h-9 flex items-center justify-center bg-zinc-950/80 light:bg-white/85 backdrop-blur-md border border-zinc-800/80 light:border-zinc-200/80 rounded-xl text-zinc-400 light:text-zinc-500 hover:text-blue-400 hover:border-blue-500/40 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
      >
        {locating
          ? <div className="w-3.5 h-3.5 border-2 border-zinc-600 border-t-blue-400 rounded-full animate-spin" />
          : <MapPin size={14} className={userPos ? 'text-blue-400' : ''} />
        }
      </button>

      {/* Open in Maps button */}
      <button
        onClick={openInMaps}
        title="Open in Maps"
        className="absolute bottom-3 left-3 z-[1000] w-9 h-9 flex items-center justify-center bg-zinc-950/80 light:bg-white/85 backdrop-blur-md border border-zinc-800/80 light:border-zinc-200/80 rounded-xl text-zinc-400 light:text-zinc-500 hover:text-violet-400 hover:border-violet-500/40 active:scale-95 transition-all cursor-pointer"
      >
        <ExternalLink size={14} />
      </button>
    </div>
  )
}
