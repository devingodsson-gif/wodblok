import {kv,use} from '../platform/index.js';
import {cmdGet,cmdIsEnabled,cmdRegister,cmdRun} from '../commands/registry.js';
import {zlibSync} from '../vendor/fflate.js';
import {$,WBH,WBS,WBX} from './01-launch-and-version.js';
import {tileOn,tileRk} from './04-canvas-and-stamp-outlines.js';
import {store} from './06-motif-library-folders.js';
import {upd} from './11-pressure-flooding-block-edges.js';
import {expName,ser} from './14-presets-and-layer-grid-ui.js';
import {pmsg} from './18-projects-and-cover-overlay.js';
import {fpHid} from './25-art-layers.js';
import {lyNm} from './32-layers-panel.js';
import {coCmyk,coIdle,coInkName,coInks,coIsSpot,coPlate,coRaster,coSize,coSpots,coTiff,coWith} from './42-colour-output.js';
import {hexAlpha,slotHex,withAlpha} from './50-tray-core.js';
import {unFmt,unFrom,unGet,unParse,unTo} from './98-units.js';
// ===== Print files (2.87.6, docs/pro-basics-plan.md step 6).
// Bleed: Canvas > Canvas size > Bleed, in the chosen units, kept as WBS.dim.bl in inches (optional; format 30), for every canvas but the book cover, which has its own.
// The app draws only inside the canvas, so the bleed is made at export: a repeat tile (grid repeat) carries on into it as it repeats; any other canvas is mirrored
// outwards at its edges, so the background and anything touching the edge run on into the bleed without a seam.
// Export > Print file…: a PDF (RGB or CMYK, MediaBox, BleedBox and TrimBox set, crop and registration marks drawn in the Registration colour, spot inks as their
// own Separation plates printed over the rest), a TIFF (RGB or CMYK, with the bleed and marks), or a layered PSD (one layer per element, bottom to top, each drawn
// alone without the canvas texture; optionally one spot channel per tray ink, for textile and screen printing). All written here, with no new library.
const PR_SLUG=.5;   // inches of margin for the marks
const prBleedIn=()=>WBS.book&&WBS.book.on?0:Math.max(0,Math.min(1,+((WBS.dim||{}).bl)||0));
const prBusy={on:false};
// ---- bleed: extend a W x H picture by b pixels on every side (wrap for a grid repeat tile, else mirror)
function prBleed(src,b){const W=src.width,H=src.height,c=document.createElement('canvas');c.width=W+2*b;c.height=H+2*b;const x=c.getContext('2d');x.drawImage(src,b,b);if(!b)return c;
 if(tileOn()&&tileRk()=='grid'){for(let i=-1;i<=1;i++)for(let j=-1;j<=1;j++)if(i||j)x.drawImage(src,b+i*W,b+j*H);return c}
 const m=(sx,sy,sw,sh,dx,dy,fx,fy)=>{x.save();x.translate(dx+(fx?sw:0),dy+(fy?sh:0));x.scale(fx?-1:1,fy?-1:1);x.drawImage(src,sx,sy,sw,sh,0,0,sw,sh);x.restore()};
 const bw=Math.min(b,W),bh=Math.min(b,H);
 m(0,0,bw,H,b-bw,b,1,0);m(W-bw,0,bw,H,b+W,b,1,0);m(0,0,W,bh,b,b-bh,0,1);m(0,H-bh,W,bh,b,b+H,0,1);
 m(0,0,bw,bh,b-bw,b-bh,1,1);m(W-bw,0,bw,bh,b+W,b-bh,1,1);m(0,H-bh,bw,bh,b-bw,b+H,1,1);m(W-bw,H-bh,bw,bh,b+W,b+H,1,1);return c}
const prCanvas=im=>{const c=document.createElement('canvas');c.width=im.width;c.height=im.height;c.getContext('2d').putImageData(im,0,0);return c};
// ---- the marks, in sheet pixels: crop marks at the trim corners (outside the bleed) and registration targets at the middle of each side
function prMarks(W,H,b,s,dpi,crop,reg){const L=[],C=[],t0=s,t1=s+b,ox=s+b+W,oy=s+b+H,sw=2*(s+b)+W,sh=2*(s+b)+H,g=Math.max(b,dpi*.06),len=Math.max(dpi*.2,s-g-dpi*.05);
 if(crop)[[t1,t1,-1,-1],[ox,t1,1,-1],[t1,oy,-1,1],[ox,oy,1,1]].forEach(([x,y,dx,dy])=>{L.push([x+dx*g,y,x+dx*(g+len),y]);L.push([x,y+dy*g,x,y+dy*(g+len)])});
 if(reg&&s>0){const r=s*.22,l=s*.36;[[sw/2,t0/2],[sw/2,sh-t0/2],[t0/2,sh/2],[sw-t0/2,sh/2]].forEach(([x,y])=>{C.push([x,y,r]);L.push([x-l,y,x+l,y]);L.push([x,y-l,x,y+l])})}
 return{L,C,lw:Math.max(1,dpi/300)}}
function prDrawMarks(x,M){x.strokeStyle='#000';x.lineWidth=M.lw;x.beginPath();M.L.forEach(([a,b,c,d])=>{x.moveTo(a,b);x.lineTo(c,d)});M.C.forEach(([a,b,r])=>{x.moveTo(a+r,b);x.arc(a,b,r,0,2*Math.PI)});x.stroke()}
// ---- the sheet: the design with its bleed, on a margin for the marks when there are any; spot plates (coverage, 255 = full ink) laid out the same way
async function prSheet(o){const{W,H,inW,inH}=coSize(o.dpi),b=Math.round(prBleedIn()*o.dpi),s=o.crop||o.reg?Math.round(PR_SLUG*o.dpi):0,SW=W+2*b+2*s,SH=H+2*b+2*s;
 const spots=o.spots?coSpots().filter(id=>coInks().includes(id)):[];let base=null;const plates=[];
 if(spots.length){await coWith((k,id,c)=>spots.includes(id)?withAlpha('#ffffff',hexAlpha(c)):c,[0],async()=>{base=await coRaster(ser(),W,H)});
  await coWith((ink,id,c)=>withAlpha(id===ink?'#000000':'#ffffff',hexAlpha(c)),spots,async ink=>{const im=await coRaster(ser(),W,H),g=coPlate(im,'tone',o.dpi),pc=document.createElement('canvas');pc.width=W;pc.height=H;
   const pd=pc.getContext('2d').createImageData(W,H);for(let i=0,p=0;i<g.length;i++,p+=4){pd.data[p]=pd.data[p+1]=pd.data[p+2]=g[i];pd.data[p+3]=255}pc.getContext('2d').putImageData(pd,0,0);
   const e=prBleed(pc,b).getContext('2d').getImageData(0,0,W+2*b,H+2*b).data,cov=new Uint8Array((W+2*b)*(H+2*b));for(let i=0,p=0;i<cov.length;i++,p+=4)cov[i]=255-e[p];plates.push({id:ink,cov})})}
 else{await coIdle();base=await coRaster(ser(),W,H)}
 const sheet=document.createElement('canvas');sheet.width=SW;sheet.height=SH;const x=sheet.getContext('2d');x.fillStyle='#fff';x.fillRect(0,0,SW,SH);x.drawImage(prBleed(prCanvas(base),b),s,s);
 return{sheet,W,H,b,s,SW,SH,inW,inH,plates,M:prMarks(W,H,b,s,o.dpi,o.crop,o.reg)}}
// ---- PDF: one page; the picture over the bleed box (DeviceRGB or DeviceCMYK, Flate), each spot plate as a Separation image printed over it, the marks as lines
function prPdf(S,o){const enc=new TextEncoder(),k=72/o.dpi,P=v=>(v*k).toFixed(3),pw=P(S.SW),ph=P(S.SH),parts=[],off=[];let len=0,n=0;
 const push=u=>{u=typeof u=='string'?enc.encode(u):u;parts.push(u);len+=u.length},obj=(body,stream)=>{const id=++n;off[id]=len;push(`${id} 0 obj\n${body}\n`);if(stream){push('stream\n');push(stream);push('\nendstream\n')}push('endobj\n');return id};
 push('%PDF-1.4\n%\xE2\xE3\xCF\xD3\n');const reserve=()=>++n;
 const cat=reserve(),pages=reserve(),page=reserve();
 // the picture of the bleed box
 const bw=S.W+2*S.b,bh=S.H+2*S.b,px=S.sheet.getContext('2d').getImageData(S.s,S.s,bw,bh).data;let data,cs;
 if(o.cm=='cmyk'){data=coCmyk(px);cs='/DeviceCMYK'}else{data=new Uint8Array(bw*bh*3);for(let i=0,p=0;p<px.length;p+=4){data[i++]=px[p];data[i++]=px[p+1];data[i++]=px[p+2]}cs='/DeviceRGB'}
 const im0=zlibSync(data,{level:6}),img0=obj(`<< /Type /XObject /Subtype /Image /Width ${bw} /Height ${bh} /ColorSpace ${cs} /BitsPerComponent 8 /Filter /FlateDecode /Length ${im0.length} >>`,im0);
 // Registration (every plate) for the marks, and one Separation per spot ink, its look in CMYK from its tray colour
 const sep=(name,c)=>{const f=obj(`<< /FunctionType 2 /Domain [0 1] /C0 [0 0 0 0] /C1 [${c.map(v=>(v/255).toFixed(4)).join(' ')}] /N 1 >>`);return`[/Separation /${name} /DeviceCMYK ${f} 0 R]`};
 const allCs=sep('All',[255,255,255,255]),spots=S.plates.map((pl,i)=>{const h=slotHex(pl.id),c=coCmyk(new Uint8Array([parseInt(h.slice(1,3),16),parseInt(h.slice(3,5),16),parseInt(h.slice(5,7),16),255])),nm=coInkName(pl.id,i).replace(/[^\w\-]+/g,'_')||'Spot'+(i+1);
  const z=zlibSync(pl.cov,{level:6}),csx=sep(nm,[...c]);return{img:obj(`<< /Type /XObject /Subtype /Image /Width ${bw} /Height ${bh} /ColorSpace ${csx} /BitsPerComponent 8 /Filter /FlateDecode /Length ${z.length} >>`,z),nm}});
 const gs=obj('<< /Type /ExtGState /OP true /op true /OPM 1 >>');
 const csAll=obj(allCs);
 let c=`q ${P(bw)} 0 0 ${P(bh)} ${P(S.s)} ${P(S.s)} cm /Im0 Do Q\n`;spots.forEach((sp,i)=>{c+=`q /GS0 gs ${P(bw)} 0 0 ${P(bh)} ${P(S.s)} ${P(S.s)} cm /Sp${i} Do Q\n`});
 if(S.M.L.length||S.M.C.length){const Y=v=>P(S.SH-v);c+=`q /GS0 gs /CSA CS 1 SCN ${(S.M.lw*k).toFixed(3)} w\n`;S.M.L.forEach(([a,b,cc,d])=>{c+=`${P(a)} ${Y(b)} m ${P(cc)} ${Y(d)} l S\n`});
  S.M.C.forEach(([a,b,r])=>{const K=.5523*r,x0=a,y0=b;c+=`${P(x0+r)} ${Y(y0)} m ${P(x0+r)} ${Y(y0-K)} ${P(x0+K)} ${Y(y0-r)} ${P(x0)} ${Y(y0-r)} c ${P(x0-K)} ${Y(y0-r)} ${P(x0-r)} ${Y(y0-K)} ${P(x0-r)} ${Y(y0)} c ${P(x0-r)} ${Y(y0+K)} ${P(x0-K)} ${Y(y0+r)} ${P(x0)} ${Y(y0+r)} c ${P(x0+K)} ${Y(y0+r)} ${P(x0+r)} ${Y(y0+K)} ${P(x0+r)} ${Y(y0)} c S\n`});c+='Q\n'}
 const cb=enc.encode(c),cont=obj(`<< /Length ${cb.length} >>`,cb);
 const xo=`/Im0 ${img0} 0 R`+spots.map((sp,i)=>` /Sp${i} ${sp.img} 0 R`).join(''),bb=`${P(S.s)} ${P(S.s)} ${P(S.s+bw)} ${P(S.s+bh)}`,tb=`${P(S.s+S.b)} ${P(S.s+S.b)} ${P(S.s+S.b+S.W)} ${P(S.s+S.b+S.H)}`;
 const put=(id,body)=>{off[id]=len;push(`${id} 0 obj\n${body}\nendobj\n`)};
 put(cat,`<< /Type /Catalog /Pages ${pages} 0 R >>`);put(pages,`<< /Type /Pages /Kids [${page} 0 R] /Count 1 >>`);
 put(page,`<< /Type /Page /Parent ${pages} 0 R /MediaBox [0 0 ${pw} ${ph}] /BleedBox [${bb}] /TrimBox [${tb}] /Resources << /XObject << ${xo} >> /ExtGState << /GS0 ${gs} 0 R >> /ColorSpace << /CSA ${csAll} 0 R >> >> /Contents ${cont} 0 R >>`);
 const x0=len;let xr=`xref\n0 ${n+1}\n0000000000 65535 f \n`;for(let i=1;i<=n;i++)xr+=String(off[i]).padStart(10,'0')+' 00000 n \n';push(xr+`trailer\n<< /Size ${n+1} /Root ${cat} 0 R >>\nstartxref\n${x0}\n%%EOF\n`);
 const out=new Uint8Array(len);let p=0;parts.forEach(u=>{out.set(u,p);p+=u.length});return new Blob([out],{type:'application/pdf'})}
// ---- PSD: PackBits rows, then the file (RGB, 8 bits): resolution, spot channel names and kinds, the layers, the merged picture and the spot channels
function prPack(row){const out=[];let i=0;const n=row.length;while(i<n){let j=i;while(j<n-1&&j-i<127&&row[j]===row[j+1])j++;
  if(j>i){out.push(257-(j-i+1),row[i]);i=j+1;continue}let k=i;while(k<n&&k-i<128&&!(k<n-2&&row[k]===row[k+1]&&row[k]===row[k+2]))k++;if(k==i)k=i+1;out.push(k-i-1);for(let q=i;q<k;q++)out.push(row[q]);i=k}
 return Uint8Array.from(out)}
// one channel (a plane of w x h bytes) as RLE: [row byte counts], [rows]
function prRle(plane,w,h){const rows=[];let tot=0;for(let y=0;y<h;y++){const r=prPack(plane.subarray(y*w,(y+1)*w));rows.push(r);tot+=r.length}return{rows,tot}}
class PrBuf{constructor(){this.a=[];this.n=0}u8(v){this.a.push(Uint8Array.of(v&255));this.n++}u16(v){const b=new Uint8Array(2);new DataView(b.buffer).setUint16(0,v);this.a.push(b);this.n+=2}i16(v){const b=new Uint8Array(2);new DataView(b.buffer).setInt16(0,v);this.a.push(b);this.n+=2}
 u32(v){const b=new Uint8Array(4);new DataView(b.buffer).setUint32(0,v>>>0);this.a.push(b);this.n+=4}i32(v){const b=new Uint8Array(4);new DataView(b.buffer).setInt32(0,v);this.a.push(b);this.n+=4}bytes(u){this.a.push(u);this.n+=u.length}str(s){this.bytes(new TextEncoder().encode(s))}
 pas(s,pad){const t=new TextEncoder().encode(s).slice(0,255);let L=1+t.length;this.u8(t.length);this.bytes(t);while(L%pad){this.u8(0);L++}}blob(){return new Blob(this.a,{type:'image/vnd.adobe.photoshop'})}}
function prPsd(W,H,dpi,layers,merged,inks){const B=new PrBuf(),nch=3+inks.length;B.str('8BPS');B.u16(1);B.bytes(new Uint8Array(6));B.u16(nch);B.u32(H);B.u32(W);B.u16(8);B.u16(3);B.u32(0);
 // image resources: 1005 resolution; 1006 channel names and 1077 display info for the spot channels
 const R=new PrBuf(),res=(id,body)=>{R.str('8BIM');R.u16(id);R.u16(0);R.u32(body.n);R.bytes(new Uint8Array(0));body.a.forEach(u=>R.bytes(u));if(body.n%2)R.u8(0)};
 {const r=new PrBuf(),fx=Math.round(dpi*65536);r.u32(fx);r.u16(1);r.u16(1);r.u32(fx);r.u16(1);r.u16(1);res(1005,r)}
 if(inks.length){const nm=new PrBuf();inks.forEach(k=>nm.pas(k.name,1));res(1006,nm);const di=new PrBuf();di.u32(1);inks.forEach(k=>{di.u16(0);k.rgb.forEach(v=>di.u16(v*257));di.u16(0);di.u16(100);di.u8(2)});res(1077,di)}
 B.u32(R.n);R.a.forEach(u=>B.bytes(u));
 // layers: each cropped to what it covers; channels alpha (-1), red, green and blue
 const L=new PrBuf(),recs=[],data=[];layers.forEach(ly=>{const{w,h,x0,y0,px}=ly,planes=[3,0,1,2].map(c=>{const p=new Uint8Array(w*h);for(let i=0,q=c;i<p.length;i++,q+=4)p[i]=px[q];return p}),ch=planes.map(p=>prRle(p,w,h));
  const r=new PrBuf();r.i32(y0);r.i32(x0);r.i32(y0+h);r.i32(x0+w);r.u16(4);[-1,0,1,2].forEach((id,i)=>{r.i16(id);r.u32(2+h*2+ch[i].tot)});r.str('8BIMnorm');r.u8(255);r.u8(0);r.u8(0);r.u8(0);
  const ex=new PrBuf();ex.u32(0);ex.u32(0);ex.pas(ly.name.replace(/[^\x20-\x7e]/g,'?'),4);{const nm=String(ly.name),u=new PrBuf();u.u32(nm.length);for(let i=0;i<nm.length;i++)u.u16(nm.charCodeAt(i));if(u.n%2)u.u8(0);ex.str('8BIMluni');ex.u32(u.n);u.a.forEach(z=>ex.bytes(z))}   /* the name in Unicode too (luni), as Photoshop reads it */r.u32(ex.n);ex.a.forEach(u=>r.bytes(u));recs.push(r);data.push(ch.map(c=>c))});
 const li=new PrBuf();li.i16(layers.length);recs.forEach(r=>r.a.forEach(u=>li.bytes(u)));data.forEach(chs=>chs.forEach(c=>{li.u16(1);c.rows.forEach(r=>li.u16(r.length));c.rows.forEach(r=>li.bytes(r))}));if(li.n%2)li.u8(0);
 L.u32(li.n);li.a.forEach(u=>L.bytes(u));L.u32(0);B.u32(L.n);L.a.forEach(u=>B.bytes(u));
 // the merged picture (and the spot channels), RLE
 const planes=[0,1,2].map(c=>{const p=new Uint8Array(W*H);for(let i=0,q=c;i<p.length;i++,q+=4)p[i]=merged[q];return p}).concat(inks.map(k=>k.plane)),rl=planes.map(p=>prRle(p,W,H));
 B.u16(1);rl.forEach(c=>c.rows.forEach(r=>B.u16(r.length)));rl.forEach(c=>c.rows.forEach(r=>B.bytes(r)));return B.blob()}
// the box round a picture's visible pixels
function prCrop(im){const{width:W,height:H,data:d}=im;let x0=W,y0=H,x1=-1,y1=-1;for(let y=0;y<H;y++)for(let x=0;x<W;x++)if(d[(y*W+x)*4+3]){if(x<x0)x0=x;if(x>x1)x1=x;if(y<y0)y0=y;if(y>y1)y1=y}
 if(x1<0)return null;const w=x1-x0+1,h=y1-y0+1,px=new Uint8Array(w*h*4);for(let y=0;y<h;y++)px.set(d.subarray(((y0+y)*W+x0)*4,((y0+y)*W+x0+w)*4),y*w*4);return{x0,y0,w,h,px}}
const prNoTex=svg=>{const d=new DOMParser().parseFromString(svg,'image/svg+xml'),t=d.getElementById('texg');if(t)t.textContent='';return new XMLSerializer().serializeToString(d)};
async function prLayers(o){const L=(WBS.layers||[])[WBS.selL]||(WBS.layers||[])[0],pl=(L&&L.pl)||[],{W,H}=coSize(o.dpi),leaves=pl.filter(q=>q.k!='group'&&!fpHid(pl,q)),keep=new Map(pl.map(q=>[q,q.v])),out=[];
 WBX.wbNoCap=1;try{for(let i=0;i<leaves.length;i++){const q=leaves[i];pmsg('Layer '+(i+1)+' of '+leaves.length+'…');leaves.forEach(z=>{z.v=z===q?keep.get(z):false});upd();await coIdle();
   const c=prCrop(await coRaster(prNoTex(ser()),W,H,true));if(c)out.push({...c,name:lyNm(q)})}}
 finally{pl.forEach(q=>{const v=keep.get(q);if(v===undefined)delete q.v;else q.v=v});upd();await coIdle();WBX.wbNoCap=0}
 const merged=(await coRaster(ser(),W,H)).data;let inks=[];
 if(o.inkCh){const ids=coInks(),all=WBS.proj.ts.slice(),info=new Map(ids.map(id=>{const h=slotHex(id);return[id,{name:coInkName(id,all.indexOf(id)),rgb:[1,3,5].map(i=>parseInt(h.slice(i,i+2),16))}]}));   /* names and colours before the colourway made for the moment */
  await coWith((ink,id,c)=>withAlpha(id===ink?'#000000':'#ffffff',hexAlpha(c)),ids,async ink=>{const g=coPlate(await coRaster(ser(),W,H),'tone',o.dpi);inks.push({...info.get(ink),plane:g})})}
 return prPsd(W,H,o.dpi,out,merged,inks)}
// ---- the Print file dialog
const prOpt={fmt:'pdf',cm:'rgb',dpi:300,crop:true,reg:true,spots:true,inkCh:false};
const prSeg=(id,label,opts,cur)=>`<div class="stgr" id="${id}r"><span>${label}</span><div class="seg" id="${id}" role="group" aria-label="${label}" style="--n:${opts.length}">${opts.map(([v,t])=>`<button type="button" data-v="${v}" class="${String(v)===String(cur)?'on':''}" aria-pressed="${String(v)===String(cur)}">${t}</button>`).join('')}</div></div>`;
const prTgl=(id,label,on)=>`<div class="stgr" id="${id}r"><span>${label}</span><button type="button" class="pvc" id="${id}" aria-pressed="${on}" aria-label="${label}">${on?'On':'Off'}</button></div>`;
function prPaint(){const b=$('prfb');if(!b)return;const o=prOpt,bl=prBleedIn(),spot=coSpots().some(id=>coInks().includes(id));
 b.innerHTML=prSeg('prff','Format',[['pdf','PDF'],['tiff','TIFF'],['psd','PSD']],o.fmt)+prSeg('prfc','Colour',[['rgb','RGB'],['cmyk','CMYK']],o.cm)+prSeg('prfr','Resolution',[[150,'150'],[300,'300'],[600,'600']],o.dpi)
  +`<div class="stgr" id="prfbr"><span>Bleed</span><b>${bl>0?unFmt(unFrom(bl,'in'))+' '+unGet():'None'}</b></div>`+prTgl('prfk','Crop marks',o.crop)+prTgl('prfg2','Registration marks',o.reg)+(spot?prTgl('prfs','Spot inks as plates',o.spots):'')+prTgl('prfi','Ink channels',o.inkCh);
 const psd=o.fmt=='psd';['prfcr','prfbr','prfkr','prfg2r'].forEach(id=>{const e=$(id);if(e)e.hidden=psd});{const e=$('prfsr');if(e)e.hidden=o.fmt!='pdf'}$('prfir').hidden=!psd}
const prFrom={el:null};
function prOpen(){const d=$('prfd');if(!d)return;prFrom.el=document.activeElement;try{if(typeof WBX.wbCloseMenus=='function')WBX.wbCloseMenus()}catch(e){}const P=(WBS.dim&&+WBS.dim.dpi)||0;if([150,300,600].includes(P))prOpt.dpi=P;prPaint();d.hidden=false;$('prfok').focus()}
function prHide(){$('prfd').hidden=true;const f=prFrom.el;prFrom.el=null;if(f&&f.focus&&document.contains(f))try{f.focus()}catch(e){}}
async function prExport(o){if(prBusy.on)return;const d=await use('downloads');if(!d)return pmsg('Saving is not available here.');prBusy.on=true;
 const ext=o.fmt,name=expName('png').replace(/\.png$/,'')+(o.fmt=='psd'?'-layers':'-print'+(o.cm=='cmyk'?'-cmyk':''))+'.'+ext;
 try{const h0=d.pick?await d.pick({filename:name}):null;let blob;pmsg('Making the print file…');
  if(o.fmt=='psd')blob=await prLayers(o);
  else{const S=await prSheet({...o,spots:o.fmt=='pdf'&&o.spots});if(o.fmt=='pdf')blob=prPdf(S,o);
   else{const x=S.sheet.getContext('2d');
    if(o.cm=='cmyk'){const c=coCmyk(x.getImageData(0,0,S.SW,S.SH).data),mk=document.createElement('canvas');mk.width=S.SW;mk.height=S.SH;const mx=mk.getContext('2d');prDrawMarks(mx,S.M);const md=mx.getImageData(0,0,S.SW,S.SH).data;
     for(let p=0;p<c.length;p+=4)if(md[p+3]>127){c[p]=c[p+1]=c[p+2]=c[p+3]=255}blob=coTiff(c,S.SW,S.SH,4,o.dpi)}   /* the marks print on every plate (Registration); a black in the design stays plain black */
    else{prDrawMarks(x,S.M);blob=prTiffRgb(x.getImageData(0,0,S.SW,S.SH).data,S.SW,S.SH,o.dpi)}}}
  await d.save({filename:name,data:blob,handle:h0});pmsg('Exported '+name+'.')}
 catch(e){if(e&&e.code=='declined')return pmsg('');pmsg((e&&e.message)||'Could not export.')}finally{prBusy.on=false}}
// an RGB TIFF (no alpha) of the sheet
function prTiffRgb(rgba,W,H,dpi){const rgb=new Uint8Array(W*H*3);for(let i=0,p=0;p<rgba.length;p+=4){rgb[i++]=rgba[p];rgb[i++]=rgba[p+1];rgb[i++]=rgba[p+2]}
 const t=coTiff(rgb,W,H,3,dpi);return t}
// ---- Bleed in Canvas > Canvas size, typed like the unit fields
let prKey='';
function prSync(){const f=$('cbl');if(!f)return;const u=unGet(),k=u+'|'+prBleedIn()+'|'+(WBS.book&&WBS.book.on?1:0)+'|'+(document.activeElement===f);if(k===prKey)return;prKey=k;$('cblr').hidden=!!(WBS.book&&WBS.book.on);document.querySelectorAll('#cblr .unu').forEach(s=>{if(s.textContent!==u)s.textContent=u});if(document.activeElement===f)return;const t=unFmt(unFrom(prBleedIn(),'in'),u);if(f.value!==t)f.value=t;f.classList.remove('bad')}
function prSet(text){const f=$('cbl'),cur=unFrom(prBleedIn(),'in'),v=unParse(text,cur);if(v==null||v<0){f.classList.add('bad');return}f.classList.remove('bad');const inch=Math.min(1,Math.round(unTo(v,'in')*10000)/10000);
 if(Math.abs(inch-prBleedIn())<1e-6){prSync();return}if(inch>0)WBS.dim.bl=inch;else delete WBS.dim.bl;try{kv.set('wb14_dim',JSON.stringify(WBS.dim))}catch(e){}store();WBX.wbLabelNext={t:'Bleed',at:performance.now()};if(WBX.wbCap)WBX.wbCap();f.value=unFmt(unFrom(prBleedIn(),'in'));prSync()}
function init36(){
 const f=$('cbl');if(f){f.addEventListener('change',()=>prSet(f.value));f.addEventListener('blur',()=>{prKey='';prSync()});f.addEventListener('keydown',e=>{if(e.key=='Enter'){e.preventDefault();prSet(f.value);f.select()}else if(e.key=='Escape'){e.preventDefault();e.stopPropagation();f.value=unFmt(unFrom(prBleedIn(),'in'));f.classList.remove('bad');prKey='';f.blur()}})}
 const d0=WBH.draw;WBH.draw=function(){const r=d0.apply(this,arguments);prSync();return r};WBX.wbBleedSync=()=>{prKey='';prSync()};prSync();
 $('prfb').addEventListener('click',e=>{const s=e.target.closest('.seg [data-v]');if(s){const id=s.closest('.seg').id,v=s.dataset.v;if(id=='prff')prOpt.fmt=v;else if(id=='prfc')prOpt.cm=v;else if(id=='prfr')prOpt.dpi=+v;prPaint();return}
  const t=e.target.closest('.pvc');if(t){const k={prfk:'crop',prfg2:'reg',prfs:'spots',prfi:'inkCh'}[t.id];if(k){prOpt[k]=!prOpt[k];prPaint()}}});
 $('prfok').onclick=()=>{prHide();prExport({...prOpt})};$('prfcx').onclick=prHide;$('prfx').onclick=prHide;$('prfd').addEventListener('click',e=>{if(e.target===$('prfd'))prHide()});
 $('prfd').addEventListener('keydown',e=>{if(e.key=='Escape'){e.preventDefault();e.stopPropagation();prHide()}});
 cmdRegister({id:'export.printFile',label:'Print file',run:prOpen});
 // 2.87.9 (step 9): the Export panel's Print and colour group runs the same commands; its line says the bleed and the spot inks, its tick is Proof colours
 [['xpfile','export.printFile'],['xpsep','export.separations'],['xpcmt','export.cmykTiff'],['xpcmp','export.cmykPdf']].forEach(([id,c])=>{const b=$(id);if(b)b.onclick=()=>cmdRun(c)});
 {const t=$('xpprf');if(t)t.addEventListener('change',()=>{const c=cmdGet('view.proof');if(c&&!!c.on()!==t.checked)cmdRun('view.proof')})}
 const d1=WBH.draw;WBH.draw=function(){const r=d1.apply(this,arguments);prPanelSync();return r};prPanelSync();
 {const sec=document.querySelector('section.pn[data-p="xrec"]');if(sec)new MutationObserver(()=>{prPk='';prPanelSync()}).observe(sec,{attributes:true,attributeFilter:['hidden']})}
 WBX.wbExportSync=()=>{prPk='';prPanelSync()}}
let prPk='';
function prPanelSync(){const i=$('xpinfo'),sec=document.querySelector('section.pn[data-p="xrec"]');if(!i||!sec||sec.hidden)return;   /* only while the Export panel shows: nothing on the drawing path otherwise */
 const bl=prBleedIn(),n=coSpots().filter(id=>coInks().includes(id)).length,c=cmdGet('view.proof'),pr=!!(c&&c.on()),sep=cmdIsEnabled('export.separations'),k=[bl,n,unGet(),pr,sep].join('|');if(k===prPk)return;prPk=k;
 const parts=[];if(bl>0)parts.push('Bleed '+unFmt(unFrom(bl,'in'))+' '+unGet());if(n)parts.push(n+' spot ink'+(n>1?'s':''));i.textContent=parts.join(' · ');i.hidden=!parts.length;
 const t=$('xpprf');if(t&&t.checked!==pr)t.checked=pr;const s=$('xpsep');if(s)s.disabled=!sep}
export {init36};
