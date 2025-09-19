export function LiveDot() {
  return <span className="inline-block h-2.5 w-2.5 rounded-full bg-green-400 shadow-[0_0_0_2px_rgba(0,0,0,.4)]" />
}

export function TimerBadge({ value }:{ value: string }) {
  return (
    <span className="rounded-full bg-black/60 px-2.5 py-1 text-[13px] font-mono tracking-wider shadow-glass">
      {value}
    </span>
  )
}
