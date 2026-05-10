// app/api/activity/route.js
import { createServerSupabaseClient } from '/lib/supabase-server'
import { getActivityLogs } from '/services/activityLog'

export async function GET(request) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile } = await supabase
      .from('users_profile')
      .select('role, supervisor_id')
      .eq('id', user.id)
      .single()

    const url = new URL(request.url)
    const page = parseInt(url.searchParams.get('page') || '1')
    const limit = parseInt(url.searchParams.get('limit') || '50')
    const actionType = url.searchParams.get('action_type') || ''

    let supervisorId = null
    let userId = null

    if (profile?.role === 'supervisor') {
      supervisorId = user.id
    } else if (profile?.role === 'admin') {
      userId = user.id
    }

    const result = await getActivityLogs({ supervisorId, userId, page, limit, actionType })
    return Response.json(result)
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 })
  }
}
