import { TriangleAlert } from 'lucide-react';
import { Link } from 'react-router';
import type { Plan } from '@/api/plan';

export function PlanWarnings({ plan }: { plan: Plan }) {
  if (plan.warnings.length === 0) return null;

  return (
    <section
      role="alert"
      className="flex gap-4 rounded-2xl border border-l-8 border-destructive/40 border-l-destructive bg-card p-4 pr-5"
    >
      <TriangleAlert className="mt-1 size-6 shrink-0 text-destructive" aria-hidden />
      <div className="space-y-1">
        <h2 className="text-lg font-bold">Not everything fits before the deadlines</h2>
        <ul className="list-disc space-y-0.5 pl-5">
          {plan.warnings.map((warning) => (
            <li key={warning.taskId}>{warning.message}</li>
          ))}
        </ul>
        <p className="pt-1 text-sm text-muted-foreground">
          To fix it, add study hours on the{' '}
          <Link to="/availability" className="font-semibold text-primary hover:underline">
            Study hours
          </Link>{' '}
          page or move a deadline.
        </p>
      </div>
    </section>
  );
}
