import { BookOpen, Check, Clock, Pencil, RotateCcw, Trash2 } from 'lucide-react';
import type { Task } from '@/api/tasks';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { describeDeadline, formatDeadline } from '@/lib/deadline';
import {
  CATEGORY_LABELS,
  STATUS_LABELS,
  type TaskCategory,
  type TaskStatus,
} from '@/lib/taskOptions';
import { cn } from '@/lib/utils';
import type { PlanItem } from '@/api/plan';
import { PriorityBadge } from '@/components/plan/PriorityBadge';
import { formatScore } from '@/lib/priority';

const CATEGORY_DOT: Record<TaskCategory, string> = {
  homework: 'bg-chart-1',
  exam: 'bg-chart-4',
  quiz: 'bg-chart-3',
  lab: 'bg-chart-2',
};

const STATUS_BADGE: Record<TaskStatus, 'outline' | 'secondary' | 'default'> = {
  todo: 'outline',
  in_progress: 'secondary',
  done: 'default',
};

type TaskCardProps = {
  task: Task;
  busy: boolean;
  onToggleDone: () => void;
  onEdit: () => void;
  onDelete: () => void;
  priority?: PlanItem;
};

export function TaskCard({ task, busy, onToggleDone, onEdit, onDelete, priority }: TaskCardProps) {
  const isDone = task.status === 'done';
  const deadline = describeDeadline(task.deadline);

  return (
    <li className={cn('rounded-xl bg-card p-4 ring-1 ring-foreground/10', isDone && 'opacity-70')}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h3 className={cn('font-medium', isDone && 'line-through')}>{task.title}</h3>
        <Badge variant={STATUS_BADGE[task.status]}>{STATUS_LABELS[task.status]}</Badge>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className={cn('size-2 rounded-full', CATEGORY_DOT[task.category])} aria-hidden />
          {CATEGORY_LABELS[task.category]}
        </span>
        <span>Due {formatDeadline(task.deadline)}</span>
        {!isDone && (
          <Badge variant={deadline.overdue ? 'destructive' : 'outline'}>{deadline.label}</Badge>
        )}
      </div>

      {!isDone && priority && (
        <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
          <PriorityBadge band={priority.band} />
          <span className="text-muted-foreground">score {formatScore(priority.priorityScore)}</span>
          {priority.atRisk && <Badge variant="destructive">At risk</Badge>}
        </div>
      )}

      <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <Clock className="size-4" aria-hidden />
          {task.estimatedHours} h estimated
        </span>
        <span className="flex items-center gap-1.5">
          <BookOpen className="size-4" aria-hidden />
          {task.moduleCount} {task.moduleCount === 1 ? 'module' : 'modules'}
        </span>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Button variant="outline" size="sm" disabled={busy} onClick={onToggleDone}>
          {isDone ? <RotateCcw /> : <Check />}
          {isDone ? 'Reopen' : 'Mark done'}
        </Button>
        <Button variant="ghost" size="icon-sm" aria-label={`Edit ${task.title}`} onClick={onEdit}>
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
      </div>
    </li>
  );
}
