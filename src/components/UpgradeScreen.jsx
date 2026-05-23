import { useState } from 'react'
import { motion } from 'framer-motion'

const EASE_CALM = [0.25, 0.46, 0.45, 0.94]

const PLANS = [
  {
    id: 'yearly',
    label: 'Yearly',
    price: '$72',
    period: '/year',
    sub: '$6 / month · save 25%',
    badge: 'Best value',
  },
  {
    id: 'monthly',
    label: 'Monthly',
    price: '$8',
    period: '/month',
    sub: 'Billed monthly',
    badge: null,
  },
]

export default function UpgradeScreen({ user, onBack, onCheckout }) {
  const [selected, setSelected] = useState('yearly')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState(null)

  async function handleContinue() {
    if (loading) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan:      selected,
          userId:    user.id,
          userEmail: user.email,
          origin:    window.location.origin,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Checkout failed')
      window.location.href = data.url
    } catch (err) {
      setError(err.message)
      setLoading(false)
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: EASE_CALM }}
        style={{
          width: '100%', maxWidth: '400px', padding: '0 clamp(20px, 5vw, 32px)',
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          position: 'relative', zIndex: 10,
        }}
      >
        {/* Heading */}
        <p style={{
          fontFamily: 'Inter, system-ui, sans-serif',
          fontSize: '0.72rem', letterSpacing: '0.1em',
          textTransform: 'uppercase', color: 'var(--flz-text-muted)',
          margin: '0 0 16px',
        }}>
          Upgrade to Pro
        </p>

        <h1 style={{
          fontFamily: 'Inter, system-ui, sans-serif',
          fontSize: 'clamp(1.6rem, 4vw, 2.2rem)',
          fontWeight: 400, letterSpacing: '-0.03em', lineHeight: 1.3,
          color: 'var(--flz-text)', margin: '0 0 10px', textAlign: 'center',
        }}>
          Unlimited access.
        </h1>

        <p style={{
          fontFamily: 'Inter, system-ui, sans-serif',
          fontSize: '0.875rem', color: 'var(--flz-text-muted)',
          lineHeight: 1.6, margin: '0 0 36px', textAlign: 'center',
        }}>
          Unlimited assessments, unlimited journal entries,<br />and everything we build next.
        </p>

        {/* Plan cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%', marginBottom: '24px' }}>
          {PLANS.map(plan => {
            const active = selected === plan.id
            return (
              <button
                key={plan.id}
                onClick={() => setSelected(plan.id)}
                style={{
                  width: '100%', padding: '16px 18px',
                  background: active ? 'var(--flz-text)' : 'transparent',
                  border: `1px solid ${active ? 'var(--flz-text)' : 'var(--flz-border-input)'}`,
                  borderRadius: '4px', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  transition: 'all 0.2s',
                  textAlign: 'left',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
                    <span style={{
                      fontFamily: 'Inter, system-ui, sans-serif',
                      fontSize: '0.875rem', fontWeight: 500,
                      color: active ? 'var(--flz-bg)' : 'var(--flz-text)',
                    }}>
                      {plan.label}
                    </span>
                    {plan.badge && (
                      <span style={{
                        fontFamily: 'Inter, system-ui, sans-serif',
                        fontSize: '0.62rem', letterSpacing: '0.06em',
                        textTransform: 'uppercase',
                        color: active ? 'var(--flz-bg)' : 'var(--flz-text)',
                        opacity: 0.7,
                        border: `1px solid ${active ? 'var(--flz-bg)' : 'var(--flz-text)'}`,
                        borderRadius: '2px', padding: '1px 5px',
                      }}>
                        {plan.badge}
                      </span>
                    )}
                  </div>
                  <span style={{
                    fontFamily: 'Inter, system-ui, sans-serif',
                    fontSize: '0.75rem',
                    color: active ? 'var(--flz-bg)' : 'var(--flz-text-muted)',
                    opacity: active ? 0.8 : 1,
                  }}>
                    {plan.sub}
                  </span>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <span style={{
                    fontFamily: 'Inter, system-ui, sans-serif',
                    fontSize: '1.25rem', fontWeight: 400,
                    color: active ? 'var(--flz-bg)' : 'var(--flz-text)',
                    letterSpacing: '-0.02em',
                  }}>
                    {plan.price}
                  </span>
                  <span style={{
                    fontFamily: 'Inter, system-ui, sans-serif',
                    fontSize: '0.75rem',
                    color: active ? 'var(--flz-bg)' : 'var(--flz-text-muted)',
                    opacity: active ? 0.7 : 1,
                  }}>
                    {plan.period}
                  </span>
                </div>
              </button>
            )
          })}
        </div>

        {/* Error */}
        {error && (
          <p style={{
            fontFamily: 'Inter, system-ui, sans-serif',
            fontSize: '0.78rem', color: '#c00',
            marginBottom: '12px', textAlign: 'center',
          }}>
            {error}
          </p>
        )}

        {/* CTA */}
        <button
          onClick={handleContinue}
          disabled={loading}
          style={{
            width: '100%', padding: '13px',
            background: 'var(--flz-text)', border: '1px solid var(--flz-text)',
            borderRadius: '2px', cursor: loading ? 'default' : 'pointer',
            fontFamily: 'Inter, system-ui, sans-serif',
            fontSize: '0.875rem', color: 'var(--flz-bg)',
            letterSpacing: '0.02em',
            opacity: loading ? 0.5 : 1, transition: 'opacity 0.2s',
          }}
          onMouseEnter={e => { if (!loading) e.currentTarget.style.opacity = '0.75' }}
          onMouseLeave={e => { e.currentTarget.style.opacity = loading ? '0.5' : '1' }}
        >
          {loading ? 'Redirecting to checkout…' : 'Continue'}
        </button>

        {/* Back */}
        <button
          onClick={onBack}
          style={{
            marginTop: '20px', background: 'none', border: 'none',
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
    </div>
  )
}
