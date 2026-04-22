import { test, expect } from '../fixtures/auth.fixture';

test.describe('Book Reservations E2E', () => {
  test.use({ storageState: '.auth/user.json' });

  test('user can reserve available book @smoke', async ({ page }) => {
    await page.goto('/home');
    
    const firstBook = page.locator('[data-testid="book-card"]').first();
    await firstBook.click();
    
    const reserveButton = page.locator('[data-testid="reserve-book"]');
    if (await reserveButton.isVisible()) {
      await reserveButton.click();
      
      await page.selectOption('[data-testid="reservation-days"]', '14');
      await page.click('[data-testid="confirm-reservation"]');
      
      await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
      await expect(page.locator('[data-testid="success-message"]')).toContainText('забронирована');
    }
  });

  test('user can view their reservations', async ({ page }) => {
    await page.goto('/reservations');
    
    await expect(page.locator('[data-testid="reservations-list"]')).toBeVisible();
    
    const reservations = page.locator('[data-testid="reservation-item"]');
    if (await reservations.count() > 0) {
      await expect(reservations.first().locator('[data-testid="book-title"]')).toBeVisible();
      await expect(reservations.first().locator('[data-testid="reservation-status"]')).toBeVisible();
    }
  });

  test('user can cancel pending reservation', async ({ page }) => {
    await page.goto('/reservations');
    
    // Находим бронирование со статусом "pending"
    const pendingReservation = page.locator('[data-testid="reservation-item"][data-status="pending"]').first();
    
    if (await pendingReservation.isVisible()) {
      await pendingReservation.locator('[data-testid="cancel-reservation"]').click();
      await page.click('[data-testid="confirm-cancel"]');
      
      await expect(page.locator('[data-testid="success-message"]')).toContainText('отменено');
    }
  });

  test('user cannot reserve already reserved book', async ({ page }) => {
    await page.goto('/home');
    
    const reservedBook = page.locator('[data-testid="book-card"][data-status="reserved"]').first();
    
    if (await reservedBook.isVisible()) {
      await reservedBook.click();
      
      const reserveButton = page.locator('[data-testid="reserve-book"]');
      await expect(reserveButton).toBeDisabled();
      await expect(page.locator('[data-testid="reservation-info"]')).toContainText('Уже забронирована');
    }
  });
});