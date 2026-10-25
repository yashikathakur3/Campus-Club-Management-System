import { CalendarDays, MapPin } from 'lucide-react';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import Badge from '../ui/Badge';
import Card from '../ui/Card';

export default function EventCard({ event }) {
  const date = new Date(event.startsAt);
  const remaining = event.spotsLeft ?? Math.max(0, event.capacity - event.registeredCount);
  const low = remaining <= Math.ceil(event.capacity * 0.2);
  return <Card className="overflow-hidden p-0 transition hover:-translate-y-0.5 hover:shadow-md">
    <Link to={`/events/${event._id}`} className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand">
      <div className="relative h-40 bg-gradient-to-br from-navy via-brand to-sky-500">{event.posterUrl && <img src={event.posterUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />}<div className="absolute left-4 top-4 grid h-14 w-14 place-items-center rounded-xl bg-white text-center shadow"><span><strong className="block text-xl leading-5 text-slate-900">{format(date, 'd')}</strong><small className="text-[10px] font-bold uppercase tracking-wider text-brand">{format(date, 'MMM')}</small></span></div></div>
      <div className="p-5"><div className="flex flex-wrap items-center justify-between gap-2"><Badge variant="primary">{event.category?.replace('_', ' ')}</Badge><Badge variant={remaining ? (low ? 'warning' : 'success') : 'danger'}>{remaining ? `${remaining} spots left` : 'Full'}</Badge></div><h2 className="mt-3 line-clamp-2 text-lg font-bold text-slate-900">{event.title}</h2><p className="mt-1 flex items-center gap-1.5 text-sm text-slate-500"><CalendarDays className="h-4 w-4 shrink-0" />{format(date, 'EEE, MMM d · h:mm a')}</p><p className="mt-1 flex items-center gap-1.5 text-sm text-slate-500"><MapPin className="h-4 w-4 shrink-0" /><span className="truncate">{event.location}</span></p><p className="mt-3 truncate text-xs font-semibold text-brand">{event.club?.name || 'Campus club'}</p><div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100"><div className={`h-full ${low ? 'bg-amber-500' : 'bg-brand'}`} style={{ width: `${Math.min(100, Math.round(event.registeredCount / event.capacity * 100))}%` }} /></div></div>
    </Link>
  </Card>;
}
