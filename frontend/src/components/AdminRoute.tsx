import { Navigate, Outlet } from 'react-router';
import { useAuth } from '@/hooks/useAuth';

// Sits inside ProtectedRoute, so the user is already signed in.
// This only hides the page from people who are not admins. The server is what really
// refuses them (403 on /api/admin/*), so this is a convenience, not the security.
export function AdminRoute() {
  const { user } = useAuth();
  if (user?.role !== 'admin') return <Navigate to="/dashboard" replace />;
  return <Outlet />;
}
