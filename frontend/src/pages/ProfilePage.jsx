import { useAuth } from '../context/AuthContext';
import Avatar from '../components/ui/Avatar';
import Badge from '../components/ui/Badge';
import Card from '../components/ui/Card';
import PageHeader from '../components/ui/PageHeader';

export default function ProfilePage() {
  const { user } = useAuth();
  const role = user?.role === 'super_admin' ? 'Super Admin' : 'Member';
  return (
    <div>
      <PageHeader eyebrow="Account" title="Your profile" description="The account details you use across Campus Club." />
      <Card className="max-w-2xl">
        <div className="flex flex-col gap-5 border-b border-slate-100 pb-6 sm:flex-row sm:items-center">
          <Avatar name={user?.name} src={user?.avatarUrl} size="lg" />
          <div><div className="flex flex-wrap items-center gap-2"><h2 className="text-lg font-bold text-slate-900">{user?.name}</h2><Badge variant="primary">{role}</Badge></div><p className="mt-1 text-sm text-slate-500">{user?.email}</p></div>
        </div>
        <dl className="grid gap-x-8 gap-y-5 pt-6 sm:grid-cols-2">
          <div><dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">Department</dt><dd className="mt-1.5 text-sm font-medium text-slate-800">{user?.department || 'Not added'}</dd></div>
          <div><dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">Student ID</dt><dd className="mt-1.5 text-sm font-medium text-slate-800">{user?.studentId || 'Not added'}</dd></div>
          <div><dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">Year</dt><dd className="mt-1.5 text-sm font-medium text-slate-800">{user?.year || 'Not added'}</dd></div>
          <div><dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">About</dt><dd className="mt-1.5 text-sm leading-6 text-slate-800">{user?.bio || 'No bio added yet.'}</dd></div>
        </dl>
        <p className="mt-6 rounded-lg bg-slate-50 px-4 py-3 text-xs leading-5 text-slate-500">Profile editing will be available in a future update.</p>
      </Card>
    </div>
  );
}
