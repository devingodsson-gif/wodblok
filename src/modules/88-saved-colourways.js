import {kv} from '../platform/index.js';
import {$,WBS,WBX} from './01-launch-and-version.js';
import {newId,pmsg} from './18-projects-and-cover-overlay.js';
import {cwAdd,cwNow,cwUse,normHexA,trayDone,trayLoad,TRAY_MAX} from './50-tray-core.js';
import {swBg} from './51-colour-picker.js';
import {ltMake} from './87-library-tree.js';
// ===== Saved colourways (2.51.7; owner Oct 26 2026: a library of colourways, like the others) =====
// A colourway of this project (the Colourways tool) can be saved here with its "..." menu > Save to library, and a saved one is added back to any project as a new colourway.
// This project's own colourways stay as they are. The library is the shared folder tree (87-library-tree.js) with cards: a small picture of the piece in those colours (kept
// from the card it was saved from) and a strip of the colours. Kept in this browser. The store: {f: folder paths, t: [{id, n, f: folder path, c: [[hex, name]], th: picture}]}.
const CV_KEY='wb251_colourways',CV_UI='wb251_colourwaysui';
let cvC=null,cvCr=null,cvT=null;
const cvEsc=x=>String(x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function cvCache(){let raw=null;try{raw=kv.get(CV_KEY)}catch(e){}
 if(cvC===null||raw!==cvCr){let d=null;try{d=JSON.parse(raw||'null')}catch(e){}if(!d||typeof d!='object')d={};
  d.f=(Array.isArray(d.f)?d.f:[]).filter(x=>typeof x=='string'&&x&&x.length<=200&&!x.startsWith('s:'));
  d.t=(Array.isArray(d.t)?d.t:[]).filter(t=>t&&typeof t.id=='string'&&typeof t.n=='string'&&Array.isArray(t.c)).map(t=>({id:t.id,n:t.n.replace(/[<>&"|]/g,'').slice(0,40)||'Colourway',f:typeof t.f=='string'&&!t.f.startsWith('s:')&&t.f.length<=200?t.f:'',
   c:t.c.map(x=>Array.isArray(x)?[normHexA(x[0]),String(x[1]||'').slice(0,40)]:null).filter(x=>x&&x[0]).slice(0,TRAY_MAX),th:typeof t.th=='string'&&t.th.length<9e4&&/^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/.test(t.th)?t.th:''})).filter(t=>t.c.length);
  cvC=d;cvCr=raw}
 return cvC}
const cvLoad=()=>JSON.parse(JSON.stringify(cvCache()));
const cvStore=d=>{try{kv.set(CV_KEY,JSON.stringify({f:d.f,t:d.t}))}catch(e){pmsg('Could not keep the colourways in this browser.')}};
const cvFind=id=>cvCache().t.find(t=>t.id===id)||null;
const cvHere=()=>cvT?cvT.here():'';
const cvStrip=c=>`<span class="cwst">${c.map(([h])=>`<i style="background:${swBg(h)}"></i>`).join('')}</span>`;
const cvCfg=()=>({p:'cv',word:'colourway',words:'colourways',ui:CV_UI,cards:true,z:7,exportName:'wodblok-colourways',exportAs:'colourway files',pane:'#cvpane',
 read(){const d=cvLoad(),at={};d.t.forEach(t=>{at[t.id]=t.f});return{f:d.f,at,b:{},h:[],r:{}}},
 write(m){const d=cvLoad();d.f=m.f;d.t.forEach(t=>{if(t.id in m.at)t.f=m.at[t.id]});cvStore(d)},
 sets:()=>[],name:id=>{const t=cvFind(id);return t?t.n:null},own:()=>true,used:()=>false,
 hay:id=>{const t=cvFind(id);return t?t.n+' '+t.c.map(x=>x[1]).join(' '):''},
 tile(id){const t=cvFind(id);return t?(t.th?`<img src="${t.th}" alt="" draggable="false">`:'<div class="nt"></div>')+`<b>${cvEsc(t.n)}</b>`+cvStrip(t.c):''},
 remove(list){const d=cvLoad();d.t=d.t.filter(t=>!list.includes(t.id));cvStore(d);cvPaint(true)},
 rename(id,v){const d=cvLoad(),t=d.t.find(x=>x.id===id);if(t){t.n=v;cvStore(d)}},
 file(id){const t=cvFind(id);return t?{name:t.n,data:new TextEncoder().encode(JSON.stringify({app:'WODBLOK',kind:'colourway',name:t.n,colours:t.c})),ext:'.wodblok-colourway',fb:'Colourway'}:null},
 itemMenu:id=>[['Add to this project',()=>cvUse(id)]]});
// a saved colourway joins this project as a new colourway and is the one showing
function cvUse(id){const t=cvFind(id);if(!t)return;const i=cwAdd();cwUse(i);cwNow().n=t.n.slice(0,40);trayLoad(t.c);trayDone('New colourway “'+t.n+'”');pmsg('Added the colourway “'+t.n+'”.')}
// this project's colourway number i is kept here, with the picture its card shows
function cvSave(i){const o=WBS.proj,w=o.cw[i];if(!w)return;const im=$('cwg')&&$('cwg').querySelector(`.cwc[data-i="${i}"] img`),th=im&&/^data:image\/jpeg;base64,/.test(im.src)&&im.src.length<9e4?im.src:'';
 const d=cvLoad(),f=cvHere();d.t.unshift({id:newId(),n:w.n,f:f.startsWith('s:')?'':f,c:o.ts.map(id=>[w.c[id],w.m[id]||'']).filter(x=>x[0]),th});cvStore(d);cvPaint(true);pmsg('Saved the colourway “'+w.n+'” to the library.')}
function cvPaint(force){const p=$('cvpane');if(!cvT||!p||!p.isConnected)return;cvT.show(p,'',cvUse);if(force)cvT.paintAll(true);$('cvcnt').textContent=cvCache().t.length?String(cvCache().t.length):''}
function init88(){cvT=ltMake(cvCfg());cvT.init();$('cvpane').innerHTML=cvT.paneHtml();WBX.wbCwSave=cvSave;
 const sec=document.querySelector('section.pn[data-p="colors"]');if(sec){new MutationObserver(()=>{if(!sec.hidden)cvPaint(false)}).observe(sec,{attributes:true,attributeFilter:['hidden']})}
 cvPaint(false)}
export {init88};
