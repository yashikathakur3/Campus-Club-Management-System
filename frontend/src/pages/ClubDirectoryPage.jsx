import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import { ArrowRight, SearchX } from 'lucide-react';
import { listClubs } from '../api/clubs';
import { useAuth } from '../context/AuthContext';
import ClubCard from '../components/clubs/ClubCard';
import Button from '../components/ui/Button';
import EmptyState from '../components/ui/EmptyState';
import Pagination from '../components/ui/Pagination';
import SearchInput from '../components/ui/SearchInput';
import Select from '../components/ui/Select';
import Skeleton from '../components/ui/Skeleton';

const categories = [
  ['all', 'All clubs'], ['technical', 'Technical'], ['cultural', 'Cultural'], ['sports', 'Sports'],
  ['academic', 'Academic'], ['social_service', 'Social service'], ['arts', 'Arts'], ['other', 'Other'],
];

export default function ClubDirectoryPage() {
  const { memberships, user } = useAuth();
  const [clubs, setClubs] = useState([]);
  const [meta, setMeta] = useState({ page: 1, totalPages: 1, total: 0 });
  const [page, setPage] = useState(1);
  const [q, setQ] = useState('');
  const [category, setCategory] = useState('all');
  const [sort, setSort] = useState('name');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reload, setReload] = useState(0);
  const [searchKey, setSearchKey] = useState(0);
  const search = useCallback((value) => { setQ(value); setPage(1); }, []);

  useEffect(() => { let active = true; setLoading(true); setError(''); listClubs({ page, limit: 9, q: q || undefined, category: category === 'all' ? undefined : category, sort, order: sort === 'name' ? 'asc' : 'desc' })
    .then((response) => { if (active) { setClubs(response.data); setMeta(response.meta); } })
    .catch((requestError) => { if (active) { setError(requestError.message || 'Could not load clubs.'); toast.error(requestError.message || 'Could not load clubs.'); } })
    .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [page, q, category, sort, reload]);

  const membershipFor = (clubId) => memberships?.find((item) => item.club?._id === clubId);
  function clearFilters() { setQ(''); setSearchKey((value) => value + 1); setCategory('all'); setSort('name'); setPage(1); }

  return <main className="bg-page pb-12">
    <section className="bg-gradient-to-br from-navy via-[#25265f] to-brand px-4 py-12 text-white sm:px-6 sm:py-16">
      <div className="mx-auto max-w-7xl"><p className="text-xs font-bold uppercase tracking-[0.18em] text-indigo-200">Find your people</p><h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Campus clubs, all in one place.</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-slate-200 sm:text-base">Discover communities to learn, create, compete, and make campus feel smaller.</p>
        {user && <Link to="/app/clubs/mine" className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-white hover:text-indigo-200">See my clubs<ArrowRight aria-hidden="true" className="h-4 w-4" /></Link>}
      </div>
    </section>
    <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"><SearchInput key={searchKey} label="Search clubs" placeholder="Search clubs" onSearchChange={search} /><div className="w-full sm:max-w-xs"><Select label="Sort clubs" value={sort} onChange={(event) => { setSort(event.target.value); setPage(1); }}><option value="name">Name</option><option value="createdAt">Recently added</option><option value="memberCount">Most members</option></Select></div></div>
      <div className="mt-5 flex gap-2 overflow-x-auto pb-2" aria-label="Filter by club category">{categories.map(([value, label]) => <button key={value} type="button" aria-pressed={category === value} onClick={() => { setCategory(value); setPage(1); }} className={`shrink-0 rounded-full border px-4 py-2 text-sm font-semibold transition ${category === value ? 'border-brand bg-brand text-white' : 'border-slate-200 bg-white text-slate-600 hover:border-brand/40 hover:text-brand'}`}>{label}</button>)}</div>
      {loading ? <div className="mt-7 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{Array.from({ length: 6 }, (_, i) => <Skeleton key={i} className="h-80" />)}</div>
        : error ? <div className="mt-7 rounded-card border border-rose-200 bg-white p-8 text-center"><p role="alert" className="text-sm text-danger">{error}</p><Button variant="secondary" className="mt-4" onClick={() => setReload((value) => value + 1)}>Retry</Button></div>
          : clubs.length ? <><div className="mt-7 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{clubs.map((club) => <ClubCard key={club._id} club={club} membership={membershipFor(club._id)} />)}</div><div className="mt-7"><Pagination page={page} totalPages={meta.totalPages || 1} onPageChange={setPage} label="clubs" /></div></>
            : <div className="mt-7"><EmptyState icon={SearchX} title="No clubs match those filters" description="Try another search or clear the category filters to see all active clubs." action={<Button variant="secondary" onClick={clearFilters}>Clear filters</Button>} /></div>}
    </section>
  </main>;
}
