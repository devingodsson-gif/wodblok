// ---- Symmetry: live copies of each motif, generated at draw time from t.sym = {m, n}
const SYM=[['off','Off'],['lr','Left ↔ right'],['ud','Up ↕ down'],['quad','4-way'],['star','8-way'],['hex','Hex'],['kal','Kaleido',2,12,6,'Mirrors'],['rot','Circular',2,16,6,'Copies'],['rx','Repeat ↔',2,6,2,'Repeats'],['ry','Repeat ↕',2,6,2,'Repeats'],['grid','Repeat grid',2,6,2,'Repeats']];
const SYMH={off:'Pick a symmetry to have every motif copied automatically.',lr:'Motifs are mirrored across the line. Work in the shaded half.',ud:'Motifs are mirrored across the line. Work in the shaded half.',quad:'Mirrored four ways. Work in the shaded quarter.',star:'Mirrored eight ways, like a snowflake. Work in the shaded slice.',hex:'Six mirrors on a hexagon. Work in the shaded slice.',kal:'Mirrored around the center. Work in the shaded slice.',rot:'Copies turn around the center, no flipping. Work in the shaded slice.',rx:'Repeated across the stamp. Work in the shaded strip.',ry:'Repeated down the stamp. Work in the shaded strip.',grid:'Repeated in a grid. Work in the shaded cell.'};
const REP=['rx','ry','grid'],symOf=t=>{const S=t.sym||{};let d=SYM.find(x=>x[0]==S.m)||SYM[0];if(SK!='rect'&&REP.includes(d[0]))d=SYM[0];return{m:d[0],n:d[2]?Math.max(d[2],Math.min(d[3],S.n||d[4])):0,d}};
const nr=r=>mod(r+180,360)-180,RAD=Math.PI/180;
function symOps(t){const{m,n}=symOf(t),C=SW/2,D=SH/2,o=[];
const rot=a=>{const c=Math.cos(a*RAD),s=Math.sin(a*RAD);return{p:(x,y)=>[C+(x-C)*c-(y-D)*s,D+(x-C)*s+(y-D)*c],i:(x,y)=>[C+(x-C)*c+(y-D)*s,D-(x-C)*s+(y-D)*c],r:r=>r+a,f:f=>f}};
const ref=th=>{const c=Math.cos(2*th*RAD),s=Math.sin(2*th*RAD),p=(x,y)=>[C+(x-C)*c+(y-D)*s,D+(x-C)*s-(y-D)*c];return{p,i:p,r:r=>2*th+180-r,f:f=>-f}};
const sh=(dx,dy)=>({p:(x,y)=>[x+dx,y+dy],i:(x,y)=>[x-dx,y-dy],r:r=>r,f:f=>f});
const kal=k=>{for(let j=1;j<k;j++)o.push(rot(360*j/k));for(let j=0;j<k;j++)o.push(ref(90+180*j/k))};
if(m=='lr')o.push(ref(90));else if(m=='ud')o.push(ref(0));else if(m=='quad')kal(2);else if(m=='star')kal(4);else if(m=='hex')kal(6);else if(m=='kal')kal(n);
else if(m=='rot')for(let j=1;j<n;j++)o.push(rot(360*j/n));
else if(m=='rx')for(let j=1;j<n;j++)o.push(sh(SW*j/n,0));else if(m=='ry')for(let j=1;j<n;j++)o.push(sh(0,SH*j/n));
else if(m=='grid')for(let a=0;a<n;a++)for(let b=0;b<n;b++)if(a||b)o.push(sh(SW*a/n,SH*b/n));
return o}
function expand(t){const ops=symOps(t),out=[];t.items.forEach((q,i)=>{out.push([q,i,0]);const[x0,y0]=wrapP(q.x,q.y);
ops.forEach((o,c)=>{const[x,y]=o.p(x0,y0);const w=wrapP(x,y);out.push([{...q,x:w[0],y:w[1],r:nr(o.r(q.r)),f:o.f(q.f),...(q.cl?{cl:q.cl.map(a=>a.slice())}:{})},i,c+1])})});return out}
// Guide lines (and a shaded "work here" area) for a symmetry mode
function symG(m,n,w,clip){const C=SW/2,D=SH/2,R=Math.max(SW,SH)+40,A=a=>[C+R*Math.cos(a*RAD),D+R*Math.sin(a*RAD)],f=v=>v.toFixed(1);
const L=(x1,y1,x2,y2)=>`<line x1="${f(x1)}" y1="${f(y1)}" x2="${f(x2)}" y2="${f(y2)}"/>`,full=a=>{const[x1,y1]=A(a),[x2,y2]=A(a+180);return L(x1,y1,x2,y2)},ray=a=>{const[x,y]=A(a);return L(C,D,x,y)};
const wedge=(a0,a1)=>{const[x0,y0]=A(a0),[x1,y1]=A(a1);return`<path d="M${C} ${D}L${f(x0)} ${f(y0)}A${R} ${R} 0 ${a1-a0>180?1:0} 1 ${f(x1)} ${f(y1)}Z"/>`},box=(x,y,wd,h)=>`<rect x="${x}" y="${y}" width="${wd}" height="${h}"/>`;
let sh='',g='';
if(m=='lr'){sh=box(C,0,C,SH);g=L(C,-30,C,SH+30)}
else if(m=='ud'){sh=box(0,0,SW,D);g=L(-30,D,SW+30,D)}
else if(m=='quad'){sh=box(C,0,C,D);g=L(C,-30,C,SH+30)+L(-30,D,SW+30,D)}
else if(m=='star'||m=='hex'||m=='kal'){const k=m=='star'?4:m=='hex'?6:n;sh=wedge(-90,-90+180/k);for(let j=0;j<k;j++)g+=full(90+180*j/k);
if(m=='hex')[62,112].forEach(r=>{g+=`<polygon points="${[0,1,2,3,4,5].map(j=>f(C+r*Math.cos(((SK=='hex'&&HO=='f'?0:-90)+60*j)*RAD))+','+f(D+r*Math.sin(((SK=='hex'&&HO=='f'?0:-90)+60*j)*RAD))).join(' ')}"/>`})}
else if(m=='rot'){sh=wedge(-90,-90+360/n);for(let j=0;j<n;j++)g+=ray(-90+360*j/n);g+=`<circle cx="${C}" cy="${D}" r="${Math.min(C,D)*.75}"/>`}
else if(m=='rx'||m=='ry'||m=='grid'){const s=SW/n,u=SH/n;sh=m=='rx'?box(0,0,s,SH):m=='ry'?box(0,0,SW,u):box(0,0,s,u);for(let j=1;j<n;j++){if(m!='ry')g+=L(j*s,-30,j*s,SH+30);if(m!='rx')g+=L(-30,j*u,SW+30,j*u)}}
if(!g)return'';
return`<g pointer-events="none"${clip?' clip-path="url(#ec)"':''}><g fill="#c8694a" fill-opacity=".12">${sh}</g><g fill="none" stroke="#c8694a" stroke-width="${w}" stroke-dasharray="${w*4} ${w*3}" stroke-linecap="round">${g}</g>${m=='lr'||m=='ud'||m[0]=='r'&&m!='rot'||m=='grid'?'':`<circle cx="${C}" cy="${D}" r="${w*2.2}" fill="#c8694a"/>`}</g>`}
WBS.symKey='';WBS.curView='pattern'; // (view only; exports always keep both textures)
function tbSync(){try{const p=WBS.curView=='pattern',a=WBS.edInk,b=WBS.edTx,gi=$('gti'),gx=$('gtx');if(!gi||!gx)return;gi.classList.toggle('on',a);gi.setAttribute('aria-pressed',String(a));gx.classList.toggle('on',b);gx.setAttribute('aria-pressed',String(b));
if(p){gi.title=WBS.tiles.some(isOf)?'Show the stamp texture in the pattern (view only)':'No stamp has a stamp texture set (see Stamp texture in the stamp panel)';gx.title=WBS.tex.t?'Show the canvas texture in the pattern (view only)':'This project has no canvas texture set'}}catch(e){}}
function renderSym(t){const{m,n,d}=symOf(t),k=m+n+col(WBS.proj.bg)+SW+'x'+SH+SK+HO;if(k==WBS.symKey)return;WBS.symKey=k;
$('sym').innerHTML=SYM.filter(x=>SK=='rect'||!REP.includes(x[0])).map(x=>{const nn=x[0]==m?n:x[4]||0;return`<button type="button" data-y="${x[0]}" class="${x[0]==m?'on':''}"><svg viewBox="-12 -12 ${SW+24} ${SH+24}"><path d="${shp(0)}" fill="none" stroke="currentColor" stroke-width="7" opacity=".35"/>${symG(x[0],nn,9,0)}</svg>${x[1]}</button>`}).join('');
$('symn').hidden=!d[2];if(d[2]){$('sn').min=d[2];$('sn').max=d[3];$('sn').value=n;$('snl').textContent=d[5]}
$('symh').textContent=SYMH[m];$('sbkr').hidden=m=='off'}
