import { useState } from 'react'
import Modal from './Modal'
import { Segmented } from './ui'
import { formatDay } from '../lib/game'
import { t } from '../lib/i18n'
import { CONTACT_EMAIL, OWNER, POLICY_DATE } from '../lib/site'

const contact = () => CONTACT_EMAIL || t('formularz „Zgłoś problem” w aplikacji', 'the “Report a problem” form in the app')

// Polityka prywatności i regulamin — opisują dokładnie to, co aplikacja robi z danymi.
const privacy = () => [
  {
    h: t('Kto odpowiada za dane', 'Who is responsible for your data'),
    p: [
      t(
        `Administratorem danych jest ${OWNER}. Kontakt: ${contact()}.`,
        `The data controller is ${OWNER}. Contact: ${contact()}.`,
      ),
    ],
  },
  {
    h: t('Co zapisujemy i gdzie', 'What we store and where'),
    p: [
      t(
        'Domyślnie wszystko — zadania, historia, poziom, osiągnięcia i ustawienia — zapisuje się wyłącznie w pamięci twojej przeglądarki. Nie zakładasz konta i nie podajesz imienia, e-maila ani hasła.',
        'By default everything — quests, history, level, achievements and settings — is stored only in your browser. You create no account and give no name, email or password.',
      ),
      t(
        'Synchronizacja (opcjonalna): po utworzeniu kodu kopia tych danych jest przechowywana na serwerze pod losowym kodem, aby twoje urządzenia mogły się zsynchronizować. Dane nie są powiązane z twoją tożsamością.',
        'Sync (optional): once you create a code, a copy of this data is stored on the server under a random code so your devices can sync. The data is not linked to your identity.',
      ),
      t(
        'Przypomnienia (opcjonalne): zapisujemy adres subskrypcji powiadomień nadany przez twoją przeglądarkę (np. Google, Mozilla, Apple), strefę czasową, język i wybrane godziny przypomnień.',
        "Reminders (optional): we store the push subscription address issued by your browser (e.g. Google, Mozilla, Apple), your time zone, language and chosen reminder times.",
      ),
      t(
        'Zgłoszenia (opcjonalne): treść wiadomości, kontakt — jeśli go podasz — oraz nazwę przeglądarki i rozmiar ekranu.',
        'Feedback (optional): your message, contact details if you provide them, and your browser name and screen size.',
      ),
    ],
  },
  {
    h: t('Czego nie robimy', 'What we do not do'),
    p: [
      t(
        'Nie używamy plików cookie, reklam ani narzędzi śledzących. Nie sprzedajemy ani nie udostępniamy danych do celów marketingowych. Czcionki i pliki aplikacji ładują się z naszego serwera.',
        'We use no cookies, ads or tracking tools. We do not sell or share data for marketing. Fonts and app files are served from our own server.',
      ),
    ],
  },
  {
    h: t('Podmioty przetwarzające', 'Processors'),
    p: [
      t(
        'Serwis działa na infrastrukturze Netlify, Inc. (hosting, przechowywanie danych synchronizacji, formularz zgłoszeń). Netlify przetwarza też techniczne logi serwera, w tym adresy IP. Netlify może przechowywać dane poza EOG na podstawie standardowych klauzul umownych. Powiadomienia dostarcza usługa push twojej przeglądarki.',
        "The service runs on Netlify, Inc. infrastructure (hosting, sync storage, feedback form). Netlify also processes technical server logs, including IP addresses, and may store data outside the EEA under standard contractual clauses. Notifications are delivered by your browser's push service.",
      ),
    ],
  },
  {
    h: t('Podstawa i czas przechowywania', 'Legal basis and retention'),
    p: [
      t(
        'Dane przetwarzamy, aby świadczyć usługę, o którą prosisz (art. 6 ust. 1 lit. b RODO), a logi i zgłoszenia — w uzasadnionym interesie utrzymania i ulepszania serwisu (art. 6 ust. 1 lit. f). Dane synchronizacji przechowujemy, dopóki ich nie usuniesz; zgłoszenia — do 12 miesięcy.',
        'We process data to provide the service you request (GDPR Art. 6(1)(b)), and logs and feedback under our legitimate interest in maintaining and improving the service (Art. 6(1)(f)). Sync data is kept until you delete it; feedback for up to 12 months.',
      ),
    ],
  },
  {
    h: t('Twoje prawa', 'Your rights'),
    p: [
      t(
        'Masz prawo dostępu do danych, ich sprostowania, usunięcia, ograniczenia przetwarzania, przeniesienia i sprzeciwu. Kopię danych pobierzesz w Ustawieniach (Eksportuj), a wszystkie dane — także z serwera — usuniesz przyciskiem „Usuń wszystkie dane”. Możesz też złożyć skargę do Prezesa Urzędu Ochrony Danych Osobowych.',
        'You have the right to access, rectify, erase, restrict, port and object to the processing of your data. Download a copy in Settings (Export), and delete everything — including from the server — with “Delete all data”. You may also lodge a complaint with your data protection authority (in Poland: the President of the Personal Data Protection Office, UODO).',
      ),
    ],
  },
  {
    h: t('Dzieci', 'Children'),
    p: [t('Serwis nie jest przeznaczony dla osób poniżej 16 roku życia.', 'The service is not intended for anyone under 16.')],
  },
]

const terms = () => [
  {
    h: t('Usługa', 'The service'),
    p: [
      t(
        `Umbra to bezpłatna aplikacja do śledzenia nawyków udostępniana przez ${OWNER}. Korzystając z niej, akceptujesz ten regulamin.`,
        `Umbra is a free habit-tracking app provided by ${OWNER}. By using it you accept these terms.`,
      ),
    ],
  },
  {
    h: t('Bez gwarancji', 'No warranty'),
    p: [
      t(
        'Aplikacja jest udostępniana w obecnej postaci, bez gwarancji nieprzerwanego działania. Rób kopie zapasowe (Ustawienia → Eksportuj) — nie odpowiadamy za utratę danych, np. po wyczyszczeniu przeglądarki lub zgubieniu kodu synchronizacji.',
        "The app is provided as is, with no guarantee of uninterrupted operation. Keep backups (Settings → Export) — we are not liable for data loss, e.g. after clearing your browser or losing your sync code.",
      ),
    ],
  },
  {
    h: t('Zdrowie', 'Health'),
    p: [
      t(
        'Umbra nie udziela porad medycznych, dietetycznych ani treningowych. Zanim zaczniesz nowy plan treningu lub diety, skonsultuj się ze specjalistą.',
        'Umbra does not give medical, dietary or training advice. Consult a professional before starting a new training or diet plan.',
      ),
    ],
  },
  {
    h: t('Zasady korzystania', 'Acceptable use'),
    p: [
      t(
        'Nie próbuj zakłócać działania serwisu, zgadywać cudzych kodów ani wykorzystywać go do celów niezgodnych z prawem. Twój kod synchronizacji działa jak hasło — nie udostępniaj go.',
        "Do not try to disrupt the service, guess other people's codes, or use it for unlawful purposes. Your sync code works like a password — do not share it.",
      ),
    ],
  },
  {
    h: t('Zmiany', 'Changes'),
    p: [
      t(
        'Możemy rozwijać, zmieniać lub zakończyć usługę oraz aktualizować ten regulamin. O istotnych zmianach poinformujemy w aplikacji.',
        'We may develop, change or discontinue the service and update these terms. We will announce significant changes in the app.',
      ),
    ],
  },
]

export default function LegalPanel({ open, initialTab = 'privacy', onClose }) {
  return (
    <Modal open={open} title={t('Prywatność i regulamin', 'Privacy & terms')} onClose={onClose} wide>
      <LegalBody initialTab={initialTab} />
    </Modal>
  )
}

function LegalBody({ initialTab }) {
  const [tab, setTab] = useState(initialTab)
  const sections = tab === 'privacy' ? privacy() : terms()
  return (
    <div className="space-y-6">
      <Segmented
        id="legal-tab"
        size="sm"
        value={tab}
        onChange={setTab}
        options={[
          { value: 'privacy', label: t('Polityka prywatności', 'Privacy policy') },
          { value: 'terms', label: t('Regulamin', 'Terms of use') },
        ]}
      />
      <div className="max-h-[60vh] space-y-5 overflow-y-auto pr-2">
        {sections.map((s) => (
          <section key={s.h}>
            <h3 className="font-display text-[12px] font-bold tracking-[0.2em] text-stone-200 uppercase">{s.h}</h3>
            {s.p.map((p, i) => (
              <p key={i} className="mt-2 text-[13px] leading-relaxed text-white/60">
                {p}
              </p>
            ))}
          </section>
        ))}
        <p className="text-[11px] text-white/35">
          {t('Ostatnia aktualizacja', 'Last updated')}: {formatDay(POLICY_DATE, { day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </div>
    </div>
  )
}
