import type { Candidate } from '../../../types';
import StatusBadge from '../../../components/StatusBadge';
import { ChannelIcon } from '../../../components/ChannelBadge';
import {
  ageFromDob, formatDate, formatSalary, driversLicenseLabel, initials,
  EDUCATION_TYPE_LABEL, EDUCATION_TYPE_STYLE, BackLink, Icons, Glyph,
} from './shared';

/* ── Design C — "Cockpit": dark header band + dense 3-column dashboard ── */

const NAVY = '#1e3a5f';

function ColTitle({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 px-4 py-2.5 border-b border-gray-100 bg-gray-50/80">
      <Glyph className="w-3.5 h-3.5 text-gray-400">{icon}</Glyph>
      <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">{children}</p>
    </div>
  );
}

function MiniFact({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2.5">
      <Glyph className="w-3.5 h-3.5 text-gray-300 mt-0.5 shrink-0">{icon}</Glyph>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">{label}</p>
        <div className="text-[13px] text-gray-800 break-words leading-snug">{value ?? <span className="text-gray-300">—</span>}</div>
      </div>
    </div>
  );
}

export default function ProfileThreeColumn({ candidate, onBack, backLabel }: { candidate: Candidate; onBack: () => void; backLabel: string }) {
  const age = ageFromDob(candidate.dateOfBirth);

  return (
    <div className="flex-1 bg-[#f5f5f5] overflow-y-auto">

      {/* ══ Dark header band ══ */}
      <div className="px-5 pt-4 pb-6" style={{ background: `linear-gradient(135deg, ${NAVY} 0%, #2c5078 100%)` }}>
        <div className="max-w-7xl mx-auto">
          <BackLink label={backLabel} onClick={onBack} tone="dark" />
          <div className="mt-4 flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-white font-semibold text-lg shrink-0">
              {initials(candidate.firstName, candidate.lastName)}
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-xl font-semibold text-white leading-tight">
                {candidate.firstName} {candidate.lastName}
              </h2>
              <p className="text-sm text-white/60 mt-0.5">{candidate.jobTitle}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <StatusBadge status={candidate.employmentStatus} />
              <span className="inline-flex items-center gap-1.5 text-xs text-white/80 border border-white/20 bg-white/10 px-2.5 py-1 rounded-lg">
                <ChannelIcon channel={candidate.source} />
                <span className="capitalize">{candidate.source}</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ══ Three-column dashboard ══ */}
      <div className="max-w-7xl mx-auto px-5 -mt-2 pb-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">

          {/* Column 1: General Facts */}
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <ColTitle icon={Icons.briefcase}>Allgemeine Angaben</ColTitle>
            <div className="p-4 flex flex-col gap-3.5">
              <MiniFact icon={Icons.phone} label="Telefon" value={candidate.phoneNumber} />
              <MiniFact icon={Icons.mail} label="E-Mail" value={candidate.email} />
              <MiniFact
                icon={Icons.cake}
                label="Geburtstag"
                value={candidate.dateOfBirth ? `${formatDate(candidate.dateOfBirth)}${age ? ` · ${age} J.` : ''}` : null}
              />
              <MiniFact icon={Icons.pin} label="Adresse" value={candidate.address} />
              <MiniFact icon={Icons.globe} label="Nationalität" value={candidate.nationality} />
              <div className="border-t border-gray-100 pt-3.5 grid grid-cols-2 gap-3.5">
                <MiniFact
                  icon={Icons.language}
                  label="Deutsch"
                  value={candidate.germanLevel ? (
                    <span className="inline-block text-[11px] px-1.5 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200 font-medium">
                      {candidate.germanLevel}
                    </span>
                  ) : null}
                />
                <MiniFact icon={Icons.car} label="Führerschein" value={driversLicenseLabel(candidate.driversLicense, candidate.licenseClasses)} />
                <MiniFact icon={Icons.clock} label="Kündigungsfrist" value={candidate.noticePeriod} />
                <MiniFact icon={Icons.euro} label="Gehaltswunsch" value={formatSalary(candidate.salary)} />
              </div>
            </div>
          </div>

          {/* Column 2: Experience + Education */}
          <div className="flex flex-col gap-4">
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <ColTitle icon={Icons.briefcase}>Berufserfahrung</ColTitle>
              <div className="p-4">
                <ol className="relative border-l border-gray-200 ml-1.5 flex flex-col gap-4">
                  {(candidate.experiences ?? []).map((exp, i) => (
                    <li key={i} className="ml-4">
                      <span className="absolute -left-[5px] w-2.5 h-2.5 rounded-full bg-white border-2" style={{ borderColor: NAVY }} />
                      <div className="flex flex-wrap items-baseline justify-between gap-x-2">
                        <p className="text-[13px] font-semibold text-gray-900 leading-snug">{exp.role}</p>
                        <span className="text-[11px] text-gray-400 font-medium tabular-nums">{exp.period}</span>
                      </div>
                      <p className="text-[11px] text-gray-500 mt-0.5">{exp.company}{exp.location ? ` · ${exp.location}` : ''}</p>
                      <p className="text-[12px] text-gray-600 leading-relaxed mt-1">{exp.description}</p>
                    </li>
                  ))}
                </ol>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <ColTitle icon={Icons.cap}>Ausbildung & Studium</ColTitle>
              <div className="p-4 flex flex-col gap-3">
                {(candidate.education ?? []).map((ed, i) => (
                  <div key={i} className="flex flex-col gap-1 pb-3 last:pb-0 border-b last:border-b-0 border-gray-100">
                    <div className="flex items-center justify-between gap-2">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full border font-medium ${EDUCATION_TYPE_STYLE[ed.type]}`}>
                        {EDUCATION_TYPE_LABEL[ed.type]}
                      </span>
                      <span className="text-[11px] text-gray-400 tabular-nums">{ed.period}</span>
                    </div>
                    <p className="text-[13px] font-semibold text-gray-900 leading-snug">{ed.qualification}</p>
                    <p className="text-[11px] text-gray-500">{ed.institution}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Column 3: Assessment + Client Questions */}
          <div className="flex flex-col gap-4">
            {candidate.assessment && (
              <div className="rounded-xl border border-gray-200 overflow-hidden text-white" style={{ background: NAVY }}>
                <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/10">
                  <svg className="w-3.5 h-3.5 text-amber-300" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2l2.4 7.4H22l-6 4.6 2.3 7.4L12 17l-6.3 4.4L8 14 2 9.4h7.6L12 2z" />
                  </svg>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-white/70">Unsere Einschätzung</p>
                </div>
                <p className="px-4 py-4 text-[13px] leading-relaxed text-white/90">{candidate.assessment}</p>
              </div>
            )}

            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <ColTitle icon={Icons.chat}>Kundenfragen & Antworten</ColTitle>
              <div className="p-4 flex flex-col divide-y divide-gray-100">
                {(candidate.clientQuestions ?? []).map((q, i) => (
                  <div key={i} className="py-3 first:pt-0 last:pb-0">
                    <div className="flex gap-2">
                      <span className="text-[10px] font-bold shrink-0 mt-0.5" style={{ color: NAVY }}>F</span>
                      <p className="text-[13px] font-medium text-gray-800 leading-snug">{q.question}</p>
                    </div>
                    <div className="flex gap-2 mt-1.5">
                      <span className="text-[10px] font-bold text-gray-400 shrink-0 mt-0.5">A</span>
                      <p className="text-[12px] text-gray-600 leading-relaxed">{q.answer}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
