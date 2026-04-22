import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import AiCandidates from './pages/AiCandidates';
import CandidateDetail from './pages/CandidateDetail';

function Placeholder({ title }: { title: string }) {
  return (
    <div className="flex-1 flex items-center justify-center text-gray-400">
      <p className="text-lg">{title} — coming soon</p>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <div className="flex min-h-screen w-full">
        <Sidebar />
        <main className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
          <Routes>
            <Route path="/" element={<Navigate to="/ai-candidates" replace />} />
            <Route path="/ai-candidates" element={<AiCandidates />} />
            <Route path="/ai-candidates/:id" element={<CandidateDetail />} />
            <Route path="/candidates" element={<Placeholder title="Candidates" />} />
            <Route path="/positions" element={<Placeholder title="Positions" />} />
            <Route path="/employers" element={<Placeholder title="Employers" />} />
            <Route path="/users" element={<Placeholder title="User Management" />} />
            <Route path="/logs" element={<Placeholder title="Logs" />} />
            <Route path="/ai-call" element={<Placeholder title="AI Call" />} />
            <Route path="*" element={<Navigate to="/ai-candidates" replace />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}