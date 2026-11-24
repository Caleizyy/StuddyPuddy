import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { ApiError } from '@/api/client';
import { saveSteps, type Task } from '@/api/tasks';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { FieldError } from '@/components/ui/field-error';
import { Input } from '@/components/ui/input';
import { MAX_STEPS, rowsFromSteps, validateRows, type StepRow } from '@/lib/steps';

type Props = { task: Task; onClose: () => void; onSaved: () => void };

export function TopicsDialog({ task, onClose, onSaved }: Props) {
  const [rows, setRows] = useState<StepRow[]>(() => rowsFromSteps(task.steps));
  const [problems, setProblems] = useState<(string | undefined)[]>([]);
  const [failure, setFailure] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const totalHours = rows.reduce((sum, row) => sum + (Number(row.hours) || 0), 0);

  function change(index: number, changes: Partial<StepRow>) {
    setRows((current) => current.map((row, i) => (i === index ? { ...row, ...changes } : row)));
  }

  async function save() {
    const found = validateRows(rows);
    setProblems(found);
    if (found.some(Boolean)) return;
    setSaving(true);
    setFailure(null);
    try {
      await saveSteps(
        task.id,
        rows.map((row) => ({
          ...(row.id && { id: row.id }),
          title: row.title.trim(),
          hours: Number(row.hours),
          done: row.done,
        })),
      );
      onSaved();
    } catch (error) {
      setFailure(
        error instanceof ApiError ? error.message : 'Something went wrong. Please try again.',
      );
      setSaving(false);
    }
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Topics for {task.title}</DialogTitle>
          <DialogDescription>
            Break the work into parts you can tick off. Topics add up to {totalHours} h; the task is
            estimated at {task.estimatedHours} h and the plan keeps using that estimate.
          </DialogDescription>
        </DialogHeader>

        <ul className="space-y-3">
          {rows.map((row, index) => (
            <li key={row.id ?? `new-${index}`} className="space-y-1">
              <div className="flex items-center gap-2">
                <Input
                  aria-label={`Topic ${index + 1} name`}
                  value={row.title}
                  maxLength={80}
                  onChange={(event) => change(index, { title: event.target.value })}
                />
                <Input
                  aria-label={`Topic ${index + 1} hours`}
                  type="number"
                  inputMode="decimal"
                  step="0.25"
                  min="0.25"
                  className="w-24"
                  value={row.hours}
                  onChange={(event) => change(index, { hours: event.target.value })}
                />
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Remove topic ${index + 1}`}
                  onClick={() => setRows((current) => current.filter((_, i) => i !== index))}
                >
                  <Trash2 />
                </Button>
              </div>
              <FieldError message={problems[index]} />
            </li>
          ))}
        </ul>

        <Button
          variant="outline"
          size="sm"
          disabled={rows.length >= MAX_STEPS}
          onClick={() => setRows((current) => [...current, { title: '', hours: '1', done: false }])}
        >
          <Plus />
          Add a topic
        </Button>

        <FieldError message={failure ?? undefined} />
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button disabled={saving} onClick={() => void save()}>
            {saving ? 'Saving...' : 'Save topics'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
