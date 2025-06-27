import { test, expect, Page } from '@playwright/test';

test.describe('TotalInvoicesPie Widget Tests', () => {
  let page: Page;
  let consoleMessages: { type: string; text: string }[] = [];
  // Define a type for the console listener function
  type ConsoleListener = (msg: any) => void;
  let currentConsoleListener: ConsoleListener | null = null;

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
    // Set up a common token for all tests in this file if needed
    // For now, assuming TotalInvoicesPie doesn't require a specific token beyond what might be globally set
    // await page.addInitScript(() => {
    //   window.localStorage.setItem('apiToken', 'test-token');
    // });
  });

  test.afterAll(async () => {
    await page.close();
  });

  test.beforeEach(async () => {
    consoleMessages = []; // Reset messages for each test

    // Remove previous listener if any, to be safe
    if (currentConsoleListener) {
      page.removeListener('console', currentConsoleListener);
      currentConsoleListener = null;
    }

    currentConsoleListener = (msg: any) => {
      const type = msg.type();
      const text = msg.text();
      // Filter out common Vite HMR messages or other known benign logs
      if (text.includes('[vite] connected.') || text.includes('Navigated to http://localhost:5173/') || text.includes('ws://localhost:5173/')) {
        return;
      }
      // Filter out specific known warnings if they are unavoidable and confirmed benign
      // Example: if (text.includes('some specific library warning')) return;

      if (type === 'error' || type === 'warn') {
        consoleMessages.push({ type, text });
      }
    };
    page.on('console', currentConsoleListener);

    // Navigate to home for each test, as TotalInvoicesPie is on the Accueil page
    await page.goto('/');
    // Wait for a key element of the Accueil page to be visible, ensuring the page is loaded
    // For example, waiting for the main landmark or a common header.
    await expect(page.getByRole('main')).toBeVisible({ timeout: 10000 });
  });

  test.afterEach(async () => {
    // Remove the specific listener after each test
    if (currentConsoleListener) {
      page.removeListener('console', currentConsoleListener);
      currentConsoleListener = null; // Clear the reference
    }

    if (consoleMessages.length > 0) {
      const formattedMessages = consoleMessages.map(msg => `CONSOLE ${msg.type.toUpperCase()}: ${msg.text}`).join('\n');
      // Log for easier debugging in CI or local runs
      console.error('Console errors/warnings detected:', formattedMessages);
      throw new Error(`Console errors/warnings found during test:\n${formattedMessages}`);
    }
  });

  // Placeholder for actual tests
  test('initial setup - page loads', async () => {
    await expect(page.getByRole('heading', { name: 'Tableau de bord' })).toBeVisible();
  });

  test('should intercept API request to /summary and verify response structure', async () => {
    let summaryApiCalled = false;
    let apiResponseData: any = null;

    await page.route('**/api/invoices/summary', async route => {
      summaryApiCalled = true;
      const response = await route.fetch();
      apiResponseData = await response.json();

      // Assertions about the response data structure
      expect(apiResponseData).toHaveProperty('payees');
      expect(typeof apiResponseData.payees).toBe('number');
      expect(apiResponseData).toHaveProperty('non_payees');
      expect(typeof apiResponseData.non_payees).toBe('number');

      // Log the actual data for debugging if needed
      // console.log('Intercepted /api/invoices/summary response:', apiResponseData);

      route.fulfill({ response });
    });

    // Reload the page to trigger the API call after setting up the route interceptor
    // or navigate again if the call happens strictly on initial load and beforeEach already loaded.
    await page.reload();

    // Wait for an element that depends on the API data to be visible,
    // ensuring the API call has been processed.
    // For TotalInvoicesPie, this could be the chart itself or a specific text.
    // Using a timeout to allow the async operations (API call, UI update) to complete.
    // We expect the chart to be visible if data is processed.
    await expect(page.getByTestId('invoice-pie-chart')).toBeVisible({ timeout: 15000 });

    // Assert that the API call was intercepted
    expect(summaryApiCalled).toBe(true);
    // Further check if data was captured (redundant if assertions on apiResponseData passed, but good for clarity)
    expect(apiResponseData).not.toBeNull();
  });

  test('should display the TotalInvoicesPie widget correctly', async () => {
    // 1. Verify the widget title
    await expect(page.getByRole('heading', { name: 'Répartition des factures' })).toBeVisible();

    // 2. Verify the presence of the pie chart
    // This assumes the pie chart container has data-testid="invoice-pie-chart"
    const pieChartLocator = page.getByTestId('invoice-pie-chart');
    await expect(pieChartLocator).toBeVisible();

    // 3. Verify the summary text pattern
    // The exact numbers depend on the API response, so we check for the pattern.
    // We need to locate the card that contains the pie chart and its summary text.
    // This can be done by finding a common ancestor or a specific card structure.
    // Let's assume the text is within the same card as the heading.
    const cardLocator = page.locator('div.card', { has: page.getByRole('heading', { name: 'Répartition des factures' }) });

    // Regex to match "X facture(s) au total"
    await expect(cardLocator.getByText(/facture(s)? au total/)).toBeVisible();
    // Regex to match "Y payée(s)"
    await expect(cardLocator.getByText(/payée(s)?/)).toBeVisible();
    // Regex to match "Z non payée(s)"
    await expect(cardLocator.getByText(/non payée(s)?/)).toBeVisible();

    // More specific check if numbers are predictable (e.g. from mock or stable demo data)
    // For example, if demo data always returns 4 payees and 3 non_payees:
    // await expect(cardLocator.getByText('7 factures au total', { exact: false })).toBeVisible();
    // await expect(cardLocator.getByText('4 payées', { exact: false })).toBeVisible();
    // await expect(cardLocator.getByText('3 non payées', { exact: false })).toBeVisible();
    // Using { exact: false } or regex is safer if plurals change "facture" to "factures" etc.
  });

  test('should verify pie chart segments and legend', async () => {
    const pieChartLocator = page.getByTestId('invoice-pie-chart');
    await expect(pieChartLocator).toBeVisible({ timeout: 10000 }); // Ensure chart is loaded

    // 1. Verify the number of actual pie slices (segments)
    // Recharts renders slices as <path class="recharts-pie-sector">...</path>
    // We expect two slices: one for "Payées" and one for "Non payées".
    const pieSlices = pieChartLocator.locator('path.recharts-pie-sector');
    await expect(pieSlices).toHaveCount(2);

    // 2. Verify legend items are present
    // These texts are typically rendered by the <Legend> component in Recharts.
    // We look for these texts within the scope of the pie chart component.
    await expect(pieChartLocator.getByText('Payées')).toBeVisible();
    await expect(pieChartLocator.getByText('Non payées')).toBeVisible();
  });

  test('should render correctly in Dark Mode', async () => {
    const htmlLocator = page.locator('html');
    const themeToggleButton = page.getByLabel(/toggle theme/i); // More robust selector for the theme toggle button

    // 1. Switch to Dark Mode
    // Check initial state (optional, assumes starts in light or system, and system is light for test env)
    // await expect(htmlLocator).not.toHaveClass(/dark/); // This might fail if system theme is dark

    await themeToggleButton.click();
    await expect(htmlLocator).toHaveClass(/dark/, { timeout: 5000 }); // Wait for class change

    // 2. Verify pie chart visibility in Dark Mode
    const pieChartLocator = page.getByTestId('invoice-pie-chart');
    await expect(pieChartLocator).toBeVisible();

    // 3. Verify legend items visibility in Dark Mode
    await expect(pieChartLocator.getByText('Payées')).toBeVisible();
    await expect(pieChartLocator.getByText('Non payées')).toBeVisible();

    // 4. Verify summary texts visibility in Dark Mode
    const cardLocator = page.locator('div.card', { has: page.getByRole('heading', { name: 'Répartition des factures' }) });
    await expect(cardLocator.getByText(/facture(s)? au total/)).toBeVisible();
    await expect(cardLocator.getByText(/payée(s)?/)).toBeVisible();
    await expect(cardLocator.getByText(/non payée(s)?/)).toBeVisible();

    // 5. Switch back to Light Mode (to leave the page in a predictable state for subsequent tests, if any)
    await themeToggleButton.click();
    await expect(htmlLocator).not.toHaveClass(/dark/, { timeout: 5000 }); // Wait for class change
  });
});
