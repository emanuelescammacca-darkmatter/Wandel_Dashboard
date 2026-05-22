import type { PipelineStatus } from '../types';

const styles: Record<PipelineStatus, string> = {
  'instant-form':      'border border-sky-200 text-sky-700 bg-sky-50',
  'whatsapp-outreach': 'border border-emerald-200 text-emerald-700 bg-emerald-50',
  'call':              'border border-indigo-200 text-indigo-700 bg-indigo-50',
  'profile-complete':  'border border-teal-200 text-teal-700 bg-teal-50',
  'matched':           'border border-violet-200 text-violet-700 bg-violet-50',
  'talent-pool':       'border border-gray-200 text-gray-500 bg-gray-50',
};

const labels: Record<PipelineStatus, string> = {
  'instant-form':      'Instant Form',
  'whatsapp-outreach': 'WhatsApp Outreach',
  'call':              'Call',
  'profile-complete':  'Profile Complete',
  'matched':           'Matched',
  'talent-pool':       'Talent Pool',
};

export default function PipelineStatusBadge({ status }: { status: PipelineStatus }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium whitespace-nowrap ${styles[status]}`}>
      {labels[status]}
    </span>
  );
}

export const PIPELINE_STATUS_OPTIONS: { value: PipelineStatus; label: string }[] = [
  { value: 'instant-form',      label: 'Instant Form' },
  { value: 'whatsapp-outreach', label: 'WhatsApp Outreach' },
  { value: 'call',              label: 'Call' },
  { value: 'profile-complete',  label: 'Profile Complete' },
  { value: 'matched',           label: 'Matched' },
  { value: 'talent-pool',       label: 'Talent Pool' },
];
