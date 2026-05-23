import { motion } from 'framer-motion'

function MoonIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M11.5 8.5A5.5 5.5 0 0 1 4.5 1.5a5.5 5.5 0 1 0 7 7Z"
        stroke="var(--flz-text)"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function SunIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="6.5" cy="6.5" r="2.5" stroke="var(--flz-text)" strokeWidth="1.2" />
      <line x1="6.5" y1="0.5" x2="6.5" y2="2" stroke="var(--flz-text)" strokeWidth="1.2" strokeLinecap="round" />
      <line x1="6.5" y1="11" x2="6.5" y2="12.5" stroke="var(--flz-text)" strokeWidth="1.2" strokeLinecap="round" />
      <line x1="0.5" y1="6.5" x2="2" y2="6.5" stroke="var(--flz-text)" strokeWidth="1.2" strokeLinecap="round" />
      <line x1="11" y1="6.5" x2="12.5" y2="6.5" stroke="var(--flz-text)" strokeWidth="1.2" strokeLinecap="round" />
      <line x1="2.4" y1="2.4" x2="3.4" y2="3.4" stroke="var(--flz-text)" strokeWidth="1.2" strokeLinecap="round" />
      <line x1="9.6" y1="9.6" x2="10.6" y2="10.6" stroke="var(--flz-text)" strokeWidth="1.2" strokeLinecap="round" />
      <line x1="10.6" y1="2.4" x2="9.6" y2="3.4" stroke="var(--flz-text)" strokeWidth="1.2" strokeLinecap="round" />
      <line x1="3.4" y1="9.6" x2="2.4" y2="10.6" stroke="var(--flz-text)" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  )
}

export default function DarkModeToggle({ dark, onToggle }) {
  return (
    <motion.button
      onClick={onToggle}
      title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1.2, ease: 'easeOut', delay: 0.3 }}
      style={{
        position: 'fixed',
        top: '15px',
        right: '76px',
        zIndex: 20,
        width: '44px',
        height: '44px',
        borderRadius: '50%',
        background: 'transparent',
        border: 'none',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '5px',
        touchAction: 'manipulation',
      }}
    >
      <div style={{
        width: '34px', height: '34px', borderRadius: '50%',
        border: '1.3px solid var(--flz-border-input)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'border-color 0.2s',
      }}
        onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--flz-text)'}
        onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--flz-border-input)'}
      >
        {dark ? <SunIcon /> : <MoonIcon />}
      </div>
    </motion.button>
  )
}
