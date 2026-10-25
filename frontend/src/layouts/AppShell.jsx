import { useState } from 'react';
import { Bell, ChevronDown, LayoutDashboard, LogOut, Menu, UserRound, X } from 'lucide-react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import { useAuth } from '../context/AuthContext';
import Avatar from '../components/ui/Avatar';

const navigation = [
  { to: '/app/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/app/profile', label: 'Profile', icon: UserRound },
];

function Sidebar({ open, onClose }) {
  return <>
    {open && <button type="button" aria-label="Close navigation" onClick={onClose} className="fixed inset-0 z-40 bg-slate-950/50 md:hidden" />}
    <aside className={clsx('fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-navy text-white transition-transform duration-180 motion-reduce:transition-none', open ? 'translate-x-0' : '-translate-x-full md:translate-x-0')}>
      <div className="flex h-[72px] items-center justify-between border-b border-white/10 px-5">
        <Link to="/app/dashboard" onClick={onClose} className="flex items-center gap-2.5 font-bold tracking-tight">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand"><span className="text-lg">C</span></span>
          Campus<span className="text-indigo-300">Club</span>
        </Link>
        <button type="button" onClick={onClose} aria-label="Close navigation" className="rounded-lg p-2 text-slate-300 hover:bg-white/10 md:hidden"><X aria-hidden="true" className="h-5 w-5" /></button>
      </div>
      <nav aria-label="App navigation" className="flex-1 space-y-1 px-3 py-6">
        <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">Workspace</p>
        {navigation.map(({ to, label, icon: Icon }) => <NavLink
          key={to}
          to={to}
          onClick={onClose}
          className={({ isActive }) => clsx('group flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium transition duration-150 motion-reduce:transition-none', isActive ? 'bg-white/10 text-white shadow-sm' : 'text-slate-400 hover:bg-white/5 hover:text-white')}
        >
          <Icon aria-hidden="true" className="h-[18px] w-[18px]" />{label}
        </NavLink>)}
      </nav>
      <div className="m-3 rounded-xl border border-white/10 bg-white/[0.04] p-4">
        <p className="text-xs font-semibold text-white">Your campus, together</p>
        <p className="mt-1 text-xs leading-5 text-slate-400">A shared space for the clubs and people you care about.</p>
      </div>
    </aside>
  </>;
}

export default function AppShell() {
  const { user, logout } = useAuth();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const page = navigation.find((item) => item.to === location.pathname)?.label || 'Campus Club';

  function handleLogout() {
    logout();
    navigate('/login', { replace: true });
  }

  return (
    <div className="min-h-screen bg-page">
      <Sidebar open={drawerOpen} onClose={() => setDrawerOpen(false)} />
      <div className="min-h-screen md:pl-64">
        <header className="sticky top-0 z-30 flex h-[72px] items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <button type="button" onClick={() => setDrawerOpen(true)} aria-label="Open navigation" className="-ml-2 rounded-lg p-2 text-slate-600 hover:bg-slate-100 md:hidden"><Menu aria-hidden="true" className="h-5 w-5" /></button>
            <div><p className="text-xs font-medium text-slate-400">Workspace</p><h1 className="truncate text-sm font-bold text-slate-900 sm:text-base">{page}</h1></div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Phase 8 connects the notification center; there is intentionally no fake count. */}
            <button type="button" disabled aria-label="Notifications arrive in a later phase" title="Notifications arrive in a later phase" className="rounded-lg p-2.5 text-slate-400 opacity-60"><Bell aria-hidden="true" className="h-5 w-5" /></button>
            <div className="relative border-l border-slate-200 pl-2 sm:pl-3">
              <button type="button" onClick={() => setProfileOpen((value) => !value)} aria-haspopup="menu" aria-expanded={profileOpen} className="flex items-center gap-2 rounded-xl p-1.5 text-left transition hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-brand">
                <Avatar name={user?.name} src={user?.avatarUrl} size="sm" />
                <span className="hidden max-w-32 sm:block"><span className="block truncate text-xs font-semibold text-slate-800">{user?.name}</span><span className="block truncate text-[11px] capitalize text-slate-500">{user?.role?.replace('_', ' ')}</span></span>
                <ChevronDown aria-hidden="true" className="hidden h-4 w-4 text-slate-400 sm:block" />
              </button>
              {profileOpen && <>
                <button type="button" aria-label="Close profile menu" className="fixed inset-0 z-40 cursor-default" onClick={() => setProfileOpen(false)} />
                <div role="menu" className="absolute right-0 z-50 mt-2 w-56 rounded-xl border border-slate-200 bg-white p-1.5 shadow-md">
                  <div className="border-b border-slate-100 px-3 py-2.5"><p className="truncate text-sm font-semibold text-slate-900">{user?.name}</p><p className="truncate text-xs text-slate-500">{user?.email}</p></div>
                  <Link role="menuitem" to="/app/profile" onClick={() => setProfileOpen(false)} className="mt-1 flex items-center rounded-lg px-3 py-2.5 text-sm text-slate-700 hover:bg-slate-50"><UserRound aria-hidden="true" className="mr-2 h-4 w-4" />Profile</Link>
                  <button role="menuitem" type="button" onClick={handleLogout} className="flex w-full items-center rounded-lg px-3 py-2.5 text-sm text-rose-700 hover:bg-rose-50"><LogOut aria-hidden="true" className="mr-2 h-4 w-4" />Log out</button>
                </div>
              </>}
            </div>
          </div>
        </header>
        <main className="mx-auto w-full max-w-7xl px-4 py-7 sm:px-6 sm:py-9 lg:px-8"><Outlet /></main>
      </div>
    </div>
  );
}
