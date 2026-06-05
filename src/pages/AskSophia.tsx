import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { CARD_GRADIENT } from '../theme';
import { WandelBadge, ChatMessage, WaveBackground, CHATBOT_CARD_HOVER, CHATBOT_COMPOSER_GLOW } from '../components/SophiaChrome';
import { useTypewriter } from '../hooks/useTypewriter';
import { ALL_CANDIDATES, CandidateCard, type Cand } from './Dashboard';

// Initials avatar helper for the comparison-table header.
const initials = (n: string) => n.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();

interface Message {
  id: number;
  role: 'user' | 'assistant';
  text: string;
}

interface Category {
  label: string;
  description: string;
  icon: ReactNode;
  prompt?: string;  // sent into the chat when picked
  to?: string;      // navigates instead of chatting
  compare?: boolean; // opens the "pick a case to compare" cards instead of chatting
}

// Briefcase glyph used for the case cards (matches the sidebar's Positions icon).
const CASE_ICON = (
  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
);

// The cases shown when "Compare candidates" is picked — the positions the Dashboard candidates
// belong to, each with how many candidates are on it.
const COMPARE_CASES = Array.from(new Set(ALL_CANDIDATES.map((c) => c.position))).map((title) => ({
  title,
  count: ALL_CANDIDATES.filter((c) => c.position === title).length,
}));

// Rows shown in the comparison table, split by the first-column toggle.
type CompareMode = 'job' | 'profile';
const yesCriteria = (c: Cand) => c.criteria.filter((cr) => cr.status === 'yes').map((cr) => cr.label).join(' · ');
const partialCriteria = (c: Cand) => c.criteria.filter((cr) => cr.status === 'partial').map((cr) => cr.label).join(' · ');
const COMPARE_ROWS: Record<CompareMode, { label: string; get: (c: Cand) => string }[]> = {
  job: [
    { label: '💼 Position',    get: (c) => `🔧 ${c.position}` },
    { label: '🎯 Fit',         get: (c) => `🎯 ${c.fitPct}% match` },
    { label: '✅ Strengths',   get: (c) => (yesCriteria(c) ? `✅ ${yesCriteria(c)}` : '—') },
    { label: '⚠️ Watch-outs',  get: (c) => (partialCriteria(c) ? `⚠️ ${partialCriteria(c)}` : '—') },
    { label: '📅 Available',   get: (c) => `📅 Available ${c.available}` },
  ],
  profile: [
    { label: '📍 Location',    get: (c) => `📍 ${c.location} · ${c.distance}` },
    { label: '💼 Position',    get: (c) => `🔧 ${c.position}` },
    { label: '🎯 Fit',         get: (c) => `🎯 ${c.fitPct}% match` },
    { label: '📅 Available',   get: (c) => `📅 Available ${c.available}` },
  ],
};

// The selectable candidates for a case — the Dashboard candidates on that position.
function candidatePoolForCase(title: string): Cand[] {
  return ALL_CANDIDATES.filter((c) => c.position === title);
}

// Static placeholder reply (no backend yet) — "generation" is simulated client-side.
const ASSISTANT_REPLY =
  "Sure — let me look into that for you. Tell me which position or candidate you'd like to focus on.";

const CATEGORIES: Category[] = [
  {
    label: 'Create a new position',
    description: 'Set up a new role from scratch with Sophia.',
    to: '/clients/new-position',
    icon: (
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7} d="M12 5v14m-7-7h14" /></svg>
    ),
  },
  {
    label: 'Compare candidates',
    description: 'Weigh candidates side by side for a case.',
    compare: true,
    icon: (
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7} d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM21 6a3 3 0 11-6 0 3 3 0 016 0zM6 11v9m12-9v9M3 20h6m6 0h6" /></svg>
    ),
  },
  {
    label: 'Summarise a pipeline',
    description: "Get an overview of a position's candidate pipeline.",
    prompt: "Summarise the candidate pipeline for one of my open positions.",
    icon: (
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>
    ),
  },
];

export default function AskSophia() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState('');
  const [comparing, setComparing] = useState(false); // showing the "pick a case to compare" cards
  // The case being compared → drives the comparison table pinned at the top of the view.
  const [comparison, setComparison] = useState<{ title: string; candidates: Cand[] } | null>(null);
  const [compareMode, setCompareMode] = useState<CompareMode>('job'); // first-column toggle
  // Candidate-selection step: the case whose candidates are being chosen, and which are ticked.
  const [selectCase, setSelectCase] = useState<{ title: string; candidates: Cand[] } | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [addMenuOpen, setAddMenuOpen] = useState(false); // "add candidate" popover on the table

  // Shared per-character "generating" reveal (same behaviour across all chat views).
  const { revealed, streamingId, start, isStreaming, displayText } = useTypewriter();

  const taRef = useRef<HTMLTextAreaElement>(null);
  const idRef = useRef(0);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Follow the conversation to the bottom. During streaming only `revealed` changes (not
  // `messages`), so include it; use instant scroll while streaming since smooth can't keep
  // up with the per-character cadence.
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: streamingId !== null ? 'auto' : 'smooth' });
  }, [messages, revealed, streamingId]);

  const autoGrow = () => {
    const el = taRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  };

  const resetComposer = () => {
    setDraft('');
    requestAnimationFrame(() => {
      if (taRef.current) taRef.current.style.height = 'auto';
    });
  };

  const pushExchange = (text: string) => {
    // Compute ids OUTSIDE the updater so the updater stays pure — otherwise React
    // StrictMode double-invokes it, the counter advances twice, and `assistantId`
    // no longer matches the rendered message id (which silently disabled streaming).
    const userId = idRef.current++;
    const assistantId = idRef.current++;
    setMessages((prev) => [
      ...prev,
      { id: userId, role: 'user', text },
      { id: assistantId, role: 'assistant', text: ASSISTANT_REPLY },
    ]);
    start(assistantId, ASSISTANT_REPLY);
  };

  // Sophia opens the conversation herself (no preceding user message).
  const pushAssistant = (text: string) => {
    const id = idRef.current++;
    setMessages((prev) => [...prev, { id, role: 'assistant', text }]);
    start(id, text);
  };

  const send = () => {
    const text = draft.trim();
    if (!text) return;
    pushExchange(text);
    resetComposer();
  };

  const pickCategory = (cat: Category) => {
    if (cat.to) {
      navigate(cat.to);
      return;
    }
    if (cat.compare) {
      setComparing(true);
      return;
    }
    pushExchange(cat.prompt ?? cat.label);
  };

  // Picking a case moves to the candidate-selection step (cards with checkboxes).
  const pickCase = (c: (typeof COMPARE_CASES)[number]) => {
    setComparing(false);
    setSelectCase({ title: c.title, candidates: candidatePoolForCase(c.title) });
    setSelectedIds([]);
  };

  const toggleSelected = (id: string) =>
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  // Confirming the selection opens the comparison table with the chosen candidates.
  const confirmCompare = () => {
    if (!selectCase || selectedIds.length < 2) return;
    const candidates = selectCase.candidates.filter((c) => selectedIds.includes(c.id));
    const title = selectCase.title;
    setComparison({ title, candidates });
    setSelectCase(null);
    setSelectedIds([]);
    pushAssistant("Here's how the candidates compare. Any questions about them — or would you like my take on the strongest fit?");
  };

  const removeCandidate = (id: string) =>
    setComparison((prev) => (prev ? { ...prev, candidates: prev.candidates.filter((c) => c.id !== id) } : prev));

  // Toggle a candidate in/out of the comparison (used by the "add candidate" popover).
  const toggleComparisonCandidate = (cand: Cand) =>
    setComparison((prev) => {
      if (!prev) return prev;
      const has = prev.candidates.some((c) => c.id === cand.id);
      return { ...prev, candidates: has ? prev.candidates.filter((c) => c.id !== cand.id) : [...prev.candidates, cand] };
    });

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const hasMessages = messages.length > 0;

  const composer = (
    <div style={{ background: CARD_GRADIENT }} className={`rounded-2xl border border-gray-200 shadow-sm ${CHATBOT_COMPOSER_GLOW}`}>
      <textarea
        ref={taRef}
        value={draft}
        onChange={(e) => { setDraft(e.target.value); autoGrow(); }}
        onKeyDown={onKeyDown}
        rows={1}
        placeholder="Ask Sophia anything…"
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
  );

  return (
    <div className="relative isolate flex-1 flex flex-col overflow-hidden bg-[#0b1437]">
      {/* ── Background wave ── */}
      <WaveBackground />

      {/* ── Candidate comparison table (pinned at the top; capped to ~1/3 of the view) ── */}
      {comparison && (() => {
        // Shared column widths so the fixed header table and the scrolling body table align.
        const cols = (
          <colgroup>
            <col style={{ width: '20%' }} />
            {comparison.candidates.map((c) => (
              <col key={c.id} style={{ width: `${80 / comparison.candidates.length}%` }} />
            ))}
          </colgroup>
        );
        return (
          <div className="relative z-10 shrink-0 px-4 pt-4 pb-2">
            <div className="relative mx-auto max-w-7xl rounded-xl border border-white/10 overflow-hidden">
              {/* Add-candidate control at the far right of the title row */}
              <button
                type="button"
                onClick={() => setAddMenuOpen(true)}
                title="Add or remove candidates"
                aria-label="Add or remove candidates"
                className="absolute top-2.5 right-2.5 z-20 w-7 h-7 flex items-center justify-center rounded-md text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7} d="M12 5v14m-7-7h14" /></svg>
              </button>

              {/* Fixed title row (its own table, outside the scroll area) */}
              <table className="w-full table-fixed border-separate border-spacing-0 text-sm">
                {cols}
                <thead>
                  <tr>
                    <th className="bg-[#1b2447] text-left px-4 py-3 border-b border-white/15 align-middle">
                      <div className="inline-flex rounded-lg border border-white/10 bg-white/5 p-0.5 text-xs font-medium">
                        <button
                          type="button"
                          onClick={() => setCompareMode('job')}
                          className={`px-2.5 py-1 rounded-md transition-colors ${compareMode === 'job' ? 'bg-white/15 text-white' : 'text-slate-400 hover:text-white'}`}
                        >
                          Job Description
                        </button>
                        <button
                          type="button"
                          onClick={() => setCompareMode('profile')}
                          className={`px-2.5 py-1 rounded-md transition-colors ${compareMode === 'profile' ? 'bg-white/15 text-white' : 'text-slate-400 hover:text-white'}`}
                        >
                          Profile
                        </button>
                      </div>
                    </th>
                    {comparison.candidates.map((c, ci) => (
                      <th key={c.id} className="bg-[#1b2447] text-left px-4 py-3 border-b border-white/15 align-middle">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="w-7 h-7 rounded-full bg-white/10 text-slate-200 flex items-center justify-center text-xs font-semibold shrink-0">
                            {initials(c.name)}
                          </span>
                          <span className="font-semibold text-white truncate">{c.name}</span>
                          <button
                            type="button"
                            onClick={() => removeCandidate(c.id)}
                            title="Remove candidate"
                            aria-label={`Remove ${c.name}`}
                            className={`shrink-0 w-5 h-5 flex items-center justify-center rounded-md text-slate-400 hover:text-white hover:bg-white/10 transition-colors ${ci === comparison.candidates.length - 1 ? 'mr-7' : ''}`}
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                          </button>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
              </table>

              {/* Scrollable body (separate table, same column widths) */}
              <div className="max-h-[33vh] overflow-y-auto chat-scroll">
                <table className="w-full table-fixed border-separate border-spacing-0 text-sm">
                  {cols}
                  <tbody>
                    {COMPARE_ROWS[compareMode].map((row) => (
                      <tr key={row.label}>
                        <td className="px-4 py-2 align-middle font-medium text-slate-400">{row.label}</td>
                        {comparison.candidates.map((c) => (
                          <td key={c.id} className="px-3 py-2 align-top">
                            {/* Entry styled exactly like the category pills under the text box */}
                            <span className="inline-block max-w-full rounded-full border border-white/15 bg-white/5 px-3.5 py-1.5 text-slate-200 break-words hover:border-indigo-400/70 hover:bg-white/10 hover:text-white transition-colors">
                              {row.get(c)}
                            </span>
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── Add/remove candidates popover (opened by the + on the table) ── */}
      {addMenuOpen && comparison && (
        <div
          className="absolute inset-0 z-40 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={() => setAddMenuOpen(false)}
        >
          <div
            className="w-full max-w-7xl max-h-[80vh] overflow-y-auto chat-scroll rounded-2xl border border-white/10 bg-[#16224a] shadow-2xl p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-base font-semibold text-white">Select candidates</span>
              <button
                type="button"
                onClick={() => setAddMenuOpen(false)}
                aria-label="Close"
                className="w-7 h-7 flex items-center justify-center rounded-md text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="flex gap-4 overflow-x-auto snap-x px-6 py-4 chat-scroll x-fade">
              {candidatePoolForCase(comparison.title).map((c) => (
                <CandidateCard
                  key={c.id}
                  c={c}
                  selectable
                  selected={comparison.candidates.some((x) => x.id === c.id)}
                  onToggle={() => toggleComparisonCandidate(c)}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Conversation ── */}
      <div className={`relative z-10 flex-1 min-h-0 overflow-y-auto ${hasMessages ? 'chat-top-fade' : ''}`}>
        {!hasMessages && comparing ? (
          <div className="h-full flex flex-col items-center justify-center px-6 text-center animate-fade-scale-in">
            <WandelBadge className="mb-4" />
            <h2 className="text-2xl font-semibold text-white">Compare candidates</h2>
            <p className="mt-2 text-sm text-slate-300 max-w-xl">
              Pick a case to compare its candidates side by side.
            </p>

            {/* Case cards — same white-card style as the new-position setup cards */}
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 auto-rows-fr gap-4 w-full max-w-2xl">
              {COMPARE_CASES.map((c) => (
                <button
                  key={c.title}
                  onClick={() => pickCase(c)}
                  style={{ background: CARD_GRADIENT }}
                  className={`flex flex-col items-start text-left gap-1.5 h-full rounded-xl border border-gray-200 shadow-md px-5 py-4 ${CHATBOT_CARD_HOVER}`}
                >
                  <span className="w-10 h-10 flex items-center justify-center rounded-lg bg-[#1e3a5f]/10 text-[#1e3a5f] [&_svg]:w-6 [&_svg]:h-6">
                    {CASE_ICON}
                  </span>
                  <span className="mt-1.5 text-[15px] font-semibold text-gray-800">{c.title}</span>
                  <span className="text-xs leading-snug text-gray-500">
                    {c.count} {c.count === 1 ? 'candidate' : 'candidates'}
                  </span>
                </button>
              ))}
            </div>
          </div>
        ) : !hasMessages && selectCase ? (
          <div className="h-full flex flex-col items-center justify-center px-6 text-center animate-fade-scale-in">
            <WandelBadge className="mb-4" />
            <h2 className="text-2xl font-semibold text-white">Select candidates</h2>
            <p className="mt-2 text-sm text-slate-300 max-w-xl">
              Choose the candidates to compare for “{selectCase.title}”.
            </p>

            {/* Candidate cards with a selection checkbox */}
            <div className="mt-6 flex gap-4 overflow-x-auto snap-x w-full px-6 py-4 chat-scroll x-fade">
              {selectCase.candidates.map((c) => (
                <CandidateCard key={c.id} c={c} selectable selected={selectedIds.includes(c.id)} onToggle={() => toggleSelected(c.id)} />
              ))}
            </div>

            <button
              type="button"
              onClick={confirmCompare}
              disabled={selectedIds.length < 2}
              style={{ background: CARD_GRADIENT }}
              className={`mt-8 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-gray-200 shadow-sm text-gray-800 text-sm font-medium ${
                selectedIds.length >= 2 ? CHATBOT_CARD_HOVER : 'opacity-50 cursor-not-allowed'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7} d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM21 6a3 3 0 11-6 0 3 3 0 016 0zM6 11v9m12-9v9M3 20h6m6 0h6" /></svg>
              Compare{selectedIds.length ? ` (${selectedIds.length})` : ''}
            </button>
          </div>
        ) : !hasMessages ? (
          <div className="h-full flex flex-col items-center justify-center px-6 text-center animate-fade-scale-in">
            {/* Wandel logo badge */}
            <WandelBadge className="mb-4" />
            <h2 className="text-2xl font-semibold text-white">How can Sophia help?</h2>
            <p className="mt-2 text-sm text-slate-300 max-w-xl">
              Everything about your candidates is now searchable — just ask.
            </p>

            {/* Centred chat window */}
            <div className="mt-6 w-full max-w-2xl">
              {composer}
            </div>

            {/* Title-only category pills */}
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2.5">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.label}
                  onClick={() => pickCategory(cat)}
                  className={`inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3.5 py-1.5 text-sm text-slate-200 [&_svg]:w-4 [&_svg]:h-4 hover:border-indigo-400/70 hover:bg-white/10 hover:text-white transition-colors`}
                >
                  <span className="text-slate-300">{cat.icon}</span>
                  {cat.label}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="mx-auto max-w-3xl px-4 py-6 flex flex-col gap-4">
            {messages.map((m) => (
              <ChatMessage key={m.id} role={m.role} text={displayText(m)} streaming={isStreaming(m.id)} />
            ))}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* ── Composer: pinned to the bottom while in a conversation or picking a case to
          compare; otherwise it's centred in the empty state above. ── */}
      {(hasMessages || comparing || selectCase) && (
        <div className="relative z-10 shrink-0 px-4 pb-5 pt-2">
          <div className="mx-auto max-w-3xl">
            {composer}
          </div>
        </div>
      )}
    </div>
  );
}
