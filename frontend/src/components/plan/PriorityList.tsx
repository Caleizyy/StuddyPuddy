import type { PlanItem } from '@/api/plan';
import { PriorityBadge } from '@/components/plan/PriorityBadge';
import { Badge } from '@/components/ui/badge';
import { describeDeadline } from '@/lib/deadline';
import { formatScore } from '@/lib/priority';

function hoursSummary(item: PlanItem): string {
  const logged = item.loggedHours > 0 ? `${item.loggedHours} h studied, ` : '';
  if (item.remainingHours === 0) return `${logged}nothing left to plan`;
  if (item.unscheduledHours === 0) return `${logged}${item.scheduledHours} h planned`;
  return `${logged}${item.scheduledHours} h planned, ${item.unscheduledHours} h do not fit`;
}

export function PriorityList({ items }: { items: PlanItem[] }) {
  return (
    <ol className="space-y-3">
      {items.map((item, index) => (
        <li key={item.taskId} className="rounded-xl bg-card p-4 ring-1 ring-foreground/10">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="font-medium">
              <span className="mr-2 text-muted-foreground">{index + 1}.</span>
              {item.title}
            </h3>
            <div className="flex flex-wrap items-center gap-2">
              <PriorityBadge band={item.band} />
              {item.atRisk && <Badge variant="destructive">At risk</Badge>}
            </div>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {describeDeadline(item.deadline).label} · score {formatScore(item.priorityScore)} ·{' '}
            {hoursSummary(item)}
          </p>
          {item.nextStep && (
            <p className="mt-1 text-sm">
              <span className="text-muted-foreground">Next topic:</span> {item.nextStep}{' '}
              <span className="text-muted-foreground">
                ({item.stepsDone} of {item.stepsTotal} done)
              </span>
            </p>
          )}
        </li>
      ))}
    </ol>
  );
}
