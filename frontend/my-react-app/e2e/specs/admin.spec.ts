import { test, expect } from '../fixtures/auth.fixture';

test.describe('Admin Functions E2E', () => {
  test.use({ storageState: '.auth/admin.json' });

  test('admin can view admin dashboard', async ({ page }) => {
    await page.goto('/admin');
    
    await expect(page.locator('[data-testid="admin-dashboard"]')).toBeVisible();
    await expect(page.locator('[data-testid="admin-menu"]')).toBeVisible();
  });

  test('admin can view all users', async ({ page }) => {
    await page.goto('/admin/users');
    
    await expect(page.locator('[data-testid="users-table"]')).toBeVisible();
    const userRows = page.locator('[data-testid="user-row"]');
    expect(await userRows.count()).toBeGreaterThan(0);
  });

  test('admin can change user role', async ({ page }) => {
    await page.goto('/admin/users');
    
    const firstUser = page.locator('[data-testid="user-row"]').first();
    const currentRole = await firstUser.locator('[data-testid="user-role"]').textContent();
    
    await firstUser.locator('[data-testid="edit-role"]').click();
    await firstUser.locator('[data-testid="role-select"]').selectOption('moderator');
    await firstUser.locator('[data-testid="save-role"]').click();
    
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
    await expect(firstUser.locator('[data-testid="user-role"]')).toContainText('moderator');
    
    await firstUser.locator('[data-testid="edit-role"]').click();
    await firstUser.locator('[data-testid="role-select"]').selectOption(currentRole || 'user');
    await firstUser.locator('[data-testid="save-role"]').click();
  });

  test('admin can view pending locations', async ({ page }) => {
    await page.goto('/admin/locations');
    
    await expect(page.locator('[data-testid="pending-locations"]')).toBeVisible();
    const pendingLocations = page.locator('[data-testid="pending-location"]');
    
    if (await pendingLocations.count() > 0) {
      await expect(pendingLocations.first().locator('[data-testid="approve-button"]')).toBeVisible();
      await expect(pendingLocations.first().locator('[data-testid="reject-button"]')).toBeVisible();
    }
  });

  test('admin can approve pending location', async ({ page }) => {
    await page.goto('/admin/locations');
    
    const firstPending = page.locator('[data-testid="pending-location"]').first();
    
    if (await firstPending.isVisible()) {
      const locationName = await firstPending.locator('[data-testid="location-name"]').textContent();
      
      await firstPending.locator('[data-testid="approve-button"]').click();
      await page.click('[data-testid="confirm-approve"]');
      
      await expect(page.locator('[data-testid="success-message"]')).toContainText('подтверждена');
      await expect(firstPending).not.toBeVisible();
    }
  });

  test('admin can view books marked for deletion', async ({ page }) => {
    await page.goto('/admin/books/deletion');
    
    await expect(page.locator('[data-testid="deletion-queue"]')).toBeVisible();
  });
});