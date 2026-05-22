import { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { mockCandidates } from '../mockData';
import PipelineStatusBadge from '../components/PipelineStatusBadge';
import NeedForActionBadge from '../components/NeedForActionBadge';
import type { AnalysisOutcome } from '../types';

// ── Analysis outcome dropdown options ────────────────────────────────────────

const ANALYSIS_OUTCOMES: { value: AnalysisOutcome; label: string }[] = [
  { value: 'voicemail_detected',          label: 'Voicemail Detected' },
  { value: 'wrong_person',                label: 'Wrong Person' },
  { value: 'no_meaningful_interaction',   label: 'No Meaningful Interaction' },
  { value: 'consent_declined',            label: 'Consent Declined' },
  { value: 'reschedule_requested',        label: 'Reschedule Requested' },
  { value: 'interview_completed_full',    label: 'Interview Completed (Full)' },
  { value: 'interview_completed_partial', label: 'Interview Completed (Partial)' },
  { value: 'technical_failure',           label: 'Technical Failure' },
  { value: 'other',                       label: 'Other' },
];

const ANALYSIS_OUTCOME_STYLES: Record<AnalysisOutcome, string> = {
  voicemail_detected:          'text-amber-700 bg-amber-50 border-amber-200',
  wrong_person:                'text-gray-500 bg-gray-50 border-gray-200',
  no_meaningful_interaction:   'text-gray-500 bg-gray-50 border-gray-200',
  consent_declined:            'text-red-600 bg-red-50 border-red-200',
  reschedule_requested:        'text-sky-700 bg-sky-50 border-sky-200',
  interview_completed_full:    'text-emerald-700 bg-emerald-50 border-emerald-200',
  interview_completed_partial: 'text-indigo-700 bg-indigo-50 border-indigo-200',
  technical_failure:           'text-red-600 bg-red-50 border-red-200',
  other:                       'text-gray-500 bg-gray-50 border-gray-200',
};

// ── Reusable UI ──────────────────────────────────────────────────────────────

function Label({ children }: { children: React.ReactNode }) {
  return <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">{children}</p>;
}

function CardTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-5 py-3 border-b border-gray-100 bg-gray-50/80 shrink-0">
      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">{children}</p>
    </div>
  );
}

function EditableValue({ value, onChange, placeholder = '—' }: {
  value: string | null | undefined;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, [value]);

  return (
    <textarea
      ref={ref}
      rows={1}
      value={value ?? ''}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full text-[15px] text-gray-800 bg-transparent border border-transparent rounded px-2 -mx-2 py-1.5 hover:bg-gray-50 focus:bg-white focus:border-indigo-300 focus:outline-none placeholder-gray-300 resize-none overflow-hidden leading-snug"
    />
  );
}

function EditableField({ label, value, onChange, placeholder }: {
  label: string;
  value: string | null | undefined;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="min-w-0">
      <Label>{label}</Label>
      <EditableValue value={value} onChange={onChange} placeholder={placeholder} />
    </div>
  );
}

// ── Form bits used inside collapsible cards ──────────────────────────────────

function FormInput({ label, value, onChange, placeholder }: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="text-[11px] font-medium text-gray-500 block mb-1">{label}</label>
      <input
        value={value ?? ''}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full h-8 px-2.5 text-xs text-gray-800 bg-white border border-gray-200 rounded-md focus:outline-none focus:border-indigo-400 placeholder-gray-300"
      />
    </div>
  );
}

function FormTextarea({ label, value, onChange, rows = 4 }: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  rows?: number;
}) {
  return (
    <div>
      <label className="text-[11px] font-medium text-gray-500 block mb-1">{label}</label>
      <textarea
        value={value ?? ''}
        onChange={e => onChange(e.target.value)}
        rows={rows}
        className="w-full px-2.5 py-2 text-xs text-gray-800 bg-white border border-gray-200 rounded-md focus:outline-none focus:border-indigo-400 placeholder-gray-300 leading-relaxed resize-none"
      />
    </div>
  );
}

// ── Rich text editor ─────────────────────────────────────────────────────────

function ToolbarButton({ onClick, title, children }: {
  onClick: () => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onMouseDown={e => e.preventDefault()}
      onClick={onClick}
      title={title}
      className="w-7 h-7 flex items-center justify-center rounded text-gray-600 hover:bg-gray-100 transition-colors"
    >
      {children}
    </button>
  );
}

function RichTextEditor({ label, defaultValue, onChange, minHeight = 100 }: {
  label: string;
  defaultValue: string;
  onChange: (v: string) => void;
  minHeight?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current && ref.current.innerHTML === '' && defaultValue) {
      ref.current.innerHTML = defaultValue;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const exec = (cmd: string, arg?: string) => {
    ref.current?.focus();
    document.execCommand(cmd, false, arg);
    if (ref.current) onChange(ref.current.innerHTML);
  };

  const handleInput = () => {
    if (ref.current) onChange(ref.current.innerHTML);
  };

  return (
    <div>
      <label className="text-[11px] font-medium text-gray-500 block mb-1">{label}</label>
      <div className="border border-gray-200 rounded-md overflow-hidden bg-white">
        <div className="flex items-center gap-0.5 px-1.5 py-1 border-b border-gray-200 bg-gray-50/60">
          <select
            onMouseDown={e => e.preventDefault()}
            onChange={e => exec('formatBlock', e.target.value)}
            defaultValue="p"
            className="h-7 px-1.5 text-xs text-gray-700 bg-transparent rounded hover:bg-gray-100 focus:outline-none border-none"
          >
            <option value="p">Normal</option>
            <option value="h1">Heading 1</option>
            <option value="h2">Heading 2</option>
            <option value="h3">Heading 3</option>
          </select>
          <div className="w-px h-4 bg-gray-200 mx-1" />
          <ToolbarButton onClick={() => exec('bold')} title="Bold">
            <span className="text-xs font-bold">B</span>
          </ToolbarButton>
          <ToolbarButton onClick={() => exec('italic')} title="Italic">
            <span className="text-xs italic font-serif">I</span>
          </ToolbarButton>
          <ToolbarButton onClick={() => exec('underline')} title="Underline">
            <span className="text-xs underline">U</span>
          </ToolbarButton>
          <ToolbarButton
            onClick={() => {
              const url = prompt('Link URL:');
              if (url) exec('createLink', url);
            }}
            title="Insert link"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 010 5.656l-3 3a4 4 0 11-5.656-5.656l1.5-1.5m6.828-1.328a4 4 0 015.656 0l3 3a4 4 0 010 5.656l-1.5 1.5" transform="rotate(-45 12 12)" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 15l6-6" />
            </svg>
          </ToolbarButton>
          <div className="w-px h-4 bg-gray-200 mx-1" />
          <ToolbarButton onClick={() => exec('insertOrderedList')} title="Ordered list">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 6h13M7 12h13M7 18h13M3 6h.01M3 12h.01M3 18h.01" />
            </svg>
          </ToolbarButton>
          <ToolbarButton onClick={() => exec('insertUnorderedList')} title="Bullet list">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
            </svg>
          </ToolbarButton>
          <div className="w-px h-4 bg-gray-200 mx-1" />
          <ToolbarButton onClick={() => exec('removeFormat')} title="Clear formatting">
            <span className="text-xs font-semibold">
              T<sub className="text-[8px]">x</sub>
            </span>
          </ToolbarButton>
        </div>
        <div
          ref={ref}
          contentEditable
          suppressContentEditableWarning
          onInput={handleInput}
          style={{ minHeight }}
          className="px-3 py-2.5 text-xs text-gray-800 focus:outline-none leading-relaxed [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_a]:text-indigo-600 [&_a]:underline"
        />
      </div>
    </div>
  );
}

// ── CollapsibleCard ──────────────────────────────────────────────────────────

function CollapsibleCard({ title, isOpen, onToggle, onDelete, badge, children }: {
  title: string;
  isOpen: boolean;
  onToggle: () => void;
  onDelete?: () => void;
  badge?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className={`border rounded-md overflow-hidden transition-colors ${isOpen ? 'border-violet-200' : 'border-gray-200'}`}>
      <button
        onClick={onToggle}
        className={`w-full flex items-center gap-2 px-3 py-2 text-left transition-colors ${
          isOpen ? 'bg-violet-50' : 'bg-white hover:bg-gray-50'
        }`}
      >
        <svg
          className={`w-3.5 h-3.5 text-gray-400 transition-transform shrink-0 ${isOpen ? 'rotate-180' : ''}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
        <span className="text-xs text-gray-700 truncate flex-1">{title}</span>
      </button>
      {isOpen && (
        <div className="p-4 border-t border-violet-100 bg-white flex flex-col gap-4">
          {(badge || onDelete) && (
            <div className="flex items-center justify-between -mb-1">
              {badge && <p className="text-xs font-semibold text-gray-800">{badge}</p>}
              {onDelete && (
                <button
                  onClick={onDelete}
                  className="ml-auto px-2.5 py-1 text-[11px] font-medium text-violet-600 border border-violet-200 rounded-md hover:bg-violet-50 transition-colors"
                >
                  Delete
                </button>
              )}
            </div>
          )}
          {children}
        </div>
      )}
    </div>
  );
}

function AddButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-gray-500 border border-dashed border-gray-300 rounded-md hover:border-indigo-400 hover:text-indigo-600 hover:bg-indigo-50/40 transition-colors"
    >
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
      </svg>
      {label}
    </button>
  );
}

// ── Types for collapsible items ──────────────────────────────────────────────

type TrainingEntry = {
  id: string;
  type: string;
  title: string;
  institution: string;
  currentlyStudying: boolean;
  startMonth: string;
  startYear: string;
  endMonth: string;
  endYear: string;
  country: string;
  state: string;
  city: string;
  description: string;
};

type ExperienceEntry = {
  id: string;
  type: string;
  title: string;
  company: string;
  currentlyWorking: boolean;
  startMonth: string;
  startYear: string;
  endMonth: string;
  endYear: string;
  country: string;
  state: string;
  city: string;
  description: string;
};

const trainingSummary = (t: TrainingEntry) => {
  const start = [t.startMonth, t.startYear].filter(Boolean).join(' / ');
  const end = t.currentlyStudying ? 'Present' : [t.endMonth, t.endYear].filter(Boolean).join(' / ');
  const dates = start || end ? ` (${start || '?'} - ${end || '?'})` : '';
  return `${t.title || 'Untitled'}${t.institution ? `: ${t.institution}` : ''}${dates}`;
};

const experienceSummary = (e: ExperienceEntry) => {
  const start = [e.startMonth, e.startYear].filter(Boolean).join(' / ');
  const end = e.currentlyWorking ? 'Present' : [e.endMonth, e.endYear].filter(Boolean).join(' / ');
  const dates = start || end ? ` (${start || '?'} - ${end || '?'})` : '';
  return `${e.title || 'Untitled'}${e.company ? `: ${e.company}` : ''}${dates}`;
};

// ── Component ────────────────────────────────────────────────────────────────

export default function CandidateDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const listPath = location.pathname.startsWith('/candidates') ? '/candidates' : '/ai-candidates';
  const listLabel = location.pathname.startsWith('/candidates') ? 'Candidates' : 'AI Candidates';
  const candidate = mockCandidates.find(c => c.id === id);

  // Editable form state — seeded from candidate
  const [form, setForm] = useState({
    phoneNumber:    candidate?.phoneNumber ?? '',
    email:          candidate?.email ?? '',
    dateOfBirth:    candidate?.dateOfBirth ?? '',
    address:        candidate?.address ?? '',
    earliestStart:  candidate?.earliestStart ?? '',
    germanLevel:    candidate?.germanLevel ?? '',
    driversLicense: candidate
      ? (candidate.driversLicense === true
          ? `Yes${candidate.licenseClasses ? ` — ${candidate.licenseClasses}` : ''}`
          : candidate.driversLicense === false ? 'No' : '')
      : '',
    salary:         candidate?.salary ? `€${candidate.salary}/mo` : '',
    jobTitle:       candidate?.jobTitle ?? '',
    training:       candidate?.training ?? '',
  });
  const set = (key: keyof typeof form) => (v: string) => setForm(f => ({ ...f, [key]: v }));

  // Background & Experience state
  const [changeMotivation, setChangeMotivation] = useState(candidate?.jobChangeMotivation ?? '');
  const [specialSkills, setSpecialSkills]       = useState(candidate?.specialSkills ?? '');

  const [trainings, setTrainings] = useState<TrainingEntry[]>([
    {
      id: 't1',
      type: 'Ausbildung',
      title: candidate?.training ?? 'Industriemechaniker',
      institution: 'IHK München',
      currentlyStudying: false,
      startMonth: 'September',
      startYear: '2008',
      endMonth: 'Juli',
      endYear: '2011',
      country: 'Germany',
      state: 'Bavaria',
      city: 'München',
      description: 'Ausbildung im Bereich Elektrotechnik mit Schwerpunkt auf Industrieanlagen und Wartung.',
    },
  ]);

  const [experiences, setExperiences] = useState<ExperienceEntry[]>([
    {
      id: 'e1',
      type: 'Festanstellung',
      title: 'Servicetechniker',
      company: 'Bosch GmbH',
      currentlyWorking: true,
      startMonth: 'März',
      startYear: '2020',
      endMonth: '',
      endYear: '',
      country: 'Germany',
      state: 'Bavaria',
      city: 'München',
      description: 'Wartung und Reparatur von Industriemaschinen, Kundeneinsätze im DACH-Raum.',
    },
    {
      id: 'e2',
      type: 'Festanstellung',
      title: 'Techniker',
      company: 'Siemens AG',
      currentlyWorking: false,
      startMonth: 'Januar',
      startYear: '2015',
      endMonth: 'Februar',
      endYear: '2020',
      country: 'Germany',
      state: 'Bavaria',
      city: 'München',
      description: 'Inbetriebnahme und Instandhaltung von Produktionsanlagen.',
    },
    {
      id: 'e3',
      type: 'Ausbildung / Praktikum',
      title: 'Auszubildender',
      company: 'Maschinenbau Meier',
      currentlyWorking: false,
      startMonth: 'August',
      startYear: '2011',
      endMonth: 'Dezember',
      endYear: '2014',
      country: 'Germany',
      state: 'Bavaria',
      city: 'Augsburg',
      description: 'Allgemeine Werkstattarbeiten und Begleitung von Servicetechnikern.',
    },
  ]);

  const [openTrainingId, setOpenTrainingId]     = useState<string | null>(null);
  const [openExperienceId, setOpenExperienceId] = useState<string | null>(null);

  const updateTraining = (id: string, patch: Partial<TrainingEntry>) =>
    setTrainings(prev => prev.map(t => (t.id === id ? { ...t, ...patch } : t)));
  const deleteTraining = (id: string) =>
    setTrainings(prev => prev.filter(t => t.id !== id));
  const addTraining = () => {
    const id = `t${Date.now()}`;
    setTrainings(prev => [...prev, {
      id, type: '', title: '', institution: '', currentlyStudying: false,
      startMonth: '', startYear: '', endMonth: '', endYear: '',
      country: '', state: '', city: '', description: '',
    }]);
    setOpenTrainingId(id);
  };

  const updateExperience = (id: string, patch: Partial<ExperienceEntry>) =>
    setExperiences(prev => prev.map(e => (e.id === id ? { ...e, ...patch } : e)));
  const deleteExperience = (id: string) =>
    setExperiences(prev => prev.filter(e => e.id !== id));
  const addExperience = () => {
    const id = `e${Date.now()}`;
    setExperiences(prev => [...prev, {
      id, type: '', title: '', company: '', currentlyWorking: false,
      startMonth: '', startYear: '', endMonth: '', endYear: '',
      country: '', state: '', city: '', description: '',
    }]);
    setOpenExperienceId(id);
  };

  // Call Analysis state
  const formatDay = (d?: string | null) =>
    d ? new Date(d).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '';
  const formatTimeOfDay = (d?: string | null) => {
    if (!d) return '';
    const date = new Date(d);
    return isNaN(date.getTime())
      ? ''
      : date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
  };
  const [callAnalysis, setCallAnalysis] = useState({
    agent:             'Sophia · Outreach',
    callDay:           formatDay(candidate?.lastContactAt ?? candidate?.createdAt),
    callTime:          formatTimeOfDay(candidate?.createdAt) || '10:42',
    llmCost:           '€0.12',
    outcome:           (candidate?.analysisOutcome ?? '') as AnalysisOutcome | '',
    terminationReason: candidate?.terminationReason ?? '',
    callDuration:      candidate?.duration ?? '',
    messages:          candidate?.transcript ? String(candidate.transcript.length) : '0',
    elevenLabsLink:    `https://elevenlabs.io/app/conversational-ai/history/${candidate?.id ?? ''}`,
  });
  const setCA = (key: keyof typeof callAnalysis) => (v: string) =>
    setCallAnalysis(s => ({ ...s, [key]: v }));
  const [transcriptSummary, setTranscriptSummary] = useState(candidate?.transcriptSummary ?? '');

  // Transcript audio + notes
  const [isPlaying, setIsPlaying]   = useState(false);
  const [notes, setNotes]           = useState('');
  const [notesSaved, setNotesSaved] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  if (!candidate) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-gray-400 text-sm">
          Candidate not found.{' '}
          <button onClick={() => navigate(listPath)} className="underline">Go back</button>
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

        {/* ══ ROW 1: Candidate header — name + editable profile fields ══ */}
        <div className="bg-white border border-gray-200 rounded-xl px-6 py-5 flex items-stretch gap-8">

          {/* Left: breadcrumb + avatar + name / status */}
          <div className="flex flex-col gap-3 shrink-0 min-w-45">
            <button
              onClick={() => navigate(listPath)}
              className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 w-fit transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              {listLabel}
            </button>
            <div className="flex flex-col gap-3">
              <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-semibold text-lg shrink-0">
                {candidate.firstName.charAt(0)}
              </div>
              <div>
                <h2 className="text-base font-semibold text-gray-900 leading-tight">
                  {candidate.firstName} {candidate.lastName}
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">{form.training || '—'}</p>
              </div>
              <div className="flex flex-col gap-2 w-fit">
                <div>
                  <Label>Stage</Label>
                  <PipelineStatusBadge status={candidate.pipelineStatus} />
                </div>
                <div>
                  <Label>Need for Action</Label>
                  <NeedForActionBadge value={candidate.needForAction} />
                </div>
              </div>
            </div>
          </div>

          {/* Vertical separator */}
          <div className="w-px bg-gray-100 self-stretch shrink-0" />

          {/* Right: profile fields — column-major 5 × 2 grid, all editable, filling the card height */}
          <div className="flex-1 grid grid-cols-5 grid-rows-2 grid-flow-col gap-x-8 content-between">
            {/* Col 1 */}
            <EditableField label="Phone" value={form.phoneNumber} onChange={set('phoneNumber')} />
            <EditableField label="Email" value={form.email} onChange={set('email')} />
            {/* Col 2 */}
            <EditableField label="Date of Birth" value={form.dateOfBirth} onChange={set('dateOfBirth')} placeholder="YYYY-MM-DD" />
            <EditableField label="Address" value={form.address} onChange={set('address')} />
            {/* Col 3 */}
            <EditableField label="Notice Period / Availability" value={form.earliestStart} onChange={set('earliestStart')} />
            <EditableField label="German Level" value={form.germanLevel} onChange={set('germanLevel')} />
            {/* Col 4 */}
            <EditableField label="Driver's License" value={form.driversLicense} onChange={set('driversLicense')} placeholder="e.g. Yes — B" />
            <EditableField label="Desired Salary" value={form.salary} onChange={set('salary')} placeholder="e.g. €2800/mo" />
            {/* Col 5 */}
            <EditableField label="Job Identifier" value={form.jobTitle} onChange={set('jobTitle')} />
            <div className="min-w-0">
              <Label>Created</Label>
              <p className="text-[15px] text-gray-800 px-2 -mx-2 py-1.5">
                {new Date(candidate.createdAt).toLocaleDateString('de-DE', { day: '2-digit', month: 'long', year: 'numeric' })}
              </p>
            </div>
          </div>
        </div>

        {/* ══ ROW 2: Background & Experience (2/3) | CV & Documents (1/3) ══ */}
        <div className="grid grid-cols-3 gap-4">

          {/* Background & Experience — spans 2 cols */}
          <div className="col-span-2 bg-white border border-gray-200 rounded-xl overflow-hidden">
            <CardTitle>Background & Experience</CardTitle>
            <div className="p-5 grid grid-cols-[3fr_2fr] gap-x-6 gap-y-6">

              {/* Col 1 (wider): Training (top) + Experiences (bottom) */}
              <div className="flex flex-col gap-6">
                <div>
                  <label className="text-[11px] font-medium text-gray-500 block mb-2">Training</label>
                  <div className="flex flex-col gap-2">
                    {trainings.map((t, i) => (
                      <CollapsibleCard
                        key={t.id}
                        title={trainingSummary(t)}
                        isOpen={openTrainingId === t.id}
                        onToggle={() => setOpenTrainingId(openTrainingId === t.id ? null : t.id)}
                        onDelete={() => { deleteTraining(t.id); if (openTrainingId === t.id) setOpenTrainingId(null); }}
                        badge={`Training ${i + 1}`}
                      >
                        <FormInput label="Type"        value={t.type}        onChange={v => updateTraining(t.id, { type: v })} />
                        <FormInput label="Title"       value={t.title}       onChange={v => updateTraining(t.id, { title: v })} />
                        <FormInput label="Institution" value={t.institution} onChange={v => updateTraining(t.id, { institution: v })} />
                        <label className="flex items-center gap-2 text-xs text-gray-600">
                          <input
                            type="checkbox"
                            checked={t.currentlyStudying}
                            onChange={e => updateTraining(t.id, { currentlyStudying: e.target.checked })}
                            className="rounded border-gray-300"
                          />
                          Currently studying
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                          <FormInput label="Start Month" value={t.startMonth} onChange={v => updateTraining(t.id, { startMonth: v })} />
                          <FormInput label="Start Year"  value={t.startYear}  onChange={v => updateTraining(t.id, { startYear: v })} />
                          {!t.currentlyStudying && (
                            <>
                              <FormInput label="End Month" value={t.endMonth} onChange={v => updateTraining(t.id, { endMonth: v })} />
                              <FormInput label="End Year"  value={t.endYear}  onChange={v => updateTraining(t.id, { endYear: v })} />
                            </>
                          )}
                        </div>
                        <FormInput label="Country" value={t.country} onChange={v => updateTraining(t.id, { country: v })} />
                        <div className="grid grid-cols-2 gap-3">
                          <FormInput label="State" value={t.state} onChange={v => updateTraining(t.id, { state: v })} />
                          <FormInput label="City"  value={t.city}  onChange={v => updateTraining(t.id, { city: v })} />
                        </div>
                        <FormTextarea label="Description" value={t.description} onChange={v => updateTraining(t.id, { description: v })} rows={3} />
                      </CollapsibleCard>
                    ))}
                    <AddButton label="Add training" onClick={addTraining} />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-medium text-gray-500 block mb-2">Experiences</label>
                  <div className="flex flex-col gap-2">
                    {experiences.map((e, i) => (
                      <CollapsibleCard
                        key={e.id}
                        title={experienceSummary(e)}
                        isOpen={openExperienceId === e.id}
                        onToggle={() => setOpenExperienceId(openExperienceId === e.id ? null : e.id)}
                        onDelete={() => { deleteExperience(e.id); if (openExperienceId === e.id) setOpenExperienceId(null); }}
                        badge={`Experience ${i + 1}`}
                      >
                        <FormInput label="Position type"  value={e.type}    onChange={v => updateExperience(e.id, { type: v })} />
                        <FormInput label="Position title" value={e.title}   onChange={v => updateExperience(e.id, { title: v })} />
                        <FormInput label="Company"        value={e.company} onChange={v => updateExperience(e.id, { company: v })} />
                        <label className="flex items-center gap-2 text-xs text-gray-600">
                          <input
                            type="checkbox"
                            checked={e.currentlyWorking}
                            onChange={ev => updateExperience(e.id, { currentlyWorking: ev.target.checked })}
                            className="rounded border-gray-300"
                          />
                          Currently working on this role
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                          <FormInput label="Start Month" value={e.startMonth} onChange={v => updateExperience(e.id, { startMonth: v })} />
                          <FormInput label="Start Year"  value={e.startYear}  onChange={v => updateExperience(e.id, { startYear: v })} />
                          {!e.currentlyWorking && (
                            <>
                              <FormInput label="End Month" value={e.endMonth} onChange={v => updateExperience(e.id, { endMonth: v })} />
                              <FormInput label="End Year"  value={e.endYear}  onChange={v => updateExperience(e.id, { endYear: v })} />
                            </>
                          )}
                        </div>
                        <FormInput label="Country" value={e.country} onChange={v => updateExperience(e.id, { country: v })} />
                        <div className="grid grid-cols-2 gap-3">
                          <FormInput label="State" value={e.state} onChange={v => updateExperience(e.id, { state: v })} />
                          <FormInput label="City"  value={e.city}  onChange={v => updateExperience(e.id, { city: v })} />
                        </div>
                        <FormTextarea label="Experience Description" value={e.description} onChange={v => updateExperience(e.id, { description: v })} rows={3} />
                      </CollapsibleCard>
                    ))}
                    <AddButton label="Add experience" onClick={addExperience} />
                  </div>
                </div>
              </div>

              {/* Col 2 (narrower): Change Motivation (top) + Special Skills (bottom) */}
              <div className="flex flex-col gap-5">
                <RichTextEditor
                  label="Change Motivation"
                  defaultValue={changeMotivation}
                  onChange={setChangeMotivation}
                  minHeight={70}
                />
                <RichTextEditor
                  label="Special Skills"
                  defaultValue={specialSkills}
                  onChange={setSpecialSkills}
                  minHeight={70}
                />
              </div>

            </div>
          </div>

          {/* CV & Documents — simplified: CV upload + Certificates row only */}
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden flex flex-col">
            <CardTitle>CV & Documents</CardTitle>
            <div className="p-5 flex flex-col gap-4 flex-1">

              {/* CV upload area */}
              <div className="border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center gap-3 py-8">
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

              {/* Certificates row only */}
              <div className="flex flex-col gap-2">
                <Label>Additional Documents</Label>
                <div className="flex items-center justify-between px-3 py-2 border border-gray-100 rounded-lg bg-gray-50/50">
                  <div className="flex items-center gap-2">
                    <svg className="w-3.5 h-3.5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span className="text-xs text-gray-400">Certificates</span>
                  </div>
                  <span className="text-[10px] text-gray-300">Not uploaded</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ══ ROW 3: Transcript (left) | Notes (right) — fixed height ══ */}
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

        {/* ══ ROW 4: Call Analysis (full width) ══ */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <CardTitle>Call Analysis</CardTitle>
          <div className="p-5 flex flex-col gap-5">

            {/* Job Title | ElevenLabs Link */}
            <div className="grid grid-cols-2 gap-6">
              <div>
                <Label>Job Title</Label>
                <EditableValue value={form.jobTitle} onChange={set('jobTitle')} />
              </div>
              <div>
                <Label>ElevenLabs Link</Label>
                <div className="flex items-center gap-1.5">
                  <div className="flex-1 min-w-0">
                    <EditableValue
                      value={callAnalysis.elevenLabsLink}
                      onChange={setCA('elevenLabsLink')}
                      placeholder="https://elevenlabs.io/..."
                    />
                  </div>
                  {callAnalysis.elevenLabsLink && (
                    <a
                      href={callAnalysis.elevenLabsLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Open in ElevenLabs"
                      className="shrink-0 inline-flex items-center justify-center w-7 h-7 rounded-md text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 border border-gray-200 hover:border-indigo-200 transition-colors"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* Row: Agent | Call Day | Call Time | LLM Cost */}
            <div className="grid grid-cols-4 gap-6 pt-4 border-t border-gray-100">
              <EditableField label="Agent"     value={callAnalysis.agent}    onChange={setCA('agent')} />
              <EditableField label="Call Day"  value={callAnalysis.callDay}  onChange={setCA('callDay')} placeholder="DD.MM.YYYY" />
              <EditableField label="Call Time" value={callAnalysis.callTime} onChange={setCA('callTime')} placeholder="HH:MM" />
              <EditableField label="LLM Cost"  value={callAnalysis.llmCost}  onChange={setCA('llmCost')} placeholder="€0.00" />
            </div>

            {/* Row: Analysis Outcome | Termination Reason | Call Duration | Messages */}
            <div className="grid grid-cols-4 gap-6 pt-4 border-t border-gray-100">
              <div>
                <Label>Analysis Outcome</Label>
                <div className="relative inline-block mt-0.5">
                  <select
                    value={callAnalysis.outcome}
                    onChange={e => setCA('outcome')(e.target.value)}
                    className={`appearance-none pr-8 pl-3 h-8 text-xs font-medium rounded-md border focus:outline-none focus:ring-2 focus:ring-indigo-200 cursor-pointer transition-colors ${
                      callAnalysis.outcome
                        ? ANALYSIS_OUTCOME_STYLES[callAnalysis.outcome as AnalysisOutcome]
                        : 'text-gray-500 bg-white border-gray-200'
                    }`}
                  >
                    <option value="">— Select outcome —</option>
                    {ANALYSIS_OUTCOMES.map(o => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                  <svg
                    className="w-3 h-3 text-gray-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none"
                    fill="none" stroke="currentColor" viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
              <EditableField
                label="Termination Reason"
                value={callAnalysis.terminationReason}
                onChange={setCA('terminationReason')}
                placeholder="e.g. Call ended by remote party"
              />
              <EditableField
                label="Call Duration"
                value={callAnalysis.callDuration}
                onChange={setCA('callDuration')}
                placeholder="MM:SS"
              />
              <EditableField
                label="Messages"
                value={callAnalysis.messages}
                onChange={setCA('messages')}
                placeholder="0"
              />
            </div>

            {/* Transcript Summary */}
            <div className="pt-4 border-t border-gray-100">
              <RichTextEditor
                label="Transcript Summary"
                defaultValue={transcriptSummary}
                onChange={setTranscriptSummary}
                minHeight={120}
              />
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
