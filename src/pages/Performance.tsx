import { mockCandidates } from '../mockData';
import AnalyticsPanel from '../components/AnalyticsPanel';

export default function Performance() {
  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-white">
      <div className="px-5 pt-4 pb-3 shrink-0 border-b border-gray-200">
        <h1 className="text-lg font-semibold text-gray-900">Performance Analytics</h1>
      </div>
      <div className="flex-1 overflow-y-auto">
        <AnalyticsPanel candidates={mockCandidates} />
      </div>
    </div>
  );
}
