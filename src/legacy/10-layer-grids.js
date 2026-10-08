// ---- Each layer lays its stamps on a grid. The grid takes its shape from one "lead" stamp (L.lead, else the first),
// or follows another layer's grid (L.gl = that layer's u), so small stamps can be dropped into another layer's gaps (L.pa).
function migLayers(){const seen=new Set();WBS.layers.forEach(L=>{if(!L.u||seen.has(L.u))L.u=luid();seen.add(L.u)})}
function leadT(L){const ls=tiles.filter(t=>(L.st||[]).includes(t.id));return ls.find(t=>t.id==L.lead)||ls[0]||tiles[WBS.cur]||tiles[0]}
function baseL(L){let B=L;const seen=new Set([L]);for(let d=0;d<8&&B.gl;d++){const N=WBS.layers.find(x=>x.u==B.gl);if(!N||seen.has(N))break;seen.add(N);B=N}return B}
const latG=L=>geom(shOf(leadT(baseL(L))));
const arrOpts=g=>(ARR[g.SK]||ARR.rect).filter(o=>!(o[4]=='pin'||o[4]=='r90')||Math.abs(g.SW-g.SH)<1);
function arrOf(L,g){g=g||latG(L);const op=arrOpts(g),k=(L.ak&&typeof L.ak=='object')?L.ak[g.SK]:null;let o=op.find(x=>x[0]==k);
if(!o&&g.SK=='rect'){const gg=L.grid||'square';o=op.find(x=>x[2]==gg&&x[3]==L.lay)}if(!o&&(g.SK=='hex'||g.SK=='circle'||ORN.includes(g.SK))){o=op.find(x=>x[2]==(L.grid||'honey')&&x[3]==L.lay)}
o=o||op[0];return{k:o[0],g:o[2],l:o[3],r:o[4]||''}}
// How a stamp can be turned and flipped at random while its outline still fits its slot.
// symN: how many equal turns map the outline onto itself (0 = any angle). Arches and lancets have none, so they stay upright.
function symN(g){const k=g.SK;if(k=='circle')return 0;if(k=='hex')return 6;if(k=='tri')return 3;if(k=='oct'||k=='star')return 8;if(k=='quat')return 4;if(k=='arch'||k=='lancet')return 1;return Math.abs(g.SW-g.SH)<.5?4:2}
function turnFit(g,u){const n=symN(g);return n==0?u*360:Math.floor(u*n)%n*360/n}
// turning upside down is only allowed for outlines that look the same upside down
const flipVOk=g=>!(g.SK=='tri'||g.SK=='arch'||g.SK=='lancet');
const cellTurn=(r,i,j,li)=>{if(!r)return 0;if(r=='pin')return[[0,90],[270,180]][mod(j,2)][mod(i,2)];const u=rng((i+64)*31337+(j+64)*7331+li*17+5)();return r=='r90'?Math.floor(u*4)*90:r=='r60'?Math.floor(u*6)*60:r=='r180'?(u<.5?0:180):u*360};
const idx=(l,i,j,n,sd,g)=>l=='three'?mod((g&&g.SK=='hex'&&g.HO=='f')?i-(j-(i-mod(i,2))/2):(i-(j-mod(j,2))/2)-j,n):l=='dgd'?mod(i-Math.floor(j/2),n):l=='pin'?mod(Math.floor(i/2)+Math.floor(j/2),n):l=='check'?mod(i+j,n):l=='rows'?mod(j,n):l=='cols'?mod(i,n):l=='diag'?mod(i-j,n):l=='brick'?mod(i,n):Math.floor(rng(i*7919+j*104729+3+sd*31)()*n)%n;
// Fit to frame: L.fit is '' (off), 'h' (a whole number of stamps spans the width) or 'v' (spans the height).
function fitSizes(L){const g=latG(L),G=1+(L.gap||0)/100,gm=arrOf(L,g).g,ar=g.SH/g.SW,flat=gm=='honey'&&g.SK=='hex'&&g.HO=='f';
const kx=flat?.75*G:gm=='tri'?G/2:G,ky=gm=='honey'&&!flat?G*(g.SK=='hex'?.75:Math.sqrt(3)/2):gm=='diamond'?G/2:G,out=[];
const v=L.fit=='v';for(let n=1;n<=80;n++)out.push(v?CH/(ar*((n-1)*ky+1)):CW/((n-1)*kx+1));return out}
function fitTs(L,want){const v=want??L.size,r=$('ts'),lo=+r.min,hi=+r.max,all=fitSizes(L),inR=all.filter(x=>x>=lo-.01&&x<=hi+.01),c=inR.length?inR:all;
return c.reduce((b,x)=>Math.abs(x-v)<Math.abs(b-v)?x:b,c[0])}
// Where a layer that follows another layer's grid prints: 'c' cell centres, 'k' corners (where the shapes meet), 'e' edge midpoints.
// Each entry is [dx, dy, upOnly] relative to the cell centre; upOnly marks triangle-grid points taken from the upward cells only.
function placeOffs(gm,g,px,py,pa){if(pa!='k'&&pa!='e')return[[0,0]];const k=pa=='k';
if(gm=='tri')return k?[[0,-py/2,1]]:[[-px/2,0,1],[px/2,0,1],[0,py/2,1]];
if(gm=='honey')return g.SK=='hex'&&g.HO=='f'?(k?[[px/3,py/2],[2*px/3,0]]:[[0,py/2],[px/2,py/4],[px/2,-py/4]]):(k?[[px/2,py/3],[0,2*py/3]]:[[px/2,0],[px/4,py/2],[-px/4,py/2]]);
if(gm=='diamond')return k?[[px/2,0]]:[[px/4,py/2],[-px/4,py/2]];
if(gm=='brick')return k?[[px/2,py/2],[px/2,-py/2]]:[[px/2,0],[px/4,py/2],[-px/4,py/2]];
if(gm=='drop')return k?[[px/2,py/2],[-px/2,py/2]]:[[0,py/2],[px/2,py/4],[px/2,-py/4]];
return k?[[px/2,py/2]]:[[px/2,0],[0,py/2]]}
// The grid a layer prints on. Stamp scale: the lead stamp spans ts; every other stamp keeps its Size (z) relative to it.
function lattice(L){const B=baseL(L),lt=leadT(B),g=geom(shOf(lt)),A=arrOf(B,g),O=B===L?A:arrOf(L,g),fit=!!B.fit,ts=fit?fitTs(B):(+B.size||180),th=ts*g.SH/g.SW,G=1+(B.gap||0)/100,gm=A.g;
let px=ts*G,py=th*G,P;
if(gm=='diamond'){py=th*G/2;P=(i,j)=>[(i+(mod(j,2)?.5:0))*px,j*py]}
else if(gm=='tri'){px=ts*G/2;P=(i,j)=>[i*px,j*py]}
else if(gm=='brick')P=(i,j)=>[(i+(mod(j,2)?.5:0))*px,j*py];
else if(gm=='drop')P=(i,j)=>[i*px,(j+(mod(i,2)?.5:0))*py];
else if(gm=='honey'){if(g.SK=='hex'&&g.HO=='f'){px=ts*.75*G;P=(i,j)=>[i*px,(j+(mod(i,2)?.5:0))*py]}else{py=th*G*(g.SK=='hex'?.75:Math.sqrt(3)/2);P=(i,j)=>[(i+(mod(j,2)?.5:0))*px,j*py]}}
else P=(i,j)=>[i*px,j*py];
let ox=B.fit=='h'?0:(B.ox||0)*ts/100,oy=B.fit=='v'?0:(B.oy||0)*th/100,offs=[[0,0]];
if(B!==L){ox+=(L.ox||0)*ts/100;oy+=(L.oy||0)*th/100;offs=placeOffs(gm,g,px,py,L.pa)}
return{B,g,z:shOf(lt).z||100,ts,th,rot:fit?0:B.rot||0,gm,px,py,P,ox,oy,offs,l:O.l,r:O.r,linked:B!==L}}
const bhStrip=x=>x.replace(/ opacity="[^"]*"/g,'');
function build(){bkPre();
const[pa,pb]=pal();
let defs='',lg='';
tiles.forEach(t=>{useT(t);surfFor(t);const ci=inkOf(t),_d0=defs.length;defs+=`<clipPath id="shc${t.id}"><path d="${shp(0)}"/></clipPath><!--@E:${t.id}-->`+edgeDefs(t)+'<!--@-->'+`<mask id="m${t.id}" maskUnits="userSpaceOnUse" x="0" y="0" width="${SW}" height="${SH}">${t.neg?`<rect width="${SW}" height="${SH}" fill="#fff"/>${items(t,{c:'#000',d:'#fff'},0,0)}`:items(t,{c:'#fff',d:'#000'},0,0)}</mask><g id="s${t.id}" clip-path="url(#shc${t.id})">${isOf(t)?`<g mask="url(#is${t.id})">`:''}<rect width="${SW}" height="${SH}" fill="${ci}" mask="url(#m${t.id})"/>${txoG(t,'m'+t.id)}${isOf(t)?'</g>':''}</g>`;bkTile(t,defs.slice(_d0))});useT(tiles[WBS.cur]);
WBS.layers.forEach((L,li)=>{if(!L.vis)return;const lgB=lg;(()=>{const ls=tiles.filter(t=>L.st.includes(t.id)),n=ls.length;const lw=h=>{const lf=window.wbGrade?wbGrade.layF(L.u):'';let o=lf?`<g filter="url(#${lf})">${h}</g>`:h;const tm=layTexMask(L,li);if(tm){defs+=tm;o=`<g mask="url(#lt${li})">${o}</g>`}const ov=layTexOv(L);return ov[0]+o+ov[1]};if(L.free){const r=L.art?artLayer(L,li):L.txt?txtLayer(L,li):freeLayer(L,li,pa,lgB);defs+=r[0];lg+=lw(r[1]);return}if(L.fr&&L.fr.on){const r=frameLayer(L,li,ls,pa);defs+=r[0];lg+=lw(r[1]);return}if(!n)return;
const T=lattice(L),{ts,th,rot,px,py,P,ox,oy,gm}=T,amt=0,S=rng(11+li*977),RR=Math.hypot(CW,CH)/2,X0=rot?CW/2-RR:0,Y0=rot?CH/2-RR:0,XW=rot?2*RR:CW,YH=rot?2*RR:CH;
// each stamp's own outline and print scale on this grid
const GS={};tiles.forEach(t=>{const g=geom(shOf(t));GS[t.id]={g,k:ts*(shOf(t).z||100)/(T.g.SW*T.z)}});
const big=Math.max(...ls.map(t=>GS[t.id].k*Math.max(GS[t.id].g.SW,GS[t.id].g.SH))),mx=Math.max(0,Math.ceil(big/2/px)-1)+Math.ceil(Math.max(0,Math.abs(ox)-ts/2)/px)+(L.rpos>0?1:0),my=Math.max(0,Math.ceil(big/2/py)-1)+Math.ceil(Math.max(0,Math.abs(oy)-th/2)/py)+(L.rpos>0?1:0);
const i0=Math.floor(X0/px)-2-mx,i1=Math.ceil((X0+XW)/px)+1+mx,j0=Math.floor(Y0/py)-2-my,j1=Math.ceil((Y0+YH)/py)+1+my;
// Fit to frame: the snapped axis lines up exactly with the frame edges; the other axis bleeds off as usual.
let g='';const act=!DRS()&&((L.pst||0)>0||(L.pfl||0)>0),pre=act?`#q${li}_`:'#s',need=new Set(),rR=Math.max(0,+L.rrot||0),rP=Math.max(0,+L.rpos||0),rS=(L.rsd|0),fH=!!L.rfh,fV=!!L.rfv,tN=!!L.rtn;
for(let j=j0;j<=j1;j++)for(let i=i0;i<=i1;i++)T.offs.forEach(([qx,qy,up],oi)=>{if(up&&mod(i+j,2))return;const r1=S()-.5,r2=S()-.5,r3=S()-.5,r4=S();
const[bx,by]=P(i,j),cx=bx+ts/2+ox+qx,cy=by+th/2+oy+qy;if(cx<X0-big||cx>X0+XW+big||cy<Y0-big||cy>Y0+YH+big)return;if(rot&&Math.hypot(cx-CW/2,cy-CH/2)>RR+big*.75)return;
const dt=ls[idx(T.l,i,j,n,li,T.g)].id,ra=cellTurn(T.r,i,j,li)+(gm=='tri'&&!up&&mod(i+j,2)?180:0),ck=i+','+j+(oi?'/'+oi:''),ov=L.man&&L.ov?L.ov[ck]:null,tid=ov!=null&&tiles.some(x=>x.id==ov)?ov:dt,bin=act?Math.floor(rng((i+64)*7919+(j+64)*104729+li*1299709+13+oi*37)()*16):0;if(act)need.add(tid+'_'+bin);
let drr=0,dxr=0,dyr=0,sx=1,sy=1;if(rR||rP||fH||fV||tN){const Q=rng((i+64)*15485863+(j+64)*7919+li*1299709+rS*104729+oi*53+101),u1=Q(),u2=Q(),u3=Q(),u4=Q(),u5=Q(),u6=Q(),gg=GS[tid].g;drr=(u1*2-1)*rR;dxr=(u2*2-1)*rP/100*ts*.5;dyr=(u3*2-1)*rP/100*ts*.5;if(fH&&u4<.5)sx=-1;if(fV&&u5<.5&&flipVOk(gg))sy=-1;if(tN)drr+=turnFit(gg,u6)}
const tt=tiles.find(x=>x.id==tid),G2=GS[tid],ka=G2.k*1.004,ev=Math.floor(rng((i+64)*104729+(j+64)*7919+li*15485863+(tt.es||0)*31+oi*53)()*eNV(tt)),tr=`transform="translate(${(cx+r2*amt*.6+dxr).toFixed(1)} ${(cy+r3*amt*.6+dyr).toFixed(1)}) rotate(${(r1*2*amt+ra+drr).toFixed(2)}) scale(${(ka*sx).toFixed(4)} ${(ka*sy).toFixed(4)}) translate(${-G2.g.SW/2} ${-G2.g.SH/2})"`,op=`opacity="${(1-r4*amt*.03).toFixed(2)}"`;
const dc=L.man&&li==selL?` data-l="${li}" data-cell="${ck}" data-t="${tid}" data-d="${dt}"`:'';g+=act||DRS()||!eT(tt)?`<use href="${pre}${tid}${act?'_'+bin:''}"${dc} ${op} ${tr}${window.wbGrade&&wbGrade.stF(tid)?` filter="url(#${wbGrade.stF(tid)})"`:''}/>`:`<g${dc} ${op} ${tr}${window.wbGrade&&wbGrade.stF(tid)?` filter="url(#${wbGrade.stF(tid)})"`:''}><use href="#s${tid}"/><use href="#e${tid}_${ev}" fill="${inkOf(tt)}"/></g>`});
if(act)defs+=pressDefs(L,li,L.man?tiles:ls,need);
const ink=L.ink&&CM[L.ink]?col(L.ink):'';if(ink)defs+=`<filter id="lk${li}" filterUnits="userSpaceOnUse" x="${-CW}" y="${-CH}" width="${3*CW}" height="${3*CH}" color-interpolation-filters="sRGB"><feFlood flood-color="${ink}"/><feComposite in2="SourceAlpha" operator="in"/></filter>`;
const lop=L.op!=null?Math.max(0,Math.min(100,+L.op)):100,lbl=L.bl||'';
{const lf=window.wbGrade?wbGrade.layF(L.u):'',ltm=layTexMask(L,li),ov=layTexOv(L);if(ltm)defs+=ltm;lg+=`<g${lop<100?` opacity="${(lop/100).toFixed(2)}"`:''}${lbl?` style="mix-blend-mode:${lbl}"`:''}><g${lf?` filter="url(#${lf})"`:''}>${ov[0]}<g${ink?` filter="url(#lk${li})"`:''}${ltm?` mask="url(#lt${li})"`:''}><g${rot?` transform="rotate(${rot} ${CW/2} ${CH/2})"`:''}>${g}</g></g>${ov[1]}</g></g>`}})();
// Behind: this layer only prints where nothing below it has printed. Everything beneath becomes a black cut-out in a mask.
if((L.bl=='cancel'||L.bl=='replace'||(L.bl=='behind'&&!L.free))&&lg.length>lgB.length){const seg=lg.slice(lgB.length).split(' style="mix-blend-mode:behind"').join('').split(' style="mix-blend-mode:cancel"').join('').split(' style="mix-blend-mode:replace"').join('');defs+=`<mask id="bh${li}" maskUnits="userSpaceOnUse" x="0" y="0" width="${CW}" height="${CH}"><rect width="${CW}" height="${CH}" fill="#fff"/><g filter="url(#bhk)">${bhStrip(lgB)}</g></mask>`;if(L.bl=='cancel'||L.bl=='replace'){defs+=`<mask id="cx${li}" maskUnits="userSpaceOnUse" x="0" y="0" width="${CW}" height="${CH}"><rect width="${CW}" height="${CH}" fill="#fff"/><g filter="url(#bhk)">${bhStrip(seg)}</g></mask>`;lg=`<g mask="url(#cx${li})">${lgB}</g><g mask="url(#bh${li})">${seg}</g>`;if(L.bl=='replace'){const rc=col(L.rp&&CM[L.rp]?L.rp:proj.ink);defs+=`<mask id="rp${li}" maskUnits="userSpaceOnUse" x="0" y="0" width="${CW}" height="${CH}"><rect width="${CW}" height="${CH}" fill="#000"/><g filter="url(#bhw)">${bhStrip(lgB)}</g></mask><filter id="rc${li}" filterUnits="userSpaceOnUse" x="0" y="0" width="${CW}" height="${CH}" color-interpolation-filters="sRGB"><feFlood flood-color="${rc}"/><feComposite in2="SourceAlpha" operator="in"/></filter>`;lg+=`<g mask="url(#rp${li})"><g filter="url(#rc${li})">${seg}</g></g>`}}else lg=lgB+`<g mask="url(#bh${li})">${seg}</g>`}});
defs+=`<filter id="bhk" filterUnits="userSpaceOnUse" x="0" y="0" width="${CW}" height="${CH}" color-interpolation-filters="sRGB"><feColorMatrix type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0"/><feComponentTransfer><feFuncA type="linear" slope="4"/></feComponentTransfer></filter><filter id="bhw" filterUnits="userSpaceOnUse" x="0" y="0" width="${CW}" height="${CH}" color-interpolation-filters="sRGB"><feColorMatrix type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 1 0"/><feComponentTransfer><feFuncA type="linear" slope="4"/></feComponentTransfer></filter>`;
const f=WBS.DRAFT?'':roughFilter();
renderCover();
$('art').setAttribute('viewBox',`0 0 ${CW} ${CH}`);pvView();const ikc=typeof inkCatch=='function'&&!WBS.DRAFT?inkCatch():null;{const sk=tiles.map(t=>SURFC[t.id]?t.id+'#'+SURFC[t.id].k:'').join(';')+(WBS.edInk?'':'|plain');if(sk!==SURFK){SURFK=sk;$('surfd').innerHTML=tiles.map(t=>SURFC[t.id]?(WBS.edInk?SURFC[t.id].s:`<mask id="is${t.id}" maskUnits="userSpaceOnUse" x="-100000" y="-100000" width="200000" height="200000"><rect x="-100000" y="-100000" width="200000" height="200000" fill="#fff"/></mask>`):'').join('')}}bkShow(f,defs,ikc?ikc.defs:'',lg,L=>`<rect width="${CW}" height="${CH}" fill="${pa}"/><g${ikc?(WBS.edTx?' mask="url(#cw)"':' data-tki="1"'):''}><g ${f?'filter="url(#rf)"':''}>${L}</g></g>`);$('texg').style.display=WBS.edTx?'':'none';tbSync();txRefresh();
{const ci=hasOut(),O=ci?cOut():null;$('cvdefs').innerHTML=ci?`<clipPath id="cvclip" clipPathUnits="userSpaceOnUse"><path d="${O.d}"/></clipPath>`:'';['dyn','texg','covg'].forEach(id=>ci?$(id).setAttribute('clip-path','url(#cvclip)'):$(id).removeAttribute('clip-path'));$('art').classList.toggle('shp',ci);const sh=$('artsh');sh.style.display=ci?'block':'none';sh.setAttribute('viewBox',`0 0 ${CW} ${CH}`);sh.innerHTML=ci?`<path d="${O.d}" fill="${pa}"/>`:''}
$('tabs').innerHTML=tiles.map((t,k)=>{useT(t);return`<button data-k="${k}" class="${k==WBS.cur||tGrp().includes(k)?'on':''}" title="Stamp ${k+1}: ${SHN[SK]}"><svg viewBox="0 0 ${SW} ${SH}"><path d="${shp(0)}" fill="${pa}"/><use href="#s${t.id}"/></svg></button>`}).join('');useT(tiles[WBS.cur]);
renderL();if(typeof renderLayers=='function')renderLayers();
renderLib();frSync();fpSync();fpOverlay();if(window.wbGrade)wbGrade.refresh()}
const hx=x=>String(x).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
