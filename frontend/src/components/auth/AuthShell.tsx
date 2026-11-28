import type { ReactNode } from 'react';
import { CalendarCheck, ListChecks, TriangleAlert } from 'lucide-react';
import { PlanPreview } from '@/components/landing/PlanPreview';

type Props = {
  title: string;
  subtitle: string;
  // What the right-hand panel says. Each page picks the message that fits the moment.
  pitch: { heading: string; points: 'login' | 'register' };
  children: ReactNode;
};

const REGISTER_POINTS = [
  { icon: ListChecks, text: 'Add a deadline with a rough estimate of the hours it needs.' },
  { icon: CalendarCheck, text: 'Get a day-by-day plan that fits the hours you really have.' },
  { icon: TriangleAlert, text: 'Hear early when something will not fit, not the night before.' },
];

// Two columns on a wide screen: the form, and a quiet panel showing what the app gives you.
// On a phone only the form is shown.
export function AuthShell({ title, subtitle, pitch, children }: Props) {
  return (
    <main className="grid min-h-[calc(100vh-4rem)] md:grid-cols-2">
      <div className="flex items-center justify-center px-4 py-10 sm:px-8">
        <div className="w-full max-w-sm">
          <h1 className="text-3xl font-semibold">{title}</h1>
          <p className="mt-2 text-muted-foreground">{subtitle}</p>
          <div className="mt-8">{children}</div>
        </div>
      </div>

      <aside
        aria-hidden
        className="hidden flex-col justify-center gap-8 bg-[linear-gradient(160deg,color-mix(in_oklch,var(--primary),transparent_88%),color-mix(in_oklch,var(--primary),transparent_96%))] px-10 py-12 md:flex lg:px-16"
      >
        <h2 className="max-w-md text-3xl leading-tight font-semibold text-balance">
          {pitch.heading}
        </h2>
        {pitch.points === 'login' ? (
          <div className="max-w-md">
            <PlanPreview />
          </div>
        ) : (
          <ul className="max-w-md space-y-5">
            {REGISTER_POINTS.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-start gap-4">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-card text-primary shadow-sm">
                  <Icon className="size-5" />
                </span>
                <span className="pt-2 text-lg">{text}</span>
              </li>
            ))}
          </ul>
        )}
      </aside>
    </main>
  );
}
