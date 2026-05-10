import { createServerSupabaseClient } from '/lib/supabase-server'
import { redirect } from 'next/navigation'
import PerusahaanClient from './PerusahaanClient'

export default async function PerusahaanPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('users_profile')
    .select('*')
    .eq('id', user.id)
    .single()

  return <PerusahaanClient user={user} profile={profile} />
}
