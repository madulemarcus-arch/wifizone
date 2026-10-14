// Static checks (no browser): script syntax, version in sync with the service worker, installable manifest, privacy page.
const fs = require('fs'), path = require('path'), { execFileSync } = require('child_process');
const ROOT = path.resolve(__dirname, '..', '..'); let fails = 0;
const ok = (n, c, x = '') => { console.log((c ? 'PASS ' : 'FAIL ') + n + (x ? ' ' + x : '')); if (!c) fails++; };
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const html = read('index.html'), sw = read('sw.js'), man = JSON.parse(read('manifest.webmanifest')), pv = read('privacy.html'), pages = read('.github/workflows/pages.yml');
const version = (html.match(/VERSION = '([^']+)'/) || [])[1], cache = (sw.match(/const CACHE = '([^']+)'/) || [])[1];
ok('index.html VERSION equals the sw.js CACHE (wifizone-<VERSION>)', cache === 'wifizone-' + version, `${cache} / ${version}`);
const files = [...sw.match(/const FILES = \[([^\]]*)\]/)[1].matchAll(/'([^']+)'/g)].map(m => m[1].replace(/^\.\//, ''));
files.filter(f => f && f !== './').forEach(f => ok('sw.js caches an existing file: ' + f, fs.existsSync(path.join(ROOT, f))));
const inline = [...html.matchAll(/<script(?![^>]*src)[^>]*>([\s\S]*?)<\/script>/g)].map(m => m[1]).filter(s => s.length > 200);
ok('index.html has its application script', inline.length >= 1);
inline.forEach((s, i) => { const f = path.join(require('os').tmpdir(), 'wz-inline-' + i + '.js'); fs.writeFileSync(f, s); try { execFileSync(process.execPath, ['--check', f], { stdio: 'pipe' }); ok('syntax OK: inline script ' + (i + 1), true); } catch (e) { ok('syntax OK: inline script ' + (i + 1), false, String(e.stderr || e).split('\n').slice(0, 3).join(' ')); } });
try { execFileSync(process.execPath, ['--check', path.join(ROOT, 'sw.js')], { stdio: 'pipe' }); ok('syntax OK: sw.js', true); } catch (e) { ok('syntax OK: sw.js', false); }
ok('manifest: name, id, start_url, scope, standalone, language', !!(man.name && man.short_name && man.id && man.start_url && man.scope) && man.display === 'standalone' && man.lang === 'fr');
ok('manifest: 192 and 512 icons plus a maskable 512 icon, all present on disk', ['192x192', '512x512'].every(z => man.icons.some(i => i.sizes === z && i.purpose === 'any')) && man.icons.some(i => i.purpose === 'maskable' && i.sizes === '512x512') && man.icons.every(i => fs.existsSync(path.join(ROOT, i.src))));
ok('manifest: shortcuts (Vendre, Tickets, Clôture, Rapport) and store category', (man.shortcuts || []).length === 4 && man.shortcuts.every(x => /[?&]go=[a-z]+/.test(x.url)) && (man.categories || []).length > 0);
ok('privacy policy exists (required by Google Play) with contact and local-data statement', /Politique de confidentialité/.test(pv) && /contact@cispolstore\.com/.test(pv) && /sur votre appareil/.test(pv));
ok('privacy policy cached by sw.js, linked from Settings and published by pages.yml', files.includes('privacy.html') && /privacy\.html/.test(html) && /privacy\.html/.test(pages));
['index.html', 'privacy.html', 'manifest.webmanifest', 'sw.js', 'logo.svg', 'icon-192.png', 'icon-512.png', 'icon-maskable-512.png'].forEach(f => ok('published file exists: ' + f, fs.existsSync(path.join(ROOT, f))));
process.exit(fails ? 1 : 0);
