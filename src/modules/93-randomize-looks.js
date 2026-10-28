import {$,WBS,WBX} from './01-launch-and-version.js';
import {CH,CW,M,N,col,geom,useG,wrapP} from './04-canvas-and-stamp-outlines.js';
import {CATS} from './05-motif-data.js';
import {it} from './06-motif-library-folders.js';
import {fpU} from './24-free-place-layers.js';
import {teF} from './60-text-engine.js';
import {fxP,fxJ,fxT,patOf} from './71-randomize-elements.js';
import {basicKey} from './76-basic-shapes.js';
import {FQ} from './83-filter-effects.js';
import {TL_AR} from './92-pattern-tiling.js';

// ===== Randomize Looks (2.67.1, owner Oct 27 2026, docs/randomize-plan.md: "rewrite Randomize so it touches every option we have, all the elements, all the effects and
// settings; the random results should look appealing, like a real image"). A roll first picks a Look, an art direction that decides the whole picture at once: which
// elements it is made of, where they sit, which colour has which role, which fonts, how strong the finish is. Repeat is the roll Randomize always made (20-before-after-
// and-randomizer.js builds it); every other Look is built here, as plain elements, from small parts: a ground, a field, a focal point, type, a frame and a finish.
// A Look is {w: how often it comes up, need: switches it needs, build(E)}. E is the roll's environment (rzLookEnv in 20): the seeded helpers, the switches, the colour
// roles, the shape pool and the stamp-art maker. build returns {tiles, els (bottom to top), texts: [[element, options]], tex: canvas texture kind, grade: a look name}.

// --- colour: lightness and contrast of a colour (a tray link or a hex), as the eye sees it
const rzLin=v=>v<=.03928?v/12.92:Math.pow((v+.055)/1.055,2.4);
function rzLum(h){const s=String(col(h)||'#888888').replace('#','');const n=s.length>=6?s.slice(0,6):s.split('').map(x=>x+x).join('');const r=parseInt(n.slice(0,2),16)/255,g=parseInt(n.slice(2,4),16)/255,b=parseInt(n.slice(4,6),16)/255;return .2126*rzLin(r)+.7152*rzLin(g)+.0722*rzLin(b)}
const rzCon=(a,b)=>{const x=rzLum(a),y=rzLum(b);return(Math.max(x,y)+.05)/(Math.min(x,y)+.05)};
// the roles of the palette's colours: paper (the Background's colour, or the darkest for a dark picture), ink (the strongest contrast with the paper),
// accents (the rest, best contrast first), soft (the colour closest to the paper: quiet fields and gradient partners)
function rzRoles(PC,paper,dark){const all=[...new Set(PC.filter(Boolean))];let p=paper;if(dark){p=all.slice().sort((a,b)=>rzLum(a)-rzLum(b))[0]||paper}
 const rest=all.filter(c=>c!==p),byC=rest.slice().sort((a,b)=>rzCon(b,p)-rzCon(a,p)),ink=byC[0]||(dark?paper:p),acc=byC.slice(1),soft=rest.slice().sort((a,b)=>rzCon(a,p)-rzCon(b,p))[0]||ink;
 const on=bg=>rest.concat(dark?[paper]:[]).filter(c=>c!==bg).sort((a,b)=>rzCon(b,bg)-rzCon(a,bg))[0]||ink;
 // a colour for words over bg (one colour or the two ends of a gradient): the one asked for when it reads well (contrast 3 or more), else the best there is
 const lo=(c,bg)=>Math.min(...[].concat(bg).map(b=>rzCon(c,b))),txt=(bg,want)=>{if(want&&lo(want,bg)>=3)return want;return[ink,...acc,p,...rest].filter(Boolean).sort((a,b)=>lo(b,bg)-lo(a,bg))[0]||ink};
 return{paper:p,ink,acc,soft,all,dark:!!dark,on,txt}}

// --- words. Made-up titles that fit each Look, and sometimes the project's name (owner, Oct 27 2026: "Mix")
const RZW={
 poster:[['NORTHERN LIGHTS','A SEASON OF PRINTS'],['MIDNIGHT GARDEN','PRINTED BY HAND'],['THE WILD COAST','VOLUME ONE'],['SOLSTICE','JUNE 21'],['HARVEST MOON','AUTUMN EDITION'],['SALT & PINE','NO. 7'],['GOLDEN HOUR','A SMALL EXHIBITION'],['NIGHT BLOOM','LIMITED RUN'],['THE ORCHARD','SPRING FAIR'],['DEEP WATER','A FIELD GUIDE'],['FAR AFIELD','NEW WORK'],['WILDFLOWER','SEEDS & STORIES']],
 plate:[['EX LIBRIS','ANNO MMXXVI'],['EX LIBRIS','FROM THE SHELF OF'],['EX LIBRIS','LIBER MEUS'],['FINIS','THE LAST PAGE'],['EX LIBRIS','SEMPER LEGENS']],
 badge:[['HANDMADE','SMALL BATCH'],['GOOD THINGS TAKE TIME','EST. 2026'],['NATURE','CRAFT'],['PRINT SHOP','SINCE 2026'],['FIELD STUDY','NO. 12'],['QUALITY GOODS','MADE SLOWLY']],
 specimen:[['Flora borealis','PLATE IV'],['Fig. 12','SPECIMEN'],['Hortus siccus','PLATE IX'],['Studies of form','NO. 23'],['Sylva','PLATE II'],['Natura','FIG. 7']],
 modern:[['FORM','STUDY 04'],['SHIFT','SERIES B'],['GRID','NO. 9'],['ARC','EDITION 2'],['BOLD MOVES','2026'],['MODERN','VOL. 3'],['PLAY','SET 1']],
 sun:[['Good Times','SINCE 1972'],['Hello Summer','ALL DAY'],['Golden Days','EST. 1968'],['Sunshine','FRESH DAILY'],['Daydream','SIDE A'],['Paradise','WISH YOU WERE HERE']],
 quilt:[['Patchwork','NO. 3'],['Home','PIECED BY HAND'],['Comfort','WINTER SET']]};
const rzName=()=>{const v=($('pnm')&&$('pnm').value.trim())||'';return v&&!/^untitled/i.test(v)?v:''};

// --- fonts: a title and a second-line font for each Look (ids in the text engine; a font not there is skipped)
const RZF={poster:[['bebas','anton','oswald','leaguegothic','abril','playfair','dmserif','archivoblack','staatliches','alfa','yeseva','bodoni'],['montserrat','inter','worksans','josefin','raleway','lato','spacemono','dmsans']],
 plate:[['cinzel','fellsc','garamond','ebgaramond','baskerville','playfair','uncial','frakcook','cinzeld'],['ebgaramond','crimson','lora','fell','spectral']],
 badge:[['bebas','oswald','josefin','cinzel','alfa','robotoslab','montserrat','staatliches'],['abril','alfa','holtwood','rye','cinzeld','staatliches','archivoblack']],
 specimen:[['ebgaramond','crimson','baskerville','lora','spectral','alegreya'],['fellsc','cinzel','plexmono','courier']],
 modern:[['montserrat','poppins','archivoblack','dmsans','worksans','rubik','josefin','spacemono'],['inter','plexmono','dmsans','jetbrains']],
 sun:[['lobster','pacifico','yellowtail','kaushan','satisfy','shrikhand','dancing'],['bebas','oswald','montserrat','alfa']],
 quilt:[['amatic','patrickhand','architects','josefin','raleway'],['josefin','raleway','lato']]};
const rzFont=(E,a)=>{const ok=a.filter(f=>teF[f]);return ok.length?E.pick(ok):'cinzel'};
const rzHas=(f,v)=>!!(teF[f]&&teF[f].v&&teF[f].v[v]);

// --- shape themes (the motif library's folders) a Look prefers; the Randomize panel's folder choice wins when it is set
const RZT={poster:['Birds','Flowers','Sea life','Landscape, sky & weather','Mammals','Fire & light','Trees, leaves & plants'],plate:['Ornaments & patterns','Flowers','Birds','Trees, leaves & plants','Music, writing & arts','Greek & mythology'],
 badge:['Mammals','Birds','Landscape, sky & weather','Food & farming','Household & tools','Boats & water travel','Fire & light'],specimen:['Flowers','Trees, leaves & plants','Sea life','Birds','Reptiles, insects & amphibians'],
 modern:['Geometric shapes & symbols'],sun:['Fire & light','Flowers','Landscape, sky & weather','Sea life'],quilt:['Ornaments & patterns','Flowers','Geometric shapes & symbols']};
function rzThemes(E,look){if(E.FL&&E.FL.themes&&E.FL.themes.length)return E.pick(E.FL.themes);const want=RZT[look]||[],c=CATS.filter(x=>want.includes(x.n)&&x.k.length);return(c.length?E.pick(c):E.pick(CATS.filter(x=>x.n!='Basic shapes'&&x.k.length))).k}

// --- element makers (canvas units; the element list is bottom to top)
const rzF=v=>+(+v).toFixed(1);
const elStamp=(t,x,y,s,r)=>({u:fpU(),k:'stamp',t:t.id,x:rzF(x),y:rzF(y),s:rzF(s),r:r||0,f:1});
const elMotif=(m,x,y,s,o)=>({u:fpU(),k:'motif',m,x:rzF(x),y:rzF(y),s:rzF(s),r:0,f:1,...(o||{})});
const elSheet=(n,o)=>({u:fpU(),k:'sheet',n,...o});
// a box of text: the box is w by h canvas units at x, y (its middle); the letters fill it (2.63.0). Laid out after the roll (rzLay), so G and Lt come later.
function elText(E,text,f,x,y,w,h,ink,o){const S=Math.min(CW,CH)/100,tx={text,f,sz:30,ls:0,ws:0,lh:110,al:'c',tc:'',va:'t',wd:Math.max(4,Math.round(w/S)),ht:Math.max(3,Math.round(h/S)),cv:0,rot:0,ft:'f',...(o||{})};
 const q={u:fpU(),k:'text',tx,x:rzF(x),y:rzF(y),r:0,f:1,ink};return q}
// one filter effect with its defaults, then the given settings (a Look keeps them inside printable ranges)
function rzQfx(k,set,E){const d=FQ[k];if(!d)return null;const e={u:fpU(),k,on:true};(d.P||[]).forEach(([f,,,,v])=>e[f]=v);(d.S||[]).forEach(([f,,opts])=>{const xs=opts.map(x=>x[0]).filter(x=>x!='same');e[f]=xs[0]});(d.C||[]).forEach(([f,,v])=>e[f]=v);(d.W||[]).forEach(([f])=>e[f]='');if(d.seed)e.sd=E.ri(1,99999);return{...e,...(set||{})}}
const rzGrade=a=>({u:fpU(),k:'grade',on:true,ex:0,ct:0,hi:0,sh:0,wh:0,bl:0,tp:0,tn:0,sat:0,vib:0,hue:0,fd:0,...a});
const addFx=(q,...fx)=>{const a=fx.filter(Boolean);if(a.length)q.fx=(q.fx||[]).concat(a);return q};
// a gradient Sheet between two colours: linear (ga degrees) or radial (centre gx, gy, size gs)
function elGrad(E,a,b,rad){return elSheet('Gradient',rad?{fl:'grad',ink:a,ink2:b,gk:'rad',gx:E.ri(40,60),gy:E.ri(30,55),gs:E.ri(55,90),gm:E.ri(35,65)}:{fl:'grad',ink:a,ink2:b,ga:E.pick([90,90,270,60,120]),gm:E.ri(30,70)})}

// --- stamp artwork: one stamp's motifs, composed inside its own shape (the kinds the old roll used, plus an emblem: a big motif in a ring of dots)
function rzArt(E,sh,kind,mains,dots){const G=geom(sh);useG(G);const k=G.SK,W=G.SW,H=G.SH,cx=W/2,cy=k=='tri'?H*2/3:H/2,Rad=k=='tri'?H/3:k=='diamond'?W*H/2/Math.hypot(W,H):k=='hex'?104:Math.min(W,H)/2,S=r=>+(r/48).toFixed(3),m=E.pick(mains),d=E.pick(dots),items=[];let sym={m:'off'};
 if(kind=='emblem'){items.push(it(m,cx,cy,S(Rad*E.rr(.55,.7)),0,E.ch(.5)?1:-1));const nd=E.pick([12,16,24]),r2=Rad*.86;for(let i=0;i<nd;i++){const a=-Math.PI/2+i*2*Math.PI/nd;items.push(it(d,cx+Math.cos(a)*r2,cy+Math.sin(a)*r2,S(Rad*.045)))}}
 else if(kind=='center'){items.push(it(m,cx,cy,S(Rad*E.rr(.66,.86)),E.pick([0,0,0,-15,15]),E.ch(.5)?1:-1))}
 else if(kind=='rosette'){sym={m:E.ch(.5)?'rot':'kal',n:E.pick(k=='hex'?[6,6,12]:[4,6,8])};items.push(it(m,cx,cy-Rad*E.rr(.45,.6),S(Rad*E.rr(.26,.34)),0));items.push(it(d,cx,cy,S(Rad*E.rr(.18,.26)),0))}
 else if(kind=='quad'){sym={m:'quad'};const q=Rad*E.rr(.38,.48);items.push(it(m,cx-q,cy-q,S(Rad*E.rr(.3,.38)),-45));items.push(it(d,cx,cy,S(Rad*E.rr(.16,.24))))}
 else if(kind=='mirror'){sym={m:'lr'};const q=Rad*E.rr(.26,.34);items.push(it(m,cx-q,cy,S(Rad*E.rr(.4,.5)),0,1));items.push(it(d,cx,cy,S(Rad*E.rr(.12,.18))))}
 else{const g=E.ri(2,3),cw=W/g,c2=H/g;for(let a=0;a<g;a++)for(let b=0;b<g;b++)items.push(it(E.ch(.3)?d:m,...wrapP((a+.5)*cw,(b+.5)*c2),S(Math.min(cw,c2)*.36),0))}
 return{items,sym}}
// a stamp (a tile) for a Look: shape, artwork, block edges, and its ink
function rzTile(E,id,sh,kind,mains,dots,ink){const a=rzArt(E,sh,kind,mains,dots);return{id,sh,items:a.items,sym:a.sym,et:+E.wpick([[0,.3],[E.rr(1,2.5),.7]]).toFixed(1),er:+E.rr(0,3).toFixed(1),es:E.ri(0,999),neg:false,ink:ink||null,tu:[]}}
const rzSh=(k,s)=>({k,o:'p',s:s||[1,1],z:100});

// --- the Looks
// dark: the Look may sit on a dark ground (the darkest palette colour as the paper)
const RZL={};
// Poster: a ground (gradient or flat), a quiet field, one large focal stamp, a title with a small line under it, and a print finish
RZL.poster={dark:1,w:1.2,build(E){const R=E.roles,S=Math.min(CW,CH),m=S*E.rr(.07,.1),out={tiles:[],els:[],texts:[]},mains=rzThemes(E,'poster').slice().sort(()=>E.R()-.5).slice(0,3),dots=mains;
 const dark=R.dark,grad=E.ch(.65),gnd=grad?[R.paper,R.soft]:R.paper;if(grad)out.els.push(addFx(elGrad(E,R.paper,R.soft,E.ch(.35)),E.ch(.5)?rzQfx('halftone',{sz:E.ri(18,35),tone:E.ri(40,60),ang:E.pick([15,45,75]),spr:E.ri(25,50)},E):null));
 else if(dark)out.els.push(elSheet('Ground',{ink:R.paper}));
 // the quiet field: small shapes in the soft colour, see-through, on a Tiling or a Scatter
 if(E.ch(.7)){const bk=E.pick(['ellipse','star','dia','hex','rect']),mk=basicKey(bk);if(mk){const lay=E.pick(['tile','scatter']),p=patOf('Field',[],lay=='tile'?'tile':'scatter',E.ri(6,12),E.ri(8,16),E.ri(30,60),[],null);p.src=[{k:'motif',m:mk,w:1,ink:R.soft}];if(lay=='tile'){p.ts=E.pick(['square','hex','diamond']);p.ps=+E.rr(3,7).toFixed(1);p.sp=E.ri(80,220);p.ar=(TL_AR[p.ts]||[['grid']])[0][0]}p.op=E.ri(25,55);out.els.push(p)}}
 const titleTop=E.ch(.3),fs=S*E.rr(.5,.62),fy=titleTop?CH*.58:CH*.4,id=1,sk=E.pick(['circle','circle','hex','rect','diamond']),t=rzTile(E,id,rzSh(sk),E.pick(['emblem','center','center','rosette']),mains,dots,R.txt(gnd,R.ink));out.tiles.push(t);
 out.els.push(addFx(elStamp(t,CW/2,fy,fs,0),E.ch(.4)?rzQfx('misreg',{amt:E.ri(8,20),ang:E.ri(0,359),col:R.acc[0]||''},E):null,E.ch(.3)?fxP(E.ri(1,4),0):null));
 const [ti,sub]=E.pick(RZW.poster),nm=rzName(),title=nm&&E.ch(.3)?nm.toUpperCase().slice(0,22):ti,tf=rzFont(E,RZF.poster[0]),sf=rzFont(E,RZF.poster[1]),tw=CW-2*m,th=S*E.rr(.11,.16),bandY=titleTop?m+th/2:Math.min(CH-m-th*1.4,fy+fs/2+th*.9);
 const tink=R.txt(gnd,R.ink);out.texts.push(elText(E,title,tf,CW/2,bandY,tw,th,tink,{ls:/[a-z]/.test(title)?0:E.pick([2,4,8])}));
 if(E.ch(.85)){const sh2=th*E.rr(.3,.4),sy=titleTop?bandY+th/2+sh2*1.1:bandY+th/2+sh2*1.1;out.texts.push(elText(E,sub,sf,CW/2,Math.min(CH-m,sy),tw*E.rr(.45,.7),sh2,R.txt(gnd,R.acc[0]),{ls:E.pick([10,20,30])}))}
 out.tex=E.ch(.6)?'paper':'none';out.grade=E.pick(['warm','fade','punch','none']);out.top=E.ch(.5)?rzQfx('grain',{amt:E.ri(18,35),sz:E.ri(15,35),soft:E.ri(20,50)},E):null;return out}};
// Book plate: paper, a double frame rule, a centred emblem, EX LIBRIS above and a second line below
RZL.plate={w:.9,build(E){const R=E.roles,S=Math.min(CW,CH),m=S*E.rr(.06,.09),out={tiles:[],els:[],texts:[]},mains=rzThemes(E,'plate').slice().sort(()=>E.R()-.5).slice(0,3),rk=basicKey('rect'),ek=basicKey('ellipse');
 const fw=CW-2*m,fh=CH-2*m,lw=Math.max(1,S*.006);if(rk){out.els.push(elMotif(rk,CW/2,CH/2,Math.max(fw,fh),{wx:+(fw/Math.max(fw,fh)).toFixed(4),wy:+(fh/Math.max(fw,fh)).toFixed(4),fl:'none',sw:rzF(lw*2.2),sk:R.ink,nm:'Frame'}));const g=S*.025;out.els.push(elMotif(rk,CW/2,CH/2,Math.max(fw,fh)-2*g,{wx:+((fw-2*g)/(Math.max(fw,fh)-2*g)).toFixed(4),wy:+((fh-2*g)/(Math.max(fw,fh)-2*g)).toFixed(4),fl:'none',sw:rzF(lw),sk:R.ink,nm:'Rule'}))}
 const es=Math.min(fw,fh)*E.rr(.5,.62),ey=CH*.5,t=rzTile(E,1,rzSh(E.pick(['circle','circle','hex'])),E.pick(['emblem','rosette','center']),mains,mains,R.ink);out.tiles.push(t);out.els.push(addFx(elStamp(t,CW/2,ey,es,0),E.ch(.5)?fxP(E.ri(1,4),0):null));
 if(ek&&E.ch(.5))out.els.push(elMotif(ek,CW/2,ey,es*1.08,{fl:'none',sw:rzF(lw),sk:R.acc[0]||R.ink,nm:'Ring'}));
 const [ti,sub]=E.pick(RZW.plate),nm=rzName(),tf=rzFont(E,RZF.plate[0]),sf=rzFont(E,RZF.plate[1]),th=Math.min(S*.11,(ey-es/2-m)*.6),tw=fw*.8;
 out.texts.push(elText(E,ti,tf,CW/2,(m+ey-es/2)/2+m*.2,tw,th,R.txt(R.paper,R.ink),{ls:E.pick([4,8,12])}));
 const s2=nm&&E.ch(.6)?nm:sub,sth=th*.55,it2=rzHas(sf,'i');out.texts.push(elText(E,s2,sf,CW/2,(ey+es/2+CH-m)/2-m*.2,tw*.8,sth,R.txt(R.paper,R.acc[0]),{ls:2,...(it2?{sty:[[0,[...s2].length,100,0,0,'','i']]}:{})}));
 out.tex='paper';out.grade=E.pick(['fade','warm','none']);return out}};
// Badge: a filled round (or hex) seal in the ink colour, a ring rule and a stamp inside in the paper colour, a title above and a line below
RZL.badge={dark:1,w:.9,build(E){const R=E.roles,S=Math.min(CW,CH),out={tiles:[],els:[],texts:[]},mains=rzThemes(E,'badge').slice().sort(()=>E.R()-.5).slice(0,3),shp=E.pick(['ellipse','ellipse','hex']),bk=basicKey(shp),ek=basicKey('ellipse'),bs=S*E.rr(.56,.68),cy=CH*.47;
 if(R.dark)out.els.push(elSheet('Ground',{ink:R.paper}));
 if(bk)out.els.push(addFx(elMotif(bk,CW/2,cy,bs,{ink:R.ink,nm:'Seal'}),E.ch(.6)?rzQfx('halftone',{sz:E.ri(15,28),tone:E.ri(55,75),ang:45,spr:E.ri(20,45)},E):rzQfx('rough',{amt:E.ri(8,18),sz:E.ri(15,30)},E)));
 if(ek)out.els.push(elMotif(ek,CW/2,cy,bs*.84,{fl:'none',sw:rzF(Math.max(1,S*.006)),sk:R.txt(R.ink,R.paper),nm:'Ring'}));
 const t=rzTile(E,1,rzSh('circle'),'center',mains,mains,R.txt(R.ink,R.paper));out.tiles.push(t);out.els.push(elStamp(t,CW/2,cy,bs*.56,0));
 const [ti,sub]=E.pick(RZW.badge),tf=rzFont(E,RZF.badge[0]),sf=rzFont(E,RZF.badge[1]),tw=CW*.8,th=S*E.rr(.08,.11),top=cy-bs/2,bot=cy+bs/2,ink=R.txt(R.paper,R.ink);
 out.texts.push(elText(E,ti,tf,CW/2,Math.max(th*.8,top/2+th*.1),tw,th,ink,{ls:E.pick([4,8,12]),cv:E.pick([0,0,18,25])}));
 out.texts.push(elText(E,sub,sf,CW/2,Math.min(CH-th*.6,(bot+CH)/2),tw*.6,th*.7,R.txt(R.paper,R.acc[0]),{ls:E.pick([6,10])}));
 out.tex=E.ch(.5)?'paper':'none';out.grade=E.pick(['punch','fade','none']);return out}};
// Specimen: shapes from one folder set out like plates in a book, a fine frame rule, an italic caption
RZL.specimen={w:.9,build(E){const R=E.roles,S=Math.min(CW,CH),m=S*E.rr(.08,.11),out={tiles:[],els:[],texts:[]},pool=rzThemes(E,'specimen'),ms=pool.slice().sort(()=>E.R()-.5).slice(0,E.ri(3,6)),rk=basicKey('rect');
 const fw=CW-2*m,fh=CH-2*m;if(rk&&E.ch(.7))out.els.push(elMotif(rk,CW/2,CH/2,Math.max(fw,fh),{wx:+(fw/Math.max(fw,fh)).toFixed(4),wy:+(fh/Math.max(fw,fh)).toFixed(4),fl:'none',sw:rzF(Math.max(1,S*.004)),sk:R.ink,nm:'Frame'}));
 const ah=fh*.8,nc=CW>CH?E.ri(4,5):E.ri(3,4),p=patOf('Specimens',[],'tile',nc,nc,100,[],null);p.af=0;p.x=rzF(CW/2);p.y=rzF(m+ah/2+fh*.03);p.aw=rzF(fw*.9);p.ah=rzF(ah);p.ds='random';
 const sp=E.ri(35,60),ac=R.txt(R.paper,R.acc[0]);p.src=ms.map((mm,i)=>({k:'motif',m:mm,w:1,ink:i%3==2?ac:R.ink}));p.ts='square';p.ar='grid';p.sp=sp;p.ps=+(fw*.9/nc/(1+sp/100)/S*100).toFixed(1);
 out.els.push(addFx(p,E.ch(.5)?rzQfx('stipple',{sz:E.ri(10,22),den:E.ri(55,75),spr:E.ri(60,85)},E):null,E.ch(.4)?fxJ(E.ri(4,12),E.ri(5,20),E.ri(5,15)):null));
 const [ti,sub]=E.pick(RZW.specimen),tf=rzFont(E,RZF.specimen[0]),sf=rzFont(E,RZF.specimen[1]),th=S*.06,cy=CH-m-th*.9;
 out.texts.push(elText(E,ti,tf,CW/2,cy,fw*.6,th,R.txt(R.paper,R.ink),rzHas(tf,'i')?{sty:[[0,[...ti].length,100,0,0,'','i']]}:{}));out.texts.push(elText(E,sub,sf,CW/2,cy-th*1.05,fw*.25,th*.45,R.txt(R.paper,R.acc[0]),{ls:12}));
 out.tex='paper';out.grade=E.pick(['fade','warm']);return out}};
// Modern: a Tiling of basic shapes in the accent colours over part of the canvas, a bold title in the open part, misregistration
RZL.modern={dark:1,w:1,build(E){const R=E.roles,S=Math.min(CW,CH),m=S*E.rr(.06,.08),out={tiles:[],els:[],texts:[]},ks=['ellipse','rect','tri','dia','hex','star'].sort(()=>E.R()-.5).slice(0,E.ri(2,3)).map(basicKey).filter(Boolean),inks=[R.ink,...R.acc].filter(c=>rzCon(c,R.paper)>=1.4).slice(0,3);
 if(R.dark)out.els.push(elSheet('Ground',{ink:R.paper}));
 const ts=E.pick(['square','square','hex','tri','diamond']),ar=E.pick((TL_AR[ts]||[['grid']]).map(x=>x[0])),blockH=CH*E.rr(.58,.7),top=E.ch(.5),p=patOf('Shapes',[],'tile',4,4,100,[],null);p.ts=ts;p.ar=ar;p.ps=+E.rr(9,16).toFixed(1);p.sp=E.ri(0,30);p.ds='random';p.af=0;p.x=rzF(CW/2);p.y=rzF(top?blockH/2:CH-blockH/2);p.aw=rzF(CW);p.ah=rzF(blockH);
 p.src=ks.flatMap((k,i)=>inks.map((c,j)=>({k:'motif',m:k,w:j==0?2:1,ink:c})));out.els.push(addFx(p,E.ch(.55)?rzQfx('misreg',{amt:E.ri(8,22),ang:E.ri(0,359),rnd:E.ri(0,20),col:''},E):null));
 const [ti,sub]=E.pick(RZW.modern),tf=rzFont(E,RZF.modern[0]),sf=rzFont(E,RZF.modern[1]),open=CH-blockH,th=Math.min(open*.42,S*.2),tw=CW-2*m,ty=top?blockH+open*.42:open*.42,al=E.pick(['l','c']),tx=al=='l'?m+tw/2:CW/2;
 out.texts.push(elText(E,ti,tf,tx,ty,tw,th,R.txt(R.paper,R.ink),{al,ls:E.pick([0,2,6]),...(rzHas(tf,'b')?{sty:[[0,[...ti].length,100,0,0,'','b']]}:{})}));out.texts.push(elText(E,sub,sf,tx,ty+th*.5+open*.12,tw,th*.3,R.txt(R.paper,R.acc[0]),{al,ls:E.pick([8,14])}));
 out.tex=E.ch(.4)?'paper':'none';out.grade=E.pick(['punch','none','none']);out.top=E.ch(.35)?rzQfx('noise',{amt:E.ri(10,22),sz:E.ri(10,25)},E):null;return out}};
// Sunburst: a radial gradient, a Radial pattern of rays round the middle, a script title with a highlight band, a capitals line, ink bleed
RZL.sun={w:.9,build(E){const R=E.roles,S=Math.min(CW,CH),out={tiles:[],els:[],texts:[]},mains=rzThemes(E,'sun').slice().sort(()=>E.R()-.5).slice(0,2),cx=CW/2,cy=CH*E.rr(.42,.5);
 out.els.push(elGrad(E,R.soft,R.paper,true));
 const rk=basicKey(E.pick(['tri','dia','ellipse','star'])),p=patOf('Rays',[],'radial',E.pick([12,16,20,24]),E.ri(2,4),E.ri(60,90),[],null);p.x=rzF(cx);p.y=rzF(cy);if(rk){p.src=[{k:'motif',m:rk,w:1,ink:R.acc[0]||R.ink}];p.op=E.ri(55,85);out.els.push(addFx(p,rzQfx('bleed',{amt:E.ri(8,20),rag:E.ri(15,40),soft:E.ri(15,35)},E)))}
 const t=rzTile(E,1,rzSh('circle'),E.pick(['center','emblem']),mains,mains,R.ink);out.tiles.push(t);const fs=S*E.rr(.32,.42);out.els.push(addFx(elStamp(t,cx,cy,fs,0),E.ch(.5)?rzQfx('halftone',{sz:E.ri(15,30),tone:E.ri(50,70),ang:E.pick([15,45]),spr:E.ri(20,45)},E):null));
 const [ti,sub]=E.pick(RZW.sun),tf=rzFont(E,RZF.sun[0]),sf=rzFont(E,RZF.sun[1]),th=S*E.rr(.13,.17),ty=Math.min(CH-th*1.6,cy+fs/2+th*.75),hl=E.ch(.5)?(R.acc[1]||R.paper):'',gnd=[R.soft,R.paper],tc=R.txt(hl||gnd,R.ink);
 out.texts.push(elText(E,ti,tf,cx,ty,CW*.84,th,tc,{cv:E.pick([0,12,18]),...(hl?{sty:[[0,[...ti].length,100,0,0,'','',hl]]}:{})}));out.texts.push(elText(E,sub,sf,cx,ty+th*.95,CW*.5,th*.32,R.txt(gnd,R.acc[0]),{ls:16}));
 out.tex=E.ch(.6)?'paper':'none';out.grade='warm';return out}};
// Quilt: one rolled square stamp on a Tiling turned, pinwheel, mirrored or basket-woven, a frame rule and sometimes a small label
RZL.quilt={w:.8,build(E){const R=E.roles,S=Math.min(CW,CH),m=S*E.rr(.05,.08),out={tiles:[],els:[],texts:[]},mains=rzThemes(E,'quilt').slice().sort(()=>E.R()-.5).slice(0,3),rk=basicKey('rect');
 const a=rzTile(E,1,rzSh('rect'),E.pick(['quad','mirror','center']),mains,mains,R.ink),b=rzTile(E,2,rzSh('rect'),E.pick(['center','rosette']),mains,mains,R.txt(R.paper,R.acc[0]));out.tiles.push(a,b);
 const p=patOf('Quilt',[1,2],'tile',4,4,100,[],null);p.ts='square';p.ar=E.pick(['turn','pinwheel','mirror','basket','checker']);p.ps=+E.rr(14,22).toFixed(1);p.sp=E.ri(0,8);p.af=0;p.x=rzF(CW/2);p.y=rzF(CH/2);p.aw=rzF(CW-2*m);p.ah=rzF(CH-2*m);p.ds='cycle';
 out.els.push(addFx(p,E.ch(.5)?fxP(E.ri(1,4),E.ri(0,2)):null));
 if(rk){const fw=CW-m,fh=CH-m;out.els.push(elMotif(rk,CW/2,CH/2,Math.max(fw,fh),{wx:+(fw/Math.max(fw,fh)).toFixed(4),wy:+(fh/Math.max(fw,fh)).toFixed(4),fl:'none',sw:rzF(Math.max(1,m*.35)),sk:R.acc[1]||R.ink,nm:'Binding'}))}
 out.tex='paper';out.grade=E.pick(['fade','warm','none']);out.top=E.ch(.3)?rzQfx('dust',{amt:E.ri(10,25),sz:E.ri(15,30),scr:E.ri(0,20)},E):null;return out}};
const RZ_NAMES={repeat:'Repeat',poster:'Poster',plate:'Book plate',badge:'Badge',specimen:'Specimen',modern:'Modern',sun:'Sunburst',quilt:'Quilt'},RZ_LOOKS=Object.keys(RZ_NAMES);
// which Look a roll makes: the one chosen in the Randomize panel, or any by its weight (Repeat is the old roll)
function rzLookPick(o){if(o.want&&o.want!='any'&&(o.want=='repeat'||RZL[o.want]))return o.want;return o.wpick([['repeat',1.4],...Object.keys(RZL).map(k=>[k,RZL[k].w])])}
// lay out the texts a Look asked for (fonts load first), and put the letters on the elements
async function rzLay(texts){const out=[];for(const q of texts){try{const R=await WBX.wbTxLay(q.tx);if(!R)continue;const n=Math.max(R.bw,R.bh);Object.assign(q,{G:R.G,Lt:R.Lt,bw:R.bw,bh:R.bh,n,s:+n.toFixed(2)});out.push(q)}catch(e){}}return out}
export {RZL,RZ_LOOKS,RZ_NAMES,rzLookPick,rzLay,rzRoles,rzLum,rzCon,rzQfx,rzGrade};
