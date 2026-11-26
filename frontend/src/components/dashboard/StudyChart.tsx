import type { Task } from '@/api/tasks';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { hoursPerDay, localDateKey } from '@/lib/timeLog';
import { cn } from '@/lib/utils';

const SHORT_DAY = new Intl.DateTimeFormat('en-GB', { weekday: 'short', timeZone: 'UTC' });

// The last seven days of logged study time as simple bars, with the numbers written out
export function StudyChart({ tasks }: { tasks: Task[] }) {
  const todayKey = localDateKey();
  const days = hoursPerDay(tasks, 7, todayKey);
  const most = Math.max(1, ...days.map((day) => day.hours));
  const total = days.reduce((sum, day) => sum + day.hours, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Your week
          <span className="text-sm font-semibold text-muted-foreground">{total} h studied</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {total === 0 ? (
          <p className="text-muted-foreground">
            No time logged yet. Tap &quot;Log time&quot; after you study and your week shows up
            here.
          </p>
        ) : (
          <ol className="flex h-44 items-end gap-2" aria-label="Hours studied per day">
            {days.map((day) => (
              <li
                key={day.date}
                className="flex h-full flex-1 flex-col items-center justify-end gap-1.5"
              >
                <span className="text-xs font-bold tabular-nums">
                  {day.hours > 0 ? day.hours : ''}
                </span>
                <div
                  className={cn(
                    'w-full rounded-t-xl',
                    day.date === todayKey ? 'bg-accent' : 'bg-primary',
                  )}
                  style={{
                    height: `${(day.hours / most) * 70}%`,
                    minHeight: day.hours > 0 ? 6 : 0,
                  }}
                  aria-hidden
                />
                <span
                  className={cn(
                    'text-xs font-medium text-muted-foreground',
                    day.date === todayKey && 'font-bold text-foreground',
                  )}
                >
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
