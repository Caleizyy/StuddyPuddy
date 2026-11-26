// A small made-up example of today's plan, so a visitor sees what the app gives them.
// It is static on purpose: no account and no server needed.
const TODAY = [
  { title: 'Programming lab', hours: 2, note: 'Due in 2 days', stripe: 'bg-cat-lab' },
  { title: 'Maths exam', hours: 1, note: 'Start with: derivatives', stripe: 'bg-cat-exam' },
];

const NEXT = [
  { label: 'Tomorrow', text: 'Programming lab 1 h, Maths exam 1 h' },
  { label: 'Wednesday', text: 'Maths exam 2 h' },
];

export function PlanPreview() {
  return (
    <figure
      className="rounded-2xl border border-border bg-card p-6 shadow-sm"
      aria-label="Example of a study plan"
    >
      <figcaption className="flex items-center justify-between">
        <span className="font-heading text-lg font-semibold">Today</span>
        <span className="rounded-full bg-muted px-3 py-0.5 text-xs font-medium text-muted-foreground">
          Example
        </span>
      </figcaption>

      <p className="mt-3 font-heading text-5xl leading-none font-semibold">
        3<span className="ml-1 text-xl font-medium text-muted-foreground">h</span>
      </p>

      <ul className="mt-5 divide-y divide-border rounded-xl border border-border">
        {TODAY.map((task) => (
          <li key={task.title} className="flex items-center gap-3 p-3">
            <span aria-hidden className={`h-9 w-1.5 shrink-0 rounded-full ${task.stripe}`} />
            <div className="min-w-0 flex-1">
              <p className="font-medium">{task.title}</p>
              <p className="text-sm text-muted-foreground">{task.note}</p>
            </div>
            <span className="font-heading text-lg font-semibold">{task.hours} h</span>
          </li>
        ))}
      </ul>

      <dl className="mt-5 space-y-1 text-sm text-muted-foreground">
        {NEXT.map((day) => (
          <div key={day.label} className="flex gap-2">
            <dt className="w-24 shrink-0 font-medium text-foreground">{day.label}</dt>
            <dd>{day.text}</dd>
          </div>
        ))}
      </dl>
    </figure>
  );
}
