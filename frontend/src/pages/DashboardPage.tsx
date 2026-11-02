import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';

export function DashboardPage() {
  const { user, logout } = useAuth();

  return (
    <main className="mx-auto max-w-3xl p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground">{user?.name}</span>
          <Button variant="outline" onClick={() => void logout()}>
            Log out
          </Button>
        </div>
      </div>
    </main>
  );
}
