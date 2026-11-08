import { Link } from 'react-router';
import type { Plan } from '@/api/plan';
import { DaySchedule } from '@/components/plan/DaySchedule';
import { PlanWarnings } from '@/components/plan/PlanWarnings';
import { PriorityList } from '@/components/plan/PriorityList';
import { Button } from '@/components/ui/button';
import { usePlan } from '@/hooks/usePlan';

function PlanContent({ plan }: { plan: Plan }) {
  if (plan.items.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border p-8 text-center">
        <p className="text-muted-foreground">
          You have no unfinished tasks.{' '}
          <Link to="/tasks" className="text-primary underline">
            Add a task
          </Link>{' '}
          and your plan appears here.
        </p>
      </div>
    );
  }

  return (
    <>
      <PlanWarnings plan={plan} />

      {plan.schedule.length === 0 && (
        <p className="text-sm text-muted-foreground">
          No study time is set, so nothing can be planned yet.{' '}
          <Link to="/availability" className="text-primary underline">
            Set your hours
          </Link>
        </p>
      )}

      <section aria-labelledby="priorities">
        <h2 id="priorities" className="mb-3 text-lg font-medium">
          Priorities
        </h2>
        <PriorityList items={plan.items} />
      </section>

      <section aria-labelledby="day-by-day">
        <h2 id="day-by-day" className="mb-3 text-lg font-medium">
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
    <main className="mx-auto max-w-3xl space-y-8 p-8">
      <div>
        <h1 className="text-2xl font-semibold">Plan</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          What to study and when, ranked by priority. It updates whenever you change a task or your
          hours.
        </p>
      </div>

      {state.status === 'loading' && <p className="text-muted-foreground">Loading...</p>}
      {state.status === 'error' && (
        <div className="space-y-3">
          <p className="text-destructive">{state.message}</p>
          <Button variant="outline" onClick={reload}>
            Try again
          </Button>
        </div>
      )}
      {state.status === 'ready' && <PlanContent plan={state.plan} />}
    </main>
  );
}
