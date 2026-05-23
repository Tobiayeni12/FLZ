import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../lib/supabase'

const EASE_CALM = [0.25, 0.46, 0.45, 0.94]

// ── Streak calculation ────────────────────────────────────────────────────────

function calcStreak(entries) {
  if (!entries.length) return 0
  const dates = [...new Set(entries.map(e => e.created_at.slice(0, 10)))]
  dates.sort((a, b) => b.localeCompare(a))
  const today     = new Date().toISOString().slice(0, 10)
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10)
  if (dates[0] !== today && dates[0] !== yesterday) return 0
  let streak = 1
  for (let i = 1; i < dates.length; i++) {
    const diff = Math.round((new Date(dates[i - 1]) - new Date(dates[i])) / 86400000)
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
      .filter(e => { const d = new Date(e.created_at); return d.getFullYear() === year && d.getMonth() === month })
      .map(e => new Date(e.created_at).getDate())
  )

  const daysInMonth    = new Date(year, month + 1, 0).getDate()
  const firstDayOfWeek = new Date(year, month, 1).getDay()
  const todayDate      = new Date()
  const isCurrentMonth = todayDate.getFullYear() === year && todayDate.getMonth() === month
  const todayDay       = isCurrentMonth ? todayDate.getDate() : -1
  const monthLabel     = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(viewDate)

  const cells = []
  for (let i = 0; i < firstDayOfWeek; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: EASE_CALM }}
      style={{ border: '1px solid var(--flz-border)', borderRadius: '4px', padding: '20px 20px 16px', marginBottom: '36px' }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <span style={{ fontFamily: 'Inter, system-ui, sans-serif', fontSize: '0.8125rem', color: 'var(--flz-text)', letterSpacing: '-0.01em' }}>{monthLabel}</span>
        <div style={{ display: 'flex', gap: '8px' }}>
          {['←', '→'].map((arrow, idx) => (
            <button key={arrow} onClick={() => setViewDate(d => new Date(d.getFullYear(), d.getMonth() + (idx === 0 ? -1 : 1), 1))}
              style={{ background: 'none', border: 'none', fontFamily: 'Inter, system-ui, sans-serif', fontSize: '0.85rem', color: 'var(--flz-text-muted)', cursor: 'pointer', padding: '2px 6px', transition: 'color 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.color = 'var(--flz-text)'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--flz-text-muted)'}
            >{arrow}</button>
          ))}
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px', marginBottom: '6px' }}>
        {['S','M','T','W','T','F','S'].map((d, i) => (
          <div key={i} style={{ textAlign: 'center', fontFamily: 'Inter, system-ui, sans-serif', fontSize: '0.62rem', letterSpacing: '0.06em', color: 'var(--flz-text-muted)', paddingBottom: '6px' }}>{d}</div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '3px' }}>
        {cells.map((day, i) => {
          const hasEntry = day && entryDates.has(day)
          const isToday  = day === todayDay
          return (
            <div key={i} style={{ height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '4px', background: hasEntry ? 'var(--flz-text)' : isToday ? 'var(--flz-tag-bg)' : 'transparent', border: isToday && !hasEntry ? '1px solid var(--flz-border-input)' : '1px solid transparent' }}>
              {day && <span style={{ fontFamily: 'Inter, system-ui, sans-serif', fontSize: '0.75rem', color: hasEntry ? 'var(--flz-bg)' : 'var(--flz-text-dim)', fontWeight: hasEntry ? 500 : 400, lineHeight: 1 }}>{day}</span>}
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

const DIM_CHART_COLORS = {
  energy:  '#f59e0b',   // amber  — warmth / vitality
  emotion: '#6366f1',   // indigo — feeling / depth
  clarity: '#10b981',   // emerald — focus / clearness
}

function DimensionChart({ entries, isPro }) {
  const limit = isPro ? 20 : 10
  const data  = entries.slice(0, limit).reverse()
  if (data.length < 2) return null

  const points = data.map(e => ({
    energy:  ENERGY_MAP[e.energy]   ?? 2,
    emotion: EMOTION_MAP[e.emotion] ?? 2,
    clarity: CLARITY_MAP[e.clarity] ?? 2,
  }))

  const tracks = [
    { key: 'energy',  color: DIM_CHART_COLORS.energy,  label: 'Energy'  },
    { key: 'emotion', color: DIM_CHART_COLORS.emotion, label: 'Emotion' },
    { key: 'clarity', color: DIM_CHART_COLORS.clarity, label: 'Clarity' },
  ]

  const W = 500, TRACK_H = 40, GAP = 12
  const PL = 58, PR = 6, PT = 2, PB = 2
  const cW = W - PL - PR
  const n  = points.length
  const TOTAL_H = PT + tracks.length * TRACK_H + (tracks.length - 1) * GAP + PB

  function trackTop(idx) { return PT + idx * (TRACK_H + GAP) }
  function px(i)         { return PL + (i / (n - 1)) * cW }
  function py(val, idx)  {
    const top = trackTop(idx) + 5
    const h   = TRACK_H - 10
    return top + h - ((val - 1) / 2) * h
  }
  function linePath(key, idx) {
    return points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${px(i).toFixed(1)},${py(p[key], idx).toFixed(1)}`).join(' ')
  }
  function areaPath(key, idx) {
    const bottom = trackTop(idx) + TRACK_H - 2
    const line   = points.map((p, i) => `${px(i).toFixed(1)},${py(p[key], idx).toFixed(1)}`).join(' L ')
    return `M ${px(0).toFixed(1)},${bottom} L ${line} L ${px(n - 1).toFixed(1)},${bottom} Z`
  }

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: EASE_CALM, delay: 0.1 }}
      style={{ border: '1px solid var(--flz-border)', borderRadius: '4px', padding: '20px 20px 14px', marginBottom: '36px' }}
    >
      <p style={{ margin: '0 0 16px', fontFamily: 'Inter, system-ui, sans-serif', fontSize: '0.8125rem', color: 'var(--flz-text)', letterSpacing: '-0.01em' }}>
        Dimension trends {isPro && data.length > 10 && <span style={{ fontSize: '0.65rem', color: 'var(--flz-text-muted)', marginLeft: '6px' }}>last {data.length}</span>}
      </p>

      <svg viewBox={`0 0 ${W} ${TOTAL_H}`} style={{ width: '100%', display: 'block' }}>
        {tracks.map((t, idx) => {
          const top = trackTop(idx)
          return (
            <g key={t.key}>
              {/* Track background */}
              <rect x={PL} y={top} width={cW} height={TRACK_H} rx="3"
                fill={t.color} fillOpacity="0.06" />

              {/* Subtle gridlines at low / mid / high */}
              {[1, 2, 3].map(v => (
                <line key={v} x1={PL} y1={py(v, idx)} x2={W - PR} y2={py(v, idx)}
                  stroke={t.color} strokeWidth="0.5" opacity="0.18" />
              ))}

              {/* Area fill */}
              <path d={areaPath(t.key, idx)} fill={t.color} fillOpacity="0.10" />

              {/* Line */}
              <path d={linePath(t.key, idx)} fill="none" stroke={t.color}
                strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" opacity="0.9" />

              {/* Dots */}
              {points.map((p, i) => (
                <circle key={i} cx={px(i)} cy={py(p[t.key], idx)} r="2.5"
                  fill={t.color} opacity="0.95" />
              ))}

              {/* Label */}
              <text
                x={PL - 10} y={top + TRACK_H / 2 + 4}
                textAnchor="end"
                fill={t.color}
                style={{ fontFamily: 'Inter, system-ui, sans-serif', fontSize: '10px', letterSpacing: '0.03em' }}
              >
                {t.label}
              </text>
            </g>
          )
        })}
      </svg>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', paddingLeft: `${PL / 500 * 100}%` }}>
        {[data[0], data[Math.floor(data.length / 2)], data[data.length - 1]].filter(Boolean).map((e, i) => (
          <span key={i} style={{ fontFamily: 'Inter, system-ui, sans-serif', fontSize: '0.58rem', color: 'var(--flz-text-muted)' }}>
            {new Date(e.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </span>
        ))}
      </div>
    </motion.div>
  )
}

// ── PRO: Monthly deep dive ────────────────────────────────────────────────────

function MonthlyDeepDive({ entries }) {
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(false)
  const [open, setOpen]       = useState(false)
  const [fetched, setFetched] = useState(false)

  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()
  const monthEntries = entries.filter(e => e.created_at >= monthStart)

  if (monthEntries.length < 3) return null

  async function load() {
    if (fetched) { setOpen(o => !o); return }
    setOpen(true); setLoading(true)
    try {
      const res  = await fetch('/api/monthly-summary', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ entries: monthEntries }) })
      const data = await res.json()
      setSummary(data.summary ?? null)
    } catch { setSummary(null) }
    setLoading(false); setFetched(true)
  }

  const monthLabel = new Intl.DateTimeFormat('en-US', { month: 'long' }).format(new Date())

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: EASE_CALM, delay: 0.05 }}
      style={{ borderRadius: '4px', border: '1px solid var(--flz-border)', padding: '20px 24px', marginBottom: '36px', background: 'var(--flz-tag-bg)' }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }} onClick={load}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
            <p style={{ margin: 0, fontFamily: 'Inter, system-ui, sans-serif', fontSize: '0.875rem', color: 'var(--flz-text)', letterSpacing: '-0.01em' }}>{monthLabel} deep dive</p>
            <span style={{ fontFamily: 'Inter, system-ui, sans-serif', fontSize: '0.6rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--flz-text-muted)', border: '1px solid var(--flz-border)', borderRadius: '2px', padding: '1px 5px' }}>Pro</span>
          </div>
          <p style={{ margin: 0, fontFamily: 'Inter, system-ui, sans-serif', fontSize: '0.75rem', color: 'var(--flz-text-muted)' }}>{monthEntries.length} {monthEntries.length === 1 ? 'entry' : 'entries'} this month</p>
        </div>
        <span style={{ color: 'var(--flz-text-muted)', fontSize: '1.1rem', lineHeight: 1 }}>{open ? '−' : '+'}</span>
      </div>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.4, ease: EASE_CALM }} style={{ overflow: 'hidden' }}>
            <div style={{ paddingTop: '18px' }}>
              {loading
                ? <p style={{ margin: 0, fontFamily: 'Inter, system-ui, sans-serif', fontSize: '0.875rem', color: 'var(--flz-text-muted)' }}>Reflecting on your month…</p>
                : summary
                  ? <p style={{ margin: 0, fontFamily: 'Inter, system-ui, sans-serif', fontSize: '0.9rem', color: 'var(--flz-text)', lineHeight: 1.8 }}>{summary}</p>
                  : <p style={{ margin: 0, fontFamily: 'Inter, system-ui, sans-serif', fontSize: '0.875rem', color: 'var(--flz-text-muted)' }}>Could not generate deep dive right now.</p>
              }
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// ── Pattern summary ───────────────────────────────────────────────────────────

function PatternSummary({ entries }) {
  const [summary, setSummary]   = useState(null)
  const [loading, setLoading]   = useState(false)
  const [open, setOpen]         = useState(false)
  const [fetched, setFetched]   = useState(false)

  async function load() {
    if (fetched) { setOpen(o => !o); return }
    setOpen(true); setLoading(true)
    try {
      const res  = await fetch('/api/pattern', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ entries }) })
      const data = await res.json()
      setSummary(data.summary ?? null)
    } catch { setSummary(null) }
    setLoading(false); setFetched(true)
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, ease: EASE_CALM, delay: 0.2 }}
      style={{ borderRadius: '4px', border: '1px solid var(--flz-border)', padding: '20px 24px', marginBottom: '36px' }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }} onClick={load}>
        <div>
          <p style={{ margin: '0 0 3px', fontFamily: 'Inter, system-ui, sans-serif', fontSize: '0.875rem', color: 'var(--flz-text)', letterSpacing: '-0.01em' }}>Pattern insight</p>
          <p style={{ margin: 0, fontFamily: 'Inter, system-ui, sans-serif', fontSize: '0.75rem', color: 'var(--flz-text-muted)' }}>Based on your last {Math.min(entries.length, 14)} entries</p>
        </div>
        <span style={{ color: 'var(--flz-text-muted)', fontSize: '1.1rem', lineHeight: 1 }}>{open ? '−' : '+'}</span>
      </div>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.4, ease: EASE_CALM }} style={{ overflow: 'hidden' }}>
            <div style={{ paddingTop: '18px' }}>
              {loading
                ? <p style={{ margin: 0, fontFamily: 'Inter, system-ui, sans-serif', fontSize: '0.875rem', color: 'var(--flz-text-muted)' }}>Reading your patterns…</p>
                : summary
                  ? <p style={{ margin: 0, fontFamily: 'Inter, system-ui, sans-serif', fontSize: '0.9rem', color: 'var(--flz-text)', lineHeight: 1.8 }}>{summary}</p>
                  : <p style={{ margin: 0, fontFamily: 'Inter, system-ui, sans-serif', fontSize: '0.875rem', color: 'var(--flz-text-muted)' }}>Could not generate a summary right now.</p>
              }
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// ── PRO: Weekly summary ───────────────────────────────────────────────────────

function WeeklySummary({ entries }) {
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(false)
  const [open, setOpen]       = useState(false)
  const [fetched, setFetched] = useState(false)

  const weekStart = new Date(Date.now() - 7 * 86400000).toISOString()
  const weekEntries = entries.filter(e => e.created_at >= weekStart)

  if (weekEntries.length === 0) return null

  async function load() {
    if (fetched) { setOpen(o => !o); return }
    setOpen(true); setLoading(true)
    try {
      const res  = await fetch('/api/weekly-summary', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ entries: weekEntries }) })
      const data = await res.json()
      setSummary(data.summary ?? null)
    } catch { setSummary(null) }
    setLoading(false); setFetched(true)
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: EASE_CALM }}
      style={{ borderRadius: '4px', border: '1px solid var(--flz-border)', padding: '20px 24px', marginBottom: '36px', background: 'var(--flz-tag-bg)' }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }} onClick={load}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
            <p style={{ margin: 0, fontFamily: 'Inter, system-ui, sans-serif', fontSize: '0.875rem', color: 'var(--flz-text)', letterSpacing: '-0.01em' }}>This week</p>
            <span style={{ fontFamily: 'Inter, system-ui, sans-serif', fontSize: '0.6rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--flz-text-muted)', border: '1px solid var(--flz-border)', borderRadius: '2px', padding: '1px 5px' }}>Pro</span>
          </div>
          <p style={{ margin: 0, fontFamily: 'Inter, system-ui, sans-serif', fontSize: '0.75rem', color: 'var(--flz-text-muted)' }}>{weekEntries.length} {weekEntries.length === 1 ? 'entry' : 'entries'} this week</p>
        </div>
        <span style={{ color: 'var(--flz-text-muted)', fontSize: '1.1rem', lineHeight: 1 }}>{open ? '−' : '+'}</span>
      </div>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.4, ease: EASE_CALM }} style={{ overflow: 'hidden' }}>
            <div style={{ paddingTop: '18px' }}>
              {loading
                ? <p style={{ margin: 0, fontFamily: 'Inter, system-ui, sans-serif', fontSize: '0.875rem', color: 'var(--flz-text-muted)' }}>Reflecting on your week…</p>
                : summary
                  ? <p style={{ margin: 0, fontFamily: 'Inter, system-ui, sans-serif', fontSize: '0.9rem', color: 'var(--flz-text)', lineHeight: 1.8 }}>{summary}</p>
                  : <p style={{ margin: 0, fontFamily: 'Inter, system-ui, sans-serif', fontSize: '0.875rem', color: 'var(--flz-text-muted)' }}>Could not generate summary right now.</p>
              }
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// ── PRO: Most common states ───────────────────────────────────────────────────

function MostCommonStates({ entries }) {
  const stats = useMemo(() => {
    function top(arr) {
      const freq = {}
      arr.forEach(v => v && (freq[v] = (freq[v] || 0) + 1))
      return Object.entries(freq).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '—'
    }
    return {
      energy:  top(entries.map(e => e.energy)),
      emotion: top(entries.map(e => e.emotion)),
      clarity: top(entries.map(e => e.clarity)),
    }
  }, [entries])

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: EASE_CALM }}
      style={{ border: '1px solid var(--flz-border)', borderRadius: '4px', padding: '20px 24px', marginBottom: '36px' }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
        <p style={{ margin: 0, fontFamily: 'Inter, system-ui, sans-serif', fontSize: '0.8125rem', color: 'var(--flz-text)', letterSpacing: '-0.01em' }}>Your most common states</p>
        <span style={{ fontFamily: 'Inter, system-ui, sans-serif', fontSize: '0.6rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--flz-text-muted)', border: '1px solid var(--flz-border)', borderRadius: '2px', padding: '1px 5px' }}>Pro</span>
      </div>
      <div style={{ display: 'flex', gap: '0', flexDirection: 'column' }}>
        {[
          { label: 'Energy',  value: stats.energy  },
          { label: 'Emotion', value: stats.emotion  },
          { label: 'Clarity', value: stats.clarity  },
        ].map(({ label, value }) => (
          <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--flz-border-soft)' }}>
            <span style={{ fontFamily: 'Inter, system-ui, sans-serif', fontSize: '0.8rem', color: 'var(--flz-text-muted)', letterSpacing: '0.02em' }}>{label}</span>
            <span style={{ fontFamily: 'Inter, system-ui, sans-serif', fontSize: '0.875rem', color: 'var(--flz-text)', fontWeight: 500, textTransform: 'capitalize' }}>{value}</span>
          </div>
        ))}
      </div>
    </motion.div>
  )
}

// ── PRO: Week comparison ──────────────────────────────────────────────────────

function WeekComparison({ entries }) {
  const stats = useMemo(() => {
    const now = Date.now()
    const thisWeek = entries.filter(e => new Date(e.created_at).getTime() >= now - 7 * 86400000)
    const lastWeek = entries.filter(e => {
      const t = new Date(e.created_at).getTime()
      return t >= now - 14 * 86400000 && t < now - 7 * 86400000
    })
    if (thisWeek.length === 0 || lastWeek.length === 0) return null

    function avg(arr, map) {
      const vals = arr.map(e => map[e] ?? 2).filter(Boolean)
      return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 2
    }

    return {
      energy:  { this: avg(thisWeek.map(e => e.energy),  ENERGY_MAP),  last: avg(lastWeek.map(e => e.energy),  ENERGY_MAP)  },
      emotion: { this: avg(thisWeek.map(e => e.emotion), EMOTION_MAP), last: avg(lastWeek.map(e => e.emotion), EMOTION_MAP) },
      clarity: { this: avg(thisWeek.map(e => e.clarity), CLARITY_MAP), last: avg(lastWeek.map(e => e.clarity), CLARITY_MAP) },
    }
  }, [entries])

  if (!stats) return null

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: EASE_CALM, delay: 0.05 }}
      style={{ border: '1px solid var(--flz-border)', borderRadius: '4px', padding: '20px 24px', marginBottom: '36px' }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
        <p style={{ margin: 0, fontFamily: 'Inter, system-ui, sans-serif', fontSize: '0.8125rem', color: 'var(--flz-text)', letterSpacing: '-0.01em' }}>This week vs last week</p>
        <span style={{ fontFamily: 'Inter, system-ui, sans-serif', fontSize: '0.6rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--flz-text-muted)', border: '1px solid var(--flz-border)', borderRadius: '2px', padding: '1px 5px' }}>Pro</span>
      </div>
      {[
        { label: 'Energy',  key: 'energy'  },
        { label: 'Emotion', key: 'emotion' },
        { label: 'Clarity', key: 'clarity' },
      ].map(({ label, key }) => {
        const diff  = stats[key].this - stats[key].last
        const arrow = diff > 0.15 ? '↑' : diff < -0.15 ? '↓' : '→'
        const color = diff > 0.15 ? '#22c55e' : diff < -0.15 ? '#ef4444' : 'var(--flz-text-muted)'
        const pct   = Math.round(Math.abs(diff) / 2 * 100)
        return (
          <div key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--flz-border-soft)' }}>
            <span style={{ fontFamily: 'Inter, system-ui, sans-serif', fontSize: '0.8rem', color: 'var(--flz-text-muted)' }}>{label}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontFamily: 'Inter, system-ui, sans-serif', fontSize: '0.875rem', color, fontWeight: 500 }}>{arrow}</span>
              {pct > 0 && <span style={{ fontFamily: 'Inter, system-ui, sans-serif', fontSize: '0.75rem', color: 'var(--flz-text-muted)' }}>{pct}%</span>}
              {pct === 0 && <span style={{ fontFamily: 'Inter, system-ui, sans-serif', fontSize: '0.75rem', color: 'var(--flz-text-muted)' }}>same</span>}
            </div>
          </div>
        )
      })}
    </motion.div>
  )
}

// ── Focus area filter + stats ─────────────────────────────────────────────────

function FocusAreaStats({ area, entries }) {
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(false)
  const [fetched, setFetched] = useState(false)

  const stats = useMemo(() => {
    function top(arr) {
      const freq = {}
      arr.forEach(v => v && (freq[v] = (freq[v] || 0) + 1))
      return Object.entries(freq).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '—'
    }
    return {
      energy:  top(entries.map(e => e.energy)),
      emotion: top(entries.map(e => e.emotion)),
      clarity: top(entries.map(e => e.clarity)),
    }
  }, [entries])

  async function loadSummary() {
    if (fetched || entries.length < 3) return
    setLoading(true)
    try {
      const res  = await fetch('/api/pattern', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ entries }) })
      const data = await res.json()
      setSummary(data.summary ?? null)
    } catch { setSummary(null) }
    setLoading(false)
    setFetched(true)
  }

  useEffect(() => { setSummary(null); setFetched(false) }, [area])

  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: EASE_CALM }}
      style={{ border: '1px solid var(--flz-border)', borderRadius: '4px', padding: '18px 20px', marginBottom: '28px', background: 'var(--flz-tag-bg)' }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
        <div>
          <p style={{ margin: '0 0 3px', fontFamily: 'Inter, system-ui, sans-serif', fontSize: '0.875rem', color: 'var(--flz-text)', letterSpacing: '-0.01em', fontWeight: 500 }}>{area}</p>
          <p style={{ margin: 0, fontFamily: 'Inter, system-ui, sans-serif', fontSize: '0.75rem', color: 'var(--flz-text-muted)' }}>{entries.length} {entries.length === 1 ? 'entry' : 'entries'} tagged</p>
        </div>
        {entries.length >= 3 && !fetched && (
          <button onClick={loadSummary} disabled={loading}
            style={{ fontFamily: 'Inter, system-ui, sans-serif', fontSize: '0.72rem', color: 'var(--flz-text-muted)', background: 'none', border: '1px solid var(--flz-border)', borderRadius: '2px', padding: '4px 10px', cursor: loading ? 'default' : 'pointer', opacity: loading ? 0.5 : 1, transition: 'all 0.15s' }}
            onMouseEnter={e => { if (!loading) { e.currentTarget.style.borderColor = 'var(--flz-text)'; e.currentTarget.style.color = 'var(--flz-text)' }}}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--flz-border)'; e.currentTarget.style.color = 'var(--flz-text-muted)' }}
          >{loading ? 'Loading…' : 'Pattern insight'}</button>
        )}
      </div>

      {/* Mini stats */}
      <div style={{ display: 'flex', gap: '20px', marginBottom: summary ? '14px' : 0 }}>
        {[['Energy', stats.energy], ['Emotion', stats.emotion], ['Clarity', stats.clarity]].map(([label, val]) => (
          <div key={label}>
            <p style={{ margin: '0 0 2px', fontFamily: 'Inter, system-ui, sans-serif', fontSize: '0.62rem', letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--flz-text-muted)' }}>{label}</p>
            <p style={{ margin: 0, fontFamily: 'Inter, system-ui, sans-serif', fontSize: '0.8125rem', color: 'var(--flz-text)', fontWeight: 500, textTransform: 'capitalize' }}>{val}</p>
          </div>
        ))}
      </div>

      {/* Pattern summary */}
      {summary && (
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}
          style={{ margin: '14px 0 0', fontFamily: 'Inter, system-ui, sans-serif', fontSize: '0.875rem', color: 'var(--flz-text)', lineHeight: 1.8, borderTop: '1px solid var(--flz-border)', paddingTop: '14px' }}
        >{summary}</motion.p>
      )}
    </motion.div>
  )
}

// ── Dimension filter ──────────────────────────────────────────────────────────

function DimensionFilter({ filter, onChange }) {
  const opts = {
    energy:  ['low', 'medium', 'high'],
    emotion: ['positive', 'negative', 'neutral', 'mixed'],
    clarity: ['confused', 'reflective', 'focused'],
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}
      style={{ marginBottom: '28px', display: 'flex', flexDirection: 'column', gap: '10px' }}
    >
      {Object.entries(opts).map(([dim, values]) => (
        <div key={dim} style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span style={{ fontFamily: 'Inter, system-ui, sans-serif', fontSize: '0.68rem', color: 'var(--flz-text-muted)', letterSpacing: '0.06em', textTransform: 'uppercase', width: '52px', flexShrink: 0 }}>{dim}</span>
          {values.map(v => {
            const active = filter[dim] === v
            return (
              <button key={v} onClick={() => onChange({ ...filter, [dim]: active ? null : v })}
                style={{ fontFamily: 'Inter, system-ui, sans-serif', fontSize: '0.72rem', padding: '3px 10px', borderRadius: '20px', cursor: 'pointer', transition: 'all 0.15s', background: active ? 'var(--flz-text)' : 'transparent', color: active ? 'var(--flz-bg)' : 'var(--flz-text-muted)', border: `1px solid ${active ? 'var(--flz-text)' : 'var(--flz-border)'}` }}
                onMouseEnter={e => { if (!active) { e.currentTarget.style.borderColor = 'var(--flz-text)'; e.currentTarget.style.color = 'var(--flz-text)' } }}
                onMouseLeave={e => { if (!active) { e.currentTarget.style.borderColor = 'var(--flz-border)'; e.currentTarget.style.color = 'var(--flz-text-muted)' } }}
              >{v}</button>
            )
          })}
        </div>
      ))}
    </motion.div>
  )
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(iso) {
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }).format(new Date(iso))
}

function DimensionTag({ label, value }) {
  if (!value) return null
  return <span style={{ fontFamily: 'Inter, system-ui, sans-serif', fontSize: '0.68rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--flz-text-muted)' }}>{label}: {value}</span>
}

function EntryRow({ entry, index, onSelect }) {
  const input = entry.input.length > 72 ? entry.input.slice(0, 72).trimEnd() + '…' : entry.input
  return (
    <motion.div custom={index} initial="hidden" animate="visible"
      variants={{ hidden: { opacity: 0, y: 10 }, visible: i => ({ opacity: 1, y: 0, transition: { delay: 0.05 + i * 0.05, duration: 0.5, ease: EASE_CALM } }) }}
      style={{ borderBottom: '1px solid var(--flz-border-soft)', padding: '22px 0', cursor: 'pointer' }}
      onClick={() => onSelect(entry)}
      onMouseEnter={e => e.currentTarget.style.opacity = '0.65'}
      onMouseLeave={e => e.currentTarget.style.opacity = '1'}
    >
      <p style={{ margin: '0 0 6px', fontFamily: 'Inter, system-ui, sans-serif', fontSize: '0.72rem', color: 'var(--flz-text-muted)', letterSpacing: '0.02em' }}>{formatDate(entry.created_at)}</p>
      <p style={{ margin: '0 0 6px', fontFamily: 'Inter, system-ui, sans-serif', fontSize: '0.9375rem', fontWeight: 400, color: 'var(--flz-text)', letterSpacing: '-0.015em', lineHeight: 1.4 }}>
        {entry.state_label ? `You were in ${entry.state_label}.` : 'A moment of reflection.'}
      </p>
      <p style={{ margin: '0 0 10px', fontFamily: 'Inter, system-ui, sans-serif', fontSize: '0.8125rem', color: 'var(--flz-text-dim)', lineHeight: 1.6, fontStyle: 'italic' }}>&ldquo;{input}&rdquo;</p>
      <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
        <DimensionTag label="energy"  value={entry.energy}  />
        <DimensionTag label="emotion" value={entry.emotion} />
        <DimensionTag label="clarity" value={entry.clarity} />
      </div>
    </motion.div>
  )
}

// ── Main history screen ───────────────────────────────────────────────────────

export default function HistoryScreen({ user, onSelectEntry, onSignOut, isPro, userFocusAreas = [] }) {
  const [entries, setEntries]       = useState([])
  const [loading, setLoading]       = useState(true)
  const [showFilter, setShowFilter] = useState(false)
  const [filter, setFilter]         = useState({ energy: null, emotion: null, clarity: null })
  const [focusFilter, setFocusFilter] = useState(null) // active focus area filter

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase.from('entries').select('*').order('created_at', { ascending: false })
      if (error) console.error('[FLZ] History fetch error:', error)
      else setEntries(data || [])
      setLoading(false)
    }
    load()
  }, [])

  const streak = calcStreak(entries)

  const filteredEntries = useMemo(() => {
    return entries.filter(e =>
      (!filter.energy   || e.energy  === filter.energy)  &&
      (!filter.emotion  || e.emotion === filter.emotion) &&
      (!filter.clarity  || e.clarity === filter.clarity) &&
      (!focusFilter     || (Array.isArray(e.focus_areas) && e.focus_areas.includes(focusFilter)))
    )
  }, [entries, filter, focusFilter])

  const focusFilteredEntries = useMemo(() => {
    if (!focusFilter) return []
    return entries.filter(e => Array.isArray(e.focus_areas) && e.focus_areas.includes(focusFilter))
  }, [entries, focusFilter])

  const hasFilter = Object.values(filter).some(Boolean) || !!focusFilter

  return (
    <div style={{ minHeight: '100vh', paddingTop: '96px', paddingBottom: '80px', position: 'relative', zIndex: 10 }}>
      <div style={{ maxWidth: '580px', margin: '0 auto', padding: '0 clamp(20px, 5vw, 32px)' }}>

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: EASE_CALM, delay: 0.1 }} style={{ paddingBottom: '44px' }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <div>
              <h2 style={{ fontFamily: 'Inter, system-ui, sans-serif', fontSize: 'clamp(1.5rem, 3.5vw, 2rem)', fontWeight: 400, color: 'var(--flz-text)', letterSpacing: '-0.03em', lineHeight: 1.3, margin: '0 0 8px' }}>
                Your growth history
              </h2>
              <p style={{ fontFamily: 'Inter, system-ui, sans-serif', fontSize: '0.8125rem', color: 'var(--flz-text-muted)', margin: 0 }}>
                {entries.length > 0 ? `${entries.length} moment${entries.length === 1 ? '' : 's'} recorded` : 'No entries yet'}
              </p>
            </div>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
              {/* Filter button */}
              {entries.length > 0 && (
                <button onClick={() => setShowFilter(f => !f)}
                  style={{ marginTop: '4px', background: hasFilter ? 'var(--flz-text)' : 'none', border: `1px solid ${hasFilter ? 'var(--flz-text)' : 'var(--flz-border)'}`, borderRadius: '4px', padding: '6px 12px', fontFamily: 'Inter, system-ui, sans-serif', fontSize: '0.72rem', color: hasFilter ? 'var(--flz-bg)' : 'var(--flz-text-muted)', cursor: 'pointer', transition: 'all 0.15s', letterSpacing: '0.02em' }}
                  onMouseEnter={e => { if (!hasFilter) e.currentTarget.style.borderColor = 'var(--flz-text)' }}
                  onMouseLeave={e => { if (!hasFilter) e.currentTarget.style.borderColor = 'var(--flz-border)' }}
                >
                  {hasFilter ? 'Filtered' : 'Filter'}
                </button>
              )}
              {/* Streak badge */}
              {streak > 0 && (
                <motion.div initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, ease: EASE_CALM, delay: 0.3 }}
                  style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '10px 16px', border: '1px solid var(--flz-border)', borderRadius: '4px', flexShrink: 0 }}
                >
                  <span style={{ fontSize: '1.2rem', lineHeight: 1 }}>🔥</span>
                  <span style={{ fontFamily: 'Inter, system-ui, sans-serif', fontSize: '1rem', fontWeight: 500, color: 'var(--flz-text)', lineHeight: 1.2, marginTop: '4px' }}>{streak}</span>
                  <span style={{ fontFamily: 'Inter, system-ui, sans-serif', fontSize: '0.6rem', letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--flz-text-muted)', marginTop: '2px' }}>{streak === 1 ? 'day' : 'days'}</span>
                </motion.div>
              )}
            </div>
          </div>
        </motion.div>

        {loading ? (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 0.4 }} style={{ fontFamily: 'Inter, system-ui, sans-serif', fontSize: '0.875rem', color: 'var(--flz-text)' }}>Loading…</motion.p>
        ) : entries.length === 0 ? (
          <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: EASE_CALM, delay: 0.3 }}
            style={{ fontFamily: 'Inter, system-ui, sans-serif', fontSize: '0.9rem', color: 'var(--flz-text-muted)', lineHeight: 1.7, borderTop: '1px solid var(--flz-border-soft)', paddingTop: '24px' }}
          >
            Start by telling FLZ what's on your mind.<br />Your entries will appear here.
          </motion.p>
        ) : (
          <>
            {/* Focus area chips */}
            {userFocusAreas.length > 0 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}
                style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '24px', alignItems: 'center' }}
              >
                <span style={{ fontFamily: 'Inter, system-ui, sans-serif', fontSize: '0.68rem', color: 'var(--flz-text-muted)', letterSpacing: '0.06em', textTransform: 'uppercase', marginRight: '2px' }}>Focus</span>
                {userFocusAreas.map(area => {
                  const active = focusFilter === area
                  return (
                    <button key={area} onClick={() => setFocusFilter(active ? null : area)}
                      style={{ fontFamily: 'Inter, system-ui, sans-serif', fontSize: '0.75rem', padding: '4px 12px', borderRadius: '20px', cursor: 'pointer', transition: 'all 0.15s', background: active ? 'var(--flz-text)' : 'transparent', color: active ? 'var(--flz-bg)' : 'var(--flz-text)', border: `1px solid ${active ? 'var(--flz-text)' : 'var(--flz-border-input)'}` }}
                      onMouseEnter={e => { if (!active) e.currentTarget.style.borderColor = 'var(--flz-text)' }}
                      onMouseLeave={e => { if (!active) e.currentTarget.style.borderColor = 'var(--flz-border-input)' }}
                    >{area}</button>
                  )
                })}
              </motion.div>
            )}

            {/* Focus area stats card */}
            <AnimatePresence>
              {focusFilter && focusFilteredEntries.length > 0 && (
                <motion.div key={focusFilter} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
                  <FocusAreaStats area={focusFilter} entries={focusFilteredEntries} />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Filter panel */}
            <AnimatePresence>
              {showFilter && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.3, ease: EASE_CALM }} style={{ overflow: 'hidden' }}>
                  <DimensionFilter filter={filter} onChange={f => { setFilter(f); setShowFilter(false) }} />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Active filter chips */}
            {hasFilter && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '20px', alignItems: 'center' }}>
                {Object.entries(filter).filter(([, v]) => v).map(([k, v]) => (
                  <button key={k} onClick={() => setFilter(f => ({ ...f, [k]: null }))}
                    style={{ fontFamily: 'Inter, system-ui, sans-serif', fontSize: '0.72rem', padding: '3px 10px', borderRadius: '20px', background: 'var(--flz-text)', color: 'var(--flz-bg)', border: 'none', cursor: 'pointer' }}
                  >{k}: {v} ×</button>
                ))}
                <button onClick={() => { setFilter({ energy: null, emotion: null, clarity: null }); setFocusFilter(null) }}
                  style={{ fontFamily: 'Inter, system-ui, sans-serif', fontSize: '0.72rem', color: 'var(--flz-text-muted)', background: 'none', border: 'none', cursor: 'pointer', padding: '3px 4px' }}
                >Clear all</button>
              </motion.div>
            )}

            {/* Calendar */}
            <CalendarView entries={entries} />

            {/* Dimension chart */}
            {entries.length >= 2 && <DimensionChart entries={entries} isPro={isPro} />}

            {/* PRO: Weekly summary */}
            {isPro && <WeeklySummary entries={entries} />}

            {/* PRO: Monthly deep dive */}
            {isPro && <MonthlyDeepDive entries={entries} />}

            {/* PRO: Week comparison */}
            {isPro && entries.length >= 4 && <WeekComparison entries={entries} />}

            {/* PRO: Most common states */}
            {isPro && entries.length >= 3 && <MostCommonStates entries={entries} />}

            {/* Pattern insight — 3+ entries */}
            {entries.length >= 3 && <PatternSummary entries={entries} />}

            {/* Entry list */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3, delay: 0.2 }} style={{ borderTop: '1px solid var(--flz-border-soft)' }}>
              {filteredEntries.length === 0
                ? <p style={{ fontFamily: 'Inter, system-ui, sans-serif', fontSize: '0.875rem', color: 'var(--flz-text-muted)', paddingTop: '24px' }}>No entries match this filter.</p>
                : filteredEntries.map((entry, i) => <EntryRow key={entry.id} entry={entry} index={i} onSelect={onSelectEntry} />)
              }
            </motion.div>
          </>
        )}

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5, delay: 0.8 }} style={{ paddingTop: '48px', textAlign: 'center' }}>
          <button onClick={onSignOut} style={{ background: 'none', border: 'none', fontFamily: 'Inter, system-ui, sans-serif', fontSize: '0.75rem', color: 'var(--flz-text-muted)', cursor: 'pointer', letterSpacing: '0.01em', padding: '8px 0', transition: 'color 0.2s' }}
            onMouseEnter={e => e.target.style.color = 'var(--flz-text)'}
            onMouseLeave={e => e.target.style.color = 'var(--flz-text-muted)'}
          >Sign out</button>
        </motion.div>
      </div>
    </div>
  )
}
