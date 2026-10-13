import { Card, CardContent, CardHeader, CardTitle } from '../../@/components/ui/card';
import { useHealth } from '@/hooks/useHealth';

export function HomePage() {
  const health = useHealth();

  return (
    <main className="mx-auto max-w-xl p-8">
      <h1 className="mb-4 text-3xl font-bold">StuddyPuddy</h1>
      <Card>
        <CardHeader>
          <CardTitle>API status</CardTitle>
        </CardHeader>
        <CardContent>
          {health === 'loading' && 'Checking...'}
          {health === 'ok' && 'Backend is reachable'}
          {health === 'error' && 'Cannot reach the backend'}
        </CardContent>
      </Card>
    </main>
  );
}
