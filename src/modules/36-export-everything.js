import {kv,reload,use} from '../platform/index.js';
import {$,WB_VER} from './01-launch-and-version.js';
import {ST,pmsg} from './18-projects-and-cover-overlay.js';
import {SL} from './27-stamp-library.js';
// ===== Export everything / Import everything =====
// One file with everything the app keeps for you: saved projects, the stamp library, and every setting and library
// (motifs, folders, colours, fonts, snapshots, the working copy). It exists so data can move between where the app
// runs (the claude.ai preview, the web app, a new browser). Format: {app:'WODBLOK-EXPORT', v:1, ...}.
const XV=1,XAPP='WODBLOK-EXPORT';
const OWN=new Set(['wb18_projects','wb50_stamps']);           // these two hold the records listed separately below
const isKey=k=>/^wb\d+_/.test(k);
async function exportAll(){
  try{
    const d=await use('downloads');if(!d)return pmsg('Downloading is not available here.');
    const keys={};for(const k of kv.keys())if(isKey(k)&&!OWN.has(k))keys[k]=kv.get(k);
    const projects=await ST.list(),stamps=await SL.list();
    const out={app:XAPP,v:XV,exported:new Date().toISOString(),build:WB_VER,source:ST.kind,kv:keys,projects,stamps};
    const day=out.exported.slice(0,10);
    await d.save({filename:'wodblok-everything-'+day+'.wodblok-all.json',data:JSON.stringify(out)});
    pmsg(`Exported everything: ${projects.length} project${projects.length==1?'':'s'}, ${stamps.length} stamp${stamps.length==1?'':'s'}, ${Object.keys(keys).length} settings.`);
  }catch(e){if(!e||e.code!='declined')pmsg('Could not export: '+((e&&e.message)||'unknown error'))}
}
// merge records by id: a record is only replaced by a newer one
async function mergeRecords(store,list){
  const have=new Map((await store.list()).map(r=>[r.id,r]));let n=0;
  for(const r of list){
    if(!r||typeof r.id!='string')continue;
    const {id,...rec}=r,cur=have.get(id);
    if(cur&&(cur.updated||0)>=(rec.updated||0))continue;
    await store.put(id,rec);n++;
  }
  return n;
}
async function importAll(file){
  try{
    let x;try{x=JSON.parse(await file.text())}catch(e){x=null}
    if(!x||x.app!==XAPP)return pmsg('That file is not a WODBLOK export. Use Export everything to make one.');
    if(typeof x.v!='number'||x.v>XV)return pmsg('That export was made by a newer WODBLOK. Update the app first.');
    let ks=0;for(const [k,v] of Object.entries(x.kv||{}))if(isKey(k)&&!OWN.has(k)&&typeof v=='string'){kv.set(k,v);ks++}
    const np=await mergeRecords(ST,Array.isArray(x.projects)?x.projects:[]),nsl=await mergeRecords(SL,Array.isArray(x.stamps)?x.stamps:[]);
    pmsg(`Imported ${np} project${np==1?'':'s'}, ${nsl} stamp${nsl==1?'':'s'}, ${ks} settings. Restarting…`);
    setTimeout(reload,600);
  }catch(e){pmsg('Could not import: '+((e&&e.message)||'unknown error'))}
}
function init36(){
  $('xall').onclick=exportAll;
  $('xallf').onchange=()=>{const f=$('xallf').files[0];$('xallf').value='';if(f)importAll(f)};
}
export {init36};
