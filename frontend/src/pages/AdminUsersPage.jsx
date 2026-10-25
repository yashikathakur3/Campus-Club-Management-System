import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { MoreHorizontal, UsersRound } from 'lucide-react';
import { listUsers, updateUser } from '../api/users';
import { useAuth } from '../context/AuthContext';
import Avatar from '../components/ui/Avatar';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import EmptyState from '../components/ui/EmptyState';
import PageHeader from '../components/ui/PageHeader';
import Pagination from '../components/ui/Pagination';
import SearchInput from '../components/ui/SearchInput';
import Select from '../components/ui/Select';
import Skeleton from '../components/ui/Skeleton';

function displayRole(role) { return role === 'super_admin' ? 'Super Admin' : 'Member'; }

export default function AdminUsersPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [meta, setMeta] = useState({ page: 1, totalPages: 1, total: 0 });
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState('');
  const [role, setRole] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pending, setPending] = useState(null);

  const handleSearch = useCallback((value) => { setPage(1); setQuery(value); }, []);

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const response = await listUsers({ page, limit: 10, q: query || undefined, role: role || undefined, isActive: status || undefined, sort: 'createdAt', order: 'desc' });
      setUsers(response.data); setMeta(response.meta);
    } catch (requestError) {
      setError(requestError.message || 'Could not load users.');
      toast.error(requestError.message || 'Could not load users.');
    } finally { setLoading(false); }
  }, [page, query, role, status]);

  useEffect(() => { load(); }, [load]);

  async function confirmUpdate() {
    const { user: target, changes, description } = pending;
    try {
      const updated = await updateUser(target._id, changes);
      setUsers((current) => current.map((item) => item._id === updated._id ? updated : item));
      toast.success(description);
    } catch (requestError) { toast.error(requestError.message || 'Could not update this user.'); }
    finally { setPending(null); }
  }

  function askUpdate(target, changes, description) { setPending({ user: target, changes, description }); }
  function actionMenu(target) {
    const isSelf = String(target._id) === String(currentUser?._id || currentUser?.id);
    return <details className="group relative inline-block text-left">
      <summary aria-label={`Actions for ${target.name}`} title={isSelf ? 'You cannot change your own role or deactivate yourself.' : undefined} className={`flex h-9 w-9 cursor-pointer list-none items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-brand ${isSelf ? 'opacity-40' : ''}`}><MoreHorizontal aria-hidden="true" className="h-5 w-5" /></summary>
      <div className="absolute right-0 z-20 mt-1 w-48 rounded-xl border border-slate-200 bg-white p-1 shadow-lg">
        <button type="button" disabled={isSelf} onClick={(event) => { event.currentTarget.closest('details').open = false; askUpdate(target, { role: target.role === 'member' ? 'super_admin' : 'member' }, 'User role updated.'); }} className="block w-full rounded-lg px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50">Change role to {target.role === 'member' ? 'Super Admin' : 'Member'}</button>
        <button type="button" disabled={isSelf} onClick={(event) => { event.currentTarget.closest('details').open = false; askUpdate(target, { isActive: !target.isActive }, target.isActive ? 'User deactivated.' : 'User activated.'); }} className="block w-full rounded-lg px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50">{target.isActive ? 'Deactivate' : 'Activate'} account</button>
        {isSelf && <span className="block px-3 pb-2 pt-1 text-xs text-slate-500">Your own account cannot be changed here.</span>}
      </div>
    </details>;
  }

  const userDetails = (item) => <div className="flex min-w-0 items-center gap-3"><Avatar name={item.name} src={item.avatarUrl} size="sm" /><div className="min-w-0"><p className="truncate font-semibold text-slate-900">{item.name}</p><p className="truncate text-sm text-slate-500">{item.email}</p>{item.studentId && <p className="truncate text-xs text-slate-400">{item.studentId}</p>}</div></div>;

  return <div>
    <PageHeader eyebrow="Administration" title="Users" description="Manage accounts, roles, and access across the platform." />
    <Card className="mb-5"><div className="grid gap-3 sm:grid-cols-3">
      <SearchInput label="Search users" placeholder="Name, email, or student ID" onSearchChange={handleSearch} />
      <Select aria-label="Filter by role" value={role} onChange={(event) => { setRole(event.target.value); setPage(1); }}><option value="">All roles</option><option value="member">Member</option><option value="super_admin">Super Admin</option></Select>
      <Select aria-label="Filter by account status" value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }}><option value="">All statuses</option><option value="true">Active</option><option value="false">Inactive</option></Select>
    </div></Card>
    {loading ? <div aria-label="Loading users" className="space-y-3">{Array.from({ length: 5 }, (_, index) => <Skeleton key={index} className="h-20 w-full" />)}</div>
      : error ? <Card className="py-10 text-center"><p role="alert" className="text-sm text-danger">{error}</p><Button className="mt-4" variant="secondary" onClick={load}>Try again</Button></Card>
        : users.length === 0 ? <EmptyState icon={UsersRound} title="No users found" description="Try changing your search or filters." /> : <>
          <div className="hidden overflow-hidden rounded-card border border-slate-200 bg-white shadow-card md:block">
            <table className="w-full text-left"><thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-5 py-3 font-semibold">User</th><th className="px-5 py-3 font-semibold">Role</th><th className="px-5 py-3 font-semibold">Status</th><th className="px-5 py-3 font-semibold">Joined</th><th className="px-5 py-3"><span className="sr-only">Actions</span></th></tr></thead>
              <tbody className="divide-y divide-slate-100">{users.map((item) => <tr key={item._id}><td className="px-5 py-4">{userDetails(item)}</td><td className="px-5 py-4"><Badge variant={item.role === 'super_admin' ? 'primary' : 'neutral'}>{displayRole(item.role)}</Badge></td><td className="px-5 py-4"><Badge variant={item.isActive ? 'success' : 'danger'}>{item.isActive ? 'Active' : 'Inactive'}</Badge></td><td className="px-5 py-4 text-sm text-slate-500">{new Date(item.createdAt).toLocaleDateString()}</td><td className="px-5 py-4 text-right">{actionMenu(item)}</td></tr>)}</tbody>
            </table>
          </div>
          <div className="space-y-3 md:hidden">{users.map((item) => <Card key={item._id}><div className="flex items-start justify-between gap-3"><div>{userDetails(item)}</div>{actionMenu(item)}</div><div className="mt-4 flex flex-wrap items-center gap-2"><Badge variant={item.role === 'super_admin' ? 'primary' : 'neutral'}>{displayRole(item.role)}</Badge><Badge variant={item.isActive ? 'success' : 'danger'}>{item.isActive ? 'Active' : 'Inactive'}</Badge></div></Card>)}</div>
          <div className="mt-5"><Pagination page={page} totalPages={meta.totalPages || 1} onPageChange={setPage} label="users" /><p className="mt-2 text-xs text-slate-500">{meta.total} {meta.total === 1 ? 'account' : 'accounts'}</p></div>
        </>}
    <ConfirmDialog open={Boolean(pending)} onClose={() => setPending(null)} onConfirm={confirmUpdate} title={pending?.changes.isActive === false ? 'Deactivate this account?' : pending?.changes.isActive === true ? 'Activate this account?' : 'Change this user’s role?'} description={pending ? `${pending.user.name} will be updated. Existing sessions may be signed out.` : undefined} confirmLabel="Confirm change" />
  </div>;
}
