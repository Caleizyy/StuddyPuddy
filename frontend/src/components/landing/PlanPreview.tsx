import { Ripple } from '@/components/layout/Logo';

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
      className="sticker relative overflow-hidden rounded-3xl bg-hero p-6 text-hero-foreground"
      aria-label="Example of a study plan"
    >
      <Ripple className="pointer-events-none absolute -right-8 -bottom-10 size-56 text-white opacity-10" />
      <figcaption className="relative flex items-center justify-between">
        <span className="font-heading text-lg font-bold">Today</span>
        <span className="rounded-full bg-white/20 px-3 py-0.5 text-xs font-bold">Example</span>
      </figcaption>

      <p className="relative mt-3 font-heading text-6xl leading-none font-extrabold">
        3<span className="ml-1 text-2xl font-bold">h</span>
      </p>

      <ul className="relative mt-5 space-y-2.5">
        {TODAY.map((task) => (
          <li key={task.title} className="flex items-center gap-3 rounded-2xl bg-white/12 p-3">
            <span aria-hidden className={`h-9 w-1.5 shrink-0 rounded-full ${task.stripe}`} />
            <div className="min-w-0 flex-1">
              <p className="font-semibold">{task.title}</p>
              <p className="text-sm text-hero-foreground/80">{task.note}</p>
            </div>
            <span className="font-heading text-xl font-extrabold">{task.hours} h</span>
          </li>
        ))}
      </ul>

      <dl className="relative mt-5 space-y-1 text-sm text-hero-foreground/85">
        {NEXT.map((day) => (
          <div key={day.label} className="flex gap-2">
            <dt className="w-24 shrink-0 font-bold">{day.label}</dt>
            <dd>{day.text}</dd>
          </div>
        ))}
      </dl>
    </figure>
  );
}
