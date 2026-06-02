import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { mockCandidates, mockPositions } from '../mockData';
import type { Candidate, CriteriaBlock, PositionStatus, ScoringSystem } from '../types';

type Tab = 'criteria' | 'strategy' | 'evaluation' | 'analysis';

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

const newId = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export default function PositionDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const position = mockPositions.find(p => p.id === id);

  const [tab, setTab] = useState<Tab>('criteria');
  const [criteria, setCriteria] = useState<CriteriaBlock[]>(position?.criteria ?? []);
  const [evaluations, setEvaluations] = useState<Record<string, CellEval>>(() =>
    position
      ? seedInitialEvaluations(mockCandidates.slice(0, position.candidateCount), position.criteria)
      : {},
  );

  const getEval = (cid: string, bid: string): CellEval => evaluations[`${cid}::${bid}`] ?? emptyEval;
  const patchEval = (cid: string, bid: string, patch: Partial<CellEval>) =>
    setEvaluations(prev => {
      const key = `${cid}::${bid}`;
      return { ...prev, [key]: { ...(prev[key] ?? emptyEval), ...patch } };
    });

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

  // ── Criteria edit handlers ──────────────────────────────────────────────
  const updateBlockTitle = (blockId: string, title: string) =>
    setCriteria(prev => prev.map(b => (b.id === blockId ? { ...b, title } : b)));

  const updateBlockScoring = (blockId: string, scoring: ScoringSystem) =>
    setCriteria(prev => prev.map(b => (b.id === blockId ? { ...b, scoring } : b)));

  const updateBullet = (blockId: string, idx: number, text: string) =>
    setCriteria(prev =>
      prev.map(b =>
        b.id === blockId ? { ...b, bullets: b.bullets.map((x, i) => (i === idx ? text : x)) } : b,
      ),
    );

  const addBullet = (blockId: string) =>
    setCriteria(prev => prev.map(b => (b.id === blockId ? { ...b, bullets: [...b.bullets, ''] } : b)));

  const removeBullet = (blockId: string, idx: number) =>
    setCriteria(prev =>
      prev.map(b => (b.id === blockId ? { ...b, bullets: b.bullets.filter((_, i) => i !== idx) } : b)),
    );

  const addBlock = () =>
    setCriteria(prev => [...prev, { id: newId(), title: 'New criterion', bullets: [''], scoring: 'scale' }]);

  const removeBlock = (blockId: string) =>
    setCriteria(prev => prev.filter(b => b.id !== blockId));

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
            ['criteria', 'Criteria'],
            ['strategy', 'Strategy'],
            ['evaluation', 'Evaluation'],
            ['analysis', 'Analysis'],
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
        {tab === 'criteria' && (
          <div className="px-5 pt-5 pb-8 grid grid-cols-2 gap-5">
            {/* Description column */}
            <div className="flex flex-col">
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Job Description</p>
              <div className="border border-gray-200 rounded-xl bg-[#f5f5f5] p-5">
                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{position.description}</p>
              </div>
            </div>

            {/* Selection criteria column */}
            <div className="flex flex-col">
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Selection Criteria</p>
              <div className="flex flex-col gap-3">
                {criteria.map(block => (
                  <CriteriaBlockEditor
                    key={block.id}
                    block={block}
                    onTitleChange={t => updateBlockTitle(block.id, t)}
                    onScoringChange={s => updateBlockScoring(block.id, s)}
                    onBulletChange={(i, t) => updateBullet(block.id, i, t)}
                    onAddBullet={() => addBullet(block.id)}
                    onRemoveBullet={i => removeBullet(block.id, i)}
                    onRemoveBlock={() => removeBlock(block.id)}
                  />
                ))}
                <button
                  onClick={addBlock}
                  className="self-start text-xs text-gray-500 hover:text-indigo-600 transition-colors flex items-center gap-1 px-2 py-1"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add criterion
                </button>
              </div>
            </div>
          </div>
        )}

        {tab === 'strategy' && <StrategyView criteria={criteria} />}
        {tab === 'evaluation' && (
          <EvaluationTable
            criteria={criteria}
            candidateCount={position.candidateCount}
            getEval={getEval}
            patchEval={patchEval}
          />
        )}
        {tab === 'analysis' && (
          <AnalysisView
            criteria={criteria}
            candidateCount={position.candidateCount}
            getEval={getEval}
          />
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Criteria block editor

function ScoringSelector({
  value,
  onChange,
}: {
  value: ScoringSystem;
  onChange: (v: ScoringSystem) => void;
}) {
  const options: { id: ScoringSystem; label: string }[] = [
    { id: 'binary', label: 'Yes/No' },
    { id: 'scale',  label: '1–10' },
  ];
  return (
    <div className="shrink-0 inline-flex border border-gray-200 rounded-md p-0.5 bg-gray-50">
      {options.map(opt => {
        const active = opt.id === value;
        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => onChange(opt.id)}
            className={`px-2 py-0.5 text-[10px] font-medium rounded transition-colors ${
              active
                ? 'bg-white text-gray-800 shadow-sm border border-gray-200'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

function CriteriaBlockEditor({
  block,
  onTitleChange,
  onScoringChange,
  onBulletChange,
  onAddBullet,
  onRemoveBullet,
  onRemoveBlock,
}: {
  block: CriteriaBlock;
  onTitleChange: (t: string) => void;
  onScoringChange: (s: ScoringSystem) => void;
  onBulletChange: (i: number, t: string) => void;
  onAddBullet: () => void;
  onRemoveBullet: (i: number) => void;
  onRemoveBlock: () => void;
}) {
  return (
    <div className="group/block relative border border-gray-200 rounded-xl bg-white p-4">
      {/* Block remove */}
      <button
        onClick={onRemoveBlock}
        className="absolute top-2 right-2 w-5 h-5 flex items-center justify-center rounded text-gray-300 hover:text-gray-700 hover:bg-gray-100 opacity-0 group-hover/block:opacity-100 transition-opacity"
        aria-label="Remove block"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* Title + scoring selector */}
      <div className="flex items-center gap-2 mb-2 pr-7">
        <input
          value={block.title}
          onChange={e => onTitleChange(e.target.value)}
          className="flex-1 min-w-0 text-sm font-semibold text-gray-800 bg-transparent focus:outline-none focus:bg-gray-50 rounded px-1 -mx-1"
          placeholder="Criterion title"
        />
        <ScoringSelector value={block.scoring} onChange={onScoringChange} />
      </div>

      {/* Bullets */}
      <ul className="flex flex-col gap-1">
        {block.bullets.map((bullet, i) => (
          <li key={i} className="group/bullet flex items-start gap-2">
            <span className="text-gray-400 text-sm leading-6 select-none">•</span>
            <input
              value={bullet}
              onChange={e => onBulletChange(i, e.target.value)}
              className="flex-1 text-sm text-gray-700 bg-transparent focus:outline-none focus:bg-gray-50 rounded px-1 -mx-1 min-w-0"
              placeholder="Add detail…"
            />
            <button
              onClick={() => onRemoveBullet(i)}
              className="w-5 h-5 flex items-center justify-center rounded text-gray-300 hover:text-gray-700 hover:bg-gray-100 opacity-0 group-hover/bullet:opacity-100 transition-opacity shrink-0"
              aria-label="Remove bullet"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </li>
        ))}
      </ul>

      {/* Add bullet */}
      <button
        onClick={onAddBullet}
        className="mt-2 text-xs text-gray-400 hover:text-indigo-600 transition-colors flex items-center gap-1"
      >
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        Add bullet
      </button>
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

type ProfileBlock = {
  id: string;
  title: string;
  content: string[];
};

export const emptyEval: CellEval = { score: null, complete: false, selectedBlocks: [] };

export function seedInitialEvaluations(
  candidates: Candidate[],
  criteria: CriteriaBlock[],
): Record<string, CellEval> {
  const result: Record<string, CellEval> = {};
  candidates.forEach((c, ci) => {
    const base =
      c.analysisOutcome === 'qualified'   ? 8 :
      c.analysisOutcome === 'inconclusive' ? 5 :
      c.analysisOutcome === 'not-qualified' ? 4 :
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

function getProfileBlocks(c: Candidate): ProfileBlock[] {
  return [
    {
      id: 'personal',
      title: 'Personal',
      content: [
        c.dateOfBirth ? `Born: ${c.dateOfBirth}` : null,
        c.germanLevel ? `German: ${c.germanLevel}` : null,
      ].filter(Boolean) as string[],
    },
    { id: 'training', title: 'Training', content: c.training ? [c.training] : [] },
    { id: 'last-jobs', title: 'Last Jobs', content: c.lastJobs },
    { id: 'salary', title: 'Salary Expectation', content: c.salary ? [`${c.salary} €`] : [] },
    { id: 'availability', title: 'Earliest Start', content: c.earliestStart ? [c.earliestStart] : [] },
    {
      id: 'license',
      title: "Driver's License",
      content: c.driversLicense
        ? [`Yes${c.licenseClasses ? ` (Class ${c.licenseClasses})` : ''}`]
        : [],
    },
    { id: 'motivation', title: 'Job Change Motivation', content: c.jobChangeMotivation ? [c.jobChangeMotivation] : [] },
    { id: 'skills', title: 'Special Skills', content: c.specialSkills ? [c.specialSkills] : [] },
    { id: 'preferences', title: 'Additional Preferences', content: c.additionalPreferences ? [c.additionalPreferences] : [] },
    { id: 'summary', title: 'Call Summary', content: c.transcriptSummary ? [c.transcriptSummary] : [] },
  ].filter(b => b.content.length > 0);
}

function EvaluationTable({
  criteria,
  candidateCount,
  getEval,
  patchEval,
}: {
  criteria: CriteriaBlock[];
  candidateCount: number;
  getEval: (cid: string, bid: string) => CellEval;
  patchEval: (cid: string, bid: string, patch: Partial<CellEval>) => void;
}) {
  const candidates = mockCandidates.slice(0, candidateCount);
  const [activeCell, setActiveCell] = useState<{ candidateId: string; criteriaBlockId: string } | null>(null);

  const activeCandidate = activeCell ? candidates.find(c => c.id === activeCell.candidateId) ?? null : null;
  const activeCriteria = activeCell ? criteria.find(b => b.id === activeCell.criteriaBlockId) ?? null : null;
  const activeEval = activeCell ? getEval(activeCell.candidateId, activeCell.criteriaBlockId) : null;

  if (candidates.length === 0) {
    return <div className="py-20 text-center text-sm text-gray-400">No candidates yet</div>;
  }

  return (
    <>
      <table className="mt-3 border-collapse min-w-full">
        <thead>
          <tr>
            <th className="sticky top-0 left-0 z-30 bg-slate-200 text-left py-2.5 px-5 text-[10px] font-semibold text-slate-500 uppercase tracking-wide border-r border-b border-gray-200 min-w-[200px] w-[200px]">
              Candidate
            </th>
            {criteria.map(block => (
              <th
                key={block.id}
                className="sticky top-0 z-20 bg-slate-200 text-left py-3 px-5 border-r border-b border-gray-200 last:border-r-0 min-w-[280px] w-[280px] align-top font-normal"
              >
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-2">{block.title}</p>
                {block.bullets.length > 0 && (
                  <ul className="flex flex-col gap-1">
                    {block.bullets.map((bullet, bi) => (
                      <li key={bi} className="flex items-start gap-2 text-xs text-gray-600">
                        <span className="text-gray-400 leading-5 select-none">•</span>
                        <span className="flex-1 leading-5">{bullet}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {candidates.map((c, i) => {
            const isLast = i === candidates.length - 1;
            const rowBg = i % 2 === 0 ? 'bg-white' : 'bg-gray-50';
            const candidateBlocks = getProfileBlocks(c);
            return (
              <tr key={c.id} className={isLast ? '' : 'border-b border-gray-100'}>
                <td className="sticky left-0 z-10 bg-slate-200 py-3 px-5 border-r border-gray-200 align-top min-w-[200px] w-[200px]">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-semibold text-xs shrink-0">
                      {c.firstName.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{c.firstName} {c.lastName}</p>
                      <p className="text-xs text-gray-400 truncate">{c.phoneNumber}</p>
                    </div>
                  </div>
                </td>
                {criteria.map(block => {
                  const ev = getEval(c.id, block.id);
                  const isActive = activeCell?.candidateId === c.id && activeCell?.criteriaBlockId === block.id;
                  return (
                    <td
                      key={block.id}
                      onClick={() => setActiveCell({ candidateId: c.id, criteriaBlockId: block.id })}
                      className={`${rowBg} ${isActive ? 'ring-2 ring-inset ring-indigo-300' : ''} cursor-pointer hover:bg-indigo-50/40 transition-colors py-2.5 px-4 align-top border-r border-gray-100 last:border-r-0 min-w-[280px] w-[280px]`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <ScoreBadge score={ev.score} scoring={block.scoring} />

                        <label
                          onClick={e => e.stopPropagation()}
                          className="inline-flex items-center gap-1.5 cursor-pointer select-none"
                        >
                          <input
                            type="checkbox"
                            checked={ev.complete}
                            onChange={e => patchEval(c.id, block.id, { complete: e.target.checked })}
                            className="w-3.5 h-3.5 rounded border-gray-300 text-indigo-600 focus:ring-1 focus:ring-indigo-400"
                          />
                          <span className="text-[10px] uppercase tracking-wide text-gray-400">Done</span>
                        </label>
                      </div>
                      {ev.selectedBlocks.length > 0 && (
                        <ul className="flex flex-col gap-1 mt-2">
                          {ev.selectedBlocks.map(blockId => {
                            const pb = candidateBlocks.find(b => b.id === blockId);
                            if (!pb) return null;
                            return (
                              <li key={blockId} className="text-xs text-gray-700">
                                <p className="font-medium text-gray-800">{pb.title}</p>
                                {pb.content.map((line, idx) => (
                                  <p key={idx} className="text-gray-500 leading-snug line-clamp-2">{line}</p>
                                ))}
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>

      {activeCandidate && activeCriteria && activeEval && (
        <CandidateProfilePanel
          candidate={activeCandidate}
          criteriaBlock={activeCriteria}
          cellEval={activeEval}
          onClose={() => setActiveCell(null)}
          onScoreChange={score => patchEval(activeCandidate.id, activeCriteria.id, { score })}
          onToggleBlock={blockId => {
            const selected = activeEval.selectedBlocks.includes(blockId);
            const next = selected
              ? activeEval.selectedBlocks.filter(id => id !== blockId)
              : [...activeEval.selectedBlocks, blockId];
            patchEval(activeCandidate.id, activeCriteria.id, { selectedBlocks: next });
          }}
        />
      )}
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Candidate profile drawer

function CandidateProfilePanel({
  candidate,
  criteriaBlock,
  cellEval,
  onClose,
  onScoreChange,
  onToggleBlock,
}: {
  candidate: Candidate;
  criteriaBlock: CriteriaBlock;
  cellEval: CellEval;
  onClose: () => void;
  onScoreChange: (score: number | null) => void;
  onToggleBlock: (id: string) => void;
}) {
  const profileBlocks = getProfileBlocks(candidate);

  return (
    <div className="fixed inset-y-0 right-0 w-[420px] bg-white border-l border-gray-200 shadow-xl z-50 flex flex-col">
      {/* Header */}
      <div className="shrink-0 px-5 py-4 border-b border-gray-200 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-semibold text-xs shrink-0">
              {candidate.firstName.charAt(0)}
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-gray-900 truncate">{candidate.firstName} {candidate.lastName}</h3>
              <p className="text-xs text-gray-500 truncate">{candidate.jobTitle}</p>
            </div>
          </div>
          <p className="mt-2 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
            Criterion · {criteriaBlock.title}
          </p>
        </div>
        <button
          onClick={onClose}
          className="shrink-0 w-7 h-7 flex items-center justify-center rounded text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          aria-label="Close panel"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Score */}
      <div className="shrink-0 px-5 py-3 border-b border-gray-200 flex items-center gap-3">
        <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
          {criteriaBlock.scoring === 'binary' ? 'Result' : 'Score'}
        </span>
        {criteriaBlock.scoring === 'binary' ? (
          <div className="inline-flex gap-1.5">
            <button
              onClick={() => onScoreChange(cellEval.score === 10 ? null : 10)}
              className={`px-3 py-1 text-xs font-semibold rounded border transition-colors ${
                cellEval.score === 10
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                  : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300'
              }`}
            >
              Yes
            </button>
            <button
              onClick={() => onScoreChange(cellEval.score === 0 ? null : 0)}
              className={`px-3 py-1 text-xs font-semibold rounded border transition-colors ${
                cellEval.score === 0
                  ? 'bg-rose-50 border-rose-300 text-rose-700'
                  : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300'
              }`}
            >
              No
            </button>
          </div>
        ) : (
          <>
            <input
              type="number"
              min={0}
              max={10}
              value={cellEval.score ?? ''}
              onChange={e => {
                const v = e.target.value;
                if (v === '') {
                  onScoreChange(null);
                } else {
                  const n = Number(v);
                  if (!Number.isNaN(n)) onScoreChange(Math.max(0, Math.min(10, n)));
                }
              }}
              placeholder="—"
              className="w-16 px-2 py-1 border border-gray-200 rounded text-sm focus:outline-none focus:border-indigo-400"
            />
            <span className="text-xs text-gray-400">/ 10</span>
          </>
        )}
      </div>

      {/* Profile blocks */}
      <div className="flex-1 overflow-y-auto px-5 py-4">
        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Profile</p>
        <p className="text-xs text-gray-500 mb-3">
          Select blocks that justify this evaluation. Selected items appear in the cell.
        </p>
        {profileBlocks.length === 0 ? (
          <p className="text-xs text-gray-400 py-6 text-center">No profile data available yet.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {profileBlocks.map(block => {
              const selected = cellEval.selectedBlocks.includes(block.id);
              return (
                <li
                  key={block.id}
                  onClick={() => onToggleBlock(block.id)}
                  className={`cursor-pointer border rounded-lg p-3 transition-colors ${
                    selected
                      ? 'border-indigo-400 bg-indigo-50/50'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <input
                      type="checkbox"
                      checked={selected}
                      readOnly
                      className="mt-0.5 w-3.5 h-3.5 rounded border-gray-300 text-indigo-600 focus:ring-1 focus:ring-indigo-400 pointer-events-none"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-800 mb-1">{block.title}</p>
                      {block.content.map((line, i) => (
                        <p key={i} className="text-xs text-gray-600 leading-snug">{line}</p>
                      ))}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
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
}: {
  criteria: CriteriaBlock[];
  candidateCount: number;
  getEval: (cid: string, bid: string) => CellEval;
  fullWidth?: boolean;
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

  return (
    <div className={`px-5 pt-5 pb-8 flex flex-col gap-5 ${fullWidth ? '' : 'max-w-5xl mx-auto'}`}>
      {/* Summary */}
      <div className="grid grid-cols-4 gap-3">
        <StatCard label="Ranked" value={`${ranked.length} / ${candidates.length}`} />
        <StatCard label="Average Score" value={`${overallAvg.toFixed(1)}/10`} />
        <StatCard label="Completion" value={`${completionPct}%`} />
        <StatCard label="Top" value={top ? `${top.firstName} ${top.lastName.charAt(0)}.` : '—'} />
      </div>

      {/* Ranking list */}
      <div>
        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Ranked Candidates</p>
        {ranked.length === 0 ? (
          <div className="border border-gray-200 rounded-xl bg-white py-12 text-center text-sm text-gray-400">
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
              />
            ))}
          </div>
        )}
      </div>

      {/* Unevaluated */}
      {unevaluated.length > 0 && (
        <div>
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Not Evaluated</p>
          <div className="border border-gray-200 rounded-xl bg-white px-4 py-3 flex flex-wrap gap-2">
            {unevaluated.map(r => (
              <span
                key={r.candidate.id}
                className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-gray-50 border border-gray-200 text-xs text-gray-600"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-gray-300" />
                {r.candidate.firstName} {r.candidate.lastName}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-gray-200 rounded-xl bg-white p-4">
      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">{label}</p>
      <p className="text-xl font-semibold text-gray-900 mt-1 truncate">{value}</p>
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
}: {
  rank: number;
  candidate: Candidate;
  avg: number;
  completeCount: number;
  cellEvals: CellEval[];
  criteria: CriteriaBlock[];
}) {
  const rankStyles =
    rank === 1 ? 'bg-amber-100 text-amber-700 border-amber-200' :
    rank === 2 ? 'bg-slate-100 text-slate-700 border-slate-200' :
    rank === 3 ? 'bg-orange-50  text-orange-700 border-orange-200' :
                 'bg-gray-50  text-gray-500 border-gray-200';

  return (
    <div className="border border-gray-200 rounded-xl bg-white p-4">
      <div className="flex items-center gap-4">
        <div className={`shrink-0 w-10 h-10 rounded-full border flex items-center justify-center font-bold text-sm ${rankStyles}`}>
          #{rank}
        </div>
        <div className="shrink-0 w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-semibold text-xs">
          {candidate.firstName.charAt(0)}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900 truncate">
            {candidate.firstName} {candidate.lastName}
          </p>
          <p className="text-xs text-gray-500 truncate">{candidate.jobTitle}</p>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-2xl font-bold text-gray-900 leading-none">{avg.toFixed(1)}</p>
          <p className="text-[10px] text-gray-400 uppercase tracking-wider mt-0.5">avg / 10</p>
        </div>
        <div className="shrink-0 text-right ml-3">
          <p className="text-sm font-semibold text-gray-700 leading-none">
            {completeCount}<span className="text-gray-400 font-normal">/{criteria.length}</span>
          </p>
          <p className="text-[10px] text-gray-400 uppercase tracking-wider mt-0.5">done</p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-x-5 gap-y-2.5">
        {criteria.map((b, i) => {
          const score = cellEvals[i]?.score ?? null;
          const pct = score !== null ? score * 10 : 0;
          const barColor =
            score === null ? 'bg-gray-200' :
            b.scoring === 'binary'
              ? (score >= 5 ? 'bg-emerald-500' : 'bg-rose-400')
              : (score >= 7 ? 'bg-emerald-500' : score >= 5 ? 'bg-amber-400' : 'bg-rose-400');
          const valueText =
            score === null ? '—'
            : b.scoring === 'binary' ? (score >= 5 ? 'Yes' : 'No')
            : `${score}`;
          const valueColor =
            score === null ? 'text-gray-400'
            : b.scoring === 'binary'
              ? (score >= 5 ? 'text-emerald-700' : 'text-rose-700')
              : 'text-gray-700';
          return (
            <div key={b.id}>
              <div className="flex items-center justify-between mb-1 gap-2">
                <p className="text-[11px] text-gray-600 truncate">{b.title}</p>
                <p className={`text-[11px] font-semibold shrink-0 ${valueColor}`}>{valueText}</p>
              </div>
              <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${barColor}`} style={{ width: `${pct}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Shared score badge (cell)

function ScoreBadge({ score, scoring }: { score: number | null; scoring: ScoringSystem }) {
  if (score === null) {
    return <span className="text-sm font-semibold text-gray-300">—</span>;
  }
  if (scoring === 'binary') {
    const yes = score >= 5;
    return (
      <span className={`inline-flex items-center gap-1 text-xs font-semibold px-1.5 py-0.5 rounded ${
        yes ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
      }`}>
        {yes ? 'Yes' : 'No'}
      </span>
    );
  }
  return <span className="text-sm font-semibold text-gray-900">{score}/10</span>;
}

// ─────────────────────────────────────────────────────────────────────────────
// Strategy view

type ResourceCategory = 'outreach' | 'channel' | 'evaluator';
type FunnelStageId = 'reach' | 'contact' | 'screen' | 'interview' | 'decision';

type Resource = {
  id: string;
  name: string;
  subtitle: string;
  category: ResourceCategory;
  funnelStage: FunnelStageId;
  icon: string;
  color: string;
};

const RESOURCES: Resource[] = [
  { id: 'meta-ads',   name: 'Meta Ads',        subtitle: 'FB + IG paid ads',     category: 'outreach',  funnelStage: 'reach',     icon: 'M', color: 'bg-blue-500' },
  { id: 'google-ads', name: 'Google Ads',      subtitle: 'Search & display',     category: 'outreach',  funnelStage: 'reach',     icon: 'G', color: 'bg-amber-500' },
  { id: 'magazine',   name: 'Trade Magazines', subtitle: 'Print announcements',  category: 'outreach',  funnelStage: 'reach',     icon: 'P', color: 'bg-stone-500' },
  { id: 'whatsapp',   name: 'WhatsApp',        subtitle: 'Direct chat',          category: 'channel',   funnelStage: 'contact',   icon: 'W', color: 'bg-emerald-500' },
  { id: 'telegram',   name: 'Telegram',        subtitle: 'Messaging',            category: 'channel',   funnelStage: 'contact',   icon: 'T', color: 'bg-sky-500' },
  { id: 'facebook',   name: 'Facebook',        subtitle: 'Messenger',            category: 'channel',   funnelStage: 'contact',   icon: 'F', color: 'bg-blue-700' },
  { id: 'instagram',  name: 'Instagram',       subtitle: 'DM & Stories',         category: 'channel',   funnelStage: 'contact',   icon: 'I', color: 'bg-pink-500' },
  { id: 'sophia',     name: 'Sophia',          subtitle: 'AI phone screening',   category: 'evaluator', funnelStage: 'screen',    icon: 'S', color: 'bg-indigo-500' },
  { id: 'hr-team',    name: 'HR Team',         subtitle: 'Personal interviews',  category: 'evaluator', funnelStage: 'interview', icon: 'H', color: 'bg-purple-500' },
];

const FUNNEL_STAGES: { id: FunnelStageId; title: string; description: string }[] = [
  { id: 'reach',     title: 'Reach',         description: 'Attract candidates' },
  { id: 'contact',   title: 'First Contact', description: 'Inbound messages' },
  { id: 'screen',    title: 'AI Screening',  description: 'Pre-qualification' },
  { id: 'interview', title: 'HR Interview',  description: 'In-depth call' },
  { id: 'decision',  title: 'Decision',      description: 'Final selection' },
];

const CATEGORY_INFO: { id: ResourceCategory; title: string; description: string }[] = [
  { id: 'outreach',  title: 'Outreach',               description: 'Where the position is advertised' },
  { id: 'channel',   title: 'Communication Channels', description: 'How candidates contact us' },
  { id: 'evaluator', title: 'Evaluation',             description: 'Who screens and interviews candidates' },
];

function seedCriteriaStrategy(criteria: CriteriaBlock[]): Record<string, Set<string>> {
  const result: Record<string, Set<string>> = {};
  criteria.forEach(c => {
    const t = c.title.toLowerCase();
    const sel = new Set<string>();
    if (t.includes('must-have') || t.includes('mobilität') || t.includes('verfügbarkeit')) sel.add('sophia');
    if (t.includes('persönlichkeit') || t.includes('konditionen')) sel.add('hr-team');
    if (t.includes('sprache')) { sel.add('sophia'); sel.add('hr-team'); }
    if (t.includes('erfahrung') || t.includes('technisches') || t.includes('nice')) { sel.add('sophia'); sel.add('hr-team'); }
    result[c.id] = sel;
  });
  return result;
}

function StrategyView({ criteria }: { criteria: CriteriaBlock[] }) {
  const [active, setActive] = useState<Set<string>>(
    () => new Set(['meta-ads', 'instagram', 'whatsapp', 'sophia', 'hr-team']),
  );
  const [criteriaMap, setCriteriaMap] = useState<Record<string, Set<string>>>(() =>
    seedCriteriaStrategy(criteria),
  );

  const toggleActive = (id: string) =>
    setActive(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const toggleCriteriaResource = (cid: string, rid: string) =>
    setCriteriaMap(prev => {
      const current = new Set(prev[cid] ?? []);
      current.has(rid) ? current.delete(rid) : current.add(rid);
      return { ...prev, [cid]: current };
    });

  return (
    <div className="px-5 pt-5 pb-8 flex flex-col gap-6 max-w-5xl mx-auto">
      {/* Funnel */}
      <div>
        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Recruitment Funnel</p>
        <div className="border border-gray-200 rounded-xl bg-white p-5">
          <div className="flex items-stretch gap-1.5">
            {FUNNEL_STAGES.map((stage, idx) => {
              const stageResources = RESOURCES.filter(r => r.funnelStage === stage.id && active.has(r.id));
              return (
                <FunnelStageStep
                  key={stage.id}
                  stage={stage}
                  index={idx + 1}
                  resources={stageResources}
                  isLast={idx === FUNNEL_STAGES.length - 1}
                />
              );
            })}
          </div>
        </div>
      </div>

      {/* Resources library */}
      <div>
        <div className="flex items-baseline justify-between mb-2">
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Resources</p>
          <p className="text-[10px] text-gray-400">{active.size} of {RESOURCES.length} active</p>
        </div>
        <div className="flex flex-col gap-3">
          {CATEGORY_INFO.map(cat => {
            const items = RESOURCES.filter(r => r.category === cat.id);
            return (
              <div key={cat.id} className="border border-gray-200 rounded-xl bg-white p-4">
                <div className="mb-3">
                  <p className="text-sm font-semibold text-gray-800">{cat.title}</p>
                  <p className="text-xs text-gray-500">{cat.description}</p>
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
                  {items.map(r => {
                    const isActive = active.has(r.id);
                    return (
                      <button
                        key={r.id}
                        onClick={() => toggleActive(r.id)}
                        className={`flex items-center gap-2.5 p-3 rounded-lg border text-left transition-colors ${
                          isActive
                            ? 'border-indigo-400 bg-indigo-50/50'
                            : 'border-gray-200 bg-white hover:border-gray-300'
                        }`}
                      >
                        <span className={`shrink-0 w-7 h-7 rounded ${r.color} text-white flex items-center justify-center text-xs font-bold`}>
                          {r.icon}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-800 truncate">{r.name}</p>
                          <p className="text-xs text-gray-500 truncate">{r.subtitle}</p>
                        </div>
                        {isActive && (
                          <span className="shrink-0 text-[9px] uppercase font-semibold text-indigo-600 tracking-wide">On</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Per-criterion strategy */}
      <div>
        <div className="flex items-baseline justify-between mb-2">
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Strategy per Criterion</p>
          <p className="text-[10px] text-gray-400">Pick which active resources address each criterion</p>
        </div>
        {active.size === 0 ? (
          <div className="border border-dashed border-gray-300 rounded-xl bg-white py-12 text-center text-sm text-gray-400">
            Activate at least one resource above to assign it per criterion
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {criteria.map(c => {
              const selected = criteriaMap[c.id] ?? new Set<string>();
              const activeResources = RESOURCES.filter(r => active.has(r.id));
              return (
                <div key={c.id} className="border border-gray-200 rounded-xl bg-white p-4">
                  <div className="flex items-baseline justify-between mb-2 gap-2">
                    <p className="text-sm font-semibold text-gray-800 truncate">{c.title}</p>
                    <p className="text-[10px] text-gray-400 shrink-0">{selected.size} selected</p>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {activeResources.map(r => {
                      const isSelected = selected.has(r.id);
                      return (
                        <button
                          key={r.id}
                          onClick={() => toggleCriteriaResource(c.id, r.id)}
                          className={`inline-flex items-center gap-1.5 pl-1.5 pr-2.5 py-1 rounded-md text-xs border transition-colors ${
                            isSelected
                              ? 'border-indigo-300 bg-indigo-50 text-indigo-700'
                              : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                          }`}
                        >
                          <span className={`w-4 h-4 rounded ${r.color} text-white flex items-center justify-center text-[9px] font-bold`}>
                            {r.icon}
                          </span>
                          {r.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function FunnelStageStep({
  stage,
  index,
  resources,
  isLast,
}: {
  stage: { id: FunnelStageId; title: string; description: string };
  index: number;
  resources: Resource[];
  isLast: boolean;
}) {
  return (
    <>
      <div className="flex-1 min-w-0 flex flex-col">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="shrink-0 w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 text-[10px] font-bold flex items-center justify-center">
            {index}
          </span>
          <p className="text-xs font-semibold text-gray-800 truncate">{stage.title}</p>
        </div>
        <p className="text-[10px] text-gray-500 mb-2 truncate">{stage.description}</p>
        <div className="flex flex-col gap-1.5">
          {resources.length === 0 ? (
            <span className="text-[10px] text-gray-300 italic">
              {stage.id === 'decision' ? 'Pending' : 'None'}
            </span>
          ) : (
            resources.map(r => (
              <div
                key={r.id}
                className="inline-flex items-center gap-1.5 px-1.5 py-1 rounded-md bg-gray-50 border border-gray-200"
              >
                <span className={`shrink-0 w-3.5 h-3.5 rounded ${r.color} text-white flex items-center justify-center text-[8px] font-bold`}>
                  {r.icon}
                </span>
                <span className="text-[11px] text-gray-700 truncate">{r.name}</span>
              </div>
            ))
          )}
        </div>
      </div>
      {!isLast && (
        <div className="shrink-0 flex items-center text-gray-300 pt-1">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      )}
    </>
  );
}
