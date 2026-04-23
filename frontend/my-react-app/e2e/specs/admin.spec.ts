import { test, expect } from '../fixtures/auth.fixture';

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
    
    await adminPage.evaluate(() => {
      const tab = Array.from(document.querySelectorAll('.adminTab')).find(el => el.textContent?.includes('Пользователи'));
      if (tab) (tab as HTMLElement).click();
    });
    
    await adminPage.waitForTimeout(500);
    
    await adminPage.evaluate(() => {
      const tab = Array.from(document.querySelectorAll('.adminTab')).find(el => el.textContent?.includes('Книги на удаление'));
      if (tab) (tab as HTMLElement).click();
    });
    
    await adminPage.waitForTimeout(500);
    
    await adminPage.evaluate(() => {
      const tab = Array.from(document.querySelectorAll('.adminTab')).find(el => el.textContent?.includes('Локации'));
      if (tab) (tab as HTMLElement).click();
    });
    
    await adminPage.waitForTimeout(500);
  });

  test('admin can view users list', async ({ adminPage }) => {
    await adminPage.goto('/admin');
    await adminPage.waitForLoadState('networkidle');
    
    await adminPage.evaluate(() => {
      const tab = Array.from(document.querySelectorAll('.adminTab')).find(el => el.textContent?.includes('Пользователи'));
      if (tab) (tab as HTMLElement).click();
    });
    
    await adminPage.waitForTimeout(2000);
    await expect(adminPage.locator('.adminSection h2')).toBeVisible();
  });

  test('admin can change user role', async ({ adminPage }) => {
    await adminPage.goto('/admin');
    await adminPage.waitForLoadState('networkidle');
    
    await adminPage.evaluate(() => {
      const tab = Array.from(document.querySelectorAll('.adminTab')).find(el => el.textContent?.includes('Пользователи'));
      if (tab) (tab as HTMLElement).click();
    });
    
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
    
    await adminPage.evaluate(() => {
      const tab = Array.from(document.querySelectorAll('.adminTab')).find(el => el.textContent?.includes('Книги на удаление'));
      if (tab) (tab as HTMLElement).click();
    });
    
    await adminPage.waitForTimeout(2000);
    await expect(adminPage.locator('h2').filter({ hasText: /Книги на удаление/ })).toBeVisible();
  });

  test('admin can view pending locations', async ({ adminPage }) => {
    await adminPage.goto('/admin');
    await adminPage.waitForLoadState('networkidle');
    
    await adminPage.evaluate(() => {
      const tab = Array.from(document.querySelectorAll('.adminTab')).find(el => el.textContent?.includes('Локации'));
      if (tab) (tab as HTMLElement).click();
    });
    
    await adminPage.waitForTimeout(2000);
    await expect(adminPage.locator('.pl-title')).toHaveText('Локации на одобрение');
  });

  test('admin can refresh pending locations', async ({ adminPage }) => {
    await adminPage.goto('/admin');
    await adminPage.waitForLoadState('networkidle');
    
    await adminPage.evaluate(() => {
      const tab = Array.from(document.querySelectorAll('.adminTab')).find(el => el.textContent?.includes('Локации'));
      if (tab) (tab as HTMLElement).click();
    });
    
    await adminPage.waitForSelector('.pl-refreshBtn', { timeout: 10000 });
    await adminPage.click('.pl-refreshBtn');
    
    await adminPage.waitForTimeout(1000);
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
    await createLocationBtn.waitFor({ state: 'visible', timeout: 10000 });
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
    await createLocationBtn.waitFor({ state: 'visible', timeout: 10000 });
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

test.describe('Admin Page - Locations Approval Flow', () => {
  test('admin can approve pending location created from add-book', async ({ adminPage, page }) => {
    // Создаем локацию через страницу добавления книги
    await page.goto('/add-book');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    const createLocationBtn = page.locator('[data-testid="create-location-btn"]');
    await createLocationBtn.waitFor({ state: 'visible', timeout: 10000 });
    await createLocationBtn.click();
    
    await page.waitForURL('/locations/create', { timeout: 5000 });
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    const uniqueName = `Локация для одобрения ${Date.now()}`;
    const uniqueAddress = `Адрес для одобрения ${Date.now()}`;
    
    await page.locator('.cl-input').first().fill(uniqueName);
    await page.locator('.cl-input').nth(1).fill(uniqueAddress);
    await page.click('.cl-btnSubmit');
    await page.waitForTimeout(3000);
    
    // Переходим в админку для одобрения
    await adminPage.goto('/admin');
    await adminPage.waitForLoadState('networkidle');
    
    await adminPage.evaluate(() => {
      const tab = Array.from(document.querySelectorAll('.adminTab')).find(el => el.textContent?.includes('Локации'));
      if (tab) (tab as HTMLElement).click();
    });
    
    await adminPage.waitForSelector('.pl-list', { timeout: 15000 });
    
    const targetLocation = adminPage.locator('.pl-row').filter({ hasText: uniqueName });
    await targetLocation.waitFor({ state: 'visible', timeout: 15000 });
    
    const approveButton = targetLocation.locator('.pl-approveBtn');
    await approveButton.click();
    
    await adminPage.waitForTimeout(2000);
  });

  test('admin can reject pending location created from add-book', async ({ adminPage, page }) => {
    // Создаем локацию через страницу добавления книги
    await page.goto('/add-book');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    const createLocationBtn = page.locator('[data-testid="create-location-btn"]');
    await createLocationBtn.waitFor({ state: 'visible', timeout: 10000 });
    await createLocationBtn.click();
    
    await page.waitForURL('/locations/create', { timeout: 5000 });
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    const uniqueName = `Локация для отклонения ${Date.now()}`;
    const uniqueAddress = `Адрес для отклонения ${Date.now()}`;
    
    await page.locator('.cl-input').first().fill(uniqueName);
    await page.locator('.cl-input').nth(1).fill(uniqueAddress);
    await page.click('.cl-btnSubmit');
    await page.waitForTimeout(3000);
    
    // Переходим в админку для отклонения
    await adminPage.goto('/admin');
    await adminPage.waitForLoadState('networkidle');
    
    await adminPage.evaluate(() => {
      const tab = Array.from(document.querySelectorAll('.adminTab')).find(el => el.textContent?.includes('Локации'));
      if (tab) (tab as HTMLElement).click();
    });
    
    await adminPage.waitForSelector('.pl-list', { timeout: 15000 });
    
    const targetLocation = adminPage.locator('.pl-row').filter({ hasText: uniqueName });
    await targetLocation.waitFor({ state: 'visible', timeout: 15000 });
    
    const rejectButton = targetLocation.locator('.pl-rejectBtn');
    
    adminPage.on('dialog', async dialog => {
      await dialog.accept();
    });
    
    await rejectButton.click();
    await adminPage.waitForTimeout(2000);
  });
});