import { useEffect, useState } from 'react';
import { getUsage, type Usage } from '@/api/admin';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type LoadState = { status: 'loading' } | { status: 'error' } | { status: 'ready'; usage: Usage };

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-3xl font-semibold">{value}</p>
      </CardContent>
    </Card>
  );
}

export function AdminPage() {
  const [state, setState] = useState<LoadState>({ status: 'loading' });

  useEffect(() => {
    getUsage()
      .then((result) => setState({ status: 'ready', usage: result.usage }))
      .catch(() => setState({ status: 'error' }));
  }, []);

  return (
    <main className="mx-auto max-w-4xl space-y-6 px-4 py-6 sm:px-6 md:py-8">
      <div>
        <h1 className="text-3xl font-semibold">Usage</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Totals across all accounts. This page shows counts only, never anyone&apos;s tasks, hours
          or personal details.
        </p>
      </div>

      {state.status === 'loading' && <p className="text-muted-foreground">Loading...</p>}
      {state.status === 'error' && (
        <p className="text-destructive">Could not load the usage numbers. Reload to try again.</p>
      )}
      {state.status === 'ready' && (
        <div className="grid gap-4 sm:grid-cols-3">
          <Stat label="Accounts" value={state.usage.accounts} />
          <Stat label="Open tasks" value={state.usage.tasks.open} />
          <Stat label="Finished tasks" value={state.usage.tasks.done} />
        </div>
      )}
    </main>
  );
}
