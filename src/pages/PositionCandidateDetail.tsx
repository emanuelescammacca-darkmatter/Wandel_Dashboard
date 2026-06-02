import { useParams, useNavigate } from 'react-router-dom';
import { mockCandidates, mockPositions } from '../mockData';
import ProfileFactsRail from './profiles/ProfileFactsRail';
import ProfileAssessmentHero from './profiles/ProfileAssessmentHero';
import ProfileThreeColumn from './profiles/ProfileThreeColumn';

/* Each of the first three candidates gets its own profile design. */
const PROFILE_BY_ID: Record<string, typeof ProfileFactsRail> = {
  '1': ProfileFactsRail,       // Marcel Weber  — Dossier (sticky facts rail)
  '2': ProfileAssessmentHero,  // Andi Kufner   — Verdict (assessment hero)
  '3': ProfileThreeColumn,     // Udo A. Brandt — Cockpit (3-column dashboard)
};

export default function PositionCandidateDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const listPath = '/clients/positions';
  const listLabel = mockPositions[0]?.title ?? 'Position';
  const candidate = mockCandidates.find(c => c.id === id);

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

  const Profile = PROFILE_BY_ID[candidate.id] ?? ProfileFactsRail;

  return (
    <Profile
      candidate={candidate}
      onBack={() => navigate(listPath)}
      backLabel={listLabel}
    />
  );
}
