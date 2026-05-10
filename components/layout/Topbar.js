'use client'

import { Bell, Search } from 'lucide-react'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'

export default function Topbar({ title, subtitle, user, profile }) {
  const now = new Date()
  const dateStr = format(now, "EEEE, d MMMM yyyy", { locale: id })

  return (
    <header className="sticky top-0 z-20 px-6 py-4 flex items-center justify-between"
      style={{
        background: 'rgba(7,13,26,0.85)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--border)'
      }}>
      <div>
        <h1 className="text-lg font-bold text-white">{title}</h1>
        {subtitle && (
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
            {subtitle || dateStr}
          </p>
        )}
      </div>

      <div className="flex items-center gap-3">
        <span className="hidden sm:block text-xs" style={{ color: 'var(--text-muted)' }}>
          {dateStr}
        </span>
        <div className="h-4 w-px hidden sm:block" style={{ background: 'var(--border)' }} />
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
            style={{
              background: profile?.role === 'admin'
                ? 'linear-gradient(135deg, #f59e0b, #ef4444)'
                : 'linear-gradient(135deg, #0ea5e9, #8b5cf6)',
              color: 'white'
            }}>
            {profile?.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}
          </div>
          <div className="hidden sm:block">
            <p className="text-xs font-semibold text-white">{profile?.name || 'User'}</p>
            <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
              {user?.email}
            </p>
          </div>
        </div>
      </div>
    </header>
  )
}
