import {use} from '../platform/index.js';
import {cmdRegister} from '../commands/registry.js';
import {zipSync,zlibSync} from '../vendor/fflate.js';
import {$,WBH,WBS,WBX} from './01-launch-and-version.js';
import {BK} from './03-stamp-prints-and-drawing.js';
import {CH,CW,physOf} from './04-canvas-and-stamp-outlines.js';
import {upd} from './11-pressure-flooding-block-edges.js';
import {expName,ser} from './14-presets-and-layer-grid-ui.js';
import {coreStr,pmsg} from './18-projects-and-cover-overlay.js';
import {cwNow,fixedInUse,hexAlpha,refSlot,slotHex,slotName,trayDone,trayUses,withAlpha} from './50-tray-core.js';
import {vrRecolor} from './53-colourways.js';
// ===== Colour output (2.87.5, docs/pro-basics-plan.md step 5; owner Nov 3 2026: "we need textile printing and screen printing at least"; CMYK a standard
// conversion now, ICC profiles later).
// Separations: one greyscale plate per tray ink used in the design (the paper is not an ink), for screen, block and relief printing and riso. Each plate is the
// design drawn by the app itself with that ink in black and every other tray colour (and the paper) in white, so overprints, knock-outs, opacity and the print
// effects come out as they print. Fixed colours (not linked to the tray) are on no plate. Tints are kept as tones, made solid, or turned into halftone dots.
// Each plate has registration marks, corner marks and the ink's name in a margin, and all plates come in one zip.
// Spot inks: a tray colour can be marked as a spot ink (proj.spot, a list of slot ids; optional, format 30); its plate is named as a spot.
// CMYK: a TIFF (4 channels) or a PDF (DeviceCMYK) at the canvas's print size, by a standard conversion with full black generation (no profile).
// View > Proof colours shows the canvas as those CMYK numbers print with standard process inks on white paper.
const coFrames=()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
async function coIdle(){await coFrames();const t0=performance.now();while(performance.now()-t0<15000&&((!BK.off&&(BK.busy||BK.q.size))||(WBX.wbTexBusy&&WBX.wbTexBusy())))await coFrames();await coFrames()}
const coEsc=t=>String(t).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const coSafe=t=>String(t).replace(/[^\w\- ]+/g,'').trim().replace(/\s+/g,'-')||'ink';
// ---- the inks: tray colours something in the design is linked to, the paper left out
const coPaper=()=>{const o=WBS.proj;return o?refSlot(o.bg):null};
function coInks(){const o=WBS.proj;if(!o)return[];const pp=coPaper();return o.ts.filter(id=>id!==pp&&trayUses(id).length)}
const coSpots=()=>{const o=WBS.proj;return o&&Array.isArray(o.spot)?o.spot.filter(id=>o.ts.includes(id)):[]};
const coIsSpot=id=>coSpots().includes(id);
const coInkName=(id,i)=>slotName(id)||slotHex(id).slice(0,7).toUpperCase()||'Ink '+(i+1);
function coSpotSet(id,on){const o=WBS.proj;if(!o)return;const s=new Set(coSpots());if(on)s.add(id);else s.delete(id);if(s.size)o.spot=[...s];else delete o.spot;trayDone(on?'Marked spot ink':'Unmarked spot ink')}
// ---- the print size: the canvas's own (Canvas > Format), else 300 mm on its long side (as the units do)
function coSize(dpi){const P=physOf();let inW,inH;if(P){inW=P.inW;inH=P.inH}else{const L=300/25.4;inW=CW>=CH?L:L*CW/CH;inH=CH>=CW?L:L*CH/CW}
 return{W:Math.max(1,Math.round(inW*dpi)),H:Math.max(1,Math.round(inH*dpi)),inW,inH}}
const CO_AREA=64e6;
// the design (an SVG string) drawn on white at W x H
function coRaster(svg,W,H,clear){return new Promise((res,rej)=>{if(W*H>CO_AREA)return rej(new Error('That size is too large for this browser. Try a lower resolution.'));
 const img=new Image();img.onload=()=>{try{const c=document.createElement('canvas');c.width=W;c.height=H;const x=c.getContext('2d',{willReadFrequently:true});if(!clear){x.fillStyle='#fff';x.fillRect(0,0,W,H)}x.drawImage(img,0,0,W,H);res(x.getImageData(0,0,W,H))}catch(e){rej(e)}};
 img.onerror=()=>rej(new Error('The picture could not be made.'));img.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg)})}
// draw the design with one colourway made for the moment (each tray colour set by fn(slot id, its colour)); the one showing is put back after
async function coWith(fn,each,run){const o=WBS.proj,keep=o.cwa,base=cwNow(o),tmp={id:'_co',n:'_co',c:{},m:{}};WBX.wbNoCap=1;o.cw.push(tmp);o.cwa=o.cw.length-1;
 try{for(const k of each){o.ts.forEach(id=>{tmp.c[id]=fn(k,id,base.c[id])});upd();await coIdle();await run(k)}}
 finally{const i=o.cw.indexOf(tmp);if(i>=0)o.cw.splice(i,1);o.cwa=Math.min(keep,o.cw.length-1);upd();await coFrames();WBX.wbNoCap=0}}
// one plate: coverage 0..1 per pixel from the drawn greys, then tones, solid or halftone dots; 0 is full ink in the result
function coPlate(im,mode,dpi,lpi){const d=im.data,n=im.width*im.height,out=new Uint8Array(n),W=im.width,cell=Math.max(2,dpi/(lpi||55)),a=22.5*Math.PI/180,ca=Math.cos(a)/cell,sa=Math.sin(a)/cell,T=2*Math.PI;
 for(let i=0,p=0;i<n;i++,p+=4){const cov=1-(.299*d[p]+.587*d[p+1]+.114*d[p+2])/255;let v;
  if(mode=='solid')v=cov>=.5?0:255;
  else if(mode=='dots'){const x=i%W,y=(i/W)|0,u=x*ca+y*sa,w=-x*sa+y*ca,t=(2-Math.cos(T*u)-Math.cos(T*w))/4;v=cov>t&&cov>.004?0:255}
  else v=Math.round(255*(1-cov));out[i]=v}
 return out}
// the plate on its sheet: a margin with registration targets at the middle of each side, corner marks and the ink's name
function coSheet(g,W,H,dpi,marks,label){const m=marks?Math.round(dpi*.5):0,SW=W+2*m,SH=H+2*m,c=document.createElement('canvas');c.width=SW;c.height=SH;const x=c.getContext('2d');
 x.fillStyle='#fff';x.fillRect(0,0,SW,SH);const im=x.createImageData(W,H);for(let i=0,p=0;i<g.length;i++,p+=4){im.data[p]=im.data[p+1]=im.data[p+2]=g[i];im.data[p+3]=255}x.putImageData(im,m,m);
 if(marks){const lw=Math.max(1,Math.round(dpi/200)),r=m*.22,L=m*.36;x.strokeStyle='#000';x.fillStyle='#000';x.lineWidth=lw;
  const tgt=(cx,cy)=>{x.beginPath();x.arc(cx,cy,r,0,2*Math.PI);x.moveTo(cx-L,cy);x.lineTo(cx+L,cy);x.moveTo(cx,cy-L);x.lineTo(cx,cy+L);x.stroke()};
  tgt(SW/2,m/2);tgt(SW/2,SH-m/2);tgt(m/2,SH/2);tgt(SW-m/2,SH/2);
  x.beginPath();[[m,m,-1,-1],[SW-m,m,1,-1],[m,SH-m,-1,1],[SW-m,SH-m,1,1]].forEach(([cx,cy,sx,sy])=>{x.moveTo(cx+sx*m*.15,cy);x.lineTo(cx+sx*m*.75,cy);x.moveTo(cx,cy+sy*m*.15);x.lineTo(cx,cy+sy*m*.75)});x.stroke();
  x.font=`500 ${Math.max(8,Math.round(dpi*8/72))}px "Hanken Grotesk",system-ui,sans-serif`;x.textBaseline='middle';x.fillText(label,m,SH-m/2)}
 return c}
// ---- TIFF (little-endian, one strip, uncompressed): grey (1 channel, 0 = black), RGB (3) or CMYK (4 channels)
function coTiff(px,w,h,spp,dpi){const cmyk=spp==4,tags=[[256,4,1,w],[257,4,1,h],[258,3,spp,0],[259,3,1,1],[262,3,1,cmyk?5:spp==3?2:1],[273,4,1,0],[277,3,1,spp],[278,4,1,h],[279,4,1,px.length],[282,5,1,0],[283,5,1,0],[284,3,1,1],[296,3,1,2],...(cmyk?[[332,3,1,1]]:[])];
 const ifd=8,isz=2+tags.length*12+4,bits=ifd+isz,rx=bits+8,ry=rx+8,pix=ry+8,out=new Uint8Array(pix+px.length),v=new DataView(out.buffer);
 const set=(k,val)=>{tags.find(t=>t[0]===k)[3]=val};set(258,spp==1?8:bits);set(273,pix);set(282,rx);set(283,ry);
 out[0]=0x49;out[1]=0x49;v.setUint16(2,42,true);v.setUint32(4,ifd,true);v.setUint16(ifd,tags.length,true);
 tags.forEach((t,i)=>{const p=ifd+2+i*12;v.setUint16(p,t[0],true);v.setUint16(p+2,t[1],true);v.setUint32(p+4,t[2],true);if(t[1]===3&&t[2]===1)v.setUint16(p+8,t[3],true);else v.setUint32(p+8,t[3],true)});
 v.setUint32(ifd+2+tags.length*12,0,true);for(let i=0;i<4;i++)v.setUint16(bits+i*2,8,true);
 v.setUint32(rx,Math.round(dpi),true);v.setUint32(rx+4,1,true);v.setUint32(ry,Math.round(dpi),true);v.setUint32(ry+4,1,true);out.set(px,pix);return new Blob([out],{type:'image/tiff'})}
// ---- RGB to CMYK, the standard uncalibrated conversion with full black generation; and how those numbers print with process inks (the proof)
function coCmyk(d){const n=d.length/4,o=new Uint8Array(n*4);for(let i=0,p=0;i<n;i++,p+=4){const r=d[p]/255,g=d[p+1]/255,b=d[p+2]/255,k=1-Math.max(r,g,b);
 if(k>=.9999){o[p]=o[p+1]=o[p+2]=0;o[p+3]=255;continue}const s=1-k;o[p]=Math.round(255*(1-r-k)/s);o[p+1]=Math.round(255*(1-g-k)/s);o[p+2]=Math.round(255*(1-b-k)/s);o[p+3]=Math.round(255*k)}return o}
const CO_INK=[[0,174,239],[236,0,140],[255,242,0],[35,31,32]];   // process cyan, magenta, yellow and black on white paper
function coProofPx(d){const c=coCmyk(d);for(let p=0;p<d.length;p+=4){let r=1,g=1,b=1;for(let j=0;j<4;j++){const a=c[p+j]/255,I=CO_INK[j];r*=1-a*(1-I[0]/255);g*=1-a*(1-I[1]/255);b*=1-a*(1-I[2]/255)}
 d[p]=Math.round(255*r);d[p+1]=Math.round(255*g);d[p+2]=Math.round(255*b)}return d}
// ---- a one-page PDF with the CMYK picture (FlateDecode), the page the print size
function coPdf(cmyk,W,H,inW,inH){const enc=new TextEncoder(),pw=(inW*72).toFixed(3),ph=(inH*72).toFixed(3),img=zlibSync(cmyk,{level:6}),parts=[],off=[];let len=0;
 const push=x=>{const u=typeof x=='string'?enc.encode(x):x;parts.push(u);len+=u.length},obj=(n,body,stream)=>{off[n]=len;push(`${n} 0 obj\n${body}\n`);if(stream){push('stream\n');push(stream);push('\nendstream\n')}push('endobj\n')};
 const cs=enc.encode(`q ${pw} 0 0 ${ph} 0 0 cm /Im0 Do Q`);push('%PDF-1.4\n%\xE2\xE3\xCF\xD3\n');
 obj(1,'<< /Type /Catalog /Pages 2 0 R >>');obj(2,'<< /Type /Pages /Kids [3 0 R] /Count 1 >>');
 obj(3,`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pw} ${ph}] /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>`);
 obj(4,`<< /Type /XObject /Subtype /Image /Width ${W} /Height ${H} /ColorSpace /DeviceCMYK /BitsPerComponent 8 /Filter /FlateDecode /Length ${img.length} >>`,img);obj(5,`<< /Length ${cs.length} >>`,cs);
 const x0=len;let xr='xref\n0 6\n0000000000 65535 f \n';for(let i=1;i<=5;i++)xr+=String(off[i]).padStart(10,'0')+' 00000 n \n';push(xr+`trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${x0}\n%%EOF\n`);
 const out=new Uint8Array(len);let p=0;parts.forEach(u=>{out.set(u,p);p+=u.length});return new Blob([out],{type:'application/pdf'})}
// ---- saving
let coBusy=false;
async function coSave(name,blob){const d=await use('downloads');if(!d){pmsg('Saving is not available here.');return false}await d.save({filename:name,data:blob});return true}
const coBase=()=>expName('png').replace(/\.png$/,'');
// the separations: one plate per chosen ink, in one zip
async function coSeparate(o){if(coBusy)return;const d=await use('downloads');if(!d)return pmsg('Saving is not available here.');const inks=o.inks.filter(id=>WBS.proj.ts.includes(id));if(!inks.length)return pmsg('No inks to separate.');
 coBusy=true;const base=coBase(),zn=base+'-separations.zip',files={};let h0=null;
 try{h0=d.pick?await d.pick({filename:zn}):null;const{W,H}=coSize(o.dpi),fx=fixedInUse(),all=WBS.proj.ts.slice(),names=inks.map((id,i)=>coInkName(id,all.indexOf(id)));let k=0;
  await coWith((ink,id,c)=>withAlpha(id===ink?'#000000':'#ffffff',hexAlpha(c)),inks,async ink=>{const i=inks.indexOf(ink);pmsg('Separating '+(++k)+' of '+inks.length+'…');
   let svg=ser();if(fx.length)svg=vrRecolor(svg,new Map(fx.map(h=>[h,'#ffffff'])));
   const im=await coRaster(svg,W,H),g=coPlate(im,o.tint,o.dpi,o.lpi),label=(coIsSpot(ink)?'Spot ':'')+names[i]+'  ·  '+(i+1)+' of '+inks.length,sh=coSheet(g,W,H,o.dpi,o.marks,label);
   const fn=`${base}-${String(i+1).padStart(2,'0')}-${coIsSpot(ink)?'spot-':''}${coSafe(names[i])}.${o.fmt}`;
   let b;if(o.fmt=='tiff'){const x=sh.getContext('2d').getImageData(0,0,sh.width,sh.height).data,gr=new Uint8Array(sh.width*sh.height);for(let j=0,p=0;j<gr.length;j++,p+=4)gr[j]=x[p];b=coTiff(gr,sh.width,sh.height,1,o.dpi)}
   else b=await new Promise((res,rej)=>sh.toBlob(x=>x?res(x):rej(new Error('The plate could not be made at that size.')),'image/png'));
   files[fn]=new Uint8Array(await b.arrayBuffer())});
  await d.save({filename:zn,data:new Blob([zipSync(files,{level:0})],{type:'application/zip'}),handle:h0});pmsg('Exported '+inks.length+' plate'+(inks.length>1?'s':'')+' in one zip.')}
 catch(e){if(e&&e.code=='declined')return pmsg('');pmsg((e&&e.message)||'Could not export.')}finally{coBusy=false}}
// CMYK: the design as it is, at the print size and resolution, converted
async function coCmykOut(fmt){if(coBusy)return;coBusy=true;try{const P=physOf(),dpi=P?P.dpi:300,{W,H,inW,inH}=coSize(dpi);pmsg('Exporting CMYK…');await coIdle();
 const im=await coRaster(ser(),W,H),c=coCmyk(im.data),name=coBase()+'-cmyk.'+fmt;
 if(await coSave(name,fmt=='tiff'?coTiff(c,W,H,4,dpi):coPdf(c,W,H,inW,inH)))pmsg('Exported '+name+'.')}
 catch(e){if(e&&e.code=='declined')return pmsg('');pmsg((e&&e.message)||'Could not export.')}finally{coBusy=false}}
// ---- the Separations dialog: the inks (ticked), format, resolution, tints, halftone lines and marks
const CO_DPI=[[150,'150'],[300,'300'],[600,'600']],CO_LPI=[[35,'35'],[45,'45'],[55,'55'],[65,'65']];
const coOpt={fmt:'png',dpi:300,tint:'dots',lpi:55,marks:true,off:new Set()};
const coSeg=(id,label,opts,cur)=>`<div class="stgr" id="${id}r"><span>${label}</span><div class="seg" id="${id}" role="group" aria-label="${label}" style="--n:${opts.length}">${opts.map(([v,t])=>`<button type="button" data-v="${v}" class="${String(v)===String(cur)?'on':''}" aria-pressed="${String(v)===String(cur)}">${t}</button>`).join('')}</div></div>`;
function coDlgPaint(){const b=$('sepb');if(!b)return;const inks=coInks(),all=WBS.proj.ts;
 b.innerHTML=`<div class="glb">Inks · ${inks.length}</div>`+(inks.length?inks.map(id=>`<div class="stgr sepi"><i style="background:${coEsc(slotHex(id))}"></i><label for="sep_${id}">${coEsc(coInkName(id,all.indexOf(id)))}${coIsSpot(id)?' <b>Spot</b>':''}</label><input type="checkbox" id="sep_${id}" data-ink="${id}"${coOpt.off.has(id)?'':' checked'}></div>`).join(''):'<div class="stgr"><span>None</span></div>')
  +'<div class="glb">Plates</div>'+coSeg('sepf','Format',[['png','PNG'],['tiff','TIFF']],coOpt.fmt)+coSeg('sepr','Resolution',CO_DPI,coOpt.dpi)+coSeg('sept','Tints',[['solid','Solid'],['tone','Tones'],['dots','Halftone']],coOpt.tint)
  +coSeg('sepl','Lines per inch',CO_LPI,coOpt.lpi)+`<div class="stgr"><span>Registration marks</span><button type="button" class="pvc" id="sepm" aria-pressed="${coOpt.marks}" aria-label="Registration marks">${coOpt.marks?'On':'Off'}</button></div>`;
 $('seplr').hidden=coOpt.tint!='dots';$('sepok').disabled=!inks.some(id=>!coOpt.off.has(id))}
const coFrom={el:null};
function coDlgOpen(){const d=$('sepd');if(!d)return;coFrom.el=document.activeElement;try{if(typeof WBX.wbCloseMenus=='function')WBX.wbCloseMenus()}catch(e){}const P=physOf();if(P&&CO_DPI.some(x=>x[0]==P.dpi))coOpt.dpi=P.dpi;coDlgPaint();d.hidden=false;$('sepok').focus()}
function coDlgHide(){$('sepd').hidden=true;const f=coFrom.el;coFrom.el=null;if(f&&f.focus&&document.contains(f))try{f.focus()}catch(e){}}
// ---- View > Proof colours: a picture of the canvas as it prints, laid over the artwork under the selection and guides; redrawn when the document changes
const PRF={on:false,key:'',t:0,busy:false};
function coProofKey(){return coreStr()+'|'+CW+'|'+CH+'|'+(WBS.proj?WBS.proj.cwa:0)}
// the proof's group is made only while the proof is on (just under the guides), so the canvas is unchanged otherwise
function coProofG(on){let g=$('prfg');if(on&&!g){g=document.createElementNS('http://www.w3.org/2000/svg','g');g.id='prfg';g.setAttribute('pointer-events','none');const at=$('guig');at.parentNode.insertBefore(g,at)}if(!on&&g){g.remove();g=null}return g}
async function coProofDraw(){if(!PRF.on||PRF.busy)return;const g=coProofG(true);if(!g)return;if(document.body.classList.contains('stedit')){g.innerHTML='';PRF.key='';return}
 const k=coProofKey();if(k===PRF.key)return;PRF.busy=true;try{await coIdle();const a=$('art').getBoundingClientRect(),s=Math.min(2,window.devicePixelRatio||1),L=Math.min(1600,Math.max(200,Math.round(Math.max(a.width,a.height)*s))),f=L/Math.max(CW,CH),W=Math.round(CW*f),H=Math.round(CH*f);
  const im=await coRaster(ser(),W,H);coProofPx(im.data);const c=document.createElement('canvas');c.width=W;c.height=H;c.getContext('2d').putImageData(im,0,0);
  if(PRF.on&&g.isConnected){g.innerHTML=`<image href="${c.toDataURL('image/png')}" x="0" y="0" width="${CW}" height="${CH}" preserveAspectRatio="none"/>`;PRF.key=coProofKey()}}
 catch(e){}finally{PRF.busy=false}if(PRF.on&&coProofKey()!==PRF.key)coProofSoon()}
const coProofSoon=()=>{clearTimeout(PRF.t);PRF.t=setTimeout(coProofDraw,350)};
function coProof(on){PRF.on=on;PRF.key='';if(WBX.wbExportSync)setTimeout(WBX.wbExportSync,0);if(!on)coProofG(false);if(on)coProofDraw();pmsg(on?'Proof colours on.':'Proof colours off.')}
function init42(){
 $('sepb').addEventListener('click',e=>{const s=e.target.closest('.seg [data-v]');if(s){const id=s.closest('.seg').id,v=s.dataset.v;if(id=='sepf')coOpt.fmt=v;else if(id=='sepr')coOpt.dpi=+v;else if(id=='sept')coOpt.tint=v;else if(id=='sepl')coOpt.lpi=+v;coDlgPaint();return}
  if(e.target.closest('#sepm')){coOpt.marks=!coOpt.marks;coDlgPaint()}});
 $('sepb').addEventListener('change',e=>{const c=e.target.closest('[data-ink]');if(!c)return;if(c.checked)coOpt.off.delete(c.dataset.ink);else coOpt.off.add(c.dataset.ink);$('sepok').disabled=!coInks().some(id=>!coOpt.off.has(id))});
 $('sepok').onclick=()=>{const inks=coInks().filter(id=>!coOpt.off.has(id));coDlgHide();coSeparate({...coOpt,inks})};
 $('sepcx').onclick=coDlgHide;$('sepx').onclick=coDlgHide;$('sepd').addEventListener('click',e=>{if(e.target===$('sepd'))coDlgHide()});
 $('sepd').addEventListener('keydown',e=>{if(e.key=='Escape'){e.preventDefault();e.stopPropagation();coDlgHide()}});
 const d0=WBH.draw;WBH.draw=function(){const r=d0.apply(this,arguments);if(PRF.on&&!PRF.busy)coProofSoon();return r};
 WBX.wbSpot={is:coIsSpot,set:coSpotSet};
 cmdRegister({id:'export.separations',label:'Separations',enabled:()=>!!WBS.proj&&coInks().length>0,run:coDlgOpen});
 cmdRegister({id:'export.cmykTiff',label:'Export CMYK TIFF',run:()=>coCmykOut('tiff')});
 cmdRegister({id:'export.cmykPdf',label:'Export CMYK PDF',run:()=>coCmykOut('pdf')});
 cmdRegister({id:'view.proof',label:'Proof colours',on:()=>PRF.on,run:()=>coProof(!PRF.on)})}
export {init42,coCmyk,coIdle,coInkName,coInks,coIsSpot,coPlate,coRaster,coSize,coSpots,coTiff,coWith};
