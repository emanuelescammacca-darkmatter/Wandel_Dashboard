import { useState, useMemo, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { mockCandidates, uniqueJobTitles } from '../mockData';
import StatusBadge from '../components/StatusBadge';
import { ChannelIcon, ChannelStack } from '../components/ChannelBadge';
import type { Channel } from '../types';

const ALL_CHANNELS: Channel[] = ['instagram', 'facebook', 'whatsapp', 'linkedin', 'website'];
const CHANNEL_LABELS: Record<Channel, string> = {
  instagram: 'Instagram', facebook: 'Facebook', whatsapp: 'WhatsApp', linkedin: 'LinkedIn', website: 'Website',
};

const EXPORT_COLUMNS: { key: string; label: string }[] = [
  { key: 'firstName',        label: 'First Name' },
  { key: 'lastName',         label: 'Last Name' },
  { key: 'phoneNumber',      label: 'Phone Number' },
  { key: 'touchpoints',      label: 'Points of Contact' },
  { key: 'source',           label: 'Channel' },
  { key: 'employmentStatus', label: 'Status' },
  { key: 'flags',            label: 'Call Flags' },
  { key: 'lastContactAt',    label: 'Last Contact' },
  { key: 'aiAdoption',       label: 'AI Adoption' },
  { key: 'createdAt',        label: 'Created Date' },
  { key: 'analysisOutcome',  label: 'Analysis Outcome' },
];

// Candidate col | Points | Channel | Status | Call Flags | Last Contact | AI Adoption | Created
const COLS = 'grid-cols-[2fr_0.8fr_0.8fr_1.4fr_1.4fr_1.1fr_1fr_1fr]';

const HEADERS = ['Candidate', 'Points of Contact', 'Channel', 'Status', 'Call Flags', 'Last Contact', 'AI Adoption', 'Created'];

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

function ChannelMultiSelect({ selected, onChange, highlighted }: { selected: Channel[]; onChange: (v: Channel[]) => void; highlighted?: boolean }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);
  const toggle = (ch: Channel) => onChange(selected.includes(ch) ? selected.filter(s => s !== ch) : [...selected, ch]);
  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className={`flex items-center gap-2 border rounded-lg px-3 h-7 text-sm bg-gray-100 min-w-35 transition-colors ${
          highlighted ? 'border-indigo-500 ring-1 ring-indigo-200' : 'border-gray-200 hover:border-gray-300'
        }`}
      >
        {selected.length === 0
          ? <span className="text-gray-400 text-xs">All channels</span>
          : <ChannelStack channels={selected} />}
        <svg className="w-3 h-3 text-gray-400 ml-auto shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="absolute top-full mt-1 left-0 bg-white border border-gray-200 rounded-xl shadow-lg z-20 py-1 w-44">
          {ALL_CHANNELS.map(ch => (
            <button key={ch} onClick={() => toggle(ch)} className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-50 text-left">
              <ChannelIcon channel={ch} />
              <span className="text-sm text-gray-700">{CHANNEL_LABELS[ch]}</span>
              {selected.includes(ch) && (
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

function AiAdoptionBadge({ value }: { value: 'high' | 'medium' | 'low' | null }) {
  if (!value) return <span className="text-xs text-gray-300">—</span>;
  const cls = value === 'high'
    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
    : value === 'medium'
    ? 'bg-amber-50 text-amber-700 border-amber-200'
    : 'bg-gray-50 text-gray-500 border-gray-200';
  const label = value === 'high' ? 'High' : value === 'medium' ? 'Medium' : 'Low';
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${cls}`}>
      {label}
    </span>
  );
}

export default function AiCandidates() {
  const navigate = useNavigate();
  const location = useLocation();
  const basePath = location.pathname.startsWith('/candidates') ? '/candidates' : '/ai-candidates';

  const [phoneSearch, setPhoneSearch]         = useState('');
  const [firstNameSearch, setFirstNameSearch] = useState('');
  const [lastNameSearch, setLastNameSearch]   = useState('');
  const [dateFrom, setDateFrom]               = useState('');
  const [dateTo, setDateTo]                   = useState('');
  const [jobTitleFilter, setJobTitleFilter]   = useState('');
  const [channelFilter, setChannelFilter]     = useState<Channel[]>([]);
  const [exportOpen, setExportOpen]           = useState(false);
  const [selectedCols, setSelectedCols]       = useState<Set<string>>(new Set(EXPORT_COLUMNS.map(c => c.key)));
  const [columnOrder, setColumnOrder]         = useState<string[]>(EXPORT_COLUMNS.map(c => c.key));

  const filtered = useMemo(() => mockCandidates.filter(c => {
    if (phoneSearch     && !c.phoneNumber.includes(phoneSearch)) return false;
    if (firstNameSearch && !c.firstName.toLowerCase().includes(firstNameSearch.toLowerCase())) return false;
    if (lastNameSearch  && !c.lastName.toLowerCase().includes(lastNameSearch.toLowerCase())) return false;
    if (channelFilter.length > 0 && !channelFilter.includes(c.source)) return false;
    if (jobTitleFilter  && c.jobTitle !== jobTitleFilter) return false;
    if (dateFrom && new Date(c.createdAt) < new Date(dateFrom)) return false;
    if (dateTo   && new Date(c.createdAt) > new Date(dateTo)) return false;
    return true;
  }), [phoneSearch, firstNameSearch, lastNameSearch, channelFilter, jobTitleFilter, dateFrom, dateTo]);

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
    <div className="flex-1 flex flex-col overflow-hidden bg-white">

      {/* ── Title ── */}
      <div className="px-5 pt-4 pb-2 flex items-center justify-between shrink-0">
        <h1 className="text-lg font-semibold text-gray-900">Candidates</h1>
      </div>

      {/* ── Filters ── */}
      <div className="px-5 pb-4 shrink-0 border-b border-gray-200">
        <div className="flex gap-2 mb-2">
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
          <ChannelMultiSelect selected={channelFilter} onChange={setChannelFilter} highlighted={exportOpen} />

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

      {/* ── Table ── */}
      <div className="flex-1 flex flex-col min-h-0">
        <div className={`grid ${COLS} px-5 shrink-0 relative`}>
          {HEADERS.map(h => (
            <div key={h} className="py-2 text-[10px] font-semibold text-gray-400 uppercase tracking-wide">{h}</div>
          ))}
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gray-200" />
        </div>

        <div className="overflow-y-auto flex-1">
          {filtered.length === 0 ? (
            <div className="py-20 text-center text-sm text-gray-400">No candidates found</div>
          ) : (
            filtered.map(c => (
              <div
                key={c.id}
                onClick={() => navigate(`${basePath}/${c.id}`)}
                className={`grid ${COLS} hover:bg-gray-50 cursor-pointer group px-5 relative`}
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
                {/* Points of Contact */}
                <div className="py-3 flex items-center">
                  <span className="text-sm text-gray-700 font-medium">{c.touchpoints}</span>
                </div>
                {/* Channel */}
                <div className="py-3 flex items-center">
                  <ChannelIcon channel={c.source} size="md" />
                </div>
                {/* Status */}
                <div className="py-3 flex items-center">
                  <StatusBadge status={c.employmentStatus} />
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
                {/* Last Contact */}
                <div className="py-3 flex items-center">
                  <span className="text-xs text-gray-400">{c.lastContactAt ? fmt(c.lastContactAt) : '—'}</span>
                </div>
                {/* AI Adoption */}
                <div className="py-3 flex items-center">
                  <AiAdoptionBadge value={c.aiAdoption} />
                </div>
                {/* Created */}
                <div className="py-3 flex items-center">
                  <span className="text-xs text-gray-400">{fmt(c.createdAt)}</span>
                </div>
                <div className="absolute bottom-0 left-5 right-5 h-px bg-gray-100" />
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
