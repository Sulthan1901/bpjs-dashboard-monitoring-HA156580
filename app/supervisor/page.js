import { createServerSupabaseClient } from '/lib/supabase-server'
import { redirect } from 'next/navigation'
import SupervisorClient from './SupervisorClient'

export default async function SupervisorPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('users_profile').select('*').eq('id', user.id).single()

  if (profile?.role !== 'supervisor') redirect('/dashboard')

  return <SupervisorClient user={user} profile={profile} />
}
