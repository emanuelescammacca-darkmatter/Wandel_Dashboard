import { useEffect } from 'react';
import type { Candidate } from '../../../types';
import { CARD_GRADIENT } from '../../../constants/theme';
import wandelLogo from '../../../assets/wandel-logo.png';
import {
  ageFromDob, formatDate, formatSalary, driversLicenseLabel, initials, EDUCATION_TYPE_LABEL,
} from './shared';

/* ── "Aurora" — a cutting-edge, print-ready CV template ──
   Full-screen overlay. Only the sheet (#cv-print) is printed; the print
   stylesheet forces background colors so the dark hero survives export. */

const ACCENT = '#6366f1';
const CEFR = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
const CEFR_DESC: Record<string, string> = {
  A1: 'Beginner', A2: 'Elementary', B1: 'Intermediate', B2: 'Upper intermediate', C1: 'Advanced', C2: 'Proficient',
};

const CSS = `
@keyframes cvUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: none; } }
@keyframes cvFade { from { opacity: 0; transform: scale(0.985); } to { opacity: 1; transform: none; } }
.cv-hero { animation: cvFade .7s cubic-bezier(.2,.7,.2,1) both; }
.cv-sec { animation: cvUp .6s cubic-bezier(.2,.7,.2,1) both; }
@media print {
  body * { visibility: hidden !important; }
  #cv-print, #cv-print * { visibility: visible !important; }
  #cv-print {
    position: absolute !important; left: 0 !important; top: 0 !important;
    width: 100% !important; margin: 0 !important; border-radius: 0 !important;
    box-shadow: none !important; max-height: none !important; overflow: visible !important;
    -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important;
  }
  #cv-print * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
  .cv-hero, .cv-sec { animation: none !important; opacity: 1 !important; transform: none !important; }
  @page { size: A4; margin: 0; }
}`;

function I({ d }: { d: string }) {
  return <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round"><path d={d} /></svg>;
}

const ICON = {
  phone: 'M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z',
  mail: 'M4 4h16v16H4zM22 6l-10 7L2 6',
  pin: 'M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0zM12 8a3 3 0 1 0 0 6 3 3 0 0 0 0-6z',
  cake: 'M3 9h18M9 3v2M15 3v2M5 7h14a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2z',
  globe: 'M2 12a10 10 0 1 0 20 0 10 10 0 0 0-20 0zM2 12h20M12 2a15 15 0 0 1 0 20 15 15 0 0 1 0-20z',
  car: 'M5 11l4-7h6l4 7M5 11h14M5 11l-1 4a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3l-1-4',
  clock: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zM12 6v6l4 2',
  euro: 'M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6',
  start: 'M5 3l14 9-14 9V3z',
};

function RailLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-[9.5px] font-bold uppercase tracking-[0.22em] text-[#312e81]/70 mb-3">{children}</p>;
}

function DetailRow({ icon, label, value }: { icon: string; label: string; value: React.ReactNode }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-2.5">
      <span className="text-indigo-400 mt-0.5"><I d={icon} /></span>
      <div className="min-w-0">
        <p className="text-[9px] uppercase tracking-wider text-[#94a3b8]">{label}</p>
        <p className="text-[11.5px] leading-snug text-[#334155] break-words font-medium">{value}</p>
      </div>
    </div>
  );
}

function Section({ no, title, children, delay }: { no: string; title: string; children: React.ReactNode; delay: number }) {
  return (
    <section className="cv-sec mb-6" style={{ animationDelay: `${delay}ms` }}>
      <div className="flex items-center gap-3 mb-4">
        <span className="text-[34px] font-black leading-none tabular-nums" style={{ color: ACCENT, opacity: 0.16 }}>{no}</span>
        <h2 className="text-[14px] font-extrabold uppercase tracking-[0.2em] text-[#0f172a]">{title}</h2>
        <span className="flex-1 h-px" style={{ background: 'linear-gradient(90deg, #d9def0, transparent)' }} />
      </div>
      {children}
    </section>
  );
}

export default function CvDocument({ candidate, onClose }: { candidate: Candidate; onClose: () => void }) {
  const age = ageFromDob(candidate.dateOfBirth);
  const germanLvl = candidate.germanLevel?.toUpperCase() ?? '';
  const cefrIdx = CEFR.indexOf(germanLvl);
  const skills = (candidate.specialSkills ?? '').split(/[,;]/).map(s => s.trim()).filter(Boolean);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = prev; };
  }, [onClose]);

  const heroChips: { icon: string; text: string }[] = [
    candidate.city ? { icon: ICON.pin, text: candidate.city } : null,
    age ? { icon: ICON.cake, text: `${age} years` } : null,
    candidate.nationality ? { icon: ICON.globe, text: candidate.nationality } : null,
    candidate.driversLicense ? { icon: ICON.car, text: `Licence ${candidate.licenseClasses ?? ''}`.trim() } : null,
  ].filter(Boolean) as { icon: string; text: string }[];

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center bg-[#070b1f]/85 backdrop-blur-md overflow-auto py-8 px-4" onClick={onClose}>
      <style>{CSS}</style>

      {/* Toolbar */}
      <div className="w-[794px] max-w-full flex items-center justify-between mb-4 shrink-0" onClick={e => e.stopPropagation()}>
        <p className="text-sm text-white/70 font-medium">CV · {candidate.firstName} {candidate.lastName}</p>
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 text-[13px] font-semibold px-4 py-2 rounded-lg text-white transition-transform hover:-translate-y-0.5 shadow-lg shadow-indigo-500/40"
            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round"><path d="M6 9V3h12v6M6 18H4a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2h-2M6 14h12v7H6z" /></svg>
            Download PDF
          </button>
          <button
            onClick={onClose}
            className="inline-flex items-center gap-2 text-[13px] font-medium px-3 py-2 rounded-lg border border-white/15 bg-white/[0.06] text-white/80 hover:bg-white/[0.12] transition-colors"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
            Close
          </button>
        </div>
      </div>

      {/* ── Sheet ── */}
      <div
        id="cv-print"
        onClick={e => e.stopPropagation()}
        className="w-[794px] max-w-full bg-white rounded-[20px] overflow-hidden shadow-[0_40px_100px_rgba(0,0,0,0.6)] shrink-0 flex flex-col"
        style={{ minHeight: 1123, color: '#1f2937', WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' } as React.CSSProperties}
      >
        {/* HERO */}
        <div
          className="cv-hero relative overflow-hidden px-10 pt-8 pb-7 text-white"
          style={{
            background:
              'radial-gradient(1100px 480px at 12% -25%, rgba(99,102,241,0.30), transparent 60%),' +
              'radial-gradient(900px 420px at 100% 0%, rgba(34,211,238,0.12), transparent 55%), #0a1130',
          }}
        >
          {/* Wandel wordmark */}
          <div className="absolute right-9 top-8 flex items-center gap-2 opacity-90">
            <img src={wandelLogo} alt="" className="h-5 w-auto" style={{ filter: 'brightness(0) invert(1)' }} />
            <span className="text-[12px] font-semibold tracking-[0.28em] uppercase text-white/85">Wandel</span>
          </div>

          <div className="relative flex items-center gap-6 flex-wrap">
            <div className="p-[2px] rounded-2xl shrink-0 shadow-[0_0_30px_rgba(129,140,248,0.5)]" style={{ background: 'linear-gradient(135deg, #818cf8, #22d3ee)' }}>
              <div className="w-20 h-20 rounded-2xl bg-[#0a1130] flex items-center justify-center text-3xl font-bold">
                {initials(candidate.firstName, candidate.lastName)}
              </div>
            </div>
            <div className="min-w-0">
              <h1 className="text-[42px] leading-[0.95] font-extrabold tracking-tight">
                <span className="bg-clip-text text-transparent" style={{ backgroundImage: 'linear-gradient(90deg, #ffffff, #c7d2fe 55%, #67e8f9)' }}>
                  {candidate.firstName} {candidate.lastName}
                </span>
              </h1>
              <p className="text-[13px] font-semibold uppercase mt-2 text-indigo-200/90" style={{ letterSpacing: '0.22em' }}>{candidate.jobTitle}</p>
            </div>
          </div>

          {heroChips.length > 0 && (
            <div className="relative flex items-center gap-2 flex-wrap mt-6">
              {heroChips.map((c, i) => (
                <span key={i} className="inline-flex items-center gap-1.5 text-[11px] font-medium px-3 py-1.5 rounded-full bg-white/[0.08] border border-white/15 backdrop-blur text-white/90">
                  <span className="text-cyan-300"><I d={c.icon} /></span>{c.text}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* BODY */}
        <div className="grid grid-cols-1 sm:grid-cols-[256px_1fr] flex-1 min-h-0">
          {/* Details rail */}
          <aside className="p-8 border-r border-[#eceef6]" style={{ background: 'linear-gradient(180deg, #f7f8fd, #eef1fb)' }}>
            <div className="flex flex-col gap-7">
              <div>
                <RailLabel>Contact</RailLabel>
                <div className="flex flex-col gap-3">
                  <DetailRow icon={ICON.phone} label="Phone" value={candidate.phoneNumber} />
                  <DetailRow icon={ICON.mail} label="Email" value={candidate.email} />
                  <DetailRow icon={ICON.pin} label="Address" value={candidate.address} />
                  <DetailRow icon={ICON.cake} label="Born" value={candidate.dateOfBirth ? formatDate(candidate.dateOfBirth) : null} />
                </div>
              </div>

              {candidate.germanLevel && (
                <div>
                  <RailLabel>Languages</RailLabel>
                  <div className="flex items-baseline justify-between mb-2.5">
                    <span className="text-[12.5px] font-bold text-[#1e293b]">German</span>
                    {cefrIdx >= 0 && CEFR_DESC[germanLvl] && (
                      <span className="text-[10px] font-medium text-[#64748b]">{CEFR_DESC[germanLvl]}</span>
                    )}
                  </div>
                  <div className="flex items-end gap-1.5">
                    {CEFR.map((lvl, i) => {
                      const reached = cefrIdx >= 0 && i <= cefrIdx;
                      const current = i === cefrIdx;
                      return (
                        <div key={lvl} className="flex-1 flex flex-col items-center gap-1.5">
                          <span
                            className="w-full rounded-full transition-all"
                            style={{
                              height: current ? 14 : 7,
                              background: reached ? (current ? 'linear-gradient(180deg, #818cf8, #4f46e5)' : ACCENT) : '#dfe3f2',
                              boxShadow: current ? `0 2px 8px ${ACCENT}66` : 'none',
                            }}
                          />
                          <span
                            className="text-[8.5px] font-bold tabular-nums"
                            style={{ color: current ? ACCENT : reached ? '#475569' : '#c2c8db' }}
                          >
                            {lvl}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div>
                <RailLabel>Conditions</RailLabel>
                <div className="flex flex-col gap-3">
                  <DetailRow icon={ICON.start} label="Earliest start" value={candidate.earliestStart ? formatDate(candidate.earliestStart) : null} />
                  <DetailRow icon={ICON.clock} label="Notice period" value={candidate.noticePeriod} />
                  <DetailRow icon={ICON.euro} label="Salary expectation" value={formatSalary(candidate.salary)} />
                  <DetailRow icon={ICON.car} label="Driver's licence" value={driversLicenseLabel(candidate.driversLicense, candidate.licenseClasses)} />
                </div>
              </div>

              {skills.length > 0 && (
                <div>
                  <RailLabel>Core Skills</RailLabel>
                  <div className="flex flex-wrap gap-1.5">
                    {skills.map((s, i) => (
                      <span key={i} className="text-[11px] font-medium px-2.5 py-1 rounded-md bg-white border border-indigo-100 text-indigo-700 shadow-sm">{s}</span>
                    ))}
                  </div>
                </div>
              )}

              {candidate.additionalPreferences && (
                <div>
                  <RailLabel>Preferences</RailLabel>
                  <p className="text-[11.5px] text-[#475569] leading-relaxed">{candidate.additionalPreferences}</p>
                </div>
              )}
            </div>
          </aside>

          {/* Main */}
          <main className="p-9" style={{ background: CARD_GRADIENT }}>
            {candidate.assessment && (
              <Section no="01" title="Profile" delay={120}>
                <p className="text-[13px] leading-relaxed text-[#475569]">{candidate.assessment}</p>
                {candidate.jobChangeMotivation && (
                  <p className="text-[12.5px] leading-relaxed text-[#475569] border-l-2 pl-3.5 mt-3.5" style={{ borderColor: ACCENT }}>
                    <span className="font-semibold text-[#312e81]">Motivation: </span>{candidate.jobChangeMotivation}
                  </p>
                )}
              </Section>
            )}

            {(candidate.experiences ?? []).length > 0 && (
              <Section no="02" title="Experience" delay={220}>
                <ol className="relative flex flex-col gap-5 pl-7">
                  <span aria-hidden className="absolute left-[6px] top-2 bottom-2 w-[2px] rounded-full" style={{ background: 'linear-gradient(to bottom, #4f46e5, rgba(99,102,241,0.12))' }} />
                  {(candidate.experiences ?? []).map((exp, i) => (
                    <li key={i} className="relative">
                      <span className="absolute -left-7 top-1 w-[13px] h-[13px] rounded-full border-2 bg-white shadow-[0_0_0_4px_rgba(99,102,241,0.12)]" style={{ borderColor: ACCENT }} />
                      <div className="flex items-baseline justify-between gap-3 flex-wrap">
                        <p className="text-[14px] font-bold text-[#0f172a]">{exp.role}</p>
                        <span className="text-[11px] font-semibold tabular-nums px-2 py-0.5 rounded-full" style={{ color: ACCENT, background: '#eef0ff' }}>{exp.period}</span>
                      </div>
                      <p className="text-[12px] font-semibold text-[#64748b] mt-0.5">{exp.company}{exp.location ? ` · ${exp.location}` : ''}</p>
                      <p className="text-[12px] text-[#475569] leading-relaxed mt-1.5">{exp.description}</p>
                    </li>
                  ))}
                </ol>
              </Section>
            )}

            {(candidate.education ?? []).length > 0 && (
              <Section no="03" title="Education & Training" delay={320}>
                <div className="grid sm:grid-cols-2 gap-3">
                  {(candidate.education ?? []).map((ed, i) => (
                    <div key={i} className="rounded-xl border border-[#e8eaf4] bg-[#fafbff] p-4">
                      <span className="text-[9.5px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">{EDUCATION_TYPE_LABEL[ed.type]}</span>
                      <p className="text-[13px] font-bold text-[#0f172a] mt-2 leading-snug">{ed.qualification}</p>
                      <p className="text-[11.5px] text-[#64748b] mt-1">{ed.institution}</p>
                      <p className="text-[11px] text-[#94a3b8] mt-1 tabular-nums">{ed.period}</p>
                    </div>
                  ))}
                </div>
              </Section>
            )}
          </main>
        </div>

        {/* Footer */}
        <div className="px-10 py-3.5 text-[10px] text-white/70 flex items-center justify-between" style={{ background: '#0a1130' }}>
          <span className="font-semibold tracking-wide">{candidate.firstName} {candidate.lastName} — {candidate.jobTitle}</span>
          <span className="uppercase tracking-[0.22em] text-indigo-300/80">Wandel · Talent Profile</span>
        </div>
      </div>
    </div>
  );
}
