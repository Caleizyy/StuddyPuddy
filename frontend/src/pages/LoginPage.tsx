import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useLocation, useNavigate, Navigate } from 'react-router';
import { ApiError } from '@/api/client';
import { AuthShell } from '@/components/auth/AuthShell';
import { PasswordInput } from '@/components/auth/PasswordInput';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { DEFAULT_PREFERENCES, pathForDefaultPage } from '@/lib/preferences';

// Where to go after logging in: the page the user was sent away from, or the dashboard
function destinationFrom(state: unknown): string | null {
  const from = (state as { from?: unknown } | null)?.from;
  const isSafePath =
    typeof from === 'string' && from.startsWith('/') && !from.startsWith('//') && from !== '/login';
  return isSafePath ? from : null;
}

const loginSchema = z.object({
  email: z.string().trim().min(1, 'Email is required'),
  password: z.string().min(1, 'Password is required'),
});

type LoginForm = z.infer<typeof loginSchema>;

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, status, user } = useAuth();
  const state = location.state as { from?: string; registered?: boolean } | null;
  const requested = destinationFrom(location.state);
  // Without a page to return to, open the page the user chose in their settings
  const fallback = pathForDefaultPage(
    user?.preferences.defaultPage ?? DEFAULT_PREFERENCES.defaultPage,
  );

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({ resolver: zodResolver(loginSchema) });

  async function onSubmit(values: LoginForm) {
    try {
      const loggedIn = await login(values.email, values.password);
      void navigate(requested ?? pathForDefaultPage(loggedIn.preferences.defaultPage), {
        replace: true,
      });
    } catch (error) {
      setError('root', {
        message:
          error instanceof ApiError ? error.message : 'Something went wrong. Please try again.',
      });
    }
  }

  if (status === 'authenticated') return <Navigate to={requested ?? fallback} replace />;
  return (
    <AuthShell
      title="Welcome back"
      subtitle="Log in to see what to study today."
      pitch={{ heading: 'Your plan is waiting for you.', points: 'login' }}
    >
      {state?.registered && (
        <p role="status" className="mb-4 rounded-lg bg-muted p-3 text-sm">
          Account created. Log in to get started.
        </p>
      )}
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            aria-invalid={!!errors.email}
            {...register('email')}
          />
          {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <PasswordInput
            id="password"
            autoComplete="current-password"
            aria-invalid={!!errors.password}
            {...register('password')}
          />
          {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
        </div>
        {errors.root && <p className="text-sm text-destructive">{errors.root.message}</p>}
        <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? 'Logging in...' : 'Log in'}
        </Button>
      </form>
      <p className="mt-6 text-sm text-muted-foreground">
        No account yet?{' '}
        <Link to="/register" className="font-medium text-primary hover:underline">
          Create one
        </Link>
      </p>
    </AuthShell>
  );
}
