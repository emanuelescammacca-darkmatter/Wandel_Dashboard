import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { mockPositions, mockCandidates } from '../mockData';
import StatusBadge from '../components/StatusBadge';
import { AnalysisView, seedInitialEvaluations, emptyEval } from './PositionDetail';
import type { AnalysisOutcome, Position, PositionStatus } from '../types';

type Tab = 'candidate' | 'comparison' | 'analysis' | 'job-description';

const TABS: [Tab, string][] = [
  ['candidate', 'Candidate'],
  ['comparison', 'Comparison'],
  ['analysis', 'Analysis'],
  ['job-description', 'Job Description'],
];

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
    <div className="flex-1 flex flex-col bg-[#0b1437] overflow-hidden min-h-0">
      {/* Header */}
      <div className="shrink-0 px-5 pt-4 flex flex-col gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-3 min-w-0">
            <h1 className="text-xl font-semibold text-white truncate">{position.title}</h1>
            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium whitespace-nowrap ${statusStyles[position.status]}`}>
              {statusLabels[position.status]}
            </span>
          </div>
          <p className="mt-1 text-sm text-[#94a3b8] line-clamp-1">{position.description}</p>
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
        {tab === 'candidate' && <CandidateTable candidateCount={position.candidateCount} />}
        {tab === 'comparison' && <ComparisonView position={position} />}
        {tab === 'analysis' && <ComingSoon label="Analysis" />}
        {tab === 'job-description' && <JobDescriptionView />}
      </div>
    </div>
  );
}

// ── Candidate table ──────────────────────────────────────────────────────────

// Candidate | Job Title | Status | Analysis Outcome | German | Earliest Start | Call Flags
const COLS = 'grid-cols-[2fr_1.3fr_1.4fr_1.2fr_0.8fr_1fr_1.4fr]';
const HEADERS = ['Candidate', 'Job Title', 'Status', 'Analysis Outcome', 'German', 'Earliest Start', 'Call Flags'];

const OUTCOME_LABELS: Record<AnalysisOutcome, string> = {
  interview_completed_full: 'Interview Complete',
  interview_completed_partial: 'Interview (Partial)',
  reschedule_requested: 'Reschedule',
  voicemail_detected: 'Voicemail',
  no_meaningful_interaction: 'No Interaction',
  wrong_person: 'Wrong Person',
  consent_declined: 'Consent Declined',
  technical_failure: 'Technical Failure',
  other: 'Other',
};
const OUTCOME_STYLES: Record<AnalysisOutcome, string> = {
  interview_completed_full: 'text-emerald-300 bg-emerald-500/15 border-emerald-500/30',
  interview_completed_partial: 'text-sky-300 bg-sky-500/15 border-sky-500/30',
  reschedule_requested: 'text-amber-300 bg-amber-500/15 border-amber-500/30',
  voicemail_detected: 'text-amber-300 bg-amber-500/15 border-amber-500/30',
  no_meaningful_interaction: 'text-slate-300 bg-white/10 border-white/15',
  wrong_person: 'text-slate-300 bg-white/10 border-white/15',
  consent_declined: 'text-rose-300 bg-rose-500/15 border-rose-500/30',
  technical_failure: 'text-rose-300 bg-rose-500/15 border-rose-500/30',
  other: 'text-slate-300 bg-white/10 border-white/15',
};

function OutcomeBadge({ value }: { value: AnalysisOutcome | null }) {
  if (!value) return <span className="text-xs text-[#475569]">—</span>;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${OUTCOME_STYLES[value]}`}>
      {OUTCOME_LABELS[value]}
    </span>
  );
}

function CandidateTable({ candidateCount }: { candidateCount: number }) {
  const navigate = useNavigate();
  const candidates = mockCandidates.slice(0, Math.max(candidateCount, 1));

  return (
    <div className="px-5 pt-5 pb-8">
      <div className="border border-white/10 rounded-xl overflow-hidden bg-[#111a3c]">
        {/* Header row */}
        <div className={`grid ${COLS} px-5 bg-white/[0.03] border-b border-white/10`}>
          {HEADERS.map(h => (
            <div key={h} className="py-2 text-[10px] font-semibold text-[#94a3b8] uppercase tracking-wide">{h}</div>
          ))}
        </div>

        {/* Body */}
        {candidates.length === 0 ? (
          <div className="py-20 text-center text-sm text-[#94a3b8]">No candidates yet</div>
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
                <div className="py-3 flex items-center gap-2.5 min-w-0">
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
                  <StatusBadge status={c.employmentStatus} dark />
                </div>
                {/* Analysis Outcome */}
                <div className="py-3 flex items-center">
                  <OutcomeBadge value={c.analysisOutcome} />
                </div>
                {/* German */}
                <div className="py-3 flex items-center">
                  <span className="text-sm text-[#cbd5e1]">{c.germanLevel ?? <span className="text-[#475569]">—</span>}</span>
                </div>
                {/* Earliest Start */}
                <div className="py-3 flex items-center">
                  <span className="text-xs text-[#94a3b8]">{c.earliestStart ?? <span className="text-[#475569]">—</span>}</span>
                </div>
                {/* Call Flags */}
                <div className="py-3 flex items-center gap-1 flex-wrap">
                  {c.flags.length === 0
                    ? <span className="text-xs text-[#475569]">—</span>
                    : c.flags.map(flag => (
                      <span key={flag} className="text-[11px] text-[#cbd5e1] border border-white/10 bg-white/[0.05] px-1.5 py-0.5 rounded whitespace-nowrap">
                        {flag}
                      </span>
                    ))}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

// ── Job description (read-only) — single-column "preview" layout ─────────────

// Down-then-right elbow connector used as the marker for follow-up questions, so
// each question reads as branching off the bullet above it (mirrors the chatbot preview).
function BulletConnector() {
  return (
    <svg
      aria-hidden="true"
      className="shrink-0 text-indigo-400 mt-[-3px]"
      width="16" height="22" viewBox="0 0 16 22"
      fill="none" stroke="currentColor" strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round"
    >
      {/* drop down from the section, round the corner, run right */}
      <path d="M3 0 V10 a3 3 0 0 0 3 3 H13" />
      {/* arrowhead pointing right */}
      <path d="M10.5 10.5 L13.5 13 L10.5 15.5" />
    </svg>
  );
}

// Structured job-description content: top-level sections (plain header), each with
// several quote-style blocks. A block holds an ordered list of items — bullet points
// and follow-up questions interleaved — so questions can sit after a mid bullet and
// at the very end. The whole block (questions included) renders inside the quote style.
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

function JobDescriptionView() {
  return (
    <div className="px-5 pt-5 pb-8">
      <div className="max-w-3xl mx-auto flex flex-col gap-8">
        {JOB_DOC.map(section => (
          <section key={section.header}>
            {/* Section header — no quote styling */}
            <h2 className="text-base font-bold text-white mb-4">{section.header}</h2>
            <div className="flex flex-col gap-5">
              {section.blocks.map((block, bi) => (
                // The entire block — heading, body, bullets AND follow-up questions
                // (interleaved + at the end) — lives inside the quote style.
                <div key={bi} className="border-l-2 border-indigo-400/60 pl-4">
                  <h3 className="text-sm font-bold text-white">{block.heading}</h3>
                  {block.body && (
                    <p className="mt-1.5 text-sm leading-relaxed text-[#cbd5e1]">{block.body}</p>
                  )}
                  <ul className="mt-2 flex flex-col gap-1.5">
                    {block.items.map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm leading-relaxed text-[#cbd5e1]">
                        {item.kind === 'question' ? (
                          <BulletConnector />
                        ) : (
                          <span className="mt-[7px] w-1 h-1 rounded-full bg-[#64748b] shrink-0" />
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

// ── Comparison (reuses the Analysis view from the recruitment position detail) ─

function ComparisonView({ position }: { position: Position }) {
  const evaluations = useMemo(
    () => seedInitialEvaluations(mockCandidates.slice(0, position.candidateCount), position.criteria),
    [position],
  );
  const getEval = (cid: string, bid: string) => evaluations[`${cid}::${bid}`] ?? emptyEval;

  return (
    <AnalysisView
      criteria={position.criteria}
      candidateCount={position.candidateCount}
      getEval={getEval}
      fullWidth
      dark
    />
  );
}

// ── Placeholder for not-yet-built tabs ───────────────────────────────────────

function ComingSoon({ label }: { label: string }) {
  return (
    <div className="h-full flex items-center justify-center">
      <p className="text-sm text-[#94a3b8]">{label} — coming soon</p>
    </div>
  );
}
