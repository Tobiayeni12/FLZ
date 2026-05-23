import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export default function OnboardingInput({ onSubmit, placeholder = 'Type here…' }) {
  const [focused, setFocused] = useState(false)
  const [value, setValue] = useState('')
  const inputRef = useRef(null)

  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 500)
    return () => clearTimeout(t)
  }, [])

  function handleKeyDown(e) {
    if (e.key === 'Enter' && value.trim().length > 0) {
      onSubmit(value.trim())
    }
  }

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      {/* Placeholder */}
      <motion.span
        style={{
          position: 'absolute',
          bottom: '10px',
          left: 0,
          fontFamily: 'Inter, system-ui, sans-serif',
          fontSize: '0.78rem',
          letterSpacing: '0.01em',
          color: 'var(--flz-placeholder)',
          pointerEvents: 'none',
          userSelect: 'none',
        }}
        animate={{ opacity: value.length > 0 ? 0 : 1 }}
        transition={{ duration: 0.25, ease: 'easeInOut' }}
      >
        {placeholder}
      </motion.span>

      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={e => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        enterKeyHint="send"
        style={{
          width: '100%',
          background: 'transparent',
          outline: 'none',
          border: 'none',
          fontFamily: 'Inter, system-ui, sans-serif',
          fontSize: '1rem',
          letterSpacing: '-0.01em',
          color: 'var(--flz-text)',
          paddingBottom: '8px',
          paddingRight: value.length > 0 ? '36px' : '0',
          caretColor: 'var(--flz-text)',
          boxShadow: 'none',
        }}
        autoComplete="off"
        spellCheck="false"
        aria-label="Input"
      />

      {/* Submit arrow — visible on mobile, useful on desktop too */}
      <AnimatePresence>
        {value.trim().length > 0 && (
          <motion.button
            key="submit"
            type="button"
            initial={{ opacity: 0, x: 4 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 4 }}
            transition={{ duration: 0.18 }}
            onClick={() => onSubmit(value.trim())}
            style={{
              position: 'absolute',
              right: 0,
              bottom: '2px',
              background: 'none',
              border: 'none',
              padding: '10px 0 10px 14px',
              fontFamily: 'Inter, system-ui, sans-serif',
              fontSize: '1.05rem',
              color: 'var(--flz-text)',
              cursor: 'pointer',
              lineHeight: 1,
              touchAction: 'manipulation',
            }}
          >
            →
          </motion.button>
        )}
      </AnimatePresence>

      {/* Bottom line */}
      <motion.div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          width: '100%',
          height: '1px',
          backgroundColor: 'var(--flz-text)',
          transformOrigin: 'left',
        }}
        animate={{ opacity: focused ? 1 : 0.4 }}
        transition={{ duration: 0.5, ease: 'easeInOut' }}
      />
    </div>
  )
}
