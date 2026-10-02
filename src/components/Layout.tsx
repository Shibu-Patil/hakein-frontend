import { Link } from 'react-router-dom';
import { Home as HomeIcon, ClipboardList, Inbox as InboxIcon, FileText, Zap } from 'lucide-react';
import { cn } from '../lib/cn';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid-bg min-h-full">
      <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-[#070b16]/85 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-3xl items-center gap-3 px-4">
          <Link to="/" className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 via-indigo-500 to-fuchsia-500">
              <Zap size={18} className="text-white" />
            </span>
            <span className="text-lg font-bold tracking-tight grad-text">Hakein</span>
          </Link>
          <nav className="ml-auto flex items-center gap-1">
            <NavBtn to="/" icon={<HomeIcon size={16} />} label="Home" />
            <NavBtn to="/resume" icon={<FileText size={16} />} label="Resume" />
            <NavBtn to="/setup" icon={<ClipboardList size={16} />} label="Setup" />
            <NavBtn to="/inbox" icon={<InboxIcon size={16} />} label="Inbox" />
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-6">{children}</main>
      <footer className="mx-auto max-w-3xl px-4 pb-8 text-center text-xs text-slate-600">
        Applies for you day and night. You only step in if your inbox asks.
      </footer>
    </div>
  );
}

function NavBtn({ to, icon, label }: { to: string; icon: React.ReactNode; label: string }) {
  return (
    <Link
      to={to}
      className={cn(
        'flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-slate-400 transition hover:bg-slate-800/60 hover:text-slate-100',
      )}
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </Link>
  );
}
