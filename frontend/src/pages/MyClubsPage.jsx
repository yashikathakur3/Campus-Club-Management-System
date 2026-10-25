import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import { listMyMemberships } from '../api/clubs';
import ClubCard from '../components/clubs/ClubCard';
import EmptyState from '../components/ui/EmptyState';
import PageHeader from '../components/ui/PageHeader';
import Skeleton from '../components/ui/Skeleton';
import { useAuth } from '../context/AuthContext';

export default function MyClubsPage() {
  const { memberships } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const load = useCallback(async () => {
    setLoading(true); setError('');
    try { setItems(await listMyMemberships()); }
    catch (requestError) { setError(requestError.message || 'Could not load your clubs.'); toast.error(requestError.message || 'Could not load your clubs.'); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);
  const membershipFor = (clubId) => memberships?.find((item) => item.club?._id === clubId);
  return <div><PageHeader eyebrow="Your workspace" title="My clubs" description="Your active memberships and requests in one place." />
    {loading ? <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{Array.from({ length: 3 }, (_, i) => <Skeleton key={i} className="h-80" />)}</div>
      : error ? <div className="rounded-xl bg-white p-8 text-center"><p role="alert" className="text-sm text-danger">{error}</p><button className="mt-4 font-semibold text-brand" onClick={load}>Retry</button></div>
        : items.length ? <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{items.map((item) => <div key={item.club._id}><ClubCard club={item.club} membership={item} /><p className="mt-2 px-2 text-xs capitalize text-slate-500">{item.status} · {item.clubRole}</p></div>)}</div>
          : <EmptyState title="You haven’t joined a club yet" description="Browse the directory to find a community that fits you." action={<Link to="/clubs" className="font-semibold text-brand">Explore clubs</Link>} />}
  </div>;
}
