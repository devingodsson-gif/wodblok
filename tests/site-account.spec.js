// The account buttons in the website header (site/account.js). Clerk is replaced by a small stub, and the site is
// served from site/ at a made-up address, so nothing here touches the network or the app.
const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const SITE = path.join(__dirname, '..', 'site');
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.json': 'application/json', '.xml': 'application/xml', '.txt': 'text/plain' };
const KEY = 'pk_test_' + Buffer.from('clerk.wodblok.test$').toString('base64');

async function open(page, { clerk = 'ok', key = KEY, user = null, me = { ok: true, approved: true }, query = '', gate = { ok: true, approved: true } } = {}) {
  const gateCalls = [];
  page.gateCalls = gateCalls;
  await page.route('**/*', async (route) => {
    const url = new URL(route.request().url());
    if (url.host === 'clerk.wodblok.test') {
      if (clerk === 'fail') return route.abort();
      if (clerk === 'slow') await new Promise((r) => setTimeout(r, 1500));
      const body = `window.Clerk = { user: ${JSON.stringify(user)}, calls: [], listeners: [],
        async load() {}, addListener(fn) { this.listeners.push(fn); },
        openSignIn() { this.calls.push('signin'); }, openSignUp() { this.calls.push('signup'); },
        openUserProfile() { this.calls.push('profile'); }, signOut() { this.calls.push('signout'); } };`;
      return route.fulfill({ contentType: 'text/javascript', body });
    }
    if (url.host === 'app.wodblok.com') return route.fulfill({ contentType: 'text/html', body: '<title>app</title>' });
    if (url.host !== 'wodblok.test') return route.abort();
    if (url.pathname === '/account-config.js') return route.fulfill({ contentType: 'text/javascript', body: `window.WB_ACCOUNTS = { publishableKey: ${JSON.stringify(key)} };` });
    if (url.pathname === '/api/gate-cookie') {
      gateCalls.push(route.request().method());
      return route.fulfill({ contentType: 'application/json', body: JSON.stringify(gate) });
    }
    if (url.pathname === '/api/me') return route.fulfill({ contentType: 'application/json', body: JSON.stringify(me) });
    const file = path.join(SITE, url.pathname === '/' ? 'index.html' : decodeURIComponent(url.pathname));
    if (!file.startsWith(SITE) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) return route.fulfill({ status: 404, body: '' });
    return route.fulfill({ contentType: TYPES[path.extname(file)] || 'application/octet-stream', body: fs.readFileSync(file) });
  });
  await page.goto('https://wodblok.test/' + query);
}
const nav = (page) => page.locator('#top-nav');
const calls = (page) => page.evaluate(() => window.Clerk.calls);

test('no key: the header is exactly as before', async ({ page }) => {
  await open(page, { key: '' });
  await expect(page.getByRole('link', { name: /Open Wodblok/ })).toBeVisible();
  await expect(nav(page).getByText('Create account')).toHaveCount(0);
  await expect(nav(page).getByText('Sign in')).toHaveCount(0);
});

test('signed out: Sign in and Create account replace Open Wodblok, and open Clerk', async ({ page }) => {
  await open(page);
  await expect(nav(page).getByRole('button', { name: 'Create account' })).toBeVisible();
  await expect(nav(page).getByRole('button', { name: 'Sign in' })).toBeVisible();
  await expect(page.locator('#open-app')).toBeHidden();
  await nav(page).getByRole('button', { name: 'Sign in' }).click();
  await nav(page).getByRole('button', { name: 'Create account' }).click();
  expect(await calls(page)).toEqual(['signin', 'signup']);
});

test('the app sends signed-out visitors here with ?signin=1: the dialog opens once and the address is cleaned', async ({ page }) => {
  await open(page, { query: '?signin=1' });
  await expect.poll(() => calls(page)).toEqual(['signin']);
  expect(new URL(page.url()).search).toBe('');
});

test('signed in and approved: "Hi <name>" with a menu that opens the app, account and sign out', async ({ page }) => {
  await open(page, { user: { firstName: 'Ana' }, me: { ok: true, approved: true } });
  const hi = nav(page).getByRole('button', { name: 'Hi Ana!', exact: true });
  await expect(hi).toBeVisible();
  await expect(nav(page).getByRole('button', { name: 'Sign in' })).toHaveCount(0);
  await hi.click();
  const app = page.getByRole('menuitem', { name: 'Open Wodblok' });
  await expect(app).toBeVisible();
  await expect(app).toHaveAttribute('href', /^https:\/\/app\.wodblok\.com\/?$/);
  await expect(page.getByText('On the list')).toBeHidden();
  await page.getByRole('menuitem', { name: 'Account' }).click();
  await hi.click();
  await page.getByRole('menuitem', { name: 'Sign out' }).click();
  await expect.poll(() => calls(page)).toEqual(['profile', 'signout']);
  expect(page.gateCalls).toContain('DELETE'); // the app's cookie is cleared before signing out
});

test('signed in but not approved: the menu says they are on the list and has no link into the app', async ({ page }) => {
  await open(page, { user: { firstName: 'Bo' }, me: { ok: true, approved: false } });
  await nav(page).getByRole('button', { name: 'Hi Bo!', exact: true }).click();
  await expect(page.getByText('On the list')).toBeVisible();
  await expect(page.getByRole('menuitem', { name: 'Open Wodblok' })).toBeHidden();
});

test('the menu closes with Escape and when clicking elsewhere', async ({ page }) => {
  await open(page, { user: { firstName: 'Ana' } });
  const hi = nav(page).getByRole('button', { name: 'Hi Ana!', exact: true });
  await hi.click();
  await expect(hi).toHaveAttribute('aria-expanded', 'true');
  await page.keyboard.press('Escape');
  await expect(hi).toHaveAttribute('aria-expanded', 'false');
  await hi.click();
  await page.locator('h1').first().click();
  await expect(hi).toHaveAttribute('aria-expanded', 'false');
});

test('a first name with markup is shown as text', async ({ page }) => {
  await open(page, { user: { firstName: '<img src=x onerror=window.__x=1>' } });
  await expect(nav(page).locator('button.btn-secondary')).toHaveText('Hi <img src=x onerror=window.__x=1>!');
  expect(await page.evaluate(() => window.__x)).toBeUndefined();
});

test('header fits a phone screen without sideways scrolling', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 700 });
  await open(page, { user: { firstName: 'Ana' } });
  await nav(page).getByRole('button', { name: 'Hi Ana!', exact: true }).click();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test('signed in and approved: the site asks for the app cookie', async ({ page }) => {
  await open(page, { user: { firstName: 'Ana' } });
  await expect.poll(() => page.gateCalls).toContain('POST');
});

test('signed in but not approved: no bounce back to the app', async ({ page }) => {
  await open(page, { user: { firstName: 'Bo' }, gate: { ok: true, approved: false }, query: '?signin=1' });
  await expect.poll(() => page.gateCalls).toContain('POST');
  await page.waitForTimeout(300);
  expect(new URL(page.url()).host).toBe('wodblok.test');
});

test('sent here by the app while signed in and approved: goes straight back, once', async ({ page }) => {
  await open(page, { user: { firstName: 'Ana' }, query: '?signin=1' });
  await page.waitForURL(/^https:\/\/app\.wodblok\.com\/?$/);
});

test('the plain "Open Wodblok" button never flashes: hidden while Clerk loads, replaced by the real header', async ({ page }) => {
  await open(page, { clerk: 'slow', user: { firstName: 'Ana' } });
  await expect(page.locator('#open-app')).toBeHidden(); // Clerk has not answered yet
  await expect(nav(page).getByRole('button', { name: 'Hi Ana!', exact: true })).toBeVisible();
  await expect(page.locator('#open-app')).toBeHidden();
});

test('if Clerk cannot load, the plain "Open Wodblok" button comes back', async ({ page }) => {
  await open(page, { clerk: 'fail' });
  await expect(page.locator('#open-app')).toBeVisible();
});

test('the app\'s "Sign out" arrives with ?signout=1: the app cookie is cleared, Clerk signs out, the address is cleaned', async ({ page }) => {
  await open(page, { user: { firstName: 'Ana' }, query: '?signout=1' });
  await expect.poll(() => calls(page)).toEqual(['signout']);
  expect(page.gateCalls).toContain('DELETE');
  expect(new URL(page.url()).search).toBe('');
});

test('the app\'s "Manage account" arrives with ?account=1: the account box opens and the address is cleaned', async ({ page }) => {
  await open(page, { user: { firstName: 'Ana' }, query: '?account=1' });
  await expect.poll(() => calls(page)).toEqual(['profile']);
  expect(new URL(page.url()).search).toBe('');
});
