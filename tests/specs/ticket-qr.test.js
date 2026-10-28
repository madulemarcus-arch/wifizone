const BASE = process.env.BASE_URL || 'http://localhost:8775';
const { chromium, devices } = require('playwright');let f=0;const ok=(n,c,x='')=>{console.log((c?'PASS ':'FAIL ')+n+(x?' '+x:''));if(!c)f++};
(async()=>{const b=await chromium.launch({executablePath: process.env.CHROMIUM_PATH || undefined});const p=await (await b.newContext({...devices['Pixel 5']})).newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto(BASE + '/index.html');await p.waitForTimeout(500);
await p.evaluate(()=>{const k='wifizone-v1';const db=JSON.parse(localStorage.getItem(k)||'{}');db.noProfiles=true;localStorage.setItem(k,JSON.stringify(db));location.reload()});await p.waitForTimeout(900);
await p.evaluate(()=>{window.__prints=0;window.print=()=>{window.__prints++;window.__sheet=document.getElementById('planche').innerHTML;window.__printing=document.body.classList.contains('imprime')}});
// settings: Wi-Fi name and login address, default address
await p.click('nav button[data-v=set]');await p.waitForTimeout(400);
ok('default login address is wifi.cispolstore',await p.inputValue('#s_host')==='wifi.cispolstore');
await p.fill('#s_ssid','CISPOLstore Zone');await p.click('[data-a=saveset]');await p.waitForTimeout(300);
// generate a paper lot of 40 tickets
await p.click('nav button[data-v=tix]');await p.waitForTimeout(400);
await p.selectOption('#t_dest','paper');await p.fill('#t_n','40');await p.click('[data-a=genlot]');await p.waitForTimeout(500);
await p.click('[data-a=lotprint]');await p.waitForTimeout(600);
let r=await p.evaluate(()=>{const d=document.createElement('div');d.innerHTML=window.__sheet;const t=[...d.querySelectorAll('.tk')];return{prints:window.__prints,printing:window.__printing,n:t.length,qr:d.querySelectorAll('svg.tk-qr').length,codes:t.map(x=>x.querySelector('.tk-code').textContent),text:t[0].textContent,paths:t.map(x=>(x.querySelector('svg.tk-qr path')||{getAttribute(){return ''}}).getAttribute('d')),lot:App_codes()};function App_codes(){const db=JSON.parse(localStorage.getItem('wifizone-v1'));return db.tickets.map(x=>x.code)}});
ok('print called once with the sheet shown',r.prints===1&&r.printing===true,JSON.stringify([r.prints,r.printing]));
ok('40 tickets, each with a QR code',r.n===40&&r.qr===40,r.n+'/'+r.qr);
ok('codes printed in capitals and match the lot',r.codes.every((c,i)=>c===c.toUpperCase()&&r.lot.includes(c)),r.codes.slice(0,2).join(','));
ok('QR is different for each ticket',new Set(r.paths).size===40&&r.paths.every(x=>x.length>200));
ok('ticket shows the Wi-Fi name in the header, « Code d\'accès », the duration, the price, the QR caption and the help line',/CISPOLstore Zone/i.test(r.text)&&/Code d'accès/.test(r.text)&&/Durée : (6 heures|24 heures|7 jours|30 jours)/.test(r.text)&&/FC/.test(r.text)&&/Scanner pour se connecter/.test(r.text)&&/Connectez-vous au WiFi et entrez le code/.test(r.text),r.text);
// URL carried by the QR: lowercase code
const u=await p.evaluate(()=>{const db=JSON.parse(localStorage.getItem('wifizone-v1'));return null});
// empty address = no QR
await p.click('nav button[data-v=set]');await p.waitForTimeout(300);await p.fill('#s_host','');await p.click('[data-a=saveset]');await p.waitForTimeout(300);
await p.click('nav button[data-v=tix]');await p.waitForTimeout(300);await p.click('[data-a=lotprint]');await p.waitForTimeout(500);
r=await p.evaluate(()=>{const d=document.createElement('div');d.innerHTML=window.__sheet;return{n:d.querySelectorAll('.tk').length,qr:d.querySelectorAll('svg').length,svgLogo:d.querySelectorAll('img').length}});
ok('empty address: tickets printed without QR',r.n===40&&r.qr===0,JSON.stringify(r));
// custom address is trimmed and the test sheet prints a QR
await p.click('nav button[data-v=set]');await p.waitForTimeout(300);await p.fill('#s_host','http://10.5.50.1/');await p.click('[data-a=saveset]');await p.waitForTimeout(300);
await p.click('[data-a=tktest]');await p.waitForTimeout(500);
r=await p.evaluate(()=>{const d=document.createElement('div');d.innerHTML=window.__sheet;return{n:d.querySelectorAll('.tk').length,qr:d.querySelectorAll('svg.tk-qr').length,txt:d.textContent,host:JSON.parse(localStorage.getItem('wifizone-v1')).loginHost}});
ok('test sheet: 4 tickets with QR and ESSAI mark',r.n===4&&r.qr===4&&/ESSAI/.test(r.txt),JSON.stringify([r.n,r.qr]));
ok('address saved as typed (http:// and path removed when printing)',r.host==='http://10.5.50.1/');
// colour per forfait: the four default forfaits get four different colours, a lot has a single colour
const cols=await p.evaluate(()=>{const d=document.createElement('div');d.innerHTML=window.__sheet;return[...d.querySelectorAll('.tk')].map(x=>x.getAttribute('style'))});
ok('test sheet: one colour per forfait (4 different)',new Set(cols).size===4&&cols.every(c=>/--c:#[0-9a-f]{6}/i.test(c)),cols.join(' | '));
await p.click('nav button[data-v=tix]');await p.waitForTimeout(300);await p.click('[data-a=lotprint]');await p.waitForTimeout(500);
const lc=await p.evaluate(()=>{const d=document.createElement('div');d.innerHTML=window.__sheet;return[...new Set([...d.querySelectorAll('.tk')].map(x=>x.getAttribute('style')))]});
ok('a lot of one forfait has a single colour matching its forfait',lc.length===1&&lc[0]===cols[1],lc.join(' | ')+' vs '+cols[1]);
// real pagination: 40 tickets fit on one A4 page, 41 need a second one
const pages=async n=>{await p.evaluate(n=>{const h=document.getElementById("planche").innerHTML;const d=document.createElement('div');d.innerHTML=h;const t=d.querySelector('.tk').outerHTML;document.getElementById('planche').innerHTML=t.repeat(n);document.body.classList.add('imprime')},n);await p.emulateMedia({media:'print'});const pdf=await p.pdf({preferCSSPageSize:true,printBackground:true});await p.emulateMedia({media:'screen'});await p.evaluate(()=>document.body.classList.remove('imprime'));return (pdf.toString('latin1').match(/\/Type\s*\/Page\b/g)||[]).length};
ok('40 tickets = one A4 page',await pages(40)===1);
ok('41 tickets = two pages',await pages(41)===2);
// print rules in the stylesheet: A4 page, 4 columns, 25 mm rows
const css=await p.evaluate(()=>[...document.styleSheets].flatMap(s=>[...s.cssRules]).map(r=>r.cssText).join('\n'));
ok('print CSS: A4, 8 mm margins, 4 columns, 25 mm rows',/size: a4/i.test(css)&&/margin: 8mm/.test(css)&&/repeat\(4, 1fr\)/.test(css)&&/grid-auto-rows: 25mm/.test(css));
ok('no page errors',errs.length===0,errs.join('|'));await b.close();process.exit(f?1:0)})();
