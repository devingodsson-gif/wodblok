import {WBS} from './01-launch-and-version.js';
import {sRng} from './15-print-effects-and-stamp-texture.js';

const TXF=[['Paper and board',{cotton:'Cotton Rag',cold:'Cold Press',laid:'Laid Lines',washi:'Washi',kraft:'Kraft',news:'Newsprint',crumple:'Crumpled'}],
['Cloth and weave',{linen:'Linen',canvas:'Canvas',burlap:'Burlap',denim:'Denim Twill',felt:'Felt'}],
['Natural',{wood:'Wood Grain',bark:'Bark',cork:'Cork',leather:'Leather'}],
['Stone and mineral',{plaster:'Plaster',granite:'Granite',marble:'Marble Veins',concrete:'Concrete'}],
['Metal and made',{brushed:'Brushed Metal',hammered:'Hammered',halftone:'Halftone Dots',riso:'Riso Grain'}],
['Print faults and wear',{dry:'Dry Roller',pinholes:'Pinholes',blotchy:'Blotchy Wash',worn:'Worn Block',scuff:'Scuffed',foxing:'Foxing'}]];
const TXN={};
const TXMD=['wear','relief','stain'],TXMN={wear:'Wear',relief:'Relief',stain:'Stain'};
// textures from before v87 become their closest new one
const TXLEG={ink:{speckle:'pinholes',grain:'wood',dry:'dry',mottle:'blotchy',laid:'laid',linen:'linen',worn:'worn'},surf:{cotton:'cotton',cold:'cold',laid:'laid',washi:'washi',kraft:'kraft',parch:'washi',crumple:'crumple',linen:'linen',canvas:'canvas',burlap:'burlap',leather:'leather',wood:'wood',plaster:'plaster',stone:'plaster',concrete:'concrete',grit:'plaster',metal:'brushed',stain:'foxing'}};
const txRid=()=>1+Math.floor(Math.random()*99999),txUid=()=>'x'+Date.now().toString(36)+Math.random().toString(36).slice(2,6);
const txLib=id=>id?WBS.texLib.find(x=>x.id===id)||null:null;
function txUniq(b){let n=b,i=2;while(WBS.texLib.some(x=>x.name===n))n=b+' '+i++;return n}
function txMake(t,o){return{id:txUid(),name:txUniq(TXN[t]||'Texture'),t,a:40,sc:100,az:225,sd:txRid(),auto:false,...(o||{})}}
const txSame=(x,s)=>x.t===s.t&&+x.a===+s.a&&+x.sc===+s.sc&&+x.az===+s.az;
function txEnsure(s){const m=WBS.texLib.find(x=>txSame(x,s));if(m)return m.id;const L=txMake(s.t,{...s,auto:true});WBS.texLib.push(L);return L.id}
function txClean(a){if(!Array.isArray(a))return[];const ok=[],ids=new Set(),n=(v,lo,hi,d)=>{v=+v;return isFinite(v)?Math.max(lo,Math.min(hi,v)):d};
a.slice(0,200).forEach(x=>{if(!x||typeof x!='object')return;let t=x.t,leg=0;if(x.fam==='ink'||x.fam==='surf'){t=TXLEG[x.fam][x.t];leg=1}if(!t||!Object.prototype.hasOwnProperty.call(TXN,t))return;
const id=String(x.id||'').replace(/[^\w-]/g,'').slice(0,24);if(!id||ids.has(id))return;ids.add(id);
const L={id,name:String(x.name||TXN[t]).replace(/[<>&"]/g,'').slice(0,40),t,a:n(leg&&x.fam==='surf'?x.it:x.a,0,100,40),sc:n(x.sc,25,300,100),az:n(x.az,0,359,225),sd:n(x.sd,1,99999,1)|0,auto:!!x.auto};
if(leg&&x.fam==='surf'&&+x.ink>0)L._k=n(x.ink,0,100,0);if(+x._k>0)L._k=n(x._k,0,100,0);ok.push(L)});return ok}
// a use -> everything the renderer needs (null = nothing to draw). def = the mode a use gets when it has none
const txSpec=(u,def)=>{const L=u&&typeof u=='object'?txLib(u.x):null;if(!L||!TXN[L.t]||!(+L.a>0))return null;return{x:L.id,t:L.t,a:+L.a,sc:+L.sc||100,az:isFinite(+L.az)?+L.az:225,sd:((+u.sd||+L.sd||1)|0)||1,md:TXMD.includes(u.md)?u.md:def}};
const txSpecs=(l,def)=>(Array.isArray(l)?l:[]).slice(0,6).map(u=>txSpec(u,def)).filter(Boolean);
const txKey=q=>[q.t,q.a,q.sc,q.sd,q.md=='relief'?q.az:'',q.md].join(',');
const isOf=t=>{const r=txSpecs(t&&t.tu,'wear');return r.length?r:null};
// ---------- the generators ----------
// each one makes a height map: 1 = untouched / high, low = where wear bites, ink drains, the surface dips
const txc=v=>v<0?0:v>1?1:v,txs=(a,b,v)=>{const t=txc((v-a)/(b-a));return t*t*(3-2*t)},txfr=v=>v-Math.floor(v);
function txNoise(seed){const R=sRng(seed*7919+13),T=new Float32Array(65536);for(let i=0;i<65536;i++)T[i]=R();
const n=(x,y)=>{const ix=Math.floor(x),iy=Math.floor(y),fx=x-ix,fy=y-iy,u=fx*fx*(3-2*fx),v=fy*fy*(3-2*fy),x0=ix&255,y0=(iy&255)<<8,x1=(ix+1)&255,y1=((iy+1)&255)<<8,a=T[x0|y0],b=T[x1|y0],c=T[x0|y1],d=T[x1|y1];return a+(b-a)*u+(c-a)*v+(a-b-c+d)*u*v};
const f=(x,y,o)=>{let r=0,A=.5,t=0;for(let i=0;i<o;i++){r+=n(x,y)*A;t+=A;x=x*2+17.3;y=y*2+9.1;A*=.5}return r/t};return{n,f}}
function txWorley(seed){const h=(ix,iy,k)=>{let q=(Math.imul(ix,374761393)+Math.imul(iy,668265263)+Math.imul(seed*31+k,1274126177))|0;q=Math.imul(q^(q>>>13),1274126177);return((q^(q>>>16))>>>0)/4294967296},o={d1:0,d2:0,id:0};
o.at=(x,y)=>{const ix=Math.floor(x),iy=Math.floor(y);let d1=9,d2=9,id=0;for(let j=-1;j<=1;j++)for(let i=-1;i<=1;i++){const cx=ix+i,cy=iy+j,dx=cx+h(cx,cy,0)-x,dy=cy+h(cx,cy,1)-y,d=dx*dx+dy*dy;if(d<d1){d2=d1;d1=d;id=h(cx,cy,2)}else if(d<d2)d2=d}o.d1=Math.sqrt(d1);o.d2=Math.sqrt(d2);o.id=id};return o}
function txWeave(N,X,Y,F,o){const u=X*F,v=Y*F,iu=Math.floor(u),iv=Math.floor(v),fu=u-iu,fv=v-iv,up=o.twill?((((iu-iv)%3)+3)%3===0):(((iu+iv)&1)===0),w=o.w||.35,
pu=txs(0,w,.5-Math.abs(fu-.5)),ph=txs(0,w,.5-Math.abs(fv-.5)),su=1-o.sl+o.sl*N.n(iu*3.1+.5,v*.16+iu*7),sh=1-o.sl+o.sl*N.n(u*.16+iv*5,iv*3.7+50);
const h=up?.5+.5*pu*su:.5+.5*ph*sh;return txc(h*(1-(o.gap||0)*(1-Math.max(pu,ph))))}
const TXT={
// ---- paper and board ----
cotton:{cov:.6,ss:1,f:c=>{const N=c.N;return(X,Y)=>txc(.32*N.f(X*70,Y*26,2)+.32*N.f(X*26,Y*70,2)+.36*N.f(X*9,Y*9,3))}},
cold:{cov:.6,f:c=>{const N=c.N;return(X,Y)=>txs(.18,.82,.6*N.f(X*18,Y*18,3)+.4*N.f(X*52,Y*52,2))}},
laid:{cov:.55,f:c=>{const N=c.N;return(X,Y)=>{const w=N.f(X*3,Y*3,2),l=.5+.5*Math.cos((Y*110+w*2)*6.2832),ch=Math.exp(-Math.pow((txfr(X*8+w*.5)-.5)*8,2));return txc(.35*N.f(X*60,Y*30,2)+.45*l+.2*ch)}}},
washi:{cov:.55,f:c=>{const N=c.N,co=[Math.cos(.3),Math.sin(.3),Math.cos(1.1),Math.sin(1.1),Math.cos(-.7),Math.sin(-.7)];return(X,Y)=>{const wx=N.f(X*3,Y*3,2)*.25;let s=0;for(let i=0;i<3;i++){const a=co[i*2],b=co[i*2+1];s+=N.n((X*a+Y*b+wx)*7,(-X*b+Y*a)*170+i*9)}return txc(.5*txc(s/3*1.5-.25)+.5*N.f(X*4,Y*4,3))}}},
kraft:{cov:.6,f:c=>{const N=c.N;return(X,Y)=>{let h=.3*N.n(X*140,Y*14)+.3*N.n(X*14,Y*140)+.4*N.f(X*5,Y*5,3);if(N.n(X*210+5,Y*210)>.93)h-=.35;return txc(h)}}},
news:{cov:.6,f:c=>{const N=c.N;return(X,Y)=>txc(.45*N.f(X*14,Y*14,3)+.3*N.n(X*170,Y*60)+.25*N.n(X*190,Y*190))}},
crumple:{cov:.5,f:c=>{const N=c.N,W=c.W;return(X,Y)=>{const wx=N.f(X*3,Y*3,2)*.6,wy=N.f(X*3+7,Y*3+3,2)*.6;W.at(X*7+wx*3,Y*7+wy*3);return txc(.72*txs(0,.28,W.d2-W.d1)+.28*N.f(X*4,Y*4,3))}}},
// ---- cloth and weave ----
linen:{cov:.55,f:c=>{const N=c.N;return(X,Y)=>txc(txWeave(N,X,Y,64,{sl:.6,w:.4})*.85+.15*N.n(X*200,Y*200))}},
canvas:{cov:.55,f:c=>{const N=c.N;return(X,Y)=>txc(txWeave(N,X,Y,38,{sl:.35,w:.42})*.8+.2*N.f(X*90,Y*90,2))}},
burlap:{cov:.5,f:c=>{const N=c.N;return(X,Y)=>txc(txWeave(N,X,Y,11,{sl:.7,w:.3,gap:.75})*.9+.1*N.n(X*120,Y*120))}},
denim:{cov:.55,f:c=>{const N=c.N;return(X,Y)=>txc(txWeave(N,X,Y,70,{sl:.5,w:.4,twill:1})*.85+.15*N.n(X*180,Y*180))}},
felt:{cov:.6,f:c=>{const N=c.N;return(X,Y)=>txc(.55*N.f(X*45,Y*45,3)+.3*N.n(X*160,Y*160)+.15*N.f(X*8,Y*8,2))}},
// ---- natural ----
wood:{cov:.55,f:c=>{const N=c.N;return(X,Y)=>{const t=Y*18+N.f(X*1.6,Y*2.4,3)*2.2,fr=txfr(t),ring=fr<.75?fr/.75:(1-fr)/.25;return txc(.65*txs(0,1,ring)+.2*N.f(X*3,Y*120,2)+.15*(N.n(X*8,Y*320)>.7?1:.3))}}},
bark:{cov:.5,f:c=>{const N=c.N;return(X,Y)=>{const r1=1-Math.abs(2*N.f(X*6+N.n(Y*3,X*2)*1.2,Y*1.8,3)-1),r2=1-Math.abs(2*N.n(X*17,Y*4)-1);return txc(.7*Math.pow(r1,1.5)+.3*r2)}}},
cork:{cov:.5,f:c=>{const N=c.N,W=c.W;return(X,Y)=>{W.at(X*26,Y*26);let h=1.05-W.d1*1.3+W.id*.22-(W.d2-W.d1<.07?.25:0);if(N.n(X*90,Y*90)>.86)h-=.4;return txc(h)}}},
leather:{cov:.5,f:c=>{const N=c.N,W=c.W;return(X,Y)=>{const wx=N.f(X*9,Y*9,2)*.5;W.at(X*34+wx,Y*34+wx);return txc(.2+.7*txs(0,.2,W.d2-W.d1)*(.85+.15*W.id)+.05*N.n(X*160,Y*160)+.1*N.f(X*3,Y*3,2))}}},
// ---- stone and mineral ----
plaster:{cov:.55,f:c=>{const N=c.N;return(X,Y)=>{let h=.75*N.f(X*5,Y*5,4)+.15*N.n(X*28,Y*28);if(N.n(X*130,Y*130)>.9)h-=.25;return txc(h+.1)}}},
granite:{cov:.5,f:c=>{const N=c.N;return(X,Y)=>txc(.45*N.f(X*20,Y*20,3)+.3*txs(.55,.75,N.n(X*150,Y*150))+.25*(N.n(X*90+11,Y*90)>.7?1:0))}},
marble:{cov:.35,f:c=>{const N=c.N;return(X,Y)=>{const w=N.f(X*2,Y*2,4)*3,v=Math.abs(Math.sin((X*3.2+Y*1.4+w)*Math.PI)),v2=Math.abs(Math.sin((X*7.5-Y*3.1+w*1.7)*Math.PI)),vein=Math.pow(1-v,18)*(.4+.6*N.f(X*7,Y*7,2))+.5*Math.pow(1-v2,24)*N.f(X*11,Y*11,2);return txc((1-.85*txc(vein))*(.92+.08*N.f(X*30,Y*30,2)))}}},
concrete:{cov:.55,f:c=>{const N=c.N;return(X,Y)=>{let h=.55*N.f(X*11,Y*11,4)+.2*N.n(X*100,Y*100)+.2;if(N.n(X*60+3,Y*60)>.88)h-=.4;return txc(h)}}},
// ---- metal and made ----
brushed:{cov:.6,f:c=>{const N=c.N;return(X,Y)=>txc(.5*N.n(X*2.5,Y*520)+.3*N.n(X*8,Y*340)+.2*N.n(X*1.2,Y*40))}},
hammered:{cov:.55,f:c=>{const W=c.W;return(X,Y)=>{W.at(X*13,Y*13);return txc(.3+.7*Math.pow(txc(W.d1*1.5),1.5)*(.8+.2*W.id))}}},
halftone:{cov:.5,f:c=>{const N=c.N;return(X,Y)=>{const u=(X+Y)*.7071*70,v=(Y-X)*.7071*70,fu=txfr(u)-.5,fv=txfr(v)-.5,d=Math.sqrt(fu*fu+fv*fv),g=txc(.2+N.f(X*1.5,Y*1.5,2)*1.1),r=g*.62;return 1-txs(r+.06,r-.06,d)*(.6+.4*g)}}},
riso:{cov:.6,f:c=>{const N=c.N;return(X,Y)=>txc(.6*N.n(X*300,Y*300)+.4*N.n(X*130,Y*130))}},
// ---- print faults and wear ----
dry:{cov:.6,f:c=>{const N=c.N;return(X,Y)=>txc(.45*N.f(X*1.5,Y*26,3)+.35*N.f(X*5,Y*5,4)+.2*N.n(X*220,Y*95))}},
blotchy:{cov:.55,f:c=>{const N=c.N;return(X,Y)=>txs(.22,.78,N.f(X*3,Y*3,5))}},
worn:{cov:.5,f:c=>{const N=c.N,W=c.W;return(X,Y)=>{W.at(X*5+N.f(X*4,Y*4,2)*.7,Y*5+N.f(X*4+9,Y*4,2)*.7);const crack=1-txs(0,.07,W.d2-W.d1);return txc(1-.7*crack*(.5+.5*N.n(X*40,Y*40))-(1-N.f(X*12,Y*12,3))*.45+.2)}}},
// drawn: tiny holes / scratches / stains, each given a random rank p, so "Strength" decides how many show
pinholes:{raw:1,cov:.5,cv:(x,c)=>{const n=Math.round(70*c.fz),cell=c.P/n,R=c.R;x.globalCompositeOperation='darken';for(let j=0;j<Math.ceil(c.ph/cell);j++)for(let i=0;i<Math.ceil(c.pw/cell);i++){const px=(i+R())*cell,py=(j+R())*cell,r=cell*(.14+.34*R()),p=R()*255,g=x.createRadialGradient(px,py,0,px,py,r);g.addColorStop(0,`rgb(${p|0},${p|0},${p|0})`);g.addColorStop(.55,`rgb(${p|0},${p|0},${p|0})`);g.addColorStop(1,'#fff');x.fillStyle=g;x.beginPath();x.arc(px,py,r,0,6.2832);x.fill()}}},
scuff:{raw:1,cov:.5,cv:(x,c)=>{const R=c.R,n=Math.min(900,Math.round(300*c.fz)),base=R()*3.14;x.globalCompositeOperation='darken';x.lineCap='round';for(let i=0;i<n;i++){const p=R()*255|0,px=R()*c.pw,py=R()*c.ph,a=base+(R()-.5)*.9+(R()<.15?1.3:0),len=c.P*(.03+R()*R()*.45)/c.fz,bend=(R()-.5)*.4;x.strokeStyle=`rgb(${p},${p},${p})`;x.lineWidth=Math.max(.7,c.P*(.0012+R()*.0026)/c.fz);x.beginPath();x.moveTo(px,py);x.quadraticCurveTo(px+Math.cos(a+bend)*len*.5,py+Math.sin(a+bend)*len*.5,px+Math.cos(a)*len,py+Math.sin(a)*len);x.stroke()}}},
foxing:{raw:1,cov:.5,cv:(x,c)=>{const R=c.R,n=Math.round(34*c.fz*c.fz+6);x.globalCompositeOperation='darken';for(let i=0;i<n;i++){const px=R()*c.pw,py=R()*c.ph,r0=c.P*(.012+R()*R()*.07)/c.fz,p=R()*255|0;for(let k=0;k<4;k++){const ox=(R()-.5)*r0*.7,oy=(R()-.5)*r0*.7,r=r0*(.55+R()*.5),g=x.createRadialGradient(px+ox,py+oy,0,px+ox,py+oy,r),q=p+(255-p)*.4|0;g.addColorStop(0,`rgb(${p},${p},${p})`);g.addColorStop(.55,`rgb(${q},${q},${q})`);g.addColorStop(1,'#fff');x.fillStyle=g;x.beginPath();x.arc(px+ox,py+oy,r,0,6.2832);x.fill()}}}}
};
// ---------- height maps, then the three looks ----------
let TXHC;
function txEq(h){const n=h.length,b=new Uint32Array(1026);for(let i=0;i<n;i++){const k=(h[i]*1024)|0;b[k<0?0:k>1024?1024:k]++}const cdf=new Float32Array(1026);let s=0;for(let i=0;i<1026;i++){s+=b[i];cdf[i]=s/n}const q=new Float32Array(n);for(let i=0;i<n;i++){const k=(h[i]*1024)|0;q[i]=cdf[k<0?0:k>1024?1024:k]}return q}
function txHeight(t,sc,sd,pw,ph){const key=[t,sc,sd,pw,ph].join('|'),hit=TXHC.get(key);if(hit){TXHC.delete(key);TXHC.set(key,hit);return hit}
const G=TXT[t],P=Math.max(pw,ph),fz=100/Math.max(5,sc),c={N:txNoise(sd),W:txWorley(sd),R:sRng(sd*977+5),fz,pw,ph,P};let h=new Float32Array(pw*ph);
if(G.cv){const cv=document.createElement('canvas');cv.width=pw;cv.height=ph;const x=cv.getContext('2d',{willReadFrequently:true});x.fillStyle='#fff';x.fillRect(0,0,pw,ph);G.cv(x,c);const d=x.getImageData(0,0,pw,ph).data;for(let i=0;i<h.length;i++)h[i]=d[i*4]/255}
else{const f=G.f(c);for(let j=0;j<ph;j++){const Y=j/P*fz,o=j*pw;for(let i=0;i<pw;i++)h[o+i]=txc(f(i/P*fz,Y))}}
const q=G.raw?h:txEq(h),st=Math.max(1,Math.round(P/420));let s2=0,m=0;for(let j=st;j<ph-st;j+=2)for(let i=st;i<pw-st;i+=2){const gx=h[j*pw+i+st]-h[j*pw+i-st],gy=h[(j+st)*pw+i]-h[(j-st)*pw+i];s2+=gx*gx+gy*gy;m++}
const e={h,q,st,g0:Math.sqrt(s2/Math.max(1,m))+1e-4};TXHC.set(key,e);if(TXHC.size>5)TXHC.delete(TXHC.keys().next().value);return e}
function txPix(S,pw,ph){const E=txHeight(S.t,S.sc,S.sd,pw,ph),n=pw*ph,px=new Uint8ClampedArray(n*4),a=S.a/100,md=S.md;
if(md=='wear'){const thr=a*(TXT[S.t].cov||.55),soft=TXT[S.t].raw?.05:.08,q=E.q;for(let i=0;i<n;i++)px[i*4+3]=Math.round(txs(thr+soft*.5,thr-soft*.5,q[i])*31)*8.2258}
else if(md=='stain'){const q=E.q;for(let i=0;i<n;i++){const v=Math.pow(1-q[i],1.6)*a*.8;px[i*4]=84;px[i*4+1]=58;px[i*4+2]=30;px[i*4+3]=Math.round(v*31)*8.2258}}
else{const h=E.h,st=E.st,r=S.az*Math.PI/180,lx=Math.cos(r),ly=Math.sin(r),k=1/(E.g0*2.2);
for(let j=0;j<ph;j++){const j0=Math.max(0,j-st),j1=Math.min(ph-1,j+st);for(let i=0;i<pw;i++){const i0=Math.max(0,i-st),i1=Math.min(pw-1,i+st),gx=(h[j*pw+i1]-h[j*pw+i0])/(i1-i0||1),gy=(h[j1*pw+i]-h[j0*pw+i])/(j1-j0||1),s=-(gx*lx+gy*ly)*st*k,al=Math.min(1,Math.abs(s))*a*.85,o=(j*pw+i)*4,w=s>0?255:0;px[o]=px[o+1]=px[o+2]=w;px[o+3]=Math.round(al*31)*8.2258}}}
return px}
let TXB;let TXBN=0;
function txDims(W,H,R){const s=R/Math.max(W,H,1e-6);return[Math.max(8,Math.round(W*s)),Math.max(8,Math.round(H*s))]}
// Repeat tile: make the picture meet itself at the edges. The middle is the texture as it was; towards each edge it fades into a copy
// moved half a picture across, and at the edge both sides show the same part of that copy, so the edges match.
function txSeam(px,pw,ph){const src=new Uint8ClampedArray(px),hx=pw>>1,hy=ph>>1,wx=new Float32Array(pw),wy=new Float32Array(ph);
for(let x=0;x<pw;x++)wx[x]=Math.pow(Math.sin(Math.PI*x/pw),2);for(let y=0;y<ph;y++)wy[y]=Math.pow(Math.sin(Math.PI*y/ph),2);
for(let y=0;y<ph;y++){const y2=(y+hy)%ph;for(let x=0;x<pw;x++){const a=wx[x]*wy[y],o=(y*pw+x)*4,o2=(y2*pw+(x+hx)%pw)*4;for(let c=0;c<4;c++)px[o+c]=src[o+c]*a+src[o2+c]*(1-a)}}}
function txBmp(S,W,H,R,tl){const Z=R>=800?Math.max(1,Math.max(W,H)/200):1;if(Z>1)S={...S,sc:S.sc/Z};const[pw,ph]=txDims(W,H,R),key=txKey(S)+'|'+pw+'x'+ph+(tl?'|tile':'');let e=TXB.get(key);if(e){TXB.delete(key);TXB.set(key,e);return e}
const px=txPix(S,pw,ph);if(tl)txSeam(px,pw,ph);const cv=document.createElement('canvas');cv.width=pw;cv.height=ph;cv.getContext('2d').putImageData(new ImageData(px,pw,ph),0,0);
e={id:++TXBN,url:cv.toDataURL('image/png'),pw,ph,key};TXB.set(key,e);while(TXB.size>90){const k=TXB.keys().next().value;txUnhost(TXB.get(k).id);TXB.delete(k)}return e}
// big pictures stay out of the per-frame markup: they live once in a persistent block (#txd) and the page refers to them by id
let TXHS;
function txHostEl(){return document.getElementById('txd')}
function txUnhost(id){const h=txHostEl();if(!h)return;h.querySelectorAll('[data-e="'+id+'"]').forEach(n=>{TXHS.delete(n.id);n.remove()})}
function txHostImg(e,W,H){const id='txi'+e.id+'_'+(+W).toFixed(1)+'_'+(+H).toFixed(1),h=txHostEl();if(h&&!TXHS.has(id)){h.insertAdjacentHTML('beforeend',`<image id="${id}" data-e="${e.id}" href="${e.url}" width="${(+W).toFixed(2)}" height="${(+H).toFixed(2)}" preserveAspectRatio="none"/>`);TXHS.add(id)}return id}
// images for the specs of one mode-group. how: 'inline' = the picture is in the markup, 'host' = a reference to the persistent copy
function txImgs(list,W,H,R,how,want,ox,oy,tl){let o='';const x=ox||0,y=oy||0;list.forEach(S=>{if(!want(S))return;const e=txBmp(S,W,H,R,tl);o+=how=='inline'?`<image${S.op!=null?` data-x="${S.x}" opacity="${S.op}"`:''} href="${e.url}" x="${x}" y="${y}" width="${(+W).toFixed(2)}" height="${(+H).toFixed(2)}" preserveAspectRatio="none"/>`:`<use href="#${txHostImg(e,W,H)}" x="${x}" y="${y}"/>`});return o}
const txIsW=S=>S.md=='wear',txIsO=S=>S.md!='wear';
const txHash=s=>{let h=5381;for(let i=0;i<s.length;i++)h=(Math.imul(h,33)+s.charCodeAt(i))|0;return(h>>>0).toString(36)};
// overlay filter (relief / stain on a layer or a text box): the picture is laid over the shape only where the shape has ink
let TXFL;
// ext = [ex,ey] on a repeat tile: the picture is repeated (feTile) over a filter area that reaches that far past the tile on every side
function txFilt(list,x,y,W,H,R,ext){const ov=list.filter(txIsO);if(!ov.length)return'';const ex=ext?ext[0]:0,ey=ext?ext[1]:0,key='txf'+txHash(ov.map(txKey).join(';')+'|'+[x,y,W,H,R].join(',')+(ext?'|'+ex+','+ey:'')),h=txHostEl();if(!TXFL.has(key)){let f='',m='<feMergeNode in="SourceGraphic"/>';ov.forEach((S,i)=>{const e=txBmp(S,W,H,R,!!ext);f+=`<feImage href="${e.url}" x="${(+x).toFixed(2)}" y="${(+y).toFixed(2)}" width="${(+W).toFixed(2)}" height="${(+H).toFixed(2)}" preserveAspectRatio="none" result="o${i}"/>${ext?`<feTile in="o${i}" result="ot${i}"/>`:''}<feComposite in="${ext?'ot':'o'}${i}" in2="SourceAlpha" operator="in" result="c${i}"/>`;m+=`<feMergeNode in="c${i}"/>`});
if(h)h.insertAdjacentHTML('beforeend',`<filter id="${key}" data-f="1" filterUnits="userSpaceOnUse" x="${(x-ex).toFixed(2)}" y="${(y-ey).toFixed(2)}" width="${(+W+2*ex).toFixed(2)}" height="${(+H+2*ey).toFixed(2)}" color-interpolation-filters="sRGB">${f}<feMerge>${m}</feMerge></filter>`);TXFL.set(key,1);
while(TXFL.size>40){const k=TXFL.keys().next().value;TXFL.delete(k);const n=h&&h.querySelector('#'+k);if(n)n.remove()}}
else if(h&&!h.querySelector('#'+key)){TXFL.delete(key);return txFilt(list,x,y,W,H,R,ext)}return key}
function init16(){// ===== Texture library (v87) =====
// One kind of texture for everything. A texture is a named grayscale pattern in texLib: {id,name,t,a,sc,az,sd,auto}.
// Wherever it is used (a stamp, a layer, a text box, the canvas) the use picks a mode: {x: texture id, sd: variation, md: 'wear'|'relief'|'stain'}.
//   wear   = the pattern knocks the ink out (worn, patchy, pinholes)
//   relief = the pattern becomes lit surface shading (light comes from the "Light from" angle)
//   stain  = the pattern tints / darkens
WBS.texLib=[];WBS.txSel='';TXF.forEach(([g,o])=>Object.assign(TXN,o));
TXHC=new Map();
TXB=new Map();
TXHS=new Set();
TXFL=new Map();
}
export {TXF,TXLEG,TXMD,TXMN,TXN,isOf,txClean,txEnsure,txFilt,txImgs,txIsO,txIsW,txKey,txLib,txMake,txPix,txRid,txSame,txSpecs,txUid,txUniq,init16};
