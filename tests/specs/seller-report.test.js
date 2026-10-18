const BASE = process.env.BASE_URL || 'http://localhost:8775';
const { chromium, devices } = require('playwright');let f=0;const ok=(n,c,x='')=>{console.log((c?'PASS ':'FAIL ')+n+(x?' '+x:''));if(!c)f++};
(async()=>{const b=await chromium.launch({executablePath: process.env.CHROMIUM_PATH || undefined});const ctx=await b.newContext({...devices['Pixel 5'],acceptDownloads:true});const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto(BASE + '/index.html');await p.waitForTimeout(500);
await p.evaluate(async()=>{const sha=async x=>[...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(x)))].map(b=>b.toString(16).padStart(2,'0')).join('');const U=async(id,name,role,pin)=>({id,name,role,salt:'s'+id,hash:await sha('s'+id+':'+pin)});const k='wifizone-v1',db=JSON.parse(localStorage.getItem(k)||'{}'),t=new Date().toISOString().slice(0,10),old=new Date(Date.now()-40*864e5).toISOString().slice(0,10);
 db.noProfiles=false;db.users=[await U('u1','Marie','vendeur','1111'),await U('u2','Paul','vendeur','2222'),await U('u3','Chef','gerant','1234')];
 const S=(id,date,fid,qty,amount,mode,by,paper)=>({id,ts:Date.now()-qty*1000,date,fid,qty,amount,mode,ref:'',codes:[],by,paper:!!paper});
 db.sales=[S('s1',t,'J',3,3000,'Cash','Marie'),S('s2',t,'V',2,1000,'M-Pesa','Marie'),S('s3',t,'M',1,30000,'Cash','Chef'),S('s4',t,'J',1,1000,'Cash','',true),S('s5',old,'S',4,28000,'Cash','Paul')];
 localStorage.setItem(k,JSON.stringify(db));location.reload()});await p.waitForTimeout(1000);
const pin=async d=>{for(const c of d){await p.click('[data-k="'+c+'"]');await p.waitForTimeout(80)}await p.waitForTimeout(700)};
await pin('1234');
// reach it from the monthly report
await p.click('nav button[data-v=rep]');await p.waitForTimeout(400);
ok('Rapport has a "Rapport par vendeur" button',await p.isVisible('[data-a=tab][data-v=vend]'));
await p.click('[data-a=tab][data-v=vend]');await p.waitForTimeout(1800);
ok('Rapport tab stays highlighted',await p.evaluate(()=>document.querySelector('nav button.on').dataset.v==='rep'));
let r=await p.evaluate(()=>({txt:document.getElementById('view').innerText,cards:[...document.querySelectorAll('.vcard')].map(c=>c.innerText.replace(/\s+/g,' '))}));
ok('month total = 35 000 FC and 7 tickets',/35\s?000 FC/.test(r.txt)&&/7 ticket/.test(r.txt),r.txt.slice(0,200));
ok('ranked by amount: Chef, Marie, then Sans vendeur',/Chef/.test(r.cards[0])&&/Marie/.test(r.cards[1])&&/Sans vendeur/.test(r.cards[2]),r.cards.map(c=>c.slice(0,25)).join(' | '));
ok('Chef: 30 000 FC, 86 %',/30\s?000 FC/.test(r.cards[0])&&/86 %/.test(r.cards[0]),r.cards[0]);
ok('Marie: 4 000 FC, 5 tickets, forfaits and modes detailed',/4\s?000 FC/.test(r.cards[1])&&/5 ticket/.test(r.cards[1])&&/Jour × 3/.test(r.cards[1])&&/M-Pesa/.test(r.cards[1]),r.cards[1]);
ok('sale without seller grouped under "Sans vendeur" with paper count',/1\s?000 FC/.test(r.cards[2])&&/1 papier/.test(r.cards[2]),r.cards[2]);
ok('seller without sale on the period still listed (0)',r.cards.some(c=>/Paul/.test(c)&&/Aucune vente/.test(c)),r.cards.join(' || '));
// periods
await p.click('[data-a=vper][data-v=all]');await p.waitForTimeout(1800);
r=await p.evaluate(()=>({txt:document.getElementById('view').innerText,cards:[...document.querySelectorAll('.vcard')].map(c=>c.innerText.replace(/\s+/g,' '))}));
ok('all time includes the 40-day-old sale (63 000 FC, Paul 28 000)',/63\s?000 FC/.test(r.txt)&&r.cards.some(c=>/Paul/.test(c)&&/28\s?000 FC/.test(c)),r.txt.slice(0,160));
await p.click('[data-a=vper][data-v=day]');await p.waitForTimeout(1800);
ok('today: same as month here (35 000 FC)',/35\s?000 FC/.test(await p.innerText('#view')));
// exports
const [dl]=await Promise.all([p.waitForEvent('download',{timeout:15000}),p.click('[data-a=vcsv]')]);
const csv=require('fs').readFileSync(await dl.path(),'utf8');
ok('CSV: header, one line per seller, forfait columns',/"Vendeur";"Ventes";"Tickets";"Montant FC";"Part %";"Visiteur \(tickets\)"/.test(csv)&&/"Chef";"1";"1";"30000";"86"/.test(csv)&&/"Marie";"2";"5";"4000";"11"/.test(csv),csv.split('\n').slice(0,3).join(' / '));
await p.evaluate(()=>{window.__u=null;window.open=u=>{window.__u=u}});await p.click('[data-a=vwa]');
const wa=decodeURIComponent(await p.evaluate(()=>window.__u));
ok('WhatsApp text lists the ranking',/Ventes par vendeur/.test(wa)&&/🥇 Chef/.test(wa)&&/🥈 Marie/.test(wa),wa.slice(0,160));
// a seller profile cannot open the report
await p.click('#lockBtn');await p.waitForTimeout(500);await pin('1111');
ok('seller profile: no Rapport tab',(await p.$$('nav button[data-v=rep]')).length===0);
await p.evaluate(()=>{history.replaceState(null,'','?go=vend')});
ok('no page errors',errs.length===0,errs.join('|'));await b.close();process.exit(f?1:0)})();
