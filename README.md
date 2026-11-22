# StuddyPuddy

StuddyPuddy is a study planner. You enter your deadlines and how many hours you can study on each weekday, and the app builds a day-by-day plan. It ranks tasks by urgency, spreads the hours over the days you have, and warns you when the deadlines cannot all be met.

Each user only ever sees their own tasks, hours and plan.

## Main function

The plan is built in `backend/src/core/`, which is plain TypeScript with no database or web code. For every unfinished task it works out a priority score (hours still needed divided by the available hours until the deadline, scaled by the days left). It then fills your available hours with the most urgent tasks first.

If the hours do not stretch far enough, the plan says so. Any task that does not fully fit gets a warning with the number of hours left unscheduled. A task is also marked "At risk" when it cannot be finished before its own deadline even if it had all your hours, or when it is overdue or you have no study time. A task can have unscheduled hours without being at risk, because earlier, more urgent tasks used up the shared hours first. Invalid data (for example a task with 0 hours) is rejected with a clear error and never silently planned. The full rules are in `backend/src/core/README.md`.

## Tools and versions

- Node.js 24.15.0 and npm 11.12.1
- MongoDB: a local server or a free MongoDB Atlas cluster
- Backend: Express 5, TypeScript, Mongoose 9, Zod 4, Vitest 5
- Frontend: React, Vite, Tailwind CSS 4, shadcn/ui, React Router 8

## Setup

1. Install the dependencies for the whole project (backend and frontend) from the repository root:

   ```
   npm install
   ```

2. Create the backend configuration file by copying the example:

   ```
   copy backend\.env.example backend\.env
   ```

   (On macOS or Linux: `cp backend/.env.example backend/.env`.)

3. Open `backend/.env` and set:

   | Variable         | Meaning                                                       |
   | ---------------- | ------------------------------------------------------------- |
   | `MONGODB_URI`    | MongoDB connection string. The default uses a local server.   |
   | `JWT_SECRET`     | Secret for signing login tokens. Any long random string.      |
   | `SEED_PASSWORD`  | Password given to the sample users created by `npm run seed`. |
   | `PORT`           | Backend port. Default 3000.                                   |
   | `CORS_ORIGIN`    | Address of the frontend. Default `http://localhost:5173`.     |
   | `JWT_EXPIRES_IN` | How long a login lasts. Default 7d.                           |

   If you change `PORT`, copy `frontend/.env.example` to `frontend/.env` and set `VITE_API_URL` to the backend address. For example, use `http://localhost:3001` for `PORT=3001`.

   To generate a secret: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

## Run

One command starts both the backend and the frontend:

```
npm run dev
```

The backend runs on http://localhost:3000 and the app on http://localhost:5173. Stop both with Ctrl+C.

## Run with Docker

The whole system (MongoDB, the API and the web app) starts with one command. You need Docker Desktop and nothing else:

```
docker compose up --build
```

Open http://localhost:8080. The first start takes a few minutes while the images build.

All settings come from environment variables. `docker-compose.yml` has demo defaults, so the command works on a fresh checkout. To use your own values (a real `JWT_SECRET`, a MongoDB Atlas connection string, another port), copy `.env.example` to `.env` and fill it in; nothing else needs editing.

To fill the database with sample users (this wipes it first):

```
SEED_PASSWORD=choose-a-password docker compose --profile tools run --rm seed
```

On Windows PowerShell set the variable first with `$env:SEED_PASSWORD="choose-a-password"`.

Stop with Ctrl+C. `docker compose down` removes the containers and keeps the data; add `-v` to delete the data too.

The server keeps no state of its own between requests (the login token carries the identity and everything else is in MongoDB). That is why more than one copy of the API can run at once: `docker compose up --build --scale backend=2`.

## Sample data

```
npm run seed
```

This creates two sample users, both with the password from `SEED_PASSWORD`:

- `normal@example.com`: a comfortable workload with no conflicts
- `conflict@example.com`: more work than the hours allow, so the plan shows warnings

The seed deletes all existing users, tasks and availability in the configured database before creating the sample users, so it refuses to run unless `ALLOW_SEED_WIPE=true` is set in `backend/.env`. Only use it on a database you can wipe.

## Demo steps

1. Log in as `normal@example.com`.
2. Open **Availability** and set 2 hours for each weekday. Save.
3. Open **Tasks** and add a task. Tasks are listed most urgent first, each with a priority level.
4. Open **Plan** to see the ranked tasks and the day-by-day schedule.
5. Log out and log in as `conflict@example.com`. The dashboard and the Plan page show a warning. The long task is marked "At risk", and the short one shows how many hours do not fit.
6. On the **Tasks** page, mark a task as completed. The plan updates and the finished task disappears from it.
7. Log in as another user and open **Tasks**. The first user's tasks are not visible.

## Verifying correctness

The main quality attribute is correctness: the plan must follow the rules, and no day may be planned for more hours than the user allows. One command checks it and prints a results table:

```
npm run verify:correctness -w backend
```

It checks 10 predefined scenarios (their expected plans were worked out by hand) and 1000 generated inputs from fixed seeds, so every run gives the same result. For each of them it checks eight rules, for example "no day exceeds the daily maximum (the user's hours, lowered by their daily limit)", "no task is studied after its deadline" and "scheduled plus unscheduled hours equal the estimate". The command exits with an error if anything fails. The same checks also run inside `npm test`.

The latest table is saved in `docs/verification-correctness.md`; add `-- --write` to the command to refresh it. The code is in `backend/src/verification/`, and the test file includes tests that feed each rule a deliberately wrong plan to prove the checks can fail.

## Tests

```
npm test
```

This runs the backend tests against an in-memory MongoDB, so no database setup is needed. The first run downloads a MongoDB binary, which needs internet access. The tests cover:

- the planning core: priority scores, ordering, allocation, conflicts and invalid input
- the plan, task and availability endpoints
- tenant isolation: one user cannot read, change or delete another user's tasks (`backend/src/routes/tasks.ownership.test.ts`), and plans are separate per user

Coverage of the planning core: `npm run test:coverage`.

## Other commands

- `npm run lint`, `npm run format:check`, `npm run typecheck`: code checks
- `npm run build --workspace backend` and `npm run start --workspace backend`: production build and start of the backend

## Project structure

- `backend/src/core/`: the planning logic (pure functions, no database)
- `backend/src/routes`, `controllers`, `services`, `repositories`: the request flow, one layer per folder. Only repositories touch the database, and every user-data query is scoped by user id.
- `frontend/src/pages`, `components`, `api`, `hooks`: the React app
