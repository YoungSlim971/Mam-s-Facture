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
