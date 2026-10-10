import {kv,reload,use} from '../platform/index.js';
import {$,WB_VER} from './01-launch-and-version.js';
import {pmsg} from './18-projects-and-cover-overlay.js';
import {SL} from './27-stamp-library.js';
// ===== Back up everything / Restore from backup =====
// One file with everything the app keeps for you except projects (those are .wodblok files): the stamp library, and every setting and library
// (motifs, folders, colours, fonts, snapshots, the working copy). It exists so data can move between where the app
// runs (the claude.ai preview, the web app, a new browser). Format: {app:'WODBLOK-EXPORT', v:1, ...}.
const XV=1,XAPP='WODBLOK-EXPORT';
const OWN=new Set(['wb18_projects','wb50_stamps']);           // these two hold the records listed separately below
const isKey=k=>/^wb\d+_/.test(k);
async function exportAll(){
  try{
    const d=await use('downloads');if(!d)return pmsg('Downloading is not available here.');
    const keys={};for(const k of kv.keys())if(isKey(k)&&!OWN.has(k))keys[k]=kv.get(k);
    const stamps=await SL.list();
    const out={app:XAPP,v:XV,exported:new Date().toISOString(),build:WB_VER,kv:keys,stamps};
    const day=out.exported.slice(0,10);
    await d.save({filename:'wodblok-everything-'+day+'.wodblok-all.json',data:JSON.stringify(out)});
    pmsg(`Backed up ${stamps.length} stamp${stamps.length==1?'':'s'} and ${Object.keys(keys).length} settings.`);
  }catch(e){if(!e||e.code!='declined')pmsg('Could not back up: '+((e&&e.message)||'unknown error'))}
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
    if(!x||x.app!==XAPP)return pmsg('That file is not a WODBLOK backup. Use Back up everything to make one.');
    if(typeof x.v!='number'||x.v>XV)return pmsg('That backup was made by a newer WODBLOK. Update the app first.');
    let ks=0;for(const [k,v] of Object.entries(x.kv||{}))if(isKey(k)&&!OWN.has(k)&&typeof v=='string'){kv.set(k,v);ks++}
    const nsl=await mergeRecords(SL,Array.isArray(x.stamps)?x.stamps:[]);
    pmsg(`Restored ${nsl} stamp${nsl==1?'':'s'} and ${ks} settings. Restarting…`);
    setTimeout(reload,600);
  }catch(e){pmsg('Could not restore: '+((e&&e.message)||'unknown error'))}
}
function init36(){
  $('xall').onclick=exportAll;
  $('xallf').onchange=()=>{const f=$('xallf').files[0];$('xallf').value='';if(f)importAll(f)};
}
export {init36};
