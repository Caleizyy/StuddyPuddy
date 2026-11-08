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
// The order the days are shown on screen: Monday first
const SHOWN_ORDER = [1, 2, 3, 4, 5, 6, 0];

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
        <CardTitle>Study hours per day</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          <ul className="space-y-3">
            {SHOWN_ORDER.map((weekday) => (
              <li key={weekday} className="space-y-1">
                <div className="flex items-center justify-between gap-4">
                  <Label htmlFor={`hours-${weekday}`}>{WEEKDAY_NAMES[weekday]}</Label>
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

          <p className="text-sm text-muted-foreground">Total: {weeklyTotal} h per week</p>

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
