import {kv} from '../platform/index.js';
import {$,WBS,WBX} from './01-launch-and-version.js';
import {bk,CH,CM,col,CW,geom,okC,PL,setDim,shOf,stFreeNm,stvSet,tileOn} from './04-canvas-and-stamp-outlines.js';
import {trayLoad} from './50-tray-core.js';
import {flatEls,selOne,store} from './06-motif-library-folders.js';
import {raf,upd} from './11-pressure-flooding-block-edges.js';
import {BK} from './03-stamp-prints-and-drawing.js';
import {TXF,txMake,txRid} from './16-texture-generators.js';
import {coreStr,pmsg} from './18-projects-and-cover-overlay.js';
import {wbHold} from './19-randomize-and-hold.js';
import {fpU} from './24-free-place-layers.js';
import {fpHid,fpWH} from './25-art-layers.js';
import {RZL,RZ_FRAME,RZ_NAMES,rzLay,rzLookPick,rzRoles} from './93-randomize-looks.js';
import {rzEffectsEls} from './71-randomize-elements.js';
// ===== v96 Before / after. `\` flips between the picture and the "before" (tap to stay, hold to peek); Shift+`\` splits the view with a draggable line.
// The "before" is the first state of this project in the History panel unless another history step or snapshot is chosen there.
// 2.21.0 (owner Oct 22 2026): a roll either replaces the previous roll and leaves your own elements alone (the default), or starts from an empty canvas (Randomize panel switch, kept in settings).
// What a roll made is remembered here (not in the file): the elements and stamps that were not there before it. The next roll takes those away first.
const RZ_KEY='wb121_rzfresh';let RZMADE=null;
const rzFresh=()=>{try{return kv.get(RZ_KEY)==='1'}catch(e){return false}};
const rzIds=()=>({els:new Set(WBS.layers.flatMap(l=>(l.pl||[]).map(q=>String(q.u)))),tiles:new Set(WBS.tiles.map(t=>t.id))});
function rzDrop(){const m=RZMADE;RZMADE=null;if(!m)return;const E=new Set(m.els);WBS.layers.forEach(l=>{if(l.pl)l.pl=l.pl.filter(q=>!E.has(String(q.u)))});
 const left=JSON.stringify(WBS.layers),used=id=>new RegExp('"(t|lead|cs)":'+id+'[,}]|"st":\\[[^\\]]*(^|[\\[,])'+id+'([,\\]])').test(left);
 const gone=new Set(m.tiles.filter(id=>!used(id)));if(gone.size&&WBS.tiles.length>gone.size){WBS.tiles=WBS.tiles.filter(t=>!gone.has(t.id));WBS.layers.forEach(l=>{if(l.st)l.st=l.st.filter(x=>!gone.has(x))});WBS.cur=0}}
// Taken out of the layers before a roll builds the new ones, put back on top of the first layer after it: your own elements (what is left once the previous roll is dropped), with the stamps they use.
function rzTake(){rzDrop();const own=[],ids=new Set();WBS.layers.forEach(l=>{if(l.pl&&l.pl.length){own.push(...l.pl);l.pl=[]}});
 own.forEach(q=>{if(q.t!=null)ids.add(String(q.t));(q.src||[]).forEach(x=>{if(x&&x.t!=null)ids.add(String(x.t))})});
 const tiles={};WBS.tiles.forEach(t=>{if(ids.has(String(t.id)))tiles[t.id]=JSON.stringify(t)});return{own,tiles}}
function rzPut(S,top){if(!S||!S.own.length)return;const L=WBS.layers[0];if(!L)return;let next=1+Math.max(0,...WBS.tiles.map(t=>+t.id||0));const map={};
 Object.keys(S.tiles).forEach(id=>{const cur=WBS.tiles.find(t=>String(t.id)==id);if(cur&&JSON.stringify(cur)===S.tiles[id])return;const c=JSON.parse(S.tiles[id]);c.id=next++;WBS.tiles.push(c);map[id]=c.id});
 S.own.forEach(q=>{if(q.t!=null&&map[q.t]!=null)q.t=map[q.t];(q.src||[]).forEach(x=>{if(x&&x.t!=null&&map[x.t]!=null)x.t=map[x.t]})});
 {const bg=S.own.filter(q=>q.bgd).concat((L.pl||[]).filter(q=>q.bgd)),mine=S.own.filter(q=>!q.bgd),pl=(L.pl||[]).filter(q=>!q.bgd),i=top?pl.findIndex(q=>top.has(String(q.u))):-1;L.pl=bg.concat(i<0?pl.concat(mine):pl.slice(0,i).concat(mine,pl.slice(i)))}   // the Background goes back under everything (2.28.0)   // under the stamps this roll placed on their own, which stay on top (2.24.0)
 // 2.50.2: a roll's element named like one of yours (Pattern 1 when you made a Pattern 1) takes the next free number
 {const mine=new Set(S.own.map(q=>q.n).filter(Boolean)),all=new Set((L.pl||[]).map(q=>q.n).filter(Boolean));(L.pl||[]).forEach(q=>{if(S.own.includes(q)||!q.n||!mine.has(q.n))return;const m=/^(.*?)(\d+)$/.exec(q.n),b=m?m[1]:q.n+' ';let k=m?+m[2]:2;while(all.has(b+k))k++;all.add(b+k);q.n=b+k})}
 WBS.nid=Math.max(WBS.nid||0,next)}
let wbBA;function randomize(fresh){if(WBX.wbBA)wbBA.off();if(WBX.wbSteReset)WBX.wbSteReset();   // a roll replaces the stamps: back on the Canvas, no stamp tabs (2.25.0)
if(!fresh&&rzFresh()){if(WBX.wbClearAll)WBX.wbClearAll();RZMADE=null}const b4=fresh?{els:new Set(),tiles:new Set()}:rzIds(),mark=()=>{const a=rzIds(),k=RZMADE;RZMADE={els:[...(k?k.els:[]),...[...a.els].filter(u=>!b4.els.has(u))],tiles:[...(k?k.tiles:[]),...[...a.tiles].filter(t=>!b4.tiles.has(t))]}};   // a roll that only reworks what is there adds to what the last stamps roll made
wbHold.start();let r;try{r=randomizeCore(fresh)}catch(e){wbHold.arm();throw e}if(r&&typeof r.then=="function")r.then(()=>{mark();wbHold.arm()},()=>wbHold.arm());else{mark();wbHold.arm()}return r}
// ===== A roll (2.76.3, docs/pattern-plan.md step 0, which finishes docs/randomize-plan.md). The Randomize panel says which parts a roll makes (Background, Pattern,
// Focal point, Text, Frame) and what it changes (Colours; Effects; Finish: the canvas texture, the colour grade and the print effects; Canvas size). A roll that makes any
// part is a Look (93-randomize-looks.js): it replaces the last roll, and your own elements stay where they are, with the roll kept clear of them. A roll with none of the
// parts on reworks what is there: a new palette, new effects, a new finish, a new canvas size. On a book cover the Look is laid out on the front cover; on a repeat tile
// only a Look that tiles (Repeat) is made, with nothing that would not wrap round the tile's edges (no filter effects, no vignette).
const RZ_DEF={bg:1,pat:1,focal:1,text:1,frame:1,col:1,efx:1,fin:1,size:0},RZ_PARTS=['bg','pat','focal','text','frame'];
const RZ_RAT=[[2,3],[3,4],[4,5],[5,7],[1,1],[3,2],[4,3],[7,5]];
// a Look built on the front cover's size, moved onto the front (bx: x0, y0, w, h of the front's trim, and S0, S1 the short sides of the front and of the whole cover).
// A size given as a share of the canvas's short side (a text box, a pattern's pieces) is turned from the front's into the cover's. A Sheet, and a pattern that fills the
// canvas, stay over the whole cover, so the ground runs round the spine and the back (a Scatter keeps its density); a border goes round the front.
function rzFront(res,bx){const k=bx.S0/bx.S1,f1=v=>+(+v).toFixed(1),mv=q=>{if(q.x!=null)q.x=f1(+q.x+bx.x0);if(q.y!=null)q.y=f1(+q.y+bx.y0)};
 res.els.concat(res.texts).forEach(q=>{if(q.k=='sheet')return;
  if(q.k=='paint'){(q.st||[]).forEach(s=>{s.pts=(s.pts||[]).map(p=>[f1(p[0]+bx.x0),f1(p[1]+bx.y0)])});return}
  if(q.k=='pattern'){if(q.ps!=null)q.ps=+(q.ps*k).toFixed(3);
   if(q.af&&!q.mp){if(q.lay=='frame')Object.assign(q,{af:0,aw:f1(bx.w),ah:f1(bx.h),x:f1(bx.x0+bx.w/2),y:f1(bx.y0+bx.h/2)});
    else{if(q.lay=='scatter'){q.cn=Math.max(1,Math.min(40,Math.round(q.cn*CW/bx.w)));q.rn=Math.max(1,Math.min(40,Math.round(q.rn*CH/bx.h)))}Object.assign(q,{x:f1(CW/2),y:f1(CH/2),s:Math.min(CW,CH)})}return}}
  if(q.tx){if(q.tx.wd)q.tx.wd=Math.max(4,Math.round(q.tx.wd*k));if(q.tx.ht)q.tx.ht=Math.max(3,Math.round(q.tx.ht*k))}
  mv(q)})}
function randomizeCore(fresh){const R=Math.random,pick=a=>a[Math.floor(R()*a.length)],rr=(a,b)=>a+R()*(b-a),ri=(a,b)=>Math.floor(rr(a,b+1)),ch=p=>R()<p,wpick=o=>{let t=R()*o.reduce((x,y)=>x+y[1],0);for(const x of o){if((t-=x[1])<=0)return x[0]}return o[0][0]};
const FT={...RZ_DEF,...(WBX.wbRZ?WBX.wbRZ.get():{})};
if(!Object.keys(RZ_DEF).some(k=>FT[k])){pmsg('Nothing is switched on in Randomize, so nothing changed.');return}
const book=!!WBS.book.on,tile=tileOn(),tok=WBX.wbRndTok=(WBX.wbRndTok||0)+1;
if(!fresh&&WBX.wbCap)WBX.wbCap();
// Canvas size: a new ratio first, so the roll is laid out on it (a book cover and a repeat tile keep theirs)
if(FT.size&&!book&&!tile){const c0=WBS.dim.c||[],a=RZ_RAT.filter(x=>!(x[0]==c0[0]&&x[1]==c0[1]));WBS.dim={...WBS.dim,c:pick(a)};setDim();try{kv.set('wb14_dim',JSON.stringify(WBS.dim))}catch(e){}}
// Colours: a new palette (a Wada combination, as the Palette menu gives) goes into the first places of the tray; paper, ink and the rest are links to those places
const newPal=FT.col&&PL.length?pick(PL):null,P0=JSON.parse(JSON.stringify(WBS.proj));let PC;
if(newPal){const ids=trayLoad([newPal[2],newPal[1],newPal[3],newPal[4]].filter(Boolean).map(n=>[CM[n],n]),P0);P0.bg='@'+ids[0];P0.ink='@'+ids[1];PC=ids.map(id=>'@'+id)}else PC=P0.ts.map(id=>'@'+id);
const hx=c=>{const s=String(c||'');if(s[0]=='@'){const w=P0.cw&&P0.cw[P0.cwa|0],v=w&&w.c&&w.c[s.slice(1)];if(v)return v}return col(c)};
// Finish: a paper texture on the canvas (or the kind a Look asks for), a colour grade, sometimes a vignette (not on a repeat tile: it does not wrap)
const paperTex=k=>{const ks=Object.keys(TXF[0][1]);if(!ks.length)return[];const T=txMake(k&&k!='paper'?k:pick(ks),{a:ri(10,24),sc:ri(90,170),az:pick([225,200,250]),auto:true});WBS.texLib.push(T);return[{x:T.id,sd:txRid(),md:'relief'}]};
const GL={warm:()=>({tp:ri(12,28),tn:ri(0,8),fd:ri(4,16)}),fade:()=>({fd:ri(14,32),ct:-ri(0,10),sat:-ri(5,20)}),punch:()=>({ct:ri(8,22),vib:ri(8,24),sh:-ri(0,10)}),none:()=>({})};
const grade=name=>{if(!WBX.wbGrade)return;const g0=WBX.wbGrade.get();let gl={};if(FT.fin)gl=(GL[name]||GL.none)();else Object.keys(g0).forEach(k=>{if(k!='cov'&&k!='masks')gl[k]=g0[k]});
 const masks=FT.fin?(!tile&&ch(.2)?[{t:'rad',name:'Vignette',sp:'c',cx:.5,cy:.5,rx:+rr(.62,.78).toFixed(3),ry:+rr(.62,.78).toFixed(3),fe:ri(70,90),inv:true,a:{ex:-ri(6,14)}}]:[]):(g0.masks||[]);WBX.wbGrade.set({...gl,cov:g0.cov,masks})};
const end=msg=>{store();upd();if(WBX.wbRollHold===tok)WBX.wbRollHold=0;
 if(fresh){if(WBX.wbResetHist)WBX.wbResetHist()}else if(WBX.wbCap){WBX.wbLabelNext={t:'Randomize '+(WBX.wbRollN=(WBX.wbRollN||0)+1),at:performance.now()};WBX.wbCap()}
 {const b=$('rzdo');if(b){b.classList.remove('spin');void b.offsetWidth;b.classList.add('spin')}}pmsg(fresh?'Started a new project with a fresh random piece.':msg)};
const LOOK=RZ_PARTS.some(k=>FT[k])?rzLookPick({FT,wpick,tile,want:WBX.wbRZ&&WBX.wbRZ.look?WBX.wbRZ.look():'any'}):'';
// --- no part to make (or none that fits a repeat tile): the roll reworks what is there
if(!LOOK){const u=FT.fin?(tile?[]:paperTex()):null,c=JSON.parse(coreStr());c.proj=P0;if(u)c.tex={u,v:87};
 if(FT.efx&&!tile)rzEffectsEls([{pl:c.els}],{seed:tok+':'+JSON.stringify(c.els),groups:['noise','blur','print','distort'],filter:true,rework:true,isNew:()=>true,prev:new Set(RZMADE?RZMADE.els:[]),only:!(FT.col||FT.fin||FT.size)});
 WBS.cur=0;selOne(-1);WBS.selL=0;(WBX.wbApply||applyCore)(c);WBS.selL=0;grade(pick(['warm','fade','punch','none','none']));end('Randomized.');return}
// --- a Look
const OWN=fresh?null:rzTake(),own0=OWN?OWN.own:flatEls(WBS.layers),bgq=own0.find(p=>p.bgd),paper=bgq&&okC(bgq.ink)?bgq.ink:P0.bg;
const dark=RZL[LOOK].dark&&FT.col&&FT.bg&&ch(.3),roles=rzRoles([...new Set([...PC,P0.bg,P0.ink])],paper,dark,hx);
// a texture for an element's effect: a new entry in the texture library (a roll's textures are its own)
const tex=(t,o)=>{const T=txMake(t,{a:ri(18,32),sc:ri(80,160),az:pick([225,200,250]),auto:true,...(o||{})});WBS.texLib.push(T);return T.id},shuf=a=>{const b=a.slice();for(let i=b.length-1;i>0;i--){const j=Math.floor(R()*(i+1));[b[i],b[j]]=[b[j],b[i]]}return b};
const E={R,pick,ri,rr,ch,wpick,FT:{...FT,jit:1,pr:FT.fin},FL:null,roles,tex:FT.fin?tex:null,shuf,tile};
let bx=null;if(book){const g=bk();bx={x0:CW*(g.b+g.tw+g.sw)/g.W,y0:CH*g.b/g.H,w:CW*g.tw/g.W,h:CH*g.th/g.H,S1:Math.min(CW,CH)};stvSet(bx.w,bx.h);bx.S0=Math.min(CW,CH)}
let res;try{res=RZL[LOOK].build(E)}catch(e){if(bx)stvSet(null);rzPut(OWN,null);throw e}if(bx){stvSet(null);rzFront(res,bx)}
const isQ=e=>e&&!['texture','pressure','jitter','grade'].includes(e.k);
// anything switched off stays out of the picture: filter effects (Effects; never on a repeat tile), pressure and textures (Finish), the parts (a focal point is marked by the Look)
const keepFx=e=>!(isQ(e)&&(!FT.efx||tile))&&!((e.k=='pressure'||e.k=='texture')&&!FT.fin);
// the roll's stamps take ids no stamp has had in this session: a print kept for an old stamp with the same id must never stand in for a new one
{const base=Math.max(0,...WBS.tiles.map(t=>+t.id||0),WBS.nid||0),mp={};res.tiles.forEach((t,i)=>{mp[t.id]=base+1+i;t.id=base+1+i;if(!(typeof t.nm=='string'&&t.nm.trim()))t.nm=stFreeNm(res.tiles.slice(0,i))});res.els.forEach(q=>{if(q.k=='stamp'&&mp[q.t]!=null)q.t=mp[q.t];(q.src||[]).forEach(x=>{if(x.k=='stamp'&&mp[x.t]!=null)x.t=mp[x.t]})});WBS.nid=base+1+res.tiles.length}
const fr=q=>RZ_FRAME.includes(q.nm);
let els=res.els.filter(q=>(FT.frame||!fr(q))&&(FT.focal||q._p!='focal')&&(FT.pat||q.k!='pattern'||q.mp||fr(q)));els.forEach(q=>{delete q._p;if(q.fx){q.fx=q.fx.filter(keepFx);if(!q.fx.length)delete q.fx}});
const top=res.top&&FT.efx&&!tile?{u:fpU(),k:'sheet',n:'Filter',fl:'none',fx:[res.top]}:null,texts=FT.text?res.texts:[];
// a path (a shape with no fill that words or a pattern follow) that nothing follows any more is left out
{const used=new Set([...els,...texts].map(q=>q.mp).filter(Boolean));els=els.filter(q=>q.nm!='Path'||used.has(q.u))}
const cvU=!FT.fin?JSON.parse(JSON.stringify(WBS.tex)).u.filter(u=>u.md!='wear'):res.tex?paperTex(res.tex):[];
WBX.wbTxBusy=(WBX.wbTxBusy||0)+1;WBX.wbRollHold=tok;
// 2.76.2 (owner Oct 29 2026, review): your own elements stay where they are and the roll keeps clear of them. Whatever the roll places on the canvas (words,
// emblems, stamps, a ring) is left out where it would touch one of yours; its Background, Sheets, frames, Patterns that fill the canvas and paths (they draw nothing) stay.
// a stamp's box from its stamp's outline: the roll's stamps are not in the project yet
const stWH=p=>{const tt=res.tiles.find(t=>t.id==p.t)||WBS.tiles.find(t=>t.id==p.t);if(!tt)return null;const G=geom(shOf(tt)),k=p.s/Math.max(G.SW,G.SH);return[G.SW*k*(p.wx||1),G.SH*k*(p.wy||1)]};
const rzBox=p=>{const wh=p.k=='stamp'?stWH(p):fpWH(p);if(!wh)return null;const r=(+p.r||0)*Math.PI/180,co=Math.abs(Math.cos(r)),si=Math.abs(Math.sin(r)),ex=(wh[0]*co+wh[1]*si)/2,ey=(wh[0]*si+wh[1]*co)/2,x=+p.x||0,y=+p.y||0,
 b=[Math.max(0,x-ex),Math.max(0,y-ey),Math.min(CW,x+ex),Math.min(CH,y+ey)];return b[2]>b[0]&&b[3]>b[1]?b:null};
const behind=q=>q.bgd||q.nm=='Path'||q.k=='sheet'||q.k=='group'||fr(q)||q.k=='pattern'&&!q.mp&&(q.af||!(+q.aw>0)||!(+q.ah>0));
let ownB=OWN?OWN.own.filter(p=>!behind(p)&&!fpHid(OWN.own,p)).map(rzBox).filter(Boolean):[];const gap=Math.min(CW,CH)*.02;
const onPath=q=>q.mp&&(q.k=='pattern'||q.tx)?els.find(z=>z.u==q.mp)||q:q;   /* a Pattern or words mapped to a shape take that shape's box */
const clear=q=>{if(!ownB.length||behind(q))return true;const b=rzBox(onPath(q));return!b||!ownB.some(o=>b[0]<o[2]+gap&&b[2]>o[0]-gap&&b[1]<o[3]+gap&&b[3]>o[1]-gap)};
// 2.76.11 (2.76 review): your title takes the Look's title place. Your largest visible text moves to where the Look puts its title, at its size and in its colour,
// and the Look's own title is left out; then the roll keeps clear of it as of everything else of yours. After the roll, any other text of yours that would be hard to
// read on the new paper (contrast under 3:1) takes the Look's text colour.
let myT=null,lookInk=null;
const rzTitle=lt=>{if(!OWN||!lt||!lt.length)return lt;const mine=OWN.own.filter(q=>q.tx&&q.v!==false&&!q.lk&&!fpHid(OWN.own,q)).sort((a,b)=>(+b.s||0)-(+a.s||0)),tt=lt.slice().sort((a,b)=>(+b.s||0)-(+a.s||0))[0];if(!tt)return lt;lookInk=tt.ink||null;
 if(!mine.length)return lt;myT=mine[0];myT.x=tt.x;myT.y=tt.y;myT.s=+(+tt.s).toFixed(2);myT.r=+tt.r||0;if(tt.ink)myT.ink=tt.ink;ownB=OWN.own.filter(p=>!behind(p)&&!fpHid(OWN.own,p)).map(rzBox).filter(Boolean);return lt.filter(q=>q!==tt)};
const rzLum=h=>{const c=String(h||'').slice(1,7),v=[0,2,4].map(i=>{const x=parseInt(c.slice(i,i+2),16)/255;return x<=.03928?x/12.92:Math.pow((x+.055)/1.055,2.4)});return .2126*v[0]+.7152*v[1]+.0722*v[2]};
const rzReadable=()=>{if(!OWN||!lookInk)return;const pa=rzLum(col(WBS.proj.bg)),cr=h=>{const a=rzLum(h);return(Math.max(a,pa)+.05)/(Math.min(a,pa)+.05)};OWN.own.forEach(q=>{if(!q.tx||q===myT||q.v===false)return;const ink=col(okC(q.ink)?q.ink:WBS.proj.ink);if(cr(ink)<3)q.ink=lookInk})};
const done=lt=>{if(tok!==WBX.wbRndTok)return;lt=rzTitle(lt||[]);if(ownB.length){lt=(lt||[]).filter(clear);els=els.filter(clear)}WBS.cur=0;selOne(-1);if(typeof WBS.brush!='undefined')WBS.brush=null;WBS.selL=0;
 // 2.78.0: a Pattern inside the Look's words (_post) goes over them; it is left out when its words are not there (Text off, your own title in their place)
 const post=els.filter(q=>q._post),has=new Set([...els,...(lt||[])].map(q=>String(q.u)));els=els.filter(q=>!q._post);const pst=post.filter(q=>has.has(String(q.pin)));pst.forEach(q=>delete q._post);
 const c={pg:{...WBS.pgrid},tiles:res.tiles,els:(OWN?[]:own0.filter(p=>p.bgd)).concat(own0.some(p=>p.bgd)?[]:[{u:fpU(),k:'sheet',n:'Background',ink:paper,bgd:1}],els,lt,pst,top?[top]:[]),proj:{...P0},dim:WBS.dim,pr:{e:0,q:0,t:'',a:0,sc:100,sd:1},tex:{u:cvU,v:87,...(!FT.fin&&WBS.tex.off?{off:1}:{})}};
 (WBX.wbApply||applyCore)(c);WBS.selL=0;rzPut(OWN,null);rzReadable();grade(res.grade);end('Randomized: '+(RZ_NAMES[LOOK]||LOOK)+'.')};
return rzLay(texts).then(done,()=>done([])).catch(e=>{rzPut(OWN,null);store();upd();throw e}).finally(()=>{if(WBX.wbRollHold===tok)WBX.wbRollHold=0;WBX.wbTxBusy=Math.max(0,(WBX.wbTxBusy||1)-1)})}
function init20(){
wbBA=(()=>{const st=()=>document.querySelector('.stage'),bd=()=>[...st().querySelectorAll(':scope>.board')].filter(b=>!b.hidden&&!b.classList.contains('off')),key=()=>bd().map(b=>b.id).join();
let ref=null,pics=null,pk='',pcore=null,mode=0,busy=0,sp=.5,ovs=[],tags=[],hd=null,loop=0,dt=0,pk0=0;
const sleep=ms=>new Promise(r=>setTimeout(r,ms)),paintUI=()=>{if(WBX.wbBAPaint)WBX.wbBAPaint()};
async function settle(){const t0=performance.now();let lm=t0;const mo=new MutationObserver(()=>{lm=performance.now()});bd().forEach(b=>mo.observe(b,{childList:true,subtree:true,attributes:true}));['grdf','cvdefs','surfd','dyn'].forEach(id=>{const e=$(id);if(e)mo.observe(e,{childList:true,subtree:true,attributes:true})});
 await sleep(80);for(;;){const n=performance.now(),b=raf||BK.busy||BK.q.size||BK.tm||BK.defT||(WBX.wbTxBusy||0)>0;if(!b&&n-lm>=160)break;if(n-t0>9000)break;await sleep(40)}mo.disconnect()}
// Until another step or snapshot is chosen in History, the picture compared against is the step before the current one (the Start when there is none).
const defRef=()=>{const hi=WBX.wbHistIdx?WBX.wbHistIdx():0,i=Math.max(0,hi-1),c=WBX.wbHistGet?WBX.wbHistGet(i):null;return c==null?null:{label:WBX.wbHistLabel?WBX.wbHistLabel(i):'Start',core:c}},cur0=()=>ref||defRef();
async function ensure(){const k=key(),R=cur0();if(!R)return false;if(pics&&pk==k&&pcore===R.core)return true;
 busy=1;WBX.wbHoldOn=1;WBX.wbNoCap=1;document.body.classList.add('babusy');const boards=bd(),host=st(),cur=coreStr(),hold=[],same=R.core===cur;
 try{if(!same){boards.forEach((b,i)=>{const o=wbHold.freezeSn(wbHold.snap(b,'bh'+i+'_'),b,host,0);wbHold.lay(o);hold.push(o)});WBX.wbApply(JSON.parse(R.core));await settle()}
  pics=boards.map((b,i)=>wbHold.snap(b,'ba'+i+'_'));pk=k;pcore=R.core;
  if(!same){WBX.wbApply(JSON.parse(cur));await settle()}}
 catch(e){pics=null;try{WBX.wbApply(JSON.parse(cur))}catch(_){}}
 finally{hold.forEach(o=>o.el.remove());busy=0;WBX.wbHoldOn=0;WBX.wbNoCap=0;document.body.classList.remove('babusy')}
 return !!pics}
function clear(){ovs.forEach(o=>o.el.remove());ovs=[];tags.forEach(t=>t.remove());tags=[];if(hd){hd.remove();hd=null}cancelAnimationFrame(loop);loop=0}
function mk(){clear();const boards=bd(),host=st();
 pics.forEach((sn,i)=>{const b=boards[i];if(!b)return;const o=wbHold.freezeSn(sn,b,host,0);o.el.classList.add('baov');ovs.push(o)});
 const mkT=(l,t,c)=>{const e=document.createElement('div');e.className='baT '+c;const u=document.createElement('u');u.className='ab '+c;u.textContent=l;const sp=document.createElement('span');sp.textContent=t;sp.style.cssText='overflow:hidden;text-overflow:ellipsis';e.append(u,sp);host.appendChild(e);tags.push(e);return e};
 mkT('A',(cur0()||{label:'Start'}).label,'a');if(mode==2){mkT('B','Current','b').classList.add('r');hd=document.createElement('div');hd.className='baH';hd.innerHTML='<i></i>';host.appendChild(hd);
  hd.onpointerdown=e=>{e.preventDefault();hd.setPointerCapture(e.pointerId);const mv=ev=>{const r=ovs[0]?ovs[0].src.getBoundingClientRect():null;if(!r)return;sp=Math.max(.02,Math.min(.98,(ev.clientX-r.left)/r.width));sync()},up=()=>{hd.removeEventListener('pointermove',mv);hd.removeEventListener('pointerup',up)};hd.addEventListener('pointermove',mv);hd.addEventListener('pointerup',up)}}
 {const x=document.createElement('button');x.type='button';x.className='baX';x.innerHTML='Exit compare<kbd>Esc</kbd>';x.onclick=()=>off();host.appendChild(x);tags.push(x)}
 sync();loop=requestAnimationFrame(tick)}
function sync(){ovs.forEach(o=>{wbHold.lay(o);const a=o.src,c=o.el.lastElementChild;if(c){c.scrollLeft=a.scrollLeft;c.scrollTop=a.scrollTop}o.el.style.clipPath=mode==2?`inset(0 ${((1-sp)*100).toFixed(2)}% 0 0)`:'none';o.el.style.pointerEvents=mode==2?'none':'auto'});
 const o=ovs[0];if(!o)return;const b=o.src,L=b.offsetLeft,T=b.offsetTop,W=b.offsetWidth,H=b.offsetHeight;
 // tags are placed by role, not by position in the list: in Before there is no B label, so the Exit pill used to land on B's spot at the right edge and was cut off
 const tA=tags[0],tB=tags.find(t=>t.classList.contains('r')),tX=tags.find(t=>t.classList.contains('baX'));
 if(tA){tA.style.left=(L+10)+'px';tA.style.top=(T+10)+'px'}if(tB){tB.style.left=(L+W-10)+'px';tB.style.top=(T+10)+'px'}
 if(tX){tX.style.left=(L+W/2)+'px';tX.style.top=(T+10)+'px'}if(hd){hd.style.left=(L+W*sp)+'px';hd.style.top=T+'px';hd.style.height=H+'px'}}
function tick(){loop=0;if(!mode)return;if(key()!=pk||wbHold.on){off();return}sync();loop=requestAnimationFrame(tick)}
function off(){if(!mode&&!ovs.length)return;mode=0;clear();paintUI()}
async function setMode(m){if(busy||wbHold.on)return;if(m==mode){off();return}
 if(!(await ensure()))return;if(key()!=pk)return;mode=m;mk();paintUI()}
function setRef(label,core,show){ref={label,core};pics=null;const m=show?2:mode;if(mode){mode=0;clear()}if(m)setMode(m);else paintUI()}
function reset(){ref=null;pics=null;off()}
function clearRef(){ref=null;pics=null;const m=mode;if(mode){mode=0;clear()}if(m)setMode(m);else paintUI()}
const typing=e=>{const t=e.target;return !!(t&&t.matches&&(t.isContentEditable||t.matches('textarea,select')||(t.matches('input')&&!/^(range|checkbox|radio|button|color|submit)$/.test(t.type))))};
document.addEventListener('keydown',e=>{if(typing(e)||e.metaKey||e.ctrlKey||e.altKey)return;
 if(e.key=='Escape'&&mode){off();return}
 if(e.key=='\\'||e.key=='|'){e.preventDefault();if(e.repeat||busy)return;const sh=e.key=='|';if(!sh&&mode==1){off();return}pk0=!sh&&pics&&pk==key()?1:0;dt=performance.now();setMode(sh?2:1)}},true);
document.addEventListener('keyup',e=>{if(e.key=='\\'&&mode==1&&pk0&&performance.now()-dt>380)off()},true);
return{setRef,reset,clearRef,off,toggle:()=>setMode(1),split:()=>setMode(2),get mode(){return mode},get busy(){return busy},get label(){const r=cur0();return r?r.label:'Start'},get core(){const r=cur0();return r?r.core:null},get custom(){return !!ref&&ref.label!=='Start'}}})();
WBX.wbBA=wbBA;
}
export {randomize,wbBA,init20};
