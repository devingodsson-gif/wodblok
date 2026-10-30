import {$,WBS,WBX} from './01-launch-and-version.js';
import {CH,CW,M,col,geom,useG,wrapP} from './04-canvas-and-stamp-outlines.js';
import {CATS} from './05-motif-data.js';
import {it} from './06-motif-library-folders.js';
import {fpU} from './24-free-place-layers.js';
import {fpWH} from './25-art-layers.js';
import {teF} from './60-text-engine.js';
import {fxP,fxJ,patOf} from './71-randomize-elements.js';
import {basicKey} from './76-basic-shapes.js';
import {FQ} from './83-filter-effects.js';
import {TL_AR} from './92-pattern-tiling.js';

// ===== Randomize Looks (2.67.1, owner Oct 27 2026, docs/randomize-plan.md: "rewrite Randomize so it touches every option we have, all the elements, all the effects and
// settings; the random results should look appealing, like a real image"). A roll first picks a Look, an art direction that decides the whole picture at once: which
// elements it is made of, where they sit, which colour has which role, which fonts, how strong the finish is. 2.74.1 (owner Oct 28 2026: "they should look more or less
// like finished art work ready to use, with all the features wodblok has to offer; a wide variety of possible outputs"): each Look has several layouts, built from shared
// parts (grounds, fields, focal points, type, frames, finishes), and Repeat is a Look too. 2.76.3: every roll is a Look (the old roll is gone); with none of the
// parts switched on, a roll reworks what is there (20-before-after-and-randomizer.js).
// A Look is {w: how often it comes up, dark: it may sit on a dark ground, build(E)}. E is the roll's environment (20): the seeded helpers, the switches, the colour roles
// and a texture maker. build returns {tiles, els (bottom to top), texts, tex: the canvas texture ('' none, or a texture kind), grade: a grade name, top: a finish effect}.

// --- colour. The roll's colours are links to tray places of the palette being rolled, which is not the project's yet, so they are read through the roll's own
// resolver (rzRoles sets it); lightness and contrast as the eye sees them
let rzHx=c=>col(c);
const rzHex=c=>{const s=String(rzHx(c)||'#888888').replace('#','');return'#'+(s.length>=6?s.slice(0,6):s.split('').map(x=>x+x).join('')).toLowerCase()};
const rzLin=v=>v<=.03928?v/12.92:Math.pow((v+.055)/1.055,2.4);
function rzLum(h){const n=rzHex(h),r=parseInt(n.slice(1,3),16)/255,g=parseInt(n.slice(3,5),16)/255,b=parseInt(n.slice(5,7),16)/255;return .2126*rzLin(r)+.7152*rzLin(g)+.0722*rzLin(b)}
const rzCon=(a,b)=>{const x=rzLum(a),y=rzLum(b);return(Math.max(x,y)+.05)/(Math.min(x,y)+.05)};
// a colour t of the way from a to b (a hex colour)
const rzMix=(a,b,t)=>{const x=rzHex(a),y=rzHex(b),p=(h,i)=>parseInt(h.slice(1+2*i,3+2*i),16);return'#'+[0,1,2].map(i=>Math.round(p(x,i)+(p(y,i)-p(x,i))*t).toString(16).padStart(2,'0')).join('')};
// the roles of the palette's colours: paper (the Background's colour, or the darkest for a dark picture), ink (the strongest contrast with the paper),
// accents (the rest, best contrast first), soft (the colour closest to the paper), deep and light (the darkest and lightest there are)
function rzRoles(PC,paper,dark,hx){rzHx=hx||(c=>col(c));const all=[...new Set(PC.filter(Boolean))];let p=paper;if(dark){p=all.slice().sort((a,b)=>rzLum(a)-rzLum(b))[0]||paper}
 const rest=all.filter(c=>c!==p&&rzHex(c)!==rzHex(p)),byC=rest.slice().sort((a,b)=>rzCon(b,p)-rzCon(a,p)),ink=byC[0]||(dark?'#f2eee4':'#1d1b19'),acc=byC.slice(1),soft=rest.slice().sort((a,b)=>rzCon(a,p)-rzCon(b,p))[0]||ink;
 const byL=[p,...rest].sort((a,b)=>rzLum(a)-rzLum(b)),deep=rzLum(byL[0])<.08?byL[0]:'#1d1b19',light=rzLum(byL[byL.length-1])>.6?byL[byL.length-1]:'#f6f2e8';
 // a colour for words or ink over bg (one colour, or several: the two ends of a gradient): the one asked for when it reads well (contrast 3 or more), else the best there is
 const lo=(c,bg)=>Math.min(...[].concat(bg).map(b=>rzCon(c,b))),txt=(bg,want,need)=>{const k=need||3;if(want&&lo(want,bg)>=k)return want;return[ink,...acc,p,...rest,deep,light].filter(Boolean).sort((a,b)=>lo(b,bg)-lo(a,bg))[0]||ink};
 // a colour that stands out from bg as a shape (contrast `need`), not the ones in `not`; accents first
 // (a small palette may have none left: then a tone of the paper towards its deep or light end)
 const blk=(bg,need,not)=>{const n=[].concat(not||[]).map(rzHex),c=[...acc,ink,...rest].filter(x=>!n.includes(rzHex(x))),ok=c.filter(x=>lo(x,bg)>=(need||1.6));if(ok.length)return ok[0];
  const t=rzMix(p,rzLum(p)>.3?deep:light,.38);return c.length&&lo(c.slice().sort((a,b)=>lo(b,bg)-lo(a,bg))[0],bg)>=lo(t,bg)?c.sort((a,b)=>lo(b,bg)-lo(a,bg))[0]:t};
 // quiet: a tone of the paper (t of the way to the ink, or to the deep or light colour)
 const tone=(t,to)=>rzMix(p,to||ink,t);
 return{paper:p,ink,acc,soft,all,deep,light,dark:!!dark,txt,blk,tone,lo}}

// --- words. Made-up titles that fit each Look, and sometimes the project's name (owner, Oct 27 2026: "Mix")
const RZW={
 poster:[['NORTHERN LIGHTS','A SEASON OF PRINTS'],['MIDNIGHT GARDEN','PRINTED BY HAND'],['THE WILD COAST','VOLUME ONE'],['SOLSTICE','JUNE 21'],['HARVEST MOON','AUTUMN EDITION'],['SALT & PINE','NO. 7'],['GOLDEN HOUR','A SMALL EXHIBITION'],['NIGHT BLOOM','LIMITED RUN'],['THE ORCHARD','SPRING FAIR'],['DEEP WATER','A FIELD GUIDE'],['FAR AFIELD','NEW WORK'],['WILDFLOWER','SEEDS & STORIES'],
  ['LAST LIGHT','AN EVENING OF MUSIC'],['TIDE & TIMBER','COASTAL WORKS'],['HIGH COUNTRY','TRAILS & SUMMITS'],['THE NIGHT MARKET','EVERY FRIDAY'],['QUIET HOURS','PRINTS 2026'],['OPEN STUDIO','ALL WELCOME'],['EVERGREEN','WINTER SALE'],['MOONRISE','A FILM SERIES'],['THE ISLANDS','SUMMER ROUTES'],['SLOW BLOOM','FLOWER SHOW']],
 plate:[['EX LIBRIS','ANNO MMXXVI'],['EX LIBRIS','FROM THE SHELF OF'],['EX LIBRIS','LIBER MEUS'],['FINIS','THE LAST PAGE'],['EX LIBRIS','SEMPER LEGENS'],['EX LIBRIS','THIS BOOK BELONGS TO'],['EX LIBRIS','LUX ET VERITAS'],['EX LIBRIS','FESTINA LENTE']],
 badge:[['HANDMADE','SMALL BATCH'],['GOOD THINGS TAKE TIME','EST. 2026'],['NATURE','CRAFT'],['PRINT SHOP','SINCE 2026'],['FIELD STUDY','NO. 12'],['QUALITY GOODS','MADE SLOWLY'],['TRAIL CLUB','MEMBER'],['HONEY CO.','RAW & PURE'],['NORTH BAKERY','FRESH DAILY'],['ROAST HOUSE','COFFEE'],['CAMP SUPPLY','OUTFITTERS'],['GARDEN CLUB','GROW WILD']],
 specimen:[['Flora borealis','PLATE IV'],['Fig. 12','SPECIMEN'],['Hortus siccus','PLATE IX'],['Studies of form','NO. 23'],['Sylva','PLATE II'],['Natura','FIG. 7'],['Index naturae','PLATE XI'],['Cabinet of curiosities','NO. 4'],['A natural history','PLATE VI']],
 modern:[['FORM','STUDY 04'],['SHIFT','SERIES B'],['GRID','NO. 9'],['ARC','EDITION 2'],['BOLD MOVES','2026'],['MODERN','VOL. 3'],['PLAY','SET 1'],['RHYTHM','FESTIVAL OF SOUND'],['BALANCE','EXHIBITION'],['MOTION','PART TWO'],['SIGNAL','ISSUE 08'],['ORBIT','LECTURE SERIES']],
 sun:[['Good Times','SINCE 1972'],['Hello Summer','ALL DAY'],['Golden Days','EST. 1968'],['Sunshine','FRESH DAILY'],['Daydream','SIDE A'],['Paradise','WISH YOU WERE HERE'],['Endless Summer','SURF & SUN'],['Sweet Life','EST. 1975'],['Groovy','GOOD VIBES ONLY'],['Wanderlust','OPEN ROAD']],
 quilt:[['Patchwork','NO. 3'],['Home','PIECED BY HAND'],['Comfort','WINTER SET'],['Heirloom','STITCH BY STITCH'],['Hearth','KEEP WARM']],
 textile:[['Linen Stripe','100% COTTON'],['Mill Run','WOVEN IN SMALL BATCHES'],['Workshop Cloth','PRINTED BY HAND'],['Field Check','SPRING SEASON'],['Harbour','DECK CANVAS'],['Weaver','NO. 214']],
 halftone:[['SIGNAL','DOT BY DOT'],['AFTERGLOW','A STUDY IN TONE'],['STATIC','ISSUE 12'],['FADE OUT','SIDE B'],['SCREEN','PRINT SERIES'],['HEAT','SUMMER 2026'],['DRIFT','A SHORT FILM']],
 letters:[['BLOOM','SPRING EDITION'],['WILD','NATURE CLUB'],['PRINT','MADE BY HAND'],['HELLO','WELCOME'],['GROW','GARDEN FAIR'],['OCEAN','COASTAL SERIES'],['JOY','SEASON\'S GREETINGS'],['MAKE','STUDIO DAYS'],['CRAFT','WORKSHOP'],['FOLK','MUSIC & DANCE']],
 confetti:[['Celebrate','YOU ARE INVITED'],['Hooray','PARTY TIME'],['Thank You','WITH LOVE'],['Happy Days','SATURDAY'],['Cheers','HERE\'S TO YOU'],['Surprise','SHHH'],['Congrats','WELL DONE']]};
const rzName=()=>{const v=($('pnm')&&$('pnm').value.trim())||'';return v&&!/^untitled/i.test(v)?v:''};

// --- fonts: a title and a second-line font for each Look (ids in the text engine; a font not there is skipped)
const RZF={poster:[['bebas','anton','oswald','leaguegothic','abril','playfair','dmserif','archivoblack','staatliches','alfa','yeseva','bodoni','limelight','bowlby','ultra','righteous'],['montserrat','inter','worksans','josefin','raleway','lato','spacemono','dmsans','karla','plexmono']],
 plate:[['cinzel','fellsc','garamond','ebgaramond','baskerville','playfair','uncial','frakcook','cinzeld','almendra','pirata'],['ebgaramond','crimson','lora','fell','spectral','alegreya']],
 badge:[['bebas','oswald','josefin','cinzel','alfa','robotoslab','montserrat','staatliches','arvo','zillaslab','bitter'],['abril','alfa','holtwood','rye','cinzeld','staatliches','archivoblack','ultra','vastshadow']],
 specimen:[['ebgaramond','crimson','baskerville','lora','spectral','alegreya','ptserif'],['fellsc','cinzel','plexmono','courier','elite']],
 modern:[['montserrat','poppins','archivoblack','dmsans','worksans','rubik','josefin','spacemono','inter','bungee','chango'],['inter','plexmono','dmsans','jetbrains','spacemono','karla']],
 sun:[['lobster','pacifico','yellowtail','kaushan','satisfy','shrikhand','dancing','titanone','luckiestguy','chango'],['bebas','oswald','montserrat','alfa','righteous','fredoka']],
 quilt:[['amatic','patrickhand','architects','josefin','raleway','caveat','shadows','gloria'],['josefin','raleway','lato','nunito']],
 textile:[['josefin','raleway','cinzel','playfair','amatic','montserrat'],['josefin','lato','plexmono','courier']],
 halftone:[['bebas','anton','archivoblack','oswald','bungee','staatliches','leaguegothic','chango'],['spacemono','plexmono','inter','montserrat','jetbrains']],
 letters:[['archivoblack','anton','bebas','alfa','ultra','bowlby','chango','bungee','abril','titanone','luckiestguy','staatliches','leaguegothic','shrikhand'],['montserrat','inter','josefin','raleway','spacemono','dmsans']],
 confetti:[['pacifico','lobster','shrikhand','fredoka','titanone','luckiestguy','abril','yellowtail'],['josefin','montserrat','raleway','fredoka','nunito']]};
const rzFont=(E,a)=>{const ok=a.filter(f=>teF[f]);return ok.length?E.pick(ok):'cinzel'};
const rzHas=(f,v)=>!!(teF[f]&&teF[f].v&&teF[f].v[v]);
const rzAll=t=>[...t].length;
// words that run all the way round a circle: repeated until they are long enough that the letters, fitted to the circle, stay about h high (an em is about .62 h across)
const rzRound=(t,circ,h)=>{let s=t;const want=circ/(h*.62);while(rzAll(s)<want*.8&&rzAll(s)<120)s+=t;return s};

// --- shape themes (the motif library's folders) a Look prefers; the Randomize panel's folder choice wins when it is set
const RZT={poster:['Birds','Flowers','Sea life','Landscape, sky & weather','Mammals','Fire & light','Trees, leaves & plants','Boats & water travel','Buildings & places'],plate:['Ornaments & patterns','Flowers','Birds','Trees, leaves & plants','Music, writing & arts','Greek & mythology','Mammals'],
 badge:['Mammals','Birds','Landscape, sky & weather','Food & farming','Household & tools','Boats & water travel','Fire & light','Trees, leaves & plants'],specimen:['Flowers','Trees, leaves & plants','Sea life','Birds','Reptiles, insects & amphibians','Mammals'],
 modern:['Geometric shapes & symbols'],sun:['Fire & light','Flowers','Landscape, sky & weather','Sea life','Trees, leaves & plants','Boats & water travel'],quilt:['Ornaments & patterns','Flowers','Geometric shapes & symbols','Trees, leaves & plants'],
 repeat:['Flowers','Ornaments & patterns','Trees, leaves & plants','Birds','Sea life','Fire & light','Food & farming','Geometric shapes & symbols','Reptiles, insects & amphibians','Ancient Egypt','Mammals'],
 textile:['Flowers','Trees, leaves & plants','Ornaments & patterns','Geometric shapes & symbols','Birds','Food & farming'],tilework:['Ornaments & patterns','Flowers','Geometric shapes & symbols','Trees, leaves & plants','Greek & mythology','Ancient Egypt'],
 halftone:['Geometric shapes & symbols','Flowers','Fire & light'],mandala:['Ornaments & patterns','Flowers','Trees, leaves & plants','Fire & light','Geometric shapes & symbols','Birds'],letters:['Flowers','Geometric shapes & symbols','Trees, leaves & plants','Ornaments & patterns','Sea life'],
 confetti:['Geometric shapes & symbols','Flowers','Food & farming','Fire & light'],
 orn:['Ornaments & patterns'],leaf:['Trees, leaves & plants','Flowers'],dot:['Geometric shapes & symbols','Ornaments & patterns']};
function rzThemes(E,look){if(E.FL&&E.FL.themes&&E.FL.themes.length)return E.pick(E.FL.themes);const want=RZT[look]||[],c=CATS.filter(x=>want.includes(x.n)&&x.k.length);return(c.length?E.pick(c):E.pick(CATS.filter(x=>x.n!='Basic shapes'&&x.k.length))).k}
// a few shapes from a Look's themes, shuffled
const rzPool=(E,look,n)=>E.shuf(rzThemes(E,look)).slice(0,n||3);
// small ornaments for borders and the dots round an emblem: a dot, a star or a small flourish
const rzSmall=E=>E.pick(['ellipse','ellipse','star','dia','heart'].map(basicKey).filter(Boolean));
// how heavy a motif's drawing is (characters of markup): a motif is drawn in full at every place it is put, so many small pieces use light ones or a stamp
const RZW8=new Map(),rzWt=k=>{let v=RZW8.get(k);if(v==null){try{v=String(M[+String(k).slice(1)]('#000','#fff')).length}catch(e){v=1e6}RZW8.set(k,v)}return v};
// a stamp that holds one motif in the middle, with no block edge: a repeated detailed motif prints once and is placed by reference
function rzSolo(E,out,m,ink,o){o=o||{};const id=out.tiles.length+1,sh=rzSh(o.k||'rect');const G=geom(sh);useG(G);const W=G.SW,H=G.SH,R=Math.min(W,H)/2;
 out.tiles.push({id,sh,items:[it(m,W/2,H/2,+(R*(o.z||.92)/48).toFixed(3),o.r||0,o.f||1)],sym:{m:'off'},et:0,er:0,es:E.ri(0,999),neg:false,ink:ink||null,tu:[]});return{k:'stamp',t:id,w:1}}

// --- element makers (canvas units; the element list is bottom to top)
const rzF=v=>+(+v).toFixed(1);
const elStamp=(t,x,y,s,r)=>({u:fpU(),k:'stamp',t:t.id,x:rzF(x),y:rzF(y),s:rzF(s),r:r||0,f:1});
const elMotif=(m,x,y,s,o)=>({u:fpU(),k:'motif',m,x:rzF(x),y:rzF(y),s:rzF(s),r:0,f:1,...(o||{})});
const elSheet=(n,o)=>({u:fpU(),k:'sheet',n,...o});
// a basic shape w by h at x, y (its middle): a box, a disc, a rule
function elBox(k,x,y,w,h,o){const m=basicKey(k),s=Math.max(w,h,.1);return m?elMotif(m,x,y,s,{wx:+(w/s).toFixed(4),wy:+(h/s).toFixed(4),...(o||{})}):null}
const elRule=(x,y,w,t,ink,nm)=>elBox('rect',x,y,w,Math.max(.6,t),{ink,nm:nm||'Rule'});
// an outline rectangle (no fill) inset m from the edges
const elFrame=(m,sw,ink,nm,o)=>elBox('rect',CW/2,CH/2,CW-2*m,CH-2*m,{fl:'none',sw:rzF(sw),sk:ink,nm:nm||'Frame',...(o||{})});
// an invisible path for words or a pattern to follow (Map to shape): a circle of diameter d, or a w by h box
const elPath=(k,x,y,w,h)=>elBox(k,x,y,w,h,{fl:'none',nm:'Path'});
// a box of text: w by h canvas units at x, y (its middle); the letters fill it (2.63.0). Laid out after the roll (rzLay), so G and Lt come later.
function elText(E,text,f,x,y,w,h,ink,o){const S=Math.min(CW,CH)/100,tx={text,f,sz:30,ls:0,ws:0,lh:110,al:'c',tc:'',va:'t',wd:Math.max(4,Math.round(w/S)),ht:Math.max(3,Math.round(h/S)),cv:0,rot:0,ft:'f',...(o||{})};
 return{u:fpU(),k:'text',tx,x:rzF(x),y:rzF(y),r:0,f:1,ink}}
// a whole text run styled (bold, italic, a highlight colour): a styled-letters run over every letter
const rzSty=(t,fl,hl)=>({sty:[[0,rzAll(t),100,0,0,'',fl||'',hl||'']]});
// one filter effect with its defaults, then the given settings (a Look keeps them inside printable ranges)
function rzQfx(k,set,E){const d=FQ[k];if(!d)return null;const e={u:fpU(),k,on:true};(d.P||[]).forEach(([f,,,,v])=>e[f]=v);(d.S||[]).forEach(([f,,opts])=>{const xs=opts.map(x=>x[0]).filter(x=>x!='same');e[f]=xs[0]});(d.C||[]).forEach(([f,,v])=>e[f]=v);(d.W||[]).forEach(([f])=>e[f]='');if(d.seed)e.sd=E.ri(1,99999);return{...e,...(set||{})}}
const rzGrade=a=>({u:fpU(),k:'grade',on:true,ex:0,ct:0,hi:0,sh:0,wh:0,bl:0,tp:0,tn:0,sat:0,vib:0,hue:0,fd:0,...a});
const addFx=(q,...fx)=>{if(!q)return q;const a=fx.filter(Boolean);if(a.length)q.fx=(q.fx||[]).concat(a);return q};
// a gradient Sheet between two colours: linear (ga degrees) or radial (centre gx, gy, size gs)
function elGrad(E,a,b,rad,o){return elSheet('Gradient',rad?{fl:'grad',ink:a,ink2:b,gk:'rad',gx:E.ri(42,58),gy:E.ri(30,50),gs:E.ri(60,95),gm:E.ri(40,60),...(o||{})}:{fl:'grad',ink:a,ink2:b,ga:E.pick([90,90,90,270,60,120]),gm:E.ri(35,65),...(o||{})})}
// the print effects a focal piece may get, one at most (a Look keeps its finish to one texture, one print and one noise effect)
function rzInkFx(E,R,how){const k=E.pick(how||['none','none','halftone','misreg','rough','bleed','stipple','lines']);
 return k=='halftone'?rzQfx('halftone',{sz:E.ri(14,26),tone:E.ri(50,70),ang:E.pick([15,45,75]),spr:E.ri(20,45)},E):k=='misreg'?rzQfx('misreg',{amt:E.ri(6,16),ang:E.ri(0,359),col:R.acc[0]||''},E):k=='rough'?rzQfx('rough',{amt:E.ri(6,14),sz:E.ri(15,30)},E)
  :k=='bleed'?rzQfx('bleed',{amt:E.ri(6,14),rag:E.ri(10,30),soft:E.ri(10,25)},E):k=='stipple'?rzQfx('stipple',{sz:E.ri(10,20),den:E.ri(60,78),spr:E.ri(60,85)},E):k=='lines'?rzQfx('lines',{},E):null}
// a worn-ink texture on a printed piece (Wear on an inked element is allowed: only the canvas and the Background stay solid)
const rzWear=(E,a)=>E.tex?{u:fpU(),k:'texture',on:true,x:E.tex(E.pick(['dry','riso','cotton','cold','felt']),{a:a||E.ri(12,22)}),sd:E.ri(1,99999),md:'wear'}:null;

// --- stamp artwork: one stamp's motifs, composed inside its own shape. c2: a second colour for the small motifs (a stamp printed in two runs)
function rzArt(E,sh,kind,mains,dots,c2){const G=geom(sh);useG(G);const k=G.SK,W=G.SW,H=G.SH,cx=W/2,cy=k=='tri'?H*2/3:H/2,Rad=k=='tri'?H/3:k=='diamond'?W*H/2/Math.hypot(W,H):k=='hex'?104:Math.min(W,H)/2,S=r=>+(r/48).toFixed(3),m=E.pick(mains),d=E.pick(dots),items=[];let sym={m:'off'};
 const dot=(x,y,s,r)=>{const q=it(d,x,y,s,r||0);if(c2)q.ic=c2;return q};
 if(kind=='emblem'){items.push(it(m,cx,cy,S(Rad*E.rr(.52,.66)),0,E.ch(.5)?1:-1));const nd=E.pick([12,16,20,24]),r2=Rad*.84;for(let i=0;i<nd;i++){const a=-Math.PI/2+i*2*Math.PI/nd;items.push(dot(cx+Math.cos(a)*r2,cy+Math.sin(a)*r2,S(Rad*.045),i*360/nd))}}
 else if(kind=='center'){items.push(it(m,cx,cy,S(Rad*E.rr(.66,.84)),E.pick([0,0,0,-12,12]),E.ch(.5)?1:-1))}
 else if(kind=='rosette'){sym={m:E.ch(.5)?'rot':'kal',n:E.pick(k=='hex'?[6,6,12]:[4,6,8])};items.push(it(m,cx,cy-Rad*E.rr(.45,.58),S(Rad*E.rr(.26,.34)),0));items.push(dot(cx,cy,S(Rad*E.rr(.18,.26))))}
 else if(kind=='quad'){sym={m:'quad'};const q=Rad*E.rr(.38,.46);items.push(it(m,cx-q,cy-q,S(Rad*E.rr(.3,.36)),-45));items.push(dot(cx,cy,S(Rad*E.rr(.16,.22))))}
 else if(kind=='mirror'){sym={m:'lr'};const q=Rad*E.rr(.26,.32);items.push(it(m,cx-q,cy,S(Rad*E.rr(.38,.46)),0,1));items.push(dot(cx,cy,S(Rad*E.rr(.12,.16))))}
 else if(kind=='star'){sym={m:k=='hex'?'hex':'star'};items.push(it(m,cx,cy-Rad*E.rr(.45,.56),S(Rad*E.rr(.2,.26)),0));items.push(dot(cx,cy,S(Rad*E.rr(.14,.2))))}
 else{const g=E.ri(2,3),cw=W/g,c=H/g;for(let a=0;a<g;a++)for(let b=0;b<g;b++){const sm=(a+b)%2==1;const q=it(sm?d:m,...wrapP((a+.5)*cw,(b+.5)*c),S(Math.min(cw,c)*(sm?.18:.36)),0);if(sm&&c2)q.ic=c2;items.push(q)}}
 return{items,sym}}
// a stamp (a tile) for a Look: shape, artwork, block edges, and its ink. o: {edge: a printed block edge, c2}
function rzTile(E,id,sh,kind,mains,dots,ink,o){o=o||{};const a=rzArt(E,sh,kind,mains,dots,o.c2);const et=o.edge===false?0:o.edge===true?+E.rr(1.2,2.6).toFixed(1):+E.wpick([[0,.45],[E.rr(1,2.4),.55]]).toFixed(1);
 return{id,sh,items:a.items,sym:a.sym,et,er:+E.rr(0,3).toFixed(1),es:E.ri(0,999),neg:false,ink:ink||null,tu:[]}}
const rzSh=(k,s)=>({k,o:'p',s:s||[1,1],z:100});

// --- shared parts
// the ground: flat (the Background shows), a quiet tonal gradient, a radial glow, or a halftone gradient. Returns the colours a word over it must read against.
// 2.76.3: with Background off in the Randomize panel the ground is always flat (the paper shows)
function rzGround(E,out,kind){const R=E.roles,k0=kind||E.pick(['flat','flat','tonal','glow','halftone']),k=E.FT.bg&&!E.tile?k0:'flat';
 if(R.dark)out.els.push(elSheet('Ground',{ink:R.paper}));
 if(k=='flat')return[R.paper];
 const far=R.tone(E.rr(.12,.22),R.dark?R.light:E.ch(.5)?R.deep:R.ink),near=R.tone(E.rr(0,.04),R.light);
 if(k=='glow'){out.els.push(elGrad(E,near,far,true));return[near,far]}
 const g=elGrad(E,near,far,false);if(k=='halftone')addFx(g,rzQfx('halftone',{sz:E.ri(14,24),tone:E.ri(40,55),ang:E.pick([15,45,75]),spr:E.ri(25,45)},E));out.els.push(g);return[near,far]}
// a quiet field: small shapes in a tone of the paper over the whole canvas (a Tiling or a Scatter)
function rzField(E,out,o){if(!E.FT.pat)return null;o=o||{};const R=E.roles,ms=o.ms||[E.ch(.6)?rzSmall(E):E.pick(rzThemes(E,o.look||'poster'))],ink=o.ink||R.tone(E.rr(.1,.18)),lay=o.lay||E.pick(E.tile?['tile','tile','wall']:['tile','tile','wall','scatter','scatter']);
 const p=patOf(o.n||'Field',[],lay=='wall'?'tile':lay,E.ri(6,10),E.ri(8,14),E.ri(25,45),[],E.ri(1,9999));p.src=ms.map(m=>rzWt(m)>1500?rzSolo(E,out,m,ink):{k:'motif',m,w:1,ink});
 if(lay=='tile'||lay=='wall'){if(lay=='wall'){p.ts='wall';p.ar=E.pick(RZ_WALL);p.sp=E.ri(40,120)}else{p.ts=E.pick(['square','hex','diamond','circle']);p.ar=E.pick((TL_AR[p.ts]||[['grid']]).map(x=>x[0]));p.sp=E.ri(140,320)}p.ps=+(o.ps||E.rr(2.5,5)).toFixed(1);p.ds='cycle'}
 else{p.cn=E.ri(5,8);p.rn=E.ri(7,11);p.sz=E.ri(20,40);p.ds='random';if(E.ch(.5))p.md=E.ri(50,90)}
 // 2.78.0: two tones of the paper, piece by piece, now and then
 if(E.ch(.3)){p.pcm='random';p.pcc=[ink,R.tone(E.rr(.06,.12),E.ch(.5)?R.acc[0]||R.ink:R.ink)]}
 if(E.ch(.3)&&E.FT.jit&&!E.tile&&lay=='scatter'){const j=fxJ(0,E.ri(10,40),E.ri(5,25));if(E.ch(.4))j.rs=E.pick([90,180]);addFx(p,j)}out.els.push(p);return p}
// a pattern in a box w by h at x, y holding nc x nr whole pieces (a Tiling clips at its box: the pieces are sized so the box ends between pieces). cell: the step,
// fill: how much of a step a piece takes
function rzGrid(n,src,x,y,nc,nr,cell,fill,o){const S=Math.min(CW,CH),g=1/Math.max(.2,fill),ps=cell/g/S*100,p=patOf(n,[],'tile',nc,nr,100,[],1);p.src=src;p.ts='square';p.ar='grid';p.ps=+ps.toFixed(3);p.sp=+((g-1)*100).toFixed(2);
 p.af=0;p.x=rzF(x);p.y=rzF(y);p.aw=rzF(nc*cell);p.ah=rzF(nr*cell);p.ox=nc%2?0:50;p.oy=nr%2?0:50;p.ds='cycle';return Object.assign(p,o||{})}
// a border of small pieces along the edges, inset m (the Frame layout), and the corner pieces
function rzBorder(E,out,m,src,ink,n){const p=patOf(n||'Border',[],'frame',E.ri(10,16),E.ri(14,22),E.ri(45,70),[],1);p.in=+(m/Math.min(CW,CH)*100).toFixed(1);p.src=[].concat(src).map(x=>rzWt(x)>1500?rzSolo(E,out,x,ink):{k:'motif',m:x,w:1,ink});p.ds='cycle';
 p.cn=Math.max(6,Math.round((CW-2*m)/Math.min(CW,CH)*E.ri(12,18)));p.rn=Math.max(6,Math.round((CH-2*m)/Math.min(CW,CH)*E.ri(12,18)));return p}
function rzCorners(E,m,mk,s,ink){return[[m,m,0],[CW-m,m,90],[CW-m,CH-m,180],[m,CH-m,270]].map(([x,y,r])=>{const q=elMotif(mk,x,y,s,{ink,nm:'Corner'});q.r=r;return q})}
// a ring of pieces round a circle (Map to shape: a pattern that follows a path): a wreath of leaves, a ring of dots or rays
function rzRing(E,out,x,y,d,src,ink,o){o=o||{};const P=elPath('ellipse',x,y,d,d);out.els.push(P);const p=patOf(o.n||'Ring',[],'scatter',4,4,o.sz||60,[],1);p.src=[].concat(src).map(m=>rzWt(m)>1500&&!o.look?rzSolo(E,out,m,ink):{k:'motif',m,w:1,ink,...(o.look||{})});p.mp=P.u;p.mm='on';p.mc=o.mc||24;p.mo=0;p.rt=o.rt||0;p.ds='cycle';p.af=1;out.els.push(p);return p}
// --- 2.78.0 (owner Oct 30 2026: "wodblok is a pattern tool more than anything so please utilize pattern elements in the vast majority of outputs and looks").
// rzPat makes one Pattern that reaches for the pattern tools at random: a tiling of any tile shape and arrangement or one of the 17 wallpaper groups, a scatter
// without overlaps, a sunflower spiral; colour per piece by place or at random, ink variation, overprinting, turns in steps, a density fade, an accent between the
// pieces, whole pieces in a box, or the pieces only inside a shape or letters (Inside). o: {n, src, inks (piece colours), lays (allowed layouts), ts, ar, ps (piece
// size, % of the short side), sp (spacing), box {x,y,w,h}, pin (an element's u), acc (an accent source), quiet (fewer extras), pc (chance of colour per piece)}.
// On a repeat tile (E.tile) only tilings, with nothing that would differ across the tile's edges.
const RZ_WALL=['p1','p2','pm','pg','cm','pmm','pmg','pgg','cmm','p4','p4m','p4g','p3','p3m1','p31m','p6','p6m'];
// arrangements whose places fall in classes, so colour by place gives stripes, checks and three-colour honeycombs; and the one-class ones an accent sits between
const RZ_CLS=['checker','diag','stripes','bands','chevron','herring','three','harl','rows','alt','octsq'],RZ_ONE=['grid','brick','half','honey','packed','square','dgrid'];
// a piece's source for a motif: by reference through a one-motif stamp when the motif's drawing is heavy
const rzSrc=(E,out,m,ink)=>rzWt(m)>1500?rzSolo(E,out,m,ink):{k:'motif',m,w:1,ink};
// the colours a Look's pieces may take: those that read on the ground, the main ink first
function rzInks(E,gnd,n){const R=E.roles,a=[...new Set([R.txt(gnd,R.ink),...R.acc,R.ink,R.deep,R.light].filter(c=>c&&R.lo(c,gnd)>=1.35))];return(a.length?a:[R.ink]).slice(0,n||3)}
// a stamp printed in several colours piece by piece is drawn once per colour; with a block edge each of those takes seconds (a Tilework roll took 30 s), so a stamp
// coloured piece by piece prints without its block edge
const rzOneEdge=(out,p)=>{if(p.pcm)(p.src||[]).forEach(x=>{if(x&&x.k=='stamp'){const t=out.tiles.find(z=>z.id==x.t);if(t&&t.et>0)t.et=0}})};
function rzPat(E,out,o){o=o||{};const seam=E.tile,inks=(o.inks||[]).filter(Boolean),lay=E.pick(o.lays||(seam?['tile','tile','wall']:['tile','tile','tile','wall','wall','scatter','spiral']));
 const p=patOf(o.n||'Pattern',[],lay=='wall'?'tile':lay,4,4,100,[],E.ri(1,9999));p.src=o.src.slice();p.ds=o.ds||'cycle';p.af=1;
 if(lay=='tile'||lay=='wall'){if(lay=='wall'){p.ts='wall';p.ar=o.ar&&RZ_WALL.includes(o.ar)?o.ar:E.pick(RZ_WALL)}else{const ts=o.ts||E.pick(['square','square','square','hex','hex','diamond','circle','tri','oct']);p.ts=ts;p.ar=o.ar||E.pick((TL_AR[ts]||[['grid']]).map(x=>x[0]))}
  p.ps=+(o.ps||E.rr(7,20)).toFixed(1);p.sp=o.sp!=null?o.sp:E.ri(0,lay=='wall'?20:60);
  // at most about o.max pieces (450) over its area: a roll stays light to draw (each piece is markup of its own); past that the pieces grow. Chevrons, herringbone
  // and basketweave put two or more pieces in each step, and a tiling also places the pieces just past its edges (about 1.6 times)
  {const S=Math.min(CW,CH),A=o.box?o.box.w*o.box.h:CW*CH,c=S*p.ps/100*(1+p.sp/100),n=A/(c*c)*1.6*(['chevron','herring','basket'].includes(p.ar)?2.5:1),mx=o.max||450;if(n>mx)p.ps=+(p.ps*Math.sqrt(n/mx)).toFixed(2)}}
 else if(lay=='scatter'){p.cn=E.ri(5,9);p.rn=E.ri(6,11);p.sz=E.ri(35,70);p.md=E.ri(60,100);p.ds='random'}
 else{p.cn=E.ri(9,14);p.rn=E.ri(9,14);p.sz=E.ri(45,85)}
 // colour per piece: by place where the arrangement has classes (most of the time), else at random from the seed
 if(inks.length>1&&E.ch(o.pc==null?.6:o.pc)){p.pcm=RZ_CLS.includes(p.ar)&&E.ch(.8)?'place':'random';p.pcc=E.shuf(inks).slice(0,E.ri(2,Math.min(4,inks.length)))}
 if(!o.quiet&&E.ch(.35))p.iv=E.ri(12,40);
 if(!o.quiet&&E.ch(.18)&&(lay=='scatter'||+p.sp<10))p.ov=1;
 if(!seam&&E.FT.jit&&E.ch(o.quiet?.12:lay=='scatter'?.6:.25)){const j=fxJ(lay=='scatter'?0:E.ri(0,12),E.ri(10,40),E.ri(0,15));if(E.ch(.5))j.rs=E.pick([90,180]);addFx(p,j)}
 if(!seam&&!o.quiet&&E.ch(.2)){p.dm=E.pick(['lin','lin','rad']);if(p.dm=='lin')p.dg=E.pick([0,45,90,135,180,270]);p.dv=E.ri(55,90);p.dk=lay=='scatter'?E.pick(['count','both']):E.pick(['size','size','both']);if(E.ch(.4))p.di=1}
 if(o.acc&&lay=='tile'&&RZ_ONE.includes(p.ar)&&!p.pcm&&E.ch(.45)){p.ds='cycle';p.src.push(o.acc);p.ac={on:1,s:p.src.length-1,z:E.ri(22,42)}}
 if(o.box){const b=o.box;p.af=0;p.x=rzF(b.x);p.y=rzF(b.y);p.aw=rzF(b.w);p.ah=rzF(b.h);if(!o.pin&&E.ch(.5))p.ed='whole';if(!o.pin&&E.ch(.3))p.mg=E.ri(2,6)}
 if(o.pin)p.pin=o.pin;rzOneEdge(out,p);return p}
// a pattern inside an element (Inside), drawn over it in the area of its box: the element shows through where there are no pieces
function rzInside(E,out,q,o){const wh=fpWH(q);if(!wh)return null;const p=rzPat(E,out,{...o,pin:q.u,box:{x:+q.x,y:+q.y,w:wh[0],h:wh[1]},lays:o.lays||['tile','tile','wall','scatter']});out.els.push(p);return p}

// the focal point in a box w by h at x, y: an emblem (a stamp), a silhouette (one big motif), a wreath round a motif, or a disc behind a silhouette
// every element a focal point makes is marked as one (_p), so the Focal point switch can leave it out (2.76.3); the mark is taken off before the roll is applied
function rzFocal(E,out,...a){const n=out.els.length,k=rzFocal0(E,out,...a);out.els.slice(n).forEach(q=>q._p='focal');return k}
function rzFocal0(E,out,look,x,y,w,h,ink,kind,o){o=o||{};const R=E.roles,mains=rzPool(E,look,3),d=Math.min(w,h),k=kind||E.pick(['emblem','silhouette','silhouette','wreath','disc']);
 if(k=='emblem'){const t=rzTile(E,out.tiles.length+1,rzSh(E.pick(['circle','circle','hex','rect','diamond'])),E.pick(['emblem','center','center','rosette','star']),mains,[rzSmall(E)],ink,{c2:E.ch(.35)?R.blk([ink,...(o.bg||[R.paper])],1.4,[ink]):'',edge:E.ch(.35)});out.tiles.push(t);
  out.els.push(addFx(elStamp(t,x,y,d,0),o.fx!==false?rzInkFx(E,R):null,E.ch(.3)&&E.FT.pr?fxP(E.ri(1,4),0):null));return k}
 if(k=='disc'){const dc=o.disc||R.blk(o.bg||[R.paper],1.3,[ink]),dd=d*E.rr(.85,1);out.els.push(addFx(elBox('ellipse',x,y-d*.04,dd,dd,{ink:dc,nm:'Disc'}),E.ch(.4)?rzQfx('rough',{amt:E.ri(4,10),sz:E.ri(20,40)},E):null));
  out.els.push(addFx(elMotif(E.pick(mains),x,y+d*.08,d*E.rr(.7,.86),{ink:R.txt(dc,ink,2.2)}),rzInkFx(E,R,['none','none','halftone','rough'])));return k}
 if(k=='wreath'){const leaf=E.pick(rzThemes(E,E.ch(.5)?'orn':'leaf')),n=E.pick([10,12,14,16]);rzRing(E,out,x,y,d*.78,[leaf],ink,{mc:n,sz:E.ri(55,80),rt:E.pick([0,90,180])});
  out.els.push(addFx(elMotif(E.pick(mains),x,y,d*.46,{ink}),rzInkFx(E,R,['none','halftone','rough'])));return k}
 out.els.push(addFx(elMotif(E.pick(mains),x,y,d,{ink,...(E.ch(.5)?{f:-1}:{})}),o.fx!==false?rzInkFx(E,R):null,E.ch(.25)?rzWear(E):null));return'silhouette'}
// the canvas texture and the colour grade a Look ends on (kind: '' none, 'paper' a paper, else a texture kind)
const rzPaper=E=>E.pick(['cotton','cold','laid','washi','kraft','news','linen','canvas','felt']);

// --- the Looks
const RZL={};
const tw=(E,t)=>/[a-z]/.test(t)?0:E.pick([2,4,6,10]);
// Poster: an illustrated print. Layouts: Classic (a focal point, the title under it), Block (the words in a band of colour), Sun (a big disc behind a silhouette),
// Type (the title set big over the top, the picture small), Framed (an ornament border round it all)
RZL.poster={dark:1,w:1.2,build(E){const R=E.roles,S=Math.min(CW,CH),land=CW>CH*1.15,m=S*E.rr(.07,.09),out={tiles:[],els:[],texts:[]},lay=land?E.pick(['classic','block','type']):E.pick(['classic','classic','block','sun','type','framed']);
 const [ti,sub]=E.pick(RZW.poster),nm=rzName(),title=nm&&E.ch(.25)?nm.toUpperCase().slice(0,22):ti,tf=rzFont(E,RZF.poster[0]),sf=rzFont(E,RZF.poster[1]);
 const gnd=rzGround(E,out,lay=='block'||lay=='type'?E.pick(['flat','tonal']):null);if(lay!='framed'&&E.ch(.7))rzField(E,out,{look:'poster'});
 const ink=R.txt(gnd,R.ink),subC=R.txt(gnd,R.acc[0]);
 if(lay=='block'){const bh=CH*E.rr(.28,.36),bc=R.blk(gnd,2.2),top=E.ch(.3),by=top?bh/2:CH-bh/2,blk=elBox('rect',CW/2,by,CW,bh,{ink:bc,nm:'Block'});out.els.push(blk);
  if(E.FT.pat&&E.ch(.5)){const pc=rzMix(bc,R.paper,.22);rzInside(E,out,blk,{n:'Block pattern',src:[rzSrc(E,out,rzSmall(E),pc)],inks:[pc,rzMix(bc,R.deep,.25)],ps:E.rr(2.5,4.5),sp:E.ri(40,120),quiet:true,lays:['tile','wall']})}if(E.ch(.6))out.els.push(elRule(CW/2,top?bh+S*.012:CH-bh-S*.012,CW,S*.006,R.blk(gnd,1.4,[bc]),'Rule'));
  const fy=top?bh+(CH-bh)/2:(CH-bh)/2,fd=Math.min(CW-2*m,(CH-bh)-2*m)*.86;rzFocal(E,out,'poster',CW/2,fy,fd,fd,ink,null,{bg:gnd});
  const tc=R.txt(bc,R.paper),th=bh*E.rr(.3,.4),al=E.pick(['c','l']),tx=al=='l'?m+(CW-2*m)/2:CW/2;out.texts.push(elText(E,title,tf,tx,by-bh*.1,CW-2*m,th,tc,{al,ls:tw(E,title)}));out.texts.push(elText(E,sub,sf,tx,by+th*.5+bh*.1,(CW-2*m)*.7,th*.28,R.txt(bc,R.acc[0]||R.paper),{al,ls:E.pick([12,20,30])}))}
 else if(lay=='type'){const lines=title.split(' ').length>1&&E.ch(.7)?title.replace(/ (?=\S+$)/,'\n').replace(/ & /g,'\n& '):title,nl=lines.split('\n').length,th=Math.min(CH*.42,S*.22*nl),al=E.pick(['l','l','c']),tx=al=='l'?CW/2:CW/2,ty=m+th/2;
  out.texts.push(elText(E,lines,tf,tx,ty,CW-2*m,th,ink,{al,lh:E.pick([88,95,100]),ls:tw(E,title)}));
  const fd=Math.min(CW-2*m,CH-th-3*m)*E.rr(.7,.9),fy=ty+th/2+(CH-ty-th/2-m*1.6)/2;rzFocal(E,out,'poster',al=='l'&&E.ch(.5)?CW-m-fd/2:CW/2,fy,fd,fd,R.blk(gnd,1.8,[]),E.pick(['silhouette','disc','emblem']),{bg:gnd});
  if(E.ch(.6))out.els.push(elRule(CW/2,CH-m*1.55,CW-2*m,S*.004,ink));out.texts.push(elText(E,sub,sf,al=='l'?m+(CW-2*m)*.35:CW/2,CH-m*1.05,(CW-2*m)*.7,S*.035,subC,{al,ls:E.pick([10,20])}))}
 else{const framed=lay=='framed',fm=framed?m*1.6:m;if(framed){out.els.push(rzBorder(E,out,m*.8,[rzSmall(E)],R.blk(gnd,1.5)));out.els.push(elFrame(m*1.35,Math.max(1,S*.003),ink,'Frame'))}
  const titleTop=lay!='sun'&&E.ch(.25),th=S*E.rr(.1,.14),sh=th*E.rr(.28,.36),textH=th+sh*2.2,fh=CH-2*fm-textH-S*.04,fd=Math.min(CW-2*fm,fh)*(lay=='sun'?.98:E.rr(.82,.95)),fy=titleTop?CH-fm-fh/2:fm+fh/2;
  if(lay=='sun'){const dc=R.blk(gnd,1.4),dd=fd,pat=E.FT.pat&&E.ch(.55),sun=addFx(elBox('ellipse',CW/2,fy-fd*.05,dd,dd,{ink:dc,nm:'Sun'}),!pat&&E.ch(.4)?rzQfx('halftone',{sz:E.ri(16,30),tone:E.ri(45,65),ang:45,spr:E.ri(25,45)},E):null);out.els.push(sun);
   if(pat){const pc=rzMix(dc,R.paper,.3);rzInside(E,out,sun,{n:'Sun pattern',src:[rzSrc(E,out,rzSmall(E),pc)],inks:[pc,rzMix(dc,R.light,.45)],ps:E.rr(3,6),sp:E.ri(30,100),quiet:true})}
   const hz=fy+fd*E.rr(.12,.26);out.els.push(elBox('rect',CW/2,(hz+CH)/2,CW,CH-hz,{ink:R.paper,nm:'Ground'}));for(let i=0;i<E.ri(0,3);i++)out.els.push(elRule(CW/2,hz-dd*(.06+.07*i),dd,dd*(.03-.007*i),R.paper,'Stripe'));
   out.els.push(addFx(elMotif(E.pick(rzThemes(E,'poster')),CW/2,hz-fd*.12,fd*E.rr(.45,.6),{ink:R.txt([dc,R.paper],R.ink,2)}),rzInkFx(E,R,['none','halftone','rough'])))}
  else rzFocal(E,out,'poster',CW/2,fy,fd,fd,R.txt(gnd,R.blk(gnd,2.2,[]),2.2),null,{bg:gnd});
  const ty=titleTop?fm+th/2:CH-fm-textH+th/2;out.texts.push(elText(E,title,tf,CW/2,ty,CW-2*fm,th,ink,{ls:tw(E,title)}));
  const sy=ty+th/2+sh*1.1;if(E.ch(.5)){const rw=(CW-2*fm)*E.rr(.12,.2),gap=(CW-2*fm)*.36;[-1,1].forEach(s=>out.els.push(elRule(CW/2+s*(gap+rw/2),sy,rw,Math.max(.8,S*.003),subC)))}
  out.texts.push(elText(E,sub,sf,CW/2,sy,(CW-2*fm)*.62,sh,subC,{ls:E.pick([10,20,30])}))}
 out.tex=E.ch(.6)?rzPaper(E):'';out.grade=E.pick(['warm','fade','punch','none','none']);out.top=E.ch(.45)?rzQfx('grain',{amt:E.ri(12,26),sz:E.ri(15,30),soft:E.ri(20,50)},E):null;return out}};

// Book plate: a printed label for the inside of a book. Layouts: Classic (double rule, corners), Arch (the words curve over the emblem), Border (an ornament border),
// Seal (the words run round the emblem on a circle)
RZL.plate={w:.9,build(E){const R=E.roles,S=Math.min(CW,CH),m=S*E.rr(.06,.08),out={tiles:[],els:[],texts:[]},lay=E.pick(['classic','arch','border','seal']),lw=Math.max(1,S*.005);
 const gnd=rzGround(E,out,E.pick(['flat','flat','tonal','glow'])),ink=R.txt(gnd,R.ink),ac=R.blk(gnd,1.6,[ink]),[ti,sub0]=E.pick(RZW.plate),nm=rzName(),sub=nm&&E.ch(.6)?nm:sub0,tf=rzFont(E,RZF.plate[0]),sf=rzFont(E,RZF.plate[1]),it2=rzHas(sf,'i')&&E.ch(.6);
 if(lay!='border'&&lay!='seal'&&E.ch(.7))rzField(E,out,{look:'plate',ms:[E.pick(rzThemes(E,'orn'))],ps:E.rr(3,5)});
 const frame=()=>{if(lay=='border'){out.els.push(rzBorder(E,out,m*.9,[E.pick(rzThemes(E,'orn'))],ac));out.els.push(elFrame(m*1.75,lw,ink))}else{out.els.push(elFrame(m,lw*E.rr(1.6,2.6),ink));out.els.push(elFrame(m+S*.022,lw,ink,'Rule'))}
  if(lay=='classic'&&E.ch(.7)){const ck=E.pick(rzThemes(E,'orn'));out.els.push(...rzCorners(E,m+S*.07,ck,S*.08,ac))}};frame();
 const fm=lay=='border'?m*2.2:m*1.8,fw=CW-2*fm,ey=CH*E.rr(.47,.52),es=Math.min(fw,CH*.42)*E.rr(.62,.78),mains=rzPool(E,'plate',3);
 if(lay=='seal'){const d=Math.min(fw,CH*.5)*.95;out.els.push(elBox('ellipse',CW/2,ey,d,d,{fl:'none',sw:rzF(lw*1.6),sk:ink,nm:'Ring'}));out.els.push(elBox('ellipse',CW/2,ey,d*.74,d*.74,{fl:'none',sw:rzF(lw),sk:ink,nm:'Ring'}));
  const P=elPath('ellipse',CW/2,ey,d*.87,d*.87);out.els.push(P);const ring=rzRound((ti+' · '+sub+' · ').toUpperCase(),Math.PI*d*.87,d*.07),q=elText(E,ring,tf,CW/2,ey,Math.PI*d*.87*.97,d*.07,ink,{ls:E.pick([4,8]),ft:'w'});q.mp=P.u;q.mm='on';q.mo=0;out.texts.push(q);
  if(E.FT.pat&&E.ch(.7))rzRing(E,out,CW/2,ey,d*1.12,[rzSmall(E)],ac,{mc:E.pick([36,48,60]),sz:E.ri(25,40),n:'Ring'});
  rzFocal(E,out,'plate',CW/2,ey,d*.6,d*.6,ink,E.pick(['silhouette','emblem']),{fx:false});
  if(E.ch(.6))out.texts.push(elText(E,E.pick(['MMXXVI','No. '+E.ri(1,99),'ANNO 2026']),sf,CW/2,ey+d/2+(CH-fm-ey-d/2)/2,fw*.5,S*.045,ac,{ls:10}))}
 else{const arch=lay=='arch',th=Math.min(S*.12,(ey-es/2-fm)*.62),ty=(fm+ey-es/2)/2+fm*.15;out.texts.push(elText(E,ti,tf,CW/2,arch?ty+th*.25:ty,fw*(arch?.95:.82),th,ink,{ls:E.pick([4,8,12]),...(arch?{cv:E.pick([14,18,24])}:{})}));
  rzFocal(E,out,'plate',CW/2,ey,es,es,ink,E.pick(['emblem','emblem','wreath','silhouette']),{fx:false});
  const sy=(ey+es/2+CH-fm)/2,sth=th*.5;out.texts.push(elText(E,sub,sf,CW/2,sy,fw*.8,sth,R.txt(gnd,ac),{ls:it2?2:8,...(it2?rzSty(sub,'i'):{})}));
  if(E.ch(.6)){const rw=fw*.18;out.els.push(elRule(CW/2,sy+sth*.95,rw,lw,ac));if(E.ch(.5))out.els.push(elMotif(rzSmall(E),CW/2,sy+sth*1.5,S*.03,{ink:ac}))}}
 out.tex=rzPaper(E);out.grade=E.pick(['fade','warm','none','none']);return out}};

// Badge: a seal, a stamp or a label. Layouts: Seal (words round a filled disc), Outline (rings, a dotted ring, curved words), Banner (a shield or hexagon with a ribbon of words)
RZL.badge={dark:1,w:.9,build(E){const R=E.roles,S=Math.min(CW,CH),out={tiles:[],els:[],texts:[]},lay=E.pick(['seal','seal','outline','banner']),cx=CW/2,cy=CH*E.rr(.46,.5),bs=Math.min(S*E.rr(.7,.82),CH*.62),mains=rzPool(E,'badge',3);
 const gnd=rzGround(E,out,E.pick(['flat','flat','tonal','glow'])),[ti,sub]=E.pick(RZW.badge),tf=rzFont(E,RZF.badge[0]),sf=rzFont(E,RZF.badge[1]),ink=R.blk(gnd,2.4),lw=Math.max(1,S*.006);
 if(E.ch(.8))rzField(E,out,{look:'badge',ms:[rzSmall(E)]});
 if(lay=='seal'){const pc=R.txt(ink,R.paper,2.6),seal=addFx(elBox(E.ch(.75)?'ellipse':'hex',cx,cy,bs,bs,{ink,nm:'Seal'}),E.pick([rzQfx('rough',{amt:E.ri(6,14),sz:E.ri(15,30)},E),rzQfx('halftone',{sz:E.ri(12,22),tone:E.ri(60,75),ang:45,spr:E.ri(20,40)},E),rzWear(E,E.ri(14,26)),null]));out.els.push(seal);
  if(E.FT.pat&&E.ch(.45)){const tc=rzMix(ink,pc,.18);rzInside(E,out,seal,{n:'Seal pattern',src:[rzSrc(E,out,rzSmall(E),tc)],ps:E.rr(2.5,4),sp:E.ri(40,110),quiet:true,pc:0,lays:['tile','wall']})}
  out.els.push(elBox('ellipse',cx,cy,bs*.92,bs*.92,{fl:'none',sw:rzF(lw),sk:pc,nm:'Ring'}));out.els.push(elBox('ellipse',cx,cy,bs*.64,bs*.64,{fl:'none',sw:rzF(lw),sk:pc,nm:'Ring'}));
  const P=elPath('ellipse',cx,cy,bs*.78,bs*.78);out.els.push(P);const ring=rzRound((ti+' ★ '+sub+' ★ ').toUpperCase(),Math.PI*bs*.78,bs*.085),q=elText(E,ring,tf,cx,cy,Math.PI*bs*.78*.96,bs*.085,pc,{ls:E.pick([2,6,10]),ft:'w'});q.mp=P.u;q.mm='on';q.mo=0;out.texts.push(q);
  rzFocal(E,out,'badge',cx,cy,bs*.5,bs*.5,pc,E.pick(['silhouette','silhouette','emblem']),{fx:false,bg:[ink]});
  if(E.ch(.5))out.texts.push(elText(E,E.pick(['EST. 2026','NO. '+E.ri(1,40),'SINCE 1987']),sf,cx,Math.min(CH-S*.08,cy+bs/2+(CH-cy-bs/2)/2),CW*.5,S*.05,R.txt(gnd,R.acc[0]),{ls:12}))}
 else if(lay=='outline'){out.els.push(elBox('ellipse',cx,cy,bs,bs,{fl:'none',sw:rzF(lw*2.4),sk:ink,nm:'Ring'}));rzRing(E,out,cx,cy,bs*.9,[basicKey(E.pick(['ellipse','star','dia']))],ink,{mc:E.pick([36,48,60]),sz:E.ri(30,45)});out.els.push(elBox('ellipse',cx,cy,bs*.8,bs*.8,{fl:'none',sw:rzF(lw),sk:ink,nm:'Ring'}));
  out.texts.push(elText(E,ti.toUpperCase(),tf,cx,cy-bs*.22,bs*.62,bs*.1,R.txt(gnd,ink),{ls:E.pick([4,8]),cv:E.pick([12,16,20])}));out.texts.push(elText(E,sub.toUpperCase(),sf,cx,cy+bs*.27,bs*.5,bs*.07,R.txt(gnd,ink),{ls:E.pick([6,10]),cv:-E.pick([8,12])}));
  rzFocal(E,out,'badge',cx,cy+bs*.02,bs*.34,bs*.34,R.txt(gnd,R.acc[0]||ink,2),E.pick(['silhouette','emblem']),{fx:false,bg:gnd});[-1,1].forEach(s=>out.els.push(elMotif(basicKey('star'),cx+s*bs*.33,cy+bs*.02,bs*.06,{ink})))}
 else{const shp=E.pick(['hex','ellipse','rect']),fc=ink,pc=R.txt(fc,R.paper,2.6);out.els.push(addFx(elBox(shp,cx,cy,bs*(shp=='rect'?.84:1),bs,{ink:fc,nm:'Seal'}),E.ch(.5)?rzQfx('rough',{amt:E.ri(5,12),sz:E.ri(15,30)},E):null));out.els.push(elBox(shp,cx,cy,bs*(shp=='rect'?.84:1)*.9,bs*.9,{fl:'none',sw:rzF(lw),sk:pc,nm:'Ring'}));
  rzFocal(E,out,'badge',cx,cy-bs*.14,bs*.42,bs*.42,pc,'silhouette',{fx:false,bg:[fc]});const bc=R.blk([fc,...gnd],1.5,[fc]),bw=bs*(shp=='rect'?.98:1.04),bh=bs*.2,by=cy+bs*.2,tw=bh*1.1,th=bh*.86;
  // the ribbon: two tails behind it, a shade darker and lower, each with a notch cut in its outer end (a triangle in the ground's colour)
  [-1,1].forEach(s=>{const tx=cx+s*(bw/2+tw*.25),ty=by+bh*.3;out.els.push(elBox('rect',tx,ty,tw,th,{ink:rzMix(bc,R.deep,.28),nm:'Banner'}));const n=elBox('tri',tx+s*(tw/2-bh*.18),ty,th*1.02,bh*.36,{ink:gnd[0],nm:'Banner'});n.r=s<0?90:270;out.els.push(n)});
  out.els.push(addFx(elBox('rect',cx,by,bw,bh,{ink:bc,nm:'Banner'}),E.ch(.4)?rzWear(E,E.ri(10,18)):null));out.texts.push(elText(E,ti.toUpperCase(),tf,cx,by,bw*.86,bh*.62,R.txt(bc,R.paper),{ls:E.pick([2,6])}));out.texts.push(elText(E,sub.toUpperCase(),sf,cx,cy+bs*.4,bs*.4,bs*.06,pc,{ls:10}))}
 out.tex=E.ch(.6)?rzPaper(E):'';out.grade=E.pick(['punch','fade','none']);return out}};

// Specimen: shapes from one folder set out like plates in a book. Layouts: Grid (a grid of specimens with numbers), Single (one large specimen with its caption), Row (three in a row)
RZL.specimen={w:.9,build(E){const R=E.roles,S=Math.min(CW,CH),m=S*E.rr(.07,.1),out={tiles:[],els:[],texts:[]},lay=E.pick(['grid','grid','single','row',...(E.FT.pat?['swatch','swatch']:[])]),pool=rzThemes(E,'specimen'),rk=basicKey('rect');
 const gnd=rzGround(E,out,E.pick(['flat','flat','tonal'])),ink=R.txt(gnd,R.ink),ac=R.txt(gnd,R.blk(gnd,2.4,[ink]),2.6),[ti,sub]=E.pick(RZW.specimen),tf=rzFont(E,RZF.specimen[0]),sf=rzFont(E,RZF.specimen[1]),fw=CW-2*m,fh=CH-2*m;
 if(lay!='swatch'&&E.ch(.8))rzField(E,out,{look:'specimen',ms:[rzSmall(E)],ps:E.rr(2.5,4)});
 if(E.ch(.75)){out.els.push(elFrame(m,Math.max(1,S*.004),ink));if(E.ch(.4))out.els.push(elFrame(m+S*.012,Math.max(.8,S*.002),ink,'Rule'))}
 const capH=S*.15,top=m+S*.05,boxH=fh-capH-S*.04,cy=top+boxH/2,its=rzHas(tf,'i'),num=['I','II','III','IV','V','VI','VII','VIII','IX','X','XI','XII','XIII','XIV','XV','XVI'];
 if(lay=='grid'){const nc=CW>CH?E.ri(4,5):E.ri(3,4),cell=Math.min(fw*.9/nc,boxH/Math.max(3,Math.round(boxH/(fw*.9/nc)))),nr=Math.max(2,Math.floor(boxH/cell));
  // every place a different specimen (a Pattern repeats its sources), each its own Motif; numbered under it when there are few
  const lab=E.ch(.5)&&nc*nr<=16,fill=E.rr(.6,.72),x0=CW/2-nc*cell/2,y0=cy-nr*cell/2,all=E.shuf(pool),hi=E.ri(0,nc*nr-1);
  for(let j=0;j<nr;j++)for(let i=0;i<nc;i++){const k=j*nc+i;out.els.push(elMotif(all[k%all.length],x0+(i+.5)*cell,y0+(j+.5)*cell-(lab?cell*.07:0),cell*fill*(lab?.9:1),{ink:k==hi?ac:ink,nm:'Specimen'}));
   if(lab)out.texts.push(elText(E,num[k]||String(k+1),sf,x0+(i+.5)*cell,y0+(j+1)*cell-cell*.1,cell*.5,cell*.09,ac,{ls:10}))}}
 else if(lay=='row'){const nr=CH>CW*1.2?E.ri(1,2):1,cell=Math.min(fw/3,boxH/(nr*1.35+.6)),ms=E.shuf(pool),y0=cy-(nr-1)*cell*.68;let k=0;
  for(let j=0;j<nr;j++){const y=y0+j*cell*1.36;for(let i=0;i<3;i++,k++){out.els.push(elMotif(ms[k%ms.length],CW/2+(i-1)*cell,y-cell*.08,cell*.74,{ink,nm:'Specimen'}));out.texts.push(elText(E,num[k]+'.',sf,CW/2+(i-1)*cell,y+cell*.42,cell*.4,S*.03,ac,{ls:10}))}}
  [y0-cell*.72,y0+(nr-1)*cell*1.36+cell*.68].forEach(y=>out.els.push(elRule(CW/2,y,fw*.7,Math.max(.8,S*.002),ink)))}
 // 2.78.0 Swatch: one specimen set as a pattern on a plate, as a sample of a printed paper
 else if(lay=='swatch'){const bw=fw*.86,bh=boxH*.92;out.els.push(elBox('rect',CW/2,cy,bw,bh,{ink:R.tone(E.rr(.04,.1)),nm:'Swatch'}));out.els.push(rzPat(E,out,{n:'Swatch',src:[rzSrc(E,out,E.pick(pool),ink)],inks:[ink,ac],lays:['tile','wall','wall'],ps:E.rr(7,13),sp:E.ri(10,60),pc:.4,quiet:true,box:{x:CW/2,y:cy,w:bw,h:bh}}));
  out.els.push(elFrame(Math.min((CW-bw)/2,(CH-bh)/2),Math.max(.8,S*.002),ink,'Rule',{x:rzF(CW/2),y:rzF(cy),wx:+(bw/Math.max(bw,bh)).toFixed(4),wy:+(bh/Math.max(bw,bh)).toFixed(4),s:rzF(Math.max(bw,bh))}))}
 else{const d=Math.min(fw,boxH)*.82;out.els.push(addFx(elMotif(E.pick(pool),CW/2,cy,d,{ink}),E.pick([rzQfx('stipple',{sz:E.ri(10,16),den:E.ri(64,78),spr:E.ri(60,85)},E),rzQfx('lines',{},E),null,null])));
  const sm=E.shuf(pool).slice(0,2);[[m+S*.12,top+S*.1],[CW-m-S*.12,top+S*.1]].forEach(([x,y],i)=>{if(E.ch(.6))out.els.push(elMotif(sm[i]||sm[0],x,y,S*.11,{ink:ac}))})}
 const cyc=CH-m-capH/2;out.texts.push(elText(E,ti,tf,CW/2,cyc+capH*.12,fw*.7,capH*.38,ink,its?rzSty(ti,'i'):{}));out.texts.push(elText(E,sub,sf,CW/2,cyc-capH*.28,fw*.3,capH*.14,ac,{ls:14}));
 out.tex=rzPaper(E);out.grade=E.pick(['fade','warm','none']);return out}};

// Modern: shapes and type in the manner of a modern print. Layouts: Shapes (a few big shapes set on a grid, overprinted), Tiles (a clean grid of shapes in two or three inks),
// Bands (stripes of colour), Circles (rings and discs), with a bold title
RZL.modern={dark:1,w:1,build(E){let rzFill=null;const R=E.roles,S=Math.min(CW,CH),m=S*E.rr(.06,.08),out={tiles:[],els:[],texts:[]},lay=E.pick(['shapes','shapes',...(E.FT.pat?['tiles','sym','sym']:[]),'bands','circles','bigtype']);
 const gnd=rzGround(E,out,E.pick(['flat','flat','flat','tonal'])),inks0=[...R.acc,R.ink].filter(c=>R.lo(c,gnd)>=1.35),inks=inks0.length?inks0.slice(0,3):[R.ink],[ti,sub]=E.pick(RZW.modern),tf=rzFont(E,RZF.modern[0]),sf=rzFont(E,RZF.modern[1]);
 const typeTop=E.ch(.4),th=S*E.rr(.13,.19),tH=th+S*.1,gap=S*.06,ax=typeTop?tH+m+gap:m,ay=typeTop?CH-m:CH-tH-m-gap,aH=ay-ax,cy=ax+aH/2,ink=R.txt(gnd,R.ink),bl=R.dark?'screen':'multiply';
 // Shapes: a grid of cells over the picture's part of the canvas, most holding one basic shape (a disc, a square, a triangle turned, a ring), and one large
 // shape over two cells each way, overprinted
 if(lay=='shapes'){const [gc,gr]=E.pick([[2,3],[3,3],[3,4],[2,2],[4,5]]),cell=Math.min((CW-2*m)/gc,aH/gr),x0=CW/2-gc*cell/2,y0=cy-gr*cell/2,z=E.rr(.82,.96),fx=E.ch(.3)?rzQfx('halftone',{sz:E.ri(10,18),tone:E.ri(50,70),ang:E.pick([15,45]),spr:E.ri(20,40)},E):null;
  for(let j=0;j<gr;j++)for(let i=0;i<gc;i++){if(E.ch(.2))continue;const k=E.pick(['ellipse','ellipse','rect','tri','ring']),x=x0+(i+.5)*cell,y=y0+(j+.5)*cell,c=inks[(i+j*2)%inks.length],d=cell*z;
   const q=k=='ring'?elBox('ellipse',x,y,d*.86,d*.86,{fl:'none',sw:rzF(cell*.1),sk:c,nm:'Ring'}):elBox(k,x,y,d,d,{ink:c,nm:'Shape'});if(k=='tri')q.r=E.pick([0,90,180,270]);out.els.push(q)}
  if(gc>=2&&gr>=2&&E.ch(.7)){const i=E.ri(0,gc-2),j=E.ri(0,gr-2),k=E.pick(['ellipse','rect','tri']),q=elBox(k,x0+(i+1)*cell,y0+(j+1)*cell,cell*2*z,cell*2*z,{ink:inks[inks.length-1],nm:'Shape',bl});if(k=='tri')q.r=E.pick([0,180]);out.els.push(addFx(q,fx));rzFill=q;if(E.FT.pat&&E.ch(.75)){const pc=R.txt([q.ink],R.paper,1.6);rzInside(E,out,q,{n:'Shape pattern',src:[{k:'motif',m:basicKey(E.pick(['ellipse','rect','tri']))||rzSmall(E),w:1,ink:pc}],ps:E.rr(2.5,5),sp:E.ri(30,110),quiet:true,pc:0,lays:['tile']})}}
  if(E.ch(.5))out.els.push(elRule(CW/2,typeTop?ax-gap/2:ay+gap/2,CW-2*m,S*.006,ink))}
 else if(lay=='tiles'){const ks=E.shuf(['ellipse','rect','tri','dia','hex','star']).slice(0,E.ri(1,3)).map(basicKey).filter(Boolean),nc=E.ri(3,6),cell=(CW-2*m)/nc,nr=Math.max(2,Math.floor(aH/cell));
  out.els.push(addFx(rzGrid('Shapes',ks.flatMap(k=>inks.map(c=>({k:'motif',m:k,w:1,ink:c}))),CW/2,ax+nr*cell/2,nc,nr,cell,E.rr(.7,.9),{ds:E.pick(['cycle','random']),sd:E.ri(1,9999)}),E.ch(.4)?rzQfx('misreg',{amt:E.ri(6,16),ang:E.ri(0,359),col:''},E):null))}
 // 2.78.0 Symmetry: a basic shape or two in a wallpaper symmetry, in the inks piece by piece, overprinted now and then
 else if(lay=='sym'){const ks=E.shuf(['tri','tri','ellipse','rect','dia']).slice(0,E.ri(1,2)).map(basicKey).filter(Boolean),p=rzPat(E,out,{n:'Shapes',src:ks.map(k=>({k:'motif',m:k,w:1,ink:inks[0]})),inks,lays:['wall'],ps:E.rr(7,12),sp:E.ri(0,20),pc:.85,box:{x:CW/2,y:cy,w:CW-2*m,h:aH}});if(E.ch(.4))p.ov=1;out.els.push(p)}
 else if(lay=='bands'){const n=E.ri(3,6),bh=aH/n,dg=E.ch(.4);for(let i=0;i<n;i++){if(i%2&&E.ch(.6))continue;const q=elBox('rect',CW/2,ax+(i+.5)*bh,dg?CW*1.6:CW,bh*E.rr(.5,.95),{ink:inks[i%inks.length],nm:'Band'});if(dg)q.r=E.pick([-20,20,-30]);if(i)q.bl=bl;out.els.push(q);if(!dg&&(!rzFill||E.ch(.3)))rzFill=q}}
 else if(lay=='circles'){const n=E.ri(3,6),d0=Math.min(CW-2*m,aH),c0=[CW/2+E.rr(-.15,.15)*d0,cy];for(let i=0;i<n;i++){const d=d0*(1-i/n*.85),k=E.ch(.5);out.els.push(k?elBox('ellipse',c0[0],c0[1],d,d,{ink:inks[i%inks.length],nm:'Disc',...(i?{bl}:{})}):elBox('ellipse',c0[0],c0[1],d,d,{fl:'none',sw:rzF(S*E.rr(.008,.02)),sk:inks[i%inks.length],nm:'Ring'}))}
  if(E.ch(.5))out.els.push(addFx(elBox('ellipse',c0[0]+d0*.25,c0[1]-d0*.2,d0*.35,d0*.35,{ink:R.paper,nm:'Disc'}),null));rzFill=out.els.slice().reverse().find(q=>q.nm=='Disc')||null}
 // 2.78.0: a band, a disc or the big type's shape filled with a pattern (Inside) now and then
 const fill=()=>{if(lay!='shapes'&&rzFill&&rzFill.ink&&E.FT.pat&&E.ch(.75)){const pc=R.txt([rzFill.ink],R.paper,1.6);rzInside(E,out,rzFill,{n:'Shape pattern',src:[{k:'motif',m:basicKey(E.pick(['ellipse','rect','tri','dia']))||rzSmall(E),w:1,ink:pc}],ps:E.rr(2.5,5),sp:E.ri(30,110),quiet:true,pc:0,lays:['tile','wall']})}};if(lay!='bigtype')fill();
 // Big type: one large shape, and the title set as big as the canvas allows over it, overprinted (Multiply, or Screen on a dark ground)
 if(lay=='bigtype'){const k=E.pick(['ellipse','rect','tri']),d=Math.min(CW-2*m,CH*.55),q=elBox(k,CW/2+E.rr(-.12,.12)*CW,CH*E.rr(.36,.46),d,d,{ink:inks[0],nm:'Shape'});rzFill=q;out.els.push(addFx(q,E.ch(.4)?rzQfx('halftone',{sz:E.ri(10,18),tone:E.ri(50,70),ang:E.pick([15,45]),spr:E.ri(20,40)},E):null));fill();
  const word=ti.split(' ')[0],bt=CH*E.rr(.3,.4),tc=R.txt(gnd,R.ink,3),t=elText(E,word,tf,CW/2,CH*.52,CW-m,bt,tc,{ls:0,lh:85});if(R.lo(tc,[inks[0]])>=1.6)t.bl=bl;out.texts.push(t);
  out.texts.push(elText(E,sub,sf,CW/2,CH-m-S*.04,CW-2*m,S*.04,R.txt(gnd,R.ink),{ls:E.pick([10,16,24])}));out.tex=E.ch(.45)?rzPaper(E):'';out.grade=E.pick(['punch','none']);out.top=null;return out}
 const al=E.pick(['l','l','c']),tx=CW/2,ty=typeTop?m+th/2:CH-m-tH+th/2;out.texts.push(elText(E,ti,tf,tx,ty,CW-2*m,th,ink,{al,ls:E.pick([0,2,4]),...(rzHas(tf,'b')?rzSty(ti,'b'):{})}));
 out.texts.push(elText(E,sub,sf,tx,ty+th/2+S*.045,CW-2*m,S*.035,R.txt(gnd,R.acc[0]),{al,ls:E.pick([8,14,20])}));
 out.tex=E.ch(.45)?rzPaper(E):'';out.grade=E.pick(['punch','none','none']);out.top=E.ch(.3)?rzQfx('noise',{amt:E.ri(5,11),sz:E.ri(10,22)},E):null;return out}};

// Sunburst: a retro sign. Layouts: Rays (a ring of rays round an emblem), Sunset (a striped half sun on a horizon), Rainbow (arcs of colour), with a script title on a band
RZL.sun={w:.9,build(E){const R=E.roles,S=Math.min(CW,CH),out={tiles:[],els:[],texts:[]},lay=E.pick(['rays','rays','sunset','rainbow']),cx=CW/2,mains=rzPool(E,'sun',2),[ti,sub]=E.pick(RZW.sun),tf=rzFont(E,RZF.sun[0]),sf=rzFont(E,RZF.sun[1]);
 const gnd=rzGround(E,out,E.pick(['glow','glow','flat','tonal']));if(lay!='sunset'&&E.ch(.8))rzField(E,out,{look:'sun',ms:[rzSmall(E)]});const cs=[...R.acc,R.ink].filter(c=>R.lo(c,gnd)>=1.3),th=S*E.rr(.13,.17);if(!cs.length)cs.push(R.ink);let cy,fs,ty;
 // the rays reach about 1.07 times the emblem's size from its middle; the emblem, its rays and the two lines of words are centred as one block
 if(lay=='rays'){const m=S*.05;fs=Math.min(CW*.46,(CH-2*m-1.95*th)/2.14)*E.rr(.85,1);const ro=fs*1.07;cy=(CH-(2*ro+1.95*th))/2+ro;const rc=cs[0],rk=basicKey(E.pick(['tri','tri','dia','rect']));const nr=E.pick([16,20,24,32]),rd=fs*1.6;rzRing(E,out,cx,cy,rd,[rk],rc,{mc:nr,sz:Math.min(300,Math.round(fs*.55/(Math.PI*rd/nr)*100*1.5)),rt:0,look:{wx:+E.rr(.2,.32).toFixed(2),wy:1}});
  if(E.ch(.35))rzRing(E,out,cx,cy,fs*2.3,[basicKey(E.pick(['ellipse','star']))],cs[1]||rc,{mc:E.pick([24,32,40]),sz:E.ri(25,40)});
  const t=rzTile(E,out.tiles.length+1,rzSh('circle'),E.pick(['center','emblem','star']),mains,[rzSmall(E)],R.txt(gnd,R.ink));out.tiles.push(t);out.els.push(addFx(elStamp(t,cx,cy,fs,0),rzInkFx(E,R,['none','halftone','misreg'])));ty=cy+ro+th*.62}
 else if(lay=='sunset'){cy=CH*E.rr(.42,.48);fs=Math.min(CW*.8,CH*.5);const sc=cs[0],hz=cy+fs*E.rr(.05,.15),pat=E.FT.pat&&E.ch(.6),sun=addFx(elBox('ellipse',cx,cy,fs,fs,{ink:sc,nm:'Sun'}),!pat&&E.ch(.4)?rzQfx('halftone',{sz:E.ri(16,28),tone:E.ri(45,60),ang:45,spr:E.ri(25,45)},E):null);out.els.push(sun);
  if(pat){const pc=rzMix(sc,R.light,.35);rzInside(E,out,sun,{n:'Sun pattern',src:[rzSrc(E,out,rzSmall(E),pc)],ps:E.rr(3,5.5),sp:E.ri(30,90),quiet:true,pc:0})}
  const n=E.ri(4,6);for(let i=0;i<n;i++){const y=cy-fs*.08+i*(hz-cy+fs*.08)/n,h=fs*(.012+.014*i);out.els.push(elRule(cx,y,fs*1.02,h,gnd[0],'Stripe'))}
  out.els.push(elBox('rect',cx,(hz+CH)/2,CW,CH-hz,{ink:R.blk(gnd,1.2,[sc]),nm:'Ground'}));if(E.ch(.6))out.els.push(addFx(elMotif(E.pick(mains),cx,hz-fs*.12,fs*.32,{ink:R.txt([sc],R.ink,2)}),null));ty=hz+(CH-hz)*.38}
 else{cy=CH*.5;fs=Math.min(CW*.92,CH*.6);const n=Math.min(4,Math.max(3,cs.length+1)),bw=fs*.07;for(let i=0;i<n;i++){const d=fs*(1-i*.16);out.els.push(elBox('ellipse',cx,cy,d,d,{fl:'none',sw:rzF(bw),sk:cs[i%cs.length],nm:'Arc'}))}
  out.els.push(elBox('rect',cx,(cy+CH)/2+bw*.5,CW,CH-cy,{ink:gnd[gnd.length-1],nm:'Ground'}));[-1,1].forEach(s=>{const x=cx+s*fs*.42,y=cy+fs*.01,cc=R.lo(R.light,gnd)>=1.25?R.light:rzMix(R.light,'#ffffff',.6);[[-.07,.02,.13],[.0,-.025,.16],[.075,.02,.12]].forEach(([dx,dy,d])=>out.els.push(elBox('ellipse',x+dx*fs,y+dy*fs,d*fs,d*fs,{ink:cc,nm:'Cloud'})));out.els.push(elBox('rect',x,y+fs*.06,fs*.27,fs*.06,{ink:cc,nm:'Cloud'}))});ty=cy+S*.12}
 // the title sits on a highlight band, or on a brush swash (a Paint stroke), or on the ground; its colour reads against what is behind it
 const band=E.ch(.5),swash=!band&&E.ch(.6),bc=band||swash?R.blk(gnd,1.5,[cs[0]]):'',tc=R.txt(bc?[bc]:gnd,R.ink);
 if(swash){const P={u:fpU(),k:'paint',n:'Swash',x:0,y:0,st:[{u:fpU(),c:bc,w:rzF(th*.75),pts:[[cx-CW*.34,ty+th*.15],[cx-CW*.1,ty-th*.05],[cx+CW*.12,ty+th*.05],[cx+CW*.34,ty-th*.1]].map(p=>p.map(rzF))}]};out.els.push(addFx(P,rzWear(E,E.ri(20,35))))}
 out.texts.push(elText(E,ti,tf,cx,ty,CW*.84,th,tc,{cv:E.pick([0,10,16]),...(band?rzSty(ti,'','',bc):{}),...(E.ch(.25)?{pt:'w',pa:E.ri(20,45)}:{})}));out.texts.push(elText(E,sub,sf,cx,ty+th*.95,CW*.5,th*.3,R.txt(gnd,R.acc[0]),{ls:16}));
 out.tex=E.ch(.6)?rzPaper(E):'';out.grade='warm';out.top=E.ch(.4)?rzQfx('grain',{amt:E.ri(15,30),sz:E.ri(15,30),soft:E.ri(20,50)},E):null;return out}};

// Quilt: rolled square blocks set as a quilt. Layouts: Blocks (two blocks turned, pinwheeled, mirrored), Sashing (blocks with strips between), Medallion (a centre block in a
// border of small ones), with a binding round the edge and sometimes a label
RZL.quilt={w:.8,need:'pat',build(E){const R=E.roles,S=Math.min(CW,CH),m=S*E.rr(.04,.06),out={tiles:[],els:[],texts:[]},lay=E.pick(['blocks','blocks','sashing',...(CH>=CW*.9?['medallion']:[])]),mains=rzPool(E,'quilt',3);
 const gnd=rzGround(E,out,'flat'),c1=R.txt(gnd,R.ink),c2=R.blk(gnd,1.8,[c1]),a=rzTile(E,1,rzSh('rect'),E.pick(['quad','mirror','center','star']),mains,[rzSmall(E)],c1,{edge:E.ch(.6),c2:E.ch(.4)?c2:''}),b=rzTile(E,2,rzSh('rect'),E.pick(['center','rosette','quad']),mains,[rzSmall(E)],c2,{edge:E.ch(.6)});out.tiles.push(a,b);
 // a patch of cloth: a block printed solid with its motifs carved out (Invert), so the quilt reads as coloured squares
 if(E.ch(.6)){a.neg=true;a.items.forEach(q=>delete q.ic)}if(E.ch(.4))b.neg=true;
 const iw=CW-2*m*1.8,ih=CH-2*m*1.8;
 if(lay=='medallion'){const nc=E.pick([5,7]),cell=Math.min(iw/nc,ih/Math.round(ih/(iw/nc))),nr=Math.max(3,Math.floor(ih/cell));const p=rzGrid('Quilt',[{k:'stamp',t:2,w:1}],CW/2,CH/2,nc,nr,cell,E.rr(.86,.96),{ar:'turn'});p.src=[{k:'stamp',t:2,w:1}];out.els.push(p);
  const cd=Math.min(nc-2,nr-2)*cell*.94;out.els.push(elBox('rect',CW/2,CH/2,cd*1.04,cd*1.04,{ink:R.paper,nm:'Centre'}));out.els.push(addFx(elStamp(a,CW/2,CH/2,cd*.92,0),E.ch(.5)?fxP(E.ri(1,3),0):null))}
 else{const nc=E.ri(3,6),cell=Math.min(iw/nc,ih/Math.max(3,Math.round(ih/(iw/nc)))),nr=Math.max(3,Math.floor(ih/cell)),sash=lay=='sashing',p=rzGrid('Quilt',[{k:'stamp',t:1,w:1},{k:'stamp',t:2,w:1}],CW/2,CH/2,nc,nr,cell,sash?E.rr(.8,.88):1,{ar:E.pick(['turn','pinwheel','mirror','basket','checker','grid'])});
  if(E.ch(.5)){p.pcm=RZ_CLS.includes(p.ar)&&E.ch(.6)?'place':'random';p.pcc=rzInks(E,gnd,4);rzOneEdge(out,p)}if(!E.tile&&E.ch(.4))p.iv=E.ri(10,25);
  if(sash){out.els.push(elBox('rect',CW/2,CH/2,nc*cell,nr*cell,{ink:R.blk(gnd,1.25,[c1,c2]),nm:'Sashing'}))}out.els.push(p)}
 out.els.push(elFrame(m*.9,m*.9,R.blk(gnd,2,[]),'Binding'));if(E.ch(.4))out.els.push(elFrame(m*1.6,Math.max(1,S*.003),c1,'Rule',{}));
 if(E.ch(.3)){const [ti,sub]=E.pick(RZW.quilt),lw=S*.36,lh=S*.12,lx=CW-m*2-lw/2,ly=CH-m*2-lh/2;out.els.push(elBox('rect',lx,ly,lw,lh,{ink:R.light,nm:'Label'}));out.texts.push(elText(E,ti,rzFont(E,RZF.quilt[0]),lx,ly-lh*.12,lw*.84,lh*.5,R.txt([R.light],R.ink)));out.texts.push(elText(E,sub,rzFont(E,RZF.quilt[1]),lx,ly+lh*.28,lw*.7,lh*.16,R.txt([R.light],R.acc[0]),{ls:10}))}
 out.tex=E.pick(['linen','canvas','cotton','felt']);out.grade=E.pick(['fade','warm','none']);out.top=null;return out}};

// (A whole Pattern gets no Pressure offset or Texture effect: every placement would then be drawn on its own, millions of characters of markup. The stamps' block edges
// and the canvas texture give the printed feel.)
// Repeat: a seamless all-over pattern, like wallpaper or cloth. Layouts: Wallpaper (one stamp in a half drop, brick, turned or mirrored set, with a small filler between),
// Pair (two stamps alternating), Stripe (rows of motifs between bands), Toile (scattered motifs in one ink, turned this way and that)
// On a repeat tile (E.tile) the bands of Stripe would meet at the tile's edges out of step, so Stripe is not used there
RZL.repeat={w:1.4,need:'pat',tile:1,build(E){const R=E.roles,S=Math.min(CW,CH),out={tiles:[],els:[],texts:[]},lay=E.pick(['wallpaper','wallpaper','pair',...(E.tile?[]:['stripe','scatter']),'toile','damask','wall','wall','cloth','scale']),mains=rzPool(E,'repeat',3);
 const gnd=rzGround(E,out,E.pick(['flat','flat','flat','tonal'])),c1=R.txt(gnd,R.blk(gnd,2.4),2.4),c2=R.blk(gnd,1.6,[c1]),shk=E.pick(['rect','rect','circle','hex','diamond']);
 if(lay=='wallpaper'||lay=='pair'){const a=rzTile(E,1,rzSh(shk),E.pick(['center','center','rosette','quad','mirror','star','emblem']),mains,[rzSmall(E)],c1,{edge:E.ch(.35),c2:E.ch(.4)?c2:''});out.tiles.push(a);const src=[{k:'stamp',t:1,w:1}];
  if(lay=='pair'){const b=rzTile(E,2,rzSh(shk),E.pick(['center','rosette','grid']),mains,[rzSmall(E)],c2,{edge:a.et>0});out.tiles.push(b);src.push({k:'stamp',t:2,w:1})}
  const ts={rect:'square',circle:'circle',hex:'hex',diamond:'diamond'}[shk],ar=E.pick((TL_AR[ts]||[['grid']]).map(x=>x[0]).filter(x=>lay=='pair'||!['checker','diag','three','harl','rows'].includes(x))),p=patOf('Pattern',[],'tile',4,4,100,[],1);
  Object.assign(p,{src,ts,ar,ps:+E.rr(14,26).toFixed(1),sp:E.ri(0,lay=='pair'?8:45),ds:'cycle',af:1});
  // 2.78.0: each piece its own ink, by place or at random, and its own pressure, now and then
  if(E.ch(.35)){const ik=rzInks(E,gnd,4);if(ik.length>1){p.pcm=RZ_CLS.includes(ar)?'place':E.tile?'':'random';if(p.pcm){p.pcc=ik;rzOneEdge(out,p)}else delete p.pcm}}if(!E.tile&&E.ch(.3))p.iv=E.ri(10,30);out.els.push(p);
  // a small filler between the pieces of a square lattice: the same step, half a step over and down; its piece is half a step, the shape a third of that
  if(ts=='square'&&['grid','turn','mirror','pinwheel','basket'].includes(ar)&&+p.sp>=15&&E.ch(.65)){const f=patOf('Filler',[],'tile',4,4,100,[],1),z=+E.rr(.22,.34).toFixed(2);
   Object.assign(f,{src:[{k:'motif',m:rzSmall(E),w:1,ink:c2,wx:z,wy:z}],ts,ar:'grid',ps:+(p.ps*(1+p.sp/100)/2).toFixed(3),sp:100,ox:50,oy:50,ds:'cycle',af:1});out.els.push(f)}}
 else if(lay=='stripe'){const n=2*E.ri(3,5)-1,bh=CH/n,ms=mains;for(let i=0;i<n;i++){const y=(i+.5)*bh;if(i%2==0){const nc=Math.max(4,Math.round(CW/(bh*.62))),c=i%4==0?c1:c2;out.els.push(rzGrid('Row '+(i/2+1),[rzSolo(E,out,ms[(i/2)%ms.length],c)],CW/2,y,nc,1,CW/nc,E.rr(.7,.86)))}
   else{out.els.push(elRule(CW/2,y,CW,bh*E.rr(.12,.3),R.blk(gnd,1.3,[]),'Band'));if(E.ch(.6)){out.els.push(elRule(CW/2,y-bh*.3,CW,Math.max(.8,S*.003),c1,'Band'));out.els.push(elRule(CW/2,y+bh*.3,CW,Math.max(.8,S*.003),c1,'Band'))}}}}
 // Toile: a half-drop lattice wide apart, each place a random one of the motifs, turned and shifted a little (Jitter), so it looks scattered but stays even
 else if(lay=='toile'){const p=patOf('Toile',[],'tile',4,4,100,[],E.ri(1,9999));Object.assign(p,{src:mains.map(m=>rzSolo(E,out,m,c1)),ts:'square',ar:'half',ps:+E.rr(11,16).toFixed(1),sp:E.ri(55,95),ds:'random',af:1});out.els.push(addFx(p,fxJ(E.ri(12,25),E.ri(15,45),E.ri(5,20))))}
 // 2.78.0 Wall: one or two motifs in a wallpaper symmetry (turned, mirrored and glided copies), in the inks piece by piece now and then
 else if(lay=='wall'){const src=[rzSrc(E,out,mains[0],c1)];if(mains[1]&&E.ch(.4))src.push(rzSrc(E,out,mains[1],c2));out.els.push(rzPat(E,out,{n:'Pattern',src,inks:rzInks(E,gnd,4),lays:['wall'],ps:E.rr(9,18),sp:E.ri(0,25),pc:.4}))}
 // Cloth: motifs in stripes, bands, chevrons or herringbone, the colour by place
 else if(lay=='cloth'){const src=mains.slice(0,E.ri(1,2)).map((m,i)=>rzSrc(E,out,m,i?c2:c1));out.els.push(rzPat(E,out,{n:'Pattern',src,inks:rzInks(E,gnd,4),lays:['tile'],ts:'square',ar:E.pick(['stripes','bands','chevron','herring']),ps:E.rr(6,12),sp:E.ri(5,40),pc:.8}))}
 // Scales: fish scales or an ogee of one stamp, its places in turn coloured now and then
 else if(lay=='scale'){const og=E.ch(.5),a=rzTile(E,1,rzSh(og?'diamond':'circle'),E.pick(['center','rosette','star']),mains,[rzSmall(E)],c1,{edge:E.ch(.4)});out.tiles.push(a);
  out.els.push(rzPat(E,out,{n:'Pattern',src:[{k:'stamp',t:1,w:1}],inks:rzInks(E,gnd,3),lays:['tile'],ts:og?'diamond':'circle',ar:og?'ogee':'scale',ps:E.rr(12,22),sp:E.ri(0,10),pc:.45}))}
 // Scatter: motifs set at random but never touching, each turned (in steps now and then) and in its own colour
 else if(lay=='scatter'){out.els.push(rzPat(E,out,{n:'Pattern',src:mains.map((m,i)=>rzSrc(E,out,m,i%2?c2:c1)),inks:rzInks(E,gnd,4),lays:['scatter'],pc:.7}))}
 // Damask: one large stamp in a tone of the paper, and a small motif in the ink between its places
 else{const a=rzTile(E,1,rzSh(E.pick(['diamond','circle','hex','rect'])),E.pick(['rosette','star','quad','mirror']),rzPool(E,'orn',3),[rzSmall(E)],R.tone(E.rr(.12,.2)),{edge:false});out.tiles.push(a);
  const ts={rect:'square',circle:'circle',hex:'hex',diamond:'diamond'}[a.sh.k],p=patOf('Damask',[],'tile',4,4,100,[],1);Object.assign(p,{src:[{k:'stamp',t:1,w:1}],ts,ar:(TL_AR[ts]||[['grid']])[0][0],ps:+E.rr(34,48).toFixed(1),sp:E.ri(0,10),ds:'cycle',af:1});out.els.push(p);
  const f=patOf('Sprig',[],'tile',4,4,100,[],E.ri(1,9999));Object.assign(f,{src:[rzSolo(E,out,E.pick(mains),c1)],ts:'square',ar:'half',ps:+(p.ps*.22).toFixed(2),sp:E.ri(160,200),ds:'cycle',af:1,ox:50,oy:50});out.els.push(addFx(f,E.ch(.5)?fxJ(0,E.ri(10,30),0):null))}
 out.tex=E.ch(.7)?rzPaper(E):'';out.grade=E.pick(['fade','warm','none','none']);return out}};

// ===== 2.78.0: Looks made of patterns first (owner Oct 30 2026). Each is mostly Pattern elements, using the tools of the 2.76 pattern plan.
// Textile: a length of printed cloth. Layouts: Stripes, Bands, Gingham (a checkerboard of two inks overprinted), Chevron, Herringbone, Basketweave, in colour by place,
// sometimes with a sprig of small motifs over it, and on the canvas (not a repeat tile) now and then a woven label
RZL.textile={w:1,need:'pat',tile:1,build(E){const R=E.roles,S=Math.min(CW,CH),out={tiles:[],els:[],texts:[]},ar=E.pick(['stripes','bands','checker','checker','chevron','herring','basket']);
 const gnd=rzGround(E,out,'flat'),inks=rzInks(E,gnd,4),rk=basicKey('rect'),sq=!!rk&&E.ch(.65),pool=rzPool(E,'textile',3);
 const src=[sq?{k:'motif',m:rk,w:1,ink:inks[0]}:rzSrc(E,out,pool[0],inks[0])],two=inks.length>1?inks:[inks[0],R.tone(.35)];
 const p=rzPat(E,out,{n:'Cloth',src,inks:two,lays:['tile'],ts:'square',ar,ps:E.rr(sq?4.5:7,sq?8:13),sp:sq?0:E.ri(5,30),pc:1,quiet:true});if(p.pcm)p.pcm='place';   // stripes and checks by place: random squares read as noise
 if(sq&&ar=='checker'&&!E.tile){p.ov=1;p.iv=E.ri(8,22)}   // gingham: the checks overprint as woven threads do
 out.els.push(p);
 if(E.ch(sq?.55:.3)){const c=R.txt(two,R.paper,1.6);out.els.push(rzPat(E,out,{n:'Sprig',src:[rzSrc(E,out,pool[1]||rzSmall(E),c)],lays:['tile'],ts:'square',ar:E.pick(['half','brick','grid']),ps:E.rr(3,7),sp:E.ri(120,260),quiet:true,pc:0}))}
 if(!E.tile&&E.ch(.3)){const [ti,sub]=E.pick(RZW.textile),lw=S*.36,lh=S*.13,lx=CW-S*.07-lw/2,ly=CH-S*.07-lh/2,lc=R.light,tc=R.txt([lc],R.ink);out.els.push(elBox('rect',lx,ly,lw,lh,{ink:lc,nm:'Label'}));out.els.push(elBox('rect',lx,ly,lw*.93,lh*.82,{fl:'none',sw:rzF(Math.max(1,S*.003)),sk:tc,nm:'Rule'}));
  out.texts.push(elText(E,ti,rzFont(E,RZF.textile[0]),lx,ly-lh*.1,lw*.8,lh*.4,tc));out.texts.push(elText(E,sub,rzFont(E,RZF.textile[1]),lx,ly+lh*.24,lw*.72,lh*.16,tc,{ls:10}))}
 out.tex=E.pick(['linen','canvas','cotton','felt']);out.grade=E.pick(['fade','warm','none']);return out}};

// Tilework: glazed tiles. Layouts: Tiles (a symmetric stamp with a block edge on a square, hexagon or diamond grid, turned or mirrored, each tile its own glaze, a
// small accent where the corners meet), Wallpaper (one motif in a wallpaper symmetry), Border (a field of whole tiles inside a border of small plain ones)
RZL.tilework={w:1,need:'pat',tile:1,build(E){const R=E.roles,S=Math.min(CW,CH),out={tiles:[],els:[],texts:[]},lay=E.pick(['tiles','tiles','wall',...(E.tile?[]:['border'])]),mains=rzPool(E,'tilework',3);
 const gnd=rzGround(E,out,'flat'),inks=rzInks(E,gnd,4),c1=inks[0];
 if(lay=='wall')out.els.push(rzPat(E,out,{n:'Tiles',src:[rzSrc(E,out,E.pick(mains),c1)],inks,lays:['wall'],ps:E.rr(9,16),sp:E.ri(0,15),pc:.5}));
 else{const shk=E.pick(['rect','rect','hex','diamond']),a=rzTile(E,1,rzSh(shk),E.pick(['rosette','star','quad','mirror','center']),mains,[rzSmall(E)],c1,{edge:true,c2:E.ch(.4)?inks[1]||'':''});out.tiles.push(a);
  const ts={rect:'square',hex:'hex',diamond:'diamond'}[shk],ar=ts=='square'?E.pick(['grid','grid','turn','pinwheel','mirror','checker']):ts=='hex'?E.pick(['honey','three']):E.pick(['harl','dgrid']),bd=lay=='border'?S*.06:0;
  const p=rzPat(E,out,{n:'Tiles',src:[{k:'stamp',t:1,w:1}],inks:inks.length>1?inks:null,lays:['tile'],ts,ar,ps:E.rr(12,24),sp:E.ri(3,9),pc:.65,quiet:E.tile,acc:{k:'motif',m:rzSmall(E),w:1,ink:R.txt(gnd,inks[1]||c1)},box:bd?{x:CW/2,y:CH/2,w:CW-4*bd,h:CH-4*bd}:null});
  if(bd){p.ed='whole';delete p.mg}out.els.push(p);if(bd)out.els.push(rzBorder(E,out,bd,[basicKey('rect')||rzSmall(E)],inks[1]||c1,'Border'))}
 out.tex=E.ch(.5)?rzPaper(E):'';out.grade=E.pick(['punch','fade','none']);return out}};

// Halftone: a picture made only of pieces that grow and shrink across the canvas (density): a fade, a glow from the middle out, or two screens in two inks
// overprinted; sometimes a title on a band of the paper
RZL.halftone={dark:1,w:.9,need:'pat',build(E){const R=E.roles,S=Math.min(CW,CH),m=S*.07,out={tiles:[],els:[],texts:[]},lay=E.pick(['fade','glow','duo','duo']);
 const gnd=rzGround(E,out,'flat'),inks=rzInks(E,gnd,3),dot=E.ch(.6)?basicKey(E.pick(['ellipse','ellipse','star','dia','hex','heart'])):E.pick(rzPool(E,'halftone',3)),duo=lay=='duo',ps=E.rr(duo?5.2:4.4,duo?7:6.2),sp=E.ri(20,45);
 // a screen: the dot on a grid or honeycomb, sized by the density; a stamp holds the dot so each place is a reference
 const one=(ink,o)=>{const p=rzPat(E,out,{n:o.n,src:[rzSolo(E,out,dot,ink)],lays:['tile'],ts:o.ts,ar:o.ts=='hex'?'honey':'grid',ps:o.ps||ps,sp,quiet:true,pc:0,max:duo?300:450});p.dm=o.dm;if(o.dm=='lin')p.dg=o.dg;else delete p.dg;p.dv=E.ri(85,100);p.dk='size';if(o.di)p.di=1;else delete p.di;return p};
 if(lay=='fade')out.els.push(one(inks[0],{n:'Screen',dm:'lin',dg:E.pick([0,45,90,135,180,270]),ts:E.pick(['square','hex'])}));
 else if(lay=='glow')out.els.push(one(inks[0],{n:'Screen',dm:'rad',di:E.ch(.5),ts:E.pick(['square','hex'])}));
 else{const a=one(inks[0],{n:'Screen 1',dm:'lin',dg:E.pick([0,45,90]),ts:'square'}),b=one(inks[1]||R.acc[0]||R.ink,{n:'Screen 2',dm:E.pick(['lin','rad']),dg:E.pick([180,225,270]),ts:'hex',ps:ps*E.rr(.8,1.2)});b.ov=1;out.els.push(a,b)}
 if(E.ch(.55)){const [ti,sub]=E.pick(RZW.halftone),th=S*E.rr(.1,.14),top=E.ch(.4),ty=top?m+th/2:CH-m-th*.9,bc=R.paper;out.els.push(elBox('rect',CW/2,ty+th*.18,CW,th*2.2,{ink:bc,nm:'Band'}));
  out.texts.push(elText(E,ti,rzFont(E,RZF.halftone[0]),CW/2,ty,CW-2*m,th,R.txt([bc],R.ink),{ls:tw(E,ti)}));out.texts.push(elText(E,sub,rzFont(E,RZF.halftone[1]),CW/2,ty+th*.78,(CW-2*m)*.6,th*.26,R.txt([bc],R.acc[0]),{ls:E.pick([10,16])}))}
 out.tex=E.ch(.5)?rzPaper(E):'';out.grade=E.pick(['punch','none','fade']);out.top=E.ch(.3)?rzQfx('grain',{amt:E.ri(10,20),sz:E.ri(15,30),soft:E.ri(20,50)},E):null;return out}};

// Mandala: rings of pieces round the middle of the canvas. Layouts: Rings (rings of different motifs in turn, round a stamp emblem), Sunflower (a spiral of pieces
// inside a disc, ringed), Rose (a radial pattern inside a disc, ringed); sometimes a title under it
RZL.mandala={dark:1,w:.9,need:'pat',build(E){const R=E.roles,S=Math.min(CW,CH),out={tiles:[],els:[],texts:[]},lay=E.pick(['rings','rings','sunflower','rose']),mains=rzPool(E,'mandala',4);
 const gnd=rzGround(E,out,E.pick(['flat','glow','glow'])),inks=rzInks(E,gnd,4),cx=CW/2,cy=CH/2,txt=CH>CW*1.15&&E.ch(.5),D=Math.min(CW*.94,CH*(txt?.62:.94)),nr=lay=='rings'?E.ri(3,5):E.ri(1,3),lw=Math.max(1,S*.003);
 for(let i=0;i<nr;i++){const d=D*(1-i*.16),mk=i%2?rzSmall(E):mains[i%mains.length],c=inks[i%inks.length],pcs=Math.min(56,Math.max(12,Math.round(Math.PI*d/(S*E.rr(.065,.1)))));
  rzRing(E,out,cx,cy,d*.92,[mk],c,{mc:pcs,sz:E.ri(35,70),n:'Ring '+(i+1)});if(E.ch(.35))out.els.push(elBox('ellipse',cx,cy,d*.82,d*.82,{fl:'none',sw:rzF(lw),sk:c,nm:'Ring'}))}
 const di=D*(1-nr*.16)*.95;
 if(lay=='rings'){const t=rzTile(E,out.tiles.length+1,rzSh('circle'),E.pick(['rosette','star','emblem']),mains,[rzSmall(E)],R.txt(gnd,R.ink));out.tiles.push(t);out.els.push(addFx(elStamp(t,cx,cy,di,0),rzInkFx(E,R,['none','none','halftone','misreg'])))}
 else{const dc=R.blk(gnd,1.4,[]),disc=elBox('ellipse',cx,cy,di,di,{ink:dc,nm:'Disc'});out.els.push(disc);const pc=R.txt([dc],R.paper,1.8);
  const p=rzInside(E,out,disc,{n:'Middle',src:[rzSrc(E,out,lay=='rose'?E.pick(mains):rzSmall(E),pc)],inks:[pc,...inks.filter(c=>R.lo(c,[dc])>=1.6)],lays:[lay=='rose'?'radial':'spiral'],quiet:true});
  if(p&&lay=='rose'){p.cn=E.ri(6,9);p.rn=E.ri(4,7)}}
 if(txt){const [ti,sub]=E.pick(RZW.sun),th=S*E.rr(.09,.12),ty=cy+D/2+(CH-cy-D/2)*.42;out.texts.push(elText(E,ti,rzFont(E,RZF.plate[0]),cx,ty,CW*.8,th,R.txt(gnd,R.ink),{ls:E.pick([4,8])}));out.texts.push(elText(E,sub,rzFont(E,RZF.plate[1]),cx,ty+th*.85,CW*.5,th*.3,R.txt(gnd,R.acc[0]),{ls:12}))}
 out.tex=E.ch(.5)?rzPaper(E):'';out.grade=E.pick(['warm','fade','none']);return out}};

// Pattern type: one big word with its letters filled by a pattern (Inside, over the letters), on a quiet field, a second line under it
RZL.letters={dark:1,w:.9,need:'pat',build(E){const R=E.roles,S=Math.min(CW,CH),m=S*E.rr(.06,.08),out={tiles:[],els:[],texts:[]};
 const gnd=rzGround(E,out,E.pick(['flat','flat','tonal'])),inks=rzInks(E,gnd,4),[ti,sub]=E.pick(RZW.letters),nm=rzName(),word=(nm&&E.ch(.2)?nm:ti).toUpperCase().slice(0,14),tf=rzFont(E,RZF.letters[0]),sf=rzFont(E,RZF.letters[1]);
 if(E.ch(.6))rzField(E,out,{look:'letters'});
 const lines=word.includes(' ')&&E.ch(.7)?word.replace(/ /,'\n'):word,nl=lines.split('\n').length,tw0=CW-2*m,th=Math.min(CH*.62,tw0*(nl>1?.42:.34)*nl),ty=CH*E.rr(.42,.48);
 const ink=R.txt(gnd,R.blk(gnd,2.2),2),t=elText(E,lines,tf,CW/2,ty,tw0,th,ink,{lh:E.pick([85,92]),ls:E.pick([0,2,4])});out.texts.push(t);
 const pc=R.txt([ink],R.paper,1.8),p=rzPat(E,out,{n:'Letters',src:[rzSrc(E,out,E.ch(.5)?rzSmall(E):E.pick(rzPool(E,'letters',3)),pc)],inks:[pc,...inks.filter(c=>c!==ink&&R.lo(c,[ink])>=1.6)],lays:['tile','tile','wall','scatter'],ps:E.rr(2.2,4),sp:E.ri(45,110),pc:.5,quiet:true,max:320,pin:t.u,box:{x:CW/2,y:ty,w:tw0,h:th}});
 p._post=1;out.els.push(p);
 out.texts.push(elText(E,sub,sf,CW/2,Math.min(CH-m,ty+th/2+S*.07),tw0*.7,S*.04,R.txt(gnd,R.acc[0]||R.ink),{ls:E.pick([10,16,24])}));
 out.tex=E.ch(.5)?rzPaper(E):'';out.grade=E.pick(['punch','none','fade']);return out}};

// Confetti: pieces scattered without overlapping, each its own colour and turn, sometimes thinning out across the canvas; now and then a label in the middle
RZL.confetti={dark:1,w:.9,need:'pat',build(E){const R=E.roles,S=Math.min(CW,CH),out={tiles:[],els:[],texts:[]};
 const gnd=rzGround(E,out,E.pick(['flat','flat','glow'])),inks=rzInks(E,gnd,4),ks=E.shuf(['ellipse','rect','tri','star','dia','heart','hex']).slice(0,E.ri(2,4)).map(basicKey).filter(Boolean),th=E.ch(.4)?[E.pick(rzPool(E,'confetti',3))]:[];
 const two=inks.length>1?inks:[inks[0],R.tone(.4)],p=rzPat(E,out,{n:'Confetti',src:[...ks,...th].map(k=>rzSrc(E,out,k,two[0])),inks:two,lays:['scatter'],pc:1});p.cn=E.ri(7,11);p.rn=E.ri(9,14);p.sz=E.ri(30,55);p.md=E.ri(70,100);
 if(E.FT.jit&&!(p.fx||[]).some(e=>e.k=='jitter')){const j=fxJ(0,E.ri(20,60),E.ri(10,30));if(E.ch(.4))j.rs=90;addFx(p,j)}out.els.push(p);
 if(E.ch(.45)){const [ti,sub]=E.pick(RZW.confetti),lw=Math.min(CW*.7,S*.8),lh=lw*E.rr(.36,.46),k=E.pick(['rect','rect','ellipse']),lc=R.paper,tc=R.txt([lc],R.ink);out.els.push(elBox(k,CW/2,CH/2,lw,lh,{ink:lc,nm:'Label'}));
  out.els.push(elBox(k,CW/2,CH/2,lw*.93,lh*.86,{fl:'none',sw:rzF(Math.max(1,S*.004)),sk:tc,nm:'Rule'}));out.texts.push(elText(E,ti,rzFont(E,RZF.confetti[0]),CW/2,CH/2-lh*.08,lw*.8,lh*.4,tc,{ls:tw(E,ti)}));
  out.texts.push(elText(E,sub,rzFont(E,RZF.confetti[1]),CW/2,CH/2+lh*.24,lw*.6,lh*.12,R.txt([lc],R.acc[0]||R.ink),{ls:12}))}
 out.tex=E.ch(.4)?rzPaper(E):'';out.grade=E.pick(['punch','none']);return out}};

const RZ_NAMES={repeat:'Repeat',textile:'Textile',tilework:'Tilework',halftone:'Halftone',mandala:'Mandala',letters:'Pattern type',confetti:'Confetti',poster:'Poster',plate:'Book plate',badge:'Badge',specimen:'Specimen',modern:'Modern',sun:'Sunburst',quilt:'Quilt'},RZ_LOOKS=Object.keys(RZ_NAMES);
// the names of the frame elements a Look makes: the Frame switch leaves them out
const RZ_FRAME=['Frame','Rule','Binding','Border','Corner'];
// which Look a roll makes: the one chosen in the Randomize panel, or any by its weight. 2.76.3: only a Look whose parts are switched on (Repeat and Quilt are
// made of Patterns), and on a repeat tile only one that tiles (Repeat). '' when none fits: the roll then reworks what is there.
function rzLookPick(o){const ok=k=>RZL[k]&&!(RZL[k].need&&!o.FT[RZL[k].need])&&(!o.tile||RZL[k].tile),ks=Object.keys(RZL).filter(ok);if(!ks.length)return'';
 if(o.want&&o.want!='any'&&ok(o.want))return o.want;return o.wpick(ks.map(k=>[k,RZL[k].w]))}
// lay out the texts a Look asked for (fonts load first), and put the letters on the elements
async function rzLay(texts){const out=[];for(const q of texts){try{const R=await WBX.wbTxLay(q.tx);if(!R)continue;const n=Math.max(R.bw,R.bh);Object.assign(q,{G:R.G,Lt:R.Lt,bw:R.bw,bh:R.bh,n,s:+n.toFixed(2)});out.push(q)}catch(e){}}return out}
export {RZL,RZ_LOOKS,RZ_NAMES,RZ_FRAME,rzLookPick,rzLay,rzRoles,rzLum,rzCon,rzQfx,rzGrade};
