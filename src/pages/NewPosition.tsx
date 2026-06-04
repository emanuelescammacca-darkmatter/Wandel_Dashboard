import { Fragment, useEffect, useRef, useState, type ReactNode } from 'react';
import { CARD_GRADIENT } from '../theme';
import { WandelBadge, CHATBOT_CARD_HOVER, CHATBOT_COMPOSER_GLOW } from '../components/SophiaChrome';

interface Message {
  id: number;
  role: 'user' | 'assistant';
  text: string;
}

interface DocSection {
  heading: string;
  placeholder?: string;
  bullets?: string[];
}

// A premade job-description outline: top-level sections, each holding several
// sub-blocks. Each sub-block is a fillable slot (header above a quote box).
interface DocBlock {
  heading: string;
  // Follow-up screening questions shown (with arrow icons) under this block on the
  // Follow-up step — questions not already covered by the job description itself.
  questions?: string[];
}
interface DocGroup {
  header: string;
  blocks: DocBlock[];
}

interface Step {
  label: string;
  docTitle: string;
  description: string;
  sections: DocSection[];
  preview?: boolean;
  // Render this step's section bullets with a down-then-right elbow connector
  // (instead of plain dots), so each item reads as branching off its section.
  arrowBullets?: boolean;
  // When set, the doc panel renders these premade groups instead of `sections`:
  // a larger header per group, then each sub-block as a header ABOVE a quote block
  // that shows "…" (grey) while empty and the typed body (black) once filled.
  groups?: DocGroup[];
  // When set, the grouped render also shows each block's `questions` as arrow-icon
  // follow-up questions (the Follow-up step).
  showQuestions?: boolean;
}

// Shared job-description outline (generic, fits almost any role). Used by the
// Position step (no questions shown) and the Follow-up step, which overlays the
// arrow-icon screening questions — questions a recruiter asks that the JD itself
// doesn't state (candidate motivation, experience depth, availability, expectations).
const JOB_FRAMEWORK: DocGroup[] = [
  {
    header: 'Company & Role',
    blocks: [
      { heading: 'About the company' },
      { heading: 'Role summary', questions: ['What attracts you to this role and our company?'] },
    ],
  },
  {
    header: 'Location & Travel',
    blocks: [
      { heading: 'Work location & commute' },
      { heading: 'Travel & driving licence' },
    ],
  },
  {
    header: 'Responsibilities',
    blocks: [
      { heading: 'Core responsibilities' },
      { heading: 'Day-to-day tasks' },
    ],
  },
  {
    header: 'Requirements',
    blocks: [
      { heading: 'Education & qualifications' },
      {
        heading: 'Skills & experience',
        questions: [
          'How many years of hands-on experience do you have in this area?',
          'Can you walk us through a recent project you led?',
        ],
      },
      { heading: 'Language requirements' },
    ],
  },
  {
    header: 'Conditions',
    blocks: [
      { heading: 'Start date, contract & hours', questions: ['What is your notice period and earliest possible start date?'] },
      { heading: 'Compensation', questions: ['What are your salary expectations?'] },
    ],
  },
  {
    header: 'Benefits',
    blocks: [
      { heading: 'Benefits & perks' },
      { heading: 'Learning & development' },
    ],
  },
  {
    header: 'Screening',
    blocks: [
      { heading: 'Questions to ask the candidate' },
    ],
  },
];

// Demo content for the shared job-description store (bodies[0]), one entry per
// JOB_FRAMEWORK block in order — summarised from the example Ventilmechaniker posting.
const MOCK_CONTENT: string[] = [
  // Company & Role
  'Die RENG-Gruppe ist ein wachsendes, familiengeprägtes Unternehmen mit starken Wurzeln in der Industrie- und Elektrotechnik und gestaltet an mehreren Standorten die technische Zukunft ihrer Kunden.',
  'Als Ventilmechaniker (m/w/d) bist du für Montage, Wartung und Reparatur von Regelventilen in der Verfahrenstechnik verantwortlich und betreust Kunden technisch in der DACH-Region.',
  // Location & Travel
  'Standort Neustadt an der Donau. Gut erreichbar über vorhandene Bus- und Bahnverbindungen; ein eigenes Auto ist nicht zwingend erforderlich.',
  'Führerschein Klasse B für Einsätze vor Ort erforderlich. Reisebereitschaft von ca. 30% in der DACH-Region, teils mit Übernachtung.',
  // Responsibilities
  'Montage, Wartung, Reparatur und Instandhaltung von Regelventilen und Durchflussanzeigen sowie technische Beratung und Unterstützung bei der Angebotserstellung.',
  'Bearbeitung von Reparatur- und Serviceaufträgen, Erstellung der Prüfdokumentation und der Arbeits- und Materialaufmaße, Unterstützung bei technischen Abnahmen und Analyse technischer Parameter.',
  // Requirements
  'Abgeschlossene Ausbildung im elektrotechnischen oder mechanischen Bereich (z. B. Landmaschinen-, Industrie- oder KFZ-Mechaniker). Zusatzqualifikationen von Vorteil; Herstellerschulungen sind vorgesehen.',
  'Grundkenntnisse in Microsoft Office und ERP-Systemen; zuverlässiger Teamplayer mit strukturierter Arbeitsweise, Kommunikationsstärke und Kundenorientierung.',
  'Deutsch auf gutem Niveau (B2–C1) und Englisch mindestens B1.',
  // Conditions
  'Start ab sofort, unbefristete Festanstellung, 40 Stunden/Woche. Einsätze überwiegend vor Ort, ca. 30% im DACH-Raum mit Übernachtung.',
  'Gehalt 45.000–50.000 € brutto/Jahr, leistungsgerechte und faire Vergütung sowie eine gute betriebliche Altersvorsorge.',
  // Benefits
  'Sicherer, moderner Arbeitsplatz, 30 Tage Urlaub, Lebensarbeitszeitkonto und Sonderurlaub, monatlicher Sportzuschuss (25 €) und Kinderbetreuungszuschuss (bis 75 €) sowie Mitarbeiterevents.',
  'Förderung der persönlichen und fachlichen Weiterentwicklung durch individuelle Schulungs- und Weiterbildungsmaßnahmen.',
  // Screening — left empty
  '',
];

const STEPS: Step[] = [
  {
    label: 'Position',
    docTitle: 'Position Description',
    description: 'Define what the role is and the requirements the candidate must meet.',
    sections: [],
    groups: JOB_FRAMEWORK,
  },
  {
    label: 'Follow-up',
    docTitle: 'Follow-up Questions',
    description: 'Set the follow-up questions to ask qualified candidates when screening.',
    sections: [],
    // Same job-description framework as step 0, plus the arrow-icon questions.
    groups: JOB_FRAMEWORK,
    showQuestions: true,
  },
  {
    label: 'Preview',
    docTitle: 'Position Preview',
    description: 'Review the assembled position as it will appear, and fine-tune any details before publishing.',
    preview: true,
    sections: [
      { heading: 'Final Adjustments', placeholder: 'Keep chatting to refine any details — your changes update the preview live.' },
    ],
  },
];

interface SetupCard {
  label: string;
  description: string;
  intro: string; // assistant message shown when this format is picked
  icon: ReactNode;
}

// How the client wants to provide the position — picking any format starts the
// same job-description flow on the right.
const SETUP_CARDS: SetupCard[] = [
  {
    label: 'Chat with Sophia',
    description: 'Describe the role in a conversation and Sophia builds it out step by step.',
    intro: "Great — let's build the position together. Tell me about the role and I'll fill in the document on the right.",
    icon: (
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.77 9.77 0 01-4-.85L3 21l1.85-5A7.72 7.72 0 013 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
    ),
  },
  {
    label: 'Send a link',
    description: 'Paste a link to an existing job posting and we’ll import the details.',
    intro: "Sure — paste the link to the job posting and I'll pull the details into the document on the right.",
    icon: (
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7} d="M13.828 10.172a4 4 0 010 5.656l-3 3a4 4 0 01-5.656-5.656l1.5-1.5M10.172 13.828a4 4 0 010-5.656l3-3a4 4 0 015.656 5.656l-1.5 1.5" /></svg>
    ),
  },
  {
    label: 'Upload a document',
    description: 'Upload a PDF or Word file and we’ll extract the position details.',
    intro: "Sure — upload the job description (PDF or Word) and I'll extract the details into the document on the right.",
    icon: (
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7} d="M12 16V4m0 0L8 8m4-4l4 4M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2" /></svg>
    ),
  },
];

// ── Flow chart ──────────────────────────────────────────────────────────────

function CheckIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.6} d="M5 13l4 4L19 7" />
    </svg>
  );
}

// Down-then-right elbow connector used as the bullet marker on the Follow-up
// step, so each question visibly branches off (and belongs to) its section block.
function BulletConnector() {
  return (
    <svg
      aria-hidden="true"
      className="shrink-0 text-indigo-400 mt-[-3px]"
      width="16"
      height="22"
      viewBox="0 0 16 22"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.4}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* drop down from the section, round the corner, run right */}
      <path d="M3 0 V10 a3 3 0 0 0 3 3 H13" />
      {/* arrowhead pointing right */}
      <path d="M10.5 10.5 L13.5 13 L10.5 15.5" />
    </svg>
  );
}

function Arrow({ active }: { active: boolean }) {
  return (
    <svg
      className={`w-16 h-3 shrink-0 transition-colors ${active ? 'text-indigo-400' : 'text-white/20'}`}
      viewBox="0 0 64 12"
      fill="none"
      stroke="currentColor"
    >
      <path d="M1 6 H56" strokeWidth={1.5} strokeLinecap="round" />
      <path d="M52 1.5 L58.5 6 L52 10.5" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function FlowChart({
  completed,
  activeStep,
  onSelect,
  hoverDescription = false,
  inlineDescription = false,
  noGlow = false,
}: {
  completed: boolean[];
  activeStep: number | null;
  onSelect: (i: number) => void;
  hoverDescription?: boolean;
  inlineDescription?: boolean;
  noGlow?: boolean;
}) {
  return (
    <div className="flex items-center justify-center gap-5 w-full">
        {STEPS.map((step, i) => {
          const isComplete = completed[i];
          const isActive = activeStep === i && !isComplete;

          const titleColor = isActive ? 'text-indigo-100' : isComplete ? 'text-indigo-200/90' : 'text-slate-300';

          return (
            <Fragment key={step.label}>
              <button
                onClick={() => onSelect(i)}
                className={`group relative flex flex-col items-center text-center w-64 shrink-0 rounded-2xl border px-4 py-3 transition-all duration-150 ${
                  isActive
                    ? 'border-indigo-400/70 bg-indigo-500/25 shadow-[0_0_0_4px_rgba(129,140,248,0.18),0_0_22px_rgba(129,140,248,0.35)]'
                    : isComplete
                    ? 'border-indigo-400/25 bg-white/[0.12]'
                    : noGlow
                    ? 'border-white/10 bg-white/[0.10]'
                    : 'border-white/10 bg-white/[0.10] hover:border-indigo-400/40 hover:bg-white/[0.16]'
                }`}
                title={step.label}
              >
                <span className={`flex items-center gap-1.5 text-[13px] font-semibold transition-colors ${titleColor}`}>
                  Step {i + 1} - {step.label}
                  {isComplete && (
                    <span className="inline-flex w-4 h-4 items-center justify-center rounded-full bg-indigo-500 text-white">
                      <CheckIcon className="w-2.5 h-2.5" />
                    </span>
                  )}
                </span>
                {inlineDescription && (
                  <p className="mt-1 text-[11px] leading-snug text-slate-400">{step.description}</p>
                )}
                {hoverDescription && (
                  <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-60 px-3 py-2 rounded-md bg-neutral-700/90 text-white/90 text-[11px] leading-snug font-medium pointer-events-none select-none z-50 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                    {step.description}
                  </div>
                )}
              </button>

              {i < STEPS.length - 1 && <Arrow active={completed[i]} />}
            </Fragment>
          );
        })}
    </div>
  );
}

// ── Position preview (shown for the Preview step) ───────────────────────────
// Compiles everything gathered in the earlier steps into a read-through of the
// position. It stays editable: jumping back to any step (or chatting on the
// Preview step itself) updates this view live.

function PreviewSection({ heading, body }: { heading: string; body: string }) {
  return (
    <div className="border-l-2 border-blue-300 pl-4">
      <h3 className="text-sm font-bold text-gray-800">{heading}</h3>
      {body ? (
        <p className="mt-1.5 text-sm leading-relaxed text-gray-700 whitespace-pre-wrap break-words">{body}</p>
      ) : (
        <p className="mt-1.5 text-sm leading-relaxed text-gray-400 italic">Nothing added yet.</p>
      )}
    </div>
  );
}

function PositionPreview({ bodies }: { bodies: string[][] }) {
  const previewIdx = STEPS.findIndex((s) => s.preview);
  const note = bodies[previewIdx]?.[0] ?? '';
  return (
    <div className="flex flex-col gap-6">
      {/* The assembled job description: the shared framework once, with each block's
          follow-up questions inline. Content comes from the shared store (bodies[0]). */}
      {(() => {
        let i = 0; // flat index into bodies[0]
        return JOB_FRAMEWORK.map((group) => (
          <section key={group.header} className="flex flex-col gap-2.5">
            <p className="text-[15px] font-bold text-gray-900">{group.header}</p>
            {group.blocks.map((block) => {
              const body = bodies[0]?.[i++] ?? '';
              return (
                <div key={block.heading} className="flex flex-col gap-1.5">
                  <PreviewSection heading={block.heading} body={body} />
                  {block.questions && block.questions.length > 0 && (
                    <ul className="flex flex-col gap-0.5 pl-5">
                      {block.questions.map((qq) => (
                        <li key={qq} className="flex items-start gap-2 text-sm leading-relaxed text-gray-700">
                          <BulletConnector />
                          <span>{qq}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })}
          </section>
        ));
      })()}

      {note && (
        <section className="flex flex-col gap-2.5">
          <p className="text-[11px] uppercase tracking-[0.08em] font-semibold text-indigo-500/80">Final Adjustments</p>
          <PreviewSection heading="Notes" body={note} />
        </section>
      )}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────

// Number of fillable slots in a step: one per sub-block for grouped steps, else one per section.
const slotCount = (s: Step) => (s.groups ? s.groups.reduce((n, g) => n + g.blocks.length, 0) : s.sections.length);
const emptyBodies = () => STEPS.map((s) => Array.from({ length: slotCount(s) }, () => ''));
// Empty bodies pre-filled with the demo job description (shared store, bodies[0]).
const initialBodies = () => {
  const b = emptyBodies();
  MOCK_CONTENT.forEach((text, i) => { if (i < b[0].length) b[0][i] = text; });
  return b;
};

// The number this new position takes in the sidebar — next after the existing
// client positions (currently "1" and "2"), so a freshly created position is "3".
const NEW_POSITION_NUMBER = 3;

export default function NewPosition() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState('');
  const [completed, setCompleted] = useState<boolean[]>([false, false, false]);
  const [activeStep, setActiveStep] = useState<number | null>(null);
  // bodies[stepIndex][sectionIndex] = section text
  const [bodies, setBodies] = useState<string[][]>(initialBodies);
  // Onboarding flow: idle → setup cards → working (doc open)
  const [started, setStarted] = useState(false);
  const [positionName, setPositionName] = useState('');
  // Per-sub-block "done" checkboxes (keyed by block heading; purely visual).
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const toggleChecked = (key: string) => setChecked((p) => ({ ...p, [key]: !p[key] }));

  const taRef = useRef<HTMLTextAreaElement>(null);
  const idRef = useRef(0);
  const bottomRef = useRef<HTMLDivElement>(null);

  const docOpen = activeStep !== null;
  const isPreview = activeStep !== null && STEPS[activeStep].preview === true;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-grow the composer textarea up to a max height.
  const autoGrow = () => {
    const el = taRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  };

  const openStep = (i: number) => setActiveStep(i);

  const resetComposer = () => {
    setDraft('');
    requestAnimationFrame(() => {
      if (taRef.current) taRef.current.style.height = 'auto';
    });
  };

  // Client picked a format → open the job description flow with a matching intro.
  const pickSetupCard = (card: SetupCard) => {
    setStarted(true);
    setMessages((prev) => [
      ...prev,
      { id: idRef.current++, role: 'assistant', text: card.intro },
    ]);
    setActiveStep(0);
  };

  const send = () => {
    const text = draft.trim();
    if (!text) return;

    // Pre-document phase: the first message is the position name → open the side card.
    if (activeStep === null) {
      setStarted(true);
      setPositionName(text);
      setMessages((prev) => [
        ...prev,
        { id: idRef.current++, role: 'user', text },
        {
          id: idRef.current++,
          role: 'assistant',
          text: `Perfect — "${text}" it is. I've opened the position details on the right; let's fill them in together.`,
        },
      ]);
      setActiveStep(0);
      resetComposer();
      return;
    }

    const step = activeStep;
    setMessages((prev) => [
      ...prev,
      { id: idRef.current++, role: 'user', text },
      {
        id: idRef.current++,
        role: 'assistant',
        text: `Got it — I've added that to the ${STEPS[step].docTitle} document on the right.`,
      },
    ]);

    // Reflect the input in the document. Grouped steps share one job-description
    // store (bodies[0]) — fill its first still-empty block; otherwise append to the
    // step's single section.
    setBodies((prev) => {
      const next = prev.map((s) => [...s]);
      const contentStep = STEPS[step].groups ? 0 : step;
      let idx = 0;
      if (STEPS[step].groups) {
        const firstEmpty = next[0].findIndex((b) => !b);
        idx = firstEmpty === -1 ? next[0].length - 1 : firstEmpty;
      }
      const cur = next[contentStep][idx];
      next[contentStep][idx] = cur ? `${cur}\n${text}` : text;
      return next;
    });

    resetComposer();
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const markComplete = () => {
    if (activeStep === null) return;
    setCompleted((prev) => {
      const next = [...prev];
      next[activeStep] = true;
      return next;
    });
    const nextStep = activeStep + 1;
    if (nextStep < STEPS.length) setActiveStep(nextStep);
  };

  const showEmpty = !started && !docOpen;
  const showSetup = started && !docOpen;

  return (
    <div className="relative flex-1 flex flex-col overflow-hidden bg-[#0b1437]">
      {/* ── Flow chart (timeline, top center) — only after a step is started ── */}
      {docOpen && (
        <div className="relative z-30 shrink-0 px-6 pt-2 pb-2 animate-fade-scale-in">
          <FlowChart completed={completed} activeStep={activeStep} onSelect={openStep} hoverDescription />
        </div>
      )}

      {/* ── Split area: chat | document ── */}
      <div className="relative z-10 flex-1 min-h-0 flex">
        {/* Chat column */}
        <div className={`flex flex-col min-h-0 ${docOpen ? 'w-1/2' : 'flex-1'}`}>
          <div className="flex-1 min-h-0 overflow-y-auto">
            {showEmpty ? (
              <div className="h-full flex flex-col items-center justify-center px-4 text-center animate-fade-scale-in">
                <WandelBadge className="mb-4" />
                <h2 className="text-xl font-semibold text-white">Create a new position</h2>

                {/* Flow chart preview */}
                <div className="w-full max-w-6xl mt-6">
                  <FlowChart completed={completed} activeStep={activeStep} onSelect={openStep} inlineDescription noGlow />
                </div>

                <button
                  onClick={() => setStarted(true)}
                  style={{ background: CARD_GRADIENT }}
                  className={`mt-8 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-gray-200 shadow-sm text-gray-800 text-sm font-medium ${CHATBOT_CARD_HOVER}`}
                >
                  Start with Position
                </button>
              </div>
            ) : showSetup ? (
              <div className="h-full flex flex-col items-center justify-center px-6 text-center animate-fade-scale-in">
                <WandelBadge className="mb-4" />
                <h2 className="text-xl font-semibold text-white">How would you like to add the position?</h2>
                <p className="mt-1.5 text-sm text-slate-300 max-w-md">
                  Choose a format to get started — chat it through, import a link, or upload a document.
                </p>
                <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 auto-rows-fr gap-4 w-full max-w-2xl">
                  {SETUP_CARDS.map((card) => (
                    <button
                      key={card.label}
                      onClick={() => pickSetupCard(card)}
                      style={{ background: CARD_GRADIENT }}
                      className={`flex flex-col items-start text-left gap-1.5 h-full rounded-xl border border-gray-200 shadow-md px-5 py-4 ${CHATBOT_CARD_HOVER}`}
                    >
                      <span className="w-10 h-10 flex items-center justify-center rounded-lg bg-[#1e3a5f]/10 text-[#1e3a5f] [&_svg]:w-6 [&_svg]:h-6">
                        {card.icon}
                      </span>
                      <span className="mt-1.5 text-[15px] font-semibold text-gray-800">{card.label}</span>
                      <span className="text-xs leading-snug text-gray-500">{card.description}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className={`mx-auto px-4 py-6 flex flex-col gap-4 ${docOpen ? 'max-w-full' : 'max-w-3xl'}`}>
                {messages.map((m) => (
                  <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap break-words ${
                        m.role === 'user'
                          ? 'bg-[#1e3a5f] text-white'
                          : 'bg-white border border-gray-200 text-gray-800'
                      }`}
                    >
                      {m.text}
                    </div>
                  </div>
                ))}
                <div ref={bottomRef} />
              </div>
            )}
          </div>

          {/* Composer */}
          <div className="shrink-0 px-4 pb-5 pt-2">
            <div className={`mx-auto ${docOpen ? 'max-w-full' : 'max-w-3xl'}`}>
              <div style={{ background: CARD_GRADIENT }} className={`rounded-2xl border border-gray-200 shadow-sm ${CHATBOT_COMPOSER_GLOW}`}>
                <textarea
                  ref={taRef}
                  value={draft}
                  onChange={(e) => { setDraft(e.target.value); autoGrow(); }}
                  onKeyDown={onKeyDown}
                  rows={1}
                  placeholder={docOpen ? `Describe the ${STEPS[activeStep!].label.toLowerCase()}…` : 'Describe the new position…'}
                  className="w-full resize-none bg-transparent px-4 pt-3.5 pb-2 text-sm text-gray-800 placeholder:text-gray-400 outline-none max-h-[200px]"
                />

                <div className="border-t border-gray-100" />

                <div className="flex items-center justify-between px-2.5 py-2">
                  <button
                    type="button"
                    title="Attach file"
                    aria-label="Attach file"
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                    </svg>
                  </button>

                  <button
                    type="button"
                    onClick={send}
                    disabled={!draft.trim()}
                    title="Send"
                    aria-label="Send message"
                    className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors ${
                      draft.trim()
                        ? 'bg-[#1e3a5f] text-white hover:bg-[#27496d]'
                        : 'bg-gray-100 text-gray-300 cursor-not-allowed'
                    }`}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19V5m0 0l-6 6m6-6l6 6" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Document panel — floating page (matches composer side/bottom margins) */}
        {docOpen && (
          <div className="w-1/2 min-h-0 flex pt-4 pb-5 pr-4 pl-1 animate-panel-in">
            <div
              style={{ background: isPreview ? '#eff6ff' : '#ffffff' }}
              className={`flex-1 flex flex-col min-h-0 rounded-2xl border shadow-sm overflow-hidden ${
                isPreview ? 'border-blue-300' : 'border-gray-200'
              }`}
            >
              {/* Doc header */}
              <div className="shrink-0 flex items-center justify-between px-5 py-3 border-b border-gray-300">
                <div className="flex items-center gap-2 min-w-0">
                  {/* Numbered badge matching the sidebar's position numbers (the new position's number) */}
                  <svg className="w-5 h-5 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <rect x="3.5" y="3.5" width="17" height="17" rx="4.5" strokeWidth={1.6} />
                    <text x="12" y="16.2" textAnchor="middle" fontSize="11" fontWeight="700" fill="currentColor" stroke="none">{NEW_POSITION_NUMBER}</text>
                  </svg>
                  <div className="min-w-0">
                    <span className="block text-sm font-semibold text-gray-800 truncate">{STEPS[activeStep!].docTitle}</span>
                    {positionName && (
                      <span className="block text-[11px] text-gray-400 truncate">{positionName}</span>
                    )}
                  </div>
                  {isPreview && (
                    <span className="shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-[0.1em] bg-blue-500/10 text-blue-600 border border-blue-300">
                      Preview
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {completed[activeStep!] ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border border-[#1e3a5f]/25 bg-[#1e3a5f]/5 text-[#1e3a5f]">
                      <CheckIcon className="w-3.5 h-3.5" /> Completed
                    </span>
                  ) : (
                    <button
                      onClick={markComplete}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-[#1e3a5f] text-white hover:bg-[#27496d] transition-colors"
                    >
                      <CheckIcon className="w-3.5 h-3.5" /> Mark complete
                    </button>
                  )}
                  <button
                    onClick={() => setActiveStep(null)}
                    title="Close panel"
                    aria-label="Close document panel"
                    className="w-7 h-7 flex items-center justify-center rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Doc body — Notion-style sections (left rule, bold heading, no box) */}
              <div className="flex-1 min-h-0 overflow-y-auto px-6 py-5 flex flex-col gap-6">
                {isPreview ? (
                  <PositionPreview bodies={bodies} />
                ) : STEPS[activeStep!].groups ? (
                  <div className="flex flex-col gap-7">
                    {STEPS[activeStep!].groups!.map((group, gi) => {
                      // Flat body index of this group's first sub-block.
                      const start = STEPS[activeStep!].groups!.slice(0, gi).reduce((n, g) => n + g.blocks.length, 0);
                      return (
                        <section key={group.header}>
                          {/* Larger section header standing above its sub-blocks */}
                          <h2 className="text-[17px] font-bold text-gray-900 mb-2.5">{group.header}</h2>
                          <div className="flex flex-col gap-4">
                            {group.blocks.map((block, bi) => {
                              // Content is shared across grouped steps (canonical in bodies[0]),
                              // so the Follow-up step mirrors the first step exactly.
                              const body = bodies[0][start + bi];
                              const filled = !!body;

                              // Follow-up step (step 2): plain block + arrow questions, each with its own checkbox.
                              if (STEPS[activeStep!].showQuestions) {
                                return (
                                  <div key={block.heading} className="border-l-2 border-gray-300 pl-4">
                                    <h3 className={`text-sm font-semibold mb-1 ${filled ? 'text-gray-800' : 'text-gray-400 italic'}`}>{block.heading}</h3>
                                    {filled ? (
                                      <p className="text-sm leading-relaxed text-gray-900 whitespace-pre-wrap break-words">{body}</p>
                                    ) : (
                                      <p className="text-sm leading-relaxed text-gray-400 select-none">…</p>
                                    )}
                                    {block.questions && block.questions.length > 0 && (
                                      <ul className="mt-2 flex flex-col gap-0.5 pl-1">
                                        {block.questions.map((qq) => {
                                          const qChecked = !!checked[qq];
                                          return (
                                            <li
                                              key={qq}
                                              className={`flex items-start gap-1.5 text-sm leading-relaxed rounded-md py-1.5 pl-1.5 pr-2 transition-colors ${qChecked ? 'bg-blue-50 text-gray-800' : 'text-gray-700'}`}
                                            >
                                              <BulletConnector />
                                              {/* Subtle done-checkbox in front of the question (next to the arrow) */}
                                              <button
                                                type="button"
                                                role="checkbox"
                                                aria-checked={qChecked}
                                                aria-label={`Mark “${qq}” done`}
                                                onClick={() => toggleChecked(qq)}
                                                className={`shrink-0 mt-0.5 w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                                                  qChecked
                                                    ? 'bg-blue-100 border-blue-300 text-blue-600'
                                                    : 'bg-white border-gray-300 hover:border-gray-400 text-transparent'
                                                }`}
                                              >
                                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                                              </button>
                                              <span>{qq}</span>
                                            </li>
                                          );
                                        })}
                                      </ul>
                                    )}
                                  </div>
                                );
                              }

                              // Position step (step 1): a checkbox next to each block title; checking shades the block.
                              const isChecked = !!checked[block.heading];
                              return (
                                <div
                                  key={block.heading}
                                  className={`border-l-2 rounded-r-md pl-4 pr-3 py-2 transition-colors ${isChecked ? 'border-blue-300 bg-blue-50' : 'border-gray-300'}`}
                                >
                                  <div className="flex items-center gap-2">
                                    {/* Subtle done-checkbox in front of the block title */}
                                    <button
                                      type="button"
                                      role="checkbox"
                                      aria-checked={isChecked}
                                      aria-label={`Mark “${block.heading}” done`}
                                      onClick={() => toggleChecked(block.heading)}
                                      className={`shrink-0 w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                                        isChecked
                                          ? 'bg-blue-100 border-blue-300 text-blue-600'
                                          : 'bg-white border-gray-300 hover:border-gray-400 text-transparent'
                                      }`}
                                    >
                                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                                    </button>
                                    <h3 className={`text-sm font-semibold ${filled ? 'text-gray-800' : 'text-gray-400 italic'}`}>{block.heading}</h3>
                                  </div>
                                  {filled ? (
                                    <p className="mt-1 text-sm leading-relaxed text-gray-900 whitespace-pre-wrap break-words">{body}</p>
                                  ) : (
                                    <p className="mt-1 text-sm leading-relaxed text-gray-400 select-none">…</p>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </section>
                      );
                    })}
                  </div>
                ) : (
                  STEPS[activeStep!].sections.map((sec, i) => {
                  const body = bodies[activeStep!][i];
                  const filled = !!body;
                  const arrowBullets = STEPS[activeStep!].arrowBullets;

                  // Bullet-template section (Follow-up step): grey/italic until described, then black.
                  if (sec.bullets) {
                    return (
                      <div key={sec.heading} className="border-l-2 border-gray-400 pl-4">
                        <h3 className={`text-sm font-bold ${filled ? 'text-gray-900' : 'text-gray-400 italic'}`}>
                          {sec.heading}
                        </h3>
                        <ul className={`mt-2 flex flex-col ${arrowBullets ? 'gap-0.5 pl-1' : 'gap-1.5'}`}>
                          {sec.bullets.map((b) => (
                            <li
                              key={b}
                              className={`flex items-start gap-2 text-sm leading-relaxed ${
                                filled ? 'text-gray-700' : 'text-gray-400 italic'
                              }`}
                            >
                              {arrowBullets ? (
                                <BulletConnector />
                              ) : (
                                <span className={`mt-[7px] w-1 h-1 rounded-full shrink-0 ${filled ? 'bg-gray-500' : 'bg-gray-300'}`} />
                              )}
                              <span>{b}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    );
                  }

                  return (
                    <div key={sec.heading} className="border-l-2 border-gray-400 pl-4">
                      <h3 className="text-sm font-bold text-gray-800">{sec.heading}</h3>
                      {body ? (
                        <p className="mt-1.5 text-sm leading-relaxed text-gray-700 whitespace-pre-wrap break-words">{body}</p>
                      ) : (
                        <p className="mt-1.5 text-sm leading-relaxed text-gray-400 italic">{sec.placeholder}</p>
                      )}
                    </div>
                  );
                  })
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
