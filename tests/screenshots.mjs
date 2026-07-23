import { chromium } from 'playwright-core';
import path from 'path';
const exe = '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell';
const browser = await chromium.launch({ executablePath: exe });
const url = 'file://'+path.resolve(process.cwd(),'index.html');
async function shot(name, theme, actions){
  const page = await browser.newPage({ viewport:{width:1000,height:1400}, deviceScaleFactor:2, colorScheme: theme });
  await page.goto(url,{waitUntil:'networkidle'});
  if(actions) await actions(page);
  await page.waitForTimeout(150);
  await page.screenshot({path:name, fullPage:true});
  await page.close();
}
const askAction = q => async page => { await page.fill('#q', q); await page.click('#goBtn'); await page.waitForTimeout(150); };
await shot('scratch_light_result.png','light', askAction("GD pushed the shooter as she released the shot"));
await shot('scratch_dark_result.png','dark', askAction("Defender knocked an airborne player and she landed on her head"));
await shot('scratch_light_lib.png','light', async p=>{ await p.click('.tab[data-view="library"]'); await p.waitForTimeout(150); });
await shot('scratch_dark_sig.png','dark', async p=>{ await p.click('.tab[data-view="signals"]'); await p.waitForTimeout(120); });
await browser.close();
console.log('done');
