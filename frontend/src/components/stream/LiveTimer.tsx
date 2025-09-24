export function LiveDot() {
  return <span className="inline-block h-2.5 w-2.5 rounded-full" style={{backgroundColor:"rgb(var(--accent))", boxShadow:"0 0 0 2px rgba(0,0,0,.4)"}} />
}

export function TimerBadge({ value }:{ value: string }) {
  return (
    <span className="rounded-full bg-black/60 px-2.5 py-1 text-[13px] font-mono tracking-wider text-white shadow-glow">
      {value}
    </span>
  )
}
