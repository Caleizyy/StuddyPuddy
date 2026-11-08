import type { Task } from '@/api/tasks';
import { CATEGORY_LABELS, STATUS_LABELS } from '@/lib/taskOptions';

// Deadlines are stored as noon UTC, so we show the UTC date
function formatDeadline(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

export function TaskList({ tasks }: { tasks: Task[] }) {
  if (tasks.length === 0) {
    return <p className="text-muted-foreground">No tasks yet. Add your first one above.</p>;
  }

  return (
    <ul className="space-y-3">
      {tasks.map((task) => (
        <li key={task.id} className="rounded-xl bg-card p-4 ring-1 ring-foreground/10">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="font-medium">{task.title}</h3>
            <span className="text-sm text-muted-foreground">{STATUS_LABELS[task.status]}</span>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {CATEGORY_LABELS[task.category]} · due {formatDeadline(task.deadline)} ·{' '}
            {task.estimatedHours} h · {task.moduleCount}{' '}
            {task.moduleCount === 1 ? 'module' : 'modules'}
          </p>
        </li>
      ))}
    </ul>
  );
}
