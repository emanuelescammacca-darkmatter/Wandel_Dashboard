import { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { mockCandidates } from '../mockData';
import PipelineStatusBadge from '../components/PipelineStatusBadge';
import NeedForActionBadge from '../components/NeedForActionBadge';
import type { AnalysisOutcome } from '../types';

// Soft top/bottom fade on scroll containers so content fades out instead of being cut off
const SCROLL_FADE = 'linear-gradient(to bottom, rgba(0,0,0,0.35) 0, black 12px, black calc(100% - 12px), rgba(0,0,0,0.35) 100%)';
const scrollFadeStyle: React.CSSProperties = { maskImage: SCROLL_FADE, WebkitMaskImage: SCROLL_FADE };

// ── Analysis outcome dropdown options ────────────────────────────────────────

const ANALYSIS_OUTCOMES: { value: AnalysisOutcome; label: string }[] = [
  { value: 'voicemail_detected',          label: 'Voicemail Detected' },
  { value: 'wrong_person',                label: 'Wrong Person' },
  { value: 'no_meaningful_interaction',   label: 'No Meaningful Interaction' },
  { value: 'consent_declined',            label: 'Consent Declined' },
  { value: 'reschedule_requested',        label: 'Reschedule Requested' },
  { value: 'interview_completed_full',    label: 'Interview Completed (Full)' },
  { value: 'interview_completed_partial', label: 'Interview Completed (Partial)' },
  { value: 'technical_failure',           label: 'Technical Failure' },
  { value: 'other',                       label: 'Other' },
];

const ANALYSIS_OUTCOME_STYLES: Record<AnalysisOutcome, string> = {
  voicemail_detected:          'text-amber-700 bg-amber-50 border-amber-200',
  wrong_person:                'text-gray-500 bg-gray-50 border-gray-200',
  no_meaningful_interaction:   'text-gray-500 bg-gray-50 border-gray-200',
  consent_declined:            'text-red-600 bg-red-50 border-red-200',
  reschedule_requested:        'text-sky-700 bg-sky-50 border-sky-200',
  interview_completed_full:    'text-emerald-700 bg-emerald-50 border-emerald-200',
  interview_completed_partial: 'text-indigo-700 bg-indigo-50 border-indigo-200',
  technical_failure:           'text-red-600 bg-red-50 border-red-200',
  other:                       'text-gray-500 bg-gray-50 border-gray-200',
};

// ── Reusable UI ──────────────────────────────────────────────────────────────

function Label({ children, compact = false }: { children: React.ReactNode; compact?: boolean }) {
  return (
    <p className={`font-semibold text-gray-400 uppercase tracking-wider ${compact ? 'text-[9px] mb-0.5' : 'text-[11px] mb-1.5'}`}>
      {children}
    </p>
  );
}

function CardTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-5 py-3 border-b border-gray-100 bg-gray-50/80 shrink-0">
      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">{children}</p>
    </div>
  );
}

function EditableValue({ value, onChange, placeholder = '—', compact = false }: {
  value: string | null | undefined;
  onChange: (v: string) => void;
  placeholder?: string;
  compact?: boolean;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, [value]);

  return (
    <textarea
      ref={ref}
      rows={1}
      value={value ?? ''}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className={`w-full text-gray-800 bg-transparent border border-transparent rounded hover:bg-gray-50 focus:bg-white focus:border-indigo-300 focus:outline-none placeholder-gray-300 resize-none overflow-hidden leading-snug ${
        compact ? 'text-[13px] px-1.5 -mx-1.5 py-0.5' : 'text-[15px] px-2 -mx-2 py-1.5'
      }`}
    />
  );
}

function EditableField({ label, value, onChange, placeholder, compact = false }: {
  label: string;
  value: string | null | undefined;
  onChange: (v: string) => void;
  placeholder?: string;
  compact?: boolean;
}) {
  return (
    <div className="min-w-0">
      <Label compact={compact}>{label}</Label>
      <EditableValue value={value} onChange={onChange} placeholder={placeholder} compact={compact} />
    </div>
  );
}

// ── Form bits used inside collapsible cards ──────────────────────────────────

function FormInput({ label, value, onChange, placeholder }: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="text-[11px] font-medium text-gray-500 block mb-1">{label}</label>
      <input
        value={value ?? ''}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full h-8 px-2.5 text-xs text-gray-800 bg-white border border-gray-200 rounded-md focus:outline-none focus:border-indigo-400 placeholder-gray-300"
      />
    </div>
  );
}

function FormTextarea({ label, value, onChange, rows = 4 }: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  rows?: number;
}) {
  return (
    <div>
      <label className="text-[11px] font-medium text-gray-500 block mb-1">{label}</label>
      <textarea
        value={value ?? ''}
        onChange={e => onChange(e.target.value)}
        rows={rows}
        className="w-full px-2.5 py-2 text-xs text-gray-800 bg-white border border-gray-200 rounded-md focus:outline-none focus:border-indigo-400 placeholder-gray-300 leading-relaxed resize-none"
      />
    </div>
  );
}

// ── Rich text editor ─────────────────────────────────────────────────────────

function ToolbarButton({ onClick, title, children }: {
  onClick: () => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onMouseDown={e => e.preventDefault()}
      onClick={onClick}
      title={title}
      className="w-7 h-7 flex items-center justify-center rounded text-gray-600 hover:bg-gray-100 transition-colors"
    >
      {children}
    </button>
  );
}

function RichTextEditor({ label, defaultValue, onChange, minHeight = 100 }: {
  label?: string;
  defaultValue: string;
  onChange: (v: string) => void;
  minHeight?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current && ref.current.innerHTML === '' && defaultValue) {
      ref.current.innerHTML = defaultValue;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const exec = (cmd: string, arg?: string) => {
    ref.current?.focus();
    document.execCommand(cmd, false, arg);
    if (ref.current) onChange(ref.current.innerHTML);
  };

  const handleInput = () => {
    if (ref.current) onChange(ref.current.innerHTML);
  };

  return (
    <div>
      {label && <label className="text-[11px] font-medium text-gray-500 block mb-1">{label}</label>}
      <div className="border border-gray-200 rounded-md overflow-hidden bg-white">
        <div className="flex items-center gap-0.5 px-1.5 py-1 border-b border-gray-200 bg-gray-50/60">
          <select
            onMouseDown={e => e.preventDefault()}
            onChange={e => exec('formatBlock', e.target.value)}
            defaultValue="p"
            className="h-7 px-1.5 text-xs text-gray-700 bg-transparent rounded hover:bg-gray-100 focus:outline-none border-none"
          >
            <option value="p">Normal</option>
            <option value="h1">Heading 1</option>
            <option value="h2">Heading 2</option>
            <option value="h3">Heading 3</option>
          </select>
          <div className="w-px h-4 bg-gray-200 mx-1" />
          <ToolbarButton onClick={() => exec('bold')} title="Bold">
            <span className="text-xs font-bold">B</span>
          </ToolbarButton>
          <ToolbarButton onClick={() => exec('italic')} title="Italic">
            <span className="text-xs italic font-serif">I</span>
          </ToolbarButton>
          <ToolbarButton onClick={() => exec('underline')} title="Underline">
            <span className="text-xs underline">U</span>
          </ToolbarButton>
          <ToolbarButton
            onClick={() => {
              const url = prompt('Link URL:');
              if (url) exec('createLink', url);
            }}
            title="Insert link"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 010 5.656l-3 3a4 4 0 11-5.656-5.656l1.5-1.5m6.828-1.328a4 4 0 015.656 0l3 3a4 4 0 010 5.656l-1.5 1.5" transform="rotate(-45 12 12)" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 15l6-6" />
            </svg>
          </ToolbarButton>
          <div className="w-px h-4 bg-gray-200 mx-1" />
          <ToolbarButton onClick={() => exec('insertOrderedList')} title="Ordered list">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 6h13M7 12h13M7 18h13M3 6h.01M3 12h.01M3 18h.01" />
            </svg>
          </ToolbarButton>
          <ToolbarButton onClick={() => exec('insertUnorderedList')} title="Bullet list">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
            </svg>
          </ToolbarButton>
          <div className="w-px h-4 bg-gray-200 mx-1" />
          <ToolbarButton onClick={() => exec('removeFormat')} title="Clear formatting">
            <span className="text-xs font-semibold">
              T<sub className="text-[8px]">x</sub>
            </span>
          </ToolbarButton>
        </div>
        <div
          ref={ref}
          contentEditable
          suppressContentEditableWarning
          onInput={handleInput}
          style={{ minHeight }}
          className="px-3 py-2.5 text-xs text-gray-800 focus:outline-none leading-relaxed [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_a]:text-indigo-600 [&_a]:underline"
        />
      </div>
    </div>
  );
}

// ── NoteField — collapses to rendered content; shows editor only while editing ─

function NoteField({ label, value, onChange, placeholder = 'Add a note…', minHeight = 80, plain = false, multiline = false, boldLabel = false }: {
  label?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  minHeight?: number;
  plain?: boolean;
  multiline?: boolean;
  boldLabel?: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const isEmpty = !value || value.replace(/<[^>]*>/g, '').trim().length === 0;

  if (editing) {
    if (plain && multiline) {
      return (
        <div className="flex flex-col gap-2">
          <textarea
            autoFocus
            value={value ?? ''}
            onChange={e => onChange(e.target.value)}
            rows={3}
            placeholder="Write a description…"
            className="w-full px-2.5 py-2 text-xs text-gray-800 placeholder-gray-300 bg-white border border-gray-200 rounded-md focus:outline-none focus:border-indigo-400 leading-relaxed resize-none"
          />
          <button
            onClick={() => setEditing(false)}
            className="self-end px-3 py-1.5 text-[11px] font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 transition-colors"
          >
            Done
          </button>
        </div>
      );
    }
    if (plain) {
      return (
        <div className="flex items-center gap-2">
          <input
            autoFocus
            value={value ?? ''}
            onChange={e => onChange(e.target.value)}
            placeholder="Write a title…"
            className="flex-1 min-w-0 h-8 px-2.5 text-xs text-gray-800 placeholder-gray-300 bg-white border border-gray-200 rounded-md focus:outline-none focus:border-indigo-400 leading-relaxed"
          />
          <button
            onClick={() => setEditing(false)}
            className="shrink-0 px-3 py-1.5 text-[11px] font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 transition-colors"
          >
            Done
          </button>
        </div>
      );
    }
    return (
      <div className="flex flex-col gap-2">
        <RichTextEditor label={label} defaultValue={value} onChange={onChange} minHeight={minHeight} />
        <button
          onClick={() => setEditing(false)}
          className="self-end px-3 py-1.5 text-[11px] font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 transition-colors"
        >
          Done
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <div className="flex items-center justify-between">
          <label className={`text-[9px] uppercase tracking-wider ${boldLabel ? 'font-bold text-gray-700' : 'font-semibold text-gray-400'}`}>{label}</label>
          {!isEmpty && (
            <button
              onClick={() => setEditing(true)}
              className="text-[11px] font-medium text-indigo-600 hover:text-indigo-700 transition-colors"
            >
              Edit
            </button>
          )}
        </div>
      )}
      {isEmpty ? (
        <button
          onClick={() => setEditing(true)}
          className="w-full flex items-center gap-1 px-1.5 py-1 text-[11px] font-medium text-gray-400 rounded hover:text-indigo-600 hover:bg-indigo-50/50 transition-colors"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          {placeholder}
        </button>
      ) : plain && multiline ? (
        <div className="flex items-start gap-2">
          <div className="flex-1 min-w-0 px-2.5 py-2 text-xs text-gray-700 leading-relaxed whitespace-pre-wrap break-words border border-transparent">{value}</div>
          <button
            onClick={() => setEditing(true)}
            className="shrink-0 text-[11px] font-medium text-indigo-600 hover:text-indigo-700 transition-colors"
          >
            Edit
          </button>
        </div>
      ) : plain ? (
        <div className="flex items-center gap-2">
          <div className="flex-1 min-w-0 h-8 px-2.5 flex items-center border border-transparent">
            <span className="truncate text-xs font-semibold text-gray-800">{value}</span>
          </div>
          {!label && (
            <button
              onClick={() => setEditing(true)}
              className="shrink-0 text-[11px] font-medium text-indigo-600 hover:text-indigo-700 transition-colors"
            >
              Edit
            </button>
          )}
        </div>
      ) : (
        <div
          className="text-xs text-gray-700 leading-relaxed [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_a]:text-indigo-600 [&_a]:underline"
          dangerouslySetInnerHTML={{ __html: value }}
        />
      )}
    </div>
  );
}

// ── CollapsibleCard ──────────────────────────────────────────────────────────

function CollapsibleCard({ title, isOpen, onToggle, onDelete, badge, headerRight, footer, children }: {
  title: React.ReactNode;
  isOpen: boolean;
  onToggle: () => void;
  onDelete?: () => void;
  badge?: string;
  headerRight?: React.ReactNode;
  footer?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <div className={`border rounded-md overflow-hidden transition-colors ${isOpen ? 'border-violet-200' : 'border-gray-200'}`}>
      <div className={`flex items-start gap-2 px-3 py-2.5 transition-colors ${isOpen ? 'bg-violet-50' : 'bg-white hover:bg-gray-50'}`}>
        <button onClick={onToggle} className="flex items-start gap-2 flex-1 min-w-0 text-left">
          <svg
            className={`w-3.5 h-3.5 text-gray-400 transition-transform shrink-0 mt-0.5 ${isOpen ? 'rotate-180' : ''}`}
            fill="none" stroke="currentColor" viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
          <div className="min-w-0 flex-1">{title}</div>
        </button>
        {headerRight && <div className="shrink-0">{headerRight}</div>}
      </div>
      {isOpen && (
        <div className="p-4 border-t border-violet-100 bg-white flex flex-col gap-4">
          {(badge || onDelete) && (
            <div className="flex items-center justify-between -mb-1">
              {badge && <p className="text-xs font-semibold text-gray-800">{badge}</p>}
              {onDelete && (
                <button
                  onClick={onDelete}
                  className="ml-auto px-2.5 py-1 text-[11px] font-medium text-violet-600 border border-violet-200 rounded-md hover:bg-violet-50 transition-colors"
                >
                  Delete
                </button>
              )}
            </div>
          )}
          {children}
        </div>
      )}
      {footer && (
        <div className="px-3 py-2.5 border-t border-gray-100 bg-gray-50/70">
          {footer}
        </div>
      )}
    </div>
  );
}

function AddButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-gray-500 border border-dashed border-gray-300 rounded-md hover:border-indigo-400 hover:text-indigo-600 hover:bg-indigo-50/40 transition-colors"
    >
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
      </svg>
      {label}
    </button>
  );
}

// ── Types for collapsible items ──────────────────────────────────────────────

type TrainingEntry = {
  id: string;
  type: string;
  title: string;
  institution: string;
  currentlyStudying: boolean;
  startMonth: string;
  startYear: string;
  endMonth: string;
  endYear: string;
  country: string;
  state: string;
  city: string;
  description: string;
  note: string;
};

type ExperienceEntry = {
  id: string;
  type: string;
  title: string;
  company: string;
  currentlyWorking: boolean;
  startMonth: string;
  startYear: string;
  endMonth: string;
  endYear: string;
  country: string;
  state: string;
  city: string;
  description: string;
  note: string;
};

// Richer collapsed-preview helpers for entry cards
const fmtRange = (sm: string, sy: string, em: string, ey: string, current: boolean) => {
  const start = [sm, sy].filter(Boolean).join(' ');
  const end = current ? 'Present' : [em, ey].filter(Boolean).join(' ');
  return start || end ? `${start || '?'} – ${end || '?'}` : '';
};
const fmtLoc = (city: string, state: string, country: string) =>
  [city, state, country].filter(Boolean).join(', ');

function EntryPreview({ title, subtitle, type, range, location }: {
  title: string; subtitle: string; type: string; range: string; location: string;
}) {
  const metaLine = [subtitle, location].filter(Boolean).join('  ·  ');
  return (
    <div className="flex flex-col gap-0.5 min-w-0">
      {/* Title (+ type) on the left, date range pushed to the right */}
      <div className="flex items-baseline justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <p className="text-[13px] font-semibold text-gray-800 leading-snug truncate">{title || 'Untitled'}</p>
          {type && (
            <span className="shrink-0 text-[10px] font-medium text-violet-600 bg-violet-50 border border-violet-100 rounded px-1.5 py-0.5">
              {type}
            </span>
          )}
        </div>
        {range && <span className="shrink-0 text-[11px] text-gray-400 tabular-nums">{range}</span>}
      </div>
      {metaLine && <p className="text-xs text-gray-500 leading-snug truncate">{metaLine}</p>}
    </div>
  );
}

// Treat HTML notes as empty when they contain no visible text
const noteHasContent = (html?: string) => !!html && html.replace(/<[^>]*>/g, '').trim().length > 0;

// Small inline "Add note" button shown in a card header when no note exists yet
function AddNoteButton({ onClick, label = 'Add Note' }: { onClick: () => void; label?: string }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-1 px-1.5 py-1 text-[11px] font-medium text-gray-400 rounded hover:text-indigo-600 hover:bg-indigo-50/50 transition-colors"
    >
      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
      </svg>
      {label}
    </button>
  );
}

// Note section for an entry card — titled, shaded, editor only while editing, no inner box
function EntryNote({ value, editing, onChange, onStartEdit, onStopEdit, addLabel }: {
  value: string;
  editing: boolean;
  onChange: (v: string) => void;
  onStartEdit: () => void;
  onStopEdit: () => void;
  addLabel?: string;
}) {
  const hasContent = noteHasContent(value);
  return (
    <div className="flex flex-col gap-1">
      {(editing || hasContent) && (
        <p className="text-[9px] font-semibold text-gray-400 uppercase tracking-wider">Notes</p>
      )}
      {editing ? (
        <div className="flex flex-col gap-2">
          <RichTextEditor defaultValue={value} onChange={onChange} minHeight={60} />
          <button
            onClick={onStopEdit}
            className="self-end px-3 py-1.5 text-[11px] font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 transition-colors"
          >
            Done
          </button>
        </div>
      ) : hasContent ? (
        <div className="flex items-start justify-between gap-2">
          <div
            className="text-xs text-gray-600 leading-relaxed [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_a]:text-indigo-600 [&_a]:underline"
            dangerouslySetInnerHTML={{ __html: value }}
          />
          <button
            onClick={onStartEdit}
            className="shrink-0 text-[11px] font-medium text-indigo-600 hover:text-indigo-700 transition-colors"
          >
            Edit
          </button>
        </div>
      ) : (
        <AddNoteButton onClick={onStartEdit} label={addLabel} />
      )}
    </div>
  );
}

// ── Applied positions + contact history (right sidebar) ──────────────────────

type AppliedPositionStatus = 'applied' | 'considered' | 'in-progress' | 'matched' | 'rejected';
type AppliedPosition = { id: string; title: string; status: AppliedPositionStatus };

const APPLIED_POSITION_STATUS: Record<AppliedPositionStatus, { label: string; className: string }> = {
  'applied':     { label: 'Applied',     className: 'border border-sky-200 text-sky-700 bg-sky-50' },
  'considered':  { label: 'Considered',  className: 'border border-amber-200 text-amber-700 bg-amber-50' },
  'in-progress': { label: 'In Progress', className: 'border border-indigo-200 text-indigo-700 bg-indigo-50' },
  'matched':     { label: 'Matched',     className: 'border border-violet-200 text-violet-700 bg-violet-50' },
  'rejected':    { label: 'Rejected',    className: 'border border-gray-200 text-gray-500 bg-gray-50' },
};

type ContactType = 'whatsapp' | 'hr_call' | 'sophia_call';
type ContactPoint = { id: string; type: ContactType; at: string }; // at = ISO timestamp

const CONTACT_META: Record<ContactType, { label: string; dot: string; ring: string; icon: React.ReactNode }> = {
  whatsapp: {
    label: 'WhatsApp Message',
    dot: 'bg-emerald-500',
    ring: 'border-emerald-500 shadow-[0_0_0_3px_rgba(16,185,129,0.12)]',
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M8 12h.01M12 12h.01M16 12h.01M21 12a9 9 0 01-13.255 7.93L3 21l1.07-4.745A9 9 0 1121 12z" />
    ),
  },
  hr_call: {
    label: 'HR-Team Call',
    dot: 'bg-sky-500',
    ring: 'border-sky-500 shadow-[0_0_0_3px_rgba(14,165,233,0.12)]',
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.95.68l1.5 4.5a1 1 0 01-.5 1.21l-2.26 1.13a11 11 0 005.52 5.52l1.13-2.26a1 1 0 011.21-.5l4.5 1.5a1 1 0 01.68.95V19a2 2 0 01-2 2h-1C9.72 21 3 14.28 3 6V5z" />
    ),
  },
  sophia_call: {
    label: 'Sophia Call',
    dot: 'bg-indigo-500',
    ring: 'border-indigo-500 shadow-[0_0_0_3px_rgba(99,102,241,0.12)]',
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.95.68l1.5 4.5a1 1 0 01-.5 1.21l-2.26 1.13a11 11 0 005.52 5.52l1.13-2.26a1 1 0 011.21-.5l4.5 1.5a1 1 0 01.68.95V19a2 2 0 01-2 2h-1C9.72 21 3 14.28 3 6V5z" />
    ),
  },
};

// Quick call-issue tags shown beneath the transcript summary — each with a themed icon
const DEFAULT_TAG_ICON = (
  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" />
);

const CALL_TAGS: { title: string; icon: React.ReactNode }[] = [
  { title: 'Does not want to talk to an AI', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636L5.636 18.364M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /> },
  { title: 'Does not understand question', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M12 17.25h.007v.008H12v-.008zM21 12a9 9 0 11-18 0 9 9 0 0118 0z" /> },
  { title: 'False transcript', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /> },
  { title: 'Changes language or completely not understandable', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 21a9 9 0 100-18 9 9 0 000 18zm0 0c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3M3 12h18" /> },
  { title: 'Infinite loop', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" /> },
  { title: 'Voicemail', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" /> },
  { title: 'Termin verschoben', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" /> },
  { title: 'Does not have information', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" /> },
  { title: 'Call ended unexpectedly', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.75 3.75l4.5 4.5m0-4.5l-4.5 4.5M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" /> },
  { title: 'Already contacted by HR team', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" /> },
];

// ── ChannelCard — Sophia Call / WhatsApp etc.: left = conversation, right = title/description/tags ─

function ChannelCard({ id, onClose, headerLabel, headerMeta, info, initialTitle = '', noteTaker = false, noteAddLabel, impressionLabel, titleLabel, children }: {
  id?: string;
  onClose?: () => void;
  headerLabel: string;
  headerMeta?: React.ReactNode;
  info?: React.ReactNode;
  initialTitle?: string;
  noteTaker?: boolean;
  noteAddLabel?: string;
  impressionLabel?: string;
  titleLabel?: string;
  children: React.ReactNode;
}) {
  const [infoOpen, setInfoOpen] = useState(false);
  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState('');
  const [note, setNote] = useState('');
  const [noteEditing, setNoteEditing] = useState(false);

  const [tags, setTags] = useState(() => CALL_TAGS.map(t => ({ ...t, description: '' })));
  const tagInstanceId = useRef(0);
  const [addedTags, setAddedTags] = useState<{ id: string; title: string; icon: React.ReactNode; description: string }[]>([]);
  const addCallTag = (t: { title: string; icon: React.ReactNode }) =>
    setAddedTags(prev => [...prev, { id: String(++tagInstanceId.current), title: t.title, icon: t.icon, description: '' }]);
  const updateTagNote = (id: string, description: string) =>
    setAddedTags(prev => prev.map(t => (t.id === id ? { ...t, description } : t)));
  const removeTag = (id: string) =>
    setAddedTags(prev => prev.filter(t => t.id !== id));

  const [addingTag, setAddingTag] = useState(false);
  const [newTagTitle, setNewTagTitle] = useState('');
  const [newTagDesc, setNewTagDesc] = useState('');
  const addTag = () => {
    const t = newTagTitle.trim();
    if (!t) return;
    setTags(prev => [...prev, { title: t, description: newTagDesc.trim(), icon: DEFAULT_TAG_ICON }]);
    setNewTagTitle('');
    setNewTagDesc('');
    setAddingTag(false);
  };

  return (
    <div id={id} className="relative scroll-mt-4 bg-white border border-gray-200 rounded-xl overflow-hidden grid grid-cols-2 h-full">

      {onClose && (
        <button
          onClick={onClose}
          title="Close"
          className="absolute top-2.5 right-2.5 z-10 p-1 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}

      {/* Left: header + conversation */}
      <div className="flex flex-col min-w-0 border-r border-gray-100 overflow-hidden">
        {info ? (
          <button
            onClick={() => setInfoOpen(o => !o)}
            className="px-5 py-3 flex items-center gap-2.5 bg-gray-50/80 border-b border-gray-100 hover:bg-gray-100/60 transition-colors text-left shrink-0"
          >
            <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">{headerLabel}</p>
            {headerMeta}
            <svg className={`w-3.5 h-3.5 text-gray-400 ml-auto transition-transform ${infoOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        ) : (
          <div className="px-5 py-3 flex items-center gap-2.5 bg-gray-50/80 border-b border-gray-100 shrink-0">
            <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">{headerLabel}</p>
            {headerMeta}
          </div>
        )}
        {info && infoOpen && (
          <div className="border-b border-gray-100 shrink-0 max-h-[55%] overflow-y-auto" style={scrollFadeStyle}>{info}</div>
        )}
        {children}
      </div>

      {/* Right: title + description + quick tags */}
      <div className="flex flex-col min-w-0 overflow-hidden">
        <div className="pl-4 pr-10 py-3 overflow-y-auto flex flex-col gap-3" style={scrollFadeStyle}>
          {impressionLabel ? (
            <NoteField boldLabel label={impressionLabel} value={note} onChange={setNote} placeholder="Add impression" />
          ) : (
            <>
          <div className="flex flex-col gap-1">
            {titleLabel ? (
              <NoteField boldLabel label={titleLabel} value={title} onChange={setTitle} placeholder="Add note" />
            ) : (
              <NoteField plain value={title} onChange={setTitle} placeholder="Add title" />
            )}
            {noteTaker ? (
              <EntryNote
                value={note}
                editing={noteEditing}
                onChange={setNote}
                onStartEdit={() => setNoteEditing(true)}
                onStopEdit={() => setNoteEditing(false)}
                addLabel={noteAddLabel}
              />
            ) : (
              <NoteField plain multiline value={description} onChange={setDescription} placeholder="Add description" />
            )}
          </div>
          {!noteTaker && (
            <>
          <div className="flex flex-wrap gap-2">
            {tags.map(tag => (
              <button
                key={tag.title}
                onClick={() => addCallTag(tag)}
                title={tag.description || undefined}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-medium border text-gray-600 border-gray-200 hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50/40 active:bg-indigo-100 transition-colors"
              >
                <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {tag.icon}
                </svg>
                {tag.title}
              </button>
            ))}
            <button
              onClick={() => setAddingTag(v => !v)}
              title="Add reason"
              className={`w-7 h-7 shrink-0 rounded-full border flex items-center justify-center transition-colors ${
                addingTag
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'text-gray-500 border-gray-200 hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50/40'
              }`}
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>

          {addingTag && (
            <div className="border border-gray-200 rounded-lg p-3 flex flex-col gap-2 bg-gray-50/50">
              <input
                autoFocus
                value={newTagTitle}
                onChange={e => setNewTagTitle(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') addTag(); }}
                placeholder="Title"
                className="w-full h-8 px-2.5 text-xs text-gray-800 bg-white border border-gray-200 rounded-md focus:outline-none focus:border-indigo-400 placeholder-gray-300"
              />
              <input
                value={newTagDesc}
                onChange={e => setNewTagDesc(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') addTag(); }}
                placeholder="Short description"
                className="w-full h-8 px-2.5 text-xs text-gray-800 bg-white border border-gray-200 rounded-md focus:outline-none focus:border-indigo-400 placeholder-gray-300"
              />
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => { setAddingTag(false); setNewTagTitle(''); setNewTagDesc(''); }}
                  className="px-3 py-1.5 text-[11px] font-medium text-gray-500 border border-gray-200 rounded-md hover:bg-gray-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={addTag}
                  className="px-3 py-1.5 text-[11px] font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 transition-colors"
                >
                  Add
                </button>
              </div>
            </div>
          )}

          {addedTags.map(t => (
            <div key={t.id} className="border border-gray-200 rounded-lg p-3 flex flex-col gap-2 bg-gray-50/50">
              <div className="flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5 text-indigo-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {t.icon}
                </svg>
                <span className="text-xs font-semibold text-gray-800 flex-1 min-w-0">{t.title}</span>
                <button
                  onClick={() => removeTag(t.id)}
                  title="Remove"
                  className="shrink-0 -m-1 p-1 rounded-full text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <input
                value={t.description}
                onChange={e => updateTagNote(t.id, e.target.value)}
                placeholder="Add a short description…"
                className="w-full h-8 px-2.5 text-xs text-gray-800 bg-white border border-gray-200 rounded-md focus:outline-none focus:border-indigo-400 placeholder-gray-300"
              />
            </div>
          ))}
            </>
          )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── HrTeamLeft — left side of the HR-Team card: details to capture + questions ─

function HrTeamLeft() {
  const [notice, setNotice] = useState('');
  const [salary, setSalary] = useState('');
  const [availability, setAvailability] = useState('');
  const [vehicle, setVehicle] = useState<'yes' | 'no' | ''>('');
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const questions = [
    'Why are you open to a new role right now?',
    'Are you currently in other application processes?',
    'How far are you willing to commute (km)?',
    'Are you able to work shifts / weekends if required?',
    'Any planned absences in the next 3 months?',
  ];

  return (
    <div className="px-4 py-3 flex-1 overflow-y-auto flex flex-col gap-4" style={scrollFadeStyle}>
      {/* Details to capture */}
      <div className="flex flex-col gap-2">
        <Label compact>Details</Label>
        <div className="grid grid-cols-2 gap-x-4 gap-y-2.5">
          <EditableField compact label="Notice Period"   value={notice}       onChange={setNotice}       placeholder="e.g. 3 months" />
          <EditableField compact label="Expected Salary"  value={salary}       onChange={setSalary}       placeholder="e.g. €3200/mo" />
          <EditableField compact label="Availability"     value={availability} onChange={setAvailability} placeholder="e.g. from August" />
          <div className="min-w-0">
            <Label compact>Owns a Vehicle</Label>
            <div className="flex gap-1.5 mt-0.5">
              {(['yes', 'no'] as const).map(v => (
                <button
                  key={v}
                  onClick={() => setVehicle(vehicle === v ? '' : v)}
                  className={`px-3 py-1 rounded-full text-[11px] font-medium border transition-colors ${
                    vehicle === v
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'text-gray-600 border-gray-200 hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50/40'
                  }`}
                >
                  {v === 'yes' ? 'Yes' : 'No'}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Questions for the candidate */}
      <div className="flex flex-col gap-2">
        <Label compact>Questions</Label>
        <div className="flex flex-col gap-2">
          {questions.map(q => (
            <div key={q} className="border border-gray-200 rounded-lg p-2.5 flex flex-col gap-1.5 bg-gray-50/40">
              <p className="text-xs font-medium text-gray-700 leading-snug">{q}</p>
              <input
                value={answers[q] ?? ''}
                onChange={e => setAnswers(a => ({ ...a, [q]: e.target.value }))}
                placeholder="Answer…"
                className="w-full h-8 px-2.5 text-xs text-gray-800 bg-white border border-gray-200 rounded-md focus:outline-none focus:border-indigo-400 placeholder-gray-300"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Component ────────────────────────────────────────────────────────────────

export default function CandidateDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const listPath = location.pathname.startsWith('/candidates') ? '/candidates' : '/ai-candidates';
  const listLabel = location.pathname.startsWith('/candidates') ? 'Candidates' : 'AI Candidates';
  const candidate = mockCandidates.find(c => c.id === id);

  // Editable form state — seeded from candidate
  const [form, setForm] = useState({
    phoneNumber:    candidate?.phoneNumber ?? '',
    email:          candidate?.email ?? '',
    dateOfBirth:    candidate?.dateOfBirth ?? '',
    address:        candidate?.address ?? '',
    nationality:    candidate?.nationality ?? '',
    languages:      '',
    earliestStart:  candidate?.earliestStart ?? '',
    germanLevel:    candidate?.germanLevel ?? '',
    driversLicense: candidate
      ? (candidate.driversLicense === true
          ? `Yes${candidate.licenseClasses ? ` — ${candidate.licenseClasses}` : ''}`
          : candidate.driversLicense === false ? 'No' : '')
      : '',
    salary:         candidate?.salary ? `€${candidate.salary}/mo` : '',
    jobTitle:       candidate?.jobTitle ?? '',
    training:       candidate?.training ?? '',
  });
  const set = (key: keyof typeof form) => (v: string) => setForm(f => ({ ...f, [key]: v }));

  // Background & Experience state
  const [changeMotivation, setChangeMotivation] = useState(candidate?.jobChangeMotivation ?? '');
  const [specialSkills, setSpecialSkills]       = useState(candidate?.specialSkills ?? '');

  const [trainings, setTrainings] = useState<TrainingEntry[]>([
    {
      id: 't1',
      type: 'Ausbildung',
      title: candidate?.training ?? 'Industriemechaniker',
      institution: 'IHK München',
      currentlyStudying: false,
      startMonth: 'September',
      startYear: '2008',
      endMonth: 'Juli',
      endYear: '2011',
      country: 'Germany',
      state: 'Bavaria',
      city: 'München',
      description: 'Ausbildung im Bereich Elektrotechnik mit Schwerpunkt auf Industrieanlagen und Wartung.',
      note: '<p>Abschluss mit <b>Note 1,8</b>. Schwerpunkt SPS-Steuerungen.</p>',
    },
  ]);

  const [experiences, setExperiences] = useState<ExperienceEntry[]>([
    {
      id: 'e1',
      type: 'Festanstellung',
      title: 'Servicetechniker',
      company: 'Bosch GmbH',
      currentlyWorking: true,
      startMonth: 'März',
      startYear: '2020',
      endMonth: '',
      endYear: '',
      country: 'Germany',
      state: 'Bavaria',
      city: 'München',
      description: 'Wartung und Reparatur von Industriemaschinen, Kundeneinsätze im DACH-Raum.',
      note: '<p>Sehr selbstständig, reist gerne. Erwähnte Bereitschaft zu Schichtarbeit.</p>',
    },
    {
      id: 'e2',
      type: 'Festanstellung',
      title: 'Techniker',
      company: 'Siemens AG',
      currentlyWorking: false,
      startMonth: 'Januar',
      startYear: '2015',
      endMonth: 'Februar',
      endYear: '2020',
      country: 'Germany',
      state: 'Bavaria',
      city: 'München',
      description: 'Inbetriebnahme und Instandhaltung von Produktionsanlagen.',
      note: '',
    },
    {
      id: 'e3',
      type: 'Ausbildung / Praktikum',
      title: 'Auszubildender',
      company: 'Maschinenbau Meier',
      currentlyWorking: false,
      startMonth: 'August',
      startYear: '2011',
      endMonth: 'Dezember',
      endYear: '2014',
      country: 'Germany',
      state: 'Bavaria',
      city: 'Augsburg',
      description: 'Allgemeine Werkstattarbeiten und Begleitung von Servicetechnikern.',
      note: '',
    },
  ]);

  const [openTrainingId, setOpenTrainingId]     = useState<string | null>(null);
  const [openExperienceId, setOpenExperienceId] = useState<string | null>(null);

  // Selected applied-position (only one can be ticked + shaded in the right task bar)
  const [selectedPosition, setSelectedPosition] = useState<string | null>(null);
  const togglePosition = (id: string) =>
    setSelectedPosition(prev => (prev === id ? null : id));
  const [jobDescCollapsed, setJobDescCollapsed] = useState(false);

  // Channel cards at the bottom are hidden until their contact-history link is clicked
  const [sophiaOpen, setSophiaOpen] = useState(false);
  const [whatsappOpen, setWhatsappOpen] = useState(false);
  const [hrOpen, setHrOpen] = useState(false);
  const openCard = (which: 'sophia' | 'whatsapp' | 'hr') => {
    setSophiaOpen(which === 'sophia');
    setWhatsappOpen(which === 'whatsapp');
    setHrOpen(which === 'hr');
    const tid = which === 'sophia' ? 'card-sophia' : which === 'whatsapp' ? 'card-whatsapp' : 'card-hr';
    requestAnimationFrame(() => requestAnimationFrame(() =>
      document.getElementById(tid)?.scrollIntoView({ behavior: 'smooth', block: 'start' })));
  };

  // WhatsApp chat — messages + composer
  const [waMessages, setWaMessages] = useState<{ from: 'us' | 'them'; text: string; time: string }[]>([
    { from: 'us',   text: 'Hallo Andi, hier ist das Wandel Recruiting Team 👋', time: '09:02' },
    { from: 'them', text: 'Hallo! Ja, gerne.', time: '09:05' },
    { from: 'us',   text: 'Super! Hätten Sie diese Woche kurz Zeit für ein Gespräch?', time: '09:06' },
    { from: 'them', text: 'Donnerstag Nachmittag würde mir gut passen.', time: '09:10' },
    { from: 'us',   text: 'Perfekt — ich schicke Ihnen eine Einladung. Bis Donnerstag!', time: '09:12' },
  ]);
  const [waDraft, setWaDraft] = useState('');
  const sendWa = () => {
    const text = waDraft.trim();
    if (!text) return;
    const time = new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
    setWaMessages(prev => [...prev, { from: 'us', text, time }]);
    setWaDraft('');
  };

  // Which per-entry notes are currently being edited
  const [editingNoteIds, setEditingNoteIds] = useState<Set<string>>(() => new Set());
  const startNoteEdit = (id: string) => setEditingNoteIds(s => new Set(s).add(id));
  const stopNoteEdit  = (id: string) => setEditingNoteIds(s => { const n = new Set(s); n.delete(id); return n; });

  const updateTraining = (id: string, patch: Partial<TrainingEntry>) =>
    setTrainings(prev => prev.map(t => (t.id === id ? { ...t, ...patch } : t)));
  const deleteTraining = (id: string) =>
    setTrainings(prev => prev.filter(t => t.id !== id));
  const addTraining = () => {
    const id = `t${Date.now()}`;
    setTrainings(prev => [...prev, {
      id, type: '', title: '', institution: '', currentlyStudying: false,
      startMonth: '', startYear: '', endMonth: '', endYear: '',
      country: '', state: '', city: '', description: '', note: '',
    }]);
    setOpenTrainingId(id);
  };

  const updateExperience = (id: string, patch: Partial<ExperienceEntry>) =>
    setExperiences(prev => prev.map(e => (e.id === id ? { ...e, ...patch } : e)));
  const deleteExperience = (id: string) =>
    setExperiences(prev => prev.filter(e => e.id !== id));
  const addExperience = () => {
    const id = `e${Date.now()}`;
    setExperiences(prev => [...prev, {
      id, type: '', title: '', company: '', currentlyWorking: false,
      startMonth: '', startYear: '', endMonth: '', endYear: '',
      country: '', state: '', city: '', description: '', note: '',
    }]);
    setOpenExperienceId(id);
  };

  // Call Analysis state
  const formatDay = (d?: string | null) =>
    d ? new Date(d).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '';
  const formatTimeOfDay = (d?: string | null) => {
    if (!d) return '';
    const date = new Date(d);
    return isNaN(date.getTime())
      ? ''
      : date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
  };
  const [callAnalysis, setCallAnalysis] = useState({
    agent:             'Sophia · Outreach',
    callDay:           formatDay(candidate?.lastContactAt ?? candidate?.createdAt),
    callTime:          formatTimeOfDay(candidate?.createdAt) || '10:42',
    llmCost:           '€0.12',
    outcome:           (candidate?.analysisOutcome ?? '') as AnalysisOutcome | '',
    terminationReason: candidate?.terminationReason ?? '',
    callDuration:      candidate?.duration ?? '',
    messages:          candidate?.transcript ? String(candidate.transcript.length) : '0',
    elevenLabsLink:    `https://elevenlabs.io/app/conversational-ai/history/${candidate?.id ?? ''}`,
  });
  const setCA = (key: keyof typeof callAnalysis) => (v: string) =>
    setCallAnalysis(s => ({ ...s, [key]: v }));

  // Transcript audio
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Applied positions — read-only, seeded from candidate (no backing model field)
  const appliedPositions: AppliedPosition[] = [
    {
      id: 'ap1',
      title: candidate?.jobTitle || 'Servicetechniker',
      status: candidate?.pipelineStatus === 'matched' ? 'matched' : 'considered',
    },
    { id: 'ap2', title: 'Instandhaltungstechniker', status: 'in-progress' },
    { id: 'ap3', title: 'Mechatroniker (Schicht)', status: 'applied' },
  ];

  // Contact history — read-only, seeded from candidate timestamps, oldest → newest
  const contactPoints: ContactPoint[] = [
    { id: 'cp1', type: 'whatsapp',    at: candidate?.createdAt ?? '2026-04-11T11:05:00Z' },
    { id: 'cp2', type: 'sophia_call', at: '2026-04-12T10:42:00Z' },
    { id: 'cp3', type: 'hr_call',     at: candidate?.lastContactAt ?? '2026-04-14T14:30:00Z' },
  ].sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime());

  if (!candidate) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-gray-400 text-sm">
          Candidate not found.{' '}
          <button onClick={() => navigate(listPath)} className="underline">Go back</button>
        </p>
      </div>
    );
  }

  const handlePlayPause = () => {
    if (!candidate.audioUrl) { setIsPlaying(p => !p); return; }
    if (isPlaying) audioRef.current?.pause();
    else audioRef.current?.play();
    setIsPlaying(p => !p);
  };

  const totalSeconds = candidate.transcript ? candidate.transcript.length * 7 : 0;
  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  // Shared call-information fields — rendered identically on the left and right toggles
  const infoFields = (
    <div className="px-4 py-3 grid grid-cols-2 gap-x-5 gap-y-3 overflow-y-auto content-start">
      <EditableField compact label="Date"       value={callAnalysis.callDay}  onChange={setCA('callDay')}  placeholder="DD.MM.YYYY" />
      <EditableField compact label="Agent"      value={callAnalysis.agent}    onChange={setCA('agent')} />
      <EditableField compact label="Call Time"  value={callAnalysis.callTime} onChange={setCA('callTime')} placeholder="HH:MM" />
      <EditableField compact label="Messages"   value={callAnalysis.messages} onChange={setCA('messages')} placeholder="0" />
      <EditableField compact label="LLM Cost"   value={callAnalysis.llmCost}  onChange={setCA('llmCost')}  placeholder="€0.00" />
      <EditableField compact label="Termination Reason" value={callAnalysis.terminationReason} onChange={setCA('terminationReason')} placeholder="—" />
      <div className="min-w-0">
        <Label compact>Analysis Outcome</Label>
        <div className="relative mt-0.5">
          <select
            value={callAnalysis.outcome}
            onChange={e => setCA('outcome')(e.target.value)}
            className={`w-full appearance-none pr-7 pl-2 h-7 text-[11px] font-medium rounded-md border focus:outline-none focus:ring-2 focus:ring-indigo-200 cursor-pointer transition-colors ${
              callAnalysis.outcome
                ? ANALYSIS_OUTCOME_STYLES[callAnalysis.outcome as AnalysisOutcome]
                : 'text-gray-500 bg-white border-gray-200'
            }`}
          >
            <option value="">— Select —</option>
            {ANALYSIS_OUTCOMES.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <svg
            className="w-3 h-3 text-gray-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none"
            fill="none" stroke="currentColor" viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
      <div className="min-w-0">
        <Label compact>ElevenLabs Link</Label>
        <div className="flex items-center gap-1">
          <div className="flex-1 min-w-0">
            <EditableValue compact value={callAnalysis.elevenLabsLink} onChange={setCA('elevenLabsLink')} placeholder="https://…" />
          </div>
          {callAnalysis.elevenLabsLink && (
            <a
              href={callAnalysis.elevenLabsLink}
              target="_blank"
              rel="noopener noreferrer"
              title="Open in ElevenLabs"
              className="shrink-0 inline-flex items-center justify-center w-6 h-6 rounded text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 border border-gray-200 hover:border-indigo-200 transition-colors"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          )}
        </div>
      </div>
    </div>
  );

  const splitMode = sophiaOpen || whatsappOpen || hrOpen;
  const selectedPos = appliedPositions.find(p => p.id === selectedPosition) ?? null;

  return (
    <div className={`flex-1 bg-[#f5f5f5] ${splitMode ? 'overflow-hidden' : 'overflow-y-auto'}`}>
      <div className={`p-2.5 flex flex-col gap-2.5 ${splitMode ? 'h-full' : ''}`}>
        <div className={`flex gap-2.5 ${splitMode ? 'flex-[14] min-h-0 items-stretch' : 'items-start'}`}>

        {/* ══ LEFT BAR: Personal information — compact vertical sidebar ══ */}
        <aside className={`w-60 shrink-0 bg-white border border-gray-200 rounded-xl overflow-hidden flex flex-col ${splitMode ? 'h-full' : ''}`}>
          <div
            className={`px-4 py-4 flex flex-col gap-3 ${splitMode ? 'overflow-y-auto' : ''}`}
            style={splitMode ? scrollFadeStyle : undefined}
          >

          <button
            onClick={() => navigate(listPath)}
            className="flex items-center gap-1.5 text-[11px] text-gray-400 hover:text-gray-600 w-fit transition-colors"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            {listLabel}
          </button>

          {/* Avatar + name */}
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-semibold text-sm shrink-0">
              {candidate.firstName.charAt(0)}
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-semibold text-gray-900 leading-tight truncate">
                {candidate.firstName} {candidate.lastName}
              </h2>
            </div>
          </div>

          <div className="h-px bg-gray-100" />

          {/* Profile fields — stacked compactly */}
          <div className="flex flex-col gap-2.5">
            <EditableField compact label="Phone" value={form.phoneNumber} onChange={set('phoneNumber')} />
            <EditableField compact label="Email" value={form.email} onChange={set('email')} />
            <EditableField compact label="Date of Birth" value={form.dateOfBirth} onChange={set('dateOfBirth')} placeholder="YYYY-MM-DD" />
            <EditableField compact label="Address" value={form.address} onChange={set('address')} />
            <EditableField compact label="Nationality" value={form.nationality} onChange={set('nationality')} />
            <EditableField compact label="German Level" value={form.germanLevel} onChange={set('germanLevel')} />
            <EditableField compact label="Languages" value={form.languages} onChange={set('languages')} placeholder="e.g. German, English" />
            <EditableField compact label="Driver's License" value={form.driversLicense} onChange={set('driversLicense')} placeholder="e.g. Yes — B" />
            <div className="min-w-0">
              <Label compact>Created</Label>
              <p className="text-[13px] text-gray-800 px-1.5 -mx-1.5 py-0.5">
                {new Date(candidate.createdAt).toLocaleDateString('de-DE', { day: '2-digit', month: 'long', year: 'numeric' })}
              </p>
            </div>
          </div>
          </div>
        </aside>

        {/* ══ RIGHT COLUMN: everything else ══ */}
        <div className={`flex-1 min-w-0 flex flex-col gap-2.5 ${splitMode ? 'min-h-0' : ''}`}>

        {/* ══ Job Description — selected position name; shown only when a position is checked ══ */}
        {selectedPos && (
        <div className={`bg-white border border-gray-200 rounded-xl overflow-hidden flex flex-col ${splitMode ? (jobDescCollapsed ? 'shrink-0' : 'flex-1 min-h-0') : ''}`}>
          <div className={`overflow-y-auto ${splitMode && !jobDescCollapsed ? 'flex-1 min-h-0' : 'max-h-56'}`} style={scrollFadeStyle}>
          <div className="flex items-center justify-between gap-2 px-5 py-3.5">
            <span className="text-[9px] font-semibold text-gray-400 uppercase tracking-wider truncate">{selectedPos.title}</span>
            <button
              onClick={() => setJobDescCollapsed(c => !c)}
              title={jobDescCollapsed ? 'Expand' : 'Collapse'}
              className="shrink-0 -my-1 -mr-1 p-1 rounded text-gray-400 hover:text-indigo-600 hover:bg-indigo-50/50 transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {jobDescCollapsed ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 10l6-6 6 6M6 14l6 6 6-6" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 4l6 6 6-6M6 20l6-6 6 6" />
                )}
              </svg>
            </button>
          </div>
          {!jobDescCollapsed && (
            <div className="px-5 pb-5 -mt-1 text-xs text-gray-600 leading-relaxed whitespace-pre-wrap break-words">
                {`Als Servicetechniker (m/w/d) sind Sie für die Wartung, Reparatur und Inbetriebnahme von Kaffeevollautomaten im Außendienst verantwortlich. Sie betreuen Geschäftskunden im Raum München und Umgebung, führen Fehlerdiagnosen durch und beraten Kunden direkt vor Ort zu Bedienung, Pflege und Wartungsintervallen.

Ihre Aufgaben:
• Installation, Wartung und Reparatur von Kaffeevollautomaten und Zubehör
• Eigenständige Fehlerdiagnose an Mechanik, Elektronik und Hydraulik
• Durchführung von Software-Updates und Sicherheitsprüfungen
• Beratung und Einweisung der Kunden vor Ort
• Dokumentation der Einsätze sowie Ersatzteilmanagement im Servicefahrzeug
• Enge Abstimmung mit Innendienst und Disposition

Ihr Profil:
• Abgeschlossene technische Ausbildung (z. B. Mechatronik, Elektrotechnik, Kältetechnik oder vergleichbar)
• Erste Berufserfahrung im technischen Außendienst von Vorteil
• Führerschein Klasse B sowie Reise- und Schichtbereitschaft
• Selbstständige, kundenorientierte und zuverlässige Arbeitsweise
• Gute Deutschkenntnisse in Wort und Schrift

Wir bieten:
• Unbefristetes Arbeitsverhältnis mit attraktiver Vergütung
• Firmenwagen, auch zur privaten Nutzung
• Moderne Arbeitsausstattung und Smartphone
• Strukturierte Einarbeitung und regelmäßige Weiterbildungen
• 30 Tage Urlaub, betriebliche Altersvorsorge und Mitarbeiterrabatte

Über uns: Wir sind ein wachsendes Serviceunternehmen im Bereich Kaffeevollautomaten mit über 200 Mitarbeitenden im DACH-Raum und betreuen namhafte Kunden aus Gastronomie, Hotellerie und Büro.`}
            </div>
          )}
          </div>
        </div>
        )}

        {/* ══ Background & Experience (full width, top of central column) ══ */}
        <div className={`bg-white border border-gray-200 rounded-xl overflow-hidden flex flex-col ${splitMode ? 'flex-1 min-h-0' : ''}`}>
            <div className={`p-5 flex flex-col gap-6 ${splitMode ? 'flex-1 min-h-0 overflow-y-auto' : ''}`} style={splitMode ? scrollFadeStyle : undefined}>

              {/* Training (top) + Experiences (bottom) */}
              <div className="flex flex-col gap-6">
                <div>
                  <label className="text-[9px] font-semibold text-gray-400 uppercase tracking-wider block mb-2">Training</label>
                  <div className="flex flex-col gap-2">
                    {trainings.map((t, i) => (
                      <CollapsibleCard
                        key={t.id}
                        title={
                          <EntryPreview
                            title={t.title}
                            subtitle={t.institution}
                            type={t.type}
                            range={fmtRange(t.startMonth, t.startYear, t.endMonth, t.endYear, t.currentlyStudying)}
                            location={fmtLoc(t.city, t.state, t.country)}
                          />
                        }
                        isOpen={openTrainingId === t.id}
                        onToggle={() => setOpenTrainingId(openTrainingId === t.id ? null : t.id)}
                        onDelete={() => { deleteTraining(t.id); if (openTrainingId === t.id) setOpenTrainingId(null); }}
                        badge={`Training ${i + 1}`}
                        footer={
                          <EntryNote
                            value={t.note}
                            editing={editingNoteIds.has(t.id)}
                            onChange={v => updateTraining(t.id, { note: v })}
                            onStartEdit={() => startNoteEdit(t.id)}
                            onStopEdit={() => stopNoteEdit(t.id)}
                          />
                        }
                      >
                        <FormInput label="Type"        value={t.type}        onChange={v => updateTraining(t.id, { type: v })} />
                        <FormInput label="Title"       value={t.title}       onChange={v => updateTraining(t.id, { title: v })} />
                        <FormInput label="Institution" value={t.institution} onChange={v => updateTraining(t.id, { institution: v })} />
                        <label className="flex items-center gap-2 text-xs text-gray-600">
                          <input
                            type="checkbox"
                            checked={t.currentlyStudying}
                            onChange={e => updateTraining(t.id, { currentlyStudying: e.target.checked })}
                            className="rounded border-gray-300"
                          />
                          Currently studying
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                          <FormInput label="Start Month" value={t.startMonth} onChange={v => updateTraining(t.id, { startMonth: v })} />
                          <FormInput label="Start Year"  value={t.startYear}  onChange={v => updateTraining(t.id, { startYear: v })} />
                          {!t.currentlyStudying && (
                            <>
                              <FormInput label="End Month" value={t.endMonth} onChange={v => updateTraining(t.id, { endMonth: v })} />
                              <FormInput label="End Year"  value={t.endYear}  onChange={v => updateTraining(t.id, { endYear: v })} />
                            </>
                          )}
                        </div>
                        <FormInput label="Country" value={t.country} onChange={v => updateTraining(t.id, { country: v })} />
                        <div className="grid grid-cols-2 gap-3">
                          <FormInput label="State" value={t.state} onChange={v => updateTraining(t.id, { state: v })} />
                          <FormInput label="City"  value={t.city}  onChange={v => updateTraining(t.id, { city: v })} />
                        </div>
                        <FormTextarea label="Description" value={t.description} onChange={v => updateTraining(t.id, { description: v })} rows={3} />
                      </CollapsibleCard>
                    ))}
                    <AddButton label="Add training" onClick={addTraining} />
                  </div>
                </div>

                <div>
                  <label className="text-[9px] font-semibold text-gray-400 uppercase tracking-wider block mb-2">Experiences</label>
                  <div className="flex flex-col gap-2">
                    {experiences.map((e, i) => (
                      <CollapsibleCard
                        key={e.id}
                        title={
                          <EntryPreview
                            title={e.title}
                            subtitle={e.company}
                            type={e.type}
                            range={fmtRange(e.startMonth, e.startYear, e.endMonth, e.endYear, e.currentlyWorking)}
                            location={fmtLoc(e.city, e.state, e.country)}
                          />
                        }
                        isOpen={openExperienceId === e.id}
                        onToggle={() => setOpenExperienceId(openExperienceId === e.id ? null : e.id)}
                        onDelete={() => { deleteExperience(e.id); if (openExperienceId === e.id) setOpenExperienceId(null); }}
                        badge={`Experience ${i + 1}`}
                        footer={
                          <EntryNote
                            value={e.note}
                            editing={editingNoteIds.has(e.id)}
                            onChange={v => updateExperience(e.id, { note: v })}
                            onStartEdit={() => startNoteEdit(e.id)}
                            onStopEdit={() => stopNoteEdit(e.id)}
                          />
                        }
                      >
                        <FormInput label="Position type"  value={e.type}    onChange={v => updateExperience(e.id, { type: v })} />
                        <FormInput label="Position title" value={e.title}   onChange={v => updateExperience(e.id, { title: v })} />
                        <FormInput label="Company"        value={e.company} onChange={v => updateExperience(e.id, { company: v })} />
                        <label className="flex items-center gap-2 text-xs text-gray-600">
                          <input
                            type="checkbox"
                            checked={e.currentlyWorking}
                            onChange={ev => updateExperience(e.id, { currentlyWorking: ev.target.checked })}
                            className="rounded border-gray-300"
                          />
                          Currently working on this role
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                          <FormInput label="Start Month" value={e.startMonth} onChange={v => updateExperience(e.id, { startMonth: v })} />
                          <FormInput label="Start Year"  value={e.startYear}  onChange={v => updateExperience(e.id, { startYear: v })} />
                          {!e.currentlyWorking && (
                            <>
                              <FormInput label="End Month" value={e.endMonth} onChange={v => updateExperience(e.id, { endMonth: v })} />
                              <FormInput label="End Year"  value={e.endYear}  onChange={v => updateExperience(e.id, { endYear: v })} />
                            </>
                          )}
                        </div>
                        <FormInput label="Country" value={e.country} onChange={v => updateExperience(e.id, { country: v })} />
                        <div className="grid grid-cols-2 gap-3">
                          <FormInput label="State" value={e.state} onChange={v => updateExperience(e.id, { state: v })} />
                          <FormInput label="City"  value={e.city}  onChange={v => updateExperience(e.id, { city: v })} />
                        </div>
                        <FormTextarea label="Experience Description" value={e.description} onChange={v => updateExperience(e.id, { description: v })} rows={3} />
                      </CollapsibleCard>
                    ))}
                    <AddButton label="Add experience" onClick={addExperience} />
                  </div>
                </div>
              </div>

              {/* Notes below the sections — editor only while editing, else rendered content */}
              <div className="flex flex-col gap-5">
                <NoteField
                  label="Change Motivation"
                  value={changeMotivation}
                  onChange={setChangeMotivation}
                  placeholder="Add change motivation"
                />
                <NoteField
                  label="Special Skills"
                  value={specialSkills}
                  onChange={setSpecialSkills}
                  placeholder="Add special skills"
                />
              </div>

            </div>
          </div>

        </div>

        {/* ══ RIGHT BAR: Positions & Contact History — compact vertical sidebar ══ */}
        <aside className={`w-60 shrink-0 bg-white border border-gray-200 rounded-xl overflow-hidden flex flex-col ${splitMode ? 'h-full' : ''}`}>
          <div
            className={`px-4 py-4 flex flex-col gap-4 ${splitMode ? 'overflow-y-auto' : ''}`}
            style={splitMode ? scrollFadeStyle : undefined}
          >

          {/* Positions the candidate applied for / is considered for */}
          <div className="flex flex-col gap-2">
            <Label compact>Positions</Label>
            <div className="flex flex-col gap-2">
              {appliedPositions.map(p => {
                const selected = selectedPosition === p.id;
                return (
                  <div
                    key={p.id}
                    onClick={() => togglePosition(p.id)}
                    className={`border rounded-lg px-2.5 py-2 flex flex-col gap-1.5 cursor-pointer transition-colors ${
                      selected ? 'border-blue-200 bg-blue-50/70' : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <p className="text-[13px] font-medium text-gray-800 leading-snug">{p.title}</p>
                    <div className="flex items-center gap-1.5">
                      <span className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center shrink-0 transition-colors ${
                        selected ? 'bg-blue-500 border-blue-500' : 'bg-white border-blue-200'
                      }`}>
                        {selected && (
                          <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </span>
                      <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium whitespace-nowrap ${APPLIED_POSITION_STATUS[p.status].className}`}>
                        {APPLIED_POSITION_STATUS[p.status].label}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="h-px bg-gray-100" />

          {/* Contact history timeline — oldest → newest, connected dots */}
          <div className="flex flex-col gap-2">
            <Label compact>Contact History</Label>
            <ol className="relative flex flex-col gap-4 pl-7">
              <span
                aria-hidden
                className="absolute left-[7px] top-1.5 bottom-2 w-[2px] rounded-full"
                style={{ background: 'linear-gradient(to bottom, #6366f1 0%, rgba(99,102,241,0.45) 60%, rgba(99,102,241,0.12) 100%)' }}
              />
              {contactPoints.map(cp => {
                const meta = CONTACT_META[cp.type];
                const which = cp.type === 'sophia_call' ? 'sophia'
                  : cp.type === 'whatsapp' ? 'whatsapp'
                  : cp.type === 'hr_call' ? 'hr'
                  : null;
                return (
                  <li key={cp.id} className="relative">
                    <span className={`absolute -left-7 top-0.5 w-4 h-4 rounded-full border-2 bg-white flex items-center justify-center ${meta.ring}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
                    </span>
                    {which ? (
                      <button onClick={() => openCard(which)} className="group text-left w-full" title={`Open ${meta.label}`}>
                        <div className="flex items-center gap-1.5">
                          <svg className="w-3.5 h-3.5 text-gray-400 shrink-0 group-hover:text-indigo-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            {meta.icon}
                          </svg>
                          <p className="text-[12px] font-medium text-gray-800 leading-tight group-hover:text-indigo-600 transition-colors">{meta.label}</p>
                        </div>
                        <p className="text-[11px] text-gray-400 mt-0.5 tabular-nums">
                          {formatDay(cp.at)} · {formatTimeOfDay(cp.at)}
                        </p>
                      </button>
                    ) : (
                      <>
                        <div className="flex items-center gap-1.5">
                          <svg className="w-3.5 h-3.5 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            {meta.icon}
                          </svg>
                          <p className="text-[12px] font-medium text-gray-800 leading-tight">{meta.label}</p>
                        </div>
                        <p className="text-[11px] text-gray-400 mt-0.5 tabular-nums">
                          {formatDay(cp.at)} · {formatTimeOfDay(cp.at)}
                        </p>
                      </>
                    )}
                  </li>
                );
              })}
            </ol>
          </div>
          </div>
        </aside>

        </div>

        {/* ══ Bottom: the selected channel card (~44% height) ══ */}
        {splitMode && (
        <div className="flex-[11] min-h-0">

        {/* ══ Sophia Call card — shown when its contact-history link is clicked ══ */}
        {sophiaOpen && (
        <ChannelCard
          id="card-sophia"
          onClose={() => setSophiaOpen(false)}
          headerLabel="Sophia Call"
          info={infoFields}
          initialTitle={candidate.transcriptSummary ?? ''}
          headerMeta={
            <>
              {callAnalysis.callDay && (
                <>
                  <span className="text-gray-300">·</span>
                  <span className="text-xs font-medium text-gray-600 tabular-nums">{callAnalysis.callDay}</span>
                </>
              )}
              <span className="text-gray-300">·</span>
              <span className="text-xs font-medium text-gray-600 tabular-nums">{callAnalysis.callDuration || formatTime(totalSeconds)}</span>
            </>
          }
        >

          {/* Audio player */}
          <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-3 bg-white shrink-0">
            <button
              onClick={handlePlayPause}
              className="w-8 h-8 rounded-full bg-gray-800 hover:bg-gray-700 flex items-center justify-center text-white transition-colors shrink-0"
            >
              {isPlaying ? (
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                </svg>
              ) : (
                <svg className="w-3 h-3 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7L8 5z" />
                </svg>
              )}
            </button>
            <div className="flex-1 flex flex-col gap-1">
              <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-gray-500 rounded-full transition-all duration-700" style={{ width: isPlaying ? '35%' : '0%' }} />
              </div>
              <div className="flex justify-between">
                <span className="text-[10px] text-gray-400">{isPlaying ? '0:15' : '0:00'}</span>
                <span className="text-[10px] text-gray-400">{candidate.duration ?? formatTime(totalSeconds)}</span>
              </div>
            </div>
            {!candidate.audioUrl && (
              <span className="text-[10px] text-gray-300 shrink-0">No audio file</span>
            )}
            {candidate.audioUrl && (
              <audio ref={audioRef} src={candidate.audioUrl} onEnded={() => setIsPlaying(false)} />
            )}
          </div>

          {/* Messages */}
          <div className="px-5 py-3 overflow-y-auto flex-1 flex flex-col gap-3" style={scrollFadeStyle}>
            {candidate.transcript && candidate.transcript.length > 0 ? (
              candidate.transcript.map((entry, i) => (
                <div key={i} className={`flex gap-2 ${entry.speaker === 'candidate' ? 'flex-row-reverse' : ''}`}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-semibold shrink-0 mt-0.5 ${entry.speaker === 'agent' ? 'bg-gray-700' : 'bg-indigo-400'}`}>
                    {entry.speaker === 'agent' ? 'AI' : candidate.firstName.charAt(0)}
                  </div>
                  <div className={`flex flex-col max-w-[70%] ${entry.speaker === 'candidate' ? 'items-end' : ''}`}>
                    <span className="text-[10px] text-gray-400 mb-0.5">{entry.timestamp}</span>
                    <div className={`px-3 py-2 rounded-xl text-sm leading-relaxed ${entry.speaker === 'agent' ? 'bg-gray-100 text-gray-800 rounded-tl-sm' : 'bg-indigo-600 text-white rounded-tr-sm'}`}>
                      {entry.text}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center flex-1 text-gray-400">
                <svg className="w-8 h-8 mb-2 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <span className="text-sm">No transcript available</span>
              </div>
            )}
          </div>
        </ChannelCard>
        )}

        {/* ══ WhatsApp card — shown when its contact-history link is clicked ══ */}
        {whatsappOpen && (
        <ChannelCard id="card-whatsapp" onClose={() => setWhatsappOpen(false)} headerLabel="WhatsApp" noteTaker noteAddLabel="Add impression">
          {/* Messages */}
          <div className="px-4 py-3 overflow-y-auto flex-1 flex flex-col gap-2 bg-[#efeae2]/40" style={scrollFadeStyle}>
            {waMessages.map((m, i) => (
              <div key={i} className={`flex ${m.from === 'us' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[75%] px-2.5 py-1.5 rounded-lg text-xs leading-relaxed shadow-sm ${
                  m.from === 'us' ? 'bg-[#d9fdd3] text-gray-800 rounded-tr-sm' : 'bg-white text-gray-800 rounded-tl-sm'
                }`}>
                  {m.text}
                  <span className="block text-[9px] text-gray-400 text-right mt-0.5">{m.time}</span>
                </div>
              </div>
            ))}
          </div>
          {/* Composer */}
          <div className="shrink-0 border-t border-gray-100 px-3 py-2.5 flex items-center gap-2 bg-white">
            <input
              value={waDraft}
              onChange={e => setWaDraft(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') sendWa(); }}
              placeholder="Type a message…"
              className="flex-1 min-w-0 h-9 px-3.5 text-xs text-gray-800 bg-gray-100 rounded-full focus:outline-none focus:bg-white focus:ring-1 focus:ring-emerald-300 placeholder-gray-400"
            />
            <button
              onClick={sendWa}
              title="Send"
              className="shrink-0 w-9 h-9 rounded-full bg-[#25d366] hover:bg-[#1ebe5d] text-white flex items-center justify-center transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 12L3.27 3.13A59.77 59.77 0 0121.49 12 59.77 59.77 0 013.27 20.88L6 12zm0 0h7.5" />
              </svg>
            </button>
          </div>
        </ChannelCard>
        )}

        {/* ══ HR-Team card — details + questions (left) | Wandel Impression note (right) ══ */}
        {hrOpen && (
        <ChannelCard
          id="card-hr"
          onClose={() => setHrOpen(false)}
          headerLabel="HR-Team"
          impressionLabel="Wandel Impression"
        >
          <HrTeamLeft />
        </ChannelCard>
        )}

        </div>
        )}

      </div>
    </div>
  );
}
