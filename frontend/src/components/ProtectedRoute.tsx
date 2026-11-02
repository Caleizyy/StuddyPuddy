import { Navigate, Outlet, useLocation } from 'react-router';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';

export function ProtectedRoute() {
  const { status, retry } = useAuth();
  const location = useLocation();

  if (status === 'loading') return <p className="p-8 text-muted-foreground">Loading...</p>;

  if (status === 'unavailable') {
    return (
      <main className="mx-auto max-w-md space-y-4 p-8">
        <p className="text-sm text-muted-foreground">
          We could not reach the server to check your session.
        </p>
        <Button onClick={retry}>Try again</Button>
      </main>
    );
  }

  if (status === 'anonymous')
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  return <Outlet />;
}
