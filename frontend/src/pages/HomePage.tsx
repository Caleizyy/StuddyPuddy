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
      <section className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-14 sm:px-6 md:grid-cols-[3fr_2fr] md:py-24">
        <div className="space-y-6">
          <h1 className="text-4xl leading-[1.08] font-semibold text-balance md:text-6xl">
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

      <section aria-labelledby="how" className="py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 id="how" className="text-3xl font-semibold md:text-4xl">
            How it works
          </h2>
          <ol className="mt-8 grid gap-5 md:grid-cols-3">
            {STEPS.map((step, index) => (
              <li key={step.title} className="space-y-3 rounded-2xl bg-card p-6">
                <span className="flex size-8 items-center justify-center rounded-full bg-primary font-heading text-base font-semibold text-primary-foreground">
                  {index + 1}
                </span>
                <h3 className="text-xl font-semibold">{step.title}</h3>
                <p className="text-muted-foreground">{step.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section aria-labelledby="features" className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <h2 id="features" className="text-3xl font-semibold md:text-4xl">
          Everything you need to stay on top of it
        </h2>
        <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, text }) => (
            <li key={title} className="space-y-2 rounded-2xl border border-border bg-card p-5">
              <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Icon className="size-5" aria-hidden />
              </span>
              <h3 className="text-lg font-semibold">{title}</h3>
              <p className="text-muted-foreground">{text}</p>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="privacy" className="bg-card py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 id="privacy" className="text-3xl font-semibold md:text-4xl">
            Your data, in your hands
          </h2>
          <ul className="mt-8 grid gap-6 md:grid-cols-2">
            {PRIVACY.map(({ icon: Icon, title, text }) => (
              <li key={title} className="flex gap-4">
                <Icon className="mt-1 size-6 shrink-0 text-primary" aria-hidden />
                <div>
                  <h3 className="text-lg font-semibold">{title}</h3>
                  <p className="text-muted-foreground">{text}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-semibold md:text-4xl">
            Ready for a calmer deadline season?
          </h2>
          <p className="mt-2 text-lg text-muted-foreground">
            It takes a minute to add your first task.
          </p>
          <Link
            to="/register"
            className="mt-6 inline-flex h-12 items-center rounded-lg bg-primary px-6 text-base font-medium text-primary-foreground hover:opacity-90"
          >
            Create a free account
          </Link>
        </div>
      </section>
    </main>
  );
}
