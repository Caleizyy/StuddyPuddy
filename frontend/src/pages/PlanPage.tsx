import { ClipboardList } from 'lucide-react';
import { Link } from 'react-router';
import type { Plan } from '@/api/plan';
import { DaySchedule } from '@/components/plan/DaySchedule';
import { PlanWarnings } from '@/components/plan/PlanWarnings';
import { PriorityList } from '@/components/plan/PriorityList';
import { ErrorState } from '@/components/states/ErrorState';
import { LoadingState } from '@/components/states/LoadingState';
import { EmptyState } from '@/components/states/EmptyState';
import { buttonVariants } from '@/components/ui/button';
import { usePlan } from '@/hooks/usePlan';

function PlanContent({ plan }: { plan: Plan }) {
  if (plan.items.length === 0) {
    return (
      <EmptyState
        icon={ClipboardList}
        title="Nothing to plan yet"
        description="You have no unfinished tasks. Add a task and your plan appears here."
        action={
          <Link to="/tasks" className={buttonVariants()}>
            Add a task
          </Link>
        }
      />
    );
  }

  return (
    <>
      {plan.settings.maxHoursPerDay !== null && (
        <p className="text-muted-foreground">
          Your daily limit of {plan.settings.maxHoursPerDay} h is applied.{' '}
          <Link to="/availability" className="font-semibold text-primary hover:underline">
            Change it
          </Link>
        </p>
      )}

      <PlanWarnings plan={plan} />

      {plan.schedule.length === 0 && (
        <p className="text-sm text-muted-foreground">
          No study time is set, so nothing can be planned yet.{' '}
          <Link to="/availability" className="font-semibold text-primary hover:underline">
            Set your hours
          </Link>
        </p>
      )}

      <section aria-labelledby="priorities">
        <h2 id="priorities" className="mb-3 text-xl font-bold">
          Priorities
        </h2>
        <PriorityList items={plan.items} />
      </section>

      <section aria-labelledby="day-by-day">
        <h2 id="day-by-day" className="mb-3 text-xl font-bold">
          Day by day
        </h2>
        <DaySchedule plan={plan} />
      </section>
    </>
  );
}

export function PlanPage() {
  const { state, reload } = usePlan();

  return (
    <main className="mx-auto max-w-6xl space-y-8 px-4 py-6 sm:px-6 md:py-8">
      <div>
        <h1 className="text-3xl font-extrabold">Your plan</h1>
        <p className="mt-1 text-muted-foreground">
          What to study and when, ranked by priority. It updates whenever you change a task or your
          hours.
        </p>
      </div>

      {state.status === 'loading' && <LoadingState label="Building your plan..." />}
      {state.status === 'error' && (
        <ErrorState title="We could not build your plan" message={state.message} onRetry={reload} />
      )}
      {state.status === 'ready' && <PlanContent plan={state.plan} />}
    </main>
  );
}
