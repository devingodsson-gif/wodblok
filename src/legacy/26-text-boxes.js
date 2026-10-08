// ===== Text boxes (Arrangement > Text). A layer in Text mode has L.free = true, L.txt = true and L.pl = [{u, tx:{text,f,sz,ls,lh,al,cv,rot}, G:{key:path}, Lt:[[key,x,y,rot,scale]], bw,bh,n, x,y,s,r,f}].
// The letters are stored as outlines (centred on the box), so the project needs no fonts to show them. s = the box's long side on the canvas.
const fx1=v=>(+v).toFixed(1);
function txtGl(p,fill,pre){const G=p.G,Lt=p.Lt;if(!G||typeof G!='object'||!Array.isArray(Lt)||Lt.length>800)return'';let d0='',o='';const seen={};
for(const l of Lt){if(!Array.isArray(l))continue;const d=G[l[0]];if(typeof d!='string'||!/^[MLQZ0-9.,\- ]+$/.test(d))continue;const x=+l[1],y=+l[2],r=+l[3],s=+l[4];if(![x,y,r,s].every(isFinite))continue;
const id=pre+'_'+String(l[0]).replace(/[^\w-]/g,'_');if(!seen[id]){seen[id]=1;d0+=`<path id="${id}" d="${d}"/>`}o+=`<use href="#${id}" transform="translate(${x} ${y}) rotate(${r}) scale(${s})"/>`}
return`<defs>${d0}</defs><g fill="${fill}" fill-rule="evenodd">${o}</g>`}
const TXM=new Map();
function txMask(id,p){const q=txSpecs(p.tu,'wear');if(!q.length||!WBS.edInk)return'';const W=Math.max(1,+p.bw||1),H=Math.max(1,+p.bh||1),x=(-W/2).toFixed(2),y=(-H/2).toFixed(2),v=txImgs(q,W,H,384,'host',txIsW,x,y);if(!v)return'';
const key=id+'|'+v+'|'+W+'|'+H;if(TXM.has(key))return TXM.get(key);
const m=`<mask id="${id}" maskUnits="userSpaceOnUse" x="${x}" y="${y}" width="${W}" height="${H}"><rect x="${x}" y="${y}" width="${W}" height="${H}" fill="#fff"/>${v}</mask>`;
if(TXM.size>300)TXM.delete(TXM.keys().next().value);TXM.set(key,m);return m}
function txOvF(p){const q=txSpecs(p.tu,'wear');if(!q.length||!WBS.edInk)return'';const W=Math.max(1,+p.bw||1),H=Math.max(1,+p.bh||1);return txFilt(q,-W/2,-H/2,W,H,384)}
function txtLayer(L,li){const pl=(L.pl||[]).filter(p=>p.tx&&p.Lt&&p.G);if(!pl.length)return['',''];const f=v=>(+v).toFixed(2),ed=li==selL&&!$('boardP').classList.contains('off'),fill=L.ink&&CM[L.ink]?col(L.ink):col(proj.ink);let out='',defs='';
pl.forEach(p=>{const[w,h]=fpWH(p),k=p.s/Math.max(p.n||1,.01),mid='tm'+li+'_'+String(p.u).replace(/[^\w-]/g,''),mk=txMask(mid,p),fo=txOvF(p);if(mk)defs+=mk;const pf=p.ink&&CM[p.ink]?col(p.ink):fill,hit=ed?`<rect transform="rotate(${+p.r||0})" x="${f(-w/2)}" y="${f(-h/2)}" width="${f(w)}" height="${f(h)}" fill="none" pointer-events="all" style="cursor:move"/>`:'';
out+=`<g${ed?` data-fp="${p.u}"`:''} transform="translate(${f(+p.x)} ${f(+p.y)})">${hit}<g transform="rotate(${+p.r||0}) scale(${(k*(p.f||1)).toFixed(4)} ${k.toFixed(4)})"${fo?` filter="url(#${fo})"`:''}${mk?` mask="url(#${mid})"`:''}>${txtGl(p,pf,'tg'+li+'_'+String(p.u).replace(/[^\w-]/g,''))}</g></g>`});
const lop=L.op!=null?Math.max(0,Math.min(100,+L.op)):100,lbl=L.bl&&L.bl!='behind'&&L.bl!='cancel'&&L.bl!='replace'?L.bl:'';
return[defs,`<g${lop<100?` opacity="${(lop/100).toFixed(2)}"`:''}${lbl?` style="mix-blend-mode:${lbl}"`:''}>${out}</g>`]}
var tbSty={tu:[],ink:''},tbKey='',tbLoad=false,tbT=0,tbAl='c',txArm=false,tbG=null,tbGT=0;
const tbSet=(id,v)=>{const el=$(id);if(+el.value!=+v){el.value=v;el.dispatchEvent(new Event('input',{bubbles:true}))}};
const tbSel=()=>{const L=fpL();return L&&L.txt?(L.pl||[]).find(q=>q.u==fpSel&&q.tx)||null:null};
function tbRead(){return{text:$('tb_t').value.replace(/\r/g,'').slice(0,200),f:$('tb_f').value||'cinzel',sz:+$('tb_sz').value,ls:+$('tb_ls').value,lh:+$('tb_lh').value,al:tbAl,cv:+$('tb_cv').value,rot:+$('tb_rot').value}}
function tbArmUI(){const b=$('tb_go');if(b){b.classList.toggle('on',txArm);b.setAttribute('aria-pressed',String(txArm))}}
function tbGhost(){clearTimeout(tbGT);tbGT=setTimeout(async()=>{if(!txArm)return;const o=tbRead();if(!o.text.trim()){tbG=null;fpOverlay();return}const R=await wbTxLay(o);if(!txArm)return;tbG=R;fpOverlay()},120)}
function tbArm(on){txArm=on;if(on){fpSel=-1;fpMS=new Set();fpB=null;tbKey='';tbGhost()}else{tbG=null}tbArmUI();upd()}
var tbInkK='';
function tbStyUI(){tbLoad=true;try{const k=C.map(x=>x[0]).join('|');if(k!==tbInkK){tbInkK=k;$('tb_ink').innerHTML='<option value="">Layer colour</option>'+C.map(([n])=>`<option value="${hx(n)}">${hx(n)}</option>`).join('')}$('tb_ink').value=tbSty.ink&&CM[tbSty.ink]?tbSty.ink:'';const L=fpL();$('tb_inkc').style.background=tbSty.ink&&CM[tbSty.ink]?col(tbSty.ink):L&&L.ink&&CM[L.ink]?col(L.ink):col(proj.ink)}finally{tbLoad=false}}
function tbStyle(k,v){const grp=fpGrp().filter(q=>q.tx);if(k=='ink'){tbSty.ink=v;grp.forEach(q=>{if(v)q.ink=v;else delete q.ink})}tbStyUI();if(grp.length){store();if(window.wbCap)wbCap()}upd();if(txArm)fpOverlay()}
function tbStySet(a){const grp=fpGrp().filter(q=>q.tx);tbSty.tu=a.map(u=>({...u}));grp.forEach(q=>{q.tu=a.map((u,i)=>{const o=(q.tu||[])[i];return o&&o.x===u.x?o:{x:u.x,sd:grp.length>1?txRid():u.sd}})});if(grp.length){store();if(window.wbCap)wbCap()}upd();if(txArm)fpOverlay();txRefresh()}
function tbStyVary(i){const grp=fpGrp().filter(q=>q.tx);if(tbSty.tu[i])tbSty.tu[i]={...tbSty.tu[i],sd:txRid()};grp.forEach(q=>{if(q.tu&&q.tu[i])q.tu[i]={...q.tu[i],sd:txRid()}});if(grp.length){store();if(window.wbCap)wbCap()}upd();txRefresh()}
function txbSync(L){if(!L.txt)txArm=false;else if(txArm&&tbSel()){txArm=false;tbArmUI()}
if(L.txt&&$('tb_sprow'))$('tb_sprow').hidden=!tbSel();{const sw=$('lfps').closest('.ctl')||$('lfps'),lb=sw.previousElementSibling;sw.style.display=L.txt?'none':'';if(lb&&lb.tagName=='LABEL')lb.style.display=L.txt?'none':''}if(!L.txt||!$('tb_t'))return;const p=tbSel();$('tb_ed').hidden=!p;if(p)$('tb_edn').textContent=String(p.tx.text).replace(/\n/g,' ').slice(0,30);
const key=p?p.u+'|'+Math.round(p.s*10):'-';if(key===tbKey)return;tbKey=key;if(!p)return;
tbSty={tu:(Array.isArray(p.tu)?p.tu:[]).map(u=>({...u})),ink:p.ink||''};tbStyUI();tbLoad=true;try{const o=p.tx,ra=p.s/Math.max(p.n||1,.01);if($('tb_t').value!==o.text)$('tb_t').value=o.text;$('tb_f').value=o.f;tbSet('tb_sz',Math.max(2,Math.min(60,+(o.sz*ra).toFixed(1))));tbSet('tb_ls',o.ls);tbSet('tb_lh',o.lh);tbSet('tb_cv',o.cv);tbSet('tb_rot',o.rot);tbAl=o.al||'c';document.querySelectorAll('#tb_al [data-a]').forEach(b=>b.classList.toggle('on',b.dataset.a==tbAl))}finally{tbLoad=false}}
function tbLive(){if(tbLoad)return;const p=tbSel(),L=fpL();if(!p){if(L&&L.txt){if(!txArm&&tbRead().text.trim()){tbArm(true)}else if(txArm)tbGhost()}return}clearTimeout(tbT);tbT=setTimeout(async()=>{const o=tbRead();if(!o.text.trim())return;const R=await wbTxLay(o);if(!R||!L.pl.includes(p))return;
p.tx=o;p.G=R.G;p.Lt=R.Lt;p.bw=R.bw;p.bh=R.bh;p.n=Math.max(R.bw,R.bh);p.s=+p.n.toFixed(2);tbKey=p.u+'|'+Math.round(p.s*10);store();upd();if(window.wbCap)wbCap()},160)}
async function tbAdd(){const L=fpL();if(!L||!L.txt)return;const o=tbRead();if(!o.text.trim())return;const R=await wbTxLay(o);if(!R){pmsg('No letters came out. Try another font.');return}
L.pl=L.pl||[];const c=L.pl.filter(z=>z.tx).length,n=Math.max(R.bw,R.bh),q={u:fpU(),tx:o,G:R.G,Lt:R.Lt,bw:R.bw,bh:R.bh,n,x:+(CW/2+((c%4)-1.5)*CW*.03).toFixed(1),y:+(CH/2+((c%4)-1.5)*CW*.03).toFixed(1),s:+n.toFixed(2),r:0,f:1};
L.pl.push(q);fpSel=q.u;fpMS=new Set();fpB=null;fpGhost=null;tbKey='';store();upd();if(window.wbCap)wbCap()}
{if(window.wbTxFontHTML){window.wbTbFonts=()=>{const c=$('tb_f').value;$('tb_f').innerHTML=wbTxFontHTML();$('tb_f').value=c&&[...$('tb_f').options].some(o=>o.value==c)?c:'cinzel'};wbTbFonts()}
['tb_t','tb_f','tb_sz','tb_ls','tb_lh','tb_cv','tb_rot'].forEach(id=>$(id).addEventListener('input',tbLive));
$('tb_al').onclick=e=>{const b=e.target.closest('[data-a]');if(!b)return;tbAl=b.dataset.a;document.querySelectorAll('#tb_al [data-a]').forEach(x=>x.classList.toggle('on',x==b));tbLive()};
$('tb_ink').addEventListener('input',()=>{if(!tbLoad)tbStyle('ink',$('tb_ink').value)});
txReg('tb_tex',{md:'wear',def:'pinholes',get:()=>{const p=tbSel();return p?(Array.isArray(p.tu)?p.tu:[]):tbSty.tu},set:tbStySet,vary:tbStyVary});
window.wbTxUses=()=>tbSty.tu;window.wbTxCut=id=>{tbSty.tu=tbSty.tu.filter(u=>u.x!==id)};
window.wbTxApply=id=>{const g=fpGrp().filter(q=>q.tx);if(!g.length){if(!tbSty.tu.some(u=>u.x===id))tbSty.tu.push({x:id,sd:txRid()});return 0}g.forEach(q=>{if(!Array.isArray(q.tu))q.tu=[];if(!q.tu.some(u=>u.x===id)&&q.tu.length<6)q.tu.push({x:id,sd:txRid()})});tbSty.tu=g[g.length-1].tu.map(u=>({...u}));return g.length};
$('tb_split').onclick=async()=>{const L=fpL();if(!L||!L.txt)return;const grp=fpGrp().filter(q=>q.tx);if(!grp.length)return;if(window.wbCap)wbCap();const cache=new Map(),made=[];let total=0;
for(const p of grp){const ra=p.s/Math.max(p.n||1,.01),k=ra,rr=(+p.r||0)*Math.PI/180,cs=Math.cos(rr),sn=Math.sin(rr),fl=p.f||1,out=[];
for(const l of (p.Lt||[])){const key=String(l[0]),cp=parseInt(key.split('|').pop(),36);if(!isFinite(cp))continue;let ch;try{ch=String.fromCodePoint(cp)}catch(e){continue}
const o={...p.tx,text:ch,cv:0,rot:0,sz:+(p.tx.sz*ra).toFixed(2)},ck=[o.f,o.sz,ch].join('|');let R=cache.get(ck);if(R===undefined){R=await wbTxLay(o);cache.set(ck,R)}if(!R)continue;
const lx=(+l[1])*k*fl,ly=(+l[2])*k,n=Math.max(R.bw,R.bh);
out.push({u:fpU(),tx:o,G:R.G,Lt:R.Lt,bw:R.bw,bh:R.bh,n,x:+((+p.x)+lx*cs-ly*sn).toFixed(1),y:+((+p.y)+lx*sn+ly*cs).toFixed(1),s:+n.toFixed(2),r:+(((+p.r||0)+fl*(+l[3]||0))%360).toFixed(1),f:fl,...(Array.isArray(p.tu)&&p.tu.length?{tu:p.tu.map(u=>({x:u.x,sd:txRid()}))}:{}),...(p.ink?{ink:p.ink}:{})})}
if(!out.length)continue;const i=L.pl.indexOf(p);if(i<0)continue;L.pl.splice(i,1,...out);made.push(...out);total+=out.length}
if(!made.length){pmsg('There were no letters to split.');return}
fpMS=new Set(made.map(q=>String(q.u)));fpSel=made[made.length-1].u;fpB=null;txArm=false;tbArmUI();tbKey='';store();upd();if(window.wbCap)wbCap();pmsg(`Split into ${total} letter${total>1?'s':''}. They are selected, so you can move them together or click one to change it alone.`)};
$('tb_go').onclick=()=>{if(txArm){tbArm(false);return}if(!tbRead().text.trim()){$('tb_t').focus();return}tbArm(true)};
$('tb_t').addEventListener('keydown',e=>{if(e.key=='Enter'&&!e.shiftKey){e.preventDefault();e.target.blur()}e.stopPropagation()});
$('tb_new').onclick=()=>{fpSel=-1;fpMS=new Set();tbKey='';txArm=false;tbG=null;tbArmUI();$('tb_t').value='';upd();$('tb_t').focus()};
$('tb_file').onchange=async()=>{const fl=$('tb_file').files[0];$('tb_file').value='';if(!fl||!window.wbTxAddFont)return;try{const id=await wbTxAddFont(fl);wbTbFonts();$('tb_f').value=id;tbLive();pmsg(`Loaded “${fl.name.replace(/\.[a-z0-9]+$/i,'')}”.`)}catch(e){pmsg('That font file could not be read. Try a .ttf or .otf file.')}}}

