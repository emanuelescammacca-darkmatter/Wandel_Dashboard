import type { Candidate } from '../../types';
import StatusBadge from '../../components/StatusBadge';
import { ChannelIcon } from '../../components/ChannelBadge';
import {
  ageFromDob, formatDate, formatSalary, driversLicenseLabel, initials,
  EDUCATION_TYPE_LABEL, EDUCATION_TYPE_STYLE, BackLink, Icons, Glyph,
} from './shared';

/* ── Design B — "Verdict": full-width assessment hero + 2-column body ── */

function Fact({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 py-2.5">
      <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
        <Glyph className="w-4 h-4">{icon}</Glyph>
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">{label}</p>
        <div className="text-sm text-gray-800 break-words">{value ?? <span className="text-gray-300">—</span>}</div>
      </div>
    </div>
  );
}

function CardHead({ icon, title, accent = 'text-gray-400' }: { icon: React.ReactNode; title: string; accent?: string }) {
  return (
    <div className="flex items-center gap-2.5 px-6 py-4 border-b border-gray-100">
      <Glyph className={`w-4 h-4 ${accent}`}>{icon}</Glyph>
      <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
    </div>
  );
}

export default function ProfileAssessmentHero({ candidate, onBack, backLabel }: { candidate: Candidate; onBack: () => void; backLabel: string }) {
  const age = ageFromDob(candidate.dateOfBirth);

  return (
    <div className="flex-1 bg-[#f5f5f5] overflow-y-auto">
      <div className="max-w-6xl mx-auto px-5 py-5 flex flex-col gap-5">

        <BackLink label={backLabel} onClick={onBack} />

        {/* ══ Identity header ══ */}
        <div className="bg-white border border-gray-200 rounded-xl px-6 py-5 flex items-center gap-5">
          <div className="w-16 h-16 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-700 font-semibold text-xl shrink-0">
            {initials(candidate.firstName, candidate.lastName)}
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-xl font-semibold text-gray-900 leading-tight">
              {candidate.firstName} {candidate.lastName}
            </h2>
            <p className="text-sm text-gray-500 mt-0.5">{candidate.jobTitle}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <StatusBadge status={candidate.employmentStatus} />
            <span className="inline-flex items-center gap-1.5 text-xs text-gray-500 border border-gray-200 bg-gray-50 px-2.5 py-1 rounded-lg">
              <ChannelIcon channel={candidate.source} />
              <span className="capitalize">{candidate.source}</span>
            </span>
          </div>
        </div>

        {/* ══ Assessment hero banner ══ */}
        {candidate.assessment && (
          <div className="rounded-xl bg-gradient-to-br from-emerald-600 to-emerald-700 text-white px-7 py-6 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <svg className="w-5 h-5 text-emerald-200" fill="currentColor" viewBox="0 0 24 24">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-emerald-100">Unsere Einschätzung</p>
            </div>
            <p className="text-lg leading-relaxed font-medium">{candidate.assessment}</p>
          </div>
        )}

        {/* ══ Body: facts (left) | substance (right) ══ */}
        <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-5 items-start">

          {/* General Facts */}
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden lg:sticky lg:top-5">
            <CardHead icon={Icons.briefcase} title="Allgemeine Angaben" accent="text-emerald-500" />
            <div className="px-6 py-3 divide-y divide-gray-100">
              <Fact icon={Icons.phone} label="Telefon" value={candidate.phoneNumber} />
              <Fact icon={Icons.mail} label="E-Mail" value={candidate.email} />
              <Fact
                icon={Icons.cake}
                label="Geburtstag"
                value={candidate.dateOfBirth ? `${formatDate(candidate.dateOfBirth)}${age ? ` · ${age} J.` : ''}` : null}
              />
              <Fact icon={Icons.pin} label="Adresse" value={candidate.address} />
              <Fact icon={Icons.globe} label="Nationalität" value={candidate.nationality} />
              <Fact
                icon={Icons.language}
                label="Deutschniveau"
                value={candidate.germanLevel ? (
                  <span className="inline-block text-xs px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium">
                    {candidate.germanLevel}
                  </span>
                ) : null}
              />
              <Fact icon={Icons.car} label="Führerschein" value={driversLicenseLabel(candidate.driversLicense, candidate.licenseClasses)} />
              <Fact icon={Icons.clock} label="Kündigungsfrist" value={candidate.noticePeriod} />
              <Fact icon={Icons.euro} label="Gehaltswunsch" value={formatSalary(candidate.salary)} />
            </div>
          </div>

          {/* Right column */}
          <div className="flex flex-col gap-5 min-w-0">

            {/* Work Experience */}
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <CardHead icon={Icons.briefcase} title="Berufserfahrung — letzte 3 Stationen" accent="text-emerald-500" />
              <div className="p-6 flex flex-col gap-3">
                {(candidate.experiences ?? []).map((exp, i) => (
                  <div key={i} className="relative pl-5 border-l-2 border-emerald-200">
                    <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                      <p className="text-sm font-semibold text-gray-900">{exp.role}</p>
                      <span className="text-xs text-gray-400 font-medium tabular-nums">{exp.period}</span>
                    </div>
                    <p className="text-xs font-medium text-emerald-700 mt-0.5">
                      {exp.company}{exp.location ? ` · ${exp.location}` : ''}
                    </p>
                    <p className="text-sm text-gray-600 leading-relaxed mt-1.5">{exp.description}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Education + Client Questions */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">

              {/* Education */}
              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                <CardHead icon={Icons.cap} title="Akademischer Werdegang" accent="text-emerald-500" />
                <div className="p-5 flex flex-col gap-3">
                  {(candidate.education ?? []).map((ed, i) => (
                    <div key={i} className="flex flex-col gap-1.5 pb-3 last:pb-0 border-b last:border-b-0 border-gray-100">
                      <div className="flex items-center justify-between gap-2">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${EDUCATION_TYPE_STYLE[ed.type]}`}>
                          {EDUCATION_TYPE_LABEL[ed.type]}
                        </span>
                        <span className="text-xs text-gray-400 tabular-nums">{ed.period}</span>
                      </div>
                      <p className="text-sm font-semibold text-gray-900 leading-snug">{ed.qualification}</p>
                      <p className="text-xs text-gray-500">{ed.institution}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Client Questions */}
              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                <CardHead icon={Icons.chat} title="Kundenfragen" accent="text-emerald-500" />
                <div className="p-5 flex flex-col gap-4">
                  {(candidate.clientQuestions ?? []).map((q, i) => (
                    <div key={i}>
                      <p className="text-sm font-medium text-gray-800 leading-snug">{q.question}</p>
                      <p className="text-sm text-gray-600 leading-relaxed mt-1 pl-3 border-l-2 border-emerald-200">{q.answer}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
