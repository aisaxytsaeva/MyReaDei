import { test as base, expect, Page } from '@playwright/test';

type AuthFixtures = {
  authenticatedPage: Page;
  adminPage: Page;
};

export const test = base.extend<AuthFixtures>({
  authenticatedPage: async ({ page }, use) => {
    await page.goto('/auth');
    await page.fill('[data-testid="username"]', 'e2e_test_user');
    await page.fill('[data-testid="password"]', 'Test123!');
    await page.click('[data-testid="login-submit"]');
    await expect(page).toHaveURL('/home');
    await use(page);
  },
  
  adminPage: async ({ page }, use) => {
    await page.goto('/auth');
    await page.fill('[data-testid="username"]', 'e2e_admin');
    await page.fill('[data-testid="password"]', 'Admin123!');
    await page.click('[data-testid="login-submit"]');
    await expect(page).toHaveURL('/admin');
    await use(page);
  },
});

export { expect };