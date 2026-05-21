import { useState } from 'react'
import { motion } from 'framer-motion'

const EASE_CALM = [0.25, 0.46, 0.45, 0.94]

export default function SettingsScreen({ user, userName, onSaveName, onBack }) {
  const [name, setName]         = useState(userName || '')
  const [focused, setFocused]   = useState(false)
  const [saved, setSaved]       = useState(false)

  function handleSave(e) {
    e?.preventDefault()
    if (!name.trim()) return
    onSaveName(name.trim())
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') handleSave()
  }

  return (
    <div style={{
      minHeight: '100vh', paddingTop: '96px', paddingBottom: '80px',
      position: 'relative', zIndex: 10,
    }}>
      <div style={{ maxWidth: '480px', margin: '0 auto', padding: '0 32px' }}>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: EASE_CALM, delay: 0.05 }}
          style={{ paddingBottom: '52px' }}
        >
          <h2 style={{
            fontFamily: 'Inter, system-ui, sans-serif',
            fontSize: 'clamp(1.5rem, 3.5vw, 2rem)',
            fontWeight: 400, color: 'var(--flz-text)',
            letterSpacing: '-0.03em', lineHeight: 1.3,
            margin: '0 0 8px',
          }}>
            Settings
          </h2>
          <p style={{
            fontFamily: 'Inter, system-ui, sans-serif',
            fontSize: '0.8125rem', color: 'var(--flz-text-muted)', margin: 0,
          }}>
            {user?.email}
          </p>
        </motion.div>

        {/* Name field */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: EASE_CALM, delay: 0.15 }}
          style={{ borderTop: '1px solid var(--flz-border)', paddingTop: '32px' }}
        >
          <form onSubmit={handleSave}>
            <label style={{
              display: 'block',
              fontFamily: 'Inter, system-ui, sans-serif',
              fontSize: '0.72rem', letterSpacing: '0.06em',
              textTransform: 'uppercase', color: 'var(--flz-text-muted)',
              marginBottom: '10px',
            }}>
              Your name
            </label>

            <div style={{ position: 'relative' }}>
              <input
                type="text"
                value={name}
                onChange={e => { setName(e.target.value); setSaved(false) }}
                onKeyDown={handleKeyDown}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                autoFocus
                style={{
                  width: '100%', boxSizing: 'border-box',
                  background: 'transparent', outline: 'none', border: 'none',
                  borderBottom: `1px solid ${focused ? 'var(--flz-text)' : 'var(--flz-border-input)'}`,
                  fontFamily: 'Inter, system-ui, sans-serif',
                  fontSize: '1rem', color: 'var(--flz-text)',
                  padding: '8px 0', letterSpacing: '-0.01em',
                  transition: 'border-color 0.25s',
                }}
              />
            </div>

            <p style={{
              fontFamily: 'Inter, system-ui, sans-serif',
              fontSize: '0.75rem', color: 'var(--flz-text-muted)',
              margin: '10px 0 28px', lineHeight: 1.5,
            }}>
              This is how FLZ greets you on the home screen.
            </p>

            {/* Save button */}
            <button
              type="submit"
              disabled={!name.trim() || name.trim() === userName}
              style={{
                padding: '11px 28px',
                background: saved ? 'var(--flz-text)' : 'none',
                border: '1px solid var(--flz-border-input)',
                borderRadius: '2px',
                fontFamily: 'Inter, system-ui, sans-serif',
                fontSize: '0.875rem',
                color: saved ? 'var(--flz-bg)' : 'var(--flz-text)',
                letterSpacing: '0.02em',
                cursor: (!name.trim() || name.trim() === userName) ? 'default' : 'pointer',
                opacity: (!name.trim() || name.trim() === userName) ? 0.4 : 1,
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => {
                if (name.trim() && name.trim() !== userName && !saved) {
                  e.currentTarget.style.background = 'var(--flz-text)'
                  e.currentTarget.style.color = 'var(--flz-bg)'
                }
              }}
              onMouseLeave={e => {
                if (!saved) {
                  e.currentTarget.style.background = 'none'
                  e.currentTarget.style.color = 'var(--flz-text)'
                }
              }}
            >
              {saved ? 'Saved ✓' : 'Save'}
            </button>
          </form>
        </motion.div>

        {/* Back */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          style={{ paddingTop: '48px' }}
        >
          <button
            onClick={onBack}
            style={{
              background: 'none', border: 'none',
              fontFamily: 'Inter, system-ui, sans-serif',
              fontSize: '0.8125rem', color: 'var(--flz-text-muted)',
              cursor: 'pointer', letterSpacing: '0.01em',
              padding: 0, transition: 'color 0.2s',
            }}
            onMouseEnter={e => e.target.style.color = 'var(--flz-text)'}
            onMouseLeave={e => e.target.style.color = 'var(--flz-text-muted)'}
          >
            ← Back
          </button>
        </motion.div>

      </div>
    </div>
  )
}
