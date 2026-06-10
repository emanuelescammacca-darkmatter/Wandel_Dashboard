import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { mockPositions, mockCandidates } from '../data/mockData';
import { WaveBackground } from '../components/SophiaChrome';
import { PipelineBoard } from '../dashboard/Dashboard';
import { TALENT, STAGES, useStages, stageOf, matchOf, type Stage } from '../lib/talentStore';
import type { Position, PositionStatus } from '../types';

type Tab = 'candidate' | 'comparison' | 'job-description';

const TABS: [Tab, string][] = [
  ['candidate', 'Candidate'],
  ['comparison', 'Comparison'],
  ['job-description', 'Job Description'],
];

/* ── Candidate status — the canonical pipeline stages from the talent store.
   Stage values are read live, so kanban moves and profile evaluations are
   reflected here immediately. ── */
const STATUS_PILL: Record<Stage, { cls: string; dot: string }> = {
  rejected:  { cls: 'text-rose-300 bg-rose-500/15 border-rose-500/30',        dot: '#fb7185' },
  new:       { cls: 'text-sky-300 bg-sky-500/15 border-sky-500/30',           dot: '#38bdf8' },
  shortlist: { cls: 'text-indigo-300 bg-indigo-500/15 border-indigo-500/30',  dot: '#818cf8' },
  interview: { cls: 'text-violet-300 bg-violet-500/15 border-violet-500/30',  dot: '#c084fc' },
  offer:     { cls: 'text-amber-300 bg-amber-500/15 border-amber-500/30',     dot: '#fbbf24' },
  hired:     { cls: 'text-emerald-300 bg-emerald-500/15 border-emerald-500/30', dot: '#34d399' },
};

const statusStyles: Record<PositionStatus, string> = {
  'open':        'border border-emerald-500/30 text-emerald-300 bg-emerald-500/15',
  'in-progress': 'border border-amber-500/30 text-amber-300 bg-amber-500/15',
  'complete':    'border border-white/15 text-slate-300 bg-white/10',
};
const statusLabels: Record<PositionStatus, string> = {
  'open':        'Open',
  'in-progress': 'In Progress',
  'complete':    'Complete',
};

export default function PositionWorkspace() {
  // Parameterized by position id (/clients/positions/:positionId); defaults to p1.
  const { positionId } = useParams<{ positionId: string }>();
  const position = mockPositions.find(p => p.id === positionId) ?? mockPositions[0];
  const [tab, setTab] = useState<Tab>('candidate');

  if (!position) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#0b1437]">
        <p className="text-[#94a3b8] text-sm">No position available.</p>
      </div>
    );
  }

  return (
    <div className="relative isolate flex-1 flex flex-col bg-[#0b1437] overflow-hidden min-h-0">
      {/* ── Background wave ── */}
      <WaveBackground />

      {/* Header */}
      <div className="shrink-0 px-5 pt-4 flex flex-col gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-3 min-w-0">
            <h1 className="text-xl font-semibold text-white truncate">{position.title}</h1>
            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium whitespace-nowrap ${statusStyles[position.status]}`}>
              {statusLabels[position.status]}
            </span>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-white/10 flex gap-1">
          {TABS.map(([key, label]) => {
            const active = tab === key;
            return (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={`px-4 py-2 -mb-px text-sm font-medium border-b-2 transition-colors ${
                  active
                    ? 'text-indigo-400 border-indigo-400'
                    : 'text-[#94a3b8] border-transparent hover:text-white'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab content */}
      <div className="flex-1 min-h-0 overflow-auto page-top-fade">
        {tab === 'candidate' && <CandidatesPane position={position} />}
        {tab === 'comparison' && <ComparisonView position={position} />}
        {/* JD content is only seeded for p1 in the prototype; other positions show
            the state a position has before its JD was imported. */}
        {tab === 'job-description' && (position.id === 'p1'
          ? <JobDescriptionSectionView position={position} />
          : (
            <TabEmptyState
              title="Job description not yet imported"
              hint="Upload or paste the JD for this position — sections, hard facts and Sophia's screening questions are generated from it."
            />
          ))}
      </div>
    </div>
  );
}

/* Shared empty state for tabs whose data has not been created for a position yet. */
function TabEmptyState({ title, hint }: { title: string; hint: string }) {
  return (
    <div className="px-5 pt-5 pb-10">
      <div className="max-w-xl mx-auto mt-16 rounded-2xl border border-dashed border-white/15 bg-white/[0.02] px-8 py-12 text-center">
        <p className="text-[15px] font-semibold text-white">{title}</p>
        <p className="text-[13px] text-[#94a3b8] leading-relaxed mt-2">{hint}</p>
      </div>
    </div>
  );
}

// ── Candidates pane — list/kanban view toggle ─────────────────────────────────

const VIEW_OPTS: { key: 'list' | 'kanban'; label: string; icon: string }[] = [
  { key: 'list',   label: 'List',   icon: 'M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01' },
  { key: 'kanban', label: 'Kanban', icon: 'M4 4h4.5v16H4zM9.75 4h4.5v10h-4.5zM15.5 4H20v13h-4.5z' },
];

function CandidatesPane({ position }: { position: Position }) {
  const [view, setView] = useState<'list' | 'kanban'>('list');
  const [statusFilter, setStatusFilter] = useState<Stage | 'all'>('all');
  // Only candidates actually matched to this position (MECE with the kanban board).
  const total = mockCandidates.filter(c => c.jobTitle === position.title).length;

  return (
    <div className="px-5 pt-5 pb-8 flex flex-col gap-4">
      {/* ── Toolbar: title, view toggle, then status filter — all grouped left ── */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-baseline gap-2.5">
          <h2 className="text-sm font-semibold text-white tracking-wide uppercase">Candidates</h2>
          <span className="text-[12px] text-slate-500 tabular-nums">{total} matched</span>
        </div>

        <div className="flex items-center gap-2.5">
          {/* View toggle */}
          <div className="inline-flex rounded-xl border border-white/10 bg-white/[0.04] p-1 h-[38px]">
            {VIEW_OPTS.map(opt => {
              const on = view === opt.key;
              return (
                <button
                  key={opt.key}
                  onClick={() => setView(opt.key)}
                  className={`flex items-center gap-2 px-3.5 rounded-lg text-[12px] font-semibold transition-all ${on ? 'bg-indigo-500/25 border border-indigo-400/30 text-white shadow-[0_2px_12px_rgba(99,102,241,0.25)]' : 'border border-transparent text-slate-400 hover:text-slate-200'}`}
                >
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round"><path d={opt.icon} /></svg>
                  {opt.label}
                </button>
              );
            })}
          </div>

          {/* Status dropdown — only relevant for the list view */}
          {view === 'list' && (
            <div className="relative">
              <select
                aria-label="Status filter"
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value as Stage | 'all')}
                className="appearance-none bg-white/[0.04] border border-white/10 rounded-xl text-[12px] font-semibold text-white pl-3.5 pr-9 h-[38px] outline-none hover:border-white/25 focus:border-indigo-400/50 transition-colors cursor-pointer"
              >
                <option value="all">Status: All</option>
                {STAGES.map(o => <option key={o.key} value={o.key}>{o.label}</option>)}
              </select>
              <svg className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6" /></svg>
            </div>
          )}
        </div>
      </div>

      {view === 'list'
        ? <CandidateTable positionTitle={position.title} statusFilter={statusFilter} />
        : <PipelineBoard positions={[]} hideFilter restrictPosition={position.title} />}
    </div>
  );
}

// ── Candidate table ──────────────────────────────────────────────────────────

// Candidate | Job Title | Status | Earliest Start | Match | Location | Salary
const COLS = 'grid-cols-[1.4fr_1.5fr_1.15fr_1fr_0.8fr_1.1fr_1fr]';
const HEADERS = ['Candidate', 'Job Title', 'Status', 'Earliest Start', 'Match', 'Location', 'Salary'];

function StatusPill({ status }: { status: Stage }) {
  const meta = STAGES.find(s => s.key === status) ?? STAGES[1];
  const pill = STATUS_PILL[status];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium border ${pill.cls}`}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: pill.dot }} />
      {meta.label}
    </span>
  );
}

function MatchCell({ pct }: { pct: number }) {
  const color = pct >= 85 ? '#34d399' : pct >= 70 ? '#fbbf24' : '#94a3b8';
  return (
    <span className="inline-flex items-center gap-1.5 text-sm font-semibold tabular-nums" style={{ color }}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: color }} />
      {pct}%
    </span>
  );
}

function fmtSalary(s: string | null): React.ReactNode {
  if (!s) return <span className="text-[#475569]">—</span>;
  const n = Number(s);
  return Number.isNaN(n) ? s : `${n.toLocaleString('de-DE')} €`;
}

/* ISO date → German format (01.08.2026). */
function fmtStartDate(iso: string | null): React.ReactNode {
  if (!iso) return <span className="text-[#475569]">—</span>;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

const PAGE_SIZE = 10;

function CandidateTable({ positionTitle, statusFilter }: { positionTitle: string; statusFilter: Stage | 'all' }) {
  const navigate = useNavigate();
  const [page, setPage] = useState(0);
  const stages = useStages();

  // Candidates matched to this position; status read live from the talent store.
  const all = mockCandidates.filter(c => c.jobTitle === positionTitle);
  const filtered = statusFilter === 'all' ? all : all.filter(c => stageOf(stages, c.id) === statusFilter);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages - 1);
  const candidates = filtered.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE);

  return (
    <div>
      <div className="border border-white/10 rounded-xl overflow-hidden bg-[#111a3c]">
        {/* Header row */}
        <div className={`grid ${COLS} px-5 bg-white/[0.03] border-b border-white/10`}>
          {HEADERS.map(h => (
            <div key={h} className="py-2 text-[10px] font-semibold text-[#94a3b8] uppercase tracking-wide">{h}</div>
          ))}
        </div>

        {/* Body */}
        {candidates.length === 0 ? (
          <div className="py-20 text-center text-sm text-[#94a3b8]">No candidates match this filter</div>
        ) : (
          candidates.map((c, i) => {
            const isLast = i === candidates.length - 1;
            return (
              <div
                key={c.id}
                onClick={() => navigate(`/clients/positions/candidate/${c.id}`)}
                className={`grid ${COLS} hover:bg-white/[0.04] cursor-pointer px-5 ${isLast ? '' : 'border-b border-white/[0.06]'}`}
              >
                {/* Candidate */}
                <div className="py-3 flex items-center gap-2.5 min-w-0 pr-2">
                  <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-300 font-semibold text-xs shrink-0">
                    {c.firstName.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-white truncate">{c.firstName} {c.lastName}</p>
                    <p className="text-xs text-[#94a3b8] truncate">{c.phoneNumber}</p>
                  </div>
                </div>
                {/* Job Title */}
                <div className="py-3 flex items-center min-w-0">
                  <span className="text-sm text-[#cbd5e1] truncate">{c.jobTitle}</span>
                </div>
                {/* Status */}
                <div className="py-3 flex items-center">
                  <StatusPill status={stageOf(stages, c.id)} />
                </div>
                {/* Earliest Start */}
                <div className="py-3 flex items-center">
                  <span className="text-sm text-[#cbd5e1] tabular-nums">{fmtStartDate(c.earliestStart)}</span>
                </div>
                {/* Match */}
                <div className="py-3 flex items-center">
                  <MatchCell pct={matchOf(c.id)} />
                </div>
                {/* Location */}
                <div className="py-3 flex items-center min-w-0">
                  <span className="text-sm text-[#cbd5e1] truncate">{c.city ?? <span className="text-[#475569]">—</span>}</span>
                </div>
                {/* Salary */}
                <div className="py-3 flex items-center">
                  <span className="text-sm text-[#cbd5e1] tabular-nums">{fmtSalary(c.salary)}</span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {totalPages > 1 && (
        <div className="mt-3 flex items-center justify-between text-xs text-[#94a3b8]">
          <span>
            {safePage * PAGE_SIZE + 1}–{Math.min((safePage + 1) * PAGE_SIZE, filtered.length)} of {filtered.length}
          </span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={safePage === 0}
              className="px-2.5 py-1 rounded-md border border-white/10 bg-white/[0.04] text-[#cbd5e1] hover:bg-white/[0.08] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Prev
            </button>
            <span className="px-1 tabular-nums">Page {safePage + 1} / {totalPages}</span>
            <button
              onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={safePage >= totalPages - 1}
              className="px-2.5 py-1 rounded-md border border-white/10 bg-white/[0.04] text-[#cbd5e1] hover:bg-white/[0.08] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Job Description — briefing document + Sophia's linked screening flow ──────
//
// Concept: the JD is ONE uninterrupted, readable document (center). The screen's
// extra width is used for purpose-built side zones instead of stretched text:
// a scrollspy section nav (left) and Sophia's interview flow (right). Questions
// are referenced footnote-style — a numbered chip on the bullet maps to the same
// number in Sophia's panel, with two-way hover highlighting and click-to-jump.

/* Sophia's screening questions, in call order (asked in German on the call,
   displayed in English here). */
const JD_QUESTIONS: { id: number; text: string }[] = [
  { id: 1, text: 'Which vocational training have you completed — and is it recognized in Germany?' },
  { id: 2, text: 'Are you qualified to carry out DGUV V3 inspections (training or certification as an electrician)?' },
  { id: 3, text: 'Do you have experience in field service and/or with coffee machines?' },
  { id: 4, text: 'Do you drink coffee — and are you willing to taste coffee during commissioning and repairs?' },
  { id: 5, text: 'What is your earliest possible start date?' },
  { id: 6, text: 'What is your salary expectation (gross/month)?' },
  { id: 7, text: 'What questions do you have for us?' },
];

type JdBullet = { text: string; q?: number };
type JdSection = { id: string; title: string; icon: string; accent: string; bullets: JdBullet[] };

/* Universal JD categories — identical across every open role; only the bullets
   (and which questions branch off them) change per position. */
const JD_SECTIONS: JdSection[] = [
  {
    id: 'aufgaben', title: 'Responsibilities', accent: '#818cf8',
    icon: 'M9 4h6a2 2 0 0 1 2 2v1h3a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h3V6a2 2 0 0 1 2-2zM9 7h6V6H9v1z',
    bullets: [
      { text: 'End-to-end care of hot-beverage machines at business customers (bakeries, gastronomy, hotels, communal catering)' },
      { text: 'Commissioning, regular maintenance, troubleshooting and repair', q: 4 },
      { text: 'Supporting customers with care and handling of the machines' },
      { text: 'Carrying out inspections according to the DGUV V3 regulation' },
      { text: 'Managing the spare-parts stock in the service vehicle and ensuring smooth operations' },
    ],
  },
  {
    id: 'ausbildung', title: 'Education', accent: '#22d3ee',
    icon: 'M22 10L12 5 2 10l10 5 10-5zM6 12v5c0 2 3 3 6 3s6-1 6-3v-5',
    bullets: [
      { text: 'Career changers welcome' },
      { text: 'Must-have: completed vocational training in a technical trade, recognized in Germany', q: 1 },
      { text: 'Ideal: electrical training or further education (electrician, service technician or similar)' },
    ],
  },
  {
    id: 'kompetenzen', title: 'Skills & Experience', accent: '#a855f7',
    icon: 'M9 11l3 3L22 4M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11',
    bullets: [
      { text: 'Qualification for DGUV V3 inspections of electrical systems and equipment desirable', q: 2 },
      { text: 'Professional experience in field or customer service desirable', q: 3 },
      { text: 'Enjoys working with people and communicates confidently' },
    ],
  },
  {
    id: 'rahmendaten', title: 'Key Facts', accent: '#f59e0b',
    icon: 'M9 4h6v3H9zM7 5H6a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-1M8 12h8M8 16h6',
    bullets: [
      { text: 'Start immediately · initially limited to 24 months (usually made permanent)', q: 5 },
      { text: 'Full-time, 40 h/week · working hours 8:00–17:00' },
      { text: 'On-call duty roughly every 12th/13th weekend' },
      { text: 'Salary: 3,200 € during probation, then 3,500 € + approx. 280 € net meal allowance', q: 6 },
      { text: 'Structured onboarding in the first 12 weeks, partly with overnight stays (theory phase)' },
    ],
  },
  {
    id: 'benefits', title: 'Benefits', accent: '#34d399',
    icon: 'M20 12v9H4v-9M2 7h20v5H2zM12 22V7M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7zM12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z',
    bullets: [
      { text: 'Employee discount in the Tchibo online shop (15%)' },
      { text: 'Regular team events (summer and winter party)' },
      { text: 'Gym membership subsidy' },
      { text: 'JobRad bike-leasing program' },
      { text: 'Garage / parking-space rent covered' },
    ],
  },
];

/* Hard facts every recruiter scans for first — surfaced in the hero strip. */
const JD_FACTS: { icon: string; label: string; value: string }[] = [
  { icon: 'M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0zM12 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6z', label: 'Location', value: 'Greater Munich' },
  { icon: 'M21 11.5a8.38 8.38 0 0 1-8.5 8.5 8.5 8.5 0 0 1-3.8-.9L3 21l1.9-5.7A8.5 8.5 0 1 1 21 11.5z', label: 'German', value: 'B2 minimum' },
  { icon: 'M8 2v4M16 2v4M3 9h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z', label: 'Start', value: 'Immediately' },
  { icon: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 6v6l4 2', label: 'Hours', value: '40 h / week' },
  { icon: 'M2 7h20v10H2zM12 14.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z', label: 'Salary', value: '3.200–3.500 € + expenses' },
];

function SparkGlyph() {
  // Star path is centered on (12,12) so it sits dead-center inside icon boxes.
  return <svg className="w-3.5 h-3.5 shrink-0 block" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round"><path d="M12 6l1.8 4.2L18 12l-4.2 1.8L12 18l-1.8-4.2L6 12l4.2-1.8L12 6z" /></svg>;
}

/* Shared hero: title, employer, Sophia badge + the hard-facts strip. */
function JdHero({ position }: { position: Position }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.05] to-white/[0.02] backdrop-blur-xl px-7 py-6">
      <div className="absolute -right-16 -top-20 w-72 h-72 rounded-full blur-3xl pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.3), transparent 70%)' }} />
      <div className="relative">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[10px] uppercase tracking-[0.22em] font-semibold text-indigo-300/90">Job Description</p>
            <h2 className="text-[25px] font-bold text-white mt-1 tracking-tight leading-tight">{position.title}</h2>
            <p className="text-sm text-slate-400 mt-0.5">{position.employer}</p>
          </div>
          <div className="inline-flex items-center gap-2.5 text-[12px] text-indigo-100 bg-indigo-500/15 border border-indigo-400/25 rounded-xl px-3.5 py-2.5">
            <span className="w-7 h-7 rounded-lg bg-indigo-500/25 border border-indigo-400/30 text-indigo-200 flex items-center justify-center shrink-0"><SparkGlyph /></span>
            <span>Sophia screens with <span className="font-bold text-white">{JD_QUESTIONS.length}</span> questions from this briefing</span>
          </div>
        </div>
        <div className="mt-5 flex flex-wrap gap-2.5">
          {JD_FACTS.map(f => (
            <div key={f.label} className="flex items-center gap-2.5 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2">
              <svg className="w-4 h-4 text-indigo-300/80 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round"><path d={f.icon} /></svg>
              <div className="min-w-0">
                <p className="text-[9px] uppercase tracking-[0.14em] font-semibold text-slate-500 leading-none">{f.label}</p>
                <p className="text-[12.5px] font-semibold text-white leading-tight mt-1">{f.value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* Shared section header row inside the document card. */
function JdSectionHeader({ s }: { s: JdSection }) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${s.accent}1c`, color: s.accent, border: `1px solid ${s.accent}38` }}>
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round"><path d={s.icon} /></svg>
      </span>
      <h3 className="text-[16px] font-bold text-white tracking-tight">{s.title}</h3>
      <span className="flex-1 h-px bg-white/[0.07]" />
    </div>
  );
}

// ── Job Description III — expandable Sophia questions, no side panel ──────────
//
// Middle ground: the bullet list stays uninterrupted. Bullets Sophia screens
// carry a numbered chip — clicking the row (or chip) expands the question
// inline as a threaded annotation; clicking again collapses it.

function JobDescriptionSectionView({ position }: { position: Position }) {
  const [openQs, setOpenQs] = useState<Set<number>>(new Set());
  const questionById = useMemo(() => new Map(JD_QUESTIONS.map(qq => [qq.id, qq.text])), []);
  const closingQuestions = useMemo(() => {
    const linked = new Set<number>();
    JD_SECTIONS.forEach(s => s.bullets.forEach(bl => { if (bl.q != null) linked.add(bl.q); }));
    return JD_QUESTIONS.filter(qq => !linked.has(qq.id));
  }, []);

  const toggleQ = (qId: number) =>
    setOpenQs(prev => {
      const next = new Set(prev);
      if (next.has(qId)) next.delete(qId); else next.add(qId);
      return next;
    });

  return (
    <div className="px-5 pt-5 pb-10">
      <div className="max-w-4xl mx-auto w-full">

        {/* ── Hero ── */}
        <JdHero position={position} />

        {/* ── Document: clean bullets, questions expand on click ── */}
        <article className="mt-5 rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl px-7 py-6">
          {JD_SECTIONS.map((s, si) => (
            <section key={s.id} className={si > 0 ? 'mt-9' : ''}>
              <JdSectionHeader s={s} />

              <div className="mt-3.5 flex flex-col gap-0.5">
                {s.bullets.map((bl, i) => {
                  const open = bl.q != null && openQs.has(bl.q);
                  return (
                    <div key={i}>
                      <div
                        onClick={bl.q != null ? () => toggleQ(bl.q!) : undefined}
                        className={`flex items-start gap-3 rounded-lg px-3 py-[7px] -mx-3 transition-colors ${bl.q != null ? 'cursor-pointer hover:bg-white/[0.04]' : ''} ${open ? 'bg-indigo-500/[0.07]' : ''}`}
                      >
                        <span className="w-1.5 h-1.5 rounded-full shrink-0 mt-[7.5px]" style={{ background: s.accent }} />
                        <p className="text-[13.5px] text-[#d4dbe9] leading-relaxed flex-1">
                          {bl.text}
                          {bl.q != null && (
                            <span
                              title={open ? 'Collapse question' : "Show Sophia's question"}
                              className={`ml-2 inline-flex items-center justify-center align-middle w-[19px] h-[19px] rounded-md transition-all ${open ? 'bg-indigo-400 text-[#0b1437] shadow-[0_0_12px_rgba(129,140,248,0.55)]' : 'bg-indigo-500/15 text-indigo-300 border border-indigo-400/30'}`}
                            >
                              <SparkGlyph />
                            </span>
                          )}
                        </p>
                        {bl.q != null && (
                          <svg
                            className={`w-3.5 h-3.5 shrink-0 mt-1 text-indigo-300/70 transition-transform ${open ? 'rotate-180' : ''}`}
                            viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
                          >
                            <path d="M6 9l6 6 6-6" />
                          </svg>
                        )}
                      </div>

                      {/* Expanded question — simple quote stroke */}
                      {open && bl.q != null && (
                        <blockquote className="ml-[26px] my-1.5 pl-3.5 border-l-2 border-indigo-400/60">
                          <p className="flex items-center gap-1.5 text-[9px] uppercase tracking-[0.16em] font-semibold text-indigo-300/80">
                            <SparkGlyph /> Sophia asks in the screening
                          </p>
                          <p className="text-[13px] text-[#dbe2f0] leading-snug mt-1">{questionById.get(bl.q)}</p>
                        </blockquote>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          ))}

          {/* Closing questions without a specific requirement */}
          {closingQuestions.length > 0 && (
            <section className="mt-9">
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-indigo-500/15 border border-indigo-400/30 text-indigo-300"><SparkGlyph /></span>
                <h3 className="text-[16px] font-bold text-white tracking-tight">Closing questions</h3>
                <span className="flex-1 h-px bg-white/[0.07]" />
              </div>
              <div className="mt-3.5 flex flex-col gap-3">
                {closingQuestions.map(qq => (
                  <blockquote key={qq.id} className="pl-3.5 border-l-2 border-indigo-400/60">
                    <p className="flex items-center gap-1.5 text-[9px] uppercase tracking-[0.16em] font-semibold text-indigo-300/80">
                      <SparkGlyph /> Sophia asks in the screening
                    </p>
                    <p className="text-[13px] text-[#dbe2f0] leading-snug mt-1">{qq.text}</p>
                  </blockquote>
                ))}
              </div>
            </section>
          )}
        </article>
      </div>
    </div>
  );
}

// ── Comparison — decision matrix built from the data we actually collect ──────
//
// Categories are derived from the two real data sources:
//   · Job Description   →  must-haves (knock-out criteria), budget, service area
//   · Sophia screening  →  experience, German level, salary expectation, start date
// The page answers the HR team's three questions in one view:
// Who meets the knock-out criteria? · Who fits the conditions? · Whom do we invite?

type Tri = boolean | 'partial';
type GermanLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2' | 'Native';
type CompRow = {
  id: string;                                      // canonical candidate id (talent store)
  current: string;                                 // current / last role
  must: { training: Tri; dguv: Tri; german: Tri };
  experience: number;                              // 0–10, from CV + call
  german: GermanLevel;                             // CEFR level, assessed in the call
  salary: number;                                  // expectation €/month
  start: string; startDays: number;
};

const COMP_BUDGET = 3500; // target salary after probation (from the JD)

/* Per-candidate screening results for THIS position. Identity (name, city,
   distance) and the match score come from the canonical talent store — only
   call-derived assessment data lives here. */
const COMP_ROWS: CompRow[] = [
  {
    id: '2', current: 'Service technician, vending machines',
    must: { training: true, dguv: true, german: true },
    experience: 9, german: 'Native', salary: 3400, start: 'Jul 1, 2026', startDays: 21,
  },
  {
    id: '1', current: 'Service technician, refrigeration',
    must: { training: true, dguv: true, german: true },
    experience: 7, german: 'Native', salary: 3650, start: 'Aug 1, 2026', startDays: 52,
  },
  {
    id: '5', current: 'Car mechatronics technician',
    must: { training: true, dguv: false, german: 'partial' },
    experience: 7, german: 'B1', salary: 3100, start: 'Immediately', startDays: 0,
  },
  {
    id: '4', current: 'Industrial mechanic',
    must: { training: true, dguv: false, german: true },
    experience: 4, german: 'Native', salary: 3800, start: 'Sep 1, 2026', startDays: 83,
  },
  {
    id: '6', current: 'Career changer, retail',
    must: { training: false, dguv: false, german: true },
    experience: 3, german: 'C1', salary: 3000, start: 'Immediately', startDays: 0,
  },
  {
    id: '3', current: 'Machining technician',
    must: { training: true, dguv: false, german: true },
    experience: 2, german: 'Native', salary: 4200, start: 'Oct 1, 2026', startDays: 113,
  },
];

/* CEFR levels at/above the JD requirement (B2) render green, B1 amber, below red. */
function germanMeta(level: GermanLevel): { cls: string; dot: string } {
  if (level === 'B1') return { cls: 'text-amber-300 bg-amber-500/15 border-amber-500/30', dot: '#fbbf24' };
  if (level === 'A1' || level === 'A2') return { cls: 'text-rose-300 bg-rose-500/15 border-rose-500/30', dot: '#fb7185' };
  return { cls: 'text-emerald-300 bg-emerald-500/15 border-emerald-500/30', dot: '#34d399' };
}

const MUST_DEFS: { key: keyof CompRow['must']; label: string; full: string }[] = [
  { key: 'training', label: 'Training',  full: 'Recognized technical training' },
  { key: 'dguv',     label: 'DGUV V3',   full: 'DGUV V3 qualification' },
  { key: 'german',   label: 'German B2', full: 'German B2 minimum' },
];

/* Mini checklist row: explicit label + check / tilde / cross — unambiguous at a glance. */
function MustCheck({ state, label, full }: { state: Tri; label: string; full: string }) {
  const color = state === true ? '#34d399' : state === 'partial' ? '#fbbf24' : '#fb7185';
  const suffix = state === true ? 'met' : state === 'partial' ? 'partially met' : 'not met';
  return (
    <span title={`${full}: ${suffix}`} className="flex items-center gap-1.5 cursor-default">
      <svg className="w-3 h-3 shrink-0" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
        {state === true ? <path d="M5 13l4 4L19 7" /> : state === 'partial' ? <path d="M5 12h14" /> : <path d="M6 6l12 12M18 6L6 18" />}
      </svg>
      <span className={`text-[10.5px] font-medium ${state === false ? 'text-slate-500' : 'text-[#cbd5e1]'}`}>{label}</span>
    </span>
  );
}

function ScoreBar({ value }: { value: number }) {
  const color = value >= 7.5 ? '#34d399' : value >= 5 ? '#fbbf24' : '#fb7185';
  return (
    <div className="flex items-center gap-2">
      <span className="text-[13px] font-bold tabular-nums text-white w-5">{value}</span>
      <span className="flex-1 h-1.5 rounded-full bg-white/[0.08] overflow-hidden">
        <span className="block h-full rounded-full" style={{ width: `${value * 10}%`, background: `linear-gradient(90deg, ${color}99, ${color})` }} />
      </span>
    </div>
  );
}

function matchColor(v: number) {
  return v >= 80 ? '#34d399' : v >= 60 ? '#fbbf24' : '#fb7185';
}

function salaryFit(salary: number): { label: string; color: string } {
  if (salary <= COMP_BUDGET) return { label: 'within budget', color: '#34d399' };
  if (salary <= COMP_BUDGET + 500) return { label: 'negotiable', color: '#fbbf24' };
  return { label: 'over budget', color: '#fb7185' };
}

type CompSortKey = 'name' | 'must' | 'experience' | 'german' | 'salary' | 'startDays' | 'mobility' | 'match';

const GERMAN_RANK: Record<GermanLevel, number> = { A1: 1, A2: 2, B1: 3, B2: 4, C1: 5, C2: 6, Native: 7 };

/* Numeric sort value per column: must-haves count fulfilled (partial = 0.5), mobility uses the km distance. */
function compSortValue(r: CompRow, key: CompSortKey): number | string {
  const t = TALENT[r.id];
  switch (key) {
    case 'name': return t.name;
    case 'must': return MUST_DEFS.reduce((s, d) => s + (r.must[d.key] === true ? 1 : r.must[d.key] === 'partial' ? 0.5 : 0), 0);
    case 'german': return GERMAN_RANK[r.german];
    case 'mobility': return parseInt(t.distance, 10) || 999;
    case 'match': return t.match;
    default: return r[key];
  }
}

/* Content-sized columns: every column hugs its content, only Candidate flexes —
   so the gutter between any two columns is exactly the uniform grid gap. */
const COMP_COLS = 'grid-cols-[minmax(190px,1fr)_120px_130px_95px_100px_95px_130px_56px_90px]';

function ComparisonView({ position }: { position: Position }) {
  const navigate = useNavigate();
  const [sortKey, setSortKey] = useState<CompSortKey>('match');
  const [sortAsc, setSortAsc] = useState(false);

  const rows = useMemo(() => {
    // Only candidates matched to THIS position (MECE with table and kanban).
    return COMP_ROWS
      .filter(r => TALENT[r.id]?.position === position.title)
      .sort((a, b) => {
        const va = compSortValue(a, sortKey);
        const vb = compSortValue(b, sortKey);
        const cmp = typeof va === 'string' ? va.localeCompare(vb as string, 'de') : va - (vb as number);
        return cmp * (sortAsc ? 1 : -1);
      });
  }, [sortKey, sortAsc, position.title]);

  if (rows.length === 0) {
    return (
      <TabEmptyState
        title="No screening results yet"
        hint="The comparison fills up as candidates for this position complete their Sophia screening."
      />
    );
  }

  // Default direction: "best first" — ascending where lower is better (salary, start, distance, name).
  const toggleSort = (key: CompSortKey) => {
    if (key === sortKey) setSortAsc(a => !a);
    else { setSortKey(key); setSortAsc(key === 'salary' || key === 'startDays' || key === 'mobility' || key === 'name'); }
  };

  const SortHeader = ({ label, k, title }: { label: string; k: CompSortKey; title: string }) => (
    <button onClick={() => toggleSort(k)} title={title} className={`flex items-center gap-1 text-left uppercase tracking-wide transition-colors ${sortKey === k ? 'text-white' : 'hover:text-slate-300'}`}>
      {label}
      <svg className={`w-2.5 h-2.5 transition-all ${sortKey === k ? 'opacity-100' : 'opacity-30'} ${sortKey === k && sortAsc ? 'rotate-180' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6" /></svg>
    </button>
  );

  return (
    <div className="px-5 pt-5 pb-10 flex flex-col gap-5">

      {/* ── Decision matrix ── */}
      <div className="rounded-xl border border-white/10 bg-white/[0.03] backdrop-blur-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-white/[0.06] flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-semibold text-white tracking-wide uppercase">Candidate Comparison</h2>
            <p className="text-[11.5px] text-slate-500 mt-0.5">{position.title}</p>
          </div>
          <p className="text-[10.5px] text-slate-500">
            Must-haves &amp; budget from the job description · scores from the Sophia screening
          </p>
        </div>

        <div className="overflow-x-auto">
          <div className="min-w-[1180px]">
            {/* Header */}
            <div className={`grid ${COMP_COLS} gap-4 items-center px-5 py-2.5 text-[9.5px] font-semibold text-slate-500 border-b border-white/[0.06]`}>
              <SortHeader label="Candidate" k="name" title="Sort alphabetically" />
              <SortHeader label="Must-haves" k="must" title="Knock-out criteria from the job description — sorted by number of criteria met" />
              <SortHeader label="Experience" k="experience" title="Relevant field-service experience — scored from CV and Sophia call" />
              <SortHeader label="German" k="german" title="German level (CEFR A1–C2 / native) — sorted by language level" />
              <SortHeader label="Salary" k="salary" title={`Salary expectation vs. budget (${COMP_BUDGET.toLocaleString('de-DE')} € after probation)`} />
              <SortHeader label="Start" k="startDays" title="Earliest possible start date" />
              <SortHeader label="Mobility" k="mobility" title="Distance to the service area — sorted by proximity" />
              <SortHeader label="Match" k="match" title="Overall fit from all collected data" />
              <span />
            </div>

            {/* Rows */}
            {rows.map(r => {
              const t = TALENT[r.id];
              const fit = salaryFit(r.salary);
              const de = germanMeta(r.german);
              return (
                <div key={r.id} className="border-b border-white/[0.05] last:border-b-0">
                  <div className="hover:bg-white/[0.035] transition-colors">
                    <div className={`grid ${COMP_COLS} gap-4 items-center px-5 py-3`}>
                      {/* Candidate — identity from the talent store */}
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500/40 to-violet-500/40 border border-white/15 text-white text-[11px] font-bold flex items-center justify-center shrink-0">
                          {t.name.split(' ').map(p => p[0]).slice(0, 2).join('')}
                        </span>
                        <div className="min-w-0">
                          <p className="text-[13px] font-semibold text-white truncate">{t.name}</p>
                          <p className="text-[10.5px] text-slate-500 truncate">{r.current}</p>
                        </div>
                      </div>
                      {/* Must-haves */}
                      <div className="flex flex-col gap-[3px]">
                        {MUST_DEFS.map(m => <MustCheck key={m.key} state={r.must[m.key]} label={m.label} full={m.full} />)}
                      </div>
                      {/* Experience */}
                      <ScoreBar value={r.experience} />
                      {/* German level (CEFR) */}
                      <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] font-semibold border w-fit ${de.cls}`}>
                        <span className="w-1.5 h-1.5 rounded-full" style={{ background: de.dot }} />{r.german}
                      </span>
                      {/* Salary */}
                      <div>
                        <p className="text-[12.5px] font-semibold text-white tabular-nums">{r.salary.toLocaleString('de-DE')} €</p>
                        <p className="flex items-center gap-1 text-[10px]" style={{ color: fit.color }}>
                          <span className="w-1.5 h-1.5 rounded-full" style={{ background: fit.color }} />{fit.label}
                        </p>
                      </div>
                      {/* Start */}
                      <p className={`text-[12px] ${r.startDays === 0 ? 'text-emerald-300 font-semibold' : 'text-[#cbd5e1]'}`}>{r.start}</p>
                      {/* Mobility */}
                      <p className="text-[11.5px] text-[#aeb8cc] leading-snug">{t.city} · {t.distance}</p>
                      {/* Match — same canonical score as table, cards and profile */}
                      <p className="text-[19px] font-bold tabular-nums" style={{ color: matchColor(t.match) }}>{t.match}</p>
                      {/* Profile — always visible */}
                      <button
                        onClick={() => navigate(`/clients/positions/candidate/${r.id}`)}
                        title="View full profile"
                        className="inline-flex items-center gap-1 text-[11.5px] font-semibold text-indigo-300 border border-indigo-400/30 bg-indigo-500/10 hover:bg-indigo-500/25 rounded-lg px-2.5 py-1.5 transition-colors w-fit"
                      >
                        Profile
                        <svg className="w-3 h-3 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round"><path d="M7 17L17 7M9 7h8v8" /></svg>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

