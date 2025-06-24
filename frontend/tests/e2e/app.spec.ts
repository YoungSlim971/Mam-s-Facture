import { test, expect } from '@playwright/test';

const CLIENT_NAME_E2E = 'Test Client E2E';
const CLIENT_EMAIL_E2E = 'test.client.e2e@example.com';
const INVOICE_SUBJECT_E2E = 'E2E Test Invoice Subject';

test.describe('Mam-s-Facture E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('apiToken', 'test-token');
    });
    await page.goto('/');
  });

  test('should display the main page and navigation', async ({ page }) => {
    await expect(page.getByRole('banner')).toBeVisible(); // TopBar
    await expect(page.getByRole('navigation')).toBeVisible(); // Sidebar
    await expect(page.getByRole('link', { name: /accueil/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /factures/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /clients/i })).toBeVisible();
  });

  test('should navigate to Clients page and verify UI elements', async ({ page }) => {
    await page.getByRole('link', { name: /clients/i }).click();
    await expect(page).toHaveURL(/.*\/clients/);
    await expect(page.getByRole('heading', { name: /liste des clients/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /ajouter un client/i })).toBeVisible();
  });

  test('should allow creating a new client', async ({ page }) => {
    await page.goto('/clients');
    await page.getByRole('button', { name: /ajouter un client/i }).click();

    const dialog = page.getByRole('dialog', { name: /ajouter un client/i });
    await expect(dialog).toBeVisible();

    await dialog.getByLabel(/nom du client/i).fill(CLIENT_NAME_E2E);
    await dialog.getByLabel(/email/i).fill(CLIENT_EMAIL_E2E);
    await dialog.getByLabel(/téléphone/i).fill('0123456789');
    await dialog.getByLabel(/adresse/i).fill('123 Test Street');
    await dialog.getByLabel(/ville/i).fill('Testville');
    await dialog.getByLabel(/code postal/i).fill('12345');
    await dialog.getByLabel(/pays/i).fill('Testland');

    await dialog.getByRole('button', { name: 'Enregistrer' }).click();

    await expect(dialog).not.toBeVisible({ timeout: 10000 }); // Increased timeout for dialog to close

    const successToast = page.getByText(/Client créé avec succès/i, { exact: false });
    await expect(successToast).toBeVisible({ timeout: 10000 }); // Wait for toast
    await expect(successToast).not.toBeVisible({ timeout: 15000 }); // Wait for toast to disappear


    // Verify the client is in the list
    await expect(page.getByText(CLIENT_NAME_E2E)).toBeVisible();
    await expect(page.getByText(CLIENT_EMAIL_E2E)).toBeVisible();
    // Note: Consider adding a cleanup step (e.g., test.afterEach) to delete this client
    // to ensure test idempotency if the backend persists this data across test runs.
  });

  test('should toggle theme', async ({ page }) => {
    await page.waitForLoadState('domcontentloaded');
    const html = page.locator('html');
    const initialTheme = await html.getAttribute('class');

    const themeToggleButton = page.getByLabel(/toggle theme/i);
    await expect(themeToggleButton).toBeVisible();

    await themeToggleButton.click();
    // It can take a moment for the theme class to update on html element
    await expect(html).not.toHaveClass(initialTheme || '', { timeout: 5000 });

    const newTheme = await html.getAttribute('class');
    expect(newTheme).not.toBe(initialTheme);

    // Toggle back
    await themeToggleButton.click();
    await expect(html).toHaveClass(initialTheme || '', { timeout: 5000 });
  });

  test('should navigate to Invoices page and verify UI elements', async ({ page }) => {
    await page.getByRole('link', { name: /factures/i }).click();
    await expect(page).toHaveURL(/.*\/factures/);
    await expect(page.getByRole('heading', { name: /liste des factures/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /créer une facture/i })).toBeVisible();
  });

  test('should allow creating a new invoice', async ({ page }) => {
    // First, ensure the client exists or create one.
    // For simplicity, this test assumes the client from 'should allow creating a new client'
    // might exist. A more robust approach would be to create a client via API or ensure
    // creation within this test or a setup step if tests are not run in order / state is not shared.
    // For now, we'll try to select an existing client or the one we usually create.
    // If no client is available, this test might be flaky.
    // A better way: create the client needed for this test here.
    await page.goto('/clients');
    // Check if client exists, if not, create it
    const clientInList = page.getByText(CLIENT_NAME_E2E);
    if (!await clientInList.isVisible()) {
        await page.getByRole('button', { name: /ajouter un client/i }).click();
        const dialog = page.getByRole('dialog', { name: /ajouter un client/i });
        await expect(dialog).toBeVisible();
        await dialog.getByLabel(/nom du client/i).fill(CLIENT_NAME_E2E);
        await dialog.getByLabel(/email/i).fill(CLIENT_EMAIL_E2E);
        await dialog.getByRole('button', { name: 'Enregistrer' }).click();
        await expect(dialog).not.toBeVisible({ timeout: 10000 });
        const successToast = page.getByText(/Client créé avec succès/i, { exact: false });
        await expect(successToast).toBeVisible({ timeout: 10000 });
        await expect(successToast).not.toBeVisible({ timeout: 15000 });
    }


    await page.goto('/factures/nouvelle');
    await expect(page.getByRole('heading', { name: /créer une facture/i })).toBeVisible();

    // Select client
    await page.getByLabel(/client/i).click(); // Opens the client dropdown/combobox
    await page.getByRole('option', { name: new RegExp(CLIENT_NAME_E2E, 'i') }).first().click();


    await page.getByLabel(/objet de la facture/i).fill(INVOICE_SUBJECT_E2E);
    // Fill due date - assuming a date picker, choose today or a fixed date
    // This might need adjustment based on actual date picker component
    await page.getByLabel(/date d'échéance/i).fill(new Date().toISOString().split('T')[0]);


    // Add invoice line
    await page.getByRole('button', { name: /ajouter une ligne/i }).click();
    const firstLineDescription = page.locator('textarea[name="lignes.0.description"]');
    await firstLineDescription.fill('Test Line Item 1');
    await page.locator('input[name="lignes.0.quantite"]').fill('1');
    await page.locator('input[name="lignes.0.prixUnitaire"]').fill('100');

    await page.getByRole('button', { name: /enregistrer la facture/i }).click();

    const successToastInvoice = page.getByText(/Facture créée avec succès/i, { exact: false });
    await expect(successToastInvoice).toBeVisible({ timeout: 10000 });
    await expect(successToastInvoice).not.toBeVisible({ timeout: 15000 });


    // Verify invoice in the list (might need to navigate to /factures first)
    await page.goto('/factures');
    await expect(page.getByText(INVOICE_SUBJECT_E2E)).toBeVisible();
    await expect(page.getByText(CLIENT_NAME_E2E)).toBeVisible();
  });

  test('should allow HTML export of an invoice', async ({ page }) => {
    // This test depends on an invoice existing.
    // It will try to export the invoice created in the 'should allow creating a new invoice' test.
    // Navigate to invoices list
    await page.goto('/factures');

    // Find the row containing the test invoice and click the view/details button/link
    // This assumes there's a link/button to view details. Adjust selector as needed.
    // For simplicity, let's assume clicking the subject navigates to details or there's a specific details button.
    // We need to find the specific invoice.
    const invoiceRow = page.locator('tr', { hasText: INVOICE_SUBJECT_E2E }).first();
    await expect(invoiceRow).toBeVisible();

    // Click on the invoice row or a "details" button within it to go to its detail page.
    // This is a common pattern, but might need adjustment.
    // Let's assume clicking the row or a specific link/button takes us to the detail page.
    // If the invoice subject itself is a link:
    // await invoiceRow.getByRole('link', { name: INVOICE_SUBJECT_E2E }).click();
    // Or if there's a generic "Details" or "View" button in the row:
    // await invoiceRow.getByRole('button', { name: /voir|détails/i }).click();
    // For now, let's assume the invoice subject is a link or part of a link to its details.
    // A more robust way is to get the invoice ID after creation and navigate directly if URL structure allows.

    // Click the first available link that leads to a facture detail page
    // This is a bit fragile, ideally we'd have a more specific selector
    await page.getByRole('link', { name: new RegExp(INVOICE_SUBJECT_E2E, 'i')}).first().click();
    await expect(page).toHaveURL(/.*\/factures\/\d+/); // Check if URL matches invoice detail pattern
    await expect(page.getByRole('heading', { name: new RegExp(INVOICE_SUBJECT_E2E, 'i')})).toBeVisible();


    // Listen for download event
    const downloadPromise = page.waitForEvent('download', { timeout: 15000 }); // Increased timeout for download

    // Click export HTML button
    // The selector for the export button needs to be verified from the actual UI.
    // Common patterns: getByRole('button', { name: /exporter.*html/i }) or a specific test ID.
    const exportButton = page.getByRole('button', { name: /exporter en html/i });
    await expect(exportButton).toBeVisible();
    await exportButton.click();

    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/facture_.*\.html/i);

    // Optional: Check file content if necessary, though this adds complexity.
    // For now, confirming download starts and has correct name extension is sufficient.
    // To check content, you'd need to save it and read it:
    // const path = await download.path();
    // expect(path).not.toBeNull();
    // const fs = require('fs');
    // const content = fs.readFileSync(path, 'utf-8');
    // expect(content).toContain(INVOICE_SUBJECT_E2E);

    // Ensure no error toast appears after export (if applicable)
    const errorToast = page.getByText(/erreur lors de l'exportation/i);
    await expect(errorToast).not.toBeVisible({ timeout: 1000 }); // Check quickly it's not there
  });
});
