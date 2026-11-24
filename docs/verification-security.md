# Security check (second quality attribute)

Security here means: a person can only use what their account allows, and the system does not give away more than it must.

Repeat it with:

```
npm run verify:security -w backend
```

The tests are in `backend/src/security/`. They run without a database (the user lookups are replaced by small in-memory fakes), so they behave the same on every machine. Data separation between clients with a real database is tested separately in `backend/src/routes/tasks.ownership.test.ts` (see the architecture document).

## Criteria and results

| #   | Criterion                                                                             | How it is checked                                                                                                                                                                                        | Expected | Actual              |
| --- | ------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- | ------------------- |
| S1  | Every route except health, register and login refuses a request without a valid login | The test finds every registered route by itself, so a route added later is checked too. Each protected one is called without a token (and one with a non-Bearer header)                                  | all 401  | 15 of 15 tests pass |
| S2  | Forged, expired and out-of-date tokens are refused                                    | Wrong secret, expired, other algorithm, unsigned ("alg none"), account deleted, old token version; and a token stops working after log out                                                               | all 401  | 7 of 7 tests pass   |
| S3  | A role allows an action for one user and denies it to another                         | A normal user calls the admin page (403 FORBIDDEN). Asking for the admin role while registering is ignored. An admin being allowed is tested in `routes/admin.test.ts`                                   | as said  | 2 of 2 tests pass   |
| S4  | Input that is not what the server expects is refused                                  | Database-operator objects (`{"$ne": null}`), arrays and numbers instead of text, a body above 100 kB, broken JSON. The database is never called for the refused logins                                   | 400, 413 | 5 of 5 tests pass   |
| S5  | Responses do not leak secrets                                                         | Login and "who am I" contain no password hash or token version. An unexpected server error shows no connection string                                                                                    | none     | 2 of 2 tests pass   |
| S6  | Security headers are set                                                              | `X-Powered-By` absent, `nosniff`, frame and HSTS headers present (helmet)                                                                                                                                | present  | 1 of 1 test passes  |
| S7  | Only the configured web address may use the API from a browser                        | The API answers with the one configured address, never another origin and never `*`                                                                                                                      | as said  | 2 of 2 tests pass   |
| S8  | Guessing passwords is slowed down                                                     | After 5 wrong passwords an account is locked, even for the right password, and other accounts are not affected. One address trying many accounts is limited, and a faked forwarding header does not help | 429      | 3 of 3 tests pass   |
| S9  | A request body must be JSON                                                           | A web form, plain text and XML body are refused with 415 before any code reads them; JSON with a charset is accepted                                                                                     | 415      | 6 of 6 tests pass   |
| S10 | Private answers are not cached                                                        | Every `/api` answer, including errors, carries `Cache-Control: no-store`                                                                                                                                 | no-store | 3 of 3 tests pass   |
| S11 | A new password must not be an easy guess                                              | Common passwords (any letter case), a password equal to the email address and one above bcrypt's 72 bytes are refused; a normal passphrase is accepted                                                   | 400      | 8 of 8 tests pass   |
| S12 | The API as a whole is rate limited                                                    | After the limit (lowered to 5 for the test) the API answers 429 with the standard `RateLimit` headers; the health check is never limited                                                                 | 429      | 2 of 2 tests pass   |
| S13 | Creating accounts is limited per address                                              | The third account in a row from one address is refused with 429, even with valid data                                                                                                                    | 429      | 1 of 1 test passes  |

Each rule was also proven able to fail: when the code was broken on purpose (a route without its login check, the token algorithm not pinned, helmet removed, input validation removed, the JSON check, `no-store`, the password list or either rate limiter removed) the matching tests failed.

## What this does not cover (honest limits)

- The login token is kept in the browser's `localStorage`. A cross-site scripting bug would let a script read it. React escapes output by default and the app renders no raw HTML, but this is the weaker choice compared with an `httpOnly` cookie.
- The login limiter counts attempts in memory of each API process. With more than one copy of the API (`--scale backend=2`) every copy counts for itself, so the limit is looser. A shared store (for example Redis) would fix that.
- The containers speak plain HTTP. In a real deployment HTTPS is provided in front of them (the hosting platform or a reverse proxy).
- The admin account is created by hand (see the deployment notes) and sees counts only, so a stolen admin login exposes no personal data.
- Passwords are stored with bcrypt and checked against a short list of the most common ones, not a full breach list. There is no email check, password reset or two-step login.
- The whole-API and account limits are counted in memory per API copy, like the login limits. Behind nginx they depend on `TRUST_PROXY_HOPS=1`; without it every visitor would look like one address.
