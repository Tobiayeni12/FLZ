import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const EASE = [0.25, 0.46, 0.45, 0.94]

function PersonSVG() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="7" cy="5" r="2.6" stroke="var(--flz-text)" strokeWidth="1.3" />
      <path d="M1.5 13c0-3.038 2.462-5.5 5.5-5.5s5.5 2.462 5.5 5.5"
        stroke="var(--flz-text)" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  )
}

export default function ProfileIcon({ user, onSignIn, onHistory, onJournal, onSettings, onSignOut, onUpgrade, isPro }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    function down(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', down)
    return () => document.removeEventListener('mousedown', down)
  }, [])

  function handleClick() {
    if (!user) { onSignIn(); return }
    setOpen(o => !o)
  }

  const initial = user?.email?.[0]?.toUpperCase() ?? null

  return (
    <motion.div
      ref={ref}
      style={{ position: 'fixed', top: '15px', right: '24px', zIndex: 20 }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1.2, ease: 'easeOut', delay: 0.3 }}
    >
      {/* Avatar button — 44×44 tap target, visually 34×34 */}
      <button
        onClick={handleClick}
        title={user ? user.email : 'Sign in'}
        style={{
          width: '44px', height: '44px', borderRadius: '50%',
          background: 'transparent', border: 'none',
          cursor: 'pointer', padding: '5px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          touchAction: 'manipulation',
        }}
      >
        <div style={{
          width: '34px', height: '34px', borderRadius: '50%',
          background: user ? 'var(--flz-text)' : 'transparent',
          border: `1.3px solid ${user ? 'var(--flz-text)' : 'rgba(128,128,128,0.35)'}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'border-color 0.2s',
        }}
          onMouseEnter={e => { if (!user) e.currentTarget.style.borderColor = 'var(--flz-text)' }}
          onMouseLeave={e => { if (!user) e.currentTarget.style.borderColor = 'rgba(128,128,128,0.35)' }}
        >
          {user
            ? <span style={{
                fontFamily: 'Inter, system-ui, sans-serif',
                fontSize: '0.78rem',
                color: 'var(--flz-bg)',
                fontWeight: 500,
                lineHeight: 1,
              }}>{initial}</span>
            : <PersonSVG />
          }
        </div>
      </button>

      {/* Dropdown — logged-in only */}
      <AnimatePresence>
        {open && user && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.96 }}
            transition={{ duration: 0.18, ease: EASE }}
            style={{
              position: 'absolute', top: '48px', right: 0,
              background: 'var(--flz-surface)',
              border: '1px solid var(--flz-border)',
              borderRadius: '4px',
              minWidth: '160px',
              boxShadow: '0 6px 24px rgba(0,0,0,0.1)',
              overflow: 'hidden',
            }}
          >
            {/* Email label */}
            <div style={{ padding: '11px 14px 9px', borderBottom: '1px solid var(--flz-border)' }}>
              <p style={{ margin: 0, fontFamily: 'Inter, system-ui, sans-serif', fontSize: '0.7rem', color: 'var(--flz-text-muted)', letterSpacing: '0.01em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user.email}
              </p>
              {isPro && (
                <span style={{ display: 'inline-block', marginTop: '5px', fontFamily: 'Inter, system-ui, sans-serif', fontSize: '0.58rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--flz-text)', border: '1px solid var(--flz-text)', borderRadius: '2px', padding: '1px 6px', fontWeight: 500 }}>
                  Pro
                </span>
              )}
            </div>

            {[
              { label: 'History',  fn: () => { setOpen(false); onHistory()  } },
              { label: 'Journal',  fn: () => { setOpen(false); onJournal()  } },
              { label: 'Settings', fn: () => { setOpen(false); onSettings() } },
              ...(!isPro ? [{ label: 'Upgrade to Pro', fn: () => { setOpen(false); onUpgrade() } }] : []),
              { label: 'Sign out', fn: () => { setOpen(false); onSignOut()  } },
            ].map(({ label, fn }) => (
              <button key={label} onClick={fn} style={{
                display: 'block', width: '100%', textAlign: 'left',
                background: 'none', border: 'none',
                padding: '12px 14px',
                fontFamily: 'Inter, system-ui, sans-serif',
                fontSize: '0.82rem', color: 'var(--flz-text)',
                cursor: 'pointer', transition: 'background 0.12s',
              }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--flz-tag-bg)'}
                onMouseLeave={e => e.currentTarget.style.background = 'none'}
              >
                {label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
