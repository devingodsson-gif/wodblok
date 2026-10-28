import {kv} from '../platform/index.js';
const WBH={};
const WBX={};
const WBS={noTile:{id:0,items:[],et:0,er:0}};   // noTile: what the editor reads while the project has no stamp at all (2.15.0); it is never in the document
// One place to change the version (package.json): the badge, tooltip and page title all follow this text, e.g. 0.108 (shown as v0.108).
const WB_VER='0.100';
// When this build was made (ISO time, written by the build from the commit date; empty when running the unbundled modules).
const WB_BUILT='';
const $=id=>document.getElementById(id),mod=(a,b)=>((a%b)+b)%b;
function init01(){document.title='Wodblok v'+WB_VER;{const b=document.getElementById('pbuilt'),d=WB_BUILT&&new Date(WB_BUILT);if(b&&d&&!isNaN(d)){b.textContent='Updated '+d.toLocaleString(undefined,{day:'numeric',month:'short',year:'numeric',hour:'numeric',minute:'2-digit'});b.title='Built '+WB_BUILT;b.hidden=false}}{const v=document.getElementById('ver');if(v){v.textContent='v'+WB_VER;v.title='Version '+WB_VER}}{const v=document.getElementById('splver');if(v)v.textContent='v'+WB_VER}   /* 2.69.0: the loading screen shows the version */
// Every launch starts fresh: one blank stamp, default settings everywhere, the Pattern view, and no panels open in either mode.
// Kept between launches: your motif library and its folders, custom colours, and saved projects.
try{['wb2_tiles','wb2_proj','wb4_layers','wb14_dim','wb10_tex','wb11_print','wb41_grade','wb33_grid','wb40_book','wb31_cover','wb40_coverB','wb40_coverS',
'wb18_cur','wb18_mlfold','wb24_panel','wb30_ws','wb31_pvc','wb31_pvz','wb36_rz','wb11_mcat'].forEach(k=>kv.remove(k))}catch(e){}
// If the browser or app brings the page back from memory instead of starting it again (swiping back to the tab, reopening the app), the old session would still be on screen. Start it again so the launch is always blank.
addEventListener('pageshow',e=>{if(e.persisted)location.reload()});
WBS.ARTS={};
}
export {$,WBH,WBS,WBX,WB_BUILT,WB_VER,mod,init01};
