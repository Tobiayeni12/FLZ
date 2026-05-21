import { motion } from 'framer-motion'
import flzLogo from '../assets/flz-logo.png'

export default function Logo({ onReset, dark }) {
  return (
    <motion.div
      className="fixed top-7 left-8 z-20 select-none"
      style={{ cursor: onReset ? 'pointer' : 'default' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1.2, ease: 'easeOut', delay: 0.2 }}
      onClick={onReset}
    >
      <img
        src={flzLogo}
        alt="FLZ"
        style={{
          height: '36px',
          width: 'auto',
          filter: dark ? 'invert(1)' : 'none',
          transition: 'filter 0.35s ease',
        }}
        draggable={false}
      />
    </motion.div>
  )
}
