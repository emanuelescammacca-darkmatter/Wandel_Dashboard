import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import AiCandidates from './pages/AiCandidates';
import CandidateDetail from './pages/CandidateDetail';
import Performance from './pages/Performance';
import Pipeline from './pages/Pipeline';
import SophiaCalls from './pages/SophiaCalls';
import HRCalls from './pages/HRCalls';

function Placeholder({ title }: { title: string }) {
  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-white">
      <div className="shrink-0 border-b border-gray-200 px-6 pt-4 pb-3">
        <h1 className="text-lg font-semibold text-gray-900">{title}</h1>
      </div>
      <div className="flex-1 flex items-center justify-center">
        <p className="text-sm text-gray-400">Coming soon</p>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <div className="flex h-screen w-full overflow-hidden">
        <Sidebar />
        <main className="flex-1 flex flex-col min-w-0 overflow-y-auto overflow-x-hidden">
          <Routes>
            <Route path="/" element={<Navigate to="/ai-candidates" replace />} />
            <Route path="/ai-candidates" element={<AiCandidates />} />
            <Route path="/ai-candidates/:id" element={<CandidateDetail />} />
            <Route path="/candidates" element={<AiCandidates />} />
            <Route path="/candidates/:id" element={<CandidateDetail />} />
            <Route path="/positions" element={<Placeholder title="Positions" />} />
            <Route path="/employers" element={<Placeholder title="Employers" />} />
            <Route path="/candidate-leads" element={<Placeholder title="Candidate Leads" />} />
            <Route path="/sophia-calls" element={<SophiaCalls />} />
            <Route path="/hr-calls" element={<HRCalls />} />
            <Route path="/whatsapp" element={<Placeholder title="WhatsApp" />} />
            <Route path="/instagram" element={<Placeholder title="Instagram" />} />
            <Route path="/facebook" element={<Placeholder title="Facebook" />} />
            <Route path="/analytics/performance" element={<Performance />} />
            <Route path="/analytics/pipeline" element={<Pipeline />} />
            <Route path="/ai-call" element={<Placeholder title="AI Call" />} />
            <Route path="/bulk-messaging" element={<Placeholder title="Bulk Messaging" />} />
            <Route path="/position-configuration" element={<Placeholder title="Position Configuration" />} />
            <Route path="/course-proficiency" element={<Placeholder title="Course Proficiency" />} />
            <Route path="/language-configuration" element={<Placeholder title="Language Configuration" />} />
            <Route path="/users" element={<Placeholder title="User Management" />} />
            <Route path="/logs" element={<Placeholder title="Logs" />} />
            <Route path="*" element={<Navigate to="/ai-candidates" replace />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}