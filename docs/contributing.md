# Contributing a lesson

Choose a track in `packages/shared/src/content`. Give the lesson a stable slug so a reader's bookmark and resume position continue to work. Add a concrete objective, a source link, a knowledge check with an explanation, and five to eight steps. Keep node IDs stable when the same object appears in successive steps. Connect edges by ID.

Start the application with `pnpm dev` and visit the lesson through the curriculum. Advance each step with the keyboard and check its diagram and code at phone width. Try a wrong answer and a correct answer. Reload and confirm the saved step.

Install the browser for the end-to-end suite with `pnpm exec playwright install chromium`.

Run `pnpm format`, `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm build`, and `pnpm test:e2e`. Use Conventional Commits such as `feat(content): demonstrate updater queues`. Use the actual date for new work.
