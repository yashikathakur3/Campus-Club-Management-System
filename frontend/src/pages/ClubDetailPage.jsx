import { useCallback, useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { CalendarDays, Globe2, Instagram, Mail, UsersRound } from 'lucide-react';
import { getClub, joinClub, leaveClub } from '../api/clubs';
import { useAuth } from '../context/AuthContext';
import Avatar from '../components/ui/Avatar';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import EmptyState from '../components/ui/EmptyState';
import Skeleton from '../components/ui/Skeleton';

const categoryNames = { technical: 'Technical', cultural: 'Cultural', sports: 'Sports', academic: 'Academic', social_service: 'Social service', arts: 'Arts', other: 'Other' };

export default function ClubDetailPage() {
  const { id } = useParams();
  const { user, refreshMe } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [busy, setBusy] = useState(false);
  const canManage = user?.role === 'super_admin' || data?.myMembership?.clubRole === 'president' && data?.myMembership?.status === 'active';

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try { setData(await getClub(id)); }
    catch (requestError) { setError(requestError.message || 'Could not load this club.'); }
    finally { setLoading(false); }
  }, [id]);
  useEffect(() => { load(); }, [load]);

  async function handleJoin() {
    if (!user) { navigate('/login', { state: { from: { pathname: location.pathname } } }); return; }
    setBusy(true);
    try {
      await joinClub(id, '');
      await refreshMe(); await load();
      toast.success('Your membership was updated.');
    } catch (requestError) { toast.error(requestError.message || 'Could not join this club.'); }
    finally { setBusy(false); }
  }
  async function handleLeave() {
    setBusy(true);
    try {
      await leaveClub(id); await refreshMe(); await load();
      toast.success('You left this club.');
    } catch (requestError) { toast.error(requestError.message || 'Could not leave this club.'); }
    finally { setBusy(false); setConfirmLeave(false); }
  }

  if (loading) return <main className="mx-auto max-w-6xl space-y-5 px-4 py-8"><Skeleton className="h-64 w-full" /><Skeleton className="h-72 w-full" /></main>;
  if (error || !data) return <main className="mx-auto max-w-3xl px-4 py-12"><Card className="text-center"><p role="alert" className="text-danger">{error || 'Club not found.'}</p><Button variant="secondary" className="mt-4" onClick={load}>Try again</Button></Card></main>;

  const { club, president, coordinators, membersPreview, myMembership } = data;
  const canLeave = myMembership?.status === 'active' && myMembership.clubRole !== 'president';
  const joinLabel = myMembership?.status === 'pending' ? 'Request pending' : myMembership?.status === 'active' ? 'You’re a member' : club.joinPolicy === 'open' ? 'Join club' : 'Request to join';
  const social = Object.entries(club.socialLinks || {}).filter(([, value]) => Boolean(value));

  return <main className="bg-page pb-12">
    <div className="relative h-56 bg-gradient-to-br from-navy via-brand to-sky-500 sm:h-72">{club.bannerUrl && <img src={club.bannerUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />}</div>
    <div className="mx-auto -mt-12 max-w-6xl px-4 sm:px-6 lg:px-8">
      <Card className="relative"><div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex min-w-0 items-end gap-4"><Avatar name={club.name} src={club.logoUrl} size="lg" className="h-20 w-20 rounded-2xl bg-white text-2xl" /><div className="min-w-0 pb-1"><div className="flex flex-wrap items-center gap-2"><h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">{club.name}</h1><Badge variant="primary">{categoryNames[club.category]}</Badge></div><p className="mt-1 flex items-center gap-1.5 text-sm text-slate-500"><UsersRound aria-hidden="true" className="h-4 w-4" />{club.memberCount} members · {club.joinPolicy === 'open' ? 'Open membership' : 'Approval required'}</p></div></div>
        <div className="flex flex-wrap gap-2">{canManage && <><Link to={`/app/clubs/${club.slug}/manage`}><Button variant="secondary">Manage club</Button></Link><Link to={`/app/clubs/${club.slug}/edit`}><Button variant="secondary">Edit details</Button></Link></>}
          {myMembership?.status === 'pending' ? <Button disabled variant="secondary">Request pending</Button> : myMembership?.status === 'active' ? canLeave && <Button variant="danger" loading={busy} onClick={() => setConfirmLeave(true)}>Leave club</Button> : <Button loading={busy} onClick={handleJoin}>{joinLabel}</Button>}
        </div>
      </div>
        {club.description && <p className="mt-6 max-w-4xl whitespace-pre-line text-sm leading-7 text-slate-600">{club.description}</p>}
        <div className="mt-5 flex flex-wrap gap-4 text-sm">{club.contactEmail && <a className="inline-flex items-center gap-2 font-medium text-brand hover:underline" href={`mailto:${club.contactEmail}`}><Mail aria-hidden="true" className="h-4 w-4" />{club.contactEmail}</a>}{social.map(([key, value]) => <a key={key} href={value} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 font-medium capitalize text-brand hover:underline"><Globe2 aria-hidden="true" className="h-4 w-4" />{key}</a>)}</div>
      </Card>
      <div className="mt-6 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-6">
          <Card><h2 className="text-lg font-bold text-slate-900">Club leadership</h2><div className="mt-4 grid gap-3 sm:grid-cols-2">{president ? <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-3"><Avatar name={president.name} src={president.avatarUrl} size="md" /><div><p className="text-sm font-semibold text-slate-900">{president.name}</p><p className="text-xs text-slate-500">President</p></div></div> : <p className="text-sm text-slate-500">No president listed.</p>}{coordinators.map((person) => <div key={person._id} className="flex items-center gap-3 rounded-xl bg-slate-50 p-3"><Avatar name={person.name} src={person.avatarUrl} size="md" /><div><p className="text-sm font-semibold text-slate-900">{person.name}</p><p className="text-xs text-slate-500">Coordinator</p></div></div>)}</div></Card>
          <Card><h2 className="text-lg font-bold text-slate-900">Members</h2>{membersPreview ? membersPreview.length ? <div className="mt-4 flex flex-wrap gap-2">{membersPreview.map((person) => <span key={person._id} title={person.name}><Avatar name={person.name} src={person.avatarUrl} size="md" /></span>)}</div> : <p className="mt-2 text-sm text-slate-500">There are no other members to show yet.</p> : <p className="mt-2 text-sm text-slate-500">Join this club to see member profiles. There are {club.memberCount} members.</p>}</Card>
          <Card><h2 className="text-lg font-bold text-slate-900">Upcoming events</h2><div className="mt-4"><EmptyState icon={CalendarDays} title="No events yet" description="Events for this club will appear here when they are published." /></div></Card>
        </div>
        <Card className="h-fit"><h2 className="text-lg font-bold text-slate-900">Membership</h2><p className="mt-2 text-sm leading-6 text-slate-500">{club.joinPolicy === 'open' ? 'Join instantly and start taking part.' : 'Send a request and club leadership will review it.'}</p><p className="mt-4 text-sm text-slate-600">{club.memberCount} active members</p>{!user && <Link to="/login" state={{ from: { pathname: location.pathname } }} className="mt-4 inline-flex text-sm font-semibold text-brand">Log in to join</Link>}</Card>
      </div>
    </div>
    <ConfirmDialog open={confirmLeave} onClose={() => setConfirmLeave(false)} onConfirm={handleLeave} title="Leave this club?" description={`You will no longer be listed as a member of ${club.name}.`} confirmLabel="Leave club" />
  </main>;
}
