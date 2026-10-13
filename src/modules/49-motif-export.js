import {use} from '../platform/index.js';
import {$,WBX} from './01-launch-and-version.js';
import {buildMotifZip,motifSvg,safeName} from '../format/motifs.js';
import {rowMenu} from './04-canvas-and-stamp-outlines.js';
import {mk} from './06-motif-library-folders.js';
import {libExportList,mNm} from './21-motif-library-ui.js';
import {pmsg} from './18-projects-and-cover-overlay.js';
// ===== Shape export: the library as a zip of SVG files =====
// The toolbar button exports every shape, folder by folder. A folder's menu exports that folder; when the folder has folders
// inside it, a small menu asks whether to include them. Each shape is its own SVG (black on
// transparent, cut parts as real holes, no stamp or palette colours) and folders inside folders stay folders inside the zip. A shape
// that sits in two places (a built-in shape also filed in one of your folders) appears in both, as it does in the library.
const mxEntry=k=>({name:mNm(k),svg:motifSvg((c,d)=>mk(k,c,d))});
const mxFolders=l=>l.folders.map(f=>({path:f.path,items:f.ks.map(mxEntry)}));
async function mxSave(l){
  const d=await use('downloads');if(!d)return pmsg('Saving is not available here.');
  const name=safeName(l.root?'wodblok-shapes':l.name+' shapes','shapes')+'.zip';
  try{
    const {zip,count}=buildMotifZip(mxFolders(l));          // quick (text only), so it can come before the Save dialog
    if(!zip)return pmsg('There are no shapes to export.');
    const h0=d.pick?await d.pick({filename:name}):null;
    await d.save({filename:name,data:new Blob([zip],{type:'application/zip'}),handle:h0});
    pmsg(`Exported ${count} shape${count>1?'s':''} as SVG files.`);
  }catch(e){if(e&&e.code=='declined')return pmsg('');pmsg((e&&e.message)||'Could not export.')}
}
// the toolbar button exports the whole library; a folder's menu exports that folder, asking about the folders inside it if it has any
function mxFolder(v,btn){
  const deep=libExportList(true,v);
  if(deep.root||!deep.sub)return mxSave(deep);
  rowMenu(btn,[['This folder only',()=>mxSave(libExportList(false,v))],['This folder and the folders inside it',()=>mxSave(libExportList(true,v))]]);
}
function init49(){
  $('fexp').onclick=e=>{e.stopPropagation();mxSave(libExportList(true,'/'))};
  WBX.wbExport=mxFolder;
}
export {init49};
