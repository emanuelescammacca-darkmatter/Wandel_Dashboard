import { useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { mockCandidates } from '../mockData';
import StatusBadge from '../components/StatusBadge';
import { ChannelIcon } from '../components/ChannelBadge';

const OUTCOME_LABELS: Record<string, string> = {
  qualified: 'Qualified', 'not-qualified': 'Not Qualified', voicemail: 'Voicemail',
  inconclusive: 'Inconclusive', 'no-contact': 'No Contact',
};
const OUTCOME_STYLES: Record<string, string> = {
  qualified: 'text-emerald-700 bg-emerald-50 border-emerald-200',
  'not-qualified': 'text-red-600 bg-red-50 border-red-200',
  voicemail: 'text-amber-700 bg-amber-50 border-amber-200',
  inconclusive: 'text-gray-500 bg-gray-50 border-gray-200',
  'no-contact': 'text-gray-500 bg-gray-50 border-gray-200',
};

function Label({ children }: { children: React.ReactNode }) {
  return <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">{children}</p>;
}
function Value({ children }: { children: React.ReactNode }) {
  return <div className="text-sm text-gray-800">{children ?? <span className="text-gray-300">—</span>}</div>;
}
function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return <div><Label>{label}</Label><Value>{value}</Value></div>;
}
function CardTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-5 py-3 border-b border-gray-100 bg-gray-50/80 shrink-0">
      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">{children}</p>
    </div>
  );
}

export default function CandidateDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const candidate = mockCandidates.find(c => c.id === id);

  const [isPlaying, setIsPlaying] = useState(false);
  const [notes, setNotes] = useState('');
  const [notesSaved, setNotesSaved] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  if (!candidate) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-gray-400 text-sm">
          Candidate not found.{' '}
          <button onClick={() => navigate('/ai-candidates')} className="underline">Go back</button>
        </p>
      </div>
    );
  }

  const handlePlayPause = () => {
    if (!candidate.audioUrl) { setIsPlaying(p => !p); return; }
    if (isPlaying) audioRef.current?.pause();
    else audioRef.current?.play();
    setIsPlaying(p => !p);
  };

  const handleSaveNotes = () => {
    setNotesSaved(true);
    setTimeout(() => setNotesSaved(false), 2000);
  };

  const totalSeconds = candidate.transcript ? candidate.transcript.length * 7 : 0;
  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  return (
    <div className="flex-1 bg-[#f5f5f5] overflow-y-auto">
      <div className="p-5 flex flex-col gap-4">

        {/* ══ ROW 1: Candidate header — name + all profile fields ══ */}
        <div className="bg-white border border-gray-200 rounded-xl px-6 py-5 flex items-start gap-8">

          {/* Left: breadcrumb + avatar + name / status */}
          <div className="flex flex-col gap-3 shrink-0 min-w-45">
            <button
              onClick={() => navigate('/ai-candidates')}
              className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 w-fit transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              AI Candidates
            </button>
            <div className="flex flex-col gap-2">
              <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-semibold text-lg shrink-0">
                {candidate.firstName.charAt(0)}
              </div>
              <div>
                <h2 className="text-base font-semibold text-gray-900 leading-tight">
                  {candidate.firstName} {candidate.lastName}
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">{candidate.phoneNumber}</p>
              </div>
              <div className="flex flex-col gap-1.5">
                <StatusBadge status={candidate.status} />
                {candidate.analysisOutcome && (
                  <span className={`text-xs px-2 py-0.5 rounded border font-medium w-fit ${OUTCOME_STYLES[candidate.analysisOutcome]}`}>
                    {OUTCOME_LABELS[candidate.analysisOutcome]}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Vertical separator */}
          <div className="w-px bg-gray-100 self-stretch shrink-0" />

          {/* Right: profile fields in a 5-col grid */}
          <div className="flex-1 grid grid-cols-5 gap-x-8 gap-y-4">
            <Field label="Phone" value={candidate.phoneNumber} />
            <Field label="Date of Birth" value={candidate.dateOfBirth} />
            <Field label="German Level" value={candidate.germanLevel} />
            <Field label="Training / Education" value={candidate.training} />
            <Field label="Touchpoints" value={candidate.touchpoints} />
            <Field label="Desired Salary" value={candidate.salary ? `€${candidate.salary}/mo` : null} />
            <Field label="Earliest Start" value={candidate.earliestStart} />
            <Field
              label="Driver's License"
              value={
                candidate.driversLicense === true
                  ? `Yes${candidate.licenseClasses ? ` — ${candidate.licenseClasses}` : ''}`
                  : candidate.driversLicense === false ? 'No' : null
              }
            />
            <Field label="Call Duration" value={candidate.duration ?? null} />
            <Field
              label="Created"
              value={new Date(candidate.createdAt).toLocaleDateString('de-DE', { day: '2-digit', month: 'long', year: 'numeric' })}
            />
          </div>
        </div>

        {/* ══ ROW 2: Transcript (left) | Notes (right) — fixed height ══ */}
        <div className="grid grid-cols-2 gap-4" style={{ height: '360px' }}>

          {/* Call Transcript */}
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden flex flex-col">
            <CardTitle>Call Transcript</CardTitle>

            {/* Audio player */}
            <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-3 bg-white shrink-0">
              <button
                onClick={handlePlayPause}
                className="w-8 h-8 rounded-full bg-gray-800 hover:bg-gray-700 flex items-center justify-center text-white transition-colors shrink-0"
              >
                {isPlaying ? (
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                  </svg>
                ) : (
                  <svg className="w-3 h-3 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7L8 5z" />
                  </svg>
                )}
              </button>
              <div className="flex-1 flex flex-col gap-1">
                <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-gray-500 rounded-full transition-all duration-700" style={{ width: isPlaying ? '35%' : '0%' }} />
                </div>
                <div className="flex justify-between">
                  <span className="text-[10px] text-gray-400">{isPlaying ? '0:15' : '0:00'}</span>
                  <span className="text-[10px] text-gray-400">{candidate.duration ?? formatTime(totalSeconds)}</span>
                </div>
              </div>
              {!candidate.audioUrl && (
                <span className="text-[10px] text-gray-300 shrink-0">No audio file</span>
              )}
              {candidate.audioUrl && (
                <audio ref={audioRef} src={candidate.audioUrl} onEnded={() => setIsPlaying(false)} />
              )}
            </div>

            {/* Transcript summary */}
            {candidate.transcriptSummary && (
              <div className="px-5 py-2.5 border-b border-gray-100 bg-amber-50/50 shrink-0">
                <p className="text-xs text-gray-500 leading-relaxed">{candidate.transcriptSummary}</p>
              </div>
            )}

            {/* Messages */}
            <div className="px-5 py-3 overflow-y-auto flex-1 flex flex-col gap-3">
              {candidate.transcript && candidate.transcript.length > 0 ? (
                candidate.transcript.map((entry, i) => (
                  <div key={i} className={`flex gap-2 ${entry.speaker === 'candidate' ? 'flex-row-reverse' : ''}`}>
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-semibold shrink-0 mt-0.5 ${entry.speaker === 'agent' ? 'bg-gray-700' : 'bg-indigo-400'}`}>
                      {entry.speaker === 'agent' ? 'AI' : candidate.firstName.charAt(0)}
                    </div>
                    <div className={`flex flex-col max-w-[80%] ${entry.speaker === 'candidate' ? 'items-end' : ''}`}>
                      <span className="text-[10px] text-gray-400 mb-0.5">{entry.timestamp}</span>
                      <div className={`px-3 py-2 rounded-xl text-sm leading-relaxed ${entry.speaker === 'agent' ? 'bg-gray-100 text-gray-800 rounded-tl-sm' : 'bg-indigo-600 text-white rounded-tr-sm'}`}>
                        {entry.text}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center flex-1 text-gray-400">
                  <svg className="w-8 h-8 mb-2 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <span className="text-sm">No transcript available</span>
                </div>
              )}
            </div>
          </div>

          {/* Notes */}
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden flex flex-col">
            <CardTitle>Internal Notes</CardTitle>
            <div className="flex flex-col flex-1 p-5 gap-3 overflow-hidden">
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Add internal notes about this candidate..."
                className="flex-1 w-full resize-none text-sm text-gray-700 placeholder-gray-300 border border-gray-200 rounded-lg p-3 focus:outline-none focus:border-indigo-300 leading-relaxed"
              />
              <button
                onClick={handleSaveNotes}
                className={`w-full py-2 rounded-lg text-sm font-medium transition-colors shrink-0 ${
                  notesSaved ? 'bg-emerald-600 text-white' : 'bg-gray-800 hover:bg-gray-700 text-white'
                }`}
              >
                {notesSaved ? 'Saved ✓' : 'Save Notes'}
              </button>
            </div>
          </div>
        </div>

        {/* ══ ROW 3: Job info (left 2/3) | CV & Documents (right 1/3) ══ */}
        <div className="grid grid-cols-3 gap-4">

          {/* Job Information — spans 2 cols */}
          <div className="col-span-2 bg-white border border-gray-200 rounded-xl overflow-hidden flex flex-col">
            <CardTitle>Job Information</CardTitle>
            <div className="p-5 flex flex-col gap-5">

              {/* Job title */}
              <div>
                <Label>Job Title</Label>
                <p className="text-base font-semibold text-gray-900">{candidate.jobTitle}</p>
              </div>

              {/* Row: channel, status, outcome, created */}
              <div className="grid grid-cols-4 gap-6 pt-4 border-t border-gray-100">
                <Field
                  label="Channel"
                  value={
                    <div className="flex items-center gap-2 mt-0.5">
                      <ChannelIcon channel={candidate.source} />
                      <span className="capitalize">{candidate.source}</span>
                    </div>
                  }
                />
                <Field label="Call Status" value={<StatusBadge status={candidate.status} />} />
                <Field
                  label="Analysis Outcome"
                  value={
                    candidate.analysisOutcome ? (
                      <span className={`text-xs px-2 py-0.5 rounded border font-medium inline-block mt-0.5 ${OUTCOME_STYLES[candidate.analysisOutcome]}`}>
                        {OUTCOME_LABELS[candidate.analysisOutcome]}
                      </span>
                    ) : null
                  }
                />
                <Field
                  label="Created"
                  value={new Date(candidate.createdAt).toLocaleDateString('de-DE', { day: '2-digit', month: 'long', year: 'numeric' })}
                />
              </div>

              {/* Row: termination, flags, duration, touchpoints */}
              <div className="grid grid-cols-4 gap-6 pt-4 border-t border-gray-100">
                <Field
                  label="Termination Reason"
                  value={candidate.terminationReason
                    ? <span className="text-gray-500 italic text-xs">{candidate.terminationReason}</span>
                    : null}
                />
                <Field
                  label="Call Flags"
                  value={
                    candidate.flags.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5 mt-0.5">
                        {candidate.flags.map(f => (
                          <span key={f} className="text-xs text-gray-500 border border-gray-200 bg-gray-50 px-2 py-0.5 rounded">{f}</span>
                        ))}
                      </div>
                    ) : null
                  }
                />
                <Field label="Call Duration" value={candidate.duration ?? null} />
                <Field label="Total Touchpoints" value={candidate.touchpoints} />
              </div>

              {/* Row: next steps recommendation */}
              <div className="pt-4 border-t border-gray-100">
                <Label>Recruiter Recommendation</Label>
                <div className={`mt-1 px-3 py-2.5 rounded-lg text-sm border ${
                  candidate.analysisOutcome === 'qualified'
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    : candidate.analysisOutcome === 'not-qualified'
                    ? 'bg-red-50 border-red-200 text-red-700'
                    : candidate.analysisOutcome === 'voicemail'
                    ? 'bg-amber-50 border-amber-200 text-amber-800'
                    : 'bg-gray-50 border-gray-200 text-gray-500'
                }`}>
                  {candidate.analysisOutcome === 'qualified'
                    ? 'Candidate meets the requirements. Recommend forwarding to hiring manager for interview.'
                    : candidate.analysisOutcome === 'not-qualified'
                    ? 'Candidate does not meet the requirements. Consider archiving or redirecting to a different position.'
                    : candidate.analysisOutcome === 'voicemail'
                    ? 'No live contact established. Recommend scheduling a follow-up call or sending a message.'
                    : candidate.analysisOutcome === 'inconclusive'
                    ? 'Call was inconclusive. A second outreach is recommended to gather missing information.'
                    : 'Awaiting analysis. No recommendation available yet.'}
                </div>
              </div>
            </div>
          </div>

          {/* CV & Documents */}
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden flex flex-col">
            <CardTitle>CV & Documents</CardTitle>
            <div className="p-5 flex flex-col gap-4 flex-1">

              {/* CV placeholder */}
              <div className="flex-1 border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center gap-3 py-6 min-h-40">
                <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center">
                  <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-500">No CV uploaded</p>
                  <p className="text-xs text-gray-400 mt-0.5">PDF, DOC up to 10 MB</p>
                </div>
                <button className="text-xs px-4 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:border-indigo-400 hover:text-indigo-600 transition-colors font-medium">
                  Upload CV
                </button>
              </div>

              {/* Additional documents */}
              <div className="flex flex-col gap-2">
                <Label>Application Documents</Label>
                {['Cover Letter', 'References', 'Certificates'].map(doc => (
                  <div key={doc} className="flex items-center justify-between px-3 py-2 border border-gray-100 rounded-lg bg-gray-50/50">
                    <div className="flex items-center gap-2">
                      <svg className="w-3.5 h-3.5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span className="text-xs text-gray-400">{doc}</span>
                    </div>
                    <span className="text-[10px] text-gray-300">Not uploaded</span>
                  </div>
                ))}
              </div>

              {/* Application source info */}
              <div className="pt-2 border-t border-gray-100">
                <Field
                  label="Application Source"
                  value={
                    <div className="flex items-center gap-2 mt-0.5">
                      <ChannelIcon channel={candidate.source} />
                      <span className="capitalize text-sm">{candidate.source}</span>
                    </div>
                  }
                />
              </div>
            </div>
          </div>
        </div>

        {/* ══ ROW 4: Background & Experience | Qualification Assessment ══ */}
        <div className="grid grid-cols-3 gap-4">

          {/* Background & Experience — 2 cols */}
          <div className="col-span-2 bg-white border border-gray-200 rounded-xl overflow-hidden">
            <CardTitle>Background & Experience</CardTitle>
            <div className="p-5 grid grid-cols-2 gap-x-8 gap-y-5">
              <Field
                label="Previous Jobs"
                value={
                  candidate.lastJobs.length > 0 ? (
                    <div className="flex flex-col gap-1.5 mt-0.5">
                      {candidate.lastJobs.map((j, i) => (
                        <div key={j} className="flex items-center gap-2">
                          <span className="w-4 h-4 rounded-full bg-gray-100 text-gray-400 text-[10px] flex items-center justify-center shrink-0 font-medium">{i + 1}</span>
                          <span className="text-sm text-gray-700">{j}</span>
                        </div>
                      ))}
                    </div>
                  ) : null
                }
              />
              <Field label="Job Change Motivation" value={
                candidate.jobChangeMotivation
                  ? <span className="text-sm text-gray-700 leading-relaxed">{candidate.jobChangeMotivation}</span>
                  : null
              } />
              <Field label="Special Skills" value={candidate.specialSkills} />
              <Field label="Additional Preferences" value={candidate.additionalPreferences} />
            </div>
          </div>

          {/* Qualification Assessment */}
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden flex flex-col">
            <CardTitle>Qualification Assessment</CardTitle>
            <div className="p-5 flex flex-col gap-4 flex-1">

              {/* Score */}
              <div>
                <Label>Match Score</Label>
                <div className="mt-1 flex items-end gap-2">
                  <span className={`text-3xl font-bold ${
                    candidate.analysisOutcome === 'qualified' ? 'text-emerald-600'
                    : candidate.analysisOutcome === 'not-qualified' ? 'text-red-500'
                    : 'text-gray-300'
                  }`}>
                    {candidate.analysisOutcome === 'qualified' ? '82%'
                     : candidate.analysisOutcome === 'not-qualified' ? '34%'
                     : candidate.analysisOutcome === 'inconclusive' ? '51%'
                     : '—'}
                  </span>
                  {candidate.analysisOutcome && candidate.analysisOutcome !== 'voicemail' && candidate.analysisOutcome !== 'no-contact' && (
                    <span className="text-xs text-gray-400 mb-1">match with job requirements</span>
                  )}
                </div>
              </div>

              {/* Criteria checklist */}
              <div className="flex flex-col gap-2">
                <Label>Criteria</Label>
                {[
                  { label: 'Relevant experience', met: candidate.lastJobs.length > 0 },
                  { label: 'Training / qualification', met: !!candidate.training },
                  { label: 'Driver\'s license', met: candidate.driversLicense === true },
                  { label: 'Salary within range', met: candidate.salary ? parseInt(candidate.salary) <= 3000 : false },
                  { label: 'Available to start', met: !!candidate.earliestStart },
                ].map(c => (
                  <div key={c.label} className="flex items-center gap-2">
                    <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${c.met ? 'bg-emerald-100' : 'bg-gray-100'}`}>
                      {c.met ? (
                        <svg className="w-2.5 h-2.5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <svg className="w-2.5 h-2.5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      )}
                    </div>
                    <span className={`text-xs ${c.met ? 'text-gray-700' : 'text-gray-400'}`}>{c.label}</span>
                  </div>
                ))}
              </div>

              {/* German level pill */}
              {candidate.germanLevel && (
                <div className="pt-3 border-t border-gray-100">
                  <Label>Language Level</Label>
                  <span className="mt-1 inline-block text-xs px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 font-medium">
                    German {candidate.germanLevel}
                  </span>
                </div>
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
