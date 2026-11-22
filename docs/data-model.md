# Data model

StuddyPuddy stores its data in MongoDB, accessed through Mongoose. There are three collections. Tasks and availability belong to a user and reference the owner by `userId`, so every query for user data filters by that field. This is also what the data-privacy story relies on.

## users

- `email`: string, required, unique, stored in lowercase
- `name`: string, required
- `createdAt`, `updatedAt`: set automatically
- `passwordHash`: string, bcrypt-hashed
- `tokenVersion`: whole number, defaults to 0; incremented on logout to invalidate issued tokens
- `role`: `user` (default) or `admin`. Set only by the seed or by hand in the database, never through the app. It is read from the database on every request, not from the login token.
- `maxHoursPerDay`: number from 0.25 to 24, or `null` (default) for no limit. The user's own daily study limit, applied by the planning core.
- `username`: optional public handle, lowercase letters, digits and `_` (3 to 20 characters, starts with a letter). Unique among accounts that have one (partial unique index), never required.
- `avatar`: optional profile picture (`data` bytes and `contentType`, at most 100 KB, JPEG, PNG or WebP checked by the file's real bytes). Excluded from normal queries (`select: false`) because the user is loaded on every request.
- `preferences`: `theme` (`system`, `light`, `dark`), `weekStart` (`monday`, `sunday`), `defaultPage` (`dashboard`, `tasks`, `plan`) and `compact` (true or false). Applied by the browser; the server only stores them.

## tasks

- `userId`: reference to a user, required
- `title`: string, required, up to 120 characters
- `category`: string, required; one of 'homework', 'exam', 'quiz', 'lab'
- `deadline`: date, required
- `moduleCount`: whole number, at least 1, required
- `estimatedHours`: number, at least 0.25, required
- `status`: one of `todo`, `in_progress`, `done`; defaults to `todo`
- `steps`: list of topics of the task, each with `title` (up to 80 characters), `hours` (quarter hours) and `done`. At most 30. The planner does not use them; they organise the work, and the plan names the next topic.
- `timeEntries`: list of time studied, each with `date` (a calendar day as text, `2026-11-22`), `hours` (0.25 to 24, quarter hours) and an optional `note`. At most 500. The total is the task's logged hours; the planner schedules only `estimatedHours` minus the logged hours.
- `createdAt`, `updatedAt`: set automatically

## availability

One document per user per weekday.

- `userId`: reference to a user, required
- `weekday`: whole number from 0 to 6, required; 0 is Sunday, 1 is Monday ... 6 is Saturday (the same numbering as JavaScript's `getUTCDay()`)
- `hoursAvailable`: number from 0 to 24, required
- `createdAt`, `updatedAt`: set automatically

## Relations

A user has many tasks and up to seven availability entries. Both are stored in their own collections and point back to the user through `userId`, rather than being nested inside the user document, because tasks grow over time and are queried on their own.

## Indexes

- `users`: unique index on `email`; unique partial index on `username` (only accounts that have one)
- `tasks`: compound index on `(userId, deadline)`, which serves any lookup by user and any lookup by user sorted by deadline
- `availability`: unique compound index on `(userId, weekday)`, so a user cannot have two entries for the same day

## Assumptions to confirm against the design document

The category values, the status names, and the meaning of availability (hours per weekday) are working assumptions and will be adjusted if the design document says otherwise.
