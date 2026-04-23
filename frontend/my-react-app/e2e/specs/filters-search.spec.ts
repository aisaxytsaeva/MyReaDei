import { test, expect } from '../fixtures/auth.fixture';

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
    await page.click('.search-button, button[type="submit"]');
    
    await expect(page).toHaveURL(/\/search/, { timeout: 5000 });
  });

  test('filter books by tags', async ({ page }) => {
    await page.click('.filter-toggle-btn');
    await page.waitForSelector('.tags-grid, .tags-filter-panel', { timeout: 5000 });
    
    const tagButtons = page.locator('.tag-checkbox-label, [class*="tag"]').filter({ hasText: /Детектив|Фантастика|Художественная/ });
    const firstTag = tagButtons.first();
    
    if (await firstTag.count() > 0) {
      await firstTag.click();
      await page.waitForTimeout(2000);
      
      const booksGrid = page.locator('.books-grid');
      await expect(booksGrid).toBeVisible();
    }
  });


  test('search input is visible and working', async ({ page }) => {
    const searchInput = page.locator('.search-input, input[placeholder*="запрос"], input[type="text"]').first();
    await expect(searchInput).toBeVisible();
    
    await searchInput.fill('Тест');
    expect(await searchInput.inputValue()).toBe('Тест');
  });

  test('popular books section loads', async ({ page }) => {
    const sectionTitle = page.locator('.section-title, h2:has-text("Что популярно сейчас")');
    await expect(sectionTitle).toBeVisible();
    
    const booksGrid = page.locator('.books-grid');
    await expect(booksGrid).toBeVisible();
    
    const books = await page.locator('.book-card-wrapper, [class*="book"]').count();
    expect(books).toBeGreaterThan(0);
  });

  test('can navigate to book details', async ({ page }) => {
    const firstBook = page.locator('.book-card-wrapper, [class*="book"]').first();
    await firstBook.waitFor({ state: 'visible', timeout: 10000 });
    
    const bookTitle = await firstBook.textContent();
    await firstBook.click();
    
    await expect(page).toHaveURL(/\/book\/\d+/, { timeout: 5000 });
  });

  test('tag filter panel toggles correctly', async ({ page }) => {
    const filterButton = page.locator('.filter-toggle-btn');
    
    const filterPanel = page.locator('.tags-filter-panel');
    const isVisible = await filterPanel.isVisible().catch(() => false);
    
    if (isVisible) {
      await filterButton.click();
      await expect(filterPanel).not.toBeVisible();
      await filterButton.click();
      await expect(filterPanel).toBeVisible();
    } else {
      await filterButton.click();
      await expect(filterPanel).toBeVisible();
      await filterButton.click();
      await expect(filterPanel).not.toBeVisible();
    }
  });
});