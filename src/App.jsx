import { useState, useEffect, useRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { supabase } from './lib/supabase'

import OnboardingScreen  from './components/OnboardingScreen'
import ThinkingScreen    from './components/ThinkingScreen'
import ResultsScreen     from './components/ResultsScreen'
import AuthScreen        from './components/AuthScreen'
import HistoryScreen     from './components/HistoryScreen'
import SettingsScreen    from './components/SettingsScreen'
import JournalScreen     from './components/JournalScreen'
import UpgradeScreen     from './components/UpgradeScreen'
import PolkaDotBackground from './components/PolkaDotBackground'
import Logo              from './components/Logo'
import ProfileIcon       from './components/ProfileIcon'
import DarkModeToggle    from './components/DarkModeToggle'

export default function App() {
  // ── Dark mode ────────────────────────────────────────────────────────────
  const [dark, setDark] = useState(() => localStorage.getItem('flz-dark') === 'true')

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
    localStorage.setItem('flz-dark', dark)
  }, [dark])

  // ── User name ─────────────────────────────────────────────────────────────
  const [userName, setUserName] = useState(() => localStorage.getItem('flz-name') || '')

  function handleSaveName(name) {
    localStorage.setItem('flz-name', name)
    setUserName(name)
  }

  // ── Plan config ──────────────────────────────────────────────────────────
  const DAILY_LIMIT = 10
  const [isPro, setIsPro]           = useState(false)
  const [focusAreas, setFocusAreas] = useState([])
  const pendingUpgradeRef           = useRef(false)

  // ── Daily assessment counter ──────────────────────────────────────────────
  const [assessmentsToday, setAssessmentsToday] = useState(() => {
    const stored = JSON.parse(localStorage.getItem('flz-assessments') || '{}')
    const today = new Date().toISOString().split('T')[0]
    return stored.date === today ? stored.count : 0
  })

  function incrementAssessments() {
    const today = new Date().toISOString().split('T')[0]
    const next = assessmentsToday + 1
    setAssessmentsToday(next)
    localStorage.setItem('flz-assessments', JSON.stringify({ date: today, count: next }))
  }

  // ── Core flow state ──────────────────────────────────────────────────────
  const [screen, setScreen]         = useState('onboarding')
  const [resetKey, setResetKey]     = useState(0)
  const [userInput, setUserInput]   = useState('')
  const [analysis, setAnalysis]     = useState(null)
  const [error, setError]           = useState(null)

  // ── Auth state ───────────────────────────────────────────────────────────
  const [user, setUser]               = useState(null)
  const [authLoading, setAuthLoading] = useState(true)

  // ── Fetch Pro status + focus areas from Supabase whenever user changes ──
  useEffect(() => {
    if (!user) { setIsPro(false); setFocusAreas([]); return }
    supabase.from('profiles').select('is_pro, focus_areas').eq('id', user.id).single()
      .then(({ data }) => {
        setIsPro(data?.is_pro ?? false)
        setFocusAreas(data?.focus_areas ?? [])
      })
  }, [user])

  // ── Detect post-Stripe redirect (?upgraded=true) ─────────────────────────
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('upgraded') === 'true') {
      window.history.replaceState({}, document.title, window.location.pathname)
      setIsPro(true)
    }
  }, [])

  // ── Save state ───────────────────────────────────────────────────────────
  const [savedEntry, setSavedEntry]   = useState(false)
  const pendingEntryRef               = useRef(null)
  const [pendingEntry, setPendingEntry] = useState(null)
  const screenRef                     = useRef('onboarding')

  useEffect(() => { pendingEntryRef.current = pendingEntry }, [pendingEntry])
  useEffect(() => { screenRef.current = screen }, [screen])

  // ── Boot: check session + listen for auth changes ────────────────────────
  useEffect(() => {
    let mounted = true

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return
      setUser(session?.user ?? null)
      setAuthLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return
      const newUser = session?.user ?? null
      setUser(newUser)

      if (event === 'SIGNED_IN' && newUser) {
        // Detect real sign-in vs silent session restore on page reload
        const url = window.location.href
        const isOAuthCallback = url.includes('access_token') || url.includes('code=')
        const isFromAuthScreen = screenRef.current === 'auth'

        window.history.replaceState({}, document.title, window.location.pathname)

        if (pendingEntryRef.current) {
          setScreen('results')
        } else if (pendingUpgradeRef.current) {
          pendingUpgradeRef.current = false
          setScreen('upgrade')
        } else if (isOAuthCallback || isFromAuthScreen) {
          setScreen('history')
        }
        // else: session restored on page reload — stay on current screen
      }

      if (event === 'SIGNED_OUT') {
        setScreen('onboarding')
        setResetKey(k => k + 1)
        setSavedEntry(false)
        setIsPro(false)
      }
    })

    return () => { mounted = false; subscription.unsubscribe() }
  }, [])

  // ── Auto-save when logged-in user lands on results ───────────────────────
  useEffect(() => {
    if (screen !== 'results' || savedEntry) return

    const entryToSave = user
      ? { input: userInput, data: analysis }
      : pendingEntry
        ? { input: pendingEntry.input, data: pendingEntry.analysis }
        : null

    if (!entryToSave || !entryToSave.data) return

    async function save() {
      const dims = entryToSave.data.dimensions ?? {}
      console.log('[FLZ] Saving entry for user:', user?.id)
      const { error } = await supabase.from('entries').insert({
        user_id:     user.id,
        input:       entryToSave.input,
        analysis:    entryToSave.data,
        state_label: entryToSave.data.stateLabel,
        energy:      dims.energy,
        emotion:     dims.emotion,
        clarity:     dims.clarity,
        focus_areas: focusAreas.length > 0 ? focusAreas : null,
      })
      if (error) {
        console.error('[FLZ] Save error:', error)
      } else {
        console.log('[FLZ] Entry saved successfully')
        setSavedEntry(true)
        if (pendingEntry) setPendingEntry(null)
      }
    }
    save()
  }, [screen, user])

  // ── Analysis flow ────────────────────────────────────────────────────────
  async function handleSubmit(input) {
    if (!isPro && assessmentsToday >= DAILY_LIMIT) return
    setUserInput(input)
    setError(null)
    setSavedEntry(false)
    setScreen('thinking')

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input, focusAreas }),
      })
      if (!res.ok) throw new Error('Analysis failed')
      const data = await res.json()
      setAnalysis(data)
      incrementAssessments()
      setScreen('results')
    } catch {
      setError('Something went wrong. Please try again.')
      setScreen('onboarding')
      setResetKey(k => k + 1)
    }
  }

  function handleReset() {
    setScreen('onboarding')
    setUserInput('')
    setAnalysis(null)
    setError(null)
    setSavedEntry(false)
    setViewingHistorical(false)
    setResetKey(k => k + 1)
  }

  function handleUpgradeClick() {
    if (!user) {
      pendingUpgradeRef.current = true
      setScreen('auth')
    } else {
      setScreen('upgrade')
    }
  }

  function handleSavePrompt() {
    setPendingEntry({ input: userInput, analysis })
    setScreen('auth')
  }

  function handleSignInClick() {
    setScreen('auth')
  }

  const [viewingHistorical, setViewingHistorical] = useState(false)

  function handleSelectHistoryEntry(entry) {
    setUserInput(entry.input)
    setAnalysis(entry.analysis)
    setSavedEntry(true)
    setViewingHistorical(true)
    setScreen('results')
  }

  function handleBackToHistory() {
    setViewingHistorical(false)
    setScreen('history')
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
  }

  async function saveJournalEntry({ type, question, content, stateLabel }) {
    if (!user) return 'not logged in'
    const { error } = await supabase.from('journal_entries').insert({
      user_id:     user.id,
      type:        type || 'manual',
      question:    question || null,
      content,
      state_label: stateLabel || null,
    })
    if (error) console.error('[FLZ] Journal save error:', error)
    return error
  }

  if (authLoading) return null

  return (
    <div style={{ minHeight: '100vh', background: 'var(--flz-bg)', transition: 'background 0.35s ease' }}>
      <PolkaDotBackground />
      <Logo onReset={handleReset} dark={dark} />
      <DarkModeToggle dark={dark} onToggle={() => setDark(d => !d)} />
      <ProfileIcon
        user={user}
        onSignIn={handleSignInClick}
        onHistory={() => setScreen('history')}
        onJournal={() => setScreen('journal')}
        onSettings={() => setScreen('settings')}
        onSignOut={handleSignOut}
        onUpgrade={handleUpgradeClick}
        isPro={isPro}
      />

      <AnimatePresence mode="wait">
        {screen === 'onboarding' && (
          <motion.div key={`onboarding-${resetKey}`}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }} style={{ position: 'fixed', inset: 0 }}
          >
            <OnboardingScreen
              onSubmit={handleSubmit}
              error={error}
              userName={userName}
              onSaveName={handleSaveName}
              assessmentsToday={assessmentsToday}
              dailyLimit={DAILY_LIMIT}
              isPro={isPro}
              onUpgrade={handleUpgradeClick}
            />
          </motion.div>
        )}

        {screen === 'thinking' && (
          <motion.div key="thinking"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }} style={{ position: 'fixed', inset: 0 }}
          >
            <ThinkingScreen input={userInput} />
          </motion.div>
        )}

        {screen === 'results' && (
          <motion.div key={`results-${userInput.slice(0,10)}`}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            <ResultsScreen
              analysis={analysis}
              isSaved={savedEntry}
              isLoggedIn={!!user}
              onSavePrompt={handleSavePrompt}
              onReset={handleReset}
              isHistorical={viewingHistorical}
              onBackToHistory={handleBackToHistory}
              onSaveJournalEntry={saveJournalEntry}
            />
          </motion.div>
        )}

        {screen === 'auth' && (
          <motion.div key="auth"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }} style={{ position: 'fixed', inset: 0 }}
          >
            <AuthScreen onBack={() => setScreen(analysis ? 'results' : 'onboarding')} />
          </motion.div>
        )}

        {screen === 'history' && (
          <motion.div key="history"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
          >
            <HistoryScreen
              user={user}
              onSelectEntry={handleSelectHistoryEntry}
              onSignOut={handleSignOut}
              isPro={isPro}
              userFocusAreas={focusAreas}
            />
          </motion.div>
        )}

        {screen === 'settings' && (
          <motion.div key="settings"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
          >
            <SettingsScreen
              user={user}
              userName={userName}
              onSaveName={handleSaveName}
              onBack={() => setScreen(user ? 'history' : 'onboarding')}
              focusAreas={focusAreas}
              onSaveFocusAreas={setFocusAreas}
              isPro={isPro}
              onUpgrade={handleUpgradeClick}
            />
          </motion.div>
        )}

        {screen === 'journal' && (
          <motion.div key="journal"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
          >
            <JournalScreen
              user={user}
              onBack={() => setScreen(user ? 'history' : 'onboarding')}
              isPro={isPro}
              onUpgrade={handleUpgradeClick}
            />
          </motion.div>
        )}

        {screen === 'upgrade' && (
          <motion.div key="upgrade"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }} style={{ position: 'fixed', inset: 0 }}
          >
            <UpgradeScreen
              user={user}
              onBack={() => setScreen(analysis ? 'results' : 'onboarding')}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
