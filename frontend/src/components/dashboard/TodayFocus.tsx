import { Timer } from 'lucide-react';
import { Link } from 'react-router';
import type { Plan } from '@/api/plan';
import { Ripple } from '@/components/layout/Logo';
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
    <section
      aria-label="Today"
      className="sticker relative overflow-hidden rounded-3xl bg-hero p-6 text-hero-foreground md:p-8"
    >
      <Ripple className="pointer-events-none absolute -right-10 -bottom-12 size-72 text-white opacity-10" />

      <div className="relative grid gap-6 md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] md:gap-10">
        <div className="flex flex-col justify-between gap-6">
          <div>
            <h1 className="text-3xl leading-tight font-extrabold md:text-4xl">{greeting}</h1>
            <p className="mt-1 text-hero-foreground/80">{dateText}</p>
          </div>
          <div>
            <p className="font-heading text-7xl leading-none font-extrabold tabular-nums">
              {hours}
              <span className="ml-1 text-3xl font-bold">h</span>
            </p>
            <p className="mt-2 text-lg font-medium">
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
            <div className="flex h-full flex-col justify-center gap-3 rounded-2xl bg-white/10 p-5">
              <p className="text-lg font-semibold">
                {noTasks
                  ? 'Nothing to study. You have no unfinished tasks.'
                  : noHours
                    ? 'No study time is set, so nothing can be planned.'
                    : 'Nothing is planned for today. Enjoy the break, or get ahead.'}
              </p>
              <Link
                to={noTasks ? '/tasks' : noHours ? '/availability' : '/plan'}
                className="w-fit rounded-xl bg-white px-4 py-2 text-sm font-bold text-[oklch(0.25_0.08_265)]"
              >
                {noTasks ? 'Add a task' : noHours ? 'Set your hours' : 'See the plan'}
              </Link>
            </div>
          ) : (
            <ul className="space-y-2.5">
              {entries.map((entry) => (
                <li
                  key={entry.taskId}
                  className="flex items-center gap-3 rounded-2xl bg-white/12 p-3 pl-4 backdrop-blur-sm"
                >
                  <span className="font-heading text-2xl font-extrabold tabular-nums">
                    {entry.hours}
                    <span className="text-base font-bold"> h</span>
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{entry.title}</p>
                    {entry.item?.nextStep ? (
                      <p className="truncate text-sm text-hero-foreground/80">
                        Start with: {entry.item.nextStep}
                      </p>
                    ) : (
                      entry.item?.atRisk && (
                        <p className="text-sm font-semibold text-[oklch(0.9_0.17_95)]">
                          Running late, start here first
                        </p>
                      )
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => onLogTime(entry.taskId)}
                    className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-white px-3 py-2 text-sm font-bold text-[oklch(0.25_0.08_265)] transition-transform hover:-translate-y-px"
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
