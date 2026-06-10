import { useParams, useNavigate } from 'react-router-dom';
import { mockCandidates, mockPositions } from '../data/mockData';
import ProfileFactsRail from './components/profile/ProfileFactsRail';

export default function PositionCandidateDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const candidate = mockCandidates.find(c => c.id === id);

  // Back link targets the position the candidate is matched to.
  const position = mockPositions.find(p => p.title === candidate?.jobTitle) ?? mockPositions[0];
  const listPath = `/clients/positions/${position?.id ?? 'p1'}`;
  const listLabel = position?.title ?? 'Position';

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

  return (
    <ProfileFactsRail
      candidate={candidate}
      onBack={() => navigate(listPath)}
      backLabel={listLabel}
    />
  );
}
