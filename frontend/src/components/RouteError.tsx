import { isRouteErrorResponse, Link, useRouteError } from 'react-router';
import { ErrorState } from '@/components/states/ErrorState';
import { buttonVariants } from '@/components/ui/button';

// Shown by the router when a page crashes while it is drawn. It replaces the white screen.
export function RouteError() {
  const error = useRouteError();
  const notFound = isRouteErrorResponse(error) && error.status === 404;

  return (
    <main className="mx-auto max-w-xl space-y-4 p-8">
      <ErrorState
        title={notFound ? 'We could not find that page' : 'This page ran into a problem'}
        message={
          notFound
            ? 'The address may be mistyped, or the page may have moved.'
            : 'Reloading usually fixes it. If it keeps happening, go back to the start and try again.'
        }
        onRetry={notFound ? undefined : () => window.location.reload()}
      />
      <div className="text-center">
        <Link to="/" className={buttonVariants({ variant: 'link' })}>
          Back to the start
        </Link>
      </div>
    </main>
  );
}
