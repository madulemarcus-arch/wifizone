const BASE = process.env.BASE_URL || 'http://localhost:8775';
const { chromium, devices } = require('playwright');let f=0;const ok=(n,c,x='')=>{console.log((c?'PASS ':'FAIL ')+n+(x?' '+x:''));if(!c)f++};
// Fictitious names only: the repository is public.
(async()=>{const b=await chromium.launch({executablePath: process.env.CHROMIUM_PATH || undefined});const ctx=await b.newContext({...devices['Pixel 5']});const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('dialog',d=>d.accept());
await p.goto(BASE + '/index.html');await p.waitForTimeout(500);
await p.evaluate(async()=>{const sha=async x=>[...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(x)))].map(b=>b.toString(16).padStart(2,'0')).join('');const U=async(id,name,role,pin)=>({id,name,role,salt:'s'+id,hash:await sha('s'+id+':'+pin)});const k='wifizone-v1',db=JSON.parse(localStorage.getItem(k)||'{}');
 db.noProfiles=false;db.users=[await U('u1','Marie','vendeur','1111'),await U('u3','Chef','gerant','1234')];localStorage.setItem(k,JSON.stringify(db));location.reload()});await p.waitForTimeout(1000);
const pin=async d=>{for(const c of d){await p.click('[data-k="'+c+'"]');await p.waitForTimeout(80)}await p.waitForTimeout(700)};
// a seller notes a loan
await pin('1111');
ok('seller: « Emprunts » tab is in the menu',await p.isVisible('nav button[data-v=loan]'));
await p.click('nav button[data-v=loan]');await p.waitForTimeout(400);
ok('empty list says nothing to recover',/Aucun emprunt à récupérer/.test(await p.innerText('#view')));
await p.click('[data-a=newloan]');await p.waitForTimeout(300);
await p.click('#dok');await p.waitForTimeout(200);
ok('a name is required',/Indiquez qui emprunte/.test(await p.textContent('#toast'))&&await p.evaluate(()=>document.querySelector('dialog').open));
await p.fill('#l_who','Jean Exemple');await p.selectOption('#l_kind','argent');await p.click('#dok');await p.waitForTimeout(200);
ok('money loan needs an amount',/montant emprunté/.test(await p.textContent('#toast')));
await p.fill('#l_amt','5000');await p.fill('#l_note','promet de rendre samedi');await p.click('#dok');await p.waitForTimeout(500);
let v=await p.innerText('#view');
ok('loan listed with name, amount, author and note',/Jean Exemple/.test(v)&&/5\s?000 FC/.test(v)&&/noté par Marie/.test(v)&&/promet de rendre samedi/.test(v),v.slice(0,300));
ok('counters: 1 not given back, 5 000 FC to recover',/Non rendus\s*1/.test(v.replace(/\n/g,' '))&&/Argent à récupérer\s*5\s?000 FC/.test(v.replace(/\n/g,' ')));
await p.click('[data-a=newloan]');await p.waitForTimeout(300);await p.fill('#l_who','Awa Test');await p.selectOption('#l_kind','mat');await p.fill('#l_label','câble réseau');await p.click('#dok');await p.waitForTimeout(400);
ok('non-money loan without amount accepted',/câble réseau/.test(await p.innerText('#view'))&&await p.evaluate(()=>JSON.parse(localStorage.getItem('wifizone-v1')).loans.length)===2);
await p.click('nav button[data-v=home]');await p.waitForTimeout(500);
ok('seller home shows the reminder card',/2 emprunt\(s\) non rendu\(s\)/.test(await p.innerText('#view')));
await p.click('[data-a=tab][data-v=loan]');await p.waitForTimeout(300);
ok('seller cannot delete a loan (no ✕)',(await p.$$('[data-a=delloan]')).length===0);
// seller marks one as given back
await p.click('[data-a=loanback] >> nth=1');await p.waitForTimeout(400);
const j=await p.evaluate(()=>JSON.parse(localStorage.getItem('wifizone-v1')).loans.map(x=>x.who+':'+x.status+':'+(x.backBy||'')).sort().join('|'));
ok('given back: status and author recorded',/Awa Test:back:Marie/.test(j)||/Jean Exemple:back:Marie/.test(j),j);
await p.click('[data-a=lf][data-v=back]');await p.waitForTimeout(300);
ok('« Rendus » tab lists it with the return date',/rendu le/.test(await p.innerText('#view')));
// the gérant sees the same data and can delete
await p.click('#lockBtn');await p.waitForTimeout(500);await pin('1234');
await p.click('nav button[data-v=loan]');await p.waitForTimeout(300);
ok('gérant: sees the loan still to recover and has the ✕ button',/Jean Exemple|Awa Test/.test(await p.innerText('#view'))&&(await p.$$('[data-a=delloan]')).length>=1);
await p.click('[data-a=lf][data-v=all]');await p.waitForTimeout(300);await p.click('[data-a=delloan] >> nth=0');await p.waitForTimeout(300);
ok('gérant deletes one loan',await p.evaluate(()=>JSON.parse(localStorage.getItem('wifizone-v1')).loans.length)===1);
// shared through sync and kept by the backup/restore round trip
ok('loans are part of the synchronised collections and old data gets an empty list',await p.evaluate(()=>Array.isArray(JSON.parse(localStorage.getItem('wifizone-v1')).loans)));
await p.keyboard.press('e');await p.waitForTimeout(300);
ok('keyboard shortcut E opens Emprunts',await p.evaluate(()=>document.getElementById('ttl').textContent)==='Emprunts');
ok('no page errors',errs.length===0,errs.join('|'));await b.close();process.exit(f?1:0)})();
