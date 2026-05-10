'use client'
// components/ui/RealtimeIndicator.js
import { useState, useEffect } from 'react'

export default function RealtimeIndicator({ active = true, label = 'Live' }) {
  const [pulse, setPulse] = useState(false)

  useEffect(() => {
    if (!active) return
    const t = setInterval(() => {
      setPulse(p => !p)
    }, 2000)
    return () => clearInterval(t)
  }, [active])

  return (
    <div className="flex items-center gap-1.5">
      <div className="relative w-2 h-2">
        <div className="w-2 h-2 rounded-full absolute"
          style={{ background: active ? '#10b981' : '#64748b' }} />
        {active && (
          <div
            className="w-2 h-2 rounded-full absolute animate-ping"
            style={{ background: '#10b981', opacity: 0.4 }}
          />
        )}
      </div>
      <span className="text-[10px] font-medium"
        style={{ color: active ? '#34d399' : 'var(--text-muted)' }}>
        {label}
      </span>
    </div>
  )
}
