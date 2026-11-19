import { useState, type FormEvent } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useIsMutating } from '@tanstack/react-query'
import {
  loginCredentialsSchema,
  registrationCredentialsSchema,
} from '@rendered/shared/contracts/auth'
import { ArrowRight, Eye, EyeOff, LogOut } from 'lucide-react'
import { changeSession, useSession } from './session'
import './account.css'

type Mode = 'login' | 'register' | 'account'

export default function AccountPage({ mode }: { mode: Mode }) {
  const session = useSession()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [visible, setVisible] = useState(false)
  const writes = useIsMutating({ mutationKey: ['learner'] })
  const email = session.data?.user?.email
  const registering = mode === 'register'
  if (mode === 'account' && !email) return <Navigate to="/login" replace />
  if (mode !== 'account' && email) return <Navigate to="/account" replace />

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (busy || writes) return
    const form = event.currentTarget
    const fields = new FormData(form)
    const schema = registering ? registrationCredentialsSchema : loginCredentialsSchema
    const credentials =
      mode === 'account'
        ? undefined
        : schema.safeParse({ email: fields.get('email'), password: fields.get('password') })
    if (credentials && !credentials.success) {
      const issue = credentials.error.issues[0]
      setError(issue.message)
      const field = form.elements.namedItem(String(issue.path[0]))
      if (field instanceof HTMLInputElement) field.focus()
      return
    }
    setBusy(true)
    setError('')
    try {
      await changeSession(mode === 'account' ? 'logout' : mode, credentials?.data)
    } catch (cause) {
      setError(
        cause instanceof TypeError
          ? 'Check your connection and try again.'
          : cause instanceof Error
            ? cause.message
            : 'Please try again.',
      )
      setBusy(false)
    }
  }
  const action = mode === 'account' ? 'Sign out' : registering ? 'Create account' : 'Sign in'
  const pendingText =
    mode === 'account' ? 'Signing out…' : registering ? 'Creating account…' : 'Signing in…'
  return (
    <section className="account-page">
      <div className="account-card">
        <h1 className="display-heading">
          {mode === 'account' ? 'Your account' : registering ? 'Create an account' : 'Sign in'}
        </h1>
        <p className="account-intro">
          {mode === 'account'
            ? 'Your lessons and bookmarks are saved to this account.'
            : registering
              ? 'Keep the lessons and bookmarks you’ve already saved in this browser, and pick up on another device.'
              : 'Sign in to open the lessons and bookmarks saved to your account.'}
        </p>
        <form onSubmit={submit} aria-busy={busy}>
          {mode === 'account' ? (
            <div className="account-email">
              <span>Email address</span>
              <strong>{email}</strong>
            </div>
          ) : (
            <>
              <label className="account-field">
                Email address
                <input
                  type="email"
                  name="email"
                  autoComplete="username"
                  required
                  spellCheck={false}
                  autoCapitalize="none"
                />
              </label>
              <div className="account-field">
                <label htmlFor="account-password">Password</label>
                <div className="account-password">
                  <input
                    id="account-password"
                    type={visible ? 'text' : 'password'}
                    name="password"
                    autoComplete={registering ? 'new-password' : 'current-password'}
                    required
                    aria-describedby={registering ? 'password-hint' : undefined}
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    aria-label={visible ? 'Hide password' : 'Show password'}
                    aria-pressed={visible}
                    onClick={() => setVisible(!visible)}
                  >
                    {visible ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
                {registering && <small id="password-hint">Use 15 to 128 characters.</small>}
              </div>
            </>
          )}
          {error && (
            <p role="alert" className="account-error">
              {error}
            </p>
          )}
          {writes > 0 && (
            <p role="status" className="account-saving">
              Saving your lesson changes…
            </p>
          )}
          <button className="btn primary account-submit" disabled={busy || writes > 0}>
            {busy ? pendingText : action}
            {mode === 'account' ? <LogOut size={15} /> : <ArrowRight size={15} />}
          </button>
        </form>
        {mode === 'account' ? (
          <Link className="account-link" to="/progress">
            View my progress
          </Link>
        ) : (
          <div className="account-foot">
            {registering ? 'Already have an account?' : 'New to React, Rendered?'}{' '}
            <Link className="account-link" to={registering ? '/login' : '/register'}>
              {registering ? 'Sign in' : 'Create an account'}
            </Link>
          </div>
        )}
      </div>
      {mode !== 'account' && (
        <Link className="text-link account-guest" to="/curriculum">
          Continue as a guest <ArrowRight size={14} />
        </Link>
      )}
    </section>
  )
}
