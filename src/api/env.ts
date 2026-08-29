export const env = {
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL as string | undefined,
  supabasePublishableKey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined,
  pythonApiUrl: (import.meta.env.VITE_PYTHON_API_URL as string | undefined)?.replace(/\/$/, ''),
  n8nApiUrl: (import.meta.env.VITE_N8N_API_URL as string | undefined)?.replace(/\/$/, ''),
}

export const hasSupabase = Boolean(env.supabaseUrl && env.supabasePublishableKey)
export const hasPython = Boolean(env.pythonApiUrl)
export const hasN8n = Boolean(env.n8nApiUrl)
