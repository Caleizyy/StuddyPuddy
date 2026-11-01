# Data model

StuddyPuddy stores its data in MongoDB, accessed through Mongoose. There are three collections. Tasks and availability belong to a user and reference the owner by `userId`, so every query for user data filters by that field. This is also what the data-privacy story relies on.

## users

- `email`: string, required, unique, stored in lowercase
- `name`: string, required
- `createdAt`, `updatedAt`: set automatically
- `passwordHash`: string, bcrypt-hashed

## tasks

- `userId`: reference to a user, required
- `title`: string, required, up to 120 characters
- `category`: string, required; one of 'homework', 'exam', 'quiz', 'lab'
- `deadline`: date, required
- `moduleCount`: whole number, at least 1, required
- `estimatedHours`: number, at least 0.25, required
- `status`: one of `todo`, `in_progress`, `done`; defaults to `todo`
- `createdAt`, `updatedAt`: set automatically

## availability

One document per user per weekday.

- `userId`: reference to a user, required
- `weekday`: whole number from 0 to 6, required
- `hoursAvailable`: number from 0 to 24, required
- `createdAt`, `updatedAt`: set automatically

## Relations

A user has many tasks and up to seven availability entries. Both are stored in their own collections and point back to the user through `userId`, rather than being nested inside the user document, because tasks grow over time and are queried on their own.

## Indexes

- `users`: unique index on `email`
- `tasks`: compound index on `(userId, deadline)`, which serves any lookup by user and any lookup by user sorted by deadline
- `availability`: unique compound index on `(userId, weekday)`, so a user cannot have two entries for the same day

## Assumptions to confirm against the design document

The category values, the status names, and the meaning of availability (hours per weekday) are working assumptions and will be adjusted if the design document says otherwise.
