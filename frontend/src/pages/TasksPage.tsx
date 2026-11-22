import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router';
import { ListTodo, Plus, SearchX } from 'lucide-react';
import type { PlanItem } from '@/api/plan';
import { ApiError } from '@/api/client';
import { listTasks, updateTask, type Task } from '@/api/tasks';
import { DeleteTaskDialog } from '@/components/tasks/DeleteTaskDialog';
import { TaskCard } from '@/components/tasks/TaskCard';
import { TaskDialog } from '@/components/tasks/TaskDialog';
import { TaskFilterBar } from '@/components/tasks/TaskFilterBar';
import { EmptyState } from '@/components/states/EmptyState';
import { ErrorState } from '@/components/states/ErrorState';
import { LoadingState } from '@/components/states/LoadingState';
import { Button } from '@/components/ui/button';
import { usePlan } from '@/hooks/usePlan';
import {
  DEFAULT_FILTERS,
  filtersFromParams,
  filtersToParams,
  hasActiveFilters,
  toApiQuery,
  type TaskFilters,
} from '@/lib/taskFilters';

type LoadState = 'loading' | 'ready' | 'error';
type PlanInfo = Map<string, { item: PlanItem; rank: number }>;

// Unfinished tasks first, in plan (priority) order. Tasks the plan doesn't know yet go after them, by deadline.
function compareTasks(a: Task, b: Task, planInfo: PlanInfo) {
  const aDone = a.status === 'done';
  const bDone = b.status === 'done';
  if (aDone !== bDone) return aDone ? 1 : -1;

  const aRank = planInfo.get(a.id)?.rank;
  const bRank = planInfo.get(b.id)?.rank;
  if (aRank !== undefined && bRank !== undefined) return aRank - bRank;
  if (aRank !== undefined) return -1;
  if (bRank !== undefined) return 1;
  return a.deadline.localeCompare(b.deadline);
}

export function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [total, setTotal] = useState(0);
  const [loadState, setLoadState] = useState<LoadState>('loading');
  // null: closed. {}: add a task. { task }: edit that task.
  const [editor, setEditor] = useState<{ task?: Task } | null>(null);
  const [deleting, setDeleting] = useState<Task | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const { state: planState, reload: reloadPlan } = usePlan();

  // The filters live in the address, so a filtered list can be bookmarked and Back works
  const [params, setParams] = useSearchParams();
  const paramText = params.toString();
  const filters = useMemo(() => filtersFromParams(new URLSearchParams(paramText)), [paramText]);
  const filtered = hasActiveFilters(filters);

  const changeFilters = useCallback(
    (changes: Partial<TaskFilters>) => {
      setParams((current) => filtersToParams({ ...filtersFromParams(current), ...changes }), {
        replace: true,
      });
    },
    [setParams],
  );
  const clearFilters = useCallback(
    () => changeFilters({ ...DEFAULT_FILTERS, sort: filters.sort }),
    [changeFilters, filters.sort],
  );

  // Only the newest request may update the list, so a slow old answer cannot overwrite a newer one
  const latestRequest = useRef(0);
  const loadTasks = useCallback(
    (quiet = false) => {
      const request = ++latestRequest.current;
      if (!quiet) setLoadState('loading');
      listTasks(toApiQuery(filters))
        .then((result) => {
          if (request !== latestRequest.current) return;
          setTasks(result.tasks);
          setTotal(result.total);
          setLoadState('ready');
        })
        .catch(() => {
          if (request === latestRequest.current) setLoadState('error');
        });
    },
    [filters],
  );

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  // The plan, looked up by task id, with each task's position in the priority order
  const planInfo = useMemo(() => {
    const info: PlanInfo = new Map();
    if (planState.status === 'ready') {
      planState.plan.items.forEach((item, rank) => info.set(item.taskId, { item, rank }));
    }
    return info;
  }, [planState]);

  // "Most urgent first" follows the plan; every other sort is the order the server gave
  const sortedTasks = useMemo(
    () =>
      filters.sort === 'priority' ? [...tasks].sort((a, b) => compareTasks(a, b, planInfo)) : tasks,
    [tasks, planInfo, filters.sort],
  );

  // After any change the list is fetched again, so it always matches the filters
  function handleSaved() {
    setEditor(null);
    loadTasks(true);
    reloadPlan();
  }

  function handleDeleted() {
    setDeleting(null);
    loadTasks(true);
    reloadPlan();
  }

  async function handleToggleDone(task: Task) {
    setBusyId(task.id);
    setActionError(null);
    try {
      await updateTask(task.id, { status: task.status === 'done' ? 'todo' : 'done' });
      loadTasks(true);
      reloadPlan();
    } catch (error) {
      setActionError(
        error instanceof ApiError ? error.message : 'Could not update the task. Please try again.',
      );
    } finally {
      setBusyId(null);
    }
  }

  const openTasks = tasks.filter((task) => task.status !== 'done');
  const hoursLeft = openTasks.reduce((sum, task) => sum + task.estimatedHours, 0);

  return (
    <main className="mx-auto max-w-3xl space-y-6 p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Tasks</h1>
          {loadState === 'ready' && tasks.length > 0 && (
            <p className="text-sm text-muted-foreground">
              {filtered && `Showing ${tasks.length} of ${total} · `}
              {openTasks.length} open · {tasks.length - openTasks.length} done · {hoursLeft} h of
              work left
            </p>
          )}
        </div>
        <Button onClick={() => setEditor({})}>
          <Plus />
          Add task
        </Button>
      </div>

      {actionError && <p className="text-sm text-destructive">{actionError}</p>}
      {loadState === 'loading' && <LoadingState />}
      {loadState === 'error' && (
        <ErrorState
          title="We could not load your tasks"
          message="Your tasks are safe. Check your connection and try again."
          onRetry={loadTasks}
        />
      )}
      {loadState === 'ready' && total > 0 && (
        <TaskFilterBar filters={filters} onChange={changeFilters} onClear={clearFilters} />
      )}
      {loadState === 'ready' && total === 0 && (
        <EmptyState
          icon={ListTodo}
          title="No tasks yet"
          description="Add your first deadline and StuddyPuddy will work out what to study and when."
          action={
            <Button onClick={() => setEditor({})}>
              <Plus />
              Add your first task
            </Button>
          }
        />
      )}
      {loadState === 'ready' && total > 0 && tasks.length === 0 && (
        <EmptyState
          icon={SearchX}
          title="No tasks match these filters"
          description="Try a different search, or clear the filters to see all your tasks."
          action={
            <Button variant="outline" onClick={clearFilters}>
              Clear filters
            </Button>
          }
        />
      )}
      {loadState === 'ready' && tasks.length > 0 && (
        <ul className="space-y-3">
          {sortedTasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              priority={planInfo.get(task.id)?.item}
              busy={busyId === task.id}
              onToggleDone={() => void handleToggleDone(task)}
              onEdit={() => setEditor({ task })}
              onDelete={() => setDeleting(task)}
            />
          ))}
        </ul>
      )}

      {editor && (
        <TaskDialog task={editor.task} onClose={() => setEditor(null)} onSaved={handleSaved} />
      )}
      {deleting && (
        <DeleteTaskDialog
          task={deleting}
          onClose={() => setDeleting(null)}
          onDeleted={handleDeleted}
        />
      )}
    </main>
  );
}
