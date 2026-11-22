# Deploying to the cloud (Render and MongoDB Atlas)

The same code that runs in `docker compose` runs in the cloud. Only the settings differ. Everything is configured through environment variables, so nothing in the code changes.

What you need: a GitHub account with this repository, a free [MongoDB Atlas](https://www.mongodb.com/atlas) account and a free [Render](https://render.com) account.

## 1. The database (Atlas)

1. Create a free cluster.
2. Under **Database Access** add a database user with a strong password.
3. Under **Network Access** allow connections from the cloud host. Render's free services have no fixed address, so for a course project you can allow `0.0.0.0/0` (anywhere). The database password is then the only protection, so keep it strong. A paid Render plan with fixed outbound addresses allows a tighter list.
4. Press **Connect**, pick **Drivers** and copy the connection string. Put your database name before the `?`, for example `...mongodb.net/studdypuddy?retryWrites=true&w=majority`.

## 2. The services (Render)

1. In Render choose **New**, then **Blueprint**, and select this repository. Render reads `render.yaml` and proposes two services: `studdypuddy-api` and `studdypuddy-web`.
2. It asks for the values marked `sync: false`. The two addresses are not known yet, so put a placeholder (`https://example.com`) in `CORS_ORIGIN` and `VITE_API_URL` and paste the Atlas string into `MONGODB_URI`. `JWT_SECRET` is generated for you.
3. Apply. Wait for both services to finish deploying.
4. Open each service and copy its public address (`https://studdypuddy-api.onrender.com` and `https://studdypuddy-web.onrender.com`, or similar).
5. In `studdypuddy-api` set `CORS_ORIGIN` to the web app's address. In `studdypuddy-web` set `VITE_API_URL` to the API's address (no `/api` at the end, no trailing slash). Redeploy both: the web app has to be rebuilt because Vite bakes the address in when it builds.
6. Open the web app and register a user.

The free API service falls asleep when idle, so the first request after a pause takes about a minute. Open the site before a demo.

## 3. The administrator

An administrator is never created through the app. Make one by hand from your own computer, with the Atlas string and a strong password:

```
ADMIN_EMAIL=you@example.com ADMIN_PASSWORD=a-long-password MONGODB_URI="mongodb+srv://..." JWT_SECRET=any-32-characters-or-more-0000000000 npm run create-admin -w backend
```

The command refuses a password shorter than 12 characters and never changes an account that already exists. Do not run `npm run seed` against the cloud database: it wipes the data and creates the demo admin with a known password, and it refuses to run when `NODE_ENV` is `production`.

## 4. After deploying

- Check `https://<api address>/api/health`. It should answer `{"status":"ok"...}`.
- Log in as the admin and open **Usage**: it shows only counts.
- The security limits in `docs/verification-security.md` apply: the connection is HTTPS (Render provides it), but the login limiter counts per API copy and the token lives in the browser's local storage.
