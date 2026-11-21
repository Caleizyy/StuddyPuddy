## Backend structure documentation

Requests are validated with Zod schemas kept in [`src/schemas/`](src/schemas/). Routes that accept a request body run it through `validate(schema)`, which checks `req.body` with a Zod schema and answers 400 `VALIDATION_ERROR` with the fields to fix. Task IDs in the URL are not Zod-validated: a malformed or unknown ID gets the same 404 `TASK_NOT_FOUND` as a task that belongs to someone else.

## Who can do what

Every route except health, register and login needs a valid login token. Tasks, availability, settings and the plan always belong to the logged-in user: the user id comes from the token, never from the request.

- `GET /api/settings` and `PUT /api/settings`: the logged-in user's own settings (today the daily study limit, `maxHoursPerDay`, or `null` for no limit). The limit changes only that user's plan.
- `GET /api/admin/usage`: the usage summary (number of accounts, open and finished tasks, numbers only). Only the `admin` role may call it; any other user gets 403 `FORBIDDEN`. The role is read from the database on every request, and nobody can become an admin through the app: registration and settings ignore a `role` in the request.
