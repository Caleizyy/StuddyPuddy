import { useEffect, useState } from 'react';
import { getAvailability, type WeeklyHours } from '@/api/availability';
import { AvailabilityForm } from '@/components/availability/AvailabilityForm';

type LoadState =
  { status: 'loading' } | { status: 'error' } | { status: 'ready'; hours: WeeklyHours };

export function AvailabilityPage() {
  const [state, setState] = useState<LoadState>({ status: 'loading' });

  useEffect(() => {
    getAvailability()
      .then((result) => setState({ status: 'ready', hours: result.hoursByWeekday }))
      .catch(() => setState({ status: 'error' }));
  }, []);

  return (
    <main className="mx-auto max-w-xl space-y-6 p-8">
      <div>
        <h1 className="text-2xl font-semibold">Availability</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          How many hours can you study on each day of a typical week? The planner never schedules
          more than this on a day.
        </p>
      </div>

      {state.status === 'loading' && <p className="text-muted-foreground">Loading...</p>}
      {state.status === 'error' && (
        <p className="text-destructive">
          Could not load your availability. Reload the page to try again.
        </p>
      )}
      {state.status === 'ready' && <AvailabilityForm initial={state.hours} />}
    </main>
  );
}
