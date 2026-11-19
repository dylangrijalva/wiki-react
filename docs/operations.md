# Running the course server

The Hono server serves the course catalog, learner records and built web app from one origin. During development, Vite forwards `/api` requests to port 3001. Run `pnpm dev` in the repository root to start both processes.

## Deploy with SQLite

Use Node.js 24 on a host with a persistent local disk. Install the locked dependencies, run `pnpm build`, and launch the following command in the repository root. Keep the workspace packages, `apps/web/dist`, `apps/api/dist`, `apps/api/drizzle` and installed dependencies together.

```sh
NODE_ENV=production HOST=0.0.0.0 PORT=3001 \
  DATABASE_PATH=/var/lib/react-rendered/learning.sqlite pnpm start
```

Mount a persistent volume at `/var/lib/react-rendered` and give the service account write access. Route HTTPS traffic through a reverse proxy to the Node process. Each service instance needs access to the same learner records. This configuration runs one instance against its local SQLite file. Back up the live database with SQLite's online backup command, or stop the service before copying the database and its journal files.

| Variable           | Default                         | Purpose                                                                                                                                               |
| ------------------ | ------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `DATABASE_PATH`    | `apps/api/data/learning.sqlite` | Database filename. The server creates its parent directories. Use an absolute path for a production volume.                                           |
| `PORT`             | `3001`                          | HTTP listener.                                                                                                                                        |
| `HOST`             | `127.0.0.1`                     | Network interface. Use `0.0.0.0` for container ingress.                                                                                               |
| `NODE_ENV`         | Unset                           | Set to `production` behind HTTPS. Enables Secure, host-only cookies and requires the web build.                                                       |
| `PUBLIC_ORIGIN`    | Request host                    | Set this to the public origin, for example `https://learn.example.com`, if a reverse proxy rewrites the Host header.                                  |
| `TRUSTED_PROXY_IP` | Unset                           | IP address of the reverse proxy that connects directly to the server. Set this to apply sign-in and registration limits per client behind that proxy. |

Startup applies pending SQL migrations, then seeds published tracks and lessons from `@rendered/shared/content` in one transaction. A removed lesson is unpublished. Its learner records remain in SQLite if the slug returns. The health check runs a database query and returns `{"status":"ok"}` at `/api/health`.

To check a local server after startup, run the following command.

```sh
curl --fail --show-error --silent http://127.0.0.1:3001/api/health
```

## Accounts and guest sessions

Guests can open lessons immediately. The first `GET /api/progress` from a guest browser sets a one-year guest cookie. Creating an account moves that guest’s bookmarks and progress to the account. Signing in to an existing account loads its own records. After sign-out, the browser returns to the guest library it had before sign-in.

Register or sign in with a JSON object containing `email` and `password`. Registration accepts passwords from 15 to 128 characters. The server stores a salted scrypt password hash. A successful registration or sign-in sets a random session token in an HttpOnly, SameSite=Lax cookie. The server stores its digest and checks its expiry on each authenticated request. Sessions last 30 days. Signing out revokes the current token. Other devices stay signed in.

Production uses the Secure cookies `__Host-rr_session` and `__Host-rr_guest`. Use HTTPS and serve the UI and API from the same origin. Clearing cookies signs the browser out. A learner can sign in again to recover their account records.

Credential attempts are limited by client address, and sign-in attempts are also limited by email. With `TRUSTED_PROXY_IP` set, configure that proxy to replace `X-Forwarded-For` with its client’s IP or append that IP as the final entry. By default, all requests from a reverse proxy share its address limit.

| Request                   | Response                                                                            |
| ------------------------- | ----------------------------------------------------------------------------------- |
| `GET /api/auth/session`   | `{"user":{"email":"reader@example.com"}}` when signed in, otherwise `{"user":null}` |
| `POST /api/auth/register` | `201` with the signed-in user and a session cookie                                  |
| `POST /api/auth/login`    | `200` with the signed-in user and a new session cookie                              |
| `POST /api/auth/logout`   | `200` with `{"user":null}`                                                          |

## Course and learner records

| Request                       | Response                                                                  |
| ----------------------------- | ------------------------------------------------------------------------- |
| `GET /api/tracks`             | Published tracks in curriculum order                                      |
| `GET /api/lessons`            | Lesson summaries, including step counts                                   |
| `GET /api/lessons/:slug`      | Complete lesson, scenes and knowledge check                               |
| `GET /api/search?q=render`    | Summaries matching the search terms                                       |
| `GET /api/progress`           | The current learner’s progress, most recently visited first               |
| `PUT /api/progress/:slug`     | Updated progress after a JSON body such as `{"step":2,"completed":false}` |
| `GET /api/bookmarks`          | The current learner’s bookmarked slugs                                    |
| `POST /api/bookmarks/:slug`   | `{"lessonId":"how-react-renders","bookmarked":true}`                      |
| `DELETE /api/bookmarks/:slug` | The lesson ID and `bookmarked: false`                                     |

Step indices start at zero. A write updates the resume position, merges the visited step into the stored set and preserves earlier completion. Repeating a bookmark write has the same result as applying it once. Private responses use `Cache-Control: private, no-store`. API failures use `{"error":{"code":"…","message":"…"}}` and an HTTP error status.

```sh
curl --cookie-jar /tmp/rendered.cookies http://localhost:3001/api/progress
curl --cookie /tmp/rendered.cookies --request PUT \
  --header 'Content-Type: application/json' --data '{"step":1}' \
  http://localhost:3001/api/progress/how-react-renders
```

## Verification

Run `pnpm --filter @rendered/api test`. The suite migrates a temporary database for each test. It checks registration, sign-in, session revocation, learner isolation, concurrent progress updates, reopening the database, request validation, and SPA deep links.
