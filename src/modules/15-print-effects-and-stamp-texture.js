
// Ink surface now belongs to each stamp: t.is = {t: type, a: amount 0-100, sc: scale %, sd: variation}. t.is.t === '' means clean.
// It is drawn inside the stamp itself, in the stamp's own coordinates; ref keeps the grain at the size it had when it was one setting for the whole canvas.
// ---- Stamp texture, drawn as real vector shapes (a mask over the ink) so it stays smooth at any zoom and in any browser ----
// Every texture is built from a seeded random generator, so "New variation" just changes the seed. Results are cached per setting.
let SVC;
function sRng(seed){let a=(seed>>>0)||1;return()=>{a=(a+0x6D2B79F5)|0;let t=Math.imul(a^(a>>>15),1|a);t=(t+Math.imul(t^(t>>>7),61|t))^t;return((t^(t>>>14))>>>0)/4294967296}}
function sHash(ix,iy,s){let h=(Math.imul(ix,374761393)+Math.imul(iy,668265263)+Math.imul(s,1274126177))|0;h=Math.imul(h^(h>>>13),1274126177);return(((h^(h>>>16))>>>0))/4294967296}
function sVN(x,y,s){const ix=Math.floor(x),iy=Math.floor(y),fx=x-ix,fy=y-iy,u=fx*fx*(3-2*fx),v=fy*fy*(3-2*fy),a=sHash(ix,iy,s),b=sHash(ix+1,iy,s),c=sHash(ix,iy+1,s),d=sHash(ix+1,iy+1,s);return a+(b-a)*u+(c-a)*v+(a-b-c+d)*u*v}
function sFbm(x,y,s,o){let r=0,amp=.5,tot=0;for(let i=0;i<o;i++){r+=sVN(x,y,s+i*17)*amp;tot+=amp;x*=2;y*=2;amp*=.5}return r/tot}
const sCon=(v,g)=>Math.max(0,Math.min(1,.5+(v-.5)*g)),sF=v=>+v.toFixed(2);
// one small ellipse as a closed path (rot in radians)
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
function init15(){// ---- Print effects (applied to all stamped ink, under the cover label) ----
// Edge roughness: outlines wobble and ink spreads a little, without flattening ink-density variation inside shapes.
// Ink squash: a darker rim where ink is pushed out, lighter middle.
// Ink surface: a mask that knocks ink out (fully or partly) in the pattern of a real printing fault.
SVC=new Map();
}
export {sRng,init15};
