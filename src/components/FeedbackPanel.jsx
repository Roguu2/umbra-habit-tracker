import { useState } from 'react'
import { motion } from 'framer-motion'
import Modal, { Hint, Section } from './Modal'
import { Segmented } from './ui'
import { lang, t } from '../lib/i18n'
import { sfx } from '../lib/sfx'

// Zgłoszenia trafiają do Netlify Forms (panel Netlify → Forms → feedback).
async function sendFeedback(fields) {
  if (import.meta.env.DEV) {
    console.info('[dev] feedback', fields) // lokalnie Netlify Forms nie działa
    return
  }
  const res = await fetch('/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ 'form-name': 'feedback', ...fields }).toString(),
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
}

export default function FeedbackPanel({ open, onClose }) {
  return (
    <Modal open={open} title={t('Zgłoś problem lub pomysł', 'Report a problem or idea')} onClose={onClose}>
      <FeedbackForm onClose={onClose} />
    </Modal>
  )
}

function FeedbackForm({ onClose }) {
  const [kind, setKind] = useState('bug')
  const [message, setMessage] = useState('')
  const [contact, setContact] = useState('')
  const [status, setStatus] = useState('idle') // idle | sending | sent | error

  const submit = async (e) => {
    e.preventDefault()
    if (!message.trim()) return
    setStatus('sending')
    try {
      await sendFeedback({
        kind,
        message: message.trim(),
        contact: contact.trim(),
        lang: lang(),
        device: `${navigator.userAgent} · ${window.innerWidth}×${window.innerHeight}`,
      })
      sfx.forge()
      setStatus('sent')
    } catch {
      setStatus('error')
    }
  }

  if (status === 'sent') {
    return (
      <div className="space-y-5">
        <p className="font-lore text-lg text-white/70 italic">
          {t('Dziękuję! Wiadomość dotarła — każda pomaga ulepszyć Umbrę.', 'Thank you! Your message has arrived — every one helps make Umbra better.')}
        </p>
        <button
          type="button"
          onClick={onClose}
          className="cursor-pointer border border-white/15 bg-black/30 px-3.5 py-2 text-[11px] tracking-[0.2em] text-white/70 uppercase hover:border-gold/60 hover:text-gold-bright"
        >
          {t('Zamknij', 'Close')}
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={submit} className="space-y-6">
      <Segmented
        id="feedback-kind"
        size="sm"
        value={kind}
        onChange={setKind}
        options={[
          { value: 'bug', label: t('Coś nie działa', 'Something is broken') },
          { value: 'idea', label: t('Mam pomysł', 'I have an idea') },
          { value: 'other', label: t('Inne', 'Other') },
        ]}
      />

      <Section label={t('Wiadomość', 'Message')}>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={5}
          maxLength={3000}
          required
          placeholder={
            kind === 'bug'
              ? t('Co się stało i co robiłeś chwilę wcześniej?', 'What happened, and what were you doing just before?')
              : t('Opisz swój pomysł…', 'Describe your idea…')
          }
          className="w-full resize-y border border-white/15 bg-black/40 p-3 text-sm text-stone-100 outline-none placeholder:text-white/25 focus:border-gold/60"
        />
      </Section>

      <Section label={t('Kontakt (opcjonalnie)', 'Contact (optional)')}>
        <input
          value={contact}
          onChange={(e) => setContact(e.target.value)}
          maxLength={120}
          placeholder={t('e-mail, jeśli chcesz odpowiedzi', 'email, if you want a reply')}
          className="w-full border-b border-white/15 bg-transparent pb-2 text-sm text-stone-100 outline-none placeholder:text-white/25 focus:border-gold/60"
        />
      </Section>

      <Hint>
        {t(
          'Razem z wiadomością wysyłamy nazwę przeglądarki i rozmiar ekranu — to pomaga znaleźć błąd. Nie wysyłamy twoich zadań.',
          "Along with your message we send your browser name and screen size — it helps track down bugs. Your quests are not sent.",
        )}
      </Hint>

      {status === 'error' && (
        <p className="text-sm text-blood-bright">{t('Nie udało się wysłać. Spróbuj ponownie za chwilę.', 'Sending failed. Please try again in a moment.')}</p>
      )}

      <motion.button
        type="submit"
        disabled={!message.trim() || status === 'sending'}
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        className="hud-cut-sm cursor-pointer bg-gradient-to-r from-blood-deep via-blood to-blood-deep px-8 py-3 font-display text-xs font-bold tracking-[0.3em] text-stone-100 uppercase shadow-[0_0_24px_rgba(195,20,47,0.35)] disabled:cursor-not-allowed disabled:opacity-35"
      >
        {status === 'sending' ? t('Wysyłam…', 'Sending…') : t('Wyślij', 'Send')}
      </motion.button>
    </form>
  )
}
