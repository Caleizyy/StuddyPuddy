import { Timer } from 'lucide-react';
import { Link } from 'react-router';
import type { Plan } from '@/api/plan';
import { todaysFocus } from '@/lib/dashboard';

type Props = {
  plan: Plan;
  greeting: string;
  dateText: string;
  onLogTime: (taskId: string) => void;
};

// The first thing on the dashboard: what to study today, with the total as the big number
export function TodayFocus({ plan, greeting, dateText, onLogTime }: Props) {
  const { entries, hours } = todaysFocus(plan);
  const noTasks = plan.items.length === 0;
  const noHours = !noTasks && plan.schedule.length === 0;

  return (
    <section aria-label="Today" className="rounded-2xl border border-border bg-card p-6 md:p-8">
      <div className="grid gap-6 md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] md:gap-10">
        <div className="flex flex-col justify-between gap-6">
          <div>
            <h1 className="text-3xl leading-tight font-semibold">{greeting}</h1>
            <p className="mt-1 text-muted-foreground">{dateText}</p>
          </div>
          <div>
            <p className="font-heading text-6xl leading-none font-semibold tabular-nums">
              {hours}
              <span className="ml-1 text-2xl font-medium text-muted-foreground">h</span>
            </p>
            <p className="mt-2 text-base text-muted-foreground">
              {hours === 0
                ? 'planned for today'
                : entries.length === 1
                  ? 'on one task today'
                  : `across ${entries.length} tasks today`}
            </p>
          </div>
        </div>

        <div>
          {entries.length === 0 ? (
            <div className="flex h-full flex-col justify-center gap-3 rounded-xl bg-muted p-5">
              <p className="font-medium">
                {noTasks
                  ? 'Nothing to study. You have no unfinished tasks.'
                  : noHours
                    ? 'No study time is set, so nothing can be planned.'
                    : 'Nothing is planned for today. Enjoy the break, or get ahead.'}
              </p>
              <Link
                to={noTasks ? '/tasks' : noHours ? '/availability' : '/plan'}
                className="inline-flex min-h-11 w-fit items-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground"
              >
                {noTasks ? 'Add a task' : noHours ? 'Set your hours' : 'See the plan'}
              </Link>
            </div>
          ) : (
            <ul className="divide-y divide-border rounded-xl border border-border">
              {entries.map((entry) => (
                <li key={entry.taskId} className="flex items-center gap-3 p-3 pl-4">
                  <span className="font-heading text-xl font-semibold tabular-nums">
                    {entry.hours}
                    <span className="text-sm font-medium text-muted-foreground"> h</span>
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{entry.title}</p>
                    {entry.item?.nextStep ? (
                      <p className="truncate text-sm text-muted-foreground">
                        Start with: {entry.item.nextStep}
                      </p>
                    ) : (
                      entry.item?.atRisk && (
                        <p className="text-sm font-medium text-priority-medium">
                          Running late, start here first
                        </p>
                      )
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => onLogTime(entry.taskId)}
                    className="inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-lg px-3 text-sm font-medium text-primary hover:bg-muted"
                  >
                    <Timer className="size-4" aria-hidden />
                    Log time
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
