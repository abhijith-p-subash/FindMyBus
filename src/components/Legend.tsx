import { CheckCircle2, Clock, Circle, Bus } from 'lucide-react'

export function Legend() {
  return (
    <div className="flex items-center gap-4 flex-wrap">
      <LegendItem icon={<Bus size={12} className="text-violet-400 light:text-violet-600" />} label="Current" />
      <LegendItem icon={<CheckCircle2 size={12} className="text-emerald-600" />} label="On time" />
      <LegendItem icon={<Clock size={12} className="text-amber-600" />} label="Delayed" />
      <LegendItem icon={<Circle size={12} className="text-zinc-700 light:text-zinc-400" />} label="Upcoming" />
    </div>
  )
}

function LegendItem({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      {icon}
      <span className="text-xs text-zinc-600 light:text-zinc-500">{label}</span>
    </div>
  )
}
