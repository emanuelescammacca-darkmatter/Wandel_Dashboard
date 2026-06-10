import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { CARD_GRADIENT } from '../constants/theme';
import wandelLogo from '../assets/wandel-logo.png';

/* ──────────────────────────────────────────────────────────────────────────
   Client-facing recruiting dashboard — Design v4.
   Three structural zones: dark header band · white main · off-white right rail.
   ────────────────────────────────────────────────────────────────────────── */

// Current hero metrics (single snapshot — no week switching).
const HERO_METRICS = { active: '3', growth: '24', growthDelta: '+5', ready: '3' };

/* Channel registry — abbreviations + node colors shared across the page. */
const CHANNELS = {
  sophia: { abbr: 'So', name: 'Sophia', color: '#4f46e5' },
  whatsapp: { abbr: 'WA', name: 'WhatsApp', color: '#16a34a' },
  instagram: { abbr: 'IG', name: 'Instagram', color: '#ec4899' },
  facebook: { abbr: 'FB', name: 'Facebook', color: '#2563eb' },
  metaads: { abbr: 'MA', name: 'Meta Ads', color: '#f97316' },
} as const;
type ChannelKey = keyof typeof CHANNELS;
const CHANNEL_ORDER: ChannelKey[] = ['sophia', 'whatsapp', 'instagram', 'facebook', 'metaads'];

const FUNNEL_STAGES = [
  { key: 'contacted', label: 'Contacted', color: '#e0e7ff', text: '#3730a3' },
  { key: 'responded', label: 'Responded', color: '#a5b4fc', text: '#312e81' },
  { key: 'qualified', label: 'Qualified', color: '#6366f1', text: '#ffffff' },
  { key: 'interview', label: 'Interview Ready', color: '#4338ca', text: '#ffffff' },
] as const;

type Pos = {
  title: string;
  status: 'Open' | 'On Hold' | 'Filled';
  qualified: number;
  total: number;
  earliestStart: string;
  avgFit: string;
  funnel: [number, number, number, number]; // contacted, responded, qualified, interview
  channels: Record<ChannelKey, [number, number]>; // [contacted, responses]
};

/* Where each position's "Review candidates" link jumps to. Falls back to the
   shared position workspace for positions without a dedicated route. */
const POSITION_PATH: Record<string, string> = {
  'Servicetechniker für Kaffeeautomaten': '/clients/positions',
  Lagerlogistiker: '/clients/positions-2',
};
const positionPath = (title: string) => POSITION_PATH[title] ?? '/clients/positions';

const POSITIONS: Pos[] = [
  {
    title: 'Servicetechniker für Kaffeeautomaten', status: 'Open',
    qualified: 3, total: 21, earliestStart: 'May 2026', avgFit: '84%',
    funnel: [90, 30, 8, 3],
    channels: { sophia: [18, 7], whatsapp: [12, 9], instagram: [22, 5], facebook: [8, 3], metaads: [30, 6] },
  },
  {
    title: 'Lagerlogistiker', status: 'Open',
    qualified: 3, total: 16, earliestStart: 'May 2026', avgFit: '81%',
    funnel: [65, 24, 8, 3],
    channels: { sophia: [14, 6], whatsapp: [10, 8], instagram: [16, 4], facebook: [6, 2], metaads: [20, 5] },
  },
  {
    title: 'Bürokauffrau', status: 'Open',
    qualified: 2, total: 12, earliestStart: 'Jun 2026', avgFit: '77%',
    funnel: [48, 16, 5, 1],
    channels: { sophia: [10, 3], whatsapp: [8, 5], instagram: [12, 3], facebook: [4, 1], metaads: [15, 4] },
  },
];

/* Pipeline-pulse metrics — an alternative card body keyed by position title.
   Positions listed here render the "ready to interview + pipeline + this week"
   layout instead of the default qualified/funnel/channel layout. */
type PulseStage = { label: string; value: number; color: string; text: string };
type PulseEvent = { kind: 'add' | 'up' | 'drop'; delta: string; text: string };
type PulseData = { readyToInterview: number; pipeline: PulseStage[]; thisWeek: PulseEvent[] };
const PULSE_BY_TITLE: Record<string, PulseData> = {
  Lagerlogistiker: {
    readyToInterview: 3,
    pipeline: [
      { label: 'Sourcing', value: 11, color: '#a5b4fc', text: '#1e1b4b' },
      { label: 'Screening', value: 4, color: '#818cf8', text: '#ffffff' },
      { label: 'Ready', value: 3, color: '#4f46e5', text: '#ffffff' },
    ],
    thisWeek: [
      { kind: 'add', delta: '+6', text: 'new candidates contacted' },
      { kind: 'up', delta: '+2', text: 'advanced to interview-ready' },
      { kind: 'drop', delta: '1', text: 'dropped — salary expectation' },
    ],
  },
};

/* Rich "focus" card data keyed by position title — a smooth pipeline funnel plus a
   ranked candidate highlight list. Positions listed here render PositionFocusCard. */
type FocusStage = { label: string; value: number; delta: string }; // resolved for a week
// Per-stage value history across the last weeks (oldest → newest, newest = current week).
type FocusFunnelStage = { label: string; history: number[] };
type FocusTag = { kind: 'interview' | 'ready' | 'screening' | 'new'; text: string };
type FocusCand = { id: string; name: string; tag: FocusTag; location: string; date: string; salary: string; score: number; color: string };
type FocusData = {
  total: number; qualified: number; status: string;
  funnel: [FocusFunnelStage, FocusFunnelStage, FocusFunnelStage];
  candidates: FocusCand[];
  initialCount: number;
};
const FOCUS_BY_TITLE: Record<string, FocusData> = {
  'Servicetechniker für Kaffeeautomaten': {
    total: 30, qualified: 10, status: 'Active',
    // Sourcing: applied across channels · Screening: in active exchange · Matched: fit confirmed.
    // history: KW19 → KW23 (newest last); value + week-over-week delta derive from the selected week.
    funnel: [
      { label: 'Sourcing', history: [10, 12, 15, 19, 26] },
      { label: 'Screening', history: [4, 5, 6, 7, 10] },
      { label: 'Matched', history: [1, 1, 2, 2, 3] },
    ],
    initialCount: 3,
    // 3 matched (top of the list) + 2 in screening — tags reflect the stage.
    candidates: [
      { id: '1', name: 'Markus Köhler', tag: { kind: 'interview', text: 'Interview Mo 10:00' }, location: 'Hofheim', date: '15.05.', salary: '€ 3.400', score: 92, color: '#16a34a' },
      { id: '2', name: 'Andreas Klein', tag: { kind: 'interview', text: 'Interview Di 14:30' }, location: 'Wiesbaden', date: '01.06.', salary: '€ 3.300', score: 87, color: '#7c3aed' },
      { id: '3', name: 'Sven Richter', tag: { kind: 'ready', text: 'Matched' }, location: 'Mainz', date: '15.05.', salary: '€ 3.500', score: 84, color: '#0891b2' },
      { id: '4', name: 'Daniel Schmidt', tag: { kind: 'screening', text: 'In screening' }, location: 'Darmstadt', date: '01.07.', salary: '€ 3.600', score: 79, color: '#4f46e5' },
      { id: '5', name: 'Thomas Bauer', tag: { kind: 'screening', text: 'In screening' }, location: 'Rüsselsheim', date: '15.05.', salary: '€ 3.200', score: 76, color: '#dc2626' },
    ],
  },
  'Lagerlogistiker': {
    total: 19, qualified: 6, status: 'Active',
    funnel: [
      { label: 'Sourcing', history: [6, 9, 11, 12, 16] },
      { label: 'Screening', history: [2, 3, 3, 4, 6] },
      { label: 'Matched', history: [0, 1, 1, 1, 3] },
    ],
    initialCount: 3,
    candidates: [
      { id: '7', name: 'Klaus Müller', tag: { kind: 'interview', text: 'Interview Mi 09:00' }, location: 'Hamburg', date: '20.05.', salary: '€ 3.600', score: 91, color: '#0891b2' },
      { id: '5', name: 'Thomas Bauer', tag: { kind: 'ready', text: 'Matched' }, location: 'Rüsselsheim', date: '01.06.', salary: '€ 3.200', score: 78, color: '#0369a1' },
      { id: '4', name: 'Stefan Vogel', tag: { kind: 'ready', text: 'Matched' }, location: 'Frankfurt', date: '15.06.', salary: '€ 3.100', score: 74, color: '#4f46e5' },
      { id: '6', name: 'Mehmet Yıldız', tag: { kind: 'screening', text: 'In screening' }, location: 'Offenbach', date: '01.07.', salary: '€ 3.000', score: 70, color: '#7c3aed' },
    ],
  },
  'Bürokauffrau': {
    total: 12, qualified: 4, status: 'Active',
    funnel: [
      { label: 'Sourcing', history: [4, 5, 6, 7, 10] },
      { label: 'Screening', history: [1, 2, 2, 3, 4] },
      { label: 'Matched', history: [0, 0, 1, 1, 2] },
    ],
    initialCount: 3,
    candidates: [
      { id: '8', name: 'Sarah Klein', tag: { kind: 'interview', text: 'Interview Do 11:00' }, location: 'Wiesbaden', date: '18.05.', salary: '€ 2.900', score: 81, color: '#7c3aed' },
      { id: '3', name: 'Elena Hoffmann', tag: { kind: 'ready', text: 'Matched' }, location: 'Frankfurt', date: '01.07.', salary: '€ 2.800', score: 76, color: '#be185d' },
      { id: '6', name: 'Lisa Wagner', tag: { kind: 'screening', text: 'In screening' }, location: 'Mainz', date: '15.07.', salary: '€ 2.950', score: 72, color: '#4f46e5' },
    ],
  },
};
/* Largest funnel value across all positions — the funnel heights are scaled to
   this shared max so each position's funnel is proportional to the real numbers
   (tallest reaches the max height, smaller positions are visibly shorter). */
const FUNNEL_HISTORY = 5; // weeks stored per funnel stage (history drives the deltas)
// Scale funnel heights to the largest value across all positions, so each
// position's funnel is proportional to the real numbers.
const FUNNEL_VALUE_MAX = Math.max(...Object.values(FOCUS_BY_TITLE).flatMap(d => d.funnel.flatMap(s => s.history)));

/* Resolve a position's funnel to current stage values + week-over-week deltas. */
function resolveFunnel(funnel: FocusFunnelStage[]): FocusStage[] {
  const idx = FUNNEL_HISTORY - 1;
  return funnel.map(s => {
    const value = s.history[idx];
    const d = value - (s.history[idx - 1] ?? value);
    return { label: s.label, value, delta: `${d >= 0 ? '+' : ''}${d}` };
  });
}

/* Match-reasoning candidate model: instead of a bare fit score, each card shows
   the concrete criteria a candidate meets ('yes') or only partially meets
   ('partial'), data-driven from Sophia answers vs. the job requirements. */
type MatchStatus = 'yes' | 'partial';
type MatchCriterion = { label: string; value?: string; status: MatchStatus };
export type Cand = {
  id: string;
  name: string; position: string;
  location: string; distance: string;
  fitPct: number; available: string; color: string;
  criteria: MatchCriterion[];
};

const CANDIDATES: Cand[] = [
  {
    id: '2', name: 'Andi Kufner', position: 'Servicetechniker für Kaffeeautomaten',
    location: 'Hofheim', distance: '23 km', fitPct: 87, available: 'May 2026', color: '#4f46e5',
    criteria: [
      { label: 'DGUV V3 certified', status: 'yes' },
      { label: 'Field service experience', value: '8 yrs', status: 'yes' },
      { label: 'Within commute', value: '23 km', status: 'yes' },
      { label: 'Salary above range', value: '+200 €', status: 'partial' },
    ],
  },
  {
    id: '7', name: 'Klaus Müller', position: 'Lagerlogistiker',
    location: 'Hamburg', distance: '8 km', fitPct: 91, available: 'now', color: '#0891b2',
    criteria: [
      { label: 'Forklift certified', status: 'yes' },
      { label: 'Warehouse coordinator role', value: '12 yrs', status: 'yes' },
      { label: 'Salary within range', value: '3.600 €', status: 'yes' },
      { label: 'Shift flexibility', status: 'yes' },
    ],
  },
  {
    id: '1', name: 'Lukas Schneider', position: 'Servicetechniker für Kaffeeautomaten',
    location: 'Frankfurt', distance: '31 km', fitPct: 79, available: 'June 2026', color: '#16a34a',
    criteria: [
      { label: 'DGUV V3 certified', status: 'yes' },
      { label: 'Field service experience', value: '5 yrs', status: 'yes' },
      { label: 'Within commute', value: '31 km', status: 'partial' },
      { label: 'Salary within range', value: '3.200 €', status: 'yes' },
    ],
  },
  {
    id: '4', name: 'Mateusz Nowak', position: 'Servicetechniker für Kaffeeautomaten',
    location: 'Offenbach', distance: '18 km', fitPct: 76, available: 'June 2026', color: '#d97706',
    criteria: [
      { label: 'Electrical background', value: '6 yrs', status: 'yes' },
      { label: 'DGUV V3 certification', value: 'in progress', status: 'partial' },
      { label: 'Within commute', value: '18 km', status: 'yes' },
      { label: 'Salary within range', value: '3.300 €', status: 'yes' },
    ],
  },
];

const CANDIDATES_MORE: Cand[] = [
  {
    id: '8', name: 'Sarah Klein', position: 'Bürokauffrau',
    location: 'Wiesbaden', distance: '12 km', fitPct: 74, available: 'Jul 2026', color: '#7c3aed',
    criteria: [
      { label: 'Commercial training', status: 'yes' },
      { label: 'MS-Office proficient', status: 'yes' },
      { label: 'German C1', status: 'yes' },
      { label: 'Experience', value: '4 yrs', status: 'partial' },
    ],
  },
  {
    id: '5', name: 'Thomas Bauer', position: 'Lagerlogistiker',
    location: 'Rüsselsheim', distance: '9 km', fitPct: 71, available: 'Jun 2026', color: '#0369a1',
    criteria: [
      { label: 'Forklift certified', status: 'yes' },
      { label: 'Logistics experience', value: '7 yrs', status: 'yes' },
      { label: 'Within commute', value: '9 km', status: 'yes' },
      { label: 'Shift flexibility', status: 'partial' },
    ],
  },
  {
    id: '3', name: 'Elena Hoffmann', position: 'Bürokauffrau',
    location: 'Frankfurt', distance: '6 km', fitPct: 68, available: 'Aug 2026', color: '#be185d',
    criteria: [
      { label: 'Commercial training', status: 'yes' },
      { label: 'English & German fluent', status: 'yes' },
      { label: 'MS-Office proficient', status: 'partial' },
      { label: 'Experience', value: '3 yrs', status: 'partial' },
    ],
  },
  {
    id: '6', name: 'Jürgen Stein', position: 'Servicetechniker für Kaffeeautomaten',
    location: 'Darmstadt', distance: '27 km', fitPct: 65, available: 'Jul 2026', color: '#b45309',
    criteria: [
      { label: 'Field service experience', value: '9 yrs', status: 'yes' },
      { label: 'DGUV V3 certified', status: 'yes' },
      { label: 'Within commute', value: '27 km', status: 'partial' },
      { label: 'Salary above range', value: '+150 €', status: 'partial' },
    ],
  },
];

const initials = (n: string) => n.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

const SCROLL_ROW = 'flex gap-5 overflow-x-auto pb-3 [&::-webkit-scrollbar]:hidden';

/* ── Section label (L0 + full-width rule) ── */
function SectionLabel({ children, trailing }: { children: React.ReactNode; trailing?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-4 mb-5">
      <span className="text-[22px] font-bold tracking-tight text-white whitespace-nowrap">{children}</span>
      {trailing}
      <span className="flex-1 h-px bg-white/10" />
    </div>
  );
}

/* ── Dark hover tooltips (appear above anchor, caret below) ── */
function Tip({ children }: { children: React.ReactNode }) {
  return (
    <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-20 whitespace-nowrap">
      <div className="rounded-md bg-[#0f172a] text-white px-2.5 py-1.5 text-[11px] leading-snug">{children}</div>
      <span className="absolute left-1/2 -translate-x-1/2 top-full -mt-1 w-2 h-2 rotate-45 bg-[#0f172a]" />
    </div>
  );
}
function ChannelTip({ name, contacted, responses }: { name: string; contacted: number; responses: number }) {
  return (
    <Tip>
      <p className="font-semibold">{name}</p>
      <p className="text-[#94a3b8]">{contacted} candidates contacted</p>
      <p className="text-[#94a3b8]">{responses} responses</p>
    </Tip>
  );
}

/* Meta Ads logo: load the canonical mark from the Simple Icons CDN (whitened),
   falling back to the genuine inline Meta infinity path if the CDN is unreachable. */
function MetaLogo() {
  const [err, setErr] = useState(false);
  return (
    <div className="w-13 h-13 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: '#0081FB', overflow: 'hidden' }}>
      {err ? (
        <svg className="w-7 h-7" viewBox="0 0 24 24" fill="#fff"><path d="M6.915 4.03c-1.968 0-3.683 1.28-4.871 3.113C.704 9.208 0 11.883 0 14.449c0 .706.07 1.369.21 1.973a6.624 6.624 0 00.265.86 5.297 5.297 0 00.371.761c.696 1.159 1.818 1.927 3.593 1.927 1.497 0 2.633-.671 3.965-2.444.76-1.012 1.144-1.626 2.663-4.32l.756-1.339.186-.325c.061.1.121.196.183.3l2.152 3.595c.724 1.21 1.665 2.556 2.47 3.314 1.046.987 1.992 1.22 3.06 1.22 1.075 0 1.876-.355 2.455-.843a3.743 3.743 0 00.81-.973c.542-.939.861-2.127.861-3.745 0-2.72-.681-5.357-2.084-7.45-1.282-1.912-2.957-2.93-4.716-2.93-1.047 0-2.088.467-3.053 1.308-.652.57-1.257 1.29-1.82 2.05-.69-.875-1.335-1.547-1.958-2.056-1.182-.966-2.315-1.303-3.45-1.303zm10.96 2.6c1.146 0 2.064.769 2.811 1.86 1.142 1.668 1.657 4.058 1.657 6.243 0 1.265-.211 2.198-.626 2.78-.243.341-.561.527-.879.527-.583 0-1.012-.297-1.605-1.018-.738-.897-1.482-2.057-2.117-3.18l-1.06-1.787-.108-.18c.45-.79.901-1.563 1.353-2.296.682-1.107 1.426-2.247 2.144-2.91.327-.301.687-.539 1.073-.638a1.45 1.45 0 01.299-.052zm-11.06.073c.69 0 1.4.32 2.18.953.61.495 1.207 1.166 1.823 2.012a37.84 37.84 0 00-1.349 2.114c-.567.945-1.122 1.85-1.65 2.658-.91 1.391-1.495 2.06-2.18 2.658-.749.654-1.467.918-2.012.918-.57 0-1.005-.265-1.351-.659-.46-.523-.789-1.448-.789-2.66 0-1.974.624-4.244 1.66-5.881.793-1.252 1.823-2.06 2.7-2.06.359 0 .719.085 1.118.26z" /></svg>
      ) : (
        <img src="https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/meta.svg" width={28} height={28} alt="Meta" style={{ filter: 'brightness(0) invert(1)' }} onError={() => setErr(true)} />
      )}
    </div>
  );
}

/* ── Brand logos for the Outreach section ── */
/* Size-parameterized brand logo: renders the 52px artwork scaled to `size`. */
function OutreachLogo({ k, size = 52 }: { k: ChannelKey; size?: number }) {
  if (size === 52) return <OutreachLogoBase k={k} />;
  return (
    <div className="shrink-0 flex items-center justify-center" style={{ width: size, height: size }}>
      <div style={{ transform: `scale(${size / 52})`, transformOrigin: 'center' }}>
        <OutreachLogoBase k={k} />
      </div>
    </div>
  );
}

function OutreachLogoBase({ k }: { k: ChannelKey }) {
  const base = 'w-13 h-13 rounded-full flex items-center justify-center shrink-0';
  const icon = 'w-6 h-6';
  switch (k) {
    case 'sophia':
      return (
        <div className={base} style={{ background: '#4f46e5' }}>
          <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="#fff">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M12 3l1.8 4.2L18 9l-4.2 1.8L12 15l-1.8-4.2L6 9l4.2-1.8L12 3z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M18 14l.9 2.1L21 17l-2.1.9L18 20l-.9-2.1L15 17l2.1-.9L18 14z" />
          </svg>
        </div>
      );
    case 'whatsapp':
      return (
        <div className={base} style={{ background: '#25D366' }}>
          <svg className={icon} viewBox="0 0 24 24" fill="#fff"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.71.306 1.263.489 1.694.625.712.227 1.36.195 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.002-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
        </div>
      );
    case 'instagram':
      return (
        <div className={base} style={{ background: 'radial-gradient(circle at 30% 107%, #fdf497 0%, #fdf497 5%, #fd5949 45%, #d6249f 60%, #285AEB 90%)' }}>
          <svg className={icon} viewBox="0 0 24 24" fill="#fff"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" /></svg>
        </div>
      );
    case 'facebook':
      return (
        <div className={base} style={{ background: '#1877F2', overflow: 'hidden' }}>
          {/* Same Facebook glyph as the sidebar (Icons.facebook), white at 29px */}
          <svg width="29" height="29" viewBox="0 0 24 24" fill="#fff"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h4l1-4h-5V7a1 1 0 0 1 1-1h3z" /></svg>
        </div>
      );
    case 'metaads':
      return <MetaLogo />;
  }
}

/* SOPHIA CUSTOM LOGO BLOCK: drop the real image into  public/sophia-logo.png
   (52×52+ square, it is cropped circular). Until then this falls back to the
   indigo sparkle mark instead of a broken-image icon. */
function SophiaImageLogo() {
  const [err, setErr] = useState(false);
  if (err) return <OutreachLogo k="sophia" />;
  return (
    <div className="w-13 h-13 rounded-full shrink-0 overflow-hidden" style={{ border: '2px solid #e0e7ff' }}>
      <img src="/sophia_avatar.png" alt="Sophia AI" onError={() => setErr(true)} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 20%' }} />
    </div>
  );
}

/* Sophia as the central funnel hub: the full Sophia AI node block (avatar + label,
   same as the bottom handler), but with the Wandel node's indigo→violet→cyan
   gradient border + glow in place of the plain hairline border. */
function SophiaHub() {
  return (
    <div className="p-[2px] rounded-xl bg-gradient-to-br from-indigo-400 via-violet-400 to-cyan-300 shrink-0 shadow-[0_0_22px_rgba(129,140,248,0.4)]">
      <div
        style={{ width: 112, height: 100 }}
        className="rounded-[10px] bg-[#111a3c] flex flex-col items-center justify-center gap-1.5 text-center px-1.5"
      >
        <SophiaImageLogo />
        <p className="text-[11px] font-semibold text-white leading-tight">Sophia AI</p>
      </div>
    </div>
  );
}

/* HR Team — teal badge carrying the Wandel mark (distinct from the channels). */
function HRLogo() {
  return (
    <div className="w-13 h-13 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: '#0f766e', overflow: 'hidden' }}>
      <span
        role="img"
        aria-label="Wandel"
        className="inline-block shrink-0"
        style={{
          width: 30,
          height: 30,
          backgroundImage: `url(${wandelLogo})`,
          backgroundRepeat: 'no-repeat',
          backgroundSize: '43.35px 43.35px',
          backgroundPosition: '-6.9px -3.6px',
          filter: 'brightness(0) invert(1)',
        }}
      />
    </div>
  );
}

/* Match-criterion marker: green check (met) or amber dash (partial). */
function CriterionIcon({ status }: { status: MatchStatus }) {
  if (status === 'yes') {
    return (
      <span className="w-[18px] h-[18px] rounded-md bg-[#dcfce7] text-[#16a34a] flex items-center justify-center shrink-0">
        <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round"><path d="M5 13l4 4L19 7" /></svg>
      </span>
    );
  }
  return (
    <span className="w-[18px] h-[18px] rounded-md bg-[#fef3c7] text-[#d97706] flex items-center justify-center shrink-0">
      <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round"><path d="M6 12h12" /></svg>
    </span>
  );
}

/* ── Candidate card — match-reasoning layout (white). Shows which job criteria
   the candidate meets, the fit score, availability, and links to the profile. ── */
const POSITION_TAG_CLS: Record<string, string> = {
  'Servicetechniker für Kaffeeautomaten': 'text-[#4338ca] bg-[#eef2ff] border-[#c7d2fe]',
  Lagerlogistiker: 'text-[#0e7490] bg-[#ecfeff] border-[#a5f3fc]',
  Bürokauffrau: 'text-[#6d28d9] bg-[#f5f3ff] border-[#ddd6fe]',
};

function BriefcaseIcon() {
  return (
    <svg className="w-3 h-3 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <rect x={3} y={7} width={18} height={13} rx={2} /><path d="M8 7V5a2 2 0 012-2h4a2 2 0 012 2v2M3 12h18" />
    </svg>
  );
}

export function CandidateCard({ c, selectable = false, selected = false, onToggle, fullWidth = false }: { c: Cand; selectable?: boolean; selected?: boolean; onToggle?: () => void; fullWidth?: boolean }) {
  const navigate = useNavigate();
  const go = () => navigate(`/clients/positions/candidate/${c.id}`);
  const tagCls = POSITION_TAG_CLS[c.position] ?? 'text-[#475569] bg-[#f1f5f9] border-[#e2e8f0]';
  return (
    <div
      onClick={selectable ? onToggle : go}
      className={`relative rounded-2xl border bg-white flex flex-col cursor-pointer transition-all duration-200 hover:-translate-y-[3px] hover:shadow-[0_12px_30px_rgba(0,0,0,0.08)] ${fullWidth ? 'w-full' : 'shrink-0'} ${selected ? 'border-indigo-400 ring-2 ring-indigo-300' : 'border-[#e2e8f0] hover:border-[#c7d2fe]'}`}
      style={{ width: fullWidth ? '100%' : 'clamp(300px, 25vw, 380px)', minHeight: 248, padding: '18px 20px', scrollSnapAlign: 'start' }}
    >
      {/* selection checkbox (only in selectable mode) */}
      {selectable && (
        <span className={`absolute top-3.5 right-4 w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${selected ? 'bg-indigo-500 border-indigo-500 text-white' : 'bg-white border-gray-300 text-transparent'}`}>
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
        </span>
      )}
      {/* position tag */}
      <div className={`mb-3 ${selectable ? 'pr-7' : ''}`}>
        <span className={`inline-flex items-center gap-1.5 max-w-full text-[11px] font-semibold rounded-full border px-2.5 py-1 ${tagCls}`}>
          <BriefcaseIcon /><span className="truncate">{c.position}</span>
        </span>
      </div>

      {/* header: avatar · name/location · fit */}
      <div className="flex items-start gap-3">
        <div className="w-11 h-11 rounded-full flex items-center justify-center text-white text-[14px] font-semibold shrink-0" style={{ background: c.color }}>{initials(c.name)}</div>
        <div className="min-w-0 flex-1">
          <p className="text-[16px] font-semibold text-[#0f172a] leading-tight truncate" title={c.name}>{c.name}</p>
          <p className="mt-1 flex items-center gap-1 text-[12px] text-[#94a3b8]"><PinIcon />{c.location} · {c.distance}</p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-[26px] font-bold text-[#0f172a] leading-none tabular-nums">{c.fitPct}%</p>
          <p className="text-[10px] uppercase tracking-[0.12em] text-[#94a3b8] mt-1">fit</p>
        </div>
      </div>

      {/* match criteria */}
      <div className="mt-4 flex flex-col gap-2.5">
        {c.criteria.map(cr => (
          <div key={cr.label} className="flex items-center gap-2.5">
            <CriterionIcon status={cr.status} />
            <span className="text-[13px] text-[#334155] flex-1 min-w-0 truncate">{cr.label}</span>
            {cr.value && <span className="text-[13px] font-semibold text-[#0f172a] tabular-nums shrink-0">{cr.value}</span>}
          </div>
        ))}
      </div>

      {/* footer: availability */}
      <div className="mt-auto pt-4 flex items-center">
        <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-[#4338ca] bg-[#eef2ff] border border-[#c7d2fe] rounded-full px-2.5 py-1">
          <CalIcon />Available {c.available}
        </span>
      </div>
    </div>
  );
}

/* All candidates (top + extra), used to match a position to its candidates. */
export const ALL_CANDIDATES = [...CANDIDATES, ...CANDIDATES_MORE];

/* ── Inner position content (no card chrome) — reused by the collapsed card
   and as the left column of the expanded full-width card. ── */
function PositionDetails({ p, phase = 0 }: { p: Pos; phase?: number }) {
  const navigate = useNavigate();
  const pulse = PULSE_BY_TITLE[p.title];
  const focus = FOCUS_BY_TITLE[p.title];
  const goToPosition = (e: React.MouseEvent) => { e.preventDefault(); e.stopPropagation(); navigate(positionPath(p.title)); };

  if (focus) {
    return (
      <div className="flex flex-col h-full">
        <FocusSummary title={p.title} d={focus} phase={phase} />
        <div className="mt-auto pt-3 flex justify-end">
          <a href="#" onClick={goToPosition} className="text-[12px] font-medium text-[#4f46e5] no-underline rounded-lg px-3 py-1.5 border border-transparent transition-colors hover:bg-white/70 hover:border-[#e6e9f3] hover:shadow-sm">Review candidates →</a>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Section 1 — header */}
      <div className="flex items-center justify-between gap-3 pr-6">
        <h3 className="text-[14px] font-semibold text-[#0f172a] truncate" title={p.title}>{p.title}</h3>
        <span className="shrink-0 text-[11px] rounded-full px-2 py-0.5 text-[#16a34a] bg-[#f0fdf4] border border-[#bbf7d0]">{p.status}</span>
      </div>

      {pulse ? (
        <PositionPulseBody d={pulse} />
      ) : (
        <>
          {/* Section 2 — key metric */}
          <div className="mt-3.5">
            <p className="text-[30px] font-bold text-[#0f172a] leading-none">{p.qualified}</p>
            <p className="text-[12px] text-[#64748b] mt-1.5">qualified candidates</p>
          </div>

          {/* Section 3 — metadata chips */}
          <div className="mt-3 flex w-full rounded-md bg-[#f8fafc]">
            {[
              { label: 'Total Candidates', value: `${p.total} total` },
              { label: 'Earliest Start', value: p.earliestStart },
              { label: 'Avg. Fit Score', value: p.avgFit },
            ].map((m, i) => (
              <div key={m.label} className="flex flex-1">
                {i > 0 && <span className="w-px bg-[#e2e8f0] my-1.5" />}
                <div className="flex-1 text-center" style={{ padding: '6px 0' }}>
                  <p className="text-[9px] uppercase tracking-wide text-[#94a3b8]">{m.label}</p>
                  <p className="text-[12px] font-semibold text-[#0f172a] mt-0.5">{m.value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Section 4 — recruitment funnel */}
          <div className="mt-4">
            <p className="text-[9px] uppercase tracking-[0.08em] text-[#94a3b8] mb-1.5">Recruitment Funnel</p>
            <div className="flex items-stretch">
              {FUNNEL_STAGES.map((s, i) => {
                const val = p.funnel[i];
                return (
                  <div key={s.key} className="relative group flex flex-col items-center" style={{ flexGrow: val, flexBasis: 0, minWidth: 56 }}>
                    <div className="w-full flex items-center justify-center" style={{ height: 36, background: s.color, color: s.text, clipPath: 'polygon(0 0, 100% 8%, 100% 92%, 0 100%)' }}>
                      <span className="text-[12px] font-bold">{val}</span>
                    </div>
                    <p className="text-[9px] text-[#94a3b8] mt-1 text-center leading-tight">{s.label}</p>
                    <Tip>{val} candidates at this stage</Tip>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 5 — channel nodes (real brand logos, matching the Outreach section) */}
          <div className="mt-3.5 flex justify-between">
            {CHANNEL_ORDER.map(key => {
              const ch = CHANNELS[key];
              const [contacted, responses] = p.channels[key];
              return (
                <div key={key} className="flex flex-col items-center gap-1.5">
                  <div className="relative group">
                    <OutreachLogo k={key} size={36} />
                    <ChannelTip name={ch.name} contacted={contacted} responses={responses} />
                  </div>
                  <span className="text-[9px] text-[#94a3b8]">{ch.name}</span>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Section 6 — footer */}
      <div className="mt-auto pt-2.5 flex justify-end">
        <a href="#" onClick={goToPosition} className="text-[12px] font-medium text-[#4f46e5] no-underline rounded-lg px-3 py-1.5 border border-transparent transition-colors hover:bg-white/70 hover:border-[#e6e9f3] hover:shadow-sm">
          {pulse ? 'Review candidates →' : 'View position →'}
        </a>
      </div>
    </div>
  );
}

/* ── Collapsed, clickable position card (default row + below row). ── */
function PositionCard({ p, onSelect, fullWidth = false }: { p: Pos; onSelect?: () => void; fullWidth?: boolean }) {
  return (
    <div
      onClick={onSelect}
      className="rounded-[10px] border border-[#e2e8f0] flex flex-col shrink-0 cursor-pointer transition-all duration-200 hover:-translate-y-[3px] hover:border-[#c7d2fe] hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)]"
      style={{ width: fullWidth ? '100%' : 'clamp(360px, 30vw, 460px)', padding: '16px 18px 12px', scrollSnapAlign: 'start', background: CARD_GRADIENT }}
    >
      <PositionDetails p={p} />
    </div>
  );
}

/* ── Filterable statistics ───────────────────────────────────────────────────
   Every block in the Statistics section (weekly activity, drop-off diagnostics,
   locations map) can be filtered by position. 'all' is the aggregate view. */
type StatKey = 'all' | 'service' | 'lager' | 'buero';
const STAT_FILTERS: { key: StatKey; label: string }[] = [
  { key: 'all', label: 'All positions' },
  { key: 'service', label: 'Servicetechniker' },
  { key: 'lager', label: 'Lagerlogistiker' },
  { key: 'buero', label: 'Bürokauffrau' },
];

/* Weekly activity stats with a 10-week trend history. The selected calendar week
   (from the hero) slides a 7-week window over this history, so the headline value,
   the week-over-week delta and the sparkline all shift consistently. Index 9 is
   the current week (KW 23); each step back maps to KW 22 / 21 / 20. */
type ActivityKind = 'mail' | 'phone' | 'funnel' | 'star';
type ActivityStat = { icon: ActivityKind; label: string; trend: number[] };
const WEEKLY_ACTIVITY_BY: Record<StatKey, ActivityStat[]> = {
  all: [
    { icon: 'mail', label: 'candidates contacted', trend: [15, 18, 20, 22, 28, 25, 31, 29, 35, 47] },
    { icon: 'phone', label: 'Sophia calls completed', trend: [6, 7, 8, 9, 11, 10, 13, 12, 14, 18] },
    { icon: 'funnel', label: 'advanced to screening', trend: [4, 5, 5, 6, 7, 7, 8, 9, 9, 12] },
    { icon: 'star', label: 'became interview-ready', trend: [1, 0, 1, 1, 1, 2, 1, 2, 1, 3] },
  ],
  service: [
    { icon: 'mail', label: 'candidates contacted', trend: [6, 8, 9, 9, 12, 10, 13, 12, 15, 20] },
    { icon: 'phone', label: 'Sophia calls completed', trend: [2, 3, 3, 4, 5, 4, 6, 5, 6, 8] },
    { icon: 'funnel', label: 'advanced to screening', trend: [1, 2, 2, 2, 3, 3, 3, 4, 4, 5] },
    { icon: 'star', label: 'became interview-ready', trend: [0, 0, 1, 0, 1, 0, 1, 1, 0, 1] },
  ],
  lager: [
    { icon: 'mail', label: 'candidates contacted', trend: [5, 6, 6, 7, 9, 8, 10, 9, 11, 16] },
    { icon: 'phone', label: 'Sophia calls completed', trend: [2, 2, 3, 3, 4, 3, 5, 4, 5, 6] },
    { icon: 'funnel', label: 'advanced to screening', trend: [1, 1, 2, 2, 2, 3, 3, 3, 3, 4] },
    { icon: 'star', label: 'became interview-ready', trend: [0, 1, 0, 0, 1, 1, 0, 1, 0, 1] },
  ],
  buero: [
    { icon: 'mail', label: 'candidates contacted', trend: [3, 4, 5, 6, 7, 7, 8, 8, 9, 11] },
    { icon: 'phone', label: 'Sophia calls completed', trend: [1, 1, 2, 2, 2, 3, 2, 3, 3, 4] },
    { icon: 'funnel', label: 'advanced to screening', trend: [0, 1, 1, 1, 2, 2, 2, 2, 2, 3] },
    { icon: 'star', label: 'became interview-ready', trend: [0, 1, 1, 1, 0, 1, 0, 1, 1, 1] },
  ],
};
const ACTIVITY_HISTORY = 10;        // points stored per trend
const ACTIVITY_WINDOW = 7;          // points shown in the sparkline

/* Drop-off diagnostics: honest reasons candidates fall off, reframed into one
   concrete, actionable opportunity — per position. */
type DropOpportunity = { count: string; before: string; money?: string; after: string };
type DropOffData = { reasons: { label: string; pct: number }[]; opportunity: DropOpportunity };
const DROPOFF_BY: Record<StatKey, DropOffData> = {
  all: {
    reasons: [
      { label: 'Salary expectation gap', pct: 38 },
      { label: 'Location too far', pct: 24 },
      { label: 'Skill gap', pct: 18 },
      { label: 'Not interested', pct: 12 },
      { label: 'No response', pct: 8 },
    ],
    opportunity: { count: '8 candidates', before: 'would accept at', money: '+200€', after: 'above your current offer. Worth discussing your salary band.' },
  },
  service: {
    reasons: [
      { label: 'Salary expectation gap', pct: 42 },
      { label: 'Skill gap', pct: 22 },
      { label: 'Location too far', pct: 20 },
      { label: 'Not interested', pct: 10 },
      { label: 'No response', pct: 6 },
    ],
    opportunity: { count: '5 candidates', before: 'would accept at', money: '+250€', after: 'above your current offer for this role.' },
  },
  lager: {
    reasons: [
      { label: 'Location too far', pct: 34 },
      { label: 'Salary expectation gap', pct: 30 },
      { label: 'No response', pct: 16 },
      { label: 'Skill gap', pct: 12 },
      { label: 'Not interested', pct: 8 },
    ],
    opportunity: { count: '4 candidates', before: 'dropped on distance — a shuttle or relocation budget could re-engage them.', after: '' },
  },
  buero: {
    reasons: [
      { label: 'Salary expectation gap', pct: 36 },
      { label: 'Skill gap', pct: 26 },
      { label: 'Not interested', pct: 18 },
      { label: 'Location too far', pct: 12 },
      { label: 'No response', pct: 8 },
    ],
    opportunity: { count: '3 candidates', before: 'would re-engage with a clearer remote / hybrid arrangement.', after: '' },
  },
};

/* Candidate locations on a real geo map. Shared city coordinates; per-position
   counts pick a subset. 'all' is the full pipeline. */
const CITY_COORDS: Record<string, [number, number]> = {
  Frankfurt: [50.1109, 8.6821],
  Wiesbaden: [50.0782, 8.2398],
  Mainz: [49.9929, 8.2473],
  Darmstadt: [49.8728, 8.6512],
  Hofheim: [50.0876, 8.4490],
  Rüsselsheim: [49.9926, 8.4090],
  Offenbach: [50.0955, 8.7761],
  Hanau: [50.1273, 8.9183],
};
/* Candidate names per city — shown when hovering a map point (sliced to count).
   Each links to its profile via /clients/positions/candidate/:id. */
const CITY_CANDIDATES: Record<string, { name: string; id: string }[]> = {
  Frankfurt: [{ name: 'Markus Köhler', id: '1' }, { name: 'Lena Vogt', id: '2' }, { name: 'Daniel Schmidt', id: '4' }, { name: 'Aylin Kaya', id: '6' }, { name: 'Tobias Brandt', id: '3' }, { name: 'Sofia Russo', id: '5' }],
  Wiesbaden: [{ name: 'Andreas Klein', id: '2' }, { name: 'Petra Lang', id: '7' }, { name: 'Jan Hofmann', id: '3' }, { name: 'Mara Sommer', id: '8' }],
  Mainz: [{ name: 'Sven Richter', id: '3' }, { name: 'Nina Weber', id: '5' }, { name: 'Paul Adler', id: '1' }, { name: 'Kira Berg', id: '6' }],
  Darmstadt: [{ name: 'Daniel Schmidt', id: '4' }, { name: 'Hannah Roth', id: '7' }, { name: 'Felix Wolf', id: '2' }],
  Hofheim: [{ name: 'Markus Köhler', id: '1' }, { name: 'Jonas Pfeiffer', id: '6' }],
  Rüsselsheim: [{ name: 'Thomas Bauer', id: '5' }, { name: 'Ina Krüger', id: '8' }],
  Offenbach: [{ name: 'Erik Naumann', id: '4' }, { name: 'Cem Yıldız', id: '7' }],
  Hanau: [{ name: 'Greta Sommer', id: '8' }],
};
const CANDIDATE_LOCATIONS_BY: Record<StatKey, { city: string; count: number }[]> = {
  all: [
    { city: 'Frankfurt', count: 6 }, { city: 'Wiesbaden', count: 4 }, { city: 'Mainz', count: 4 },
    { city: 'Darmstadt', count: 3 }, { city: 'Hofheim', count: 2 }, { city: 'Rüsselsheim', count: 2 },
    { city: 'Offenbach', count: 2 }, { city: 'Hanau', count: 1 },
  ],
  service: [
    { city: 'Frankfurt', count: 4 }, { city: 'Darmstadt', count: 3 }, { city: 'Wiesbaden', count: 2 },
    { city: 'Hanau', count: 1 }, { city: 'Offenbach', count: 1 },
  ],
  lager: [
    { city: 'Frankfurt', count: 2 }, { city: 'Rüsselsheim', count: 2 }, { city: 'Mainz', count: 2 },
    { city: 'Wiesbaden', count: 1 }, { city: 'Hofheim', count: 1 },
  ],
  buero: [
    { city: 'Frankfurt', count: 3 }, { city: 'Wiesbaden', count: 2 }, { city: 'Mainz', count: 1 }, { city: 'Offenbach', count: 1 },
  ],
};

/* Resolve a filtered locations list into map-ready points (with coords + total). */
function locationsFor(key: StatKey) {
  const pts = CANDIDATE_LOCATIONS_BY[key].map(l => ({ ...l, lat: CITY_COORDS[l.city][0], lng: CITY_COORDS[l.city][1] }));
  return { pts, total: pts.reduce((a, l) => a + l.count, 0) };
}

/* ──────────────────────────────────────────────────────────────────────────
   Outreach Funnel — a flow-chart view of the same channels. Two ad-platform
   clusters feed the funnel: WhatsApp / Instagram / Facebook → Meta Ads, and
   Google Search / YouTube → Google Ads. Meta Ads, Google Ads and the job boards
   (LinkedIn, Indeed, Xing, Stepstone) all converge into the Sophia hub, which
   routes on to the HR Team. From HR, candidate cards stream down and are absorbed
   into the open-position nodes at the bottom. Fixed 1160×770 coordinate canvas: an
   SVG connector layer (smooth curves) behind absolutely-positioned nodes, with the
   candidate cards as an HTML/CSS layer below. The existing "Outreach Channels"
   section is left unchanged.
   ────────────────────────────────────────────────────────────────────────── */

/* Smooth vertical S-curve from (sx,sy) down to (ex,ey) — leaves and arrives vertically. */
const vCurve = (sx: number, sy: number, ex: number, ey: number) => {
  const k = Math.min(120, Math.max(30, Math.abs(ey - sy) * 0.5));
  return `M${sx} ${sy} C ${sx} ${sy + k} ${ex} ${ey - k} ${ex} ${ey}`;
};
/* One animation cycle (s): border-glow loop, signal travel, and hub pulse all share it. */
const FUNNEL_T = 3.4;

/* Generic circular brand badge: white Simple-Icons glyph on the brand colour.
   Falls back to an initials monogram when no slug is given (brand not in the icon
   set) or if the icon CDN is unreachable. Mirrors MetaLogo's CDN + fallback pattern. */
function BrandBadge({ slug, color, initials, size = 52 }: { slug?: string; color: string; initials: string; size?: number }) {
  const [err, setErr] = useState(false);
  const icon = Math.round(size * 0.52);
  return (
    <div className="rounded-full flex items-center justify-center shrink-0 overflow-hidden" style={{ width: size, height: size, background: color }}>
      {!slug || err ? (
        <span className="text-white font-bold" style={{ fontSize: Math.round(size * 0.32) }}>{initials}</span>
      ) : (
        <img
          src={`https://cdn.jsdelivr.net/npm/simple-icons@v13/icons/${slug}.svg`}
          width={icon} height={icon} alt={slug}
          style={{ filter: 'brightness(0) invert(1)' }}
          onError={() => setErr(true)}
        />
      )}
    </div>
  );
}

/* Stepstone — not in the icon set, so a custom badge with its three-stone mark. */
function StepstoneLogo({ size = 52 }: { size?: number }) {
  const glyph = Math.round(size * 0.62);
  return (
    <div className="rounded-full flex items-center justify-center shrink-0 overflow-hidden" style={{ width: size, height: size, background: '#0E5FD8' }}>
      <svg width={glyph} height={glyph} viewBox="0 0 24 24" fill="#fff" aria-label="Stepstone">
        <ellipse cx="12" cy="7.5" rx="4.4" ry="3.2" />
        <ellipse cx="7.3" cy="15.8" rx="4.2" ry="3.1" />
        <ellipse cx="16.7" cy="15.8" rx="4.2" ry="3.1" />
      </svg>
    </div>
  );
}

/* Funnel node: brand logo + name, sized per row. Opaque fill so the connector
   lines pass *behind* it. By default `funnel-node` adds the rotating "loading"
   glow border. When `pulse` is given the node instead carries `funnel-node-pulse`
   — a subtle glow that flares only as its outgoing signal leaves, synced to that
   signal's clock via the --glow-dur / --glow-delay CSS variables. */
function FunnelNode({ logo, name, w, h, pulse }: { logo: React.ReactNode; name: string; w: number; h: number; pulse?: { dur: number; begin: number } }) {
  const style = { width: w, height: h } as React.CSSProperties & Record<string, string | number>;
  if (pulse) {
    style['--glow-dur'] = `${pulse.dur}s`;
    style['--glow-delay'] = `${pulse.begin}s`;
  }
  return (
    <div
      style={style}
      className={`${pulse ? 'funnel-node-pulse' : 'funnel-node'} rounded-xl border border-white/[0.09] bg-[#111a3c] flex flex-col items-center justify-center gap-1.5 text-center px-1.5`}
    >
      {logo}
      <p className="text-[11px] font-semibold text-white leading-tight">{name}</p>
    </div>
  );
}

/* Absolute placement helper: position a node by horizontal center + top (canvas px). */
function FunnelSlot({ cx, top, children }: { cx: number; top: number; children: React.ReactNode }) {
  return <div className="absolute" style={{ left: cx, top, transform: 'translateX(-50%)' }}>{children}</div>;
}

/* Top-row source channels (cx = horizontal centre on the 1160-wide canvas).
   Left → right: the Meta cluster, the job boards, then the Google cluster.
   `edge` is the index into FUNNEL_EDGES/SIGNAL_TIMING of this node's outgoing
   signal, so the node's glow can pulse in sync with the signal it emits. */
const FUNNEL_SOURCES: { cx: number; name: string; edge: number; logo: React.ReactNode }[] = [
  { cx: 72, name: 'WhatsApp', edge: 0, logo: <OutreachLogo k="whatsapp" size={40} /> },
  { cx: 199, name: 'Instagram', edge: 1, logo: <OutreachLogo k="instagram" size={40} /> },
  { cx: 326, name: 'Facebook', edge: 2, logo: <OutreachLogo k="facebook" size={40} /> },
  { cx: 453, name: 'LinkedIn', edge: 7, logo: <BrandBadge slug="linkedin" color="#0A66C2" initials="in" size={40} /> },
  { cx: 580, name: 'Indeed', edge: 8, logo: <BrandBadge slug="indeed" color="#003A9B" initials="Id" size={40} /> },
  { cx: 707, name: 'Xing', edge: 9, logo: <BrandBadge slug="xing" color="#006567" initials="Xi" size={40} /> },
  { cx: 834, name: 'Stepstone', edge: 10, logo: <StepstoneLogo size={40} /> },
  { cx: 961, name: 'Google Search', edge: 3, logo: <BrandBadge slug="google" color="#4285F4" initials="G" size={40} /> },
  { cx: 1088, name: 'YouTube', edge: 4, logo: <BrandBadge slug="youtube" color="#FF0000" initials="YT" size={40} /> },
];

/* Node centres on the 1160×560 canvas. Connectors run centre→centre and tuck
   under the opaque nodes; signals travel these same paths into the Wandel hub. */
const FN = {
  // wandelTop centres the ~104px-tall hub block on wandelCy (294 − 104/2 ≈ 242),
  // so the connectors converge on the block's middle.
  wandelCx: 580, wandelCy: 294, wandelTop: 242,
} as const;

/* Directed edges (centre→centre). `out` edges leave the hub for the handlers. */
const FUNNEL_EDGES: { fx: number; fy: number; tx: number; ty: number; out?: boolean }[] = [
  // Meta cluster → Meta Ads
  { fx: 72, fy: 48, tx: 290, ty: 174 },
  { fx: 199, fy: 48, tx: 290, ty: 174 },
  { fx: 326, fy: 48, tx: 290, ty: 174 },
  // Google cluster → Google Ads
  { fx: 961, fy: 48, tx: 870, ty: 174 },
  { fx: 1088, fy: 48, tx: 870, ty: 174 },
  // Ad platforms → Wandel
  { fx: 290, fy: 174, tx: 580, ty: 294 },
  { fx: 870, fy: 174, tx: 580, ty: 294 },
  // Job boards → Wandel (direct)
  { fx: 453, fy: 48, tx: 580, ty: 294 },
  { fx: 580, fy: 48, tx: 580, ty: 294 },
  { fx: 707, fy: 48, tx: 580, ty: 294 },
  { fx: 834, fy: 48, tx: 580, ty: 294 },
  // Hub → HR Team (centred straight below the hub)
  { fx: 580, fy: 294, tx: 580, ty: 428, out: true },
];

/* Per-signal timing (one entry per edge, same order as FUNNEL_EDGES).
   [dur, begin] — dur sets each signal's travel time (its frequency) and the
   negative begin phase-shifts it so dots leave their channels out of sync,
   each at its own cadence, rather than all firing on a single shared cycle. */
const SIGNAL_TIMING: [number, number][] = [
  [2.6, -0.4], [3.4, -1.8], [2.2, -0.9],                 // Meta cluster → Meta Ads
  [3.0, -2.1], [2.8, -0.6],                              // Google cluster → Google Ads
  [2.4, -1.2], [2.7, -0.3],                              // ad platforms → Wandel
  [3.6, -2.5], [2.1, -1.0], [3.2, -0.5], [2.9, -1.6],    // job boards → Wandel
  [2.5, -1.4],                                           // Hub → HR Team
];
/* Signal colour — luminous cyan, distinct from the indigo hub/border glow. */
const SIGNAL_COLOR = '#22d3ee';

/* Pulse timing for a node, taken from one of its signal edges — the node's glow
   flares at the cycle boundary, i.e. as that signal departs (emitters) or arrives
   (the terminal HR node), since a signal's arrival (t=1) is the next cycle's t=0. */
const sigPulse = (edge: number) => ({ dur: SIGNAL_TIMING[edge][0], begin: SIGNAL_TIMING[edge][1] });

/* ── Bottom of the funnel: open-position nodes + the candidate cards that stream
   out of HR Team and get absorbed into them. ── */
const FUNNEL_POSITION_CX = [230, 580, 930];
const FUNNEL_POSITIONS = POSITIONS.map((p, i) => ({ title: p.title, cx: FUNNEL_POSITION_CX[i] ?? 580 }));
const HR_EMIT = { x: 580, y: 481 };   // card spawn centre, just below the HR node
const POS_CY = 570;                    // vertical centre of the position nodes
const POS_TOP = 544;                   // top edge of the position nodes (POS_CY − ~26)
/* Candidate streams: target = index into FUNNEL_POSITIONS; dur/delay desync them
   (negative delay = already mid-flight at load, same trick as the signals' begin). */
const CANDIDATE_FLOWS: { target: number; dur: number; delay: number }[] = [
  { target: 0, dur: 4.5, delay: -0.6 },
  { target: 1, dur: 4.5, delay: -2.1 },
  { target: 2, dur: 4.5, delay: -3.6 },
];

/* Generic placeholder candidate profile — anonymous avatar glyph + skeleton bars. */
function MiniProfileCard() {
  return (
    <div className="flex items-center gap-1.5 rounded-md border border-white/10 bg-[#0f1733] shadow-[0_2px_8px_rgba(0,0,0,0.35)]" style={{ width: 78, padding: '4px 6px' }}>
      <div className="w-5 h-5 rounded-full bg-gradient-to-br from-slate-500 to-slate-600 flex items-center justify-center shrink-0">
        <svg viewBox="0 0 24 24" width="11" height="11" fill="#e2e8f0"><path d="M12 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10Zm0 2c-4.4 0-8 2.2-8 5v1h16v-1c0-2.8-3.6-5-8-5Z" /></svg>
      </div>
      <div className="flex-1 flex flex-col gap-1">
        <span className="block h-1.5 rounded-full bg-white/35" style={{ width: '85%' }} />
        <span className="block h-1.5 rounded-full bg-white/15" style={{ width: '55%' }} />
      </div>
    </div>
  );
}

function OutreachFunnel() {
  const T = `${FUNNEL_T}s`;
  return (
    <div className="relative mx-auto mt-0" style={{ width: 1160, height: 604, '--funnel-T': T } as React.CSSProperties}>
      {/* Connector + signal layer (behind the opaque nodes) */}
      <svg
        width="1160" height="560" viewBox="0 0 1160 560"
        className="absolute inset-0 pointer-events-none"
        fill="none" stroke="rgba(148,163,184,0.45)" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"
      >
        {/* soft glow so the travelling dots read as signals */}
        <defs>
          <filter id="signalGlow" x="-300%" y="-300%" width="700%" height="700%">
            <feGaussianBlur stdDeviation="2.2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* connector lines (ids reused by the signal dots) */}
        {FUNNEL_EDGES.map((e, i) => (
          <path key={`l${i}`} id={`fe${i}`} d={vCurve(e.fx, e.fy, e.tx, e.ty)} />
        ))}

        {/* Signals — a glowing cyan "droplet" rides each edge on its own clock.
            The outer <g> travels the path with rotate="auto", so its local x-axis
            tracks the line; the inner shape is a long, shallow lens centred on the
            line, and its vertical scale swells out (both sides) then sinks back in,
            reading as a fluid bulge passing along the wire. Each runs on its own
            `dur` (frequency), phase-shifted by a negative `begin`, so signals fire
            out of sync rather than together. */}
        {FUNNEL_EDGES.map((_, i) => {
          const [dur, begin] = SIGNAL_TIMING[i];
          return (
            <g key={`s${i}`} opacity={0}>
              <animateMotion
                dur={`${dur}s`} begin={`${begin}s`} rotate="auto" repeatCount="indefinite" calcMode="linear"
                keyPoints="0;1" keyTimes="0;1"
              >
                <mpath href={`#fe${i}`} />
              </animateMotion>
              <animate
                attributeName="opacity" dur={`${dur}s`} begin={`${begin}s`} repeatCount="indefinite" calcMode="linear"
                values="0;1;1;0" keyTimes="0;0.12;0.82;1"
              />
              <path d="M -12 0 C -1 -4.5 1 -4.5 12 0 C 1 4.5 -1 4.5 -12 0 Z" fill={SIGNAL_COLOR} stroke="none" filter="url(#signalGlow)" transform="scale(1 0.15)">
                <animateTransform
                  attributeName="transform" type="scale"
                  dur={`${dur}s`} begin={`${begin}s`} repeatCount="indefinite"
                  calcMode="spline" values="1 0.15;1 1;1 0.15" keyTimes="0;0.5;1"
                  keySplines="0.4 0 0.2 1;0.4 0 0.2 1"
                />
              </path>
            </g>
          );
        })}
      </svg>

      {/* Top row — source channels (subtle glow pulses as each one emits its signal) */}
      {FUNNEL_SOURCES.map(s => {
        const [dur, begin] = SIGNAL_TIMING[s.edge];
        return (
          <FunnelSlot key={s.name} cx={s.cx} top={8}>
            <FunnelNode logo={s.logo} name={s.name} w={112} h={80} pulse={{ dur, begin }} />
          </FunnelSlot>
        );
      })}

      {/* Ad platforms — pulled toward the centre and closer to the hub (glow pulses as each forwards its signal) */}
      <FunnelSlot cx={290} top={134}><FunnelNode logo={<OutreachLogo k="metaads" size={44} />} name="Meta Ads" w={120} h={80} pulse={sigPulse(5)} /></FunnelSlot>
      <FunnelSlot cx={870} top={134}><FunnelNode logo={<BrandBadge slug="googleads" color="#4285F4" initials="GA" size={44} />} name="Google Ads" w={120} h={80} pulse={sigPulse(6)} /></FunnelSlot>

      {/* Grouping box around the Wandel unit (Sophia hub + HR Team) */}
      <div className="absolute rounded-2xl border border-white/15 bg-white/[0.025] pointer-events-none" style={{ left: 480, top: 224, width: 200, height: 256 }} />

      {/* Central hub (Sophia) */}
      <FunnelSlot cx={FN.wandelCx} top={FN.wandelTop}>
        <SophiaHub />
      </FunnelSlot>

      {/* Outreach handler — centred just below the hub (glow pulses as the signal reaches it) */}
      <FunnelSlot cx={580} top={384}><FunnelNode logo={<HRLogo />} name="HR Team" w={140} h={88} pulse={sigPulse(11)} /></FunnelSlot>

      {/* Candidate cards — stream out of HR Team and fan down toward the positions.
          Outer div anchors the spawn centre (just below HR); the inner .candidate-flow
          carries the CSS animation, translating to its target position node (--tx/--ty)
          then shrinking + fading as it's "absorbed". Rendered before the position nodes
          so an arriving card disappears under their opaque fill. */}
      {CANDIDATE_FLOWS.map((f, i) => {
        const pos = FUNNEL_POSITIONS[f.target];
        const tx = pos.cx - HR_EMIT.x;
        const ty = POS_CY - HR_EMIT.y;
        return (
          <div key={`cf${i}`} className="absolute pointer-events-none" style={{ left: HR_EMIT.x, top: HR_EMIT.y, transform: 'translate(-50%,-50%)' }}>
            <div
              className="candidate-flow"
              style={{ '--tx': `${tx}px`, '--ty': `${ty}px`, '--flow-dur': `${f.dur}s`, '--flow-delay': `${f.delay}s` } as React.CSSProperties}
            >
              <MiniProfileCard />
            </div>
          </div>
        );
      })}

      {/* Open-position nodes — text nodes at the very bottom; candidates land here */}
      {FUNNEL_POSITIONS.map((p, i) => (
        <FunnelSlot key={`pos${i}`} cx={p.cx} top={POS_TOP}>
          <div
            className="rounded-lg border border-white/10 bg-[#111a3c] shadow-[0_2px_10px_rgba(0,0,0,0.4)] flex items-center justify-center text-center"
            style={{ width: 220, minHeight: 52, padding: '8px 12px' }}
          >
            <p className="text-[11px] font-semibold text-white leading-snug">{p.title}</p>
          </div>
        </FunnelSlot>
      ))}
    </div>
  );
}

/* Small leading icons for the "this week" change log. */
function PulseEventIcon({ kind }: { kind: PulseEvent['kind'] }) {
  const common = { className: 'w-4 h-4', fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' } as const;
  if (kind === 'add')
    return (<svg {...common}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7} d="M15 19v-1a4 4 0 00-4-4H6a4 4 0 00-4 4v1m11-7a3 3 0 100-6 3 3 0 000 6zm6-3v6m3-3h-6" /></svg>);
  if (kind === 'up')
    return (<svg {...common}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7} d="M12 19V5m0 0l-6 6m6-6l6 6" /></svg>);
  return (<svg {...common}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7} d="M6 6l12 12M18 6L6 18" /></svg>);
}

/* ── Pulse body (light) — drop-in replacement for the default metrics inside the
   white position card. Header + footer come from PositionDetails; this renders
   the "ready to interview" metric, the pipeline stage bars, and the weekly log. ── */
function PositionPulseBody({ d }: { d: PulseData }) {
  const max = Math.max(...d.pipeline.map(s => s.value));
  return (
    <>
      {/* Key metric */}
      <div className="mt-3.5">
        <p className="text-[30px] font-bold text-[#0f172a] leading-none">{d.readyToInterview}</p>
        <p className="text-[12px] text-[#64748b] mt-1.5">ready to interview</p>
      </div>

      {/* Pipeline stage bars */}
      <p className="text-[9px] uppercase tracking-[0.08em] text-[#94a3b8] mt-4 mb-2">Pipeline</p>
      <div className="flex flex-col gap-2">
        {d.pipeline.map(s => (
          <div key={s.label} className="flex items-center gap-3">
            <div className="flex-1 h-7 rounded-md bg-[#f1f5f9] overflow-hidden">
              <div
                className="h-full rounded-md flex items-center px-2.5"
                style={{ width: `${(s.value / max) * 100}%`, minWidth: 32, background: s.color }}
              >
                <span className="text-[12px] font-bold tabular-nums" style={{ color: s.text }}>{s.value}</span>
              </div>
            </div>
            <span className="w-20 text-right text-[12px] text-[#475569]">{s.label}</span>
          </div>
        ))}
      </div>

      {/* This-week change log */}
      <p className="text-[9px] uppercase tracking-[0.08em] text-[#94a3b8] mt-4 mb-2">This Week</p>
      <ul className="flex flex-col gap-2">
        {d.thisWeek.map((e, i) => (
          <li key={i} className="flex items-center gap-2.5 text-[12px] text-[#475569]">
            <span className="text-[#94a3b8] shrink-0"><PulseEventIcon kind={e.kind} /></span>
            <span className="font-bold text-[#0f172a] tabular-nums w-5">{e.delta}</span>
            <span>{e.text}</span>
          </li>
        ))}
      </ul>
    </>
  );
}

/* ──────────────────────────────────────────────────────────────────────────
   Position focus card (dark) — a single position's pipeline funnel + the week's
   candidate highlights. Larger than the standard position cards by design.
   ────────────────────────────────────────────────────────────────────────── */

/* ── Pipeline funnel (soft, light, continuous) ───────────────────────────────
   One continuous monochrome-indigo funnel: a single smooth curve (no gaps, no
   corners) sampled densely from the stage values, soft gradient fill with a
   faint drop shadow and sheen, light motes quietly drifting through it (clipped
   to the shape so they narrow toward the tip), and a calm pulsing endpoint.
   Sits inside the frosted "milky" box. */
const FUNNEL_W = 640, FUNNEL_H = 100, FUNNEL_CY = 66, FUNNEL_HMAX = 24;
const FUNNEL_PAD = 8;
const FUNNEL_TIP = 0.9;                       // value the curve tapers to at the tip
const FUNNEL_STAGE_F = [1 / 6, 1 / 2, 5 / 6]; // x-fraction of each stage's centre
// individual motes drifting through the funnel: y-offset, speed, start delay, size, opacity
const FUNNEL_PARTICLES: { y: number; dur: number; begin: number; r: number; op: number }[] = [
  { y: -19, dur: 7.5, begin: -1.0, r: 1.3, op: 0.5 },
  { y: -11, dur: 6.4, begin: -4.0, r: 1.6, op: 0.7 },
  { y: -4, dur: 8.2, begin: -2.5, r: 1.2, op: 0.55 },
  { y: 0, dur: 6.8, begin: -5.5, r: 1.8, op: 0.8 },
  { y: 5, dur: 7.8, begin: -0.5, r: 1.3, op: 0.6 },
  { y: 12, dur: 6.0, begin: -3.5, r: 1.5, op: 0.65 },
  { y: 19, dur: 8.6, begin: -6.0, r: 1.2, op: 0.45 },
];

function TrendUp() {
  return (
    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 17l6-6 3 3 7-7" /><path d="M17 7h4v4" />
    </svg>
  );
}

function FocusFunnel({ stages, phase = 0 }: { stages: FocusStage[]; phase?: number }) {
  const usable = FUNNEL_W - FUNNEL_PAD * 2;
  const xAt = (f: number) => FUNNEL_PAD + f * usable;
  const hh = (v: number) => (v / FUNNEL_VALUE_MAX) * FUNNEL_HMAX;

  // Smooth half-height profile: flat at the first stage, then easing down
  // through each stage value to a fine tip. Sampled densely → a clean curve.
  const anchors: [number, number][] = [
    [0, stages[0].value],
    [FUNNEL_STAGE_F[0], stages[0].value],
    [FUNNEL_STAGE_F[1], stages[1].value],
    [FUNNEL_STAGE_F[2], stages[2].value],
    [1, FUNNEL_TIP],
  ];
  const N = 200;
  const top: [number, number][] = [];
  for (let i = 0; i <= N; i++) {
    const f = i / N;
    let a = anchors[0], b = anchors[anchors.length - 1];
    for (let s = 0; s < anchors.length - 1; s++) {
      if (f >= anchors[s][0] && f <= anchors[s + 1][0]) { a = anchors[s]; b = anchors[s + 1]; break; }
    }
    const span = (b[0] - a[0]) || 1;
    const t = Math.max(0, Math.min(1, (f - a[0]) / span));
    const sm = t * t * (3 - 2 * t);          // smoothstep
    const v = a[1] + (b[1] - a[1]) * sm;
    top.push([xAt(f), hh(v)]);
  }
  const path =
    top.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)} ${(FUNNEL_CY - p[1]).toFixed(1)}`).join(' ') +
    ' ' + [...top].reverse().map(p => `L${p[0].toFixed(1)} ${(FUNNEL_CY + p[1]).toFixed(1)}`).join(' ') + ' Z';

  const tipX = xAt(1);

  return (
    <div>
      <div className="relative w-full" style={{ height: FUNNEL_H }}>
        <svg width="100%" height={FUNNEL_H} viewBox={`0 0 ${FUNNEL_W} ${FUNNEL_H}`} preserveAspectRatio="none" className="block">
          <defs>
            {/* continuous indigo gradient, light→deep left to right (stage progression) */}
            <linearGradient id="focusFunnelFill" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#a5b4fc" />
              <stop offset="50%" stopColor="#7c83f7" />
              <stop offset="100%" stopColor="#5b54e6" />
            </linearGradient>
            {/* soft top sheen for a gentle, rounded read */}
            <linearGradient id="focusSheen" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ffffff" stopOpacity={0.5} />
              <stop offset="45%" stopColor="#ffffff" stopOpacity={0.06} />
              <stop offset="100%" stopColor="#000000" stopOpacity={0.05} />
            </linearGradient>
            <filter id="focusSoft" x="-20%" y="-120%" width="140%" height="420%">
              <feDropShadow dx="0" dy="2" stdDeviation="3.5" floodColor="#6366f1" floodOpacity="0.20" />
            </filter>
            <clipPath id="focusClip"><path d={path} /></clipPath>
          </defs>

          {/* one continuous soft curve + faint drop shadow, no outline */}
          <path d={path} fill="url(#focusFunnelFill)" filter="url(#focusSoft)" />
          <path d={path} fill="url(#focusSheen)" />

          {/* individual motes drifting through the funnel — they converge onto the
              centreline so every mote lands in the endpoint (clipped to the shape) */}
          <g clipPath="url(#focusClip)">
            {FUNNEL_PARTICLES.map((p, i) => (
              <circle key={i} r={p.r} fill="#ffffff" opacity={0}>
                <animate attributeName="cx" from={FUNNEL_PAD - 8} to={tipX} dur={`${p.dur}s`} begin={`${(p.begin - phase).toFixed(2)}s`} repeatCount="indefinite" calcMode="linear" />
                <animate attributeName="cy" from={FUNNEL_CY + p.y} to={FUNNEL_CY} dur={`${p.dur}s`} begin={`${(p.begin - phase).toFixed(2)}s`} repeatCount="indefinite" keyTimes="0;0.7;1" values={`${FUNNEL_CY + p.y};${FUNNEL_CY + p.y * 0.28};${FUNNEL_CY}`} calcMode="spline" keySplines="0.4 0 0.6 1;0.5 0 0.2 1" />
                <animate attributeName="opacity" values={`0;${p.op};${p.op};0`} keyTimes="0;0.1;0.92;1" dur={`${p.dur}s`} begin={`${(p.begin - phase).toFixed(2)}s`} repeatCount="indefinite" />
              </circle>
            ))}
          </g>

          {/* matched endpoint — calm, soft pulse */}
          <circle cx={tipX} cy={FUNNEL_CY} r={4.5} fill="#6366f1">
            <animate attributeName="r" dur="5s" begin={`${(-phase).toFixed(2)}s`} repeatCount="indefinite" values="3.6;5.4;3.6" keyTimes="0;0.5;1" calcMode="spline" keySplines="0.4 0 0.2 1;0.4 0 0.2 1" />
            <animate attributeName="opacity" dur="5s" begin={`${(-phase).toFixed(2)}s`} repeatCount="indefinite" values="0.85;0.5;0.85" keyTimes="0;0.5;1" />
          </circle>
          <circle cx={tipX} cy={FUNNEL_CY} r={2.4} fill="#ffffff" />
        </svg>

        {/* stage numbers + this-week delta — each sits directly above the funnel's
            upper edge at its stage, so they ride the curve and drop as it narrows */}
        {stages.map((s, i) => (
          <div
            key={s.label}
            className="absolute"
            style={{ left: `${FUNNEL_STAGE_F[i] * 100}%`, top: FUNNEL_CY - hh(s.value) - 9, transform: 'translate(-50%, -100%)' }}
          >
            {/* the number itself is centred over the stage label; the delta hangs
                off to the right without shifting that centre */}
            <span className="relative block text-[21px] font-bold leading-none tabular-nums text-[#1e293b]">
              {s.value}
              <span className="absolute left-full bottom-0.5 ml-1 flex items-center gap-0.5 text-[10.5px] font-semibold text-[#6366f1] whitespace-nowrap">
                <TrendUp />{s.delta}
              </span>
            </span>
          </div>
        ))}
      </div>

      {/* stage labels */}
      <div className="relative w-full mt-2.5">
        {stages.map((s, i) => (
          <span
            key={s.label}
            className="absolute -translate-x-1/2 text-[10px] uppercase tracking-[0.16em] font-semibold text-[#94a3b8] whitespace-nowrap"
            style={{ left: `${FUNNEL_STAGE_F[i] * 100}%` }}
          >
            {s.label}
          </span>
        ))}
        <span aria-hidden className="invisible block text-[10px] leading-none">.</span>
      </div>
    </div>
  );
}

/* Small circular score gauge, coloured by band. */
function ScoreRing({ score }: { score: number }) {
  const r = 13, c = 2 * Math.PI * r;
  const val = (score / 100) * c;
  const color = score >= 86 ? '#16a34a' : score >= 82 ? '#0d9488' : '#d97706';
  return (
    <div className="flex items-center gap-2 shrink-0">
      <svg width={34} height={34} viewBox="0 0 34 34" className="-rotate-90">
        <circle cx={17} cy={17} r={r} fill="none" stroke="#e2e8f0" strokeWidth={3} />
        <circle cx={17} cy={17} r={r} fill="none" stroke={color} strokeWidth={3} strokeLinecap="round" strokeDasharray={`${val.toFixed(2)} ${(c - val).toFixed(2)}`} />
      </svg>
      <span className="text-[15px] font-semibold text-[#0f172a] tabular-nums w-6">{score}</span>
    </div>
  );
}

function PinIcon() {
  return (
    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 21s-6-5.686-6-10a6 6 0 1112 0c0 4.314-6 10-6 10z" /><circle cx={12} cy={11} r={2} />
    </svg>
  );
}
function CalIcon() {
  return (
    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
      <rect x={4} y={5} width={16} height={16} rx={2} /><path d="M4 9h16M8 3v4m8-4v4" />
    </svg>
  );
}

function HeroMetric({ label, value, delta }: { label: string; value: string; delta?: string }) {
  return (
    <div className="flex flex-col">
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#94a3b8] whitespace-nowrap">{label}</p>
      <div className="mt-1 flex items-baseline gap-1.5">
        <span className="text-[28px] font-bold leading-none tabular-nums text-white">{value}</span>
        {delta && <span className="flex items-center gap-0.5 text-[12px] font-semibold text-[#34d399]"><TrendUp />{delta}</span>}
      </div>
    </div>
  );
}

const FOCUS_TAG_CLS: Record<FocusTag['kind'], string> = {
  interview: 'text-[#4338ca] bg-[#eef2ff] border-[#c7d2fe]',
  ready: 'text-[#15803d] bg-[#f0fdf4] border-[#bbf7d0]',
  screening: 'text-[#b45309] bg-[#fffbeb] border-[#fde68a]',
  new: 'text-[#0369a1] bg-[#f0f9ff] border-[#bae6fd]',
};

function FocusCandidateRow({ c, delay }: { c: FocusCand; delay: number }) {
  const navigate = useNavigate();
  return (
    <div
      onClick={(e) => { e.stopPropagation(); navigate(`/clients/positions/candidate/${c.id}`); }}
      className="flex items-center gap-3 animate-panel-in rounded-xl border border-transparent px-2.5 py-2 -mx-2.5 cursor-pointer transition-all duration-150 hover:border-[#818cf8] hover:bg-[#f5f6ff] hover:shadow-[0_2px_10px_rgba(99,102,241,0.12)]"
      style={{ animationDelay: `${delay * 50}ms` }}
    >
      <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-[12px] font-semibold shrink-0" style={{ background: c.color }}>
        {initials(c.name)}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[14px] font-semibold text-[#0f172a] leading-tight">{c.name}</span>
          <span className={`text-[10px] font-semibold uppercase tracking-wide rounded-full px-2 py-0.5 border ${FOCUS_TAG_CLS[c.tag.kind]}`}>{c.tag.text}</span>
        </div>
        <div className="mt-0.5 flex items-center gap-1.5 text-[12px] text-[#64748b]">
          <span className="inline-flex items-center gap-1 text-[#94a3b8]"><PinIcon />{c.location}</span>
          <span className="text-[#cbd5e1]">·</span>
          <span className="inline-flex items-center gap-1 text-[#94a3b8]"><CalIcon />{c.date}</span>
          <span className="text-[#cbd5e1]">·</span>
          <span>{c.salary}</span>
        </div>
      </div>
      <ScoreRing score={c.score} />
    </div>
  );
}

/* Header + pipeline funnel — shared by the collapsed focus card and the expanded
   view's left column. */
function FocusSummary({ title, d, phase = 0 }: { title: string; d: FocusData; phase?: number }) {
  const stages = resolveFunnel(d.funnel);
  return (
    <>
      <div className="flex items-start justify-between gap-4 pr-6">
        <div className="min-w-0">
          <h3 className="text-[16px] font-semibold text-[#0f172a] leading-tight">{title}</h3>
          <p className="text-[11.5px] text-[#64748b] mt-0.5">{d.total} candidates</p>
        </div>
        <span className="shrink-0 text-[11px] rounded-full px-2.5 py-1 text-[#16a34a] bg-[#f0fdf4] border border-[#bbf7d0]">{d.status}</span>
      </div>

      {/* Pipeline funnel — holographic dark "console" embedded in the light card */}
      <div
        className="mt-3 rounded-2xl px-3 pt-2.5 pb-3 relative overflow-hidden border border-white/80 shadow-[0_8px_24px_rgba(15,23,42,0.10),inset_0_1px_0_rgba(255,255,255,0.95)]"
        style={{
          background: 'linear-gradient(180deg, rgba(255,255,255,0.85), rgba(233,237,247,0.62))',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
        }}
      >
        <div className="flex items-center justify-between mb-1 px-1 relative z-10">
          <span className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.16em] font-semibold text-[#94a3b8]">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#818cf8]" />
            Pipeline
          </span>
          <span className="flex items-center gap-1 text-[11px] font-medium text-[#6366f1]"><TrendUp /> this week</span>
        </div>
        <FocusFunnel stages={stages} phase={phase} />
      </div>
    </>
  );
}

function PositionFocusCard({ p, d, onSelect, phase = 0, fullWidth = false }: { p: Pos; d: FocusData; onSelect?: () => void; phase?: number; fullWidth?: boolean }) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const shown = open ? d.candidates : d.candidates.slice(0, d.initialCount);
  const moreCount = d.candidates.length - d.initialCount;
  const stop = (e: React.MouseEvent) => e.stopPropagation();
  const goToPosition = (e: React.MouseEvent) => { e.preventDefault(); e.stopPropagation(); navigate(positionPath(p.title)); };
  return (
    <div
      onClick={onSelect}
      className="rounded-[10px] border border-[#e2e8f0] shadow-[0_8px_24px_rgba(0,0,0,0.06)] shrink-0 cursor-pointer animate-fade-scale-in transition-all duration-200 hover:-translate-y-[3px] hover:border-[#c7d2fe] hover:shadow-[0_12px_30px_rgba(0,0,0,0.10)]"
      style={{ width: fullWidth ? '100%' : 'clamp(420px, 32vw, 540px)', padding: '14px 16px 10px', scrollSnapAlign: 'start', background: CARD_GRADIENT }}
    >
      <FocusSummary title={p.title} d={d} phase={phase} />

      <div className="h-px bg-[#e2e8f0] my-3" />

      {/* This week's focus — expandable candidate list */}
      <div className="flex items-center justify-between mb-2.5">
        <span className="text-[11px] uppercase tracking-[0.12em] font-semibold text-[#94a3b8]">This Week's Focus</span>
        <span className="text-[12px] text-[#94a3b8]">{d.candidates.length} highlights</span>
      </div>

      <div className="flex flex-col gap-2">
        {shown.map((c, i) => <FocusCandidateRow key={c.name} c={c} delay={i} />)}
      </div>

      {moreCount > 0 && (
        <button
          onClick={(e) => { stop(e); setOpen(o => !o); }}
          className="mt-2.5 w-full rounded-lg border border-[#e2e8f0] bg-[#f8fafc] py-2 text-[12.5px] font-medium text-[#475569] hover:bg-[#f1f5f9] hover:text-[#0f172a] transition-colors flex items-center justify-center gap-1.5"
        >
          {open ? 'Show less' : `Show ${moreCount} more candidates`}
          <svg className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 9l6 6 6-6" />
          </svg>
        </button>
      )}

      <div className="h-px bg-[#e2e8f0] mt-3 mb-2" />
      <div className="flex justify-end">
        <a href="#" onClick={goToPosition} className="text-[12.5px] font-medium text-[#4f46e5] no-underline rounded-lg px-3 py-1.5 border border-transparent transition-colors hover:bg-white/70 hover:border-[#e6e9f3] hover:shadow-sm">Review all candidates →</a>
      </div>
    </div>
  );
}

/* ── Statistics section: weekly activity stat cards + a candidate locations map ── */
function ActivityIcon({ kind }: { kind: ActivityKind }) {
  const c = { className: 'w-5 h-5', fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24', strokeWidth: 1.7, strokeLinecap: 'round', strokeLinejoin: 'round' } as const;
  switch (kind) {
    case 'mail': return (<svg {...c}><rect x={3} y={5} width={18} height={14} rx={2} /><path d="M3 7l9 6 9-6" /></svg>);
    case 'phone': return (<svg {...c}><path d="M5 4h4l2 5-2.5 1.5a11 11 0 005 5L15 13l5 2v4a2 2 0 01-2 2A16 16 0 013 6a2 2 0 012-2z" /></svg>);
    case 'funnel': return (<svg {...c}><path d="M3 5h18l-7 8v6l-4-2v-4z" /></svg>);
    case 'star': return (<svg {...c}><path d="M12 4l2.2 5.1L20 9.7l-4.3 3.6L17 19l-5-3-5 3 1.3-5.7L4 9.7l5.8-.6z" /></svg>);
  }
}

/* Compact area sparkline for a weekly-activity stat. */
function Sparkline({ data, h = 30 }: { data: number[]; h?: number }) {
  const w = 100;
  const min = Math.min(...data), max = Math.max(...data);
  const span = max - min || 1;
  const pts = data.map((v, i) => [
    (i / (data.length - 1)) * w,
    h - 2 - ((v - min) / span) * (h - 6),
  ] as const);
  const line = pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ');
  const area = `${line} L${w} ${h} L0 ${h} Z`;
  const last = pts[pts.length - 1];
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width="100%" height={h} preserveAspectRatio="none" className="block overflow-visible">
      <path d={area} fill="rgba(129,140,248,0.16)" />
      <path d={line} fill="none" stroke="#818cf8" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
      <circle cx={last[0]} cy={last[1]} r={2.2} fill="#c7d2fe" />
    </svg>
  );
}

/* Weekly activity — a single block with the four key outputs + trend lines. */
function WeeklyActivityCard({ data }: { data: ActivityStat[] }) {
  const endIdx = ACTIVITY_HISTORY - 1; // last visible point = current week
  return (
    <div className="rounded-xl border border-white/[0.08] bg-[#111a3c] p-5 min-h-0 flex flex-col">
      <p className="text-[11px] uppercase tracking-[0.14em] font-semibold text-[#818cf8]">Activity · This Week</p>
      <p className="text-[14px] font-semibold text-white mt-1">Outputs vs. previous weeks</p>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-5 gap-y-6 mt-5">
        {data.map(s => {
          const window = s.trend.slice(endIdx - (ACTIVITY_WINDOW - 1), endIdx + 1);
          const value = s.trend[endIdx];
          const delta = value - s.trend[endIdx - 1];
          const up = delta >= 0;
          return (
            <div key={s.label} className="flex flex-col">
              <div className="flex items-center justify-between">
                <span className="w-8 h-8 rounded-lg bg-[#4f46e5]/15 text-[#a5b4fc] flex items-center justify-center [&_svg]:w-[18px] [&_svg]:h-[18px]">
                  <ActivityIcon kind={s.icon} />
                </span>
                <span className={`flex items-center gap-0.5 text-[11px] font-semibold ${up ? 'text-[#34d399]' : 'text-[#fb7185]'}`}>
                  <TrendUp />{up ? '+' : ''}{delta}
                </span>
              </div>
              <p className="text-[28px] font-bold text-white leading-none mt-3 tabular-nums">{value}</p>
              <p className="text-[12px] text-[#94a3b8] mt-1.5 leading-snug min-h-[32px]">{s.label}</p>
              <div className="mt-2"><Sparkline data={window} /></div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function DropOffCard({ d }: { d: DropOffData }) {
  const o = d.opportunity;
  return (
    <div className="rounded-xl border border-white/[0.08] bg-[#111a3c] p-5 min-h-0 flex flex-col">
      <p className="text-[11px] uppercase tracking-[0.14em] font-semibold text-[#818cf8]">Drop-off diagnostics</p>
      <p className="text-[14px] font-semibold text-white mt-1">Where candidates fall off — and how to win them back</p>

      <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-5 mt-4">
        {/* reasons with proportional bars */}
        <div className="flex flex-col gap-3">
          {d.reasons.map(r => (
            <div key={r.label}>
              <div className="flex items-center justify-between text-[13px]">
                <span className="text-[#cbd5e1]">{r.label}</span>
                <span className="font-semibold text-white tabular-nums">{r.pct}%</span>
              </div>
              <div className="mt-1.5 h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                <div className="h-full rounded-full transition-[width] duration-500" style={{ width: `${r.pct}%`, background: 'linear-gradient(90deg, #6366f1, #818cf8)' }} />
              </div>
            </div>
          ))}
        </div>

        {/* opportunity framing */}
        <div className="rounded-lg border border-[#4f46e5]/30 bg-[#4f46e5]/10 p-5 flex flex-col justify-center">
          <p className="text-[11px] uppercase tracking-[0.14em] font-semibold text-[#a5b4fc]">Opportunity</p>
          <p className="text-[16px] text-[#e2e8f0] leading-relaxed mt-2.5">
            <span className="text-[#34d399] font-semibold">{o.count}</span> {o.before}
            {o.money && <> <span className="text-white font-semibold">{o.money}</span> {o.after}</>}
          </p>
        </div>
      </div>
    </div>
  );
}

function LocationsCard({ pts, total }: { pts: { city: string; count: number; lat: number; lng: number }[]; total: number }) {
  const max = Math.max(...pts.map(l => l.count), 1);
  const navigate = useNavigate();
  return (
    <div className="rounded-xl border border-white/[0.08] bg-[#111a3c] p-5 flex flex-col h-full">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[14px] font-semibold text-white">Candidate Locations</p>
          <p className="text-[12px] text-[#94a3b8] mt-0.5">Rhein-Main region · {total} candidates</p>
        </div>
        <span className="text-[11px] text-[#64748b]">{pts.length} cities</span>
      </div>

      {/* interactive Leaflet map (CARTO Voyager — real, lighter geo map) */}
      <div className="relative mt-4 flex-1 rounded-lg overflow-hidden border border-white/5" style={{ minHeight: 300 }}>
        <MapContainer
          center={[50.0, 8.5]}
          zoom={10}
          scrollWheelZoom={false}
          zoomControl
          attributionControl={false}
          style={{ height: '100%', width: '100%', background: '#e8eef5' }}
        >
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
            subdomains="abcd"
            maxZoom={20}
          />
          {pts.map(l => {
            const radius = 9 + (l.count / max) * 13;
            return (
              <CircleMarker
                key={l.city}
                center={[l.lat, l.lng]}
                radius={radius}
                pathOptions={{ color: '#ffffff', weight: 2, fillColor: '#4f46e5', fillOpacity: 0.9 }}
                eventHandlers={{ mouseover: (e) => e.target.openPopup() }}
              >
                <Popup closeButton={false} autoPan={false} offset={[0, -radius + 4]} className="wandel-map-pop">
                  <div className="font-semibold text-white mb-2">{l.city} · {l.count} candidates</div>
                  <ul className="flex flex-col gap-1.5">
                    {(CITY_CANDIDATES[l.city] ?? []).slice(0, l.count).map(c => (
                      <li key={c.name + c.id}>
                        <button
                          onClick={() => navigate(`/clients/positions/candidate/${c.id}`)}
                          className="flex items-center gap-2 w-full text-left text-[13px] text-[#e7ecff] rounded-lg px-2.5 py-1.5 border border-white/15 bg-white/10 hover:bg-white/20 hover:border-white/30 transition-colors"
                        >
                          <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#818cf8] shrink-0" />
                          <span className="flex-1 truncate">{c.name}</span>
                          <span className="text-[#a5b4fc]">→</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </Popup>
              </CircleMarker>
            );
          })}
        </MapContainer>
      </div>

      <p className="text-[10px] text-[#475569] mt-2 text-right">© OpenStreetMap · CARTO</p>
    </div>
  );
}

/* ── Candidate pipeline board (Kanban) ──────────────────────────────────────
   An interactive drag-and-drop board for hands-on candidate management. Cards
   move between stages; each column shows its WIP count and flags candidates
   that have stalled. Replaces the static "Top Candidates" strip. */
type KStage = 'rejected' | 'new' | 'shortlist' | 'interview' | 'offer' | 'hired';
const KSTAGES: { key: KStage; label: string; hint: string; accent: string; terminal?: boolean }[] = [
  { key: 'rejected', label: 'Rejected', hint: 'Not moving forward', accent: '#ef4444', terminal: true },
  { key: 'new', label: 'New', hint: 'Fresh matches', accent: '#3b82f6' },
  { key: 'shortlist', label: 'Shortlisted', hint: 'Marked for review', accent: '#6366f1' },
  { key: 'interview', label: 'Interviewing', hint: 'Scheduled or pending', accent: '#a855f7' },
  { key: 'offer', label: 'Offer Extended', hint: 'Awaiting decision', accent: '#f59e0b' },
  { key: 'hired', label: 'Hired', hint: 'Closed — won', accent: '#16a34a', terminal: true },
];
const STALL_DAYS = 5; // candidates idle this long in an active stage get nudged

type BoardCand = Cand & { stage: KStage; daysInStage: number };
const INITIAL_BOARD: BoardCand[] = [
  { ...ALL_CANDIDATES.find(c => c.id === '6')!, stage: 'rejected', daysInStage: 3 },
  { ...ALL_CANDIDATES.find(c => c.id === '5')!, stage: 'new', daysInStage: 2 },
  { ...ALL_CANDIDATES.find(c => c.id === '3')!, stage: 'new', daysInStage: 4 },
  { ...ALL_CANDIDATES.find(c => c.id === '4')!, stage: 'shortlist', daysInStage: 6 },
  { ...ALL_CANDIDATES.find(c => c.id === '1')!, stage: 'interview', daysInStage: 2 },
  { ...ALL_CANDIDATES.find(c => c.id === '8')!, stage: 'interview', daysInStage: 7 },
  { ...ALL_CANDIDATES.find(c => c.id === '2')!, stage: 'offer', daysInStage: 1 },
  { ...ALL_CANDIDATES.find(c => c.id === '7')!, stage: 'hired', daysInStage: 1 },
];

const isStageTerminal = (s: KStage) => KSTAGES.find(k => k.key === s)?.terminal ?? false;
const isStalled = (c: BoardCand) => !isStageTerminal(c.stage) && c.daysInStage >= STALL_DAYS;

export function PipelineBoard({ positions, hideFilter = false, restrictPosition }: { positions: string[]; hideFilter?: boolean; restrictPosition?: string }) {
  const [cards, setCards] = useState<BoardCand[]>(INITIAL_BOARD);
  const [posFilter, setPosFilter] = useState<string>('all');
  const [dragId, setDragId] = useState<string | null>(null);
  const [overStage, setOverStage] = useState<KStage | null>(null);

  const scoped = restrictPosition ? cards.filter(c => c.position === restrictPosition) : cards;
  const visible = posFilter === 'all' ? scoped : scoped.filter(c => c.position === posFilter);
  const move = (id: string, stage: KStage) =>
    setCards(cs => cs.map(c => (c.id === id && c.stage !== stage ? { ...c, stage, daysInStage: 0 } : c)));

  const stalledCount = visible.filter(isStalled).length;
  const filters = [{ key: 'all', label: 'All positions' }, ...positions.map(p => ({ key: p, label: p }))];

  return (
    <div className="bg-transparent">
      {/* board controls: position filter + attention summary */}
      <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
        {hideFilter ? <span /> : (
          <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-[#0b1330] border border-white/[0.08] flex-wrap">
            {filters.map(f => (
              <button
                key={f.key}
                onClick={() => setPosFilter(f.key)}
                className={`text-[12px] font-medium px-3 py-1.5 rounded-lg transition-colors ${
                  posFilter === f.key ? 'bg-[#4f46e5] text-white shadow-sm' : 'text-[#94a3b8] hover:text-white hover:bg-white/5'
                }`}
              >
                {f.key === 'all' ? f.label : f.label.split(' ')[0]}
              </button>
            ))}
          </div>
        )}
        <div className="flex items-center gap-4 text-[12px]">
          <span className="text-[#94a3b8] font-medium">{visible.length} candidates in pipeline</span>
          {stalledCount > 0 && (
            <span className="inline-flex items-center gap-1.5 font-semibold text-[#fbbf24]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#f59e0b] animate-pulse" />{stalledCount} need a nudge
            </span>
          )}
        </div>
      </div>

      {/* columns — six lanes with a fixed minimum width: they grow to fill wide
          monitors, and the board scrolls horizontally instead of squishing on
          smaller screens */}
      <div
        className="grid gap-4 pb-2 overflow-x-auto [&::-webkit-scrollbar]:hidden"
        style={{ gridTemplateColumns: `repeat(${KSTAGES.length}, minmax(250px, 1fr))`, scrollbarWidth: 'none' }}
      >
        {KSTAGES.map(stage => {
          const items = visible.filter(c => c.stage === stage.key);
          const isOver = overStage === stage.key;
          return (
            <div
              key={stage.key}
              onDragOver={e => { e.preventDefault(); setOverStage(stage.key); }}
              onDragLeave={() => setOverStage(s => (s === stage.key ? null : s))}
              onDrop={() => { if (dragId) move(dragId, stage.key); setOverStage(null); setDragId(null); }}
              className="min-w-0 rounded-2xl border p-2.5 transition-all duration-150"
              style={{
                borderColor: isOver ? stage.accent : 'rgba(255,255,255,0.10)',
                background: isOver
                  ? `linear-gradient(180deg, ${stage.accent}33, rgba(11,19,48,0.65))`
                  : `linear-gradient(180deg, ${stage.accent}1f, rgba(11,19,48,0.55) 42%)`,
                boxShadow: isOver
                  ? `0 10px 30px ${stage.accent}40, inset 0 1px 0 rgba(255,255,255,0.06)`
                  : '0 4px 18px rgba(0,0,0,0.22), inset 0 1px 0 rgba(255,255,255,0.05)',
              }}
            >
              {/* column header band — accent tinted */}
              <div
                className="rounded-xl px-3 py-2.5 mb-3 border"
                style={{
                  background: `linear-gradient(135deg, ${stage.accent}3a, ${stage.accent}12)`,
                  borderColor: `${stage.accent}45`,
                }}
              >
                <div className="flex items-center gap-2.5">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ background: stage.accent, boxShadow: `0 0 10px ${stage.accent}, 0 0 0 4px ${stage.accent}33` }}
                  />
                  <span className="text-[16px] font-bold text-white tracking-tight flex-1 truncate">{stage.label}</span>
                  <span
                    className="text-[12px] font-bold tabular-nums rounded-full px-2 py-0.5 min-w-[24px] text-center shrink-0"
                    style={{ background: `${stage.accent}33`, color: '#fff' }}
                  >
                    {items.length}
                  </span>
                </div>
                <p className="text-[10px] uppercase tracking-[0.12em] font-semibold text-[#94a3b8] mt-1.5 pl-[20px]">{stage.hint}</p>
              </div>

              {/* drop area */}
              <div className="flex flex-col gap-3 min-h-[160px]">
                {items.map(c => {
                  const stalled = isStalled(c);
                  return (
                    <div
                      key={c.id}
                      draggable
                      onDragStart={e => { setDragId(c.id); e.dataTransfer.effectAllowed = 'move'; }}
                      onDragEnd={() => { setDragId(null); setOverStage(null); }}
                      className={`relative transition-opacity ${dragId === c.id ? 'opacity-40' : ''}`}
                    >
                      {stalled && (
                        <span className="absolute -top-2 left-3 z-10 inline-flex items-center gap-1 text-[10px] font-semibold text-[#b45309] bg-[#fffbeb] border border-[#fde68a] rounded-full px-2 py-0.5 shadow-sm">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#f59e0b] animate-pulse" />{c.daysInStage}d · nudge
                        </span>
                      )}
                      <CandidateCard c={c} fullWidth />
                    </div>
                  );
                })}
                {items.length === 0 && (
                  <div
                    className="rounded-xl border border-dashed py-10 text-center text-[11px] font-medium transition-colors"
                    style={{
                      borderColor: isOver ? stage.accent : 'rgba(255,255,255,0.12)',
                      color: isOver ? stage.accent : '#64748b',
                    }}
                  >
                    {isOver ? 'Drop here' : 'No candidates'}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [selected, setSelected] = useState<string | null>(null);
  const [statFilter, setStatFilter] = useState<StatKey>('all');
  const locations = locationsFor(statFilter);

  const selectedIdx = selected ? POSITIONS.findIndex(p => p.title === selected) : -1;
  const selectedPos = selectedIdx >= 0 ? POSITIONS[selectedIdx] : null;
  const selectedCandidates = selectedPos ? ALL_CANDIDATES.filter(c => c.position === selectedPos.title) : [];
  const beforePositions = selectedPos ? POSITIONS.slice(0, selectedIdx) : [];
  const afterPositions = selectedPos ? POSITIONS.slice(selectedIdx + 1) : [];

  // When a position below the first is opened, center the expanded card in view.
  const expandedRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (selectedIdx > 0 && expandedRef.current) {
      const el = expandedRef.current;
      requestAnimationFrame(() => el.scrollIntoView({ behavior: 'smooth', block: 'center' }));
    }
  }, [selected, selectedIdx]);

  /* Positions with focus data render the larger PositionFocusCard; the rest use
     the standard clickable card. */
  const renderPositionCard = (p: Pos, fullWidth = false) => {
    const focus = FOCUS_BY_TITLE[p.title];
    // Offset each position's funnel animation so the three cards look distinct.
    const phase = POSITIONS.findIndex(x => x.title === p.title) * 1.7;
    return focus
      ? <PositionFocusCard key={p.title} p={p} d={focus} onSelect={() => setSelected(p.title)} phase={phase} fullWidth={fullWidth} />
      : <PositionCard key={p.title} p={p} onSelect={() => setSelected(p.title)} fullWidth={fullWidth} />;
  };

  return (
    <div className="flex-1 flex flex-col min-h-0" style={{ background: '#0b1437' }}>

      {/* ══ Zone 1 — Compact storytelling hero ══ */}
      <header className="shrink-0 px-4 sm:px-6 lg:px-8 pt-4 lg:pt-[18px] pb-1" style={{ background: '#0b1437' }}>
        <div
          className="relative rounded-2xl border border-white/[0.08] px-5 sm:px-7 py-5 flex items-center justify-between gap-x-8 gap-y-5 flex-wrap"
          style={{ background: 'linear-gradient(120deg, #151e4a 0%, #1b2456 46%, #251a54 100%)' }}
        >
          {/* soft momentum glow — clipped to the card so it can't spill */}
          <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl">
            <div className="absolute -top-24 -right-12 w-[360px] h-[360px] rounded-full" style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.28), transparent 70%)' }} />
          </div>

          {/* eyebrow + title */}
          <div className="relative z-10 min-w-0">
            <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#a5b4fc]">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#34d399] shadow-[0_0_10px_rgba(52,211,153,0.85)]" />
              Live Pipeline · Techbridge GmbH
            </p>
            <h1 className="mt-1.5 text-[26px] leading-tight font-bold tracking-tight text-white">Talent Pipeline</h1>
          </div>

          {/* metrics */}
          <div className="relative z-10 flex items-center gap-x-5 sm:gap-7 gap-y-4 flex-wrap">
            <div className="flex items-center gap-x-5 sm:gap-7">
              <HeroMetric label="Active Positions" value={HERO_METRICS.active} />
              <span className="w-px h-9 bg-white/[0.10]" />
              <HeroMetric label="Pipeline Growth" value={HERO_METRICS.growth} delta={HERO_METRICS.growthDelta} />
              <span className="w-px h-9 bg-white/[0.10]" />
              <HeroMetric label="Ready to Interview" value={HERO_METRICS.ready} />
            </div>
          </div>
        </div>
      </header>

      {/* ══ Zones 2 + 3 ══ */}
      <div className="flex-1 flex min-h-0 items-stretch">

        {/* ── Zone 2 — Main content ── */}
        <main className="flex-1 min-w-0 overflow-y-auto page-top-fade px-4 sm:px-6 lg:px-8 py-6 lg:py-8">

          {/* A. Position Overview — click a card to open its candidate strip */}
          <section>
            <SectionLabel>Position Overview</SectionLabel>

            {selectedPos ? (
              <>
                {/* Row above: positions that come before the selected one */}
                {beforePositions.length > 0 && (
                  <div className={`${SCROLL_ROW} items-start -mx-2 px-2 pt-3 pb-4 animate-fade-scale-in`} style={{ scrollbarWidth: 'none', scrollSnapType: 'x mandatory' }}>
                    {beforePositions.map(p => renderPositionCard(p))}
                  </div>
                )}

                {/* Middle: full-width card encasing the position details (left) and
                    the horizontally scrollable candidate strip (right). */}
                <div
                  ref={expandedRef}
                  className="relative w-full rounded-[10px] border border-[#818cf8] shadow-[0_8px_24px_rgba(0,0,0,0.06)] animate-fade-scale-in flex items-stretch mt-3 overflow-hidden"
                  style={{ padding: '20px 0 20px 20px', background: CARD_GRADIENT }}
                >
                  <button
                    onClick={() => setSelected(null)}
                    aria-label="Close"
                    className="absolute top-3 right-3 z-10 w-6 h-6 rounded-full flex items-center justify-center text-[#94a3b8] hover:text-[#0f172a] hover:bg-[#f1f5f9] transition-colors"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
                  </button>

                  <div className="shrink-0" style={{ width: 'clamp(340px, 30vw, 460px)' }}>
                    <PositionDetails p={selectedPos} phase={selectedIdx * 1.7} />
                  </div>

                  <div className="w-px bg-[#e2e8f0] ml-5 self-stretch shrink-0" />

                  <div
                    className="flex-1 min-w-0 flex gap-5 items-center overflow-x-auto pl-5 [&::-webkit-scrollbar]:hidden"
                    style={{ scrollbarWidth: 'none', scrollSnapType: 'x mandatory', scrollPaddingLeft: 20 }}
                  >
                    {selectedCandidates.length > 0 ? (
                      selectedCandidates.map((c, i) => (
                        <div key={c.name} className="shrink-0 animate-panel-in" style={{ animationDelay: `${i * 60}ms`, scrollSnapAlign: 'start' }}>
                          <CandidateCard c={c} />
                        </div>
                      ))
                    ) : (
                      <div className="shrink-0 text-[13px] text-[#94a3b8] px-4 animate-panel-in">
                        No candidates yet for this position.
                      </div>
                    )}
                    {/* trailing spacer so the last card keeps a gap from the card's right edge */}
                    <div aria-hidden className="shrink-0" style={{ width: 1 }} />
                  </div>
                </div>

                {/* Row below: positions that come after the selected one */}
                {afterPositions.length > 0 && (
                  <div className={`${SCROLL_ROW} items-start -mx-2 px-2 pt-3 pb-4 mt-2 animate-fade-scale-in`} style={{ scrollbarWidth: 'none', scrollSnapType: 'x mandatory' }}>
                    {afterPositions.map(p => renderPositionCard(p))}
                  </div>
                )}
              </>
            ) : (
              /* Horizontal scroll row — fixed-width cards, scrolls right when they
                 overflow, flush with the header's left edge. */
              <div className={`${SCROLL_ROW} items-start -mx-2 px-2 pt-3 pb-4`} style={{ scrollbarWidth: 'none', scrollSnapType: 'x mandatory' }}>
                {POSITIONS.map(p => renderPositionCard(p))}
              </div>
            )}
          </section>

          {/* A2. Statistics — left: weekly activity + drop-off diagnostics, stacked;
               right: full-height candidate locations map. All blocks share a position filter. */}
          <section className="mt-11">
            <SectionLabel>Statistics</SectionLabel>

            {/* Position filter — centred so it reads as the section control */}
            <div className="flex justify-center mb-6">
              <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-[#111a3c] border border-white/[0.08]">
                {STAT_FILTERS.map(f => (
                  <button
                    key={f.key}
                    onClick={() => setStatFilter(f.key)}
                    className={`text-[13px] font-medium px-4 py-2 rounded-lg transition-colors ${
                      statFilter === f.key ? 'bg-[#4f46e5] text-white shadow-[0_2px_8px_rgba(79,70,229,0.4)]' : 'text-[#94a3b8] hover:text-white hover:bg-white/5'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 pt-1 items-stretch">
              {/* Left column: two blocks split exactly 50/50 over the full height */}
              <div className="grid grid-rows-2 gap-6 h-full">
                <WeeklyActivityCard data={WEEKLY_ACTIVITY_BY[statFilter]} />
                <DropOffCard d={DROPOFF_BY[statFilter]} />
              </div>

              {/* Right column: candidate locations map (stretches to full height) */}
              <LocationsCard pts={locations.pts} total={locations.total} />
            </div>
          </section>

          {/* B. Candidate Pipeline — interactive drag-and-drop board */}
          <section className="mt-12">
            <SectionLabel>Candidate Pipeline</SectionLabel>
            <PipelineBoard positions={POSITIONS.map(p => p.title)} />
          </section>

          {/* D. Outreach Funnel — flow-chart view of the same channels (Meta/Google → Wandel → Sophia/HR) */}
          <section className="mt-12">
            <SectionLabel>Outreach Funnel</SectionLabel>
            <div className="overflow-x-auto pb-2">
              <OutreachFunnel />
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
