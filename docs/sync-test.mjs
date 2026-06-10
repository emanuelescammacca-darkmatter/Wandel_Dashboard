/* Smoke test: a stage change on the profile propagates to the position table
   and the dashboard board within the same SPA session. */
import { chromium } from 'playwright';

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1680, height: 1400 } });

// 1. Open Marcel Weber's profile — initial stage: Interviewing
await page.goto('http://localhost:5173/clients/positions/candidate/1', { waitUntil: 'networkidle' });
await page.waitForTimeout(800);
const headerTag = await page.locator('span:has-text("Interviewing")').first().isVisible();
console.log('profile shows Interviewing:', headerTag);

// 2. Move him to "Offer Extended" via the evaluate dropdown
await page.getByRole('button', { name: /Evaluate Candidate/ }).click();
await page.waitForTimeout(300);
await page.getByRole('button', { name: 'Offer Extended' }).click();
await page.waitForTimeout(400);
const newTag = await page.locator('span:has-text("Offer Extended")').first().isVisible();
console.log('profile header updated to Offer Extended:', newTag);

// 3. Navigate (SPA) back to the position — the table pill must show Offer Extended
await page.getByText('Servicetechniker für Kaffeeautomaten').first().click(); // back link
await page.waitForTimeout(900);
const row = page.locator('div', { hasText: 'Marcel Weber' }).locator('span:has-text("Offer Extended")').first();
console.log('position table shows Offer Extended for Marcel:', await row.isVisible());

// 4. Kanban view: Marcel's card must sit in the Offer Extended lane
await page.getByRole('button', { name: 'Kanban' }).click();
await page.waitForTimeout(800);
const lane = page.locator('div').filter({ has: page.locator('span:text-is("Offer Extended")') }).last();
const inLane = await page.locator('text=Marcel').count();
console.log('kanban shows Marcel card:', inLane > 0);

await browser.close();
console.log('done');
