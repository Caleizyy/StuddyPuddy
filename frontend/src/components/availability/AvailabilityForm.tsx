import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { saveAvailability, type WeeklyHours } from '@/api/availability';
import { ApiError } from '@/api/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FieldError } from '@/components/ui/field-error';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { DEFAULT_PREFERENCES, weekdayOrder } from '@/lib/preferences';

// Index 0 is Sunday, because that is how the planner counts
const WEEKDAY_NAMES = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

const availabilitySchema = z.object({
  hours: z
    .array(
      z
        .number({ error: 'Enter a number' })
        .min(0, 'Cannot be negative')
        .max(24, 'A day has only 24 hours')
        .refine((hours) => hours % 0.25 === 0, 'Use steps of 0.25 hours'),
    )
    .length(7),
});

type AvailabilityValues = z.infer<typeof availabilitySchema>;

export function AvailabilityForm({ initial }: { initial: WeeklyHours }) {
  const [justSaved, setJustSaved] = useState(false);
  const { user } = useAuth();
  // The order the days are shown on screen follows the week start in the settings
  const SHOWN_ORDER = weekdayOrder(user?.preferences.weekStart ?? DEFAULT_PREFERENCES.weekStart);
  const {
    register,
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<AvailabilityValues>({
    resolver: zodResolver(availabilitySchema),
    defaultValues: { hours: initial },
  });

  const hours = useWatch({ control, name: 'hours' });
  const weeklyTotal = hours.reduce((sum, value) => sum + (Number.isFinite(value) ? value : 0), 0);

  async function onSubmit(values: AvailabilityValues) {
    setJustSaved(false);
    try {
      const result = await saveAvailability(values.hours);
      reset({ hours: result.hoursByWeekday }); // the saved values become the new starting point
      setJustSaved(true);
    } catch (error) {
      if (error instanceof ApiError && Array.isArray(error.details)) {
        for (const detail of error.details as { field: string; message: string }[]) {
          // The server calls the list "hoursByWeekday", the form calls it "hours"
          const field = detail.field.replace('hoursByWeekday', 'hours');
          setError(field as `hours.${number}`, { message: detail.message });
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
    <Card>
      <CardHeader>
        <CardTitle>Your typical week</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          <ul className="space-y-3">
            {SHOWN_ORDER.map((weekday) => (
              <li key={weekday} className="space-y-1">
                <div className="flex items-center gap-3">
                  <Label
                    htmlFor={`hours-${weekday}`}
                    className="w-24 shrink-0 text-base font-semibold"
                  >
                    {WEEKDAY_NAMES[weekday]}
                  </Label>
                  {/* The bar shows the day at a glance and follows what is typed */}
                  <div className="h-3 flex-1 overflow-hidden rounded-full bg-muted" aria-hidden>
                    <div
                      className="h-full rounded-full bg-primary transition-[width]"
                      style={{
                        width: `${Math.min(100, ((Number.isFinite(hours[weekday]) ? hours[weekday] : 0) / 10) * 100)}%`,
                      }}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      id={`hours-${weekday}`}
                      type="number"
                      min={0}
                      max={24}
                      step={0.25}
                      className="w-24"
                      aria-invalid={!!errors.hours?.[weekday]}
                      {...register(`hours.${weekday}` as const, { valueAsNumber: true })}
                    />
                    <span className="text-sm text-muted-foreground">h</span>
                  </div>
                </div>
                <FieldError message={errors.hours?.[weekday]?.message} />
              </li>
            ))}
          </ul>

          <p className="font-semibold">{weeklyTotal} h of study time in a typical week</p>

          <FieldError message={errors.root?.message} />
          <div className="flex items-center gap-3">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save'}
            </Button>
            <span role="status" className="text-sm text-muted-foreground">
              {justSaved && !isDirty ? 'Saved' : ''}
            </span>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
