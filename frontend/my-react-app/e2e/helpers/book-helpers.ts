import { test, expect } from '../fixtures/auth.fixture';

test.describe('Moderator Page - Tag Management', () => {
  test.beforeEach(async ({ moderatorPage }) => {
    await moderatorPage.goto('/moderator');
    await moderatorPage.waitForLoadState('networkidle');
    await moderatorPage.waitForTimeout(2000);
  });

  test('moderator can view tags list', async ({ moderatorPage }) => {
    await expect(moderatorPage.locator('.tm-title')).toHaveText('Управление тегами');
    await expect(moderatorPage.locator('.tm-tags-grid')).toBeVisible();
    
    const tagsCount = await moderatorPage.locator('.tm-tag-card').count();
    expect(tagsCount).toBeGreaterThan(0);
  });

  test('moderator can see total tags count', async ({ moderatorPage }) => {
    const stats = moderatorPage.locator('.tm-stats-count');
    await expect(stats).toBeVisible();
    
    const statsText = await stats.textContent();
    expect(statsText).toMatch(/Всего тегов: \d+/);
  });

  test('moderator can navigate to create tag page', async ({ moderatorPage }) => {
    await moderatorPage.click('.tm-add-button, .tm-empty-create-btn');
    await expect(moderatorPage).toHaveURL('/tags/create', { timeout: 5000 });
  });

  test('moderator can create a new tag', async ({ moderatorPage }) => {
    const tagName = `Тестовый тег ${Date.now()}`;
    const tagDescription = `Описание теста ${Date.now()}`;
    
    await moderatorPage.click('.tm-add-button');
    await moderatorPage.waitForURL('/tags/create', { timeout: 5000 });
    
    await moderatorPage.fill('.at-input', tagName);
    await moderatorPage.fill('.at-textarea', tagDescription);
    await moderatorPage.click('.at-btnSubmit');
    
    await moderatorPage.waitForURL('/moderator', { timeout: 5000 });
    await moderatorPage.waitForTimeout(1000);
    
    const tagCards = moderatorPage.locator('.tm-tag-card');
    await expect(tagCards.first()).toBeVisible();
    
    const tagNames = await tagCards.allTextContents();
    const found = tagNames.some(text => text.includes(tagName));
    expect(found).toBeTruthy();
  });

  test('moderator cannot create tag without name', async ({ moderatorPage }) => {
    await moderatorPage.click('.tm-add-button');
    await moderatorPage.waitForURL('/tags/create', { timeout: 5000 });
    
    const submitButton = moderatorPage.locator('.at-btnSubmit');
    await expect(submitButton).toBeVisible();
    
    await moderatorPage.fill('.at-input', '');
    await submitButton.click();
    
    await moderatorPage.waitForTimeout(1000);
    
    expect(moderatorPage.url()).toContain('/tags/create');
  });

  test('moderator can cancel tag creation', async ({ moderatorPage }) => {
    await moderatorPage.click('.tm-add-button');
    await moderatorPage.waitForURL('/tags/create', { timeout: 5000 });
    
    await moderatorPage.fill('.at-input', 'Отмененный тег');
    await moderatorPage.click('.at-btnCancel');
    
    await moderatorPage.waitForURL('/moderator', { timeout: 5000 });
    
    const tagCards = moderatorPage.locator('.tm-tag-card');
    const tagNames = await tagCards.allTextContents();
    const found = tagNames.some(text => text.includes('Отмененный тег'));
    expect(found).toBeFalsy();
  });

  test('moderator can navigate to edit tag page', async ({ moderatorPage }) => {
    const editButton = moderatorPage.locator('.tm-edit-btn').first();
    await editButton.click();
    
    await expect(moderatorPage).toHaveURL(/\/tags\/edit\/\d+/, { timeout: 5000 });
  });

  test('moderator can edit existing tag', async ({ moderatorPage }) => {
    const updatedName = `Обновленный тег ${Date.now()}`;
    
    const editButton = moderatorPage.locator('.tm-edit-btn').first();
    await editButton.click();
    
    await moderatorPage.waitForURL(/\/tags\/edit\/\d+/, { timeout: 5000 });
    
    await moderatorPage.fill('.at-input', updatedName);
    await moderatorPage.click('.at-btnSubmit');
    
    await moderatorPage.waitForURL('/moderator', { timeout: 5000 });
    await moderatorPage.waitForTimeout(1000);
    
    const tagCards = moderatorPage.locator('.tm-tag-card');
    const tagNames = await tagCards.allTextContents();
    const found = tagNames.some(text => text.includes(updatedName));
    expect(found).toBeTruthy();
  });

  test('moderator can cancel tag edit', async ({ moderatorPage }) => {
    const editButton = moderatorPage.locator('.tm-edit-btn').first();
    await editButton.click();
    
    await moderatorPage.waitForURL(/\/tags\/edit\/\d+/, { timeout: 5000 });
    
    const originalName = await moderatorPage.locator('.at-input').inputValue();
    
    await moderatorPage.fill('.at-input', 'Измененный тег для отмены');
    await moderatorPage.click('.at-btnCancel');
    
    await moderatorPage.waitForURL('/moderator', { timeout: 5000 });
    
    const tagCards = moderatorPage.locator('.tm-tag-card');
    const tagNames = await tagCards.allTextContents();
    const foundChanged = tagNames.some(text => text.includes('Измененный тег для отмены'));
    expect(foundChanged).toBeFalsy();
    
    const foundOriginal = tagNames.some(text => text.includes(originalName));
    expect(foundOriginal).toBeTruthy();
  });

  test('moderator can delete tag with confirmation', async ({ moderatorPage }) => {
    const initialCount = await moderatorPage.locator('.tm-tag-card').count();
    
    if (initialCount === 0) {
      test.skip();
      return;
    }
    
    const firstTagName = await moderatorPage.locator('.tm-tag-name').first().textContent();
    
    const deleteButton = moderatorPage.locator('.tm-delete-btn').first();
    await deleteButton.click();
    
    moderatorPage.on('dialog', async dialog => {
      expect(dialog.message()).toContain('Вы уверены, что хотите удалить тег');
      await dialog.accept();
    });
    
    await moderatorPage.waitForTimeout(2000);
    
    await moderatorPage.waitForFunction(
      (initial) => document.querySelectorAll('.tm-tag-card').length !== initial,
      initialCount,
      { timeout: 10000 }
    );
    
    const newCount = await moderatorPage.locator('.tm-tag-card').count();
    expect(newCount).toBe(initialCount - 1);
    
    const tagNames = await moderatorPage.locator('.tm-tag-name').allTextContents();
    const found = tagNames.some(name => name === firstTagName);
    expect(found).toBeFalsy();
  });

  test('moderator can cancel tag deletion', async ({ moderatorPage }) => {
    const initialCount = await moderatorPage.locator('.tm-tag-card').count();
    
    if (initialCount === 0) {
      test.skip();
      return;
    }
    
    const firstTagName = await moderatorPage.locator('.tm-tag-name').first().textContent();
    
    const deleteButton = moderatorPage.locator('.tm-delete-btn').first();
    await deleteButton.click();
    
    let dialogHandled = false;
    moderatorPage.on('dialog', async dialog => {
      dialogHandled = true;
      await dialog.dismiss();
    });
    
    await moderatorPage.waitForTimeout(1000);
    expect(dialogHandled).toBe(true);
    
    const newCount = await moderatorPage.locator('.tm-tag-card').count();
    expect(newCount).toBe(initialCount);
    
    const tagNames = await moderatorPage.locator('.tm-tag-name').allTextContents();
    const found = tagNames.some(name => name === firstTagName);
    expect(found).toBeTruthy();
  });

  test('moderator can go back to home', async ({ moderatorPage }) => {
    await moderatorPage.click('.tm-back-button');
    await expect(moderatorPage).toHaveURL('/home', { timeout: 5000 });
  });

  test('moderator can refresh tags list', async ({ moderatorPage }) => {
    const retryButton = moderatorPage.locator('.tm-retry-btn');
    if (await retryButton.isVisible()) {
      await retryButton.click();
      await moderatorPage.waitForSelector('.tm-tags-grid', { timeout: 5000 });
      await expect(moderatorPage.locator('.tm-tag-card').first()).toBeVisible();
    }
  });

  test('displays empty state when no tags', async ({ page }) => {
    await page.goto('/moderator');
    await page.waitForLoadState('networkidle');
    
    const emptyState = page.locator('.tm-empty');
    const tagsGrid = page.locator('.tm-tags-grid');
    
    const isEmptyVisible = await emptyState.isVisible().catch(() => false);
    const isGridVisible = await tagsGrid.isVisible().catch(() => false);
    
    if (isEmptyVisible) {
      await expect(emptyState.locator('h3')).toHaveText('Нет тегов');
      await expect(emptyState.locator('.tm-empty-create-btn')).toBeVisible();
    } else {
      await expect(tagsGrid).toBeVisible();
    }
  });

  test('unauthenticated user cannot access moderator page', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    
    await page.goto('/moderator');
    await expect(page).toHaveURL('/auth', { timeout: 10000 });
    
    await context.close();
  });

  test('regular user cannot access moderator page', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/moderator');
    
    const errorMessage = authenticatedPage.locator('.tm-error');
    await expect(errorMessage).toBeVisible();
    await expect(errorMessage.locator('h2')).toHaveText('Доступ запрещён');
    await expect(errorMessage.locator('.tm-back-btn')).toBeVisible();
  });

  test('moderator can create tag using floating button', async ({ moderatorPage }) => {
    const addButton = moderatorPage.locator('.tm-add-button');
    await expect(addButton).toBeVisible();
    await addButton.click();
    await expect(moderatorPage).toHaveURL('/tags/create', { timeout: 5000 });
  });

  test('moderator sees edit and delete buttons for each tag', async ({ moderatorPage }) => {
    const firstTag = moderatorPage.locator('.tm-tag-card').first();
    
    const editButton = firstTag.locator('.tm-edit-btn');
    const deleteButton = firstTag.locator('.tm-delete-btn');
    
    await expect(editButton).toBeVisible();
    await expect(deleteButton).toBeVisible();
  });
});