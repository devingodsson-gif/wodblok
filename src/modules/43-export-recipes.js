import {ICN} from './00-icons.js';
import {kv,use} from '../platform/index.js';
import {zipSync} from '../vendor/fflate.js';
import {$,WBS,WBX} from './01-launch-and-version.js';
import {CH,CW} from './04-canvas-and-stamp-outlines.js';
import {upd} from './11-pressure-flooding-block-edges.js';
import {expName,ser} from './14-presets-and-layer-grid-ui.js';
import {newId,pmsg} from './18-projects-and-cover-overlay.js';
import {wmGet,wmSet,wmReady,wmDraw} from './56-watermark.js';
// ===== Export recipes =====
// A recipe is a saved set of export settings: format, long side in pixels, TIFF DPI, and file-name ending.
// Click a recipe to export with it. "Export all" makes every recipe in one zip. With more than one colourway, "Colourways: All" makes each
// export once per colourway (one zip, each file named after its colourway). Kept with your settings. The Export menu in the top
// bar is unchanged.
const XR_KEY='wb97_exportrecipes',XR_MAX=8192,XR_AREA=64e6;
const XR_BUILTIN=[{id:'b-web',name:'Web',fmt:'png',px:2048,sfx:'web'},{id:'b-print',name:'Print',fmt:'png',px:6000,sfx:'print'},{id:'b-preview',name:'Preview',fmt:'jpg',px:800,sfx:'preview'}];
const xrLoad=()=>{try{const a=JSON.parse(kv.get(XR_KEY)||'[]');return Array.isArray(a)?a.filter(r=>r&&typeof r.id=='string'&&typeof r.name=='string'&&['png','jpg','svg','tiff'].includes(r.fmt)):[]}catch(e){return[]}};
const xrStore=a=>{try{kv.set(XR_KEY,JSON.stringify(a))}catch(e){pmsg('Could not keep the recipes in this browser.')}};
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
// the picture itself, as a Blob
function xrRender(r){return(r.fmt!='svg'&&wmGet()?wmReady():Promise.resolve()).then(()=>xrRender0(r))}
function xrRender0(r){
  return new Promise((res,rej)=>{
    if(r.fmt=='svg')return res(new Blob([ser()],{type:'image/svg+xml'}));
    const [w,h]=xrDims(xrPx(r.px));if(w*h>XR_AREA)return rej(new Error('That size is too large for this browser. Try a smaller long side.'));
    const img=new Image();
    img.onload=()=>{try{const c=document.createElement('canvas');c.width=w;c.height=h;const ctx=c.getContext('2d',{willReadFrequently:r.fmt=='tiff'});if(r.fmt=='jpg'||r.fmt=='tiff'){ctx.fillStyle='#fff';ctx.fillRect(0,0,w,h)}ctx.drawImage(img,0,0,w,h);if(wmGet())wmDraw(ctx,w,h);if(r.fmt=='tiff'){const im=ctx.getImageData(0,0,w,h);res(xrTiff(im.data,w,h,r.dpi||300));return}c.toBlob(b=>b?res(b):rej(new Error('The picture could not be made at that size.')),r.fmt=='jpg'?'image/jpeg':'image/png',.92)}catch(e){rej(e)}};
    img.onerror=()=>rej(new Error('The picture could not be made.'));
    img.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(ser());
  });
}
function init43(){
  const list=$('xrl'),px=$('xrpx'),sfx=$('xrsfx'),nm=$('xrn'),wmEl=$('xrwm');wmEl.checked=wmGet();wmEl.addEventListener('change',()=>wmSet(wmEl.checked));let fmt='png',ren=null,dpi=300,all=false,busy=false;const dpiEl=$('xrdpi'),dpiRow=$('xrdpirow');
  const cur=()=>({fmt,px:xrPx(px.value),sfx:sfx.value.trim(),...(fmt=='tiff'?{dpi:+(dpiEl&&dpiEl.value)||300}:{})});
  const sum=r=>r.fmt=='svg'?'SVG':r.fmt.toUpperCase()+' · '+xrPx(r.px)+' px'+(r.fmt=='tiff'?' · '+(r.dpi||300)+' DPI':'');
  function dims(){const r=cur();$('xrd').textContent=fmt=='svg'?'Vector, any size':xrDims(r.px).join(' × ')+' px';px.disabled=fmt=='svg';wmEl.disabled=fmt=='svg';if(dpiRow)dpiRow.hidden=fmt!='tiff'}
  function setFmt(f){fmt=f;$('xrf').querySelectorAll('button').forEach(b=>b.classList.toggle('on',b.dataset.f==f));dims()}
  $('xrf').addEventListener('click',e=>{const b=e.target.closest('button');if(b)setFmt(b.dataset.f)});
  px.addEventListener('input',dims);px.addEventListener('change',()=>{px.value=xrPx(px.value);dims()});
  new MutationObserver(dims).observe($('art'),{attributes:true,attributeFilter:['viewBox']});
  const icon=d=>`<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;
  function paint(){
    list.textContent='';const mine=xrLoad();
    const row=(r,own)=>{
      const e=document.createElement('div');e.className='xrr';e.dataset.id=r.id;e.setAttribute('role','listitem');e.tabIndex=0;
      if(own&&ren==r.id){
        const i=document.createElement('input');i.type='text';i.maxLength=40;i.value=r.name;i.setAttribute('aria-label','Recipe name');e.style.gridTemplateColumns='minmax(0,1fr)';e.appendChild(i);
        const done=ok=>{if(ren!=r.id)return;ren=null;if(ok&&i.value.trim()){const a=xrLoad(),x=a.find(y=>y.id==r.id);if(x){x.name=i.value.trim().slice(0,40);xrStore(a)}}paint()};
        i.addEventListener('keydown',ev=>{ev.stopPropagation();if(ev.key=='Enter')done(true);else if(ev.key=='Escape')done(false)});i.addEventListener('blur',()=>done(true));
        list.appendChild(e);setTimeout(()=>{i.focus();i.select()},0);return;
      }
      const t=document.createElement('div'),b=document.createElement('b'),s=document.createElement('small');b.textContent=r.name;s.textContent=sum(r);t.append(b,s);e.appendChild(t);
      if(own){
        const a=document.createElement('button');a.type='button';a.className='ib';a.dataset.act='ren';a.setAttribute('aria-label','Rename '+r.name);a.innerHTML=icon(ICN.pencil);
        const d=document.createElement('button');d.type='button';d.className='ib';d.dataset.act='del';d.setAttribute('aria-label','Delete '+r.name);d.innerHTML=icon(ICN.trash);
        e.append(a,d);
      }else e.style.gridTemplateColumns='minmax(0,1fr)';
      list.appendChild(e);
    };
    const h1=document.createElement('div');h1.className='glb';h1.textContent='Starting points';list.appendChild(h1);XR_BUILTIN.forEach(r=>row(r,false));
    if(mine.length){const h2=document.createElement('div');h2.className='glb';h2.textContent='Yours';list.appendChild(h2);mine.forEach(r=>row(r,true))}
  }
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
  WBX.wbXrScope=scope;
  const prevPaint=WBX.wbTrayPaint;WBX.wbTrayPaint=f=>{if(prevPaint)prevPaint(f);ways$()};
  new MutationObserver(ways$).observe(document.querySelector('section.pn[data-p="xrec"]'),{attributes:true,attributeFilter:['hidden']});
  list.addEventListener('click',e=>{
    const r=e.target.closest('.xrr');if(!r)return;const id=r.dataset.id,btn=e.target.closest('button');
    if(btn&&btn.dataset.act=='del'){xrStore(xrLoad().filter(x=>x.id!=id));paint();return}
    if(btn&&btn.dataset.act=='ren'){ren=id;paint();return}
    if(e.target.closest('input'))return;
    const x=XR_BUILTIN.find(y=>y.id==id)||xrLoad().find(y=>y.id==id);if(!x)return;
    setFmt(x.fmt);px.value=xrPx(x.px);sfx.value=x.sfx||'';if(dpiEl)dpiEl.value=String(x.dpi||300);dims();exportOne(x);
  });
  list.addEventListener('keydown',e=>{if((e.key=='Enter'||e.key==' ')&&e.target.classList&&e.target.classList.contains('xrr')){e.preventDefault();e.target.click()}});
  $('xrnow').onclick=()=>exportOne(cur());
  $('xrall').onclick=exportAll;
  $('xrsave').onclick=()=>{
    const a=xrLoad();let name=nm.value.trim().slice(0,40);if(!name)name='Recipe '+(a.length+1);
    const r={...cur(),name},same=a.find(x=>x.name.toLowerCase()==name.toLowerCase());
    if(same)Object.assign(same,r);else a.push({id:newId(),...r});
    xrStore(a);nm.value='';paint();pmsg((same?'Updated recipe “':'Saved recipe “')+name+'”.');
  };
  if(dpiEl)dpiEl.addEventListener('change',()=>{dpi=+(dpiEl.value)||300});[nm,sfx,px].forEach(i=>i.addEventListener('keydown',e=>{e.stopPropagation();if(e.key=='Enter'&&i===nm)$('xrsave').click()}));
  setFmt('png');paint();ways$();
}
export {init43,xrRender,xrPx};
