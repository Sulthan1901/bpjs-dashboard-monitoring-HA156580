import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '/lib/supabase-server'
import DashboardShell from '/components/layout/DashboardShell'

export default async function PerusahaanLayout({ children }) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('users_profile')
    .select('*')
    .eq('id', user.id)
    .single()

  return (
    <DashboardShell user={user} profile={profile}>
      {children}
    </DashboardShell>
  )
}
