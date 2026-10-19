import {$,WBS,WBX} from './01-launch-and-version.js';
import {DRS} from './03-stamp-prints-and-drawing.js';
import {CH,CW,bk,cOut,col,csk,geom,hasOut,offPoly,polyArea,rng,shOf,okC} from './04-canvas-and-stamp-outlines.js';
import {inkOf,store} from './06-motif-library-folders.js';
import {flipVOk,turnFit} from './10-layer-grids.js';
import {eNV,eT,pressDefs,upd} from './11-pressure-flooding-block-edges.js';
import {LY} from './14-presets-and-layer-grid-ui.js';
// ===== Frame layers: a strip stamp walked round the edges of the canvas (or the front / back covers).
// Each side fits a whole number of repeats (squeezed or stretched a touch), so the pattern lands cleanly at every corner.
// Corners: m = mitred (45° seams), b = a corner stamp in each corner, o = strips simply overlap.
const FRD={on:true,w:2.5,i:0,g:0,c:'m',cs:null,fc:'o',sc:'front',clr:false,safe:true,bar:true};
// Boxes to frame, in canvas units. With the print cover on, sizes are measured against the front cover so every
// panel gets the same band; the inset stays inside KDP's safe area (1/8 in from the trim, 1/16 in on the spine);
// the back cover can leave the barcode area clear.
function frBoxes(fr){const S=Math.min(CW,CH);if(!WBS.book.on)return[{x0:0,y0:0,x1:CW,y1:CH,S,ix:fr.i/100*S,iy:fr.i/100*S}];
const g=bk(),u=CW/g.W,b=g.b*u,tw=g.tw*u,sw=g.sw*u,th=g.th*u,S0=Math.min(tw,th),i0=fr.i/100*S0,sf=fr.safe?.125*u:0,ss=fr.safe?.0625*u:0,ii=Math.max(i0,sf);
const front={x0:b+tw+sw,y0:b,x1:b+2*tw+sw,y1:b+th,S:S0,ix:ii,iy:ii},back={x0:b,y0:b,x1:b+tw,y1:b+th,S:S0,ix:ii,iy:ii,bar:fr.bar?[(b+tw)-(.25+2+.06)*u,(b+th)-(.25+1.2+.06)*u,(b+tw)-(.25-.06)*u,(b+th)-(.25-.06)*u]:null},
spine={x0:b+tw,y0:b,x1:b+tw+sw,y1:b+th,S:S0,ix:Math.max(ss,Math.min(i0,sw*.12)),iy:ii,sp:1};
return fr.sc=='all'?[{x0:b,y0:b,x1:CW-b,y1:CH-b,S:S0,ix:ii,iy:ii,bar:back.bar}]:fr.sc=='both'?[back,front]:fr.sc=='each'?[back,spine,front]:[front]}
function frameLayer(L,li,ls,pa){const fr={...FRD,...L.fr},amt=0,S=rng(11+li*977),act=!DRS()&&((L.pst||0)>0||(L.pfl||0)>0),pre=act?`#q${li}_`:'#s',need=new Set(),f=v=>v.toFixed(1);
const cs=fr.c=='b'?WBS.tiles.find(t=>t.id==fr.cs)||null:null,strips=ls.filter(t=>!cs||t.id!=cs.id);if(!strips.length&&!cs)return['',''];
let defs='',out='',clr='',cnt=0;
const imp=(tt,cx,cy,ra,kx,ky,seed)=>{const G=geom(shOf(tt)),r1=S()-.5,r2=S()-.5,r3=S()-.5,r4=S(),bin=act?Math.floor(rng(seed*7919+li*1299709+13)()*16):0;if(act)need.add(tt.id+'_'+bin);
let drr=0,dxr=0,dyr=0,sx=1,sy=1;{const rR=+L.rrot||0,rP=+L.rpos||0,fH=!!L.rfh,fV=!!L.rfv,tN=!!L.rtn;if(rR||rP||fH||fV||tN){const Q=rng(seed*15485863+li*7919+(L.rsd|0)*104729+101),u1=Q(),u2=Q(),u3=Q(),u4=Q(),u5=Q(),u6=Q(),sz=Math.max(G.SW*Math.abs(kx),G.SH*Math.abs(ky));drr=(u1*2-1)*rR;dxr=(u2*2-1)*rP/100*sz*.5;dyr=(u3*2-1)*rP/100*sz*.5;if(fH&&u4<.5)sx=-1;if(fV&&u5<.5&&flipVOk(G))sy=-1;if(tN)drr+=turnFit(G,u6)}}
const ev=Math.floor(rng(seed*104729+li*15485863+(tt.es||0)*31)()*eNV(tt)),tr=`transform="translate(${f(cx+r2*amt*.4+dxr)} ${f(cy+r3*amt*.4+dyr)}) rotate(${(r1*amt*.6+ra+drr).toFixed(2)}) scale(${(kx*sx).toFixed(4)} ${(ky*sy).toFixed(4)}) translate(${-G.SW/2} ${-G.SH/2})"`,op=`opacity="${(1-r4*amt*.03).toFixed(2)}"`;
return act||DRS()||!eT(tt)?`<use href="${pre}${tt.id}${act?'_'+bin:''}" ${op} ${tr}${WBX.wbGrade&&WBX.wbGrade.stF(tt.id)?` filter="url(#${WBX.wbGrade.stF(tt.id)})"`:''}/>`:`<g ${op} ${tr}${WBX.wbGrade&&WBX.wbGrade.stF(tt.id)?` filter="url(#${WBX.wbGrade.stF(tt.id)})"`:''}><use href="#s${tt.id}"/><use href="#e${tt.id}_${ev}" fill="${inkOf(tt)}"/></g>`};
if(hasOut()){const O=cOut(),S0=Math.min(CW,CH),w=Math.max(.5,fr.w/100*S0),ins=fr.i/100*S0,flip=fr.fc=='i'?180:0,D=Math.PI/180,PO=offPoly(O.pts,ins),PN=offPoly(O.pts,ins+w),PC=offPoly(O.pts,ins+w/2);
if(PO&&PN&&PC&&polyArea(PN)>w*w){const m=PC.length,pl=P=>'M'+P.map(p=>f(p[0])+' '+f(p[1])).join('L')+'Z',ring=pl(PO)+pl(PN),cx=PC.reduce((a,p)=>a+p[0],0)/m,cy=PC.reduce((a,p)=>a+p[1],0)/m,fan=p=>Math.atan2(p[1]-cy,p[0]-cx)/D+90,
repL=strips.length?(()=>{const G0=geom(shOf(strips[0])),t0=G0.SH>G0.SW,lg0=t0?G0.SH:G0.SW,th0=t0?G0.SW:G0.SH;return lg0*(w/th0)*(1+fr.g/100)})():1,
lay=(at,a0,run,seed,minN)=>{const n=Math.max(minN,Math.round(run/repL)),pitch=run/n;let r='';for(let q=0;q<n;q++){const tt=strips[cnt++%strips.length],G=geom(shOf(tt)),tall=G.SH>G.SW,lg=tall?G.SH:G.SW,thn=tall?G.SW:G.SH,kT=w/thn,kL=pitch/(1+fr.g/100)/lg,[x,y,an]=at(a0+(q+.5)*pitch);r+=imp(tt,x,y,an+(tall?90:0)+flip,tall?kT:kL,tall?kL:kT,seed*1000+q+7)}return r};
if(fr.clr)clr+=`<path d="${ring}" fill="${pa}" fill-rule="evenodd"/>`;
let body='';
if(O.vk){// straight sides: whole repeats along each side, like a rectangle
const ext=PC.map((p,i)=>{const a=PC[(i+m-1)%m],b=PC[(i+1)%m],x1=p[0]-a[0],y1=p[1]-a[1],x2=b[0]-p[0],y2=b[1]-p[1],c=(x1*x2+y1*y2)/((Math.hypot(x1,y1)||1)*(Math.hypot(x2,y2)||1));return Math.min(3*w,w/2*Math.sqrt(Math.max(0,1-c)/Math.max(.02,1+c)))});
if(strips.length)for(let i=0;i<m;i++){const A=PC[i],B=PC[(i+1)%m],dx=B[0]-A[0],dy=B[1]-A[1],L=Math.hypot(dx,dy);if(L<1e-6)continue;const ux=dx/L,uy=dy/L,rot=Math.atan2(dy,dx)/D,a0=fr.c=='b'?w/2:-ext[i],a1=fr.c=='b'?L-w/2:L+ext[(i+1)%m],run=a1-a0;if(run<=w*.5)continue;
const sg=lay(al=>[A[0]+ux*al,A[1]+uy*al,rot],a0,run,i,1);
if(fr.c=='m'){const id=`fc${li}_${i}`,e=.3,q=(p,t)=>f(p[0]+ux*t)+','+f(p[1]+uy*t);defs+=`<clipPath id="${id}" clipPathUnits="userSpaceOnUse"><polygon points="${q(PO[i],-e)} ${q(PO[(i+1)%m],e)} ${q(PN[(i+1)%m],e)} ${q(PN[i],-e)}"/></clipPath>`;body+=`<g clip-path="url(#${id})">${sg}</g>`}else body+=sg}
out+=body}
else{// curved outline: strips follow the line, either all the way round or between marker points
const cum=[0];for(let i=0;i<m;i++){const a=PC[i],b=PC[(i+1)%m];cum.push(cum[i]+Math.hypot(b[0]-a[0],b[1]-a[1]))}const T=cum[m],
at=s=>{s=((s%T)+T)%T;let lo=0,hi=m-1;while(lo<hi){const mid=(lo+hi+1)>>1;if(cum[mid]<=s)lo=mid;else hi=mid-1}const A=PC[lo],B=PC[(lo+1)%m],L=(cum[lo+1]-cum[lo])||1,t=(s-cum[lo])/L;return[A[0]+(B[0]-A[0])*t,A[1]+(B[1]-A[1])*t,Math.atan2(B[1]-A[1],B[0]-A[0])/D]},
ks=fr.c=='b'&&O.keys.length?O.keys:null;
if(strips.length){if(ks)ks.forEach((ki,j)=>{const s0=cum[ki]+w/2,s1=(j+1<ks.length?cum[ks[j+1]]:cum[ks[0]]+T)-w/2;if(s1-s0>w*.5)body+=lay(at,s0,s1-s0,j,1)});else body+=lay(at,0,T,0,3)}
if(fr.c=='m'){const id=`fc${li}_r`;defs+=`<clipPath id="${id}" clipPathUnits="userSpaceOnUse"><path d="${ring}" clip-rule="evenodd"/></clipPath>`;out+=`<g clip-path="url(#${id})">${body}</g>`}else out+=body}
if(cs&&fr.c=='b'){const G=geom(shOf(cs)),k=w/Math.max(G.SW,G.SH);(O.vk?PC:O.keys.map(i=>PC[i])).forEach((p,j)=>{out+=imp(cs,p[0],p[1],fan(p)+flip,k,k,j*1000+900)})}}}
else frBoxes(fr).forEach((B,bi)=>{const{x0,y0,x1,y1}=B,w=Math.max(.5,fr.w/100*B.S),a=x0+B.ix,b=y0+B.iy,c=x1-B.ix,d=y1-B.iy;if(c-a<2.05*w||d-b<3*w)return;const o0=out.length;
if(fr.clr)clr+=`<path d="M${f(a)} ${f(b)}H${f(c)}V${f(d)}H${f(a)}Z M${f(a+w)} ${f(b+w)}V${f(d-w)}H${f(c-w)}V${f(b+w)}Z" fill="${pa}" fill-rule="evenodd"/>`;
const flip=fr.fc=='i'?180:0,e=.4;
const sides=[{sx:a,sy:b+w/2,dx:1,dy:0,len:c-a,rot:0,clip:`${f(a-e)},${f(b-e)} ${f(c+e)},${f(b-e)} ${f(c-w+e)},${f(b+w+e)} ${f(a+w-e)},${f(b+w+e)}`},
{sx:c-w/2,sy:b,dx:0,dy:1,len:d-b,rot:90,clip:`${f(c+e)},${f(b-e)} ${f(c+e)},${f(d+e)} ${f(c-w-e)},${f(d-w+e)} ${f(c-w-e)},${f(b+w-e)}`},
{sx:c,sy:d-w/2,dx:-1,dy:0,len:c-a,rot:180,clip:`${f(c+e)},${f(d+e)} ${f(a-e)},${f(d+e)} ${f(a+w-e)},${f(d-w-e)} ${f(c-w+e)},${f(d-w-e)}`},
{sx:a+w/2,sy:d,dx:0,dy:-1,len:d-b,rot:270,clip:`${f(a-e)},${f(d+e)} ${f(a-e)},${f(b-e)} ${f(a+w+e)},${f(b+w-e)} ${f(a+w+e)},${f(d-w+e)}`}];
if(strips.length){const G0=geom(shOf(strips[0])),t0=G0.SH>G0.SW,lg0=t0?G0.SH:G0.SW,th0=t0?G0.SW:G0.SH,rep=lg0*(w/th0)*(1+fr.g/100);
sides.forEach((sd,si)=>{const a0=fr.c=='b'?w:0,run=sd.len-2*a0;if(run<=w*.5)return;const n=Math.max(1,Math.round(run/rep)),pitch=run/n;let s='';
for(let q=0;q<n;q++){const tt=strips[cnt++%strips.length],G=geom(shOf(tt)),tall=G.SH>G.SW,lg=tall?G.SH:G.SW,thn=tall?G.SW:G.SH,kT=w/thn,kL=pitch/(1+fr.g/100)/lg,al=a0+(q+.5)*pitch;
s+=imp(tt,sd.sx+sd.dx*al,sd.sy+sd.dy*al,sd.rot+(tall?90:0)+flip,tall?kT:kL,tall?kL:kT,(bi*4+si)*1000+q+7)}
if(fr.c=='m'){const id=`fc${li}_${bi}_${si}`;defs+=`<clipPath id="${id}" clipPathUnits="userSpaceOnUse"><polygon points="${sd.clip}"/></clipPath>`;out+=`<g clip-path="url(#${id})">${s}</g>`}else out+=s})}
if(cs){const G=geom(shOf(cs)),k=w/Math.max(G.SW,G.SH);[[a+w/2,b+w/2,0],[c-w/2,b+w/2,90],[c-w/2,d-w/2,180],[a+w/2,d-w/2,270]].forEach(([x,y,r],ci)=>out+=imp(cs,x,y,r+flip,k,k,(bi*4+ci)*1000+900))}
if(B.bar){const[p0,q0,p1,q1]=B.bar,id=`fb${li}_${bi}`;defs+=`<clipPath id="${id}" clipPathUnits="userSpaceOnUse"><path clip-rule="evenodd" d="M${f(-CW)} ${f(-CH)}H${f(2*CW)}V${f(2*CH)}H${f(-CW)}Z M${f(p0)} ${f(q0)}V${f(q1)}H${f(p1)}V${f(q0)}Z"/></clipPath>`;out=out.slice(0,o0)+`<g clip-path="url(#${id})">${out.slice(o0)}</g>`}});
if(act)defs+=pressDefs(L,li,cs&&!ls.includes(cs)?[...ls,cs]:ls,need);
const ink=okC(L.ink)?col(L.ink):'';if(ink)defs+=`<filter id="lk${li}" filterUnits="userSpaceOnUse" x="${-CW}" y="${-CH}" width="${3*CW}" height="${3*CH}" color-interpolation-filters="sRGB"><feFlood flood-color="${ink}"/><feComposite in2="SourceAlpha" operator="in"/></filter>`;
const lop=L.op!=null?Math.max(0,Math.min(100,+L.op)):100,lbl=L.bl||'';
return[defs,clr+`<g${ink?` filter="url(#lk${li})"`:''}${lop<100?` opacity="${(lop/100).toFixed(2)}"`:''}${lbl?` style="mix-blend-mode:${lbl}"`:''}>${out}</g>`]}
// --- Arrangement panel: Pattern / Frame
// true while the panel is only being brought in line with the document, so a slider that rounds the value does not write it back
let frSyncing=0;
function frSync(){const L=WBS.layers[WBS.selL];if(!L||!$('lmode'))return;const on=!!(L.fr&&L.fr.on),fr={...FRD,...(L.fr||{})};
const md=L.free?'x':on?'f':'p';document.querySelectorAll('#lmode [data-m]').forEach(b=>b.classList.toggle('on',b.dataset.m==md));{if($('lrsec'))$('lrsec').hidden=false;if($('lipsec'))$('lipsec').hidden=false;if($('lrzrow'))$('lrzrow').hidden=md=='f';if($('lrgrow'))$('lrgrow').hidden=md!='p';if($('lalsec'))$('lalsec').hidden=!(L.pl||[]).length;if(WBX.alSync)WBX.alSync()}$('lpat').hidden=md!='p';$('lfrm').hidden=md!='f';$('lfree').hidden=false;if($('lmanbox'))$('lmanbox').hidden=md!='p';if($('lstbox'))$('lstbox').hidden=md=='x';if(md!='f')return;
const sv=(id,v)=>{const el=$(id);if(+el.value!=v){el.value=v;frSyncing=1;try{el.dispatchEvent(new Event('input',{bubbles:true}))}finally{frSyncing=0}}};sv('lfw',fr.w);sv('lfi',fr.i);sv('lfg',fr.g);
$('lfscrow').hidden=!WBS.book.on;$('lfsc').value=fr.sc;$('lfsafe').checked=!!fr.safe;$('lfbar').checked=!!fr.bar;$('lfbarrow').hidden=fr.sc=='front';
if(WBS.book.on){const g=bk(),S0=Math.min(g.tw,g.th),wi=fr.w/100*S0,ii=Math.max(fr.i/100*S0,fr.safe?.125:0),mm=v=>(v*25.4).toFixed(1);$('lfinfo').textContent=`Band ${wi.toFixed(3)} in (${mm(wi)} mm) wide, ${ii.toFixed(3)} in (${mm(ii)} mm) inside the trim.`+(!fr.safe&&fr.i/100*S0<.125?' That is outside the safe area, so the printer may trim into it.':'')+(fr.sc=='each'&&g.sw-2*Math.max(fr.safe?.0625:0,Math.min(fr.i/100*S0,g.sw*.12))<2.05*wi?' The spine is too narrow for this width, so it is left unframed; a thinner band will fit.':'')}document.querySelectorAll('#lfc [data-c]').forEach(b=>b.classList.toggle('on',b.dataset.c==fr.c));document.querySelectorAll('#lffc [data-f]').forEach(b=>b.classList.toggle('on',b.dataset.f==fr.fc));$('lfclr').checked=!!fr.clr;
$('lfcsrow').hidden=fr.c!='b';{const k=csk(),ci=k=='circle'||k=='oval',bs=document.querySelectorAll('#lfc [data-c]');[['m','Mitred','Clean edges','Strips trimmed to a smooth band'],['b','Corner stamp','Compass stamps','A stamp at evenly spaced points, strips in between'],['o','Overlap','Overlap','Strips overlap freely']].forEach(([c,a,b2,t2])=>{const el=[...bs].find(x=>x.dataset.c==c);if(!el)return;if(!el.dataset.t0)el.dataset.t0=el.title;el.textContent=ci?b2:a;el.title=ci?t2:el.dataset.t0});const lb=$('lfc').previousElementSibling;if(lb&&lb.tagName=='LABEL')lb.textContent=ci?'Band':'Corners';const csl=$('lfcsrow').querySelector('label');if(csl)csl.textContent=ci?'Compass stamp':'Corner stamp'}const ky=WBS.tiles.map(t=>t.id).join(',');if($('lfcs').dataset.k!=ky){$('lfcs').innerHTML=WBS.tiles.map((t,i)=>`<option value="${t.id}">Stamp ${i+1}</option>`).join('');$('lfcs').dataset.k=ky}$('lfcs').value=fr.cs!=null&&WBS.tiles.some(t=>t.id==fr.cs)?fr.cs:(WBS.tiles[WBS.tiles.length-1]||{}).id;
const st=WBS.tiles.filter(t=>L.st.includes(t.id)&&!(fr.c=='b'&&t.id==+$('lfcs').value)),thin=st.length&&st.every(t=>{const g=geom(shOf(t));return Math.max(g.SW,g.SH)/Math.min(g.SW,g.SH)>=3});
$('lfh').textContent=!st.length?'Tick at least one stamp above to use as the strip.':thin?'The stamps ticked above are used as the strip, repeated round the frame in turn.':'Tip: frames look best with a long, thin stamp. In Stamp settings, set its shape to one of the frame strip sizes, like 8:1.'}
function init23(){
{const FR=()=>{const L=LY();L.fr={...FRD,...(L.fr||{})};return L.fr},go=()=>{store();upd()};
$('lmode').onclick=e=>{const b=e.target.closest('[data-m]');if(!b)return;const L=LY(),m=b.dataset.m;L.free=m=='x';delete L.art;delete L.txt;if(m!='x'&&!(L.st||[]).length&&WBS.tiles[WBS.cur])L.st=[WBS.tiles[WBS.cur].id];if(L.free){L.pl=L.pl||[];if(L.fr)L.fr.on=false;WBS.layers.forEach(x=>{if(x.gl==L.u)delete x.gl});WBS.fpB=WBS.tiles[WBS.cur]?WBS.tiles[WBS.cur].id:null;WBS.fpSel=-1;go();return}if(m=='f'){L.fr={...FRD,...(L.fr||{}),on:true};if(L.fr.cs==null&&WBS.tiles.length>1)L.fr.cs=WBS.tiles[WBS.tiles.length-1].id;WBS.layers.forEach(x=>{if(x.gl==L.u){delete x.gl}})}else if(L.fr)L.fr.on=false;go()};
[['lfw','w'],['lfi','i'],['lfg','g']].forEach(([id,k])=>$(id).addEventListener('input',()=>{const L=LY();if(frSyncing||!L.fr||!L.fr.on)return;if(FR()[k]!==+$(id).value){FR()[k]=+$(id).value;go()}}));
$('lfsc').oninput=()=>{FR().sc=$('lfsc').value;go()};$('lfsafe').oninput=()=>{FR().safe=$('lfsafe').checked;go()};$('lfbar').oninput=()=>{FR().bar=$('lfbar').checked;go()};$('lfcs').oninput=()=>{FR().cs=+$('lfcs').value;go()};$('lfclr').oninput=()=>{FR().clr=$('lfclr').checked;go()};
$('lfc').onclick=e=>{const b=e.target.closest('[data-c]');if(!b)return;const fr=FR();fr.c=b.dataset.c;if(fr.c=='b'&&fr.cs==null)fr.cs=+$('lfcs').value||WBS.tiles[WBS.tiles.length-1].id;go()};
$('lffc').onclick=e=>{const b=e.target.closest('[data-f]');if(!b)return;FR().fc=b.dataset.f;go()}}
}
export {frSync,frameLayer,init23};
