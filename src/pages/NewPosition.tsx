import { Fragment, useEffect, useRef, useState, type ReactNode } from 'react';

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

interface Step {
  label: string;
  docTitle: string;
  description: string;
  sections: DocSection[];
}

const STEPS: Step[] = [
  {
    label: 'Position',
    docTitle: 'Position Description',
    description: 'Define what the role is and the requirements the candidate must meet.',
    sections: [
      {
        heading: 'Position description',
        bullets: [
          'Role overview & responsibilities',
          'Requirements & qualifications',
          'Location, working hours & start date',
          'Compensation & benefits',
        ],
      },
    ],
  },
  {
    label: 'Follow-up',
    docTitle: 'Follow-up Questions',
    description: 'Set the follow-up questions to ask qualified candidates when screening.',
    sections: [
      { heading: 'Screening Questions', placeholder: 'Questions to ask qualified candidates.' },
      { heading: 'What to Look For', placeholder: 'What a strong answer to each question looks like.' },
    ],
  },
  {
    label: 'Strategy',
    docTitle: 'Outreach Strategy',
    description: 'Choose the channels to use and when to rely on AI agents or recruiters.',
    sections: [
      { heading: 'Channels', placeholder: 'Which social media and sourcing channels to use, and where to post.' },
      { heading: 'AI Agent', placeholder: 'Where and when to let the AI agent handle outreach and screening.' },
      { heading: 'HR Recruiters', placeholder: 'When to bring in real HR recruiters and hand off to them.' },
    ],
  },
];

interface SetupCard {
  label: string;
  example: string;
  icon: ReactNode;
}

const SETUP_CARDS: SetupCard[] = [
  {
    label: 'Domain',
    example: 'Healthcare, Logistics, IT…',
    icon: (
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7} d="M3.6 9h16.8M3.6 15h16.8M12 3a15 15 0 010 18M12 3a15 15 0 000 18M12 3a9 9 0 100 18 9 9 0 000-18z" /></svg>
    ),
  },
  {
    label: 'Seniority',
    example: 'Junior · Mid · Senior · Lead',
    icon: (
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7} d="M3 20h4v-7H3v7zm7 0h4V4h-4v16zm7 0h4v-11h-4v11z" /></svg>
    ),
  },
  {
    label: 'Employment Type',
    example: 'Full-time · Part-time · Contract',
    icon: (
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7} d="M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
    ),
  },
  {
    label: 'Work Model',
    example: 'On-site · Hybrid · Remote',
    icon: (
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7} d="M3 12l9-9 9 9M5 10v10a1 1 0 001 1h12a1 1 0 001-1V10" /></svg>
    ),
  },
  {
    label: 'Location',
    example: 'City / region',
    icon: (
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7} d="M12 21s7-5.5 7-11a7 7 0 10-14 0c0 5.5 7 11 7 11z" /><circle cx="12" cy="10" r="2.5" strokeWidth={1.7} /></svg>
    ),
  },
  {
    label: 'Compensation',
    example: 'Salary range & benefits',
    icon: (
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" strokeWidth={1.7} /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7} d="M14.5 9.5a2.5 2.5 0 00-2.5-1.5c-1.4 0-2.5.9-2.5 2s1.1 2 2.5 2 2.5.9 2.5 2-1.1 2-2.5 2a2.5 2.5 0 01-2.5-1.5M12 6.5v11" /></svg>
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

function Arrow({ active }: { active: boolean }) {
  return (
    <svg
      className={`w-16 h-3 shrink-0 transition-colors ${active ? 'text-[#1e3a5f]' : 'text-gray-300'}`}
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

          const titleColor = isComplete || isActive ? 'text-[#1e3a5f]' : 'text-gray-600';

          return (
            <Fragment key={step.label}>
              <button
                onClick={() => onSelect(i)}
                className={`group relative flex flex-col items-center text-center w-64 shrink-0 rounded-2xl border px-4 py-3 transition-all duration-150 ${
                  isActive
                    ? 'border-[#1e3a5f] bg-[#1e3a5f]/[0.06] shadow-[0_0_0_4px_rgba(30,58,95,0.08)]'
                    : noGlow
                    ? 'border-gray-200 bg-[#fcfcfc] shadow-sm'
                    : 'border-gray-200 bg-[#fcfcfc] shadow-sm hover:border-[#1e3a5f]/40 hover:shadow-[0_0_0_4px_rgba(30,58,95,0.08)]'
                }`}
                title={step.label}
              >
                <span className={`flex items-center gap-1.5 text-[13px] font-semibold transition-colors ${titleColor}`}>
                  Step {i + 1} - {step.label}
                  {isComplete && (
                    <span className="inline-flex w-4 h-4 items-center justify-center rounded-full bg-[#1e3a5f] text-white">
                      <CheckIcon className="w-2.5 h-2.5" />
                    </span>
                  )}
                </span>
                {inlineDescription && (
                  <p className="mt-1 text-[11px] leading-snug text-gray-500">{step.description}</p>
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

// ── Page ──────────────────────────────────────────────────────────────────

const emptyBodies = () => STEPS.map((s) => s.sections.map(() => ''));

export default function NewPosition() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState('');
  const [completed, setCompleted] = useState<boolean[]>([false, false, false]);
  const [activeStep, setActiveStep] = useState<number | null>(null);
  // bodies[stepIndex][sectionIndex] = section text
  const [bodies, setBodies] = useState<string[][]>(emptyBodies);
  // Onboarding flow: idle → setup cards → working (doc open)
  const [started, setStarted] = useState(false);
  const [positionName, setPositionName] = useState('');

  const taRef = useRef<HTMLTextAreaElement>(null);
  const idRef = useRef(0);
  const bottomRef = useRef<HTMLDivElement>(null);

  const docOpen = activeStep !== null;

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

  // Client picked a setup card → open the job description directly.
  const pickSetupCard = (card: SetupCard) => {
    setStarted(true);
    setMessages((prev) => [
      ...prev,
      {
        id: idRef.current++,
        role: 'assistant',
        text: `Let's build out the position details — starting with ${card.label.toLowerCase()}. Tell me about the role and I'll fill in the document on the right.`,
      },
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
      setBodies((prev) => {
        const next = prev.map((s) => [...s]);
        next[0][0] = `Title: ${text}`;
        return next;
      });
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

    // Reflect the input in the active step's first section.
    setBodies((prev) => {
      const next = prev.map((s) => [...s]);
      const cur = next[step][0];
      next[step][0] = cur ? `${cur}\n${text}` : text;
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
    <div className="flex-1 flex flex-col overflow-hidden bg-[#f5f5f5]">
      {/* ── Flow chart (timeline, top center) — only after a step is started ── */}
      {docOpen && (
        <div className="relative z-30 shrink-0 px-6 pt-2 pb-2 border-b border-gray-200 animate-fade-scale-in">
          <FlowChart completed={completed} activeStep={activeStep} onSelect={openStep} hoverDescription />
        </div>
      )}

      {/* ── Split area: chat | document ── */}
      <div className="flex-1 min-h-0 flex">
        {/* Chat column */}
        <div className={`flex flex-col min-h-0 ${docOpen ? 'w-1/2' : 'flex-1'}`}>
          <div className="flex-1 min-h-0 overflow-y-auto">
            {showEmpty ? (
              <div className="h-full flex flex-col items-center justify-center px-4 text-center animate-fade-scale-in">
                <div className="w-11 h-11 rounded-xl bg-[#1e3a5f] flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold text-gray-800">Create a new position</h2>

                {/* Flow chart preview */}
                <div className="w-full max-w-6xl mt-6">
                  <FlowChart completed={completed} activeStep={activeStep} onSelect={openStep} inlineDescription noGlow />
                </div>

                <button
                  onClick={() => setStarted(true)}
                  className="btn-glow mt-8 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#1e3a5f] text-white text-sm font-medium hover:bg-[#27496d] transition-colors"
                >
                  Start with Position
                </button>
              </div>
            ) : showSetup ? (
              <div className="h-full flex flex-col items-center justify-center px-6 text-center animate-fade-scale-in">
                <h2 className="text-xl font-semibold text-gray-800">Tell us about the position</h2>
                <p className="mt-1.5 text-sm text-gray-500 max-w-md">
                  Pick a starting point — or just describe the role below. We'll guide you through the rest.
                </p>
                <div className="mt-6 grid grid-cols-2 md:grid-cols-3 gap-3 w-full max-w-2xl">
                  {SETUP_CARDS.map((card) => (
                    <button
                      key={card.label}
                      onClick={() => pickSetupCard(card)}
                      className="flex flex-col items-start text-left gap-1 rounded-xl border border-gray-200 bg-white shadow-sm px-4 py-3 transition-all duration-150 hover:border-[#1e3a5f]/40 hover:shadow-[0_0_0_4px_rgba(30,58,95,0.08)]"
                    >
                      <span className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#1e3a5f]/[0.06] text-[#1e3a5f] [&_svg]:w-5 [&_svg]:h-5">
                        {card.icon}
                      </span>
                      <span className="mt-1 text-sm font-semibold text-gray-800">{card.label}</span>
                      <span className="text-[11px] leading-snug text-gray-500">{card.example}</span>
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
              <div className="rounded-2xl border border-gray-200 bg-white shadow-sm transition-all duration-150 hover:border-[#1e3a5f]/40 hover:shadow-[0_0_0_4px_rgba(30,58,95,0.08)] focus-within:border-[#1e3a5f]/40 focus-within:shadow-[0_0_0_4px_rgba(30,58,95,0.08)]">
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
            <div className="flex-1 flex flex-col min-h-0 rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
              {/* Doc header */}
              <div className="shrink-0 flex items-center justify-between px-5 py-3 border-b border-gray-100">
                <div className="flex items-center gap-2 min-w-0">
                  <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <div className="min-w-0">
                    <span className="block text-sm font-semibold text-gray-800 truncate">{STEPS[activeStep!].docTitle}</span>
                    {positionName && (
                      <span className="block text-[11px] text-gray-400 truncate">{positionName}</span>
                    )}
                  </div>
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
                {STEPS[activeStep!].sections.map((sec, i) => {
                  const body = bodies[activeStep!][i];
                  const filled = !!body;

                  // Bullet-template section (Position view): grey/italic until a description is added, then black.
                  if (sec.bullets) {
                    return (
                      <div key={sec.heading} className="border-l-2 border-gray-400 pl-4">
                        <h3 className={`text-sm font-bold ${filled ? 'text-gray-900' : 'text-gray-400 italic'}`}>
                          {sec.heading}
                        </h3>
                        <ul className="mt-2 flex flex-col gap-1.5">
                          {sec.bullets.map((b) => (
                            <li
                              key={b}
                              className={`flex items-start gap-2 text-sm leading-relaxed ${
                                filled ? 'text-gray-700' : 'text-gray-400 italic'
                              }`}
                            >
                              <span className={`mt-[7px] w-1 h-1 rounded-full shrink-0 ${filled ? 'bg-gray-500' : 'bg-gray-300'}`} />
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
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
