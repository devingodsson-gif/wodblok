// ---- Print effects (applied to all stamped ink, under the cover label) ----
// Edge roughness: outlines wobble and ink spreads a little, without flattening ink-density variation inside shapes.
// Ink squash: a darker rim where ink is pushed out, lighter middle.
// Ink surface: a mask that knocks ink out (fully or partly) in the pattern of a real printing fault.
let pr={e:3,q:0,t:'speckle',a:35,sc:100,sd:811};
try{const q=JSON.parse(localStorage.getItem('wb11_print')||'null');if(q&&typeof q=='object')pr={...pr,...q}}catch(e){}
const savePr=()=>{try{localStorage.setItem('wb11_print',JSON.stringify(pr))}catch(e){}};
const PDESC={'':'Solid, even ink.',speckle:'Tiny pinholes where the paper did not pick up ink, clustered in places.',grain:'Streaks of missing ink following the wood grain of the block.',dry:'Too little ink on the roller: large patches break up into broken, speckled ink.',mottle:'Ink density varies in soft blotches with a few white salt spots, like a solid area printed by hand.',laid:'Fine horizontal lines where the ridges of laid paper skipped the ink.',linen:'A woven crosshatch where ink only reached the raised threads of cloth or a textured sheet.',worn:'An old, damaged block: fine cracks through the ink and small chips missing.'};
// Ink surface now belongs to each stamp: t.is = {t: type, a: amount 0-100, sc: scale %, sd: variation}. t.is.t === '' means clean.
// It is drawn inside the stamp itself, in the stamp's own coordinates; ref keeps the grain at the size it had when it was one setting for the whole canvas.
// ---- Stamp texture, drawn as real vector shapes (a mask over the ink) so it stays smooth at any zoom and in any browser ----
// Every texture is built from a seeded random generator, so "New variation" just changes the seed. Results are cached per setting.
const SVC=new Map();
function sRng(seed){let a=(seed>>>0)||1;return()=>{a=(a+0x6D2B79F5)|0;let t=Math.imul(a^(a>>>15),1|a);t=(t+Math.imul(t^(t>>>7),61|t))^t;return((t^(t>>>14))>>>0)/4294967296}}
function sHash(ix,iy,s){let h=(Math.imul(ix,374761393)+Math.imul(iy,668265263)+Math.imul(s,1274126177))|0;h=Math.imul(h^(h>>>13),1274126177);return(((h^(h>>>16))>>>0))/4294967296}
function sVN(x,y,s){const ix=Math.floor(x),iy=Math.floor(y),fx=x-ix,fy=y-iy,u=fx*fx*(3-2*fx),v=fy*fy*(3-2*fy),a=sHash(ix,iy,s),b=sHash(ix+1,iy,s),c=sHash(ix,iy+1,s),d=sHash(ix+1,iy+1,s);return a+(b-a)*u+(c-a)*v+(a-b-c+d)*u*v}
function sFbm(x,y,s,o){let r=0,amp=.5,tot=0;for(let i=0;i<o;i++){r+=sVN(x,y,s+i*17)*amp;tot+=amp;x*=2;y*=2;amp*=.5}return r/tot}
const sCon=(v,g)=>Math.max(0,Math.min(1,.5+(v-.5)*g)),sF=v=>+v.toFixed(2);
// one small ellipse as a closed path (rot in radians)
function sBlob(x,y,rx,ry,rot){const c=Math.cos(rot),s=Math.sin(rot),dx=c*rx,dy=s*rx,d=sF(rot*57.2958);return`M${sF(x-dx)} ${sF(y-dy)}a${sF(rx)} ${sF(ry)} ${d} 1 0 ${sF(2*dx)} ${sF(2*dy)}a${sF(rx)} ${sF(ry)} ${d} 1 0 ${sF(-2*dx)} ${sF(-2*dy)}`}
// jittered grid of holes drawn as round-capped strokes (a dot, or a short capsule), bucketed by width: ~4x less markup than one ellipse path per hole.
// pfn(x,y) is the chance (0-1) that a cell gets one
function sDots(R,W,H,cell,pfn,rmin,rmax,asp){const nb=10,b=new Array(nb).fill(''),nx=Math.ceil(W/cell),ny=Math.ceil(H/cell),w0=2*cell*rmin*asp,w1=2*cell*rmax,f1=v=>+v.toFixed(1);
for(let j=0;j<ny;j++)for(let i=0;i<nx;i++){const x=(i+R())*cell,y=(j+R())*cell;if(R()>=pfn(x,y))continue;const r=cell*(rmin+(rmax-rmin)*R()),w=2*r*(asp+(1-asp)*R()),L=2*r-w,th=R()*Math.PI,k=Math.max(0,Math.min(nb-1,Math.round((w-w0)/(w1-w0)*(nb-1))));b[k]+=L<w*.2?`M${f1(x)} ${f1(y)}h0`:`M${f1(x)} ${f1(y)}l${f1(Math.cos(th)*L)} ${f1(Math.sin(th)*L)}`}
return b.map((d,k)=>d?`<path d="${d}" fill="none" stroke="#000" stroke-linecap="round" stroke-width="${sF(w0+(w1-w0)*k/(nb-1))}"/>`:'').join('')}
// rows of thin bars (horizontal, or vertical with v:1); returns 3 paths of different strength
function sSegs(R,W0,H0,o){const W=o.v?H0:W0,H=o.v?W0:H0,g=[[],[],[]];for(let y=R()*o.pitch;y<H;y+=o.pitch){let x=-R()*o.len[1];while(x<W){const len=o.len[0]+(o.len[1]-o.len[0])*R(),f=o.field?o.field(o.v?y:x+len/2,o.v?x+len/2:y):1;if(R()<Math.min(1,o.cov*f)){const th=o.pitch*(o.th[0]+(o.th[1]-o.th[0])*R()),yy=y+R()*o.pitch*.4,k=R()<.5?0:R()<.6?1:2;g[k].push(o.v?`M${sF(yy)} ${sF(x)}v${sF(len)}h${sF(th)}v${sF(-len)}z`:`M${sF(x)} ${sF(yy)}h${sF(len)}v${sF(th)}h${sF(-len)}z`)}x+=len}}return g}
const sGrp=(g,ops)=>g.map((a,i)=>a.length?`<path fill="#000" fill-opacity="${ops[i]}" d="${a.join('')}"/>`:'').join('');
// a crack: a wandering line that sometimes branches
function sCrack(R,x,y,ang,len,step,out,depth,w){let d=`M${sF(x)} ${sF(y)}`;const n=Math.max(2,Math.floor(len/step));for(let i=0;i<n;i++){ang+=(R()-.5)*.6;x+=Math.cos(ang)*step;y+=Math.sin(ang)*step;d+=`L${sF(x)} ${sF(y)}`;if(depth<2&&R()<.04)sCrack(R,x,y,ang+(R()<.5?-1:1)*(.5+R()*.9),len*.35,step,out,depth+1,w*.7)}out.push(`<path d="${d}" fill="none" stroke="#000" stroke-width="${sF(w)}" stroke-linecap="round" stroke-linejoin="round"/>`)}
function surfVec(o,SW,SH,ref){const key=[o.t,o.a,o.sc,o.sd,SW,SH].join('|');if(SVC.has(key))return SVC.get(key);
const A=Math.max(0,Math.min(1,(+o.a||0)/100)),fk=100/Math.max(25,+o.sc||100)*ref,S=(+o.sd||1)|0,R=sRng(S*9973+7),CAP=26000,fld=(wl,sd,oc,g)=>{const gs=wl/5,gw=Math.ceil(SW/gs)+2,gh=Math.ceil(SH/gs)+2,V=new Float32Array(gw*gh);for(let j=0;j<gh;j++)for(let i=0;i<gw;i++)V[j*gw+i]=sCon(sFbm(i/5,j/5,S+sd,oc||3),g||2.4);return(x,y)=>{const fx=Math.max(0,x/gs),fy=Math.max(0,y/gs),i=Math.min(gw-2,fx|0),j=Math.min(gh-2,fy|0),u=fx-i,v=fy-j,k=j*gw+i;return V[k]*(1-u)*(1-v)+V[k+1]*u*(1-v)+V[k+gw]*(1-u)*v+V[k+gw+1]*u*v}},u=1/fk;let out='';
switch(o.t){
case'speckle':{const cell=Math.max(.8/(.8*fk),Math.sqrt(SW*SH/CAP)),D=fld(1/(.03*fk),101),cov=.03+1.3*A;
out=sDots(R,SW,SH,cell,(x,y)=>Math.min(1,cov*(.3+1.4*D(x,y))),.2,.52,.4);break}
case'dry':{const cell=Math.max(.7/(.6*fk),Math.sqrt(SW*SH/CAP)),D=fld(1/(.012*fk),103),thr=.55+.85*A;
out=sDots(R,SW,SH,cell,(x,y)=>Math.min(.95,Math.max(0,(thr-D(x,y))/.2)),.22,.55,.4);break}
case'mottle':{const r0=.5/(.035*fk),n=Math.round(SW*SH/(Math.PI*r0*r0)*(1.1+1.9*A));let e='';
for(let i=0;i<n;i++){const x=R()*SW,y=R()*SH,rx=r0*(.6+.9*R()),ry=rx*(.6+.4*R()),rot=R()*180,op=((.18+.42*A)*(.6+.4*R())).toFixed(2);e+=`<ellipse cx="${sF(x)}" cy="${sF(y)}" rx="${sF(rx)}" ry="${sF(ry)}" transform="rotate(${sF(rot)} ${sF(x)} ${sF(y)})" fill="url(#@G@)" opacity="${op}"/>`}
const cell=Math.max(1/(.5*fk),Math.sqrt(SW*SH/CAP)),D2=fld(1/(.06*fk),105,2);
out=`<defs><radialGradient id="@G@"><stop offset="0" stop-color="#000" stop-opacity="1"/><stop offset=".55" stop-color="#000" stop-opacity=".55"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient></defs>${e}${sDots(R,SW,SH,cell,(x,y)=>Math.min(1,(.09+.16*A)*(.2+1.8*D2(x,y))),.2,.45,.45)}`;break}
case'grain':{const pitch=.8/(.38*fk),lm=Math.min(SW,1/(.004*fk))*.6,F=(x,y)=>sCon(sFbm(x*.004*fk,y*.12*fk,S+107,3),2.2),g=[[],[],[]];
for(let y=R()*pitch;y<SH;y+=pitch){let x=-R()*lm;while(x<SW){const len=lm*(.15+.85*R()),f=F(x+len/2,y);if(R()<Math.min(1,(.28+1.1*A)*(.3+1.4*f))){const th=pitch*(.45+.95*R()),wa=pitch*(.25+.5*R()),wl=30+60*R(),ph=R()*6.3,k=R()<.5?0:R()<.6?1:2,top=[],bot=[];
for(let px=x;px<=x+len+.1;px+=Math.min(6,len/6)){const w=wa*Math.sin(px/wl+ph)+wa*.5*Math.sin(px/(wl*.37)+ph*2.1),tp=Math.pow(Math.max(0,Math.sin(Math.PI*Math.min(1,(px-x)/len))),.45),hh=th*tp/2;top.push(`${sF(px)} ${sF(y+w-hh)}`);bot.push(`${sF(px)} ${sF(y+w+hh)}`)}
g[k].push('M'+top.join('L')+'L'+bot.reverse().join('L')+'z')}x+=len}}
out=sGrp(g,[.95,.7,.45]);break}
case'laid':{const F=fld(1/(.02*fk),109,2,1.6),g=sSegs(R,SW,SH,{pitch:1/(.75*fk),th:[.5,.95],len:[10,90],cov:.46+.55*A,field:(x,y)=>.5+F(x,y)});let c='';
for(let x=R()*38*u;x<SW;x+=1/(.035*fk)*(.8+.4*R()))if(R()<.5)c+=`M${sF(x)} 0h${sF(.5*u)}v${sF(SH)}h${sF(-.5*u)}z`;
out=sGrp(g,[.85,.55,.3])+(c?`<path fill="#000" fill-opacity=".25" d="${c}"/>`:'');break}
case'linen':{const o2={pitch:1/(1.1*fk),th:[.35,.8],len:[3*u,13*u],cov:.2+.32*A},h=sSegs(R,SW,SH,o2),v=sSegs(R,SW,SH,{...o2,v:1});
out=sGrp(h,[.9,.6,.35])+sGrp(v,[.9,.6,.35]);break}
case'worn':{const cr=[],n=Math.round(6+18*A);for(let i=0;i<n;i++)sCrack(R,R()*SW,R()*SH,R()*6.283,(80+200*R()),2*u,cr,0,u*(.7+.9*R()));
const m=Math.round(4+18*A);let chips='';for(let i=0;i<m;i++){const cx=R()*SW,cy=R()*SH,r=u*(2.5+6*R()),pts=[];for(let k=0;k<7;k++){const a=k/7*6.283+R()*.5,rr=r*(.6+.8*R());pts.push(`${sF(cx+Math.cos(a)*rr)} ${sF(cy+Math.sin(a)*rr)}`)}chips+='M'+pts.join('L')+'z'}
out=cr.join('')+(chips?`<path fill="#000" d="${chips}"/>`:'');break}
}
if(SVC.size>40)SVC.delete(SVC.keys().next().value);SVC.set(key,out);return out}





