import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { listEventRegistrations } from '../api/events';
import Avatar from '../components/ui/Avatar';
import Card from '../components/ui/Card';
import EmptyState from '../components/ui/EmptyState';
import PageHeader from '../components/ui/PageHeader';
import Pagination from '../components/ui/Pagination';
import SearchInput from '../components/ui/SearchInput';
import Skeleton from '../components/ui/Skeleton';

export default function EventRegistrationsPage() {
  const { id } = useParams(); const [rows, setRows] = useState([]); const [summary, setSummary] = useState(null); const [meta, setMeta] = useState({ totalPages: 1 }); const [page, setPage] = useState(1); const [q, setQ] = useState(''); const [loading, setLoading] = useState(true); const [error, setError] = useState('');
  const load = useCallback(async () => { setLoading(true); setError(''); try { const result = await listEventRegistrations(id, { page, limit: 20, q: q || undefined }); setRows(result.data); setMeta(result.meta); setSummary(result.meta.summary); } catch (failure) { setError(failure.message || 'Could not load attendees.'); } finally { setLoading(false); } }, [id, page, q]);
  useEffect(() => { load(); }, [load]);
  const search = useCallback((value) => { setQ(value); setPage(1); }, []);
  return <div><PageHeader eyebrow="Event management" title="Attendees" description="Students currently registered for this event." />{summary && <Card className="mb-5 flex flex-wrap items-center justify-between gap-3"><span className="text-sm text-slate-600">{summary.registeredCount} registered · {summary.capacity} capacity</span><span className="text-sm font-semibold text-brand">{summary.spotsLeft} spots left</span></Card>}<SearchInput label="Search attendees" placeholder="Name, email, or student ID" onSearchChange={search} />
    {loading ? <div className="mt-5 space-y-3">{[0, 1, 2].map((n) => <Skeleton key={n} className="h-16" />)}</div> : error ? <Card className="mt-5"><p role="alert" className="text-danger">{error}</p><button onClick={load} className="mt-3 font-semibold text-brand">Retry</button></Card> : rows.length ? <Card className="mt-5 p-0"><ul className="divide-y divide-slate-100">{rows.map((row) => <li key={row._id} className="flex items-center gap-3 p-4"><Avatar name={row.user?.name} src={row.user?.avatarUrl} size="md" /><div className="min-w-0"><p className="truncate text-sm font-semibold text-slate-900">{row.user?.name}</p><p className="truncate text-xs text-slate-500">{row.user?.email}{row.user?.studentId ? ` · ${row.user.studentId}` : ''}</p></div></li>)}</ul></Card> : <EmptyState className="mt-5" title="No attendees found" description={q ? 'Try a different attendee search.' : 'Registrations will appear here when students reserve their spots.'} />}
    <div className="mt-5"><Pagination page={page} totalPages={meta.totalPages || 1} onPageChange={setPage} label="attendees" /></div>
  </div>;
}
