# StuddyPuddy

A study planner for students that prioritizes tasks by deadline and workload and suggests a study plan.

## Structure

- `frontend/` is the React app (browser UI).
- `backend/` is the Node.js REST API (database access, business logic).

## Requirements

- Node.js and npm (check with `node -v` and `npm -v`)
- MongoDB, running locally or a connection string to a hosted instance

## Getting started

1. Clone the repository and switch to the `dev` branch.
2. Install dependencies from the repository root. One install covers both parts:

       npm install

3. Create your local environment files from the examples and fill in the values:

       copy backend\.env.example backend\.env
       copy frontend\.env.example frontend\.env

   On macOS or Linux, use `cp` instead of `copy`. The real `.env` files are git-ignored and must never be committed.

## Running locally

Run commands for the frontend and backend will be added once the apps are scaffolded.

## Code quality

- `npm run lint` checks the code with ESLint.
- `npm run format` formats everything with Prettier; `npm run format:check` only reports problems.
- A pre-commit hook (Husky + lint-staged) lints and formats staged files and blocks the commit if lint errors remain. It installs automatically with `npm install`.

## Workflow

Work happens on branches created from `dev`. Every change goes through a pull request, even when working alone, so that automated review and CI always run. `dev` is merged into `main` for releases.
