import {WBS,WBX} from './01-launch-and-version.js';
import {CM,PCOL,col,fixC,okC} from './04-canvas-and-stamp-outlines.js';
import {store} from './06-motif-library-folders.js';
import {upd} from './11-pressure-flooding-block-edges.js';
// ===== The colour tray: the project's working colours =====
// The tray is up to TRAY_MAX colours ("slots"), each with a stable id. Everything that has a colour (the paper, the default ink, each
// stamp's ink, a layer's ink, the Replace colour, a text's colour) holds a colour reference:
//   '@k3'             linked to slot k3: it follows that slot (edit the slot and everything linked recolours)
//   '#rrggbb[aa]'     a fixed colour of its own (locked): tray and colourway changes leave it alone
//   '#rrggbb[aa]|k3'  fixed, and remembers the slot it was locked from, so unlocking can link it back
// Colours carry their own opacity (the aa part; absent = fully opaque).
// A colourway is one set of colours for the slots: proj.cw = [{id, n name, c:{slotId:'#hex'}, m:{slotId:'colour name'}}], proj.cwa = the
// one in use. Every colourway has every slot, so links stay valid whichever colourway is showing; only the colours differ.
// The tray lives in the document (WBS.proj), so history, saving, crash recovery and compare all carry it without anything extra.
const TRAY_MAX=16;let TRAY_VIEW=7;   // places shown in the dock (Settings > Colour); an exported let, so every importer sees the change
const setTrayView=n=>{TRAY_VIEW=Math.max(7,Math.min(TRAY_MAX,n|0||7))};
const HEXRE=/^#[0-9a-f]{6}([0-9a-f]{2})?$/;
// '#rrggbb' / '#rrggbbaa' / 'rgb' forms in; '#rrggbb' (opaque) or '#rrggbbaa' out, lower case. null when it is not a colour.
function normHexA(v){const m=/^#?([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.exec(String(v||'').trim());if(!m)return null;let h=m[1].toLowerCase();if(h.length==3)h=h.split('').map(c=>c+c).join('');if(h.length==8&&h.slice(6)=='ff')h=h.slice(0,6);return'#'+h}
const hexAlpha=h=>h&&h.length==9?parseInt(h.slice(7,9),16)/255:1;
const hexRGB=h=>[1,3,5].map(i=>parseInt(h.slice(i,i+2),16));
const hexOpaque=h=>h?h.slice(0,7):h;
const withAlpha=(h,a)=>{h=hexOpaque(h);const n=Math.round(Math.max(0,Math.min(1,a))*255);return n>=255?h:h+n.toString(16).padStart(2,'0')};
const P=()=>WBS.proj;
const cwNow=(p=P())=>p.cw[Math.min(p.cw.length-1,Math.max(0,p.cwa|0))];
const isLink=r=>typeof r=='string'&&r.charCodeAt(0)===64;
const isFixed=r=>typeof r=='string'&&r.charCodeAt(0)===35;
const refSlot=r=>isLink(r)?r.slice(1):isFixed(r)&&r.indexOf('|')>0?r.slice(r.indexOf('|')+1):null;
const slotRef=id=>'@'+id;
const slotHex=(id,p=P())=>{const w=cwNow(p);return(w&&w.c[id])||'#888888'};
const slotName=(id,p=P())=>{const w=cwNow(p);return(w&&w.m&&w.m[id])||''};
const slotNo=(id,p=P())=>p.ts.indexOf(id)+1;
const nextId=(used,pre)=>{let i=1;while(used.has(pre+i))i++;return pre+i};
// an old colour name as the app has always shown it: a palette colour is itself; a name from the first 100-colour palette becomes the nearest palette colour
const nameOf=n=>{if(!n||typeof n!='string')return null;if(CM[n])return n;const m=fixC(n,null);return m&&CM[m]?m:null};
const hexOfName=n=>{const m=nameOf(n);return m?CM[m]:null};
// what a colour reference shows as words: the slot's colour name, else the hex
function refLabel(r){if(!r)return'';if(isLink(r)){const id=r.slice(1);return slotName(id)||slotHex(id).toUpperCase()}if(isFixed(r))return col(r).toUpperCase();return r}
// ---- a new tray from a list of [hex, name]; the first colour is the paper, the second the ink
function trayNew(cols){const ts=[],c={},m={};(cols||[]).slice(0,TRAY_MAX).forEach(([h,n],i)=>{const id='k'+(i+1);ts.push(id);c[id]=normHexA(h)||'#888888';if(n)m[id]=String(n).slice(0,40)});
 if(!ts.length){ts.push('k1');c.k1='#f4f0e6'}if(ts.length<2){ts.push('k2');c.k2='#26221d'}
 return{bg:'@'+ts[0],ink:'@'+ts[1],ts,cw:[{id:'w1',n:'Colourway 1',c,m}],cwa:0}}
const trayDefault=()=>trayNew([[CM[PCOL.bg],PCOL.bg],[CM[PCOL.ink],PCOL.ink]]);
// ---- documents from before the tray: their colours were names (paper, ink, accent, accent 2, and inks on stamps and layers).
// They become tray slots (up to 16; any more stay as fixed colours), linked where they were used. Works on {proj,tiles,layers}.
function trayFromLegacy(c){const o=c.proj||{},cols=[],idx=new Map();
 const add=n0=>{const n=nameOf(n0);if(!n)return null;if(idx.has(n))return idx.get(n);if(cols.length>=TRAY_MAX)return null;const id='k'+(cols.length+1);cols.push([id,CM[n],n]);idx.set(n,id);return id};
 const bg=add(o.bg||PCOL.bg)||add(PCOL.bg),ink=add(o.ink||PCOL.ink)||add(PCOL.ink);add(o.c3);add(o.c4);
 const ref=n=>{if(!n)return n;if(typeof n=='string'&&(isLink(n)||isFixed(n)))return n;const id=add(n);if(id)return'@'+id;const h=hexOfName(n);return h?h:null};
 (c.tiles||[]).forEach(t=>{if(t&&t.ink){const r=ref(t.ink);if(r)t.ink=r;else delete t.ink}});
 (c.layers||[]).forEach(L=>{if(!L)return;if(L.ink){const r=ref(L.ink);if(r)L.ink=r;else delete L.ink}if(L.rp){const r=ref(L.rp);if(r)L.rp=r;else delete L.rp}(L.pl||[]).forEach(q=>{if(q&&q.ink){const r=ref(q.ink);if(r)q.ink=r;else delete q.ink}})});
 const cc={},mm={},ts=cols.map(([id,h,n])=>{cc[id]=h;mm[id]=n;return id});
 c.proj={bg:'@'+bg,ink:'@'+ink,ts,cw:[{id:'w1',n:'Colourway 1',c:cc,m:mm}],cwa:0};return c}
// ---- make a document's tray whole: called on every document that comes in (open, undo, compare, crash recovery, Randomize)
function trayIn(c){if(!c||typeof c!='object')return c;const o=c.proj;
 if(!o||!Array.isArray(o.ts)||!Array.isArray(o.cw)){trayFromLegacy(c);return c}
 const seen=new Set();o.ts=o.ts.filter(id=>typeof id=='string'&&/^\w{1,12}$/.test(id)&&!seen.has(id)&&seen.add(id)).slice(0,TRAY_MAX);
 if(!o.ts.length)o.ts=['k1'];
 o.cw=o.cw.filter(w=>w&&typeof w=='object').slice(0,64);if(!o.cw.length)o.cw=[{id:'w1',n:'Colourway 1',c:{},m:{}}];
 const wid=new Set();o.cw.forEach((w,i)=>{if(typeof w.id!='string'||wid.has(w.id))w.id=nextId(wid,'w');wid.add(w.id);w.n=String(w.n||'Colourway '+(i+1)).slice(0,40);if(!w.c||typeof w.c!='object')w.c={};if(!w.m||typeof w.m!='object')w.m={};
  const c0=o.cw[0].c;o.ts.forEach(id=>{const h=normHexA(w.c[id]);w.c[id]=h||normHexA(c0[id])||'#888888'});Object.keys(w.c).forEach(k=>{if(!seen.has(k))delete w.c[k]});Object.keys(w.m).forEach(k=>{if(!seen.has(k)||typeof w.m[k]!='string')delete w.m[k]})});
 o.cwa=Math.max(0,Math.min(o.cw.length-1,o.cwa|0));
 const fix=(r,d)=>{if(typeof r!='string'||!r)return d;if(isLink(r))return seen.has(r.slice(1))?r:d;if(isFixed(r)){const [h,s]=r.split('|'),n=normHexA(h);return n?(s&&/^\w{1,12}$/.test(s)?n+'|'+s:n):d}const h=hexOfName(r);return h||d};
 o.bg=fix(o.bg,'@'+o.ts[0]);o.ink=fix(o.ink,'@'+(o.ts[1]||o.ts[0]));delete o.c3;delete o.c4;
 (c.tiles||[]).forEach(t=>{if(t&&t.ink!=null){const r=fix(t.ink,null);if(r)t.ink=r;else delete t.ink}(t&&t.items||[]).forEach(q=>{if(q&&q.ic!=null){const r=fix(q.ic,null);if(r)q.ic=r;else delete q.ic}})});
 (c.layers||[]).forEach(L=>{if(!L)return;if(L.ink!=null){const r=fix(L.ink,null);if(r)L.ink=r;else delete L.ink}if(L.rp!=null){const r=fix(L.rp,null);if(r)L.rp=r;else delete L.rp}(L.pl||[]).forEach(q=>{if(q&&q.ink!=null){const r=fix(q.ink,null);if(r)q.ink=r;else delete q.ink}})});
 return c}
// keep the live document whole (cheap when nothing is wrong): the draw loop calls it
function trayGuard(){const o=WBS.proj;if(!o||!Array.isArray(o.ts)||!Array.isArray(o.cw)||!o.cw.length||!okC(o.bg)||!okC(o.ink))trayLive()}
function trayLive(){WBS.proj=trayIn({proj:WBS.proj||trayDefault(),tiles:WBS.tiles||[],layers:WBS.layers||[]}).proj}
// ---- everything that uses a slot (for the tray list, and before a slot is removed)
// returns [{k:'paper'|'ink'|'stamp'|'shape'|'layer'|'replace'|'text', i, get(), set(v)}]
function refsAll(){const o=WBS.proj,out=[];
 out.push({k:'paper',get:()=>o.bg,set:v=>{o.bg=v}});out.push({k:'ink',get:()=>o.ink,set:v=>{o.ink=v}});
 WBS.tiles.forEach((t,i)=>{if(t.ink)out.push({k:'stamp',i,get:()=>t.ink,set:v=>{if(v)t.ink=v;else delete t.ink}});(t.items||[]).forEach(q=>{if(q&&q.ic)out.push({k:'shape',i,get:()=>q.ic,set:v=>{if(v)q.ic=v;else delete q.ic}})})});
 WBS.layers.forEach((L,i)=>{if(L.ink)out.push({k:'layer',i,get:()=>L.ink,set:v=>{if(v)L.ink=v;else delete L.ink}});if(L.rp)out.push({k:'replace',i,get:()=>L.rp,set:v=>{if(v)L.rp=v;else delete L.rp}});
  (L.pl||[]).forEach(q=>{if(q&&q.ink)out.push({k:'text',i,get:()=>q.ink,set:v=>{if(v)q.ink=v;else delete q.ink}})})});
 return out}
function trayUses(id){const r='@'+id;return refsAll().filter(x=>x.get()===r)}
// ---- changes. Each one edits WBS.proj (and the items), stores, redraws and names the history step in plain words.
function trayDone(label){if(label)WBX.wbLabelPlain={t:label,at:performance.now()};store();upd();if(WBX.wbTrayPaint)WBX.wbTrayPaint()}
function trayAdd(h,n,at,o=WBS.proj){if(o.ts.length>=TRAY_MAX)return null;h=normHexA(h)||'#888888';const id=nextId(new Set(o.ts),'k');
 if(at==null||at<0||at>o.ts.length)o.ts.push(id);else o.ts.splice(at,0,id);
 o.cw.forEach(w=>{w.c[id]=h;if(n)w.m[id]=String(n).slice(0,40)});return id}
function traySet(id,h,n,all){const o=WBS.proj;h=normHexA(h);if(!h||!o.ts.includes(id))return;(all?o.cw:[cwNow(o)]).forEach(w=>{w.c[id]=h;if(n)w.m[id]=String(n).slice(0,40);else if(n!==undefined)delete w.m[id]})}
// removing a slot: anything still linked to it keeps its colour as a fixed colour first, so nothing goes blank
function trayRemove(id){const o=WBS.proj;if(!o.ts.includes(id)||o.ts.length<=1)return 0;const h=slotHex(id),uses=trayUses(id);uses.forEach(x=>x.set(h));
 o.ts=o.ts.filter(k=>k!==id);o.cw.forEach(w=>{delete w.c[id];delete w.m[id]});
 // fixed colours that remembered this slot forget it
 refsAll().forEach(x=>{const r=x.get();if(isFixed(r)&&r.endsWith('|'+id))x.set(r.split('|')[0])});
 return uses.length}
function trayMove(id,to){const o=WBS.proj,i=o.ts.indexOf(id);if(i<0)return;o.ts.splice(i,1);o.ts.splice(Math.max(0,Math.min(o.ts.length,to)),0,id)}
// fill the first slots with a set of colours ([hex,name] pairs) in the colourway that is showing; slots after them keep their colours;
// slots are added when the set is longer than the tray.
function trayLoad(cols,o=WBS.proj){const w=cwNow(o),ids=[];cols.slice(0,TRAY_MAX).forEach(([h,n],i)=>{h=normHexA(h);if(!h)return;let id=o.ts[i];if(!id){id=trayAdd(h,n,null,o);if(!id)return}w.c[id]=h;if(n)w.m[id]=String(n).slice(0,40);else delete w.m[id];ids.push(id)});return ids}
// ---- lock / unlock one colour reference
const lockRef=r=>isLink(r)?slotHex(r.slice(1))+'|'+r.slice(1):r;
const unlockRef=r=>{const s=refSlot(r);return s&&WBS.proj.ts.includes(s)?'@'+s:null};
// a fixed colour that is exactly a tray colour links to it (used when a stamp or a colour comes in from elsewhere)
function refAdopt(h){h=normHexA(h);if(!h)return null;const o=WBS.proj,w=cwNow(o);const id=o.ts.find(k=>w.c[k]===h);return id?'@'+id:h}
// ---- colourways
function cwAdd(from){const o=WBS.proj,src=o.cw[from==null?o.cwa:from]||cwNow(o),ids=new Set(o.cw.map(w=>w.id)),id=nextId(ids,'w');
 let k=o.cw.length+1,n='Colourway '+k;const names=new Set(o.cw.map(w=>w.n));while(names.has(n))n='Colourway '+(++k);
 o.cw.push({id,n,c:{...src.c},m:{...src.m}});return o.cw.length-1}
function cwDel(i){const o=WBS.proj;if(o.cw.length<=1||!o.cw[i])return;o.cw.splice(i,1);if(o.cwa>i||o.cwa>=o.cw.length)o.cwa=Math.max(0,o.cwa-1)}
function cwUse(i){const o=WBS.proj;if(o.cw[i])o.cwa=i}
function cwMove(i,to){const o=WBS.proj;if(!o.cw[i])return;const cur=o.cw[o.cwa],[w]=o.cw.splice(i,1);o.cw.splice(Math.max(0,Math.min(o.cw.length,to)),0,w);o.cwa=o.cw.indexOf(cur)}
// ---- colours as a short list for other tools: the tray colours in order (hex), then fixed colours in use
function trayHexes(){const o=WBS.proj;return o.ts.map(id=>slotHex(id))}
function fixedInUse(){const s=new Set();refsAll().forEach(x=>{const r=x.get();if(isFixed(r))s.add(col(r))});return[...s]}
// ---- recently used colours (settings, not the document)
export {trayLive,TRAY_MAX,TRAY_VIEW,setTrayView,HEXRE,cwAdd,cwDel,cwMove,cwNow,cwUse,fixedInUse,hexAlpha,hexOpaque,hexRGB,isFixed,isLink,lockRef,normHexA,refAdopt,refLabel,refSlot,refsAll,slotHex,slotName,slotNo,slotRef,trayAdd,trayDefault,trayDone,trayFromLegacy,trayGuard,trayHexes,trayIn,trayLoad,trayMove,trayNew,trayRemove,traySet,trayUses,unlockRef,withAlpha};
