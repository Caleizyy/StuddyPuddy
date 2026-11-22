import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ApiError } from '@/api/client';
import { getProfile, removeAvatar, updateProfile, uploadAvatar, type Profile } from '@/api/profile';
import { Avatar } from '@/components/profile/Avatar';
import { ErrorState } from '@/components/states/ErrorState';
import { LoadingState } from '@/components/states/LoadingState';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FieldError } from '@/components/ui/field-error';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { ImageError, prepareAvatar } from '@/lib/image';

const formSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(100, 'Name is too long'),
  username: z
    .string()
    .trim()
    .toLowerCase()
    .refine((value) => value === '' || /^[a-z][a-z0-9_]{2,19}$/.test(value), {
      message: '3 to 20 characters: letters, digits and _, starting with a letter',
    }),
});
type FormValues = z.infer<typeof formSchema>;

function messageOf(error: unknown) {
  return error instanceof ApiError ? error.message : 'Something went wrong. Please try again.';
}

export function ProfilePage() {
  const { updateUser } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [failed, setFailed] = useState(false);
  const [pictureMessage, setPictureMessage] = useState<string | null>(null);
  const [pictureBusy, setPictureBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<FormValues>({ resolver: zodResolver(formSchema) });

  function load() {
    setFailed(false);
    getProfile()
      .then(({ profile: loaded }) => {
        setProfile(loaded);
        reset({ name: loaded.name, username: loaded.username ?? '' });
      })
      .catch(() => setFailed(true));
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps -- load once when the page opens
  useEffect(load, []);

  function apply(next: Profile) {
    setProfile(next);
    updateUser({ name: next.name, username: next.username, avatar: next.avatar });
  }

  async function onSave(values: FormValues) {
    setSaved(false);
    try {
      const { profile: next } = await updateProfile({
        name: values.name,
        username: values.username === '' ? null : values.username,
      });
      apply(next);
      reset({ name: next.name, username: next.username ?? '' });
      setSaved(true);
    } catch (error) {
      if (error instanceof ApiError && error.code === 'USERNAME_TAKEN') {
        setError('username', { message: error.message });
      } else {
        setError('root', { message: messageOf(error) });
      }
    }
  }

  async function onPickFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = ''; // so picking the same file twice still fires
    if (!file) return;
    setPictureMessage(null);
    setPictureBusy(true);
    try {
      const image = await prepareAvatar(file);
      apply((await uploadAvatar(image)).profile);
    } catch (error) {
      setPictureMessage(error instanceof ImageError ? error.message : messageOf(error));
    } finally {
      setPictureBusy(false);
    }
  }

  async function onRemovePicture() {
    setPictureMessage(null);
    setPictureBusy(true);
    try {
      apply((await removeAvatar()).profile);
    } catch (error) {
      setPictureMessage(messageOf(error));
    } finally {
      setPictureBusy(false);
    }
  }

  if (failed) {
    return (
      <main className="mx-auto max-w-3xl p-8">
        <ErrorState title="Could not load your profile" onRetry={load} />
      </main>
    );
  }
  if (!profile) {
    return (
      <main className="mx-auto max-w-3xl p-8">
        <LoadingState label="Loading your profile..." />
      </main>
    );
  }

  const memberSince = new Date(profile.createdAt).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <main className="mx-auto max-w-3xl space-y-6 p-8">
      <h1 className="text-2xl font-semibold">Profile</h1>

      <Card>
        <CardContent className="flex flex-col items-start gap-5 sm:flex-row sm:items-center">
          <Avatar name={profile.name} src={profile.avatar} className="size-24 text-2xl" />
          <div className="space-y-2">
            <p className="text-lg font-medium">{profile.name}</p>
            <p className="text-sm text-muted-foreground">
              {profile.username ? `@${profile.username}` : 'No username yet'}
            </p>
            <div className="flex flex-wrap gap-2">
              <input
                ref={fileInput}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="sr-only"
                aria-label="Choose a profile picture"
                onChange={(event) => void onPickFile(event)}
              />
              <Button
                variant="outline"
                size="sm"
                disabled={pictureBusy}
                onClick={() => fileInput.current?.click()}
              >
                {pictureBusy ? 'Working...' : profile.avatar ? 'Change picture' : 'Add picture'}
              </Button>
              {profile.avatar && (
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={pictureBusy}
                  onClick={() => void onRemovePicture()}
                >
                  Remove
                </Button>
              )}
            </div>
            {pictureMessage && (
              <p role="alert" className="text-sm text-destructive">
                {pictureMessage}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Your details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSave)} noValidate className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                autoComplete="name"
                aria-invalid={!!errors.name}
                {...register('name')}
              />
              <FieldError message={errors.name?.message} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                autoComplete="username"
                placeholder="optional"
                aria-invalid={!!errors.username}
                {...register('username')}
              />
              <FieldError message={errors.username?.message} />
              <p className="text-xs text-muted-foreground">
                Leave it empty if you do not want one.
              </p>
            </div>
            <FieldError message={errors.root?.message} />
            <div className="flex items-center gap-3">
              <Button type="submit" disabled={isSubmitting || !isDirty}>
                {isSubmitting ? 'Saving...' : 'Save changes'}
              </Button>
              {saved && !isDirty && (
                <span role="status" className="text-sm text-muted-foreground">
                  Saved
                </span>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-muted-foreground">Email</dt>
              <dd className="break-all">{profile.email}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Role</dt>
              <dd className="capitalize">{profile.role}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Member since</dt>
              <dd>{memberSince}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Tasks</dt>
              <dd>
                {profile.stats.openTasks} open, {profile.stats.doneTasks} done
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>
    </main>
  );
}
