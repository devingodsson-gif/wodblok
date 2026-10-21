import {kv} from '../platform/index.js';
import {$,WBS,WBX} from './01-launch-and-version.js';
import {M,col,tk} from './04-canvas-and-stamp-outlines.js';
import {trayLive} from './50-tray-core.js';
let BF={};let REN={};let lsel;
const fSave=()=>{try{kv.set('wb16_fold',JSON.stringify(WBS.FOLD));kv.set('wb16_bf',JSON.stringify(BF));kv.set('wb16_hid',JSON.stringify(WBS.HID));kv.set('wb16_ren',JSON.stringify(REN))}catch(e){}};
const mcSave=()=>{try{kv.set('wb11_mcat',WBS.mcat)}catch(e){}};
const fClean=v=>String(v||'').replace(/[\\"<>&|]/g,'').trim().slice(0,30);
let OK;
let AT;
function clean(str){try{
const doc=new DOMParser().parseFromString('<svg xmlns="http://www.w3.org/2000/svg">'+str+'</svg>','image/svg+xml');
if(doc.querySelector('parsererror'))return null;let n=0;
const walk=el=>{let out='';for(const ch of el.children){const t=ch.tagName.toLowerCase();if(!OK.has(t))continue;let a='',hf=false,hs=false;
for(const at of ch.attributes){if(!AT.has(at.name))continue;let v=at.value.replace(/["<>]/g,'');if(v.length>900)continue;
if(at.name=='fill'||at.name=='stroke'){if(!['FILL','CUT','none'].includes(v))continue;if(at.name=='fill')hf=true;else hs=true}
a+=` ${at.name}="${v}"`}
if(!hf&&t!='g')a+=hs?' fill="none"':' fill="FILL"';n++;out+=`<${t}${a}>${walk(ch)}</${t}>`}return out};
const r=walk(doc.documentElement);return n&&n<90?r:null}catch(e){return null}}

const it=(m,x,y,s=.8,r=0,f=1)=>({m,x,y,s,r,f});
let cust={};
function selOne(i){WBS.sel=i;WBS.msel=new Set(i>=0?[i]:[])}
let DEF_TILES;
const luid=()=>'l'+Math.random().toString(36).slice(2,9);
const mkL=(name,st,lay,size)=>({u:luid(),name,vis:true,st,lay,size,ox:0,oy:0,rot:0,pst:0,pfl:0});
// The document is one ordered list of elements (format 23, owner Oct 20 2026); at run time WBS.layers is always exactly one free layer whose pl is that list.
// A layer that is hidden, faded, blended or inked becomes a group row holding its elements, so what it did to them is kept.
function flatEls(layers){const ls=Array.isArray(layers)?layers:[];const out=[];
 ls.forEach(L=>{const pl=(L.pl||[]).filter(q=>q&&typeof q=='object');if(!pl.length)return;const op=L.op!=null?+L.op:100,bl=L.bl&&L.bl!='behind'&&L.bl!='cancel'&&L.bl!='replace'?L.bl:'',ink=L.ink||'';
  if(L.vis!==false&&op>=100&&!bl&&!ink){out.push(...pl);return}
  const g={u:'g'+String(L.u||luid()),k:'group',n:String(L.name||'Group').slice(0,30),...(L.vis===false?{v:false}:{}),...(op<100?{op}:{}),...(bl?{bl}:{}),...(ink?{ink}:{})};pl.forEach(q=>out.push(q.g?q:{...q,g:g.u}));out.push(g)});   // the group row sits just after (above) its members, as the list expects
 return out}
const oneLayer=(els,st,u)=>{const n=mkL('Layer 1',st,'check',180);if(u)n.u=u;n.free=true;n.ak={};n.man=false;n.ov={};n.fit='';n.gap=0;n.pl=els;return n};
let _stT=0;const store=()=>{clearTimeout(_stT);_stT=setTimeout(store0,400)};
const store0=()=>{_stT=0;try{kv.set('wb4_layers',JSON.stringify({layers:WBS.layers}));kv.set('wb2_proj',JSON.stringify(WBS.proj));kv.set('wb2_cust',JSON.stringify(cust));kv.set('wb2_tiles',JSON.stringify(WBS.tiles))}catch(e){}};
const say=t=>{$('pmsg').textContent=t};
const pal=()=>[col(WBS.proj.bg),col(WBS.proj.ink)];
const inkOf=t=>col(t.ink||WBS.proj.ink);
const cols=t=>{const b0=col(WBS.proj.bg),c0=inkOf(t);return t.neg?{bg:c0,c:b0,d:c0}:{bg:b0,c:c0,d:b0}};
const mk=(k,c,d)=>(k[0]=='b'?M[(+k.slice(1)||0)%M.length]:cust[k]?tk(cust[k].svg):M[0])(c,d);
function init06(){// ---- Library folders. Your folders hold imported and Claude-drawn shapes (moved in), and built-in shapes
// (added in: they also stay in their own set). Built-in sets can be renamed or hidden, never deleted.
WBS.FOLD=[];WBS.HID=[];
lsel=new Set();WBS.lsm=false;WBS.lanc=null;WBS.fmode=null;
try{WBS.FOLD=JSON.parse(kv.get('wb16_fold')||'[]');BF=JSON.parse(kv.get('wb16_bf')||'{}');WBS.HID=JSON.parse(kv.get('wb16_hid')||'[]');REN=JSON.parse(kv.get('wb16_ren')||'{}')}catch(e){}
OK=new Set('path circle ellipse rect polygon polyline line g'.split(' '));
AT=new Set('d cx cy r rx ry x y width height points transform fill stroke stroke-width stroke-linecap stroke-linejoin x1 y1 x2 y2 fill-rule opacity'.split(' '));WBS.tiles=[{id:1,items:[it('b3',60,60,.9),it('b5',180,180,.9,0,-1),it('b9',180,60,.85),it('b1',60,180,.85)]},{id:2,items:[it('b11',120,120,1),it('b0',30,30,.5,45),it('b0',210,30,.5,-45),it('b0',30,210,.5,135),it('b0',210,210,.5,-135)]}];WBS.cur=0;WBS.sel=-1;
WBS.msel=new Set();
WBX.wbCur=()=>WBS.cur;
DEF_TILES=JSON.stringify(WBS.tiles);
try{cust=JSON.parse(kv.get('wb2_cust')||'{}');Object.keys(cust).forEach(k=>{if(k.startsWith('i|')&&!/^<path d="[MLQZ0-9.,\- ]+" fill="FILL" fill-rule="evenodd"\/>$/.test((cust[k]||{}).svg||''))delete cust[k]});const t=JSON.parse(kv.get('wb2_tiles')||'null');if(t&&t.length)WBS.tiles=t}catch(e){}
try{const p=JSON.parse(kv.get('wb2_proj')||'null');if(p&&typeof p=='object')WBS.proj=p}catch(e){}
WBS.nid=1+Math.max(0,...WBS.tiles.map(t=>+t.id||0));{const used=new Set();WBS.tiles.forEach(t=>{if(!t.id||used.has(t.id))t.id=WBS.nid++;used.add(t.id)})}
WBS.layers=null;WBS.selL=0;
try{const q=JSON.parse(kv.get('wb4_layers')||'null');if(q&&q.layers&&q.layers.length)WBS.layers=[oneLayer(flatEls(q.layers),q.layers[0].st||[],q.layers[0].u)]}catch(e){}
if(!WBS.layers)WBS.layers=[oneLayer([],WBS.tiles.map(t=>t.id))];trayLive();
WBS.layers.forEach(L=>{L.st=(L.st||[]).filter(id=>WBS.tiles.some(t=>t.id==id));if(L.lay=='brick'){L.lay='cols';if(!L.grid)L.grid='brick'}if(L.fit===true)L.fit='h';else if(!L.fit)L.fit=''});WBS.selL=WBS.layers.length-1;addEventListener('pagehide',()=>{if(_stT){clearTimeout(_stT);store0()}});document.addEventListener('visibilitychange',()=>{if(document.hidden&&_stT){clearTimeout(_stT);store0()}});
}
export {BF,DEF_TILES,REN,clean,cols,cust,fClean,flatEls,fSave,inkOf,it,lsel,luid,mcSave,mk,mkL,oneLayer,pal,say,selOne,store,init06};
