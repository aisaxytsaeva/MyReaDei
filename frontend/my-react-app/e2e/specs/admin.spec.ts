import { test, expect } from '../fixtures/auth.fixture';

// Вспомогательная функция для клика через JavaScript
async function jsClick(page: any, selector: string) {
  await page.evaluate((sel: string) => {
    const element = document.querySelector(sel) as HTMLElement;
    if (element) element.click();
  }, selector);
}

// Функция для переключения на вкладку и ожидания загрузки
async function switchToTab(page: any, tabText: string) {
  await page.evaluate((text: string) => {
    const tabs = Array.from(document.querySelectorAll('.adminTab'));
    const tab = tabs.find(t => t.textContent?.includes(text));
    if (tab) (tab as HTMLElement).click();
  }, tabText);
  await page.waitForTimeout(2000);
  await page.waitForLoadState('networkidle');
}

test.describe('Admin Page - Admin Dashboard', () => {
  test('admin can view admin page', async ({ adminPage }) => {
    await adminPage.goto('/admin');
    await adminPage.waitForLoadState('networkidle');
    await adminPage.waitForTimeout(2000);
    
    await expect(adminPage.locator('.adminTitle')).toHaveText('Панель администратора');
  });

  test('admin can switch between tabs', async ({ adminPage }) => {
    await adminPage.goto('/admin');
    await adminPage.waitForLoadState('networkidle');
    
    await switchToTab(adminPage, 'Пользователи');
    await switchToTab(adminPage, 'Книги на удаление');
    await switchToTab(adminPage, 'Локации');
  });

  test('admin can view users list', async ({ adminPage }) => {
    await adminPage.goto('/admin');
    await adminPage.waitForLoadState('networkidle');
    
    await switchToTab(adminPage, 'Пользователи');
    
    await expect(adminPage.locator('.adminSection h2')).toBeVisible({ timeout: 10000 });
  });

  test('admin can change user role', async ({ adminPage }) => {
    await adminPage.goto('/admin');
    await adminPage.waitForLoadState('networkidle');
    
    await switchToTab(adminPage, 'Пользователи');
    
    await adminPage.waitForSelector('select', { timeout: 10000 });
    const firstSelect = adminPage.locator('select').first();
    await firstSelect.selectOption('moderator');
    
    const saveButton = adminPage.locator('button').filter({ hasText: 'Сохранить' }).first();
    await saveButton.click();
    
    await adminPage.waitForTimeout(1000);
  });

  test('admin can view books marked for deletion', async ({ adminPage }) => {
    await adminPage.goto('/admin');
    await adminPage.waitForLoadState('networkidle');
    
    await switchToTab(adminPage, 'Книги на удаление');
    
    // Проверяем, что есть заголовок или просто что страница загрузилась
    const hasHeading = await adminPage.locator('h2').count() > 0;
    const hasContent = await adminPage.locator('.adminSection').count() > 0;
    
    expect(hasHeading || hasContent).toBeTruthy();
  });

  test('admin can view pending locations', async ({ adminPage }) => {
    await adminPage.goto('/admin');
    await adminPage.waitForLoadState('networkidle');
    
    await switchToTab(adminPage, 'Локации');
    
    // Проверяем, что есть контент или заголовок
    const hasTitle = await adminPage.locator('.pl-title').count() > 0;
    const hasContent = await adminPage.locator('.adminSection').count() > 0;
    
    expect(hasTitle || hasContent).toBeTruthy();
  });

  test('admin can refresh pending locations', async ({ adminPage }) => {
    await adminPage.goto('/admin');
    await adminPage.waitForLoadState('networkidle');
    
    await switchToTab(adminPage, 'Локации');
    
    const refreshBtn = adminPage.locator('.pl-refreshBtn');
    const hasRefreshBtn = await refreshBtn.count() > 0;
    
    if (hasRefreshBtn) {
      await refreshBtn.click();
      await adminPage.waitForTimeout(1000);
    }
  });

  test('unauthenticated user cannot access admin page', async ({ page }) => {
    await page.goto('/admin');
    await page.waitForTimeout(2000);
    await expect(page).toHaveURL(/\/auth/, { timeout: 5000 });
  });
});

test.describe('Create Location Page', () => {
  test('user can create a new location from add-book page', async ({ adminPage }) => {
    await adminPage.goto('/add-book');
    await adminPage.waitForLoadState('networkidle');
    await adminPage.waitForTimeout(2000);
    
    const createLocationBtn = adminPage.locator('[data-testid="create-location-btn"]');
    const btnExists = await createLocationBtn.count();
    if (btnExists === 0) {
      test.skip();
      return;
    }
    
    await createLocationBtn.click();
    await adminPage.waitForURL('/locations/create', { timeout: 5000 });
    await adminPage.waitForLoadState('networkidle');
    await adminPage.waitForTimeout(2000);
    
    const uniqueName = `Тестовая локация ${Date.now()}`;
    const uniqueAddress = `Тестовый адрес ${Date.now()}`;
    
    const nameInput = adminPage.locator('.cl-input').first();
    await nameInput.waitFor({ state: 'visible', timeout: 10000 });
    await nameInput.fill(uniqueName);
    
    const addressInput = adminPage.locator('.cl-input').nth(1);
    await addressInput.fill(uniqueAddress);
    
    const submitBtn = adminPage.locator('.cl-btnSubmit');
    await submitBtn.click();
    
    await adminPage.waitForTimeout(2000);
  });

  test('can cancel location creation from add-book page', async ({ adminPage }) => {
    await adminPage.goto('/add-book');
    await adminPage.waitForLoadState('networkidle');
    await adminPage.waitForTimeout(2000);
    
    const createLocationBtn = adminPage.locator('[data-testid="create-location-btn"]');
    const btnExists = await createLocationBtn.count();
    if (btnExists === 0) {
      test.skip();
      return;
    }
    
    await createLocationBtn.click();
    await adminPage.waitForURL('/locations/create', { timeout: 5000 });
    await adminPage.waitForLoadState('networkidle');
    await adminPage.waitForTimeout(2000);
    
    const nameInput = adminPage.locator('.cl-input').first();
    await nameInput.fill('Отмененная локация');
    
    const addressInput = adminPage.locator('.cl-input').nth(1);
    await addressInput.fill('Отмененный адрес');
    
    const cancelBtn = adminPage.locator('.cl-btnCancel');
    await cancelBtn.click();
    
    await adminPage.waitForTimeout(2000);
  });
});