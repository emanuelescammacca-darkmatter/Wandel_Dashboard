import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts';
import type { Candidate } from '../types';

const STATUS_COLORS: Record<string, string> = {
  Done: '#10b981', Failed: '#f87171', 'In Progress': '#60a5fa', Initiated: '#d1d5db',
};
const CHANNEL_COLORS: Record<string, string> = {
  Instagram: '#e1306c', Facebook: '#1877f2', Whatsapp: '#25d366', Linkedin: '#0077b5', Website: '#6b7280',
};
const DURATION_COLOR = '#818cf8';
const FUNNEL_COLORS = ['#6366f1', '#8b5cf6', '#a78bfa', '#c4b5fd'];

interface Props { candidates: Candidate[]; onClose?: () => void; }

function StatCard({ label, value, sub, accent }: { label: string; value: string | number; sub?: string; accent?: string }) {
  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3">
      <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold mb-1">{label}</p>
      <div className="flex items-baseline justify-between gap-2">
        <p className={`font-bold leading-none text-2xl ${accent ?? 'text-gray-800'}`}>{value}</p>
        {sub && <p className="text-[10px] text-gray-400 text-right">{sub}</p>}
      </div>
    </div>
  );
}

const parseSecs = (d: string | null): number => {
  if (!d) return 0;
  const [m, s] = d.split(':').map(Number);
  return m * 60 + (s || 0);
};
const fmtSecs = (s: number) => s === 0 ? '—' : `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

export default function AnalyticsPanel({ candidates, onClose }: Props) {
  const total = candidates.length;

  // ── Existing: timeline by status ──
  const dateMap: Record<string, { date: string; Done: number; Failed: number; 'In Progress': number; Initiated: number }> = {};
  candidates.forEach(c => {
    const date = new Date(c.createdAt).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' });
    if (!dateMap[date]) dateMap[date] = { date, Done: 0, Failed: 0, 'In Progress': 0, Initiated: 0 };
    if (c.status === 'done') dateMap[date].Done++;
    else if (c.status === 'failed') dateMap[date].Failed++;
    else if (c.status === 'in-progress') dateMap[date]['In Progress']++;
    else dateMap[date].Initiated++;
  });
  const timelineData = Object.values(dateMap).sort((a, b) => {
    const [ad, am] = a.date.split('.').map(Number);
    const [bd, bm] = b.date.split('.').map(Number);
    return am !== bm ? am - bm : ad - bd;
  });

  // ── Existing: status + channel pies ──
  const done       = candidates.filter(c => c.status === 'done').length;
  const failed     = candidates.filter(c => c.status === 'failed').length;
  const inProgress = candidates.filter(c => c.status === 'in-progress').length;
  const initiated  = candidates.filter(c => c.status === 'initiated').length;
  const pieData = [
    { name: 'Done', value: done }, { name: 'Failed', value: failed },
    { name: 'In Progress', value: inProgress }, { name: 'Initiated', value: initiated },
  ].filter(d => d.value > 0);

  const channelCounts: Record<string, number> = {};
  candidates.forEach(c => { channelCounts[c.source] = (channelCounts[c.source] ?? 0) + 1; });
  const channelData = Object.entries(channelCounts)
    .map(([name, value]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), value }))
    .sort((a, b) => b.value - a.value);

  // ── Existing stat values ──
  const successRate      = total > 0 ? Math.round((done / total) * 100) : 0;
  const flaggedCount     = candidates.filter(c => c.flags.length > 0).length;
  const topChannel       = channelData[0]?.name ?? '—';
  const qualifiedCount   = candidates.filter(c => c.analysisOutcome === 'qualified').length;
  const qualificationRate = total > 0 ? Math.round((qualifiedCount / total) * 100) : 0;

  // ── New: duration analytics ──
  const connected      = candidates.filter(c => c.duration != null).length;
  const connectionRate = total > 0 ? Math.round((connected / total) * 100) : 0;
  const allSecs        = candidates.map(c => parseSecs(c.duration)).filter(s => s > 0);
  const avgSecs        = allSecs.length > 0 ? Math.round(allSecs.reduce((a, b) => a + b, 0) / allSecs.length) : 0;

  // Duration distribution histogram (only connected calls)
  const bucketDefs = [
    { label: '< 30s', max: 30 },
    { label: '30-60s', max: 60 },
    { label: '1-2 min', max: 120 },
    { label: '2-3 min', max: 180 },
    { label: '3-5 min', max: 300 },
    { label: '5+ min', max: Infinity },
  ];
  const durationDistData = bucketDefs.map(({ label, max }, i) => {
    const min = i === 0 ? 0 : bucketDefs[i - 1].max;
    return { label, calls: allSecs.filter(s => s >= min && s < max).length };
  });

  // Duration threshold breakdown (% of ALL candidates above each threshold)
  const thresholdData = [
    { label: 'Connected', seconds: 0 },
    { label: '> 30s', seconds: 30 },
    { label: '> 1 min', seconds: 60 },
    { label: '> 2 min', seconds: 120 },
    { label: '> 3 min', seconds: 180 },
    { label: '> 5 min', seconds: 300 },
  ].map(({ label, seconds }) => ({
    label,
    pct: total > 0 ? Math.round(candidates.filter(c => parseSecs(c.duration) > seconds).length / total * 100) : 0,
    count: candidates.filter(c => parseSecs(c.duration) > seconds).length,
  }));

  // Recruitment funnel
  const engaged    = candidates.filter(c => parseSecs(c.duration) > 60).length;
  const funnelData = [
    { stage: 'Total Candidates', value: total,         pct: 100 },
    { stage: 'Call Connected',   value: connected,     pct: total > 0 ? Math.round(connected    / total * 100) : 0 },
    { stage: 'Engaged (>1 min)', value: engaged,       pct: total > 0 ? Math.round(engaged      / total * 100) : 0 },
    { stage: 'Qualified',        value: qualifiedCount, pct: total > 0 ? Math.round(qualifiedCount / total * 100) : 0 },
  ];

  // Flag frequency
  const flagCounts: Record<string, number> = {};
  candidates.forEach(c => c.flags.forEach(f => { flagCounts[f] = (flagCounts[f] ?? 0) + 1; }));
  const flagData = Object.entries(flagCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  const tooltipStyle = { fontSize: '11px', borderRadius: '8px', border: '1px solid #e5e7eb' };

  return (
    <div className={onClose ? 'border-b border-gray-200 bg-white shrink-0' : 'bg-white'}>

      {/* Panel header — only when embedded */}
      {onClose && (
        <div className="py-1.5 flex items-center justify-between px-5 border-b border-gray-200 bg-white">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-indigo-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <span className="text-sm font-semibold text-gray-700">Data Analysis</span>
            <span className="text-xs text-gray-400">— {total} candidate{total !== 1 ? 's' : ''} in filter</span>
          </div>
          <button onClick={onClose} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium bg-indigo-600 border-indigo-600 text-white hover:bg-indigo-700 transition-colors">
            Close
          </button>
        </div>
      )}

      <div className="px-5 py-4 flex flex-col gap-3">

        {/* ── Row 1: stat cards ── */}
        <div className="grid grid-cols-7 gap-2">
          <StatCard label="Total Calls"    value={total} />
          <StatCard label="Success Rate"   value={`${successRate}%`}        sub={`${done} completed`}         accent="text-emerald-600" />
          <StatCard label="Failed"         value={failed}                    sub={`${total > 0 ? Math.round(failed / total * 100) : 0}% of total`} accent="text-red-500" />
          <StatCard label="Qualified"      value={`${qualificationRate}%`}  sub={`${qualifiedCount} candidates`} accent="text-indigo-600" />
          <StatCard label="Flagged Calls"  value={flaggedCount}              sub={`top: ${topChannel}`} />
          <StatCard label="Connection Rate" value={`${connectionRate}%`}    sub={`${connected} connected`}    accent="text-sky-600" />
          <StatCard label="Avg Duration"   value={fmtSecs(avgSecs)}         sub="connected calls"             accent="text-violet-600" />
        </div>

        {/* ── Row 2: timeline + status pie + channel pie ── */}
        <div className="grid grid-cols-[1fr_320px_320px] gap-3">
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
            <p className="text-xs font-semibold text-gray-500 mb-3">Calls over time — by status</p>
            {timelineData.length === 0 ? (
              <div className="h-36 flex items-center justify-center text-sm text-gray-400">No data</div>
            ) : (
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={timelineData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }} barCategoryGap="35%">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip contentStyle={tooltipStyle} cursor={{ fill: '#f9fafb' }} />
                  <Legend iconSize={8} wrapperStyle={{ fontSize: '11px' }} />
                  <Bar dataKey="Done"       stackId="a" fill={STATUS_COLORS.Done} />
                  <Bar dataKey="Failed"     stackId="a" fill={STATUS_COLORS.Failed} />
                  <Bar dataKey="In Progress" stackId="a" fill={STATUS_COLORS['In Progress']} />
                  <Bar dataKey="Initiated"  stackId="a" fill={STATUS_COLORS.Initiated} radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 flex flex-col">
            <p className="text-xs font-semibold text-gray-500 mb-2">Call status distribution</p>
            {pieData.length === 0 ? (
              <div className="flex-1 flex items-center justify-center text-sm text-gray-400">No data</div>
            ) : (
              <div className="flex items-center gap-3 flex-1">
                <ResponsiveContainer width={130} height={130}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={36} outerRadius={60} paddingAngle={2} dataKey="value">
                      {pieData.map(e => <Cell key={e.name} fill={STATUS_COLORS[e.name] ?? '#e5e7eb'} />)}
                    </Pie>
                    <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`${v} (${total > 0 ? Math.round((v as number) / total * 100) : 0}%)`, '']} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-col gap-1.5 flex-1">
                  {pieData.map(d => (
                    <div key={d.name} className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full shrink-0" style={{ background: STATUS_COLORS[d.name] }} />
                        <span className="text-xs text-gray-600">{d.name}</span>
                      </div>
                      <span className="text-xs font-medium text-gray-700">{total > 0 ? Math.round(d.value / total * 100) : 0}%</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 flex flex-col">
            <p className="text-xs font-semibold text-gray-500 mb-2">Channel distribution</p>
            {channelData.length === 0 ? (
              <div className="flex-1 flex items-center justify-center text-sm text-gray-400">No data</div>
            ) : (
              <div className="flex items-center gap-3 flex-1">
                <ResponsiveContainer width={130} height={130}>
                  <PieChart>
                    <Pie data={channelData} cx="50%" cy="50%" innerRadius={36} outerRadius={60} paddingAngle={2} dataKey="value">
                      {channelData.map(e => <Cell key={e.name} fill={CHANNEL_COLORS[e.name] ?? '#a5b4fc'} />)}
                    </Pie>
                    <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`${v} (${total > 0 ? Math.round((v as number) / total * 100) : 0}%)`, '']} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-col gap-1.5 flex-1">
                  {channelData.map(d => (
                    <div key={d.name} className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full shrink-0" style={{ background: CHANNEL_COLORS[d.name] ?? '#a5b4fc' }} />
                        <span className="text-xs text-gray-600">{d.name}</span>
                      </div>
                      <span className="text-xs font-medium text-gray-700">{total > 0 ? Math.round(d.value / total * 100) : 0}%</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Row 3: Sophia call duration distribution + threshold breakdown + funnel ── */}
        <div className="grid grid-cols-3 gap-3">

          {/* Duration distribution histogram */}
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
            <p className="text-xs font-semibold text-gray-500 mb-1">Sophia Call Duration Distribution</p>
            <p className="text-[10px] text-gray-400 mb-3">Length of each connected call</p>
            {allSecs.length === 0 ? (
              <div className="h-36 flex items-center justify-center text-sm text-gray-400">No connected calls</div>
            ) : (
              <ResponsiveContainer width="100%" height={150}>
                <BarChart data={durationDistData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }} barCategoryGap="30%">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip contentStyle={tooltipStyle} cursor={{ fill: '#f5f3ff' }} formatter={(v) => [v, 'Calls']} />
                  <Bar dataKey="calls" fill={DURATION_COLOR} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Duration threshold breakdown */}
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
            <p className="text-xs font-semibold text-gray-500 mb-1">Call Duration Reach</p>
            <p className="text-[10px] text-gray-400 mb-3">% of all candidates whose call lasted at least this long</p>
            <div className="flex flex-col gap-2.5 mt-1">
              {thresholdData.map(({ label, pct, count }) => (
                <div key={label}>
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-[11px] text-gray-600 font-medium">{label}</span>
                    <span className="text-[11px] text-gray-500">{count}/{total} · <span className="font-semibold text-gray-700">{pct}%</span></span>
                  </div>
                  <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${pct}%`, background: DURATION_COLOR }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recruitment funnel */}
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
            <p className="text-xs font-semibold text-gray-500 mb-1">AI Recruitment Funnel</p>
            <p className="text-[10px] text-gray-400 mb-4">Candidate conversion through Sophia's pipeline</p>
            <div className="flex flex-col gap-3">
              {funnelData.map(({ stage, value, pct }, i) => (
                <div key={stage}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] text-gray-600 font-medium">{stage}</span>
                    <span className="text-[11px] font-semibold text-gray-700">{value} <span className="font-normal text-gray-400">({pct}%)</span></span>
                  </div>
                  <div className="h-5 bg-gray-200 rounded-md overflow-hidden">
                    <div
                      className="h-full rounded-md flex items-center pl-2 transition-all"
                      style={{ width: `${Math.max(pct, 8)}%`, background: FUNNEL_COLORS[i] }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Row 4: Flag analysis + AI Adoption ── */}
        <div className="grid grid-cols-2 gap-3">

          {/* Flag analysis */}
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
            <p className="text-xs font-semibold text-gray-500 mb-1">Call Flag Analysis</p>
            <p className="text-[10px] text-gray-400 mb-3">Issues flagged by Sophia during calls</p>
            {flagData.length === 0 ? (
              <div className="h-20 flex items-center justify-center text-sm text-gray-400">No flags raised</div>
            ) : (
              <ResponsiveContainer width="100%" height={120}>
                <BarChart data={flagData} layout="vertical" margin={{ top: 0, right: 24, left: 8, bottom: 0 }} barCategoryGap="30%">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} width={100} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v) => [v, 'Occurrences']} />
                  <Bar dataKey="count" fill="#f87171" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* AI Adoption distribution */}
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
            <p className="text-xs font-semibold text-gray-500 mb-1">AI Adoption Level</p>
            <p className="text-[10px] text-gray-400 mb-3">How well candidates engaged with the AI agent</p>
            {(() => {
              const adoptionCounts = { high: 0, medium: 0, low: 0, none: 0 };
              candidates.forEach(c => {
                if (c.aiAdoption === 'high') adoptionCounts.high++;
                else if (c.aiAdoption === 'medium') adoptionCounts.medium++;
                else if (c.aiAdoption === 'low') adoptionCounts.low++;
                else adoptionCounts.none++;
              });
              const adoptionData = [
                { name: 'High',   value: adoptionCounts.high,   fill: '#10b981' },
                { name: 'Medium', value: adoptionCounts.medium, fill: '#f59e0b' },
                { name: 'Low',    value: adoptionCounts.low,    fill: '#94a3b8' },
              ].filter(d => d.value > 0);
              return (
                <div className="flex items-center gap-6">
                  <ResponsiveContainer width={130} height={130}>
                    <PieChart>
                      <Pie data={adoptionData} cx="50%" cy="50%" innerRadius={36} outerRadius={60} paddingAngle={2} dataKey="value">
                        {adoptionData.map(e => <Cell key={e.name} fill={e.fill} />)}
                      </Pie>
                      <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`${v} (${total > 0 ? Math.round((v as number) / total * 100) : 0}%)`, '']} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex flex-col gap-3 flex-1">
                    {adoptionData.map(d => (
                      <div key={d.name}>
                        <div className="flex items-center justify-between mb-0.5">
                          <div className="flex items-center gap-1.5">
                            <div className="w-2 h-2 rounded-full" style={{ background: d.fill }} />
                            <span className="text-xs text-gray-600">{d.name}</span>
                          </div>
                          <span className="text-xs font-semibold text-gray-700">{total > 0 ? Math.round(d.value / total * 100) : 0}%</span>
                        </div>
                        <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${total > 0 ? Math.round(d.value / total * 100) : 0}%`, background: d.fill }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}
          </div>
        </div>

      </div>
    </div>
  );
}
