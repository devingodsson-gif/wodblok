import {kv} from '../platform/index.js';
import {$,WBS,WBX} from './01-launch-and-version.js';
import {CH,CW,SH,SK,SW,shp,useT,wrapP} from './04-canvas-and-stamp-outlines.js';
import {cust,inkOf,it,pal,selOne,store} from './06-motif-library-folders.js';
import {hx} from './10-layer-grids.js';
import {upd} from './11-pressure-flooding-block-edges.js';
import {QS,delItems,selSet} from './12-selection-and-split.js';
import {pmsg} from './18-projects-and-cover-overlay.js';

function init22(){// ===== Text tool: type text, it's traced into carved letter shapes. Each letter becomes its own shape on the stamp,
// grouped under the text in the Motif list. The original text and settings are kept on the group, so it can be edited.
(()=>{
const FONTS=[['cinzel','Cinzel','Cinzel',700,'Roman capitals'],['cinzeld','Cinzel Decorative','Cinzel+Decorative',700,'Decorated capitals'],
['fell','IM Fell English','IM+Fell+English',400,'Old-style print'],['fellsc','IM Fell English SC','IM+Fell+English+SC',400,'Old-style small caps'],
['garamond','Cormorant Garamond','Cormorant+Garamond',700,'Classic serif'],['frak','UnifrakturMaguntia','UnifrakturMaguntia',400,'Blackletter'],
['pirata','Pirata One','Pirata+One',400,'Narrow blackletter'],['uncial','Uncial Antiqua','Uncial+Antiqua',400,'Uncial'],
['medieval','MedievalSharp','MedievalSharp',400,'Hand-cut medieval'],['alfa','Alfa Slab One','Alfa+Slab+One',400,'Heavy slab'],
['holtwood','Holtwood One SC','Holtwood+One+SC',400,'Wood type'],['rye','Rye','Rye',400,'Ornamental wood type'],
['abril','Abril Fatface','Abril+Fatface',400,'Fat face'],['bebas','Bebas Neue','Bebas+Neue',400,'Condensed poster'],['playfair','Playfair Display','Playfair+Display',700,'High-contrast serif'],['bodoni','Bodoni Moda','Bodoni+Moda',700,'Fashion serif'],['dmserif','DM Serif Display','DM+Serif+Display',400,'Display serif'],['oswald','Oswald','Oswald',700,'Tall condensed sans'],['anton','Anton','Anton',400,'Heavy condensed'],['leaguegothic','League Gothic','League+Gothic',400,'Narrow gothic'],['montserrat','Montserrat','Montserrat',800,'Geometric sans'],['lobster','Lobster','Lobster',400,'Bold script'],['pacifico','Pacifico','Pacifico',400,'Surf script'],['dancing','Dancing Script','Dancing+Script',700,'Lively script'],['caveat','Caveat','Caveat',700,'Handwriting'],['marker','Permanent Marker','Permanent+Marker',400,'Marker pen'],['elite','Special Elite','Special+Elite',400,'Typewriter'],['bungee','Bungee','Bungee',400,'Signage'],['ultra','Ultra','Ultra',400,'Fat slab'],['vastshadow','Vast Shadow','Vast+Shadow',400,'Slab with shadow'],['limelight','Limelight','Limelight',400,'Art deco'],['almendra','Almendra','Almendra',700,'Calligraphic'],['metamorph','Metamorphous','Metamorphous',400,'Fantasy serif'],['grenze','Grenze Gotisch','Grenze+Gotisch',700,'Gothic blackletter']];
const F={};FONTS.forEach(([id,fam,q,w,d])=>F[id]={id,fam,w,d,lbl:fam});
// the lettering fonts are bundled with the page (@font-face rules in the shell), so nothing is fetched
// your own fonts (kept in this browser when they fit)
const UF=[];const addUF=async(name,buf,save)=>{const id='u-'+name.toLowerCase().replace(/[^a-z0-9]+/g,'-').slice(0,30);if(F[id])return id;
const ff=new FontFace('wbu-'+id,buf);await ff.load();document.fonts.add(ff);F[id]={id,fam:'wbu-'+id,w:400,d:'Your font',lbl:name,u:1};UF.push(id);
if(save){try{const b=new Uint8Array(buf);let s='';for(let i=0;i<b.length;i+=8192)s+=String.fromCharCode.apply(null,b.subarray(i,i+8192));const all=JSON.parse(kv.get('wb17_fonts')||'{}');all[name]=btoa(s);kv.set('wb17_fonts',JSON.stringify(all))}catch(e){pmsg(`“${name}” is loaded for now, but it's too big to keep in this browser. Load it again next time.`)}}return id};
try{const all=JSON.parse(kv.get('wb17_fonts')||'{}');Object.entries(all).forEach(([n,b64])=>{const s=atob(b64),b=new Uint8Array(s.length);for(let i=0;i<s.length;i++)b[i]=s.charCodeAt(i);addUF(n,b.buffer,false).then(()=>fillFonts()).catch(()=>{})})}catch(e){}
const P=160,E=60,cv=document.createElement('canvas'),cx=cv.getContext('2d',{willReadFrequently:true}),GL=new Map();
const css=f=>`${f.w} ${P}px "${f.fam}", Georgia, serif`;
// --- tracing (marching squares -> simplified closed loops -> smooth quadratic path)
function traceB(b,W,H){const g=(x,y)=>x>0&&y>0&&x<=W&&y<=H?b[(y-1)*W+(x-1)]:0,adj=new Map(),add=(a,c)=>{(adj.get(a)||adj.set(a,[]).get(a)).push(c);(adj.get(c)||adj.set(c,[]).get(c)).push(a)},K=(x,y)=>x*100000+y;
for(let y=0;y<H+1;y++)for(let x=0;x<W+1;x++){const c=g(x,y)*8+g(x+1,y)*4+g(x+1,y+1)*2+g(x,y+1);if(c==0||c==15)continue;const T=K(2*x+1,2*y),R=K(2*x+2,2*y+1),B=K(2*x+1,2*y+2),L=K(2*x,2*y+1);
switch(c){case 1:case 14:add(L,B);break;case 2:case 13:add(B,R);break;case 3:case 12:add(L,R);break;case 4:case 11:add(T,R);break;case 6:case 9:add(T,B);break;case 7:case 8:add(L,T);break;case 5:add(L,T);add(B,R);break;case 10:add(T,R);add(L,B);break}}
const loops=[],used=new Set();for(const[s0]of adj){if(used.has(s0))continue;const lp=[];let pv=null,c=s0;while(c!=null&&!used.has(c)){used.add(c);lp.push([Math.floor(c/100000)/2-.5,(c%100000)/2-.5]);const nx=adj.get(c).find(n=>n!==pv&&!used.has(n));pv=c;c=nx==null?null:nx}if(lp.length>=4)loops.push(lp)}return loops}
function rdp(p,eps){if(p.length<4)return p;const keep=new Uint8Array(p.length);keep[0]=keep[p.length-1]=1;const st=[[0,p.length-1]];while(st.length){const[a,z]=st.pop();let md=0,mi=-1;const[ax,ay]=p[a],[zx,zy]=p[z],dx=zx-ax,dy=zy-ay,L=Math.hypot(dx,dy)||1;
for(let i=a+1;i<z;i++){const d=Math.abs(dy*p[i][0]-dx*p[i][1]+zx*ay-zy*ax)/L;if(d>md){md=d;mi=i}}if(md>eps&&mi>0){keep[mi]=1;st.push([a,mi],[mi,z])}}return p.filter((_,i)=>keep[i])}
function dens(l,step){const o=[];for(let i=0;i<l.length;i++){const a=l[i],b=l[(i+1)%l.length],n=Math.max(1,Math.floor(Math.hypot(b[0]-a[0],b[1]-a[1])/step));for(let k=0;k<n;k++)o.push([a[0]+(b[0]-a[0])*k/n,a[1]+(b[1]-a[1])*k/n])}return o}
// one letter -> {k: motif key, cx, cy: ink centre relative to the pen position on the baseline, in px}
const fOk=f=>[...document.fonts].some(x=>x.family.replace(/["']/g,'')==f.fam&&x.status=='loaded');
function glyph(f,ch){const ok=fOk(f),key='t|'+f.id+(ok?'':'~')+'|'+ch.codePointAt(0).toString(36);if(GL.has(key))return GL.get(key);
cx.font=css(f);const m=cx.measureText(ch),pad=Math.ceil(P*.5),w=Math.ceil(Math.max(m.width,(m.actualBoundingBoxLeft||0)+(m.actualBoundingBoxRight||0)))+pad*2,h=Math.ceil(P*2.1),ox=pad,oy=Math.round(P*1.4);
cv.width=w;cv.height=h;cx.font=css(f);cx.textBaseline='alphabetic';cx.fillStyle='#000';cx.fillText(ch,ox,oy);const d=cx.getImageData(0,0,w,h).data,b=new Uint8Array(w*h);let x0=w,y0=h,x1=-1,y1=-1;
for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(d[(y*w+x)*4+3]>110){b[y*w+x]=1;if(x<x0)x0=x;if(x>x1)x1=x;if(y<y0)y0=y;if(y>y1)y1=y}
if(x1<0){GL.set(key,null);return null}
const gcx=(x0+x1+1)/2,gcy=(y0+y1+1)/2,u=E/P,fm=v=>(Math.round(v*10)/10).toString();let path='';
traceB(b,w,h).forEach(l=>{let fi=0,fd=0;l.forEach((p,i)=>{const dd=(p[0]-l[0][0])**2+(p[1]-l[0][1])**2;if(dd>fd){fd=dd;fi=i}});const A=rdp(l.slice(0,fi+1),.55),B=rdp(l.slice(fi).concat([l[0]]),.55),q=dens(A.concat(B.slice(1,-1)),3);
const n=q.length;if(n<3)return;const Pp=q.map(([x,y])=>[(x-gcx)*u,(y-gcy)*u]),mid=i=>{const a=Pp[i%n],c=Pp[(i+1)%n];return[(a[0]+c[0])/2,(a[1]+c[1])/2]};const m0=mid(0);path+='M'+fm(m0[0])+','+fm(m0[1]);
for(let i=1;i<=n;i++){const p=Pp[i%n],mm=mid(i);path+='Q'+fm(p[0])+','+fm(p[1])+' '+fm(mm[0])+','+fm(mm[1])}path+='Z'});
const r={k:key,cx:gcx-ox,cy:gcy-oy,d:path};GL.set(key,r);return r}
// --- layout: letters on straight lines, or bent around a circle (curve = % of a full circle; negative curves down)
function layout(o){const f=F[o.f]||F.cinzel;cx.font=css(f);const T0=o.tc=='u'?o.text.toUpperCase():o.tc=='l'?o.text.toLowerCase():o.tc=='t'?o.text.toLowerCase().replace(/(^|[\s(\-])(\S)/g,(m,a,b)=>a+b.toUpperCase()):o.text,lines0=T0.split('\n'),em=o.sz/100*Math.min(SW,SH),k=em/P,ls=o.ls/100*P,wsp=(o.ws||0)/100*P,capH=cx.measureText('H').actualBoundingBoxAscent||P*.7,lhp=o.lh/100*P;
// Box width: lines are broken at spaces so none is wider than the box (a single long word is left whole). Box height + Vertical: where the block of lines sits in a box of that height.
const limP=o.wd>0?o.wd/100*Math.min(SW,SH)/k:0,wd1=s=>{let n=0,sp=0;for(const c of s){n++;if(/\s/.test(c))sp++}return cx.measureText(s).width+ls*Math.max(0,n-1)+wsp*sp};let lines=lines0;
if(limP){lines=[];lines0.forEach(ln=>{if(!ln.trim()){lines.push(ln);return}let cur='';ln.split(' ').forEach(w=>{const t=cur?cur+' '+w:w;if(cur&&wd1(t)>limP){lines.push(cur);cur=w}else cur=t});lines.push(cur)})}
const hbP=o.ht>0?o.ht/100*Math.min(SW,SH)/k:0,fr2=hbP?(hbP-lines.length*lhp)/2:0,vOff=hbP?(o.va=='b'?fr2:o.va=='m'?0:-fr2):0;
const L=lines.map(line=>{const ch=[...line],out=[];let sp=0;ch.forEach((c,i)=>{if(/\s/.test(c)){sp++;return}const g=glyph(f,c);if(!g)return;const pen=cx.measureText(ch.slice(0,i).join('')).width+ls*i+wsp*sp;out.push({g,c,x:pen+g.cx,y:g.cy,sp})});cx.font=css(f);return{out,ns:sp,W:cx.measureText(line).width+ls*Math.max(0,ch.length-1)+wsp*sp}});
const maxW=limP||Math.max(1,...L.map(l=>l.W)),pts=[];L.forEach((l,j)=>{const ex=o.al=='j'&&j<L.length-1&&l.ns>0?(maxW-l.W)/l.ns:0,sh=o.al=='l'||o.al=='j'?-maxW/2:o.al=='r'?maxW/2-l.W:-l.W/2,by=(j-(lines.length-1)/2)*lhp+capH/2+vOff;l.out.forEach(c=>pts.push({g:c.g,c:c.c,px:sh+c.x+ex*c.sp,py:by+c.y}))});
const cvv=Math.max(-1,Math.min(1,o.cv/100)),rt=(o.rot||0)*Math.PI/180,cs=Math.cos(rt),sn=Math.sin(rt);let res;
if(Math.abs(cvv)<.005)res=pts.map(c=>({g:c.g,c:c.c,x:c.px,y:c.py,r:0}));
else{const phi=Math.abs(cvv)*2*Math.PI,R=maxW/phi,off=R*Math.max(0,Math.min(1,1-phi/Math.PI));
res=pts.map(c=>{if(cvv>0){const th=-Math.PI/2+c.px/R,rho=R-c.py;return{g:c.g,c:c.c,x:rho*Math.cos(th),y:off+rho*Math.sin(th),r:(th+Math.PI/2)*180/Math.PI}}
const th=Math.PI/2-c.px/R,rho=R+c.py;return{g:c.g,c:c.c,x:rho*Math.cos(th),y:-off+rho*Math.sin(th),r:(th-Math.PI/2)*180/Math.PI}})}
return res.map(p=>({g:p.g,c:p.c,x:(p.x*cs-p.y*sn)*k,y:(p.x*sn+p.y*cs)*k,r:p.r+(o.rot||0),s:+(em/E).toFixed(4)}))}
// --- panel state
const D={text:'',f:'cinzel',sz:30,ls:0,ws:0,lh:115,al:'c',tc:'',cv:0,rot:0,wd:0,ht:0,va:'t',auto:true};
// largest size (up to 40%) at which the whole text sits inside the stamp, so it doesn't wrap round the edges
function fitSz(o){const ps=layout({...o,sz:100});if(!ps.length)return o.sz;const h=Math.min(SW,SH)*.42;let x0=1e9,x1=-1e9,y0=1e9,y1=-1e9;ps.forEach(p=>{x0=Math.min(x0,p.x-h);x1=Math.max(x1,p.x+h);y0=Math.min(y0,p.y-h);y1=Math.max(y1,p.y+h)});
const k=SK=='tri'?.55:SK=='rect'?.86:.74;return Math.max(5,Math.min(o.maxSz||40,Math.floor(100*Math.min(k*SW/(x1-x0),k*SH/(y1-y0)))))}
const autoFit=()=>{if(!st.auto||edit||!st.text.trim())return;const v=fitSz(st);if(v!=st.sz){st.sz=v;$('tx_sz').value=v;$('tx_sz').dispatchEvent(new Event('input',{bubbles:true}))}};let st={...D},edit=null,tmr=0,syncing=0,ltmr=0,lastLive=0;
const A=(t)=>t.tgm||(t.tgm={});
const grpOf=()=>{const qs=QS();if(!qs.length)return null;const g=qs[0].tg;if(!g||!qs.every(o=>o.tg==g))return null;const t=WBS.tiles[WBS.cur];return A(t)[g]?g:null};
const idsOf=g=>WBS.tiles[WBS.cur].items.map((q,i)=>q.tg==g?i:-1).filter(i=>i>=0);
const mean=ids=>{const it2=WBS.tiles[WBS.cur].items;let x=0,y=0;ids.forEach(i=>{x+=it2[i].x;y+=it2[i].y});return[x/ids.length,y/ids.length]};
WBX.wbTxGrp=()=>grpOf();WBX.wbTxMeta=g=>A(WBS.tiles[WBS.cur])[g];
function fillFonts(){const cur0=$('tx_f').value||st.f;$('tx_f').innerHTML=`<optgroup label="Built-in fonts">${FONTS.map(x=>`<option value="${x[0]}" data-font="${hx(x[1])}" data-w="${x[3]}">${hx(x[1])}</option>`).join('')}</optgroup>`+(UF.length?`<optgroup label="Your fonts">${UF.map(id=>`<option value="${id}" data-font="${hx(F[id].fam)}" data-w="400">${hx(F[id].lbl)}</option>`).join('')}</optgroup>`:'');$('tx_f').value=F[cur0]?cur0:'cinzel'}
function toUI(){syncing++;try{toUI0()}finally{syncing--}}
function toUI0(){$('tx_t').value=st.text;$('tx_f').value=F[st.f]?st.f:'cinzel';[['tx_sz','sz'],['tx_ls','ls'],['tx_ws','ws'],['tx_lh','lh'],['tx_wd','wd'],['tx_ht','ht'],['tx_cv','cv'],['tx_rot','rot']].forEach(([id,k])=>{$(id).value=st[k]||0;$(id).dispatchEvent(new Event('input',{bubbles:true,cancelable:true}))});
document.querySelectorAll('#tx_al [data-a]').forEach(b=>b.classList.toggle('on',b.dataset.a==st.al));document.querySelectorAll('#tx_tc [data-c]').forEach(b=>b.classList.toggle('on',b.dataset.c==(st.tc||'')));document.querySelectorAll('#tx_va [data-v]').forEach(b=>b.classList.toggle('on',b.dataset.v==(st.va||'t')))}
function fromUI(){st.text=$('tx_t').value.replace(/\r/g,'').slice(0,200);st.f=$('tx_f').value;st.sz=+$('tx_sz').value;st.ls=+$('tx_ls').value;st.ws=+$('tx_ws').value;st.lh=+$('tx_lh').value;st.wd=+$('tx_wd').value;st.ht=+$('tx_ht').value;st.cv=+$('tx_cv').value;st.rot=+$('tx_rot').value}
async function ready(){const f=F[st.f]||F.cinzel;try{await document.fonts.load(css(f),st.text||'Aa');await document.fonts.ready}catch(e){}}
async function preview(){await ready();const t=WBS.tiles[WBS.cur];useT(t);autoFit();const[pa]=pal(),ink=inkOf(t),ps=st.text.trim()?layout(st):[],C=cen();
$('tx_pv').innerHTML=`<svg viewBox="-12 -12 ${SW+24} ${SH+24}"><path d="${shp(0)}" fill="${pa}" stroke="currentColor" stroke-opacity=".25" stroke-width="2"/>`+ps.map(p=>`<g transform="translate(${(C[0]+p.x).toFixed(1)} ${(C[1]+p.y).toFixed(1)}) rotate(${p.r.toFixed(1)}) scale(${p.s})"><path d="${p.g.d}" fill="${ink}" fill-rule="evenodd"/></g>`).join('')+`</svg>`;
$('tx_go').disabled=!st.text.trim()}
const cen=()=>SK=='tri'?[SW/2,SH*2/3]:[SW/2,SH/2];
const later=()=>{clearTimeout(tmr);tmr=setTimeout(preview,120)};
function letters(g,ax,ay){const ps=layout(st),out=[];ps.forEach(p=>{const k=p.g.k;if(!cust[k])cust[k]={n:p.c,svg:`<path d="${p.g.d}" fill="FILL" fill-rule="evenodd"/>`,txt:1};const[x,y]=wrapP(ax+p.x,ay+p.y);const q=it(k,x,y,p.s,+p.r.toFixed(1),1);q.tg=g;out.push(q)});return out}
async function add(){fromUI();if(!st.text.trim())return;await ready();if(WBX.wbCap)WBX.wbCap();const t=WBS.tiles[WBS.cur];useT(t);autoFit();const g='tx'+Date.now().toString(36)+Math.random().toString(36).slice(2,5),[ax,ay]=cen(),L=letters(g,ax,ay);
if(!L.length){pmsg('No letters came out. Try another font.');return}const n0=t.items.length;t.items.push(...L);const ids=L.map((_,i)=>n0+i);const[mx,my]=mean(ids);A(t)[g]={...st,ax,ay,mx,my};
selSet(ids,false);WBS.brush=null;store();upd();if(WBX.wbCap)WBX.wbCap();pmsg(`Added “${st.text.replace(/\n/g,' ')}” as ${L.length} letter${L.length>1?'s':''}. Drag to move them together, or click one in the Shape list to move it alone.`)}
async function update(live){const g=edit;if(!g)return;fromUI();if(!st.text.trim())return;await ready();if(g!==edit)return;const t=WBS.tiles[WBS.cur],M=A(t)[g],ids=idsOf(g);if(!M||!ids.length)return;if(live&&['text','f','sz','ls','ws','lh','al','tc','cv','rot','wd','ht','va'].every(k=>(M[k]||0)===(st[k]||0)))return;if(WBX.wbCap&&(!live||performance.now()-lastLive>1500))WBX.wbCap();if(live)lastLive=performance.now();useT(t);
const[cx0,cy0]=mean(ids),ax=M.ax+(cx0-M.mx),ay=M.ay+(cy0-M.my),pos=Math.min(...ids);delItems(ids);const L=letters(g,ax,ay);t.items.splice(Math.min(pos,t.items.length),0,...L);const nids=L.map((_,i)=>Math.min(pos,t.items.length-L.length)+i);
const[mx,my]=mean(nids);A(t)[g]={...st,ax,ay,mx,my};selSet(nids,false);store();upd();if(!live){if(WBX.wbCap)WBX.wbCap();pmsg(`Updated the text. Hand-moved letters were rebuilt.`)}}
// the text on the stamp follows every change in the panel while a text is being edited
const live=()=>{if(!edit||syncing)return;clearTimeout(ltmr);ltmr=setTimeout(()=>update(true),150)};
// used by Randomize: set text on a stamp (fonts load first; a newer roll cancels an older one)
WBX.wbTxFonts=FONTS.map(x=>x[0]);
WBX.wbTxPlace=async(t,o,tok)=>{const f=F[o.f]||F.cinzel;try{await document.fonts.load(css(f),o.text);await document.fonts.ready}catch(e){}
if(tok!=null&&tok!==WBX.wbRndTok)return false;if(!WBS.tiles.includes(t))return false;const keep=st;st={...D,...o,auto:false};try{useT(t);st.sz=fitSz(st);const g='tx'+Date.now().toString(36)+Math.random().toString(36).slice(2,5),[ax,ay]=cen(),L=letters(g,ax,ay);if(!L.length)return false;
t.items.push(...L);const[mx,my]=(()=>{let x=0,y=0;L.forEach(q=>{x+=q.x;y+=q.y});return[x/L.length,y/L.length]})();const M={...st,ax,ay,mx,my};delete M.maxSz;delete M.inner;A(t)[g]=M;
if(o.inner){let rm=1e9;L.forEach(q=>{rm=Math.min(rm,Math.hypot(q.x-ax,q.y-ay)-26*q.s)});t.items.forEach(q=>{if(q.cz){q.s=+Math.min(q.s,.85*Math.max(8,rm)/48).toFixed(3);delete q.cz}})}
return true}finally{st=keep;useT(WBS.tiles[WBS.cur])}};
// keep a group's anchor in step when it's moved, turned or scaled as a whole
WBX.wbTxXf=(g,fn)=>{const t=WBS.tiles[WBS.cur],M=A(t)[g];if(!M)return;fn(M)};
// sync the panel with the selection: selecting a text group puts it into edit mode
WBX.wbTxSync=()=>{if(!$('tx_t'))return;const g=grpOf();if(g===edit)return;edit=g;const box=$('tx_ed');
if(g){const M=A(WBS.tiles[WBS.cur])[g];st={...D,...M,auto:false};delete st.ax;delete st.ay;delete st.mx;delete st.my;toUI();box.hidden=false;$('tx_edn').textContent=st.text.replace(/\n/g,' ');$('tx_go').textContent='Add as new text'}
else{box.hidden=true;$('tx_go').textContent='Add to stamp';st.auto=true}later()};
fillFonts();toUI();
$('tx_t').addEventListener('input',()=>{fromUI();later();live()});
['tx_f','tx_sz','tx_ls','tx_ws','tx_lh','tx_wd','tx_ht','tx_cv','tx_rot'].forEach(id=>$(id).addEventListener('input',e=>{if(id=='tx_sz'&&e.isTrusted)st.auto=false;fromUI();later();live()}));
['input','change'].forEach(ev=>document.addEventListener(ev,e=>{if(!e.isTrusted)return;const w=$('tx_sz').closest('.ctl');if(e.target===$('tx_sz')||(w&&w.contains(e.target)))st.auto=false},true));
$('tx_al').onclick=e=>{const b=e.target.closest('[data-a]');if(!b)return;st.al=b.dataset.a;document.querySelectorAll('#tx_al [data-a]').forEach(x=>x.classList.toggle('on',x==b));later();live()};
$('tx_va').onclick=e=>{const b=e.target.closest('[data-v]');if(!b)return;st.va=b.dataset.v;document.querySelectorAll('#tx_va [data-v]').forEach(x=>x.classList.toggle('on',x==b));later();live()};
$('tx_tc').onclick=e=>{const b=e.target.closest('[data-c]');if(!b)return;st.tc=b.dataset.c;document.querySelectorAll('#tx_tc [data-c]').forEach(x=>x.classList.toggle('on',x==b));later();live()};
$('tx_go').onclick=add;
$('tx_new').onclick=()=>{selOne(-1);edit=null;$('tx_ed').hidden=true;$('tx_go').textContent='Add to stamp';st={...D,f:st.f};toUI();upd();later();$('tx_t').focus()};
$('tx_file').onchange=async()=>{const fl=$('tx_file').files[0];$('tx_file').value='';if(!fl)return;try{const nm=fl.name.replace(/\.[a-z0-9]+$/i,'').replace(/[_-]+/g,' ').replace(/["<>&|]/g,'').slice(0,40)||'My font';
const id=await addUF(nm,await fl.arrayBuffer(),fl.size<900000);fillFonts();$('tx_f').value=id;fromUI();later();pmsg(`Loaded “${nm}”.`+(fl.size>=900000?' It is large, so it will not be kept for next time.':''))}catch(e){pmsg('That font file could not be read. Try a .ttf or .otf file.')}};
// text boxes in the pattern: lay the text out at canvas scale, returning the letter paths (centred on the box)
WBX.wbTxLay=async o=>{const f=F[o.f]||F.cinzel;try{await document.fonts.load(css(f),o.text||'Aa');await document.fonts.ready}catch(e){}
const q={...D,...o};if(!q.text.trim())return null;const kk=Math.min(CW,CH)/Math.min(SW,SH),ps=layout(q);if(!ps.length)return null;
const G={},Lt=[];let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9;
ps.forEach(p=>{const d=p.g.d;if(!/^[MLQZ0-9.,\- ]+$/.test(d))return;G[p.g.k]=d;const nm=(d.match(/-?\d+(?:\.\d+)?/g)||[]).map(Number);let a=1e9,b=1e9,c=-1e9,e=-1e9;for(let i=0;i+1<nm.length;i+=2){a=Math.min(a,nm[i]);c=Math.max(c,nm[i]);b=Math.min(b,nm[i+1]);e=Math.max(e,nm[i+1])}
const r=p.r*Math.PI/180,cs=Math.cos(r),sn=Math.sin(r),X=p.x*kk,Y=p.y*kk,S=p.s*kk;[[a,b],[c,b],[c,e],[a,e]].forEach(([u,v])=>{const px=X+(u*cs-v*sn)*S,py=Y+(u*sn+v*cs)*S;x0=Math.min(x0,px);x1=Math.max(x1,px);y0=Math.min(y0,py);y1=Math.max(y1,py)});
Lt.push([p.g.k,X,Y,+p.r.toFixed(1),+S.toFixed(4)])});
if(!Lt.length)return null;const U=kk*Math.min(SW,SH)/100,boxW=q.wd>0,boxH=q.ht>0,mx=boxW?0:(x0+x1)/2,my=boxH?0:(y0+y1)/2;Lt.forEach(l=>{l[1]=+(l[1]-mx).toFixed(2);l[2]=+(l[2]-my).toFixed(2)});
// with a box width or height, the box (not the letters) is what the piece measures, so Align and Vertical sit inside it
return{G,Lt,bw:+(boxW?q.wd*U:x1-x0).toFixed(2),bh:+(boxH?q.ht*U:y1-y0).toFixed(2)}};
WBX.wbTxUnit=()=>Math.min(CW,CH)/100;
WBX.wbTxAddFont=async fl=>{const nm=fl.name.replace(/\.[a-z0-9]+$/i,'').replace(/[_-]+/g,' ').replace(/["<>&|]/g,'').slice(0,40)||'My font';const id=await addUF(nm,await fl.arrayBuffer(),fl.size<900000);fillFonts();return id};
WBX.wbTxFontHTML=()=>$('tx_f').innerHTML;
try{new MutationObserver(()=>{if(WBX.wbTbFonts)WBX.wbTbFonts()}).observe($('tx_f'),{childList:true})}catch(e){}
// redraw the preview whenever the panel is shown
new MutationObserver(()=>{const s=document.querySelector('section.pn[data-p="text"]');if(s&&!s.hidden)later()}).observe(document.querySelector('section.pn[data-p="text"]'),{attributes:true,attributeFilter:['hidden']});
later();
})();
}
export {init22};
