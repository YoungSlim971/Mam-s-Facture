# AGENTS instructions

## Testing
Run the automated tests before committing any changes:

- For the backend:
  ```bash
  cd backend && pnpm install && pnpm test
  ```
- For the frontend:
  ```bash
  cd frontend && pnpm install && pnpm test
  ```

All tests must pass.

## PR message
Include separate **Summary** and **Testing** sections in the pull request body describing what was changed and confirming the tests ran.

## Project Overview
This repository contains a simple billing application split into two parts:

- **backend/** – Node.js + Express API using a SQLite database stored in
  `backend/database/facturation.sqlite`.  Main entry point is `server.js`.
  Business logic for HTML invoice generation lives in `services/` and tests in
  `backend/tests`.
- **frontend/** – React application built with Vite.  Components are under
  `src/components` and pages in `src/pages`.  End-to-end tests use Playwright in
  `frontend/tests/e2e`.

Run `./install.sh` from the project root to install both parts at once.  Start
the API with `pnpm start` inside `backend/` and the UI with `pnpm run dev` inside
`frontend/`.
