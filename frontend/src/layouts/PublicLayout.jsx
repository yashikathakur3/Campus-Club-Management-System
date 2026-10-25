import { ArrowUpRight, Compass, Sparkles } from 'lucide-react';
import { Link, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Button from '../components/ui/Button';

function LinkButton({ to, variant = 'primary', children, className = '' }) {
  const styles = {
    primary: 'bg-brand text-white hover:bg-brand-dark shadow-sm',
    secondary: 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 shadow-sm',
    ghost: 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
  };
  return <Link to={to} className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-control px-4 text-sm font-semibold transition duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 motion-reduce:transition-none ${styles[variant]} ${className}`}>{children}</Link>;
}

export default function PublicLayout() {
  const { user } = useAuth();
  return (
    <div className="min-h-screen bg-white text-slate-900">
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/95 backdrop-blur">
        <nav aria-label="Main navigation" className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-2.5 rounded-lg focus-visible:ring-2 focus-visible:ring-brand">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand text-white"><Sparkles aria-hidden="true" className="h-5 w-5" /></span>
            <span className="text-sm font-bold tracking-tight sm:text-base">Campus<span className="text-brand">Club</span></span>
          </Link>
          <div className="hidden items-center gap-7 sm:flex">
            <Link className="text-sm font-medium text-slate-600 transition hover:text-brand" to="/#clubs">Clubs</Link>
            <Link className="text-sm font-medium text-slate-600 transition hover:text-brand" to="/#events">Events</Link>
          </div>
          <div className="flex items-center gap-2">
            {user ? <LinkButton to="/app/dashboard" variant="primary">Open app<ArrowUpRight aria-hidden="true" className="h-4 w-4" /></LinkButton> : <>
              <LinkButton to="/login" variant="ghost" className="hidden sm:inline-flex">Log in</LinkButton>
              <LinkButton to="/register" variant="primary">Get started</LinkButton>
            </>}
          </div>
        </nav>
      </header>
      <Outlet />
      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-7 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <Link to="/" className="inline-flex items-center gap-2 font-semibold text-slate-700"><Compass aria-hidden="true" className="h-4 w-4 text-brand" />Campus Club</Link>
          <p>A clearer home for student clubs and campus life.</p>
        </div>
      </footer>
    </div>
  );
}
