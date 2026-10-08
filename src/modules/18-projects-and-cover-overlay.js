import {$,WBH,WBS,WBX} from './01-launch-and-version.js';
import {C,CC,CH,CM,CSN,CW,PCOL,SHN,bk,fixC,paintColors,saveCC,setDim,shOf} from './04-canvas-and-stamp-outlines.js';
import {DEF_TILES,clean,cust,mkL,selOne,store,use} from './06-motif-library-folders.js';
import {gShOk} from './08-grid-shapes.js';
import {migLayers} from './10-layer-grids.js';
import {migEdges,upd} from './11-pressure-flooding-block-edges.js';
import {ser} from './14-presets-and-layer-grid-ui.js';
import {savePr} from './15-print-effects-and-stamp-texture.js';
import {txClean} from './16-texture-generators.js';
import {buildTex,migInk,saveTex,texNorm} from './17-texture-panel-and-previews.js';
import {artLive,artLoad,artSnap,artUsed} from './25-art-layers.js';
import {clearAll,renderPL} from './33-clear.js';
// ---- Projects: save / open / duplicate / download / import.
// The working copy always autosaves in this browser. Named projects are stored in the viewer's
// private account storage (db, data/users/<id>/projects) when available, otherwise in this browser.
const PDEF={pr:{e:3,q:0,t:'speckle',a:35,sc:100,sd:811},tex:{}};
// The pattern grid (its own tool in Pattern mode): show/hide, columns across, which points stamps snap to, line strength.
const PGD={show:false,n:8,m:'l',op:70,sh:'rect'};
const pgFix=(o,ls)=>{let g={...PGD};const nn=v=>Math.max(2,Math.min(60,Math.round(+v)||8));
 if(o&&typeof o=='object')g={show:!!o.show,n:nn(o.n),m:o.m=='c'?'c':'l',op:Math.max(10,Math.min(100,Math.round(+o.op)||70)),sh:gShOk(o.sh)};
 else{const L=(ls||[]).find(l=>l&&l.fg&&(l.fg.show||l.fg.n!=null));if(L)g={...g,show:!!L.fg.show,n:nn(L.fg.n),m:L.fg.m=='c'?'c':'l'}} // projects from before: take the grid the first layer had
 return g};
const core=()=>({tiles:WBS.tiles,layers:WBS.layers,proj:WBS.proj,dim:WBS.dim,pr:WBS.pr,tex:WBS.tex,texLib:WBS.texLib,pg:{...WBS.pgrid},grade:WBX.wbGrade?WBX.wbGrade.get():null});
const coreStr=()=>JSON.stringify(core());
// ---- Book cover overlay: built-in label template, or the user's own image, centered with one scale.
const blank=()=>({img:'',iw:0,ih:0,sc:100});let covB;let covS;
let cov={img:'',iw:0,ih:0,sc:100};
const okImg=u=>typeof u=='string'&&/^data:image\/(png|jpeg|webp|gif);base64,[A-Za-z0-9+/=]+$/.test(u);
const slotC=()=>WBS.cslot=='b'?covB:WBS.cslot=='s'?covS:cov,setSlotC=o=>{if(WBS.cslot=='b')covB=o;else if(WBS.cslot=='s')covS=o;else cov=o};
function covOrder(){const on=cov.tx!==false,a=$('art');if(on)a.insertBefore($('covg'),$('texg'));else a.appendChild($('covg'));const pv=$('pvw'),tu=pv.querySelector('use[href="#texg"]');if(on)pv.insertBefore($('pvcu'),tu);else pv.appendChild($('pvcu'));$('covtx').checked=on;a.appendChild($('guig'))}
const saveCov=()=>{try{localStorage.setItem('wb40_coverB',JSON.stringify(covB));localStorage.setItem('wb40_coverS',JSON.stringify(covS))}catch(e){}try{localStorage.setItem('wb31_cover',JSON.stringify({...cov,on:$('cov').checked}))}catch(e){$('cvmsg').textContent='This image is too large to keep in the browser; it will stay until you reload. Saving the project keeps it.'}};
function renderCover(){const on=$('cov').checked,k=[on,CW,CH,WBS.book.on?JSON.stringify(WBS.book):'',...[cov,covB,covS].map(c=>[c.sc,c.img.length,c.img.slice(-24)].join(','))].join('|');if(k==WBS.covKey)return;WBS.covKey=k;let h='';
const put=(c,x,y,w,hh)=>{if(!c.img||!c.iw)return'';const f=Math.min(w/c.iw,hh/c.ih)*c.sc/100,iw=c.iw*f,ih=c.ih*f;return`<image href="${c.img}" x="${(x+(w-iw)/2).toFixed(1)}" y="${(y+(hh-ih)/2).toFixed(1)}" width="${iw.toFixed(1)}" height="${ih.toFixed(1)}" preserveAspectRatio="xMidYMid meet"/>`};
if(on){if(WBS.book.on){const g=bk(),u=CW/g.W,y=g.b*u,hh=g.th*u;h=put(covB,g.b*u,y,g.tw*u,hh)+put(covS,(g.b+g.tw)*u,y,g.sw*u,hh)+put(cov,(g.b+g.tw+g.sw)*u,y,g.tw*u,hh)}else h=put(cov,0,0,CW,CH)}
drawGuides();
$('covg').innerHTML=h;paintCov();covOrder()}
function drawGuides(){const G=$('guig');if(!WBS.book.on||!WBS.book.gd){G.innerHTML='';return}const g=bk(),u=CW/g.W,f=v=>(v*u).toFixed(2),lw=(CW/1000).toFixed(2),b=g.b,x1=b+g.tw,x2=x1+g.sw,sf=.125,ss=.0625;
const R=(x,y,w,h,st,da)=>`<rect x="${f(x)}" y="${f(y)}" width="${f(w)}" height="${f(h)}" fill="none" stroke="${st}" stroke-width="${lw}"${da?` stroke-dasharray="${da}"`:''}/>`,T=(x,y,t,r)=>`<text x="${f(x)}" y="${f(y)}" font-family="system-ui,sans-serif" font-size="${(CW/70).toFixed(1)}" font-weight="600" fill="#e0006e" text-anchor="middle" letter-spacing="1"${r?` transform="rotate(90 ${f(x)} ${f(y)})"`:''}>${t}</text>`;
let o=`<path d="M0 0H${CW}V${CH}H0Z M${f(b)} ${f(b)}V${f(b+g.th)}H${f(g.W-b)}V${f(b)}Z" fill="rgba(224,0,110,.16)" fill-rule="evenodd"/>`;
o+=R(b,b,g.W-2*b,g.th,'#00a3c4');o+=`<line x1="${f(x1)}" y1="0" x2="${f(x1)}" y2="${CH}" stroke="#e0006e" stroke-width="${lw}"/><line x1="${f(x2)}" y1="0" x2="${f(x2)}" y2="${CH}" stroke="#e0006e" stroke-width="${lw}"/>`;
o+=R(b+sf,b+sf,g.tw-2*sf,g.th-2*sf,'#1a9a4a','4 3')+R(x2+sf,b+sf,g.tw-2*sf,g.th-2*sf,'#1a9a4a','4 3');if(g.sw>2*ss)o+=R(x1+ss,b+sf,g.sw-2*ss,g.th-2*sf,'#1a9a4a','4 3');
o+=R(x1-.25-2,b+g.th-.25-1.2,2,1.2,'#e0006e','6 3')+T(x1-1.25,b+g.th-.25-.55,'BARCODE');
o+=T(b+g.tw/2,b+.4,'BACK')+T(x2+g.tw/2,b+.4,'FRONT');if(g.sw>.15)o+=T(x1+g.sw/2,b+g.th/2,'SPINE',1);G.innerHTML=o}
function paintCov(){if(!WBS.book.on)WBS.cslot='f';const c=slotC(),nm={f:'front',b:'back',s:'spine'}[WBS.cslot];document.querySelectorAll('#cvslot [data-s]').forEach(b=>b.classList.toggle('on',b.dataset.s==WBS.cslot));$('cvslot').hidden=!WBS.book.on;
$('cvp').innerHTML=c.img?`<img src="${c.img}" alt="Cover image">`:`<span>No ${WBS.book.on?nm+' ':'cover '}image yet</span>`;$('cvrm').hidden=!c.img;if(+$('cvs').value!=c.sc){$('cvs').value=c.sc;$('cvs').dispatchEvent(new Event('input',{bubbles:true}))}}
function setCoverImg(img){const MX=1400,s0=Math.min(1,MX/Math.max(img.naturalWidth,img.naturalHeight)),w=Math.max(1,Math.round(img.naturalWidth*s0)),h=Math.max(1,Math.round(img.naturalHeight*s0)),c=document.createElement('canvas');c.width=w;c.height=h;const x=c.getContext('2d');x.drawImage(img,0,0,w,h);
let u=c.toDataURL('image/webp',.88);if(!u.startsWith('data:image/webp'))u=c.toDataURL('image/png');if(u.length>1500000){const q=c.toDataURL('image/jpeg',.85);if(q.length<u.length)u=q}
if(!okImg(u)){$('cvmsg').textContent='That image could not be used. Try a PNG or JPG.';return}
const c0=slotC(),was=!c0.img;setSlotC({img:u,iw:w,ih:h,sc:was?(WBS.cslot=='f'?70:90):c0.sc,...(WBS.cslot=='f'?{tx:cov.tx}:{})});$('cov').checked=true;saveCov();WBS.covKey='';renderCover();$('cvmsg').textContent=`Cover image added (${Math.round(u.length*.75/1024)} KB).`;const cb=document.querySelector('.rail [data-pn="canvas"]');if(cb&&!cb.classList.contains('on'))cb.click()}
function coverFile(f){if(f.type&&!/^image\//.test(f.type)){$('cvmsg').textContent='That file is not an image.';return}const url=URL.createObjectURL(f),img=new Image();img.onload=()=>{setCoverImg(img);URL.revokeObjectURL(url)};img.onerror=()=>{URL.revokeObjectURL(url);$('cvmsg').textContent='That image could not be read. Try a PNG or JPG.'};img.src=url}
function snapshot(){const c=JSON.parse(coreStr()),used=new Set();c.tiles.forEach(t=>t.items.forEach(q=>used.add(q.m)));
const cm={};Object.keys(cust).forEach(k=>{if(used.has(k))cm[k]=cust[k]});
return{app:'WODBLOK',v:18,...c,arts:artUsed(),cover:{img:cov.img,iw:cov.iw,ih:cov.ih,sc:cov.sc,tx:cov.tx!==false,on:$('cov').checked,back:covB,spine:covS,book:WBS.book},grade:WBX.wbGrade?WBX.wbGrade.get():null,lib:{motifs:cm,colors:C.filter(x=>CC.includes(x[0]))}}}
function applySnap(d){if(!d||!Array.isArray(d.tiles)||!d.tiles.length||!Array.isArray(d.layers))throw new Error('Not a WODBLOK project');
WBS.ARTS=artLoad(d.arts);const L=d.lib||{};Object.entries(L.motifs||{}).forEach(([k,v])=>{if(!v||typeof v.svg!='string')return;if(k.startsWith('t|')){if(/^<path d="[MLQZ0-9.,\- ]+" fill="FILL" fill-rule="evenodd"\/>$/.test(v.svg))cust[k]={n:String(v.n||'?').replace(/["<>&|]/g,'').slice(0,4),svg:v.svg,txt:1};return}if(k.startsWith('i|')){if(WBX.wbImpOk&&WBX.wbImpOk(k,v))cust[k]={n:String(v.n||'Imported motif').replace(/["<>&|]/g,'').slice(0,40),svg:v.svg,imp:1,...(v.g?{g:String(v.g).replace(/["<>&|]/g,'').slice(0,30)}:{})}}else{const c=clean(v.svg);if(c)cust[k]={n:String(v.n||'motif').replace(/["<>&|]/g,'').slice(0,40),svg:c,...(v.g?{g:String(v.g).replace(/["<>&|]/g,'').slice(0,30)}:{})}}});
(L.colors||[]).forEach(([n,h])=>{if(n&&/^#[0-9a-f]{6}$/i.test(h)&&!CM[n]){C.push([n,h]);CM[n]=h;CC.push(n)}});saveCC();paintColors();
WBS.tiles=JSON.parse(JSON.stringify(d.tiles));WBS.layers=JSON.parse(JSON.stringify(d.layers));
WBS.layers.forEach(L=>{L.st=(L.st||[]).filter(id=>WBS.tiles.some(t=>t.id==id));if(L.lay=='brick'){L.lay='cols';if(!L.grid)L.grid='brick'}});if(!WBS.layers.length)WBS.layers=[mkL('Layer 1',WBS.tiles.map(t=>t.id),'check',180)];
WBS.proj=d.proj&&d.proj.ink&&d.proj.bg?{...d.proj,ink:fixC(d.proj.ink,PCOL.ink),bg:fixC(d.proj.bg,PCOL.bg)}:{...PCOL};
if(d.cover&&d.cover.book&&typeof d.cover.book=='object')WBS.book={...WBS.book,...d.cover.book};else WBS.book={...WBS.book,on:false};try{localStorage.setItem('wb40_book',JSON.stringify(WBS.book))}catch(e){}
WBS.dim=d.dim&&d.dim.s&&d.dim.c?JSON.parse(JSON.stringify(d.dim)):{s:[1,1],c:[2,3]};WBS.tiles.forEach(shOf);migLayers();setDim();WBS.pgrid=pgFix(d.pg,WBS.layers);
WBS.pr={...PDEF.pr,...(d.pr||{})};WBS.tex={...PDEF.tex,...(d.tex||{})};WBS.texLib=txClean(d.texLib);texNorm();if(WBX.wbGrade)WBX.wbGrade.set(d.grade||null);{const c2=d.cover||{};cov={img:okImg(c2.img)?c2.img:'',iw:+c2.iw||0,ih:+c2.ih||0,sc:+c2.sc||100,tx:c2.tx!==false};if(!cov.iw||!cov.ih)cov.img='';const sl=o=>o&&okImg(o.img)&&+o.iw&&+o.ih?{img:o.img,iw:+o.iw,ih:+o.ih,sc:+o.sc||100}:blank();covB=sl(c2.back);covS=sl(c2.spine);WBS.cslot='f';$('cov').checked=c2.on!==false;saveCov();WBS.covKey='';if(WBX.wbBookSync)WBX.wbBookSync()}
migEdges();migInk();WBS.nid=1+Math.max(0,...WBS.tiles.map(t=>+t.id||0));WBS.cur=0;selOne(-1);WBS.selL=WBS.layers.length-1;WBS.symKey='';$('sasp').dataset.custom='';$('casp').dataset.custom='';
try{localStorage.setItem('wb14_dim',JSON.stringify(WBS.dim))}catch(e){}store();savePr();saveTex();WBH.syncPr();WBH.syncTex();buildTex();upd()}
const saveCp=()=>{try{localStorage.setItem('wb18_cur',JSON.stringify(WBS.cp))}catch(e){}};
const pmsg=t=>$('pmsg').textContent=t;
const dirty=()=>!WBS.cp.id||coreStr()!==WBS.cp.saved||($('pnm').value.trim()||'Untitled pattern')!==WBS.cp.name;
function paintPst(){const d=dirty(),u=!WBS.cp.id||d,e=$('pst');e.textContent='';e.className=u?'dirty':'';e.title=u?(!WBS.cp.id?'Not saved yet':'Unsaved changes'):'';if(u)e.setAttribute('role','img'),e.setAttribute('aria-label',e.title);else e.removeAttribute('aria-label')}
const newId=()=>'p'+Date.now().toString(36)+Math.random().toString(36).slice(2,6);
const shapeInfo=d=>{const k=d.dim&&d.dim.k||'rect',c=d.dim&&d.dim.c||[2,3];return`${d.dim&&CSN[d.dim.cs]&&d.dim.cs!='rect'?CSN[d.dim.cs]:(+(+c[0]).toFixed(2))+':'+(+(+c[1]).toFixed(2))} canvas · ${({hex:'hex',circle:'circle',diamond:'diamond',tri:'triangle'})[k]||(SHN[k]||'Rectangle').toLowerCase()} stamps · ${d.tiles.length} stamp${d.tiles.length>1?'s':''}`};
// storage backend
const ST={kind:null,col:null,ready:null,
init(){return this.ready||(this.ready=(async()=>{try{const db=await use('db'),u=db&&await use('user'),id=u&&await u.id();if(db&&id){this.col=db.collection('data/users/'+id+'/projects');this.kind='account';return}}catch(e){}this.kind='browser'})())},
loc(){try{return JSON.parse(localStorage.getItem('wb18_projects')||'{}')}catch(e){return{}}},
locSave(o){localStorage.setItem('wb18_projects',JSON.stringify(o))},
async list(){await this.init();if(this.kind=='account'){const r=await this.col.get();return r.docs.map(x=>({id:x.id,...x.data()})).sort((a,b)=>(b.updated||0)-(a.updated||0))}
const o=this.loc();return Object.entries(o).map(([id,v])=>({id,...v})).sort((a,b)=>(b.updated||0)-(a.updated||0))},
async get(id){await this.init();if(this.kind=='account'){const x=await this.col.doc(id).get();return x.exists?{id,...x.data()}:null}const v=this.loc()[id];return v?{id,...v}:null},
async put(id,rec){await this.init();if(this.kind=='account')return this.col.doc(id).set(rec);const o=this.loc();o[id]=rec;this.locSave(o)},
async del(id){await this.init();if(this.kind=='account')return this.col.doc(id).delete();const o=this.loc();delete o[id];this.locSave(o)}};
function thumb(){return new Promise(res=>{try{const img=new Image(),to=setTimeout(()=>res(''),5000);img.onload=()=>{try{const w=200,h=Math.round(200*CH/CW),c=document.createElement('canvas');c.width=w;c.height=h;c.getContext('2d').drawImage(img,0,0,w,h);clearTimeout(to);res(c.toDataURL('image/jpeg',.7))}catch(e){res('')}};img.onerror=()=>res('');img.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(ser())}catch(e){res('')}})}
async function saveTo(id,name){const sn=snapshot(),a=await artSnap();if(a)sn.art=a;const rec={name,updated:Date.now(),info:shapeInfo(sn),thumb:await thumb(),data:JSON.stringify(sn)};try{await ST.put(id,rec)}catch(e){if(!a)throw e;delete sn.art;rec.data=JSON.stringify(sn);await ST.put(id,rec);pmsg('Saved, but without a picture for Art: the project was too big to store with it.')}return sn}
// two-tap confirm for actions that would drop unsaved work
const confirm2=(btn,label,fn)=>{if(!dirty()||btn.dataset.sure){delete btn.dataset.sure;return fn()}btn.dataset.sure='1';const o=btn.textContent;btn.textContent=label;setTimeout(()=>{delete btn.dataset.sure;btn.textContent=o},3500)};
function openData(d,id,name){applySnap(d);WBS.cp={id,name,saved:coreStr()};$('pnm').value=name;saveCp();paintPst();if(WBX.wbResetHist)WBX.wbResetHist();artLive(true)}
function init18(){WBS.pgrid={...PGD};
covB=blank();covS=blank();WBS.cslot='f';
try{const q=JSON.parse(localStorage.getItem('wb40_coverB')||'null');if(q&&typeof q.sc=='number')covB={...covB,...q}}catch(e){}
try{const q=JSON.parse(localStorage.getItem('wb40_coverS')||'null');if(q&&typeof q.sc=='number')covS={...covS,...q}}catch(e){}try{const q=JSON.parse(localStorage.getItem('wb31_cover')||'null');if(q&&typeof q.sc=='number')cov={...cov,...q};if(q&&q.on===false)$('cov').checked=false}catch(e){}if(!okImg(cov.img))cov.img='';if(!okImg(covB.img))covB.img='';if(!okImg(covS.img))covS.img='';
$('covtx').onchange=()=>{cov.tx=$('covtx').checked;saveCov();covOrder()};
WBS.covKey='';
WBX.wbCoverFile=coverFile;
$('cvfile').onchange=()=>{const f=$('cvfile').files[0];$('cvfile').value='';if(f)coverFile(f)};
$('cvs').addEventListener('input',()=>{slotC().sc=+$('cvs').value;saveCov();renderCover()});
$('cvrm').onclick=()=>{setSlotC(WBS.cslot=='f'?{img:'',iw:0,ih:0,sc:100,tx:cov.tx}:blank());saveCov();WBS.covKey='';renderCover();$('cvmsg').textContent='Cover image removed.'};
{const pz=$('cvpaste'),PZ=pz.innerHTML;pz.addEventListener('focus',()=>{if(pz.innerHTML==PZ)pz.innerHTML=''});pz.addEventListener('blur',()=>{if(!pz.textContent.trim()&&!pz.querySelector('img'))pz.innerHTML=PZ});
pz.addEventListener('paste',e=>{const it=[...(e.clipboardData&&e.clipboardData.items||[])].find(i=>/^image\//.test(i.type));if(it){e.preventDefault();e.stopPropagation();pz.innerHTML=PZ;pz.blur();coverFile(it.getAsFile())}else setTimeout(chk,60)});
const chk=()=>{const im=pz.querySelector('img');if(im&&im.src){const i2=new Image();i2.onload=()=>setCoverImg(i2);i2.src=im.src;pz.innerHTML=PZ;pz.blur()}else if(pz.textContent.trim()&&pz.innerHTML!=PZ){pz.innerHTML='';$('cvmsg').textContent='That was text, not an image.'}};pz.addEventListener('input',()=>setTimeout(chk,30))}
$('cov').addEventListener('input',()=>{saveCov();renderCover()});
WBS.cp={id:null,name:'',saved:''};try{const q=JSON.parse(localStorage.getItem('wb18_cur')||'null');if(q)WBS.cp={...WBS.cp,...q}}catch(e){}
$('pnm').value=WBS.cp.name||'';setInterval(paintPst,800);paintPst();
ST.init().then(()=>{$('pwhere').textContent=ST.kind=='account'?'Projects are saved privately to your Claude account, so they follow you across devices.':'Projects are saved in this browser only. Use Download to keep a copy you can open anywhere.'});
$('psv').onclick=async()=>{const name=$('pnm').value.trim()||'Untitled pattern';$('psv').disabled=true;pmsg('Saving…');
try{const id=WBS.cp.id||newId();await saveTo(id,name);WBS.cp={id,name,saved:coreStr()};$('pnm').value=name;saveCp();pmsg('Saved “'+name+'”.');if(!$('plist').hidden)renderPL()}
catch(e){pmsg('Could not save: '+((e&&e.message)||'unknown error'))}$('psv').disabled=false;paintPst()};
$('pcp').onclick=async()=>{const name=($('pnm').value.trim()||'Untitled pattern')+' copy';pmsg('Saving a copy…');
try{const id=newId();await saveTo(id,name);WBS.cp={id,name,saved:coreStr()};$('pnm').value=name;saveCp();pmsg('Now working on “'+name+'”. The original is unchanged.');if(!$('plist').hidden)renderPL()}
catch(e){pmsg('Could not save: '+((e&&e.message)||'unknown error'))}paintPst()};
$('pnw').onclick=()=>confirm2($('pnw'),'Click again to discard changes',()=>{const t=JSON.parse(DEF_TILES);
openData({tiles:t,layers:[mkL('Layer 1',t.map(x=>x.id),'check',180)],proj:{...PCOL},dim:{s:[1,1],c:[2,3]},pr:PDEF.pr,tex:PDEF.tex},null,'');clearAll(true);cov={img:'',iw:0,ih:0,sc:100};covB=blank();covS=blank();WBS.cslot='f';saveCov();WBS.covKey='';renderCover();WBS.cp.saved=coreStr();saveCp();paintPst()});
}
export {PGD,ST,confirm2,coreStr,covOrder,covS,dirty,newId,openData,paintCov,paintPst,pgFix,pmsg,renderCover,saveCp,saveTo,snapshot,init18};
