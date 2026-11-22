import { useState, type FormEvent } from 'react';
import { saveSettings } from '@/api/settings';
import { ApiError } from '@/api/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FieldError } from '@/components/ui/field-error';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

// Turns what the user typed into a limit. An empty box means "no limit".
// Returns an error message when the text is not a valid limit.
function parseLimit(text: string): { value: number | null } | { error: string } {
  const trimmed = text.trim();
  if (trimmed === '') return { value: null };
  const value = Number(trimmed);
  if (!Number.isFinite(value)) return { error: 'Enter a number' };
  if (value < 0.25 || value > 24) return { error: 'Use a value from 0.25 to 24 hours' };
  if (value % 0.25 !== 0) return { error: 'Use steps of 0.25 hours' };
  return { value };
}

export function DailyLimitForm({ initial }: { initial: number | null }) {
  const [text, setText] = useState(initial === null ? '' : String(initial));
  const [error, setError] = useState<string | undefined>();
  const [saving, setSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setJustSaved(false);

    const parsed = parseLimit(text);
    if ('error' in parsed) {
      setError(parsed.error);
      return;
    }

    setError(undefined);
    setSaving(true);
    try {
      const result = await saveSettings({ maxHoursPerDay: parsed.value });
      const saved = result.settings.maxHoursPerDay;
      setText(saved === null ? '' : String(saved));
      setJustSaved(true);
    } catch (caught) {
      setError(
        caught instanceof ApiError ? caught.message : 'Something went wrong. Please try again.',
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Daily study limit</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={(event) => void handleSubmit(event)} noValidate className="space-y-4">
          <p className="text-sm text-muted-foreground">
            A ceiling for any single day. If a day above is set higher, the planner uses this limit
            instead. Leave it empty for no limit. It only affects your own plan.
          </p>
          <div className="flex items-center justify-between gap-4">
            <Label htmlFor="daily-limit">Most hours on one day</Label>
            <div className="flex items-center gap-2">
              <Input
                id="daily-limit"
                type="number"
                min={0.25}
                max={24}
                step={0.25}
                className="w-24"
                value={text}
                aria-invalid={!!error}
                onChange={(event) => {
                  setText(event.target.value);
                  setJustSaved(false);
                }}
              />
              <span className="text-sm text-muted-foreground">h</span>
            </div>
          </div>
          <FieldError message={error} />
          <div className="flex items-center gap-3">
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving...' : 'Save limit'}
            </Button>
            <span role="status" className="text-sm text-muted-foreground">
              {justSaved ? 'Saved' : ''}
            </span>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
