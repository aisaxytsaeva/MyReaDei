import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('user can login with valid credentials', async ({ page }) => {
    await page.goto('/auth'); 
    await page.fill('[data-testid="username"]', 'testuser');
    await page.fill('[data-testid="password"]', 'test123');
    await page.click('[data-testid="login-submit"]');
    
    await expect(page).toHaveURL('/home');
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
  });

  test('user can register', async ({ page }) => {
    await page.goto('/registration'); // Ваш путь регистрации
    await page.fill('[data-testid="username"]', 'newuser');
    await page.fill('[data-testid="email"]', 'new@example.com');
    await page.fill('[data-testid="password"]', 'test123');
    await page.fill('[data-testid="confirm-password"]', 'test123');
    await page.click('[data-testid="register-submit"]');
    
    await expect(page).toHaveURL('/home');
  });

  test('user can logout', async ({ page }) => {
    await page.goto('/auth');
    await page.fill('[data-testid="username"]', 'testuser');
    await page.fill('[data-testid="password"]', 'test123');
    await page.click('[data-testid="login-submit"]');
    await expect(page).toHaveURL('/home');
    
    await page.click('[data-testid="user-menu"]');
    await page.click('[data-testid="logout-button"]');
    
    await expect(page).toHaveURL('/'); // На главную
    await expect(page.locator('[data-testid="login-button"]')).toBeVisible();
  });
});