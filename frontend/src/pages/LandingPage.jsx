import { ArrowRight, CalendarDays, Compass, ShieldCheck, UsersRound, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import EmptyState from '../components/ui/EmptyState';

const benefits = [
  { icon: Compass, title: 'Find your people', text: 'Explore the interests and communities that make campus feel like yours.' },
  { icon: CalendarDays, title: 'Stay in the loop', text: 'Keep club updates and campus plans in one place as the community grows.' },
  { icon: ShieldCheck, title: 'A space that feels clear', text: 'A simpler member experience, with the right information easy to find.' },
];

function PreviewCard() {
  return (
    <div aria-hidden="true" className="relative mx-auto w-full max-w-[440px]">
      <div className="absolute -left-8 top-10 h-28 w-28 rounded-full bg-indigo-400/20 blur-3xl" />
      <div className="absolute -right-6 bottom-0 h-32 w-32 rounded-full bg-amber-300/20 blur-3xl" />
      <div className="relative rotate-1 rounded-[28px] border border-white/15 bg-white/[0.08] p-3 shadow-md backdrop-blur">
        <div className="rounded-[21px] bg-white p-5 text-slate-900 sm:p-6">
          <div className="flex items-center justify-between">
            <div><p className="text-xs font-medium text-slate-500">Your campus space</p><p className="mt-1 text-lg font-bold">Make room for what you love.</p></div>
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-indigo-50 text-brand"><UsersRound className="h-5 w-5" /></span>
          </div>
          <div className="mt-6 space-y-3">
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-4"><div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-amber-100 text-amber-700"><Compass className="h-5 w-5" /></span><div><p className="text-sm font-semibold">Discover communities</p><p className="mt-0.5 text-xs text-slate-500">Find a place to start</p></div></div></div>
            <div className="rounded-xl border border-slate-100 bg-white p-4"><div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-50 text-emerald-700"><CalendarDays className="h-5 w-5" /></span><div><p className="text-sm font-semibold">Bring plans together</p><p className="mt-0.5 text-xs text-slate-500">Your club life, organized</p></div></div></div>
          </div>
          <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4"><span className="text-xs font-medium text-slate-500">Built around student life</span><Zap className="h-4 w-4 text-amber-500" /></div>
        </div>
      </div>
      <div className="absolute -bottom-5 -left-4 rounded-2xl border border-white/70 bg-white px-4 py-3 shadow-md sm:-left-7"><p className="text-xs font-semibold text-slate-900">A better campus starts here</p><p className="mt-0.5 text-[11px] text-slate-500">One community at a time</p></div>
    </div>
  );
}

export default function LandingPage() {
  return (
    <main>
      <section className="overflow-hidden bg-navy text-white">
        <div className="mx-auto grid max-w-7xl items-center gap-16 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-[1.05fr_0.95fr] lg:px-8 lg:py-24">
          <div className="relative z-10 max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-indigo-300/20 bg-indigo-400/10 px-3 py-1.5 text-xs font-semibold text-indigo-200"><span className="h-1.5 w-1.5 rounded-full bg-amber-400" />Made for campus communities</span>
            <h1 className="mt-6 text-4xl font-bold leading-[1.08] tracking-tight sm:text-5xl lg:text-[3.7rem]">Find your people.<br /><span className="text-indigo-300">Make campus yours.</span></h1>
            <p className="mt-6 max-w-xl text-base leading-7 text-slate-300 sm:text-lg">A calmer home for the clubs, events, and communities that make student life meaningful.</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link to="/register" className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-control bg-brand px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-dark focus-visible:ring-2 focus-visible:ring-white sm:w-auto">Create your account<ArrowRight aria-hidden="true" className="h-4 w-4" /></Link>
              <a href="#clubs" className="inline-flex min-h-12 items-center justify-center rounded-control border border-white/20 px-5 text-sm font-semibold text-white transition hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-white">Explore the platform</a>
            </div>
            <p className="mt-5 text-xs text-slate-400">One account. A more connected campus.</p>
          </div>
          <div className="px-2 py-3 sm:px-8 lg:px-0"><PreviewCard /></div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-4 md:grid-cols-3">
          {benefits.map(({ icon: Icon, title, text }) => <Card key={title} className="flex gap-4 p-5 transition duration-180 hover:shadow-md motion-reduce:transition-none"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-indigo-50 text-brand"><Icon aria-hidden="true" className="h-5 w-5" /></span><div><h2 className="text-sm font-bold text-slate-900">{title}</h2><p className="mt-1.5 text-sm leading-6 text-slate-500">{text}</p></div></Card>)}
        </div>
      </section>

      <section id="clubs" className="scroll-mt-24 bg-page px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-7"><p className="text-xs font-bold uppercase tracking-[0.16em] text-brand">Explore</p><h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Discover clubs</h2><p className="mt-2 text-sm text-slate-500 sm:text-base">There’s a place for every curiosity.</p></div>
          <EmptyState icon={Compass} title="Club discovery is on its way" description="Club listings will appear here as the campus directory comes online." />
        </div>
      </section>

      <section id="events" className="scroll-mt-24 bg-white px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-7"><p className="text-xs font-bold uppercase tracking-[0.16em] text-brand">What’s happening</p><h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Upcoming events</h2><p className="mt-2 text-sm text-slate-500 sm:text-base">Keep your next campus moment close.</p></div>
          <EmptyState icon={CalendarDays} title="Events will show up here" description="The event calendar is being prepared. Check back when clubs can share their plans." />
        </div>
      </section>
      <section className="bg-brand px-4 py-12 text-white sm:px-6 lg:px-8"><div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-5 sm:flex-row sm:items-center"><div><h2 className="text-xl font-bold">Your campus story starts with a community.</h2><p className="mt-1 text-sm text-indigo-100">Create your account and make yourself at home.</p></div><Link to="/register" className="inline-flex min-h-11 items-center gap-2 rounded-control bg-white px-4 text-sm font-semibold text-brand transition hover:bg-indigo-50">Join Campus Club<ArrowRight aria-hidden="true" className="h-4 w-4" /></Link></div></section>
    </main>
  );
}
