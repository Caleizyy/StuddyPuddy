import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { ApiError } from '@/api/client';
import { logTime, removeTimeEntry, type Task } from '@/api/tasks';
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
import { Label } from '@/components/ui/label';
import { formatDeadline } from '@/lib/deadline';
import { localDateKey, remainingOf, validateLog } from '@/lib/timeLog';

type Props = { task: Task; onClose: () => void; onChanged: () => void };

const QUICK_HOURS = [0.5, 1, 2];

export function LogTimeDialog({ task, onClose, onChanged }: Props) {
  const today = localDateKey();
  const [hours, setHours] = useState('1');
  const [date, setDate] = useState(today);
  const [note, setNote] = useState('');
  const [problem, setProblem] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  // The dialog keeps its own copy of the task, so a new entry shows at once
  const [current, setCurrent] = useState(task);

  async function run(action: () => Promise<{ task: Task }>) {
    setBusy(true);
    setProblem(null);
    try {
      const result = await action();
      setCurrent(result.task);
      onChanged();
      return true;
    } catch (error) {
      setProblem(
        error instanceof ApiError ? error.message : 'Something went wrong. Please try again.',
      );
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const message = validateLog(hours, date, today);
    if (message) {
      setProblem(message);
      return;
    }
    const saved = await run(() =>
      logTime(task.id, {
        hours: Number(hours),
        date,
        ...(note.trim() && { note: note.trim() }),
      }),
    );
    if (saved) setNote('');
  }

  const left = remainingOf(current);

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Log time for {task.title}</DialogTitle>
          <DialogDescription>
            {current.loggedHours} h logged of {current.estimatedHours} h
            {left > 0
              ? `, ${left} h left. The plan schedules only what is left.`
              : '. Nothing is left to schedule.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={(event) => void submit(event)} noValidate className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="log-hours">Hours studied</Label>
              <Input
                id="log-hours"
                type="number"
                inputMode="decimal"
                step="0.25"
                min="0.25"
                value={hours}
                onChange={(event) => setHours(event.target.value)}
              />
              <div className="flex gap-1">
                {QUICK_HOURS.map((value) => (
                  <Button
                    key={value}
                    type="button"
                    variant="outline"
                    size="xs"
                    onClick={() => setHours(String(value))}
                  >
                    {value} h
                  </Button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="log-date">Day</Label>
              <Input
                id="log-date"
                type="date"
                max={today}
                value={date}
                onChange={(event) => setDate(event.target.value)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="log-note">Note (optional)</Label>
            <Input
              id="log-note"
              maxLength={120}
              placeholder="What did you work on?"
              value={note}
              onChange={(event) => setNote(event.target.value)}
            />
          </div>
          <FieldError message={problem ?? undefined} />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={onClose}>
              Close
            </Button>
            <Button type="submit" disabled={busy}>
              {busy ? 'Saving...' : 'Log time'}
            </Button>
          </div>
        </form>

        {current.timeEntries.length > 0 && (
          <div className="border-t border-border pt-3">
            <h3 className="mb-1 text-sm font-medium">Logged so far</h3>
            <ul className="max-h-48 space-y-1 overflow-y-auto text-sm">
              {current.timeEntries.map((entry) => (
                <li key={entry.id} className="flex items-center gap-2">
                  <span className="w-24 shrink-0 text-muted-foreground">
                    {formatDeadline(`${entry.date}T12:00:00.000Z`)}
                  </span>
                  <span className="w-12 shrink-0">{entry.hours} h</span>
                  <span className="flex-1 truncate text-muted-foreground">{entry.note}</span>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    disabled={busy}
                    aria-label={`Delete ${entry.hours} hours on ${entry.date}`}
                    onClick={() => void run(() => removeTimeEntry(task.id, entry.id))}
                  >
                    <Trash2 />
                  </Button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
