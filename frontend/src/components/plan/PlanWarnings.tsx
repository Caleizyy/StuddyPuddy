import { TriangleAlert } from 'lucide-react';
import type { Plan } from '@/api/plan';

export function PlanWarnings({ plan }: { plan: Plan }) {
  if (plan.warnings.length === 0) return null;

  return (
    <section role="alert" className="rounded-xl border border-destructive/40 bg-destructive/10 p-4">
      <h2 className="flex items-center gap-2 font-medium text-destructive">
        <TriangleAlert className="size-4" aria-hidden />
        Not everything fits before the deadlines
      </h2>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
        {plan.warnings.map((warning) => (
          <li key={warning.taskId}>{warning.message}</li>
        ))}
      </ul>
    </section>
  );
}
