// Android app shortcuts: ?go=<screen> (sell, tix, day, rep…). Without profiles everything is open.
const { chromium, devices } = require('playwright');
const BASE = process.env.BASE_URL || 'http://localhost:8775';
let f = 0; const ok = (n, c, x = '') => { console.log((c ? 'PASS ' : 'FAIL ') + n + (x ? ' ' + x : '')); if (!c) f++; };
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined }), p = await (await b.newContext({ ...devices['Pixel 5'] })).newPage(), errs = [];
  p.on('pageerror', e => errs.push(e.message)); p.on('dialog', d => d.accept());
  await p.goto(BASE + '/index.html'); await p.waitForTimeout(500);
  await p.evaluate(() => { const k = 'wifizone-v1', db = JSON.parse(localStorage.getItem(k) || '{}'); db.noProfiles = true; localStorage.setItem(k, JSON.stringify(db)); });
  const tab = async q => { await p.goto(BASE + '/index.html' + q); await p.waitForTimeout(800); return p.evaluate(() => document.querySelector('nav button.on') && document.querySelector('nav button.on').dataset.v); };
  ok('no parameter: Accueil', (await tab('')) === 'home');
  ok('?go=sell opens Vendre', (await tab('?source=shortcut&go=sell')) === 'sell');
  ok('?go=tix opens Tickets', (await tab('?go=tix')) === 'tix');
  ok('?go=day opens Clôture', (await tab('?go=day')) === 'day');
  ok('?go=rep opens Rapport', (await tab('?go=rep')) === 'rep');
  ok('unknown screen is ignored', (await tab('?go=nimportequoi')) === 'home');
  const m = await (await p.request.get(BASE + '/manifest.webmanifest')).json(); ok('manifest served with 4 shortcuts and a maskable icon', m.shortcuts.length === 4 && m.icons.some(i => i.purpose === 'maskable'));
  const pr = await p.request.get(BASE + '/privacy.html'); ok('privacy.html is served', pr.ok() && /confidentialité/.test(await pr.text()));
  ok('Settings links to the privacy policy', await (async () => { await p.goto(BASE + '/index.html?go=set'); await p.waitForTimeout(800); return /Politique de confidentialité/.test(await p.innerText('#view')); })());
  ok('no page errors', errs.length === 0, errs.join('|')); await b.close(); process.exit(f ? 1 : 0);
})();
