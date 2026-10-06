import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import Atmosphere from './components/Atmosphere'
import CharacterHud from './components/CharacterHud'
import NavTabs from './components/NavTabs'
import LevelUpModal from './components/LevelUpModal'
import AchievementToast from './components/AchievementToast'
import SoundToggle from './components/SoundToggle'
import QuestEditor from './components/QuestEditor'
import Onboarding from './components/Onboarding'
import TodayView from './views/TodayView'
import PlanView from './views/PlanView'
import ProgressView from './views/ProgressView'
import { useGame } from './hooks/useGame'
import { titleFor } from './lib/game'
import { dayStats } from './lib/stats'
import { sfx } from './lib/sfx'

export default function App() {
  const game = useGame()
  const { state, today, level, current, needed, actions } = game
  const [tab, setTab] = useState('today')
  const [planFocus, setPlanFocus] = useState(null)
  const [editing, setEditing] = useState(null)
  const [tourOpen, setTourOpen] = useState(false)

  const todayStats = dayStats(state, today)

  const openPlan = (key) => {
    setPlanFocus(key)
    setTab('plan')
  }

  // potwierdzenie drugim kliknięciem (okna confirm() nie działają w każdym środowisku, np. w osadzonej stronie)
  const [confirmReset, setConfirmReset] = useState(false)
  const resetAll = () => {
    if (!confirmReset) {
      sfx.tick()
      setConfirmReset(true)
      setTimeout(() => setConfirmReset(false), 4000)
      return
    }
    setConfirmReset(false)
    sfx.abandon()
    actions.reset()
  }

  const views = {
    today: <TodayView game={game} onEdit={setEditing} onOpenPlan={openPlan} />,
    plan: <PlanView game={game} focusDay={planFocus} onEdit={setEditing} />,
    progress: <ProgressView game={game} />,
  }

  return (
    <div className="relative min-h-screen overflow-x-hidden text-stone-200">
      <Atmosphere />

      <div className="relative z-10 mx-auto max-w-6xl px-4 py-8 sm:px-8 sm:py-14">
        <CharacterHud
          name={state.profile.name}
          onRename={actions.renameHero}
          level={level}
          title={titleFor(level)}
          current={current}
          needed={needed}
          doneCount={todayStats.scheduledDone.length}
          questCount={todayStats.scheduled.length}
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

        <footer className="mt-16 flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
          <button
            type="button"
            onClick={() => {
              sfx.page()
              setTourOpen(true)
            }}
            className="cursor-pointer text-[10px] tracking-[0.3em] text-white/35 uppercase transition-colors hover:text-gold-bright"
          >
            Poradnik
          </button>
          <button
            type="button"
            onClick={resetAll}
            className={`cursor-pointer text-[10px] tracking-[0.3em] uppercase transition-colors hover:text-blood-bright ${
              confirmReset ? 'text-blood-bright' : 'text-white/20'
            }`}
          >
            {confirmReset ? 'Kliknij ponownie, aby usunąć wszystkie dane' : 'Zacznij od nowa'}
          </button>
        </footer>
      </div>

      <SoundToggle />
      <Onboarding
        open={!state.onboarded || tourOpen}
        defaultName={state.profile.name}
        onFinish={(name) => {
          actions.finishOnboarding(name)
          setTourOpen(false)
        }}
      />
      <QuestEditor draft={editing} onSave={actions.saveQuest} onRemove={actions.removeQuest} onClose={() => setEditing(null)} />
      <AchievementToast achievement={game.toast} onDone={game.dismissToast} />
      <LevelUpModal level={game.levelUpShown} onClose={game.closeLevelUp} />
    </div>
  )
}
