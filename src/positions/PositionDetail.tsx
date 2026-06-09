import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { mockCandidates, mockPositions } from '../data/mockData';
import type { Candidate, CriteriaBlock, PositionStatus } from '../types';

type Tab = 'evaluation' | 'criteria';

const statusStyles: Record<PositionStatus, string> = {
  'open':        'border border-emerald-200 text-emerald-700 bg-emerald-50',
  'in-progress': 'border border-amber-200 text-amber-700 bg-amber-50',
  'complete':    'border border-gray-200 text-gray-500 bg-gray-50',
};
const statusLabels: Record<PositionStatus, string> = {
  'open':        'Open',
  'in-progress': 'In Progress',
  'complete':    'Complete',
};

export default function PositionDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const position = mockPositions.find(p => p.id === id);

  const [tab, setTab] = useState<Tab>('evaluation');

  if (!position) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#f5f5f5]">
        <p className="text-gray-400 text-sm">
          Position not found.{' '}
          <button onClick={() => navigate('/positions')} className="underline">Go back</button>
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-[#f5f5f5] overflow-hidden min-h-0">
      <div className="shrink-0 px-5 pt-4 flex flex-col gap-4">
        {/* Back link */}
        <button
          onClick={() => navigate('/positions')}
          className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-800 w-fit"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Positions
        </button>

        {/* Compact header: title + status + employer */}
        <div className="min-w-0">
          <div className="flex items-center gap-3 min-w-0">
            <h1 className="text-xl font-semibold text-gray-900 truncate">{position.title}</h1>
            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium whitespace-nowrap ${statusStyles[position.status]}`}>
              {statusLabels[position.status]}
            </span>
          </div>
          <button
            onClick={() => navigate('/employers')}
            className="group/emp mt-1 inline-flex items-center gap-1.5 px-2 py-1 -mx-2 rounded-md hover:bg-gray-200 transition-colors"
          >
            <span className="text-sm text-gray-600">{position.employer}</span>
            <svg
              className="w-3 h-3 text-gray-400 opacity-0 group-hover/emp:opacity-100 transition-opacity"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </button>
        </div>

        {/* Tab bar */}
        <div className="border-b border-gray-200 flex gap-1">
          {([
            ['evaluation', 'Matched Candidates'],
            ['criteria', 'Job Description'],
          ] as [Tab, string][]).map(([key, label]) => {
            const active = tab === key;
            return (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={`px-4 py-2 -mb-px text-sm font-medium border-b-2 transition-colors ${
                  active
                    ? 'text-indigo-600 border-indigo-600'
                    : 'text-gray-500 border-transparent hover:text-gray-800'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab content (scrollable area) */}
      <div className="flex-1 min-h-0 overflow-auto">
        {tab === 'evaluation' && <MatchedCandidatesTable />}
        {tab === 'criteria' && <JobDescriptionView theme="light" />}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Evaluation table

export type CellEval = {
  score: number | null;
  complete: boolean;
  selectedBlocks: string[];
};

export const emptyEval: CellEval = { score: null, complete: false, selectedBlocks: [] };

export function seedInitialEvaluations(
  candidates: Candidate[],
  criteria: CriteriaBlock[],
): Record<string, CellEval> {
  const result: Record<string, CellEval> = {};
  candidates.forEach((c, ci) => {
    const base =
      c.analysisOutcome === 'interview_completed_full'    ? 8 :
      c.analysisOutcome === 'interview_completed_partial' ? 5 :
      c.analysisOutcome === 'reschedule_requested'        ? 4 :
      null;
    if (base === null) return;
    criteria.forEach((block, bi) => {
      const variation = ((ci * 3 + bi * 7) % 5) - 2;
      const scaleScore = Math.max(1, Math.min(10, base + variation));
      const score = block.scoring === 'binary'
        ? (scaleScore >= 6 ? 10 : 0)
        : scaleScore;
      result[`${c.id}::${block.id}`] = {
        score,
        complete: (ci + bi) % 3 !== 2,
        selectedBlocks: [],
      };
    });
  });
  return result;
}

// ─────────────────────────────────────────────────────────────────────────────
// Job description (read-only) — sectioned quote blocks with elbow-arrow question markers

// Down-then-right elbow connector used as the marker for follow-up questions, so each
// question reads as branching off the bullet above it (mirrors the chatbot preview).
function BulletConnector() {
  return (
    <svg
      aria-hidden="true"
      className="shrink-0 text-indigo-400 mt-[-3px]"
      width="16" height="22" viewBox="0 0 16 22"
      fill="none" stroke="currentColor" strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round"
    >
      <path d="M3 0 V10 a3 3 0 0 0 3 3 H13" />
      <path d="M10.5 10.5 L13.5 13 L10.5 15.5" />
    </svg>
  );
}

type DocItem = { kind: 'bullet' | 'question'; text: string };
type JobBlock = { heading: string; body?: string; items: DocItem[] };
type JobDocSection = { header: string; blocks: JobBlock[] };

const b = (text: string): DocItem => ({ kind: 'bullet', text });
const q = (text: string): DocItem => ({ kind: 'question', text });

const JOB_DOC: JobDocSection[] = [
  {
    header: 'Aufgaben & Verantwortung',
    blocks: [
      {
        heading: 'Service & Wartung vor Ort',
        body: 'Als Servicetechniker betreust du eigenverantwortlich deine Kunden im Großraum München und sorgst dafür, dass die Kaffeevollautomaten zuverlässig laufen.',
        items: [
          b('Wartung, Reparatur und Inbetriebnahme beim Kunden'),
          b('Eigenständige Tourenplanung mit dem Service-Tool'),
          q('Mit welchen Diagnose-Tools hast du bereits gearbeitet?'),
          b('Enger Austausch mit dem Innendienst in Osnabrück'),
          q('Wie viele Serviceeinsätze betreust du aktuell pro Tag?'),
        ],
      },
      {
        heading: 'Kundenberatung',
        body: 'Du bist das Gesicht von Kaffee Partner vor Ort und berätst Kunden rund um Bedienung und Produktauswahl.',
        items: [
          b('Beratung zu Bedienung und Produktauswahl'),
          q('Kannst du ein Beispiel für eine schwierige Kundensituation nennen?'),
          b('Freundliche, lösungsorientierte Kommunikation'),
          q('Wie gehst du mit Reklamationen um?'),
        ],
      },
    ],
  },
  {
    header: 'Anforderungen',
    blocks: [
      {
        heading: 'Ausbildung & Qualifikation',
        items: [
          b('Abgeschlossene Ausbildung in Elektrotechnik, Mechatronik oder Kfz-Technik'),
          q('Welche Ausbildung hast du abgeschlossen?'),
          b('Führerschein Klasse B'),
          b('Deutsch mindestens B2 (Kundenkontakt)'),
          q('Besitzt du einen gültigen Führerschein der Klasse B?'),
        ],
      },
      {
        heading: 'Berufserfahrung',
        body: 'Idealerweise bringst du erste Erfahrung im technischen Außendienst mit.',
        items: [
          b('Mindestens 2 Jahre in einem technischen Beruf'),
          q('Wie viele Jahre Berufserfahrung hast du im technischen Bereich?'),
          b('Erfahrung mit Wartung und Reparatur elektronischer Geräte'),
          q('Warst du bereits im Außendienst tätig?'),
        ],
      },
      {
        heading: 'Mobilität & Standort',
        items: [
          b('Wohnsitz im Großraum München (max. 50 km)'),
          q('Wo ist dein aktueller Wohnort?'),
          b('Reisebereitschaft innerhalb der Region'),
          q('Bist du bereit, regional zu reisen?'),
        ],
      },
    ],
  },
  {
    header: 'Was wir bieten',
    blocks: [
      {
        heading: 'Konditionen & Benefits',
        items: [
          b('Unbefristete Festanstellung in einem zukunftssicheren Unternehmen'),
          b('Firmenwagen, auch zur privaten Nutzung'),
          q('Welche Gehaltsvorstellung hast du (brutto/Monat)?'),
          b('30 Tage Urlaub und Weihnachtsgeld'),
          b('Strukturierte Einarbeitung und Weiterbildung'),
          q('Ab wann könntest du frühestens starten?'),
        ],
      },
    ],
  },
];

export function JobDescriptionView({ theme = 'dark' }: { theme?: 'dark' | 'light' }) {
  const dark = theme === 'dark';
  return (
    <div className="px-5 pt-5 pb-8">
      <div className="max-w-3xl mx-auto flex flex-col gap-8">
        {JOB_DOC.map(section => (
          <section key={section.header}>
            {/* Section header — no quote styling */}
            <h2 className={`text-base font-bold mb-4 ${dark ? 'text-white' : 'text-gray-900'}`}>{section.header}</h2>
            <div className="flex flex-col gap-5">
              {section.blocks.map((block, bi) => (
                // The entire block — heading, body, bullets AND follow-up questions — lives inside the quote style.
                <div key={bi} className={`border-l-2 pl-4 ${dark ? 'border-indigo-400/60' : 'border-indigo-300'}`}>
                  <h3 className={`text-sm font-bold ${dark ? 'text-white' : 'text-gray-800'}`}>{block.heading}</h3>
                  {block.body && (
                    <p className={`mt-1.5 text-sm leading-relaxed ${dark ? 'text-[#cbd5e1]' : 'text-gray-600'}`}>{block.body}</p>
                  )}
                  <ul className="mt-2 flex flex-col gap-1.5">
                    {block.items.map((item, i) => (
                      <li key={i} className={`flex items-start gap-2 text-sm leading-relaxed ${dark ? 'text-[#cbd5e1]' : 'text-gray-600'}`}>
                        {item.kind === 'question' ? (
                          <BulletConnector />
                        ) : (
                          <span className={`mt-[7px] w-1 h-1 rounded-full shrink-0 ${dark ? 'bg-[#64748b]' : 'bg-gray-400'}`} />
                        )}
                        <span>{item.text}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Matched candidates (evaluation tab) — same look as the Positions page table

// Candidate | Location | Matched | Phone | Status | open
const MATCHED_COLS = 'grid-cols-[2.6fr_1.3fr_1fr_1fr_1fr_auto]';
const fmtMatchedDate = (d: string) =>
  new Date(d).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });

function MatchedCandidatesTable() {
  const navigate = useNavigate();
  const matched = mockCandidates.filter(c => c.pipelineStatus === 'matched');
  return (
    <div className="p-2.5">
      <div className="border border-gray-200 rounded-xl bg-white overflow-hidden">
        {/* Header row */}
        <div className={`grid ${MATCHED_COLS} px-5 bg-gray-50 border-b border-gray-200`}>
          <div className="py-2.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Candidate</div>
          <div className="py-2.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Location</div>
          <div className="py-2.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Matched</div>
          <div className="py-2.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Phone</div>
          <div className="py-2.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Status</div>
          <div className="py-2.5" />
        </div>

        {/* Body */}
        {matched.length === 0 ? (
          <div className="py-20 text-center text-sm text-gray-400">No matched candidates yet</div>
        ) : (
          matched.map((c, idx) => {
            const isLast = idx === matched.length - 1;
            return (
              <div
                key={c.id}
                onClick={() => navigate(`/candidates/${c.id}`)}
                className={`grid ${MATCHED_COLS} hover:bg-indigo-50/50 px-5 cursor-pointer ${isLast ? '' : 'border-b border-gray-100'}`}
              >
                {/* Candidate */}
                <div className="py-2.5 pr-6 min-w-0 flex flex-col justify-center gap-0.5">
                  <span className="text-sm font-medium text-gray-800 truncate">{c.firstName} {c.lastName}</span>
                  <span className="text-xs text-gray-500 truncate">{c.jobTitle}</span>
                </div>
                {/* Location */}
                <div className="py-2.5 pr-4 flex items-center min-w-0">
                  <span className="text-sm text-gray-700 truncate">{c.city ?? '—'}</span>
                </div>
                {/* Matched date */}
                <div className="py-2.5 flex items-center">
                  <span className="text-xs text-gray-400">{fmtMatchedDate(c.lastContactAt ?? c.createdAt)}</span>
                </div>
                {/* Phone */}
                <div className="py-2.5 flex items-center min-w-0">
                  <span className="text-sm text-gray-700 truncate">{c.phoneNumber}</span>
                </div>
                {/* Status */}
                <div className="py-2.5 flex items-center">
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium whitespace-nowrap border border-violet-200 text-violet-700 bg-violet-50">Matched</span>
                </div>
                {/* Open */}
                <div className="py-2.5 pl-2 flex items-center">
                  <span className="w-6 h-6 flex items-center justify-center rounded text-gray-400">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Analysis view

export function AnalysisView({
  criteria,
  candidateCount,
  getEval,
  fullWidth = false,
  dark = false,
}: {
  criteria: CriteriaBlock[];
  candidateCount: number;
  getEval: (cid: string, bid: string) => CellEval;
  fullWidth?: boolean;
  dark?: boolean;
}) {
  const candidates = mockCandidates.slice(0, candidateCount);

  const rows = candidates.map(c => {
    const cellEvals = criteria.map(b => getEval(c.id, b.id));
    const scores = cellEvals
      .map(e => e.score)
      .filter((s): s is number => s !== null);
    const avg = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : null;
    const completeCount = cellEvals.filter(e => e.complete).length;
    return { candidate: c, avg, completeCount, cellEvals };
  });

  const ranked = rows
    .filter(r => r.avg !== null)
    .sort((a, b) => (b.avg ?? 0) - (a.avg ?? 0));
  const unevaluated = rows.filter(r => r.avg === null);

  const overallAvg =
    ranked.length > 0
      ? ranked.reduce((sum, r) => sum + (r.avg ?? 0), 0) / ranked.length
      : 0;
  const totalComplete = rows.reduce((sum, r) => sum + r.completeCount, 0);
  const totalCells = rows.length * criteria.length;
  const completionPct = totalCells > 0 ? Math.round((totalComplete / totalCells) * 100) : 0;
  const top = ranked[0]?.candidate;

  const labelCls = dark ? 'text-[#94a3b8]' : 'text-gray-400';
  const emptyCard = dark ? 'border-white/10 bg-[#111a3c] text-[#94a3b8]' : 'border-gray-200 bg-white text-gray-400';
  const panel = dark ? 'border-white/10 bg-[#111a3c]' : 'border-gray-200 bg-white';
  const chip = dark ? 'bg-white/[0.05] border-white/10 text-[#cbd5e1]' : 'bg-gray-50 border-gray-200 text-gray-600';
  const chipDot = dark ? 'bg-[#475569]' : 'bg-gray-300';

  return (
    <div className={`px-5 pt-5 pb-8 flex flex-col gap-5 ${fullWidth ? '' : 'max-w-5xl mx-auto'}`}>
      {/* Summary */}
      <div className="grid grid-cols-4 gap-3">
        <StatCard label="Ranked" value={`${ranked.length} / ${candidates.length}`} dark={dark} />
        <StatCard label="Average Score" value={`${overallAvg.toFixed(1)}/10`} dark={dark} />
        <StatCard label="Completion" value={`${completionPct}%`} dark={dark} />
        <StatCard label="Top" value={top ? `${top.firstName} ${top.lastName.charAt(0)}.` : '—'} dark={dark} />
      </div>

      {/* Ranking list */}
      <div>
        <p className={`text-[10px] font-semibold uppercase tracking-wider mb-2 ${labelCls}`}>Ranked Candidates</p>
        {ranked.length === 0 ? (
          <div className={`border rounded-xl py-12 text-center text-sm ${emptyCard}`}>
            No evaluations yet
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {ranked.map((r, idx) => (
              <RankedCandidateCard
                key={r.candidate.id}
                rank={idx + 1}
                candidate={r.candidate}
                avg={r.avg!}
                completeCount={r.completeCount}
                cellEvals={r.cellEvals}
                criteria={criteria}
                dark={dark}
              />
            ))}
          </div>
        )}
      </div>

      {/* Unevaluated */}
      {unevaluated.length > 0 && (
        <div>
          <p className={`text-[10px] font-semibold uppercase tracking-wider mb-2 ${labelCls}`}>Not Evaluated</p>
          <div className={`border rounded-xl px-4 py-3 flex flex-wrap gap-2 ${panel}`}>
            {unevaluated.map(r => (
              <span
                key={r.candidate.id}
                className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md border text-xs ${chip}`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${chipDot}`} />
                {r.candidate.firstName} {r.candidate.lastName}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, dark = false }: { label: string; value: string; dark?: boolean }) {
  return (
    <div className={`border rounded-xl p-4 ${dark ? 'border-white/10 bg-[#111a3c]' : 'border-gray-200 bg-white'}`}>
      <p className={`text-[10px] font-semibold uppercase tracking-wider ${dark ? 'text-[#94a3b8]' : 'text-gray-400'}`}>{label}</p>
      <p className={`text-xl font-semibold mt-1 truncate ${dark ? 'text-white' : 'text-gray-900'}`}>{value}</p>
    </div>
  );
}

function RankedCandidateCard({
  rank,
  candidate,
  avg,
  completeCount,
  cellEvals,
  criteria,
  dark = false,
}: {
  rank: number;
  candidate: Candidate;
  avg: number;
  completeCount: number;
  cellEvals: CellEval[];
  criteria: CriteriaBlock[];
  dark?: boolean;
}) {
  const rankStyles = dark
    ? (rank === 1 ? 'bg-amber-500/15 text-amber-300 border-amber-500/30' :
       rank === 2 ? 'bg-white/10 text-slate-200 border-white/15' :
       rank === 3 ? 'bg-orange-500/15 text-orange-300 border-orange-500/30' :
                    'bg-white/[0.05] text-slate-400 border-white/10')
    : (rank === 1 ? 'bg-amber-100 text-amber-700 border-amber-200' :
       rank === 2 ? 'bg-slate-100 text-slate-700 border-slate-200' :
       rank === 3 ? 'bg-orange-50  text-orange-700 border-orange-200' :
                    'bg-gray-50  text-gray-500 border-gray-200');

  const card = dark ? 'border-white/10 bg-[#111a3c]' : 'border-gray-200 bg-white';
  const avatar = dark ? 'bg-indigo-500/20 text-indigo-300' : 'bg-indigo-100 text-indigo-600';
  const nameCls = dark ? 'text-white' : 'text-gray-900';
  const subCls = dark ? 'text-[#94a3b8]' : 'text-gray-500';
  const avgCls = dark ? 'text-white' : 'text-gray-900';
  const mutedLabel = dark ? 'text-[#94a3b8]' : 'text-gray-400';
  const doneCls = dark ? 'text-[#cbd5e1]' : 'text-gray-700';
  const critLabel = dark ? 'text-[#cbd5e1]' : 'text-gray-600';
  const track = dark ? 'bg-white/10' : 'bg-gray-100';

  return (
    <div className={`border rounded-xl p-4 ${card}`}>
      <div className="flex items-center gap-4">
        <div className={`shrink-0 w-10 h-10 rounded-full border flex items-center justify-center font-bold text-sm ${rankStyles}`}>
          #{rank}
        </div>
        <div className={`shrink-0 w-9 h-9 rounded-full flex items-center justify-center font-semibold text-xs ${avatar}`}>
          {candidate.firstName.charAt(0)}
        </div>
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-semibold truncate ${nameCls}`}>
            {candidate.firstName} {candidate.lastName}
          </p>
          <p className={`text-xs truncate ${subCls}`}>{candidate.jobTitle}</p>
        </div>
        <div className="shrink-0 text-right">
          <p className={`text-2xl font-bold leading-none ${avgCls}`}>{avg.toFixed(1)}</p>
          <p className={`text-[10px] uppercase tracking-wider mt-0.5 ${mutedLabel}`}>avg / 10</p>
        </div>
        <div className="shrink-0 text-right ml-3">
          <p className={`text-sm font-semibold leading-none ${doneCls}`}>
            {completeCount}<span className={`font-normal ${mutedLabel}`}>/{criteria.length}</span>
          </p>
          <p className={`text-[10px] uppercase tracking-wider mt-0.5 ${mutedLabel}`}>done</p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-x-5 gap-y-2.5">
        {criteria.map((b, i) => {
          const score = cellEvals[i]?.score ?? null;
          const pct = score !== null ? score * 10 : 0;
          const barColor =
            score === null ? (dark ? 'bg-white/15' : 'bg-gray-200') :
            b.scoring === 'binary'
              ? (score >= 5 ? 'bg-emerald-500' : 'bg-rose-400')
              : (score >= 7 ? 'bg-emerald-500' : score >= 5 ? 'bg-amber-400' : 'bg-rose-400');
          const valueText =
            score === null ? '—'
            : b.scoring === 'binary' ? (score >= 5 ? 'Yes' : 'No')
            : `${score}`;
          const valueColor =
            score === null ? mutedLabel
            : b.scoring === 'binary'
              ? (score >= 5 ? (dark ? 'text-emerald-300' : 'text-emerald-700') : (dark ? 'text-rose-300' : 'text-rose-700'))
              : (dark ? 'text-[#cbd5e1]' : 'text-gray-700');
          return (
            <div key={b.id}>
              <div className="flex items-center justify-between mb-1 gap-2">
                <p className={`text-[11px] truncate ${critLabel}`}>{b.title}</p>
                <p className={`text-[11px] font-semibold shrink-0 ${valueColor}`}>{valueText}</p>
              </div>
              <div className={`h-1.5 w-full rounded-full overflow-hidden ${track}`}>
                <div className={`h-full rounded-full ${barColor}`} style={{ width: `${pct}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

