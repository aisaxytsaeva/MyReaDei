import { test as base, expect, Page, request } from '@playwright/test';

type AuthFixtures = {
  authenticatedPage: Page;
  adminPage: Page;
  moderatorPage: Page;
  yunhoPage: Page;
};

export const test = base.extend<AuthFixtures>({
  authenticatedPage: async ({ page }, use) => {
    const username = `e2e_test_${Date.now()}`;
    const password = 'Test123456!';
    
    const apiContext = await request.newContext();
    await apiContext.post('http://localhost:8000/auth/register', {
      data: {
        username: username,
        email: `${username}@example.com`,
        password: password
      }
    });
    
    await page.goto('/auth');
    await page.fill('[data-testid="username"]', username);
    await page.fill('[data-testid="password"]', password);
    await page.click('button:has-text("Войти")');
    await page.waitForURL('/home', { timeout: 10000 });
    
    await use(page);
  },
  
  adminPage: async ({ page }, use) => {
    await page.goto('/auth');
    await page.fill('[data-testid="username"]', 'admin');
    await page.fill('[data-testid="password"]', 'admin123');
    await page.click('button:has-text("Войти")');
    await page.waitForURL('/home', { timeout: 10000 });
    
    await use(page);
  },
  
  moderatorPage: async ({ page }, use) => {
    await page.goto('/auth');
    await page.fill('[data-testid="username"]', 'moderator');
    await page.fill('[data-testid="password"]', 'moderator123');
    await page.click('button:has-text("Войти")');
    await page.waitForURL('/home', { timeout: 10000 });
    
    await use(page);
  },
  
  yunhoPage: async ({ page }, use) => {
    await page.goto('/auth');
    await page.fill('[data-testid="username"]', 'yunho');
    await page.fill('[data-testid="password"]', 'Mingi_yunho99');
    await page.click('button:has-text("Войти")');
    await page.waitForURL('/home', { timeout: 10000 });
    
    await use(page);
  },
});

export { expect };