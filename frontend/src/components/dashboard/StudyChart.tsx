import type { Task } from '@/api/tasks';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { hoursPerDay, localDateKey } from '@/lib/timeLog';

const SHORT_DAY = new Intl.DateTimeFormat('en-GB', { weekday: 'short', timeZone: 'UTC' });

// The last seven days of logged study time as simple bars, with the numbers written out
export function StudyChart({ tasks }: { tasks: Task[] }) {
  const days = hoursPerDay(tasks, 7, localDateKey());
  const most = Math.max(1, ...days.map((day) => day.hours));
  const total = days.reduce((sum, day) => sum + day.hours, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Last 7 days
          <span className="text-sm font-normal text-muted-foreground">{total} h studied</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {total === 0 ? (
          <p className="text-sm text-muted-foreground">
            No time logged yet. Use &quot;Log time&quot; on a task after you study and your week
            appears here.
          </p>
        ) : (
          <ol className="flex h-32 items-end gap-2" aria-label="Hours studied per day">
            {days.map((day) => (
              <li
                key={day.date}
                className="flex h-full flex-1 flex-col items-center justify-end gap-1"
              >
                <span className="text-xs tabular-nums text-muted-foreground">
                  {day.hours > 0 ? day.hours : ''}
                </span>
                <div
                  className="w-full rounded-t bg-chart-2"
                  style={{
                    height: `${(day.hours / most) * 70}%`,
                    minHeight: day.hours > 0 ? 4 : 0,
                  }}
                  aria-hidden
                />
                <span className="text-xs text-muted-foreground">
                  {SHORT_DAY.format(new Date(`${day.date}T00:00:00Z`))}
                  <span className="sr-only">: {day.hours} hours</span>
                </span>
              </li>
            ))}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}
