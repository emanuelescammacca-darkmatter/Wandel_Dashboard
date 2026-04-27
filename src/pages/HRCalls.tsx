import { useState, useMemo, useRef, useEffect } from 'react';

// ── Types ─────────────────────────────────────────────────────────────────────

type CallStatus =
  | 'completed'
  | 'client-ended'
  | 'transferred'
  | 'voicemail-left'
  | 'no-answer'
  | 'failed';

type Disposition =
  | 'live-conversation'
  | 'voicemail'
  | 'company-line'
  | 'no-answer'
  | 'busy'
  | 'wrong-contact';

interface HRCall {
  id: string;
  date: string;
  time: string;
  duration: string | null;
  candidateName: string;
  client: string;
  position: string;
  agent: string;
  status: CallStatus;
  disposition: Disposition;
  hasAudio: boolean;
}

// ── Mock data ─────────────────────────────────────────────────────────────────

const CALLS: HRCall[] = [
  { id: '1',  date: '2026-04-10', time: '08:30', duration: '6:12', candidateName: 'Maria Hoffmann',     client: 'TechVision AG',    position: 'Senior Software Engineer',     agent: 'Laura',  status: 'completed',      disposition: 'live-conversation',  hasAudio: true  },
  { id: '2',  date: '2026-04-10', time: '09:45', duration: null,   candidateName: 'Felix Braun',        client: 'TechVision AG',    position: 'Senior Software Engineer',     agent: 'Thomas', status: 'no-answer',       disposition: 'no-answer',          hasAudio: false },
  { id: '3',  date: '2026-04-10', time: '11:00', duration: '3:55', candidateName: 'Laura Zimmermann',   client: 'MedPlus GmbH',     position: 'Medizinische Fachkraft',       agent: 'Laura',  status: 'completed',       disposition: 'live-conversation',  hasAudio: true  },
  { id: '4',  date: '2026-04-11', time: '09:00', duration: null,   candidateName: 'Felix Braun',        client: 'TechVision AG',    position: 'Senior Software Engineer',     agent: 'Thomas', status: 'voicemail-left',   disposition: 'voicemail',          hasAudio: false },
  { id: '5',  date: '2026-04-11', time: '10:15', duration: '8:44', candidateName: 'Stefan Koch',        client: 'BuildCorp GmbH',   position: 'Bauleiter',                    agent: 'Thomas', status: 'transferred',     disposition: 'live-conversation',  hasAudio: true  },
  { id: '6',  date: '2026-04-11', time: '14:30', duration: '2:10', candidateName: 'Anna Schulz',        client: 'MedPlus GmbH',     position: 'Medizinische Fachkraft',       agent: 'Laura',  status: 'client-ended',    disposition: 'live-conversation',  hasAudio: true  },
  { id: '7',  date: '2026-04-12', time: '08:00', duration: null,   candidateName: 'Marco Richter',      client: 'LogiHub GmbH',     position: 'Supply Chain Manager',         agent: 'Thomas', status: 'no-answer',       disposition: 'busy',               hasAudio: false },
  { id: '8',  date: '2026-04-12', time: '09:30', duration: '5:33', candidateName: 'Felix Braun',        client: 'TechVision AG',    position: 'Senior Software Engineer',     agent: 'Laura',  status: 'completed',       disposition: 'live-conversation',  hasAudio: true  },
  { id: '9',  date: '2026-04-12', time: '11:45', duration: null,   candidateName: 'Jana Werner',        client: 'Office Direct AG', position: 'Office Manager',               agent: 'Laura',  status: 'no-answer',       disposition: 'company-line',       hasAudio: false },
  { id: '10', date: '2026-04-13', time: '09:00', duration: '4:05', candidateName: 'Marco Richter',      client: 'LogiHub GmbH',     position: 'Supply Chain Manager',         agent: 'Thomas', status: 'completed',       disposition: 'live-conversation',  hasAudio: true  },
  { id: '11', date: '2026-04-13', time: '10:20', duration: '1:47', candidateName: 'Jana Werner',        client: 'Office Direct AG', position: 'Office Manager',               agent: 'Laura',  status: 'client-ended',    disposition: 'live-conversation',  hasAudio: true  },
  { id: '12', date: '2026-04-14', time: '08:50', duration: null,   candidateName: 'Daniel Fischer',     client: 'TechVision AG',    position: 'DevOps Engineer',              agent: 'Thomas', status: 'voicemail-left',   disposition: 'voicemail',          hasAudio: false },
  { id: '13', date: '2026-04-14', time: '11:00', duration: '9:18', candidateName: 'Stefan Koch',        client: 'BuildCorp GmbH',   position: 'Bauleiter',                    agent: 'Thomas', status: 'completed',       disposition: 'live-conversation',  hasAudio: true  },
  { id: '14', date: '2026-04-15', time: '09:30', duration: '3:22', candidateName: 'Lena Hartmann',      client: 'MedPlus GmbH',     position: 'Krankenpflegerin',             agent: 'Laura',  status: 'completed',       disposition: 'live-conversation',  hasAudio: true  },
  { id: '15', date: '2026-04-15', time: '14:00', duration: null,   candidateName: 'Daniel Fischer',     client: 'TechVision AG',    position: 'DevOps Engineer',              agent: 'Thomas', status: 'failed',          disposition: 'wrong-contact',      hasAudio: false },
  { id: '16', date: '2026-04-16', time: '08:45', duration: '7:01', candidateName: 'Maria Hoffmann',     client: 'TechVision AG',    position: 'Product Manager',              agent: 'Laura',  status: 'completed',       disposition: 'live-conversation',  hasAudio: true  },
  { id: '17', date: '2026-04-17', time: '10:00', duration: null,   candidateName: 'Tobias Neumann',     client: 'LogiHub GmbH',     position: 'Supply Chain Manager',         agent: 'Thomas', status: 'no-answer',       disposition: 'no-answer',          hasAudio: false },
  { id: '18', date: '2026-04-20', time: '09:15', duration: '5:48', candidateName: 'Tobias Neumann',     client: 'LogiHub GmbH',     position: 'Supply Chain Manager',         agent: 'Thomas', status: 'transferred',     disposition: 'live-conversation',  hasAudio: true  },
  { id: '19', date: '2026-04-22', time: '11:30', duration: '2:55', candidateName: 'Lena Hartmann',      client: 'MedPlus GmbH',     position: 'Krankenpflegerin',             agent: 'Laura',  status: 'client-ended',    disposition: 'live-conversation',  hasAudio: true  },
  { id: '20', date: '2026-04-24', time: '09:00', duration: '6:30', candidateName: 'Anna Schulz',        client: 'Office Direct AG', position: 'Office Manager',               agent: 'Laura',  status: 'completed',       disposition: 'live-conversation',  hasAudio: true  },
];

// ── Badge config ──────────────────────────────────────────────────────────────

const STATUS_CFG: Record<CallStatus, { label: string; dot: string; text: string }> = {
  'completed':      { label: 'Completed',      dot: 'bg-emerald-400', text: 'text-emerald-700' },
  'client-ended':   { label: 'Client Ended',   dot: 'bg-sky-400',     text: 'text-sky-700'     },
  'transferred':    { label: 'Transferred',    dot: 'bg-violet-400',  text: 'text-violet-700'  },
  'voicemail-left': { label: 'Voicemail Left', dot: 'bg-amber-400',   text: 'text-amber-700'   },
  'no-answer':      { label: 'No Answer',      dot: 'bg-gray-300',    text: 'text-gray-500'    },
  'failed':         { label: 'Failed',         dot: 'bg-red-400',     text: 'text-red-700'     },
};

const DISP_CFG: Record<Disposition, { label: string; bg: string; text: string; border: string }> = {
  'live-conversation': { label: 'Live Conversation', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  'voicemail':         { label: 'Voicemail',         bg: 'bg-amber-50',   text: 'text-amber-700',   border: 'border-amber-200'   },
  'company-line':      { label: 'Company Line',      bg: 'bg-blue-50',    text: 'text-blue-700',    border: 'border-blue-200'    },
  'no-answer':         { label: 'No Answer',         bg: 'bg-gray-100',   text: 'text-gray-500',    border: 'border-gray-200'    },
  'busy':              { label: 'Busy',              bg: 'bg-orange-50',  text: 'text-orange-700',  border: 'border-orange-200'  },
  'wrong-contact':     { label: 'Wrong Contact',     bg: 'bg-red-50',     text: 'text-red-700',     border: 'border-red-200'     },
};

const AGENTS = [...new Set(CALLS.map(c => c.agent))].sort();

// ── Helpers ───────────────────────────────────────────────────────────────────

const TODAY     = '2026-04-27';
const YESTERDAY = '2026-04-26';

function fmtDate(d: string): string {
  if (d === TODAY)     return 'Today';
  if (d === YESTERDAY) return 'Yesterday';
  const [, m, day] = d.split('-');
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${months[parseInt(m) - 1]} ${parseInt(day)}`;
}

function parseSecs(dur: string | null): number {
  if (!dur) return 0;
  const [m, s] = dur.split(':').map(Number);
  return m * 60 + (s || 0);
}

function initials(name: string): string {
  const parts = name.trim().split(' ');
  return (parts[0]?.[0] ?? '') + (parts[parts.length - 1]?.[0] ?? '');
}

const AVATAR_COLORS = [
  'bg-indigo-100 text-indigo-600',
  'bg-violet-100 text-violet-600',
  'bg-sky-100 text-sky-600',
  'bg-teal-100 text-teal-600',
  'bg-rose-100 text-rose-600',
  'bg-amber-100 text-amber-700',
];
function avatarColor(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) & 0xffff;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}

// ── Custom dropdown hook ──────────────────────────────────────────────────────

function useDropdown() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);
  return { open, setOpen, ref };
}

// ── Icons ─────────────────────────────────────────────────────────────────────

function PlayIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5 ml-0.5">
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}

function PauseIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
      <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
    </svg>
  );
}

function StopwatchIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" className="w-4.5 h-4.5 text-gray-400 shrink-0">
      <circle cx="12" cy="13" r="7" />
      <path d="M12 9v4l2.5 2" />
      <path d="M9.5 2.5h5M12 2.5v2.5" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-gray-400 shrink-0">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  );
}

function ChevronDown() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3 text-gray-400 pointer-events-none shrink-0">
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

// ── Shared th style ───────────────────────────────────────────────────────────

const TH = 'text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-4 py-2.5 border-b border-gray-200 whitespace-nowrap bg-white';

// ── Page ──────────────────────────────────────────────────────────────────────

export default function HRCalls() {
  const [playing, setPlaying]               = useState<string | null>(null);
  const [search, setSearch]                 = useState('');
  const [statusFilter, setStatusFilter]     = useState<CallStatus | 'all'>('all');
  const [dispFilter, setDispFilter]         = useState<Disposition | 'all'>('all');
  const [agentFilter, setAgentFilter]       = useState('all');
  const [dateFrom, setDateFrom]             = useState('');
  const [dateTo, setDateTo]                 = useState('');
  const [durationFrom, setDurationFrom]     = useState('');
  const [durationTo, setDurationTo]         = useState('');
  const statusDd  = useDropdown();
  const dispDd    = useDropdown();
  const agentDd   = useDropdown();

  const filtered = useMemo(() => {
    const q      = search.toLowerCase();
    const dfSecs = parseSecs(durationFrom || null);
    const dtSecs = parseSecs(durationTo   || null);
    return CALLS.filter(c => {
      const matchSearch   = !q || c.candidateName.toLowerCase().includes(q) || c.client.toLowerCase().includes(q) || c.position.toLowerCase().includes(q);
      const matchStatus   = statusFilter === 'all' || c.status === statusFilter;
      const matchDisp     = dispFilter   === 'all' || c.disposition === dispFilter;
      const matchAgent    = agentFilter  === 'all' || c.agent === agentFilter;
      const matchDateFrom = !dateFrom || c.date >= dateFrom;
      const matchDateTo   = !dateTo   || c.date <= dateTo;
      const callSecs      = parseSecs(c.duration);
      const matchDurFrom  = !durationFrom || callSecs >= dfSecs;
      const matchDurTo    = !durationTo   || (c.duration !== null && callSecs <= dtSecs);
      return matchSearch && matchStatus && matchDisp && matchAgent && matchDateFrom && matchDateTo && matchDurFrom && matchDurTo;
    });
  }, [search, statusFilter, dispFilter, agentFilter, dateFrom, dateTo, durationFrom, durationTo]);

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-white">

      {/* ── Header ── */}
      <div className="shrink-0 border-b border-gray-200">
        <div className="px-6 pt-4 pb-3">

          <h1 className="text-lg font-semibold text-gray-900 mb-3">HR Calls</h1>

          {/* ── Unified filter box ── */}
          <div className="flex items-stretch border border-gray-200 rounded-lg bg-white divide-x divide-gray-200 shadow-xs min-w-0">

            {/* Search */}
            <div className="flex items-center gap-2 px-3 py-2 flex-[2_1_0] min-w-20 overflow-hidden">
              <svg className="w-4.5 h-4.5 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search candidate, client or position…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="text-[13px] outline-none bg-transparent min-w-0 flex-1 text-gray-700 placeholder-gray-400"
              />
            </div>

            {/* Status */}
            <div ref={statusDd.ref} className="relative flex items-stretch flex-1 min-w-16">
              <button
                onClick={() => { statusDd.setOpen(!statusDd.open); dispDd.setOpen(false); agentDd.setOpen(false); }}
                className={`outline-none text-[13px] pl-3 pr-6 py-2 cursor-pointer select-none flex items-center w-full overflow-hidden ${statusFilter === 'all' ? 'text-gray-400' : STATUS_CFG[statusFilter].text}`}
              >
                <span className="truncate">{statusFilter === 'all' ? 'All Statuses' : STATUS_CFG[statusFilter].label}</span>
              </button>
              <span className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none"><ChevronDown /></span>
              {statusDd.open && (
                <div className="absolute -top-px -left-px -right-px z-50 min-w-max bg-white border border-gray-200 rounded-b-lg">
                  <button onClick={() => { setStatusFilter('all'); statusDd.setOpen(false); }} className="outline-none w-full text-left pl-4 pr-8 py-2 text-[13px] text-gray-400 cursor-pointer hover:bg-gray-50 whitespace-nowrap">All Statuses</button>
                  {(Object.keys(STATUS_CFG) as CallStatus[]).map(k => (
                    <button key={k} onClick={() => { setStatusFilter(k); statusDd.setOpen(false); }}
                      className={`outline-none w-full text-left px-4 py-2 text-[13px] flex items-center gap-2 cursor-pointer hover:bg-gray-50 whitespace-nowrap ${statusFilter === k ? 'font-medium' : ''} ${STATUS_CFG[k].text}`}>
                      <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${STATUS_CFG[k].dot}`} />{STATUS_CFG[k].label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Date From */}
            <div className="relative flex items-stretch flex-1 min-w-16">
              <div className="flex items-center gap-1.5 w-full pl-3 pr-6 py-2 pointer-events-none select-none overflow-hidden">
                <CalendarIcon />
                <span className={`text-[13px] truncate ${dateFrom ? 'text-gray-600' : 'text-gray-400'}`}>
                  {dateFrom ? fmtDate(dateFrom) : 'from'}
                </span>
              </div>
              <span className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none z-10"><ChevronDown /></span>
              <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:cursor-pointer" />
            </div>

            {/* Date To */}
            <div className="relative flex items-stretch flex-1 min-w-12">
              <div className="flex items-center gap-1.5 w-full pl-3 pr-6 py-2 pointer-events-none select-none overflow-hidden">
                <CalendarIcon />
                <span className={`text-[13px] truncate ${dateTo ? 'text-gray-600' : 'text-gray-400'}`}>
                  {dateTo ? fmtDate(dateTo) : 'to'}
                </span>
              </div>
              <span className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none z-10"><ChevronDown /></span>
              <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:cursor-pointer" />
            </div>

            {/* Duration From */}
            <div className="flex items-center flex-1 min-w-12 pl-3 pr-2 py-2 gap-1">
              <StopwatchIcon />
              <span className="text-[13px] text-gray-400 shrink-0 select-none">from</span>
              <input
                type="text"
                value={durationFrom}
                onChange={e => setDurationFrom(e.target.value.replace(/[^\d:]/g, '').slice(0, 5))}
                placeholder="M:SS"
                className="outline-none bg-transparent text-[13px] text-gray-400 placeholder-gray-300 min-w-0 flex-1"
              />
            </div>

            {/* Duration To */}
            <div className="flex items-center flex-1 min-w-10 pl-3 pr-2 py-2 gap-1">
              <StopwatchIcon />
              <span className="text-[13px] text-gray-400 shrink-0 select-none">to</span>
              <input
                type="text"
                value={durationTo}
                onChange={e => setDurationTo(e.target.value.replace(/[^\d:]/g, '').slice(0, 5))}
                placeholder="M:SS"
                className="outline-none bg-transparent text-[13px] text-gray-400 placeholder-gray-300 min-w-0 flex-1"
              />
            </div>

            {/* Disposition */}
            <div ref={dispDd.ref} className="relative flex items-stretch flex-[1.5_1_0] min-w-20">
              <button
                onClick={() => { dispDd.setOpen(!dispDd.open); statusDd.setOpen(false); agentDd.setOpen(false); }}
                className={`outline-none text-[13px] pl-3 pr-6 py-2 cursor-pointer select-none flex items-center w-full overflow-hidden ${dispFilter === 'all' ? 'text-gray-400' : DISP_CFG[dispFilter].text}`}
              >
                <span className="truncate">{dispFilter === 'all' ? 'All Dispositions' : DISP_CFG[dispFilter].label}</span>
              </button>
              <span className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none"><ChevronDown /></span>
              {dispDd.open && (
                <div className="absolute -top-px -left-px -right-px z-50 min-w-max bg-white border border-gray-200 rounded-b-lg">
                  <button onClick={() => { setDispFilter('all'); dispDd.setOpen(false); }} className="outline-none w-full text-left pl-4 pr-8 py-2 text-[13px] text-gray-400 cursor-pointer hover:bg-gray-50 whitespace-nowrap">All Dispositions</button>
                  {(Object.keys(DISP_CFG) as Disposition[]).map(k => (
                    <button key={k} onClick={() => { setDispFilter(k); dispDd.setOpen(false); }}
                      className={`outline-none w-full text-left px-4 py-2 text-[13px] flex items-center gap-2 cursor-pointer hover:bg-gray-50 whitespace-nowrap ${dispFilter === k ? 'font-medium' : ''} ${DISP_CFG[k].text}`}>
                      <div className={`w-2 h-2 rounded-sm shrink-0 ${DISP_CFG[k].bg} border ${DISP_CFG[k].border}`} />{DISP_CFG[k].label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Agent */}
            <div ref={agentDd.ref} className="relative flex items-stretch flex-1 min-w-14">
              <button
                onClick={() => { agentDd.setOpen(!agentDd.open); statusDd.setOpen(false); dispDd.setOpen(false); }}
                className={`outline-none text-[13px] pl-3 pr-6 py-2 cursor-pointer select-none flex items-center w-full overflow-hidden ${agentFilter === 'all' ? 'text-gray-400' : 'text-gray-600'}`}
              >
                <span className="truncate">{agentFilter === 'all' ? 'All Agents' : agentFilter}</span>
              </button>
              <span className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none"><ChevronDown /></span>
              {agentDd.open && (
                <div className="absolute -top-px -left-px -right-px z-50 min-w-max bg-white border border-gray-200 rounded-b-lg">
                  <button onClick={() => { setAgentFilter('all'); agentDd.setOpen(false); }} className="outline-none w-full text-left pl-4 pr-8 py-2 text-[13px] text-gray-400 cursor-pointer hover:bg-gray-50 whitespace-nowrap">All Agents</button>
                  {AGENTS.map(a => (
                    <button key={a} onClick={() => { setAgentFilter(a); agentDd.setOpen(false); }}
                      className={`outline-none w-full text-left px-4 py-2 text-[13px] cursor-pointer hover:bg-gray-50 whitespace-nowrap ${agentFilter === a ? 'text-gray-800 font-medium' : 'text-gray-500'}`}>
                      {a}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Table ── */}
      <div className="flex-1 overflow-y-auto overflow-x-auto">
        <table className="w-full text-[13px]" style={{ borderCollapse: 'separate', borderSpacing: 0 }}>
          <thead>
            <tr className="sticky top-0 z-10">
              <th className={TH}>Date</th>
              <th className={TH}>Time</th>
              <th className={TH}>Duration</th>
              <th className={TH}>Status</th>
              <th className={TH}>Candidate</th>
              <th className={TH}>Client</th>
              <th className={TH}>Position</th>
              <th className={TH}>Agent</th>
              <th className={TH}>Disposition</th>
            </tr>
          </thead>

          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={9} className="px-4 py-16 text-center text-gray-400 text-sm">
                  No calls match your filters
                </td>
              </tr>
            )}

            {filtered.map((call, idx) => {
              const isPlaying = playing === call.id;
              const sc  = STATUS_CFG[call.status];
              const dc  = DISP_CFG[call.disposition];
              const av  = avatarColor(call.candidateName);
              const sep = idx < filtered.length - 1 ? 'border-b border-gray-100' : '';

              return (
                <tr key={call.id} className="group hover:bg-gray-100 transition-colors duration-75">

                  {/* Date */}
                  <td className={`px-4 py-2.5 text-gray-500 whitespace-nowrap ${sep}`}>
                    {fmtDate(call.date)}
                  </td>

                  {/* Time */}
                  <td className={`px-4 py-2.5 text-gray-400 tabular-nums whitespace-nowrap ${sep}`}>
                    {call.time}
                  </td>

                  {/* Duration + play button */}
                  <td className={`px-4 py-2.5 whitespace-nowrap ${sep}`}>
                    <div className="flex items-center gap-2">
                      {call.hasAudio ? (
                        <button
                          onClick={() => setPlaying(isPlaying ? null : call.id)}
                          className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 border transition-all ${
                            isPlaying
                              ? 'border-indigo-400 bg-indigo-50 text-indigo-600 shadow-sm'
                              : 'border-gray-200 bg-white text-gray-400 hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-500 hover:shadow-sm'
                          }`}
                        >
                          {isPlaying ? <PauseIcon /> : <PlayIcon />}
                        </button>
                      ) : (
                        <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 border border-gray-100 text-gray-200">
                          <PlayIcon />
                        </div>
                      )}
                      <span className={`tabular-nums text-[13px] ${call.duration ? 'text-gray-400' : 'text-gray-300'}`}>
                        {call.duration ?? '—'}
                      </span>
                    </div>
                  </td>

                  {/* Status */}
                  <td className={`px-4 py-2.5 whitespace-nowrap ${sep}`}>
                    <div className="flex items-center gap-1.5">
                      <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${sc.dot}`} />
                      <span className={`text-[12px] font-medium ${sc.text}`}>{sc.label}</span>
                    </div>
                  </td>

                  {/* Candidate */}
                  <td className={`px-4 py-2.5 whitespace-nowrap ${sep}`}>
                    <div className="flex items-center gap-2.5">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-semibold shrink-0 ${av}`}>
                        {initials(call.candidateName)}
                      </div>
                      <span className="font-medium text-gray-700">{call.candidateName}</span>
                    </div>
                  </td>

                  {/* Client */}
                  <td className={`px-4 py-2.5 whitespace-nowrap ${sep}`}>
                    <div className="flex items-center gap-1.5">
                      <span className="text-gray-600">{call.client}</span>
                      <svg
                        viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}
                        strokeLinecap="round" strokeLinejoin="round"
                        className="w-3 h-3 text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity duration-75 shrink-0"
                      >
                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                        <polyline points="15 3 21 3 21 9" />
                        <line x1="10" y1="14" x2="21" y2="3" />
                      </svg>
                    </div>
                  </td>

                  {/* Position */}
                  <td className={`px-4 py-2.5 text-gray-400 ${sep}`} style={{ maxWidth: 200 }}>
                    <span className="block truncate">{call.position}</span>
                  </td>

                  {/* Agent */}
                  <td className={`px-4 py-2.5 whitespace-nowrap ${sep}`}>
                    <div className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0" />
                      <span className="text-gray-500">{call.agent}</span>
                    </div>
                  </td>

                  {/* Disposition */}
                  <td className={`px-4 py-2.5 whitespace-nowrap ${sep}`}>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium border ${dc.bg} ${dc.text} ${dc.border}`}>
                      {dc.label}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
