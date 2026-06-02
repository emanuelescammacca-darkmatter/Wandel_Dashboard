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

export interface WorkExperience {
  role: string;
  company: string;
  period: string;
  location?: string;
  description: string;
}

export interface EducationEntry {
  qualification: string;
  institution: string;
  period: string;
  type: 'ausbildung' | 'studium' | 'lehre' | 'weiterbildung';
}

export interface ClientQuestion {
  question: string;
  answer: string;
}

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
  email?: string | null;
  address?: string | null;
  nationality?: string | null;
  noticePeriod?: string | null;
  experiences?: WorkExperience[];
  education?: EducationEntry[];
  clientQuestions?: ClientQuestion[];
  assessment?: string | null;
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

export type PositionStatus = 'open' | 'in-progress' | 'complete';

export type ScoringSystem = 'binary' | 'scale';

export interface CriteriaBlock {
  id: string;
  title: string;
  bullets: string[];
  scoring: ScoringSystem;
}

export interface Position {
  id: string;
  title: string;
  description: string;
  employer: string;
  receivedAt: string;
  candidateCount: number;
  status: PositionStatus;
  criteria: CriteriaBlock[];
}
