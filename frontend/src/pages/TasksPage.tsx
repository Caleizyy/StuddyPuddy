import { useEffect, useState } from 'react';
import { listTasks, type Task } from '@/api/tasks';
import { TaskForm } from '@/components/tasks/TaskForm';
import { TaskList } from '@/components/tasks/TaskList';

type LoadState = 'loading' | 'ready' | 'error';

export function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loadState, setLoadState] = useState<LoadState>('loading');

  function byDeadline(a: Task, b: Task) {
    return a.deadline.localeCompare(b.deadline);
  }

  useEffect(() => {
    listTasks()
      .then((result) => {
        // Keep any task that was created while the list was still loading
        setTasks((current) => {
          const loadedIds = new Set(result.tasks.map((task) => task.id));
          const createdMeanwhile = current.filter((task) => !loadedIds.has(task.id));
          return [...result.tasks, ...createdMeanwhile].sort(byDeadline);
        });
        setLoadState('ready');
      })
      .catch(() => setLoadState('error'));
  }, []);

  // Add the new task and keep the list ordered by deadline
  function handleCreated(task: Task) {
    setTasks((current) => [...current, task].sort(byDeadline));
  }

  return (
    <main className="mx-auto max-w-3xl space-y-8 p-8">
      <h1 className="text-2xl font-semibold">Tasks</h1>
      <TaskForm onCreated={handleCreated} />

      <section aria-labelledby="your-tasks" className="space-y-3">
        <h2 id="your-tasks" className="text-lg font-medium">
          Your tasks
        </h2>
        {loadState === 'loading' && <p className="text-muted-foreground">Loading...</p>}
        {loadState === 'error' && (
          <p className="text-destructive">
            Could not load your tasks. Reload the page to try again.
          </p>
        )}
        {loadState === 'ready' && <TaskList tasks={tasks} />}
      </section>
    </main>
  );
}
