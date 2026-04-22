import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts';
import type { Candidate } from '../types';

const STATUS_COLORS: Record<string, string> = {
  Done: '#10b981',
  Failed: '#f87171',
  'In Progress': '#60a5fa',
  Initiated: '#d1d5db',
};
const CHANNEL_COLORS: Record<string, string> = {
  Instagram: '#e1306c',
  Facebook: '#1877f2',
  Whatsapp: '#25d366',
  Linkedin: '#0077b5',
  Website: '#6b7280',
};

interface Props {
  candidates: Candidate[];
  onClose: () => void;
}

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

export default function AnalyticsPanel({ candidates, onClose }: Props) {
  const total = candidates.length;

  // ── Bar chart: calls over time by status ──
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

  // ── Pie chart: status distribution ──
  const done = candidates.filter(c => c.status === 'done').length;
  const failed = candidates.filter(c => c.status === 'failed').length;
  const inProgress = candidates.filter(c => c.status === 'in-progress').length;
  const initiated = candidates.filter(c => c.status === 'initiated').length;
  const pieData = [
    { name: 'Done', value: done },
    { name: 'Failed', value: failed },
    { name: 'In Progress', value: inProgress },
    { name: 'Initiated', value: initiated },
  ].filter(d => d.value > 0);

  // ── Channel distribution ──
  const channelCounts: Record<string, number> = {};
  candidates.forEach(c => { channelCounts[c.source] = (channelCounts[c.source] ?? 0) + 1; });
  const channelData = Object.entries(channelCounts)
    .map(([name, value]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), value }))
    .sort((a, b) => b.value - a.value);

  // ── Stats ──
  const successRate = total > 0 ? Math.round((done / total) * 100) : 0;
  const flaggedCount = candidates.filter(c => c.flags.length > 0).length;
  const topChannel = channelData[0]?.name ?? '—';
  const qualifiedCount = candidates.filter(c => c.analysisOutcome === 'qualified').length;
  const qualificationRate = total > 0 ? Math.round((qualifiedCount / total) * 100) : 0;

  const tooltipStyle = { fontSize: '11px', borderRadius: '8px', border: '1px solid #e5e7eb' };

  return (
    <div className="border-b border-gray-200 bg-white shrink-0">
      {/* Panel header — py-1.5 matches the standalone button row height so button never shifts */}
      <div className="py-1.5 flex items-center justify-between px-5 border-b border-gray-200 bg-white">
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-indigo-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <span className="text-sm font-semibold text-gray-700">Data Analysis</span>
          <span className="text-xs text-gray-400">— {total} candidate{total !== 1 ? 's' : ''} in current filter</span>
        </div>
        <button
          onClick={onClose}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors bg-indigo-600 border-indigo-600 text-white hover:bg-indigo-700"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          Data Analysis
          <svg className="w-3 h-3 ml-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
          </svg>
        </button>
      </div>

      <div className="px-5 py-3 flex flex-col gap-2">
        {/* Row 1: stat cards */}
        <div className="grid grid-cols-5 gap-2 items-start">
          <StatCard label="Total Calls" value={total} />
          <StatCard label="Success Rate" value={`${successRate}%`} sub={`${done} completed`} accent="text-emerald-600" />
          <StatCard label="Failed" value={failed} sub={`${total > 0 ? Math.round(failed/total*100) : 0}% of total`} accent="text-red-500" />
          <StatCard label="Qualified" value={`${qualificationRate}%`} sub={`${qualifiedCount} candidates`} accent="text-indigo-600" />
          <StatCard label="Flagged Calls" value={flaggedCount} sub={`top channel: ${topChannel}`} />
        </div>

        {/* Row 2: bar chart + status pie + channel pie */}
        <div className="grid grid-cols-[1fr_360px_360px] gap-2">
          {/* Bar chart — calls over time */}
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
                  <Bar dataKey="Done" stackId="a" fill={STATUS_COLORS.Done} radius={[0, 0, 0, 0]} />
                  <Bar dataKey="Failed" stackId="a" fill={STATUS_COLORS.Failed} />
                  <Bar dataKey="In Progress" stackId="a" fill={STATUS_COLORS['In Progress']} />
                  <Bar dataKey="Initiated" stackId="a" fill={STATUS_COLORS.Initiated} radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Pie chart — status distribution */}
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 flex flex-col">
            <p className="text-xs font-semibold text-gray-500 mb-2">Call status distribution</p>
            {pieData.length === 0 ? (
              <div className="flex-1 flex items-center justify-center text-sm text-gray-400">No data</div>
            ) : (
              <div className="flex items-center gap-4 flex-1">
                <ResponsiveContainer width={160} height={160}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={42} outerRadius={72} paddingAngle={2} dataKey="value">
                      {pieData.map((entry) => (
                        <Cell key={entry.name} fill={STATUS_COLORS[entry.name] ?? '#e5e7eb'} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`${v} (${total > 0 ? Math.round((v as number)/total*100) : 0}%)`, '']} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-col gap-1.5 flex-1">
                  {pieData.map(d => (
                    <div key={d.name} className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full shrink-0" style={{ background: STATUS_COLORS[d.name] }} />
                        <span className="text-xs text-gray-600">{d.name}</span>
                      </div>
                      <span className="text-xs font-medium text-gray-700">{total > 0 ? Math.round(d.value/total*100) : 0}%</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Pie chart — channel distribution */}
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 flex flex-col">
            <p className="text-xs font-semibold text-gray-500 mb-2">Channel distribution</p>
            {channelData.length === 0 ? (
              <div className="flex-1 flex items-center justify-center text-sm text-gray-400">No data</div>
            ) : (
              <div className="flex items-center gap-4 flex-1">
                <ResponsiveContainer width={160} height={160}>
                  <PieChart>
                    <Pie data={channelData} cx="50%" cy="50%" innerRadius={42} outerRadius={72} paddingAngle={2} dataKey="value">
                      {channelData.map((entry) => (
                        <Cell key={entry.name} fill={CHANNEL_COLORS[entry.name] ?? '#a5b4fc'} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`${v} (${total > 0 ? Math.round((v as number)/total*100) : 0}%)`, '']} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-col gap-1.5 flex-1">
                  {channelData.map(d => (
                    <div key={d.name} className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full shrink-0" style={{ background: CHANNEL_COLORS[d.name] ?? '#a5b4fc' }} />
                        <span className="text-xs text-gray-600">{d.name}</span>
                      </div>
                      <span className="text-xs font-medium text-gray-700">{total > 0 ? Math.round(d.value/total*100) : 0}%</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
