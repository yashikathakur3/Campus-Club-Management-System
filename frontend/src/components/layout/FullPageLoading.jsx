import { LoaderCircle } from 'lucide-react';

export default function FullPageLoading() {
  return (
    <main className="grid min-h-screen place-items-center bg-slate-50 px-5" aria-live="polite" aria-busy="true">
      <div className="flex items-center gap-3 text-sm font-medium text-slate-600">
        <LoaderCircle aria-hidden="true" className="h-5 w-5 animate-spin text-brand motion-reduce:animate-none" />
        Loading your campus space…
      </div>
    </main>
  );
}
