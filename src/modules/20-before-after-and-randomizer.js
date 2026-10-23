import {kv} from '../platform/index.js';
import {$,WBS,WBX} from './01-launch-and-version.js';
import {BK} from './03-stamp-prints-and-drawing.js';
import {CASP,CH,CM,CW,PL,SH,SK,SW,col,geom,inShape,okC,setDim,shOf,useG,useT,wrapP} from './04-canvas-and-stamp-outlines.js';
import {isFixed,isLink,trayLoad} from './50-tray-core.js';
import {CATS} from './05-motif-data.js';
import {cust,flatEls,it,mkL,oneLayer,selOne,store} from './06-motif-library-folders.js';
import {gModel} from './08-grid-shapes.js';
import {hx3} from './09-stamp-items-and-print-runs.js';
import {GRAD,arrOpts,gArrAll} from './71-randomize-elements.js';
import {raf,upd} from './11-pressure-flooding-block-edges.js';
import {TXF,TXMD,txMake,txRid} from './16-texture-generators.js';
import {txMerge} from './17-texture-panel-and-previews.js';
import {coreStr,pmsg} from './18-projects-and-cover-overlay.js';
import {wbHold} from './19-randomize-and-hold.js';
import {fpU} from './24-free-place-layers.js';
import {SL,libColors,libMotifs} from './27-stamp-library.js';
import {rzFrameEls,rzFx,rzLayoutEls,rzMainEls,rzPressEls} from './71-randomize-elements.js';
// a layer that holds pictures or text boxes: Randomize keeps these
const rzPic=l=>(l.pl||[]).some(p=>p.a||p.tx);
// ===== v96 Before / after. `\` flips between the picture and the "before" (tap to stay, hold to peek); Shift+`\` splits the view with a draggable line.
// The "before" is the first state of this project in the History panel unless another history step or snapshot is chosen there.
// 2.21.0 (owner Oct 22 2026): a roll either replaces the previous roll and leaves your own elements alone (the default), or starts from an empty canvas (Randomize panel switch, kept in settings).
// What a roll made is remembered here (not in the file): the elements and stamps that were not there before it. The next roll takes those away first.
const RZ_KEY='wb121_rzfresh';let RZMADE=null;
// the stamps the last roll placed on their own (2.24.0): the project is one element list, so a reroll tells them apart by their element ids.
// A stamp counts only while an element the roll made still uses it (ids are never reused, so a new or opened project cannot match).
let RZFZ=new Set();
const rzFz=()=>{const o=new Set();WBS.layers.forEach(l=>(l.pl||[]).forEach(q=>{if(q.t!=null&&RZFZ.has(String(q.u)))o.add(q.t)}));return o};
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
 {const pl=L.pl||[],i=top?pl.findIndex(q=>top.has(String(q.u))):-1;L.pl=i<0?pl.concat(S.own):pl.slice(0,i).concat(S.own,pl.slice(i))}   // under the stamps this roll placed on their own, which stay on top (2.24.0)
 WBS.nid=Math.max(WBS.nid||0,next)}
let wbBA;function randomize(fresh){if(WBX.wbBA)wbBA.off();if(WBX.wbSteReset)WBX.wbSteReset();   // a roll replaces the stamps: back on the Canvas, no stamp tabs (2.25.0)
if(!fresh&&rzFresh()){if(WBX.wbClearAll)WBX.wbClearAll();RZMADE=null}const b4=fresh?{els:new Set(),tiles:new Set()}:rzIds(),mark=()=>{const a=rzIds(),k=RZMADE;RZMADE={els:[...(k?k.els:[]),...[...a.els].filter(u=>!b4.els.has(u))],tiles:[...(k?k.tiles:[]),...[...a.tiles].filter(t=>!b4.tiles.has(t))]}};   // a roll that only reworks what is there adds to what the last stamps roll made
wbHold.start();let r;try{r=randomize0(fresh)}catch(e){wbHold.arm();throw e}if(r&&typeof r.then=="function")r.then(()=>{mark();wbHold.arm()},()=>wbHold.arm());else{mark();wbHold.arm()}return r}
function randomize0(fresh){const ft=WBX.wbRZ?WBX.wbRZ.get():null;window.SLC=[];
 if(ft&&ft.lib&&typeof SL!='undefined')return SL.list().then(l=>{window.SLC=(l||[]).filter(r=>r&&typeof r.tile=='string');return randomizeCore(fresh)},()=>randomizeCore(fresh));
 return randomizeCore(fresh)}
function randomizeCore(fresh){const R=Math.random,pick=a=>a[Math.floor(R()*a.length)],rr=(a,b)=>a+R()*(b-a),ri=(a,b)=>Math.floor(rr(a,b+1)),ch=p=>R()<p,wpick=o=>{let t=R()*o.reduce((x,y)=>x+y[1],0);for(const x of o){if((t-=x[1])<=0)return x[0]}return o[0][0]};
const FT=WBX.wbRZ?WBX.wbRZ.get():{stamps:1,text:1,frame:1,col:1,gr:1,masks:1,tx:1,pr:1,shape:0,free:1,layout:0,size:0,look:0,lib:0,jit:1};
// which kinds of change each switch allows (the arrows in the Randomize panel)
const SUBS={};['stamps','frame','shape','free','col','gr','masks','tx','pr','layout','size','look','lib','jit'].forEach(m=>SUBS[m]=WBX.wbRZ?WBX.wbRZ.sub(m):null);const sOn=(m,k)=>!SUBS[m]||SUBS[m].has(k);
// An amount under 100 (the sliders in the Randomize panel) lets only some of a feature's allowed kinds of change happen on this roll (at least one), or, for a feature
// without kinds, lets it happen on some rolls. At 100 nothing is drawn here, so a roll comes out exactly as it did before the sliders. Colours keep a plain switch.
const AM=k=>WBX.wbRZ&&WBX.wbRZ.amt?WBX.wbRZ.amt(k):1;
{const gated=[];['stamps','text','layout','frame','shape','size','free','gr','masks','tx','pr','look','jit'].forEach(m=>{const a=AM(m);if(!FT[m]||a>=1)return;const S=SUBS[m];
 if(S&&S.size>1&&m!='text'){const keep=[...S].filter(()=>ch(a));if(!keep.length)keep.push(pick([...S]));SUBS[m]=new Set(keep)}
 else if(!ch(a)){FT[m]=0;gated.push(m)}});
 if(gated.length&&!['stamps','frame','col','gr','masks','tx','pr','shape','free','layout','size','look','lib'].some(m=>FT[m]))FT[pick(gated)]=1}
const RAT={portrait:[[2,3],[3,4],[4,5],[5,7]],square:[[1,1]],landscape:[[3,2],[4,3],[7,5]],banner:[[1,2],[9,16],[2,1],[16,9]]},ratioPick=()=>{let a=[];if(FT.size)Object.keys(RAT).forEach(g=>{if(sOn('size',g))a=a.concat(RAT[g])});if(!a.length)a=[[2,3],[3,4],[4,5],[5,7],[1,1],[3,2],[4,3]];return pick(a)};
const SLCn=(window.SLC||[]).length,libFree=!!(FT.lib&&sOn('lib','free')&&SLCn),libPat=!!(FT.lib&&sOn('lib','pat')&&SLCn);let libDone=false;
const libTile=id=>{const r=pick(window.SLC);let t=null;try{t=JSON.parse(r.tile)}catch(e){}if(!t||!Array.isArray(t.items))return null;try{libMotifs({motifs:r.motifs});libColors({colors:r.colors})}catch(e){}txMerge(t);t.id=id;shOf(t);return t};
if(!(FT.stamps||FT.frame||FT.col||FT.gr||FT.masks||FT.tx||FT.pr||FT.shape||FT.free||FT.layout||FT.size||FT.look||FT.lib)){pmsg('Nothing is switched on in Randomize, so nothing changed.');return}
const dim0=JSON.parse(JSON.stringify(WBS.dim));
if(!fresh&&WBX.wbCap)WBX.wbCap();
const OWN=fresh||!FT.stamps?null:rzTake();   // 2.21.0: a roll that builds new stamps drops the previous roll and holds your own elements aside until the new ones are built (a roll that only reworks what is there, such as Layout or Colours alone, changes it in place)
// --- the bold moves for this roll (only used when Stamps is on)
const MOVES=[['sym','new symmetry',1.3],['link','accents in the gaps',1.2],['shape','accent shapes',1],['mix','mixed shapes',.7],['rot','turned grid',.8],['inks','extra inks',.7],['motif','shape tweaks',.8],['swap','light on dark',.6],['blend','soft blending',.5],['radial','round arrangements',.7],['vary','size, gaps and offset',.6],['text','lettering',1],['frame','frame',1.1]];
const RZ={mv:null,n:0,keep:{col:!FT.col,gr:!FT.gr,tx:!FT.tx,pr:!FT.pr}};
let inkMap={};const noAcc=!FT.col||!sOn('col','acc'),noPal=!FT.col||!sOn('col','pal');RZ.keep.col=noPal;
const MV=MOVES.filter(x=>FT.stamps&&x[0]!='frame'&&!(x[0]=='text'&&!FT.text)&&!(x[0]=='swap'&&noPal)&&!(x[0]=='inks'&&noAcc)&&!(x[0]=='radial'&&WBS.dim.rt&&!WBS.book.on)&&(x[0]=='text'||sOn('stamps',x[0])));
const F=new Set(),nf=Math.min(RZ.n||wpick([[1,.55],[2,.45]]),MV.length);while(F.size<nf){const m=wpick(MV.filter(x=>!F.has(x[0])).map(x=>[x[0],x[2]]));F.add(m)}
// lettering takes over the main stamp, so it doesn't pair with moves that rework that stamp
if(F.has('text')&&!WBX.wbTxPlace)F.delete('text');if(F.has('text'))['sym','mix','motif'].forEach(x=>F.delete(x));if(!F.size&&FT.stamps)F.add('link');if(FT.frame&&!(WBS.dim.rt&&!WBS.book.on))F.add('frame');
const tok=WBX.wbRndTok=(WBX.wbRndTok||0)+1;let txReq=null;
const on=k=>F.has(k);
const KW=[['rect',.34],['hex',.15],['circle',.15],['diamond',.2],['tri',.16]];
const mkSh=(k,z=100)=>({k,o:ch(.5)?'p':'f',s:(k=='rect'||k=='diamond')?wpick([[[1,1],.6],[[3,4],.15],[[4,3],.15],[[2,3],.1]]):[1,1],z});
const sh0=mkSh(wpick(KW));WBS.dim={...WBS.dim,k:sh0.k,o:sh0.o,s:sh0.s};setDim();
// --- colours: two-colour base, at most one accent ink (two with the "extra inks" move)
// Colours stay inside the palette (its 1st to 4th colours): 'light on dark' only swaps paper and ink, accents come from the other palette colours.
// "New palette" first picks a Wada combination for all four, as the Palette menu does; otherwise the project's own palette is kept.
// With the tray: a new palette goes into the first places of the tray (the colourway showing); the piece then uses those places only.
// Without one, every colour in the tray can be used. Paper, ink and accents are links to tray places, so later tray edits recolour the piece.
const newPal=FT.col&&sOn('col','new')&&PL.length?pick(PL):null,P0=JSON.parse(JSON.stringify(WBS.proj));let PC;
if(newPal){const ids=trayLoad([newPal[2],newPal[1],newPal[3],newPal[4]].filter(Boolean).map(n=>[CM[n],n]),P0);P0.bg='@'+ids[0];P0.ink='@'+ids[1];PC=ids.map(id=>'@'+id)}else PC=P0.ts.map(id=>'@'+id);
const colP=r=>isLink(r)?(P0.cw[P0.cwa|0].c[r.slice(1)]||'#888888'):col(r);
const sw=on('swap'),pInk=sw?P0.bg:P0.ink,pBg=sw?P0.ink:P0.bg;
const lum=h=>{const v=hx3(colP(h));return .2126*v[0]+.7152*v[1]+.0722*v[2]},bgL=lum(pBg),used=new Set([pInk]),acc=[];
const inkFor=()=>{if(noAcc)return null;if(acc.length>=(on('inks')?2:1))return pick(acc);let ok=PC.filter(n=>!used.has(n)&&n!=pBg&&Math.abs(lum(n)-bgL)>.28);if(!ok.length)ok=PC.filter(n=>!used.has(n)&&n!=pBg);if(!ok.length)return pInk;const n=pick(ok);used.add(n);acc.push(n);return n};
// --- motif pool: one main theme (your imports when you have a few), with dots as accents
const imp=Object.keys(cust).filter(x=>x.startsWith('i|')),dotsC=CATS.find(c=>c.n=='Dots'),themes=CATS.filter(c=>c.n!='Dots'&&c.k.length);
const FL=WBX.wbRZ&&WBX.wbRZ.folders?WBX.wbRZ.folders():null; // shape folders ticked in the Randomize panel (null: all of them)
const pool=FL?(FL.themes.length?pick(FL.themes):FL.dots):imp.length>=3&&ch(.6)?imp:pick(themes).k,dots=FL?(FL.dots||pool):dotsC?dotsC.k:pool,mains=[...pool].sort(()=>R()-.5).slice(0,ri(2,4));
// motif tweaks only with that move, and then one consistent look for the whole piece
const tw=on('motif')?{st:ch(.5)?+pick([.75,.8,1.25,1.35]).toFixed(2):0,ax:ch(.5)?'sx':'sy',w:ch(.6)?+pick([-1,-.6,.8,1.2,1.6]):0,ko:true}:null;
if(tw&&!tw.st&&!tw.w)tw.w=1.2;
const fx=q=>{if(tw){if(tw.st)q[tw.ax]=tw.st;if(tw.w)q.w=tw.w}return q};
const ko=(x,y,r)=>{const q=it(pick(dots),x,y,r);q.k=1;return q};
let symDone=false;
// --- one stamp's artwork, composed inside its own shape
const comp=(sh,accent)=>{useG(geom(sh));const k=SK,sq=Math.abs(SW-SH)<1,C0=[SW/2,k=='tri'?SH*2/3:SH/2],Rad=k=='tri'?SH/3:k=='diamond'?SW*SH/2/Math.hypot(SW,SH):k=='hex'?104:Math.min(SW,SH)/2;
const S=r=>+(r/48).toFixed(3),W=(x,y)=>wrapP(x,y);let items=[],sym={m:'off'};const m=pick(mains),[cx,cy]=C0;
const bold=k=='rect'?['mirror','repeat',...(sq?['star']:[])]:k=='tri'?['mirror']:['mirror',...(sq||k=='hex'?['star']:[])];
let kind;if(accent)kind='dots';else if(on('sym')&&!symDone){kind=pick(bold);symDone=true}else kind=pick(k=='tri'?['center']:k=='rect'?['center','rosette','quad','scatter']:['center','rosette','quad']);
if(kind=='center'){items.push(fx(it(m,cx,cy,S(Rad*rr(.62,.85)),pick([0,0,0,45,-30,30]),ch(.5)?1:-1)));
 if(k=='rect')items.push(it(pick(dots),...W(0,0),S(Rad*rr(.18,.3)),45));
 else if(k=='diamond')items.push(it(pick(dots),...W(SW/2,0),S(Rad*rr(.2,.32))));
 else if(k=='tri')[[SW/2,SH*.2],[SW*.22,SH*.86],[SW*.78,SH*.86]].forEach(([x,y])=>items.push(it(pick(dots),x,y,S(Rad*.16))));
 else if(ch(.6)){sym={m:'rot',n:pick([4,6,8])};items.push(it(pick(dots),cx,cy-Rad*.86,S(Rad*.1)))}
 if(tw)items.push(ko(cx,cy,S(Rad*rr(.1,.16))))}
else if(kind=='rosette'){const n=pick(k=='hex'?[6,6,3,12]:[4,5,6,8]);sym={m:ch(.5)?'rot':'kal',n};items.push(fx(it(m,cx,cy-Rad*rr(.45,.6),S(Rad*rr(.26,.36)),0)));items.push(it(pick(ch(.5)?dots:mains),cx,cy,S(Rad*rr(.2,.3)),0));if(tw)items.push(ko(cx,cy,S(Rad*rr(.07,.11))))}
else if(kind=='quad'){sym={m:'quad'};const d=Rad*rr(.38,.5);items.push(fx(it(m,cx-d,cy-d,S(Rad*rr(.3,.4)),-45)));items.push(it(pick(dots),cx,cy,S(Rad*rr(.16,.26))))}
else if(kind=='star'){sym={m:k=='hex'?'hex':'star'};items.push(fx(it(m,cx,cy-Rad*rr(.45,.58),S(Rad*rr(.2,.28)),0)));items.push(it(pick(dots),cx,cy,S(Rad*rr(.16,.24))))}
else if(kind=='mirror'){const ud=k!='tri'&&ch(.3);sym={m:ud?'ud':'lr'};const d=Rad*rr(.26,.36);
 items.push(fx(ud?it(m,cx,cy-d,S(Rad*rr(.4,.5)),0,1):it(m,cx-d,cy,S(Rad*rr(.4,.5)),0,1)));items.push(it(pick(dots),cx,cy+(k=='tri'?-Rad*.2:0),S(Rad*rr(.14,.2))))}
else if(kind=='repeat'){const md=pick(['rx','ry','grid']),n=md=='grid'?2:ri(2,3);sym={m:md,n};const cw=md=='ry'?SW:SW/n,chh=md=='rx'?SH:SH/n;
 items.push(fx(it(m,cw/2,chh/2,S(Math.min(cw,chh)/2*rr(.65,.8)),0,1)))}
else if(kind=='scatter'){const g=ri(2,3),cw=SW/g,c2=SH/g;for(let a=0;a<g;a++)for(let b=0;b<g;b++){if(ch(.15))continue;const mm=ch(.25)?pick(dots):pick(mains);items.push(fx(it(mm,...W((a+.5)*cw+rr(-.12,.12)*cw,(b+.5)*c2+rr(-.12,.12)*c2),S(Math.min(cw,c2)*(dots.includes(mm)?.16:.38)),ri(-4,4)*45,ch(.5)?1:-1)))}}
else{const g=ri(2,4),cw=SW/g,c2=SH/g,d=pick(dots);for(let a=0;a<g;a++)for(let b=0;b<g;b++)items.push(it(d,...W((a+.5)*cw,(b+.5)*c2),S(Math.min(cw,c2)*.22)))}
return{items,sym}};
// --- main layer: one shape (mixed shapes only with that move)
const n=on('mix')?wpick([[2,.6],[3,.4]]):wpick([[1,.2],[2,.5],[3,.3]]),tl=[];
const mixK=on('mix')?pick(KW.map(x=>x[0]).filter(x=>x!=sh0.k)):null;
for(let q=0;q<n;q++){const sh=q&&mixK?mkSh(mixK,ri(70,95)):{...sh0,s:[...sh0.s],z:100};
 const c=comp(sh,q>0&&!mixK&&ch(.3));tl.push({id:q+1,sh,items:c.items,sym:c.sym,et:+wpick([[0,.25],[rr(1,3),.45],[rr(3,6),.3]]).toFixed(1),er:+rr(0,6).toFixed(1),es:ri(0,999),neg:ch(.12),ink:q&&on('inks')&&ch(.6)?inkFor():null})}
if(mixK&&!tl.some((t,i)=>i&&t.sh.k==mixK))tl[1].sh=mkSh(mixK,85);
const g0=geom(sh0),L=mkL('Layer 1',tl.map(t=>t.id),'check',180);
L.ak={[g0.SK]:pick(arrOpts(g0))[0]};if(on('radial')&&!on('link'))L.ak={[g0.SK]:pick(GRAD)[0]};if(on('vary')){if(ch(.7))L.rsz=ri(15,45);if(ch(.6)||!L.rsz)L.rgp=ri(8,28);const am=gArrAll(g0).find(o=>o[0]==L.ak[g0.SK]);if(am&&(am[2]=='brick'||am[2]=='drop'))L.bo=pick([25,33.333,50,66.667,75])}L.lead=1;L.fit=!on('rot')&&ch(.35)?pick(['h','v']):'';L.size=Math.round(rr(110,250));L.gap=ch(.65)?0:ri(-6,22);
L.pst=ch(.5)?0:ri(1,6);L.pfl=ch(.65)?0:ri(1,3);L.rot=on('rot')?pick([45,45,30,-30,15,-15,60,90]):0;L.man=false;L.ov={};
const TXFK=TXF.map(f=>Object.keys(f[1]));
// --- extra printing passes: overprinted (multiply/darken) accent layers on their own offset grid
const needAcc=on('link')||on('shape'),LS=[L],nl=needAcc?wpick([[2,.75],[3,.25]]):wpick([[1,.45],[2,.4],[3,.15]]);
for(let li=1;li<nl;li++){const first=li==1,link=on('link')&&first,own=on('shape')&&first,pa=link?pick(['k','e','k','e','c']):null;
 const z=link?(pa=='c'?ri(55,80):ri(35,60)):100,sh2=own?mkSh(pick(KW.map(x=>x[0]).filter(x=>x!=sh0.k)),z):{...sh0,s:[...sh0.s],z};
 const c2=comp(sh2,link||own||ch(.55)),id=tl.length+1;tl.push({id,sh:sh2,items:c2.items,sym:c2.sym,et:ch(.6)?0:+rr(1,3).toFixed(1),er:+rr(0,5).toFixed(1),es:ri(0,999)});
 const L2=mkL('Layer '+(li+1),!own&&ch(.25)?[id,pick(tl.slice(0,-1)).id]:[id],'check',180);L2.lead=id;
 const g2=link?g0:geom(sh2);L2.ak={[g2.SK]:pick(arrOpts(g2))[0]};
 if(link){L2.gl=L.u;L2.pa=pa;L2.ox=0;L2.oy=0}else{L2.size=Math.round(rr(70,200));L2.gap=ch(.5)?0:ri(0,40);L2.ox=ri(0,99);L2.oy=ri(0,99);L2.fit=''}
L2.pst=ch(.6)?0:ri(1,5);L2.pfl=0;L2.man=false;L2.ov={};
 if(ch(.75))L2.ink=inkFor();const lt=lum(L2.ink||pInk)>bgL;
 if(on('blend')&&first){L2.bl=pick(lt?['screen','lighten']:['overlay','soft-light']);L2.op=ri(70,95)}
 else{if(ch(.6)&&!lt)L2.bl=pick(['multiply','multiply','darken']);if(ch(.4))L2.op=ri(55,90)}
 LS.push(L2)}
// motif tweaks also rework each stamp's block edge and sometimes carve one away (Invert)
if(tw)tl.forEach((t,i)=>{t.et=+rr(1.5,4.5).toFixed(1);t.er=+rr(2,7).toFixed(1);t.es=ri(0,999);if(i&&ch(.3))t.neg=true});
// lettering: the main stamp becomes a big initial, a word ringed round a motif, or a word band with ornaments
if(on('text')){const t0=tl[0];useG(geom(t0.sh));const k=SK,C0=[SW/2,k=='tri'?SH*2/3:SH/2],Rad=k=='tri'?SH/3:k=='diamond'?SW*SH/2/Math.hypot(SW,SH):k=='hex'?104:Math.min(SW,SH)/2,S=r=>+(r/48).toFixed(3),[cx,cy]=C0,items=[];
 const WORDS=['EX LIBRIS','ANNO DOMINI','FIAT LUX','LUX','PAX','AMOR','VERITAS','ORA ET LABORA','CARPE DIEM','SOL','LUNA','FLORA','FAUNA','ALPHA','OMEGA','VITA','SPES','FIDES','MMXXVI','HORTUS','STELLA','AQUA','TERRA','IGNIS'];
 const AL='ABCDEFGHIKLMNOPRSTVW',nm=($('pnm')&&$('pnm').value.trim())||'',ini=nm?nm.split(/\s+/).map(w=>w[0]).join('').toUpperCase().replace(/[^A-Z]/g,'').slice(0,3):'';
 const style=k=='tri'?'initial':wpick([['initial',.4],['ring',k=='rect'&&Math.abs(SW-SH)>1?0:.35],['band',.25]]);
 const fonts=WBX.wbTxFonts||['cinzel'],fl=style=='initial'?['frak','uncial','cinzeld','fell','alfa','abril','medieval','holtwood','pirata']:['cinzel','fellsc','garamond','uncial','medieval','alfa','holtwood','rye','pirata','bebas','frak'],f=pick(fl.filter(x=>fonts.includes(x)).concat(['cinzel']));
 const m=pick(mains),d=pick(dots);let o;
 if(style=='initial'){const txt=ini&&ch(.35)?ini.slice(0,ch(.5)?1:3):pick([...AL]);o={text:txt,f,cv:0,ls:txt.length>1?4:0,maxSz:txt.length>1?45:75};
  const nd=pick([4,6,8,12]),rr2=Rad*(k=='rect'?.92:.82);if(k=='rect'&&ch(.5))[[0,0]].forEach(()=>items.push(it(d,...wrapP(0,0),S(Rad*.16),45)));
  else for(let i=0;i<nd;i++){const a=-Math.PI/2+i*2*Math.PI/nd;items.push(it(d,cx+Math.cos(a)*rr2*(k=='tri'?.75:1),cy+Math.sin(a)*rr2*(k=='tri'?.75:1),S(Rad*.07)))}}
 else if(style=='ring'){const w=pick(WORDS);o={text:w+(w.length<9?'  ✦  '+w:'  ✦  '),f,cv:100,ls:pick([2,6,10]),maxSz:22,inner:1};o.text=o.text.replace(/✦/g,'·');const q=it(m,cx,cy,S(Rad*.5),0,1);q.cz=1;items.push(q)}
 else{const w=pick(WORDS);o={text:w,f,cv:ch(.4)?pick([18,25,-18]):0,ls:pick([0,4,10]),maxSz:30};
  if(ch(.5))[-1,1].forEach(sg=>{for(let i=-3;i<=3;i++)items.push(it(d,cx+i*Rad*.22,cy+sg*Rad*.5,S(Rad*.05)))});else{items.push(it(m,cx,cy-Rad*.55,S(Rad*.26),0,1));items.push(it(m,cx,cy+Rad*.55,S(Rad*.26),180,1))}}
 t0.items=items;t0.sym={m:'off'};t0.neg=false;txReq=o;setDim()}
// frame: a thin strip stamp walked round the edge (plus a corner stamp sometimes), printed last
const skipIds=new Set();
if(on('frame')){const R2=pick([6,8,8,12,12,16]),ssh={k:'rect',o:'p',s:[R2,1],z:100};useG(geom(ssh));const S=r=>+(r/48).toFixed(3),n=Math.max(2,Math.min(6,Math.round(R2/pick([1.5,2,2.5])))),cw=SW/n,hh=SH,d=pick(dots),m=pick(mains),items=[],fs=pick(['dots','motif','chain','rope'].filter(x=>sOn('frame','s_'+x)).concat(['dots','motif','chain','rope'].some(x=>sOn('frame','s_'+x))?[]:['dots']));
 if(fs=='dots')items.push(it(d,cw/2,hh/2,S(Math.min(cw,hh)*.38)));
 else if(fs=='motif'){items.push(it(m,cw/2,hh/2,S(Math.min(cw*.8,hh*1.1)*.5),90,1));items.push(it(d,0,hh/2,S(hh*.13)))}
 else if(fs=='chain'){items.push(it(d,cw/2,hh/2,S(hh*.34)));items.push(it(d,0,hh/2,S(hh*.18)));items.push(it(d,cw/4,hh/2,S(hh*.11)));items.push(it(d,cw*3/4,hh/2,S(hh*.11)))}
 else{items.push(it(m,cw/2,hh/2,S(Math.min(cw,hh)*.62),ch(.5)?45:-45,1))}
 const fid=tl.length+1;tl.push({id:fid,sh:ssh,items,sym:{m:'rx',n},et:ch(.25)?0:+rr(1.6,3).toFixed(1),er:+rr(0,2.5).toFixed(1),es:ri(0,999),tu:[]});skipIds.add(fid);
 const hasM=sOn('frame','cm'),hasO=sOn('frame','co'),corner=sOn('frame','cb')&&(!hasM&&!hasO?true:ch(.35));let cid=null;if(corner){cid=tl.length+1;const csh={k:'rect',o:'p',s:[1,1],z:100};useG(geom(csh));const ci=ch(.5)?[it(pick(dots),120,120,S(110))]:[it(m,120,70,S(44),0,1),it(pick(dots),120,120,S(26))];tl.push({id:cid,sh:csh,items:ci,sym:ci.length>1?{m:'rot',n:4}:{m:'off'},et:+rr(1,2).toFixed(1),er:+rr(0,2).toFixed(1),es:ri(0,999)});skipIds.add(cid)}
 const mkF=(nm,w,i,g=0)=>{const F2=mkL(nm,[fid],'check',180);F2.ak={};F2.fr={on:true,w,i,g,c:corner?'b':pick([...(hasM?['m','m']:[]),...(hasO?['o']:[]),...(!hasM&&!hasO?['m']:[])]),cs:cid,fc:(fs=='motif'||fs=='rope')&&ch(.35)?'i':'o',sc:WBS.book.on?pick(['front','front','both','each']):'front',clr:false,safe:true,bar:true};F2.pst=ch(.7)?0:ri(1,3);F2.pfl=0;F2.man=false;F2.ov={};return F2};
 const wk=R(),w0=+(wk<.25?rr(.6,1.5):wk<.7?rr(1.8,3.8):rr(4,7.5)).toFixed(1),i0=+(ch(.35)?0:ch(.6)?rr(.5,5):rr(5,11)).toFixed(1),g0=ch(.7)?0:ri(8,45),F1=mkF('Frame',w0,i0,g0);F1.fr.clr=ch(.55);if(ch(.4))F1.ink=inkFor();LS.push(F1);
 if(sOn('frame','rule')&&ch(.42)){const F2=mkF('Frame rule',+Math.max(.3,w0*rr(.2,.5)).toFixed(1),+Math.min(20,i0+w0+rr(.4,3)).toFixed(1));F2.fr.c='m';F2.fr.cs=null;F2.fr.sc=F1.fr.sc;F2.ink=F1.ink;LS.push(F2);
 if(ch(.2)){const F3=mkF('Frame rule 2',+Math.max(.3,w0*rr(.15,.35)).toFixed(1),+Math.min(20,Math.max(0,i0-rr(.5,2.5))).toFixed(1));F3.fr.c='m';F3.fr.cs=null;F3.fr.sc=F1.fr.sc;F3.ink=F1.ink;LS.push(F3)}}setDim()}
if(FT.pr){if(!sOn('pr','press'))LS.forEach(l=>{l.pst=0;l.pfl=0})}
L.st=tl.filter(t=>!skipIds.has(t.id)&&!LS.slice(1).some(l=>l.st[0]==t.id)).map(t=>t.id);if(!L.st.length)L.st=[tl[0].id];
// --- anything switched off stays as it is: keep the current stamps / frame and only swap in what was rolled
const isFr=l=>!!(l.fr&&l.fr.on),idMax=a=>Math.max(0,...a.map(t=>+t.id||0));
const remap=(ts,ls,base)=>{const m={};ts.forEach((t,i)=>m[t.id]=base+1+i);return[ts.map(t=>({...t,id:m[t.id]})),ls.map(l=>{const n={...l,st:(l.st||[]).map(x=>m[x]!=null?m[x]:x)};if(l.fr&&l.fr.cs!=null&&m[l.fr.cs]!=null)n.fr={...l.fr,cs:m[l.fr.cs]};if(l.lead!=null&&m[l.lead]!=null)n.lead=m[l.lead];return n})]};
const curFrL=WBS.layers.filter(isFr),curFrIds=new Set();curFrL.forEach(l=>{(l.st||[]).forEach(x=>curFrIds.add(x));if(l.fr.cs!=null)curFrIds.add(l.fr.cs)});
let mT=tl.filter(t=>!skipIds.has(t.id)),mL=LS.filter(l=>!isFr(l)),fT=tl.filter(t=>skipIds.has(t.id)),fL=LS.filter(isFr),usedGen=true;
const oldFz=new Set();if(FT.free||libFree){WBS.layers.forEach(l=>{if(l.rz=='free')(l.st||[]).forEach(x=>oldFz.add(x))});rzFz().forEach(x=>oldFz.add(x))}
if(!FT.stamps){const kT=WBS.tiles.filter(t=>!curFrIds.has(t.id)&&!oldFz.has(t.id)),kL=WBS.layers.filter(l=>!isFr(l)&&!((FT.free||libFree)&&l.rz=='free')).map(l=>oldFz.size?{...l,pl:(l.pl||[]).filter(q=>!(q.k!='pattern'&&q.t!=null&&oldFz.has(q.t)))}:l);if(kT.length&&kL.length){mT=kT;mL=kL;usedGen=false}}
if(!FT.frame){fT=WBS.tiles.filter(t=>curFrIds.has(t.id));fL=curFrL}
[fT,fL]=remap(fT,fL,idMax(mT));
const rzPool=m=>{const a=[];TXFK.forEach((ks,i)=>{if(sOn(m,'f'+i))a.push(...ks)});return a},rzMds=m=>TXMD.filter(x=>sOn(m,'m_'+x)),
rzMd=(m,w)=>{const a=rzMds(m);if(!a.length)return null;let t=0;a.forEach(x=>t+=w[x]);let r=Math.random()*t;for(const x of a){r-=w[x];if(r<=0)return x}return a[0]},
rzUse=(pool,md)=>{const t=pick(pool),L=txMake(t,{a:md=='wear'?ri(18,60):md=='stain'?ri(25,70):ri(35,85),sc:ri(60,170),az:pick([225,225,200,250,135,315]),auto:true});WBS.texLib.push(L);return{x:L.id,sd:txRid(),md}},
rzList=(m,w,n)=>{const pool=rzPool(m),u=[];if(!pool.length||!rzMds(m).length)return u;for(let i=0;i<n;i++){const md=rzMd(m,w);if(md)u.push(rzUse(pool,md))}return u},
WCV={relief:3,stain:1,wear:1.4},WST={wear:4,relief:1.5,stain:1},
rzCv=()=>RZ.keep.tx?JSON.parse(JSON.stringify(WBS.tex)).u:(sOn('tx','none')&&ch(.2)?[]:rzList('tx',WCV,ch(.3)?2:1));
const EO={pick,ri,rr,ch,jit:!!FT.jit,texOn:!!(FT.pr&&sOn('pr','lay')),gradeOn:!!FT.gr,tex:()=>rzList('pr',WST,1)};
if(usedGen)mL=rzMainEls(mL,mT,EO);if(FT.frame)fL=rzFrameEls(fL,fT,EO);
const cvU=rzCv();
const c={pg:{...WBS.pgrid},tiles:mT.concat(fT),layers:mL.concat(fL,mL.some(rzPic)?[]:WBS.layers.filter(rzPic)),proj:{...P0,ink:pInk,bg:pBg},dim:usedGen?WBS.dim:dim0,pr:{e:ri(0,6),q:ch(.6)?0:ri(1,5),t:'',a:0,sc:100,sd:1},tex:{u:cvU,v:87,...(RZ.keep.tx&&WBS.tex.off?{off:1}:{})}};
if(RZ.keep.pr)c.pr={...WBS.pr};
if(FT.pr&&!sOn('pr','edges')){c.pr.e=WBS.pr.e;c.pr.q=WBS.pr.q}
if(FT.pr&&sOn('pr','edges')&&AM('pr')<1){c.pr.e=Math.round(c.pr.e*AM('pr'));c.pr.q=Math.round(c.pr.q*AM('pr'))}
// textures: a Print effects roll gives each stamp (and layer, and text box) its own textures, each in its own mode
if(FT.pr&&sOn('pr','surf')){c.tiles.forEach(t=>{t.tu=sOn('pr','t_clean')&&ch(.25)?[]:rzList('pr',WST,ch(.3)?2:1);delete t.is})}
else{const src=(WBS.tiles.find(t=>t.tu&&t.tu.length)||{}).tu;c.tiles.forEach(t=>{if(t.is===undefined&&t.tu===undefined)t.tu=src?src.map(u=>({x:u.x,sd:txRid(),md:u.md})):[]})}
if(FT.pr&&sOn('pr','lay'))c.layers.forEach(l=>{if(!rzPic(l)&&!l.free&&ch(.3))l.tu=rzList('pr',WST,1)});
if(FT.pr&&sOn('pr','txt'))c.layers=c.layers.map(l=>{if(!(l.pl||[]).some(p=>p.tx))return l;const q=JSON.parse(JSON.stringify(l));q.pl.forEach(p=>{if(p.tx&&ch(.6))p.tu=rzList('pr',WST,1)});return q});
c.pr.t='';
// Colours: when the palette changes (a new palette, or paper and ink swapped), kept stamps and layers that carry their own accent ink move to the new palette too
if(FT.col&&(sOn('col','pal')||newPal)&&!noAcc){const keepN=new Set(PC),mapInk=n=>{if(!n||!okC(n)||isFixed(n)||keepN.has(n)||acc.includes(n))return n;if(!(n in inkMap))inkMap[n]=inkFor()||n;return inkMap[n]};
 c.tiles=c.tiles.map(t=>{const n=mapInk(t.ink);return n!==t.ink?{...t,ink:n}:t});c.layers=c.layers.map(l=>{const n=mapInk(l.ink);return n!==l.ink?{...l,ink:n}:l})}
// Canvas shape: roll a new outline (never the print cover, and never Custom, which needs a file)
if(FT.shape&&!WBS.book.on&&!WBS.dim.rt){const SGM={rect:'box',rrect:'box',circle:'round',oval:'round',arch:'arch',hex:'poly',tri:'poly',diamond:'poly',ngon:'poly'},SHL=[['rect',1.2],['rrect',1],['circle',.8],['oval',1],['arch',1],['hex',.8],['tri',.6],['diamond',.7],['ngon',.8]].filter(x=>sOn('shape',SGM[x[0]])),k=wpick(SHL.length?SHL:[['rect',1]]),nd=JSON.parse(JSON.stringify(c.dim));['cs','cr','n','co','g'].forEach(x=>delete nd[x]);
if(k!='rect')nd.cs=k;if(CASP.includes(k)||k=='rect')nd.c=ratioPick();
if(k=='rrect')nd.cr=ri(8,45);if(k=='ngon'){nd.n=ri(5,10);if(ch(.5))nd.co='f'}if(k=='hex'||k=='tri'){if(ch(.35))nd.co='f'}
c.dim=nd;try{kv.set('wb14_dim',JSON.stringify(nd))}catch(e){}}
// Canvas size on its own: a new ratio for a canvas that has one (round and regular shapes stay square)
if(FT.size&&!FT.shape&&!WBS.book.on&&!WBS.dim.rt){const kk=c.dim.cs||'rect';if(kk=='rect'||CASP.includes(kk)){const nd2=JSON.parse(JSON.stringify(c.dim));nd2.c=ratioPick();c.dim=nd2;try{kv.set('wb14_dim',JSON.stringify(nd2))}catch(e){}}}
WBS.cur=0;selOne(-1);if(typeof WBS.brush!='undefined')WBS.brush=null;const oldL=WBS.layers.slice(),oldT=WBS.tiles.slice(),oldG=WBX.wbGrade?WBX.wbGrade.get():null;WBS.selL=0;(WBX.wbApply||applyCore)(c);WBS.selL=0;
// colour grade: a gentle look most of the time (about a quarter stay neutral). Masks: up to two light local touches.
if(WBX.wbGrade){const g0=oldG||WBX.wbGrade.get(),B=(a,b)=>ri(a,b),z=v=>ch(.4)?0:v,isF=l=>!!(l.fr&&l.fr.on);let gl={};
 if(FT.gr){const lookOn=sOn('gr','look'),adjOn=sOn('gr','adj');if((lookOn||adjOn)&&!(sOn('gr','neutral')&&ch(.25))){
  // mild looks: each value is a [low, high] range, scaled down so a roll never lands on something harsh
  const LK=[{tp:[25,60],tn:[5,20],fd:[15,50],sat:[-35,-5],ct:[-15,10]},{tp:[-60,-22],ct:[12,45],sat:[-15,20]},{ct:[25,60],sat:[12,40],vib:[18,50],sh:[-25,0]},{ex:[-35,-10],ct:[15,45],sh:[-40,-10],sat:[-30,0]},{ex:[10,30],fd:[30,65],sat:[-55,-20],ct:[-30,0]},{tn:[-30,-10],tp:[-10,25],hi:[-40,-10],fd:[10,40]}];
  if(lookOn&&(!adjOn||ch(.35))){const lk=pick(LK);Object.keys(lk).forEach(k=>{gl[k]=Math.round(B(lk[k][0],lk[k][1])*.55)})}
  else gl={ex:z(B(-18,18)),ct:z(B(-24,40)),hi:z(B(-40,24)),sh:z(B(-24,40)),wh:z(B(-24,24)),bl:z(B(-30,24)),tp:z(B(-48,54)),tn:z(B(-18,18)),sat:z(B(-54,24)),vib:z(B(-24,36)),hue:R()<.12?B(-18,18):0,fd:R()<.38?B(10,48):0}}}
 else Object.keys(g0).forEach(k=>{if(k!='cov'&&k!='masks')gl[k]=g0[k]});
 let masks;
 const nfN=WBS.layers.filter(l=>!isF(l)),r3=v=>+v.toFixed(3);
 if(FT.masks){const inks=[...new Set([pInk,...WBS.layers.map(l=>l.ink),...WBS.tiles.map(t=>t.ink)].filter(x=>okC(x)))],nm=wpick([[0,.2],[1,.45],[2,.35]]),usedK=new Set(),nz=(a,b,f)=>ri(a,b)||f;
  const KINDS=[['vig',1.2],['fade',1],['ink',1.1],['layer',nfN.length>1?1:0],['colour',inks.length>1?.8:0],['tone',.9]].map(x=>[x[0],sOn('masks',x[0])?x[1]:0]);masks=[];
  const lin=(d,sp)=>{const e=pick(sp?['t','b','l','r','tl','br']:['t','b','l','r','tl','tr','bl','br']),D={t:[.5,0,0,1],b:[.5,1,0,-1],l:[0,.5,1,0],r:[1,.5,-1,0],tl:[0,0,.7,.7],tr:[1,0,-.7,.7],bl:[0,1,.7,-.7],br:[1,1,-.7,-.7]}[e];return{x1:D[0],y1:D[1],x2:r3(D[0]+D[2]*d),y2:r3(D[1]+D[3]*d)}};
  for(let q=0;q<nm;q++){const pool=KINDS.filter(x=>x[1]>0&&!usedK.has(x[0]));if(!pool.length)break;const k=wpick(pool);usedK.add(k);let m;
   if(k=='vig')m={t:'rad',name:'Vignette',sp:'c',cx:r3(rr(.42,.58)),cy:r3(rr(.42,.58)),rx:r3(rr(.48,.68)),ry:r3(rr(.48,.68)),fe:ri(55,90),inv:true,a:{ex:ri(-35,-12),sat:ch(.5)?ri(-30,-8):0,fd:ch(.3)?ri(10,30):0}};
   else if(k=='fade')m={t:'lin',name:'Edge fade',sp:'c',...lin(rr(.25,.55)),a:pick([{ex:ri(-30,-10)},{fd:ri(15,40),ex:ri(4,14)},{tp:ri(15,40)},{tp:ri(-40,-15)},{sat:ri(-45,-20)}])};
   else if(k=='ink')m=ch(.5)?{t:'rad',name:'Uneven inking',sp:'s',st:'',cx:r3(rr(.25,.75)),cy:r3(rr(.25,.75)),rx:r3(rr(.35,.7)),ry:r3(rr(.35,.7)),fe:ri(60,95),inv:ch(.5),a:{ex:pick([ri(-30,-12),ri(12,28)]),ct:ch(.4)?ri(-15,15):0}}
    :{t:'lin',name:'Ink fade',sp:'s',st:'',...lin(rr(.6,1),1),a:{ex:pick([ri(-30,-12),ri(12,28)]),fd:ch(.3)?ri(10,25):0}};
   else if(k=='layer'){const Lm=pick(nfN.length>1?nfN.slice(1):nfN);m={t:'lay',name:'Layer tint',lay:Lm.u,amt:ri(60,100),a:pick([{hue:nz(-25,25,12)},{sat:ri(-50,-20)},{tp:nz(-35,35,20),tn:ri(-15,15)},{ex:nz(-20,20,-12),ct:ri(5,20)}])}}
   else if(k=='colour')m={t:'col',name:'Colour shift',c:colP(pick(inks)).slice(0,7).toLowerCase(),rg:ri(15,35),sm:ri(40,70),a:pick([{hue:nz(-30,30,15)},{sat:nz(-40,30,15),vib:ri(0,25)},{ex:nz(-25,20,-10)}])};
   else{const sd=ch(.5);m={t:'lum',name:sd?'Shadow tone':'Highlight tone',lo:sd?0:ri(55,75),hi:sd?ri(25,45):100,sm:ri(20,45),a:{tp:nz(-35,35,18),tn:ri(-20,20),fd:sd&&ch(.4)?ri(5,20):0}}}
   masks.push(m)}}
 else{// keep the masks you have, pointed at the new piece: same layer / stamp position, same role colour
  const nfO=oldL.filter(l=>!isF(l)),frO=oldL.filter(isF),frN=WBS.layers.filter(isF),mU={},mT={},mC={};
  nfO.forEach((l,q)=>{if(nfN[q])mU[l.u]=nfN[q].u});frO.forEach((l,q)=>{if(frN[q])mU[l.u]=frN[q].u});
  oldT.forEach((t,q)=>{if(WBS.tiles[q])mT[String(t.id)]=String(WBS.tiles[q].id)});
  masks=((g0&&g0.masks)||[]).map(m=>{const q=JSON.parse(JSON.stringify(m));if(q.t=='lay'&&q.lay&&mU[q.lay])q.lay=mU[q.lay];if(q.st&&mT[q.st])q.st=mT[q.st];if(q.t=='col'&&q.c){for(const k in inkMap){if(col(k).toLowerCase()==String(q.c).toLowerCase()){q.c=colP(inkMap[k]).slice(0,7).toLowerCase();break}}}return q})}
 if(FT.gr&&AM('gr')<1)Object.keys(gl).forEach(k=>{if(typeof gl[k]=='number')gl[k]=Math.round(gl[k]*AM('gr'))});
 WBX.wbGrade.set({...gl,cov:g0.cov,masks})}
store();upd();
// Layout: pattern type, stamp size, spacing and scatter, offset, rotation and flips of the layers that repeat. Works on whatever layers the project has now.
if(FT.layout){const lsz=sOn('layout','size'),lsp=sOn('layout','space'),lrt=sOn('layout','rot'),lty=sOn('layout','type'),lof=sOn('layout','offset'),
 lrd=sOn('layout','radial')&&!(WBS.dim.rt&&!WBS.book.on),lvr=sOn('layout','vary'),
 EN=[...(lsp?[['scatter',1.2]]:[]),...(lrt?[['tilt',1.1],['spread',1],['flips',1]]:[]),...(lvr?[['sizevar',1],['gaps',.8]]:[])],E=new Set();
 // at most two energetic effects per roll (position scatter, turned grid, rotation spread, flips), so a piece stays coherent
 for(let q=wpick([[1,.55],[2,.45]]);q>0&&E.size<EN.length;q--)E.add(wpick(EN.filter(x=>!E.has(x[0]))));
 rzLayoutEls(WBS.layers,{type:lty,size:lsz,space:lsp,rot:lrt,offset:lof,vary:lvr,rad:lrd,scatter:E.has('scatter'),tilt:E.has('tilt'),spread:E.has('spread'),sizevar:E.has('sizevar'),gaps:E.has('gaps')},EO);
 useT(WBS.tiles[WBS.cur]);store();upd()}
// Layer opacity and blend: the first layer stays mostly solid; the ones above can turn see-through or blend
if(FT.look){const bl=['multiply','darken','screen','lighten','overlay','soft-light'].filter(x=>sOn('look','b_'+x));
 WBS.layers.forEach((l,i)=>{if(l.rz=='free')return;
  if(sOn('look','op')){if(ch(i?.7:.3))l.op=ri(i?45:75,i?92:96);else delete l.op}
  if(bl.length&&i>0){if(ch(.65))l.bl=pick(bl);else if(l.bl&&l.bl!='behind'&&l.bl!='cancel'&&l.bl!='replace')delete l.bl}});store();upd()}
// Print effects, Impression: uneven pressure and ink flooding on the layers you already had as well as the new ones
if(FT.pr&&sOn('pr','press')){WBS.layers.forEach(l=>{if(l.free||l.rz=='free')return;l.pst=ch(.5)?0:ri(1,6);l.pfl=l.fr&&l.fr.on?0:ch(.65)?0:ri(1,3)});rzPressEls(WBS.layers,EO);store();upd()}
// Stamp library, mixed into the pattern: one or two saved stamps join the repeating layer
if(libPat){const L0=WBS.layers.find(l=>l.free&&l.rz!='free'&&(l.pl||[]).some(p=>p.k=='pattern'&&p.lay!='frame'&&p.ox==null))||WBS.layers.find(l=>!l.free&&!(l.fr&&l.fr.on)&&!l.gl),PT0=L0&&(L0.pl||[]).find(p=>p.k=='pattern'),lead0=L0&&WBS.tiles.find(t=>t.id==(L0.lead!=null?L0.lead:(L0.st||[])[0]));
 if(L0){const n=ri(1,Math.min(2,window.SLC.length));let nx=Math.max(0,...WBS.tiles.map(t=>+t.id||0));for(let i=0;i<n;i++){const t=libTile(++nx);if(!t)continue;if(lead0&&t.sh&&lead0.sh&&t.sh.k!=lead0.sh.k)t.sh={...t.sh,z:85};WBS.tiles.push(t);L0.st=[...(L0.st||[]),t.id];if(PT0)PT0.src.push({k:'stamp',t:t.id,w:1});libDone=true}
  WBS.nid=1+Math.max(0,...WBS.tiles.map(t=>+t.id||0));store();upd()}}
// Free-placed stamps: a single feature, or a few stamps, set on the pattern grid and snapped to it, often with lettering. Added as their own Free place layer on top.
let fzReqs=[],fzDone=false,fzU=null;
if((FT.free||libFree)&&ch(.65)){
 const textOk=!!(FT.free&&sOn('free','ftext')&&FT.text&&WBX.wbTxPlace&&!on('text')),hs=!FT.free||sOn('free','single'),hf=!FT.free||sOn('free','few'),single=hs&&(!hf||ch(.45)),m2=ch(.7)?'c':'l',gn=m2=='c'?pick([3,5,7]):pick([4,6,8]);
 WBS.pgrid={...WBS.pgrid,n:gn,m:m2,sh:ch(.3)?pick(['hex','diamond']):'rect'};
 const cell=CW/gn,xs=[],ys=[];
 if(m2=='c'){for(let i=0;i<gn;i++)xs.push((i+.5)*cell);for(let j=0;(j+.5)*cell<CH;j++)ys.push((j+.5)*cell)}else{for(let i=1;i<gn;i++)xs.push(i*cell);for(let j=1;j*cell<CH-.5;j++)ys.push(j*cell)}
 let pts=[];if(WBS.pgrid.sh&&WBS.pgrid.sh!='rect'){const M=gModel(WBS.pgrid.sh,CW,CH,gn,false);pts=(m2=='c'?M.cents:M.verts).filter(q=>q[0]>=0&&q[0]<=CW&&q[1]>=0&&q[1]<=CH)}else xs.forEach(x=>ys.forEach(y=>pts.push([x,y])));
 let nidT=Math.max(0,...WBS.tiles.map(t=>+t.id||0));
 const FL=mkL('Free stamps',[],'check',180);FL.free=true;FL.rz='free';FL.pl=[];FL.fg={snap:true,ss:true};FL.ak={};FL.man=false;FL.ov={};FL.pst=0;FL.pfl=0;
 const boxes=[],made=[],fits=(x,y,w,h)=>{if(x-w/2<-.5||x+w/2>CW+.5||y-h/2<-.5||y+h/2>CH+.5)return false;if(![[x-w/2,y-h/2],[x+w/2,y-h/2],[x+w/2,y+h/2],[x-w/2,y+h/2]].every(q=>inShape(q[0],q[1])))return false;return!boxes.some(b=>Math.abs(b.x-x)<(b.w+w)/2*.95&&Math.abs(b.y-y)<(b.h+h)/2*.95)};
 const put=(tile,s0,cx,cy,rot,fl)=>{const G=geom(shOf(tile)),asp=G.SW>=G.SH?[1,G.SH/G.SW]:[G.SW/G.SH,1],order=pts.slice().sort((a,b)=>Math.hypot(a[0]-cx,a[1]-cy)-Math.hypot(b[0]-cx,b[1]-cy));
  for(let s=s0;s>=cell*.99;s-=cell){const w=s*asp[0],h=s*asp[1],q=order.find(z=>fits(z[0],z[1],rot?Math.max(w,h):w,rot?Math.max(w,h):h));if(q){const bb=rot?Math.max(w,h):0;boxes.push({x:q[0],y:q[1],w:rot?bb:w,h:rot?bb:h});FL.pl.push({u:fpU()+boxes.length,k:'stamp',t:tile.id,x:+q[0].toFixed(1),y:+q[1].toFixed(1),s:+s.toFixed(2),r:rot||0,f:fl||1});if(!made.includes(tile))made.push(tile);return true}}return false};
 const mkMotif=()=>{const sh=mkSh(pick(KW.map(x=>x[0])),100),cc=comp(sh,false);return{id:++nidT,sh,items:cc.items,sym:cc.sym,et:+wpick([[0,.3],[rr(1,3),.7]]).toFixed(1),er:+rr(0,4).toFixed(1),es:ri(0,999),neg:ch(.1),ink:ch(.45)?inkFor():null}};
 const WORDS2=['EX LIBRIS','ANNO DOMINI','FIAT LUX','LUX','PAX','AMOR','VERITAS','ORA ET LABORA','CARPE DIEM','SOL','LUNA','FLORA','FAUNA','ALPHA','OMEGA','VITA','SPES','FIDES','MMXXVI','HORTUS','STELLA','AQUA','TERRA','IGNIS'],AL2='ABCDEFGHIKLMNOPRSTVW';
 const mkText=()=>{const style=ch(.4)?'initial':'band',sh=style=='initial'?{k:pick(['rect','circle','hex','diamond']),o:'p',s:[1,1],z:100}:{k:'rect',o:'p',s:[pick([3,4,5]),1],z:100};useG(geom(sh));
  const k=SK,cx=SW/2,cy=SH/2,Rad=k=='tri'?SH/3:k=='diamond'?SW*SH/2/Math.hypot(SW,SH):k=='hex'?104:Math.min(SW,SH)/2,S=r=>+(r/48).toFixed(3),items=[],d=pick(dots),nm=($('pnm')&&$('pnm').value.trim())||'',ini=nm?nm.split(/\s+/).map(w=>w[0]).join('').toUpperCase().replace(/[^A-Z]/g,'').slice(0,3):'';
  const fonts=WBX.wbTxFonts||['cinzel'],fl=style=='initial'?['frak','uncial','cinzeld','fell','alfa','abril','medieval','holtwood','pirata']:['cinzel','fellsc','garamond','uncial','medieval','alfa','holtwood','rye','pirata','bebas','frak'],f=pick(fl.filter(x=>fonts.includes(x)).concat(['cinzel']));let o;
  if(style=='initial'){const txt=ini&&ch(.35)?ini.slice(0,ch(.5)?1:3):pick([...AL2]);o={text:txt,f,cv:0,ls:txt.length>1?4:0,maxSz:txt.length>1?45:75};const nd=pick([8,12,16]);for(let i=0;i<nd;i++){const a=-Math.PI/2+i*2*Math.PI/nd;items.push(it(d,cx+Math.cos(a)*Rad*.9,cy+Math.sin(a)*Rad*.9,S(Rad*.06)))}}
  else{o={text:pick(WORDS2),f,cv:0,ls:pick([0,4,10]),maxSz:60};items.push(it(d,SH*.5,cy,S(SH*.14)));items.push(it(d,SW-SH*.5,cy,S(SH*.14)))}
  return{tile:{id:++nidT,sh,items,sym:{m:'off'},et:+wpick([[0,.4],[rr(1,3),.6]]).toFixed(1),er:+rr(0,3).toFixed(1),es:ri(0,999),neg:false,ink:ch(.5)?inkFor():null,tu:[]},o,style}};
 const reqs=[],rotF=()=>pick([0,0,0,0,45,-45,90,-90,30,-30,15]);
 const addText=(cx,cy)=>{const t=mkText(),big=t.style=='band'?Math.max(2,Math.round(gn*rr(.55,.85))):Math.max(2,Math.round(gn*rr(.4,.6)));if(put(t.tile,Math.min(big*cell,Math.min(CW,CH)*(t.style=='band'?.95:.85)),cx,cy,0))reqs.push([t.tile,t.o]);else nidT--};
 const addMotif=(cx,cy,k)=>{const fromLib=libFree&&(!FT.free||!sOn('free','fmotif')||ch(.5));let t=fromLib?libTile(++nidT):null;const isLib=!!t;if(!t)t=mkMotif();if(!put(t,k*cell,cx,cy,rotF(),ch(.3)?-1:1))nidT--;else if(isLib)libDone=true};
 const want=textOk&&(!(FT.free&&sOn('free','fmotif'))||ch(.7))?'text':'motif';
 if(single){if(want=='text')addText(CW/2,CH/2);else addMotif(CW/2,CH/2,Math.max(2,Math.round(gn*rr(.4,.65))))}
 else{const n2=ri(2,4);let first=true;for(let i=0;i<n2;i++){const tx=rr(0,CW),ty=rr(0,CH);if(first&&want=='text'){addText(CW/2,CH*pick([.3,.5,.7]))}else addMotif(tx,ty,pick([1,1,2,2,3]));first=false}}
 const usedIds=new Set(FL.pl.map(q=>q.t)),keep=made.filter(t=>usedIds.has(t.id));
 if(keep.length){const fp=ch(.4)?0:ri(1,4);FL.pl.forEach(q=>{const fx=rzFx(EO,fp,0,null);if(fx.length)q.fx=fx});FL.st=keep.map(t=>t.id);keep.forEach(t=>WBS.tiles.push(t));WBS.layers.push(FL);RZFZ=new Set(FL.pl.map(q=>String(q.u)));fzU=RZFZ;
  // one element list (2.24.0): the stamps placed on their own were built on a layer of their own; fold it into the project's one list so the Elements list and the canvas reach them (as opening the file does)
  {const L0=WBS.layers[0],st=[...new Set(WBS.layers.flatMap(l=>l.st||[]))];WBS.layers=[oneLayer(flatEls(WBS.layers),st,L0.u)];WBS.selL=0}
  reqs.forEach(([t,o])=>{if(keep.includes(t))fzReqs.push([t,o])});fzDone=true;WBS.nid=1+Math.max(0,...WBS.tiles.map(t=>+t.id||0))}
 setDim();useT(WBS.tiles[WBS.cur]);store();upd()}
rzPut(OWN,fzU);
const txAll=(txReq?[[WBS.tiles[0],txReq]]:[]).concat(fzReqs);
if(txAll.length){pmsg('Randomized… setting the lettering.');WBX.wbTxBusy=(WBX.wbTxBusy||0)+1;WBX.wbRollHold=tok;(async()=>{try{for(const[t,o] of txAll){try{await WBX.wbTxPlace(t,o,tok)}catch(e){}}if(tok!==WBX.wbRndTok)return;store();upd();if(WBX.wbRollHold===tok)WBX.wbRollHold=0;if(fresh){if(WBX.wbResetHist)WBX.wbResetHist()}else if(WBX.wbCap){WBX.wbLabelNext={t:'Randomize '+(WBX.wbRollN=(WBX.wbRollN||0)+1),at:performance.now()};WBX.wbCap()}}finally{if(WBX.wbRollHold===tok)WBX.wbRollHold=0;WBX.wbTxBusy=Math.max(0,(WBX.wbTxBusy||1)-1)}})()}
else if(fresh){if(WBX.wbResetHist)WBX.wbResetHist()}else if(WBX.wbCap){WBX.wbLabelNext={t:'Randomize '+(WBX.wbRollN=(WBX.wbRollN||0)+1),at:performance.now()};WBX.wbCap()};

['rzdo'].forEach(id=>{const b=$(id);if(b){b.classList.remove('spin');void b.offsetWidth;b.classList.add('spin')}});pmsg(fresh?'Started a new project with a fresh random piece.':'Randomized.')}
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
