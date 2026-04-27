import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, PieChart, Pie, Legend,
} from 'recharts';
import { mockCandidates } from '../mockData';
import type { Candidate, EmploymentStatus } from '../types';

// ── Pipeline-specific mock data ───────────────────────────────────────────────

const RECRUITER: Record<string, string> = {
  '1': 'Sarah K.', '2': 'Tom B.',  '3': 'Lisa M.',
  '4': 'Sarah K.', '5': 'Tom B.',  '6': 'Lisa M.',
  '7': 'Sarah K.', '8': 'Tom B.',
};

const SOPHIA_CALLS: Record<string, number> = {
  '1': 1, '2': 2, '3': 1, '4': 3, '5': 1, '6': 1, '7': 3, '8': 0,
};
const HR_CALLS: Record<string, number> = {
  '1': 0, '2': 1, '3': 0, '4': 1, '5': 0, '6': 0, '7': 2, '8': 0,
};
const MESSAGES: Record<string, number> = {
  '1': 0, '2': 0, '3': 1, '4': 0, '5': 1, '6': 0, '7': 0, '8': 1,
};

// ── Stage config ──────────────────────────────────────────────────────────────

const STAGE_LABEL: Record<EmploymentStatus, string> = {
  'looking-for-job':     'Looking',
  'unemployed':          'Unemployed',
  'applying':            'Applying',
  'interview-scheduled': 'Interview',
  'employed':            'Placed',
  'not-interested':      'Withdrawn',
};

const STAGE_COLOR: Record<EmploymentStatus, string> = {
  'looking-for-job':     '#60a5fa',
  'unemployed':          '#fbbf24',
  'applying':            '#818cf8',
  'interview-scheduled': '#10b981',
  'employed':            '#34d399',
  'not-interested':      '#9ca3af',
};

const STAGE_ORDER: EmploymentStatus[] = [
  'looking-for-job', 'unemployed', 'applying',
  'interview-scheduled', 'employed', 'not-interested',
];

const DAYS_TO_CLOSE: Record<EmploymentStatus, number> = {
  'looking-for-job':     21,
  'unemployed':          14,
  'applying':            14,
  'interview-scheduled': 7,
  'employed':            30,
  'not-interested':      5,
};

const RECRUITER_COLORS = ['#6366f1', '#8b5cf6', '#a78bfa', '#c4b5fd'];
const TODAY = new Date('2026-04-27');

// ── Helpers ───────────────────────────────────────────────────────────────────

function getEstimatedEnd(c: Candidate): string {
  const start = new Date(c.createdAt);
  const days = DAYS_TO_CLOSE[c.employmentStatus] ?? 21;
  return new Date(start.getTime() + days * 86400000).toISOString().split('T')[0];
}

function getDaysInPipeline(c: Candidate): number {
  return Math.max(0, Math.round(
    (TODAY.getTime() - new Date(c.createdAt).getTime()) / 86400000
  ));
}

function isAtRisk(c: Candidate): boolean {
  return c.flags.length > 0 || getDaysInPipeline(c) > 18;
}

// ── Shared sub-components ─────────────────────────────────────────────────────

function StatCard({ label, value, sub, accent }: {
  label: string; value: string | number; sub?: string; accent?: string;
}) {
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

function StageDot({ stage }: { stage: EmploymentStatus }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium"
      style={{ background: STAGE_COLOR[stage] + '22', color: STAGE_COLOR[stage] }}
    >
      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: STAGE_COLOR[stage] }} />
      {STAGE_LABEL[stage]}
    </span>
  );
}

// ── Gantt chart (custom SVG) ───────────────────────────────────────────────────

function GanttChart({ candidates }: { candidates: Candidate[] }) {
  const ROW_H   = 38;
  const LABEL_W = 142;
  const RIGHT_P = 80;
  const TOP_P   = 30;
  const BOT_P   = 8;
  const VIEW_W  = 900;
  const TRACK_W = VIEW_W - LABEL_W - RIGHT_P;

  const MSday   = 86400000;
  const minTs   = Math.min(...candidates.map(c => new Date(c.createdAt).getTime()));
  const maxTs   = Math.max(
    ...candidates.map(c => new Date(getEstimatedEnd(c)).getTime()),
    TODAY.getTime() + 3 * MSday,
  );
  const span    = maxTs - minTs || MSday;

  const toX = (ts: number) => LABEL_W + ((ts - minTs) / span) * TRACK_W;
  const todayX  = toX(TODAY.getTime());
  const VIEW_H  = candidates.length * ROW_H + TOP_P + BOT_P;

  // Date tick marks
  const rangeDays  = span / MSday;
  const tickEvery  = rangeDays <= 14 ? 2 : rangeDays <= 30 ? 5 : 7;
  const ticks: Date[] = [];
  let d = new Date(minTs);
  while (d.getTime() <= maxTs + MSday) {
    ticks.push(new Date(d));
    d = new Date(d.getTime() + tickEvery * MSday);
  }

  return (
    <svg viewBox={`0 0 ${VIEW_W} ${VIEW_H}`} width="100%" style={{ display: 'block' }}>
      {/* Grid lines + date labels */}
      {ticks.map((t, i) => {
        const x = toX(t.getTime());
        if (x < LABEL_W || x > VIEW_W - RIGHT_P + 6) return null;
        const lbl = t.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' });
        return (
          <g key={i}>
            <line x1={x} y1={TOP_P} x2={x} y2={VIEW_H - BOT_P} stroke="#e5e7eb" strokeWidth={1} />
            <text x={x} y={TOP_P - 8} textAnchor="middle" fontSize={9} fill="#d1d5db">{lbl}</text>
          </g>
        );
      })}

      {/* Today line */}
      {todayX >= LABEL_W && todayX <= VIEW_W - RIGHT_P && (
        <>
          <line x1={todayX} y1={TOP_P - 4} x2={todayX} y2={VIEW_H - BOT_P} stroke="#6366f1" strokeWidth={1.5} strokeDasharray="4 3" />
          <text x={todayX} y={TOP_P - 11} textAnchor="middle" fontSize={9} fill="#6366f1" fontWeight="600">Today</text>
        </>
      )}

      {/* Rows */}
      {candidates.map((c, i) => {
        const y      = TOP_P + i * ROW_H;
        const barY   = y + ROW_H * 0.22;
        const barH   = ROW_H * 0.56;
        const startX = toX(new Date(c.createdAt).getTime());
        const endX   = toX(new Date(getEstimatedEnd(c)).getTime());
        const barW   = Math.max(endX - startX, 6);
        const color  = STAGE_COLOR[c.employmentStatus];
        const name   = `${c.firstName} ${c.lastName}`;
        const rec    = RECRUITER[c.id] ?? '—';

        return (
          <g key={c.id}>
            {/* Alternating row background */}
            {i % 2 === 0 && (
              <rect x={0} y={y} width={VIEW_W} height={ROW_H} fill="#fafafa" />
            )}

            {/* Candidate name */}
            <text
              x={LABEL_W - 10} y={y + ROW_H / 2}
              textAnchor="end" fontSize={11} fill="#6b7280"
              dominantBaseline="middle"
            >
              {name}
            </text>

            {/* Track background */}
            <rect x={LABEL_W} y={barY} width={TRACK_W} height={barH} fill="#f3f4f6" rx={3} />

            {/* Duration bar */}
            <rect x={startX} y={barY} width={barW} height={barH} fill={color} fillOpacity={0.82} rx={3} />

            {/* Stage label inside bar */}
            {barW > 48 && (
              <text
                x={startX + barW / 2} y={barY + barH / 2}
                textAnchor="middle" dominantBaseline="middle"
                fontSize={9} fill="white" fontWeight={600}
              >
                {STAGE_LABEL[c.employmentStatus]}
              </text>
            )}

            {/* Recruiter label after bar */}
            <text
              x={Math.min(endX + 7, VIEW_W - 4)} y={y + ROW_H / 2}
              fontSize={10} fill="#9ca3af" dominantBaseline="middle"
            >
              {rec}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function Pipeline() {
  const candidates = mockCandidates;
  const total      = candidates.length;
  const TT         = { fontSize: '11px', borderRadius: '8px', border: '1px solid #e5e7eb' };

  // ── Stat values ──
  const active      = candidates.filter(c => c.employmentStatus !== 'not-interested' && c.status !== 'failed').length;
  const placed      = candidates.filter(c => c.employmentStatus === 'employed').length;
  const interviews  = candidates.filter(c => c.employmentStatus === 'interview-scheduled').length;
  const qualified   = candidates.filter(c => c.analysisOutcome === 'qualified').length;
  const qualRate    = total > 0 ? Math.round(qualified / total * 100) : 0;
  const avgDays     = total > 0
    ? Math.round(candidates.reduce((s, c) => s + getDaysInPipeline(c), 0) / total)
    : 0;

  // ── Stage distribution ──
  const stageData = STAGE_ORDER.map(stage => ({
    name:  STAGE_LABEL[stage],
    count: candidates.filter(c => c.employmentStatus === stage).length,
    fill:  STAGE_COLOR[stage],
  })).filter(d => d.count > 0);

  // ── Recruiter workload ──
  const recCounts: Record<string, number> = {};
  candidates.forEach(c => {
    const r = RECRUITER[c.id] ?? 'Unassigned';
    recCounts[r] = (recCounts[r] ?? 0) + 1;
  });
  const recruiterData = Object.entries(recCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  // ── Recruiter activity (stacked: sophia + hr + messages) ──
  const recruiterActivity = Object.keys(recCounts).map(r => ({
    name:     r,
    sophia:   candidates.filter(c => RECRUITER[c.id] === r).reduce((s, c) => s + (SOPHIA_CALLS[c.id] ?? 0), 0),
    hr:       candidates.filter(c => RECRUITER[c.id] === r).reduce((s, c) => s + (HR_CALLS[c.id] ?? 0), 0),
    messages: candidates.filter(c => RECRUITER[c.id] === r).reduce((s, c) => s + (MESSAGES[c.id] ?? 0), 0),
  }));

  // ── Stage velocity (avg days in pipeline per stage group) ──
  const velocityData = STAGE_ORDER.map(stage => {
    const inStage = candidates.filter(c => c.employmentStatus === stage);
    const avg = inStage.length > 0
      ? Math.round(inStage.reduce((s, c) => s + getDaysInPipeline(c), 0) / inStage.length)
      : 0;
    return { name: STAGE_LABEL[stage], days: avg, fill: STAGE_COLOR[stage] };
  }).filter(d => d.days > 0);

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-white">

      {/* ── Page header ── */}
      <div className="px-5 pt-4 pb-3 shrink-0 border-b border-gray-200">
        <h1 className="text-lg font-semibold text-gray-900">Pipeline Report</h1>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="px-5 py-4 flex flex-col gap-3">

          {/* ── Row 1: Stat cards ── */}
          <div className="grid grid-cols-6 gap-2">
            <StatCard label="Total Cases"           value={total}            />
            <StatCard label="Active"                value={active}            sub={`${total - active} inactive`}  accent="text-indigo-600" />
            <StatCard label="Qualified Rate"        value={`${qualRate}%`}    sub={`${qualified} qualified`}      accent="text-emerald-600" />
            <StatCard label="Avg Days in Pipeline"  value={`${avgDays}d`}     sub="per case" />
            <StatCard label="Interview Scheduled"   value={interviews}        sub="ready for HR"                  accent="text-teal-600" />
            <StatCard label="Placed"                value={placed}            sub="hired this cycle"              accent="text-green-600" />
          </div>

          {/* ── Row 2: Stage distribution + Recruiter workload ── */}
          <div className="grid grid-cols-[1fr_300px] gap-3">

            {/* Stage distribution */}
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
              <p className="text-xs font-semibold text-gray-500 mb-1">Pipeline Stage Distribution</p>
              <p className="text-[10px] text-gray-400 mb-3">Candidates at each recruitment stage</p>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={stageData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }} barCategoryGap="40%">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip contentStyle={TT} cursor={{ fill: '#f9fafb' }} formatter={(v) => [v, 'Candidates']} />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {stageData.map(d => <Cell key={d.name} fill={d.fill} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Recruiter workload */}
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 flex flex-col">
              <p className="text-xs font-semibold text-gray-500 mb-2">Recruiter Workload</p>
              <div className="flex items-center gap-3 flex-1">
                <ResponsiveContainer width={110} height={110}>
                  <PieChart>
                    <Pie data={recruiterData} cx="50%" cy="50%" innerRadius={30} outerRadius={52} paddingAngle={3} dataKey="count">
                      {recruiterData.map((d, i) => (
                        <Cell key={d.name} fill={RECRUITER_COLORS[i % RECRUITER_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={TT} formatter={(v) => [v, 'Cases']} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-col gap-2.5 flex-1">
                  {recruiterData.map((d, i) => (
                    <div key={d.name}>
                      <div className="flex items-center justify-between mb-0.5">
                        <div className="flex items-center gap-1.5">
                          <div className="w-2 h-2 rounded-full shrink-0" style={{ background: RECRUITER_COLORS[i % RECRUITER_COLORS.length] }} />
                          <span className="text-xs text-gray-600">{d.name}</span>
                        </div>
                        <span className="text-xs font-semibold text-gray-700">{d.count}</span>
                      </div>
                      <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width:      `${total > 0 ? Math.round(d.count / total * 100) : 0}%`,
                            background: RECRUITER_COLORS[i % RECRUITER_COLORS.length],
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ── Row 3: Gantt timeline ── */}
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
            <p className="text-xs font-semibold text-gray-500 mb-1">Case Timeline</p>
            <p className="text-[10px] text-gray-400 mb-3">
              Start → estimated close per case · bar colour = current stage · label = assigned recruiter
            </p>

            {/* Colour legend */}
            <div className="flex flex-wrap gap-3 mb-3">
              {STAGE_ORDER.map(s => (
                <div key={s} className="flex items-center gap-1">
                  <div className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: STAGE_COLOR[s] }} />
                  <span className="text-[10px] text-gray-500">{STAGE_LABEL[s]}</span>
                </div>
              ))}
            </div>

            <GanttChart candidates={candidates} />
          </div>

          {/* ── Row 4: Activity per case table ── */}
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
            <p className="text-xs font-semibold text-gray-500 mb-3">Case Activity Breakdown</p>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-gray-200">
                    {[
                      'Candidate', 'Position', 'Stage', 'Recruiter',
                      'Sophia Calls', 'HR Calls', 'Messages', 'Total Touchpoints',
                      'Days in Pipeline', 'Health',
                    ].map(h => (
                      <th
                        key={h}
                        className="text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wide pb-2 pr-4 whitespace-nowrap"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {candidates.map((c, i) => {
                    const risk = isAtRisk(c);
                    const days = getDaysInPipeline(c);
                    return (
                      <tr
                        key={c.id}
                        className={`border-b border-gray-100 last:border-0 ${i % 2 !== 0 ? 'bg-white/60' : ''}`}
                      >
                        <td className="py-2 pr-4 font-medium text-gray-700 whitespace-nowrap">
                          {c.firstName} {c.lastName}
                        </td>
                        <td className="py-2 pr-4 text-gray-400 whitespace-nowrap max-w-[160px] truncate">
                          {c.jobTitle}
                        </td>
                        <td className="py-2 pr-4">
                          <StageDot stage={c.employmentStatus} />
                        </td>
                        <td className="py-2 pr-4 text-gray-500">{RECRUITER[c.id] ?? '—'}</td>
                        <td className="py-2 pr-4 text-center text-gray-700">{SOPHIA_CALLS[c.id] ?? 0}</td>
                        <td className="py-2 pr-4 text-center text-gray-700">{HR_CALLS[c.id] ?? 0}</td>
                        <td className="py-2 pr-4 text-center text-gray-700">{MESSAGES[c.id] ?? 0}</td>
                        <td className="py-2 pr-4 text-center font-medium text-gray-700">{c.touchpoints}</td>
                        <td className="py-2 pr-4 text-center text-gray-500">{days}d</td>
                        <td className="py-2">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${
                              risk
                                ? 'bg-red-50 text-red-600 border border-red-100'
                                : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full shrink-0 ${risk ? 'bg-red-400' : 'bg-emerald-400'}`}
                            />
                            {risk ? 'At Risk' : 'On Track'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* ── Row 5: Stage velocity + Recruiter activity ── */}
          <div className="grid grid-cols-2 gap-3">

            {/* Stage velocity */}
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
              <p className="text-xs font-semibold text-gray-500 mb-1">Stage Velocity</p>
              <p className="text-[10px] text-gray-400 mb-3">Average days candidates have been in each stage</p>
              <ResponsiveContainer width="100%" height={145}>
                <BarChart data={velocityData} layout="vertical" margin={{ top: 0, right: 28, left: 4, bottom: 0 }} barCategoryGap="30%">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} unit="d" />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} width={68} />
                  <Tooltip contentStyle={TT} formatter={(v) => [`${v} days`, 'Avg in stage']} />
                  <Bar dataKey="days" radius={[0, 4, 4, 0]}>
                    {velocityData.map(d => <Cell key={d.name} fill={d.fill} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Recruiter activity breakdown */}
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
              <p className="text-xs font-semibold text-gray-500 mb-1">Recruiter Activity</p>
              <p className="text-[10px] text-gray-400 mb-3">Interaction types per recruiter across their cases</p>
              <ResponsiveContainer width="100%" height={145}>
                <BarChart data={recruiterActivity} margin={{ top: 4, right: 8, left: -20, bottom: 0 }} barCategoryGap="35%">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip contentStyle={TT} cursor={{ fill: '#f9fafb' }} />
                  <Legend iconSize={8} wrapperStyle={{ fontSize: '10px' }} />
                  <Bar dataKey="sophia"   name="Sophia Calls" stackId="a" fill="#818cf8" />
                  <Bar dataKey="hr"       name="HR Calls"     stackId="a" fill="#34d399" />
                  <Bar dataKey="messages" name="Messages"     stackId="a" fill="#f59e0b" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
