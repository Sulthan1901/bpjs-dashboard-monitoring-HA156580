// app/api/notify/route.js
import { createServerSupabaseClient } from '/lib/supabase-server'
import { sendNotificationEmail } from '/services/emailNotification'

export async function POST(request) {
  try {
    console.log('[NOTIFY] ===== Request masuk =====')

    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      console.log('[NOTIFY] ❌ Unauthorized - user tidak login')
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('[NOTIFY] ✅ User:', user.email)

    const body = await request.json()
    console.log('[NOTIFY] Body:', JSON.stringify(body, null, 2))

    const {
      actionType,
      actorInfo,
      perusahaanId,
      perusahaanNama,
      oldData,
      newData,
      changedFields = [],
      supervisorId,
    } = body

    if (!supervisorId) {
      console.log('[NOTIFY] ⚠️ Skipped: supervisorId kosong')
      return Response.json({ skipped: true, reason: 'No supervisorId' })
    }

    console.log('[NOTIFY] supervisorId:', supervisorId)

    // Get supervisor profile & email
    const { data: supervisor, error: supErr } = await supabase
      .from('users_profile')
      .select('id, name, email')
      .eq('id', supervisorId)
      .single()

    console.log('[NOTIFY] Supervisor data:', supervisor)
    console.log('[NOTIFY] Supervisor error:', supErr)

    if (!supervisor?.email) {
      console.log('[NOTIFY] ⚠️ Skipped: supervisor tidak punya email')
      return Response.json({ skipped: true, reason: 'Supervisor has no email' })
    }

    console.log('[NOTIFY] Kirim email ke:', supervisor.email)
    console.log('[NOTIFY] RESEND_API_KEY exists:', !!process.env.RESEND_API_KEY)
    console.log('[NOTIFY] RESEND_API_KEY prefix:', process.env.RESEND_API_KEY?.substring(0, 10))

    const result = await sendNotificationEmail({
      supervisorEmail: supervisor.email,
      supervisorName: supervisor.name,
      actionType,
      actorName: actorInfo?.userName || 'Unknown',
      perusahaanNama,
      perusahaanId,
      changedFields,
      oldData,
      newData,
    })

    console.log('[NOTIFY] ✅ Email result:', JSON.stringify(result))
    return Response.json({ success: true, result })

  } catch (err) {
    console.error('[NOTIFY] ❌ Error:', err.message)
    console.error('[NOTIFY] Stack:', err.stack)
    return Response.json({ error: err.message }, { status: 200 })
  }
}