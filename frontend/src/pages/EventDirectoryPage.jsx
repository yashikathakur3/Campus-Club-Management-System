import { useCallback, useEffect, useState } from 'react';
import { SearchX } from 'lucide-react';
import { listEvents } from '../api/events';
import { listClubs } from '../api/clubs';
import EventCard from '../components/events/EventCard';
import Button from '../components/ui/Button';
import EmptyState from '../components/ui/EmptyState';
import Pagination from '../components/ui/Pagination';
import SearchInput from '../components/ui/SearchInput';
import Select from '../components/ui/Select';
import Skeleton from '../components/ui/Skeleton';

const categories = ['workshop', 'competition', 'social', 'meeting', 'talk', 'other'];
export default function EventDirectoryPage() {
  const [events, setEvents] = useState([]); const [clubs, setClubs] = useState([]); const [page, setPage] = useState(1); const [q, setQ] = useState('');
  const [category, setCategory] = useState(''); const [clubId, setClubId] = useState(''); const [when, setWhen] = useState('upcoming'); const [available, setAvailable] = useState(false);
  const [from, setFrom] = useState(''); const [to, setTo] = useState(''); const [meta, setMeta] = useState({ totalPages: 1 }); const [loading, setLoading] = useState(true); const [error, setError] = useState(''); const [retry, setRetry] = useState(0); const [searchKey, setSearchKey] = useState(0);
  const search = useCallback((value) => { setQ(value); setPage(1); }, []);
  useEffect(() => { listClubs({ page: 1, limit: 50, sort: 'name', order: 'asc' }).then((r) => setClubs(r.data)).catch(() => {}); }, []);
  useEffect(() => { let active = true; setLoading(true); setError(''); listEvents({ page, limit: 9, q: q || undefined, category: category || undefined, clubId: clubId || undefined, when, available: available ? 'true' : undefined, from: from ? `${from}T00:00:00.000Z` : undefined, to: to ? `${to}T23:59:59.999Z` : undefined })
    .then((result) => { if (active) { setEvents(result.data); setMeta(result.meta); } }).catch((failure) => { if (active) setError(failure.message || 'Could not load events.'); }).finally(() => { if (active) setLoading(false); }); return () => { active = false; };
  }, [page, q, category, clubId, when, available, from, to, retry]);
  function clear() { setQ(''); setSearchKey((v) => v + 1); setCategory(''); setClubId(''); setWhen('upcoming'); setAvailable(false); setFrom(''); setTo(''); setPage(1); }
  return <main className="bg-page pb-12"><section className="bg-gradient-to-br from-navy via-[#25265f] to-brand px-4 py-12 text-white sm:px-6"><div className="mx-auto max-w-7xl"><p className="text-xs font-bold uppercase tracking-[0.18em] text-indigo-200">Make a plan</p><h1 className="mt-3 text-3xl font-bold sm:text-4xl">Campus events</h1><p className="mt-3 max-w-2xl text-sm text-slate-200">Find workshops, meetups, and moments hosted by campus clubs.</p></div></section>
    <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8"><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><SearchInput key={searchKey} label="Search events" placeholder="Title or description" onSearchChange={search} /><Select label="Category" value={category} onChange={(e) => { setCategory(e.target.value); setPage(1); }}><option value="">All categories</option>{categories.map((item) => <option key={item} value={item}>{item.replace('_', ' ')}</option>)}</Select><Select label="Club" value={clubId} onChange={(e) => { setClubId(e.target.value); setPage(1); }}><option value="">All clubs</option>{clubs.map((club) => <option key={club._id} value={club._id}>{club.name}</option>)}</Select><Select label="Date" value={when} onChange={(e) => { setWhen(e.target.value); setPage(1); }}><option value="upcoming">Upcoming</option><option value="past">Past</option></Select></div>
      <div className="mt-4 flex flex-wrap items-end gap-4"><label className="flex min-h-11 items-center gap-2 text-sm font-medium text-slate-700"><input type="checkbox" checked={available} onChange={(e) => { setAvailable(e.target.checked); setPage(1); }} className="h-4 w-4 rounded border-slate-300 text-brand focus:ring-brand" />Has spots</label><InputDate label="From" value={from} onChange={(v) => { setFrom(v); setPage(1); }} /><InputDate label="To" value={to} onChange={(v) => { setTo(v); setPage(1); }} /><Button variant="ghost" onClick={clear}>Clear filters</Button></div>
      {loading ? <div className="mt-7 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{Array.from({ length: 6 }, (_, i) => <Skeleton key={i} className="h-80" />)}</div> : error ? <div className="mt-7 rounded-card bg-white p-8 text-center"><p role="alert" className="text-danger">{error}</p><Button variant="secondary" className="mt-4" onClick={() => setRetry((v) => v + 1)}>Retry</Button></div> : events.length ? <><div className="mt-7 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{events.map((event) => <EventCard key={event._id} event={event} />)}</div><div className="mt-7"><Pagination page={page} totalPages={meta.totalPages || 1} onPageChange={setPage} label="events" /></div></> : <div className="mt-7"><EmptyState icon={SearchX} title="No events found" description="Adjust your search or filters to discover more campus events." action={<Button variant="secondary" onClick={clear}>Clear filters</Button>} /></div>}</section></main>;
}

function InputDate({ label, value, onChange }) { return <label className="grid gap-1 text-sm font-medium text-slate-700">{label}<input type="date" value={value} onChange={(e) => onChange(e.target.value)} className="min-h-11 rounded-control border border-slate-200 bg-white px-3 text-sm" /></label>; }
