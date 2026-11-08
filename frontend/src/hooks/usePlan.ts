import { useCallback, useEffect, useState } from 'react';
import { ApiError } from '@/api/client';
import { getPlan, type Plan } from '@/api/plan';

export type PlanState =
  { status: 'loading' } | { status: 'error'; message: string } | { status: 'ready'; plan: Plan };

export function usePlan() {
  const [state, setState] = useState<PlanState>({ status: 'loading' });

  const reload = useCallback(() => {
    // The current plan stays on screen while a fresh one loads. Only an error screen goes back to "loading".
    setState((current) => (current.status === 'error' ? { status: 'loading' } : current));
    getPlan()
      .then((result) => setState({ status: 'ready', plan: result.plan }))
      .catch((error: unknown) =>
        setState({
          status: 'error',
          message:
            error instanceof ApiError
              ? error.message
              : 'Could not load your plan. Please try again.',
        }),
      );
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  return { state, reload };
}
