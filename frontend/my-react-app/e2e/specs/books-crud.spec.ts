import { test, expect } from '../fixtures/auth.fixture';

test.describe('Books CRUD Operations', () => {
  
  test('user can create a new book', async ({ page, authenticatedPage }) => {
    await page.goto('/add-book');
    
    await page.fill('[data-testid="book-title"]', 'E2E Test Book');
    await page.fill('[data-testid="book-author"]', 'E2E Author');
    await page.fill('[data-testid="book-description"]', 'This is a test book');
    
    await page.click('[data-testid="location-select"]');
    await page.click('[data-testid="location-option-1"]');
    
    await page.setInputFiles('[data-testid="cover-upload"]', 'e2e/fixtures/test-cover.jpg');
    
    await page.click('[data-testid="submit-book"]');
    
    await expect(page).toHaveURL(/\/book\/\d+/);
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="book-title"]')).toContainText('E2E Test Book');
  });

  test('user can view book details', async ({ page, authenticatedPage }) => {
    await page.goto('/home');
    await page.click('[data-testid="book-card"]:first-child');
    
    await expect(page).toHaveURL(/\/book\/\d+/);
    await expect(page.locator('[data-testid="book-details"]')).toBeVisible();
    await expect(page.locator('[data-testid="book-title"]')).toBeVisible();
    await expect(page.locator('[data-testid="book-author"]')).toBeVisible();
  });

  test('user can update their own book', async ({ page, authenticatedPage }) => {
    await page.goto('/add-book');
    await page.fill('[data-testid="book-title"]', 'Book to Update');
    await page.fill('[data-testid="book-author"]', 'Original Author');
    await page.fill('[data-testid="book-description"]', 'Original description');
    await page.click('[data-testid="location-select"]');
    await page.click('[data-testid="location-option-1"]');
    await page.click('[data-testid="submit-book"]');
    
    await expect(page).toHaveURL(/\/book\/\d+/);
    
    await page.click('[data-testid="edit-book"]');
    await expect(page).toHaveURL(/\/edit-book\/\d+/);
    
    await page.fill('[data-testid="book-title"]', 'Updated Book Title');
    await page.fill('[data-testid="book-author"]', 'Updated Author');
    await page.click('[data-testid="submit-book"]');
    
    await expect(page).toHaveURL(/\/book\/\d+/);
    await expect(page.locator('[data-testid="book-title"]')).toContainText('Updated Book Title');
  });

  test('user can delete their own book', async ({ page, authenticatedPage }) => {
    await page.goto('/add-book');
    await page.fill('[data-testid="book-title"]', 'Book to Delete');
    await page.fill('[data-testid="book-author"]', 'Author');
    await page.fill('[data-testid="book-description"]', 'Description');
    await page.click('[data-testid="location-select"]');
    await page.click('[data-testid="location-option-1"]');
    await page.click('[data-testid="submit-book"]');
    
    const bookUrl = page.url();
    
    await page.click('[data-testid="delete-book"]');
    await page.click('[data-testid="confirm-delete"]');
    
    await expect(page).toHaveURL('/home');
    
    await page.goto(bookUrl);
    await expect(page.locator('[data-testid="not-found"]')).toBeVisible();
  });
});