// Uneven pressure + ink flooding. Each impression uses one of 16 random "heavy side" directions.
// Thickness: the stamp's ink map is softened, then re-thresholded with a ramp across the stamp
// (low threshold = thicker on the heavy side, high threshold = thinner on the light side).
// Flooding: mottled ink and pooling (noise) that fades in toward the heavy side, clipped square by the block.
// ---- Block edges: the raised rim of the block, printed as a ribbon along the stamp outline.
// Thickness sets the ribbon width; roughness adds width swell, ragged sides, per-side misalignment and worn gaps.
const eT=t=>t.et!=null?+t.et:3,eR=t=>t.er!=null?+t.er:3,eNV=t=>eR(t)>0?6:1;
const migEdges=()=>WBS.tiles.forEach(t=>{if(t.et==null){const L=WBS.layers.find(L=>(L.st||[]).includes(t.id));t.et=L?(L.et!=null?+L.et:(L.edg===false?0:3)):3;t.er=L&&L.er!=null?+L.er:(L&&L.et!=null?0:3);if(L&&L.es)t.es=L.es}});
// Block edge artifact, modelled on how a real block prints its rim:
// - the outer edge is the straight cut edge of the block (clipped exactly to the stamp outline);
// - the inner edge is ragged where the ink stops;
// - ink contact varies along each side (one side heavier, patches that barely touch the paper);
// - partial contact prints as dry, streaky grain running along the edge, not as a solid line;
// - worn blocks also pick up stray gouge "chatter" marks just inside the rim.
// Each variant is a mask (so the colour comes from the <use fill>), built side by side in local
// coordinates so the grain streaks follow each side.
const EDC=new Map();
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
shape=P>0?`<g filter="url(#pt${x})"><rect x="-12" y="-12" width="${SW+24}" height="${SH+24}" fill="#fff" mask="url(#pfl${x}_${b})"/><g filter="url(#pb${x})" mask="url(#pmc${x}_${b})">${base}</g></g>`:base,
nf=(id,fq,oc,sd,m)=>`<filter id="${id}${k}" filterUnits="userSpaceOnUse" x="0" y="0" width="${SW}" height="${SH}" color-interpolation-filters="sRGB"><feTurbulence type="fractalNoise" baseFrequency="${fq}" numOctaves="${oc}" seed="${sd}"/><feColorMatrix type="matrix" values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 ${m}"/></filter>`,
fd=FL>0?nf('na',.07,3,seed,'4 0 0 0 -1.6')+nf('nb',.035,2,seed+13,'8 0 0 0 -4.4'):'',
tone=FL>0?`<rect width="${SW}" height="${SH}" fill="#fff" filter="url(#na${k})" mask="url(#tn1${x}_${b})"/><rect width="${SW}" height="${SH}" fill="#fff" filter="url(#nb${k})" mask="url(#tn2${x}_${b})"/>`:'';
o+=fd+`<mask id="mp${k}" maskUnits="userSpaceOnUse" x="0" y="0" width="${SW}" height="${SH}">${tone}${shape}</mask><g id="q${k}" clip-path="url(#shc${t.id})">${isOf(t)?`<g mask="url(#is${t.id})">`:''}<rect width="${SW}" height="${SH}" fill="${ci}" mask="url(#mp${k})"/>${txoG(t,'mp'+k)}${isOf(t)?'</g>':''}</g>`;{const _pc=o.slice(_ob);BK.PC[k]=_pc;BK.P[k]=bkH(_pc+'|'+(BK.PF[x]||''));o=o.slice(0,_ob)+'<!--@P:'+k+'-->'+_pc+'<!--@-->'}});BK.PD.set(x,{k:_ck,o:o.slice(_o0),pf:BK.PF[x],pc:_bt.map(b=>{const k=x+'_'+b;return[k,BK.PC[k],BK.P[k]]})})});
useT(WBS.tiles[WBS.cur]);return o}
function renderL(){const L=WBS.layers[WBS.selL],pa=col(WBS.proj.bg);
$('lyl').innerHTML=WBS.layers.map((l,i)=>i).reverse().map(i=>{const l=WBS.layers[i];return`<div class="lr${lyGrp().includes(i)?' on':''}" data-l="${i}"><input type="checkbox" title="Show or hide"${l.vis?' checked':''}><span class="ln">${hx(l.name)}</span><button class="alt" data-up title="Bring forward">&#9650;</button><button class="alt" data-dn title="Send back">&#9660;</button></div>`}).join('');
$('lst').innerHTML=WBS.tiles.map(t=>{useT(t);return`<button data-s="${t.id}" class="${L.st.includes(t.id)?'on':''}" title="Use on this layer"><svg viewBox="0 0 ${SW} ${SH}"><path d="${shp(0)}" fill="${pa}"/><use href="#s${t.id}"/></svg></button>`}).join('');useT(WBS.tiles[WBS.cur])}
let raf=0,_lb=0,_lbt=0;const upd=()=>{if(raf)return;raf=requestAnimationFrame(()=>{raf=0;draw();if(drag&&WBS.DRAFT&&performance.now()-_lb<400){clearTimeout(_lbt);_lbt=setTimeout(upd,420)}else{_lb=performance.now();build()}if(typeof syncPr=='function')syncPr()})};
const ed=$('ed');let drag=null;
try{let _edr=0,_edw='';new ResizeObserver(()=>{const r=ed.getBoundingClientRect(),k=Math.round(r.width)+'x'+Math.round(r.height);if(k==_edw||!r.width)return;_edw=k;clearTimeout(_edr);_edr=setTimeout(()=>{if(window.wbGrade&&ed.classList.contains('graded'))wbGrade.refresh()},120)}).observe(ed)}catch(e){}
let ptM=null;const pt=e=>{const p=ed.createSVGPoint();p.x=e.clientX;p.y=e.clientY;return p.matrixTransform(ptM||ed.getScreenCTM().inverse())};
ed.onpointerdown=e=>{if(WBS.split){const h=e.target.closest('[data-sp]');if(h){e.preventDefault();ed.setPointerCapture(e.pointerId);const p=pt(e);WBS.spDrag={k:h.dataset.sp,ox:WBS.split.x-p.x,oy:WBS.split.y-p.y}}return}
if(WBS.brush){if(e.button!==0)return;e.preventDefault();let[x,y]=(()=>{const p=pt(e);return[p.x,p.y]})();if(grid.sd)[x,y]=snapPt(x,y);[x,y]=wrapP(x,y);const a=WBS.tiles[WBS.cur].items;a.push(it(WBS.brush.m,x,y,WBS.brush.s,WBS.brush.r));selOne(a.length-1);store();upd();return}
const g=e.target.closest('[data-i]');if(!g){if(!(e.shiftKey||e.ctrlKey||e.metaKey))selOne(-1);draw();return}
{const gi=+g.dataset.i;if(e.shiftKey||e.ctrlKey||e.metaKey){e.preventDefault();selToggle(gi);upd();return}if(WBS.msel.has(gi))WBS.sel=gi;else selOne(gi)}const c=+g.dataset.c||0,q=WBS.tiles[WBS.cur].items[WBS.sel],p=pt(e),o=c?symOps(WBS.tiles[WBS.cur])[c-1]:null,cp=o?o.p(mod(q.x,SW),mod(q.y,SH)):[q.x,q.y];let dx=cp[0]-p.x,dy=cp[1]-p.y;if(!o){let bd=1e18;OFFS.forEach(([ax,ay])=>{const ex=q.x+ax-p.x,ey=q.y+ay-p.y,d=ex*ex+ey*ey;if(d<bd){bd=d;dx=ex;dy=ey}})}drag={dx,dy,o,px:q.x,py:q.y,st:[...WBS.msel].filter(j=>j!=WBS.sel).map(j=>{const w=WBS.tiles[WBS.cur].items[j];return[w,w.x,w.y]})};ed.setPointerCapture(e.pointerId);ptM=ed.getScreenCTM().inverse();WBS.WBDRG=1;$('texg').style.display='none';e.preventDefault();upd()};
ed.onpointermove=e=>{if(WBS.spDrag){const p=pt(e);if(WBS.spDrag.k=='m'){WBS.split.x=p.x+WBS.spDrag.ox;WBS.split.y=p.y+WBS.spDrag.oy}else{let a=Math.atan2(p.y-WBS.split.y,p.x-WBS.split.x)*180/Math.PI;if(e.shiftKey)a=Math.round(a/15)*15;WBS.split.a=a}draw();return}
if(WBS.brush){WBS.gp=pt(e);paintGhost();return}if(!drag)return;const q=WBS.tiles[WBS.cur].items[WBS.sel],p=pt(e),x=p.x+drag.dx,y=p.y+drag.dy;[q.x,q.y]=drag.o?drag.o.i(x,y):[x,y];if(grid.sd)[q.x,q.y]=snapPt(q.x,q.y);const ddx=q.x-drag.px,ddy=q.y-drag.py;drag.st.forEach(([w,ox,oy])=>{w.x=ox+ddx;w.y=oy+ddy});upd()};
ed.onpointerup=ed.onpointercancel=()=>{ptM=null;WBS.WBDRG=0;if(!drag)return;const q=WBS.tiles[WBS.cur].items[WBS.sel];[q.x,q.y]=wrapP(q.x,q.y);drag.st.forEach(([w])=>{[w.x,w.y]=wrapP(w.x,w.y)});drag=null;$('texg').style.display='';store();upd()};
const Q=()=>WBS.tiles[WBS.cur].items[WBS.sel];
