import { motion } from 'framer-motion'

const BTN = {
  background: 'none',
  border: 'none',
  fontFamily: 'Inter, system-ui, sans-serif',
  fontSize: '0.8rem',
  color: '#aaa',
  cursor: 'pointer',
  letterSpacing: '0.01em',
  padding: 0,
  transition: 'color 0.2s',
}

export default function Nav({ user, screen, onHistory, onNewEntry, onSignOut }) {
  if (!user) return null

  return (
    <motion.div
      style={{ position: 'fixed', top: '29px', right: '32px', zIndex: 20, display: 'flex', gap: '20px', alignItems: 'center' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1, ease: 'easeOut', delay: 0.4 }}
    >
      {screen === 'history' ? (
        <button
          style={BTN}
          onClick={onNewEntry}
          onMouseEnter={e => e.target.style.color = '#000'}
          onMouseLeave={e => e.target.style.color = '#aaa'}
        >
          New entry →
        </button>
      ) : (
        <button
          style={BTN}
          onClick={onHistory}
          onMouseEnter={e => e.target.style.color = '#000'}
          onMouseLeave={e => e.target.style.color = '#aaa'}
        >
          History
        </button>
      )}
    </motion.div>
  )
}
