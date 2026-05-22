import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import wandelLogo from '../assets/wandel-logo.png';

// ── Icons ────────────────────────────────────────────────────────────────────

const Icons = {
  candidates: <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>,
};

// ── Panel toggle icons ────────────────────────────────────────────────────────

const PanelClose = (
  <svg fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
    <rect x="2" y="3" width="20" height="18" rx="2" />
    <path d="M9 3v18" />
    <path d="M16 8l-3 4 3 4" />
  </svg>
);

const PanelOpen = (
  <svg fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
    <rect x="2" y="3" width="20" height="18" rx="2" />
    <path d="M9 3v18" />
    <path d="M12 8l3 4-3 4" />
  </svg>
);

// ── Nav sections ──────────────────────────────────────────────────────────────

const NAV_SECTIONS = [
  {
    label: 'Overview',
    items: [
      { label: 'Candidates', path: '/candidates', icon: Icons.candidates },
    ],
  },
];

// ── Component ─────────────────────────────────────────────────────────────────

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      style={{ fontFamily: "'Inter', sans-serif" }}
      className={`${collapsed ? 'w-13' : 'w-52'} h-screen bg-[#1e3a5f] flex flex-col shrink-0 transition-all duration-200 ease-in-out`}
    >
      {/* ── Header: logo + collapse toggle (always same row) ── */}
      <div className={`flex items-center pt-4 pb-2 ${collapsed ? 'justify-center px-0' : 'justify-between px-3'}`}>

        {/* Logo + name — hidden when collapsed */}
        {!collapsed && (
          <div className="flex items-center gap-2 shrink-0">
            <div style={{ height: '24px', overflow: 'hidden', flexShrink: 0 }}>
              <img
                src={wandelLogo}
                alt="Wandel"
                style={{ filter: 'brightness(0) invert(1)', height: '30px', width: 'auto', display: 'block' }}
              />
            </div>
            <span className="text-white/90 font-semibold text-[14px] tracking-wide leading-none">Wandel</span>
          </div>
        )}

        {/* Toggle button — always at this row's height */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="w-6 h-6 flex items-center justify-center rounded text-white/45 hover:text-white/80 hover:bg-white/6 transition-colors shrink-0"
        >
          <span className="w-4.5 h-4.5">{collapsed ? PanelOpen : PanelClose}</span>
        </button>
      </div>

      {/* ── Nav ── */}
      <nav className={`flex-1 pb-3 ${collapsed ? 'px-1' : 'px-2'}`}>
        {NAV_SECTIONS.map((section) => (
          <div key={section.label} className="mt-5">

            {!collapsed && (
              <p className="px-2 pb-1.5 text-[10px] font-semibold text-white/38 uppercase tracking-widest">
                {section.label}
              </p>
            )}
            {collapsed && (
              <div className="mx-auto w-5 border-t border-white/10 mb-2" />
            )}

            <div className="flex flex-col gap-px">
              {section.items.map((item) => (
                <div key={item.path} className="relative group/nav">
                  <NavLink
                    to={item.path}
                    className={({ isActive }) =>
                      `flex items-center rounded-md transition-colors ${
                        collapsed
                          ? 'justify-center w-8 h-8 mx-auto'
                          : 'gap-2.5 px-2.5 py-1.75'
                      } ${
                        isActive
                          ? 'bg-white/10 text-white'
                          : 'text-white/65 hover:text-white/95 hover:bg-white/6'
                      }`
                    }
                  >
                    <span className={`shrink-0 ${collapsed ? 'w-4.5 h-4.5' : 'w-4.25 h-4.25'}`}>
                      {item.icon}
                    </span>
                    {!collapsed && (
                      <span className="text-[13.5px] font-[450] truncate leading-none">{item.label}</span>
                    )}
                  </NavLink>

                  {collapsed && (
                    <div className="
                      absolute left-full top-1/2 -translate-y-1/2 ml-1.5
                      bg-neutral-600/75 text-white/90 text-xs font-medium
                      px-2.5 py-1.5 rounded-md whitespace-nowrap
                      pointer-events-none select-none z-50
                      opacity-0 group-hover/nav:opacity-100
                      transition-opacity duration-150
                    ">
                      {item.label}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* ── Account button ── */}
      <div className={`border-t border-white/8 py-3 ${collapsed ? 'flex justify-center' : 'px-3'}`}>
        <div className="relative group/account">
          <button
            className={`flex items-center gap-2.5 rounded-md hover:bg-white/6 transition-colors ${
              collapsed ? 'w-8 h-8 justify-center' : 'px-2 py-1.5 w-full'
            }`}
          >
            <div className="w-7 h-7 rounded-full bg-indigo-500 flex items-center justify-center text-white text-xs font-semibold shrink-0">
              E
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0 text-left">
                <p className="text-[13px] font-medium text-white/80 truncate leading-tight">Account</p>
              </div>
            )}
          </button>

          {collapsed && (
            <div className="
              absolute left-full bottom-0 ml-1.5
              bg-neutral-600/75 text-white/90 text-xs font-medium
              px-2.5 py-1.5 rounded-md whitespace-nowrap
              pointer-events-none select-none z-50
              opacity-0 group-hover/account:opacity-100
              transition-opacity duration-150
            ">
              Account
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
