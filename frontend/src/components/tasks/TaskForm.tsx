import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ApiError } from '@/api/client';
import { createTask, updateTask, type Task, type TaskChanges } from '@/api/tasks';
import { Button } from '@/components/ui/button';
import { DatePicker } from '@/components/ui/date-picker';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CATEGORY_LABELS, STATUS_LABELS, TASK_CATEGORIES, TASK_STATUSES } from '@/lib/taskOptions';

const taskFormSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'Title is required')
    .max(120, 'Title must be at most 120 characters'),
  category: z.enum(TASK_CATEGORIES, { error: 'Pick a category' }),
  deadline: z.string().min(1, 'Deadline is required'),
  moduleCount: z
    .number({ error: 'Enter a whole number' })
    .int('Enter a whole number')
    .min(1, 'At least 1 module'),
  estimatedHours: z
    .number({ error: 'Enter the estimated hours' })
    .min(0.25, 'At least 0.25 hours')
    .max(1000, 'At most 1000 hours')
    .refine((hours) => hours % 0.25 === 0, 'Use steps of 0.25 hours'),
  status: z.enum(TASK_STATUSES),
});

type TaskFormValues = z.infer<typeof taskFormSchema>;

const emptyForm: TaskFormValues = {
  title: '',
  category: 'homework',
  deadline: '',
  moduleCount: 1,
  estimatedHours: 1,
  status: 'todo',
};

// The form edits an existing task by starting from its values
function valuesFromTask(task: Task): TaskFormValues {
  return {
    title: task.title,
    category: task.category,
    deadline: task.deadline.slice(0, 10), // 2026-12-01T12:00:00.000Z -> 2026-12-01
    moduleCount: task.moduleCount,
    estimatedHours: task.estimatedHours,
    status: task.status,
  };
}

// The select shows the label ("Not completed") but the form keeps the value ("todo")
const categoryItems = TASK_CATEGORIES.map((value) => ({ value, label: CATEGORY_LABELS[value] }));
const statusItems = TASK_STATUSES.map((value) => ({ value, label: STATUS_LABELS[value] }));

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-sm text-destructive">{message}</p>;
}

type TaskFormProps = {
  task?: Task; // given: edit this task. Missing: add a new one.
  onSaved: (task: Task) => void;
  onCancel: () => void;
};

export function TaskForm({ task, onSaved, onCancel }: TaskFormProps) {
  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting, dirtyFields },
  } = useForm<TaskFormValues>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: task ? valuesFromTask(task) : emptyForm,
  });

  async function onSubmit(values: TaskFormValues) {
    try {
      if (!task) {
        // The date picker gives 2026-12-01. We store it as noon UTC that day,
        // so the day count in the planner is the same in every time zone.
        const created = await createTask({
          ...values,
          deadline: `${values.deadline}T12:00:00.000Z`,
        });
        onSaved(created.task);
        return;
      }

      // Editing: send only the fields the user changed, so an old value in this form
      // cannot overwrite a newer change made elsewhere (for example in another tab)
      const changes: TaskChanges = {};
      if (dirtyFields.title) changes.title = values.title;
      if (dirtyFields.category) changes.category = values.category;
      if (dirtyFields.deadline) changes.deadline = `${values.deadline}T12:00:00.000Z`;
      if (dirtyFields.moduleCount) changes.moduleCount = values.moduleCount;
      if (dirtyFields.estimatedHours) changes.estimatedHours = values.estimatedHours;
      if (dirtyFields.status) changes.status = values.status;

      if (Object.keys(changes).length === 0) {
        onCancel(); // nothing was changed, so there is nothing to save
        return;
      }

      const updated = await updateTask(task.id, changes);
      onSaved(updated.task);
    } catch (error) {
      if (error instanceof ApiError && Array.isArray(error.details)) {
        for (const detail of error.details as { field: string; message: string }[]) {
          setError(detail.field as keyof TaskFormValues, { message: detail.message });
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
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="grid gap-4 sm:grid-cols-2">
      <div className="space-y-2 sm:col-span-2">
        <Label htmlFor="title">Title</Label>
        <Input id="title" aria-invalid={!!errors.title} {...register('title')} />
        <FieldError message={errors.title?.message} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="category">Category</Label>
        <Controller
          control={control}
          name="category"
          render={({ field }) => (
            <Select
              items={categoryItems}
              value={field.value}
              onValueChange={(value) => {
                if (value) field.onChange(value);
              }}
            >
              <SelectTrigger id="category" className="w-full" aria-invalid={!!errors.category}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categoryItems.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        <FieldError message={errors.category?.message} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="deadline">Deadline</Label>
        <Controller
          control={control}
          name="deadline"
          render={({ field }) => (
            <DatePicker
              id="deadline"
              value={field.value}
              onChange={field.onChange}
              invalid={!!errors.deadline}
            />
          )}
        />
        <FieldError message={errors.deadline?.message} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="moduleCount">Modules or topics</Label>
        <Input
          id="moduleCount"
          type="number"
          min={1}
          step={1}
          aria-invalid={!!errors.moduleCount}
          {...register('moduleCount', { valueAsNumber: true })}
        />
        <FieldError message={errors.moduleCount?.message} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="estimatedHours">Estimated hours</Label>
        <Input
          id="estimatedHours"
          type="number"
          min={0.25}
          step={0.25}
          aria-invalid={!!errors.estimatedHours}
          {...register('estimatedHours', { valueAsNumber: true })}
        />
        <FieldError message={errors.estimatedHours?.message} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="status">Status</Label>
        <Controller
          control={control}
          name="status"
          render={({ field }) => (
            <Select
              items={statusItems}
              value={field.value}
              onValueChange={(value) => {
                if (value) field.onChange(value);
              }}
            >
              <SelectTrigger id="status" className="w-full" aria-invalid={!!errors.status}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {statusItems.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        <FieldError message={errors.status?.message} />
      </div>

      <div className="space-y-2 sm:col-span-2">
        <FieldError message={errors.root?.message} />
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : task ? 'Save changes' : 'Add task'}
          </Button>
        </div>
      </div>
    </form>
  );
}
