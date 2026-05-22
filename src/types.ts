export type Channel = 'instagram' | 'facebook' | 'whatsapp' | 'linkedin' | 'website';
export type AnalysisOutcome =
  | 'voicemail_detected'
  | 'wrong_person'
  | 'no_meaningful_interaction'
  | 'consent_declined'
  | 'reschedule_requested'
  | 'interview_completed_full'
  | 'interview_completed_partial'
  | 'technical_failure'
  | 'other';
export type EmploymentStatus =
  | 'looking-for-job'
  | 'employed'
  | 'unemployed'
  | 'applying'
  | 'interview-scheduled'
  | 'not-interested';
export type AiAdoption = 'high' | 'medium' | 'low';

export type PipelineStatus =
  | 'instant-form'
  | 'whatsapp-outreach'
  | 'call'
  | 'profile-complete'
  | 'matched'
  | 'talent-pool';

export type NeedForAction = 'high' | 'medium' | 'low';

export type Recruiter = 'Tanina' | 'Itgel' | 'Berti' | 'Camilla';

export interface Candidate {
  id: string;
  phoneNumber: string;
  email: string | null;
  address: string | null;
  city: string | null;
  firstName: string;
  lastName: string;
  jobTitle: string;
  source: Channel;
  flags: string[];
  dateOfBirth: string | null;
  germanLevel: string | null;
  training: string | null;
  salary: string | null;
  earliestStart: string | null;
  driversLicense: boolean | null;
  licenseClasses: string | null;
  lastJobs: string[];
  jobChangeMotivation: string | null;
  specialSkills: string | null;
  additionalPreferences: string | null;
  status: 'done' | 'failed' | 'in-progress' | 'initiated';
  employmentStatus: EmploymentStatus;
  pipelineStatus: PipelineStatus;
  needForAction: NeedForAction;
  recruiter: Recruiter | null;
  touchpoints: number;
  duration: string | null;
  lastContactAt: string | null;
  aiAdoption: AiAdoption | null;
  analysisOutcome: AnalysisOutcome | null;
  terminationReason: string | null;
  transcriptSummary: string | null;
  transcript: TranscriptEntry[] | null;
  audioUrl: string | null;
  createdAt: string;
}

export interface TranscriptEntry {
  speaker: 'agent' | 'candidate';
  text: string;
  timestamp: string;
}
