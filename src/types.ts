export type Channel = 'instagram' | 'facebook' | 'whatsapp' | 'linkedin' | 'website';
export type AnalysisOutcome = 'qualified' | 'not-qualified' | 'voicemail' | 'inconclusive' | 'no-contact';
export type EmploymentStatus =
  | 'looking-for-job'
  | 'employed'
  | 'unemployed'
  | 'applying'
  | 'interview-scheduled'
  | 'not-interested';
export type AiAdoption = 'high' | 'medium' | 'low';

export interface Candidate {
  id: string;
  phoneNumber: string;
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
