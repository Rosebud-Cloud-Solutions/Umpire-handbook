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
console.log('\n' + pass + '/' + cases.length + ' passed | console errors: ' + (errors.length ? errors.join('; ') : 'none'));
await browser.close();
process.exit(pass === cases.length && errors.length === 0 ? 0 : 1);
