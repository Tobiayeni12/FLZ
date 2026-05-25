import { useState } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { Capacitor } from '@capacitor/core'

const EASE_CALM = [0.25, 0.46, 0.45, 0.94]

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M15.68 8.182c0-.566-.05-1.11-.144-1.636H8v3.094h4.305a3.68 3.68 0 0 1-1.596 2.414v2.007h2.584c1.51-1.392 2.387-3.44 2.387-5.88Z" fill="#4285F4"/>
      <path d="M8 16c2.16 0 3.97-.716 5.293-1.939l-2.584-2.007c-.715.48-1.63.763-2.709.763-2.083 0-3.847-1.407-4.477-3.297H.853v2.072A8 8 0 0 0 8 16Z" fill="#34A853"/>
      <path d="M3.523 9.52A4.813 4.813 0 0 1 3.273 8c0-.528.091-1.04.25-1.52V4.408H.853A8 8 0 0 0 0 8c0 1.291.31 2.513.853 3.592L3.523 9.52Z" fill="#FBBC05"/>
      <path d="M8 3.183c1.173 0 2.226.403 3.054 1.195l2.29-2.29C11.966.791 10.156 0 8 0A8 8 0 0 0 .853 4.408L3.523 6.48C4.153 4.59 5.917 3.183 8 3.183Z" fill="#EA4335"/>
    </svg>
  )
}

export default function AuthScreen({ onBack }) {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [phase, setPhase]       = useState('idle') // idle | loading | error
  const [errorMsg, setErrorMsg] = useState('')
  const [focusedField, setFocusedField] = useState(null)

  async function handleSignIn(e) {
    e?.preventDefault()
    if (!email.trim() || !password.trim() || phase === 'loading') return
    setPhase('loading')
    setErrorMsg('')

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    })

    if (error) {
      setErrorMsg(error.message ?? 'Sign in failed. Please try again.')
      setPhase('error')
    }
  }

  async function handleGoogleSignUp() {
    const isNative = Capacitor.isNativePlatform()
    const redirectTo = isNative
      ? 'com.flz.app://auth/callback'
      : window.location.origin

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
        skipBrowserRedirect: isNative,
      },
    })

    if (isNative && data?.url) {
      const { Browser } = await import('@capacitor/browser')
      await Browser.open({ url: data.url })
    }
  }

  const busy = phase === 'loading'

  const inputStyle = (field) => ({
    width: '100%', boxSizing: 'border-box',
    background: 'transparent',
    border: 'none',
    borderBottom: `1px solid ${focusedField === field ? 'var(--flz-text)' : 'var(--flz-border-input)'}`,
    outline: 'none',
    fontFamily: 'Inter, system-ui, sans-serif',
    fontSize: '0.9375rem',
    color: 'var(--flz-text)',
    padding: '8px 0',
    letterSpacing: '-0.01em',
    transition: 'border-color 0.25s',
    opacity: busy ? 0.5 : 1,
  })

  return (
    <div style={{
      position: 'fixed', inset: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: EASE_CALM }}
        style={{
          width: '100%', maxWidth: '400px',
          padding: '0 32px',
          position: 'relative', zIndex: 10,
        }}
      >
        {/* Heading */}
        <h1 style={{
          fontFamily: 'Inter, system-ui, sans-serif',
          fontSize: 'clamp(1.6rem, 4vw, 2.2rem)',
          fontWeight: 400, color: 'var(--flz-text)',
          letterSpacing: '-0.03em', lineHeight: 1.25,
          margin: '0 0 40px', textAlign: 'center',
        }}>
          Welcome back.
        </h1>

        {/* Form */}
        <form onSubmit={handleSignIn} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* Email */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
            <label style={{
              fontFamily: 'Inter, system-ui, sans-serif',
              fontSize: '0.72rem', letterSpacing: '0.06em',
              textTransform: 'uppercase', color: 'var(--flz-text-muted)',
            }}>Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onFocus={() => setFocusedField('email')}
              onBlur={() => setFocusedField(null)}
              disabled={busy}
              autoFocus
              autoComplete="email"
              style={inputStyle('email')}
            />
          </div>

          {/* Password */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
            <label style={{
              fontFamily: 'Inter, system-ui, sans-serif',
              fontSize: '0.72rem', letterSpacing: '0.06em',
              textTransform: 'uppercase', color: 'var(--flz-text-muted)',
            }}>Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onFocus={() => setFocusedField('password')}
              onBlur={() => setFocusedField(null)}
              disabled={busy}
              autoComplete="current-password"
              style={inputStyle('password')}
            />
          </div>

          {/* Error */}
          {phase === 'error' && (
            <motion.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              style={{ margin: 0, fontFamily: 'Inter, system-ui, sans-serif', fontSize: '0.8rem', color: '#c00' }}
            >
              {errorMsg}
            </motion.p>
          )}

          {/* Sign in button */}
          <button
            type="submit"
            disabled={busy}
            style={{
              marginTop: '8px',
              width: '100%', padding: '12px',
              background: 'var(--flz-text)',
              border: '1px solid var(--flz-text)',
              borderRadius: '2px',
              fontFamily: 'Inter, system-ui, sans-serif',
              fontSize: '0.875rem', color: 'var(--flz-bg)',
              letterSpacing: '0.02em',
              cursor: busy ? 'default' : 'pointer',
              opacity: busy ? 0.5 : 1,
              transition: 'opacity 0.2s',
            }}
            onMouseEnter={e => { if (!busy) e.currentTarget.style.opacity = '0.75' }}
            onMouseLeave={e => { e.currentTarget.style.opacity = busy ? '0.5' : '1' }}
          >
            {busy ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '24px 0' }}>
          <div style={{ flex: 1, height: '1px', background: 'var(--flz-border)' }} />
          <span style={{
            fontFamily: 'Inter, system-ui, sans-serif',
            fontSize: '0.72rem', color: 'var(--flz-text-muted)', letterSpacing: '0.04em',
          }}>or</span>
          <div style={{ flex: 1, height: '1px', background: 'var(--flz-border)' }} />
        </div>

        {/* Google buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {[
            { label: 'Sign in with Google' },
            { label: 'Sign up with Google' },
          ].map(({ label }) => (
            <button
              key={label}
              onClick={handleGoogleSignUp}
              style={{
                width: '100%', padding: '11px',
                background: 'none',
                border: '1px solid var(--flz-border-input)',
                borderRadius: '2px',
                fontFamily: 'Inter, system-ui, sans-serif',
                fontSize: '0.875rem', color: 'var(--flz-text)',
                letterSpacing: '0.01em',
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                transition: 'border-color 0.2s, background 0.2s',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = 'var(--flz-text)'
                e.currentTarget.style.background = 'var(--flz-tag-bg)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = 'var(--flz-border-input)'
                e.currentTarget.style.background = 'none'
              }}
            >
              <GoogleIcon />
              {label}
            </button>
          ))}
        </div>

        {/* Back */}
        {onBack && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            style={{ textAlign: 'center', marginTop: '32px' }}
          >
            <button
              onClick={onBack}
              style={{
                background: 'none', border: 'none',
                fontFamily: 'Inter, system-ui, sans-serif',
                fontSize: '0.78rem', color: 'var(--flz-text-muted)',
                cursor: 'pointer', letterSpacing: '0.01em',
                padding: 0, transition: 'color 0.2s',
              }}
              onMouseEnter={e => e.target.style.color = 'var(--flz-text)'}
              onMouseLeave={e => e.target.style.color = 'var(--flz-text-muted)'}
            >
              ← back
            </button>
          </motion.div>
        )}
      </motion.div>
    </div>
  )
}
