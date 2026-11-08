## Backend structure documentation

Requests are validated with Zod schemas kept in [`src/schemas/`](src/schemas/). Routes that accept a request body run it through `validate(schema)`, which checks `req.body` with a Zod schema and answers 400 `VALIDATION_ERROR` with the fields to fix. Task IDs in the URL are not Zod-validated: a malformed or unknown ID gets the same 404 `TASK_NOT_FOUND` as a task that belongs to someone else.
