const WBX={};
const WBS={};
// One place to change the version: the badge, tooltip and page title all follow this number.
const WB_VER=100;document.title='Wodblok v'+WB_VER;{const v=document.getElementById('ver');if(v){v.textContent='v'+WB_VER;v.title='Version '+WB_VER}}
// Every launch starts fresh: one blank stamp, default settings everywhere, the Pattern view, and no panels open in either mode.
// Kept between launches: your motif library and its folders, custom colours, and saved projects.
try{['wb2_tiles','wb2_proj','wb4_layers','wb14_dim','wb10_tex','wb11_print','wb41_grade','wb33_grid','wb40_book','wb31_cover','wb40_coverB','wb40_coverS',
'wb18_cur','wb18_mlfold','wb24_panel','wb30_ws','wb31_pvc','wb31_pvz','wb36_rz','wb11_mcat'].forEach(k=>localStorage.removeItem(k))}catch(e){}
// If the browser or app brings the page back from memory instead of starting it again (swiping back to the tab, reopening the app), the old session would still be on screen. Start it again so the launch is always blank.
addEventListener('pageshow',e=>{if(e.persisted)location.reload()});
WBS.ARTS={};
const $=id=>document.getElementById(id),mod=(a,b)=>((a%b)+b)%b;
