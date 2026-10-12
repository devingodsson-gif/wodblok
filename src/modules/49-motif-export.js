import {use} from '../platform/index.js';
import {$} from './01-launch-and-version.js';
import {buildMotifZip,motifSvg,safeName} from '../format/motifs.js';
import {mk} from './06-motif-library-folders.js';
import {libCats,libCur,mNm} from './21-motif-library-ui.js';
import {pmsg} from './18-projects-and-cover-overlay.js';
// ===== Motif export: the library as a zip of SVG files =====
// "Export all motifs" writes every folder and set; "Export this folder" writes the one chosen in the Library list.
// Each motif is its own SVG (black on transparent, cut parts as real holes, no stamp or palette colours), and each folder
// or set becomes a folder inside the zip. A motif that sits in two places (a built-in motif also filed in one of your folders)
// appears in both, as it does in the library.
const mxEntry=k=>({name:mNm(k),svg:motifSvg((c,d)=>mk(k,c,d))});
const mxFolder=x=>({name:x.n,items:x.ks.map(mxEntry)});
async function mxSave(folders,base){
  const d=await use('downloads');if(!d)return pmsg('Saving is not available here.');
  const name=safeName(base,'motifs')+'.zip';
  try{
    const {zip,count}=buildMotifZip(folders);               // quick (text only), so it can come before the Save dialog
    if(!zip)return pmsg('There are no motifs to export.');
    const h0=d.pick?await d.pick({filename:name}):null;
    await d.save({filename:name,data:new Blob([zip],{type:'application/zip'}),handle:h0});
    pmsg(`Exported ${count} motif${count>1?'s':''} as SVG files.`);
  }catch(e){if(e&&e.code=='declined')return pmsg('');pmsg((e&&e.message)||'Could not export.')}
}
function init49(){
  $('fexa').onclick=()=>mxSave(libCats().map(mxFolder),'wodblok-motifs');
  $('fexf').onclick=()=>{const c=libCur();mxSave([mxFolder(c)],c.n+' motifs')};
}
export {init49};
