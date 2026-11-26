import { Link, Navigate } from 'react-router';
import { PlanPreview } from '@/components/landing/PlanPreview';
import { Ripple } from '@/components/layout/Logo';
import { FEATURES, PRIVACY, STEPS } from '@/components/landing/sections';
import { LoadingState } from '@/components/states/LoadingState';
import { buttonVariants } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { DEFAULT_PREFERENCES, pathForDefaultPage } from '@/lib/preferences';

// Each feature gets its own colour, the same colours the task categories use
const FEATURE_COLORS = [
  'bg-cat-homework',
  'bg-cat-lab',
  'bg-cat-exam',
  'bg-primary',
  'bg-cat-lab',
  'bg-cat-homework',
];

export function HomePage() {
  const { status, user } = useAuth();

  // Someone who is already signed in has no need for the introduction
  if (status === 'authenticated') {
    return (
      <Navigate
        to={pathForDefaultPage(user?.preferences.defaultPage ?? DEFAULT_PREFERENCES.defaultPage)}
        replace
      />
    );
  }
  if (status === 'loading') return <LoadingState label="Loading..." />;

  return (
    <main>
      <section className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-14 sm:px-6 md:grid-cols-[3fr_2fr] md:py-24">
        <div className="space-y-6">
          <h1 className="text-5xl leading-[1.02] font-extrabold text-balance md:text-7xl">
            Turn your deadlines into a plan you can follow.
          </h1>
          <p className="max-w-xl text-xl text-muted-foreground">
            Add your homework, exams and labs. StuddyPuddy ranks them by urgency and spreads the
            work over the days you can actually study.
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <Link to="/register" className={buttonVariants({ size: 'lg' })}>
              Create a free account
            </Link>
            <Link to="/login" className={buttonVariants({ variant: 'outline', size: 'lg' })}>
              Log in
            </Link>
          </div>
        </div>
        <PlanPreview />
      </section>

      <section aria-labelledby="how" className="bg-card py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 id="how" className="text-3xl font-extrabold md:text-4xl">
            How it works
          </h2>
          <ol className="mt-8 grid gap-5 md:grid-cols-3">
            {STEPS.map((step, index) => (
              <li key={step.title} className="space-y-3 rounded-2xl bg-secondary p-6">
                <span className="flex size-11 items-center justify-center rounded-full bg-accent font-heading text-xl font-extrabold text-accent-foreground">
                  {index + 1}
                </span>
                <h3 className="text-xl font-bold">{step.title}</h3>
                <p className="text-muted-foreground">{step.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section aria-labelledby="features" className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <h2 id="features" className="text-3xl font-extrabold md:text-4xl">
          Everything you need to stay on top of it
        </h2>
        <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, text }, index) => (
            <li key={title} className="space-y-2 rounded-2xl border border-border bg-card p-5">
              <span
                className={`flex size-10 items-center justify-center rounded-xl text-white ${FEATURE_COLORS[index % FEATURE_COLORS.length]}`}
              >
                <Icon className="size-5" aria-hidden />
              </span>
              <h3 className="text-lg font-bold">{title}</h3>
              <p className="text-muted-foreground">{text}</p>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="privacy" className="bg-card py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 id="privacy" className="text-3xl font-extrabold md:text-4xl">
            Your data, in your hands
          </h2>
          <ul className="mt-8 grid gap-6 md:grid-cols-2">
            {PRIVACY.map(({ icon: Icon, title, text }) => (
              <li key={title} className="flex gap-4">
                <Icon className="mt-1 size-6 shrink-0 text-primary" aria-hidden />
                <div>
                  <h3 className="text-lg font-bold">{title}</h3>
                  <p className="text-muted-foreground">{text}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="px-4 py-16 sm:px-6">
        <div className="sticker relative mx-auto max-w-4xl overflow-hidden rounded-3xl bg-hero p-8 text-center text-hero-foreground md:p-12">
          <Ripple className="pointer-events-none absolute -bottom-10 -left-8 size-56 text-white opacity-10" />
          <h2 className="relative text-3xl font-extrabold md:text-4xl">
            Ready for a calmer deadline season?
          </h2>
          <p className="relative mt-2 text-lg text-hero-foreground/85">
            It takes a minute to add your first task.
          </p>
          <Link
            to="/register"
            className="relative mt-6 inline-flex h-12 items-center rounded-xl bg-accent px-6 text-base font-bold text-accent-foreground transition-transform hover:-translate-y-0.5"
          >
            Create a free account
          </Link>
        </div>
      </section>
    </main>
  );
}
