import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { env, hasSupabase } from './env'

let client: SupabaseClient | null = null

export function getSupabase(): SupabaseClient | null {
  if (!hasSupabase) return null
  if (!client) {
    client = createClient(env.supabaseUrl!, env.supabasePublishableKey!, {
      auth: { persistSession: true, autoRefreshToken: true },
    })
  }
  return client
}

export async function ensureSession() {
  const supabase = getSupabase()
  if (!supabase) return null
  const { data } = await supabase.auth.getSession()
  if (data.session?.user) return data.session.user
  const { data: signed, error } = await supabase.auth.signInAnonymously()
  if (error) return null
  return signed.user ?? null
}
