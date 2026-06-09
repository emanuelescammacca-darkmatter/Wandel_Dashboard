import { useMemo } from 'react';
import { mockPositions } from '../data/mockData';
import type { Position, PositionStatus } from '../types';

// Client+Positions | # Positions | Date | # Candidates | Status | Expand
const COLS = 'grid-cols-[2.6fr_1.3fr_1fr_1fr_1fr_auto]';

const statusStyles: Record<PositionStatus, string> = {
  'open':        'border border-emerald-200 text-emerald-700 bg-emerald-50',
  'in-progress': 'border border-amber-200 text-amber-700 bg-amber-50',
  'complete':    'border border-gray-200 text-gray-500 bg-gray-50',
};

const statusLabels: Record<PositionStatus, string> = {
  'open':        'Active',
  'in-progress': 'In Progress',
  'complete':    'Complete',
};

function ClientStatusBadge({ status }: { status: PositionStatus }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium whitespace-nowrap ${statusStyles[status]}`}>
      {statusLabels[status]}
    </span>
  );
}

const fmt = (d: string) =>
  new Date(d).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });

type Client = {
  name: string;
  positions: Position[];
  positionCount: number;
  candidateCount: number;
  latest: string;
  status: PositionStatus;
};

export default function Employers() {
  // No dedicated client records — derive them by grouping positions per employer.
  const clients = useMemo<Client[]>(() => {
    const map = new Map<string, Position[]>();
    mockPositions.forEach(p => {
      const list = map.get(p.employer) ?? [];
      list.push(p);
      map.set(p.employer, list);
    });
    return Array.from(map.entries()).map(([name, positions]) => ({
      name,
      positions,
      positionCount: positions.length,
      candidateCount: positions.reduce((s, p) => s + p.candidateCount, 0),
      latest: positions.reduce((max, p) => (p.receivedAt > max ? p.receivedAt : max), positions[0].receivedAt),
      status: positions.some(p => p.status === 'open')
        ? 'open'
        : positions.some(p => p.status === 'in-progress')
          ? 'in-progress'
          : 'complete',
    }));
  }, []);

  return (
    <div className="flex-1 flex flex-col overflow-y-auto bg-[#f5f5f5] p-2.5 gap-2.5">
      {/* ── Title ── */}
      <div className="shrink-0 pl-3">
        <h1 className="text-lg font-semibold text-gray-900">Clients</h1>
      </div>

      {/* ── Table card (sizes to content; the whole view scrolls) ── */}
      <div className="shrink-0">
        <div className="flex flex-col border border-gray-200 rounded-xl bg-white overflow-hidden">
          {/* Header row */}
          <div className={`grid ${COLS} px-5 shrink-0 bg-gray-50 border-b border-gray-200`}>
            <div className="py-2.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Client</div>
            <div className="py-2.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Positions</div>
            <div className="py-2.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Date</div>
            <div className="py-2.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wide"># Candidates</div>
            <div className="py-2.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Status</div>
            <div className="py-2.5" />
          </div>

          {/* Body */}
          <div>
            {clients.length === 0 ? (
              <div className="py-20 text-center text-sm text-gray-400">No clients yet</div>
            ) : (
              clients.map((cl, idx) => {
                const isLast = idx === clients.length - 1;
                return (
                  <div
                    key={cl.name}
                    className={`grid ${COLS} hover:bg-indigo-50/50 px-5 ${isLast ? '' : 'border-b border-gray-100'}`}
                  >
                    {/* Client + positions */}
                    <div className="py-2.5 pr-6 min-w-0 flex flex-col justify-center gap-0.5">
                      <span className="text-sm font-medium text-gray-800 truncate">{cl.name}</span>
                      <span className="text-xs text-gray-500 truncate">
                        {cl.positions.map(p => p.title).join(' · ')}
                      </span>
                    </div>
                    {/* # Positions */}
                    <div className="py-2.5 flex items-center">
                      <span className="text-sm text-gray-700">{cl.positionCount} {cl.positionCount === 1 ? 'position' : 'positions'}</span>
                    </div>
                    {/* Date */}
                    <div className="py-2.5 flex items-center">
                      <span className="text-xs text-gray-400">{fmt(cl.latest)}</span>
                    </div>
                    {/* # Candidates */}
                    <div className="py-2.5 flex items-center">
                      <span className="text-sm text-gray-700 font-medium">{cl.candidateCount}</span>
                    </div>
                    {/* Status */}
                    <div className="py-2.5 flex items-center">
                      <ClientStatusBadge status={cl.status} />
                    </div>
                    {/* Open indicator */}
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
      </div>
    </div>
  );
}
