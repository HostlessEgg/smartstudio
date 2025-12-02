import { test, expect } from '@playwright/test';

// Smoke test for three priority pages: admin users, course-structure, consent-audit

const adminUser = { id: 1, name: 'Admin SmartStudio', email: 'admin@smartstudio.com', role: 'admin' };

test.beforeEach(async ({ page }) => {
  // Forward page console and errors to test output to aid debugging
  page.on('console', msg => {
    // eslint-disable-next-line no-console
    console.log('PW_CONSOLE', msg.type(), msg.text());
  });
  page.on('pageerror', err => {
    // eslint-disable-next-line no-console
    console.log('PW_PAGE_ERROR', err && err.message ? err.message : String(err));
  });
  // Seed localStorage so ProtectedRoute sees an authenticated admin
  await page.addInitScript((user) => {
    localStorage.setItem('token', 'mock-token');
    localStorage.setItem('user', user);
  }, JSON.stringify(adminUser));
  // Also stub fetch for course_structure and consents endpoints to make tests deterministic
  const courseStub = {
    courseId: 'course-101',
    title: 'Smoke Course',
    modules: [{ id: 'm1', title: 'M1', lessons: [{ id: 'l1', title: 'L1' }] }],
    versions: []
  };
  await page.addInitScript((course) => {
    const orig = window.fetch.bind(window);
    window.__mockFetchedCourse = false;
    window.__mockFetchedConsents = false;
    window.fetch = async (input, init) => {
      const url = typeof input === 'string' ? input : input.url;
      if (url.includes('/api/mock/course_structure')) {
        window.__mockFetchedCourse = true;
        return new Response(JSON.stringify({ course: JSON.parse(course) }), { status: 200, headers: { 'Content-Type': 'application/json' } });
      }
      if (url.includes('/api/mock/consents') || url.includes('/api/mock/consents_audit')) {
        window.__mockFetchedConsents = true;
        return new Response(JSON.stringify({ consents: [], consents_audit: [] }), { status: 200, headers: { 'Content-Type': 'application/json' } });
      }
      return orig(input, init);
    };
  }, JSON.stringify(courseStub));
  // Also register Playwright route handlers so requests (including axios/XHR) are intercepted
  const usersStub = [{ id: 1, name: 'Admin SmartStudio', email: 'admin@smartstudio.com', role: 'admin' }];
  await page.route('**/api/mock/users', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ users: usersStub }) }));
  await page.route('**/api/mock/course_structure', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ course: courseStub }) }));
  await page.route('**/api/mock/consents', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ consents: [] }) }));
  await page.route('**/api/mock/consents_audit', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ consents_audit: [] }) }));
});

test.describe('Smoke tests - priority views', () => {
  test('Admin Users page loads and shows users table', async ({ page }) => {
    await page.goto('/admin/users');
    await expect(page).toHaveURL(/admin\/users/);
    // wait for backend users response (or network idle) to avoid racing with data loading
    await Promise.race([
      page.waitForResponse(resp => resp.url().includes('/api/mock/users') && resp.status() === 200, { timeout: 15000 }),
      page.waitForLoadState('networkidle')
    ]).catch(() => null);
    await expect(page.locator('text=Administración de Usuarios')).toBeVisible();
    await expect(page.locator('table[aria-label="User administration table"]')).toBeVisible();
  });

  test('Course Structure editor loads and shows title', async ({ page }) => {
    await page.goto('/course-structure');
    await expect(page).toHaveURL(/course-structure/);
    // wait for the in-page fetch stub to mark course data as fetched, or timeout
    await page.waitForFunction(() => (window as any).__mockFetchedCourse === true, { timeout: 15000 }).catch(() => null);
    // basic smoke: ensure the editor header or course title is visible
    await expect(page.locator('text=Editor de Estructura de Curso')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Smoke Course')).toBeVisible({ timeout: 10000 });
  });

  test('Consent Audit view loads and shows audit table or results', async ({ page }) => {
    await page.goto('/consent-audit');
    await expect(page).toHaveURL(/consent-audit/);
    // Accept either a header text or a visible Export button
    const header = page.locator('text=Consent Audit');
    const exportBtn = page.locator('button', { hasText: 'Exportar' });
    // accept either a localized header, export button, or a table
    const table = page.locator('table');
      // wait for in-page consent fetch stub to mark consents fetched
      await page.waitForFunction(() => (window as any).__mockFetchedConsents === true, { timeout: 15000 }).catch(() => null);
      // basic smoke: assert header or export button or a results table is visible (avoid ambiguous container selector)
      await Promise.any([
        page.locator('text=Historial de Consentimientos').waitFor({ state: 'visible', timeout: 10000 }),
        page.locator('text=Exportar').waitFor({ state: 'visible', timeout: 10000 }),
        page.locator('table').first().waitFor({ state: 'visible', timeout: 10000 })
      ]).catch(() => {
        // if none matched, fail with a helpful message
        throw new Error('Consent Audit view did not render expected header/button/table');
      });
  });
});
