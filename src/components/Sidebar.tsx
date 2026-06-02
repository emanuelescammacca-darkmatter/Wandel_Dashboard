import { useState, type ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import wandelLogo from '../assets/wandel-logo.png';

// ── Icons ────────────────────────────────────────────────────────────────────

const Icons = {
  candidates: <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>,
  positions:  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>,
  employers:  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>,
  leads:      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
  phone:      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>,
  headset:    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M5 10a7 7 0 0 1 14 0" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M3 10.5v4.5a2 2 0 0 0 4 0v-4.5" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M17 10.5v4.5a2 2 0 0 0 4 0v-4.5" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M19 15a4.5 4.5 0 0 1-4.5 4.5H13" /><circle cx="13" cy="19.5" r="1.2" strokeWidth={1.4} /></svg>,
  whatsapp:   <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7} d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8.5a2.5 2.5 0 0 1 3.5 3.5C14 13.5 10 11.5 8.5 12A2.5 2.5 0 0 1 12 15.5" /></svg>,
  instagram:  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="2" y="2" width="20" height="20" rx="5" strokeWidth={1.6} strokeLinecap="round" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z" /><circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" /></svg>,
  facebook:   <svg viewBox="0 0 24 24" fill="currentColor"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h4l1-4h-5V7a1 1 0 0 1 1-1h3z" /></svg>,
  chart:      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="3" y="13" width="4" height="7" rx="0.8" strokeWidth={1.6} strokeLinecap="round" /><rect x="10" y="8" width="4" height="12" rx="0.8" strokeWidth={1.6} strokeLinecap="round" /><rect x="17" y="4" width="4" height="16" rx="0.8" strokeWidth={1.6} strokeLinecap="round" /></svg>,
  funnel:     <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>,
  settings:   <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
  book:       <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>,
  globe:      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" /></svg>,
  users:      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>,
  logs:       <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>,
  plus:       <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M12 5v14m-7-7h14" /></svg>,
  dashboard:  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1.5" strokeWidth={1.6} /><rect x="14" y="3" width="7" height="7" rx="1.5" strokeWidth={1.6} /><rect x="3" y="14" width="7" height="7" rx="1.5" strokeWidth={1.6} /><rect x="14" y="14" width="7" height="7" rx="1.5" strokeWidth={1.6} /></svg>,
  sparkles:   <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M12 3l1.8 4.2L18 9l-4.2 1.8L12 15l-1.8-4.2L6 9l4.2-1.8L12 3z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M18 14l.9 2.1L21 17l-2.1.9L18 20l-.9-2.1L15 17l2.1-.9L18 14z" /></svg>,
  one:        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="3.5" y="3.5" width="17" height="17" rx="4.5" strokeWidth={1.6} /><text x="12" y="16.2" textAnchor="middle" fontSize="11" fontWeight="700" fill="currentColor" stroke="none">1</text></svg>,
  two:        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="3.5" y="3.5" width="17" height="17" rx="4.5" strokeWidth={1.6} /><text x="12" y="16.2" textAnchor="middle" fontSize="11" fontWeight="700" fill="currentColor" stroke="none">2</text></svg>,
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

type NavChild = { label: string; path: string };
type NavItem = { label: string; path: string; icon: ReactNode; children?: NavChild[] };
type NavSection = { label: string; items: NavItem[] };

const NAV_SECTIONS: NavSection[] = [
  {
    label: 'Recruitment',
    items: [
      { label: 'Candidates',      path: '/candidates',      icon: Icons.candidates },
      { label: 'Positions',       path: '/positions',       icon: Icons.positions },
      { label: 'Employers',       path: '/employers',       icon: Icons.employers },
    ],
  },
  {
    label: 'Channels',
    items: [
      { label: 'Sophia Calls', path: '/sophia-calls', icon: Icons.phone },
      { label: 'HR Calls',     path: '/hr-calls',     icon: Icons.headset },
      { label: 'WhatsApp',     path: '/whatsapp',     icon: Icons.whatsapp },
      { label: 'Instagram',    path: '/instagram',    icon: Icons.instagram },
      { label: 'Facebook',     path: '/facebook',     icon: Icons.facebook },
    ],
  },
  {
    label: 'Analytics',
    items: [
      { label: 'Performance',     path: '/analytics/performance', icon: Icons.chart },
      { label: 'Pipeline Report', path: '/analytics/pipeline',    icon: Icons.funnel },
    ],
  },
  {
    label: 'Operations - Clients',
    items: [
      {
        label: 'Ask Sophia',
        path: '/ask-sophia',
        icon: Icons.sparkles,
        children: [
          { label: 'Senior Nurse – Berlin',    path: '/ask-sophia/senior-nurse-berlin' },
          { label: 'Warehouse Lead – Hamburg', path: '/ask-sophia/warehouse-lead-hamburg' },
          { label: 'Sales Rep – Munich',       path: '/ask-sophia/sales-rep-munich' },
        ],
      },
      { label: 'Dashboard', path: '/dashboard', icon: Icons.dashboard },
    ],
  },
  {
    label: 'Positions - Clients',
    items: [
      { label: 'Position X',   path: '/clients/positions',    icon: Icons.one },
      { label: 'Position 2',   path: '/clients/positions-2',  icon: Icons.two },
      { label: 'New Position', path: '/clients/new-position', icon: Icons.plus },
    ],
  },
];

// ── Component ─────────────────────────────────────────────────────────────────

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const toggleExpand = (path: string) =>
    setExpanded((prev) => ({ ...prev, [path]: !prev[path] }));

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
      <nav className={`flex-1 min-h-0 pb-3 sidebar-scroll ${collapsed ? 'overflow-visible px-1' : 'overflow-y-auto px-2'}`}>
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
              {section.items.map((item) => {
                const isOpen = !!expanded[item.path];
                const hasChildren = !!item.children && !collapsed;
                return (
                  <div key={item.path} className="relative">
                    <div className="relative group/nav">
                      <NavLink
                        to={item.path}
                        className={({ isActive }) =>
                          `flex items-center rounded-md transition-colors ${
                            collapsed
                              ? 'justify-center w-8 h-8 mx-auto'
                              : 'gap-2.5 px-2.5 py-1.75'
                          } ${hasChildren ? 'pr-7' : ''} ${
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

                      {/* Expand / collapse triangle */}
                      {hasChildren && (
                        <button
                          onClick={() => toggleExpand(item.path)}
                          aria-label={isOpen ? 'Collapse' : 'Expand'}
                          className="absolute right-1.5 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center rounded text-white/45 hover:text-white/90 hover:bg-white/10 transition-colors"
                        >
                          <svg className={`w-3.5 h-3.5 transition-transform duration-150 ${isOpen ? 'rotate-90' : ''}`} viewBox="0 0 12 12" fill="currentColor">
                            <path d="M4 2l4 4-4 4z" />
                          </svg>
                        </button>
                      )}

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

                    {/* Tree connector line: equal gap below Sophia's icon and above the next item */}
                    {hasChildren && isOpen && (
                      <div aria-hidden className="absolute left-[18px] top-[34px] bottom-[2px] w-px bg-white/15" />
                    )}

                    {/* Sub-pages */}
                    {hasChildren && isOpen && (
                      <div className="mt-px mb-1 flex flex-col gap-px pl-5 pr-1">
                        {item.children!.map((child) => (
                          <NavLink
                            key={child.path}
                            to={child.path}
                            className={({ isActive }) =>
                              `flex items-center rounded-md px-2.5 py-1.75 text-[13px] truncate transition-colors ${
                                isActive
                                  ? 'bg-white/10 text-white'
                                  : 'text-white/55 hover:text-white/90 hover:bg-white/6'
                              }`
                            }
                          >
                            <span className="truncate">{child.label}</span>
                          </NavLink>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
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
