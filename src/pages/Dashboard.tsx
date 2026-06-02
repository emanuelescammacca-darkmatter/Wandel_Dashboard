import { useState, useRef, useEffect } from 'react';

/* ──────────────────────────────────────────────────────────────────────────
   Client-facing recruiting dashboard — Design v4.
   Three structural zones: dark header band · white main · off-white right rail.
   ────────────────────────────────────────────────────────────────────────── */

const KPIS = [
  { value: '3', label: 'Open Positions' },
  { value: '24', label: 'Candidates in Pipeline' },
  { value: '8', label: 'Qualified' },
  { value: '3', label: 'Interview Ready' },
];

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

type Cand = {
  name: string; position: string; summary: string;
  stage: 'Interview Ready' | 'Qualified';
  fit: string; rank: string; available: string; experience: string; color: string;
};

const CANDIDATES: Cand[] = [
  { name: 'Andi Kufner', position: 'Servicetechniker für Kaffeeautomaten', summary: 'Strong technical fit · Available May 2026', stage: 'Interview Ready', fit: '87% fit', rank: '#1 of 21', available: 'May 2026', experience: '8 yrs', color: '#4f46e5' },
  { name: 'Klaus Müller', position: 'Lagerlogistiker', summary: 'Experienced coordinator · Available immediately', stage: 'Interview Ready', fit: '91% fit', rank: '#1 of 16', available: 'Immediately', experience: '12 yrs', color: '#0891b2' },
  { name: 'Lukas Schneider', position: 'Servicetechniker für Kaffeeautomaten', summary: 'Solid field service background · Available June 2026', stage: 'Qualified', fit: '79% fit', rank: '#2 of 21', available: 'June 2026', experience: '5 yrs', color: '#16a34a' },
  { name: 'Mateusz Nowak', position: 'Servicetechniker für Kaffeeautomaten', summary: 'Transferable skills · Available June 2026', stage: 'Qualified', fit: '76% fit', rank: '#3 of 21', available: 'June 2026', experience: '6 yrs', color: '#d97706' },
];

const CANDIDATES_MORE: Cand[] = [
  { name: 'Sarah Klein', position: 'Bürokauffrau', summary: 'Organised and detail-oriented · Available July 2026', stage: 'Qualified', fit: '74% fit', rank: '#1 of 12', available: 'Jul 2026', experience: '4 yrs', color: '#7c3aed' },
  { name: 'Thomas Bauer', position: 'Lagerlogistiker', summary: 'Strong forklift experience · Available June 2026', stage: 'Qualified', fit: '71% fit', rank: '#2 of 16', available: 'Jun 2026', experience: '7 yrs', color: '#0369a1' },
  { name: 'Elena Hoffmann', position: 'Bürokauffrau', summary: 'Fluent in English and German · Available August 2026', stage: 'Qualified', fit: '68% fit', rank: '#2 of 12', available: 'Aug 2026', experience: '3 yrs', color: '#be185d' },
  { name: 'Jürgen Stein', position: 'Servicetechniker für Kaffeeautomaten', summary: 'Experienced field technician · Available July 2026', stage: 'Qualified', fit: '65% fit', rank: '#4 of 21', available: 'Jul 2026', experience: '9 yrs', color: '#b45309' },
];

/* Aggregate outreach (across all positions). bars = last 5 days (Mon–Fri). */
const OUTREACH: { key?: ChannelKey; label: string; barColor: string; bars: number[]; contacted: number; responses: number; custom?: boolean; hr?: boolean }[] = [
  { key: 'sophia', label: 'Sophia AI', barColor: '#4f46e5', bars: [16, 20, 14, 22, 18], contacted: 42, responses: 16 },
  { key: 'whatsapp', label: 'WhatsApp', barColor: '#25d366', bars: [12, 18, 22, 16, 20], contacted: 30, responses: 22 },
  { key: 'instagram', label: 'Instagram', barColor: '#d6249f', bars: [20, 14, 18, 12, 16], contacted: 50, responses: 12 },
  { key: 'facebook', label: 'Facebook', barColor: '#1877f2', bars: [8, 10, 6, 12, 8], contacted: 18, responses: 6 },
  { label: 'HR Team', barColor: '#0f766e', bars: [10, 14, 8, 12, 10], contacted: 28, responses: 19, hr: true },
  { key: 'metaads', label: 'Meta Ads', barColor: '#0081fb', bars: [18, 22, 20, 24, 22], contacted: 65, responses: 15 },
  { key: 'sophia', label: 'Sophia AI ✦', barColor: '#4f46e5', bars: [16, 20, 14, 22, 18], contacted: 42, responses: 16, custom: true },
];

const STAGE_PILL: Record<string, string> = {
  'Interview Ready': 'text-[#16a34a] bg-[#f0fdf4] border-[#bbf7d0]',
  Qualified: 'text-[#4f46e5] bg-[#eef2ff] border-[#c7d2fe]',
};
const FIT_BADGE: Record<string, string> = {
  'Interview Ready': 'text-[#15803d] bg-[#f0fdf4] border-[#bbf7d0]',
  Qualified: 'text-[#4338ca] bg-[#eef2ff] border-[#c7d2fe]',
};

const initials = (n: string) => n.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

/* Soft pastel linear gradient (Figma colors #FFEB52 / #52F9FF / #5252FF / #FF00B8) at low
   opacity over white — cyan/green pushed to the top-left corner, pink centred. */
const CARD_GRADIENT =
  'linear-gradient(135deg, rgba(82,249,255,0.035) 0%, rgba(82,82,255,0.028) 26%, rgba(255,0,184,0.04) 52%, rgba(255,235,82,0.025) 100%), #ffffff';

const SCROLL_ROW = 'flex gap-5 overflow-x-auto pb-3 [&::-webkit-scrollbar]:hidden';

/* ── Section label (L0 + full-width rule) ── */
function SectionLabel({ children, trailing }: { children: React.ReactNode; trailing?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <span className="text-[10px] uppercase tracking-[0.1em] font-semibold text-[#94a3b8] whitespace-nowrap">{children}</span>
      {trailing}
      <span className="flex-1 h-px bg-[#e2e8f0]" />
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

/* HR Team — human recruiters making direct phone calls (teal, distinct from channels). */
function HRLogo() {
  return (
    <div className="w-13 h-13 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: '#0f766e', overflow: 'hidden' }}>
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.41 2 2 0 0 1 3.6 1.21h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.85a16 16 0 0 0 6.29 6.29l.95-.95a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
      </svg>
    </div>
  );
}

/* ── Candidate card (reused by both rows). noAvatar drops the avatar and
   lifts the name onto the badge row (used for cards 3 & 4). ── */
function CandidateCard({ c, noAvatar }: { c: Cand; noAvatar?: boolean }) {
  const badges = (
    <div className="flex gap-1.5 items-center shrink-0">
      <span className={`text-[11px] font-semibold rounded-full px-2 py-0.5 border ${FIT_BADGE[c.stage]}`}>{c.fit}</span>
      <span className="text-[10px] font-semibold rounded-full px-2 py-0.5 bg-[#e0e7ff] text-[#3730a3] border border-[#c7d2fe]">{c.rank}</span>
    </div>
  );
  return (
    <div className="rounded-[10px] border border-[#e2e8f0] flex flex-col shrink-0" style={{ minWidth: 280, minHeight: 240, padding: '16px 16px 12px', scrollSnapAlign: 'start', background: CARD_GRADIENT }}>
      {noAvatar ? (
        <div className="flex justify-between items-start gap-2">
          <div className="min-w-0">
            <p className="text-[14px] font-semibold text-[#0f172a] leading-tight">{c.name}</p>
            <p className="text-[12px] text-[#64748b] truncate max-w-full" title={c.position}>{c.position}</p>
          </div>
          {badges}
        </div>
      ) : (
        <>
          <div className="flex items-start justify-between">
            <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-[13px] font-semibold" style={{ background: c.color }}>{initials(c.name)}</div>
            {badges}
          </div>
          <p className="text-[14px] font-semibold text-[#0f172a] leading-tight mt-2.5">{c.name}</p>
          <p className="text-[12px] text-[#64748b] truncate max-w-full" title={c.position}>{c.position}</p>
        </>
      )}

      <p className="text-[12px] italic text-[#94a3b8] mt-1.5 line-clamp-2 leading-snug">{c.summary}</p>

      <div className="grid grid-cols-2 gap-2 mt-2.5">
        <div><span className="text-[11px] text-[#94a3b8]">Available: </span><span className="text-[11px] font-semibold text-[#0f172a]">{c.available}</span></div>
        <div><span className="text-[11px] text-[#94a3b8]">Experience: </span><span className="text-[11px] font-semibold text-[#0f172a]">{c.experience}</span></div>
      </div>

      <div className="mt-auto pt-2.5 flex items-center justify-between">
        <span className={`text-[11px] rounded-full px-2 py-0.5 border ${STAGE_PILL[c.stage]}`}>{c.stage}</span>
        <a href="#" className="text-[12px] text-[#4f46e5] no-underline hover:underline">View profile →</a>
      </div>
    </div>
  );
}

/* All candidates (top + extra), used to match a position to its candidates. */
const ALL_CANDIDATES = [...CANDIDATES, ...CANDIDATES_MORE];

/* ── Inner position content (no card chrome) — reused by the collapsed card
   and as the left column of the expanded full-width card. ── */
function PositionDetails({ p }: { p: Pos }) {
  return (
    <div className="flex flex-col h-full">
      {/* Section 1 — header */}
      <div className="flex items-center justify-between gap-3 pr-6">
        <h3 className="text-[14px] font-semibold text-[#0f172a] truncate" title={p.title}>{p.title}</h3>
        <span className="shrink-0 text-[11px] rounded-full px-2 py-0.5 text-[#16a34a] bg-[#f0fdf4] border border-[#bbf7d0]">{p.status}</span>
      </div>

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

      {/* Section 6 — footer */}
      <div className="mt-auto pt-2.5 text-right">
        <a href="#" onClick={e => e.stopPropagation()} className="text-[12px] text-[#4f46e5] no-underline hover:underline">View position →</a>
      </div>
    </div>
  );
}

/* ── Collapsed, clickable position card (default row + below row). ── */
function PositionCard({ p, onSelect }: { p: Pos; onSelect?: () => void }) {
  return (
    <div
      onClick={onSelect}
      className="rounded-[10px] border border-[#e2e8f0] flex flex-col shrink-0 cursor-pointer transition-all duration-200 hover:-translate-y-[3px] hover:border-[#c7d2fe] hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)]"
      style={{ minWidth: 420, width: 420, padding: '20px 20px 14px', scrollSnapAlign: 'start', background: CARD_GRADIENT }}
    >
      <PositionDetails p={p} />
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────────────
   Cardless metric diagrams (blend into the navy background).
   ────────────────────────────────────────────────────────────────────────── */

function MetricLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-[10px] uppercase tracking-[0.1em] font-semibold text-[#94a3b8]">{children}</p>;
}

/* Smooth-ish area sparkline. */
function AreaSpark({ data, stroke = '#a5b4fc', w = 240, h = 56 }: { data: number[]; stroke?: string; w?: number; h?: number }) {
  const max = Math.max(...data), min = Math.min(...data);
  const span = max - min || 1;
  const step = w / (data.length - 1);
  const pts = data.map((v, i) => [i * step, h - ((v - min) / span) * (h - 6) - 3]);
  const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ');
  const area = `${line} L${w} ${h} L0 ${h} Z`;
  const id = `spark-${stroke.replace('#', '')}`;
  return (
    <svg width="100%" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{ display: 'block' }}>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={stroke} stopOpacity={0.35} />
          <stop offset="100%" stopColor={stroke} stopOpacity={0} />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${id})`} />
      <path d={line} fill="none" stroke={stroke} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* Donut from labelled segments. */
function Donut({ segments, total, sub }: { segments: { label: string; value: number; color: string }[]; total: number; sub: string }) {
  const r = 34, c = 2 * Math.PI * r;
  let offset = 0;
  return (
    <div className="flex items-center gap-4">
      <svg width={88} height={88} viewBox="0 0 88 88" className="shrink-0 -rotate-90">
        <circle cx={44} cy={44} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={11} />
        {segments.map((s, i) => {
          const len = (s.value / total) * c;
          const el = (
            <circle key={i} cx={44} cy={44} r={r} fill="none" stroke={s.color} strokeWidth={11}
              strokeDasharray={`${len} ${c - len}`} strokeDashoffset={-offset} />
          );
          offset += len;
          return el;
        })}
      </svg>
      <div className="min-w-0">
        <p className="text-[20px] font-bold text-white leading-none">{total}</p>
        <p className="text-[11px] text-[#94a3b8] mb-2">{sub}</p>
        <div className="flex flex-col gap-1">
          {segments.map((s, i) => (
            <div key={i} className="flex items-center gap-1.5 text-[10px] text-[#cbd5e1]">
              <span className="w-2 h-2 rounded-sm shrink-0" style={{ background: s.color }} />
              <span className="truncate">{s.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* 270° radial gauge. */
function RadialGauge({ pct, accent = '#34d399', center, sub }: { pct: number; accent?: string; center: string; sub: string }) {
  const r = 40, gap = 90, arc = 360 - gap;
  const c = 2 * Math.PI * r;
  const track = (arc / 360) * c;
  const val = (pct / 100) * track;
  return (
    <div className="flex items-center gap-4">
      <svg width={96} height={96} viewBox="0 0 96 96" className="shrink-0" style={{ transform: 'rotate(135deg)' }}>
        <circle cx={48} cy={48} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={9}
          strokeLinecap="round" strokeDasharray={`${track} ${c - track}`} />
        <circle cx={48} cy={48} r={r} fill="none" stroke={accent} strokeWidth={9}
          strokeLinecap="round" strokeDasharray={`${val} ${c - val}`} />
      </svg>
      <div>
        <p className="text-[22px] font-bold text-white leading-none">{center}</p>
        <p className="text-[11px] text-[#94a3b8] mt-1 max-w-[120px] leading-snug">{sub}</p>
      </div>
    </div>
  );
}

/* Aggregates derived from existing data. */
const AGG_FUNNEL = POSITIONS.reduce(
  (acc, p) => p.funnel.map((v, i) => acc[i] + v) as [number, number, number, number],
  [0, 0, 0, 0] as [number, number, number, number],
);
const PIPELINE_TREND = [12, 14, 15, 18, 19, 21, 22, 24];
const REACH_SEGMENTS = [
  { label: 'Meta Ads', value: 65, color: '#0081fb' },
  { label: 'Instagram', value: 50, color: '#ec4899' },
  { label: 'Sophia AI', value: 42, color: '#6366f1' },
  { label: 'WhatsApp', value: 30, color: '#16a34a' },
  { label: 'HR Team', value: 28, color: '#0f766e' },
  { label: 'Facebook', value: 18, color: '#2563eb' },
];
const REACH_TOTAL = REACH_SEGMENTS.reduce((a, s) => a + s.value, 0);
const FUNNEL_LABELS = ['Identified', 'Responded', 'Qualified', 'Interview Ready'];
const FUNNEL_COLORS = ['#64748b', '#818cf8', '#6366f1', '#34d399'];

export default function Dashboard() {
  const [showMore, setShowMore] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);

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

  return (
    <div className="flex-1 flex flex-col min-h-0" style={{ background: '#0b1437' }}>

      {/* ══ Zone 1 — Dark header band (100px) ══ */}
      <header className="shrink-0 px-8 flex items-center justify-between gap-8" style={{ background: '#0b1437', height: 100 }}>
        <div>
          <h1 className="text-[20px] font-bold text-white leading-tight">Talent Pipeline</h1>
          <p className="text-[12px] text-[#94a3b8] mt-[3px]">Your active positions and candidates, always up to date.</p>
        </div>

        <div className="flex items-center">
          {KPIS.map((k, i) => (
            <div key={k.label} className="flex items-center">
              {i > 0 && <span className="mx-8" style={{ width: 1, height: 32, background: 'rgba(255,255,255,0.12)' }} />}
              <div className="flex flex-col items-center text-center">
                <p className="text-[26px] font-bold text-white leading-none">{k.value}</p>
                <p className="text-[10px] uppercase tracking-[0.08em] text-[#94a3b8] mt-1">{k.label}</p>
              </div>
            </div>
          ))}
        </div>
      </header>

      {/* ══ Zones 2 + 3 ══ */}
      <div className="flex-1 flex min-h-0 items-stretch">

        {/* ── Zone 2 — Main content ── */}
        <main className="flex-1 min-w-0 overflow-y-auto" style={{ padding: '32px 28px' }}>

          {/* A. Position Overview — click a card to open its candidate strip */}
          <section>
            <SectionLabel>Position Overview</SectionLabel>

            {selectedPos ? (
              <>
                {/* Row above: positions that come before the selected one */}
                {beforePositions.length > 0 && (
                  <div className={`${SCROLL_ROW} -mx-2 px-2 pt-3 pb-4 animate-fade-scale-in`} style={{ scrollbarWidth: 'none', scrollSnapType: 'x mandatory' }}>
                    {beforePositions.map(p => (
                      <PositionCard key={p.title} p={p} onSelect={() => setSelected(p.title)} />
                    ))}
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

                  <div className="shrink-0 w-[420px]">
                    <PositionDetails p={selectedPos} />
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
                  <div className={`${SCROLL_ROW} -mx-2 px-2 pt-3 pb-4 mt-2 animate-fade-scale-in`} style={{ scrollbarWidth: 'none', scrollSnapType: 'x mandatory' }}>
                    {afterPositions.map(p => (
                      <PositionCard key={p.title} p={p} onSelect={() => setSelected(p.title)} />
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className={`${SCROLL_ROW} -mx-2 px-2 pt-3 pb-4`} style={{ scrollbarWidth: 'none', scrollSnapType: 'x mandatory' }}>
                {POSITIONS.map(p => (
                  <PositionCard key={p.title} p={p} onSelect={() => setSelected(p.title)} />
                ))}
              </div>
            )}
          </section>

          {/* A2. Performance snapshot — cardless diagrams blended on the navy bg */}
          <section className="mt-11">
            <SectionLabel>Performance Snapshot</SectionLabel>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8 pt-1">

              {/* Pipeline trend */}
              <div>
                <MetricLabel>In Pipeline</MetricLabel>
                <div className="flex items-end gap-2 mt-2 mb-2.5">
                  <span className="text-[28px] font-bold text-white leading-none">24</span>
                  <span className="text-[12px] font-semibold text-[#34d399] mb-1">+5 this week</span>
                </div>
                <AreaSpark data={PIPELINE_TREND} />
                <p className="text-[10px] text-[#94a3b8] mt-1.5">Candidates in pipeline · last 8 weeks</p>
              </div>

              {/* Funnel conversion */}
              <div>
                <MetricLabel>Funnel Conversion</MetricLabel>
                <div className="flex flex-col gap-2.5 mt-3">
                  {FUNNEL_LABELS.map((label, i) => (
                    <div key={label}>
                      <div className="flex justify-between text-[11px] mb-1">
                        <span className="text-[#cbd5e1]">{label}</span>
                        <span className="text-white font-semibold tabular-nums">{AGG_FUNNEL[i]}</span>
                      </div>
                      <div className="h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.08)' }}>
                        <div className="h-full rounded-full" style={{ width: `${(AGG_FUNNEL[i] / AGG_FUNNEL[0]) * 100}%`, background: FUNNEL_COLORS[i] }} />
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-[10px] text-[#94a3b8] mt-2.5">Interview-ready rate · {((AGG_FUNNEL[3] / AGG_FUNNEL[0]) * 100).toFixed(1)}%</p>
              </div>

              {/* Reach by channel */}
              <div>
                <MetricLabel>Reach by Channel</MetricLabel>
                <div className="mt-3">
                  <Donut segments={REACH_SEGMENTS} total={REACH_TOTAL} sub="candidates reached" />
                </div>
              </div>

              {/* Qualification rate */}
              <div>
                <MetricLabel>Qualification Rate</MetricLabel>
                <div className="mt-3">
                  <RadialGauge pct={30} center="30%" sub="of responses move to Qualified" />
                </div>
              </div>
            </div>
          </section>

          {/* B. Top Candidates — horizontal scroll + show more */}
          <section className="mt-12">
            <SectionLabel>Top Candidates</SectionLabel>
            <div className={SCROLL_ROW} style={{ scrollbarWidth: 'none', scrollSnapType: 'x mandatory' }}>
              {CANDIDATES.map((c, i) => <CandidateCard key={c.name} c={c} noAvatar={i === 2 || i === 3} />)}
            </div>

            {showMore && (
              <div className={`${SCROLL_ROW} mt-4`} style={{ scrollbarWidth: 'none', scrollSnapType: 'x mandatory' }}>
                {CANDIDATES_MORE.map(c => <CandidateCard key={c.name} c={c} />)}
              </div>
            )}

            <div className="flex justify-center mt-4">
              <button
                onClick={() => setShowMore(s => !s)}
                className="text-[12px] text-[#4f46e5] underline [text-underline-offset:3px] hover:text-[#3730a3] transition-colors cursor-pointer"
              >
                {showMore ? 'Show less' : 'Show more candidates'}
              </button>
            </div>
          </section>

          {/* C. Outreach Channels — brand logos + sparklines */}
          <section className="mt-12">
            <SectionLabel>Outreach Channels</SectionLabel>
            <div className="flex justify-between gap-4 pt-1">
              {OUTREACH.map((o, idx) => (
                <div key={idx} className="flex-1 flex justify-center">
                  <div className="relative group flex flex-col items-center text-center rounded-xl border border-white/[0.07] py-4 px-3 w-32">
                  {o.custom ? <SophiaImageLogo /> : o.hr ? <HRLogo /> : <OutreachLogo k={o.key!} />}
                  <p className="text-[12px] font-semibold text-white mt-2">{o.label}</p>

                  {/* sparkline */}
                  <div className="flex items-end gap-1 mt-2" style={{ height: 28 }}>
                    {o.bars.map((h, i) => (
                      <div key={i} className="flex flex-col items-center">
                        <span style={{ width: 6, height: h, background: o.barColor, borderTopLeftRadius: 3, borderTopRightRadius: 3 }} />
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-1 mt-0.5">
                    {['M', 'T', 'W', 'T', 'F'].map((d, i) => (
                      <span key={i} className="text-[8px] text-[#94a3b8] text-center" style={{ width: 6 }}>{d}</span>
                    ))}
                  </div>

                  <p className="text-[11px] text-[#94a3b8] mt-1.5">{o.contacted} contacted</p>
                  <ChannelTip name={o.label} contacted={o.contacted} responses={o.responses} />
                  </div>
                </div>
              ))}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
