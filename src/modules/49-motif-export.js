import {use} from '../platform/index.js';
import {$} from './01-launch-and-version.js';
import {buildMotifZip,motifSvg,safeName} from '../format/motifs.js';
import {rowMenu} from './04-canvas-and-stamp-outlines.js';
import {mk} from './06-motif-library-folders.js';
import {libExportList,mNm} from './21-motif-library-ui.js';
import {pmsg} from './18-projects-and-cover-overlay.js';
// ===== Shape export: the library as a zip of SVG files =====
// With all folders showing (the top of the library) the button exports every shape, folder by folder. Inside a folder it exports
// that folder; when the folder has folders inside it, a small menu asks whether to include them. Each shape is its own SVG (black on
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
function init49(){
  $('fexp').onclick=e=>{
    e.stopPropagation();                                      // as the folder's own menu button does: a click elsewhere must not close the menu at once
    const deep=libExportList(true);
    if(deep.root||!deep.sub)return mxSave(deep);
    rowMenu($('fexp'),[['This folder only',()=>mxSave(libExportList(false))],['This folder and the folders inside it',()=>mxSave(libExportList(true))]]);
  };
}
export {init49};
