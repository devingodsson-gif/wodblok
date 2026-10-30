import {fmtStampOpen,fmtStampPack} from '../format/stamp.js';
import {fmtOpen} from '../format/container.js';
import {kv,use,collection} from '../platform/index.js';
import {$,WBS,WBX} from './01-launch-and-version.js';
import {BK} from './03-stamp-prints-and-drawing.js';
import {C,CC,CH,CM,col,CW,geom,okC,paintColors,saveCC,shOf,shp,stNm,useT} from './04-canvas-and-stamp-outlines.js';
import {clean,cust,inkOf,mk,selOne,store} from './06-motif-library-folders.js';
import {hx} from './10-layer-grids.js';
import {eT,pressDefs,upd} from './11-pressure-flooding-block-edges.js';
import {SURFC,inkCatch,txMerge,txPack} from './17-texture-panel-and-previews.js';
import {txSrc} from './16-texture-generators.js';
import {newId,pmsg} from './18-projects-and-cover-overlay.js';
import {refAdopt} from './50-tray-core.js';
import {fpPick} from './24-free-place-layers.js';
import {artEnc,artId,artOk,artRefd} from './25-art-layers.js';
import {ltMake} from './87-library-tree.js';
import {zipRead} from '../format/libzip.js';
import {basicKey} from './76-basic-shapes.js';
// ===== Stamp library: keep stamps between projects, and export a stamp as a PNG =====
// A library record: {name, updated, w, h, img (transparent picture), tile (the stamp, as JSON), motifs (the custom motifs it uses), colors (its custom ink)}.
// Stored privately with your Claude account when that is available, otherwise in this browser.
const SL={kind:null,col:null,ready:null,
init(){return this.ready||(this.ready=(async()=>{try{const db=await use('db'),u=db&&await use('user'),id=u&&await u.id();if(db&&id){this.col=db.collection('data/users/'+id+'/stamps');this.kind='account';return}}catch(e){}this.kind='browser';this.col=await collection('stamps','wb50_stamps')})())},
loc(){try{return JSON.parse(kv.get('wb50_stamps')||'{}')}catch(e){return{}}},
async list(){await this.init();if(this.col){const r=await this.col.get();return r.docs.map(x=>({id:x.id,...x.data()})).sort((a,b)=>(b.updated||0)-(a.updated||0))}return Object.entries(this.loc()).map(([id,v])=>({id,...v})).sort((a,b)=>(b.updated||0)-(a.updated||0))},
async get(id){await this.init();if(this.col){const x=await this.col.doc(id).get();return x.exists?{id,...x.data()}:null}const v=this.loc()[id];return v?{id,...v}:null},
async put(id,rec){await this.init();if(this.col)return this.col.doc(id).set(rec);const o=this.loc();o[id]=rec;kv.set('wb50_stamps',JSON.stringify(o))},
async del(id){await this.init();if(this.col)return this.col.doc(id).delete();const o=this.loc();delete o[id];kv.set('wb50_stamps',JSON.stringify(o))}};
// messages go to the status line, like every other save; the stamp's own name ("Stamp 3") is what an empty name field falls back to, and the field says so
const slMsg=t=>{$('slmsg').textContent='';pmsg(t)};
const slOkImg=s=>typeof s=='string'&&s.length<6e6&&/^data:image\/(png|webp);base64,[A-Za-z0-9+\/=]*$/.test(s);
// draw one stamp to a canvas: its ink and shape (and edge wear), long side = px, transparent or on the paper colour
async function stampCanvas(t,px,onPaper,o){o=o||{};const G=geom(shOf(t)),dd=$('dyn').querySelector('defs');if(!dd)throw new Error('The stamp is not drawn yet');
useT(t);const outline=shp(0);useT(WBS.tiles[WBS.cur]);const ink=inkOf(t),pa=col(WBS.proj.bg),fx=!!o.fx,tx=!!o.tx,hasD=sel=>!!dd.querySelector(sel);
// print it at the size it prints in your pattern, so grain and roughness match what you see there
let k=180/Math.max(G.SW,G.SH),L=null,li=-1;
if(fx||tx)try{li=WBS.layers.findIndex(l=>l.vis!==false&&(l.st||[]).includes(t.id)&&!(l.fr&&l.fr.on));if(li>=0){L=WBS.layers[li];{const q=(L.pl||[]).find(z=>z.t==t.id);if(q)k=q.s/Math.max(G.SW,G.SH)}}}catch(e){L=null;li=-1}
k=Math.min(k,.95*Math.min(CW,CH)/Math.max(G.SW,G.SH));if(!(k>0))k=1;
const W=G.SW*k,H=G.SH*k,mx=Math.max(W,H),pad=(fx||tx)?mx*.05:0,cx=CW/2,cy=CH/2,xf=`translate(${cx.toFixed(2)} ${cy.toFixed(2)}) scale(${k.toFixed(5)}) translate(${-G.SW/2} ${-G.SH/2})`;
let defs=(BK.vdefs!=null?BK.vdefs:dd.innerHTML)+(fx&&SURFC[t.id]?SURFC[t.id].s:'');if(!fx){defs=defs.split(` mask="url(#is${t.id})"`).join('');defs=defs.replace(/<g class="txo"[^>]*>.*?<\/g>/g,'')}let use=`<use href="#s${t.id}"/>`+(eT(t)?`<use href="#e${t.id}_0" fill="${ink}"/>`:'');
if(fx&&L&&((L.pst||0)>0||(L.pfl||0)>0)){const key=t.id+'_'+Math.floor(Math.random()*16);defs+=pressDefs(L,li,[t],new Set([key]));useT(WBS.tiles[WBS.cur]);use=`<use href="#q${li}_${key}"/>`}
if(fx&&L&&okC(L.ink)&&hasD('#lk'+li))use=`<g filter="url(#lk${li})">${use}</g>`;
let g=`<g transform="${xf}">${use}</g>`;
{const ic=tx?inkCatch(true):null;if(ic){defs+=ic.defs.replace('id="cw"','id="xcw"');g=`<g mask="url(#xcw)">${g}</g>`}}
let bgs='',over='';
if(onPaper){bgs=`<path d="${outline}" transform="${xf}" fill="${pa}"/>`;if(tx&&WBS.tex.t&&$('texg').innerHTML){defs+=`<clipPath id="xpclip"><path d="${outline}" transform="${xf}"/></clipPath>`;over=`<g clip-path="url(#xpclip)">${$('texg').innerHTML}</g>`}}
const vw=W+2*pad,vh=H+2*pad,sc=px/Math.max(vw,vh),w=Math.max(1,Math.round(vw*sc)),h=Math.max(1,Math.round(vh*sc));
const svg=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="${(cx-vw/2).toFixed(2)} ${(cy-vh/2).toFixed(2)} ${vw.toFixed(2)} ${vh.toFixed(2)}" width="${w}" height="${h}"><defs>${defs}</defs>${bgs}${g}${over}</svg>`;
const img=await new Promise((res,rej)=>{const i=new Image();i.onload=()=>res(i);i.onerror=()=>rej(new Error('Could not draw the stamp'));i.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg)});
const c=document.createElement('canvas');c.width=w;c.height=h;c.getContext('2d').drawImage(img,0,0,w,h);return c}
const slBlob=c=>new Promise((res,rej)=>c.toBlob(b=>b?res(b):rej(new Error('Could not make the PNG')),'image/png'));
async function slSavePng(blob,name){const d=await use('downloads');if(!d)return slMsg('Saving is not available here.');try{await d.save({filename:name.replace(/[^\w\- ]+/g,'').trim().replace(/\s+/g,'-')+'.png',data:blob})}catch(e){if(e&&e.code!='declined')slMsg('Could not save: '+((e&&e.message)||'unknown error'))}}
const slOptSave=()=>{try{kv.set('wb50_slopt',JSON.stringify({fx:$('slfx').checked,tx:$('sltx').checked,px:$('slpx').value,bg:$('slbg').value}))}catch(e){}};
function libMotifs(L){Object.entries(L.motifs||{}).forEach(([k,v])=>{if(!v||typeof v.svg!='string')return;if(k.startsWith('t|')){if(/^<path d="[MLQZ0-9.,\- ]+" fill="FILL" fill-rule="evenodd"\/>$/.test(v.svg))cust[k]={n:String(v.n||'?').replace(/["<>&|]/g,'').slice(0,4),svg:v.svg,txt:1};return}if(k.startsWith('i|')){if(WBX.wbImpOk&&WBX.wbImpOk(k,v))cust[k]={n:String(v.n||'Imported shape').replace(/["<>&|]/g,'').slice(0,40),svg:v.svg,imp:1,...(v.g?{g:String(v.g).replace(/["<>&|]/g,'').slice(0,200)}:{})}}else{const c=clean(v.svg);if(c)cust[k]={n:String(v.n||'shape').replace(/["<>&|]/g,'').slice(0,40),svg:c,...(v.g?{g:String(v.g).replace(/["<>&|]/g,'').slice(0,200)}:{})}}});
}
function libColors(L){(L.colors||[]).forEach(([n,h])=>{if(n&&/^#[0-9a-f]{6}$/i.test(h)&&!CM[n]){C.push([n,h]);CM[n]=h;CC.push(n)}});saveCC();paintColors();}
// (2.24.0) the stamp Save to library and Export PNG work on: a placed stamp that is selected, otherwise the current stamp
function slTile(){const L=WBS.layers[WBS.selL],q=L&&WBS.fpSel!=null&&WBS.fpSel!==-1?(L.pl||[]).find(p=>p.u==WBS.fpSel):null;const t=q&&q.k!='pattern'&&q.t!=null?WBS.tiles.find(x=>x.id==q.t):null;return t||WBS.tiles[WBS.cur]||WBS.tiles[0]||null}
const slNo=()=>{const t=slTile();return t?WBS.tiles.indexOf(t)+1:0};
// Save and export and Library sit at the end of the Stamp panel; Save and export shows only when there is a stamp to save; its name field suggests that stamp's name. Kept up to date with the selection (WBX.wbSlSync from the element sync)
function slSync(){const g=$('slname')&&$('slname').closest('details.g');if(!g)return;
 {const sec=g.closest('section.pn'),lib=$('slgrid').closest('details.g');if(sec&&lib&&sec.lastElementChild!==lib){sec.appendChild(g);sec.appendChild(lib)}}   // last in the panel, below a placed stamp's Effects (2.24.0)
const none=!WBS.tiles.length;if(g.hidden!==none)g.hidden=none;const ph=stNm(slTile());if($('slname').placeholder!==ph)$('slname').placeholder=ph}
// The library is the shared folder tree (87-library-tree.js, 2.51.2): tiles of your stamps in Yours and your folders. A record's folder is its optional `g`; the folder list is kept in this browser.
// A tile adds the stamp to the project; the right-click menu adds Save as PNG and Save as file. slRecs is the list as last loaded (the tree reads it without waiting).
const SLF_KEY='wb251_stampfolders',SLF_UI='wb251_stampsui';
let SLT=null,slRecs=[];
const slFold=()=>{let d=null;try{d=JSON.parse(kv.get(SLF_KEY)||'null')}catch(e){}return(d&&Array.isArray(d.f)?d.f:[]).filter(x=>typeof x=='string'&&x&&x.length<=200&&!x.startsWith('s:'))};
const slPathOk=p=>typeof p=='string'&&p.length<=200&&!p.startsWith('s:')?p:'';
// 2.76.8 (owner Oct 29 2026, docs/pattern-plan.md step 5: "draw them for now"): a few built-in stamps drawn from the Basic shapes, in a Starting points set that
// opens first. Each is [id, name, stamp outline, items: [basic shape, x, y (in the outline's box), size, turn]]; the shapes are found by name when one is added.
const SL_START=[['dot','Dot','circle',[['ellipse',120,120,.78,0]]],['star','Star','rect',[['star',120,126,.82,0]]],['heart','Heart','rect',[['heart',120,128,.76,0]]],
 ['diamonds','Four diamonds','rect',[['dia',68,68,.38,0],['dia',172,68,.38,0],['dia',68,172,.38,0],['dia',172,172,.38,0]]],
 ['flower','Hex flower','hex',[['hex',103.92,120,.34,0],...[0,1,2,3,4,5].map(k=>['ellipse',+(103.92+Math.cos(k*Math.PI/3)*62).toFixed(2),+(120+Math.sin(k*Math.PI/3)*62).toFixed(2),.22,0])]],
 ['triangles','Two triangles','rect',[['tri',120,80,.52,0],['tri',120,160,.52,180]]]];
const SL_SID=id=>'bs:'+id,slStart=id=>{const x=typeof id=='string'&&id.startsWith('bs:')?SL_START.find(s=>s[0]==id.slice(3)):null;return x||null};
function slStartTile(x){return{items:x[3].map(([b,X,Y,s,r])=>({m:basicKey(b)||'b0',x:X,y:Y,s,r,f:1})),sh:{k:x[2],o:'p',s:[1,1],z:100},sym:{m:'off'},et:0,er:0,es:1,tu:[]}}
function slStartPic(x){const G=geom({k:x[2],o:'p',s:[1,1]}),mks=x[3].map(([b,X,Y,s,r])=>{const k=basicKey(b);return k?`<g transform="translate(${X} ${Y}) rotate(${r}) scale(${s})">${mk(k,'currentColor','transparent')}</g>`:''}).join('');
 return`<svg viewBox="0 0 ${G.SW.toFixed(1)} ${G.SH.toFixed(1)}" aria-hidden="true">${mks}</svg>`}
const slRec=id=>slRecs.find(x=>x.id===id);
const slPatch=(id,o)=>SL.get(id).then(r=>{if(r){delete r.id;return SL.put(id,{...r,...o})}}).catch(()=>{});
const slCfg=()=>({p:'sl',word:'stamp',words:'stamps',ui:SLF_UI,exportName:'wodblok-stamps',exportAs:'stamp files',pane:'#slpane',trId:'slgrid',qId:'slq',
 read(){const at={};slRecs.forEach(x=>{at[x.id]=x.g||''});return{f:slFold(),at,b:{},h:[],r:{}}},
 write(m){try{kv.set(SLF_KEY,JSON.stringify({f:m.f}))}catch(e){}slRecs.forEach(x=>{const g=slPathOk(m.at[x.id]);if(g!==(x.g||'')){x.g=g;slPatch(x.id,{g})}})},
 open:['s:Starting points'],sets:()=>[{k:'s:Starting points',n:'Starting points',ids:SL_START.map(x=>SL_SID(x[0]))}],name:id=>{const b=slStart(id);if(b)return b[1];const x=slRec(id);return x?x.name||'Stamp':null},own:id=>!slStart(id),used:()=>false,
 tile:id=>{const b=slStart(id);if(b)return slStartPic(b);const x=slRec(id);return x&&slOkImg(x.img)?`<img src="${hx(x.img)}" alt="" draggable="false">`:''},
 remove(list){list.forEach(id=>{slRecs=slRecs.filter(x=>x.id!==id);SL.del(id).catch(()=>{})});$('slcount').textContent=slRecs.length?String(slRecs.length):''},
 rename(id,v){const x=slRec(id);if(x)x.name=v;slPatch(id,{name:v})},
 async file(id){const r=await SL.get(id);return r?{name:r.name||'Stamp',data:new TextEncoder().encode(fmtStampPack(r)),ext:'.wodblok-stamp',fb:'Stamp'}:null},
 itemMenu:id=>slStart(id)?[['Add to project',()=>slAct(id,'add')]]:[['Add to project',()=>slAct(id,'add')],['Save as PNG',()=>slAct(id,'png')],['Save as file',()=>slAct(id,'file')]]});
async function slPaint(){if(!$('slpane'))return;slSync();await SL.init();$('slwhere').textContent=SL.kind=='account'?'Saved to your Claude account':'Saved in this browser';
try{const all=await SL.list();slRecs=all.map(p=>({id:p.id,name:p.name||'Stamp',img:p.img,g:slPathOk(p.g)}));$('slcount').textContent=all.length?String(all.length):'';SLT.show($('slpane'),'',slAct0);SLT.paintAll(true)}
catch(e){slMsg('Could not load the library.')}}
// --- Art: import an image, or use a saved project
async function artImport(f){if(!f||!/^image\//.test(f.type))return pmsg('That file is not an image.');if(f.size>30e6)return pmsg('That image is too large. Try one under 30 MB.');
const url=await new Promise(r=>{const fr=new FileReader();fr.onload=()=>r(fr.result);fr.onerror=()=>r(null);fr.readAsDataURL(f)}),img=url&&await new Promise(r=>{const i=new Image();i.onload=()=>r(i);i.onerror=()=>r(null);i.src=url});
if(!img)return pmsg('Could not read that image.');let nw=img.naturalWidth||img.width||1000,nh=img.naturalHeight||img.height||1000;const k=Math.min(1,2000/Math.max(nw,nh)),w=Math.max(1,Math.round(nw*k)),h=Math.max(1,Math.round(nh*k)),c=document.createElement('canvas');c.width=w;c.height=h;c.getContext('2d').drawImage(img,0,0,w,h);
const id=artId();WBS.ARTS[id]={n:(f.name||'Art').replace(/\.[^.]+$/,'').replace(/["<>&|]/g,'').slice(0,40)||'Art',k:'img',src:artEnc(c),w,h};if(WBX.wbMotifImage)WBX.wbMotifImage(id);pmsg('Image added.');upd()}
async function slAct(id,a){try{const b=slStart(id),rec=b?{name:b[1],tile:JSON.stringify(slStartTile(b)),motifs:{},colors:[]}:await SL.get(id);if(!rec)return slMsg('That stamp is gone.');
if(a=='add'){let t=null;try{t=JSON.parse(rec.tile)}catch(er){}if(!t||!Array.isArray(t.items))return slMsg('That library entry is damaged.');
libMotifs({motifs:rec.motifs});libColors({colors:rec.colors});if(WBX.wbTexImgsLoad)WBX.wbTexImgsLoad(rec.tximgs);txMerge(t);if(t.ink){const h=okC(t.ink)&&t.ink[0]!='@'?col(t.ink):CM[t.ink]||null;const r=h?refAdopt(h):null;if(r)t.ink=r;else delete t.ink}t.id=WBS.nid++;t.nm=String(rec.name||'').trim().slice(0,40)||'Stamp '+t.id;shOf(t);WBS.tiles.push(t);{const Ls=WBS.layers[WBS.selL];if(Ls&&!(Ls.st||[]).includes(t.id)){Ls.st=Ls.st||[];Ls.st.push(t.id)}}WBS.cur=WBS.tiles.length-1;selOne(-1);WBS.symKey='';store();upd();if(WBX.wbCap)WBX.wbCap();slMsg('Added “'+rec.name+'” as a new stamp. Tick it under Stamps in the Layout to print it.')}
else if(a=='png'){if(!slOkImg(rec.img))return slMsg('That entry has no picture.');const im=await new Promise((res,rej)=>{const i=new Image();i.onload=()=>res(i);i.onerror=()=>rej(new Error('Could not read the picture'));i.src=rec.img}),c=document.createElement('canvas');c.width=im.naturalWidth;c.height=im.naturalHeight;c.getContext('2d').drawImage(im,0,0);await slSavePng(await slBlob(c),rec.name||'Stamp')}
else if(a=='file'){const d=await use('downloads');if(!d)return slMsg('Saving is not available here.');try{await d.save({filename:(rec.name||'stamp').replace(/[^\w\- ]+/g,'').trim().replace(/\s+/g,'-').toLowerCase()+'.wodblok-stamp',data:fmtStampPack(rec)});slMsg('Saved “'+rec.name+'” as a file.')}catch(er){if(!er||er.code!='declined')slMsg('Could not save: '+((er&&er.message)||'unknown error'))}}}
catch(er){slMsg('Something went wrong: '+((er&&er.message)||'unknown error'))}}
const slAct0=id=>slAct(id,'add');
// stamp files (and zips of them, whose folders come back as your folders) go into the folder that is open
async function slImport(files){const g0=slPathOk(SLT.here());let n=0,bad=0,last='',err='';
 const put=async(text,g)=>{try{const rec=fmtStampOpen(text);rec.g=g;await SL.put(newId(),rec);n++;last=rec.name}catch(er){bad++;err=er&&er.name=='FormatError'&&er.message||''}};
 for(const f of files){if(/\.zip$/i.test(f.name)||/zip/.test(f.type)){const r=zipRead(new Uint8Array(await f.arrayBuffer()),/\.(wodblok-stamp|json)$/i);if(!r||!r.length){bad++;continue}
   for(const e of r){const dir=e.dir.map(x=>String(x).replace(/[\\"<>&|/]/g,'').trim().slice(0,30)).filter(x=>x&&!/^s:/i.test(x));await put(new TextDecoder().decode(e.data),dir.length?(g0?g0+'/':'')+dir.join('/'):g0)}}
  else await put(await f.text(),g0)}
 await slPaint();if(g0)SLT.open(g0);
 slMsg(n==1?'Added “'+last+'” to the library.':n?'Added '+n+' stamps.'+(bad?' '+bad+' file'+(bad>1?'s were':' was')+' not a stamp.':''):err||'Could not read that file.')}
function init27(){
SLT=ltMake(slCfg());SLT.init();$('slpane').innerHTML=SLT.paneHtml();
try{const so=JSON.parse(kv.get('wb50_slopt')||'{}');$('slfx').checked=!!so.fx;$('sltx').checked=!!so.tx;if(so.px)$('slpx').value=so.px;if(so.bg!=null)$('slbg').value=so.bg}catch(e){}['slfx','sltx','slpx','slbg'].forEach(id=>$(id).addEventListener('change',slOptSave));
$('slpng').onclick=async()=>{const t=slTile();if(!t)return slMsg('There is no stamp to export.');$('slpng').disabled=true;try{const c=await stampCanvas(t,+$('slpx').value||1024,$('slbg').value=='paper',{fx:$('slfx').checked,tx:$('sltx').checked});await slSavePng(await slBlob(c),$('slname').value.trim()||stNm(t))}catch(e){slMsg((e&&e.message)||'Could not export that stamp.')}$('slpng').disabled=false};
// A stamp in the library keeps its own colour as a fixed colour (tray places belong to a project); when it is added to a project,
// a colour that is in that project's tray links to it.
$('slsave').onclick=async()=>{const t=slTile();if(!t)return slMsg('There is no stamp to save.');const b=$('slsave');b.disabled=true;slMsg('Saving…');
try{const G=geom(shOf(t)),c=await stampCanvas(t,1400,false),w=c.toDataURL('image/webp',.9),img=w.startsWith('data:image/webp')?w:c.toDataURL('image/png'),used=new Set(),cm={};t.items.forEach(q=>used.add(q.m));used.forEach(k=>{if(cust[k])cm[k]=cust[k]});
const nm=($('slname').value.trim()||stNm(t)).replace(/["<>&|]/g,'').slice(0,40),clone=JSON.parse(JSON.stringify(t));delete clone.id;clone.txl=txPack(t);const tximgs={};clone.txl.forEach(x=>{const e=x&&txSrc(x.t);if(e&&e.imp)tximgs[x.t]={n:e.n,src:e.src}});if(clone.ink)clone.ink=col(clone.ink);
const rec={name:nm,updated:Date.now(),w:+G.SW.toFixed(2),h:+G.SH.toFixed(2),img,tile:JSON.stringify(clone),motifs:cm,colors:t.ink&&CC.includes(t.ink)?[[t.ink,CM[t.ink]]]:[],tximgs,g:slPathOk(SLT.here())};
await SL.put(newId(),rec);$('slname').value='';slMsg('Saved “'+nm+'” to the library.');slPaint()}
catch(e){slMsg(e&&/quota|storage/i.test(e.message||'')?'The library is full in this browser. Delete a stamp or two, then try again.':'Could not save: '+((e&&e.message)||'unknown error'))}b.disabled=false};
$('slimp').onclick=()=>$('slimpf').click();
$('slimpf').onchange=async()=>{const fl=[...($('slimpf').files||[])];$('slimpf').value='';if(fl.length)slImport(fl)};
WBX.wbSlSync=slSync;
{const sp=document.querySelector('section.pn[data-p="stmp"]');if(sp){new MutationObserver(()=>{if(!sp.hidden)setTimeout(slPaint,60)}).observe(sp,{attributes:true,attributeFilter:['hidden']});if(!sp.hidden)setTimeout(slPaint,60)}}   // the library lives in the Stamp panel (2.23.0); paint it when the panel is shown
$('lfaimp').onclick=()=>$('lfafile').click();
$('lfafile').onchange=async()=>{const f=$('lfafile').files[0];$('lfafile').value='';if(f)await artImport(f)};
$('lfars').onclick=e=>{const x=e.target.closest('[data-ax]');if(x){const id=x.dataset.ax;if(!artRefd(id)){delete WBS.ARTS[id];upd()}return}const b=e.target.closest('[data-a]');if(b&&WBX.wbMotifImage)WBX.wbMotifImage(b.dataset.a)};
$('lfaprj').onclick=()=>$('lfapfile').click();
$('lfapfile').onchange=async()=>{const f=$('lfapfile').files[0];$('lfapfile').value='';if(!f)return;try{const d=(await fmtOpen(new Uint8Array(await f.arrayBuffer()))).project,a=d&&d.art;if(!d||d.app!='WODBLOK')return pmsg('That is not a WODBLOK project file.');if(!a||!artOk(a.src))return pmsg('That file was saved before Art existed. Open it and save it again.');
const id=artId();WBS.ARTS[id]={n:String(d.name||f.name).replace(/\.wodblok$/i,'').replace(/["<>&|]/g,'').slice(0,40)||'Project',k:'img',src:a.src,w:+a.w,h:+a.h};if(WBX.wbMotifImage)WBX.wbMotifImage(id);pmsg('Project picture added.');upd()}catch(er){pmsg((er&&er.name=='FormatError'&&er.message)||'Could not read that file.')}};
}
export {SL,libColors,libMotifs,init27};
