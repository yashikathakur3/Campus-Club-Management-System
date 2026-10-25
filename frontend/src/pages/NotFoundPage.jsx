import { Compass, MoveLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-page px-4 py-12">
      <div className="max-w-md text-center">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-indigo-50 text-brand"><Compass aria-hidden="true" className="h-7 w-7" /></span>
        <p className="mt-6 text-xs font-bold uppercase tracking-[0.16em] text-brand">404 · Lost on campus?</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">We can’t find that page.</h1>
        <p className="mt-3 text-sm leading-6 text-slate-500">The address may have changed, or the page may not exist.</p>
        <Link to="/" className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-control bg-brand px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-dark"><MoveLeft aria-hidden="true" className="h-4 w-4" />Back to home</Link>
      </div>
    </main>
  );
}
