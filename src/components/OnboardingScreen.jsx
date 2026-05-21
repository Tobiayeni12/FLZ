import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import OnboardingInput from './OnboardingInput'

const EASE_CALM = [0.25, 0.46, 0.45, 0.94]

export default function OnboardingScreen({ onSubmit, error, userName, onSaveName }) {
  // If we already have a name, skip straight to the input phase
  const [phase, setPhase] = useState(userName ? 'entering' : 'name')
  const [nameReady, setNameReady] = useState(false)

  // Once entering phase starts, delay showing the input
  useEffect(() => {
    if (phase !== 'entering') return
    const t = setTimeout(() => setPhase('shifted'), 1800)
    return () => clearTimeout(t)
  }, [phase])

  function handleSaveName(name) {
    onSaveName(name)
    setPhase('entering')
  }

  const greeting = userName
    ? `What's on your mind, ${userName}`
    : "What's on your mind today"

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          width: '100%',
          maxWidth: '480px',
          padding: '0 32px',
          position: 'relative',
          zIndex: 10,
        }}
      >
        <AnimatePresence mode="wait">

          {/* ── Name capture phase ─────────────────────────────── */}
          {phase === 'name' && (
            <motion.div
              key="name"
              style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 1.0, ease: 'easeOut', delay: 0.1 }}
            >
              <h1
                style={{
                  fontFamily: 'Inter, system-ui, sans-serif',
                  fontSize: 'clamp(1.85rem, 4vw, 2.8rem)',
                  letterSpacing: '-0.03em',
                  lineHeight: 1.25,
                  fontWeight: 400,
                  color: 'var(--flz-text)',
                  textAlign: 'center',
                  margin: '0 0 52px',
                  userSelect: 'none',
                  width: '100%',
                }}
              >
                What&apos;s your name?
              </h1>
              <div style={{ width: '100%' }}>
                <OnboardingInput
                  onSubmit={handleSaveName}
                  placeholder="Your name — press Enter"
                />
              </div>
            </motion.div>
          )}

          {/* ── Main question phase ────────────────────────────── */}
          {(phase === 'entering' || phase === 'shifted') && (
            <motion.div
              key="main"
              style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.1, ease: 'easeOut', delay: 0.05 }}
            >
              <motion.h1
                layout
                style={{
                  fontFamily: 'Inter, system-ui, sans-serif',
                  fontSize: 'clamp(1.85rem, 4vw, 2.8rem)',
                  letterSpacing: '-0.03em',
                  lineHeight: 1.25,
                  fontWeight: 400,
                  color: 'var(--flz-text)',
                  textAlign: 'center',
                  margin: 0,
                  userSelect: 'none',
                  width: '100%',
                }}
              >
                {greeting}
              </motion.h1>

              <AnimatePresence>
                {phase === 'shifted' && (
                  <motion.div
                    key="input-slot"
                    style={{ width: '100%', marginTop: '52px' }}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.9, ease: EASE_CALM, delay: 0.4 }}
                  >
                    <OnboardingInput onSubmit={onSubmit} />
                  </motion.div>
                )}
              </AnimatePresence>

              <AnimatePresence>
                {error && (
                  <motion.p
                    key="error"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.4 }}
                    style={{
                      marginTop: '24px',
                      fontFamily: 'Inter, system-ui, sans-serif',
                      fontSize: '0.8rem',
                      color: 'var(--flz-text-dim)',
                      textAlign: 'center',
                    }}
                  >
                    {error}
                  </motion.p>
                )}
              </AnimatePresence>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  )
}
