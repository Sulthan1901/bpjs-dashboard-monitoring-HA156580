'use client'

import { useState } from 'react'
import Sidebar from './Sidebar'
import Topbar from './Topbar'
import { usePathname } from 'next/navigation'

const pageTitles = {
  '/dashboard': { title: 'Dashboard', subtitle: 'Ringkasan monitoring perusahaan binaan' },
  '/perusahaan': { title: 'Perusahaan Binaan', subtitle: 'Kelola data perusahaan binaan' },
}

export default function DashboardShell({ user, profile, children }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const pathname = usePathname()

  const pageInfo = pageTitles[pathname] || { title: 'BPJS Dashboard', subtitle: '' }

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--bg-primary)' }}>
      <Sidebar
        user={user}
        profile={profile}
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      <div
        className={`flex-1 flex flex-col transition-all duration-300
          ${sidebarCollapsed ? 'md:ml-16' : 'md:ml-60'}`}>
        <Topbar
          title={pageInfo.title}
          subtitle={pageInfo.subtitle}
          user={user}
          profile={profile}
        />
        <main className="flex-1 p-6 animate-fade-in">
          {children}
        </main>
      </div>
    </div>
  )
}
