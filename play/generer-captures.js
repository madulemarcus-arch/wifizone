// Génère les images de la fiche Play Store à partir de données FICTIVES : 7 captures de téléphone et le graphique de présentation.
//   cd tests && npm install && npx playwright install chromium     (une seule fois)
//   node play/generer-captures.js                                    (depuis la racine du dépôt)
const { chromium } = require(require.resolve('playwright', { paths: [__dirname + '/../tests', __dirname, process.cwd()] }));
const http = require('http'), fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '..'), OUT = path.join(__dirname, 'captures');
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.webmanifest': 'application/manifest+json' };
const server = http.createServer((q, r) => { const p = path.join(ROOT, decodeURIComponent(q.url.split('?')[0]).replace(/\/$/, '/index.html')); if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'Content-Type': MIME[path.extname(p)] || 'application/octet-stream' }); fs.createReadStream(p).pipe(r); });
// fictitious data, written to localStorage before the app starts
const seed = () => {
  const iso = d => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  const ago = n => { const d = new Date(); d.setDate(d.getDate() - n); return d; };
  const F = { V: 500, J: 1000, S: 7000, M: 30000 }, modes = ['Cash', 'Cash', 'M-Pesa', 'Airtel Money', 'M-Pesa', 'Cash', 'Orange Money'];
  const db = JSON.parse(localStorage.getItem('wifizone-v1') || '{}'); let k = 0;
  db.noProfiles = true; db.lastBackup = Date.now() - 86400000; db.name = 'WiFi Zone'; db.sales = []; db.expenses = []; db.closings = []; db.tickets = []; db.lots = [];
  for (let n = 44; n >= 0; n--) { const d = ago(n), day = iso(d), count = n === 0 ? 17 : 6 + ((n * 7) % 9) + (d.getDay() === 6 ? 5 : 0);
    for (let i = 0; i < count; i++) { const f = ['V', 'V', 'J', 'J', 'J', 'S', 'M'][(i + n) % 7], qty = f === 'V' && i % 4 === 0 ? 2 : 1, h = 7 + (i * 5 + n) % 13;
      db.sales.push({ id: 's' + (k++), ts: new Date(day + 'T' + String(h).padStart(2, '0') + ':' + String((i * 11) % 60).padStart(2, '0') + ':00').getTime(), date: day, fid: f, qty, amount: F[f] * qty, mode: modes[(i + n) % 7], ref: '', codes: [], note: '', by: '' }); }
    if (n === 0) db.expenses.push({ id: 'e0', ts: d.getTime(), date: day, label: 'Carburant groupe', cat: 'Électricité / carburant', amount: 5000, cur: 'CDF', rate: 2400, mode: 'Cash' });
    if (n % 7 === 3) db.expenses.push({ id: 'e' + n, ts: d.getTime(), date: day, label: 'Abonnement Starlink', cat: 'Abonnement Starlink', amount: 65, cur: 'USD', rate: 2400, mode: 'Banque' });
    if (n % 5 === 1) db.expenses.push({ id: 'g' + n, ts: d.getTime(), date: day, label: 'Carburant groupe', cat: 'Électricité / carburant', amount: 18000, cur: 'CDF', rate: 2400, mode: 'Cash' });
    if (n === 10 || n === 20) db.expenses.push({ id: 'm' + n, ts: d.getTime(), date: day, label: 'Câble réseau', cat: 'Matériel / réparation', amount: 25000, cur: 'CDF', rate: 2400, mode: 'Cash' });
    if (n > 0 && n < 8) db.closings.push({ date: day, ts: d.getTime(), expected: 0, counted: 0, diff: 0, note: '' }); }
  const code = i => 'W' + String(10000 + i * 37).slice(-4) + 'KZ';
  [['V', 60, 'app'], ['J', 42, 'app'], ['S', 9, 'app'], ['M', 14, 'app'], ['J', 30, 'paper']].forEach(([fid, n, dest], li) => { const id = 'L' + li, ts = Date.now() - (li + 1) * 86400000;
    db.lots.push({ id, ts, fid, n, imported: true, dest });
    for (let i = 0; i < n; i++) db.tickets.push({ id: code(li * 100 + i), code: code(li * 100 + i), ts: ts + i, fid, lot: id, status: i < n - 12 + (fid === 'S' ? 6 : 0) ? 'stock' : 'sold' }); });
  localStorage.setItem('wifizone-v1', JSON.stringify(db));
};
(async () => {
  await new Promise(r => server.listen(0, r)); const base = 'http://localhost:' + server.address().port;
  const b = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
  const ctx = await b.newContext({ viewport: { width: 392, height: 780 }, deviceScaleFactor: 2.75, isMobile: true, hasTouch: true, locale: 'fr-FR', serviceWorkers: 'block' }), p = await ctx.newPage();
  await p.goto(base + '/index.html'); await p.evaluate(seed);
  const shots = [['home', '1-accueil'], ['sell', '2-vente'], ['tix', '3-tickets'], ['exp', '4-depenses'], ['day', '5-cloture'], ['rep', '6-rapport'], ['set', '7-reglages']];
  for (const [tab, name] of shots) {
    await p.goto(base + '/index.html?go=' + tab); await p.waitForTimeout(1500);
    await p.evaluate(() => { document.querySelectorAll('#toast,.toast').forEach(e => e.remove()); window.scrollTo(0, 0); }); await p.waitForTimeout(150);
    await p.screenshot({ path: path.join(OUT, name + '.png') }); console.log('capture', name);
  }
  // feature graphic 1024x500 (two captures inside phone frames)
  const b64 = f => 'data:image/' + (f.endsWith('.svg') ? 'svg+xml' : 'png') + ';base64,' + fs.readFileSync(f).toString('base64');
  const g = await (await b.newContext({ viewport: { width: 1024, height: 500 }, deviceScaleFactor: 1 })).newPage();
  await g.setContent(`<style>*{box-sizing:border-box}body{margin:0;width:1024px;height:500px;overflow:hidden;font-family:system-ui,Segoe UI,Roboto,sans-serif;background:linear-gradient(120deg,#0b1d36 0%,#10315a 50%,#1c5ca8 100%);color:#fff;position:relative}
  .glow{position:absolute;right:-80px;top:-120px;width:520px;height:520px;border-radius:50%;background:radial-gradient(circle,rgba(56,189,248,.5),transparent 68%)}
  .logo{position:absolute;left:56px;top:34px;width:118px;background:#fff;border-radius:18px;padding:8px}
  h1{position:absolute;left:56px;top:166px;margin:0;font-size:46px;line-height:1.08;width:400px;font-weight:800;letter-spacing:-.5px}
  p{position:absolute;left:56px;top:290px;margin:0;font-size:21px;line-height:1.45;width:390px;opacity:.92}
  .tags{position:absolute;left:56px;top:420px;display:flex;gap:8px;width:400px;flex-wrap:wrap}.tags span{background:rgba(255,255,255,.14);border:1px solid rgba(255,255,255,.25);padding:6px 13px;border-radius:99px;font-size:15px}
  .ph{position:absolute;right:54px;top:40px;width:236px;height:470px;border-radius:30px;background:#000;padding:8px;box-shadow:0 24px 60px rgba(0,0,0,.5)}.ph img{width:100%;height:100%;object-fit:cover;object-position:top;border-radius:23px;display:block}
  .ph2{right:296px;top:86px;transform:scale(.88);opacity:.96}</style>
  <div class="glow"></div><img class="logo" src="${b64(path.join(ROOT, 'logo.svg'))}"><h1>WiFi Zone Manager</h1><p>Vendez vos tickets Wi-Fi, suivez vos dépenses et clôturez la caisse chaque soir.</p><div class="tags"><span>Fonctionne hors connexion</span><span>Stock de tickets</span><span>Clôture du jour</span></div>
  <div class="ph ph2"><img src="${b64(path.join(OUT, '3-tickets.png'))}"></div><div class="ph"><img src="${b64(path.join(OUT, '1-accueil.png'))}"></div>`);
  await g.waitForTimeout(500); await g.screenshot({ path: path.join(OUT, 'graphique-1024x500.png') }); console.log('graphique 1024x500');
  fs.copyFileSync(path.join(ROOT, 'icon-512.png'), path.join(OUT, 'icone-512.png'));
  await b.close(); server.close();
})();
