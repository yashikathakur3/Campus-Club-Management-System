import { Inbox } from 'lucide-react';
import Card from './Card';

export default function EmptyState({ title, description, icon: Icon = Inbox, action, className = '' }) {
  return (
    <Card className={`flex min-h-52 flex-col items-center justify-center text-center ${className}`}>
      <span className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-brand"><Icon aria-hidden="true" className="h-6 w-6" /></span>
      <h3 className="text-base font-semibold text-slate-900">{title}</h3>
      {description && <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </Card>
  );
}
