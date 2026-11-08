import { Link } from 'react-router';
import { PlanWarnings } from '@/components/plan/PlanWarnings';
import { useAuth } from '@/hooks/useAuth';
import { usePlan } from '@/hooks/usePlan';

export function DashboardPage() {
  const { user } = useAuth();
  const { state } = usePlan();

  return (
    <main className="mx-auto max-w-3xl space-y-6 p-8">
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="mt-1 text-muted-foreground">Welcome, {user?.name}.</p>
      </div>

      {state.status === 'ready' && <PlanWarnings plan={state.plan} />}
      {state.status === 'ready' && state.plan.warnings.length > 0 && (
        <Link to="/plan" className="text-sm text-primary underline">
          See the full plan
        </Link>
      )}
    </main>
  );
}
