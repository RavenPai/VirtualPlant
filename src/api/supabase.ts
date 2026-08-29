import { createClient, type SupabaseClient, type User } from '@supabase/supabase-js'
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

function realUser(user: User | null | undefined) {
  if (!user || user.is_anonymous) return null
  return user
}

export async function getAccessToken() {
  const supabase = getSupabase()
  if (!supabase) return null
  const { data } = await supabase.auth.getSession()
  return data.session?.access_token ?? null
}

export async function getCurrentUser() {
  const supabase = getSupabase()
  if (!supabase) return null
  const { data } = await supabase.auth.getUser()
  return realUser(data.user)
}

/** @deprecated Use getCurrentUser — no longer creates anonymous sessions. */
export async function ensureSession() {
  return getCurrentUser()
}

export async function signInWithPassword(email: string, password: string) {
  const supabase = getSupabase()
  if (!supabase) return { user: null, error: 'Supabase is not configured.' }
  const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
  return { user: realUser(data.user), error: error?.message ?? null }
}

export async function signUpWithPassword(email: string, password: string) {
  const supabase = getSupabase()
  if (!supabase) return { user: null, error: 'Supabase is not configured.', needsConfirm: false }
  const { data, error } = await supabase.auth.signUp({ email: email.trim(), password })
  return {
    user: realUser(data.user),
    error: error?.message ?? null,
    needsConfirm: !data.session && !error,
  }
}

export async function signOut() {
  const supabase = getSupabase()
  if (!supabase) return
  await supabase.auth.signOut()
}
