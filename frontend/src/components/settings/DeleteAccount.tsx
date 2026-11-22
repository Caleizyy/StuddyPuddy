import { useState } from 'react';
import { useNavigate } from 'react-router';
import { deleteMyAccount } from '@/api/account';
import { ApiError } from '@/api/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';

// Deleting is permanent, so it takes two steps: open the form, then confirm with the password
export function DeleteAccount() {
  const { endSession } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function confirm(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await deleteMyAccount(password);
      endSession();
      void navigate('/', { replace: true });
    } catch (failure) {
      setError(
        failure instanceof ApiError ? failure.message : 'Something went wrong. Please try again.',
      );
      setBusy(false);
    }
  }

  if (!open) {
    return (
      <Button variant="outline" className="text-destructive" onClick={() => setOpen(true)}>
        Delete my account...
      </Button>
    );
  }

  return (
    <form onSubmit={(event) => void confirm(event)} className="space-y-3">
      <p className="text-sm">
        This permanently deletes your account, tasks and availability. It cannot be undone.
      </p>
      <div className="space-y-2">
        <Label htmlFor="deletePassword">Your password</Label>
        <Input
          id="deletePassword"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
      </div>
      <div className="flex gap-2">
        <Button type="submit" variant="destructive" disabled={busy || password === ''}>
          {busy ? 'Deleting...' : 'Delete everything'}
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={() => {
            setOpen(false);
            setPassword('');
            setError(null);
          }}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
