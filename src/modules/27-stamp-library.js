import {fmtStampOpen,fmtStampPack} from '../format/stamp.js';
import {fmtOpen} from '../format/container.js';
import {kv,use,collection} from '../platform/index.js';
import {$,WBS,WBX} from './01-launch-and-version.js';
import {BK} from './03-stamp-prints-and-drawing.js';
import {C,CC,CH,CM,CW,col,geom,paintColors,saveCC,shOf,shp,useT,okC} from './04-canvas-and-stamp-outlines.js';
import {clean,cust,inkOf,selOne,store} from './06-motif-library-folders.js';
import {hx,lattice} from './10-layer-grids.js';
import {eT,pressDefs,upd} from './11-pressure-flooding-block-edges.js';
import {SURFC,inkCatch,txMerge,txPack} from './17-texture-panel-and-previews.js';
import {newId,pmsg} from './18-projects-and-cover-overlay.js';
import {refAdopt} from './50-tray-core.js';
import {fpPick} from './24-free-place-layers.js';
import {artEnc,artId,artOk} from './25-art-layers.js';
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
if(fx||tx)try{li=WBS.layers.findIndex(l=>l.vis!==false&&(l.st||[]).includes(t.id)&&!l.art&&!l.txt&&!(l.fr&&l.fr.on));if(li>=0){L=WBS.layers[li];if(!L.free){const T=lattice(L);k=T.ts*(shOf(t).z||100)/(T.g.SW*T.z)*1.004}else{const q=(L.pl||[]).find(z=>z.t==t.id);if(q)k=q.s/Math.max(G.SW,G.SH)}}}catch(e){L=null;li=-1}
k=Math.min(k,.95*Math.min(CW,CH)/Math.max(G.SW,G.SH));if(!(k>0))k=1;
const W=G.SW*k,H=G.SH*k,mx=Math.max(W,H),pad=(fx||tx)?mx*.05:0,cx=CW/2,cy=CH/2,xf=`translate(${cx.toFixed(2)} ${cy.toFixed(2)}) scale(${k.toFixed(5)}) translate(${-G.SW/2} ${-G.SH/2})`;
let defs=(BK.vdefs!=null?BK.vdefs:dd.innerHTML)+(fx&&SURFC[t.id]?SURFC[t.id].s:'');if(!fx){defs=defs.split(` mask="url(#is${t.id})"`).join('');defs=defs.replace(/<g class="txo"[^>]*>.*?<\/g>/g,'')}let use=`<use href="#s${t.id}"/>`+(eT(t)?`<use href="#e${t.id}_0" fill="${ink}"/>`:'');
if(fx&&L&&((L.pst||0)>0||(L.pfl||0)>0)){const key=t.id+'_'+Math.floor(Math.random()*16);defs+=pressDefs(L,li,[t],new Set([key]));useT(WBS.tiles[WBS.cur]);use=`<use href="#q${li}_${key}"/>`}
if(fx&&L&&okC(L.ink)&&hasD('#lk'+li))use=`<g filter="url(#lk${li})">${use}</g>`;
let g=`<g transform="${xf}">${use}</g>`;
if(fx&&hasD('#rf'))g=`<g filter="url(#rf)">${g}</g>`;
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
async function slPaint(){if(!$('slgrid'))return;$('slname').placeholder='Stamp '+(WBS.cur+1);await SL.init();$('slwhere').textContent=SL.kind=='account'?'Saved to your Claude account':'Saved in this browser';
try{const ps=await SL.list();$('slcount').textContent=ps.length?String(ps.length):'';$('slgrid').innerHTML=ps.length?ps.map(p=>`<div class="slc" data-sl="${hx(p.id)}">${slOkImg(p.img)?`<div class="im"><img src="${hx(p.img)}" alt=""></div>`:'<div class="im"></div>'}<b title="${hx(p.name||'Stamp')}">${hx(p.name||'Stamp')}</b><div class="row"><button class="alt" data-sa="add" title="Add this stamp to the project">Add</button><button class="alt" data-sa="png" title="Export this stamp as a PNG">PNG</button><button class="alt" data-sa="file" title="Save this stamp as its own file">File</button><button class="alt" data-sa="del" title="Delete from the library">Delete</button></div></div>`).join(''):'<div class="hint" style="grid-column:1/-1">No saved stamps</div>'}
catch(e){$('slgrid').innerHTML='<div class="hint" style="grid-column:1/-1">Could not load the library.</div>'}}
// --- Art: import an image, or use a saved project
async function artImport(f){if(!f||!/^image\//.test(f.type))return pmsg('That file is not an image.');if(f.size>30e6)return pmsg('That image is too large. Try one under 30 MB.');
const url=await new Promise(r=>{const fr=new FileReader();fr.onload=()=>r(fr.result);fr.onerror=()=>r(null);fr.readAsDataURL(f)}),img=url&&await new Promise(r=>{const i=new Image();i.onload=()=>r(i);i.onerror=()=>r(null);i.src=url});
if(!img)return pmsg('Could not read that image.');let nw=img.naturalWidth||img.width||1000,nh=img.naturalHeight||img.height||1000;const k=Math.min(1,2000/Math.max(nw,nh)),w=Math.max(1,Math.round(nw*k)),h=Math.max(1,Math.round(nh*k)),c=document.createElement('canvas');c.width=w;c.height=h;c.getContext('2d').drawImage(img,0,0,w,h);
const id=artId();WBS.ARTS[id]={n:(f.name||'Art').replace(/\.[^.]+$/,'').replace(/["<>&|]/g,'').slice(0,40)||'Art',k:'img',src:artEnc(c),w,h};WBS.fpB=id;WBS.fpSel=-1;WBS.fpLast=null;pmsg('Image added. Click on the canvas to place it.');upd()}
function init27(){
try{const so=JSON.parse(kv.get('wb50_slopt')||'{}');$('slfx').checked=!!so.fx;$('sltx').checked=!!so.tx;if(so.px)$('slpx').value=so.px;if(so.bg!=null)$('slbg').value=so.bg}catch(e){}['slfx','sltx','slpx','slbg'].forEach(id=>$(id).addEventListener('change',slOptSave));
$('slpng').onclick=async()=>{const t=WBS.tiles[WBS.cur];if(!t)return;$('slpng').disabled=true;try{const c=await stampCanvas(t,+$('slpx').value||1024,$('slbg').value=='paper',{fx:$('slfx').checked,tx:$('sltx').checked});await slSavePng(await slBlob(c),$('slname').value.trim()||('Stamp '+(WBS.cur+1)))}catch(e){slMsg((e&&e.message)||'Could not export that stamp.')}$('slpng').disabled=false};
// A stamp in the library keeps its own colour as a fixed colour (tray places belong to a project); when it is added to a project,
// a colour that is in that project's tray links to it.
$('slsave').onclick=async()=>{const t=WBS.tiles[WBS.cur];if(!t)return;const b=$('slsave');b.disabled=true;slMsg('Saving…');
try{const G=geom(shOf(t)),c=await stampCanvas(t,1400,false),w=c.toDataURL('image/webp',.9),img=w.startsWith('data:image/webp')?w:c.toDataURL('image/png'),used=new Set(),cm={};t.items.forEach(q=>used.add(q.m));used.forEach(k=>{if(cust[k])cm[k]=cust[k]});
const nm=($('slname').value.trim()||('Stamp '+(WBS.cur+1))).replace(/["<>&|]/g,'').slice(0,40),clone=JSON.parse(JSON.stringify(t));delete clone.id;clone.txl=txPack(t);if(clone.ink)clone.ink=col(clone.ink);
const rec={name:nm,updated:Date.now(),w:+G.SW.toFixed(2),h:+G.SH.toFixed(2),img,tile:JSON.stringify(clone),motifs:cm,colors:t.ink&&CC.includes(t.ink)?[[t.ink,CM[t.ink]]]:[]};
await SL.put(newId(),rec);$('slname').value='';slMsg('Saved “'+nm+'” to the library.');slPaint()}
catch(e){slMsg(e&&/quota|storage/i.test(e.message||'')?'The library is full in this browser. Delete a stamp or two, then try again.':'Could not save: '+((e&&e.message)||'unknown error'))}b.disabled=false};
$('slgrid').onclick=async e=>{const b=e.target.closest('[data-sa]');if(!b)return;const id=b.closest('[data-sl]').dataset.sl,a=b.dataset.sa;
try{const rec=await SL.get(id);if(!rec)return slMsg('That stamp is gone.');
if(a=='add'){let t=null;try{t=JSON.parse(rec.tile)}catch(er){}if(!t||!Array.isArray(t.items))return slMsg('That library entry is damaged.');
libMotifs({motifs:rec.motifs});libColors({colors:rec.colors});txMerge(t);if(t.ink){const h=okC(t.ink)&&t.ink[0]!='@'?col(t.ink):CM[t.ink]||null;const r=h?refAdopt(h):null;if(r)t.ink=r;else delete t.ink}t.id=WBS.nid++;shOf(t);WBS.tiles.push(t);WBS.cur=WBS.tiles.length-1;selOne(-1);WBS.symKey='';store();upd();if(WBX.wbCap)WBX.wbCap();slMsg('Added “'+rec.name+'” as a new stamp. Tick it under Stamps in the Layout to print it.')}
else if(a=='png'){if(!slOkImg(rec.img))return slMsg('That entry has no picture.');const im=await new Promise((res,rej)=>{const i=new Image();i.onload=()=>res(i);i.onerror=()=>rej(new Error('Could not read the picture'));i.src=rec.img}),c=document.createElement('canvas');c.width=im.naturalWidth;c.height=im.naturalHeight;c.getContext('2d').drawImage(im,0,0);await slSavePng(await slBlob(c),rec.name||'Stamp')}
else if(a=='file'){const d=await use('downloads');if(!d)return slMsg('Saving is not available here.');try{await d.save({filename:(rec.name||'stamp').replace(/[^\w\- ]+/g,'').trim().replace(/\s+/g,'-').toLowerCase()+'.wodblok-stamp',data:fmtStampPack(rec)});slMsg('Saved “'+rec.name+'” as a file.')}catch(er){if(!er||er.code!='declined')slMsg('Could not save: '+((er&&er.message)||'unknown error'))}}
else if(a=='del'){if(!b.dataset.sure){b.dataset.sure='1';b.textContent='Sure?';setTimeout(()=>{delete b.dataset.sure;b.textContent='Delete'},3000);return}await SL.del(id);slMsg('Deleted “'+rec.name+'”.');slPaint()}}
catch(er){slMsg('Something went wrong: '+((er&&er.message)||'unknown error'))}};
$('slimp').onclick=()=>$('slimpf').click();
$('slimpf').onchange=async()=>{const f=$('slimpf').files[0];$('slimpf').value='';if(!f)return;try{const rec=fmtStampOpen(await f.text());await SL.put(newId(),rec);slMsg('Added “'+rec.name+'” to the library.');slPaint()}catch(er){slMsg((er&&er.name=='FormatError'&&er.message)||'Could not read that file.')}};
document.querySelector('.rail [data-pn="slib"]').addEventListener('click',()=>setTimeout(slPaint,60));
$('lfaimp').onclick=()=>$('lfafile').click();
$('lfafile').onchange=async()=>{const f=$('lfafile').files[0];$('lfafile').value='';if(f)await artImport(f)};
$('lfars').onclick=e=>{const x=e.target.closest('[data-ax]');if(x){const id=x.dataset.ax;if(!WBS.layers.some(l=>l.art&&(l.pl||[]).some(p=>p.a==id))){delete WBS.ARTS[id];if(WBS.fpB==id)WBS.fpB=null;upd()}return}const b=e.target.closest('[data-a]');if(!b)return;const id=b.dataset.a;if(e.shiftKey||e.ctrlKey||e.metaKey){fpPick(String(id),e,[...$('lfars').querySelectorAll('[data-a]')].map(x=>x.dataset.a));return}WBS.fpPool=new Set();WBS.fpPA=String(id);WBS.fpB=WBS.fpB==id?null:id;if(WBS.fpB){WBS.fpSel=-1;WBS.fpMS=new Set();WBS.fpLast=null}upd()};
$('lfaprj').onclick=()=>$('lfapfile').click();
$('lfapfile').onchange=async()=>{const f=$('lfapfile').files[0];$('lfapfile').value='';if(!f)return;try{const d=(await fmtOpen(new Uint8Array(await f.arrayBuffer()))).project,a=d&&d.art;if(!d||d.app!='WODBLOK')return pmsg('That is not a WODBLOK project file.');if(!a||!artOk(a.src))return pmsg('That file was saved before Art existed. Open it and save it again.');
const id=artId();WBS.ARTS[id]={n:String(d.name||f.name).replace(/\.wodblok(\.json)?$|\.json$/i,'').replace(/["<>&|]/g,'').slice(0,40)||'Project',k:'img',src:a.src,w:+a.w,h:+a.h};WBS.fpB=id;WBS.fpSel=-1;WBS.fpLast=null;pmsg('Project picture added as a fixed image. Click on the canvas to place it.');upd()}catch(er){pmsg((er&&er.name=='FormatError'&&er.message)||'Could not read that file.')}};
}
export {SL,libColors,libMotifs,init27};
