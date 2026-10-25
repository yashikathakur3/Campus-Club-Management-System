import { ArrowUpRight, CalendarDays, Sparkles, UsersRound } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Badge from '../components/ui/Badge';
import Card from '../components/ui/Card';
import EmptyState from '../components/ui/EmptyState';
import PageHeader from '../components/ui/PageHeader';

function roleLabel(role) { return role === 'super_admin' ? 'Super Admin' : 'Member'; }

export default function DashboardPage() {
  const { user } = useAuth();
  return (
    <div>
      <PageHeader eyebrow="Your workspace" title={`Welcome, ${user?.name?.split(' ')[0] || 'there'}`} description="Your campus communities and plans will find a home here." />
      <Card className="relative mb-7 overflow-hidden border-0 bg-navy p-6 text-white shadow-sm sm:p-8">
        <div aria-hidden="true" className="absolute -right-10 -top-20 h-64 w-64 rounded-full bg-indigo-500/20 blur-3xl" />
        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="max-w-2xl">
            <div className="flex flex-wrap items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-white/10"><Sparkles aria-hidden="true" className="h-5 w-5 text-amber-300" /></span><Badge variant="primary" className="bg-indigo-300/15 text-indigo-100">{roleLabel(user?.role)}</Badge></div>
            <h2 className="mt-5 text-xl font-bold sm:text-2xl">This is your campus, {user?.name?.split(' ')[0] || 'friend'}.</h2>
            <p className="mt-2 max-w-xl text-sm leading-6 text-slate-300">We’re getting your club space ready. Soon, your memberships and the things happening around you will all be easy to find.</p>
          </div>
          <Link to="/app/profile" className="inline-flex min-h-10 shrink-0 items-center gap-2 self-start rounded-control border border-white/20 px-4 text-sm font-semibold text-white transition hover:bg-white/10 sm:self-auto">View profile<ArrowUpRight aria-hidden="true" className="h-4 w-4" /></Link>
        </div>
      </Card>
      <div className="mb-7 grid gap-4 sm:grid-cols-2">
        <Card className="flex items-start gap-4"><span className="grid h-11 w-11 place-items-center rounded-xl bg-indigo-50 text-brand"><UsersRound aria-hidden="true" className="h-5 w-5" /></span><div><h2 className="text-sm font-semibold text-slate-900">Your clubs</h2><p className="mt-1 text-sm leading-6 text-slate-500">Membership details will appear once the club directory is ready.</p></div></Card>
        <Card className="flex items-start gap-4"><span className="grid h-11 w-11 place-items-center rounded-xl bg-amber-50 text-amber-700"><CalendarDays aria-hidden="true" className="h-5 w-5" /></span><div><h2 className="text-sm font-semibold text-slate-900">Your next event</h2><p className="mt-1 text-sm leading-6 text-slate-500">Events from your communities will be collected here.</p></div></Card>
      </div>
      <EmptyState icon={Sparkles} title="Your campus space is taking shape" description="More of your community will show up here in upcoming updates." />
    </div>
  );
}
