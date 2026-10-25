import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { UsersRound } from 'lucide-react';
import toast from 'react-hot-toast';
import { joinClub } from '../../api/clubs';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import Card from '../ui/Card';
import { useAuth } from '../../context/AuthContext';

const labels = { technical: 'Technical', cultural: 'Cultural', sports: 'Sports', academic: 'Academic', social_service: 'Social service', arts: 'Arts', other: 'Other' };

export default function ClubCard({ club, membership }) {
  const [logoFailed, setLogoFailed] = useState(false);
  const { user, refreshMe } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [currentMembership, setCurrentMembership] = useState(membership);
  const [joining, setJoining] = useState(false);
  useEffect(() => setCurrentMembership(membership), [membership]);
  const target = `/clubs/${club.slug}`;
  const initials = club.name.split(/\s+/).slice(0, 2).map((word) => word[0]).join('').toUpperCase();
  const action = currentMembership?.status === 'pending' ? 'Request pending' : currentMembership?.status === 'active' ? 'Joined' : club.joinPolicy === 'open' ? 'Join club' : 'Request to join';

  async function handleAction() {
    if (currentMembership?.status === 'pending') return;
    if (currentMembership?.status === 'active') { navigate(target); return; }
    if (!user) { navigate('/login', { state: { from: { pathname: target, search: location.search } } }); return; }
    setJoining(true);
    try {
      const result = await joinClub(club._id);
      setCurrentMembership(result);
      await refreshMe();
      toast.success(result.status === 'pending' ? 'Join request sent.' : 'You joined the club.');
    } catch (error) { toast.error(error.message || 'Could not join this club.'); }
    finally { setJoining(false); }
  }
  return <Card className="overflow-hidden p-0 transition duration-200 hover:-translate-y-0.5 hover:shadow-md motion-reduce:transform-none">
    <Link to={target} aria-label={`View ${club.name}`} className="block">
      <div className="relative h-36 overflow-hidden bg-gradient-to-br from-indigo-700 via-brand to-sky-500">
        {club.bannerUrl && <img src={club.bannerUrl} alt="" className="absolute inset-0 h-full w-full object-cover" onError={(event) => { event.currentTarget.hidden = true; }} />}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/50 to-transparent" />
        <span className="absolute bottom-3 left-4 grid h-14 w-14 place-items-center overflow-hidden rounded-2xl border-2 border-white bg-white text-lg font-bold text-brand shadow-md">{club.logoUrl && !logoFailed ? <img src={club.logoUrl} alt="" className="h-full w-full object-cover" onError={() => setLogoFailed(true)} /> : initials}</span>
        <Badge variant="primary" className="absolute right-3 top-3 bg-white/95">{labels[club.category] || 'Club'}</Badge>
      </div>
    </Link>
    <div className="p-5">
      <Link to={target} className="font-bold text-slate-900 hover:text-brand focus-visible:ring-2 focus-visible:ring-brand">{club.name}</Link>
      <p className="mt-2 line-clamp-2 min-h-10 text-sm leading-5 text-slate-500">{club.description || 'A campus community ready to welcome you.'}</p>
      <div className="mt-4 flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500"><UsersRound aria-hidden="true" className="h-4 w-4" />{club.memberCount} members</span>
        <Button size="sm" loading={joining} disabled={currentMembership?.status === 'pending'} variant={currentMembership?.status === 'active' ? 'secondary' : 'primary'} onClick={handleAction}>{action}</Button>
      </div>
    </div>
  </Card>;
}
