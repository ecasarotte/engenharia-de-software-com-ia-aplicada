import { expect, test } from '@playwright/test';

test.describe('image gallery form', () => {
  test('submits a new image and adds it to the gallery', async ({ page }) => {
    const title = `Playwright Test ${Date.now()}`;
    const url = `https://example.com/${Date.now()}.png`;

    await page.goto('/vanilla-js-web-app-example/');
    await page.waitForTimeout(2000);
    await expect(page.getByRole('button', { name: 'Submit Form' })).toBeVisible();
    await page.waitForTimeout(2000);
    await page.getByRole('textbox', { name: 'Image Title' }).fill(title);
    await page.waitForTimeout(2000);
    await page.getByRole('textbox', { name: 'Image URL' }).fill(url);
    await page.waitForTimeout(2000);
    await page.getByRole('button', { name: 'Submit Form' }).click();
    await page.waitForTimeout(2000);

    const card = page.locator('main').locator('article').filter({
      has: page.getByRole('heading', { name: title }),
    });

    await expect(card.first()).toBeVisible();
    await expect(card.first().locator('img')).toHaveAttribute('src', url);
  });

  test('shows validation errors when required fields are missing', async ({ page }) => {
    await page.goto('/vanilla-js-web-app-example/');
    await page.waitForTimeout(2000);
    await expect(page.getByRole('button', { name: 'Submit Form' })).toBeVisible();
    await page.waitForTimeout(2000);
    await page.getByRole('button', { name: 'Submit Form' }).click();
    await page.waitForTimeout(2000);

    await expect(page.getByText('Please type a title for the image.')).toBeVisible();
    await page.waitForTimeout(2000);
    await expect(page.getByText('Please type a valid URL')).toBeVisible();
  });
});
