import { test, expect } from '@playwright/test';

const selectors = {
  titleInput: '[data-testid="title-input"]',
  authorInput: '[data-testid="author-input"]',
  descriptionInput: '[data-testid="description-input"]',
  submitButton: '[data-testid="submit-book"]',
  cancelButton: '[data-testid="cancel-button"]',
  externalSearchInput: '[data-testid="external-search-input"]',
  externalSearchButton: '[data-testid="external-search-button"]',
  externalBookResults: '[data-testid="external-book-results"]',
  importBookButton: '[data-testid="import-book-button"]',
  validationError: '.validation-error',
  bookTitle: '.book-title', 
};


async function selectFirstLocation(page: any) {
  try {
    await page.click('[data-testid="location-select"]');
    await page.waitForTimeout(500);
    
    await page.evaluate(() => {
      const checkbox = document.querySelector('input[data-testid^="location-option-"]') as HTMLInputElement;
      if (checkbox && !checkbox.checked) {
        checkbox.click();
      }
    });
    
    await page.waitForTimeout(300);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);
    return true;
  } catch (error) {
    console.log('Could not select location:', error);
    return false;
  }
}

test.describe('Add/Edit Book Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth');
    await page.fill('[data-testid="username"]', 'admin');
    await page.fill('[data-testid="password"]', 'admin123');
    await page.click('button:has-text("Войти")');
    await expect(page).toHaveURL('/home', { timeout: 10000 });
  });

  test('user can create a new book with valid data', async ({ page }) => {
    const uniqueTitle = `Тестовая книга ${Date.now()}`;
    
    await page.goto('/add-book');
    await page.waitForSelector(selectors.titleInput, { timeout: 15000 });
    
    await page.fill(selectors.titleInput, uniqueTitle);
    await page.fill(selectors.authorInput, 'Тестовый Автор');
    await page.fill(selectors.descriptionInput, 'Тестовое описание');
    
    // Выбираем локацию
    await selectFirstLocation(page);
    
    await page.click(selectors.submitButton);
    
    await expect(page).toHaveURL(/\/book\/\d+/, { timeout: 15000 });
    // Используем правильный селектор для заголовка книги
    await expect(page.locator(selectors.bookTitle)).toContainText(uniqueTitle);
  });

  test('requires location selection before submission', async ({ page }) => {
    await page.goto('/add-book');
    await page.waitForSelector(selectors.titleInput, { timeout: 15000 });
    
    await page.fill(selectors.titleInput, 'Книга без локации');
    await page.fill(selectors.authorInput, 'Автор');
    await page.click(selectors.submitButton);
    
    const errorMessage = page.locator(selectors.validationError);
    await expect(errorMessage).toBeVisible({ timeout: 5000 });
    const errorText = await errorMessage.textContent();
    expect(errorText?.toLowerCase()).toContain('локац');
  });

  test('user can cancel book creation', async ({ page }) => {
    await page.goto('/add-book');
    await page.waitForSelector(selectors.titleInput, { timeout: 15000 });
    
    await page.fill(selectors.titleInput, 'Отмененная книга');
    await page.click(selectors.cancelButton);
    
    await expect(page).toHaveURL('/mybooks');
  });

  test('unauthenticated user cannot access add-book page', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    
    await page.goto('/add-book');
    await expect(page).toHaveURL('/auth', { timeout: 10000 });
    
    await context.close();
  });

  test('user can edit existing book', async ({ page }) => {
  const originalTitle = `Оригинальная книга ${Date.now()}`;
  const updatedTitle = `Обновленная книга ${Date.now()}`;
  
  await page.goto('/add-book');
  await page.waitForSelector(selectors.titleInput, { timeout: 15000 });
  
  await page.fill(selectors.titleInput, originalTitle);
  await page.fill(selectors.authorInput, 'Оригинальный Автор');
  await page.fill(selectors.descriptionInput, 'Оригинальное описание');
  
  await selectFirstLocation(page);
  
  await page.click(selectors.submitButton);
  
  // Ждем перенаправления на страницу книги
  await page.waitForURL(/\/book\/\d+/, { timeout: 15000 });
  
  // Получаем ID книги из URL
  const bookUrl = page.url();
  const bookId = bookUrl.split('/').pop();
  
  await expect(page.locator(selectors.bookTitle)).toContainText(originalTitle);
  

  const editButton = page.locator('button:has-text("Редактировать")');
  await expect(editButton).toBeVisible({ timeout: 5000 });
  await editButton.click();
  
  await page.waitForURL(`/edit-book/${bookId}`, { timeout: 15000 });
  
  await page.waitForSelector(selectors.titleInput, { timeout: 15000 });
  
  await page.fill(selectors.titleInput, '');
  await page.fill(selectors.titleInput, updatedTitle);
  
  await page.click(selectors.submitButton);
  
  await page.waitForURL(`/book/${bookId}`, { timeout: 15000 });
  
  await expect(page.locator(selectors.bookTitle)).toContainText(updatedTitle);
});

  test('form validation requires title', async ({ page }) => {
    await page.goto('/add-book');
    await page.waitForSelector(selectors.authorInput, { timeout: 15000 });
    
    await page.fill(selectors.authorInput, 'Автор');
    await page.click(selectors.submitButton);
    
    const errorMessage = page.locator(selectors.validationError);
    await expect(errorMessage).toBeVisible({ timeout: 5000 });
    const errorText = await errorMessage.textContent();
    expect(errorText?.toLowerCase()).toMatch(/название|title/i);
  });

  test('form validation requires author', async ({ page }) => {
    await page.goto('/add-book');
    await page.waitForSelector(selectors.titleInput, { timeout: 15000 });
    
    await page.fill(selectors.titleInput, 'Книга без автора');
    await page.click(selectors.submitButton);
    
    const errorMessage = page.locator(selectors.validationError);
    await expect(errorMessage).toBeVisible({ timeout: 5000 });
    const errorText = await errorMessage.textContent();
    expect(errorText?.toLowerCase()).toMatch(/автор|author/i);
  });
});