const BASE = process.env.BASE_URL || 'http://localhost:8775';
const { chromium, devices } = require('playwright');let f=0;const ok=(n,c,x='')=>{console.log((c?'PASS ':'FAIL ')+n+(x?' '+x:''));if(!c)f++};
(async()=>{const b=await chromium.launch({executablePath: process.env.CHROMIUM_PATH || undefined});const p=await (await b.newContext({...devices['Pixel 5']})).newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('dialog',d=>d.accept());
await p.goto(BASE + '/index.html');await p.waitForTimeout(500);
await p.evaluate(()=>{const k='wifizone-v1';const db=JSON.parse(localStorage.getItem(k)||'{}');const t=new Date();const iso=d=>d.toISOString().slice(0,10);db.noProfiles=true;db.sales=[{id:'o',ts:Date.now()-864e5,date:iso(new Date(t-864e5)),fid:'J',qty:1,amount:1000,mode:'Cash',ref:''}];localStorage.setItem(k,JSON.stringify(db));window.__v=0;location.reload()});
await p.waitForTimeout(900);
await p.evaluate(()=>{navigator.vibrate=()=>{window.__v=(window.__v||0)+1;return true}});
await p.click('nav button[data-v=sell]');await p.waitForTimeout(400);ok('today strip',await p.isVisible('.today'));ok('haptic on nav tap',await p.evaluate(()=>window.__v>=1));
await p.click('.fo button:nth-child(2)');await p.click('[data-a=qty][data-v="1"]');await p.click('[data-a=mode][data-v=M-Pesa]');
await p.click('[data-a=sell]');await p.waitForTimeout(250);
ok('sold check shown',await p.isVisible('.sold-ok'));
ok('new record -> confetti canvas (3 000 FC > best 1 000 FC)',await p.waitForSelector('#confetti',{timeout:2500}).then(()=>true,()=>false));
await p.waitForTimeout(2200);ok('confetti removed',!(await p.$('#confetti')));
const row=await p.innerText('.card .row');ok('sale row with letter dot + mode icon',/J/.test(row)&&/📱 M-Pesa/.test(row),row.replace(/\n/g,' | '));
await p.screenshot({path:'s2-sell.png'});
// second sale same day: no second confetti
await p.click('[data-a=sell]');await p.waitForTimeout(800);ok('no 2nd confetti same day',!(await p.$('#confetti')));
// reduced motion: no canvas
const p2=await (await b.newContext({...devices['Pixel 5'],reducedMotion:'reduce'})).newPage();await p2.goto(BASE + '/index.html');await p2.waitForTimeout(500);
await p2.evaluate(()=>{const k='wifizone-v1';const db=JSON.parse(localStorage.getItem(k)||'{}');db.noProfiles=true;localStorage.setItem(k,JSON.stringify(db));location.reload()});await p2.waitForTimeout(800);
await p2.click('nav button[data-v=sell]');await p2.click('.fo button');await p2.click('[data-a=sell]');await p2.waitForTimeout(300);ok('reduced motion: no check/confetti',!(await p2.$('.sold-ok'))&&!(await p2.$('#confetti')));
console.log(errs);await b.close();process.exit(f?1:0)})();
