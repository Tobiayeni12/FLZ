import { useState, useEffect, useRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { supabase } from './lib/supabase'
import { Capacitor } from '@capacitor/core'

// All Capacitor plugins imported dynamically — static imports cause
// Vite TDZ circular-dep errors crashing the web bundle
const getNativeBrowser  = () => import('@capacitor/browser').then(m => m.Browser)
const getNativeApp      = () => import('@capacitor/app').then(m => m.App)
const setNativeStatusBar = async (isDark) => {
  if (!Capacitor.isNativePlatform()) return
  try {
    const { StatusBar, Style } = await import('@capacitor/status-bar')
    await StatusBar.setStyle({ style: isDark ? Style.Dark : Style.Light })
    await StatusBar.setBackgroundColor({ color: isDark ? '#0c0c0c' : '#ffffff' })
  } catch {}
}

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
    setNativeStatusBar(dark)
  }, [dark])

  // ── User name — session only for guests, saved to Supabase for logged-in ─
  const [userName, setUserName] = useState('')

  async function handleSaveName(name) {
    setUserName(name)
    if (user) {
      await supabase.from('profiles')
        .upsert({ id: user.id, display_name: name, updated_at: new Date().toISOString() })
    }
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
  const [navHistory, setNavHistory] = useState([])
  const [resetKey, setResetKey]     = useState(0)
  const [userInput, setUserInput]   = useState('')
  const [analysis, setAnalysis]     = useState(null)
  const [error, setError]           = useState(null)

  // ── Header fade on scroll (non-home screens) ────────────────────────────
  const [headerVisible, setHeaderVisible] = useState(true)
  const lastScrollY = useRef(0)

  useEffect(() => {
    function handleScroll(y) {
      const delta = y - lastScrollY.current
      lastScrollY.current = y
      if (screenRef.current === 'onboarding') { setHeaderVisible(true); return }
      if (delta > 4 && y > 60) setHeaderVisible(false)
      else if (delta < -4 || y < 10) setHeaderVisible(true)
    }
    // Window scroll (history/settings/journal pages that scroll the page)
    function onWindowScroll() { handleScroll(window.scrollY) }
    // Element scroll (fixed containers with internal overflow-y scroll)
    function onElementScroll(e) {
      const el = e.target
      if (!el || el === document || el === document.documentElement) return
      handleScroll(el.scrollTop ?? 0)
    }
    window.addEventListener('scroll', onWindowScroll, { passive: true })
    document.addEventListener('scroll', onElementScroll, true)
    return () => {
      window.removeEventListener('scroll', onWindowScroll)
      document.removeEventListener('scroll', onElementScroll, true)
    }
  }, [])

  useEffect(() => {
    if (screen === 'onboarding') { setHeaderVisible(true); lastScrollY.current = 0 }
  }, [screen])

  // Navigate forward — remembers where we came from
  function navigate(to) {
    setNavHistory(prev => [...prev, screenRef.current])
    setScreen(to)
  }

  // Go back to the previous screen in the stack
  function goBack() {
    if (navHistory.length === 0) { setScreen('onboarding'); return }
    const prev = [...navHistory]
    const dest = prev.pop()
    setNavHistory(prev)
    setScreen(dest)
  }

  // ── Auth state ───────────────────────────────────────────────────────────
  const [user, setUser]               = useState(null)
  const [authLoading, setAuthLoading] = useState(true)

  // ── Fetch Pro status + focus areas from Supabase whenever user changes ──
  useEffect(() => {
    if (!user) { setIsPro(false); setFocusAreas([]); setUserName(''); return }
    supabase.from('profiles').select('is_pro, focus_areas, display_name').eq('id', user.id).single()
      .then(({ data }) => {
        setIsPro(data?.is_pro ?? false)
        setFocusAreas(data?.focus_areas ?? [])
        if (data?.display_name) setUserName(data.display_name)
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

  // ── Set status bar on native launch ─────────────────────────────────────
  useEffect(() => { setNativeStatusBar(dark) }, [])

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
        setNavHistory([])
        setResetKey(k => k + 1)
        setSavedEntry(false)
        setIsPro(false)
      }
    })

    return () => { mounted = false; subscription.unsubscribe() }
  }, [])

  // ── Deep link handler for native OAuth callback ───────────────────────────
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return

    const handleUrl = async ({ url }) => {
      if (url?.startsWith('com.flz.app://auth/callback')) {
        const Browser = await getNativeBrowser()
        await Browser.close()
        const urlObj = new URL(url)
        const params = new URLSearchParams(
          urlObj.hash ? urlObj.hash.substring(1) : urlObj.search
        )
        const accessToken  = params.get('access_token')
        const refreshToken = params.get('refresh_token')
        if (accessToken) {
          await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken })
        } else {
          await supabase.auth.exchangeCodeForSession(urlObj.search)
        }
      }
    }

    let cleanup = () => {}
    getNativeApp().then(CapApp => {
      CapApp.addListener('appUrlOpen', handleUrl)
      cleanup = () => CapApp.removeAllListeners()
    })
    return () => cleanup()
  }, [])

  // ── Auto-save pending entry after guest signs in ─────────────────────────
  useEffect(() => {
    if (screen !== 'results' || savedEntry || !user || !pendingEntry) return
    async function savePending() {
      const dims = pendingEntry.analysis?.dimensions ?? {}
      const { error } = await supabase.from('entries').insert({
        user_id:     user.id,
        input:       pendingEntry.input,
        analysis:    pendingEntry.analysis,
        state_label: pendingEntry.analysis?.stateLabel,
        energy:      dims.energy,
        emotion:     dims.emotion,
        clarity:     dims.clarity,
        focus_areas: focusAreas.length > 0 ? focusAreas : null,
      })
      if (error) { console.error('[FLZ] Pending save error:', error) }
      else { console.log('[FLZ] Pending entry saved'); setSavedEntry(true); setPendingEntry(null) }
    }
    savePending()
  }, [screen, user])

  // ── Manual save — called when logged-in user presses "Save this moment" ──
  async function handleSaveEntry() {
    if (!user || savedEntry || !analysis) return
    const dims = analysis.dimensions ?? {}
    const { error } = await supabase.from('entries').insert({
      user_id:     user.id,
      input:       userInput,
      analysis:    analysis,
      state_label: analysis.stateLabel,
      energy:      dims.energy,
      emotion:     dims.emotion,
      clarity:     dims.clarity,
      focus_areas: focusAreas.length > 0 ? focusAreas : null,
    })
    if (error) { console.error('[FLZ] Save error:', error); return error }
    console.log('[FLZ] Entry saved')
    setSavedEntry(true)
    return null
  }

  // ── Analysis flow ────────────────────────────────────────────────────────
  async function handleSubmit(input) {
    if (!isPro && assessmentsToday >= DAILY_LIMIT) return
    setUserInput(input)
    setError(null)
    setSavedEntry(false)
    navigate('thinking')

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
      navigate('results')
    } catch {
      setError('Something went wrong. Please try again.')
      setScreen('onboarding')
      setNavHistory([])
      setResetKey(k => k + 1)
    }
  }

  function handleReset() {
    setScreen('onboarding')
    setNavHistory([])
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
      navigate('auth')
    } else {
      navigate('upgrade')
    }
  }

  function handleSavePrompt() {
    setPendingEntry({ input: userInput, analysis })
    navigate('auth')
  }

  function handleSignInClick() {
    navigate('auth')
  }

  const [viewingHistorical, setViewingHistorical] = useState(false)

  function handleSelectHistoryEntry(entry) {
    setUserInput(entry.input)
    setAnalysis(entry.analysis)
    setSavedEntry(true)
    setViewingHistorical(true)
    navigate('results')
  }

  function handleBackToHistory() {
    setViewingHistorical(false)
    goBack()
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
      <div style={{
        opacity: headerVisible ? 1 : 0,
        transition: 'opacity 0.3s ease',
        pointerEvents: headerVisible ? 'auto' : 'none',
      }}>
        <Logo onReset={handleReset} dark={dark} />
        <DarkModeToggle dark={dark} onToggle={() => setDark(d => !d)} />
      <ProfileIcon
        user={user}
        onSignIn={handleSignInClick}
        onHistory={() => navigate('history')}
        onJournal={() => navigate('journal')}
        onSettings={() => navigate('settings')}
        onSignOut={handleSignOut}
        onUpgrade={handleUpgradeClick}
        isPro={isPro}
      />
      </div>

      <AnimatePresence mode="wait">
        {screen === 'onboarding' && (
          <motion.div key={`onboarding-${resetKey}`}
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] }} style={{ position: 'fixed', inset: 0 }} className="safe-screen"
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
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }} style={{ position: 'fixed', inset: 0 }} className="safe-screen"
          >
            <ThinkingScreen input={userInput} />
          </motion.div>
        )}

        {screen === 'results' && (
          <motion.div key={`results-${userInput.slice(0,10)}`}
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            <ResultsScreen
              analysis={analysis}
              isSaved={savedEntry}
              isLoggedIn={!!user}
              onSavePrompt={handleSavePrompt}
              onSaveEntry={handleSaveEntry}
              onReset={handleReset}
              isHistorical={viewingHistorical}
              onBackToHistory={handleBackToHistory}
              onSaveJournalEntry={saveJournalEntry}
            />
          </motion.div>
        )}

        {screen === 'auth' && (
          <motion.div key="auth"
            initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 24 }}
            transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }} style={{ position: 'fixed', inset: 0 }} className="safe-screen"
          >
            <AuthScreen onBack={goBack} />
          </motion.div>
        )}

        {screen === 'history' && (
          <motion.div key="history"
            initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 24 }}
            transition={{ duration: 0.38, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            <HistoryScreen
              user={user}
              onSelectEntry={handleSelectHistoryEntry}
              onBack={goBack}
              isPro={isPro}
              userFocusAreas={focusAreas}
            />
          </motion.div>
        )}

        {screen === 'settings' && (
          <motion.div key="settings"
            initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 24 }}
            transition={{ duration: 0.38, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            <SettingsScreen
              user={user}
              userName={userName}
              onSaveName={handleSaveName}
              onBack={goBack}
              focusAreas={focusAreas}
              onSaveFocusAreas={setFocusAreas}
              isPro={isPro}
              onUpgrade={handleUpgradeClick}
              onSignOut={handleSignOut}
            />
          </motion.div>
        )}

        {screen === 'journal' && (
          <motion.div key="journal"
            initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 24 }}
            transition={{ duration: 0.38, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            <JournalScreen
              user={user}
              onBack={goBack}
              isPro={isPro}
              onUpgrade={handleUpgradeClick}
            />
          </motion.div>
        )}

        {screen === 'upgrade' && (
          <motion.div key="upgrade"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }} style={{ position: 'fixed', inset: 0 }} className="safe-screen"
          >
            <UpgradeScreen
              user={user}
              onBack={goBack}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
