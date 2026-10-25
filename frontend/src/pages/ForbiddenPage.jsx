import { ShieldAlert } from 'lucide-react';
import { Link } from 'react-router-dom';
import Card from '../components/ui/Card';

export default function ForbiddenPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-page px-4 py-12">
      <Card className="w-full max-w-md text-center">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-rose-50 text-danger"><ShieldAlert aria-hidden="true" className="h-7 w-7" /></span>
        <p className="mt-5 text-xs font-bold uppercase tracking-[0.16em] text-danger">403 · Forbidden</p>
        <h1 className="mt-2 text-2xl font-bold text-slate-900">This space isn’t available to you</h1>
        <p className="mt-3 text-sm leading-6 text-slate-500">Your account doesn’t have access to this page.</p>
        <Link to="/app/dashboard" className="mt-6 inline-flex min-h-11 items-center justify-center rounded-control bg-brand px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-dark focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2">Back to dashboard</Link>
      </Card>
    </main>
  );
}
