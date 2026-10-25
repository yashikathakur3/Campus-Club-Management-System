import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { getClub, listClubMembers, setClubStatus, transferPresidency, updateClubMember } from '../api/clubs';
import { useAuth } from '../context/AuthContext';
import Avatar from '../components/ui/Avatar';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import EmptyState from '../components/ui/EmptyState';
import Input from '../components/ui/Input';
import PageHeader from '../components/ui/PageHeader';
import Select from '../components/ui/Select';
import Skeleton from '../components/ui/Skeleton';
import Tabs from '../components/ui/Tabs';

export default function ManageClubPage() {
  const { id } = useParams();
  const { user, refreshMe } = useAuth();
  const isAdmin = user?.role === 'super_admin';
  const [clubData, setClubData] = useState(null);
  const [members, setMembers] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('members');
  const [pending, setPending] = useState(null);
  const [successor, setSuccessor] = useState('');
  const [transferInputError, setTransferInputError] = useState('');

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const [details, activeResult, requestResult] = await Promise.all([
        getClub(id), listClubMembers(id, { status: 'active', page: 1, limit: 50 }), listClubMembers(id, { status: 'pending', page: 1, limit: 50 }),
      ]);
      setClubData(details); setMembers(activeResult.data); setRequests(requestResult.data);
    } catch (requestError) { setError(requestError.message || 'Could not load club management.'); }
    finally { setLoading(false); }
  }, [id]);
  useEffect(() => { load(); }, [load]);

  async function updateMembership(target, changes, message) {
    await updateClubMember(id, target.user._id, changes);
    toast.success(message); await load(); await refreshMe();
  }
  function confirmAction(title, description, run, confirmLabel = 'Confirm') { setPending({ title, description, run, confirmLabel }); }
  async function executePending() {
    try { await pending.run(); }
    catch (requestError) { toast.error(requestError.message || 'Could not complete this action.'); }
    finally { setPending(null); }
  }
  async function transfer() {
    if (!successor) { setTransferInputError('Choose an active club member first.'); return; }
    const selected = members.find((item) => item.user._id === successor);
    confirmAction('Transfer presidency?', `Presidency will move to ${selected?.user.name || 'the selected member'}. You will become a coordinator.`, async () => {
      await transferPresidency(id, successor); await refreshMe(); toast.success('Presidency transferred.'); await load();
    }, 'Transfer presidency');
  }
  async function toggleClubStatus() {
    const next = !clubData.club.isActive;
    confirmAction(`${next ? 'Activate' : 'Deactivate'} this club?`, `${clubData.club.name} will ${next ? 'appear in' : 'be hidden from'} the public directory. Memberships will be preserved.`, async () => {
      await setClubStatus(id, next); toast.success(`Club ${next ? 'activated' : 'deactivated'}.`); await load();
    }, next ? 'Activate club' : 'Deactivate club');
  }

  if (loading) return <div className="space-y-4"><Skeleton className="h-16 w-64" /><Skeleton className="h-96 w-full" /></div>;
  if (error || !clubData) return <Card><p role="alert" className="text-sm text-danger">{error || 'Club could not be loaded.'}</p><Button className="mt-4" variant="secondary" onClick={load}>Retry</Button></Card>;

  const club = clubData.club;
  const memberPanel = members.length ? <div className="space-y-3">{members.map((item) => <Card key={item._id} padding="p-4"><div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-center gap-3"><Avatar name={item.user.name} src={item.user.avatarUrl} size="md" /><div><p className="font-semibold text-slate-900">{item.user.name}</p><p className="text-xs text-slate-500">{item.user.email}</p></div></div><div className="flex flex-wrap items-center gap-2"><Badge variant={item.clubRole === 'coordinator' ? 'primary' : 'neutral'}>{item.clubRole}</Badge>{item.clubRole !== 'president' && <><Button size="sm" variant="secondary" onClick={() => updateMembership(item, { clubRole: item.clubRole === 'coordinator' ? 'member' : 'coordinator' }, 'Member role updated.')}>{item.clubRole === 'coordinator' ? 'Make member' : 'Make coordinator'}</Button><Button size="sm" variant={item.canAnnounce ? 'secondary' : 'ghost'} onClick={() => updateMembership(item, { canAnnounce: !item.canAnnounce }, 'Announcement permission updated.')}>{item.canAnnounce ? 'Can announce' : 'Allow announcements'}</Button><Button size="sm" variant="danger" onClick={() => confirmAction('Remove this member?', `${item.user.name} will lose active membership in ${club.name}.`, () => updateMembership(item, { status: 'removed' }, 'Member removed.'), 'Remove member')}>Remove</Button></>}</div></div></Card>)}</div> : <EmptyState title="No active members yet" description="Approved members will appear here." />;
  const requestPanel = requests.length ? <div className="space-y-3">{requests.map((item) => <Card key={item._id} padding="p-4"><div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-center gap-3"><Avatar name={item.user.name} src={item.user.avatarUrl} size="md" /><div><p className="font-semibold text-slate-900">{item.user.name}</p><p className="text-xs text-slate-500">{item.user.email}</p>{item.message && <p className="mt-2 text-sm text-slate-600">{item.message}</p>}</div></div><div className="flex gap-2"><Button size="sm" onClick={() => updateMembership(item, { status: 'active' }, 'Join request approved.')}>Approve</Button><Button size="sm" variant="danger" onClick={() => confirmAction('Reject this request?', `${item.user.name} will be notified that the request was declined.`, () => updateMembership(item, { status: 'rejected' }, 'Join request rejected.'), 'Reject request')}>Reject</Button></div></div></Card>)}</div> : <EmptyState title="No pending requests" description="New requests will show up here for review." />;

  return <div><PageHeader eyebrow="Club management" title={club.name} description="Manage membership, leadership, and club access." action={isAdmin && <Button variant={club.isActive ? 'danger' : 'primary'} onClick={toggleClubStatus}>{club.isActive ? 'Deactivate club' : 'Activate club'}</Button>} />
    {!club.isActive && <p className="mb-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">This club is inactive. Existing memberships remain saved, but new members cannot join.</p>}
    <Card><Tabs label="Club membership management" value={tab} onChange={setTab} tabs={[{ id: 'members', label: `Members (${members.length})`, content: memberPanel }, { id: 'requests', label: `Requests (${requests.length})`, content: requestPanel }]} /></Card>
    <Card className="mt-5"><h2 className="text-lg font-bold text-slate-900">Transfer presidency</h2><p className="mt-1 text-sm text-slate-500">Choose an active member. Your current account becomes a coordinator.</p><div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end"><div className="flex-1"><Select label="New president" value={successor} onChange={(event) => { setSuccessor(event.target.value); setTransferInputError(''); }} error={transferInputError}><option value="">Select an active member</option>{members.filter((item) => ['member', 'coordinator'].includes(item.clubRole)).map((item) => <option key={item.user._id} value={item.user._id}>{item.user.name} · {item.clubRole}</option>)}</Select></div><Button variant="secondary" onClick={transfer}>Transfer presidency</Button></div></Card>
    <ConfirmDialog open={Boolean(pending)} onClose={() => setPending(null)} onConfirm={executePending} title={pending?.title} description={pending?.description} confirmLabel={pending?.confirmLabel} />
  </div>;
}
