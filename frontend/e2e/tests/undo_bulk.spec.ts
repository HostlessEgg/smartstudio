import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

test.setTimeout(60000);

test('bulk deactivate then undo via toast', async ({ page, baseURL }) => {
  // Generate admin token from backend script
  const tokenPath = path.join(process.cwd(), '../../backend/scripts/generate_admin_token.cjs');
  // fallback: we will request token endpoint via backend script execution
  const { execSync } = await import('child_process');
  const backendScript = path.join(process.cwd(), '../backend/scripts/generate_admin_token.cjs');
  const token = execSync(`node ${backendScript}`).toString().trim();

  // Set token and user in localStorage before any script runs
  const userObj = { id: 1, name: 'Admin Tester', email: 'admin@local', role: 'admin' };
  // addInitScript as string to avoid serialization edge-cases
  await page.addInitScript(`localStorage.setItem('token', '${token}'); localStorage.setItem('user', '${JSON.stringify(userObj)}');`);

  // debug: forward console to logs
  page.on('console', msg => console.log('PAGE LOG>', msg.text()));

  await page.goto('/admin/users');

  // debug: print localStorage values to help diagnose AuthProvider errors
  const ls = await page.evaluate(() => ({ token: localStorage.getItem('token'), user: localStorage.getItem('user') }));
  console.log('LOCALSTORAGE>', ls);

  // Wait for backend users API response before checking DOM
  await page.waitForResponse(resp => resp.url().includes('/api/users') && resp.status() === 200, { timeout: 15000 });

  // Wait for users table to render
  await page.waitForSelector('table[role="table"]', { timeout: 15000 });

  // Select first checkbox on page
  const firstCheckbox = await page.locator('table tbody tr td input[type="checkbox"]').first();
  await firstCheckbox.check();

  // Hook dialog (confirm) to accept
  page.on('dialog', async dialog => { await dialog.accept(); });

  // Click 'Desactivar' bulk button
  await page.click('button:has-text("Desactivar")');

  // Wait for toast with 'Deshacer'
  await page.waitForSelector('text=Deshacer', { timeout: 5000 });
  // Click Deshacer
  await page.click('button:has-text("Deshacer")');

  // Wait a moment and assert the row no longer shows '(inactivo)'
  await page.waitForTimeout(1000);
  const rowText = await page.locator('table tbody tr').first().innerText();
  expect(rowText).not.toContain('(inactivo)');
});
