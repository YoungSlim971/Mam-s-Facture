import { test, expect, Page } from '@playwright/test';

const CLIENT_NAME = 'Test Client E2E';
const CLIENT_EMAIL = 'test.client.e2e@example.com';

test.describe('Mam-s-Facture E2E Tests', () => {
  let page: Page;

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
    await page.goto('/');
  });

  test.afterAll(async () => {
    await page.close();
  });

  test('should display the main page and navigation', async () => {
    await expect(page.getByRole('banner')).toBeVisible(); // TopBar
    await expect(page.getByRole('navigation')).toBeVisible(); // Sidebar
    await expect(page.getByRole('link', { name: /accueil/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /factures/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /clients/i })).toBeVisible();
  });

  test('should navigate to Clients page', async () => {
    await page.getByRole('link', { name: /clients/i }).click();
    await expect(page).toHaveURL(/.*\/clients/);
    await expect(page.getByRole('heading', { name: /liste des clients/i })).toBeVisible();
  });

  test('should allow creating a new client', async () => {
    await page.goto('/clients');
    await page.getByRole('button', { name: /ajouter un client/i }).click();

    await expect(page.getByRole('dialog', { name: /ajouter un client/i})).toBeVisible();

    await page.getByLabel(/nom du client/i).fill(CLIENT_NAME);
    await page.getByLabel(/email/i).fill(CLIENT_EMAIL);
    await page.getByLabel(/téléphone/i).fill('0123456789');
    await page.getByLabel(/adresse/i).fill('123 Test Street');
    await page.getByLabel(/ville/i).fill('Testville');
    await page.getByLabel(/code postal/i).fill('12345');
    await page.getByLabel(/pays/i).fill('Testland');

    await page.getByRole('button', { name: 'Enregistrer' }).click();

    // Wait for the dialog to disappear
    await expect(page.getByRole('dialog', { name: /ajouter un client/i})).not.toBeVisible();

    // Check for success toast (adapt selector if needed)
    const successToast = page.getByText(/Client créé avec succès/i);
    await expect(successToast).toBeVisible();
    await successToast.waitFor({ state: 'hidden', timeout: 10000 });


    // Verify the client is in the list
    await expect(page.getByText(CLIENT_NAME)).toBeVisible();
    await expect(page.getByText(CLIENT_EMAIL)).toBeVisible();
  });

  test('should toggle theme', async () => {
    const html = page.locator('html');
    const currentTheme = await html.getAttribute('class');

    const themeToggleButton = page.getByLabel(/toggle theme/i);
    await expect(themeToggleButton).toBeVisible();

    await themeToggleButton.click();

    // Wait for theme change, check if class attribute on html tag changed
    await expect(html).not.toHaveClass(currentTheme || ''); // currentTheme could be null

    const newTheme = await html.getAttribute('class');
    expect(newTheme).not.toBe(currentTheme);

    // Toggle back
    await themeToggleButton.click();
    await expect(html).toHaveClass(currentTheme || '');
  });

  // Placeholder for future tests
  test('should navigate to Invoices page', async () => {
    await page.getByRole('link', { name: /factures/i }).click();
    await expect(page).toHaveURL(/.*\/factures/);
    await expect(page.getByRole('heading', { name: /liste des factures/i })).toBeVisible();
  });
});
