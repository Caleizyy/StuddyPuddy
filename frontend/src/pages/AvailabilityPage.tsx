import { useCallback, useEffect, useState } from 'react';
import { getAvailability, type WeeklyHours } from '@/api/availability';
import { getSettings } from '@/api/settings';
import { AvailabilityForm } from '@/components/availability/AvailabilityForm';
import { DailyLimitForm } from '@/components/availability/DailyLimitForm';
import { ErrorState } from '@/components/states/ErrorState';
import { LoadingState } from '@/components/states/LoadingState';

type LoadState =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'ready'; hours: WeeklyHours; maxHoursPerDay: number | null };

export function AvailabilityPage() {
  const [state, setState] = useState<LoadState>({ status: 'loading' });

  const load = useCallback(() => {
    setState({ status: 'loading' });
    // Both come from the server; the page shows once both have arrived
    Promise.all([getAvailability(), getSettings()])
      .then(([availability, settings]) =>
        setState({
          status: 'ready',
          hours: availability.hoursByWeekday,
          maxHoursPerDay: settings.settings.maxHoursPerDay,
        }),
      )
      .catch(() => setState({ status: 'error' }));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <main className="mx-auto max-w-xl space-y-6 p-8">
      <div>
        <h1 className="text-2xl font-semibold">Availability</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          How many hours can you study on each day of a typical week? The planner never schedules
          more than this on a day.
        </p>
      </div>

      {state.status === 'loading' && <LoadingState />}
      {state.status === 'error' && (
        <ErrorState
          title="We could not load your availability"
          message="Your hours are safe. Check your connection and try again."
          onRetry={load}
        />
      )}
      {state.status === 'ready' && (
        <>
          <AvailabilityForm initial={state.hours} />
          <DailyLimitForm initial={state.maxHoursPerDay} />
        </>
      )}
    </main>
  );
}
