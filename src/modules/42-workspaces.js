import {kv,files} from '../platform/index.js';
import {$,WBX} from './01-launch-and-version.js';
import {newId,pmsg} from './18-projects-and-cover-overlay.js';
import {rowMenu} from './04-canvas-and-stamp-outlines.js';
// ===== Workspaces =====
// A workspace is a saved arrangement of the tool panels (which tools are open, their tabs, and where they sit) for the Pattern view
// and the Stamp editor. Pick one to set that arrangement; save the current one under a name. Kept with your settings, not in project
// files. The app still starts with no tools open: a workspace only applies when you choose it.
// It is a library (style guide 12): Yours, your folders (a path string per workspace, so folders nest), and Starting points as a built-in set.
// Export writes a workspace, a folder or the whole library to a file; Import adds a file's workspaces and folders to yours.
const WX_KEY='wb96_workspaces';
const wxG=(tabs,o={})=>({tabs,a:tabs[0],...o});
// The starting workspace is Default; it opens at launch. It is copied into Yours the first time (see wxSeed), so it can be changed,
// replaced or deleted like your own, and "Restore defaults" puts the original back. WX_OLD are the three starting workspaces of 1.21 and 1.22:
// they are taken out again, unless you changed them.
const WX_DEFAULT={name:'Default',layout:{
    pattern:{dock:[wxG(['canvas','colors'],{e:'l'}),wxG(['lyrs','layers'],{e:'r'})],float:[]}}};
const WX_OLD=[
  {name:'Colour work',layout:{pattern:{dock:[wxG(['colors','grade','tex']),wxG(['rand'])],float:[]}}},
  {name:'Layout work',layout:{pattern:{dock:[wxG(['lyrs']),wxG(['layers','canvas','pgrid'])],float:[]}}},
  {name:'Everything closed',layout:{pattern:{dock:[],float:[]}}},
];
const WX_UI='wb96_workspaces_ui',WX_SEEDED='wb96_ws_seeded',WX_FILE='wodblok-workspaces';
const wxEsc=x=>String(x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const wxIC=(d,w)=>`<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${w||1.8}" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;
const wxFOLDER=wxIC('<path d="M3.5 7.5V18a1.5 1.5 0 0 0 1.5 1.5h14a1.5 1.5 0 0 0 1.5-1.5V9.5A1.5 1.5 0 0 0 19 8h-7l-2-2.5H5A1.5 1.5 0 0 0 3.5 7z"/>'),wxFOLDER_O=wxIC('<path d="M3.5 18.5V7A1.5 1.5 0 0 1 5 5.5h4l2 2.5h6.5A1.5 1.5 0 0 1 19 9.5V11M3.5 18.5l2.4-7a1.5 1.5 0 0 1 1.4-1h13.2a1 1 0 0 1 .95 1.3l-2 6.2a1.5 1.5 0 0 1-1.4 1H3.5z"/>');
const wxHOME=wxIC('<path d="M4 11l8-6.5 8 6.5M6 9.5V19h12V9.5"/>'),wxCHEV='<svg class="lfa" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M7 4l6 6-6 6"/></svg>';
const wxMORE='<svg class="ic" viewBox="0 0 24 24" fill="currentColor"><circle cx="5.5" cy="12" r="1.7"/><circle cx="12" cy="12" r="1.7"/><circle cx="18.5" cy="12" r="1.7"/></svg>',wxTRASH=wxIC('<path d="M5 7h14M10 7V5h4v2M7 7l1 12h8l1-12"/>');
const wxLoad=()=>{try{const a=JSON.parse(kv.get(WX_KEY)||'[]');return Array.isArray(a)?a.filter(w=>w&&typeof w.id=='string'&&typeof w.name=='string'&&w.layout).map(w=>({...w,f:typeof w.f=='string'?w.f:''})):[]}catch(e){return[]}};
// first run: Default becomes yours (a workspace you already named Default is kept as it is). Version 2 also removes the old starting
// workspaces that were never changed.
function wxSeed(){let v='';try{v=kv.get(WX_SEEDED)||''}catch(e){}if(v==='2')return;
  let a=wxLoad();
  if(v==='1')a=a.filter(w=>!WX_OLD.some(o=>o.name==w.name&&JSON.stringify(o.layout)==JSON.stringify(w.layout)));
  if(!a.some(w=>w.name.toLowerCase()=='default'))a.unshift({id:newId(),name:WX_DEFAULT.name,f:'',layout:JSON.parse(JSON.stringify(WX_DEFAULT.layout))});
  try{kv.set(WX_KEY,JSON.stringify(a));kv.set(WX_SEEDED,'2')}catch(e){}}
// the workspace the app opens with: the one called Default (in Yours first), else the first one in the list; none, nothing opens
function wxLaunchPick(){const a=wxLoad(),d=a.filter(w=>w.name.toLowerCase()=='default');return d.find(w=>!w.f)||d[0]||a[0]||null}
const wxStore=a=>{try{kv.set(WX_KEY,JSON.stringify(a))}catch(e){pmsg('Could not keep the workspaces in this browser.')}};
const wxLoadF=()=>{try{const d=JSON.parse(kv.get(WX_UI)||'null')||{};return{f:(Array.isArray(d.f)?d.f:[]).filter(x=>typeof x=='string'&&x),o:Array.isArray(d.o)?d.o:[''],a:typeof d.a=='string'?d.a:''}}catch(e){return{f:[],o:[''],a:''}}};
const wxStoreF=d=>{try{kv.set(WX_UI,JSON.stringify(d))}catch(e){}};
const wxCmp=(a,b)=>a.localeCompare(b,undefined,{numeric:true,sensitivity:'base'}),wxLeaf=p=>p.split('/').pop(),wxPar=p=>p.includes('/')?p.slice(0,p.lastIndexOf('/')):'';
const wxFolders=(d,a)=>{const s=new Set();[...d.f,...a.map(w=>w.f)].forEach(p=>{let q='';if(p)p.split('/').forEach(x=>{q=q?q+'/'+x:x;s.add(q)})});return[...s]};
const wxKids=(fs,p)=>fs.filter(x=>wxPar(x)===p).sort((a,b)=>wxCmp(wxLeaf(a),wxLeaf(b)));
const wxIn=(w,p)=>w.f===p||w.f.startsWith(p+'/');
const wxNameOk=s=>{s=String(s||'').trim();return s&&s.length<=30&&!/[\\"<>&|/]/.test(s)?s:''};
// the file: only plain data, checked on the way in
function wxCleanLayout(l){if(!l||typeof l!='object')return null;const out={};['pattern'].forEach(m=>{const L=l[m];if(!L||typeof L!='object')return;const g=k=>(Array.isArray(L[k])?L[k]:[]).filter(x=>x&&Array.isArray(x.tabs)).slice(0,12).map(x=>{const o={...x,tabs:x.tabs.filter(t=>typeof t=='string').slice(0,30)};if(typeof o.a!='string'||!o.tabs.includes(o.a))o.a=o.tabs[0];return o}).filter(x=>x.tabs.length);out[m]={dock:g('dock'),float:g('float')}});return out.pattern?out:null}
function wxParse(text){let j;try{j=JSON.parse(text)}catch(e){return null}if(!j||j.kind!==WX_FILE||!Array.isArray(j.items))return null;
 const items=j.items.map(x=>x&&typeof x.name=='string'?{name:x.name.trim().slice(0,40),f:typeof x.f=='string'?x.f.split('/').map(wxNameOk).filter(Boolean).join('/'):'',layout:wxCleanLayout(x.layout)}:null).filter(x=>x&&x.name&&x.layout);
 const f=(Array.isArray(j.folders)?j.folders:[]).filter(x=>typeof x=='string').map(p=>p.split('/').map(wxNameOk).filter(Boolean).join('/')).filter(Boolean);return{items,f}}
function init42(){
  wxSeed();
  const list=$('wxl'),inp=$('wxn'),UI={q:'',ren:null,form:null,k:'',d:wxLoadF()};
  const save=()=>wxStoreF(UI.d);
  const apply=w=>{WBX.wbWsSet(w.layout);pmsg('Workspace “'+w.name+'”.')};
  const find=id=>wxLoad().find(x=>x.id==id);
  const isOpen=k=>UI.d.o.includes(k);
  const setOpen=(k,on)=>{const s=new Set(UI.d.o);if(on)s.add(k);else s.delete(k);s.add('');UI.d.o=[...s]};
  const where=p=>p?p.replace(/\//g,' / '):'Yours';
  const row=(w,depth,own)=>{
    if(own&&UI.ren==w.id)return`<div class="wxr ren" data-id="${w.id}" style="--d:${depth}"><input type="text" maxlength="40" value="${wxEsc(w.name)}" aria-label="Workspace name"></div>`;
    return`<div class="wxr" data-id="${w.id}" role="listitem" tabindex="0" style="--d:${depth}" aria-label="${wxEsc(w.name)}"><b>${wxEsc(w.name)}</b><button type="button" class="ib" data-more aria-haspopup="menu" aria-expanded="false" aria-label="Menu for ${wxEsc(w.name)}">${wxMORE}</button>${own?`<button type="button" class="ib" data-act="del" aria-label="Delete ${wxEsc(w.name)}">${wxTRASH}</button>`:''}</div>`};
  const frow=(key,label,count,depth,o)=>{const open=isOpen(key);return`<div class="lfr wxf${UI.d.a===key?' act':''}" data-k="${wxEsc(key)}" role="treeitem" tabindex="0" aria-expanded="${open}" style="--d:${depth}">${wxCHEV}<span class="lfi">${o.home?wxHOME:open?wxFOLDER_O:wxFOLDER}</span><span class="lfn">${wxEsc(label)}</span><span class="lfc">${count}</span>${o.menu?`<button type="button" class="ib" data-fmore aria-haspopup="menu" aria-expanded="false" aria-label="Menu for ${wxEsc(label)}">${wxMORE}</button>`:''}</div>`};
  const form=depth=>{const f=UI.form;if(!f)return'';
    if(f.t=='del')return`<div class="wxform" style="--d:${depth}"><span>Delete “${wxEsc(wxLeaf(f.p))}” and the folders inside?</span><button type="button" class="alt warn" data-fok>Delete</button><button type="button" class="alt" data-fcx>Cancel</button></div>`;
    return`<div class="wxform" style="--d:${depth}"><input type="text" maxlength="30" value="${wxEsc(f.v||'')}" aria-label="Folder name" placeholder="Folder name"><button type="button" class="primary" data-fok>${f.t=='ren'?'Rename':'Create'}</button><button type="button" class="alt" data-fcx>Cancel</button></div>`};
  function paint(force){
    const a=wxLoad(),fs=wxFolders(UI.d,a),key=JSON.stringify([a,UI.d,UI.ren,UI.form,UI.q]);if(!force&&key===UI.k)return;UI.k=key;
    const q=UI.q.trim().toLowerCase().split(/\s+/).filter(Boolean);let h='';
    if(q.length){const hit=a.filter(w=>q.every(x=>(w.name+' '+w.f).toLowerCase().includes(x)));h=hit.map(w=>row(w,0,1)).join('')||'<div class="stno">No matching workspace</div>'}
    else{
      const count=p=>a.filter(w=>wxIn(w,p)).length;
      const own=p=>a.filter(w=>w.f===p).sort((x,y)=>wxCmp(x.name,y.name));
      const tree=(p,depth)=>{let s='';wxKids(fs,p).forEach(f=>{s+=wxFrowTree(f,depth)});return s};
      const wxFrowTree=(f,depth)=>{let s=frow(f,wxLeaf(f),count(f),depth,{menu:1});if(isOpen(f)){if(UI.form&&UI.form.p===f)s+=form(depth+1);s+=tree(f,depth+1);const o=own(f);s+=o.map(w=>row(w,depth+1,1)).join('')||(wxKids(fs,f).length?'':`<div class="stno" style="--d:${depth+1}">Empty folder</div>`)}return s};
      const home=own('');h+=frow('','Yours',home.length,0,{home:1});
      if(isOpen('')){if(UI.form&&UI.form.p===''&&UI.form.t=='new')h+=form(1);h+=home.map(w=>row(w,1,1)).join('')||'<div class="stno" style="--d:1">No workspaces yet</div>'}
      wxKids(fs,'').forEach(f=>{h+=wxFrowTree(f,0)})}
    list.innerHTML=h;
    const ri=list.querySelector('.ren input,.wxform input');if(ri&&(UI.ren||UI.form)){ri.focus();ri.select()}
    const all=$('wxall');if(all){const on=UI.d.o.some(Boolean);all.setAttribute('aria-label',on?'Collapse all':'Expand all');all.setAttribute('aria-pressed',String(on))}
  }
  const layoutNow=()=>{const layout=WBX.wbWsGet();['pattern'].forEach(m=>{const L=layout[m];if(!L)return;['dock','float'].forEach(k=>{L[k]=(L[k]||[]).map(g=>({...g,tabs:g.tabs.filter(t=>t!='wspc')})).filter(g=>g.tabs.length);L[k].forEach(g=>{if(!g.tabs.includes(g.a))g.a=g.tabs[0]})})});return layout};   // the list you are choosing from is not part of a workspace
  const activeHome=()=>UI.d.a||'';
  // ---- files
  const fileOf=(items,folders)=>new Blob([JSON.stringify({kind:WX_FILE,v:1,folders,items:items.map(w=>({name:w.name,f:w.f||'',layout:w.layout}))},null,1)],{type:'application/json'});
  async function exportItems(items,folders,name,what){if(!items.length&&!folders.length)return pmsg('There is nothing to export there.');
    try{const r=await files.save(name+'.wodblok-workspaces.json',fileOf(items,folders),{type:'application/json'});pmsg((r=='saved'?'Saved ':'Downloaded ')+what+'.')}catch(e){if(!(e&&e.name=='AbortError'))pmsg('Could not write the file.')}}
  const exportAll=()=>{const a=wxLoad();return exportItems(a,wxFolders(UI.d,a),'workspaces','your workspaces')};
  const exportFolder=p=>{const a=wxLoad().filter(w=>wxIn(w,p)),fs=wxFolders(UI.d,wxLoad()).filter(x=>x===p||x.startsWith(p+'/'));return exportItems(a,fs,wxLeaf(p),'the folder “'+where(p)+'”')};
  function importText(text,fname){const r=wxParse(text);if(!r||(!r.items.length&&!r.f.length))return pmsg('That file has no workspaces in it.');
    const a=wxLoad();let n=0;r.items.forEach(x=>{let name=x.name,k=2;while(a.some(w=>w.f===x.f&&w.name.toLowerCase()==name.toLowerCase()))name=x.name.slice(0,36)+' '+(k++);a.push({id:newId(),name,f:x.f,layout:x.layout});n++});
    wxStore(a);r.f.forEach(p=>{if(!UI.d.f.includes(p))UI.d.f.push(p)});save();paint(true);pmsg('Added '+n+' workspace'+(n==1?'':'s')+' from “'+fname+'”.')}
  $('wxfile').addEventListener('change',async e=>{const f=e.target.files[0];e.target.value='';if(!f)return;if(f.size>5e6)return pmsg('That file is too big to be a workspace file.');try{importText(await f.text(),f.name)}catch(err){pmsg('Could not read that file.')}});
  $('wxrst').onclick=()=>{const a=wxLoad(),d=a.find(w=>w.f===''&&w.name.toLowerCase()=='default');const lay=JSON.parse(JSON.stringify(WX_DEFAULT.layout));
    if(d){d.layout=lay;d.name=WX_DEFAULT.name}else a.unshift({id:newId(),name:WX_DEFAULT.name,f:'',layout:lay});
    wxStore(a);setOpen('',true);save();paint(true);pmsg('Restored the Default workspace.')};
  $('wximp').onclick=()=>$('wxfile').click();$('wxexp').onclick=exportAll;
  // ---- the tree
  const folderMenu=(btn,p)=>rowMenu(btn,[['New folder inside',()=>{setOpen(p,true);UI.d.a=p;save();UI.form={t:'new',p,v:''};paint(true)}],['Rename',()=>{UI.form={t:'ren',p,v:wxLeaf(p)};paint(true)}],['Export…',()=>exportFolder(p)],['Delete folder',()=>{UI.form={t:'del',p};paint(true)}]]);
  const toggle=k=>{if(isOpen(k)&&k!==''){setOpen(k,false);if(UI.d.a===k||UI.d.a.startsWith(k+'/'))UI.d.a=wxPar(k)}else{setOpen(k,true);UI.d.a=k}save();paint(true)};
  const mv=(id,p)=>{const a=wxLoad(),w=a.find(x=>x.id===id);if(!w)return;w.f=p;wxStore(a);if(p)setOpen(p,true);save();paint(true);pmsg('Moved “'+w.name+'” to “'+where(p)+'”.')};
  list.addEventListener('click',e=>{
    if(e.target.closest('input'))return;
    if(e.target.closest('[data-fcx]')){UI.form=null;paint(true);return}
    if(e.target.closest('[data-fok]')){const f=UI.form;if(!f)return;const d=UI.d,a=wxLoad();
      if(f.t=='del'){const gone=p=>p===f.p||p.startsWith(f.p+'/');d.f=d.f.filter(p=>!gone(p));a.forEach(w=>{if(w.f&&gone(w.f))w.f=''});wxStore(a);UI.form=null;d.o=d.o.filter(x=>!gone(x));if(gone(d.a))d.a=wxPar(f.p);save();paint(true);pmsg('Deleted the folder “'+wxLeaf(f.p)+'”. Its workspaces went back to Yours.');return}
      const n=wxNameOk(list.querySelector('.wxform input').value);if(!n){list.querySelector('.wxform input').focus();return}
      if(f.t=='new'){const path=f.p?f.p+'/'+n:n,ex=wxFolders(d,a).find(x=>x.toLowerCase()==path.toLowerCase()),use=ex||path;if(!ex)d.f.push(path);setOpen(use,true);if(f.p)setOpen(f.p,true);d.a=use;UI.form=null;save();paint(true);pmsg(ex?'Opened the folder “'+where(use)+'”.':'Made the folder “'+where(use)+'”.');return}
      const path=f.p.slice(0,f.p.length-wxLeaf(f.p).length)+n,re=p=>p===f.p?path:p.startsWith(f.p+'/')?path+p.slice(f.p.length):p,clash=wxFolders(d,a).find(x=>x.toLowerCase()==path.toLowerCase()&&x!==f.p);
      d.f=[...new Set(d.f.map(re))];if(!d.f.includes(path))d.f.push(path);a.forEach(w=>{w.f=re(w.f)});wxStore(a);d.o=d.o.map(re);d.a=re(d.a);UI.form=null;save();paint(true);pmsg(clash?'Merged “'+wxLeaf(f.p)+'” into “'+wxLeaf(path)+'”.':'Renamed the folder to “'+n+'”.');return}
    const fm=e.target.closest('[data-fmore]'),fr=e.target.closest('.wxf');
    if(fm){e.stopPropagation();folderMenu(fm,fr.dataset.k);return}
    if(fr){toggle(fr.dataset.k);return}
    const r=e.target.closest('.wxr');if(!r)return;const id=r.dataset.id,w=find(id);if(!w)return;const own=true;
    if(e.target.closest('[data-act="del"]')){wxStore(wxLoad().filter(x=>x.id!=id));paint(true);pmsg('Deleted the workspace “'+w.name+'”.');return}
    const more=e.target.closest('[data-more]');
    if(more){e.stopPropagation();
      const items=[['Update with the current layout',()=>{const a=wxLoad(),x=a.find(y=>y.id==id);if(x){x.layout=layoutNow();wxStore(a);pmsg('Updated the workspace “'+x.name+'”.')}}],['Rename',()=>{UI.ren=id;paint(true)}],['Export…',()=>exportItems([w],[],w.name,'“'+w.name+'”')]]
      {if(w.f)items.push(['Move to Yours',()=>mv(id,'')]);wxFolders(UI.d,wxLoad()).sort((x,y)=>wxCmp(x,y)).filter(p=>p!==w.f).slice(0,40).forEach(p=>items.push(['Move to “'+wxEsc(where(p))+'”',()=>mv(id,p)]))}
      rowMenu(more,items);return}
    apply(w)});
  list.addEventListener('contextmenu',e=>{const t=e.target.closest('.wxf,.wxr');const b=t&&t.querySelector('[data-fmore],[data-more]');if(b){e.preventDefault();b.click()}});
  list.addEventListener('keydown',e=>{const t=e.target;
    if(t.matches&&t.matches('.ren input')){e.stopPropagation();if(e.key=='Enter')t.blur();else if(e.key=='Escape'){UI.ren=null;paint(true)}return}
    if(t.matches&&t.matches('.wxform input')){e.stopPropagation();if(e.key=='Enter'){UI.form.v=t.value;list.querySelector('[data-fok]').click()}else if(e.key=='Escape'){UI.form=null;paint(true)}return}
    if(t.classList&&t.classList.contains('wxf')){const k=t.dataset.k;if(e.key=='ArrowRight'&&!isOpen(k)){e.preventDefault();toggle(k)}else if(e.key=='ArrowLeft'&&isOpen(k)&&k!==''){e.preventDefault();toggle(k)}else if(e.key=='Enter'||e.key==' '){e.preventDefault();toggle(k)}return}
    if(t.classList&&t.classList.contains('wxr')&&(e.key=='Enter'||e.key==' ')){e.preventDefault();t.click()}});
  list.addEventListener('input',e=>{if(e.target.matches&&e.target.matches('.wxform input')&&UI.form)UI.form.v=e.target.value});
  list.addEventListener('focusout',e=>{const i=e.target;if(!i.matches||!i.matches('.ren input')||!UI.ren)return;const v=i.value.trim().slice(0,40),id=UI.ren;UI.ren=null;if(v){const a=wxLoad(),x=a.find(y=>y.id==id);if(x){x.name=v;wxStore(a)}}paint(true)});
  $('wxq').addEventListener('keydown',e=>e.stopPropagation());$('wxq').addEventListener('input',()=>{UI.q=$('wxq').value;paint(true)});
  $('wxall').onclick=()=>{const on=UI.d.o.some(Boolean);if(on){UI.d.o=[''];UI.d.a=''}else UI.d.o=['',...wxFolders(UI.d,wxLoad())];save();paint(true)};
  $('wxnew').onclick=()=>{const p=activeHome();setOpen(p,true);UI.form={t:'new',p,v:''};paint(true)};
  $('wxsave').onclick=()=>{
    const a=wxLoad(),f=activeHome();let name=inp.value.trim().slice(0,40);if(!name)name='Workspace '+(a.filter(w=>w.f===f).length+1);
    const layout=layoutNow(),same=a.find(w=>w.f===f&&w.name.toLowerCase()==name.toLowerCase());
    if(same)same.layout=layout;else a.push({id:newId(),name,f,layout});
    wxStore(a);inp.value='';setOpen(f,true);save();paint(true);pmsg((same?'Updated workspace “':'Saved workspace “')+(same?same.name:name)+'”'+(f?' in “'+where(f)+'”':'')+'.');
  };
  inp.addEventListener('keydown',e=>{e.stopPropagation();if(e.key=='Enter')$('wxsave').click()});
  paint(true);
  // open the launch workspace now (the shell has just cleared every panel and chosen the Pattern view)
  {const w=wxLaunchPick();if(w)WBX.wbWsSet(w.layout)}
  WBX.wbWsDefault=()=>wxLaunchPick();
}
export {init42};
