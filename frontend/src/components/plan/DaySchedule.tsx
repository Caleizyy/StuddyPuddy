import type { Plan } from '@/api/plan';
import { Badge } from '@/components/ui/badge';
import { buildDays, dayLabel, formatDay } from '@/lib/planDays';

export function DaySchedule({ plan }: { plan: Plan }) {
  const { days, continuesUntil } = buildDays(plan);
  const itemById = new Map(plan.items.map((item) => [item.taskId, item]));
  const today = plan.generatedAt.slice(0, 10);

  return (
    <div className="space-y-3">
      {days.map((day) => (
        <section key={day.date} className="rounded-xl bg-card p-4 ring-1 ring-foreground/10">
          <div className="flex items-baseline justify-between gap-2">
            <h3 className="font-medium">{dayLabel(day.date, today)}</h3>
            {day.entries.length > 0 && (
              <span className="text-sm text-muted-foreground">{day.totalHours} h</span>
            )}
          </div>

          {day.entries.length === 0 ? (
            <p className="mt-2 text-sm text-muted-foreground">Nothing planned for this day.</p>
          ) : (
            <ul className="mt-2 space-y-1">
              {day.entries.map((entry) => (
                <li
                  key={entry.taskId}
                  className="flex flex-wrap items-center justify-between gap-2 text-sm"
                >
                  <span>{entry.title}</span>
                  <span className="flex items-center gap-2">
                    {itemById.get(entry.taskId)?.atRisk && (
                      <Badge variant="destructive">At risk</Badge>
                    )}
                    <span className="text-muted-foreground">{entry.hours} h</span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      ))}

      {continuesUntil && (
        <p className="text-sm text-muted-foreground">
          The plan continues until {formatDay(continuesUntil)}. Showing the next {days.length} days.
        </p>
      )}
    </div>
  );
}
