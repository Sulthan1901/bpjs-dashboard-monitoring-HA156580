'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
import toast from 'react-hot-toast'
import { createClient } from '/lib/supabase'
import {
  LayoutDashboard, Building2, Shield, LogOut,
  ChevronLeft, ChevronRight, Menu, X,
  Activity, Users, Crown
} from 'lucide-react'

export default function Sidebar({ user, profile, collapsed, onToggle }) {
  const pathname = usePathname()
  const router = useRouter()
  const [loggingOut, setLoggingOut] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  const isAdmin = profile?.role === 'admin'
  const isSupervisor = profile?.role === 'supervisor'

  const navItems = [
    { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { href: '/perusahaan', icon: Building2, label: 'Perusahaan Binaan' },
    ...(isSupervisor ? [
      { href: '/supervisor', icon: Crown, label: 'Supervisor Panel' },
      { href: '/activity', icon: Activity, label: 'Activity Log' },
    ] : []),
    ...(isAdmin ? [
      { href: '/activity', icon: Activity, label: 'Aktivitas Saya' },
    ] : []),
  ]

  const roleConfig = {
    supervisor: { label: 'Supervisor', bg: 'linear-gradient(135deg,#f59e0b,#ef4444)', badgeBg: 'rgba(245,158,11,0.15)', badgeColor: '#fbbf24', badgeBorder: 'rgba(245,158,11,0.3)' },
    admin: { label: 'Admin', bg: 'linear-gradient(135deg,#0ea5e9,#8b5cf6)', badgeBg: 'var(--brand-dim)', badgeColor: '#38bdf8', badgeBorder: 'rgba(56,189,248,0.2)' },
    user: { label: 'ARK', bg: 'linear-gradient(135deg,#8b5cf6,#6d28d9)', badgeBg: 'var(--accent-dim)', badgeColor: '#a78bfa', badgeBorder: 'rgba(167,139,250,0.2)' },
  }
  const rc = roleConfig[profile?.role] || roleConfig.user

  const handleLogout = async () => {
    setLoggingOut(true)
    const supabase = createClient()
    await supabase.auth.signOut()
    toast.success('Berhasil keluar')
    router.push('/auth/login')
    router.refresh()
  }

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-5 border-b" style={{ borderColor: 'var(--border)' }}>
        <div className="flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg,#0ea5e9,#8b5cf6)', boxShadow: '0 4px 12px rgba(14,165,233,0.3)' }}>
          <Shield size={18} color="white" strokeWidth={2} />
        </div>
        {!collapsed && (
          <div className="animate-slide-in overflow-hidden">
            <p className="text-sm font-bold text-white leading-tight">BPJS TK</p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Monitoring Binaan</p>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(({ href, icon: Icon, label }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link key={href} href={href} onClick={() => setMobileOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group"
              style={{
                background: active ? 'var(--brand-dim)' : 'transparent',
                color: active ? '#38bdf8' : 'var(--text-secondary)',
                borderLeft: active ? '2px solid #0ea5e9' : '2px solid transparent',
              }}>
              <Icon size={18} style={{ color: active ? '#38bdf8' : 'var(--text-muted)' }}
                className="flex-shrink-0 group-hover:text-white transition-colors" />
              {!collapsed && (
                <span className="text-sm font-medium truncate animate-slide-in">{label}</span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* User profile */}
      <div className="px-3 py-4 border-t" style={{ borderColor: 'var(--border)' }}>
        <div className={`flex items-center gap-3 px-3 py-3 rounded-lg ${!collapsed ? 'mb-3' : 'mb-2'}`}
          style={{ background: 'rgba(14,165,233,0.06)' }}>
          <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
            style={{ background: rc.bg, color: 'white' }}>
            {profile?.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}
          </div>
          {!collapsed && (
            <div className="animate-slide-in overflow-hidden flex-1 min-w-0">
              <p className="text-xs font-semibold text-white truncate">{profile?.name || 'User'}</p>
              <span className="badge text-[10px] px-2 py-0.5 mt-0.5"
                style={{ background: rc.badgeBg, color: rc.badgeColor, border: `1px solid ${rc.badgeBorder}` }}>
                {rc.label}
              </span>
            </div>
          )}
        </div>

        <button onClick={handleLogout} disabled={loggingOut}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg transition-all text-sm hover:bg-red-500/10 group"
          style={{ color: 'var(--text-muted)' }}>
          <LogOut size={16} className="flex-shrink-0 group-hover:text-red-400 transition-colors" />
          {!collapsed && (
            <span className="animate-slide-in group-hover:text-red-400 transition-colors">
              {loggingOut ? 'Keluar...' : 'Keluar'}
            </span>
          )}
        </button>
      </div>
    </div>
  )

  return (
    <>
      {mobileOpen && (
        <div className="fixed inset-0 z-40 modal-backdrop md:hidden" onClick={() => setMobileOpen(false)} />
      )}
      <button className="fixed top-4 left-4 z-50 md:hidden p-2 rounded-lg"
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
        onClick={() => setMobileOpen(!mobileOpen)}>
        {mobileOpen ? <X size={20} /> : <Menu size={20} />}
      </button>
      <div className={`fixed inset-y-0 left-0 z-50 w-64 md:hidden transition-transform duration-300 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}
        style={{ background: 'var(--bg-card)', borderRight: '1px solid var(--border)' }}>
        <SidebarContent />
      </div>
      <div className={`hidden md:flex flex-col fixed inset-y-0 left-0 z-30 transition-all duration-300 ${collapsed ? 'w-16' : 'w-60'}`}
        style={{ background: 'var(--bg-card)', borderRight: '1px solid var(--border)' }}>
        <SidebarContent />
        <button onClick={onToggle}
          className="absolute -right-3 top-16 w-6 h-6 rounded-full flex items-center justify-center transition-all"
          style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
          {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
        </button>
      </div>
    </>
  )
}
