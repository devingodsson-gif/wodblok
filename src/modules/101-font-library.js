import {kv} from '../platform/index.js';
import {$,WBS,WBX} from './01-launch-and-version.js';
import {flatEls} from './06-motif-library-folders.js';
import {pmsg} from './18-projects-and-cover-overlay.js';
import {teF,teUF} from './60-text-engine.js';
import {ltMake} from './87-library-tree.js';

// ===== The font library (2.113.0; owner Nov 5 2026: anything imported can be renamed, as a change to the whole folder system; fonts get "a font library with folders") =====
// Your imported fonts as a library in the Text panel's Fonts group: the folder tree of the style guide (Part 9, section 12; 87-library-tree.js) with rows, each name set
// in its own typeface. Add font at the top takes one or more font files; a click uses the font for the text, a double-click renames it, and folders, Delete (not while a
// text uses it) and Export (the font files) work as in every library. The Font menu keeps every font, yours under "Your fonts" by the names given here.
// The fonts themselves stay where 60-text-engine.js keeps them (wb17_fonts, by the file's name, which also makes the font's id, so a text keeps its font when it is
// renamed). This store holds only what the library adds: {f: folder paths, at: {font id: folder path}, n: {font id: the name you gave it}}. Built-in fonts are not in it.
const FL_KEY='wb2113_fonts',FL_UI='wb2113_fontsui';
let flC=null,flCr=null,FT=null;
function flLoad(){let raw=null;try{raw=kv.get(FL_KEY)}catch(e){}
 if(flC===null||raw!==flCr){let d=null;try{d=JSON.parse(raw||'null')}catch(e){}if(!d||typeof d!='object')d={};
  const obj=v=>v&&typeof v=='object'&&!Array.isArray(v)?v:{};
  d.f=(Array.isArray(d.f)?d.f:[]).filter(x=>typeof x=='string'&&x&&x.length<=200);
  const at=obj(d.at),n=obj(d.n);d.at={};d.n={};
  Object.keys(at).forEach(k=>{if(/^u-[\w-]{0,40}$/.test(k)&&typeof at[k]=='string'&&at[k].length<=200)d.at[k]=at[k]});
  Object.keys(n).forEach(k=>{const v=String(n[k]||'').replace(/[<>&"|]/g,'').trim().slice(0,40);if(/^u-[\w-]{0,40}$/.test(k)&&v)d.n[k]=v});
  flC=d;flCr=raw}
 return{f:[...flC.f],at:{...flC.at},n:{...flC.n}}}
const flStore=d=>{try{kv.set(FL_KEY,JSON.stringify(d));flC=null;return true}catch(e){pmsg('Could not keep the font library in this browser.');return false}};
const flHx=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
// the name a font of yours goes by: the one you gave it, else its file's
const flName=id=>{const e=teF[id];if(!e||!e.u)return null;return flLoad().n[id]||e.lbl};
// a text in the project uses it (then it cannot be deleted)
const flUsed=id=>flatEls(WBS.layers||[]).some(q=>q&&q.tx&&q.tx.f===id);
// what kind of font file the bytes are, for Export
const flExt=b=>{const m=String.fromCharCode(b[0],b[1],b[2],b[3]);return m=='OTTO'?'.otf':m=='wOFF'?'.woff':m=='wOF2'?'.woff2':'.ttf'};
// a font of yours as the Font menu and the rows show it, after a rename
const flRelabel=()=>{const n=flLoad().n;teUF.forEach(id=>{if(teF[id]&&n[id])teF[id].lbl=n[id]});if(WBX.wbFillFonts)WBX.wbFillFonts()};
// use it for the text (as choosing it in the Font menu does)
const flPick=id=>{const s=$('tx_f');if(!s||!teF[id])return;s.value=id;s.dispatchEvent(new Event('input',{bubbles:true}));s.dispatchEvent(new Event('change',{bubbles:true}));FT.paintAll()};
const flCfg=()=>({p:'fn',word:'font',words:'fonts',ui:FL_UI,rows:true,exportName:'wodblok-fonts',usedFix:'Choose another font for those texts first.',
 top:`<div class="row fnrow"><button type="button" class="alt" data-fnadd>Add font</button></div><input type="file" class="fnfile vh" accept=".ttf,.otf,.woff,.woff2,font/*" multiple tabindex="-1">`,
 cur:()=>{const s=$('tx_f');return s?s.value:''},
 read(){const d=flLoad(),at={};teUF.forEach(id=>{if(teF[id])at[id]=d.at[id]||''});return{f:d.f,at,b:{},h:[],r:{}}},
 write(m){const d=flLoad();d.f=m.f;teUF.forEach(id=>{if(id in m.at)d.at[id]=m.at[id]});flStore(d)},
 sets:()=>[],name:flName,own:id=>!!(teF[id]&&teF[id].u),used:flUsed,hay:id=>flName(id)||'',
 tile:id=>{const e=teF[id];return e?`<b style="font-family:'${flHx(e.fam)}',sans-serif">${flHx(flName(id))}</b>`:''},
 rename(id,v){const d=flLoad();d.n[id]=v;flStore(d);if(teF[id])teF[id].lbl=v;if(WBX.wbFillFonts)WBX.wbFillFonts()},
 remove(list){const d=flLoad();let all={};try{all=JSON.parse(kv.get('wb17_fonts')||'{}')}catch(e){}
  list.forEach(id=>{const e=teF[id];if(!e)return;Object.keys(all).forEach(k=>{if('u-'+k.toLowerCase().replace(/[^a-z0-9]+/g,'-').slice(0,30)===id)delete all[k]});
   try{document.fonts.forEach(f=>{if(f.family===e.fam||f.family==='"'+e.fam+'"')document.fonts.delete(f)})}catch(er){}
   delete teF[id];const i=teUF.indexOf(id);if(i>=0)teUF.splice(i,1);delete d.at[id];delete d.n[id]});
  try{kv.set('wb17_fonts',JSON.stringify(all))}catch(e){}flStore(d);if(WBX.wbFillFonts)WBX.wbFillFonts()},
 file(id){const e=teF[id];return e&&e.buf?{name:flName(id),data:new Uint8Array(e.buf),ext:flExt(new Uint8Array(e.buf)),fb:'Font'}:null},
 wire(pane){const add=pane.querySelector('[data-fnadd]');if(!add||add.dataset.w)return;add.dataset.w='1';const file=pane.querySelector('.fnfile');
  add.onclick=()=>{file.value='';file.click()};
  file.onchange=()=>{const fl=[...(file.files||[])];file.value='';if(fl.length)flAdd(fl)}}});
// font files from Add font: each joins the folder that is open; one file is also used for the text
async function flAdd(files){if(!WBX.wbTxAddFont)return;const here=FT.here(),got=[];let bad=0;
 for(const f of files){try{const id=await WBX.wbTxAddFont(f);if(id){got.push(id);if(here){const d=flLoad();d.at[id]=here;flStore(d)}}}catch(e){bad++}}
 flRelabel();if(here)FT.open(here);FT.paintAll(true);
 if(got.length==1){flPick(got[0]);pmsg(`Added the font “${flName(got[0])}”.`)}
 else if(got.length)pmsg(`Added ${got.length} fonts.`+(bad?` ${bad} file${bad>1?'s':''} could not be read.`:''));
 else pmsg('That file could not be read as a font. Try a .ttf or .otf file.')}
function flPaint(force){const pane=$('fnpane');if(!pane||!FT)return;FT.show(pane,($('tx_f')||{}).value||'',flPick);if(force)FT.paintAll(true)}
function init101(){const pane=$('fnpane');if(!pane)return;FT=ltMake(flCfg());FT.init();pane.innerHTML=FT.paneHtml();flPaint(true);
 // fonts this browser kept load a moment after start: the rows and the Font menu follow
 WBX.wbFontsChanged=()=>{flRelabel();flPaint(true)};
 const s=$('tx_f');if(s)s.addEventListener('input',()=>flPaint())}
export {init101};
