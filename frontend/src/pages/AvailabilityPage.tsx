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
    <main className="mx-auto max-w-2xl space-y-6 px-4 py-6 sm:px-6 md:py-8">
      <div>
        <h1 className="text-3xl font-semibold">Study hours</h1>
        <p className="mt-1 text-muted-foreground">
          How many hours can you study on each day of a typical week? The plan never schedules more
          than this on a day.
        </p>
      </div>

      {state.status === 'loading' && <LoadingState />}
      {state.status === 'error' && (
        <ErrorState
          title="We could not load your study hours"
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
