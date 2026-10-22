const BASE = process.env.BASE_URL || 'http://localhost:8775';
const { chromium, devices } = require('playwright');let f=0;const ok=(n,c,x='')=>{console.log((c?'PASS ':'FAIL ')+n+(x?' '+x:''));if(!c)f++};
// Fictitious data only: the repository is public.
(async()=>{const b=await chromium.launch({executablePath: process.env.CHROMIUM_PATH || undefined});const ctx=await b.newContext({...devices['Pixel 5']});const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('dialog',d=>d.accept());
await p.goto(BASE + '/index.html');await p.waitForTimeout(500);
await p.evaluate(async()=>{const sha=async x=>[...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(x)))].map(b=>b.toString(16).padStart(2,'0')).join('');const U=async(id,name,role,pin)=>({id,name,role,salt:'s'+id,hash:await sha('s'+id+':'+pin)});const k='wifizone-v1',db=JSON.parse(localStorage.getItem(k)||'{}'),t=new Date().toISOString().slice(0,10);
 db.noProfiles=false;db.users=[await U('u1','Marie','vendeur','1111'),await U('u3','Chef','gerant','1234')];
 db.sales=[{id:'s1',ts:Date.now(),date:t,fid:'M',qty:1,amount:77000,mode:'Cash',ref:'',codes:[],by:''}];
 db.loans=[{id:'l0',ts:Date.now(),date:t,who:'Jean Exemple',kind:'argent',label:'',amount:25000,cur:'CDF',rate:2400,by:'Chef',status:'open'},
  {id:'l1',ts:Date.now()+1,date:t,who:'Awa Test',kind:'mat',label:'câble réseau',amount:0,cur:'CDF',rate:2400,by:'Chef',status:'open'}];
 localStorage.setItem(k,JSON.stringify(db));location.reload()});await p.waitForTimeout(1000);
const pin=async d=>{for(const c of d){await p.click('[data-k="'+c+'"]');await p.waitForTimeout(80)}await p.waitForTimeout(700)};
await pin('1111');await p.click('nav button[data-v=loan]');await p.waitForTimeout(400);
let v=(await p.innerText('#view')).replace(/\s+/g,' ');
ok('money loan has « + Remboursement », the material loan has not',(await p.$$('[data-a=loanpay]')).length===1&&/à rendre/.test(v));
await p.click('[data-a=loanpay]');await p.waitForTimeout(300);
ok('window shows borrowed, already given back and what is left',/Emprunté : 25\s?000 FC/.test((await p.innerText('dialog')).replace(/\s+/g,' '))&&/reste : 25\s?000 FC/.test((await p.innerText('dialog')).replace(/\s+/g,' ')));
await p.fill('#p_amt','30000');await p.click('#dok');await p.waitForTimeout(200);
ok('more than the rest is refused',/Plus que le reste/.test(await p.textContent('#toast'))&&await p.evaluate(()=>document.querySelector('dialog').open));
await p.fill('#p_amt','10000');await p.click('#dok');await p.waitForTimeout(500);
v=(await p.innerText('#view')).replace(/\s+/g,' ');
ok('after 10 000 FC: « Rendu : 10 000 FC sur 25 000 FC », 15 000 FC left, author recorded',/Rendu : 10\s?000 FC sur 25\s?000 FC/.test(v)&&/15\s?000 FC reste à rendre/.test(v)&&/\(Marie\)/.test(v),v.slice(0,400));
ok('the counter « Argent à récupérer » drops to 15 000 FC',/Argent à récupérer 15\s?000 FC/.test(v));
ok('the loan is still « non rendu » and offers « Tout rendu »',/Tout rendu/.test(v)&&await p.evaluate(()=>JSON.parse(localStorage.getItem('wifizone-v1')).loans[0].status==='open'));
// closing and monthly report count the 10 000 FC given back
await p.click('#lockBtn');await p.waitForTimeout(500);await pin('1234');
await p.click('nav button[data-v=day]');await p.waitForTimeout(500);
v=(await p.innerText('#view')).replace(/\s+/g,' ');
ok('closing: cash expected = 77 000 − 25 000 + 10 000 = 62 000 FC, given back 10 000 FC listed',/Cash attendu[^0-9]*62\s?000 FC \(total prévu 77\s?000 FC\)/.test(v)&&/Argent rendu aujourd'hui[^+]*\+ 10\s?000 FC/.test(v),v.slice(0,500));
await p.click('nav button[data-v=rep]');await p.waitForTimeout(1500);
v=(await p.innerText('#view')).replace(/\s+/g,' ');
ok('report: 77 000 FC − 25 000 FC emprunté + 10 000 FC rendu = 62 000 FC',/77\s?000 FC − 25\s?000 FC emprunté \+ 10\s?000 FC rendu = 62\s?000 FC/.test(v),v.slice(0,300));
// last payment closes the loan
await p.click('nav button[data-v=loan]');await p.waitForTimeout(300);await p.click('[data-a=loanpay]');await p.waitForTimeout(300);
ok('the amount proposed is the rest (15 000)',await p.inputValue('#p_amt')==='15000');
await p.click('#dok');await p.waitForTimeout(500);
ok('paying the rest closes the loan (« Rendu » filter, 25 000 FC in total)',await p.evaluate(()=>{const l=JSON.parse(localStorage.getItem('wifizone-v1')).loans[0];return l.status==='open'?false:l.pays.length===2&&l.pays.reduce((a,q)=>a+q.amount,0)===25000}));
// « Tout rendu » on a partly repaid loan adds the rest as a payment
await p.evaluate(()=>{const k='wifizone-v1',db=JSON.parse(localStorage.getItem(k));db.loans.push({id:'l2',ts:Date.now()+5,date:new Date().toISOString().slice(0,10),who:'Marc Dollar',kind:'argent',amount:20,cur:'USD',rate:2400,by:'Chef',status:'open',pays:[{id:'q',date:new Date().toISOString().slice(0,10),amount:5,by:'Chef'}]});localStorage.setItem(k,JSON.stringify(db));location.reload()});await p.waitForTimeout(1000);await pin('1234');
await p.click('nav button[data-v=loan]');await p.waitForTimeout(400);await p.click('[data-a=loanback]');await p.waitForTimeout(400);
ok('« Tout rendu » records the missing 15 $ as a last payment',await p.evaluate(()=>{const l=JSON.parse(localStorage.getItem('wifizone-v1')).loans.find(x=>x.id==='l2');return l.status==='back'&&l.pays.length===2&&l.pays[1].amount===15}));
ok('no page errors',errs.length===0,errs.join('|'));await b.close();process.exit(f?1:0)})();
