import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { mockPositions, mockCandidates } from '../data/mockData';
import { WaveBackground } from '../components/SophiaChrome';
import { PipelineBoard } from '../dashboard/Dashboard';
import type { Position, PositionStatus } from '../types';

type Tab = 'candidate' | 'comparison' | 'job-description';

const TABS: [Tab, string][] = [
  ['candidate', 'Candidate'],
  ['comparison', 'Comparison'],
  ['job-description', 'Job Description'],
];

/* ── Candidate status — mirrors the active stages of the Candidate Pipeline ── */
type StatusKey = 'new' | 'shortlist' | 'interview' | 'offer' | 'hired';
const STATUS_OPTS: { key: StatusKey; label: string; cls: string; dot: string }[] = [
  { key: 'new',       label: 'New',            cls: 'text-sky-300 bg-sky-500/15 border-sky-500/30',         dot: '#38bdf8' },
  { key: 'shortlist', label: 'Shortlisted',    cls: 'text-indigo-300 bg-indigo-500/15 border-indigo-500/30', dot: '#818cf8' },
  { key: 'interview', label: 'Interviewing',   cls: 'text-violet-300 bg-violet-500/15 border-violet-500/30', dot: '#c084fc' },
  { key: 'offer',     label: 'Offer Extended', cls: 'text-amber-300 bg-amber-500/15 border-amber-500/30',    dot: '#fbbf24' },
  { key: 'hired',     label: 'Hired',          cls: 'text-emerald-300 bg-emerald-500/15 border-emerald-500/30', dot: '#34d399' },
];
const STATUS_BY_ID: Record<string, StatusKey> = {
  '1': 'interview', '2': 'offer', '3': 'shortlist', '4': 'new', '5': 'new', '6': 'shortlist', '7': 'hired', '8': 'interview', '9': 'new',
};
const statusOf = (id: string): StatusKey => STATUS_BY_ID[id] ?? 'new';

/* Position fit score (mock) — the single most useful at-a-glance overview metric. */
const MATCH_BY_ID: Record<string, number> = {
  '1': 92, '2': 87, '3': 79, '4': 74, '5': 68, '6': 61, '7': 83, '8': 71, '9': 65,
};
const matchOf = (id: string): number => MATCH_BY_ID[id] ?? 70;

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
  const position = mockPositions[0];
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
      <div className="flex-1 min-h-0 overflow-auto">
        {tab === 'candidate' && <CandidatesPane position={position} />}
        {tab === 'comparison' && <ComparisonView position={position} />}
        {tab === 'job-description' && <JobDescriptionSectionView position={position} />}
      </div>
    </div>
  );
}

// ── Candidates pane — list/kanban view toggle ─────────────────────────────────

const VIEW_OPTS: { key: 'list' | 'kanban'; label: string; icon: string }[] = [
  { key: 'list',   label: 'Liste',  icon: 'M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01' },
  { key: 'kanban', label: 'Kanban', icon: 'M4 4h4.5v16H4zM9.75 4h4.5v10h-4.5zM15.5 4H20v13h-4.5z' },
];

function CandidatesPane({ position }: { position: Position }) {
  const [view, setView] = useState<'list' | 'kanban'>('list');
  const [statusFilter, setStatusFilter] = useState<StatusKey | 'all'>('all');
  const total = mockCandidates.slice(0, Math.max(position.candidateCount, 1)).length;

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
                onChange={e => setStatusFilter(e.target.value as StatusKey | 'all')}
                className="appearance-none bg-white/[0.04] border border-white/10 rounded-xl text-[12px] font-semibold text-white pl-3.5 pr-9 h-[38px] outline-none hover:border-white/25 focus:border-indigo-400/50 transition-colors cursor-pointer"
              >
                <option value="all">Status: All</option>
                {STATUS_OPTS.map(o => <option key={o.key} value={o.key}>{o.label}</option>)}
              </select>
              <svg className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6" /></svg>
            </div>
          )}
        </div>
      </div>

      {view === 'list'
        ? <CandidateTable candidateCount={position.candidateCount} statusFilter={statusFilter} />
        : <PipelineBoard positions={[]} hideFilter restrictPosition={position.title} />}
    </div>
  );
}

// ── Candidate table ──────────────────────────────────────────────────────────

// Candidate | Job Title | Status | Earliest Start | Match | Location | Salary
const COLS = 'grid-cols-[1.4fr_1.5fr_1.15fr_1fr_0.8fr_1.1fr_1fr]';
const HEADERS = ['Candidate', 'Job Title', 'Status', 'Earliest Start', 'Match', 'Location', 'Salary'];

function StatusPill({ status }: { status: StatusKey }) {
  const opt = STATUS_OPTS.find(o => o.key === status) ?? STATUS_OPTS[0];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium border ${opt.cls}`}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: opt.dot }} />
      {opt.label}
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

const PAGE_SIZE = 10;

function CandidateTable({ candidateCount, statusFilter }: { candidateCount: number; statusFilter: StatusKey | 'all' }) {
  const navigate = useNavigate();
  const [page, setPage] = useState(0);

  const all = mockCandidates.slice(0, Math.max(candidateCount, 1));
  const filtered = statusFilter === 'all' ? all : all.filter(c => statusOf(c.id) === statusFilter);
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
                  <StatusPill status={statusOf(c.id)} />
                </div>
                {/* Earliest Start */}
                <div className="py-3 flex items-center">
                  <span className="text-xs text-[#94a3b8]">{c.earliestStart ?? <span className="text-[#475569]">—</span>}</span>
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

/* Sophia's screening questions, in call order. */
const JD_QUESTIONS: { id: number; text: string }[] = [
  { id: 1, text: 'Welche Ausbildung haben Sie abgeschlossen – und ist sie in Deutschland anerkannt?' },
  { id: 2, text: 'Besitzen Sie die Befähigung, DGUV-V3-Prüfungen durchzuführen (Ausbildung oder Zertifikat zur Elektrofachkraft)?' },
  { id: 3, text: 'Haben Sie Erfahrung im Außendienst und/oder mit Kaffeemaschinen?' },
  { id: 4, text: 'Trinken Sie Kaffee – bzw. sind Sie bereit, bei Inbetriebnahme und Reparatur Kaffee zu probieren?' },
  { id: 5, text: 'Was ist Ihr frühestmögliches Eintrittsdatum?' },
  { id: 6, text: 'Wie sind Ihre Gehaltsvorstellungen (brutto/Monat)?' },
  { id: 7, text: 'Welche Fragen haben Sie an uns?' },
];

type JdBullet = { text: string; q?: number };
type JdSection = { id: string; title: string; icon: string; accent: string; bullets: JdBullet[] };

/* Universal JD categories — identical across every open role; only the bullets
   (and which questions branch off them) change per position. */
const JD_SECTIONS: JdSection[] = [
  {
    id: 'aufgaben', title: 'Aufgaben', accent: '#818cf8',
    icon: 'M9 4h6a2 2 0 0 1 2 2v1h3a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h3V6a2 2 0 0 1 2-2zM9 7h6V6H9v1z',
    bullets: [
      { text: 'Ganzheitliche Betreuung von Heißgetränkeautomaten bei Geschäftskunden (Bäckereien, Gastronomie, Hotellerie, Gemeinschaftsverpflegung)' },
      { text: 'Inbetriebnahme, regelmäßige Wartung sowie Störungsbehebung und Instandsetzung', q: 4 },
      { text: 'Unterstützung der Kunden bei Pflege und Handhabung der Geräte' },
      { text: 'Durchführung von Prüfungen nach der DGUV V3-Vorschrift' },
      { text: 'Verwaltung des Lagerbestands im Dienstfahrzeug und Sicherstellung des einwandfreien Betriebs' },
    ],
  },
  {
    id: 'ausbildung', title: 'Ausbildung', accent: '#22d3ee',
    icon: 'M22 10L12 5 2 10l10 5 10-5zM6 12v5c0 2 3 3 6 3s6-1 6-3v-5',
    bullets: [
      { text: 'Quereinsteiger:innen willkommen' },
      { text: 'Must-have: abgeschlossene, in Deutschland anerkannte Ausbildung in einem technisch-handwerklichen Beruf', q: 1 },
      { text: 'Ideal: elektrotechnische Aus- oder Weiterbildung (Elektriker, Servicetechniker o. Ä.)' },
    ],
  },
  {
    id: 'kompetenzen', title: 'Kompetenzen & Berufserfahrung', accent: '#a855f7',
    icon: 'M9 11l3 3L22 4M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11',
    bullets: [
      { text: 'Eignung zur DGUV V3-Prüfung an elektrischen Anlagen und Geräten wünschenswert', q: 2 },
      { text: 'Berufserfahrung im Außen- oder Kundendienst wünschenswert', q: 3 },
      { text: 'Spaß am Umgang mit Menschen und ausgeprägtes Kommunikationsgeschick' },
    ],
  },
  {
    id: 'rahmendaten', title: 'Rahmendaten', accent: '#f59e0b',
    icon: 'M9 4h6v3H9zM7 5H6a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-1M8 12h8M8 16h6',
    bullets: [
      { text: 'Start ab sofort · zunächst auf 24 Monate befristet (im Regelfall Entfristung)', q: 5 },
      { text: 'Vollzeit, 40 Std./Woche · Arbeitszeit 8:00–17:00 Uhr' },
      { text: 'Bereitschaftsdienst ca. jedes 12./13. Wochenende' },
      { text: 'Gehalt: 3.200 € in der Probezeit, danach 3.500 € + ca. 280 € netto Verpflegungspauschale', q: 6 },
      { text: 'Strukturierte Einarbeitung in den ersten 12 Wochen, teils mit Übernachtung (Theoriephase)' },
    ],
  },
  {
    id: 'benefits', title: 'Benefits', accent: '#34d399',
    icon: 'M20 12v9H4v-9M2 7h20v5H2zM12 22V7M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7zM12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z',
    bullets: [
      { text: 'Mitarbeiterrabatt im Tchibo-Onlineshop (15 %)' },
      { text: 'Regelmäßige Teamevents (Sommer- und Winterfest)' },
      { text: 'Zuschuss zur Nutzung von Fitnessstudios' },
      { text: 'Teilnahme am JobRad' },
      { text: 'Übernahme der Garagen-/Stellplatzmiete' },
    ],
  },
];

/* Hard facts every recruiter scans for first — surfaced in the hero strip. */
const JD_FACTS: { icon: string; label: string; value: string }[] = [
  { icon: 'M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0zM12 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6z', label: 'Standort', value: 'Großraum München' },
  { icon: 'M21 11.5a8.38 8.38 0 0 1-8.5 8.5 8.5 8.5 0 0 1-3.8-.9L3 21l1.9-5.7A8.5 8.5 0 1 1 21 11.5z', label: 'Deutsch', value: 'Mind. B2' },
  { icon: 'M8 2v4M16 2v4M3 9h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z', label: 'Start', value: 'Ab sofort' },
  { icon: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 6v6l4 2', label: 'Pensum', value: '40 Std. / Woche' },
  { icon: 'M2 7h20v10H2zM12 14.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z', label: 'Gehalt', value: '3.200–3.500 € + Spesen' },
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
            <span>Sophia screent mit <span className="font-bold text-white">{JD_QUESTIONS.length}</span> Fragen aus diesem Briefing</span>
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
                              title={open ? 'Frage einklappen' : 'Sophias Frage anzeigen'}
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
                            <SparkGlyph /> Sophia fragt im Screening
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
                <h3 className="text-[16px] font-bold text-white tracking-tight">Zum Abschluss</h3>
                <span className="flex-1 h-px bg-white/[0.07]" />
              </div>
              <div className="mt-3.5 flex flex-col gap-3">
                {closingQuestions.map(qq => (
                  <blockquote key={qq.id} className="pl-3.5 border-l-2 border-indigo-400/60">
                    <p className="flex items-center gap-1.5 text-[9px] uppercase tracking-[0.16em] font-semibold text-indigo-300/80">
                      <SparkGlyph /> Sophia fragt im Screening
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
//   · Job Description  →  Must-haves (K.o.-Kriterien), Budget, Einsatzgebiet
//   · Sophia-Screening →  Erfahrung, Kommunikation, Gehaltswunsch, Startdatum
// The page answers the HR team's three questions in one view:
// Wer erfüllt die K.o.-Kriterien? · Wer passt zu den Konditionen? · Wen laden wir ein?

type Tri = boolean | 'partial';
type GermanLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2' | 'Muttersprache';
type CompRow = {
  id: string; name: string; current: string;
  match: number;                                   // overall fit, 0–100
  must: { ausbildung: Tri; dguv: Tri; deutsch: Tri };
  erfahrung: number;                               // 0–10, from CV + call
  deutsch: GermanLevel;                            // CEFR level, assessed in the call
  gehalt: number;                                  // expectation €/month
  start: string; startDays: number;
  mobil: string;                                   // residence + distance
};

const COMP_BUDGET = 3500; // target salary after probation (from the JD)

const COMP_ROWS: CompRow[] = [
  {
    id: '2', name: 'Andi Kufner', current: 'Servicetechniker, Vending-Automaten', match: 92,
    must: { ausbildung: true, dguv: true, deutsch: true },
    erfahrung: 9, deutsch: 'Muttersprache', gehalt: 3400, start: '01.07.2026', startDays: 21,
    mobil: 'München · 12 km',
  },
  {
    id: '7', name: 'Klaus Müller', current: 'Elektriker, Gebäudetechnik', match: 87,
    must: { ausbildung: true, dguv: 'partial', deutsch: true },
    erfahrung: 8, deutsch: 'Muttersprache', gehalt: 3300, start: '15.07.2026', startDays: 35,
    mobil: 'Dachau · 18 km',
  },
  {
    id: '1', name: 'Marcel Weber', current: 'Servicetechniker, Kältetechnik', match: 84,
    must: { ausbildung: true, dguv: true, deutsch: true },
    erfahrung: 7, deutsch: 'Muttersprache', gehalt: 3650, start: '01.08.2026', startDays: 52,
    mobil: 'München · 8 km',
  },
  {
    id: '8', name: 'Sophie Bauer', current: 'Mechatronikerin, Produktionsanlagen', match: 76,
    must: { ausbildung: true, dguv: 'partial', deutsch: true },
    erfahrung: 6, deutsch: 'Muttersprache', gehalt: 3200, start: 'Sofort', startDays: 0,
    mobil: 'Freising · 32 km',
  },
  {
    id: '5', name: 'Giovanni Rossi', current: 'KFZ-Mechatroniker', match: 67,
    must: { ausbildung: true, dguv: false, deutsch: 'partial' },
    erfahrung: 7, deutsch: 'B1', gehalt: 3100, start: 'Sofort', startDays: 0,
    mobil: 'München · 10 km',
  },
  {
    id: '4', name: 'Andreas Gottschalk', current: 'Industriemechaniker', match: 59,
    must: { ausbildung: true, dguv: false, deutsch: true },
    erfahrung: 4, deutsch: 'Muttersprache', gehalt: 3800, start: '01.09.2026', startDays: 83,
    mobil: 'Augsburg · 55 km',
  },
  {
    id: '6', name: 'Niclas Gallas', current: 'Quereinsteiger, Einzelhandel', match: 48,
    must: { ausbildung: false, dguv: false, deutsch: true },
    erfahrung: 3, deutsch: 'C1', gehalt: 3000, start: 'Sofort', startDays: 0,
    mobil: 'München · 15 km',
  },
  {
    id: '3', name: 'Udo Alexander Brandt', current: 'Zerspanungsmechaniker', match: 38,
    must: { ausbildung: true, dguv: false, deutsch: true },
    erfahrung: 2, deutsch: 'Muttersprache', gehalt: 4200, start: '01.10.2026', startDays: 113,
    mobil: 'Rosenheim · 62 km',
  },
];

/* CEFR levels at/above the JD requirement (B2) render green, B1 amber, below red. */
function germanMeta(level: GermanLevel): { cls: string; dot: string } {
  if (level === 'B1') return { cls: 'text-amber-300 bg-amber-500/15 border-amber-500/30', dot: '#fbbf24' };
  if (level === 'A1' || level === 'A2') return { cls: 'text-rose-300 bg-rose-500/15 border-rose-500/30', dot: '#fb7185' };
  return { cls: 'text-emerald-300 bg-emerald-500/15 border-emerald-500/30', dot: '#34d399' };
}

const MUST_DEFS: { key: keyof CompRow['must']; label: string; full: string }[] = [
  { key: 'ausbildung', label: 'Ausbildung', full: 'Anerkannte technische Ausbildung' },
  { key: 'dguv',       label: 'DGUV V3',    full: 'DGUV-V3-Befähigung' },
  { key: 'deutsch',    label: 'Deutsch B2', full: 'Deutsch mind. B2' },
];

/* Mini checklist row: explicit label + check / tilde / cross — unambiguous at a glance. */
function MustCheck({ state, label, full }: { state: Tri; label: string; full: string }) {
  const color = state === true ? '#34d399' : state === 'partial' ? '#fbbf24' : '#fb7185';
  const suffix = state === true ? 'erfüllt' : state === 'partial' ? 'teilweise erfüllt' : 'nicht erfüllt';
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

function salaryFit(gehalt: number): { label: string; color: string } {
  if (gehalt <= COMP_BUDGET) return { label: 'im Budget', color: '#34d399' };
  if (gehalt <= COMP_BUDGET + 500) return { label: 'verhandelbar', color: '#fbbf24' };
  return { label: 'über Budget', color: '#fb7185' };
}

type CompSortKey = 'name' | 'must' | 'erfahrung' | 'deutsch' | 'gehalt' | 'startDays' | 'mobil' | 'match';

const GERMAN_RANK: Record<GermanLevel, number> = { A1: 1, A2: 2, B1: 3, B2: 4, C1: 5, C2: 6, Muttersprache: 7 };

/* Numeric sort value per column: must-haves count fulfilled (partial = 0.5), mobility uses the km distance. */
function compSortValue(r: CompRow, key: CompSortKey): number | string {
  switch (key) {
    case 'name': return r.name;
    case 'must': return MUST_DEFS.reduce((s, d) => s + (r.must[d.key] === true ? 1 : r.must[d.key] === 'partial' ? 0.5 : 0), 0);
    case 'deutsch': return GERMAN_RANK[r.deutsch];
    case 'mobil': return parseInt(r.mobil.match(/(\d+)\s*km/)?.[1] ?? '999', 10);
    default: return r[key];
  }
}

const COMP_COLS = 'grid-cols-[1.8fr_1fr_1.15fr_0.95fr_1fr_0.85fr_1.05fr_0.55fr_0.6fr]';

function ComparisonView({ position }: { position: Position }) {
  const navigate = useNavigate();
  const [sortKey, setSortKey] = useState<CompSortKey>('match');
  const [sortAsc, setSortAsc] = useState(false);

  const rows = useMemo(() => {
    return [...COMP_ROWS].sort((a, b) => {
      const va = compSortValue(a, sortKey);
      const vb = compSortValue(b, sortKey);
      const cmp = typeof va === 'string' ? va.localeCompare(vb as string, 'de') : va - (vb as number);
      return cmp * (sortAsc ? 1 : -1);
    });
  }, [sortKey, sortAsc]);

  // Default direction: "best first" — ascending where lower is better (salary, start, distance, name).
  const toggleSort = (key: CompSortKey) => {
    if (key === sortKey) setSortAsc(a => !a);
    else { setSortKey(key); setSortAsc(key === 'gehalt' || key === 'startDays' || key === 'mobil' || key === 'name'); }
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
            <h2 className="text-sm font-semibold text-white tracking-wide uppercase">Kandidatenvergleich</h2>
            <p className="text-[11.5px] text-slate-500 mt-0.5">{position.title}</p>
          </div>
          <p className="text-[10.5px] text-slate-500">
            Must-haves &amp; Budget aus der Job Description · Scores aus dem Sophia-Screening
          </p>
        </div>

        <div className="overflow-x-auto">
          <div className="min-w-[1080px]">
            {/* Header */}
            <div className={`grid ${COMP_COLS} gap-3 items-center px-5 py-2.5 text-[9.5px] font-semibold text-slate-500 border-b border-white/[0.06]`}>
              <SortHeader label="Kandidat" k="name" title="Alphabetisch sortieren" />
              <SortHeader label="Must-haves" k="must" title="K.o.-Kriterien aus der Job Description — sortiert nach Anzahl erfüllter Kriterien" />
              <SortHeader label="Erfahrung" k="erfahrung" title="Relevante Außendienst-/Serviceerfahrung — bewertet aus CV und Sophia-Call" />
              <SortHeader label="Deutsch" k="deutsch" title="Deutsch-Niveau (GER A1–C2 / Muttersprache) — sortiert nach Sprachlevel" />
              <SortHeader label="Gehalt" k="gehalt" title={`Gehaltswunsch vs. Budget (${COMP_BUDGET.toLocaleString('de-DE')} € nach Probezeit)`} />
              <SortHeader label="Start" k="startDays" title="Frühestmögliches Eintrittsdatum" />
              <SortHeader label="Mobilität" k="mobil" title="Entfernung zum Einsatzgebiet — sortiert nach Nähe" />
              <SortHeader label="Match" k="match" title="Gesamtpassung aus allen erhobenen Daten" />
              <span />
            </div>

            {/* Rows */}
            {rows.map(r => {
              const fit = salaryFit(r.gehalt);
              const de = germanMeta(r.deutsch);
              return (
                <div key={r.id} className="border-b border-white/[0.05] last:border-b-0">
                  <div className="hover:bg-white/[0.035] transition-colors">
                    <div className={`grid ${COMP_COLS} gap-3 items-center px-5 py-3`}>
                      {/* Candidate */}
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500/40 to-violet-500/40 border border-white/15 text-white text-[11px] font-bold flex items-center justify-center shrink-0">
                          {r.name.split(' ').map(p => p[0]).slice(0, 2).join('')}
                        </span>
                        <div className="min-w-0">
                          <p className="text-[13px] font-semibold text-white truncate">{r.name}</p>
                          <p className="text-[10.5px] text-slate-500 truncate">{r.current}</p>
                        </div>
                      </div>
                      {/* Must-haves */}
                      <div className="flex flex-col gap-[3px]">
                        {MUST_DEFS.map(m => <MustCheck key={m.key} state={r.must[m.key]} label={m.label} full={m.full} />)}
                      </div>
                      {/* Experience */}
                      <ScoreBar value={r.erfahrung} />
                      {/* German level (CEFR) */}
                      <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] font-semibold border w-fit ${de.cls}`}>
                        <span className="w-1.5 h-1.5 rounded-full" style={{ background: de.dot }} />{r.deutsch}
                      </span>
                      {/* Salary */}
                      <div>
                        <p className="text-[12.5px] font-semibold text-white tabular-nums">{r.gehalt.toLocaleString('de-DE')} €</p>
                        <p className="flex items-center gap-1 text-[10px]" style={{ color: fit.color }}>
                          <span className="w-1.5 h-1.5 rounded-full" style={{ background: fit.color }} />{fit.label}
                        </p>
                      </div>
                      {/* Start */}
                      <p className={`text-[12px] ${r.startDays === 0 ? 'text-emerald-300 font-semibold' : 'text-[#cbd5e1]'}`}>{r.start}</p>
                      {/* Mobility */}
                      <p className="text-[11.5px] text-[#aeb8cc] leading-snug">{r.mobil}</p>
                      {/* Match */}
                      <p className="text-[19px] font-bold tabular-nums" style={{ color: matchColor(r.match) }}>{r.match}</p>
                      {/* Profile — always visible */}
                      <button
                        onClick={() => navigate(`/clients/positions/candidate/${r.id}`)}
                        title="Vollständiges Profil ansehen"
                        className="inline-flex items-center gap-1 text-[11.5px] font-semibold text-indigo-300 border border-indigo-400/30 bg-indigo-500/10 hover:bg-indigo-500/25 rounded-lg px-2.5 py-1.5 transition-colors w-fit"
                      >
                        Profil
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

      {/* Legend */}
      <p className="text-[10.5px] text-slate-500 px-1">
        Must-haves aus der Job Description (✓ erfüllt · – teilweise · ✕ nicht erfüllt).
        Erfahrung aus CV &amp; Sophia-Call (0–10) · Deutsch nach GER (A1–C2 / Muttersprache), eingeschätzt im Call. Budget: {COMP_BUDGET.toLocaleString('de-DE')} € nach Probezeit.
      </p>
    </div>
  );
}

