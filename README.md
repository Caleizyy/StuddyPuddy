# StuddyPuddy

A study planner for students that prioritizes tasks by deadline and workload and suggests a study plan.

## Structure

- `frontend/` is the React app (browser UI).
- `backend/` is the Node.js REST API (database access, business logic).
- `docs/` holds project documentation, including the [data model](docs/data-model.md).

## Requirements

- Node.js and npm (check with `node -v` and `npm -v`)
- A MongoDB database: either a free MongoDB Atlas cluster or a local MongoDB installation (see Database below)

## Getting started

1. Clone the repository and switch to the `dev` branch.
2. Install dependencies from the repository root. One install covers both parts:

       npm install

3. Create your local environment files from the examples and fill in the values:

       copy backend\.env.example backend\.env
       copy frontend\.env.example frontend\.env

   On macOS or Linux, use `cp` instead of `copy`. The real `.env` files are git-ignored and must never be committed.

4. Set up the database and put its connection string in `backend/.env` (see below).

## Database

The backend stores its data in MongoDB. The connection string is read from the `MONGODB_URI` variable in `backend/.env`. Use a database name that is only for development, such as `studdypuddy_dev`, because the seed script below deletes everything in the database it connects to.

**Atlas (hosted):**

1. Create a free cluster (M0) on MongoDB Atlas.
2. Under Security, create a database user with read and write access, using a password without special characters.
3. Under Network Access, add your current IP address to the allowlist.
4. Click Connect on the cluster, choose the option for connecting an application (Node.js), and copy the connection string. Replace `<username>` and `<password>` with the database user's credentials and add the database name after `.mongodb.net/`, for example:

       MONGODB_URI=mongodb+srv://myuser:mypassword@cluster0.example.mongodb.net/studdypuddy_dev?appName=Cluster0

**Local:** install MongoDB Community Edition and use:

    MONGODB_URI=mongodb://localhost:27017/studdypuddy_dev

**Seed data:** `npm run seed` resets the database and creates two test users (`normal@example.com` and `conflict@example.com`) with tasks and weekly availability based on the test scenarios in the design document. It refuses to run when `NODE_ENV` is `production`.

The collections, fields and indexes are described in [docs/data-model.md](docs/data-model.md).

## Running locally

    npm run dev:backend

The backend connects to MongoDB first and prints `MongoDB connected`, then `API listening on port 3000`. If the connection fails, it prints an error explaining what to check and exits. To confirm the API is up, open `http://localhost:3000/api/health`.

    npm run dev:frontend

The backend should run first to see API status connected and it be working properly. To confirm frontend works properly open http://localhost:5173/

## Code quality

- `npm run lint` checks the code with ESLint.
- `npm run typecheck` checks the TypeScript types.
- `npm run format` formats everything with Prettier; `npm run format:check` only reports problems.
- A pre-commit hook (Husky + lint-staged) lints and formats staged files and blocks the commit if lint errors remain. It installs automatically with `npm install`.

## Workflow

Work happens on branches created from `dev`. Every change goes through a pull request, even when working alone, so that automated review and CI always run. `dev` is merged into `main` for releases.
