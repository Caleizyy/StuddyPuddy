import { CalendarCheck, Timer } from 'lucide-react';
import { Link } from 'react-router';
import type { Plan } from '@/api/plan';
import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { todaysFocus } from '@/lib/dashboard';

type Props = { plan: Plan; onLogTime: (taskId: string) => void };

export function TodayFocus({ plan, onLogTime }: Props) {
  const { entries, hours } = todaysFocus(plan);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between gap-2">
          <span className="flex items-center gap-2">
            <CalendarCheck className="size-4 text-primary" aria-hidden />
            Today&apos;s focus
          </span>
          {hours > 0 && (
            <span className="text-sm font-normal text-muted-foreground">{hours} h</span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {entries.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {plan.items.length === 0
              ? 'Nothing to study: you have no unfinished tasks.'
              : plan.schedule.length === 0
                ? 'No study time is set, so nothing can be planned.'
                : 'Nothing is planned for today. Enjoy the break, or get ahead on the plan.'}{' '}
            {plan.items.length > 0 && plan.schedule.length === 0 && (
              <Link to="/availability" className="text-primary underline">
                Set your hours
              </Link>
            )}
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {entries.map((entry) => (
              <li
                key={entry.taskId}
                className="flex flex-wrap items-center justify-between gap-2 py-2"
              >
                <div>
                  <p className="font-medium">{entry.title}</p>
                  {entry.item?.nextStep && (
                    <p className="text-sm text-muted-foreground">
                      Next topic: {entry.item.nextStep}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {entry.item?.atRisk && <Badge variant="destructive">At risk</Badge>}
                  <span className="text-sm text-muted-foreground">{entry.hours} h</span>
                  <button
                    type="button"
                    onClick={() => onLogTime(entry.taskId)}
                    className={buttonVariants({ variant: 'outline', size: 'sm' })}
                  >
                    <Timer />
                    Log time
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
