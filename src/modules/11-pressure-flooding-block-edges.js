import {$,WBH,WBS,WBX,mod} from './01-launch-and-version.js';
import {BK,bkH} from './03-stamp-prints-and-drawing.js';
import {shBleed,HO,ORN,SH,SK,SW,col,ornPts,rng,useT} from './04-canvas-and-stamp-outlines.js';
import {inkOf,it} from './06-motif-library-folders.js';
import {inkRuns,items} from './09-stamp-items-and-print-runs.js';
import {build,hx,runPaint} from './10-layer-grids.js';
import {isOf} from './16-texture-generators.js';
import {txoG} from './17-texture-panel-and-previews.js';
// Uneven pressure + ink flooding. Each impression uses one of 16 random "heavy side" directions.
// Thickness: the stamp's ink map is softened, then re-thresholded with a ramp across the stamp
// (low threshold = thicker on the heavy side, high threshold = thinner on the light side).
// Flooding: mottled ink and pooling (noise) that fades in toward the heavy side, clipped square by the block.
// ---- Block edges: the raised rim of the block, printed as a ribbon along the stamp outline.
// Thickness sets the ribbon width; roughness adds width swell, ragged sides, per-side misalignment and worn gaps.
const eT=t=>t&&t.et!=null?+t.et:3,eR=t=>t&&t.er!=null?+t.er:3,eNV=t=>eR(t)>0?6:1;
// Block edge artifact, modelled on how a real block prints its rim:
// - the outer edge is the straight cut edge of the block (clipped exactly to the stamp outline);
// - the inner edge is ragged where the ink stops;
// - ink contact varies along each side (one side heavier, patches that barely touch the paper);
// - partial contact prints as dry, streaky grain running along the edge, not as a solid line;
// - worn blocks also pick up stray gouge "chatter" marks just inside the rim.
// Each variant is a mask (so the colour comes from the <use fill>), built side by side in local
// coordinates so the grain streaks follow each side.
let EDC;
function edgeDef(T,R,seed,id,clip){const ck=[T,R,seed,id,clip,SW,SH,SK,HO].join('|');if(EDC.has(ck))return EDC.get(ck);if(EDC.size>300)EDC.clear();
const r=rng(seed),mkN=fq=>{const v=Array.from({length:512},()=>r()*2-1);return x=>{x*=fq;const i=Math.floor(x),t=x-i,u=t*t*(3-2*t),a=v[mod(i,512)],b=v[mod(i+1,512)];return a+(b-a)*u}};
const nA=mkN(1/22),nA2=mkN(1/7),nJ=mkN(1/2.2),nJ2=mkN(1/.9),f=v=>v.toFixed(2),cx=SW/2,cy=SH/2,Rn=R/10;
// side segments: [x0,y0,x1,y1] along the outline, clockwise
let segs=[];
if(SK=='circle'){const n=48,rx=SW/2,ry=SH/2;for(let k=0;k<n;k++){const a0=k/n*2*Math.PI,a1=(k+1)/n*2*Math.PI;segs.push([cx+rx*Math.cos(a0),cy+ry*Math.sin(a0),cx+rx*Math.cos(a1),cy+ry*Math.sin(a1)])}}
else{let V;if(SK=='hex'){const b0=HO=='p'?-90:0;V=[0,1,2,3,4,5].map(k=>[cx+120*Math.cos((b0+60*k)*Math.PI/180),cy+120*Math.sin((b0+60*k)*Math.PI/180)])}else if(SK=='diamond')V=[[SW/2,0],[SW,SH/2],[SW/2,SH],[0,SH/2]];else if(SK=='tri')V=[[SW/2,0],[SW,SH],[0,SH]];else if(ORN.includes(SK))V=ornPts(0);else V=[[0,0],[SW,0],[SW,SH],[0,SH]];
segs=V.map((p,k)=>{const q=V[(k+1)%V.length];return[p[0],p[1],q[0],q[1]]})}
const hd=r()*Math.PI*2,hx=Math.cos(hd),hy=Math.sin(hd),poly=SK!='circle';
const g=(R?.3+Rn*.9:0).toFixed(3),fx=(.1).toFixed(3),fy=(.38).toFixed(3),sd=Math.floor(r()*9999);
let defs=`<filter id="${id}f" x="-5%" y="-40%" width="110%" height="180%" color-interpolation-filters="sRGB"><feTurbulence type="fractalNoise" baseFrequency="${fx} ${fy}" numOctaves="3" seed="${sd}" result="n"/><feComponentTransfer in="n" result="n2"><feFuncA type="linear" slope="2.6" intercept="-.8"/></feComponentTransfer><feComposite in="SourceAlpha" in2="n2" operator="arithmetic" k1="0" k2="1" k3="${g}" k4="${f(-g*.5)}" result="m"/><feComponentTransfer in="m" result="t"><feFuncA type="linear" slope="40" intercept="-20"/></feComponentTransfer><feFlood flood-color="#fff"/><feComposite in2="t" operator="in"/></filter>`;
let body='',sArc=0;
segs.forEach(([x0,y0,x1,y1],k)=>{const len=Math.hypot(x1-x0,y1-y0),ang=Math.atan2(y1-y0,x1-x0)*180/Math.PI;
// inward normal (local +y) must point to the centre; clockwise outline in screen coords gives (−sin, cos)
let nx=-(y1-y0)/len,ny=(x1-x0)/len;if(nx*(cx-(x0+x1)/2)+ny*(cy-(y0+y1)/2)<0){nx=-nx;ny=-ny}
const flip=(-(y1-y0)/len)!=nx?-1:1;
const base=1-Rn*(poly?.75:.4)*r(),heavy=-(nx*hx+ny*hy)*Rn*.4,ext=poly?T*.9+2:1.5,off=Math.floor(r()*800),tilt=poly?(r()*2-1)*Rn*.35:0;
const A=x=>{const sa=sArc+x;return Math.max(0,Math.min(1,base+heavy+Rn*.6*nA(sa)+Rn*.28*nA2(sa)))};
// gradient carries ink contact along the side
let st='';const N=Math.max(2,Math.ceil((len+2*ext)/5));for(let m=0;m<=N;m++){const x=-ext+(len+2*ext)*m/N;st+=`<stop offset="${f(m/N)}" stop-color="#fff" stop-opacity="${R?f(A(x)):1}"/>`}
defs+=`<linearGradient id="${id}g${k}" gradientUnits="userSpaceOnUse" x1="${f(off-ext)}" y1="0" x2="${f(off+len+ext)}" y2="0">${st}</linearGradient>`;
// band: straight outer edge at y<0 (clipped to the block edge), ragged inner edge
const step=poly?1.6:1.2,M=Math.ceil((len+2*ext)/step),outer=[],inner=[];
for(let m=0;m<=M;m++){const x=-ext+(len+2*ext)*m/M,a=R?A(x):1,sa=sArc+x;
const w=T*(R?(.45+.55*a):1)*(1+tilt*(x/len-.5))+(R?T*Rn*(.22*nJ(sa)+.1*nJ2(sa)):0);
outer.push(f(off+x)+','+f(-2));inner.push(f(off+x)+','+f(Math.max(.25,w)))}
let shapes=`<path d="M${outer.join('L')}L${inner.reverse().join('L')}Z" fill="url(#${id}g${k})"/>`;
// chatter: stray gouge marks just inside the rim on worn blocks
if(R>=2){const sc=len/200,cnt=Math.floor(r()*R*.25*sc+.2);for(let c=0;c<cnt;c++){const x=r()*len,y=T+.8+r()*2.6,l=1.6+r()*4,h=.5+r()*.9;shapes+=`<ellipse cx="${f(off+x)}" cy="${f(y)}" rx="${f(l/2)}" ry="${f(h/2)}" transform="rotate(${f((r()*2-1)*6)} ${f(off+x)} ${f(y)})" fill="#fff" fill-opacity="${f(.45+r()*.5)}"/>`}}
if(R>=1){const cnt=Math.round(R*2.2*len/200*r()*1.6);for(let c=0;c<cnt;c++){const x=r()*len,y=T*(.5+r()*.8)+r()*1.6*Rn;shapes+=`<circle cx="${f(off+x)}" cy="${f(y)}" r="${f(.3+r()*.7)}" fill="#fff" fill-opacity="${f(A(x)*.8+.2)}"/>`}}
// local frame: origin at (x0,y0), +x along the side, +y inward
const sy=flip;body+=`<g transform="translate(${f(x0)} ${f(y0)}) rotate(${f(ang)}) scale(1 ${nx*(-Math.sin(ang*Math.PI/180))+ny*Math.cos(ang*Math.PI/180)>0?1:-1}) translate(${-off} 0)"><g filter="url(#${id}f)">${shapes}</g></g>`;
sArc+=len});
const out=defs+`<mask id="${id}m" maskUnits="userSpaceOnUse" x="-20" y="-20" width="${SW+40}" height="${SH+40}">${body}</mask><rect id="${id}" x="-2" y="-2" width="${SW+4}" height="${SH+4}" mask="url(#${id}m)" clip-path="url(#${clip})"/>`;
EDC.set(ck,out);return out}
const eSeed=(t,v)=>t.id*7331+v*104729+(t.es||0)*15485863;
function edgeDefs(t){const T=eT(t);if(!T)return'';let o='';for(let v=0;v<eNV(t);v++)o+=edgeDef(T,eR(t),eSeed(t,v),`e${t.id}_${v}`,'shc'+t.id);return o}
function pressDefs(L,li,ls,need){
const P=L.pst||0,FL=L.pfl||0,S=Math.min(1,P/10),Fn=Math.min(1,FL/10),sg=(1.4+.12*P).toFixed(2);
const bins=[...new Set([...need].map(k=>+k.split('_')[1]))],ease=p=>Math.sign(p)*Math.pow(Math.abs(p),.8),tt=p=>.5-.43*S*ease(p);
let o='';
// stamps can differ in shape and size, so the pressure filters and ramps are made per stamp (suffix x = layer_stamp)
ls.forEach(t=>{if(!bins.some(b=>need.has(t.id+'_'+b)))return;useT(t);const x=li+'_'+t.id,_o0=o.length,_bt=bins.filter(b=>need.has(t.id+'_'+b)),_ck=[P,FL,li,_bt.join(','),BK.T[t.id],SW,SH].join('|'),_pd=BK.PD.get(x);if(_pd&&_pd.k===_ck){o+=_pd.o;BK.PF[x]=_pd.pf;_pd.pc.forEach(c=>{BK.PC[c[0]]=c[1];BK.P[c[0]]=c[2]});return}
const fr=`filterUnits="userSpaceOnUse" x="-12" y="-12" width="${SW+24}" height="${SH+24}" color-interpolation-filters="sRGB"`;
if(P>0)o+=`<filter id="pb${x}" ${fr}><feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0 0 0 0"/><feGaussianBlur stdDeviation="${sg}"/></filter><filter id="pt${x}" ${fr}><feComponentTransfer result="th"><feFuncA type="linear" slope="10" intercept="-4.5"/></feComponentTransfer><feFlood flood-color="#fff" result="fl"/><feComposite in="fl" in2="th" operator="in"/></filter>`;
{const _pf=o.slice(_o0);BK.PF[x]=_pf;o=o.slice(0,_o0)+'<!--@F:'+x+'-->'+_pf+'<!--@-->'}bins.forEach(b=>{if(!need.has(t.id+'_'+b))return;const _ob=o.length;const a=b/16*2*Math.PI,dx=Math.cos(a),dy=-Math.sin(a),Ln=SW/2*Math.abs(dx)+SH/2*Math.abs(dy),
x1=(SW/2-Ln*dx).toFixed(1),y1=(SH/2-Ln*dy).toFixed(1),x2=(SW/2+Ln*dx).toFixed(1),y2=(SH/2+Ln*dy).toFixed(1);
const gr=(id,f)=>{let st='';for(let k=0;k<=12;k++)st+=`<stop offset="${(k/12).toFixed(3)}" stop-color="#fff" stop-opacity="${Math.max(0,Math.min(1,f(k/6-1))).toFixed(3)}"/>`;
return`<linearGradient id="${id}${x}_${b}" gradientUnits="userSpaceOnUse" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}">${st}</linearGradient>`};
const mk=(id,g)=>`<mask id="${id}${x}_${b}" maskUnits="userSpaceOnUse" x="-12" y="-12" width="${SW+24}" height="${SH+24}"><rect x="-12" y="-12" width="${SW+24}" height="${SH+24}" fill="url(#${g}${x}_${b})"/></mask>`;
if(P>0)o+=gr('gmc',p=>p<0?.5/tt(p):1)+gr('gfl',p=>p>0?(.5-tt(p))/(1-tt(p)):0)+mk('pmc','gmc')+mk('pfl','gfl');
if(FL>0)o+=gr('gn1',p=>Fn*.6*Math.pow(Math.max(0,(p+.15)/1.15),1.3))+gr('gn2',p=>Fn*Math.pow(Math.max(0,(p-.1)/.9),1.1))+mk('tn1','gn1')+mk('tn2','gn2');
const k=`${li}_${t.id}_${b}`,ci=inkOf(t),seed=((li+1)*7919+t.id*104729+b*31)%9973,
frame=eT(t)?`<use href="#e${t.id}_${b%eNV(t)}" fill="#fff"/>`:'',
base=(t.neg?`<rect x="-12" y="-12" width="${SW+24}" height="${SH+24}" fill="#fff"/>${items(t,{c:'#000',d:'#fff'},0,12)}`:`<rect x="-12" y="-12" width="${SW+24}" height="${SH+24}" fill="#000"/>${items(t,{c:'#fff',d:'#000'},0,12)}`)+frame,
shapeOf=bs=>P>0?`<g filter="url(#pt${x})"><rect x="-12" y="-12" width="${SW+24}" height="${SH+24}" fill="#fff" mask="url(#pfl${x}_${b})"/><g filter="url(#pb${x})" mask="url(#pmc${x}_${b})">${bs}</g></g>`:bs,shape=shapeOf(base),rn=inkRuns(t),blk=`<rect x="-12" y="-12" width="${SW+24}" height="${SH+24}" fill="#000"/>`,
nf=(id,fq,oc,sd,m)=>`<filter id="${id}${k}" filterUnits="userSpaceOnUse" x="0" y="0" width="${SW}" height="${SH}" color-interpolation-filters="sRGB"><feTurbulence type="fractalNoise" baseFrequency="${fq}" numOctaves="${oc}" seed="${sd}"/><feColorMatrix type="matrix" values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 ${m}"/></filter>`,
fd=FL>0?nf('na',.07,3,seed,'4 0 0 0 -1.6')+nf('nb',.035,2,seed+13,'8 0 0 0 -4.4'):'',
tone=FL>0?`<rect width="${SW}" height="${SH}" fill="#fff" filter="url(#na${k})" mask="url(#tn1${x}_${b})"/><rect width="${SW}" height="${SH}" fill="#fff" filter="url(#nb${k})" mask="url(#tn2${x}_${b})"/>`:'';
const mkm=(id,body)=>`<mask id="${id}" maskUnits="userSpaceOnUse" x="0" y="0" width="${SW}" height="${SH}">${tone}${shapeOf(body)}</mask>`,rm=rn?rn.map((r,j)=>mkm('mp'+k+'r'+j,blk+items(t,{c:'#fff',d:'#000'},0,12,r.sel))).join('')+(frame?mkm('mp'+k+'rr',blk+frame):''):'';
o+=fd+`<mask id="mp${k}" maskUnits="userSpaceOnUse" x="0" y="0" width="${SW}" height="${SH}">${tone}${shape}</mask>${rm}${t.neg?`<g id="q${k}">${shBleed(ci)}<g clip-path="url(#shc${t.id})">`:`<g id="q${k}" clip-path="url(#shc${t.id})">`}${isOf(t)?`<g mask="url(#is${t.id})">`:''}${rn?rn.map((r,j)=>runPaint(t,r,`mp${k}r${j}`,ci,12)).join('')+(frame?`<rect width="${SW}" height="${SH}" fill="${ci}" mask="url(#mp${k}rr)"/>`:''):`<rect width="${SW}" height="${SH}" fill="${ci}" mask="url(#mp${k})"/>`}${txoG(t,'mp'+k)}${isOf(t)?'</g>':''}${t.neg?'</g></g>':'</g>'}`;{const _pc=o.slice(_ob);BK.PC[k]=_pc;BK.P[k]=bkH(_pc+'|'+(BK.PF[x]||''));o=o.slice(0,_ob)+'<!--@P:'+k+'-->'+_pc+'<!--@-->'}});BK.PD.set(x,{k:_ck,o:o.slice(_o0),pf:BK.PF[x],pc:_bt.map(b=>{const k=x+'_'+b;return[k,BK.PC[k],BK.P[k]]})})});
useT(WBS.tiles[WBS.cur]);return o}
let raf=0;const upd=()=>{if(raf)return;raf=requestAnimationFrame(()=>{raf=0;WBH.draw();build()})};
const Q=()=>(WBS.tiles[WBS.cur]||WBS.noTile).items[WBS.sel];
function init11(){
EDC=new Map();
WBX.hdResize=hdResize;
// Pulling a corner or a side square of a shape in a stamp (2.74.2, owner Oct 29 2026: "the canvas and stamp editors should work exactly the same"): as a piece on the
// canvas (fpResize, 28-canvas-select.js). The opposite corner or side stays where it is; with Alt (Option) the shape grows from its middle. A corner pulls width and height
// at once (they follow the pointer; with Shift the proportions are kept); a side pulls only the width or the height. Pulled past the opposite side the shape turns over on
// that axis: across, its flip turns; down, the flip turns and it makes a half turn. Worked out in the shape's own frame as it was when the pull began.
// (Before 2.74.2 a corner locked to the first direction it was pulled in, Shift grew from the middle, and the width and height stopped at 20 and 300 %.)
function hdResize(h,p,e){const q=h.q,a=-h.r0*Math.PI/180,dx=p.x-h.cx,dy=p.y-h.cy,lx=dx*Math.cos(a)-dy*Math.sin(a),ly=dx*Math.sin(a)+dy*Math.cos(a),w0=96*h.s0*h.sx0,h0=96*h.s0*h.sy0,mid=e.altKey,cl=(v,lo,hi)=>Math.min(hi,Math.max(lo,v)),k0=h.k,f0=h.f0||1;
 let ns=h.s0,nx=h.sx0,ny=h.sy0,ox=0,oy=0,fx=1,fy=1;
 if(k0.length==2&&e.shiftKey){// a corner with Shift: the size along the line from the fixed corner (or the middle) through the pulled one; past the fixed point it turns right round
  const cx=k0[1]=='e'?1:-1,cy=k0[0]=='s'?1:-1,Cx=cx*w0/2,Cy=cy*h0/2,Fx=mid?0:-Cx,Fy=mid?0:-Cy,vx=Cx-Fx,vy=Cy-Fy;let k=((lx-Fx)*vx+(ly-Fy)*vy)/(vx*vx+vy*vy);if(k<0){fx=-1;fy=-1;k=-k}
  ns=cl(+(h.s0*k).toFixed(3),.02,40);k=ns/h.s0;if(!mid){ox=Fx+fx*k*vx/2;oy=Fy+fx*k*vy/2}}
 else if(k0.length==2){// a corner: width and height follow the pointer
  const cx=k0[1]=='e'?1:-1,cy=k0[0]=='s'?1:-1,Fx=mid?0:-cx*w0/2,Fy=mid?0:-cy*h0/2,sw=mid?2*lx*cx:(lx-Fx)*cx,sh=mid?2*ly*cy:(ly-Fy)*cy;
  fx=sw<0?-1:1;fy=sh<0?-1:1;nx=cl(+(h.sx0*Math.max(w0*.02,Math.abs(sw))/w0).toFixed(3),.05,20);ny=cl(+(h.sy0*Math.max(h0*.02,Math.abs(sh))/h0).toFixed(3),.05,20);
  if(!mid){ox=Fx+cx*fx*w0*nx/h.sx0/2;oy=Fy+cy*fy*h0*ny/h.sy0/2}}
 else if(k0=='e'||k0=='w'){const d=k0=='e'?1:-1,sw=mid?2*d*lx:d*lx+w0/2;fx=sw<0?-1:1;nx=cl(+(h.sx0*Math.max(w0*.02,Math.abs(sw))/w0).toFixed(3),.05,20);if(!mid)ox=-d*w0/2+d*fx*(w0*nx/h.sx0)/2}
 else{const d=k0=='s'?1:-1,sh=mid?2*d*ly:d*ly+h0/2;fy=sh<0?-1:1;ny=cl(+(h.sy0*Math.max(h0*.02,Math.abs(sh))/h0).toFixed(3),.05,20);if(!mid)oy=-d*h0/2+d*fy*(h0*ny/h.sy0)/2}
 q.s=ns;if(nx!=1||q.sx)q.sx=nx;if(ny!=1||q.sy)q.sy=ny;q.f=f0*fx*fy;q.r=+((((fy<0?h.r0+180:h.r0)+540)%360)-180).toFixed(1);
 const r=-a;q.x=+(h.cx+ox*Math.cos(r)-oy*Math.sin(r)).toFixed(2);q.y=+(h.cy+ox*Math.sin(r)+oy*Math.cos(r)).toFixed(2)}
}
export {Q,eNV,eR,eSeed,eT,edgeDef,edgeDefs,pressDefs,raf,upd,init11};
