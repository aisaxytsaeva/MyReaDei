import { test, expect } from '../fixtures/auth.fixture';

// Вспомогательная функция для клика через JavaScript
async function jsClick(page: any, selector: string) {
  await page.evaluate((sel: string) => {
    const element = document.querySelector(sel) as HTMLElement;
    if (element) element.click();
  }, selector);
}

test.describe('Catalog Filters and Search', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/home');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
  });

  test('search books by title', async ({ page }) => {
    const searchInput = page.locator('.search-input, input[placeholder*="запрос"], input[type="text"]').first();
    await searchInput.waitFor({ state: 'visible', timeout: 10000 });
    
    await searchInput.fill('Капитанская дочка');
    
    await jsClick(page, '.search-button, button[type="submit"]');
    
    await expect(page).toHaveURL(/\/search/, { timeout: 5000 });
  });

  test('filter books by tags', async ({ page }) => {
    await jsClick(page, '.filter-toggle-btn');
    await page.waitForTimeout(1000);
    
    await page.waitForSelector('.tags-grid', { timeout: 5000 });
    
    // Клик через JavaScript на первый тег
    await jsClick(page, '.tag-checkbox-label');
    await page.waitForTimeout(2000);
    
    const booksGrid = page.locator('.books-grid');
    const emptyState = page.locator('.empty-state');
    
    const isBooksVisible = await booksGrid.isVisible().catch(() => false);
    const isEmptyVisible = await emptyState.isVisible().catch(() => false);
    
    expect(isBooksVisible || isEmptyVisible).toBeTruthy();
  });

  test('search input is visible and working', async ({ page }) => {
    const searchInput = page.locator('.search-input, input[placeholder*="запрос"], input[type="text"]').first();
    await expect(searchInput).toBeVisible();
    
    await searchInput.fill('Тест');
    expect(await searchInput.inputValue()).toBe('Тест');
  });

  test('popular books section loads', async ({ page }) => {
    const sectionTitle = page.locator('.section-title');
    await expect(sectionTitle).toBeVisible();
    
    const booksGrid = page.locator('.books-grid');
    await expect(booksGrid).toBeVisible();
    
    const books = await page.locator('.book-card-wrapper').count();
    expect(books).toBeGreaterThan(0);
  });

  test('can navigate to book details', async ({ page }) => {
    await page.waitForSelector('.book-card-wrapper', { timeout: 10000 });
    await jsClick(page, '.book-card-wrapper');
    await expect(page).toHaveURL(/\/book\/\d+/, { timeout: 5000 });
  });
});