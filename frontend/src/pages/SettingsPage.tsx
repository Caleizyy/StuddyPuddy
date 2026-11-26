import { useState } from 'react';
import { Link } from 'react-router';
import { exportMyData, savePreferences, signOutEverywhere } from '@/api/account';
import { ApiError } from '@/api/client';
import { DeleteAccount } from '@/components/settings/DeleteAccount';
import { PasswordForm } from '@/components/settings/PasswordForm';
import { Segmented } from '@/components/settings/Segmented';
import { SettingRow } from '@/components/settings/SettingRow';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { applyPreferences, normalizePreferences, type Preferences } from '@/lib/preferences';

function messageOf(error: unknown) {
  return error instanceof ApiError ? error.message : 'Something went wrong. Please try again.';
}

export function SettingsPage() {
  const { user, updateUser, replaceToken } = useAuth();
  const [notice, setNotice] = useState<string | null>(null);
  const [problem, setProblem] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const preferences = normalizePreferences(user?.preferences);

  // Applies at once so the page reacts, then saves; if saving fails the old value comes back
  async function change(changes: Partial<Preferences>) {
    const before = preferences;
    const next = { ...before, ...changes };
    setProblem(null);
    updateUser({ preferences: next });
    applyPreferences(next);
    try {
      const saved = await savePreferences(changes);
      updateUser({ preferences: saved.preferences });
    } catch (error) {
      updateUser({ preferences: before });
      applyPreferences(before);
      setProblem(messageOf(error));
    }
  }

  async function onSignOutEverywhere() {
    setNotice(null);
    setProblem(null);
    setBusy(true);
    try {
      replaceToken((await signOutEverywhere()).token);
      setNotice('All other devices were signed out.');
    } catch (error) {
      setProblem(messageOf(error));
    } finally {
      setBusy(false);
    }
  }

  async function onExport() {
    setNotice(null);
    setProblem(null);
    setBusy(true);
    try {
      const data = await exportMyData();
      const file = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(file);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'studdypuddy-data.json';
      link.click();
      URL.revokeObjectURL(url);
      setNotice('Your data was downloaded.');
    } catch (error) {
      setProblem(messageOf(error));
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto max-w-4xl space-y-6 px-4 py-6 sm:px-6 md:py-8">
      <h1 className="text-3xl font-semibold">Settings</h1>

      {problem && (
        <p role="alert" className="text-sm text-destructive">
          {problem}
        </p>
      )}
      {notice && (
        <p role="status" className="text-sm text-muted-foreground">
          {notice}
        </p>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
        </CardHeader>
        <CardContent className="divide-y divide-border">
          <SettingRow title="Theme" description="System follows your device.">
            <Segmented
              label="Theme"
              value={preferences.theme}
              options={[
                { value: 'system', label: 'System' },
                { value: 'light', label: 'Light' },
                { value: 'dark', label: 'Dark' },
              ]}
              onChange={(theme) => void change({ theme })}
            />
          </SettingRow>
          <SettingRow title="Density" description="Compact fits more on the screen.">
            <Segmented
              label="Density"
              value={preferences.compact ? 'compact' : 'comfortable'}
              options={[
                { value: 'comfortable', label: 'Comfortable' },
                { value: 'compact', label: 'Compact' },
              ]}
              onChange={(value) => void change({ compact: value === 'compact' })}
            />
          </SettingRow>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Planning</CardTitle>
        </CardHeader>
        <CardContent className="divide-y divide-border">
          <SettingRow title="Week starts on" description="The order of the days on Study hours.">
            <Segmented
              label="Week starts on"
              value={preferences.weekStart}
              options={[
                { value: 'monday', label: 'Monday' },
                { value: 'sunday', label: 'Sunday' },
              ]}
              onChange={(weekStart) => void change({ weekStart })}
            />
          </SettingRow>
          <SettingRow
            title="Open after login"
            description="The first page you see when you log in."
          >
            <Segmented
              label="Open after login"
              value={preferences.defaultPage}
              options={[
                { value: 'dashboard', label: 'Dashboard' },
                { value: 'tasks', label: 'Tasks' },
                { value: 'plan', label: 'Plan' },
              ]}
              onChange={(defaultPage) => void change({ defaultPage })}
            />
          </SettingRow>
          <SettingRow
            title="Daily study limit"
            description="The most hours the planner may give you on one day."
          >
            <Link to="/availability" className="text-sm text-primary underline">
              Change on Study hours
            </Link>
          </SettingRow>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Password</CardTitle>
        </CardHeader>
        <CardContent>
          <PasswordForm />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Your account</CardTitle>
        </CardHeader>
        <CardContent className="divide-y divide-border">
          <SettingRow
            title="Sign out everywhere else"
            description="Use this if you logged in on a device you no longer trust."
          >
            <Button variant="outline" disabled={busy} onClick={() => void onSignOutEverywhere()}>
              Sign out other devices
            </Button>
          </SettingRow>
          <SettingRow
            title="Download my data"
            description="Your account, tasks and availability as a JSON file."
          >
            <Button variant="outline" disabled={busy} onClick={() => void onExport()}>
              Download
            </Button>
          </SettingRow>
          <div className="py-3">
            <DeleteAccount />
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
