import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('user can register, login, go to profile and logout', async ({ page }) => {
    const username = `logintest_${Date.now()}`;
    const email = `${username}@example.com`;
    const password = 'Test123456!';
    
    await page.goto('/registration');
    await page.fill('[data-testid="username"]', username);
    await page.fill('[data-testid="email"]', email);
    await page.fill('[data-testid="password"]', password);
    await page.click('button:has-text("Зарегистрироваться")');
    await page.waitForURL('/auth', { timeout: 10000 });
    
    await page.fill('[data-testid="username"]', username);
    await page.fill('[data-testid="password"]', password);
    await page.click('button:has-text("Войти")');
    await page.waitForURL('/home', { timeout: 10000 });
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
    
    await page.click('[data-testid="user-menu"]');
    await page.waitForURL('/profile', { timeout: 10000 });
    await expect(page).toHaveURL('/profile');
    
    await expect(page.locator('h1.profile-user-name')).toContainText(username);
    
    await page.click('button:has-text("Выйти")');
    await page.waitForURL('/', { timeout: 10000 });
    await expect(page).toHaveURL('/');
    
    await expect(page.locator('[data-testid="login-button"]')).toBeVisible();
  });
});