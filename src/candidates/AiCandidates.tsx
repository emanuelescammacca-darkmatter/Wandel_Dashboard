import { useState, useMemo, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { mockCandidates, uniqueJobTitles } from '../data/mockData';
import PipelineStatusBadge, { PIPELINE_STATUS_OPTIONS } from '../components/PipelineStatusBadge';
import NeedForActionBadge from '../components/NeedForActionBadge';
import type { NeedForAction, PipelineStatus, Recruiter } from '../types';

const ALL_RECRUITERS: Recruiter[] = ['Tanina', 'Itgel', 'Berti', 'Camilla'];

function RecruiterAvatar({ name, size = 'sm' }: { name: Recruiter; size?: 'sm' | 'xs' }) {
  const dim = size === 'xs' ? 'w-4 h-4 text-[9px]' : 'w-5 h-5 text-[10px]';
  return (
    <div className={`${dim} rounded-full bg-gray-100 text-gray-600 font-semibold flex items-center justify-center shrink-0`}>
      {name.charAt(0)}
    </div>
  );
}

const EXPORT_COLUMNS: { key: string; label: string }[] = [
  { key: 'firstName',      label: 'First Name' },
  { key: 'lastName',       label: 'Last Name' },
  { key: 'phoneNumber',    label: 'Phone Number' },
  { key: 'jobTitle',       label: 'Job Identifier' },
  { key: 'city',           label: 'City' },
  { key: 'pipelineStatus', label: 'Status' },
  { key: 'needForAction',  label: 'Need for Action' },
  { key: 'recruiter',      label: 'Recruiter' },
  { key: 'lastContactAt',  label: 'Last Contact' },
  { key: 'createdAt',      label: 'Created Date' },
];

// Candidate | Job Identifier | City | Status | Need for Action | Recruiter | Last Contact | Created
const COLS = 'grid-cols-[1.8fr_1.5fr_0.9fr_1.2fr_1fr_0.9fr_0.9fr_0.9fr_auto]';

const HEADERS = ['Candidate', 'Job Identifier', 'City', 'Status', 'Need for Action', 'Recruiter', 'Last Contact', 'Created'];

function SearchInput({ placeholder, value, onChange, highlighted }: {
  placeholder: string; value: string; onChange: (v: string) => void; highlighted: boolean;
}) {
  return (
    <div className="relative flex-1 min-w-0">
      <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
      <input
        className={`h-7 w-full border rounded-lg pl-7 text-xs bg-gray-100 focus:outline-none placeholder-gray-400 transition-colors ${
          value ? 'pr-6' : 'pr-3'
        } ${highlighted ? 'border-indigo-500 ring-1 ring-indigo-200' : 'border-gray-200 focus:border-indigo-400'}`}
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
      />
      {value && (
        <button onClick={() => onChange('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
}

function RecruiterMultiSelect({ selected, onChange, highlighted }: { selected: Recruiter[]; onChange: (v: Recruiter[]) => void; highlighted?: boolean }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);
  const toggle = (r: Recruiter) => onChange(selected.includes(r) ? selected.filter(s => s !== r) : [...selected, r]);
  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className={`flex items-center gap-2 border rounded-lg px-3 h-7 text-sm bg-gray-100 min-w-35 transition-colors ${
          highlighted ? 'border-indigo-500 ring-1 ring-indigo-200' : 'border-gray-200 hover:border-gray-300'
        }`}
      >
        {selected.length === 0 ? (
          <span className="text-gray-400 text-xs">All recruiters</span>
        ) : (
          <div className="flex items-center">
            {selected.map((r, i) => (
              <div key={r} style={{ marginLeft: i > 0 ? -6 : 0, zIndex: selected.length - i }} className="relative">
                <RecruiterAvatar name={r} />
              </div>
            ))}
          </div>
        )}
        <svg className="w-3 h-3 text-gray-400 ml-auto shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="absolute top-full mt-1 right-0 bg-white border border-gray-200 rounded-xl shadow-lg z-20 py-1 w-44">
          {ALL_RECRUITERS.map(r => (
            <button key={r} onClick={() => toggle(r)} className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-50 text-left">
              <RecruiterAvatar name={r} />
              <span className="text-sm text-gray-700">{r}</span>
              {selected.includes(r) && (
                <svg className="w-3.5 h-3.5 text-gray-500 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>
          ))}
          {selected.length > 0 && (
            <><div className="mx-3 my-1 border-t border-gray-100" />
            <button onClick={() => onChange([])} className="w-full px-3 py-1.5 text-xs text-gray-400 hover:text-gray-600 text-left">Clear</button></>
          )}
        </div>
      )}
    </div>
  );
}

const getSelectCls = (highlighted: boolean) =>
  `h-7 border rounded-lg px-2 text-xs bg-gray-100 focus:outline-none flex-1 min-w-0 text-gray-600 transition-colors ${
    highlighted ? 'border-indigo-500 ring-1 ring-indigo-200' : 'border-gray-200 focus:border-indigo-400'
  }`;

export default function AiCandidates() {
  const navigate = useNavigate();
  const location = useLocation();
  const basePath = location.pathname.startsWith('/candidates') ? '/candidates' : '/ai-candidates';

  const [phoneSearch, setPhoneSearch]               = useState('');
  const [firstNameSearch, setFirstNameSearch]       = useState('');
  const [lastNameSearch, setLastNameSearch]         = useState('');
  const [dateFrom, setDateFrom]                     = useState('');
  const [dateTo, setDateTo]                         = useState('');
  const [jobTitleFilter, setJobTitleFilter]         = useState('');
  const [recruiterFilter, setRecruiterFilter]       = useState<Recruiter[]>([]);
  const [statusFilter, setStatusFilter]             = useState<PipelineStatus | ''>('');
  const [needForActionFilter, setNeedForActionFilter] = useState<NeedForAction | ''>('');
  const [exportOpen, setExportOpen]                 = useState(false);
  const [selectedCols, setSelectedCols]             = useState<Set<string>>(new Set(EXPORT_COLUMNS.map(c => c.key)));
  const [columnOrder, setColumnOrder]               = useState<string[]>(EXPORT_COLUMNS.map(c => c.key));

  const filtered = useMemo(() => mockCandidates.filter(c => {
    if (phoneSearch         && !c.phoneNumber.includes(phoneSearch)) return false;
    if (firstNameSearch     && !c.firstName.toLowerCase().includes(firstNameSearch.toLowerCase())) return false;
    if (lastNameSearch      && !c.lastName.toLowerCase().includes(lastNameSearch.toLowerCase())) return false;
    if (recruiterFilter.length > 0 && (!c.recruiter || !recruiterFilter.includes(c.recruiter))) return false;
    if (jobTitleFilter      && c.jobTitle !== jobTitleFilter) return false;
    if (statusFilter        && c.pipelineStatus !== statusFilter) return false;
    if (needForActionFilter && c.needForAction  !== needForActionFilter) return false;
    if (dateFrom && new Date(c.createdAt) < new Date(dateFrom)) return false;
    if (dateTo   && new Date(c.createdAt) > new Date(dateTo)) return false;
    return true;
  }), [phoneSearch, firstNameSearch, lastNameSearch, recruiterFilter, jobTitleFilter, statusFilter, needForActionFilter, dateFrom, dateTo]);

  const toggleCol = (key: string) => {
    setSelectedCols(prev => { const n = new Set(prev); n.has(key) ? n.delete(key) : n.add(key); return n; });
  };
  const moveCol = (key: string, dir: -1 | 1) => {
    setColumnOrder(prev => {
      const idx = prev.indexOf(key); const next = [...prev]; const t = idx + dir;
      if (t < 0 || t >= next.length) return prev;
      [next[idx], next[t]] = [next[t], next[idx]]; return next;
    });
  };

  const handleExportCSV = () => {
    const colMap = Object.fromEntries(EXPORT_COLUMNS.map(c => [c.key, c.label]));
    const orderedSelected = columnOrder.filter(k => selectedCols.has(k));
    const header = orderedSelected.map(k => colMap[k]).join(',');
    const rows = filtered.map(c =>
      orderedSelected.map(key => {
        const val = (c as unknown as Record<string, unknown>)[key];
        if (Array.isArray(val)) return `"${(val as string[]).join('; ')}"`;
        return `"${val ?? ''}"`;
      }).join(',')
    );
    const csv = [header, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'candidates.csv'; a.click();
    URL.revokeObjectURL(url);
    setExportOpen(false);
  };

  const fmt = (d: string) => new Date(d).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });

  return (
    <div className="flex-1 flex flex-col overflow-y-auto bg-[#f5f5f5] p-2.5 gap-2.5">

      {/* ── Title ── */}
      <div className="shrink-0 pl-3">
        <h1 className="text-lg font-semibold text-gray-900">Candidates</h1>
      </div>

      {/* ── Table card (sizes to content; the whole view scrolls) ── */}
      <div className="shrink-0">
        <div className="flex flex-col border border-gray-200 rounded-xl bg-white">

          {/* Filters toolbar — integrated into the card header */}
          <div className="px-5 py-3 border-b border-gray-200 shrink-0 flex flex-col gap-2">
            <div className="flex gap-2">
              <SearchInput placeholder="Phone number" value={phoneSearch}     onChange={setPhoneSearch}     highlighted={exportOpen} />
              <SearchInput placeholder="First name"   value={firstNameSearch} onChange={setFirstNameSearch} highlighted={exportOpen} />
              <SearchInput placeholder="Last name"    value={lastNameSearch}  onChange={setLastNameSearch}  highlighted={exportOpen} />
            </div>
        <div className="flex gap-2 items-center">
          <div className="flex items-center gap-1.5 flex-1 min-w-0">
            <label className="text-[11px] text-gray-400 whitespace-nowrap">From</label>
            <input type="date" className={getSelectCls(exportOpen)} value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
          </div>
          <div className="flex items-center gap-1.5 flex-1 min-w-0">
            <label className="text-[11px] text-gray-400 whitespace-nowrap">To</label>
            <input type="date" className={getSelectCls(exportOpen)} value={dateTo} onChange={e => setDateTo(e.target.value)} />
          </div>
          <select className={getSelectCls(exportOpen)} value={jobTitleFilter} onChange={e => setJobTitleFilter(e.target.value)}>
            <option value="">All job titles</option>
            {uniqueJobTitles.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <select className={getSelectCls(exportOpen)} value={statusFilter} onChange={e => setStatusFilter(e.target.value as PipelineStatus | '')}>
            <option value="">All statuses</option>
            {PIPELINE_STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <select className={getSelectCls(exportOpen)} value={needForActionFilter} onChange={e => setNeedForActionFilter(e.target.value as NeedForAction | '')}>
            <option value="">All actions</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
          <RecruiterMultiSelect selected={recruiterFilter} onChange={setRecruiterFilter} highlighted={exportOpen} />

          {/* ── Export ── */}
          <div className="relative shrink-0">
            <button
              onClick={() => setExportOpen(o => !o)}
              className={`flex items-center gap-1.5 px-3 h-7 rounded-lg border text-xs font-medium transition-colors ${
                exportOpen ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-gray-200 text-gray-600 hover:border-indigo-400 hover:text-indigo-600'
              }`}
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Export
            </button>
            {exportOpen && (
              <div className="absolute top-full mt-1 right-0 bg-white border border-gray-200 rounded-xl shadow-lg z-30 w-56 py-2">
                <div className="px-3 pb-2 flex items-center justify-between">
                  <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Columns</p>
                  <button
                    onClick={() => setSelectedCols(selectedCols.size === EXPORT_COLUMNS.length ? new Set() : new Set(EXPORT_COLUMNS.map(c => c.key)))}
                    className="text-[10px] text-indigo-500 hover:text-indigo-700"
                  >
                    {selectedCols.size === EXPORT_COLUMNS.length ? 'Deselect all' : 'Select all'}
                  </button>
                </div>
                <div className="border-t border-gray-100 mb-1" />
                {columnOrder.map((key, idx) => {
                  const col = EXPORT_COLUMNS.find(c => c.key === key)!;
                  return (
                    <div key={key} className="flex items-center gap-1 px-3 py-1 hover:bg-gray-50 group">
                      <button onClick={() => toggleCol(key)} className="flex items-center gap-2 flex-1 text-left py-0.5">
                        <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 transition-colors ${selectedCols.has(key) ? 'bg-indigo-600 border-indigo-600' : 'border-gray-300'}`}>
                          {selectedCols.has(key) && (
                            <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                        <span className="text-xs text-gray-700">{col.label}</span>
                      </button>
                      <div className="flex flex-col shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => moveCol(key, -1)} disabled={idx === 0} className="text-gray-400 hover:text-gray-700 disabled:opacity-20 disabled:cursor-not-allowed leading-none">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 15l7-7 7 7" /></svg>
                        </button>
                        <button onClick={() => moveCol(key, 1)} disabled={idx === columnOrder.length - 1} className="text-gray-400 hover:text-gray-700 disabled:opacity-20 disabled:cursor-not-allowed leading-none">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" /></svg>
                        </button>
                      </div>
                    </div>
                  );
                })}
                <div className="border-t border-gray-100 mt-1 pt-2 px-3">
                  <button
                    onClick={handleExportCSV}
                    disabled={selectedCols.size === 0}
                    className="w-full py-1.5 bg-indigo-600 text-white text-xs font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    Download CSV ({filtered.length} rows)
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

          {/* Column header row */}
          <div className={`grid ${COLS} px-5 shrink-0 bg-gray-50 border-b border-gray-200`}>
            {HEADERS.map(h => (
              <div key={h} className="py-2.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wide">{h}</div>
            ))}
            <div className="py-2.5" />
          </div>

          <div>
          {filtered.length === 0 ? (
            <div className="py-20 text-center text-sm text-gray-400">No candidates found</div>
          ) : (
            filtered.map((c, idx) => {
              const isLast = idx === filtered.length - 1;
              return (
              <div
                key={c.id}
                onClick={() => navigate(`${basePath}/${c.id}`)}
                className={`grid ${COLS} hover:bg-indigo-50/50 cursor-pointer px-5 ${isLast ? '' : 'border-b border-gray-100'}`}
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
                {/* Job Identifier */}
                <div className="py-3 flex items-center min-w-0 pr-2">
                  <span className="text-sm text-gray-700 truncate">{c.jobTitle}</span>
                </div>
                {/* City */}
                <div className="py-3 flex items-center min-w-0 pr-2">
                  <span className="text-sm text-gray-700 truncate">{c.city ?? '—'}</span>
                </div>
                {/* Status */}
                <div className="py-3 flex items-center">
                  <PipelineStatusBadge status={c.pipelineStatus} />
                </div>
                {/* Need for Action */}
                <div className="py-3 flex items-center">
                  <NeedForActionBadge value={c.needForAction} />
                </div>
                {/* Recruiter */}
                <div className="py-3 flex items-center min-w-0 pr-2">
                  {c.recruiter ? (
                    <div className="flex items-center gap-1.5 min-w-0">
                      <div className="w-5 h-5 rounded-full bg-gray-100 text-gray-500 text-[10px] font-semibold flex items-center justify-center shrink-0">
                        {c.recruiter.charAt(0)}
                      </div>
                      <span className="text-sm text-gray-700 truncate">{c.recruiter}</span>
                    </div>
                  ) : (
                    <span className="text-xs text-gray-300">—</span>
                  )}
                </div>
                {/* Last Contact */}
                <div className="py-3 flex items-center">
                  <span className="text-xs text-gray-400">{c.lastContactAt ? fmt(c.lastContactAt) : '—'}</span>
                </div>
                {/* Created */}
                <div className="py-3 flex items-center">
                  <span className="text-xs text-gray-400">{fmt(c.createdAt)}</span>
                </div>
                {/* Open indicator */}
                <div className="py-3 pl-2 flex items-center">
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
