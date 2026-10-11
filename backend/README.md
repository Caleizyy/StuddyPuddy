## Backend structure documentation

Requests are validated with Zod schemas kept in [src/schemas/], applied per route through validate(schema) middleware and that failures return 400 VALIDATION_ERROR in standart error format
