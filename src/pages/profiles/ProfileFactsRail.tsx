import { useState, useRef, useEffect } from 'react';
import wandelLogo from '../../assets/wandel-logo.png';
import type { Candidate } from '../../types';
import { CARD_GRADIENT } from '../../theme';
import { ChannelIcon } from '../../components/ChannelBadge';
import {
  ageFromDob, formatDate, formatSalary, driversLicenseLabel, initials,
  EDUCATION_TYPE_LABEL, BackLink, Icons, Glyph,
} from './shared';

/* ── Design A — "Nova": dark page + top bar, light gradient body cards ── */

const EMPLOYMENT_LABEL: Record<string, string> = {
  'looking-for-job': 'Looking for a job',
  employed: 'Employed',
  unemployed: 'Unemployed',
  applying: 'Applying',
  'interview-scheduled': 'Interview scheduled',
  'not-interested': 'Not interested',
};

const WANDEL_INDIGO = 'brightness(0) saturate(100%) invert(57%) sepia(73%) saturate(1752%) hue-rotate(213deg) brightness(99%) contrast(96%)';

/* Dark glass panel (top bar). */
function GlassPanel({ className = '', style, children }: { className?: string; style?: React.CSSProperties; children: React.ReactNode }) {
  return <div className={`rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl ${className}`} style={style}>{children}</div>;
}

/* Light gradient card (body). */
function Card({ className = '', children }: { className?: string; children: React.ReactNode }) {
  return <div className={`rounded-2xl border border-[#e6e9f2] ${className}`} style={{ background: CARD_GRADIENT }}>{children}</div>;
}

function SectionTitle({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2.5 mb-5">
      <span className="w-7 h-7 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-500 flex items-center justify-center shrink-0">
        <Glyph className="w-4 h-4">{icon}</Glyph>
      </span>
      <h3 className="text-sm font-semibold text-[#0f172a] tracking-wide">{children}</h3>
    </div>
  );
}

function FactRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <span className="w-9 h-9 rounded-xl bg-[#f1f5f9] border border-[#e2e8f0] text-indigo-500 flex items-center justify-center shrink-0">
        <Glyph className="w-4 h-4">{icon}</Glyph>
      </span>
      <div className="min-w-0">
        <p className="text-[10px] uppercase tracking-[0.12em] text-[#94a3b8]">{label}</p>
        <div className="text-[13px] text-[#0f172a] mt-0.5 break-words">{value ?? <span className="text-[#cbd5e1]">—</span>}</div>
      </div>
    </div>
  );
}

const RAIL_LABEL = 'text-[10px] uppercase tracking-[0.16em] text-[#94a3b8]';

export default function ProfileFactsRail({ candidate, onBack, backLabel }: { candidate: Candidate; onBack: () => void; backLabel: string }) {
  const age = ageFromDob(candidate.dateOfBirth);
  const [notes, setNotes] = useState('');
  const [saved, setSaved] = useState(false);
  const [flipped, setFlipped] = useState(false);
  const handleSave = () => { setSaved(true); setTimeout(() => setSaved(false), 1800); };

  const germanPill = candidate.germanLevel ? (
    <span className="inline-block text-[11px] px-2 py-0.5 rounded-full bg-cyan-50 border border-cyan-200 text-cyan-700 font-medium">{candidate.germanLevel}</span>
  ) : null;

  // Size the flip card to whichever face is showing (no wasted empty space).
  const frontRef = useRef<HTMLDivElement>(null);
  const backRef = useRef<HTMLDivElement>(null);
  const [cardH, setCardH] = useState<number | undefined>(undefined);
  useEffect(() => {
    const measure = () => {
      const el = flipped ? backRef.current : frontRef.current;
      if (el) setCardH(el.offsetHeight);
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [flipped]);

  return (
    <div
      className="flex-1 overflow-y-auto text-slate-200"
      style={{
        background:
          'radial-gradient(1200px 520px at 12% -12%, rgba(99,102,241,0.20), transparent 60%),' +
          'radial-gradient(1000px 520px at 96% -4%, rgba(34,211,238,0.13), transparent 55%),' +
          'radial-gradient(900px 600px at 70% 110%, rgba(168,85,247,0.10), transparent 60%), #0a1130',
      }}
    >
      <div className="px-6 py-6">
        <BackLink label={backLabel} onClick={onBack} tone="dark" />

        {/* ══ Top bar ══ */}
        <GlassPanel className="mt-5 relative overflow-hidden px-6 py-4">
          <div className="absolute -top-20 -right-10 w-64 h-64 rounded-full blur-3xl pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(129,140,248,0.22), transparent 70%)' }} />
          <div className="relative flex items-center gap-4 flex-wrap">
            <div className="p-[2px] rounded-xl bg-gradient-to-br from-indigo-400 via-violet-400 to-cyan-300 shrink-0 shadow-[0_0_22px_rgba(129,140,248,0.4)]">
              <div className="w-12 h-12 rounded-xl bg-[#0c1330] flex items-center justify-center text-base font-semibold text-white">
                {initials(candidate.firstName, candidate.lastName)}
              </div>
            </div>
            <div className="min-w-0">
              <h1 className="text-2xl font-bold leading-tight bg-gradient-to-r from-white via-indigo-100 to-cyan-200 bg-clip-text text-transparent">
                {candidate.firstName} {candidate.lastName}
              </h1>
              <p className="text-sm text-slate-400 mt-0.5">{candidate.jobTitle}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-full bg-emerald-400/10 border border-emerald-400/30 text-emerald-300">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.85)]" />
                {EMPLOYMENT_LABEL[candidate.employmentStatus] ?? candidate.employmentStatus}
              </span>
              <span className="inline-flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-full bg-white/[0.04] border border-white/10 text-slate-300">
                <ChannelIcon channel={candidate.source} />
                <span className="capitalize">{candidate.source}</span>
              </span>
            </div>

            {/* Far-right actions */}
            <div className="ml-auto flex items-center gap-3">
              <button className="inline-flex items-center gap-2 text-[13px] font-medium px-4 py-2 rounded-lg border border-indigo-400/30 bg-indigo-400/10 text-indigo-200 hover:bg-indigo-400/20 transition-colors">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round"><path d="M12 3l1.8 4.2L18 9l-4.2 1.8L12 15l-1.8-4.2L6 9l4.2-1.8L12 3z" /></svg>
                Evaluate Candidate
              </button>
              <button className="inline-flex items-center gap-2 text-[13px] font-medium px-4 py-2 rounded-lg border border-white/15 bg-white/[0.04] text-slate-200 hover:bg-white/[0.08] hover:border-white/25 transition-colors">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v11m0 0l-4-4m4 4l4-4M5 19h14" /></svg>
                Download CV
              </button>
            </div>
          </div>
        </GlassPanel>

        {/* ══ Body ══ */}
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-6 items-start">

          {/* Left rail */}
          <Card className="p-6 flex flex-col gap-6 lg:sticky lg:top-6">
            <div>
              <p className={`${RAIL_LABEL} mb-4`}>Contact &amp; Person</p>
              <div className="flex flex-col gap-4">
                <FactRow icon={Icons.phone} label="Phone" value={candidate.phoneNumber} />
                <FactRow icon={Icons.mail} label="Email" value={candidate.email} />
                <FactRow icon={Icons.cake} label="Birthday" value={candidate.dateOfBirth ? `${formatDate(candidate.dateOfBirth)}${age ? ` · ${age}` : ''}` : null} />
                <FactRow icon={Icons.pin} label="Address" value={candidate.address} />
                <FactRow icon={Icons.globe} label="Nationality" value={candidate.nationality} />
              </div>
            </div>
            <div className="h-px bg-[#e6e9f2]" />
            <div>
              <p className={`${RAIL_LABEL} mb-4`}>Conditions</p>
              <div className="flex flex-col gap-4">
                <FactRow icon={Icons.language} label="German level" value={germanPill} />
                <FactRow icon={Icons.car} label="Driver's licence" value={driversLicenseLabel(candidate.driversLicense, candidate.licenseClasses)} />
                <FactRow icon={Icons.clock} label="Notice period" value={candidate.noticePeriod} />
                <FactRow icon={Icons.euro} label="Salary expectation" value={formatSalary(candidate.salary)} />
              </div>
            </div>
            <div className="h-px bg-[#e6e9f2]" />
            <div className="flex flex-col">
              <p className={`${RAIL_LABEL} mb-3`}>Notes</p>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Add a private note about this candidate…"
                className="w-full min-h-[150px] resize-none rounded-xl border border-[#e2e8f0] bg-[#f8fafc] p-3 text-[13px] text-[#0f172a] placeholder-[#94a3b8] leading-relaxed focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-200"
              />
              <button
                onClick={handleSave}
                className={`mt-3 self-end text-[12px] font-medium px-4 py-1.5 rounded-lg border transition-colors ${
                  saved
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                    : 'border-indigo-200 bg-indigo-50 text-indigo-600 hover:bg-indigo-100'
                }`}
              >
                {saved ? 'Saved ✓' : 'Save note'}
              </button>
            </div>
          </Card>

          {/* Right column */}
          <div className="flex flex-col gap-6 min-w-0">

            {/* Assessment ⇄ Client Questions — 3D flip card */}
            <div className="[perspective:1800px]">
              <div
                className="relative transition-[height,transform] duration-500 [transform-style:preserve-3d]"
                style={{ height: cardH, transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)' }}
              >
                {/* FRONT — Our Assessment */}
                <div ref={frontRef} className="absolute inset-x-0 top-0 [backface-visibility:hidden]">
                  <Card className="relative overflow-hidden p-6">
                    <div className="absolute inset-0 pointer-events-none" style={{ background: 'linear-gradient(120deg, rgba(99,102,241,0.08), transparent 45%)' }} />
                    <div className="relative">
                      <div className="flex items-center justify-between gap-3 mb-3">
                        <div className="flex items-center gap-2.5">
                          <span role="img" aria-label="Wandel" className="inline-block shrink-0" style={{ width: 20, height: 20, backgroundImage: `url(${wandelLogo})`, backgroundRepeat: 'no-repeat', backgroundSize: '28.9px 28.9px', backgroundPosition: '-4.6px -2.4px', filter: WANDEL_INDIGO }} />
                          <h3 className="text-sm font-semibold text-[#0f172a]">Our Assessment</h3>
                        </div>
                        <button
                          onClick={() => setFlipped(true)}
                          title="Show client questions"
                          className="inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-lg border border-cyan-200 bg-cyan-50 text-cyan-700 hover:bg-cyan-100 transition-colors shrink-0"
                        >
                          <Glyph className="w-3.5 h-3.5">{Icons.chat}</Glyph>
                          Q&amp;A
                        </button>
                      </div>
                      <p className="text-[15px] leading-relaxed text-[#334155]">{candidate.assessment}</p>
                    </div>
                  </Card>
                </div>

                {/* BACK — Client Questions */}
                <div ref={backRef} className="absolute inset-x-0 top-0 [backface-visibility:hidden] [transform:rotateY(180deg)]">
                  <Card className="p-6">
                    <div className="flex items-center justify-between gap-3 mb-5">
                      <div className="flex items-center gap-2.5">
                        <span className="w-7 h-7 rounded-lg bg-cyan-50 border border-cyan-200 text-cyan-600 flex items-center justify-center shrink-0">
                          <Glyph className="w-4 h-4">{Icons.chat}</Glyph>
                        </span>
                        <h3 className="text-sm font-semibold text-[#0f172a] tracking-wide">Client Questions</h3>
                      </div>
                      <button
                        onClick={() => setFlipped(false)}
                        title="Back to assessment"
                        className="w-7 h-7 rounded-lg border border-indigo-200 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 flex items-center justify-center transition-colors shrink-0"
                      >
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
                          <path d="M3 11a8 8 0 0 1 13.5-5.8L20 8" /><path d="M20 4v4h-4" />
                          <path d="M21 13a8 8 0 0 1-13.5 5.8L4 16" /><path d="M4 20v-4h4" />
                        </svg>
                      </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                      {(candidate.clientQuestions ?? []).map((q, i) => (
                        <div key={i}>
                          <div className="flex gap-2.5">
                            <span className="w-5 h-5 rounded-md bg-cyan-50 border border-cyan-200 text-cyan-700 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">Q</span>
                            <p className="text-[13px] font-medium text-[#0f172a]">{q.question}</p>
                          </div>
                          <div className="flex gap-2.5 mt-2">
                            <span className="w-5 h-5 rounded-md bg-indigo-50 border border-indigo-200 text-indigo-600 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">A</span>
                            <p className="text-[13px] text-[#475569] leading-relaxed">{q.answer}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                </div>
              </div>
            </div>

            {/* Experience — bullseye timeline */}
            <Card className="p-6">
              <SectionTitle icon={Icons.briefcase}>Experience</SectionTitle>
              <ol className="relative flex flex-col gap-7 pl-9">
                <span
                  aria-hidden
                  className="absolute left-[10px] top-2 bottom-3 w-[2px] rounded-full"
                  style={{ background: 'linear-gradient(to bottom, #6366f1 0%, rgba(99,102,241,0.55) 50%, rgba(99,102,241,0.12) 100%)' }}
                />
                {(candidate.experiences ?? []).map((exp, i) => (
                  <li key={i} className="relative">
                    <span className="absolute -left-9 top-0.5 w-[22px] h-[22px] rounded-full border-2 border-indigo-500 bg-white flex items-center justify-center shadow-[0_0_0_4px_rgba(99,102,241,0.10)]">
                      <span className="w-2 h-2 rounded-full bg-indigo-500" />
                    </span>
                    <div className="flex justify-between gap-3 flex-wrap">
                      <p className="text-sm font-semibold text-[#0f172a]">{exp.role}</p>
                      <span className="text-xs text-[#0891b2] font-medium tabular-nums">{exp.period}</span>
                    </div>
                    <p className="text-xs text-indigo-500 mt-0.5">{exp.company}{exp.location ? ` · ${exp.location}` : ''}</p>
                    <p className="text-[13px] text-[#475569] leading-relaxed mt-2">{exp.description}</p>
                  </li>
                ))}
              </ol>
            </Card>

            {/* Education */}
            <Card className="p-6">
              <SectionTitle icon={Icons.cap}>Education &amp; Training</SectionTitle>
              <div className="grid sm:grid-cols-2 gap-3">
                {(candidate.education ?? []).map((ed, i) => (
                  <div key={i} className="rounded-xl border border-[#e2e8f0] bg-[#f8fafc] p-4">
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700">{EDUCATION_TYPE_LABEL[ed.type]}</span>
                    <p className="text-sm font-semibold text-[#0f172a] mt-2 leading-snug">{ed.qualification}</p>
                    <p className="text-xs text-[#64748b] mt-1">{ed.institution}</p>
                    <p className="text-xs text-[#94a3b8] mt-1 tabular-nums">{ed.period}</p>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
