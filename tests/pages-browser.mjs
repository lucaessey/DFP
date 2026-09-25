import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';

// Isolated profiles: this never reads or changes the player's browser saves.
const address = new URL(process.env.DFP_TEST_URL || 'http://127.0.0.1:4174/DFP/');
const browser = await chromium.launch({ channel: process.env.DFP_BROWSER || 'msedge', headless: true });
const errors = [], failures = [], checks = [];
mkdirSync('test-results', { recursive: true });
try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  page.on('pageerror', error => errors.push(error.message));
  page.on('response', response => { if (response.status() >= 400) failures.push(`${response.status()} ${response.url()}`); });
  const response = await page.goto(address.href);
  assert.equal(response.status(), 200);
  await page.locator('[data-station="prep"]').waitFor();
  await page.waitForFunction(() => document.querySelector('#game').dfpDiagnostics().calls > 0);
  assert.equal(await page.locator('#game').evaluate(canvas => canvas.dfpDiagnostics().engine), 'Three.js WebGL');
  checks.push('Public path loads and draws the 3D game');

  const manifestURL = await page.locator('link[rel="manifest"]').evaluate(link => link.href);
  assert.equal(new URL(manifestURL).pathname, `${address.pathname}manifest.webmanifest`);
  const manifestResponse = await context.request.get(manifestURL);
  assert.ok(manifestResponse.ok());
  const manifest = await manifestResponse.json();
  for (const field of ['id', 'scope', 'start_url']) assert.equal(new URL(manifest[field], manifestURL).href, address.href);
  for (const icon of manifest.icons) {
    const url = new URL(icon.src, manifestURL);
    assert.ok(url.pathname.startsWith(address.pathname));
    assert.ok((await context.request.get(url.href)).ok());
  }
  const worker = await page.evaluate(async () => {
    const registration = await Promise.race([navigator.serviceWorker.ready, new Promise((_, reject) => setTimeout(() => reject(Error('Offline worker timeout')), 30000))]);
    return { scope: registration.scope, script: registration.active.scriptURL };
  });
  assert.equal(worker.scope, address.href);
  assert.equal(worker.script, new URL('sw.js', address).href);
  if (address.pathname !== '/') assert.equal(await page.evaluate(async () => !!(await navigator.serviceWorker.getRegistration('/'))), false);
  checks.push('Manifest, icons and service worker stay within the game path');

  await page.clock.install();
  const snapshot = () => page.evaluate(() => JSON.parse(JSON.parse(localStorage.getItem('dfp.save')).data));
  async function until(predicate, label) {
    for (let attempt = 0; attempt < 100; attempt++) {
      if (predicate(await snapshot())) return;
      await page.clock.runFor(500);
    }
    throw Error(`Timed out: ${label}`);
  }
  async function work(station, predicate) {
    await page.locator(`[data-station="${station}"]`).click();
    await until(predicate, station);
  }
  await page.locator('#menu-button').click();
  await page.locator('[data-action="product"][data-id="controller"]').click();
  await page.locator('[data-action="close"]').click();
  await page.locator('#tables-button').click();
  await page.locator('[data-action="buy-table"][data-id="0"]').click();
  await page.locator('[data-action="close"]').click();
  assert.equal((await snapshot()).money, 10);
  await work('prep', state => state.tutorial >= 1);
  await until(state=>state.floors[0].customers.length>0,'first customer');
  const orderCount=(await snapshot()).floors[0].customers[0].needs.length;
  await work('fry', state => state.floors[0].stock.controller >= orderCount);
  await work('pickup', state => state.player.bag.length >= orderCount);
  await work('stack', state => state.floors[0].counter.controller >= orderCount);
  await work('counter', state => state.served === 1);
  assert.equal((await snapshot()).money, 10+5*orderCount);
  checks.push('Fresh game unlocks food, buys a table and completes a paid order');

  await page.reload();
  await page.locator('#tables-button').waitFor();
  await page.waitForFunction(() => !!navigator.serviceWorker.controller);
  await context.setOffline(true);
  await page.reload();
  await page.locator('[data-station="prep"]').waitFor();
  assert.equal((await snapshot()).money, 10+5*orderCount);
  assert.equal((await snapshot()).floors[0].tables[0].owned, true);
  await page.screenshot({ path: 'test-results/pages-desktop.png' });
  checks.push('Offline reload renders 3D and preserves earned money and table ownership');
  await context.close();

  const phone = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const mobile = await phone.newPage();
  mobile.on('pageerror', error => errors.push(error.message));
  await mobile.goto(address.href);
  await mobile.locator('#tables-button').tap();
  assert.equal(await mobile.locator('[data-action="buy-table"]').count(), 6);
  assert.equal(await mobile.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
  await mobile.screenshot({ path: 'test-results/pages-phone.png' });
  checks.push('Phone touch opens the table shop without horizontal overflow');
  await phone.close();
  assert.deepEqual(errors, []);
  assert.deepEqual(failures, []);
  writeFileSync('test-results/pages-report.json', JSON.stringify({ url: address.href, date: new Date().toISOString(), checks, errors, failures }, null, 2));
  checks.forEach(check => console.log('PASS', check));
} finally {
  await browser.close();
}
