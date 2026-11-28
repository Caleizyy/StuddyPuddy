import { Link } from 'react-router';
import { buttonVariants } from '@/components/ui/button';

const STEPS = [
  {
    title: 'Add your deadlines',
    text: 'Homework, exams, quizzes and labs, with a rough guess of the hours each needs.',
    to: '/tasks',
    action: 'Add a task',
  },
  {
    title: 'Tell us when you can study',
    text: 'Set the hours you have on each day of the week.',
    to: '/availability',
    action: 'Set your hours',
  },
  {
    title: 'Follow the plan',
    text: 'We rank your tasks and spread the work over the days before each deadline.',
    to: '/plan',
    action: 'See the plan',
  },
];

// Shown to someone with no tasks yet. The steps really are in order, so they are numbered.
export function GettingStarted() {
  return (
    <section aria-label="Getting started" className="space-y-4">
      <h2 className="text-2xl font-semibold">Three steps and you have a plan</h2>
      <ol className="grid gap-4 md:grid-cols-3">
        {STEPS.map((step, index) => (
          <li
            key={step.title}
            className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-5"
          >
            <span className="flex size-8 items-center justify-center rounded-full bg-primary font-heading text-base font-semibold text-primary-foreground">
              {index + 1}
            </span>
            <p className="font-heading text-lg font-semibold">{step.title}</p>
            <p className="flex-1 text-muted-foreground">{step.text}</p>
            <Link
              to={step.to}
              className={buttonVariants({ variant: index === 0 ? 'default' : 'outline' })}
            >
              {step.action}
            </Link>
          </li>
        ))}
      </ol>
    </section>
  );
}
