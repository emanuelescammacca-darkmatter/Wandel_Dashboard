import type { EmploymentStatus } from '../types';

const styles: Record<EmploymentStatus, string> = {
  'looking-for-job':      'border border-sky-200 text-sky-700 bg-sky-50',
  'employed':             'border border-emerald-200 text-emerald-700 bg-emerald-50',
  'unemployed':           'border border-amber-200 text-amber-700 bg-amber-50',
  'applying':             'border border-indigo-200 text-indigo-700 bg-indigo-50',
  'interview-scheduled':  'border border-teal-200 text-teal-700 bg-teal-50',
  'not-interested':       'border border-gray-200 text-gray-500 bg-gray-50',
};

// Dark-tinted variant for the navy dashboard theme (opt-in via the `dark` prop).
const darkStyles: Record<EmploymentStatus, string> = {
  'looking-for-job':      'border border-sky-500/30 text-sky-300 bg-sky-500/15',
  'employed':             'border border-emerald-500/30 text-emerald-300 bg-emerald-500/15',
  'unemployed':           'border border-amber-500/30 text-amber-300 bg-amber-500/15',
  'applying':             'border border-indigo-500/30 text-indigo-300 bg-indigo-500/15',
  'interview-scheduled':  'border border-teal-500/30 text-teal-300 bg-teal-500/15',
  'not-interested':       'border border-white/15 text-slate-300 bg-white/10',
};

const labels: Record<EmploymentStatus, string> = {
  'looking-for-job':      'Looking for Job',
  'employed':             'Employed',
  'unemployed':           'Unemployed',
  'applying':             'Applying',
  'interview-scheduled':  'Interview',
  'not-interested':       'Not Interested',
};

export default function StatusBadge({ status, dark = false }: { status: EmploymentStatus; dark?: boolean }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium whitespace-nowrap ${(dark ? darkStyles : styles)[status]}`}>
      {labels[status]}
    </span>
  );
}
