# Frontend Developer Notes

## Mocking `src/lib/api.ts` in Jest Tests

### Why and When to Mock `api.ts`

The module `src/lib/api.ts` exports `API_URL` and `GEMINI_API_KEY`. These constants are derived from `import.meta.env` variables (e.g., `import.meta.env.VITE_API_URL`). Vite replaces these `import.meta.env` expressions with actual values during its build process.

However, Jest runs tests in a Node.js environment where `import.meta.env` is not available or processed in the same way as by Vite. When Jest encounters `import.meta.env` directly in a module like `api.ts` (especially when `ts-jest` processes TypeScript files), it can lead to a `SyntaxError: Cannot use 'import.meta' outside a module`.

To resolve this issue for tests that import components or modules relying on `api.ts`, we mock `api.ts` directly within the test files that need it. This bypasses the problematic `import.meta.env` access at test time.

### How to Mock `api.ts` in New Tests

If you have a test file for a component that directly or indirectly imports from `src/lib/api.ts` and you encounter the `import.meta` error, you should mock the `api.ts` module at the top of your test file.

Use `jest.mock('@/lib/api', ...)` to provide mock implementations for the exported constants.

**Example Snippet:**

```typescript
// At the top of your .test.tsx or .test.ts file:
import { render, screen } from '@testing-library/react';
import YourComponentThatUsesApi from './YourComponentThatUsesApi'; // Adjust path as needed

// Mock the api module
// Replace '@/lib/api' with the correct relative path if not using path aliases,
// or ensure your Jest moduleNameMapper handles '@/' correctly.
jest.mock('@/lib/api', () => ({
  API_URL: 'http://localhost:1234/mock-api', // Provide a suitable mock URL for your test
  GEMINI_API_KEY: 'mock-test-gemini-key',    // Provide a suitable mock key if needed
}));

describe('YourComponentThatUsesApi', () => {
  test('should render correctly with mocked API_URL', () => {
    // Your component will now use the mocked API_URL when it imports from '@/lib/api'
    render(<YourComponentThatUsesApi />);

    // Example: If your component makes a fetch call using API_URL,
    // you would also mock global.fetch here to control the API response.
    // global.fetch = jest.fn().mockResolvedValue({
    //   ok: true,
    //   json: async () => ({ data: 'mocked response' }),
    // });

    // Add your assertions here
    // expect(screen.getByText('Some text rendered using mocked API data')).toBeInTheDocument();
  });
});
```

### Conventions and Best Practices

1.  **Local Mocks:** Prefer mocking `api.ts` locally within the test files that specifically require it, rather than creating a global mock file (e.g., in a `__mocks__` directory adjacent to `api.ts`). This keeps mocks explicit and scoped.
2.  **Minimal Mocks:** Only mock the exports that are actually used by the module under test if known. However, `api.ts` is small, so mocking both its exports (`API_URL`, `GEMINI_API_KEY`) is generally fine.
3.  **Placeholder Values:** Use simple and clearly identifiable mock values (e.g., `'http://localhost:1234/mock-api'`). The actual value usually doesn't matter if the network requests themselves are also mocked (e.g., using `jest.spyOn(global, 'fetch')`).
4.  **Path Aliases:** The example uses `'@/lib/api'`. Ensure your Jest `moduleNameMapper` in `jest.config.js` is configured to resolve `@/` if you use such path aliases (e.g., `"^@/(.*)$": "<rootDir>/src/$1"`).
5.  **Avoid Unnecessary Mocking:** If a component or module does not import from `api.ts` (even indirectly), there's no need to add this mock.

This approach ensures that tests for components relying on `api.ts` can run without errors related to `import.meta.env` and allows you to control the API endpoint values during testing.

## Running E2E Tests

End-to-end tests are written with [Playwright](https://playwright.dev/). The configuration in `playwright.config.ts` automatically launches both the Vite dev server and the backend API. The backend is started in **dev** mode so that type errors do not block the tests.

Run the following from the `frontend` directory:

```bash
pnpm exec playwright install --with-deps    # first time only
pnpm exec playwright test                   # run all E2E tests
```

The servers will listen on `http://localhost:5173` for the frontend and `http://localhost:3001` for the backend. Playwright will stop them when the tests finish.
