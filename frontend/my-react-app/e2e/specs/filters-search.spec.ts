import { test, expect } from '../fixtures/auth.fixture';

test.describe('Catalog Filters and Search', () => {
  test.beforeEach(async ({ page, authenticatedPage }) => {
    await page.goto('/home'); // Ваш каталог на "/home"
  });

  test('search books by title', async ({ page }) => {
    await page.fill('[data-testid="search-input"]', 'Война и мир');
    await page.click('[data-testid="search-button"]');
    
    await expect(page).toHaveURL(/\/search\?query=/);
    await expect(page.locator('[data-testid="book-card"]')).toHaveCount(1);
  });

  test('filter books by tags', async ({ page }) => {
    await page.click('[data-testid="filter-button"]');
    await page.click('[data-testid="tag-filter-Роман"]');
    await page.click('[data-testid="apply-filters"]');
    
    await expect(page).toHaveURL(/\/home\?tags=/);
    const books = page.locator('[data-testid="book-card"]');
    
    for (const book of await books.all()) {
      await expect(book.locator('[data-testid="tag"]')).toContainText('Роман');
    }
  });

  test('pagination works', async ({ page }) => {
    await expect(page.locator('[data-testid="book-card"]')).toHaveCount(10);
    await page.click('[data-testid="next-page"]');
    await expect(page).toHaveURL(/\/home\?skip=10/);
  });
});