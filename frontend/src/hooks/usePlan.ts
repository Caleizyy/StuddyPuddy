import { useCallback, useEffect, useRef, useState } from 'react';
import { ApiError } from '@/api/client';
import { getPlan, type Plan } from '@/api/plan';

export type PlanState =
  { status: 'loading' } | { status: 'error'; message: string } | { status: 'ready'; plan: Plan };

export function usePlan() {
  const [state, setState] = useState<PlanState>({ status: 'loading' });
  // Counts how many requests have been started. Only the newest one may update the state.
  const latestRequest = useRef(0);

  const reload = useCallback(() => {
    latestRequest.current += 1;
    const thisRequest = latestRequest.current;

    // The current plan stays on screen while a fresh one loads. Only an error screen goes back to "loading".
    setState((current) => (current.status === 'error' ? { status: 'loading' } : current));

    getPlan()
      .then((result) => {
        if (thisRequest !== latestRequest.current) return; // a newer request has started, ignore this one
        setState({ status: 'ready', plan: result.plan });
      })
      .catch((error: unknown) => {
        if (thisRequest !== latestRequest.current) return; // same check for errors
        setState({
          status: 'error',
          message:
            error instanceof ApiError
              ? error.message
              : 'Could not load your plan. Please try again.',
        });
      });
  }, []);

  useEffect(() => {
    reload();
    // When the page closes, bump the counter so a late response can't touch the unmounted page
    return () => {
      latestRequest.current += 1;
    };
  }, [reload]);

  return { state, reload };
}
