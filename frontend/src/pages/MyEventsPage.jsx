import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import { CalendarDays } from 'lucide-react';
import { listMyRegistrations, unregisterFromEvent } from '../api/events';
import EventCard from '../components/events/EventCard';
import Button from '../components/ui/Button';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import EmptyState from '../components/ui/EmptyState';
import PageHeader from '../components/ui/PageHeader';
import Skeleton from '../components/ui/Skeleton';
import Tabs from '../components/ui/Tabs';

export default function MyEventsPage() {
  const [tab, setTab] = useState('upcoming'); const [items, setItems] = useState([]); const [loading, setLoading] = useState(true); const [error, setError] = useState(''); const [cancelTarget, setCancelTarget] = useState(null); const [busy, setBusy] = useState(false); const [refresh, setRefresh] = useState(0);
  useEffect(() => { let active = true; setLoading(true); setError(''); const status = tab === 'cancelled' ? 'cancelled' : 'registered'; const when = tab === 'cancelled' ? undefined : tab;
    listMyRegistrations({ page: 1, limit: 50, status, when }).then((result) => { if (active) setItems(result.data); }).catch((failure) => { if (active) { setError(failure.message || 'Could not load your events.'); toast.error(failure.message || 'Could not load your events.'); } }).finally(() => { if (active) setLoading(false); }); return () => { active = false; };
  }, [tab, refresh]);
  async function cancel() { if (!cancelTarget) return; setBusy(true); try { await unregisterFromEvent(cancelTarget.event._id); toast.success('Registration cancelled.'); setRefresh((v) => v + 1); } catch (failure) { toast.error(failure.message || 'Could not unregister.'); } finally { setBusy(false); setCancelTarget(null); } }
  const tabs = ['upcoming', 'past', 'cancelled'].map((id) => ({ id, label: id[0].toUpperCase() + id.slice(1), content: null }));
  return <div><PageHeader eyebrow="Your schedule" title="My events" description="Events you registered for, past or upcoming." /><Tabs tabs={tabs} value={tab} onChange={setTab} label="My event views" />
    {loading ? <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{[0, 1, 2].map((n) => <Skeleton key={n} className="h-80" />)}</div> : error ? <div className="mt-6 rounded-xl bg-white p-8 text-center"><p role="alert" className="text-danger">{error}</p><Button variant="secondary" className="mt-3" onClick={() => setRefresh((v) => v + 1)}>Retry</Button></div> : items.length ? <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{items.map((registration) => <div key={registration._id}><EventCard event={registration.event} /><div className="mt-2 flex items-center justify-between px-2"><span className="text-xs capitalize text-slate-500">{registration.status}</span>{tab === 'upcoming' && <Button variant="ghost" size="sm" onClick={() => setCancelTarget(registration)}>Unregister</Button>}</div></div>)}</div> : <div className="mt-6"><EmptyState icon={CalendarDays} title={tab === 'upcoming' ? 'No upcoming registrations' : tab === 'past' ? 'No past events yet' : 'No cancelled registrations'} description={tab === 'upcoming' ? 'Explore campus events and reserve your spot.' : 'Your event history will show here.'} action={<Link to="/events" className="font-semibold text-brand">Explore events</Link>} /></div>}
    <ConfirmDialog open={Boolean(cancelTarget)} onClose={() => setCancelTarget(null)} onConfirm={cancel} title="Unregister from this event?" description="Your spot will be released." confirmLabel="Unregister" />
  </div>;
}
