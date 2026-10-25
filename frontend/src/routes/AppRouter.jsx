import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ProtectedRoute from './ProtectedRoute';
import AppShell from '../layouts/AppShell';
import PublicLayout from '../layouts/PublicLayout';
import FullPageLoading from '../components/layout/FullPageLoading';
import LandingPage from '../pages/LandingPage';
import LoginPage from '../pages/LoginPage';
import RegisterPage from '../pages/RegisterPage';
import DashboardPage from '../pages/DashboardPage';
import ProfilePage from '../pages/ProfilePage';
import ForbiddenPage from '../pages/ForbiddenPage';
import NotFoundPage from '../pages/NotFoundPage';

function PublicOnly({ children }) {
  const { user } = useAuth();
  return user ? <Navigate to="/app/dashboard" replace /> : children;
}

export default function AppRouter() {
  const { loading } = useAuth();
  if (loading) return <FullPageLoading />;

  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route index element={<LandingPage />} />
        <Route path="login" element={<PublicOnly><LoginPage /></PublicOnly>} />
        <Route path="register" element={<PublicOnly><RegisterPage /></PublicOnly>} />
      </Route>
      <Route path="forbidden" element={<ForbiddenPage />} />
      <Route path="/app" element={<ProtectedRoute />}>
        <Route element={<AppShell />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="profile" element={<ProfilePage />} />
        </Route>
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
