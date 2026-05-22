import { useState } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '../lib/supabase'

const EASE_CALM = [0.25, 0.46, 0.45, 0.94]

const FOCUS_OPTIONS = [
  'Career', 'Relationships', 'Health', 'Creativity',
  'Mindfulness', 'Finances', 'Learning', 'Social',
]

export default function SettingsScreen({ user, userName, onSaveName, onBack, focusAreas, onSaveFocusAreas }) {
  const [name, setName]           = useState(userName || '')
  const [nameFocused, setNameFocused] = useState(false)
  const [nameSaved, setNameSaved] = useState(false)

  const [areas, setAreas]         = useState(focusAreas || [])
  const [areasSaved, setAreasSaved] = useState(false)
  const [areasSaving, setAreasSaving] = useState(false)

  function handleSaveName(e) {
    e?.preventDefault()
    if (!name.trim()) return
    onSaveName(name.trim())
    setNameSaved(true)
    setTimeout(() => setNameSaved(false), 2000)
  }

  function toggleArea(area) {
    setAreas(prev =>
      prev.includes(area) ? prev.filter(a => a !== area) : [...prev, area]
    )
    setAreasSaved(false)
  }

  async function handleSaveAreas() {
    if (!user || areasSaving) return
    setAreasSaving(true)
    const { error } = await supabase
      .from('profiles')
      .upsert({ id: user.id, focus_areas: areas, updated_at: new Date().toISOString() })
    if (!error) {
      onSaveFocusAreas(areas)
      setAreasSaved(true)
      setTimeout(() => setAreasSaved(false), 2000)
    }
    setAreasSaving(false)
  }

  return (
    <div style={{ minHeight: '100vh', paddingTop: '96px', paddingBottom: '80px', position: 'relative', zIndex: 10 }}>
      <div style={{ maxWidth: '480px', margin: '0 auto', padding: '0 32px' }}>

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: EASE_CALM, delay: 0.05 }} style={{ paddingBottom: '52px' }}
        >
          <h2 style={{ fontFamily: 'Inter, system-ui, sans-serif', fontSize: 'clamp(1.5rem, 3.5vw, 2rem)', fontWeight: 400, color: 'var(--flz-text)', letterSpacing: '-0.03em', lineHeight: 1.3, margin: '0 0 8px' }}>
            Settings
          </h2>
          <p style={{ fontFamily: 'Inter, system-ui, sans-serif', fontSize: '0.8125rem', color: 'var(--flz-text-muted)', margin: 0 }}>
            {user?.email}
          </p>
        </motion.div>

        {/* Name field */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: EASE_CALM, delay: 0.15 }}
          style={{ borderTop: '1px solid var(--flz-border)', paddingTop: '32px', paddingBottom: '40px' }}
        >
          <form onSubmit={handleSaveName}>
            <label style={{ display: 'block', fontFamily: 'Inter, system-ui, sans-serif', fontSize: '0.72rem', letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--flz-text-muted)', marginBottom: '10px' }}>
              Your name
            </label>
            <input
              type="text" value={name}
              onChange={e => { setName(e.target.value); setNameSaved(false) }}
              onKeyDown={e => e.key === 'Enter' && handleSaveName()}
              onFocus={() => setNameFocused(true)}
              onBlur={() => setNameFocused(false)}
              autoFocus
              style={{ width: '100%', boxSizing: 'border-box', background: 'transparent', outline: 'none', border: 'none', borderBottom: `1px solid ${nameFocused ? 'var(--flz-text)' : 'var(--flz-border-input)'}`, fontFamily: 'Inter, system-ui, sans-serif', fontSize: '1rem', color: 'var(--flz-text)', padding: '8px 0', letterSpacing: '-0.01em', transition: 'border-color 0.25s' }}
            />
            <p style={{ fontFamily: 'Inter, system-ui, sans-serif', fontSize: '0.75rem', color: 'var(--flz-text-muted)', margin: '10px 0 28px', lineHeight: 1.5 }}>
              This is how FLZ greets you on the home screen.
            </p>
            <button type="submit" disabled={!name.trim() || name.trim() === userName}
              style={{ padding: '11px 28px', background: nameSaved ? 'var(--flz-text)' : 'none', border: '1px solid var(--flz-border-input)', borderRadius: '2px', fontFamily: 'Inter, system-ui, sans-serif', fontSize: '0.875rem', color: nameSaved ? 'var(--flz-bg)' : 'var(--flz-text)', letterSpacing: '0.02em', cursor: (!name.trim() || name.trim() === userName) ? 'default' : 'pointer', opacity: (!name.trim() || name.trim() === userName) ? 0.4 : 1, transition: 'all 0.2s' }}
              onMouseEnter={e => { if (name.trim() && name.trim() !== userName && !nameSaved) { e.currentTarget.style.background = 'var(--flz-text)'; e.currentTarget.style.color = 'var(--flz-bg)' } }}
              onMouseLeave={e => { if (!nameSaved) { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--flz-text)' } }}
            >
              {nameSaved ? 'Saved ✓' : 'Save'}
            </button>
          </form>
        </motion.div>

        {/* Focus areas */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: EASE_CALM, delay: 0.25 }}
          style={{ borderTop: '1px solid var(--flz-border)', paddingTop: '32px' }}
        >
          <label style={{ display: 'block', fontFamily: 'Inter, system-ui, sans-serif', fontSize: '0.72rem', letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--flz-text-muted)', marginBottom: '6px' }}>
            Growth focus areas
          </label>
          <p style={{ fontFamily: 'Inter, system-ui, sans-serif', fontSize: '0.75rem', color: 'var(--flz-text-muted)', margin: '0 0 20px', lineHeight: 1.5 }}>
            FLZ will tailor your recommendations and resources to these areas.
          </p>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '28px' }}>
            {FOCUS_OPTIONS.map(area => {
              const active = areas.includes(area)
              return (
                <button key={area} onClick={() => toggleArea(area)}
                  style={{ fontFamily: 'Inter, system-ui, sans-serif', fontSize: '0.8125rem', padding: '7px 16px', borderRadius: '20px', cursor: 'pointer', transition: 'all 0.15s', background: active ? 'var(--flz-text)' : 'transparent', color: active ? 'var(--flz-bg)' : 'var(--flz-text)', border: `1px solid ${active ? 'var(--flz-text)' : 'var(--flz-border-input)'}` }}
                  onMouseEnter={e => { if (!active) e.currentTarget.style.borderColor = 'var(--flz-text)' }}
                  onMouseLeave={e => { if (!active) e.currentTarget.style.borderColor = 'var(--flz-border-input)' }}
                >
                  {area}
                </button>
              )
            })}
          </div>

          <button onClick={handleSaveAreas} disabled={areasSaving}
            style={{ padding: '11px 28px', background: areasSaved ? 'var(--flz-text)' : 'none', border: '1px solid var(--flz-border-input)', borderRadius: '2px', fontFamily: 'Inter, system-ui, sans-serif', fontSize: '0.875rem', color: areasSaved ? 'var(--flz-bg)' : 'var(--flz-text)', letterSpacing: '0.02em', cursor: areasSaving ? 'default' : 'pointer', opacity: areasSaving ? 0.5 : 1, transition: 'all 0.2s' }}
            onMouseEnter={e => { if (!areasSaved && !areasSaving) { e.currentTarget.style.background = 'var(--flz-text)'; e.currentTarget.style.color = 'var(--flz-bg)' } }}
            onMouseLeave={e => { if (!areasSaved) { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--flz-text)' } }}
          >
            {areasSaved ? 'Saved ✓' : areasSaving ? 'Saving…' : 'Save'}
          </button>
        </motion.div>

        {/* Back */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5, delay: 0.4 }} style={{ paddingTop: '48px' }}>
          <button onClick={onBack}
            style={{ background: 'none', border: 'none', fontFamily: 'Inter, system-ui, sans-serif', fontSize: '0.8125rem', color: 'var(--flz-text-muted)', cursor: 'pointer', letterSpacing: '0.01em', padding: 0, transition: 'color 0.2s' }}
            onMouseEnter={e => e.target.style.color = 'var(--flz-text)'}
            onMouseLeave={e => e.target.style.color = 'var(--flz-text-muted)'}
          >← Back</button>
        </motion.div>

      </div>
    </div>
  )
}
