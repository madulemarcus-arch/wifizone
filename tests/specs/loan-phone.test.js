const BASE = process.env.BASE_URL || 'http://localhost:8775';
const { chromium, devices } = require('playwright');let f=0;const ok=(n,c,x='')=>{console.log((c?'PASS ':'FAIL ')+n+(x?' '+x:''));if(!c)f++};
// Fictitious data only: the repository is public.
(async()=>{const b=await chromium.launch({executablePath: process.env.CHROMIUM_PATH || undefined});const ctx=await b.newContext({...devices['Pixel 5']});const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto(BASE + '/index.html');await p.waitForTimeout(500);
await p.evaluate(()=>{const k='wifizone-v1',db=JSON.parse(localStorage.getItem(k)||'{}'),t=new Date().toISOString().slice(0,10);db.noProfiles=true;
 db.loans=[{id:'l0',ts:1,date:t,who:'Ir paul',kind:'argent',amount:56500,cur:'CDF',rate:2400,by:'Ciceron paul Madule',status:'open',pays:[{id:'a',date:t,amount:10000,by:'Ciceron'}]}];
 localStorage.setItem(k,JSON.stringify(db));location.reload()});await p.waitForTimeout(900);
await p.click('nav button[data-v=loan]');await p.waitForTimeout(500);
const m=await p.evaluate(()=>{const r=document.querySelector('.loanrow'),g=r.querySelector('.g'),d=r.querySelector(':scope > small'),w=e=>Math.round(e.getBoundingClientRect().width),btn=[...r.querySelectorAll('.lb .btn')].map(w);return{row:w(r),name:w(g),det:w(d),btn,h:Math.round(r.getBoundingClientRect().height)}});
ok('the details line uses the whole width of the card (no column of single letters)',m.det>=m.row-4,JSON.stringify(m));
ok('the name is not squeezed',m.name>=100,JSON.stringify(m));
ok('the row stays compact (under 260 px high with its history)',m.h<260,JSON.stringify(m));
ok('the action buttons are wide enough to read',m.btn.every(x=>x>=120),JSON.stringify(m));
const nav=await p.evaluate(()=>[...document.querySelectorAll('nav button[data-v]')].map(e=>{const n=[...e.childNodes].filter(c=>c.nodeType===3&&c.textContent.trim()).pop(),r=document.createRange();r.selectNodeContents(n);return{t:n.textContent.trim(),over:r.getBoundingClientRect().width>e.getBoundingClientRect().width-2}}));
ok('the eight tabs of the bottom bar fit without their labels running into each other',nav.length===8&&nav.every(x=>!x.over),JSON.stringify(nav.filter(x=>x.over)));
ok('no page errors',errs.length===0,errs.join('|'));await b.close();process.exit(f?1:0)})();
