import {kv,use} from '../platform/index.js';
import {zipSync} from '../vendor/fflate.js';
import {$} from './01-launch-and-version.js';
import {CH,CW} from './04-canvas-and-stamp-outlines.js';
import {expName,ser} from './14-presets-and-layer-grid-ui.js';
import {newId,pmsg} from './18-projects-and-cover-overlay.js';
// ===== Export recipes =====
// A recipe is a saved set of export settings: format (PNG, JPG or SVG), the long side in pixels, and an ending for the file name.
// Click a recipe to export with it. "Export all" makes every recipe in one zip. Kept with your settings. The Export menu in the top
// bar is unchanged.
const XR_KEY='wb97_exportrecipes',XR_MAX=8192,XR_AREA=64e6;
const XR_BUILTIN=[{id:'b-web',name:'Web',fmt:'png',px:2048,sfx:'web'},{id:'b-print',name:'Print',fmt:'png',px:6000,sfx:'print'},{id:'b-preview',name:'Preview',fmt:'jpg',px:800,sfx:'preview'}];
const xrLoad=()=>{try{const a=JSON.parse(kv.get(XR_KEY)||'[]');return Array.isArray(a)?a.filter(r=>r&&typeof r.id=='string'&&typeof r.name=='string'&&['png','jpg','svg'].includes(r.fmt)):[]}catch(e){return[]}};
const xrStore=a=>{try{kv.set(XR_KEY,JSON.stringify(a))}catch(e){pmsg('Could not keep the recipes in this browser.')}};
const xrPx=v=>Math.min(XR_MAX,Math.max(256,Math.round(+v)||2048));
const xrDims=px=>{const k=px/Math.max(CW,CH);return[Math.round(CW*k),Math.round(CH*k)]};
const xrFile=(r)=>{const f=expName(r.fmt),base=f.slice(0,-(r.fmt.length+1));return base+(r.sfx?'-'+r.sfx.replace(/[^\w\- ]+/g,'').trim().replace(/\s+/g,'-'):'')+'.'+r.fmt};
// the picture itself, as a Blob
function xrRender(r){
  return new Promise((res,rej)=>{
    if(r.fmt=='svg')return res(new Blob([ser()],{type:'image/svg+xml'}));
    const [w,h]=xrDims(xrPx(r.px));if(w*h>XR_AREA)return rej(new Error('That size is too large for this browser. Try a smaller long side.'));
    const img=new Image();
    img.onload=()=>{try{const c=document.createElement('canvas');c.width=w;c.height=h;c.getContext('2d').drawImage(img,0,0,w,h);c.toBlob(b=>b?res(b):rej(new Error('The picture could not be made at that size.')),r.fmt=='jpg'?'image/jpeg':'image/png',.92)}catch(e){rej(e)}};
    img.onerror=()=>rej(new Error('The picture could not be made.'));
    img.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(ser());
  });
}
function init43(){
  const list=$('xrl'),px=$('xrpx'),sfx=$('xrsfx'),nm=$('xrn');let fmt='png',ren=null;
  const cur=()=>({fmt,px:xrPx(px.value),sfx:sfx.value.trim()});
  const sum=r=>r.fmt=='svg'?'SVG':r.fmt.toUpperCase()+' · '+xrPx(r.px)+' px';
  function dims(){const r=cur();$('xrd').textContent=fmt=='svg'?'Vector, any size':xrDims(r.px).join(' × ')+' px';px.disabled=fmt=='svg'}
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
        const a=document.createElement('button');a.type='button';a.className='ib';a.dataset.act='ren';a.setAttribute('aria-label','Rename '+r.name);a.innerHTML=icon('<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M13.5 6.5l4 4"/>');
        const d=document.createElement('button');d.type='button';d.className='ib';d.dataset.act='del';d.setAttribute('aria-label','Delete '+r.name);d.innerHTML=icon('<path d="M5 7h14M10 7V5h4v2M7 7l1 12h8l1-12"/>');
        e.append(a,d);
      }else e.style.gridTemplateColumns='minmax(0,1fr)';
      list.appendChild(e);
    };
    const h1=document.createElement('div');h1.className='xrh';h1.textContent='Starting points';list.appendChild(h1);XR_BUILTIN.forEach(r=>row(r,false));
    if(mine.length){const h2=document.createElement('div');h2.className='xrh';h2.textContent='Yours';list.appendChild(h2);mine.forEach(r=>row(r,true))}
  }
  async function exportOne(r){
    const d=await use('downloads');if(!d)return pmsg('Saving is not available here.');
    try{pmsg('Exporting…');const b=await xrRender(r);await d.save({filename:xrFile(r),data:b});pmsg('Exported “'+xrFile(r)+'”.')}
    catch(e){if(e&&e.code=='declined')return pmsg('');pmsg((e&&e.message)||'Could not export.')}
  }
  async function exportAll(){
    const d=await use('downloads');if(!d)return pmsg('Saving is not available here.');
    const all=[...XR_BUILTIN,...xrLoad()];
    try{
      const files={};let k=0;
      for(const r of all){pmsg('Exporting '+(++k)+' of '+all.length+'…');const b=await xrRender(r);let f=xrFile(r),n=2;while(files[f])f=xrFile(r).replace(/(\.\w+)$/,'-'+(n++)+'$1');files[f]=new Uint8Array(await b.arrayBuffer())}
      const zip=zipSync(files,{level:0}),base=expName('zip').replace(/\.zip$/,'');
      await d.save({filename:base+'-exports.zip',data:new Blob([zip],{type:'application/zip'})});pmsg('Exported '+all.length+' files in one zip.');
    }catch(e){if(e&&e.code=='declined')return pmsg('');pmsg((e&&e.message)||'Could not export.')}
  }
  list.addEventListener('click',e=>{
    const r=e.target.closest('.xrr');if(!r)return;const id=r.dataset.id,btn=e.target.closest('button');
    if(btn&&btn.dataset.act=='del'){xrStore(xrLoad().filter(x=>x.id!=id));paint();return}
    if(btn&&btn.dataset.act=='ren'){ren=id;paint();return}
    if(e.target.closest('input'))return;
    const x=XR_BUILTIN.find(y=>y.id==id)||xrLoad().find(y=>y.id==id);if(!x)return;
    setFmt(x.fmt);px.value=xrPx(x.px);sfx.value=x.sfx||'';dims();exportOne(x);
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
  [nm,sfx,px].forEach(i=>i.addEventListener('keydown',e=>{e.stopPropagation();if(e.key=='Enter'&&i===nm)$('xrsave').click()}));
  setFmt('png');paint();
}
export {init43};
