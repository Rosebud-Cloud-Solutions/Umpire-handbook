import { chromium } from 'playwright-core';
import path from 'path';

const exe = '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell';
const browser = await chromium.launch({ executablePath: exe });
const page = await browser.newPage();
const errors = [];
page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
page.on('pageerror', e => errors.push('PAGEERR: ' + e.message));
await page.goto('file://' + path.resolve(process.cwd(), 'index.html'), { waitUntil: 'networkidle' });

async function ask(q) {
  await page.fill('#q', q);
  await page.click('#goBtn');
  await page.waitForTimeout(80);
  const title = await page.$eval('#results .card h3', el => el.textContent).catch(() => '(no card)');
  const answer = await page.$eval('#results .card .answer', el => el.textContent).catch(() => '');
  return { title, answer };
}

// Game-management escalation reasoning (Rule 18) is a bespoke response, tested separately.
async function gmCheck() {
  const q = "I have already given the Red GD proactive advice about obstruction. She continues to mark her player within 3ft. What should I do?";
  await page.fill('#q', q);
  await page.click('#goBtn');
  await page.waitForTimeout(120);
  const gmTitle = await page.$eval('#results .gm-card h3', el => el.textContent).catch(() => '');
  const nextStep = await page.$eval('#results .gm-ladder li.gm-next .gm-step b', el => el.textContent).catch(() => '');
  const doneStep = await page.$eval('#results .gm-ladder li.gm-done .gm-step b', el => el.textContent).catch(() => '');
  const hasObstruction = (await page.$$eval('#results .card h3', els => els.map(e => e.textContent))).some(t => /Obstruction/i.test(t));
  const ok = /Advance and\/or escalate the sanction/i.test(gmTitle)
    && /Advance and\/or escalate the sanction/i.test(nextStep)
    && /Proactive advice/i.test(doneStep)
    && hasObstruction;
  console.log((ok ? 'PASS' : 'FAIL') + ' | game-management escalation: advice given -> advance the sanction (+ obstruction)');
  if (!ok) console.log('       gmTitle="' + gmTitle + '" next="' + nextStep + '" done="' + doneStep + '" obstruction=' + hasObstruction);
  return ok;
}

// [query, expected substring in title, expected substring in the answer block (rule heading etc.)]
const cases = [
  // --- general phrasing ---
  ["GA lifted her landing foot and put it down again before passing", "Footwork", "Other foot movements"],
  ["Defender was closer than a metre with arms up over the shooter", "Obstruction", "Player in possession"],
  ["GD pushed the shooter as she released the shot", "Contact", "Interference"],
  ["A long pass flew over a whole third without anyone touching it", "Over a third", "Over a third"],
  ["WA stepped into the centre third before the whistle", "Breaking", "Centre pass"],
  ["Player caught the ball and landed with one foot over the sideline", "Out of court", "Out of court"],
  ["Two opposing players grabbed the ball at exactly the same time", "Simultaneous", "Simultaneous"],
  ["Shooter held the ball for four seconds before shooting", "Held ball", "Playing the ball"],
  ["Defender knocked an airborne player and she landed on her head", "Dangerous", "Dangerous play"],
  ["coach was shouting abuse at the umpire from the bench", "Bench", "Discipline of team officials"],
  ["player used the goalpost to keep her balance", "goalpost", "Playing the ball"],
  ["shooter shot with her foot on the line outside the circle", "Incorrect shot", "Scoring a goal"],
  ["defender deflected the ball down through the ring on a shot", "Interference with shot", "Scoring a goal"],
  ["caught her own pass before anyone else touched it", "Repossession", "Playing the ball"],
  ["a player kicked the ball to a team mate", "Incorrect playing", "Prohibited actions"],
  ["GS took a free pass in the circle and shot for goal", "Shooting from a free pass", "Sanctions and actions"],
  ["a player was injured and bleeding on court", "injury", "Stoppages"],
  // --- drawn directly from the Europe Netball A&B sample paper ---
  ["WA passed to GS very close inside the circle with no room to intercept", "Short pass", "Short pass"],
  ["WD reached into the opposing goal circle, tipped the ball and C caught it", "Offside", "Requirements"],
  ["GK took the throw-in standing 20cm away from the goal line", "throw-in", "Conditions for throw-in"],
  ["GD held an arm out to stop the attacker moving to receive the pass", "Obstruction", "Player not in possession"],
  ["GK moved into the landing space of the airborne shooter who fell", "Causing contact", "player in the air"],
  ["Red GD hit the ball out of the GS hands just before the shot", "Contact", "Interference"],
  // reported bug: GK throws from the defending third, caught in the attacking third (skips centre third)
  ["Red GK standing with the ball in the defending third throws it and it is caught by the red WA in the attacking third", "Over a third", "Over a third"],
  ["the ball was thrown over the centre third and caught in the goal third without being touched in the middle", "Over a third", "Over a third"],
  ["GD standing outside the court tried to defend the GA on court", "Defending from out of court", "Defending from out of court"],
  // reported bug: leaving the field of play (for a drink) -> treated as a late player, not "ball out of court"
  ["A player leaves the court to have a drink, what should I do?", "Leaving the field of play", "Player outside the court"],
  ["a player went off court to get free space", "Leaving the court", "Player outside the court"],
];

let pass = 0;
for (const [q, expTitle, expAns] of cases) {
  const { title, answer } = await ask(q);
  const okT = title.toLowerCase().includes(expTitle.toLowerCase());
  const okA = answer.toLowerCase().includes(expAns.toLowerCase());
  const ok = okT && okA;
  if (ok) pass++;
  console.log((ok ? 'PASS' : 'FAIL') + ' | ' + q);
  if (!ok) console.log('       got title="' + title + '" | heading-check "' + expAns + '"=' + okA);
}
// Interactive judgement: dangerous-play severity resolves to the right game-management action.
async function decisionCheck() {
  const q = "The GD takes up the landing space of the Red GA, this action is intentional and causes the GA to fall, hitting her head hard on the ground.";
  await page.fill('#q', q);
  await page.click('#goBtn');
  await page.waitForTimeout(150);
  const hasPanel = (await page.$('#results .decide')) !== null;
  await page.$$eval('#results .dec-opt', els => { const t = els.find(e => /Intentional/.test(e.textContent)); if (t) t.click(); });
  await page.waitForTimeout(100);
  const orderOff = await page.$eval('#results .dec-result:not([hidden]) .dec-action', el => el.textContent).catch(() => '');
  // switch to the "reckless / careless" option -> suspend
  await page.$$eval('#results .dec-opt', els => { const t = els.find(e => /reckless \/ careless/i.test(e.textContent)); if (t) t.click(); });
  await page.waitForTimeout(100);
  const suspend = await page.$eval('#results .dec-result:not([hidden]) .dec-action', el => el.textContent).catch(() => '');
  const ok = hasPanel && /order the player off/i.test(orderOff) && /suspend the player/i.test(suspend);
  console.log((ok ? 'PASS' : 'FAIL') + ' | judgement branch: intentional -> order off; reckless -> suspend');
  if (!ok) console.log('       panel=' + hasPanel + ' orderOff="' + orderOff + '" suspend="' + suspend + '"');
  return ok;
}

const gmOk = await gmCheck();
const decOk = await decisionCheck();
const total = cases.length + 2;
const passed = pass + (gmOk ? 1 : 0) + (decOk ? 1 : 0);
console.log('\n' + passed + '/' + total + ' passed | console errors: ' + (errors.length ? errors.join('; ') : 'none'));
await browser.close();
process.exit(passed === total && errors.length === 0 ? 0 : 1);
