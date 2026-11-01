import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router';
import { ApiError } from '@/api/client';
import { registerUser } from '@/api/auth';
import { Button } from '../../@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../@/components/ui/card';
import { Input } from '../../@/components/ui/input';
import { Label } from '../../@/components/ui/label';

const registerSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(80, 'Name must be at most 80 characters'),
  email: z.string().trim().pipe(z.email('Enter a valid email address')),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

type RegisterForm = z.infer<typeof registerSchema>;

export function RegisterPage() {
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<RegisterForm>({ resolver: zodResolver(registerSchema) });

  async function onSubmit(values: RegisterForm) {
    try {
      await registerUser(values);
      navigate('/login', { state: { registered: true } });
    } catch (error) {
      if (error instanceof ApiError && Array.isArray(error.details)) {
        for (const detail of error.details as { field: string; message: string }[]) {
          setError(detail.field as keyof RegisterForm, { message: detail.message });
        }
        return;
      }
      setError('root', {
        message:
          error instanceof ApiError ? error.message : 'Something went wrong. Please try again.',
      });
    }
  }
  return (
    <main className="mx-auto max-w-md p-8">
      <Card>
        <CardHeader>
          <CardTitle>Create your account</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                autoComplete="name"
                aria-invalid={!!errors.name}
                {...register('name')}
              />
              {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
            </div>
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
              <Input
                id="password"
                type="password"
                autoComplete="new-password"
                aria-invalid={!!errors.password}
                {...register('password')}
              />
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password.message}</p>
              )}
            </div>
            {errors.root && <p className="text-sm text-destructive">{errors.root.message}</p>}
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Creating account...' : 'Create account'}
            </Button>
          </form>
          <p className="mt-4 text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link to="/login" className="text-primary underline">
              Log in
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
