import { test, expect, Page } from '@playwright/test';

const CLIENT_NAME_E2E = 'Test Client E2E'; // Potentially needed if we interact with parts that create data
const INVOICE_SUBJECT_E2E = 'E2E Test Invoice Subject'; // Potentially needed

test.describe('Accueil Page Tests', () => {
  let page: Page;
  let consoleMessages: { type: string; text: string }[] = [];

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
    // Set up a common token for all tests in this file
    await page.addInitScript(() => {
      window.localStorage.setItem('apiToken', 'test-token');
    });
  });

  test.afterAll(async () => {
    await page.close();
  });

  test.beforeEach(async () => {
    consoleMessages = []; // Reset messages for each test
    page.on('console', msg => {
      const type = msg.type();
      const text = msg.text();
      // Filter out common Vite HMR messages or other known benign logs
      if (text.includes('[vite] connected.') || text.includes('Navigated to http://localhost:5173/')) {
        return;
      }
      if (type === 'error' || type === 'warn') {
        // More specific filtering if needed, e.g. for specific warnings from libraries if they are unavoidable
        // For now, capture all errors/warnings not explicitly filtered.
        consoleMessages.push({ type, text });
      }
    });

    // Navigate to home for each test
    await page.goto('/');
    // Wait for the page to be somewhat stable, e.g., a known element to appear
    // The TotalInvoicesPie component should be part of the initial load of the Accueil page.
    // Let's wait for the main landmark of the page to be visible.
    await expect(page.getByRole('main')).toBeVisible();
  });

  test.afterEach(async () => {
    page.removeListener('console', () => {}); // Clean up listener to avoid duplicates if page instance is reused differently later
    if (consoleMessages.length > 0) {
      const formattedMessages = consoleMessages.map(msg => `CONSOLE ${msg.type.toUpperCase()}: ${msg.text}`).join('\n');
      throw new Error(`Console errors/warnings found during test:\n${formattedMessages}`);
    }
  });

  test('should display TotalInvoicesPie and fetch summary data', async () => {
    console.log('Test: Verifying TotalInvoicesPie and API request to /api/invoices/summary');

    // 1. Intercept the API request
    let summaryRequestMade = false;
    let requestUrl = '';

    await page.route('**/api/invoices/summary', async route => {
      console.log('Intercepted /api/invoices/summary request');
      summaryRequestMade = true;
      requestUrl = route.request().url();

      // Expect the method to be GET
      expect(route.request().method()).toBe('GET');

      // Continue the request and get the response
      const response = await route.fetch();
      const json = await response.json();

      console.log('Actual API Response for /api/invoices/summary:', json);

      // 2. Verify response from the actual backend (demo data)
      expect(json).toEqual({
        payees: 4,
        non_payees: 3,
      });

      // Fulfill the request with the actual response
      route.fulfill({ response });
    });

    // Reload the page to ensure the component mounts and makes the call *after* route is set up
    // or ensure the component is expected to make the call upon some interaction if not on initial load.
    // In this case, TotalInvoicesPie fetches on mount. Since beforeEach already navigates,
    // we might need to ensure route is set before navigation or re-trigger.
    // For simplicity, a reload after setting the route is robust here.
    await page.reload();

    // Wait for the component to potentially make the call and for the assertion within the route handler to complete.
    // We need a way to ensure the request has had a chance to be made and processed.
    // Waiting for a UI element that depends on this data is a good practice.
    await expect(page.getByTestId('invoice-pie-chart')).toBeVisible({ timeout: 10000 });

    // 3. Assert that the request was made
    expect(summaryRequestMade).toBe(true);
    console.log(`Request to ${requestUrl} was made.`);

    // Additional check to ensure the component is visible on the page
    // The TotalInvoicesPie component is rendered within a Card, let's look for its title
    await expect(page.getByRole('heading', { name: 'Répartition des factures' })).toBeVisible();
  });

  test('should correctly render pie chart content in Light Mode', async () => {
    console.log('Test: Verifying pie chart content in Light Mode');

    // Ensure the page is in light mode by default (or set it explicitly if needed)
    // For now, assume default is light. We'll check html class if available.
    // const html = page.locator('html');
    // await expect(html).not.toHaveClass(/dark/); // Assuming 'dark' class is used for dark mode

    const pieChartLocator = page.getByTestId('invoice-pie-chart');
    await expect(pieChartLocator).toBeVisible({ timeout: 10000 });

    // Verify legend items
    // Recharts typically renders legend items as <li> or similar, often with a <title> or text content.
    // Let's look for text elements within the chart that correspond to legend items.
    // The <Legend> component in TotalInvoicesPie.tsx implies these texts will be present.
    await expect(pieChartLocator.getByText('Payées')).toBeVisible();
    await expect(pieChartLocator.getByText('Non payées')).toBeVisible();

    // Verify the number of actual pie slices rendered by Recharts
    // Recharts renders slices as <path class="recharts-pie-sector">...</path>
    // We expect two slices: one for "Payées" and one for "Non payées".
    const pieSlices = pieChartLocator.locator('path.recharts-pie-sector');
    await expect(pieSlices).toHaveCount(2);

    // Verify text content for counts (based on TotalInvoicesPie.tsx)
    // These texts are outside the chart itself but inside the Card.
    const cardContentLocator = page.locator('//div[contains(@class, "card-content") and .//*[@data-testid="invoice-pie-chart"]]');

    // It might be simpler to target the card containing the heading "Répartition des factures"
    const cardLocator = page.locator('div.card', { has: page.getByRole('heading', { name: 'Répartition des factures' }) });

    await expect(cardLocator.getByText('7 facture au total', { exact: false })).toBeVisible(); // Using {exact: false} for "facture" vs "factures"
    await expect(cardLocator.getByText('4 payée', { exact: false })).toBeVisible(); // Handles singular/plural "payée/s"
    await expect(cardLocator.getByText('3 non payée', { exact: false })).toBeVisible(); // Handles singular/plural "non payée/s"

    console.log('Pie chart content verified in Light Mode.');
  });

  test('should correctly render pie chart content in Dark Mode', async () => {
    console.log('Test: Verifying pie chart content in Dark Mode');

    // 1. Switch to Dark Mode
    const themeToggleButton = page.getByLabel(/toggle theme/i);
    await expect(themeToggleButton).toBeVisible();

    const htmlLocator = page.locator('html');
    const initialThemeClass = await htmlLocator.getAttribute('class') || "";

    await themeToggleButton.click();

    // Wait for the theme class to change to 'dark'
    // It might remove 'light' or just add 'dark'. Assuming 'dark' class is added.
    await expect(htmlLocator).toHaveClass(/dark/, { timeout: 5000 });
    console.log('Switched to Dark Mode.');

    // 2. Verify pie chart visibility
    const pieChartLocator = page.getByTestId('invoice-pie-chart');
    await expect(pieChartLocator).toBeVisible({ timeout: 10000 });

    // 3. Verify legend items
    await expect(pieChartLocator.getByText('Payées')).toBeVisible();
    await expect(pieChartLocator.getByText('Non payées')).toBeVisible();

    // 4. Verify the number of actual pie slices
    const pieSlices = pieChartLocator.locator('path.recharts-pie-sector');
    await expect(pieSlices).toHaveCount(2);

    // 5. Verify text content for counts
    const cardLocator = page.locator('div.card', { has: page.getByRole('heading', { name: 'Répartition des factures' }) });
    await expect(cardLocator.getByText('7 facture au total', { exact: false })).toBeVisible();
    await expect(cardLocator.getByText('4 payée', { exact: false })).toBeVisible();
    await expect(cardLocator.getByText('3 non payée', { exact: false })).toBeVisible();

    console.log('Pie chart content verified in Dark Mode.');

    // Optional: Switch back to light mode to leave state clean if needed, though typically tests are isolated.
    // await themeToggleButton.click();
    // await expect(htmlLocator).not.toHaveClass(/dark/, { timeout: 5000 });
    // console.log('Switched back to Light Mode.');
  });
});
