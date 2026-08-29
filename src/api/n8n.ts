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

export async function emailTodayMissions(payload: {
  email?: string
  plantName?: string
  deck?: unknown[]
}) {
  if (!hasN8n) return false
  try {
    const res = await fetch(`${env.n8nApiUrl}/webhook/send-mission-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    return res.ok
  } catch {
    return false
  }
}
