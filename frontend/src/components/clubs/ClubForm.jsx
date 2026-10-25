import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { createClub, getClub, updateClub } from '../../api/clubs';
import { listUsers } from '../../api/users';
import Button from '../ui/Button';
import Card from '../ui/Card';
import Input from '../ui/Input';
import PageHeader from '../ui/PageHeader';
import SearchInput from '../ui/SearchInput';
import Select from '../ui/Select';
import Textarea from '../ui/Textarea';

const empty = { name: '', description: '', category: 'technical', joinPolicy: 'approval', logoUrl: '', bannerUrl: '', contactEmail: '', presidentUserId: '', socialLinks: { website: '', instagram: '', facebook: '', linkedin: '' } };

export default function ClubForm({ clubId, creating = false }) {
  const navigate = useNavigate();
  const [values, setValues] = useState(empty);
  const [users, setUsers] = useState([]);
  const [userQuery, setUserQuery] = useState('');
  const [loading, setLoading] = useState(Boolean(clubId));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    if (!clubId) return undefined;
    getClub(clubId).then(({ club }) => { if (active) setValues({ ...empty, ...club, presidentUserId: '' }); })
      .catch((requestError) => { if (active) setError(requestError.message || 'Could not load this club.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [clubId]);

  useEffect(() => {
    if (!creating) return undefined;
    let active = true;
    listUsers({ page: 1, limit: 50, q: userQuery || undefined, isActive: 'true', sort: 'name', order: 'asc' })
      .then((response) => { if (active) setUsers(response.data); })
      .catch((requestError) => { if (active) toast.error(requestError.message || 'Could not load active users.'); });
    return () => { active = false; };
  }, [creating, userQuery]);

  function change(key, value) { setValues((current) => ({ ...current, [key]: value })); }
  async function submit(event) {
    event.preventDefault();
    if (values.name.trim().length < 2) { setError('Club name must have at least two characters.'); return; }
    if (creating && !values.presidentUserId) { setError('Choose an active president for this club.'); return; }
    setSaving(true); setError('');
    const payload = { name: values.name.trim(), description: values.description.trim(), category: values.category, joinPolicy: values.joinPolicy,
      ...(values.logoUrl.trim() ? { logoUrl: values.logoUrl.trim() } : {}), ...(values.bannerUrl.trim() ? { bannerUrl: values.bannerUrl.trim() } : {}),
      ...(values.contactEmail.trim() ? { contactEmail: values.contactEmail.trim() } : {}),
      socialLinks: Object.fromEntries(Object.entries(values.socialLinks || {}).filter(([, value]) => value?.trim()).map(([key, value]) => [key, value.trim()])),
      ...(creating ? { presidentUserId: values.presidentUserId } : {}),
    };
    try {
      const saved = creating ? await createClub(payload) : await updateClub(clubId, payload);
      toast.success(creating ? 'Club created.' : 'Club details saved.');
      navigate(creating ? `/clubs/${saved.slug}` : `/clubs/${saved.slug}`);
    } catch (requestError) { setError(requestError.message || 'Could not save the club.'); }
    finally { setSaving(false); }
  }

  if (loading) return <div className="mx-auto max-w-3xl p-8 text-sm text-slate-500">Loading club details…</div>;
  return <div className="mx-auto max-w-3xl"><PageHeader eyebrow={creating ? 'Administration' : 'Club settings'} title={creating ? 'Create a club' : 'Edit club'} description={creating ? 'Set up a campus community and choose its first president.' : 'Keep your club information current.'} />
    <Card><form onSubmit={submit} noValidate className="space-y-5">
      {error && <p role="alert" className="rounded-lg bg-rose-50 p-3 text-sm text-danger">{error}</p>}
      <Input label="Club name" required maxLength={100} value={values.name} onChange={(event) => change('name', event.target.value)} />
      <Textarea label="Description" maxLength={3000} value={values.description} onChange={(event) => change('description', event.target.value)} />
      <div className="grid gap-5 sm:grid-cols-2"><Select label="Category" value={values.category} onChange={(event) => change('category', event.target.value)}>{[['technical','Technical'],['cultural','Cultural'],['sports','Sports'],['academic','Academic'],['social_service','Social service'],['arts','Arts'],['other','Other']].map(([value,label]) => <option key={value} value={value}>{label}</option>)}</Select><Select label="Join policy" value={values.joinPolicy} onChange={(event) => change('joinPolicy', event.target.value)}><option value="approval">Approval required</option><option value="open">Open membership</option></Select></div>
      <div className="grid gap-5 sm:grid-cols-2"><Input label="Logo URL" type="url" value={values.logoUrl} onChange={(event) => change('logoUrl', event.target.value)} /><Input label="Banner URL" type="url" value={values.bannerUrl} onChange={(event) => change('bannerUrl', event.target.value)} /></div>
      <Input label="Contact email" type="email" value={values.contactEmail} onChange={(event) => change('contactEmail', event.target.value)} />
      <div className="grid gap-5 sm:grid-cols-2">{[['website', 'Website'], ['instagram', 'Instagram'], ['facebook', 'Facebook'], ['linkedin', 'LinkedIn']].map(([key, label]) => <Input key={key} label={`${label} URL`} type="url" value={values.socialLinks?.[key] || ''} onChange={(event) => setValues((current) => ({ ...current, socialLinks: { ...current.socialLinks, [key]: event.target.value } }))} />)}</div>
      {creating && <div className="space-y-3"><SearchInput label="Search active users" placeholder="Search names or email" onSearchChange={setUserQuery} /><Select label="First president" value={values.presidentUserId} onChange={(event) => change('presidentUserId', event.target.value)}><option value="">Select a user</option>{users.map((candidate) => <option key={candidate._id} value={candidate._id}>{candidate.name} · {candidate.email}</option>)}</Select></div>}
      <div className="flex justify-end gap-2"><Button variant="secondary" onClick={() => navigate(-1)}>Cancel</Button><Button type="submit" loading={saving}>{creating ? 'Create club' : 'Save changes'}</Button></div>
    </form></Card>
  </div>;
}
