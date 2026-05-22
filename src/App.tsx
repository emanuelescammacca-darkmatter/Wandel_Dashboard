import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import AiCandidates from './pages/AiCandidates';
import CandidateDetail from './pages/CandidateDetail';

export default function App() {
  return (
    <BrowserRouter>
      <div className="flex h-screen w-full overflow-hidden">
        <Sidebar />
        <main className="flex-1 flex flex-col min-w-0 overflow-y-auto overflow-x-hidden">
          <Routes>
            <Route path="/" element={<Navigate to="/candidates" replace />} />
            <Route path="/candidates" element={<AiCandidates />} />
            <Route path="/candidates/:id" element={<CandidateDetail />} />
            <Route path="*" element={<Navigate to="/candidates" replace />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
