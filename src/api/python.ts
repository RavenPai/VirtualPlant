import { env, hasPython } from './env'

async function post<T>(path: string, body: unknown): Promise<T | null> {
  if (!hasPython) return null
  try {
    const res = await fetch(`${env.pythonApiUrl}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (!res.ok) return null
    return (await res.json()) as T
  } catch {
    return null
  }
}

export function tickRemote(state: unknown, nowMs = Date.now()) {
  return post('/v1/tick', { state, nowMs })
}

export function predictTasks(payload: unknown) {
  return post('/v1/predict-tasks', payload)
}

export function classifySeason(snapshots: unknown[]) {
  return post('/v1/season-consistency', { snapshots })
}
