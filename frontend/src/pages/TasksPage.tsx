import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { ApiError } from '@/api/client';
import { listTasks, updateTask, type Task } from '@/api/tasks';
import { DeleteTaskDialog } from '@/components/tasks/DeleteTaskDialog';
import { TaskCard } from '@/components/tasks/TaskCard';
import { TaskDialog } from '@/components/tasks/TaskDialog';
import { Button } from '@/components/ui/button';

type LoadState = 'loading' | 'ready' | 'error';

// Unfinished tasks first, then by deadline
function sortTasks(a: Task, b: Task) {
  const aDone = a.status === 'done';
  const bDone = b.status === 'done';
  if (aDone !== bDone) return aDone ? 1 : -1;
  return a.deadline.localeCompare(b.deadline);
}

// Replaces the task with the same id, or adds it when it is new
function upsert(list: Task[], task: Task): Task[] {
  return [...list.filter((item) => item.id !== task.id), task].sort(sortTasks);
}

export function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loadState, setLoadState] = useState<LoadState>('loading');
  // null: closed. {}: add a task. { task }: edit that task.
  const [editor, setEditor] = useState<{ task?: Task } | null>(null);
  const [deleting, setDeleting] = useState<Task | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    listTasks()
      .then((result) => {
        // Keep any task that was created while the list was still loading
        setTasks((current) => {
          const loadedIds = new Set(result.tasks.map((task) => task.id));
          const createdMeanwhile = current.filter((task) => !loadedIds.has(task.id));
          return [...result.tasks, ...createdMeanwhile].sort(sortTasks);
        });
        setLoadState('ready');
      })
      .catch(() => setLoadState('error'));
  }, []);

  function handleSaved(task: Task) {
    setTasks((current) => upsert(current, task));
    setEditor(null);
  }

  function handleDeleted(taskId: string) {
    setTasks((current) => current.filter((task) => task.id !== taskId));
    setDeleting(null);
  }

  async function handleToggleDone(task: Task) {
    setBusyId(task.id);
    setActionError(null);
    try {
      const result = await updateTask(task.id, {
        status: task.status === 'done' ? 'todo' : 'done',
      });
      setTasks((current) => upsert(current, result.task));
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
      {loadState === 'loading' && <p className="text-muted-foreground">Loading...</p>}
      {loadState === 'error' && (
        <p className="text-destructive">Could not load your tasks. Reload the page to try again.</p>
      )}
      {loadState === 'ready' && tasks.length === 0 && (
        <div className="rounded-xl border border-dashed border-border p-8 text-center">
          <p className="text-muted-foreground">No tasks yet. Add your first one to get started.</p>
        </div>
      )}
      {loadState === 'ready' && tasks.length > 0 && (
        <ul className="space-y-3">
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
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
