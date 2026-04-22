import { NavLink } from 'react-router-dom';

const navItems = [
  { label: 'Candidates', path: '/candidates', icon: '👤' },
  { label: 'Positions', path: '/positions', icon: '💼' },
  { label: 'Employers', path: '/employers', icon: '🏢' },
  { label: 'User Management', path: '/users', icon: '⚙️' },
  { label: 'Logs', path: '/logs', icon: '📋' },
  { label: 'AI Call', path: '/ai-call', icon: '📞' },
  { label: 'AI Candidates', path: '/ai-candidates', icon: '🤖' },
];

export default function Sidebar() {
  return (
    <aside className="w-56 min-h-screen bg-[#1a1a2e] flex flex-col shrink-0">
      <div className="px-5 py-6 border-b border-white/10">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-white/20 rounded flex items-center justify-center text-white font-bold text-sm">W</div>
          <span className="text-white font-semibold text-lg tracking-wide">WANDEL</span>
        </div>
      </div>

      <nav className="flex-1 py-4 px-3 flex flex-col gap-0.5">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                isActive
                  ? 'bg-white/15 text-white font-medium'
                  : 'text-white/60 hover:text-white hover:bg-white/8'
              }`
            }
          >
            <span className="text-base">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="px-4 py-4 border-t border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white text-sm font-medium">
            E
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-xs font-medium truncate">Emanuele Scammacca</p>
            <p className="text-white/40 text-xs truncate">Wandel 2023</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
