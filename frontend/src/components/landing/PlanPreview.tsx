import { Badge } from '@/components/ui/badge';
import { PriorityBadge } from '@/components/plan/PriorityBadge';

// A small made-up example of the plan, so a visitor sees what the app gives them.
// It is static on purpose: no account and no server needed.
const TASKS = [
  { title: 'Programming lab', due: 'in 2 days', band: 'high' as const, hours: '3 h' },
  { title: 'Maths exam', due: 'in 5 days', band: 'medium' as const, hours: '6 h' },
  { title: 'History essay', due: 'in 9 days', band: 'low' as const, hours: '4 h' },
];

const DAYS = [
  { label: 'Today', items: [['Programming lab', '2 h']] },
  {
    label: 'Tomorrow',
    items: [
      ['Programming lab', '1 h'],
      ['Maths exam', '1 h'],
    ],
  },
  { label: 'Wednesday', items: [['Maths exam', '2 h']] },
];

export function PlanPreview() {
  return (
    <figure
      className="rounded-2xl bg-card p-5 text-sm ring-1 ring-foreground/10 shadow-lg"
      aria-label="Example of a study plan"
    >
      <figcaption className="mb-3 flex items-center justify-between">
        <span className="font-medium">Your plan</span>
        <Badge variant="outline">Example</Badge>
      </figcaption>

      <ol className="space-y-2">
        {TASKS.map((task, index) => (
          <li
            key={task.title}
            className="flex items-center justify-between gap-2 rounded-lg bg-muted/60 px-3 py-2"
          >
            <span>
              <span className="mr-2 text-muted-foreground">{index + 1}.</span>
              {task.title}
              <span className="ml-2 text-muted-foreground">due {task.due}</span>
            </span>
            <span className="flex items-center gap-2">
              <PriorityBadge band={task.band} />
              <span className="whitespace-nowrap text-muted-foreground">{task.hours}</span>
            </span>
          </li>
        ))}
      </ol>

      <div className="mt-4 grid gap-2 sm:grid-cols-3">
        {DAYS.map((day) => (
          <div key={day.label} className="rounded-lg border border-border p-3">
            <p className="mb-1 font-medium">{day.label}</p>
            <ul className="space-y-0.5 text-muted-foreground">
              {day.items.map(([title, hours]) => (
                <li key={title} className="flex justify-between gap-2">
                  <span>{title}</span>
                  <span className="whitespace-nowrap">{hours}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </figure>
  );
}
