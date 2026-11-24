import { useCallback, useEffect, useMemo, useState } from 'react';
import { GettingStarted } from '@/components/dashboard/GettingStarted';
import { StatTile } from '@/components/dashboard/StatTile';
import { StudyChart } from '@/components/dashboard/StudyChart';
import { TodayFocus } from '@/components/dashboard/TodayFocus';
import { Upcoming } from '@/components/dashboard/Upcoming';
import { PlanWarnings } from '@/components/plan/PlanWarnings';
import { ErrorState } from '@/components/states/ErrorState';
import { LoadingState } from '@/components/states/LoadingState';
import { LogTimeDialog } from '@/components/tasks/LogTimeDialog';
import { listTasks, type Task } from '@/api/tasks';
import { useAuth } from '@/hooks/useAuth';
import { usePlan } from '@/hooks/usePlan';
import { dashboardStats, firstNameOf, greetingFor } from '@/lib/dashboard';
import { hoursPerDay, localDateKey } from '@/lib/timeLog';

type TasksState = { status: 'loading' } | { status: 'error' } | { status: 'ready'; tasks: Task[] };

export function DashboardPage() {
  const { user } = useAuth();
  const { state: planState, reload: reloadPlan } = usePlan();
  const [tasksState, setTasksState] = useState<TasksState>({ status: 'loading' });
  const [loggingFor, setLoggingFor] = useState<Task | null>(null);

  const loadTasks = useCallback((quiet = false) => {
    if (!quiet) setTasksState({ status: 'loading' });
    listTasks()
      .then((result) => setTasksState({ status: 'ready', tasks: result.tasks }))
      .catch(() => setTasksState({ status: 'error' }));
  }, []);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const tasks = useMemo(
    () => (tasksState.status === 'ready' ? tasksState.tasks : []),
    [tasksState],
  );
  const stats = useMemo(() => {
    const studied = hoursPerDay(tasks, 7, localDateKey()).reduce((sum, day) => sum + day.hours, 0);
    return dashboardStats(tasks, studied);
  }, [tasks]);

  const hello = `${greetingFor(new Date().getHours())}${user ? `, ${firstNameOf(user.name)}` : ''}`;
  const today = new Date().toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  if (tasksState.status === 'loading') {
    return (
      <main className="mx-auto max-w-4xl p-8">
        <LoadingState label="Loading your dashboard..." />
      </main>
    );
  }
  if (tasksState.status === 'error') {
    return (
      <main className="mx-auto max-w-4xl p-8">
        <ErrorState
          title="We could not load your dashboard"
          message="Your tasks are safe. Check your connection and try again."
          onRetry={() => loadTasks()}
        />
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-4xl space-y-6 p-8">
      <div>
        <h1 className="text-2xl font-semibold">{hello}</h1>
        <p className="mt-1 text-muted-foreground">{today}</p>
      </div>

      {tasks.length === 0 ? (
        <GettingStarted />
      ) : (
        <>
          <section aria-label="Summary" className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <StatTile label="Open tasks" value={stats.open} />
            <StatTile label="Hours left" value={`${stats.hoursLeft} h`} hint="after time logged" />
            <StatTile
              label="Due in 7 days"
              value={stats.dueThisWeek}
              hint={stats.overdue > 0 ? `${stats.overdue} overdue` : undefined}
              tone={stats.overdue > 0 ? 'warning' : 'normal'}
            />
            <StatTile label="Studied this week" value={`${stats.studiedThisWeek} h`} />
          </section>

          {planState.status === 'ready' && <PlanWarnings plan={planState.plan} />}
          {planState.status === 'error' && (
            <ErrorState
              title="We could not load your plan"
              message={planState.message}
              onRetry={reloadPlan}
            />
          )}

          <div className="grid gap-6 md:grid-cols-2">
            {planState.status === 'ready' && (
              <TodayFocus
                plan={planState.plan}
                onLogTime={(taskId) =>
                  setLoggingFor(tasks.find((task) => task.id === taskId) ?? null)
                }
              />
            )}
            <Upcoming tasks={tasks} />
          </div>
          <StudyChart tasks={tasks} />
        </>
      )}

      {loggingFor && (
        <LogTimeDialog
          task={loggingFor}
          onClose={() => setLoggingFor(null)}
          onChanged={() => {
            loadTasks(true);
            reloadPlan();
          }}
        />
      )}
    </main>
  );
}
