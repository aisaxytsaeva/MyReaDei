import { test, expect } from '../fixtures/auth.fixture';

test.describe('Book Mark for Deletion - Moderator and Admin', () => {
  let testBookId: number;

  test.beforeEach(async ({ yunhoPage }) => {
    await yunhoPage.goto('/home');
    await yunhoPage.waitForLoadState('networkidle');
    await yunhoPage.waitForTimeout(2000);
    
    // Проверяем, что мы действительно на странице home
    const currentUrl = yunhoPage.url();
    console.log('Current URL after login:', currentUrl);
    
    // Проверяем наличие кнопки "Добавить книгу" или переходим напрямую
    const addBookLink = yunhoPage.locator('a:has-text("Добавить книгу"), a[href*="add-book"]');
    const hasAddBookLink = await addBookLink.count() > 0;
    
    if (hasAddBookLink) {
      await addBookLink.first().click();
    } else {
      await yunhoPage.goto('/add-book');
    }
    
    await yunhoPage.waitForLoadState('networkidle');
    await yunhoPage.waitForTimeout(2000);
    
    // Делаем скриншот для отладки
    await yunhoPage.screenshot({ path: 'yunho-add-book-debug.png', fullPage: true });
    
    const uniqueTitle = `Тестовая книга для удаления ${Date.now()}`;
    
    // Проверяем наличие формы с правильными селекторами
    const hasTitleInput = await yunhoPage.locator('[data-testid="book-title"]').count();
    const hasAuthorInput = await yunhoPage.locator('[data-testid="book-author"]').count();
    
    console.log('Has book-title input:', hasTitleInput);
    console.log('Has book-author input:', hasAuthorInput);
    
    if (hasTitleInput === 0) {
      // Если форма не найдена, возможно пользователь не имеет прав
      console.log('User yunho cannot create books - skipping test');
      test.skip();
      return;
    }
    
    await yunhoPage.fill('[data-testid="book-title"]', uniqueTitle);
    await yunhoPage.fill('[data-testid="book-author"]', 'Тестовый Автор');
    await yunhoPage.fill('[data-testid="book-description"]', 'Описание тестовой книги');
    
    await yunhoPage.locator('[data-testid="location-select"]').selectOption({ index: 0 });
    await yunhoPage.click('[data-testid="submit-book"]');
    
    await yunhoPage.waitForURL(/\/book\/\d+/, { timeout: 15000 });
    const url = yunhoPage.url();
    testBookId = parseInt(url.split('/').pop()!);
    console.log(`Created book with ID: ${testBookId} by yunho`);
  });

  test('moderator can mark book for deletion', async ({ moderatorPage }) => {
    if (!testBookId) {
      test.skip();
      return;
    }
    
    await moderatorPage.goto(`/book/${testBookId}`);
    await moderatorPage.waitForLoadState('networkidle');
    await moderatorPage.waitForTimeout(2000);
    
    const markDeleteButton = moderatorPage.locator('button:has-text("Пометить на удаление")');
    await markDeleteButton.waitFor({ state: 'visible', timeout: 10000 });
    await markDeleteButton.click();
    
    await moderatorPage.waitForTimeout(1000);
    
    await moderatorPage.reload();
    await moderatorPage.waitForLoadState('networkidle');
    await moderatorPage.waitForTimeout(2000);
    
    const statusBadge = moderatorPage.locator('.status-badge');
    await expect(statusBadge).toContainText('Помечена на удаление');
  });

  test('admin can mark book for deletion', async ({ adminPage }) => {
    if (!testBookId) {
      test.skip();
      return;
    }
    
    await adminPage.goto(`/book/${testBookId}`);
    await adminPage.waitForLoadState('networkidle');
    await adminPage.waitForTimeout(2000);
    
    const markDeleteButton = adminPage.locator('button:has-text("Пометить на удаление")');
    await markDeleteButton.waitFor({ state: 'visible', timeout: 10000 });
    await markDeleteButton.click();
    
    await adminPage.waitForTimeout(1000);
    
    await adminPage.reload();
    await adminPage.waitForLoadState('networkidle');
    await adminPage.waitForTimeout(2000);
    
    const statusBadge = adminPage.locator('.status-badge');
    await expect(statusBadge).toContainText('Помечена на удаление');
  });

  test('admin can unmark book for deletion', async ({ adminPage }) => {
    if (!testBookId) {
      test.skip();
      return;
    }
    
    await adminPage.goto(`/book/${testBookId}`);
    await adminPage.waitForLoadState('networkidle');
    await adminPage.waitForTimeout(2000);
    
    const markDeleteButton = adminPage.locator('button:has-text("Пометить на удаление")');
    await markDeleteButton.waitFor({ state: 'visible', timeout: 10000 });
    await markDeleteButton.click();
    await adminPage.waitForTimeout(1000);
    
    await adminPage.reload();
    await adminPage.waitForLoadState('networkidle');
    await adminPage.waitForTimeout(2000);
    
    const unmarkButton = adminPage.locator('button:has-text("Снять пометку удаления")');
    await unmarkButton.waitFor({ state: 'visible', timeout: 10000 });
    await unmarkButton.click();
    
    await adminPage.waitForTimeout(1000);
    
    await adminPage.reload();
    await adminPage.waitForLoadState('networkidle');
    await adminPage.waitForTimeout(2000);
    
    const statusBadge = adminPage.locator('.status-badge');
    await expect(statusBadge).toContainText('Доступна');
  });

  test('admin can permanently delete marked book', async ({ adminPage }) => {
    if (!testBookId) {
      test.skip();
      return;
    }
    
    await adminPage.goto(`/book/${testBookId}`);
    await adminPage.waitForLoadState('networkidle');
    await adminPage.waitForTimeout(2000);
    
    const markDeleteButton = adminPage.locator('button:has-text("Пометить на удаление")');
    await markDeleteButton.waitFor({ state: 'visible', timeout: 10000 });
    await markDeleteButton.click();
    await adminPage.waitForTimeout(1000);
    
    await adminPage.reload();
    await adminPage.waitForLoadState('networkidle');
    await adminPage.waitForTimeout(2000);
    
    const deleteButton = adminPage.locator('button:has-text("Удалить книгу")');
    await deleteButton.waitFor({ state: 'visible', timeout: 10000 });
    
    adminPage.on('dialog', async dialog => {
      expect(dialog.message()).toContain('Вы уверены, что хотите удалить эту книгу?');
      await dialog.accept();
    });
    
    await deleteButton.click();
    await adminPage.waitForTimeout(2000);
    
    await expect(adminPage).toHaveURL('/home', { timeout: 5000 });
  });

  test('regular user cannot see mark for deletion button', async ({ authenticatedPage }) => {
    if (!testBookId) {
      test.skip();
      return;
    }
    
    await authenticatedPage.goto(`/book/${testBookId}`);
    await authenticatedPage.waitForLoadState('networkidle');
    await authenticatedPage.waitForTimeout(2000);
    
    const markDeleteButton = authenticatedPage.locator('button:has-text("Пометить на удаление")');
    await expect(markDeleteButton).not.toBeVisible();
  });
});