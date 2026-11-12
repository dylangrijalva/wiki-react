# Running the course server

The Hono server serves the course catalog, learner records and built web app from one origin. During development, Vite forwards `/api` requests to port 3001. Run `pnpm dev` in the repository root to start both processes.

## Deploy with SQLite

Use Node.js 24 on a host with a persistent local disk. Install the locked dependencies, run `pnpm build`, and launch the following command in the repository root. Keep the workspace packages, `apps/web/dist`, `apps/api/dist`, `apps/api/drizzle` and installed dependencies together.

```sh
NODE_ENV=production HOST=0.0.0.0 PORT=3001 \
  DATABASE_PATH=/var/lib/react-rendered/learning.sqlite pnpm start
```

Mount a persistent volume at `/var/lib/react-rendered` and give the service account write access. Route HTTPS traffic through a reverse proxy to the Node process. Each service instance needs access to the same learner records. This configuration runs one instance against its local SQLite file. Back up the live database with SQLite's online backup command, or stop the service before copying the database and its journal files.

| Variable        | Default                         | Purpose                                                                                                     |
| --------------- | ------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `DATABASE_PATH` | `apps/api/data/learning.sqlite` | Database filename. The server creates its parent directories. Use an absolute path for a production volume. |
| `PORT`          | `3001`                          | HTTP listener.                                                                                              |
| `HOST`          | `127.0.0.1`                     | Network interface. Use `0.0.0.0` for container ingress.                                                     |
| `NODE_ENV`      | Unset                           | Set to `production` behind HTTPS. Enables Secure, host-only guest cookies and requires the web build.       |

Startup applies pending SQL migrations, then seeds published tracks and lessons from `@rendered/shared/content` in one transaction. A removed lesson is unpublished. Its learner records remain in SQLite if the slug returns. The health check runs a database query and returns `{"status":"ok"}` at `/api/health`.

## Guest sessions

The web client first calls `GET /api/progress`. A new browser receives a random bearer token in an HttpOnly, SameSite=Lax cookie with a one-year lifetime. SQLite stores its SHA-256 digest. Production names the cookie `__Host-rr_guest` and sets Secure. Other requests reuse the cookie. Clearing site cookies starts a new learner history.

| Request                       | Response                                                                  |
| ----------------------------- | ------------------------------------------------------------------------- |
| `GET /api/tracks`             | Published tracks in curriculum order                                      |
| `GET /api/lessons`            | Lesson summaries, including step counts                                   |
| `GET /api/lessons/:slug`      | Complete lesson, scenes and knowledge check                               |
| `GET /api/search?q=render`    | Summaries matching the search terms                                       |
| `GET /api/progress`           | Guest progress, most recently visited first                               |
| `PUT /api/progress/:slug`     | Updated progress after a JSON body such as `{"step":2,"completed":false}` |
| `GET /api/bookmarks`          | The guest's bookmarked slugs                                              |
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

Run `pnpm --filter @rendered/api test`. The suite migrates a temporary database for each test. It exercises guest separation, bookmark retries, concurrent progress updates, reopening the database, request validation and SPA deep links.
