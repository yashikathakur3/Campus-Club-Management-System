import Card from './Card';

export default function StatCard({ label, value, caption, icon: Icon }) {
  return (
    <Card className="flex items-start justify-between gap-4">
      <div>
        <p className="text-sm font-medium text-slate-500">{label}</p>
        <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">{value}</p>
        {caption && <p className="mt-1 text-xs text-slate-500">{caption}</p>}
      </div>
      {Icon && <span className="rounded-xl bg-indigo-50 p-3 text-brand"><Icon aria-hidden="true" className="h-5 w-5" /></span>}
    </Card>
  );
}
