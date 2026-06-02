import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { mockPositions } from '../mockData';
import type { PositionStatus } from '../types';

// Position+Description | Employer | Date | # Candidates | Status | Expand
const COLS = 'grid-cols-[2.6fr_1.3fr_1fr_1fr_1fr_auto]';

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

function PositionStatusBadge({ status }: { status: PositionStatus }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium whitespace-nowrap ${statusStyles[status]}`}>
      {statusLabels[status]}
    </span>
  );
}

const fmt = (d: string) =>
  new Date(d).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });

export default function Positions() {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const toggle = (id: string) =>
    setExpanded(prev => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[#f5f5f5]">
      {/* ── Title ── */}
      <div className="px-5 pt-4 pb-3 shrink-0">
        <h1 className="text-lg font-semibold text-gray-900">Positions</h1>
      </div>

      {/* ── Table card ── */}
      <div className="flex-1 min-h-0 px-5 pb-5">
        <div className="h-full flex flex-col border border-gray-200 rounded-xl bg-white overflow-hidden">
          {/* Header row */}
          <div className={`grid ${COLS} px-5 shrink-0 bg-gray-50 border-b border-gray-200`}>
            <div className="py-2.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Position</div>
            <div className="py-2.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Employer</div>
            <div className="py-2.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Date</div>
            <div className="py-2.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wide"># Candidates</div>
            <div className="py-2.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Status</div>
            <div className="py-2.5" />
          </div>

          {/* Body */}
          <div className="overflow-y-auto flex-1">
            {mockPositions.length === 0 ? (
              <div className="py-20 text-center text-sm text-gray-400">No positions yet</div>
            ) : (
              mockPositions.map((p, idx) => {
                const isExpanded = expanded.has(p.id);
                const isLast = idx === mockPositions.length - 1;
                return (
                  <div
                    key={p.id}
                    onClick={() => navigate(`/positions/${p.id}`)}
                    className={`grid ${COLS} hover:bg-gray-50/60 px-5 cursor-pointer ${isLast ? '' : 'border-b border-gray-100'}`}
                  >
                    {/* Position + Description */}
                    <div className="py-2.5 pr-6 min-w-0 flex flex-col justify-center gap-0.5">
                      <span className="text-sm font-medium text-gray-800 truncate">{p.title}</span>
                      <span className={`text-xs text-gray-500 ${isExpanded ? '' : 'truncate'}`}>
                        {p.description}
                      </span>
                    </div>
                    {/* Employer */}
                    <div className="py-2.5 pr-4 flex items-center min-w-0">
                      <button
                        onClick={(e) => { e.stopPropagation(); navigate('/employers'); }}
                        className="group/emp inline-flex items-center gap-1.5 px-2 py-1 -mx-2 rounded-md hover:bg-gray-200 transition-colors max-w-full"
                      >
                        <span className="text-sm text-gray-700 truncate">{p.employer}</span>
                        <svg
                          className="w-3 h-3 text-gray-400 opacity-0 group-hover/emp:opacity-100 shrink-0 transition-opacity"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </button>
                    </div>
                    {/* Date */}
                    <div className="py-2.5 flex items-center">
                      <span className="text-xs text-gray-400">{fmt(p.receivedAt)}</span>
                    </div>
                    {/* # Candidates */}
                    <div className="py-2.5 flex items-center">
                      <span className="text-sm text-gray-700 font-medium">{p.candidateCount}</span>
                    </div>
                    {/* Status */}
                    <div className="py-2.5 flex items-center">
                      <PositionStatusBadge status={p.status} />
                    </div>
                    {/* Expand toggle */}
                    <div className="py-2.5 pl-2 flex items-center">
                      <button
                        onClick={(e) => { e.stopPropagation(); toggle(p.id); }}
                        className="w-6 h-6 flex items-center justify-center rounded text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                        title={isExpanded ? 'Collapse' : 'Expand'}
                        aria-label={isExpanded ? 'Collapse row' : 'Expand row'}
                      >
                        <svg
                          className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
