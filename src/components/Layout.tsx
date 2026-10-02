import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  FileText,
  Briefcase,
  Send,
  MessagesSquare,
  Settings,
  Zap,
  Menu,
  X,
  Inbox,
} from 'lucide-react';
import { cn } from '../lib/cn';
import { api, getUserId } from '../lib/api';

const NAV = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/resume', label: 'Resume Builder', icon: FileText },
  { to: '/jobs', label: 'Jobs', icon: Briefcase },
  { to: '/applications', label: 'Applications', icon: Send },
  { to: '/inbox', label: 'Inbox', icon: Inbox, badge: true },
  { to: '/qa', label: 'Screening Q&A', icon: MessagesSquare },
  { to: '/settings', label: 'Settings', icon: Settings },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [inboxCount, setInboxCount] = useState(0);
  const loc = useLocation();

  useEffect(() => {
    const uid = getUserId();
    if (!uid) return;
    const poll = () => api.inbox(uid).then((r) => setInboxCount(r.count)).catch(() => {});
    poll();
    const t = setInterval(poll, 60000);
    return () => clearInterval(t);
  }, [loc.pathname]);
  return (
    <div className="grid-bg min-h-full">
      <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-[#070b16]/85 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:px-6">
          <button
            className="rounded-lg p-2 text-slate-300 hover:bg-slate-800 lg:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
          <Link to="/" className="flex items-center gap-2.5">
            <span className="animate-pulse-ring flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 via-indigo-500 to-fuchsia-500">
              <Zap size={18} className="text-white" />
            </span>
            <span className="text-lg font-bold tracking-tight">
              <span className="grad-text">Hakein</span>
              <span className="ml-2 hidden rounded-full border border-slate-700 px-2 py-0.5 text-[11px] font-medium text-slate-400 sm:inline">
                AI job autopilot
              </span>
            </span>
          </Link>
          <nav className="ml-8 hidden items-center gap-1 lg:flex">
            {NAV.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition',
                    isActive ? 'bg-slate-800 text-white' : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-100',
                  )
                }
              >
                <n.icon size={16} />
                {n.label}
                {'badge' in n && n.badge && inboxCount > 0 && (
                  <span className="rounded-full bg-amber-400 px-1.5 text-[11px] font-bold text-black">
                    {inboxCount}
                  </span>
                )}
              </NavLink>
            ))}
          </nav>
          <div className="ml-auto hidden items-center gap-2 text-xs text-slate-500 md:flex">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            {loc.pathname === '/' ? 'overview' : loc.pathname.slice(1)}
          </div>
        </div>
        {open && (
          <nav className="border-t border-slate-800 px-4 py-3 lg:hidden">
            <div className="grid gap-1">
              {NAV.map((n) => (
                <NavLink
                  key={n.to}
                  to={n.to}
                  onClick={() => setOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium',
                      isActive ? 'bg-slate-800 text-white' : 'text-slate-400 hover:bg-slate-800/60',
                    )
                  }
                >
                  <n.icon size={16} />
                  {n.label}
                  {'badge' in n && n.badge && inboxCount > 0 && (
                    <span className="ml-auto rounded-full bg-amber-400 px-1.5 text-[11px] font-bold text-black">
                      {inboxCount}
                    </span>
                  )}
                </NavLink>
              ))}
            </div>
          </nav>
        )}
      </header>
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">{children}</main>
      <footer className="mx-auto max-w-7xl px-4 pb-8 text-center text-xs text-slate-600 sm:px-6">
        Hakein — tailored resumes, 24h job watch, auto-apply. Runs on your backend + Mongo Atlas.
      </footer>
    </div>
  );
}
