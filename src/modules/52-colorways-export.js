import {use} from '../platform/index.js';
import {zipSync} from '../vendor/fflate.js';
import {$,WBS,WBX} from './01-launch-and-version.js';
import {CH,CW} from './04-canvas-and-stamp-outlines.js';
import {ser,expName} from './14-presets-and-layer-grid-ui.js';
import {coreStr,pmsg} from './18-projects-and-cover-overlay.js';

const MAX_SIDE=8192,MAX_AREA=64e6;
const sizeOf=v=>Math.max(256,Math.min(MAX_SIDE,Math.round(+v)||2048));
function dimsOf(px){const k=px/Math.max(CW,CH);return[Math.max(1,Math.round(CW*k)),Math.max(1,Math.round(CH*k))]}
function tiffBlob(rgba,w,h,dpi){
 const tags=[[256,4,1,w],[257,4,1,h],[258,3,4,0],[259,3,1,1],[262,3,1,2],[273,4,1,0],[277,3,1,4],[278,4,1,h],[279,4,1,rgba.length],[282,5,1,0],[283,5,1,0],[284,3,1,1],[296,3,1,2],[338,3,1,2]];
 const ifd=8,ifdSize=2+tags.length*12+4,bits=ifd+ifdSize,resX=bits+8,resY=resX+8,pixels=resY+8;
 tags.find(t=>t[0]===258)[3]=bits;tags.find(t=>t[0]===273)[3]=pixels;tags.find(t=>t[0]===282)[3]=resX;tags.find(t=>t[0]===283)[3]=resY;
 const out=new Uint8Array(pixels+rgba.length),v=new DataView(out.buffer);out[0]=0x49;out[1]=0x49;v.setUint16(2,42,true);v.setUint32(4,ifd,true);v.setUint16(ifd,tags.length,true);
 tags.forEach((t,i)=>{const p=ifd+2+i*12;v.setUint16(p,t[0],true);v.setUint16(p+2,t[1],true);v.setUint32(p+4,t[2],true);if(t[1]===3&&t[2]===1)v.setUint16(p+8,t[3],true);else v.setUint32(p+8,t[3],true)});
 v.setUint32(ifd+2+tags.length*12,0,true);[8,8,8,8].forEach((n,i)=>v.setUint16(bits+i*2,n,true));v.setUint32(resX,Math.round(dpi),true);v.setUint32(resX+4,1,true);v.setUint32(resY,Math.round(dpi),true);v.setUint32(resY+4,1,true);out.set(rgba,pixels);return new Blob([out],{type:'image/tiff'});
}
function fileBase(name){return String(name||'Colorway').replace(/[^\w\- ]+/g,'').trim().replace(/\s+/g,'-').slice(0,60)||'Colorway'}
async function renderColorway(api,original,rec,fmt,px,dpi){
 const next=api.apply(original,rec);if(!next)throw new Error('Could not apply '+rec.name+'.');
 try{
  WBX.wbApply(api.toProject(next,false));
  const svg=ser();
  if(fmt==='svg')return new Blob([svg],{type:'image/svg+xml'});
  const [w,h]=dimsOf(sizeOf(px));if(w*h>MAX_AREA)throw new Error('Export size is too large for this browser. Choose a smaller long side.');
  const img=new Image();
  const loaded=new Promise((resolve,reject)=>{img.onload=resolve;img.onerror=()=>reject(new Error('Could not render '+rec.name+'.'))});
  img.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg);await loaded;
  const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;const ctx=canvas.getContext('2d',{willReadFrequently:fmt==='tiff'});if(!ctx)throw new Error('Canvas export is unavailable.');
  ctx.drawImage(img,0,0,w,h);
  if(fmt==='tiff')return tiffBlob(ctx.getImageData(0,0,w,h).data,w,h,dpi);
  return await new Promise((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(new Error('Could not create '+fmt.toUpperCase()+' output.')),fmt==='jpg'?'image/jpeg':'image/png',.92));
 }finally{WBX.wbApply(original);api.clearTemporary()}
}
function init52(){
 const selectedBtn=$('cw-export-selected'),allBtn=$('cw-export-all'),fmtEl=$('cw-format'),sizeEl=$('cw-size'),dpiEl=$('cw-dpi'),note=$('cw-export-note'),list=$('cw-list');
 if(!selectedBtn||!allBtn||!WBX.wbColorways)return;
 const setNote=s=>{if(note)note.textContent=s};
 const picked=()=>[...list.querySelectorAll('.cw-pick:checked')].map(e=>e.value);
 async function run(all){
  const api=WBX.wbColorways,records=api.list(),ids=all?records.map(r=>r.id):picked(),items=records.filter(r=>ids.includes(r.id));
  if(!items.length){setNote(all?'No saved colorways to export.':'Select one or more colorways first.');return}
  const fmt=fmtEl.value,px=sizeOf(sizeEl.value),dpi=+dpiEl.value||300;
  const downloads=await use('downloads');if(!downloads){setNote('Saving is not available in this browser.');return}
  const filename=expName('zip').replace(/\.zip$/,'')+'-colorways.zip';
  try{
   const handle=downloads.pick?await downloads.pick({filename}):null,files={};
   for(let i=0;i<items.length;i++){
    setNote('Rendering '+(i+1)+' of '+items.length+': '+items[i].name);
    const blob=await renderColorway(api,JSON.parse(coreStr()),items[i],fmt,px,dpi);
    let path=fileBase(items[i].name)+'.'+(fmt==='jpg'?'jpg':fmt),n=2,base=path;
    while(files[path])path=base.replace(/(\.\w+)$/,'-'+(n++)+'$1');
    files[path]=new Uint8Array(await blob.arrayBuffer());
   }
   const bytes=zipSync(files,{level:0});
   await downloads.save({filename,data:new Blob([bytes],{type:'application/zip'}),handle});
   setNote('Exported '+items.length+' colorway'+(items.length===1?'':'s')+' to ZIP.');
   pmsg('Exported '+items.length+' colorways to ZIP.');
  }catch(e){if(e&&e.code==='declined'){setNote('Export cancelled.');return}setNote((e&&e.message)||'Could not export colorways.')}
 }
 selectedBtn.addEventListener('click',()=>run(false));
 allBtn.addEventListener('click',()=>run(true));
 fmtEl.addEventListener('change',()=>{sizeEl.disabled=fmtEl.value==='svg';dpiEl.disabled=fmtEl.value!=='tiff'});
 sizeEl.addEventListener('change',()=>{sizeEl.value=sizeOf(sizeEl.value)});
 sizeEl.disabled=fmtEl.value==='svg';dpiEl.disabled=fmtEl.value!=='tiff';
 WBX.wbColorwaysExport={fileBase,sizeOf,dimsOf};
}
export {init52,fileBase,sizeOf,dimsOf};
