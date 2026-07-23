import { chromium } from 'playwright-core';
import path from 'path';
const exe = '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell';
const browser = await chromium.launch({ executablePath: exe });
const page = await browser.newPage();
const errors = [];
page.on('console', m => { if (m.type()==='error') errors.push(m.text()); });
page.on('pageerror', e => errors.push('PAGEERR: '+e.message));
await page.goto('file://'+path.resolve(process.cwd(),'index.html'), { waitUntil:'networkidle' });
async function ask(q){
  await page.fill('#q', q); await page.click('#goBtn'); await page.waitForTimeout(80);
  return await page.$eval('#results .card h3', el=>el.textContent).catch(()=>'(no card)');
}
// [query, expected substring in best-match title]
const cases = [
  ["GA lifted her landing foot and put it down again before passing","Footwork"],
  ["Defender was closer than a metre with arms up over the shooter","Obstruction"],
  ["GD pushed the shooter as she released the shot","Contact"],
  ["A long pass flew over a whole third without anyone touching it","Over a third"],
  ["WA stepped into the centre third before the whistle","Breaking"],
  ["Player caught the ball and landed with one foot over the sideline","Out of court"],
  ["Two opposing players grabbed the ball at exactly the same time","Simultaneous"],
  ["Shooter held the ball for four seconds before shooting","Held ball"],
  ["Defender knocked an airborne player and she landed on her head","Dangerous"],
  ["coach was shouting abuse at the umpire from the bench","Bench"],
  ["player used the goalpost to keep her balance","goalpost"],
  ["the ball went out over the sideline off the GK's hands","Out of court"],
  ["shooter shot with her foot on the line outside the circle","Incorrect shot"],
  ["defender deflected the ball down through the ring on a shot","Interference"],
  ["player caught her own pass before anyone else touched it","Repossession"],
  ["a player kicked the ball to a team mate","Incorrect playing"],
  ["GS took a free pass in the circle and shot for goal","Shooting from a free pass"],
  ["a player was injured and bleeding on court","injury"],
];
let pass=0;
for (const [q,exp] of cases){
  const title = await ask(q);
  const ok = title.toLowerCase().includes(exp.toLowerCase());
  if(ok) pass++;
  console.log((ok?'PASS':'FAIL')+' | '+q+'\n       -> '+title);
}
console.log('\n'+pass+'/'+cases.length+' passed | console errors: '+(errors.length?errors.join('; '):'none'));
await browser.close();
