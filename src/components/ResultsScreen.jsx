import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const EASE_CALM = [0.25, 0.46, 0.45, 0.94]

const PATH_META = [
  { id: 'understand', num: '01', title: 'Understand Me' },
  { id: 'question',   num: '02', title: 'Question Me'   },
  { id: 'guide',      num: '03', title: 'Guide Me'      },
  { id: 'elevate',    num: '04', title: 'Elevate Me'    },
  { id: 'move',       num: '05', title: 'Move Me'       },
]

// ── Dimension tags ────────────────────────────────────────────────────────────

const DIM_COLORS = {
  // energy
  high:      { bg: 'rgba(34,197,94,0.08)',  border: 'rgba(34,197,94,0.25)',  text: '#15803d' },
  medium:    { bg: 'rgba(234,179,8,0.08)',  border: 'rgba(234,179,8,0.25)',  text: '#a16207' },
  low:       { bg: 'rgba(99,102,241,0.08)', border: 'rgba(99,102,241,0.25)', text: '#4338ca' },
  // emotion
  positive:  { bg: 'rgba(34,197,94,0.08)',  border: 'rgba(34,197,94,0.25)',  text: '#15803d' },
  negative:  { bg: 'rgba(239,68,68,0.08)',  border: 'rgba(239,68,68,0.25)',  text: '#b91c1c' },
  neutral:   { bg: 'rgba(0,0,0,0.04)',      border: 'rgba(0,0,0,0.1)',        text: '#555' },
  mixed:     { bg: 'rgba(234,179,8,0.08)',  border: 'rgba(234,179,8,0.25)',  text: '#a16207' },
  // clarity
  focused:   { bg: 'rgba(34,197,94,0.08)',  border: 'rgba(34,197,94,0.25)',  text: '#15803d' },
  reflective:{ bg: 'rgba(99,102,241,0.08)', border: 'rgba(99,102,241,0.25)', text: '#4338ca' },
  confused:  { bg: 'rgba(239,68,68,0.08)',  border: 'rgba(239,68,68,0.25)',  text: '#b91c1c' },
}

function DimensionChip({ label, value }) {
  if (!value) return null
  const colors = DIM_COLORS[value] ?? { bg: 'var(--flz-tag-bg)', border: 'var(--flz-tag-border)', text: 'var(--flz-text-dim)' }
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '5px',
      padding: '3px 9px',
      borderRadius: '20px',
      background: colors.bg,
      border: `1px solid ${colors.border}`,
      fontFamily: 'Inter, system-ui, sans-serif',
      fontSize: '0.68rem',
      letterSpacing: '0.06em',
      textTransform: 'uppercase',
      color: colors.text,
    }}>
      <span style={{ opacity: 0.55, fontSize: '0.6rem' }}>{label}</span>
      {value}
    </span>
  )
}

// ── Content renderers ─────────────────────────────────────────────────────────

function BodyText({ text }) {
  return (
    <p style={{ margin: 0, fontSize: '0.9375rem', lineHeight: 1.75, color: 'var(--flz-text)' }}>
      {text}
    </p>
  )
}

function QuestionItem({ question, index, isLoggedIn, onSaveAnswer }) {
  const [expanded, setExpanded] = useState(false)
  const [answer, setAnswer]     = useState('')
  const [saved, setSaved]       = useState(false)
  const [saving, setSaving]     = useState(false)

  async function handleSave() {
    if (!answer.trim() || saving) return
    setSaving(true)
    const err = await onSaveAnswer(question, answer.trim())
    if (!err) { setSaved(true); setExpanded(false) }
    setSaving(false)
  }

  return (
    <li style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
      <span style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: 'var(--flz-text-faint)', paddingTop: '3px', flexShrink: 0 }}>
        {String(index + 1).padStart(2, '0')}
      </span>
      <div style={{ flex: 1 }}>
        <span style={{ fontSize: '0.9375rem', lineHeight: 1.7, color: 'var(--flz-text)' }}>{question}</span>

        {/* Answer button — logged-in only */}
        {isLoggedIn && !saved && !expanded && (
          <div style={{ marginTop: '8px' }}>
            <button
              onClick={() => setExpanded(true)}
              style={{
                background: 'none', border: 'none', padding: 0,
                fontFamily: 'Inter, system-ui, sans-serif',
                fontSize: '0.75rem', color: 'var(--flz-text-muted)',
                cursor: 'pointer', letterSpacing: '0.02em',
                transition: 'color 0.2s',
              }}
              onMouseEnter={e => e.target.style.color = 'var(--flz-text)'}
              onMouseLeave={e => e.target.style.color = 'var(--flz-text-muted)'}
            >
              Answer → save to journal
            </button>
          </div>
        )}

        {/* Saved confirmation */}
        {saved && (
          <p style={{
            margin: '8px 0 0',
            fontFamily: 'Inter, system-ui, sans-serif',
            fontSize: '0.75rem', color: 'var(--flz-text-muted)', letterSpacing: '0.01em',
          }}>
            Saved to journal ✓
          </p>
        )}

        {/* Answer input */}
        {expanded && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            style={{ marginTop: '12px' }}
          >
            <textarea
              autoFocus
              value={answer}
              onChange={e => setAnswer(e.target.value)}
              placeholder="Write your reflection…"
              rows={4}
              style={{
                width: '100%', boxSizing: 'border-box',
                background: 'var(--flz-tag-bg)',
                border: '1px solid var(--flz-border)',
                borderRadius: '4px',
                outline: 'none',
                fontFamily: 'Inter, system-ui, sans-serif',
                fontSize: '0.875rem', color: 'var(--flz-text)',
                lineHeight: 1.7, padding: '12px',
                resize: 'none', caretColor: 'var(--flz-text)',
              }}
            />
            <div style={{ display: 'flex', gap: '12px', marginTop: '10px', alignItems: 'center' }}>
              <button
                onClick={handleSave}
                disabled={!answer.trim() || saving}
                style={{
                  background: 'var(--flz-text)', border: 'none', borderRadius: '2px',
                  padding: '7px 18px',
                  fontFamily: 'Inter, system-ui, sans-serif',
                  fontSize: '0.8rem', color: 'var(--flz-bg)',
                  cursor: !answer.trim() || saving ? 'default' : 'pointer',
                  opacity: !answer.trim() || saving ? 0.45 : 1,
                  transition: 'opacity 0.2s',
                }}
              >
                {saving ? 'Saving…' : 'Save to journal'}
              </button>
              <button
                onClick={() => { setExpanded(false); setAnswer('') }}
                style={{
                  background: 'none', border: 'none', padding: 0,
                  fontFamily: 'Inter, system-ui, sans-serif',
                  fontSize: '0.8rem', color: 'var(--flz-text-muted)',
                  cursor: 'pointer', transition: 'color 0.2s',
                }}
                onMouseEnter={e => e.target.style.color = 'var(--flz-text)'}
                onMouseLeave={e => e.target.style.color = 'var(--flz-text-muted)'}
              >
                Cancel
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </li>
  )
}

function QuestionList({ questions, isLoggedIn, onSaveAnswer }) {
  return (
    <ol style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {questions?.map((q, i) => (
        <QuestionItem
          key={i}
          question={q}
          index={i}
          isLoggedIn={isLoggedIn}
          onSaveAnswer={onSaveAnswer}
        />
      ))}
    </ol>
  )
}

function ResourceList({ resources }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {resources?.map((r, i) => (
        <div key={i}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', marginBottom: '5px' }}>
            <span style={{
              fontSize: '0.6rem', letterSpacing: '0.12em',
              textTransform: 'uppercase', color: 'var(--flz-text-muted)',
              fontFamily: 'Inter, system-ui, sans-serif', flexShrink: 0,
            }}>
              {r.type}
            </span>
            <span style={{ fontSize: '0.9375rem', color: 'var(--flz-text)', fontWeight: 400, lineHeight: 1.4 }}>
              {r.title}
            </span>
          </div>
          <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--flz-text-dim)', lineHeight: 1.65 }}>
            {r.description}
          </p>
        </div>
      ))}
    </div>
  )
}

function ActionList({ actions }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '13px' }}>
      {actions?.map((a, i) => (
        <div key={i} style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
          <span style={{ color: 'var(--flz-text)', fontSize: '0.8rem', paddingTop: '3px', flexShrink: 0 }}>→</span>
          <span style={{ fontSize: '0.9375rem', lineHeight: 1.7, color: 'var(--flz-text)' }}>{a}</span>
        </div>
      ))}
    </div>
  )
}

function PathContent({ id, data, isLoggedIn, onSaveAnswer }) {
  if (!data) return null
  if (id === 'understand' || id === 'elevate') return <BodyText text={data.body} />
  if (id === 'question') return <QuestionList questions={data.questions} isLoggedIn={isLoggedIn} onSaveAnswer={onSaveAnswer} />
  if (id === 'guide')    return <ResourceList resources={data.resources} />
  if (id === 'move')     return <ActionList actions={data.actions} />
  return null
}

// ── Path accordion item ───────────────────────────────────────────────────────

function PathItem({ meta, data, isOpen, onToggle, index, isLoggedIn, onSaveAnswer }) {
  return (
    <motion.div
      custom={index}
      initial="hidden"
      animate="visible"
      variants={{
        hidden: { opacity: 0, y: 14 },
        visible: i => ({
          opacity: 1, y: 0,
          transition: { delay: 0.3 + i * 0.1, duration: 0.65, ease: EASE_CALM },
        }),
      }}
      style={{ borderBottom: '1px solid var(--flz-border)' }}
    >
      <button
        onClick={onToggle}
        style={{
          width: '100%', background: 'none', border: 'none',
          padding: '22px 0', cursor: 'pointer',
          display: 'flex', alignItems: 'flex-start', gap: '16px', textAlign: 'left',
        }}
      >
        <span style={{
          fontFamily: 'monospace', fontSize: '0.7rem',
          color: 'var(--flz-text-faint)', paddingTop: '3px', flexShrink: 0, letterSpacing: '0.04em',
        }}>
          {meta.num}
        </span>

        <div style={{ flex: 1 }}>
          <p style={{
            margin: '0 0 4px',
            fontFamily: 'Inter, system-ui, sans-serif',
            fontSize: '1rem', fontWeight: 400, color: 'var(--flz-text)', letterSpacing: '-0.015em',
          }}>
            {meta.title}
          </p>
          <p style={{
            margin: 0, fontFamily: 'Inter, system-ui, sans-serif',
            fontSize: '0.8125rem', color: 'var(--flz-text-dim)', lineHeight: 1.5,
          }}>
            {data?.headline}
          </p>
        </div>

        <span style={{
          fontFamily: 'Inter, system-ui, sans-serif', fontSize: '1.1rem',
          color: 'var(--flz-text-muted)', flexShrink: 0, paddingTop: '1px',
          lineHeight: 1, transition: 'color 0.2s',
        }}>
          {isOpen ? '−' : '+'}
        </span>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.45, ease: EASE_CALM }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{ paddingBottom: '28px' }}>
              <PathContent id={meta.id} data={data} isLoggedIn={isLoggedIn} onSaveAnswer={onSaveAnswer} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// ── Main results screen ───────────────────────────────────────────────────────

export default function ResultsScreen({
  analysis, onReset, isSaved, isLoggedIn, onSavePrompt, onSaveEntry, onBackToHistory, isHistorical, onSaveJournalEntry,
}) {
  const [openPath, setOpenPath] = useState('understand')
  const [saving, setSaving]     = useState(false)

  async function handleSaveEntry() {
    if (saving) return
    setSaving(true)
    await onSaveEntry?.()
    setSaving(false)
  }

  function toggle(id) {
    setOpenPath(prev => (prev === id ? null : id))
  }

  async function handleSaveAnswer(question, answer) {
    if (!onSaveJournalEntry) return 'no handler'
    return await onSaveJournalEntry({
      type: 'question',
      question,
      content: answer,
      stateLabel: analysis?.stateLabel,
    })
  }

  const stateLabel = analysis?.stateLabel ?? 'a reflective moment'
  const dims = analysis?.dimensions ?? {}

  return (
    <div style={{ minHeight: '100vh', paddingTop: '96px', paddingBottom: '80px', position: 'relative', zIndex: 10 }}>
      <div style={{ maxWidth: '580px', margin: '0 auto', padding: '0 32px' }}>

        {/* State label + dimension chips */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: EASE_CALM, delay: 0.1 }}
          style={{ textAlign: 'center', paddingBottom: '48px' }}
        >
          <h2 style={{
            fontFamily: 'Inter, system-ui, sans-serif',
            fontSize: 'clamp(1.5rem, 3.5vw, 2rem)',
            fontWeight: 400, color: 'var(--flz-text)',
            letterSpacing: '-0.03em', lineHeight: 1.3,
            margin: '0 0 16px',
          }}>
            You seem to be in {stateLabel}.
          </h2>

          {/* Dimension chips */}
          {(dims.energy || dims.emotion || dims.clarity) && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: EASE_CALM, delay: 0.4 }}
              style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '12px' }}
            >
              <DimensionChip label="energy"  value={dims.energy}  />
              <DimensionChip label="emotion" value={dims.emotion} />
              <DimensionChip label="clarity" value={dims.clarity} />
            </motion.div>
          )}

          <p style={{
            fontFamily: 'Inter, system-ui, sans-serif',
            fontSize: '0.8125rem', color: 'var(--flz-text-muted)',
            margin: 0, letterSpacing: '0.01em',
          }}>
            Five ways to work with this moment.
          </p>
        </motion.div>

        {/* Path list */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.25 }}
          style={{ borderTop: '1px solid var(--flz-border)' }}
        >
          {PATH_META.map((meta, i) => (
            <PathItem
              key={meta.id}
              meta={meta}
              data={analysis?.paths?.[meta.id]}
              isOpen={openPath === meta.id}
              onToggle={() => toggle(meta.id)}
              index={i}
              isLoggedIn={isLoggedIn}
              onSaveAnswer={handleSaveAnswer}
            />
          ))}
        </motion.div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 1 }}
          style={{ textAlign: 'center', paddingTop: '52px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}
        >
          {/* Save this moment — all users on fresh assessments */}
          {!isHistorical && (
            isSaved ? (
              <p style={{
                fontFamily: 'Inter, system-ui, sans-serif',
                fontSize: '0.875rem', color: 'var(--flz-text-muted)',
                margin: 0, letterSpacing: '0.01em',
              }}>
                Saved to your history ✓
              </p>
            ) : (
              <button
                onClick={isLoggedIn ? handleSaveEntry : onSavePrompt}
                disabled={saving}
                style={{
                  background: 'none',
                  border: '1px solid var(--flz-border-input)',
                  borderRadius: '2px',
                  fontFamily: 'Inter, system-ui, sans-serif',
                  fontSize: '0.875rem', color: 'var(--flz-text)',
                  cursor: saving ? 'default' : 'pointer',
                  letterSpacing: '0.02em',
                  padding: '10px 22px',
                  opacity: saving ? 0.5 : 1,
                  transition: 'all 0.2s',
                }}
                onMouseEnter={e => { if (!saving) { e.currentTarget.style.background = 'var(--flz-text)'; e.currentTarget.style.color = 'var(--flz-bg)' } }}
                onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--flz-text)' }}
              >
                {saving ? 'Saving…' : 'Save this moment →'}
              </button>
            )
          )}

          <button
            onClick={isHistorical ? onBackToHistory : onReset}
            style={{
              background: 'none', border: 'none',
              fontFamily: 'Inter, system-ui, sans-serif',
              fontSize: '0.8125rem', color: 'var(--flz-text-muted)',
              cursor: 'pointer', letterSpacing: '0.01em',
              padding: '8px 0', transition: 'color 0.2s',
            }}
            onMouseEnter={e => e.target.style.color = 'var(--flz-text)'}
            onMouseLeave={e => e.target.style.color = 'var(--flz-text-muted)'}
          >
            {isHistorical ? '← Back to history' : '← Back to FLZ'}
          </button>
        </motion.div>

      </div>
    </div>
  )
}
