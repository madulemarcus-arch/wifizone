const BASE = process.env.BASE_URL || 'http://localhost:8775';
const { chromium, devices } = require('playwright');let f=0;const ok=(n,c,x='')=>{console.log((c?'PASS ':'FAIL ')+n+(x?' '+x:''));if(!c)f++};
// Fictitious data only: the repository is public.
(async()=>{const b=await chromium.launch({executablePath: process.env.CHROMIUM_PATH || undefined});const ctx=await b.newContext({...devices['Pixel 5']});const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('dialog',d=>d.accept());
await p.goto(BASE + '/index.html');await p.waitForTimeout(500);
const seed=loans=>p.evaluate(l=>{const k='wifizone-v1',db=JSON.parse(localStorage.getItem(k)||'{}'),t=new Date().toISOString().slice(0,10);db.noProfiles=true;
 db.sales=[{id:'s1',ts:Date.now(),date:t,fid:'J',qty:10,amount:10000,mode:'Cash',ref:'',codes:[],by:''}];
 db.expenses=[{id:'e1',ts:Date.now(),date:t,label:'Carburant',cat:'Autre',amount:2000,cur:'CDF',rate:2400,mode:'Cash'}];
 db.loans=l.map((x,i)=>({id:'l'+i,ts:Date.now()+i,date:x.back?new Date(Date.now()-864e5).toISOString().slice(0,10):t,who:x.who,kind:'argent',label:'',amount:x.amount,cur:x.cur||'CDF',rate:2400,by:'',status:x.back?'back':'open',backDate:x.back?t:undefined}));
 localStorage.setItem(k,JSON.stringify(db));location.reload()},loans);
const day=async()=>{await p.waitForTimeout(900);await p.click('nav button[data-v=day]');await p.waitForTimeout(500);return (await p.innerText('#view')).replace(/\s+/g,' ')};
await seed([]);let v=await day();
ok('no loan: cash expected 8 000 FC, no loan line',/Cash attendu 8\s?000 FC/.test(v)&&!/Argent pris à la caisse/.test(v)&&!/total prévu/.test(v),v.slice(0,300));
await seed([{who:'Jean Exemple',amount:3000},{who:'Awa Test',amount:1000,back:true}]);v=await day();
ok('cash expected = 8 000 − 3 000 + 1 000 = 6 000 FC, with the planned total in brackets',/Cash attendu[^0-9]*6\s?000 FC \(total prévu 8\s?000 FC\)/.test(v),v.slice(0,400));
ok('money taken and money given back are listed with the names',/Argent pris à la caisse \(emprunts\)[^−]*Jean Exemple[^−]*− 3\s?000 FC/.test(v)&&/Argent rendu aujourd'hui[^+]*Awa Test[^+]*\+ 1\s?000 FC/.test(v),v.slice(0,500));
await p.fill('#ccount','6000');await p.click('[data-a=close]');await p.waitForTimeout(500);
ok('counting the remaining 6 000 FC closes with no gap',await p.evaluate(()=>{const c=JSON.parse(localStorage.getItem('wifizone-v1')).closings[0];return c.expected===6000&&c.diff===0}));
const txt=await p.evaluate(()=>{const x=document.querySelector('[data-a=dwa]');return !!x});
await p.evaluate(()=>{window.__u=null;window.open=u=>{window.__u=u}});
if(txt){await p.click('[data-a=dwa]');const wa=decodeURIComponent(await p.evaluate(()=>window.__u));ok('WhatsApp summary mentions the planned total and the loan',/total prévu 8\s?000 FC/.test(wa)&&/Jean Exemple/.test(wa),wa.slice(0,300))}
await seed([{who:'Marc Dollar',amount:20,cur:'USD'}]);v=await day();
ok('a loan in dollars is taken from the dollar cash',/− 20 \$/.test(v),v.slice(0,400));
ok('no page errors',errs.length===0,errs.join('|'));await b.close();process.exit(f?1:0)})();
