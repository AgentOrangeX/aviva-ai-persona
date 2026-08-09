import { chromium } from 'playwright';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';

const BASE_URL = (process.env.PERSONA_BASE_URL || 'https://aviva-ai-persona-client-production.up.railway.app').replace(/\/$/, '');
const SWARM_SIZE = Number(process.env.SWARM_SIZE || 30);
const CONCURRENCY = Math.max(1, Math.min(Number(process.env.SWARM_CONCURRENCY || 5), 8));
const RUN_ID = String(process.env.SWARM_RUN_ID || Date.now());
const ARTIFACT_DIR = path.resolve('artifacts/persona-swarm');

const COHORTS = [
  ['General Insurance (GI)', 'Claims', 'Claims Analyst'],
  ['General Insurance (GI)', 'Underwriting', 'Underwriter'],
  ['General Insurance (GI)', 'Pricing', 'Pricing Analyst'],
  ['General Insurance (GI)', 'Product', 'Product Manager'],
  ['General Insurance (GI)', 'Distribution', 'Distribution Manager'],
  ['General Insurance (GI)', 'Operations', 'Operations Manager'],

  ['Insurance, Wealth & Retirement (IWR)', 'Wealth', 'Wealth Product Manager'],
  ['Insurance, Wealth & Retirement (IWR)', 'Workplace', 'Workplace Proposition Manager'],
  ['Insurance, Wealth & Retirement (IWR)', 'Retirement', 'Retirement Specialist'],
  ['Insurance, Wealth & Retirement (IWR)', 'Protection', 'Protection Manager'],
  ['Insurance, Wealth & Retirement (IWR)', 'Operations', 'IWR Operations Manager'],

  ['Customer & Marketing (C&M)', 'Marketing', 'Marketing Manager'],
  ['Customer & Marketing (C&M)', 'Customer Experience', 'Customer Experience Lead'],
  ['Customer & Marketing (C&M)', 'Customer Insight', 'Customer Insight Manager'],
  ['Customer & Marketing (C&M)', 'Digital', 'Digital Product Manager'],

  ['CIO / Technology', 'Software Engineering', 'Software Engineer'],
  ['CIO / Technology', 'Architecture', 'Solution Architect'],
  ['CIO / Technology', 'Cyber Security', 'Cyber Security Manager'],
  ['CIO / Technology', 'Delivery', 'Technology Delivery Lead'],

  ['Data & AI', 'AI Product', 'AI Product Manager'],
  ['Data & AI', 'Data Science', 'Data Scientist'],
  ['Data & AI', 'Analytics', 'Analytics Lead'],

  ['Operations / COO', 'Customer Operations', 'Customer Operations Manager'],
  ['Operations / COO', 'Operational Excellence', 'Operational Excellence Lead'],

  ['Risk', 'Enterprise Risk', 'Risk Manager'],
  ['Governance / Compliance / Legal', 'Compliance', 'Compliance Manager'],
  ['Finance', 'Financial Planning & Analysis', 'FP&A Manager'],
  ['People / HR', 'Learning & Development', 'Learning Manager'],
  ['Strategy & Transformation', 'Innovation', 'Innovation Manager'],
  ['Aviva Investors', 'Investment Management', 'Investment Manager'],
];

function cohortFor(index) {
  return COHORTS[index % COHORTS.length];
}

function testerFor(index) {
  const number = index + 1;
  const [businessArea, businessFunction, jobTitle] = cohortFor(index);
  return {
    number,
    name: `Synthetic Swarm Tester ${String(number).padStart(2, '0')}`,
    email: `persona.swarm.${RUN_ID}.${String(number).padStart(2, '0')}@example.com`,
    businessArea,
    businessFunction,
    jobTitle,
  };
}

function chooseOption(testerNumber, questionIndex, optionCount) {
  // Deterministic but varied. Each tester follows a different answer path while
  // remaining reproducible from tester number and question position.
  const hash = crypto
    .createHash('sha256')
    .update(`${RUN_ID}:${testerNumber}:${questionIndex}`)
    .digest();
  return hash.readUInt32BE(0) % optionCount;
}

function csvCell(value) {
  const s = String(value ?? '');
  return /[",\n]/.test(s) ? `"${s.replaceAll('"', '""')}"` : s;
}

async function runTester(browser, tester) {
  const startedAt = Date.now();
  const password = `Swarm-${crypto.randomBytes(18).toString('base64url')}!`;
  const context = await browser.newContext({
    viewport: { width: 1365, height: 900 },
  });
  const page = await context.newPage();
  const apiErrors = [];

  page.on('response', (response) => {
    if (response.url().includes('/api/') && response.status() >= 400) {
      apiErrors.push(`${response.status()} ${response.request().method()} ${response.url()}`);
    }
  });

  try {
    await page.goto(`${BASE_URL}/quiz`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
    await page.locator('.qcard h2').waitFor({ state: 'visible', timeout: 20_000 });

    const progressText = await page.locator('.quiz-head .progress-meta').innerText();
    const totalMatch = progressText.match(/\/\s*(\d+)/);
    const questionCount = totalMatch ? Number(totalMatch[1]) : 28;

    for (let q = 0; q < questionCount; q += 1) {
      const options = page.locator('.qcard .opt');
      const optionCount = await options.count();
      if (!optionCount) throw new Error(`Question ${q + 1}: no answer options rendered`);

      const selected = chooseOption(tester.number, q, optionCount);
      await options.nth(selected).click({ timeout: 10_000 });

      if (q < questionCount - 1) {
        // Quiz advances after a deliberate 180ms UI transition.
        await page.waitForTimeout(240);
      }
    }

    await page.waitForURL('**/register', { timeout: 20_000 });

    await page.locator('#name').fill(tester.name);
    await page.locator('#email').fill(tester.email);
    await page.locator('#password').fill(password);
    await page.locator('#jobTitle').fill(tester.jobTitle);
    await page.locator('#businessArea').selectOption(tester.businessArea);
    await page.locator('#businessFunction').waitFor({ state: 'visible', timeout: 5_000 });
    await page.locator('#businessFunction').selectOption(tester.businessFunction);

    await page.getByRole('button', { name: 'Create account' }).click();
    await page.waitForURL('**/result', { timeout: 30_000 });
    const personaHeading = (await page.locator('.result-hero h1').innerText({ timeout: 15_000 })).trim();

    // Verify that registration really saved the result, not merely rendered a local preview.
    await page.goto(`${BASE_URL}/my-results`, { waitUntil: 'domcontentloaded', timeout: 20_000 });
    await page.waitForTimeout(500);
    const resultsPageText = await page.locator('body').innerText();
    const savedResultVisible = personaHeading
      .replace(/^\S+\s+The\s+/u, '')
      .split(/\s+/)[0]
      ? !resultsPageText.includes('No results')
      : true;

    if (!savedResultVisible) throw new Error('Result page rendered but saved result was not visible in My Results');

    return {
      ...tester,
      status: 'PASS',
      persona: personaHeading,
      questionCount,
      apiErrors: apiErrors.join(' | '),
      durationMs: Date.now() - startedAt,
      resultUrl: `${BASE_URL}/my-results`,
      error: '',
    };
  } catch (error) {
    const shot = path.join(ARTIFACT_DIR, `failure-${String(tester.number).padStart(2, '0')}.png`);
    await page.screenshot({ path: shot, fullPage: true }).catch(() => {});
    return {
      ...tester,
      status: 'FAIL',
      persona: '',
      questionCount: '',
      apiErrors: apiErrors.join(' | '),
      durationMs: Date.now() - startedAt,
      resultUrl: page.url(),
      error: error?.stack || error?.message || String(error),
    };
  } finally {
    await context.close();
  }
}

async function runPool(items, limit, worker) {
  const results = new Array(items.length);
  let cursor = 0;

  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (true) {
      const index = cursor;
      cursor += 1;
      if (index >= items.length) return;
      results[index] = await worker(items[index]);
      const r = results[index];
      console.log(`[${r.status}] ${r.name} — ${r.persona || r.error.split('\n')[0]}`);
    }
  });

  await Promise.all(workers);
  return results;
}

await fs.mkdir(ARTIFACT_DIR, { recursive: true });

console.log(`Starting Persona swarm: ${SWARM_SIZE} testers, concurrency ${CONCURRENCY}`);
console.log(`Target: ${BASE_URL}`);
console.log(`Run ID: ${RUN_ID}`);

const browser = await chromium.launch({ headless: true });
const testers = Array.from({ length: SWARM_SIZE }, (_, i) => testerFor(i));
const results = await runPool(testers, CONCURRENCY, (tester) => runTester(browser, tester));
await browser.close();

const columns = [
  'number', 'name', 'email', 'businessArea', 'businessFunction', 'jobTitle',
  'status', 'persona', 'questionCount', 'durationMs', 'apiErrors', 'resultUrl', 'error',
];
const csv = [
  columns.join(','),
  ...results.map((row) => columns.map((key) => csvCell(row[key])).join(',')),
].join('\n');

await fs.writeFile(path.join(ARTIFACT_DIR, 'results.csv'), `${csv}\n`, 'utf8');
await fs.writeFile(path.join(ARTIFACT_DIR, 'results.json'), JSON.stringify({
  runId: RUN_ID,
  baseUrl: BASE_URL,
  swarmSize: SWARM_SIZE,
  concurrency: CONCURRENCY,
  generatedAt: new Date().toISOString(),
  results,
}, null, 2), 'utf8');

const passed = results.filter((r) => r.status === 'PASS').length;
const failed = results.length - passed;
const personas = results
  .filter((r) => r.persona)
  .reduce((acc, r) => {
    acc[r.persona] = (acc[r.persona] || 0) + 1;
    return acc;
  }, {});

const summary = [
  '# Persona Production Swarm',
  '',
  `- Target: ${BASE_URL}`,
  `- Testers: ${results.length}`,
  `- Passed: ${passed}`,
  `- Failed: ${failed}`,
  `- Concurrency: ${CONCURRENCY}`,
  '',
  '## Persona distribution',
  '',
  ...Object.entries(personas).sort((a, b) => b[1] - a[1]).map(([persona, count]) => `- ${persona}: ${count}`),
  '',
  'See `results.csv` and `results.json` for individual journeys.',
].join('\n');

await fs.writeFile(path.join(ARTIFACT_DIR, 'summary.md'), `${summary}\n`, 'utf8');
console.log('\n' + summary);

if (failed > 0) process.exitCode = 1;
