import { Link } from 'react-router';
import type { Task } from '@/api/tasks';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { upcomingTasks } from '@/lib/dashboard';
import { describeDeadline, formatDeadline } from '@/lib/deadline';
import { loggedPercent } from '@/lib/timeLog';
import { CATEGORY_STRIPE } from '@/lib/taskOptions';
import { cn } from '@/lib/utils';

export function Upcoming({ tasks }: { tasks: Task[] }) {
  const upcoming = upcomingTasks(tasks, 5);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Coming up
          <Link to="/tasks" className="text-sm font-semibold text-primary hover:underline">
            See all tasks
          </Link>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {upcoming.length === 0 ? (
          <p className="text-muted-foreground">
            No unfinished tasks. Nicely done.{' '}
            <Link to="/tasks" className="font-semibold text-primary hover:underline">
              Add another
            </Link>
          </p>
        ) : (
          <ul className="space-y-3">
            {upcoming.map(({ task }) => {
              const deadline = describeDeadline(task.deadline);
              return (
                <li key={task.id} className="flex gap-3">
                  <span
                    aria-hidden
                    className={cn(
                      'w-1.5 shrink-0 self-stretch rounded-full',
                      CATEGORY_STRIPE[task.category],
                    )}
                  />
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-semibold">{task.title}</span>
                      <span
                        className={cn(
                          'shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium',
                          deadline.overdue
                            ? 'bg-destructive/10 text-destructive'
                            : 'bg-secondary text-secondary-foreground',
                        )}
                      >
                        {deadline.label}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {formatDeadline(task.deadline)} · {task.loggedHours} of {task.estimatedHours}{' '}
                      h studied
                    </p>
                    <div
                      role="progressbar"
                      aria-label={`${task.title} studied`}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-valuenow={loggedPercent(task)}
                      className="h-2 overflow-hidden rounded-full bg-muted"
                    >
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${loggedPercent(task)}%` }}
                      />
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
