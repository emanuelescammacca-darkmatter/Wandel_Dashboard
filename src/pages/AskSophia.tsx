import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';

interface Message {
  id: number;
  role: 'user' | 'assistant';
  text: string;
}

interface Category {
  label: string;
  description: string;
  icon: ReactNode;
  prompt?: string; // sent into the chat when picked
  to?: string;     // navigates instead of chatting
}

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
    label: 'Compare two candidates',
    description: 'Weigh two candidates side by side for a role.',
    prompt: 'Compare two candidates for a position and tell me who is the stronger fit.',
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
  {
    label: 'Draft an outreach message',
    description: 'Write a message to send to a candidate.',
    prompt: 'Draft an outreach message to a candidate for one of my positions.',
    icon: (
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
    ),
  },
  {
    label: 'Find top candidates',
    description: 'Surface the best matches for a given role.',
    prompt: 'Find the top candidates for one of my open positions.',
    icon: (
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7} d="M11 19a8 8 0 100-16 8 8 0 000 16zM21 21l-4.35-4.35" /></svg>
    ),
  },
  {
    label: 'Review a candidate',
    description: "Get Sophia's read on a candidate's profile.",
    prompt: "Review a candidate's profile and highlight strengths and gaps.",
    icon: (
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
    ),
  },
];

export default function AskSophia() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState('');

  const taRef = useRef<HTMLTextAreaElement>(null);
  const idRef = useRef(0);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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
    setMessages((prev) => [
      ...prev,
      { id: idRef.current++, role: 'user', text },
      {
        id: idRef.current++,
        role: 'assistant',
        text: "Sure — let me look into that for you. Tell me which position or candidate you'd like to focus on.",
      },
    ]);
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
    pushExchange(cat.prompt ?? cat.label);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const hasMessages = messages.length > 0;

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[#0b1437]">
      {/* ── Conversation ── */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        {!hasMessages ? (
          <div className="h-full flex flex-col items-center justify-center px-6 text-center animate-fade-scale-in">
            <div className="w-11 h-11 rounded-xl bg-[#1e3a5f] flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M12 3l1.8 4.2L18 9l-4.2 1.8L12 15l-1.8-4.2L6 9l4.2-1.8L12 3z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M18 14l.9 2.1L21 17l-2.1.9L18 20l-.9-2.1L15 17l2.1-.9L18 14z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-800">How can Sophia help?</h2>
            <p className="mt-1.5 text-sm text-gray-500 max-w-md">
              Pick a category to get started, or ask Sophia anything below.
            </p>

            <div className="mt-6 grid grid-cols-2 md:grid-cols-3 gap-3 w-full max-w-2xl">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.label}
                  onClick={() => pickCategory(cat)}
                  className="flex flex-col items-start text-left gap-1 rounded-xl border border-gray-200 bg-white shadow-sm px-4 py-3 transition-all duration-150 hover:border-[#1e3a5f]/40 hover:shadow-[0_0_0_4px_rgba(30,58,95,0.08)]"
                >
                  <span className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#1e3a5f]/[0.06] text-[#1e3a5f] [&_svg]:w-5 [&_svg]:h-5">
                    {cat.icon}
                  </span>
                  <span className="mt-1 text-sm font-semibold text-gray-800">{cat.label}</span>
                  <span className="text-[11px] leading-snug text-gray-500">{cat.description}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="mx-auto max-w-3xl px-4 py-6 flex flex-col gap-4">
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

      {/* ── Composer ── */}
      <div className="shrink-0 px-4 pb-5 pt-2">
        <div className="mx-auto max-w-3xl">
          <div className="rounded-2xl border border-gray-200 bg-white shadow-sm transition-all duration-150 focus-within:border-[#1e3a5f]/40 focus-within:shadow-[0_0_0_4px_rgba(30,58,95,0.08)]">
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
        </div>
      </div>
    </div>
  );
}
