// ---- where each target gets its pictures ----
// stamps: a wear mask (is<id>) and an overlay group; both kept in SURFC and only rebuilt when the stamp's textures change
const SURFC={};let SURFK='';
function inkSurfF(t,q){const w=txImgs(q,SW,SH,512,'inline',txIsW);return`<mask id="is${t.id}" maskUnits="userSpaceOnUse" x="0" y="0" width="${SW}" height="${SH}"><rect width="${SW}" height="${SH}" fill="#fff"/>${w}</mask>`}
function surfFor(t){const q=isOf(t);if(!q){delete SURFC[t.id];return''}const k=q.map(txKey).join(';')+'|'+SW+'|'+SH;let c=SURFC[t.id];if(!c||c.k!==k){const o=txImgs(q,SW,SH,512,'inline',txIsO);c=SURFC[t.id]={k,o:!!o,s:inkSurfF(t,q)+(o?`<g id="txo${t.id}">${o}</g>`:'')}}return c.s}
// the overlay, clipped to the stamp's ink by the stamp's own mask (mid)
const txoG=(t,mid)=>{const c=SURFC[t.id];return c&&c.o?`<g class="txo"${WBS.edInk?'':' display="none"'} mask="url(#${mid})"><use href="#txo${t.id}"/></g>`:''};
// a whole layer: wear = one mask over the canvas, relief / stain = a filter on the layer
function layTexMask(L,li){const q=txSpecs(L.tu,'wear');if(!q.length||!WBS.edInk)return'';const v=txImgs(q,CW,CH,800,'host',txIsW);return v?`<mask id="lt${li}" maskUnits="userSpaceOnUse" x="0" y="0" width="${CW}" height="${CH}"><rect width="${CW}" height="${CH}" fill="#fff"/>${v}</mask>`:''}
function layTexOv(L){const q=txSpecs(L.tu,'wear');if(!q.length||!WBS.edInk)return['',''];const f=txFilt(q,0,0,CW,CH,800);return f?[`<g filter="url(#${f})">`,'</g>']:['','']}
function txRefs(){const m=new Map(),add=u=>(Array.isArray(u)?u:[]).forEach(z=>{if(z&&z.x)m.set(z.x,(m.get(z.x)||0)+1)});tiles.forEach(t=>add(t.tu));WBS.layers.forEach(L=>{add(L.tu);(L.pl||[]).forEach(p=>add(p.tu))});if(tex&&Array.isArray(tex.u))add(tex.u);if(window.wbTxUses)add(window.wbTxUses());return m}
// Older projects kept their texture in other places (per-stamp "is", the single canvas surface). They become library textures here.
// Returns true when the canvas texture changed and has to be rebuilt.
let TEXK='';
function texNorm(){if(!Array.isArray(texLib))texLib=[];let ch=0;
const cv=o=>{const q=o.is;if(q&&q.t&&+q.a>0&&TXLEG.ink[q.t]){if(!Array.isArray(o.tu))o.tu=[];o.tu.push({x:txEnsure({t:TXLEG.ink[q.t],a:Math.max(0,Math.min(100,+q.a)),sc:Math.max(25,Math.min(300,+q.sc||100)),az:225}),sd:((+q.sd||1)|0)||1,md:'wear'})}delete o.is;if(!Array.isArray(o.tu))o.tu=[];ch=1};
tiles.forEach(t=>{if(t.is!==undefined||!Array.isArray(t.tu))cv(t)});WBS.layers.forEach(L=>{(L.pl||[]).forEach(p=>{if(p.is!==undefined)cv(p)})});
if(tex&&tex.v!==87){const u=[],Lx=txLib(tex.x),sd=((+tex.sd||1)|0)||1;
if(Lx){u.push({x:Lx.id,sd,md:'relief'});if(+Lx._k>0)u.push({x:txEnsure({t:Lx.t,a:Lx._k,sc:Lx.sc,az:Lx.az}),sd,md:'wear'})}
else if(tex.t&&TXLEG.surf[tex.t]){const t=TXLEG.surf[tex.t],sc=Math.max(25,Math.min(300,+tex.sc||100)),az=tex.az==null?225:+tex.az;u.push({x:txEnsure({t,a:Math.max(0,Math.min(100,tex.it==null?50:+tex.it)),sc,az}),sd,md:'relief'});if(+tex.ink>0)u.push({x:txEnsure({t,a:Math.min(100,+tex.ink),sc,az}),sd,md:'wear'})}
['t','sc','it','az','ink','x','age'].forEach(k=>delete tex[k]);tex.u=u;tex.v=87;ch=1}
if(tex&&!Array.isArray(tex.u)){tex.u=[];ch=1}
if(tex&&tex.v===87){tex.u=tex.u.filter(u=>u&&typeof u=='object'&&txLib(u.x)).slice(0,4).map(u=>({x:u.x,sd:((+u.sd||1)|0)||1,md:TXMD.includes(u.md)?u.md:'relief'}));tex.t=tex.u.length?'1':''}
texLib.forEach(L=>{if(L._k!==undefined){delete L._k;ch=1}});
if(ch||texLib.some(x=>x.auto)){const r=txRefs();texLib=texLib.filter(x=>!x.auto||r.get(x.id))}
return txCvKey()!==TEXK}
const txCvKey=()=>{const q=txSpecs(tex&&tex.u,'relief');return q.map(txKey).join(';')+'|'+CW+'|'+CH}
// stamps saved to the stamp library carry the textures they use, so they look the same in another project
function txPack(t){return(Array.isArray(t.tu)?t.tu:[]).map(u=>txLib(u&&u.x)).filter((x,i,a)=>x&&a.indexOf(x)===i).map(x=>({...x}))}
function txMerge(t){const pk=txClean(t.txl);delete t.txl;if(!pk.length||!Array.isArray(t.tu))return;const map={};
pk.forEach(p=>{const same=txLib(p.id);if(same&&txSame(same,p)){map[p.id]=p.id;return}const eq=texLib.find(x=>txSame(x,p));if(eq){map[p.id]=eq.id;return}const n={...p,id:same?txUid():p.id,name:txUniq(p.name),auto:false};texLib.push(n);map[p.id]=n.id});
t.tu=t.tu.map(u=>({...u,x:map[u.x]||u.x}))}
// ---- previews ----
const TXIC={dice:'<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="3.5" y="3.5" width="17" height="17" rx="2.5"/><circle cx="8.5" cy="8.5" r="1.3" fill="currentColor" stroke="none"/><circle cx="15.5" cy="8.5" r="1.3" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.3" fill="currentColor" stroke="none"/><circle cx="8.5" cy="15.5" r="1.3" fill="currentColor" stroke="none"/><circle cx="15.5" cy="15.5" r="1.3" fill="currentColor" stroke="none"/></svg>',edit:'<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M4.5 19.5l.9-3.9L16 5a2.1 2.1 0 013 3L8.4 18.6z"/><path d="M14.4 6.6l3 3"/></svg>',x:'<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M6 6l12 12M18 6L6 18"/></svg>'};
const txTc=new Map();
// a small swatch of one texture in one mode, on the project's paper and ink: returns an image address
function txSwatch(L,md,w,h,sd){const bg=col(proj.bg),ink=col(proj.ink),key=[L.id,L.t,L.a,L.sc,L.az,sd||L.sd,md,w,h,bg,ink].join('|');let s=txTc.get(key);
if(!s){const S={t:L.t,a:Math.max(+L.a,md=='wear'?55:0),sc:+L.sc||100,az:+L.az,sd:sd||+L.sd||1,md},cv=document.createElement('canvas');cv.width=w;cv.height=h;const x=cv.getContext('2d');
try{const pw=w,ph=h,px=txPix(S,pw,ph),t=document.createElement('canvas');t.width=pw;t.height=ph;t.getContext('2d').putImageData(new ImageData(px,pw,ph),0,0);
if(md=='wear'){x.fillStyle=bg;x.fillRect(0,0,w,h);const k=document.createElement('canvas');k.width=w;k.height=h;const y=k.getContext('2d');y.fillStyle=ink;y.fillRect(0,0,w,h);y.globalCompositeOperation='destination-out';y.drawImage(t,0,0);x.drawImage(k,0,0)}
else{x.fillStyle=bg;x.fillRect(0,0,w,h);x.drawImage(t,0,0)}}catch(e){x.fillStyle=bg;x.fillRect(0,0,w,h)}
s=cv.toDataURL('image/png');if(txTc.size>160)txTc.delete(txTc.keys().next().value);txTc.set(key,s)}
return s}
const txThumb=(L,u,md)=>`<img class="txt" alt="" src="${txSwatch(L,md||(u&&u.md)||'wear',60,60,u&&u.sd)}">`;
// ---- the stack of textures shown in the Stamp, Layers, Canvas and Text panels ----
const TXH=[],txCap=()=>{if(window.wbCap)wbCap()};
function txReg(id,cfg){const H={id,cfg,sig:''},el=$(id);TXH.push(H);if(!el)return;
el.addEventListener('click',e=>{const b=e.target.closest('[data-a]');if(!b)return;const a=b.dataset.a,row=b.closest('.txr'),i=row?+row.dataset.i:-1,uses=(cfg.get()||[]).map(u=>({...u}));
if(a=='add'){let L=texLib.find(x=>!uses.some(u=>u.x===x.id))||texLib[0];if(!L){L=txMake(cfg.def||'pinholes');texLib.push(L)}uses.push({x:L.id,sd:txRid(),md:cfg.md});cfg.set(uses)}
else if(a=='x'){uses.splice(i,1);cfg.set(uses)}
else if(a=='v'){if(cfg.vary)cfg.vary(i);else if(uses[i]){uses[i].sd=txRid();cfg.set(uses)}}
else if(a=='m'){if(uses[i]&&TXMD.includes(b.dataset.m)){uses[i].md=b.dataset.m;cfg.set(uses)}}
else if(a=='e'&&uses[i])txOpenLib(uses[i].x)});
el.addEventListener('change',e=>{const s=e.target.closest('select');if(!s)return;const row=s.closest('.txr');if(!row)return;const uses=(cfg.get()||[]).map(u=>({...u})),i=+row.dataset.i;if(!uses[i])return;uses[i].x=s.value;cfg.set(uses)});
txRender(H,true)}
function txRender(H,force){const el=$(H.id);if(!el)return;const c=H.cfg,uses=c.get()||[],o=texLib;
const sig=JSON.stringify([uses,c.md,o.map(x=>[x.id,x.name,x.t,x.a,x.sc,x.az,x.sd]),proj.bg,proj.ink]);if(!force&&sig===H.sig)return;H.sig=sig;
let h='';uses.forEach((u,i)=>{const L=txLib(u.x),md=TXMD.includes(u.md)?u.md:c.md;h+=`<div class="txr" data-i="${i}">${L?txThumb(L,u,md):'<span class="txt"></span>'}<select aria-label="Texture">${o.map(x=>`<option value="${hx(x.id)}"${x.id===u.x?' selected':''}>${hx(x.name)}</option>`).join('')}${o.some(x=>x.id===u.x)?'':`<option value="${hx(u.x)}" selected>Missing texture</option>`}</select><div class="txa"><button type="button" class="txb" data-a="v" aria-label="New variation" title="New variation">${TXIC.dice}</button><button type="button" class="txb" data-a="e" aria-label="Edit texture" title="Edit texture">${TXIC.edit}</button><button type="button" class="txb" data-a="x" aria-label="Remove texture" title="Remove">${TXIC.x}</button></div><div class="txm" role="group" aria-label="Mode">${TXMD.map(m=>`<button type="button" data-a="m" data-m="${m}" class="${m===md?'on':''}" aria-pressed="${m===md}">${TXMN[m]}</button>`).join('')}</div></div>`});
if(uses.length<(c.max||6))h+=`<div class="row tight"><button type="button" class="alt" data-a="add">Add texture</button></div>`;
const fi=document.activeElement&&document.activeElement.tagName=='SELECT'&&el.contains(document.activeElement)?[...el.querySelectorAll('select')].indexOf(document.activeElement):-1;el.innerHTML=h;if(fi>=0){const s=el.querySelectorAll('select')[fi];if(s)s.focus()}}
function txRefresh(force){TXH.forEach(H=>txRender(H,force));txPaintLib(force)}
// ---- the Textures panel ----
let txLd=false,txSig='';const txCur=()=>txLib(txSel);
const txSetR=(id,v)=>{const el=$(id);if(el&&+el.value!=+v){el.value=v;el.dispatchEvent(new Event('input',{bubbles:true}))}};
function txOpenLib(id){txSel=id;txRefresh(true);setPanel('tex')}
function txAfter(id){store();if(tex&&Array.isArray(tex.u)&&tex.u.some(u=>u.x===id)){saveTex();buildTex()}else upd()}
function txEdit(p){const L=txCur();if(!L||txLd)return;Object.assign(L,p);L.auto=false;txAfter(L.id)}
const txThr=(()=>{let last=0,tm=0,pend=null;const run=()=>{tm=0;last=performance.now();if(pend){const p=pend;pend=null;txEdit(p)}};return p=>{pend={...(pend||{}),...p};const w=160-(performance.now()-last);if(w<=0){clearTimeout(tm);tm=0;run()}else if(!tm)tm=setTimeout(run,w)}})();
function txPaintLib(force){if(!$('tx_list'))return;const refs=txRefs();if(!txLib(txSel))txSel=(texLib[0]||{}).id||'';
const sig=JSON.stringify([texLib,txSel,[...refs],proj.bg,proj.ink]);if(!force&&sig===txSig)return;txSig=sig;
$('tx_cnt').textContent=texLib.length?String(texLib.length):'';
$('tx_list').innerHTML=!texLib.length?'<button type="button" class="alt nb" data-n="1">New texture</button>':texLib.map(L=>`<div class="mr${L.id===txSel?' on':''}" data-x="${hx(L.id)}">${txThumb(L,null,'relief')}<b>${hx(L.name)}${refs.get(L.id)?`<i>${refs.get(L.id)}</i>`:''}</b><button type="button" data-d="1" aria-label="Delete texture" title="Delete">&times;</button></div>`).join('');
txPaintEd()}
function txPaintEd(){const L=txCur(),has=!!L;$('tx_edg').hidden=!has;$('tx_apg').hidden=!has;$('tx_dup').disabled=!has;if(!has)return;txLd=true;
try{$('tx_prev').innerHTML=TXMD.map(m=>`<figure><img alt="" src="${txSwatch(L,m,120,120)}"><figcaption>${TXMN[m]}</figcaption></figure>`).join('');if(document.activeElement!==$('tx_name'))$('tx_name').value=L.name;$('tx_type').value=L.t;
txSetR('tx_a',L.a);txSetR('tx_sc',L.sc);txSetR('tx_az',L.az);
const opts=[['stamp','This stamp'],['stamps','All stamps'],['layer','This layer'],['layers','All layers'],['text','Selected text boxes'],['texts','All text boxes'],['canvas','Canvas']],cur=$('tx_to').value;
if(!$('tx_to').options.length){$('tx_to').innerHTML=opts.map(([v,n])=>`<option value="${v}">${n}</option>`).join('');if(opts.some(o=>o[0]==cur))$('tx_to').value=cur}}finally{txLd=false}}
function txDelete(id){const L=txLib(id);if(!L)return;txCap();let n=0;const cut=o=>{if(Array.isArray(o.tu)){const b=o.tu.length;o.tu=o.tu.filter(z=>z&&z.x!==id);n+=b-o.tu.length}};tiles.forEach(cut);WBS.layers.forEach(l=>{cut(l);(l.pl||[]).forEach(cut)});if(window.wbTxCut)wbTxCut(id);
if(tex&&Array.isArray(tex.u)){const b=tex.u.length;tex.u=tex.u.filter(z=>z&&z.x!==id);n+=b-tex.u.length}texLib=texLib.filter(x=>x.id!==id);if(txSel===id)txSel=(texLib[0]||{}).id||'';texNorm();store();saveTex();buildTex();upd();txCap();txRefresh(true);pmsg(`Deleted “${L.name}”${n?` and took it off ${n} place${n>1?'s':''}`:''}.`)}
function txApply(){const L=txCur();if(!L)return;const to=$('tx_to').value;txCap();let n=0;const add=o=>{if(!Array.isArray(o.tu))o.tu=[];if(!o.tu.some(u=>u.x===L.id)&&o.tu.length<6){o.tu.push({x:L.id,sd:txRid(),md:'wear'});n++}};
if(to=='canvas'){if(!Array.isArray(tex.u))tex.u=[];if(!tex.u.some(u=>u.x===L.id)&&tex.u.length<4){tex.u.push({x:L.id,sd:txRid(),md:'relief'});n=1}texNorm();saveTex();buildTex()}
else if(to=='stamp'){const t=tiles[WBS.cur];if(t)add(t)}else if(to=='stamps')tiles.forEach(add);else if(to=='layer'){const l=LY();if(l)add(l)}else if(to=='layers')WBS.layers.forEach(add);
else if(to=='text'){n=window.wbTxApply?wbTxApply(L.id):0}else if(to=='texts')WBS.layers.forEach(l=>(l.pl||[]).forEach(p=>{if(p.tx)add(p)}));
store();upd();txCap();txRefresh(true);pmsg(n?`Applied “${L.name}” to ${n} ${to=='canvas'?'canvas':n>1?'places':'place'}.`:to=='text'?'Select a text box first. New text boxes will use it.':'Nothing to apply it to, or it is already there.')}

// projects made before this: the one canvas-wide surface is handed to every stamp (each with its own variation), then retired
const migInk=()=>{if(pr&&pr.t&&tiles.some(t=>(t.is===undefined&&t.tu===undefined))){tiles.forEach((t,i)=>{if((t.is===undefined&&t.tu===undefined))t.is={t:pr.t,a:pr.a,sc:pr.sc,sd:((+pr.sd||1)+i*131)%99999+1}});pr.t=''}};
function roughFilter(){
const E=pr.e,Q=pr.q,A=pr.a/100,k=100/Math.max(25,pr.sc),f=v=>+(v*k).toFixed(5),S=pr.sd;
if(!E&&!Q)return'';
const nz=(id,type,bf,oc,sd)=>`<feTurbulence type="${type}" baseFrequency="${bf}" numOctaves="${oc}" seed="${sd}" result="${id}"/>`;
const th=(src,id,sl,ic)=>`<feComponentTransfer in="${src}" result="${id}"><feFuncA type="linear" slope="${sl}" intercept="${(+ic).toFixed(3)}"/></feComponentTransfer>`;
const mix=(a,b,ka,kb,id)=>`<feComposite in="${a}" in2="${b}" operator="arithmetic" k1="0" k2="${ka}" k3="${kb}" k4="0" result="${id}"/>`;
let b='',cur='SourceGraphic';
if(E){b+=nz('en','fractalNoise',.045,2,S)+`<feDisplacementMap in="SourceGraphic" in2="en" scale="${(E*1.1).toFixed(1)}" xChannelSelector="R" yChannelSelector="G" result="d"/><feGaussianBlur in="d" stdDeviation="${(.5+E*.07).toFixed(2)}" result="bl"/>`+th('bl','th',7,-3)+th('d','ds',20,0)+`<feComposite in="th" in2="ds" operator="out" result="sp"/><feComposite in="d" in2="th" operator="in" result="di"/><feMerge result="r1"><feMergeNode in="sp"/><feMergeNode in="di"/></feMerge>`;cur='r1'}
if(Q){const r=(.8+Q*.22).toFixed(2),dk=(1-Q*.04).toFixed(3),lt=(1-Q*.035).toFixed(3);
b+=`<feColorMatrix in="${cur}" type="matrix" values="1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 ${lt} 0" result="qc"/><feColorMatrix in="${cur}" type="matrix" values="${dk} 0 0 0 0 0 ${dk} 0 0 0 0 0 ${dk} 0 0 0 0 0 1 0" result="qd"/><feMorphology in="${cur}" operator="erode" radius="${r}" result="qe"/><feGaussianBlur in="qe" stdDeviation="${(r*.6).toFixed(2)}" result="qb"/><feComposite in="qd" in2="qb" operator="out" result="qr"/><feMerge result="r2"><feMergeNode in="qc"/><feMergeNode in="qr"/></feMerge>`;cur='r2'}

return`<filter id="rf" filterUnits="userSpaceOnUse" x="0" y="0" width="${CW}" height="${CH}" color-interpolation-filters="sRGB">${b}</filter>`}
function syncPr(){$('rgh').value=pr.e;$('psq').value=pr.q;if(window.wbTexReady)txRefresh()}
[['rgh','e'],['psq','q']].forEach(([id,key])=>$(id).oninput=()=>{pr[key]=+$(id).value;syncPr();savePr();upd()});

syncPr();
// ---- Print / Textures tabs ----
// ---- Canvas texture. Its uses live in tex.u: relief / stain become pictures laid over the canvas, wear knocks ink out of every layer ----
let tex={};
try{const q=JSON.parse(localStorage.getItem('wb10_tex')||'null');if(q&&typeof q=='object')tex=q}catch(e){}
const saveTex=()=>{try{localStorage.setItem('wb10_tex',JSON.stringify(tex))}catch(e){}};
function buildTex(){let o='';try{o=txImgs(txSpecs(tex&&tex.u,'relief'),CW,CH,900,'inline',txIsO)}catch(e){o=''}
TEXK=txCvKey();$('texg').innerHTML=o?`<g pointer-events="none">${o}</g>`:'';if(typeof upd=='function'&&window.wbTexReady)upd()}
// the mask used on the ink so it skips the worn spots of the canvas texture (inl: pictures inside the markup, for a stand-alone file)
function inkCatch(inl){const q=txSpecs(tex&&tex.u,'relief').filter(txIsW);if(!q.length)return null;const v=txImgs(q,CW,CH,900,inl?'inline':'host',txIsW);
return v?{defs:`<mask id="cw" maskUnits="userSpaceOnUse" x="0" y="0" width="${CW}" height="${CH}"><rect width="${CW}" height="${CH}" fill="#fff"/>${v}</mask>`}:null}
function syncTex(){texNorm();txRefresh(true)}
// library panel wiring
$('tx_type').innerHTML=TXF.map(([g,o])=>`<optgroup label="${g}">${Object.entries(o).map(([k,n])=>`<option value="${k}">${n}</option>`).join('')}</optgroup>`).join('');
$('tx_list').onclick=e=>{if(e.target.closest('[data-n]')){$('tx_add').click();return}const r=e.target.closest('.mr');if(!r)return;const id=r.dataset.x;if(e.target.closest('[data-d]')){txDelete(id);return}txSel=id;txRefresh(true)};
$('tx_add').onclick=()=>{txCap();const L=txMake('cotton');texLib.push(L);txSel=L.id;store();txRefresh(true);txCap()};
$('tx_dup').onclick=()=>{const L=txCur();if(!L)return;txCap();const n={...L,id:txUid(),name:txUniq(L.name),auto:false,sd:txRid()};texLib.push(n);txSel=n.id;store();txRefresh(true);txCap()};
$('tx_del').onclick=()=>{if(txCur())txDelete(txSel)};
$('tx_apply').onclick=txApply;
$('tx_name').addEventListener('input',()=>{const L=txCur();if(!L||txLd)return;L.name=$('tx_name').value.replace(/[<>&"]/g,'').slice(0,40);L.auto=false;store();txRefresh()});
$('tx_name').addEventListener('blur',()=>{const L=txCur();if(L&&!L.name.trim()){L.name=txUniq(TXN[L.t]||'Texture');store();txRefresh(true)}});
$('tx_name').addEventListener('change',txCap);
$('tx_type').addEventListener('input',()=>{const L=txCur();if(!L||txLd)return;const t=$('tx_type').value;if(!TXN[t])return;const old=TXN[L.t];txCap();L.t=t;if(old&&L.name.startsWith(old))L.name=txUniq(TXN[t]);L.auto=false;txAfter(L.id);txRefresh(true);txCap()});
[['tx_a','a'],['tx_sc','sc'],['tx_az','az']].forEach(([id,k])=>{$(id).addEventListener('input',()=>{if(!txLd)txThr({[k]:+$(id).value})});$(id).addEventListener('change',()=>{if(txLd)return;txEdit({[k]:+$(id).value});txCap()})});
// the same stack control in the Stamp, Layers and Canvas panels
const txCommit=()=>{store();upd();txCap();txRefresh()};
txReg('st_tex',{md:'wear',def:'pinholes',get:()=>{const t=tiles[WBS.cur];return t&&t.tu||[]},set:a=>{const t=tiles[WBS.cur];if(!t)return;t.tu=a;txCommit()}});
txReg('ly_tex',{md:'wear',def:'pinholes',get:()=>{const l=LY();return l&&l.tu||[]},set:a=>{const l=LY();if(!l)return;l.tu=a;txCommit()}});
txReg('cv_tex',{md:'relief',def:'cotton',max:4,get:()=>Array.isArray(tex.u)?tex.u:[],set:a=>{tex.u=a;texNorm();saveTex();buildTex();store();txCap();txRefresh()}});

syncTex();buildTex();window.wbTexReady=1;
