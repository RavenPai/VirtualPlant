import { useState } from 'react'
import PlantCanvas from '../components/PlantCanvas'
import PlantStage from '../components/PlantStage'
import { useGame } from '../game/GameContext'
import { timeOfDay } from '../game/engine'

export default function Auth() {
  const { signIn, signUp } = useGame()
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState(false)

  const isSignup = mode === 'signup'

  async function submit(event) {
    event.preventDefault()
    setError('')
    setNotice('')
    if (!email.trim() || !password) {
      setError('Enter an email and password.')
      return
    }
    if (isSignup && password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }
    if (isSignup && password !== confirm) {
      setError('Passwords do not match.')
      return
    }
    setBusy(true)
    const result = isSignup ? await signUp(email, password) : await signIn(email, password)
    setBusy(false)
    if (result?.error) {
      setError(result.error)
      return
    }
    if (result?.needsConfirm) {
      setNotice('Check your email to confirm the account, then log in.')
      setMode('login')
    }
  }

  return (
    <div className="flex h-full flex-col bg-[radial-gradient(circle_at_top,#3f6b32,#1a2a14_58%)] px-5 py-8 text-white">
      <p className="text-xs uppercase tracking-[0.25em] text-lime-200/80">Virtual Plant</p>
      <h1 className="mt-3 font-display text-4xl leading-tight">
        {isSignup ? 'Create your garden.' : 'Welcome back.'}
      </h1>
      <p className="mt-3 text-sm leading-relaxed text-white/75">
        {isSignup
          ? 'Sign up to save your 90-day season to the cloud and pick it up on any device.'
          : 'Log in to restore your plant, habits, and yard from Supabase.'}
      </p>

      <div className="mx-auto mt-4 h-40 w-full max-w-[220px] overflow-hidden rounded-2xl">
        <PlantStage className="h-full w-full" frame={{ weatherKind: 'clear', timeOfDay: timeOfDay() }}>
          <PlantCanvas
            className="h-full w-full"
            frame={{
              growth01: 0.42,
              neglect01: 0,
              status: 'thriving',
              weatherKind: 'clear',
              timeOfDay: timeOfDay(),
              scenicBackdrop: true,
            }}
          />
        </PlantStage>
      </div>

      <form className="mt-4 flex flex-1 flex-col" onSubmit={submit}>
        <label className="text-xs uppercase tracking-widest text-white/60">Email</label>
        <input
          className="vp-input mt-2"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
        />
        <label className="mt-4 text-xs uppercase tracking-widest text-white/60">Password</label>
        <input
          className="vp-input mt-2"
          type="password"
          autoComplete={isSignup ? 'new-password' : 'current-password'}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="At least 6 characters"
        />
        {isSignup && (
          <>
            <label className="mt-4 text-xs uppercase tracking-widest text-white/60">Confirm password</label>
            <input
              className="vp-input mt-2"
              type="password"
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />
          </>
        )}
        {error && <p className="mt-3 text-sm text-amber-200">{error}</p>}
        {notice && <p className="mt-3 text-sm text-lime-200">{notice}</p>}
        <button type="submit" className="vp-btn mt-auto" disabled={busy}>
          {busy ? 'Please wait…' : isSignup ? 'Create account' : 'Log in'}
        </button>
      </form>

      <button
        type="button"
        className="mt-4 text-center text-sm text-white/70 underline-offset-4 hover:underline"
        onClick={() => {
          setMode(isSignup ? 'login' : 'signup')
          setError('')
          setNotice('')
        }}
      >
        {isSignup ? 'Already have an account? Log in' : 'New here? Create an account'}
      </button>
    </div>
  )
}
