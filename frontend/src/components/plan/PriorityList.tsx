import type { PlanItem } from '@/api/plan';
import { PriorityBadge } from '@/components/plan/PriorityBadge';
import { Badge } from '@/components/ui/badge';
import { describeDeadline } from '@/lib/deadline';
import { formatScore } from '@/lib/priority';

function hoursSummary(item: PlanItem): string {
  if (item.unscheduledHours === 0) return `${item.scheduledHours} h planned`;
  return `${item.scheduledHours} h planned, ${item.unscheduledHours} h do not fit`;
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
        </li>
      ))}
    </ol>
  );
}
