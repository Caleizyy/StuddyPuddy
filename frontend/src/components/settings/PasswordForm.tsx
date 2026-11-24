import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { changePassword } from '@/api/account';
import { ApiError } from '@/api/client';
import { Button } from '@/components/ui/button';
import { FieldError } from '@/components/ui/field-error';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';

const schema = z
  .object({
    currentPassword: z.string().min(1, 'Enter your current password'),
    newPassword: z.string().min(8, 'Password must be at least 8 characters'),
    confirm: z.string(),
  })
  .refine((values) => values.newPassword === values.confirm, {
    path: ['confirm'],
    message: 'The two passwords do not match',
  });
type Values = z.infer<typeof schema>;

export function PasswordForm() {
  const { replaceToken } = useAuth();
  const [done, setDone] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<Values>({ resolver: zodResolver(schema) });

  async function onSubmit(values: Values) {
    setDone(false);
    try {
      const result = await changePassword({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });
      replaceToken(result.token); // other devices are signed out, this one stays
      reset();
      setDone(true);
    } catch (error) {
      if (error instanceof ApiError && Array.isArray(error.details)) {
        for (const detail of error.details as { field: string; message: string }[]) {
          const field = detail.field === 'password' ? 'currentPassword' : detail.field;
          if (field === 'currentPassword' || field === 'newPassword') {
            setError(field, { message: detail.message });
          }
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
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="currentPassword">Current password</Label>
        <Input
          id="currentPassword"
          type="password"
          autoComplete="current-password"
          aria-invalid={!!errors.currentPassword}
          {...register('currentPassword')}
        />
        <FieldError message={errors.currentPassword?.message} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="newPassword">New password</Label>
        <Input
          id="newPassword"
          type="password"
          autoComplete="new-password"
          aria-invalid={!!errors.newPassword}
          {...register('newPassword')}
        />
        <FieldError message={errors.newPassword?.message} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="confirm">Repeat the new password</Label>
        <Input
          id="confirm"
          type="password"
          autoComplete="new-password"
          aria-invalid={!!errors.confirm}
          {...register('confirm')}
        />
        <FieldError message={errors.confirm?.message} />
      </div>
      <FieldError message={errors.root?.message} />
      <div className="flex items-center gap-3">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Changing...' : 'Change password'}
        </Button>
        {done && (
          <span role="status" className="text-sm text-muted-foreground">
            Password changed. Other devices were signed out.
          </span>
        )}
      </div>
    </form>
  );
}
