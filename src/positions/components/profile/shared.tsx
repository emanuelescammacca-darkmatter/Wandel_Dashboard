import type { EducationEntry } from '../../../types';

/** Compute age in full years from an ISO date string. */
export function ageFromDob(dob: string | null | undefined): number | null {
  if (!dob) return null;
  const birth = new Date(dob);
  const ref = new Date('2026-06-01'); // app "today"
  let age = ref.getFullYear() - birth.getFullYear();
  const m = ref.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && ref.getDate() < birth.getDate())) age--;
  return age;
}

/** Format an ISO date as a long date, e.g. "June 12, 1990". */
export function formatDate(iso: string | null | undefined): string | null {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
}

/** Format a monthly gross salary string, e.g. "2900" -> "2.900 € / month". */
export function formatSalary(salary: string | null | undefined): string | null {
  if (!salary) return null;
  const n = Number(salary);
  if (Number.isNaN(n)) return salary;
  return `${n.toLocaleString('de-DE')} € / month`;
}

export function driversLicenseLabel(has: boolean | null | undefined, classes: string | null | undefined): string | null {
  if (has === true) return classes ? `Yes — Class ${classes}` : 'Yes';
  if (has === false) return 'No';
  return null;
}

export const EDUCATION_TYPE_LABEL: Record<EducationEntry['type'], string> = {
  ausbildung: 'Vocational training',
  studium: 'Degree',
  lehre: 'Apprenticeship',
  weiterbildung: 'Further training',
};

export const EDUCATION_TYPE_STYLE: Record<EducationEntry['type'], string> = {
  ausbildung: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  studium: 'bg-violet-50 text-violet-700 border-violet-200',
  lehre: 'bg-sky-50 text-sky-700 border-sky-200',
  weiterbildung: 'bg-amber-50 text-amber-700 border-amber-200',
};

/** Initials from first + last name. */
export function initials(first: string, last: string): string {
  return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase();
}

/** Back breadcrumb button shared by all three designs. */
export function BackLink({ label, onClick, tone = 'light' }: { label: string; onClick: () => void; tone?: 'light' | 'dark' }) {
  const cls = tone === 'dark'
    ? 'text-white/60 hover:text-white'
    : 'text-gray-400 hover:text-gray-700';
  return (
    <button onClick={onClick} className={`flex items-center gap-1.5 text-xs w-fit transition-colors ${cls}`}>
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
      </svg>
      {label}
    </button>
  );
}

/** Small inline SVG icons used across the profile designs. */
export const Icons = {
  phone: (
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.95.68l1.5 4.5a1 1 0 01-.5 1.21l-2.26 1.13a11 11 0 005.52 5.52l1.13-2.26a1 1 0 011.21-.5l4.5 1.5a1 1 0 01.68.95V19a2 2 0 01-2 2h-1C9.72 21 3 14.28 3 6V5z" />
  ),
  mail: (
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  ),
  cake: (
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M12 6V3m0 3a2 2 0 012 2v1H10V8a2 2 0 012-2zM4 12a2 2 0 012-2h12a2 2 0 012 2v2c-1.5 1-2.5 1-4 0s-2.5-1-4 0-2.5 1-4 0-2.5-1-4 0v-2zM4 16v3a2 2 0 002 2h12a2 2 0 002-2v-3" />
  ),
  pin: (
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M17.66 16.66L12 22l-5.66-5.34a8 8 0 1111.32 0zM15 11a3 3 0 11-6 0 3 3 0 016 0z" />
  ),
  globe: (
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0zM3.6 9h16.8M3.6 15h16.8M12 3a14 14 0 010 18 14 14 0 010-18z" />
  ),
  chat: (
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M8 12h.01M12 12h.01M16 12h.01M21 12a9 9 0 01-13.255 7.93L3 21l1.07-4.745A9 9 0 1121 12z" />
  ),
  language: (
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M3 5h12M9 3v2m1.5 0c-.5 4-2.5 7-5.5 9m0-4c1.5 1.5 3 2.5 5 3M14 21l4-9 4 9m-7-2h6" />
  ),
  car: (
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M5 13l1.5-4.5A2 2 0 018.4 7h7.2a2 2 0 011.9 1.5L19 13m-14 0h14m-14 0v4m14-4v4M7 17h.01M17 17h.01M5 17h14a0 0 0 010 0v0a0 0 0 01 0 0" />
  ),
  clock: (
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M12 8v4l3 2m6-2a9 9 0 11-18 0 9 9 0 0118 0z" />
  ),
  euro: (
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M14.5 8a4 4 0 100 8M5 10h7M5 14h7" />
  ),
  briefcase: (
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M9 6V5a2 2 0 012-2h2a2 2 0 012 2v1m-9 0h14a2 2 0 012 2v3M3 6a2 2 0 012-2m-2 2v9a2 2 0 002 2h14a2 2 0 002-2v-2M3 11h18" />
  ),
  cap: (
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M12 4L2 9l10 5 10-5-10-5zM6 11.5V16c0 1.1 2.7 2.5 6 2.5s6-1.4 6-2.5v-4.5" />
  ),
};

export function Glyph({ children, className = 'w-4 h-4' }: { children: React.ReactNode; className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      {children}
    </svg>
  );
}
