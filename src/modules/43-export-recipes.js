import {ICN} from './00-icons.js';
import {kv,use} from '../platform/index.js';
import {zipSync} from '../vendor/fflate.js';
import {$,WBS,WBX} from './01-launch-and-version.js';
import {CH,CW,physOf,tileOn,tileRk} from './04-canvas-and-stamp-outlines.js';
import {upd} from './11-pressure-flooding-block-edges.js';
import {expName,ser} from './14-presets-and-layer-grid-ui.js';
import {newId,pmsg} from './18-projects-and-cover-overlay.js';
import {wmGet,wmSet,wmReady,wmDraw} from './56-watermark.js';
import {ltMake} from './87-library-tree.js';
import {pdfJpeg} from './30-print-cover.js';
// ===== Export recipes =====
// A recipe is a saved set of export settings: format, long side in pixels, TIFF DPI, and file-name ending.
// Click a recipe to export with it. "Export all" makes every recipe in one zip. With more than one colourway, "Colourways: All" makes each
// export once per colourway (one zip, each file named after its colourway). Kept with your settings. The Export menu in the top
// bar is unchanged.
const XR_KEY='wb97_exportrecipes',XR_MAX=8192,XR_AREA=64e6;
const XR_BUILTIN=[{id:'b-web',name:'Web',fmt:'png',px:2048,sfx:'web'},{id:'b-print',name:'Print',fmt:'png',px:6000,sfx:'print'},{id:'b-preview',name:'Preview',fmt:'jpg',px:800,sfx:'preview'}];
const XR_UI='wb259_recipesui',XR_FMT=['png','jpg','svg','tiff'];
let xrC=null,xrCr=null,XRT=null;
const xrEsc=x=>String(x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const xrIsOwn=id=>!/^b-/.test(id);
// the recipes you saved, the folders they sit in, and how the Starting points set is arranged (hidden, renamed, added to a folder), as for the other libraries
function xrCache(){let raw=null;try{raw=kv.get(XR_KEY)}catch(e){}
 if(xrC===null||raw!==xrCr){let d=null;try{d=JSON.parse(raw||'null')}catch(e){}if(Array.isArray(d))d={t:d};if(!d||typeof d!='object')d={};
  d.f=(Array.isArray(d.f)?d.f:[]).filter(x=>typeof x=='string'&&x&&x.length<=200&&!x.startsWith('s:'));
  d.t=(Array.isArray(d.t)?d.t:[]).filter(r=>r&&typeof r.id=='string'&&typeof r.name=='string'&&XR_FMT.includes(r.fmt)).map(r=>({...r,f:typeof r.f=='string'&&!r.f.startsWith('s:')?r.f:''}));
  d.h=(Array.isArray(d.h)?d.h:[]).filter(x=>typeof x=='string'&&x.length<=60);
  const r=d.r&&typeof d.r=='object'&&!Array.isArray(d.r)?d.r:{},b=d.b&&typeof d.b=='object'&&!Array.isArray(d.b)?d.b:{};d.r={};d.b={};
  Object.keys(r).forEach(k=>{const v=String(r[k]||'').trim();if(v&&v.length<=30&&!/[\\"<>&|/]/.test(v)&&!/^s:/i.test(v))d.r[k]=v});Object.keys(b).forEach(k=>{if(XR_BUILTIN.some(x=>x.id==k)&&typeof b[k]=='string'&&b[k]&&b[k].length<=200)d.b[k]=b[k]});
  xrC=d;xrCr=raw}
 return xrC}
const xrDb=()=>JSON.parse(JSON.stringify(xrCache()));
const xrLoad=()=>xrCache().t;
const xrStore=d=>{try{kv.set(XR_KEY,JSON.stringify(d))}catch(e){pmsg('Could not keep the recipes in this browser.')}};
const xrFind=id=>XR_BUILTIN.find(r=>r.id==id)||xrLoad().find(r=>r.id==id)||null;
const xrSum=r=>r.fmt=='svg'?'SVG':r.fmt.toUpperCase()+' · '+xrPx(r.px)+' px'+(r.fmt=='tiff'?' · '+(r.dpi||300)+' DPI':'');
const xrPx=v=>Math.min(XR_MAX,Math.max(256,Math.round(+v)||2048));
const xrDims=px=>{const k=px/Math.max(CW,CH);return[Math.round(CW*k),Math.round(CH*k)]};
// Write a standards-based, little-endian, uncompressed RGBA TIFF with inch-based X/Y resolution tags.
function xrTiff(rgba,w,h,dpi){
  const tags=[
    [256,4,1,w],[257,4,1,h],[258,3,4,0],[259,3,1,1],[262,3,1,2],[273,4,1,0],
    [277,3,1,4],[278,4,1,h],[279,4,1,rgba.length],[282,5,1,0],[283,5,1,0],[284,3,1,1],[296,3,1,2],[338,3,1,2]
  ];
  const ifdOffset=8,ifdSize=2+tags.length*12+4,extraOffset=ifdOffset+ifdSize,bitsOffset=extraOffset,resXOffset=bitsOffset+8,resYOffset=resXOffset+8,pixelOffset=resYOffset+8;
  tags.find(t=>t[0]===258)[3]=bitsOffset;tags.find(t=>t[0]===273)[3]=pixelOffset;tags.find(t=>t[0]===282)[3]=resXOffset;tags.find(t=>t[0]===283)[3]=resYOffset;
  const out=new Uint8Array(pixelOffset+rgba.length),v=new DataView(out.buffer);out[0]=0x49;out[1]=0x49;v.setUint16(2,42,true);v.setUint32(4,ifdOffset,true);v.setUint16(ifdOffset,tags.length,true);
  tags.forEach((t,i)=>{const p=ifdOffset+2+i*12;v.setUint16(p,t[0],true);v.setUint16(p+2,t[1],true);v.setUint32(p+4,t[2],true);if(t[1]===3&&t[2]===1)v.setUint16(p+8,t[3],true);else v.setUint32(p+8,t[3],true)});
  v.setUint32(ifdOffset+2+tags.length*12,0,true);[8,8,8,8].forEach((n,i)=>v.setUint16(bitsOffset+i*2,n,true));
  v.setUint32(resXOffset,Math.round(dpi),true);v.setUint32(resXOffset+4,1,true);v.setUint32(resYOffset,Math.round(dpi),true);v.setUint32(resYOffset+4,1,true);out.set(rgba,pixelOffset);return new Blob([out],{type:'image/tiff'});
}
const xrSafe=x=>String(x).replace(/[^\w\- ]+/g,'').trim().replace(/\s+/g,'-');
const xrFile=(r,w)=>{const f=expName(r.fmt),base=f.slice(0,-(r.fmt.length+1));return base+(r.sfx?'-'+xrSafe(r.sfx):'')+(w?'-'+(xrSafe(w.n)||'colourway'):'')+'.'+r.fmt};
const frames=()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
// run fn once per colourway (each one showing in turn), then put back the one that was showing
async function xrWays(all,fn){const o=WBS.proj;if(!all||o.cw.length<2)return fn(null);const keep=o.cwa;WBX.wbNoCap=1;
  try{for(let i=0;i<o.cw.length;i++){o.cwa=i;upd();await frames();await fn(o.cw[i])}}finally{const q=WBS.proj;q.cwa=Math.min(keep,q.cw.length-1);upd();await frames();WBX.wbNoCap=0}}
// 2.76.6: one repeat unit (r.rep): a grid repeat is the tile itself; a brick repeat is two rows (the second moved half a tile across, cut at the sides); a half drop is two
// columns (the second moved half a tile down, cut at the top and bottom). Laid side by side, the unit repeats with no seam. xrUnit is its size, xrPlaces where the tile is drawn in it.
const xrUnit=(r,w,h)=>r.rep=='brick'?[w,2*h]:r.rep=='half'?[2*w,h]:[w,h];
const xrPlaces=(r,w,h)=>r.rep=='brick'?[[0,0],[-w/2,h],[w/2,h]]:r.rep=='half'?[[0,0],[w,-h/2],[w,h/2]]:[[0,0]];
// the picture itself, as a Blob
function xrRender(r){return(r.fmt!='svg'&&wmGet()?wmReady():Promise.resolve()).then(()=>xrRender0(r))}
function xrRender0(r){
  return new Promise((res,rej)=>{
    if(r.fmt=='svg')return res(new Blob([ser()],{type:'image/svg+xml'}));
    const [w,h]=r.w>0&&r.h>0?[Math.round(r.w),Math.round(r.h)]:xrDims(xrPx(r.px)),U=xrUnit(r,w,h);if(U[0]*U[1]>XR_AREA)return rej(new Error('That size is too large for this browser. Try a smaller size.'));
    const img=new Image();
    img.onload=()=>{try{const[W,H]=U,c=document.createElement('canvas');c.width=W;c.height=H;const ctx=c.getContext('2d',{willReadFrequently:r.fmt=='tiff'});if(r.fmt=='jpg'||r.fmt=='tiff'||r.fmt=='pdf'){ctx.fillStyle='#fff';ctx.fillRect(0,0,W,H)}
      xrPlaces(r,w,h).forEach(([x,y])=>ctx.drawImage(img,x,y,w,h));if(wmGet())wmDraw(ctx,W,H);if(r.fmt=='tiff'){const im=ctx.getImageData(0,0,W,H);res(xrTiff(im.data,W,H,r.dpi||300));return}
      if(r.fmt=='pdf'){c.toBlob(async b=>{if(!b)return rej(new Error('The picture could not be made at that size.'));try{res(new Blob([pdfJpeg(new Uint8Array(await b.arrayBuffer()),W,H,{W:r.inW||W/300,H:r.inH||H/300,b:0})],{type:'application/pdf'}))}catch(e){rej(e)}},'image/jpeg',.95);return}
      c.toBlob(b=>b?res(b):rej(new Error('The picture could not be made at that size.')),r.fmt=='jpg'?'image/jpeg':'image/png',.92)}catch(e){rej(e)}};
    img.onerror=()=>rej(new Error('The picture could not be made.'));
    img.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(ser());
  });
}
// The Export recipes library is the shared folder tree (2.59.0, owner Oct 27 2026): Starting points is a set, yours sit in Yours and your folders; a click loads a recipe into Custom export,
// its own button exports with it, Export writes a zip of recipe files and Import reads them back.
const xrCfg=()=>({p:'rc',word:'recipe',words:'recipes',ui:XR_UI,rows:true,exportName:'wodblok-export-recipes',exportAs:'recipe files',pane:'#xrpane',trId:'xrl',qId:'rcq',open:['s:Starting points'],
 read(){const d=xrDb(),at={};d.t.forEach(r=>{at[r.id]=r.f});return{f:d.f,at,b:d.b,h:d.h,r:d.r}},
 write(m){const d=xrDb();d.f=m.f;d.t.forEach(r=>{if(r.id in m.at)r.f=m.at[r.id]});d.b=m.b;d.h=m.h;d.r=m.r;xrStore(d)},
 sets:()=>[{k:'s:Starting points',n:'Starting points',ids:XR_BUILTIN.map(r=>r.id)}],
 name:id=>{const r=xrFind(id);return r?r.name:null},own:xrIsOwn,used:()=>false,
 tile:id=>{const r=xrFind(id);return r?`<b>${xrEsc(r.name)}</b><small>${xrSum(r)}</small>`:''},
 act:{icon:ICN.download,label:'Export',run:id=>{const x=xrFind(id);if(!x)return;WBX.wbXrUse(id);WBX.wbXrExport(x)}},
 remove(list){const d=xrDb();d.t=d.t.filter(r=>!list.includes(r.id));xrStore(d);if(XRT)XRT.paintAll(true)},
 rename(id,v){const d=xrDb(),r=d.t.find(x=>x.id===id);if(r){r.name=v;xrStore(d)}},
 file(id){const r=xrFind(id);if(!r)return null;const{f,id:_i,...o}=r;return{name:r.name,data:new TextEncoder().encode(JSON.stringify({app:'WODBLOK',kind:'recipe',...o})),ext:'.wodblok-recipe',fb:'Recipe'}},
 importFile:{ext:'.wodblok-recipe',add(text,g){const o=JSON.parse(text);if(!o||o.app!=='WODBLOK'||o.kind!=='recipe'||!XR_FMT.includes(o.fmt))throw new Error('not a recipe');
  const d=xrDb();if(g){let q='';g.split('/').forEach(part=>{q=q?q+'/'+part:part;if(!d.f.includes(q))d.f.push(q)})}
  const n=String(o.name||'Recipe').replace(/["<>&|]/g,'').slice(0,40);d.t.push({id:newId(),name:n,fmt:o.fmt,px:xrPx(o.px),sfx:String(o.sfx||'').slice(0,24),...(o.fmt=='tiff'?{dpi:+o.dpi==150?150:300}:{}),f:g});xrStore(d);return n},done:()=>{if(XRT)XRT.paintAll(true)}}});
function init43(){
  XRT=ltMake(xrCfg());XRT.init();$('xrpane').innerHTML=XRT.paneHtml();
  const px=$('xrpx'),sfx=$('xrsfx'),nm=$('xrn'),wmEl=$('xrwm');wmEl.checked=wmGet();wmEl.addEventListener('change',()=>wmSet(wmEl.checked));let fmt='png',dpi=300,all=false,busy=false;const dpiEl=$('xrdpi'),dpiRow=$('xrdpirow');
  // 2.76.6: Print size (offered when the canvas has a physical size) exports at that size and resolution instead of a long side
  const psEl=$('xrps'),psOn=()=>!!physOf()&&psEl.checked&&fmt!='svg';
  const cur=()=>{if(psOn()){const P=physOf();return{fmt,px:Math.max(P.pxW,P.pxH),w:P.pxW,h:P.pxH,sfx:sfx.value.trim(),...(fmt=='tiff'?{dpi:P.dpi}:{})}}return{fmt,px:xrPx(px.value),sfx:sfx.value.trim(),...(fmt=='tiff'?{dpi:+(dpiEl&&dpiEl.value)||300}:{})}};
  function dims(){const P=physOf();$('xrpsr').hidden=!P||fmt=='svg';const r=cur(),ps=psOn();$('xrd').textContent=fmt=='svg'?'Vector, any size':(ps?[r.w,r.h]:xrDims(r.px)).join(' × ')+' px'+(ps&&fmt=='tiff'?' · '+P.dpi+' DPI':'');px.disabled=fmt=='svg'||ps;wmEl.disabled=fmt=='svg';if(dpiRow)dpiRow.hidden=fmt!='tiff'||ps;}
  psEl.addEventListener('change',dims);
  function setFmt(f){fmt=f;$('xrf').querySelectorAll('button').forEach(b=>b.classList.toggle('on',b.dataset.f==f));dims()}
  $('xrf').addEventListener('click',e=>{const b=e.target.closest('button');if(b)setFmt(b.dataset.f)});
  px.addEventListener('input',dims);px.addEventListener('change',()=>{px.value=xrPx(px.value);dims()});
  new MutationObserver(dims).observe($('art'),{attributes:true,attributeFilter:['viewBox']});
  const hereF=()=>{const h=XRT?XRT.here():'';return h.startsWith('s:')?'':h};
  const paint=force=>{if(XRT){XRT.show($('xrpane'),'',use1);if(force)XRT.paintAll(true)}};
  // a click on a recipe loads its settings into Custom export; its own button exports with it
  function use1(id){const x=xrFind(id);if(!x)return;setFmt(x.fmt);px.value=xrPx(x.px);sfx.value=x.sfx||'';if(dpiEl)dpiEl.value=String(x.dpi||300);dims()}
  const ways=()=>all&&WBS.proj.cw.length>1;
  async function bundle(list,tail){
    if(busy)return;const d=await use('downloads');if(!d)return pmsg('Saving is not available here.');
    const o=WBS.proj,multi=ways(),total=list.length*(multi?o.cw.length:1);busy=true;
    try{
      const base=expName('zip').replace(/\.zip$/,''),zn=base+(multi?'-colourways.zip':tail),h0=d.pick?await d.pick({filename:zn}):null;   // ask where to save first: the renders below take longer than the browser keeps the click alive
      const files={};let k=0;
      await xrWays(multi,async w=>{for(const r of list){pmsg('Exporting '+(++k)+' of '+total+'…');const b=await xrRender(r);let f=xrFile(r,w),n=2;while(files[f])f=xrFile(r,w).replace(/(\.\w+)$/,'-'+(n++)+'$1');files[f]=new Uint8Array(await b.arrayBuffer())}});
      await d.save({filename:zn,data:new Blob([zipSync(files,{level:0})],{type:'application/zip'}),handle:h0});pmsg('Exported '+total+' file'+(total>1?'s':'')+' in one zip.');
    }catch(e){if(e&&e.code=='declined')return pmsg('');pmsg((e&&e.message)||'Could not export.')}
    finally{busy=false}
  }
  async function exportOne(r){
    if(ways())return bundle([r],'-exports.zip');
    if(busy)return;const d=await use('downloads');if(!d)return pmsg('Saving is not available here.');
    busy=true;
    try{const h0=d.pick?await d.pick({filename:xrFile(r)}):null;pmsg('Exporting…');const b=await xrRender(r);await d.save({filename:xrFile(r),data:b,handle:h0});pmsg('Exported “'+xrFile(r)+'”.')}
    catch(e){if(e&&e.code=='declined')return pmsg('');pmsg((e&&e.message)||'Could not export.')}
    finally{busy=false}
  }
  const exportAll=()=>bundle([...XR_BUILTIN,...xrLoad()],'-exports.zip');
  // which colourways to export: the one showing, or all of them (only offered when there is more than one)
  function scope(v){all=v=='all';$('xrcw').querySelectorAll('button').forEach(b=>b.classList.toggle('on',b.dataset.s==(all?'all':'one')))}
  function ways$(){const n=WBS.proj.cw.length,row=$('xrcwr');row.hidden=n<2;if(n<2&&all)scope('one');$('xrcwall').textContent='All '+n}
  $('xrcw').addEventListener('click',e=>{const b=e.target.closest('button');if(b)scope(b.dataset.s)});
  WBX.wbXrScope=scope;WBX.wbXrUse=use1;WBX.wbXrExport=exportOne;
  const prevPaint=WBX.wbTrayPaint;WBX.wbTrayPaint=f=>{if(prevPaint)prevPaint(f);ways$()};
  new MutationObserver(()=>{ways$();if(!document.querySelector('section.pn[data-p="xrec"]').hidden){paint(true);dims()}}).observe(document.querySelector('section.pn[data-p="xrec"]'),{attributes:true,attributeFilter:['hidden']});
  
  $('xrnow').onclick=()=>exportOne(cur());
  $('png').onclick=()=>exportOne({fmt:'png',px:Math.max(CW,CH)*3,sfx:''});   // Quick: PNG at 3x the canvas, SVG as it is; the same render, watermark and save as a recipe
  $('sv').onclick=()=>exportOne({fmt:'svg',px:2048,sfx:''});
  // 2.76.6: the repeat unit (repeat tile only) at the canvas's physical size and resolution, else at the long side above; a PDF of the artwork at its physical size
  // (else 11 inches on the long side at 300 DPI)
  const sizeNow=()=>{const P=physOf();if(P)return{w:P.pxW,h:P.pxH,dpi:P.dpi,inW:P.inW,inH:P.inH};const[w,h]=xrDims(xrPx(px.value));return{w,h,dpi:+(dpiEl&&dpiEl.value)||300}};
  const repeatOne=f=>{if(!tileOn())return pmsg('The repeat unit is made from a repeat tile: Canvas > Format > Repeat tile.');exportOne({fmt:f,...sizeNow(),sfx:'repeat',rep:tileRk()})};
  $('xrrp').onclick=()=>repeatOne('png');$('xrrt').onclick=()=>repeatOne('tiff');
  $('xrpdf').onclick=()=>{const P=physOf();if(P)return exportOne({fmt:'pdf',w:P.pxW,h:P.pxH,inW:P.inW,inH:P.inH,sfx:''});const k=3300/Math.max(CW,CH),w=Math.round(CW*k),h=Math.round(CH*k);exportOne({fmt:'pdf',w,h,inW:w/300,inH:h/300,sfx:''})};
  WBX.wbXrDims=dims;
  $('xrall').onclick=exportAll;
  $('xrsave').onclick=()=>{
    const d=xrDb();let name=nm.value.trim().slice(0,40);if(!name)name='Recipe '+(d.t.length+1);
    const r={...cur(),name},same=d.t.find(x=>x.name.toLowerCase()==name.toLowerCase());
    if(same)Object.assign(same,r);else{const g=hereF();d.t.push({id:newId(),...r,f:g});if(g&&!d.f.includes(g))d.f.push(g)}
    xrStore(d);nm.value='';paint(true);pmsg((same?'Updated recipe “':'Saved recipe “')+name+'”.');
  };
  if(dpiEl)dpiEl.addEventListener('change',()=>{dpi=+(dpiEl.value)||300});[nm,sfx,px].forEach(i=>i.addEventListener('keydown',e=>{e.stopPropagation();if(e.key=='Enter'&&i===nm)$('xrsave').click()}));
  setFmt('png');paint();ways$();
}
export {init43,xrRender,xrPx};
