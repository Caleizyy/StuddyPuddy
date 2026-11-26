import type { Plan } from '@/api/plan';
import { BAND_STRIPE } from '@/components/plan/PriorityList';
import { Badge } from '@/components/ui/badge';
import { buildDays, dayLabel, formatDay } from '@/lib/planDays';
import { cn } from '@/lib/utils';

export function DaySchedule({ plan }: { plan: Plan }) {
  const { days, continuesUntil } = buildDays(plan);
  const itemById = new Map(plan.items.map((item) => [item.taskId, item]));
  const today = plan.generatedAt.slice(0, 10);

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {days.map((day) => {
          const isToday = day.date === today;
          return (
            <section
              key={day.date}
              className={cn(
                'rounded-2xl bg-card p-4',
                isToday ? 'sticker' : 'border border-border',
                day.entries.length === 0 && 'bg-transparent',
              )}
            >
              <div className="flex items-baseline justify-between gap-2">
                <h3 className="font-heading text-lg font-bold">{dayLabel(day.date, today)}</h3>
                {day.entries.length > 0 && (
                  <span className="rounded-full bg-accent px-2.5 py-0.5 text-sm font-bold text-accent-foreground">
                    {day.totalHours} h
                  </span>
                )}
              </div>

              {day.entries.length === 0 ? (
                <p className="mt-2 text-sm text-muted-foreground">Free day. Nothing planned.</p>
              ) : (
                <ul className="mt-3 space-y-2">
                  {day.entries.map((entry) => {
                    const item = itemById.get(entry.taskId);
                    return (
                      <li key={entry.taskId} className="flex items-center gap-2.5">
                        <span
                          aria-hidden
                          className={cn(
                            'h-8 w-1.5 shrink-0 rounded-full',
                            item ? BAND_STRIPE[item.band] : 'bg-muted',
                          )}
                        />
                        <span className="min-w-0 flex-1 font-medium">{entry.title}</span>
                        {item?.atRisk && <Badge variant="destructive">At risk</Badge>}
                        <span className="font-heading font-bold tabular-nums">{entry.hours} h</span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          );
        })}
      </div>

      {continuesUntil && (
        <p className="text-sm text-muted-foreground">
          The plan continues until {formatDay(continuesUntil)}. Showing the next {days.length} days.
        </p>
      )}
    </div>
  );
}
