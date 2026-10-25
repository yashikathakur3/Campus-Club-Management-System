import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { changePassword, updateMe } from '../api/auth';
import { useAuth } from '../context/AuthContext';
import Avatar from '../components/ui/Avatar';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import PageHeader from '../components/ui/PageHeader';
import Select from '../components/ui/Select';
import Tabs from '../components/ui/Tabs';
import Textarea from '../components/ui/Textarea';

const emptyErrors = {};

function validateProfile(values) {
  const errors = {};
  if (values.name.trim().length < 2 || values.name.trim().length > 80) errors.name = 'Name must be 2 to 80 characters.';
  if (values.department.length > 120) errors.department = 'Department must be 120 characters or fewer.';
  if (values.year && (!Number.isInteger(Number(values.year)) || Number(values.year) < 1 || Number(values.year) > 6)) errors.year = 'Choose a year from 1 to 6.';
  if (values.bio.length > 500) errors.bio = 'Bio must be 500 characters or fewer.';
  if (values.avatarUrl && !/^https?:\/\/.+/i.test(values.avatarUrl)) errors.avatarUrl = 'Enter a valid HTTP or HTTPS URL.';
  if (values.studentId.length > 80) errors.studentId = 'Student ID must be 80 characters or fewer.';
  return errors;
}

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const [tab, setTab] = useState('profile');
  const [saving, setSaving] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [errors, setErrors] = useState(emptyErrors);
  const [passwordError, setPasswordError] = useState('');
  const [values, setValues] = useState({ name: '', department: '', year: '', bio: '', avatarUrl: '', studentId: '' });
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '' });

  useEffect(() => setValues({
    name: user?.name || '', department: user?.department || '', year: user?.year ? String(user.year) : '',
    bio: user?.bio || '', avatarUrl: user?.avatarUrl || '', studentId: user?.studentId || '',
  }), [user]);

  function setField(key, value) { setValues((current) => ({ ...current, [key]: value })); }

  async function saveProfile(event) {
    event.preventDefault();
    const nextErrors = validateProfile(values);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    const payload = {
      name: values.name.trim(), department: values.department.trim(),
      ...(values.year ? { year: Number(values.year) } : {}), bio: values.bio.trim(),
      ...(values.avatarUrl.trim() ? { avatarUrl: values.avatarUrl.trim() } : {}), studentId: values.studentId.trim(),
    };
    setSaving(true);
    try {
      const response = await updateMe(payload);
      updateUser(response.user);
      toast.success('Profile saved.');
    } catch (error) { toast.error(error.message || 'Could not save your profile.'); }
    finally { setSaving(false); }
  }

  async function savePassword(event) {
    event.preventDefault();
    setPasswordError('');
    if (passwords.newPassword.length < 8 || !/[A-Za-z]/.test(passwords.newPassword) || !/[0-9]/.test(passwords.newPassword)) {
      setPasswordError('Use at least 8 characters with a letter and a number.');
      return;
    }
    setPasswordSaving(true);
    try {
      const response = await changePassword(passwords);
      updateUser(response.user, response.token);
      setPasswords({ currentPassword: '', newPassword: '' });
      toast.success('Password changed. Your current session is still active.');
    } catch (error) { setPasswordError(error.message || 'Could not change your password.'); }
    finally { setPasswordSaving(false); }
  }

  const role = user?.role === 'super_admin' ? 'Super Admin' : 'Member';
  const profilePanel = <Card className="max-w-3xl">
    <div className="mb-6 flex items-center gap-4 border-b border-slate-100 pb-5"><Avatar name={values.name || user?.name} src={values.avatarUrl} size="lg" /><div><h2 className="text-lg font-bold text-slate-900">{values.name || user?.name}</h2><p className="text-sm text-slate-500">{user?.email}</p><Badge variant="primary" className="mt-2">{role}</Badge></div></div>
    <form onSubmit={saveProfile} noValidate className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <Input label="Full name" value={values.name} onChange={(event) => setField('name', event.target.value)} error={errors.name} />
        <Input label="Student ID" value={values.studentId} onChange={(event) => setField('studentId', event.target.value)} error={errors.studentId} />
        <Input label="Department" value={values.department} onChange={(event) => setField('department', event.target.value)} error={errors.department} />
        <Select label="Year" value={values.year} onChange={(event) => setField('year', event.target.value)} error={errors.year}><option value="">Select year</option>{[1,2,3,4,5,6].map((year) => <option value={year} key={year}>Year {year}</option>)}</Select>
        <div className="sm:col-span-2"><Input label="Avatar URL" type="url" value={values.avatarUrl} onChange={(event) => setField('avatarUrl', event.target.value)} error={errors.avatarUrl} hint="Use an HTTPS image URL. Leave blank to use initials." /></div>
        <div className="sm:col-span-2"><Textarea label="Bio" value={values.bio} onChange={(event) => setField('bio', event.target.value)} error={errors.bio} maxLength={500} /></div>
      </div>
      <div className="flex justify-end"><Button type="submit" loading={saving}>Save profile</Button></div>
    </form>
  </Card>;
  const securityPanel = <Card className="max-w-3xl"><form onSubmit={savePassword} noValidate className="max-w-xl space-y-5">
    <div><h2 className="text-lg font-bold text-slate-900">Change password</h2><p className="mt-1 text-sm text-slate-500">Changing your password invalidates other sessions. This page will keep you signed in.</p></div>
    <Input label="Current password" type="password" autoComplete="current-password" value={passwords.currentPassword} onChange={(event) => setPasswords((current) => ({ ...current, currentPassword: event.target.value }))} required />
    <Input label="New password" type="password" autoComplete="new-password" value={passwords.newPassword} onChange={(event) => setPasswords((current) => ({ ...current, newPassword: event.target.value }))} hint="At least 8 characters, including a letter and a number." required />
    {passwordError && <p role="alert" className="text-sm text-danger">{passwordError}</p>}
    <Button type="submit" loading={passwordSaving}>Update password</Button>
  </form></Card>;

  return <div>
    <PageHeader eyebrow="Account" title="Your profile" description="Manage your campus details and account security." />
    <Tabs label="Profile settings" value={tab} onChange={setTab} tabs={[{ id: 'profile', label: 'Profile', content: profilePanel }, { id: 'security', label: 'Security', content: securityPanel }]} />
  </div>;
}
