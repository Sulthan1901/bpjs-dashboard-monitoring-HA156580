import { useState, useEffect } from 'react'
import { createClient } from '/lib/supabase'

export function useProfile() {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }
      setUser(user)
      const { data: prof } = await supabase
        .from('users_profile')
        .select('*')
        .eq('id', user.id)
        .single()
      setProfile(prof)
      setLoading(false)
    }
    load()
  }, [])

  const isAdmin = profile?.role === 'admin'
  const isSupervisor = profile?.role === 'supervisor'

  // actorInfo bundle for activity logging
  const actorInfo = user && profile ? {
    userId: user.id,
    userName: profile.name || user.email,
    supervisorId: isSupervisor ? user.id : (profile.supervisor_id || null),
  } : null

  return { user, profile, isAdmin, isSupervisor, loading, actorInfo }
}
