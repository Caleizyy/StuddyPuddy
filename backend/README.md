## Backend structure documentation

Requests are validated with Zod schemas kept in [`src/schemas/`](src/schemas/). Each route applies a schema through the `validate(schema)` middleware. A failed validation returns status 400 with code `VALIDATION_ERROR`, in the standard error format.
