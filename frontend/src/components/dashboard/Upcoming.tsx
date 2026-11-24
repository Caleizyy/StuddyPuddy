import { Link } from 'react-router';
import type { Task } from '@/api/tasks';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { upcomingTasks } from '@/lib/dashboard';
import { describeDeadline, formatDeadline } from '@/lib/deadline';
import { loggedPercent } from '@/lib/timeLog';

export function Upcoming({ tasks }: { tasks: Task[] }) {
  const upcoming = upcomingTasks(tasks, 5);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Coming up
          <Link to="/tasks" className="text-sm font-normal text-primary underline">
            All tasks
          </Link>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {upcoming.length === 0 ? (
          <p className="text-sm text-muted-foreground">No unfinished tasks. Nicely done.</p>
        ) : (
          <ul className="divide-y divide-border">
            {upcoming.map(({ task }) => {
              const deadline = describeDeadline(task.deadline);
              return (
                <li key={task.id} className="space-y-1 py-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-medium">{task.title}</span>
                    <Badge variant={deadline.overdue ? 'destructive' : 'outline'}>
                      {deadline.label}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Due {formatDeadline(task.deadline)} · {task.loggedHours} of{' '}
                    {task.estimatedHours} h studied
                  </p>
                  <div
                    role="progressbar"
                    aria-label={`${task.title} studied`}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={loggedPercent(task)}
                    className="h-1 overflow-hidden rounded-full bg-muted"
                  >
                    <div
                      className="h-full bg-chart-2"
                      style={{ width: `${loggedPercent(task)}%` }}
                    />
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
