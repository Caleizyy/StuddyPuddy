import { Navigate, Outlet, useLocation } from 'react-router';
import { ErrorState } from '@/components/states/ErrorState';
import { LoadingState } from '@/components/states/LoadingState';
import { useAuth } from '@/hooks/useAuth';

export function ProtectedRoute() {
  const { status, retry } = useAuth();
  const location = useLocation();

  if (status === 'loading') return <LoadingState label="Checking your session..." />;

  if (status === 'unavailable') {
    return (
      <main className="mx-auto max-w-xl p-8">
        <ErrorState
          title="We could not reach the server"
          message="We could not check your session. Your sign-in is kept, so you can just try again."
          onRetry={retry}
        />
      </main>
    );
  }

  if (status === 'anonymous')
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  return <Outlet />;
}
