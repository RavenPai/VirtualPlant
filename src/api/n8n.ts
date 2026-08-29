import { env, hasN8n } from './env'

export async function notifyHabitComplete(payload: unknown) {
  if (!hasN8n) return
  try {
    await fetch(`${env.n8nApiUrl}/webhook/habit-complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
  } catch {
    /* n8n is optional while local play continues */
  }
}
