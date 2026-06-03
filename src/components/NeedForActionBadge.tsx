import type { NeedForAction } from '../types';

const styles: Record<NeedForAction, string> = {
  high:   'bg-red-50 text-red-700 border-red-200',
  medium: 'bg-amber-50 text-amber-700 border-amber-200',
  low:    'bg-gray-50 text-gray-500 border-gray-200',
};

const labels: Record<NeedForAction, string> = {
  high:   'High',
  medium: 'Medium',
  low:    'Low',
};

export default function NeedForActionBadge({ value }: { value: NeedForAction }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border whitespace-nowrap ${styles[value]}`}>
      {labels[value]}
    </span>
  );
}
