import type { PlanItem, PriorityBand } from '@/api/plan';
import { PriorityBadge } from '@/components/plan/PriorityBadge';
import { Badge } from '@/components/ui/badge';
import { describeDeadline } from '@/lib/deadline';
import { cn } from '@/lib/utils';

export const BAND_STRIPE: Record<PriorityBand, string> = {
  high: 'bg-priority-high',
  medium: 'bg-priority-medium',
  low: 'bg-priority-low',
};

function hoursSummary(item: PlanItem): string {
  const logged = item.loggedHours > 0 ? `${item.loggedHours} h studied, ` : '';
  if (item.remainingHours === 0) return `${logged}nothing left to plan`;
  if (item.unscheduledHours === 0) return `${logged}${item.scheduledHours} h planned`;
  return `${logged}${item.scheduledHours} h planned, ${item.unscheduledHours} h do not fit`;
}

export function PriorityList({ items }: { items: PlanItem[] }) {
  return (
    <ol className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
      {items.map((item, index) => {
        const deadline = describeDeadline(item.deadline);
        const total = item.scheduledHours + item.unscheduledHours;
        return (
          <li key={item.taskId} className="flex">
            <span aria-hidden className={cn('w-1 shrink-0', BAND_STRIPE[item.band])} />
            <span className="flex w-12 shrink-0 items-center justify-center text-lg font-medium text-muted-foreground tabular-nums sm:w-14">
              {index + 1}
            </span>
            <div className="min-w-0 flex-1 py-4 pr-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <h3 className="font-heading text-lg leading-tight font-semibold">{item.title}</h3>
                <div className="flex flex-wrap items-center gap-2">
                  <PriorityBadge band={item.band} />
                  {item.atRisk && <Badge variant="destructive">At risk</Badge>}
                </div>
              </div>
              <p
                className={cn(
                  'mt-1 text-sm font-medium',
                  deadline.overdue ? 'text-destructive' : 'text-muted-foreground',
                )}
              >
                {deadline.label}
              </p>
              {item.unscheduledHours > 0 && total > 0 && (
                <div className="mt-2 flex h-2.5 overflow-hidden rounded-full bg-muted" aria-hidden>
                  <div
                    className="bg-primary"
                    style={{ width: `${(item.scheduledHours / total) * 100}%` }}
                  />
                  <div
                    className="bg-destructive"
                    style={{ width: `${(item.unscheduledHours / total) * 100}%` }}
                  />
                </div>
              )}
              <p className="mt-1.5 text-sm text-muted-foreground">{hoursSummary(item)}</p>
              {item.nextStep && (
                <p className="mt-1 text-sm">
                  <span className="text-muted-foreground">Next topic:</span>{' '}
                  <span className="font-semibold">{item.nextStep}</span>{' '}
                  <span className="text-muted-foreground">
                    ({item.stepsDone} of {item.stepsTotal} done)
                  </span>
                </p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
