import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { mockPositions, mockCandidates } from '../mockData';
import StatusBadge from '../components/StatusBadge';
import { AnalysisView, seedInitialEvaluations, emptyEval } from './PositionDetail';
import type { AnalysisOutcome, CriteriaBlock, Position, PositionStatus } from '../types';

type Tab = 'candidate' | 'comparison' | 'analysis' | 'job-description';

const TABS: [Tab, string][] = [
  ['candidate', 'Candidate'],
  ['comparison', 'Comparison'],
  ['analysis', 'Analysis'],
  ['job-description', 'Job Description'],
];

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

export default function PositionWorkspace() {
  const position = mockPositions[0];
  const [tab, setTab] = useState<Tab>('candidate');

  if (!position) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#0b1437]">
        <p className="text-gray-400 text-sm">No position available.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-[#0b1437] overflow-hidden min-h-0">
      {/* Header */}
      <div className="shrink-0 px-5 pt-4 flex flex-col gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-3 min-w-0">
            <h1 className="text-xl font-semibold text-gray-900 truncate">{position.title}</h1>
            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium whitespace-nowrap ${statusStyles[position.status]}`}>
              {statusLabels[position.status]}
            </span>
          </div>
          <p className="mt-1 text-sm text-gray-500 line-clamp-1">{position.description}</p>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 flex gap-1">
          {TABS.map(([key, label]) => {
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

      {/* Tab content */}
      <div className="flex-1 min-h-0 overflow-auto">
        {tab === 'candidate' && <CandidateTable candidateCount={position.candidateCount} />}
        {tab === 'comparison' && <ComparisonView position={position} />}
        {tab === 'analysis' && <ComingSoon label="Analysis" />}
        {tab === 'job-description' && <JobDescriptionView description={position.description} criteria={position.criteria} />}
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
  interview_completed_full: 'text-emerald-700 bg-emerald-50 border-emerald-200',
  interview_completed_partial: 'text-sky-700 bg-sky-50 border-sky-200',
  reschedule_requested: 'text-amber-700 bg-amber-50 border-amber-200',
  voicemail_detected: 'text-amber-700 bg-amber-50 border-amber-200',
  no_meaningful_interaction: 'text-gray-500 bg-gray-50 border-gray-200',
  wrong_person: 'text-gray-500 bg-gray-50 border-gray-200',
  consent_declined: 'text-red-600 bg-red-50 border-red-200',
  technical_failure: 'text-red-600 bg-red-50 border-red-200',
  other: 'text-gray-500 bg-gray-50 border-gray-200',
};

function OutcomeBadge({ value }: { value: AnalysisOutcome | null }) {
  if (!value) return <span className="text-xs text-gray-300">—</span>;
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
      <div className="border border-gray-200 rounded-xl bg-white overflow-hidden">
        {/* Header row */}
        <div className={`grid ${COLS} px-5 bg-gray-50 border-b border-gray-200`}>
          {HEADERS.map(h => (
            <div key={h} className="py-2 text-[10px] font-semibold text-gray-400 uppercase tracking-wide">{h}</div>
          ))}
        </div>

        {/* Body */}
        {candidates.length === 0 ? (
          <div className="py-20 text-center text-sm text-gray-400">No candidates yet</div>
        ) : (
          candidates.map((c, i) => {
            const isLast = i === candidates.length - 1;
            return (
              <div
                key={c.id}
                onClick={() => navigate(`/clients/positions/candidate/${c.id}`)}
                className={`grid ${COLS} hover:bg-gray-50 cursor-pointer px-5 ${isLast ? '' : 'border-b border-gray-100'}`}
              >
                {/* Candidate */}
                <div className="py-3 flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-semibold text-xs shrink-0">
                    {c.firstName.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{c.firstName} {c.lastName}</p>
                    <p className="text-xs text-gray-400 truncate">{c.phoneNumber}</p>
                  </div>
                </div>
                {/* Job Title */}
                <div className="py-3 flex items-center min-w-0">
                  <span className="text-sm text-gray-700 truncate">{c.jobTitle}</span>
                </div>
                {/* Status */}
                <div className="py-3 flex items-center">
                  <StatusBadge status={c.employmentStatus} />
                </div>
                {/* Analysis Outcome */}
                <div className="py-3 flex items-center">
                  <OutcomeBadge value={c.analysisOutcome} />
                </div>
                {/* German */}
                <div className="py-3 flex items-center">
                  <span className="text-sm text-gray-700">{c.germanLevel ?? <span className="text-gray-300">—</span>}</span>
                </div>
                {/* Earliest Start */}
                <div className="py-3 flex items-center">
                  <span className="text-xs text-gray-500">{c.earliestStart ?? <span className="text-gray-300">—</span>}</span>
                </div>
                {/* Call Flags */}
                <div className="py-3 flex items-center gap-1 flex-wrap">
                  {c.flags.length === 0
                    ? <span className="text-xs text-gray-300">—</span>
                    : c.flags.map(flag => (
                      <span key={flag} className="text-[11px] text-gray-500 border border-gray-200 bg-gray-50 px-1.5 py-0.5 rounded whitespace-nowrap">
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

// ── Job description (read-only) ──────────────────────────────────────────────

function JobDescriptionView({ description, criteria }: { description: string; criteria: CriteriaBlock[] }) {
  return (
    <div className="px-5 pt-5 pb-8 grid grid-cols-2 gap-5">
      {/* Description */}
      <div className="flex flex-col">
        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Job Description</p>
        <div className="border border-gray-200 rounded-xl bg-white p-5">
          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{description}</p>
        </div>
      </div>

      {/* Selection criteria (read-only) */}
      <div className="flex flex-col">
        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Selection Criteria</p>
        <div className="flex flex-col gap-3">
          {criteria.map(block => (
            <div key={block.id} className="border border-gray-200 rounded-xl bg-white p-4">
              <div className="flex items-center justify-between gap-2 mb-2">
                <p className="text-sm font-semibold text-gray-800">{block.title}</p>
                <span className="shrink-0 text-[10px] font-medium text-gray-500 border border-gray-200 bg-gray-50 rounded px-1.5 py-0.5">
                  {block.scoring === 'binary' ? 'Yes/No' : '1–10'}
                </span>
              </div>
              <ul className="flex flex-col gap-1">
                {block.bullets.map((bullet, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                    <span className="text-gray-400 leading-6 select-none">•</span>
                    <span className="flex-1">{bullet}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
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
    />
  );
}

// ── Placeholder for not-yet-built tabs ───────────────────────────────────────

function ComingSoon({ label }: { label: string }) {
  return (
    <div className="h-full flex items-center justify-center">
      <p className="text-sm text-gray-400">{label} — coming soon</p>
    </div>
  );
}
