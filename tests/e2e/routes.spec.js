const { test, expect } = require('@playwright/test');

test('2D game starts from production output', async ({ page }) => {
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
    await page.goto('/');
    await expect(page.locator('#game-canvas-container canvas')).toBeVisible();
    expect(errors).toEqual([]);
});

test('retired experiment route is unavailable', async ({ request }) => {
    expect((await request.get('/3d')).status()).toBe(404);
});

test('repository files are not served', async ({ request }) => {
    expect((await request.get('/package.json')).status()).toBe(404);
    expect((await request.get('/.git/HEAD')).status()).toBe(403);
});

test('responsive shell exposes accessible status and portrait guidance', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    await expect(page.locator('#game-announcements')).toHaveAttribute('aria-live', 'polite');
    await expect(page.locator('#orientation-hint')).toBeVisible();
    const crtButton = page.locator('#crt-toggle-btn');
    await crtButton.focus();
    expect(await crtButton.evaluate(element => document.activeElement === element)).toBeTruthy();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBeTruthy();
});
