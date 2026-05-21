import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../lib/supabase'

const EASE_CALM = [0.25, 0.46, 0.45, 0.94]

// ── Streak calculation ────────────────────────────────────────────────────────

function calcStreak(entries) {
  if (!entries.length) return 0
  const dates = [...new Set(entries.map(e => e.created_at.slice(0, 10)))]
  dates.sort((a, b) => b.localeCompare(a))
  const today = new Date().toISOString().slice(0, 10)
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10)
  if (dates[0] !== today && dates[0] !== yesterday) return 0
  let streak = 1
  for (let i = 1; i < dates.length; i++) {
    const prev = new Date(dates[i - 1])
    const curr = new Date(dates[i])
    const diff = Math.round((prev - curr) / 86400000)
    if (diff === 1) streak++
    else break
  }
  return streak
}

// ── Calendar view ─────────────────────────────────────────────────────────────

function CalendarView({ entries }) {
  const [viewDate, setViewDate] = useState(new Date())
  const year  = viewDate.getFullYear()
  const month = viewDate.getMonth()

  const entryDates = new Set(
    entries
      .filter(e => {
        const d = new Date(e.created_at)
        return d.getFullYear() === year && d.getMonth() === month
      })
      .map(e => new Date(e.created_at).getDate())
  )

  const daysInMonth   = new Date(year, month + 1, 0).getDate()
  const firstDayOfWeek = new Date(year, month, 1).getDay()
  const todayDate     = new Date()
  const isCurrentMonth = todayDate.getFullYear() === year && todayDate.getMonth() === month
  const todayDay      = isCurrentMonth ? todayDate.getDate() : -1

  const monthLabel = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(viewDate)

  const cells = []
  for (let i = 0; i < firstDayOfWeek; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: EASE_CALM }}
      style={{
        border: '1px solid var(--flz-border)',
        borderRadius: '4px',
        padding: '20px 20px 16px',
        marginBottom: '36px',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <span style={{
          fontFamily: 'Inter, system-ui, sans-serif',
          fontSize: '0.8125rem', color: 'var(--flz-text)', letterSpacing: '-0.01em',
        }}>{monthLabel}</span>
        <div style={{ display: 'flex', gap: '8px' }}>
          {['←', '→'].map((arrow, idx) => (
            <button
              key={arrow}
              onClick={() => setViewDate(d => new Date(d.getFullYear(), d.getMonth() + (idx === 0 ? -1 : 1), 1))}
              style={{
                background: 'none', border: 'none',
                fontFamily: 'Inter, system-ui, sans-serif',
                fontSize: '0.85rem', color: 'var(--flz-text-muted)',
                cursor: 'pointer', padding: '2px 6px',
                transition: 'color 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.color = 'var(--flz-text)'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--flz-text-muted)'}
            >
              {arrow}
            </button>
          ))}
        </div>
      </div>

      {/* Day labels */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px', marginBottom: '6px' }}>
        {['S','M','T','W','T','F','S'].map((d, i) => (
          <div key={i} style={{
            textAlign: 'center',
            fontFamily: 'Inter, system-ui, sans-serif',
            fontSize: '0.62rem', letterSpacing: '0.06em',
            color: 'var(--flz-text-muted)', paddingBottom: '6px',
          }}>{d}</div>
        ))}
      </div>

      {/* Day cells */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '3px' }}>
        {cells.map((day, i) => {
          const hasEntry = day && entryDates.has(day)
          const isToday  = day === todayDay
          return (
            <div
              key={i}
              style={{
                height: '32px',
                display: 'flex',
                alignItems: 'center', justifyContent: 'center',
                borderRadius: '4px',
                background: hasEntry ? 'var(--flz-text)' : isToday ? 'var(--flz-tag-bg)' : 'transparent',
                border: isToday && !hasEntry ? '1px solid var(--flz-border-input)' : '1px solid transparent',
              }}
            >
              {day && (
                <span style={{
                  fontFamily: 'Inter, system-ui, sans-serif',
                  fontSize: '0.75rem',
                  color: hasEntry ? 'var(--flz-bg)' : 'var(--flz-text-dim)',
                  fontWeight: hasEntry ? 500 : 400,
                  lineHeight: 1,
                }}>
                  {day}
                </span>
              )}
            </div>
          )
        })}
      </div>
    </motion.div>
  )
}

// ── Dimension trend chart ─────────────────────────────────────────────────────

const ENERGY_MAP  = { low: 1, medium: 2, high: 3 }
const EMOTION_MAP = { negative: 1, neutral: 2, mixed: 2, positive: 3 }
const CLARITY_MAP = { confused: 1, reflective: 2, focused: 3 }

function DimensionChart({ entries }) {
  const data = entries.slice(0, 10).reverse()
  if (data.length < 2) return null

  const points = data.map(e => ({
    energy:  ENERGY_MAP[e.energy]   ?? 2,
    emotion: EMOTION_MAP[e.emotion] ?? 2,
    clarity: CLARITY_MAP[e.clarity] ?? 2,
  }))

  const W = 500, H = 90
  const PL = 4, PR = 4, PT = 8, PB = 8
  const cW = W - PL - PR, cH = H - PT - PB
  const n = points.length

  function px(i)   { return PL + (i / (n - 1)) * cW }
  function py(val) { return PT + cH - ((val - 1) / 2) * cH }

  function path(key) {
    return points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${px(i).toFixed(1)} ${py(p[key]).toFixed(1)}`).join(' ')
  }

  const lines = [
    { key: 'energy',  opacity: 0.85, dash: 'none',    label: 'Energy'  },
    { key: 'emotion', opacity: 0.45, dash: '5 3',     label: 'Emotion' },
    { key: 'clarity', opacity: 0.22, dash: '2 3',     label: 'Clarity' },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: EASE_CALM, delay: 0.1 }}
      style={{
        border: '1px solid var(--flz-border)',
        borderRadius: '4px',
        padding: '20px 20px 14px',
        marginBottom: '36px',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
        <p style={{
          margin: 0, fontFamily: 'Inter, system-ui, sans-serif',
          fontSize: '0.8125rem', color: 'var(--flz-text)', letterSpacing: '-0.01em',
        }}>
          Dimension trends
        </p>
        <div style={{ display: 'flex', gap: '12px' }}>
          {lines.map(l => (
            <span key={l.key} style={{
              fontFamily: 'Inter, system-ui, sans-serif',
              fontSize: '0.62rem', letterSpacing: '0.05em',
              color: 'var(--flz-text-muted)', opacity: l.opacity + 0.15,
            }}>
              {l.label}
            </span>
          ))}
        </div>
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', display: 'block' }}>
        {/* Grid lines */}
        {[1, 2, 3].map(v => (
          <line
            key={v}
            x1={PL} y1={py(v)} x2={W - PR} y2={py(v)}
            stroke="var(--flz-border)" strokeWidth="1"
          />
        ))}

        {/* Data lines */}
        {lines.map(l => (
          <path
            key={l.key}
            d={path(l.key)}
            fill="none"
            stroke="var(--flz-text)"
            strokeWidth="1.5"
            opacity={l.opacity}
            strokeDasharray={l.dash === 'none' ? undefined : l.dash}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ))}

        {/* Dots on energy line */}
        {points.map((p, i) => (
          <circle
            key={i}
            cx={px(i)} cy={py(p.energy)}
            r="2.5"
            fill="var(--flz-text)"
            opacity="0.85"
          />
        ))}
      </svg>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px' }}>
        {data.map((e, i) => (
          <span key={i} style={{
            fontFamily: 'Inter, system-ui, sans-serif',
            fontSize: '0.58rem', color: 'var(--flz-text-muted)',
            flex: 1, textAlign: i === 0 ? 'left' : i === data.length - 1 ? 'right' : 'center',
          }}>
            {new Date(e.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </span>
        ))}
      </div>
    </motion.div>
  )
}

// ── Pattern summary ───────────────────────────────────────────────────────────

function PatternSummary({ entries }) {
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [fetched, setFetched] = useState(false)

  async function load() {
    if (fetched) { setOpen(o => !o); return }
    setOpen(true)
    setLoading(true)
    try {
      const res = await fetch('/api/pattern', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entries }),
      })
      const data = await res.json()
      setSummary(data.summary ?? null)
    } catch {
      setSummary(null)
    }
    setLoading(false)
    setFetched(true)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, ease: EASE_CALM, delay: 0.2 }}
      style={{
        borderRadius: '4px',
        border: '1px solid var(--flz-border)',
        padding: '20px 24px',
        marginBottom: '36px',
      }}
    >
      <div
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
        onClick={load}
      >
        <div>
          <p style={{
            margin: '0 0 3px', fontFamily: 'Inter, system-ui, sans-serif',
            fontSize: '0.875rem', color: 'var(--flz-text)', letterSpacing: '-0.01em',
          }}>Pattern insight</p>
          <p style={{ margin: 0, fontFamily: 'Inter, system-ui, sans-serif', fontSize: '0.75rem', color: 'var(--flz-text-muted)' }}>
            Based on your last {Math.min(entries.length, 14)} entries
          </p>
        </div>
        <span style={{ color: 'var(--flz-text-muted)', fontSize: '1.1rem', lineHeight: 1 }}>
          {open ? '−' : '+'}
        </span>
      </div>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.4, ease: EASE_CALM }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{ paddingTop: '18px' }}>
              {loading ? (
                <p style={{ margin: 0, fontFamily: 'Inter, system-ui, sans-serif', fontSize: '0.875rem', color: 'var(--flz-text-muted)' }}>
                  Reading your patterns…
                </p>
              ) : summary ? (
                <p style={{ margin: 0, fontFamily: 'Inter, system-ui, sans-serif', fontSize: '0.9rem', color: 'var(--flz-text)', lineHeight: 1.8 }}>
                  {summary}
                </p>
              ) : (
                <p style={{ margin: 0, fontFamily: 'Inter, system-ui, sans-serif', fontSize: '0.875rem', color: 'var(--flz-text-muted)' }}>
                  Could not generate a summary right now.
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(iso) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit',
  }).format(new Date(iso))
}

function DimensionTag({ label, value }) {
  if (!value) return null
  return (
    <span style={{
      fontFamily: 'Inter, system-ui, sans-serif',
      fontSize: '0.68rem', letterSpacing: '0.08em',
      textTransform: 'uppercase', color: 'var(--flz-text-muted)',
    }}>
      {label}: {value}
    </span>
  )
}

function EntryRow({ entry, index, onSelect }) {
  const input = entry.input.length > 72
    ? entry.input.slice(0, 72).trimEnd() + '…'
    : entry.input

  return (
    <motion.div
      custom={index}
      initial="hidden"
      animate="visible"
      variants={{
        hidden: { opacity: 0, y: 10 },
        visible: i => ({
          opacity: 1, y: 0,
          transition: { delay: 0.1 + i * 0.07, duration: 0.55, ease: EASE_CALM },
        }),
      }}
      style={{ borderBottom: '1px solid var(--flz-border-soft)', padding: '22px 0', cursor: 'pointer' }}
      onClick={() => onSelect(entry)}
      onMouseEnter={e => e.currentTarget.style.opacity = '0.65'}
      onMouseLeave={e => e.currentTarget.style.opacity = '1'}
    >
      <p style={{ margin: '0 0 6px', fontFamily: 'Inter, system-ui, sans-serif', fontSize: '0.72rem', color: 'var(--flz-text-muted)', letterSpacing: '0.02em' }}>
        {formatDate(entry.created_at)}
      </p>
      <p style={{ margin: '0 0 6px', fontFamily: 'Inter, system-ui, sans-serif', fontSize: '0.9375rem', fontWeight: 400, color: 'var(--flz-text)', letterSpacing: '-0.015em', lineHeight: 1.4 }}>
        {entry.state_label ? `You were in ${entry.state_label}.` : 'A moment of reflection.'}
      </p>
      <p style={{ margin: '0 0 10px', fontFamily: 'Inter, system-ui, sans-serif', fontSize: '0.8125rem', color: 'var(--flz-text-dim)', lineHeight: 1.6, fontStyle: 'italic' }}>
        &ldquo;{input}&rdquo;
      </p>
      <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
        <DimensionTag label="energy"  value={entry.energy}  />
        <DimensionTag label="emotion" value={entry.emotion} />
        <DimensionTag label="clarity" value={entry.clarity} />
      </div>
    </motion.div>
  )
}

// ── Main history screen ───────────────────────────────────────────────────────

export default function HistoryScreen({ user, onSelectEntry, onSignOut }) {
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase
        .from('entries')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) {
        console.error('[FLZ] History fetch error:', error)
      } else {
        console.log('[FLZ] History loaded:', data?.length, 'entries')
        setEntries(data || [])
      }
      setLoading(false)
    }
    load()
  }, [])

  const streak = calcStreak(entries)

  return (
    <div style={{ minHeight: '100vh', paddingTop: '96px', paddingBottom: '80px', position: 'relative', zIndex: 10 }}>
      <div style={{ maxWidth: '580px', margin: '0 auto', padding: '0 32px' }}>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: EASE_CALM, delay: 0.1 }}
          style={{ paddingBottom: '44px' }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <div>
              <h2 style={{
                fontFamily: 'Inter, system-ui, sans-serif',
                fontSize: 'clamp(1.5rem, 3.5vw, 2rem)',
                fontWeight: 400, color: 'var(--flz-text)',
                letterSpacing: '-0.03em', lineHeight: 1.3,
                margin: '0 0 8px',
              }}>
                Your growth history
              </h2>
              <p style={{ fontFamily: 'Inter, system-ui, sans-serif', fontSize: '0.8125rem', color: 'var(--flz-text-muted)', margin: 0 }}>
                {entries.length > 0
                  ? `${entries.length} moment${entries.length === 1 ? '' : 's'} recorded`
                  : 'No entries yet'}
              </p>
            </div>

            {/* Streak badge */}
            {streak > 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, ease: EASE_CALM, delay: 0.3 }}
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center',
                  padding: '10px 16px',
                  border: '1px solid var(--flz-border)',
                  borderRadius: '4px',
                  flexShrink: 0,
                }}
              >
                <span style={{ fontSize: '1.2rem', lineHeight: 1 }}>🔥</span>
                <span style={{ fontFamily: 'Inter, system-ui, sans-serif', fontSize: '1rem', fontWeight: 500, color: 'var(--flz-text)', lineHeight: 1.2, marginTop: '4px' }}>
                  {streak}
                </span>
                <span style={{ fontFamily: 'Inter, system-ui, sans-serif', fontSize: '0.6rem', letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--flz-text-muted)', marginTop: '2px' }}>
                  {streak === 1 ? 'day' : 'days'}
                </span>
              </motion.div>
            )}
          </div>
        </motion.div>

        {loading ? (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.4 }}
            style={{ fontFamily: 'Inter, system-ui, sans-serif', fontSize: '0.875rem', color: 'var(--flz-text)' }}
          >
            Loading…
          </motion.p>
        ) : entries.length === 0 ? (
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: EASE_CALM, delay: 0.3 }}
            style={{
              fontFamily: 'Inter, system-ui, sans-serif',
              fontSize: '0.9rem', color: 'var(--flz-text-muted)', lineHeight: 1.7,
              borderTop: '1px solid var(--flz-border-soft)', paddingTop: '24px',
            }}
          >
            Start by telling FLZ what's on your mind.<br />
            Your entries will appear here.
          </motion.p>
        ) : (
          <>
            {/* Calendar */}
            <CalendarView entries={entries} />

            {/* Dimension chart — 2+ entries */}
            {entries.length >= 2 && <DimensionChart entries={entries} />}

            {/* Pattern insight — 3+ entries */}
            {entries.length >= 3 && <PatternSummary entries={entries} />}

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.2 }}
              style={{ borderTop: '1px solid var(--flz-border-soft)' }}
            >
              {entries.map((entry, i) => (
                <EntryRow key={entry.id} entry={entry} index={i} onSelect={onSelectEntry} />
              ))}
            </motion.div>
          </>
        )}

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.8 }}
          style={{ paddingTop: '48px', textAlign: 'center' }}
        >
          <button
            onClick={onSignOut}
            style={{
              background: 'none', border: 'none',
              fontFamily: 'Inter, system-ui, sans-serif',
              fontSize: '0.75rem', color: 'var(--flz-text-muted)',
              cursor: 'pointer', letterSpacing: '0.01em', padding: '8px 0', transition: 'color 0.2s',
            }}
            onMouseEnter={e => e.target.style.color = 'var(--flz-text)'}
            onMouseLeave={e => e.target.style.color = 'var(--flz-text-muted)'}
          >
            Sign out
          </button>
        </motion.div>

      </div>
    </div>
  )
}
