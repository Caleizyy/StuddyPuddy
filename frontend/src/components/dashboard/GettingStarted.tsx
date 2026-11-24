import { Link } from 'react-router';
import { buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const STEPS = [
  {
    title: 'Add your deadlines',
    text: 'Homework, exams, quizzes and labs, with a rough estimate of the hours each needs.',
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
    text: 'StuddyPuddy ranks your tasks and spreads the work over the days before each deadline.',
    to: '/plan',
    action: 'See the plan',
  },
];

// Shown to someone with no tasks yet: what to do first
export function GettingStarted() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Let&apos;s get you started</CardTitle>
      </CardHeader>
      <CardContent>
        <ol className="space-y-4">
          {STEPS.map((step, index) => (
            <li key={step.title} className="flex gap-3">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/15 text-sm font-semibold text-primary">
                {index + 1}
              </span>
              <div className="space-y-1">
                <p className="font-medium">{step.title}</p>
                <p className="text-sm text-muted-foreground">{step.text}</p>
                <Link to={step.to} className={buttonVariants({ variant: 'outline', size: 'sm' })}>
                  {step.action}
                </Link>
              </div>
            </li>
          ))}
        </ol>
      </CardContent>
    </Card>
  );
}
