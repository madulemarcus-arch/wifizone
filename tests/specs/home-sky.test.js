const BASE = process.env.BASE_URL || 'http://localhost:8775';
const { chromium, devices } = require('playwright');let f=0;const ok=(n,c,x='')=>{console.log((c?'PASS ':'FAIL ')+n+(x?' '+x:''));if(!c)f++};
(async()=>{const b=await chromium.launch({executablePath: process.env.CHROMIUM_PATH || undefined});const ctx=await b.newContext({...devices['Pixel 5']});const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto(BASE + '/index.html');await p.waitForTimeout(500);
await p.evaluate(()=>{const k='wifizone-v1';const db=JSON.parse(localStorage.getItem(k)||'{}');db.noProfiles=true;localStorage.setItem(k,JSON.stringify(db));location.reload()});await p.waitForTimeout(1200);
const pix=async sel=>p.evaluate(sel=>{const c=document.querySelector(sel);if(!c)return -1;const d=c.getContext('2d').getImageData(0,0,c.width,c.height).data;let n=0;for(let i=3;i<d.length;i+=4)if(d[i]>8)n++;return n},sel);
ok('home: page sky and hero sky exist and are visible',await p.evaluate(()=>{const s=document.getElementById('sky'),h=document.querySelector('#view .hero .hsky');return !!s&&!s.hidden&&!!h&&document.querySelector('#view .hero').classList.contains('hanim')}));
await p.waitForTimeout(1200);
ok('hero canvas is drawing (non-transparent pixels)',await pix('.hero .hsky')>200,String(await pix('.hero .hsky')));
ok('page canvas is drawing',await pix('#sky')>200);
ok('canvases do not capture clicks',await p.evaluate(()=>getComputedStyle(document.getElementById('sky')).pointerEvents==='none'&&getComputedStyle(document.querySelector('.hsky')).pointerEvents==='none'));
// other screens: animation stops
await p.click('nav button[data-v=sell]');await p.waitForTimeout(500);
ok('other screen: page sky hidden, no hero sky',await p.evaluate(()=>document.getElementById('sky').hidden&&!document.querySelector('.hsky')));
await p.click('nav button[data-v=home]');await p.waitForTimeout(800);
ok('back on home: animation restarts',await p.evaluate(()=>!document.getElementById('sky').hidden&&!!document.querySelector('#view .hero .hsky')));
// setting off / intensity, per device
await p.click('nav button[data-v=set]');await p.waitForTimeout(400);
ok('Réglages: animation choices shown',await p.isVisible('[data-a=anim][data-v=off]')&&await p.isVisible('[data-a=anim][data-v=intense]'));
await p.click('[data-a=anim][data-v=off]');await p.waitForTimeout(300);
ok('off is remembered on this device',await p.evaluate(()=>localStorage.getItem('wifizone-anim')==='off'));
await p.click('nav button[data-v=home]');await p.waitForTimeout(600);
ok('off: no animation on home',await p.evaluate(()=>(document.getElementById('sky')||{hidden:true}).hidden&&!document.querySelector('.hsky')&&!document.querySelector('.hero.hanim')));
await p.click('nav button[data-v=set]');await p.waitForTimeout(300);await p.click('[data-a=anim][data-v=intense]');await p.click('nav button[data-v=home]');await p.waitForTimeout(800);
ok('intense: animation back',await p.evaluate(()=>!document.getElementById('sky').hidden&&!!document.querySelector('.hsky'))&&await p.evaluate(()=>getComputedStyle(document.querySelector('.hero')).getPropertyValue('--tempo').trim()==='1.35'));
// reduced motion: nothing runs
const p2=await (await b.newContext({...devices['Pixel 5'],reducedMotion:'reduce'})).newPage();await p2.goto(BASE + '/index.html');await p2.waitForTimeout(500);
await p2.evaluate(()=>{const k='wifizone-v1';const db=JSON.parse(localStorage.getItem(k)||'{}');db.noProfiles=true;localStorage.setItem(k,JSON.stringify(db));location.reload()});await p2.waitForTimeout(1000);
ok('reduced motion: no animation',await p2.evaluate(()=>!document.querySelector('.hsky')&&!document.querySelector('.hero.hanim')));
ok('hero text stays readable above the canvas',await p.evaluate(()=>{const n=document.querySelector('.hero-num');return getComputedStyle(n).position==='relative'&&+getComputedStyle(n).zIndex>+getComputedStyle(document.querySelector('.hsky')).zIndex}));
ok('no page errors',errs.length===0,errs.join('|'));await b.close();process.exit(f?1:0)})();
