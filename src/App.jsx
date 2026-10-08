import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import Atmosphere from './components/Atmosphere'
import CharacterHud from './components/CharacterHud'
import NavTabs from './components/NavTabs'
import LevelUpModal from './components/LevelUpModal'
import AchievementToast from './components/AchievementToast'
import SoundToggle from './components/SoundToggle'
import SyncPanel, { SyncButton } from './components/SyncPanel'
import RemindersPanel, { ReminderButton } from './components/RemindersPanel'
import SettingsPanel from './components/SettingsPanel'
import FeedbackPanel from './components/FeedbackPanel'
import LegalPanel from './components/LegalPanel'
import HabitDetail from './components/HabitDetail'
import Landing from './components/Landing'
import { usePush } from './hooks/usePush'
import QuestEditor from './components/QuestEditor'
import Onboarding from './components/Onboarding'
import HabitQuiz from './components/HabitQuiz'
import TodayView from './views/TodayView'
import PlanView from './views/PlanView'
import ProgressView from './views/ProgressView'
import { useGame } from './hooks/useGame'
import { expToReach, titleFor } from './lib/game'
import { auraFor, nextReward } from './lib/rewards'
import { dayStats } from './lib/stats'
import { sfx } from './lib/sfx'
import { t } from './lib/i18n'

export default function App() {
  const game = useGame()
  const { state, today, level, maxLevel, current, needed, totalExp, actions } = game
  const aura = auraFor(state.profile, maxLevel)
  const upcoming = nextReward(maxLevel)
  const next = upcoming && { reward: upcoming, expLeft: expToReach(upcoming.level) - totalExp }
  const [tab, setTab] = useState('today')
  const [planFocus, setPlanFocus] = useState(null)
  const [editing, setEditing] = useState(null)
  const [detailId, setDetailId] = useState(null)
  const [tourOpen, setTourOpen] = useState(false)

  // link ?sync=KOD z innego urządzenia otwiera okno synchronizacji z wpisanym kodem
  const [linkCode] = useState(() => {
    const code = new URLSearchParams(location.search).get('sync')
    if (code) history.replaceState(null, '', location.pathname)
    return code
  })
  // otwarte okno: null | 'sync' | 'reminders' | 'settings' | 'feedback' | 'legal' | 'quiz'
  const [panel, setPanel] = useState(linkCode ? 'sync' : null)
  const closePanel = () => setPanel(null)
  const push = usePush(game.sync)

  // strona powitalna tylko przy pierwszej wizycie (bez danych i bez kodu)
  const fresh = !state.onboarded && state.quests.length === 0 && Object.keys(state.history).length === 0 && !game.sync.code
  const [landing, setLanding] = useState(fresh && !linkCode)

  const todayStats = dayStats(state, today)
  // licznik dnia: zaplanowane na dziś + wszystko, co dziś zrobiono ponad plan (nawyki "X razy w tygodniu",
  // zadania z innych dni) — te drugie liczą się dopiero po wykonaniu, więc nie psują pełnego dnia
  const bonusDone = todayStats.flexDone.length + todayStats.extra.filter((q) => !q.archivedAt).length
  const detail = state.quests.find((q) => q.id === detailId) ?? null

  const openPlan = (key) => {
    setPlanFocus(key)
    setTab('plan')
  }

  const open = (name) => {
    if (name === 'tour') setTourOpen(true)
    else setPanel(name)
  }

  const views = {
    today: <TodayView game={game} onEdit={setEditing} onOpenPlan={openPlan} onOpenQuiz={() => setPanel('quiz')} />,
    plan: <PlanView game={game} focusDay={planFocus} onEdit={setEditing} onDetail={(q) => setDetailId(q.id)} />,
    progress: <ProgressView game={game} />,
  }

  const panels = (
    <>
      <SettingsPanel open={panel === 'settings'} onClose={closePanel} game={game} sync={game.sync} push={push} onOpen={open} />
      <RemindersPanel open={panel === 'reminders'} push={push} hasCode={Boolean(game.sync.code)} onClose={closePanel} />
      <SyncPanel open={panel === 'sync'} sync={game.sync} initialCode={game.sync.code ? null : linkCode} onClose={closePanel} />
      <FeedbackPanel open={panel === 'feedback'} onClose={closePanel} />
      <LegalPanel open={panel === 'legal'} onClose={closePanel} />
      <HabitQuiz
        open={panel === 'quiz'}
        existingNames={state.quests.filter((q) => !q.archivedAt).map((q) => q.name)}
        onClose={closePanel}
        onAdd={(drafts) => {
          drafts.forEach(actions.saveQuest)
          closePanel()
          setTab('today')
        }}
      />
    </>
  )

  if (landing) {
    return (
      <div className="relative min-h-screen overflow-x-hidden text-stone-200">
        <Atmosphere aura={aura} />
        <AnimatePresence>
          <Landing
            onStart={() => setLanding(false)}
            onHaveCode={() => {
              setLanding(false)
              setPanel('sync')
            }}
            onLegal={() => setPanel('legal')}
          />
        </AnimatePresence>
        {panels}
      </div>
    )
  }

  return (
    <div className="relative min-h-screen overflow-x-hidden text-stone-200">
      <Atmosphere aura={aura} />

      <div className="relative z-10 mx-auto max-w-6xl px-4 py-8 sm:px-8 sm:py-14">
        <CharacterHud
          name={state.profile.name}
          onRename={actions.renameHero}
          level={level}
          maxLevel={maxLevel}
          title={titleFor(level)}
          current={current}
          needed={needed}
          next={next}
          doneCount={todayStats.scheduledDone.length + bonusDone}
          questCount={todayStats.scheduled.length + bonusDone}
          conquered={todayStats.perfect}
        />

        <NavTabs active={tab} onChange={setTab} />

        <main className="mt-10">
          <AnimatePresence mode="wait">
            <motion.div
              key={tab}
              role="tabpanel"
              id={`panel-${tab}`}
              aria-labelledby={`tab-${tab}`}
              initial={{ opacity: 0, y: 14, filter: 'blur(6px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -10, filter: 'blur(6px)' }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            >
              {views[tab]}
            </motion.div>
          </AnimatePresence>
        </main>

        <footer className="mt-16 mb-16 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 sm:mb-0">
          {[
            ['settings', t('Ustawienia', 'Settings')],
            ['tour', t('Poradnik', 'Guide')],
            ['feedback', t('Zgłoś problem', 'Report a problem')],
            ['legal', t('Prywatność', 'Privacy')],
          ].map(([name, label]) => (
            <button
              key={name}
              type="button"
              onClick={() => {
                sfx.page()
                open(name)
              }}
              className="cursor-pointer text-[10px] tracking-[0.3em] text-white/35 uppercase transition-colors hover:text-gold-bright"
            >
              {label}
            </button>
          ))}
        </footer>
      </div>

      <SoundToggle />
      <div className="fixed bottom-4 left-4 z-40 flex gap-2 sm:bottom-6 sm:left-6">
        <SyncButton status={game.sync.status} onClick={() => setPanel('sync')} />
        <ReminderButton enabled={push.prefs.enabled} onClick={() => setPanel('reminders')} />
        <SettingsButton onClick={() => setPanel('settings')} />
      </div>
      {panels}
      <HabitDetail
        quest={detail}
        state={state}
        today={today}
        onClose={() => setDetailId(null)}
        onEdit={(q) => {
          setDetailId(null)
          setEditing(q)
        }}
      />
      <Onboarding
        open={(!state.onboarded && !panel) || tourOpen}
        defaultName={state.profile.name}
        onFinish={(name) => {
          // nowa osoba z pustym planem od razu dostaje ankietę doboru nawyków
          if (!state.onboarded && state.quests.length === 0) setPanel('quiz')
          actions.finishOnboarding(name)
          setTourOpen(false)
        }}
      />
      <QuestEditor draft={editing} onSave={actions.saveQuest} onRemove={actions.removeQuest} onClose={() => setEditing(null)} />
      <AchievementToast achievement={game.toast} onDone={game.dismissToast} />
      <LevelUpModal levelUp={game.levelUpShown} aura={aura} onWear={actions.setAura} onClose={game.closeLevelUp} />
    </div>
  )
}

function SettingsButton({ onClick }) {
  return (
    <motion.button
      type="button"
      onClick={() => {
        sfx.page()
        onClick()
      }}
      aria-label={t('Ustawienia', 'Settings')}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 1.1, duration: 0.6 }}
      whileHover={{ scale: 1.06, rotate: 30 }}
      whileTap={{ scale: 0.92 }}
      className="hud-cut-sm flex cursor-pointer items-center bg-[#0b0a0d]/80 px-3.5 py-2.5 ring-1 ring-white/10 backdrop-blur-xl"
    >
      <svg viewBox="0 0 16 16" className="size-4" aria-hidden fill="none" stroke="rgba(255,255,255,0.45)" strokeWidth="1.3" strokeLinejoin="round">
        <path d="M8 1.5l1.2 1.7 2-.5.4 2 1.9.9-.9 1.9.9 1.9-1.9.9-.4 2-2-.5L8 14.5l-1.2-1.7-2 .5-.4-2-1.9-.9.9-1.9-.9-1.9 1.9-.9.4-2 2 .5Z" />
        <circle cx="8" cy="8" r="2.2" />
      </svg>
    </motion.button>
  )
}
