import {
  BookOpen,
  CalendarDays,
  Check,
  Clock,
  Pencil,
  RotateCcw,
  Timer,
  Trash2,
} from 'lucide-react';
import type { Task, TaskStep } from '@/api/tasks';
import { TaskSteps } from '@/components/tasks/TaskSteps';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { describeDeadline, formatDeadline } from '@/lib/deadline';
import { CATEGORY_LABELS, CATEGORY_STRIPE, STATUS_LABELS } from '@/lib/taskOptions';
import { cn } from '@/lib/utils';
import type { PlanItem } from '@/api/plan';
import { PriorityBadge } from '@/components/plan/PriorityBadge';
import { loggedPercent } from '@/lib/timeLog';

type TaskCardProps = {
  task: Task;
  busy: boolean;
  onToggleDone: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onLogTime: () => void;
  onSplit: () => void;
  onToggleStep: (step: TaskStep) => void;
  onEditSteps: () => void;
  priority?: PlanItem;
};

export function TaskCard({
  task,
  busy,
  onToggleDone,
  onEdit,
  onDelete,
  onLogTime,
  onSplit,
  onToggleStep,
  onEditSteps,
  priority,
}: TaskCardProps) {
  const isDone = task.status === 'done';
  const deadline = describeDeadline(task.deadline);

  return (
    <li
      className={cn(
        'flex overflow-hidden rounded-2xl border border-border bg-card',
        isDone && 'opacity-60',
      )}
    >
      <span aria-hidden className={cn('w-2.5 shrink-0', CATEGORY_STRIPE[task.category])} />
      <div className="min-w-0 flex-1 p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0">
            <h3
              className={cn(
                'font-heading text-xl leading-tight font-bold',
                isDone && 'line-through',
              )}
            >
              {task.title}
            </h3>
            <p className="mt-0.5 text-sm font-semibold text-muted-foreground">
              {CATEGORY_LABELS[task.category]}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {!isDone && priority && <PriorityBadge band={priority.band} />}
            {!isDone && priority?.atRisk && <Badge variant="destructive">At risk</Badge>}
            {task.status !== 'todo' && (
              <Badge variant={isDone ? 'default' : 'secondary'}>{STATUS_LABELS[task.status]}</Badge>
            )}
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <CalendarDays className="size-4" aria-hidden />
            Due {formatDeadline(task.deadline)}
            {!isDone && (
              <span
                className={cn(
                  'ml-1 rounded-full px-2.5 py-0.5 text-xs font-bold',
                  deadline.overdue
                    ? 'bg-destructive text-white'
                    : 'bg-secondary text-secondary-foreground',
                )}
              >
                {deadline.label}
              </span>
            )}
          </span>
          <span className="flex items-center gap-1.5">
            <Clock className="size-4" aria-hidden />
            {task.loggedHours > 0
              ? `${task.loggedHours} of ${task.estimatedHours} h studied`
              : `${task.estimatedHours} h estimated`}
          </span>
          <span className="flex items-center gap-1.5">
            <BookOpen className="size-4" aria-hidden />
            {task.moduleCount} {task.moduleCount === 1 ? 'module' : 'modules'}
          </span>
        </div>

        {task.loggedHours > 0 && (
          <div
            role="progressbar"
            aria-label="Time studied"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={loggedPercent(task)}
            className="mt-3 h-2 overflow-hidden rounded-full bg-muted"
          >
            <div
              className="h-full rounded-full bg-primary"
              style={{ width: `${loggedPercent(task)}%` }}
            />
          </div>
        )}

        <TaskSteps
          task={task}
          busy={busy}
          onSplit={onSplit}
          onToggle={onToggleStep}
          onEdit={onEditSteps}
        />

        <div className="mt-4 flex flex-wrap items-center gap-2">
          {isDone ? (
            <Button variant="outline" size="sm" disabled={busy} onClick={onToggleDone}>
              <RotateCcw />
              Reopen
            </Button>
          ) : (
            <>
              <Button size="sm" onClick={onLogTime}>
                <Timer />
                Log time
              </Button>
              <Button variant="outline" size="sm" disabled={busy} onClick={onToggleDone}>
                <Check />
                Mark done
              </Button>
            </>
          )}
          <span className="ml-auto flex items-center">
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={`Edit ${task.title}`}
              onClick={onEdit}
            >
              <Pencil />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={`Delete ${task.title}`}
              onClick={onDelete}
            >
              <Trash2 />
            </Button>
          </span>
        </div>
      </div>
    </li>
  );
}
