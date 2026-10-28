const BASE = process.env.BASE_URL || 'http://localhost:8775';
const { chromium, devices } = require('playwright');let f=0;const ok=(n,c,x='')=>{console.log((c?'PASS ':'FAIL ')+n+(x?' '+x:''));if(!c)f++};
// Summary of two sites: each site is its own encrypted workspace on a fake Supabase server kept in memory; site 1 only READS site 2. Fictitious data only.
(async()=>{const b=await chromium.launch({executablePath: process.env.CHROMIUM_PATH || undefined});const errs=[];
const srv={};let pushes={};
const mock=async route=>{const fn=route.request().url().split('/rpc/')[1];let q={};try{q=JSON.parse(route.request().postData()||'{}')}catch(e){}
  const J=o=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(o)}),w=srv[q.p_ws];
  if(w&&w.token!==q.p_token)return route.fulfill({status:400,contentType:'application/json',body:JSON.stringify({message:'forbidden'})});
  if(fn==='cispol_head')return J(w?{exists:true,version:w.version}:{exists:false});
  if(fn==='cispol_pull')return J({exists:true,version:w.version,blob:w.blob});
  if(fn==='cispol_push'){pushes[q.p_ws]=(pushes[q.p_ws]||0)+1;if(!w){srv[q.p_ws]={token:q.p_token,version:1,blob:q.p_blob};return J({ok:true,version:1})}
    if(w.version!==q.p_base)return J({ok:false,version:w.version});srv[q.p_ws]={token:w.token,version:w.version+1,blob:q.p_blob};return J({ok:true,version:srv[q.p_ws].version})}
  route.fulfill({status:404,body:'{}'})};
const phone=async(name,title,sales,exp)=>{const c=await b.newContext({...devices['Pixel 5']});await c.route('**/rest/v1/rpc/**',mock);const p=await c.newPage();p.on('pageerror',e=>errs.push(name+': '+e.message));
  await p.goto(BASE + '/index.html');await p.waitForTimeout(400);
  await p.evaluate(([title,sales,exp])=>{const k='wifizone-v1',db=JSON.parse(localStorage.getItem(k)||'{}'),t=new Date(),d=t.getFullYear()+'-'+String(t.getMonth()+1).padStart(2,'0')+'-'+String(t.getDate()).padStart(2,'0');
    db.noProfiles=true;db.name=title;db.rate=2000;db.sales=sales.map((a,i)=>({id:'s'+i,ts:Date.now()+i,date:d,fid:'J',qty:1,amount:a,mode:'Cash',note:'',by:''}));
    db.expenses=exp.map((a,i)=>({id:'e'+i,ts:Date.now()+i,date:d,cat:'Salaire',amount:a,cur:'CDF',mode:'Cash',note:''}));db.loans=[];localStorage.setItem(k,JSON.stringify(db))},[title,sales,exp]);
  await p.reload();await p.waitForTimeout(500);return p};
const A=await phone('site1','Site Un',[1000,2000],[500]),B=await phone('site2','Site Deux',[5000,3000,2000],[1500]);
await A.evaluate(()=>window.__sync.connect({url:'https://mock.test',anon:'x',ws:'site-un',pass:'phrase-un-123'}));
await B.evaluate(()=>window.__sync.connect({url:'https://mock.test',anon:'x',ws:'site-deux',pass:'phrase-deux-123'}));
// before linking
await A.evaluate(()=>{document.querySelector('nav button[data-v=set]').click()});await A.waitForTimeout(300);
await A.evaluate(()=>document.querySelector('[data-a=tab][data-v=sites]').click());await A.waitForTimeout(300);
ok('not linked yet: explanation and « Relier l\'autre site »',/Relier l'autre site/.test(await A.innerText('#view'))&&/lit seulement/.test(await A.innerText('#view')));
// wrong things are refused
const tryC=(ws,pass)=>A.evaluate(([ws,pass])=>window.__sites.connect({ws,pass}).then(()=>'ok',e=>e.message),[ws,pass]);
ok('the own workspace is refused',/de ce site/.test(await tryC('site-un','phrase-un-123')));
ok('a short passphrase is refused',/8 caractères/.test(await tryC('site-deux','court')));
ok('an unknown workspace is refused (nothing is created on the server)',/Aucun espace/.test(await tryC('site-inconnu','phrase-xyz-123'))&&!srv['site-inconnu']);
ok('a wrong passphrase is refused',/incorrecte/.test(await tryC('site-deux','mauvaise-phrase-1')));
const p0=pushes['site-deux'];
ok('link site 2 with the right passphrase',await tryC('site-deux','phrase-deux-123')==='ok');
await A.waitForTimeout(500);await A.evaluate(()=>document.querySelector('nav button[data-v=set]').click());await A.waitForTimeout(200);await A.evaluate(()=>document.querySelector('[data-a=tab][data-v=sites]').click());await A.waitForTimeout(1800);
const t=await A.innerText('#view');
ok('both sites are shown by name',/Site Un/.test(t)&&/Site Deux/.test(t),t.slice(0,200));
ok('total of the two sites: 13 000 FC sold (3 000 + 10 000), 5 tickets, expenses 2 000, profit 11 000',/13\s?000/.test(t)&&/5 ticket/.test(t)&&/2\s?000/.test(t)&&/11\s?000/.test(t),t.replace(/\n/g,' | ').slice(0,500));
ok('site 1 alone: 3 000 FC and site 2 alone: 10 000 FC',/3\s?000 FC/.test(t)&&/10\s?000 FC/.test(t));
ok('READ ONLY: nothing was sent to the other site',pushes['site-deux']===p0,String(pushes['site-deux'])+' vs '+p0);
// the other site changes: refresh sees it, period chips work
await B.evaluate(()=>{const db=JSON.parse(localStorage.getItem('wifizone-v1'));db.sales.push({id:'sx',ts:Date.now()+99,date:db.sales[0].date,fid:'J',qty:1,amount:4000,mode:'Cash',note:'',by:''});localStorage.setItem('wifizone-v1',JSON.stringify(db))});
await B.reload();await B.waitForTimeout(500);await B.evaluate(()=>window.__sync.now());
await A.evaluate(()=>document.querySelector('[data-a=siterefresh]').click());await A.waitForTimeout(2200);
ok('« Actualiser » picks up the new sale of the other site (17 000 FC in total)',/17\s?000/.test(await A.innerText('#view')));
await A.evaluate(()=>document.querySelector('[data-a=mper][data-v=month]').click());await A.waitForTimeout(1800);
ok('period « Ce mois » works',/Ce mois/.test(await A.innerText('#view'))&&/17\s?000/.test(await A.innerText('#view')));
// the link survives a reload and can be removed
await A.reload();await A.waitForTimeout(500);await A.evaluate(()=>{window.__x=1});
ok('the link is kept after a reload',await A.evaluate(()=>!!localStorage.getItem('wifizone-site2')));
await A.evaluate(()=>{window.confirm=()=>true;document.querySelector('nav button[data-v=set]').click()});await A.waitForTimeout(300);await A.evaluate(()=>document.querySelector('[data-a=tab][data-v=sites]').click());await A.waitForTimeout(500);
await A.evaluate(()=>document.querySelector('[data-a=sitesoff]').click());await A.waitForTimeout(400);
ok('removing the other site: link gone, own data untouched',await A.evaluate(()=>!localStorage.getItem('wifizone-site2')&&JSON.parse(localStorage.getItem('wifizone-v1')).sales.length===2)&&/Relier l'autre site/.test(await A.innerText('#view')));
ok('no page errors',errs.length===0,errs.join('|'));await b.close();process.exit(f?1:0)})();
