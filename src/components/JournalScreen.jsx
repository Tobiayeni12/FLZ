import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../lib/supabase'

const EASE_CALM = [0.25, 0.46, 0.45, 0.94]
const FREE_LIMIT = 30

// ── Compose panel (manual entry) ─────────────────────────────────────────────

function ComposePanel({ onSave, onClose }) {
  const [text, setText] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    if (!text.trim() || saving) return
    setSaving(true)
    await onSave(text.trim())
    setSaving(false)
    onClose()
  }

  function handleKeyDown(e) {
    if (e.key === 'Escape') onClose()
  }

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.2)', zIndex: 40 }}
      />

      {/* Panel */}
      <motion.div
        initial={{ opacity: 0, y: 48 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 48 }}
        transition={{ duration: 0.32, ease: EASE_CALM }}
        style={{
          position: 'fixed',
          bottom: 0, left: 0, right: 0,
          background: 'var(--flz-surface)',
          borderTop: '1px solid var(--flz-border)',
          padding: '24px 24px 40px',
          zIndex: 50,
          maxWidth: '640px',
          margin: '0 auto',
        }}
      >
        <p style={{
          fontFamily: 'Inter, system-ui, sans-serif',
          fontSize: '0.72rem', letterSpacing: '0.06em',
          textTransform: 'uppercase', color: 'var(--flz-text-muted)',
          margin: '0 0 14px',
        }}>
          New entry
        </p>

        <textarea
          autoFocus
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="What's on your mind…"
          rows={5}
          style={{
            width: '100%', boxSizing: 'border-box',
            background: 'transparent', border: 'none', outline: 'none',
            fontFamily: 'Inter, system-ui, sans-serif',
            fontSize: '0.9375rem', color: 'var(--flz-text)',
            lineHeight: 1.75, resize: 'none',
            caretColor: 'var(--flz-text)',
          }}
        />

        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          marginTop: '16px', borderTop: '1px solid var(--flz-border)', paddingTop: '16px',
        }}>
          <button
            onClick={onClose}
            style={{
              background: 'none', border: 'none',
              fontFamily: 'Inter, system-ui, sans-serif',
              fontSize: '0.8125rem', color: 'var(--flz-text-muted)',
              cursor: 'pointer', padding: 0, transition: 'color 0.2s',
            }}
            onMouseEnter={e => e.target.style.color = 'var(--flz-text)'}
            onMouseLeave={e => e.target.style.color = 'var(--flz-text-muted)'}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!text.trim() || saving}
            style={{
              background: 'var(--flz-text)', border: 'none', borderRadius: '2px',
              padding: '9px 22px',
              fontFamily: 'Inter, system-ui, sans-serif',
              fontSize: '0.8125rem', color: 'var(--flz-bg)',
              cursor: !text.trim() || saving ? 'default' : 'pointer',
              opacity: !text.trim() || saving ? 0.4 : 1,
              transition: 'opacity 0.2s',
            }}
          >
            {saving ? 'Saving…' : 'Save entry'}
          </button>
        </div>
      </motion.div>
    </>
  )
}

// ── Single journal entry row ───────────────────────────────────────────────────

function EntryCard({ entry, index }) {
  const [expanded, setExpanded] = useState(false)
  const isQuestion = entry.type === 'question'
  const isLong = entry.content.length > 160

  return (
    <motion.div
      custom={index}
      initial="hidden"
      animate="visible"
      variants={{
        hidden: { opacity: 0, y: 8 },
        visible: i => ({
          opacity: 1, y: 0,
          transition: { delay: 0.05 + i * 0.04, duration: 0.5, ease: EASE_CALM },
        }),
      }}
      style={{
        borderBottom: '1px solid var(--flz-border-soft)',
        padding: '22px 0',
        cursor: isLong ? 'pointer' : 'default',
      }}
      onClick={() => isLong && setExpanded(e => !e)}
    >
      {/* Meta row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
        <span style={{
          fontFamily: 'Inter, system-ui, sans-serif',
          fontSize: '0.62rem', letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: 'var(--flz-text-muted)',
          padding: '2px 8px',
          border: '1px solid var(--flz-border)',
          borderRadius: '20px',
        }}>
          {isQuestion ? 'Reflection' : 'Manual'}
        </span>
        <span style={{
          fontFamily: 'Inter, system-ui, sans-serif',
          fontSize: '0.72rem', color: 'var(--flz-text-muted)',
        }}>
          {new Date(entry.created_at).toLocaleDateString('en-US', {
            month: 'short', day: 'numeric', year: 'numeric',
          })}
        </span>
      </div>

      {/* Question prompt (if applicable) */}
      {isQuestion && entry.question && (
        <p style={{
          margin: '0 0 8px',
          fontFamily: 'Inter, system-ui, sans-serif',
          fontSize: '0.8125rem', color: 'var(--flz-text-dim)',
          lineHeight: 1.55, fontStyle: 'italic',
        }}>
          {entry.question}
        </p>
      )}

      {/* Content */}
      <p style={{
        margin: 0,
        fontFamily: 'Inter, system-ui, sans-serif',
        fontSize: '0.9375rem', color: 'var(--flz-text)',
        lineHeight: 1.75,
      }}>
        {isLong && !expanded
          ? entry.content.slice(0, 160).trimEnd() + '…'
          : entry.content}
      </p>

      {isLong && (
        <span style={{
          display: 'block', marginTop: '6px',
          fontFamily: 'Inter, system-ui, sans-serif',
          fontSize: '0.75rem', color: 'var(--flz-text-muted)',
        }}>
          {expanded ? 'Show less' : 'Read more'}
        </span>
      )}
    </motion.div>
  )
}

// ── Main journal screen ───────────────────────────────────────────────────────

export default function JournalScreen({ user, onBack, isPro }) {
  const [entries, setEntries]     = useState([])
  const [loading, setLoading]     = useState(true)
  const [composing, setComposing] = useState(false)
  const [search, setSearch]       = useState('')
  const [typeFilter, setTypeFilter] = useState('all') // all | question | manual

  const limit   = isPro ? Infinity : FREE_LIMIT
  const atLimit = entries.length >= limit

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase
        .from('journal_entries').select('*').order('created_at', { ascending: false })
      if (!error) setEntries(data || [])
      else console.error('[FLZ] Journal fetch error:', error)
      setLoading(false)
    }
    load()
  }, [])

  async function handleSaveManual(content) {
    if (!user) return
    const { data, error } = await supabase
      .from('journal_entries').insert({ user_id: user.id, type: 'manual', content }).select().single()
    if (!error && data) setEntries(prev => [data, ...prev])
    else console.error('[FLZ] Journal save error:', error)
  }

  const visibleEntries = useMemo(() => {
    return entries.filter(e => {
      const matchesType   = typeFilter === 'all' || e.type === typeFilter
      const matchesSearch = !search.trim() || e.content.toLowerCase().includes(search.toLowerCase()) || (e.question || '').toLowerCase().includes(search.toLowerCase())
      return matchesType && matchesSearch
    })
  }, [entries, typeFilter, search])

  const fillPct = isPro ? 100 : Math.min((entries.length / FREE_LIMIT) * 100, 100)

  return (
    <div style={{ minHeight: '100vh', paddingTop: '96px', paddingBottom: '120px', position: 'relative', zIndex: 10 }}>
      <div style={{ maxWidth: '580px', margin: '0 auto', padding: '0 32px' }}>

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: EASE_CALM, delay: 0.05 }} style={{ paddingBottom: '32px' }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <div>
              <h2 style={{ fontFamily: 'Inter, system-ui, sans-serif', fontSize: 'clamp(1.5rem, 3.5vw, 2rem)', fontWeight: 400, color: 'var(--flz-text)', letterSpacing: '-0.03em', lineHeight: 1.3, margin: '0 0 8px' }}>
                Journal
              </h2>
              <p style={{ fontFamily: 'Inter, system-ui, sans-serif', fontSize: '0.8125rem', color: 'var(--flz-text-muted)', margin: 0 }}>
                {loading ? '…' : isPro ? `${entries.length} entries · Unlimited` : `${entries.length} / ${FREE_LIMIT} entries`}
              </p>
            </div>

            {/* Progress bar — free only */}
            {!isPro && !loading && entries.length > 0 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '5px', paddingTop: '6px' }}
              >
                <div style={{ width: '72px', height: '3px', background: 'var(--flz-border)', borderRadius: '2px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${fillPct}%`, background: atLimit ? '#ef4444' : 'var(--flz-text)', borderRadius: '2px', transition: 'width 0.5s ease' }} />
                </div>
                {atLimit && <span style={{ fontFamily: 'Inter, system-ui, sans-serif', fontSize: '0.62rem', color: '#ef4444', letterSpacing: '0.04em' }}>Limit reached</span>}
              </motion.div>
            )}
          </div>

          {/* Search bar */}
          {!loading && entries.length > 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} style={{ marginTop: '20px' }}>
              <input
                type="text" value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search entries…"
                style={{ width: '100%', boxSizing: 'border-box', background: 'transparent', border: 'none', borderBottom: '1px solid var(--flz-border)', outline: 'none', fontFamily: 'Inter, system-ui, sans-serif', fontSize: '0.875rem', color: 'var(--flz-text)', padding: '8px 0', letterSpacing: '-0.01em', caretColor: 'var(--flz-text)' }}
              />
            </motion.div>
          )}

          {/* Type filter */}
          {!loading && entries.length > 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }}
              style={{ display: 'flex', gap: '8px', marginTop: '16px' }}
            >
              {['all', 'question', 'manual'].map(t => (
                <button key={t} onClick={() => setTypeFilter(t)}
                  style={{ fontFamily: 'Inter, system-ui, sans-serif', fontSize: '0.72rem', padding: '3px 12px', borderRadius: '20px', cursor: 'pointer', transition: 'all 0.15s', background: typeFilter === t ? 'var(--flz-text)' : 'transparent', color: typeFilter === t ? 'var(--flz-bg)' : 'var(--flz-text-muted)', border: `1px solid ${typeFilter === t ? 'var(--flz-text)' : 'var(--flz-border)'}`, textTransform: 'capitalize' }}
                >
                  {t === 'all' ? 'All' : t === 'question' ? 'Reflections' : 'Manual'}
                </button>
              ))}
            </motion.div>
          )}
        </motion.div>

        {/* Entry list */}
        {loading ? (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 0.4 }} style={{ fontFamily: 'Inter, system-ui, sans-serif', fontSize: '0.875rem', color: 'var(--flz-text)' }}>Loading…</motion.p>
        ) : entries.length === 0 ? (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: EASE_CALM, delay: 0.2 }}
            style={{ borderTop: '1px solid var(--flz-border-soft)', paddingTop: '28px' }}
          >
            <p style={{ fontFamily: 'Inter, system-ui, sans-serif', fontSize: '0.9rem', color: 'var(--flz-text-muted)', lineHeight: 1.8, margin: 0 }}>
              Your journal is empty.<br />
              Answer a question from any reflection, or tap <strong style={{ fontWeight: 500, color: 'var(--flz-text)' }}>+</strong> to write a manual entry.
            </p>
          </motion.div>
        ) : visibleEntries.length === 0 ? (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ fontFamily: 'Inter, system-ui, sans-serif', fontSize: '0.875rem', color: 'var(--flz-text-muted)', paddingTop: '24px' }}>
            No entries match your search.
          </motion.p>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3, delay: 0.1 }}
            style={{ borderTop: '1px solid var(--flz-border-soft)' }}
          >
            {visibleEntries.map((entry, i) => <EntryCard key={entry.id} entry={entry} index={i} />)}
          </motion.div>
        )}

        {/* Back */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5, delay: 0.5 }} style={{ paddingTop: '48px' }}>
          <button onClick={onBack}
            style={{ background: 'none', border: 'none', fontFamily: 'Inter, system-ui, sans-serif', fontSize: '0.8125rem', color: 'var(--flz-text-muted)', cursor: 'pointer', letterSpacing: '0.01em', padding: 0, transition: 'color 0.2s' }}
            onMouseEnter={e => e.target.style.color = 'var(--flz-text)'}
            onMouseLeave={e => e.target.style.color = 'var(--flz-text-muted)'}
          >← Back</button>
        </motion.div>
      </div>

      {/* + FAB */}
      <AnimatePresence>
        {!atLimit && !composing && (
          <motion.button initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} transition={{ duration: 0.2 }}
            onClick={() => setComposing(true)}
            style={{ position: 'fixed', bottom: '32px', right: '32px', width: '48px', height: '48px', borderRadius: '50%', background: 'var(--flz-text)', border: 'none', color: 'var(--flz-bg)', fontSize: '1.5rem', lineHeight: 1, cursor: 'pointer', zIndex: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 20px rgba(0,0,0,0.18)', transition: 'transform 0.15s, box-shadow 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.08)'; e.currentTarget.style.boxShadow = '0 6px 24px rgba(0,0,0,0.24)' }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.18)' }}
          >+</motion.button>
        )}
      </AnimatePresence>

      {/* Compose panel */}
      <AnimatePresence>
        {composing && <ComposePanel onSave={handleSaveManual} onClose={() => setComposing(false)} />}
      </AnimatePresence>
    </div>
  )
}
