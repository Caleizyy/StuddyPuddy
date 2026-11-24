import { Check, Circle, ListTree, Pencil } from 'lucide-react';
import type { Task, TaskStep } from '@/api/tasks';
import { Button } from '@/components/ui/button';
import { stepProgress } from '@/lib/steps';
import { cn } from '@/lib/utils';

type TaskStepsProps = {
  task: Task;
  busy: boolean;
  onSplit: () => void;
  onToggle: (step: TaskStep) => void;
  onEdit: () => void;
};

// The topics of one task: a progress line and a checklist, or a button to make the topics
export function TaskSteps({ task, busy, onSplit, onToggle, onEdit }: TaskStepsProps) {
  if (task.steps.length === 0) {
    if (task.status === 'done') return null;
    return (
      <div className="mt-3">
        <Button variant="ghost" size="sm" disabled={busy} onClick={onSplit}>
          <ListTree />
          Split into topics
        </Button>
      </div>
    );
  }

  const progress = stepProgress(task.steps);
  const percent = Math.round((progress.done / progress.total) * 100);

  return (
    <details className="mt-3 rounded-lg border border-border px-3 py-2">
      <summary className="flex cursor-pointer flex-wrap items-center justify-between gap-2 text-sm">
        <span className="font-medium">
          Topics: {progress.done} of {progress.total} done
        </span>
        <span className="text-muted-foreground">{progress.hoursLeft} h left in topics</span>
      </summary>
      <div
        role="progressbar"
        aria-label="Topics done"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
        className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted"
      >
        <div className="h-full bg-primary transition-all" style={{ width: `${percent}%` }} />
      </div>
      <ul className="mt-2 space-y-1">
        {task.steps.map((step) => (
          <li key={step.id}>
            <button
              type="button"
              disabled={busy}
              aria-pressed={step.done}
              onClick={() => onToggle(step)}
              className="flex w-full items-center gap-2 rounded-md px-1 py-1 text-left text-sm hover:bg-accent/50 disabled:opacity-60"
            >
              {step.done ? (
                <Check className="size-4 text-primary" aria-hidden />
              ) : (
                <Circle className="size-4 text-muted-foreground" aria-hidden />
              )}
              <span className={cn('flex-1', step.done && 'text-muted-foreground line-through')}>
                {step.title}
              </span>
              <span className="text-muted-foreground">{step.hours} h</span>
            </button>
          </li>
        ))}
      </ul>
      <Button variant="ghost" size="sm" className="mt-1" onClick={onEdit}>
        <Pencil />
        Edit topics
      </Button>
    </details>
  );
}
