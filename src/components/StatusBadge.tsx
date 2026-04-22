type Status = 'done' | 'failed' | 'in-progress' | 'initiated';

const styles: Record<Status, string> = {
  done: 'border border-emerald-300 text-emerald-700 bg-emerald-50',
  failed: 'border border-red-200 text-red-600 bg-red-50',
  'in-progress': 'border border-sky-200 text-sky-700 bg-sky-50',
  initiated: 'border border-gray-200 text-gray-500 bg-gray-50',
};

const labels: Record<Status, string> = {
  done: 'Done',
  failed: 'Failed',
  'in-progress': 'In Progress',
  initiated: 'Initiated',
};

export default function StatusBadge({ status }: { status: Status }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${styles[status]}`}>
      {labels[status]}
    </span>
  );
}
