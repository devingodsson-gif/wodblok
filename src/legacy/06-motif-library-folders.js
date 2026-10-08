// ---- Library folders. Your folders hold imported and Claude-drawn motifs (moved in), and built-in motifs
// (added in: they also stay in their own set). Built-in sets can be renamed or hidden, never deleted.
WBS.FOLD=[];let BF={},HID=[],REN={},lsel=new Set(),lsm=false,lanc=null;WBS.fmode=null;
try{WBS.FOLD=JSON.parse(localStorage.getItem('wb16_fold')||'[]');BF=JSON.parse(localStorage.getItem('wb16_bf')||'{}');HID=JSON.parse(localStorage.getItem('wb16_hid')||'[]');REN=JSON.parse(localStorage.getItem('wb16_ren')||'{}')}catch(e){}
const fSave=()=>{try{localStorage.setItem('wb16_fold',JSON.stringify(WBS.FOLD));localStorage.setItem('wb16_bf',JSON.stringify(BF));localStorage.setItem('wb16_hid',JSON.stringify(HID));localStorage.setItem('wb16_ren',JSON.stringify(REN))}catch(e){}};
const mcSave=()=>{try{localStorage.setItem('wb11_mcat',mcat)}catch(e){}};
const fClean=v=>String(v||'').replace(/[\\"<>&|]/g,'').trim().slice(0,30);
const OK=new Set('path circle ellipse rect polygon polyline line g'.split(' '));
const AT=new Set('d cx cy r rx ry x y width height points transform fill stroke stroke-width stroke-linecap stroke-linejoin x1 y1 x2 y2 fill-rule opacity'.split(' '));
function clean(str){try{
const doc=new DOMParser().parseFromString('<svg xmlns="http://www.w3.org/2000/svg">'+str+'</svg>','image/svg+xml');
if(doc.querySelector('parsererror'))return null;let n=0;
const walk=el=>{let out='';for(const ch of el.children){const t=ch.tagName.toLowerCase();if(!OK.has(t))continue;let a='',hf=false,hs=false;
for(const at of ch.attributes){if(!AT.has(at.name))continue;let v=at.value.replace(/["<>]/g,'');if(v.length>900)continue;
if(at.name=='fill'||at.name=='stroke'){if(!['FILL','CUT','none'].includes(v))continue;if(at.name=='fill')hf=true;else hs=true}
a+=` ${at.name}="${v}"`}
if(!hf&&t!='g')a+=hs?' fill="none"':' fill="FILL"';n++;out+=`<${t}${a}>${walk(ch)}</${t}>`}return out};
const r=walk(doc.documentElement);return n&&n<90?r:null}catch(e){return null}}
const use=n=>window.claude?claude.use(n).catch(()=>null):Promise.resolve(null);
const it=(m,x,y,s=.8,r=0,f=1)=>({m,x,y,s,r,f});
let cust={},tiles=[{id:1,items:[it('b3',60,60,.9),it('b5',180,180,.9,0,-1),it('b9',180,60,.85),it('b1',60,180,.85)]},{id:2,items:[it('b11',120,120,1),it('b0',30,30,.5,45),it('b0',210,30,.5,-45),it('b0',30,210,.5,135),it('b0',210,210,.5,-135)]}];WBS.cur=0;let sel=-1;
let msel=new Set();
window.wbCur=()=>WBS.cur;
function selOne(i){sel=i;msel=new Set(i>=0?[i]:[])}
const DEF_TILES=JSON.stringify(tiles);
try{cust=JSON.parse(localStorage.getItem('wb2_cust')||'{}');Object.keys(cust).forEach(k=>{if(k.startsWith('i|')&&!/^<path d="[MLQZ0-9.,\- ]+" fill="FILL" fill-rule="evenodd"\/>$/.test((cust[k]||{}).svg||''))delete cust[k]});const t=JSON.parse(localStorage.getItem('wb2_tiles')||'null');if(t&&t.length)tiles=t}catch(e){}
try{const p=JSON.parse(localStorage.getItem('wb2_proj')||'null');if(p&&p.ink&&p.bg)proj={ink:fixC(p.ink,PCOL.ink),bg:fixC(p.bg,PCOL.bg)}}catch(e){}
let nid=1+Math.max(0,...tiles.map(t=>+t.id||0));{const used=new Set();tiles.forEach(t=>{if(!t.id||used.has(t.id))t.id=nid++;used.add(t.id)})}
const luid=()=>'l'+Math.random().toString(36).slice(2,9);
const mkL=(name,st,lay,size)=>({u:luid(),name,vis:true,st,lay,size,ox:0,oy:0,rot:0,pst:0,pfl:0});
let layers=null,selL=0;
try{const q=JSON.parse(localStorage.getItem('wb4_layers')||'null');if(q&&q.layers&&q.layers.length)layers=q.layers}catch(e){}
if(!layers)layers=[mkL('Layer 1',tiles.map(t=>t.id),'check',180)];
layers.forEach(L=>{L.st=(L.st||[]).filter(id=>tiles.some(t=>t.id==id));if(L.lay=='brick'){L.lay='cols';if(!L.grid)L.grid='brick'}if(L.fit===true)L.fit='h';else if(!L.fit)L.fit=''});selL=layers.length-1;
let _stT=0;const store=()=>{clearTimeout(_stT);_stT=setTimeout(store0,400)};addEventListener('pagehide',()=>{if(_stT){clearTimeout(_stT);store0()}});document.addEventListener('visibilitychange',()=>{if(document.hidden&&_stT){clearTimeout(_stT);store0()}});
const store0=()=>{_stT=0;try{localStorage.setItem('wb4_layers',JSON.stringify({layers}));localStorage.setItem('wb2_proj',JSON.stringify(proj));localStorage.setItem('wb2_cust',JSON.stringify(cust));localStorage.setItem('wb2_tiles',JSON.stringify(tiles))}catch(e){}};
const say=t=>$('msg').textContent=t;
const pal=()=>[col(proj.bg),col(proj.ink)];
const inkOf=t=>col(t.ink||proj.ink);
const cols=t=>{const b0=col(proj.bg),c0=inkOf(t);return t.neg?{bg:c0,c:b0,d:c0}:{bg:b0,c:c0,d:b0}};
const mk=(k,c,d)=>(k[0]=='b'?M[(+k.slice(1)||0)%M.length]:cust[k]?tk(cust[k].svg):M[0])(c,d);
