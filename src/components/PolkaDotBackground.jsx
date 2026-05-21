export default function PolkaDotBackground() {
  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none z-0 animate-driftDots"
      style={{
        backgroundImage:
          'radial-gradient(circle, var(--flz-dot) 1.5px, transparent 1.5px)',
        backgroundSize: '28px 28px',
      }}
    />
  )
}
