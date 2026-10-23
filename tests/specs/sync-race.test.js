const BASE = process.env.BASE_URL || 'http://localhost:8775';
const { chromium, devices } = require('playwright');let f=0;const ok=(n,c,x='')=>{console.log((c?'PASS ':'FAIL ')+n+(x?' '+x:''));if(!c)f++};
// Two phones (a seller and the administrator) talk to a fake Supabase server kept in memory. Fictitious data only.
(async()=>{const b=await chromium.launch({executablePath: process.env.CHROMIUM_PATH || undefined});const errs=[];
const srv={ws:null};
const mock=delay=>async route=>{const fn=route.request().url().split('/rpc/')[1];let q={};try{q=JSON.parse(route.request().postData()||'{}')}catch(e){}
  const J=o=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(o)});
  if(fn==='cispol_head')return J(srv.ws?{exists:true,version:srv.ws.version}:{exists:false});
  if(fn==='cispol_pull')return J({exists:true,version:srv.ws.version,blob:srv.ws.blob});
  if(fn==='cispol_push'){await new Promise(r=>setTimeout(r,delay));
    if(!srv.ws){srv.ws={version:1,blob:q.p_blob};return J({ok:true,version:1})}
    if(srv.ws.version!==q.p_base)return J({ok:false,version:srv.ws.version});
    srv.ws={version:srv.ws.version+1,blob:q.p_blob};return J({ok:true,version:srv.ws.version})}
  route.fulfill({status:404,body:'{}'})};
const phone=async(name,delay)=>{const c=await b.newContext({...devices['Pixel 5']});await c.route('**/rest/v1/rpc/**',mock(delay));const p=await c.newPage();p.on('pageerror',e=>errs.push(name+': '+e.message));
  await p.goto(BASE + '/index.html');await p.waitForTimeout(400);
  await p.evaluate(()=>{const k='wifizone-v1',db=JSON.parse(localStorage.getItem(k)||'{}');db.noProfiles=true;db.tickets=[1,2,3,4].map(i=>({id:'TK'+i,code:'TK'+i,ts:Date.now()+i,fid:'J',lot:'L1',status:'stock'}));db.lots=[{id:'L1',ts:Date.now(),fid:'J',n:4,dest:'app'}];localStorage.setItem(k,JSON.stringify(db));location.reload()});await p.waitForTimeout(700);return p};
const sell=async p=>{await p.evaluate(()=>document.querySelector('nav button[data-v=sell]').click());await p.waitForTimeout(250);await p.evaluate(()=>{const x=document.querySelector('[data-a=fid]');if(x)x.click()});await p.waitForTimeout(150);await p.evaluate(()=>document.querySelector('[data-a=sell]').click());await p.waitForTimeout(250)};
const sales=p=>p.evaluate(()=>(JSON.parse(localStorage.getItem('wifizone-v1')||'{}').sales||[]).length);
const connect=p=>p.evaluate(()=>window.__sync.connect({url:'https://mock.test',anon:'x',ws:'espace',pass:'motdepasse123'}));
const A=await phone('seller',1500),B=await phone('admin',0);await connect(A);await connect(B);
// 1. a sale saved while a synchronisation is running must still reach the other phone
await sell(A);
await A.evaluate(()=>{window.__p=window.__sync.now()});await A.waitForTimeout(400);await sell(A);await A.evaluate(()=>window.__p);
await A.waitForTimeout(6000);await B.evaluate(()=>window.__sync.now());await B.waitForTimeout(500);
ok('sale made DURING a synchronisation: the administrator sees both sales (2/2)',await sales(A)===2&&await sales(B)===2,'seller '+await sales(A)+', admin '+await sales(B));
// 2. three quick sales in a row on the seller phone
await sell(A);await sell(A);
await A.waitForTimeout(9000);await B.evaluate(()=>window.__sync.now());await B.waitForTimeout(500);
ok('three more quick sales: the administrator sees all of them (4 in total)',await sales(B)===4,'admin '+await sales(B));
// 3. both phones sell at the same moment: nothing is lost on either side
await Promise.all([sell(A),sell(B)]);
await A.waitForTimeout(9000);await B.evaluate(()=>window.__sync.now());await A.evaluate(()=>window.__sync.now());await B.waitForTimeout(800);await A.waitForTimeout(800);
ok('both phones sell at the same time: both have the 2 new sales (6 in total)',await sales(A)===6&&await sales(B)===6,'seller '+await sales(A)+', admin '+await sales(B));
// 4. sold tickets are shared: no code is shown as unused on one phone and sold on the other
const sold=p=>p.evaluate(()=>JSON.parse(localStorage.getItem('wifizone-v1')).tickets.filter(t=>t.status==='sold').length);
ok('tickets: the same number of sold tickets on both phones',await sold(A)===await sold(B),'seller '+await sold(A)+', admin '+await sold(B));
ok('no page errors',errs.length===0,errs.join('|'));await b.close();process.exit(f?1:0)})();
