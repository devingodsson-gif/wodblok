import {kv} from '../platform/index.js';
import {WBS,WBX} from './01-launch-and-version.js';
import {pmsg} from './18-projects-and-cover-overlay.js';
import {TXF,txSrc,txSrcAdd,txThumb} from './16-texture-generators.js';
import {ltMake} from './87-library-tree.js';
import {txzBytes,txzRead} from '../format/textures.js';

// ===== The texture library (2.50.0; owner Oct 26 2026: a list of every texture with its picture, "add texture" at the top to import one, in the file and folder system) =====
// It is the folder tree of the style guide (Part 9, section 12) with tiles: Yours (the home folder) holds your imported textures that are in no folder, your folders
// sit beside the built-in sets (Paper and board, Cloth and weave, ...), A to Z. It is shown in the Texture effect, where a tile picks the effect's texture.
// Your textures and folders are kept in this browser through the platform (kv), and every project that uses one carries its picture too (16-texture-generators.js).
// 2.51.0: select mode, drag onto a folder, sets that can be renamed, hidden and hold folders, Export to a zip of pictures, Add texture takes several pictures and zips of pictures.
// 2.51.1: the tree itself is the shared component (87-library-tree.js); this file is what is special to textures: the store, Add texture and the pictures.
// The store: {f: folder paths, t: [{id, n, f, src}] your textures, b: {built-in id: folder path} built-in textures added to a folder (they also stay in their own set),
// h: names of hidden sets, r: {set name: your name for it}}.
const TL_KEY='wb250_textures',TL_UI='wb250_texturesui';
let tlC=null,tlCr=null,LT=null;
const tlNameOk=s=>{s=String(s||'').trim();return s&&s.length<=30&&!/[\\"<>&|/]/.test(s)&&!/^s:/i.test(s)?s:''};
// the store, read from the platform once per change
function tlLoad(){let raw=null;try{raw=kv.get(TL_KEY)}catch(e){}
 if(tlC===null||raw!==tlCr){let d=null;try{d=JSON.parse(raw||'null')}catch(e){}if(!d||typeof d!='object')d={};
  d.f=(Array.isArray(d.f)?d.f:[]).filter(x=>typeof x=='string'&&x&&x.length<=200);
  d.t=(Array.isArray(d.t)?d.t:[]).filter(x=>x&&/^u[\w-]{1,30}$/.test(x.id)&&typeof x.src=='string'&&/^data:image\/(?:webp|png|jpeg);base64,/.test(x.src)).map(x=>({id:x.id,n:String(x.n||'Texture').replace(/[<>&"|]/g,'').slice(0,40)||'Texture',f:typeof x.f=='string'?x.f:'',src:x.src}));
  d.h=(Array.isArray(d.h)?d.h:[]).filter(x=>typeof x=='string'&&x.length<=60);
  const r=d.r&&typeof d.r=='object'&&!Array.isArray(d.r)?d.r:{},b=d.b&&typeof d.b=='object'&&!Array.isArray(d.b)?d.b:{};d.r={};d.b={};
  Object.keys(r).forEach(k=>{const v=tlNameOk(r[k]);if(v)d.r[k]=v});Object.keys(b).forEach(k=>{if(/^[\w-]{1,40}$/.test(k)&&typeof b[k]=='string'&&b[k]&&b[k].length<=200)d.b[k]=b[k]});
  tlC=d;tlCr=raw}
 return{f:[...tlC.f],t:tlC.t.map(x=>({...x})),h:[...tlC.h],r:{...tlC.r},b:{...tlC.b}}}
const tlStore=d=>{try{kv.set(TL_KEY,JSON.stringify(d));tlC=null;return true}catch(e){pmsg('Could not keep the texture library in this browser.');return false}};
const tlSets=()=>TXF.map(([n,o])=>({k:'s:'+n,n,ids:Object.keys(o)}));
// is this texture used by the project (an imported one in use cannot be deleted)
const tlUsed=id=>(WBS.texLib||[]).some(L=>L.t===id);
const tlOwn=id=>{const e=txSrc(id);return!!(e&&e.imp)};
// what the tree needs to know about textures
const tlCfg=()=>({p:'tx',word:'texture',words:'textures',ui:TL_UI,exportName:'wodblok-textures',exportAs:'pictures',usedFix:'Choose another texture for those effects first.',
 top:`<div class="row txrow"><button type="button" class="alt" data-txadd>Add texture</button></div><input type="file" class="txfile vh" accept="image/*,.zip,application/zip" multiple tabindex="-1">`,
 read(){const d=tlLoad(),at={};d.t.forEach(x=>{at[x.id]=x.f});return{f:d.f,at,b:d.b,h:d.h,r:d.r}},
 write(m){const d=tlLoad();d.f=m.f;d.t.forEach(x=>{if(x.id in m.at)x.f=m.at[x.id]});d.b=m.b;d.h=m.h;d.r=m.r;tlStore(d)},
 sets:tlSets,name:id=>{const e=txSrc(id);return e?e.n:null},own:tlOwn,used:tlUsed,
 tile:id=>{const th=txThumb(id);return th?`<img src="${th}" alt="" draggable="false">`:''},
 remove(list){const d=tlLoad();d.t=d.t.filter(x=>!list.includes(x.id));tlStore(d)},
 rename(id,v){const d=tlLoad(),x=d.t.find(y=>y.id===id);if(!x)return;x.n=v;tlStore(d);txSrcAdd(x.id,v,x.src,{imp:1})},
 file(id){const e=txSrc(id),b=e&&txzBytes(e.src);return b?{name:e.n,data:b.data,ext:b.ext,fb:'Texture'}:null},
 wire(pane,pick){const add=pane.querySelector('[data-txadd]');if(!add||add.dataset.w)return;add.dataset.w='1';const file=pane.querySelector('.txfile');
  add.onclick=()=>{file.value='';file.click()};
  file.onchange=()=>{const fl=[...(file.files||[])];file.value='';if(fl.length)tlAddFiles(fl,pane.querySelector('.txtr')._pick||pick)}}});
// a picture you chose becomes a texture: grayscale, at most 1024 pixels on its long side, its edges blended so it repeats without a seam (as `npm run textures --seam` does)
// folder: the folder it goes to (null: the one that is open)
function tlMake(file,folder,done){const fr=new FileReader();fr.onerror=()=>pmsg('Could not read that picture.');fr.onload=()=>{const img=new Image();img.onerror=()=>pmsg('Could not read that picture.');
 img.onload=()=>{try{const k=Math.min(1,1024/Math.max(img.naturalWidth,img.naturalHeight)),w=Math.max(8,Math.round(img.naturalWidth*k)),h=Math.max(8,Math.round(img.naturalHeight*k)),c=document.createElement('canvas');c.width=w;c.height=h;
  const x=c.getContext('2d',{willReadFrequently:true});x.fillStyle='#fff';x.fillRect(0,0,w,h);x.drawImage(img,0,0,w,h);const D=x.getImageData(0,0,w,h),g=new Float32Array(w*h);for(let i=0;i<w*h;i++)g[i]=.2126*D.data[i*4]+.7152*D.data[i*4+1]+.0722*D.data[i*4+2];
  const wx=new Float32Array(w),wy=new Float32Array(h);for(let i=0;i<w;i++)wx[i]=Math.sin(Math.PI*i/w)**2;for(let i=0;i<h;i++)wy[i]=Math.sin(Math.PI*i/h)**2;
  {const s=new Float32Array(g);for(let y=0;y<h;y++)for(let X=0;X<w;X++)g[y*w+X]=s[y*w+X]*wx[X]+s[y*w+(X+(w>>1))%w]*(1-wx[X])}
  {const s=new Float32Array(g);for(let y=0;y<h;y++)for(let X=0;X<w;X++)g[y*w+X]=s[y*w+X]*wy[y]+s[((y+(h>>1))%h)*w+X]*(1-wy[y])}
  for(let i=0;i<w*h;i++){const v=Math.round(g[i]);D.data[i*4]=D.data[i*4+1]=D.data[i*4+2]=v;D.data[i*4+3]=255}x.putImageData(D,0,0);
  let src=c.toDataURL('image/webp',.8);if(!src.startsWith('data:image/webp'))src=c.toDataURL('image/jpeg',.85);
  const n=String(file.name||'Texture').replace(/\.[^.]*$/,'').replace(/[<>&"|]/g,'').trim().slice(0,40)||'Texture',id='u'+Date.now().toString(36)+Math.random().toString(36).slice(2,6),d=tlLoad(),f=folder==null?LT.here():folder;
  d.t.push({id,n,f,src});txSrcAdd(id,n,src,{imp:1});tlStore(d);if(f)LT.open(f);done(id,n)}catch(e){pmsg('Could not read that picture.');done(null)}};img.src=fr.result};fr.readAsDataURL(file)}
const tlMakeP=(file,folder)=>new Promise(res=>tlMake(file,folder,(id,n)=>res(id?{id,n}:null)));
// pictures from the Add texture button: pictures, and zips of pictures whose folders come back as your folders
async function tlAddFiles(files,pick){const jobs=[];let bad=0;
 for(const f of files){if(/\.zip$/i.test(f.name)||f.type=='application/zip'||f.type=='application/x-zip-compressed'){const r=txzRead(new Uint8Array(await f.arrayBuffer()));if(!r||!r.length){bad++;continue}
   r.forEach(e=>{const dir=e.dir.map(s=>String(s).replace(/[\\"<>&|/]/g,'').trim().slice(0,30)).filter(s=>s&&!/^s:/i.test(s));jobs.push({file:new File([e.data],e.name+'.img',{type:e.type}),folder:dir.length?dir.join('/'):null})})}
  else if(/^image\//.test(f.type)||/\.(png|jpe?g|webp)$/i.test(f.name))jobs.push({file:f,folder:null});else bad++}
 const got=[];for(const j of jobs){const r=await tlMakeP(j.file,j.folder);if(r)got.push(r)}
 LT.paintAll(true);
 if(got.length==1){if(pick)pick(got[0].id);pmsg('Added the texture “'+got[0].n+'”.')}
 else if(got.length)pmsg('Added '+got.length+' textures.'+(bad?' '+bad+' file'+(bad>1?'s were':' was')+' not a picture.':''));
 else pmsg(bad?'That file is not a picture or a zip of pictures.':'')}
// textures a project brought that this browser's library does not have yet go to Yours
function tlTake(ids){const d=tlLoad();let n=0;ids.forEach(id=>{const e=txSrc(id);if(e&&e.imp&&!d.t.some(x=>x.id===id)){d.t.push({id,n:e.n,f:'',src:e.src});n++}});if(n){tlStore(d);LT.paintAll(true)}}
// the markup of the library inside a Texture effect: Add texture first (as Add in the element panels), then the library's own bar, the search, the tree and the select bar
const tlPane=()=>LT.paneHtml();
// shows the library in a pane, with the texture in use; pick(id) is called when a tile is chosen or a picture is added
const tlShow=(pane,cur,pick)=>LT.show(pane,cur,pick);
function init86(){LT=ltMake(tlCfg());LT.init();
 // textures this browser kept: they can be picked in any project
 tlLoad().t.forEach(x=>txSrcAdd(x.id,x.n,x.src,{imp:1}));
 WBX.wbTexLibTake=tlTake;
 {const prev=WBX.wbTexPicReady;WBX.wbTexPicReady=()=>{if(prev)prev();LT.paintAll()}}
 // a project opened before this ran may have brought textures of its own
 tlTake((WBS.texLib||[]).map(L=>L.t))}
export {init86,tlPane,tlShow};
