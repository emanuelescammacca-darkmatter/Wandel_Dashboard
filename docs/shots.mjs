/* Regenerate the handover-doc screenshots (docs/img/*).
   Prereqs: dev server on :5173 and `npm i -D playwright && npx playwright install chromium`
   (playwright is intentionally not a permanent dependency). Run: node docs/shots.mjs */
import { chromium } from 'playwright';
import { mkdirSync } from 'fs';

const BASE = 'http://localhost:5173';
const OUT = 'docs/img';
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();
/* Tall viewport: the app uses inner scroll containers (h-screen), so content below
   the window edge is never painted — make the window tall enough to fit each page. */
const page = await browser.newPage({ viewport: { width: 1680, height: 2400 }, deviceScaleFactor: 2 });

const shoot = async (locator, file) => {
  await locator.scrollIntoViewIfNeeded();
  await page.waitForTimeout(600);
  await locator.screenshot({ path: `${OUT}/${file}`, animations: 'disabled' });
  console.log('✓', file);
};

/* ── Dashboard ── */
await page.goto(`${BASE}/dashboard`, { waitUntil: 'networkidle' });
await page.waitForTimeout(3500); // map tiles + brand icons

await shoot(page.locator('header').first(), 'dashboard-hero.png');
const sections = page.locator('main > section');
await shoot(sections.nth(0), 'dashboard-positions.png');
await shoot(sections.nth(1), 'dashboard-statistics.png');
await shoot(sections.nth(2), 'dashboard-pipeline.png');
await shoot(sections.nth(3), 'dashboard-outreach.png');

/* ── Position workspace ── */
await page.goto(`${BASE}/clients/positions`, { waitUntil: 'networkidle' });
await page.waitForTimeout(1500);

await shoot(page.locator('.page-top-fade > div').first(), 'position-candidates-list.png');

await page.getByRole('button', { name: 'Kanban' }).click();
await page.waitForTimeout(800);
await shoot(page.locator('.page-top-fade > div').first(), 'position-candidates-kanban.png');
await page.getByRole('button', { name: 'List', exact: true }).click();

await page.getByRole('button', { name: 'Comparison', exact: true }).click();
await page.waitForTimeout(900);
await shoot(page.locator('.page-top-fade > div').first(), 'position-comparison.png');

await page.getByRole('button', { name: 'Job Description', exact: true }).click();
await page.waitForTimeout(900);
const sparkRow = page.locator('article .cursor-pointer').first();
if (await sparkRow.count()) await sparkRow.click(); // expand the first linked question
await page.waitForTimeout(500);
await shoot(page.locator('.page-top-fade > div').first(), 'position-jd.png');

/* ── Candidate profile (Marcel Weber, ProfileFactsRail) ── */
await page.goto(`${BASE}/clients/positions/candidate/1`, { waitUntil: 'networkidle' });
await page.waitForTimeout(1500);
await shoot(page.locator('main .px-6.py-6').first(), 'profile-full.png');

await page.getByRole('button', { name: 'Download CV' }).click();
await page.waitForTimeout(1500);
await shoot(page.locator('#cv-print'), 'profile-cv.png');

await browser.close();
console.log('done');
