import { Navigate, Outlet, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ClubRoleRoute({ allowedClubRoles = ['president'] }) {
  const { user, memberships } = useAuth();
  const { id } = useParams();
  if (user?.role === 'super_admin') return <Outlet />;
  const membership = memberships?.find((item) => (item.club?._id === id || item.club?.slug === id) && item.status === 'active');
  return membership && allowedClubRoles.includes(membership.clubRole) ? <Outlet /> : <Navigate to="/forbidden" replace />;
}
