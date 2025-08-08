import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// This route does not perform OAuth; it provides the service account email and verifies envs for one-click UX
export async function GET(_req: NextRequest) {
  try {
    const keyJson = process.env.GOOGLE_SERVICE_ACCOUNT_KEY
    const hasKey = Boolean(keyJson)
    let serviceAccountEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL
    
    if (!serviceAccountEmail && keyJson) {
      try {
        const parsed = JSON.parse(keyJson)
        serviceAccountEmail = parsed.client_email
      } catch {
        // ignore JSON parse error; fall back to env var presence check
      }
    }
    if (!serviceAccountEmail || !hasKey) {
      return NextResponse.json({ success: false, error: 'Service account not configured' }, { status: 500 })
    }

    // Ensure user is authenticated to proceed
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

    return NextResponse.json({ success: true, email: serviceAccountEmail })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Failed to initialize quick connect' }, { status: 500 })
  }
}


