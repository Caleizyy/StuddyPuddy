import { Compass } from 'lucide-react';
import { Link } from 'react-router';
import { EmptyState } from '@/components/states/EmptyState';
import { buttonVariants } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';

export function NotFoundPage() {
  const { status } = useAuth();
  const home = status === 'authenticated' ? '/dashboard' : '/';

  return (
    <main className="mx-auto max-w-xl p-8">
      <EmptyState
        icon={Compass}
        title="We could not find that page"
        description="The address may be mistyped, or the page may have moved."
        action={
          <Link to={home} className={buttonVariants()}>
            {status === 'authenticated' ? 'Go to the dashboard' : 'Go to the start page'}
          </Link>
        }
      />
    </main>
  );
}
