import { motion } from 'framer-motion'

function PulsingDots() {
  return (
    <div style={{ display: 'flex', gap: '7px', marginTop: '32px' }}>
      {[0, 1, 2].map(i => (
        <motion.div
          key={i}
          style={{
            width: '5px',
            height: '5px',
            borderRadius: '50%',
            backgroundColor: 'var(--flz-text)',
          }}
          animate={{ opacity: [0.15, 0.7, 0.15] }}
          transition={{
            duration: 1.6,
            repeat: Infinity,
            delay: i * 0.22,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  )
}

export default function ThinkingScreen({ input }) {
  const display = input.length > 90 ? input.slice(0, 90).trimEnd() + '…' : input

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0 40px',
      }}
    >
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 0.45 }}
        transition={{ duration: 1, ease: 'easeOut' }}
        style={{
          fontFamily: 'Inter, system-ui, sans-serif',
          fontSize: '1rem',
          fontWeight: 400,
          color: 'var(--flz-text)',
          textAlign: 'center',
          maxWidth: '380px',
          lineHeight: 1.65,
          margin: 0,
        }}
      >
        &ldquo;{display}&rdquo;
      </motion.p>

      <PulsingDots />
    </div>
  )
}
