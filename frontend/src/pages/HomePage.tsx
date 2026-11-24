import { Link, Navigate } from 'react-router';
import { PlanPreview } from '@/components/landing/PlanPreview';
import { FEATURES, PRIVACY, STEPS } from '@/components/landing/sections';
import { LoadingState } from '@/components/states/LoadingState';
import { buttonVariants } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { DEFAULT_PREFERENCES, pathForDefaultPage } from '@/lib/preferences';

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
      <section className="mx-auto grid max-w-5xl items-center gap-10 px-4 py-16 md:grid-cols-2 md:py-24">
        <div className="space-y-6">
          <h1 className="text-4xl font-bold tracking-tight text-balance md:text-5xl">
            Turn your deadlines into a plan you can follow.
          </h1>
          <p className="text-lg text-muted-foreground">
            Add your homework, exams and labs. StuddyPuddy ranks them by urgency and spreads the
            work over the days you can actually study.
          </p>
          <div className="flex flex-wrap gap-3">
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

      <section aria-labelledby="how" className="border-y border-border bg-card/40 py-16">
        <div className="mx-auto max-w-5xl px-4">
          <h2 id="how" className="text-2xl font-semibold">
            How it works
          </h2>
          <ol className="mt-8 grid gap-8 md:grid-cols-3">
            {STEPS.map((step, index) => (
              <li key={step.title} className="space-y-2">
                <span className="flex size-9 items-center justify-center rounded-full bg-primary/15 font-semibold text-primary">
                  {index + 1}
                </span>
                <h3 className="font-medium">{step.title}</h3>
                <p className="text-sm text-muted-foreground">{step.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section aria-labelledby="features" className="mx-auto max-w-5xl px-4 py-16">
        <h2 id="features" className="text-2xl font-semibold">
          Everything you need to stay on top of it
        </h2>
        <ul className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, text }) => (
            <li key={title} className="space-y-2 rounded-xl bg-card p-5 ring-1 ring-foreground/10">
              <Icon className="size-5 text-primary" aria-hidden />
              <h3 className="font-medium">{title}</h3>
              <p className="text-sm text-muted-foreground">{text}</p>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="privacy" className="border-t border-border bg-card/40 py-16">
        <div className="mx-auto max-w-5xl px-4">
          <h2 id="privacy" className="text-2xl font-semibold">
            Your data, in your hands
          </h2>
          <ul className="mt-8 grid gap-6 md:grid-cols-2">
            {PRIVACY.map(({ icon: Icon, title, text }) => (
              <li key={title} className="flex gap-3">
                <Icon className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden />
                <div>
                  <h3 className="font-medium">{title}</h3>
                  <p className="text-sm text-muted-foreground">{text}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="mx-auto max-w-3xl space-y-4 px-4 py-20 text-center">
        <h2 className="text-3xl font-semibold tracking-tight">
          Ready for a calmer deadline season?
        </h2>
        <p className="text-muted-foreground">It takes a minute to add your first task.</p>
        <Link to="/register" className={buttonVariants({ size: 'lg' })}>
          Create a free account
        </Link>
      </section>
    </main>
  );
}
