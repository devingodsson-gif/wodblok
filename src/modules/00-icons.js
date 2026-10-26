// ===== The icon set (2.14.0, owner Oct 21 2026: "very minimalist and simple, clean yet clear and communicative, like Photoshop").
// Every UI icon in the app is drawn here, once, on a 24-unit grid: line icons, no fill, round caps and joins, the drawing kept inside 3.5..20.5.
// The line weight is not set here: the .ic rules draw every icon with the same screen-pixel stroke at any size (vector-effect: non-scaling-stroke),
// the way Photoshop's icons keep one hairline weight. A dot is a small circle, never a zero-length line.
// The page's own icons are written as <svg class="ic" data-ic="name"></svg> and filled at start-up by icFill(); code builds one with ic(name).
// Shape pickers (stamp outlines, grid cells, shape presets) draw the shape itself: they are artwork, not icons, and stay with their panels.
const R='rx="1.5"';
const ICN={
// ----- edit -----
undo:'<path d="M8.5 5.5l-4 4 4 4"/><path d="M4.5 9.5H14a5 5 0 010 10h-3.5"/>',
redo:'<path d="M15.5 5.5l4 4-4 4"/><path d="M19.5 9.5H10a5 5 0 000 10h3.5"/>',
search:'<circle cx="10.5" cy="10.5" r="6"/><path d="M15 15l5 5"/>',
close:'<path d="M6.5 6.5l11 11M17.5 6.5l-11 11"/>',
plus:'<path d="M12 5v14M5 12h14"/>',
minus:'<path d="M5 12h14"/>',
more:'<circle cx="6" cy="12" r="1.1"/><circle cx="12" cy="12" r="1.1"/><circle cx="18" cy="12" r="1.1"/>',
menu:'<path d="M4.5 7h15M4.5 12h15M4.5 17h15"/>',
chevR:'<path d="M10 6.5l5.5 5.5-5.5 5.5"/>',
// a ticked menu item (2.42.0: the menu bar's on/off commands)
check:'<path d="M5 12.5l4.5 4.5 9.5-10"/>',
chevL:'<path d="M14 6.5L8.5 12l5.5 5.5"/>',
chevD:'<path d="M6.5 10l5.5 5.5 5.5-5.5"/>',
chevsD:'<path d="M7 6.5l5 5 5-5M7 12.5l5 5 5-5"/>',
unfold:'<path d="M8 8.5l4-4 4 4M8 15.5l4 4 4-4"/>',
fold:'<path d="M8 4.5l4 4 4-4M8 19.5l4-4 4 4"/>',
duplicate:'<rect x="8.5" y="8.5" width="11.5" height="11.5" '+R+'/><path d="M15.5 8.5V5.5A1.5 1.5 0 0014 4H5.5A1.5 1.5 0 004 5.5V14a1.5 1.5 0 001.5 1.5h3"/>',
trash:'<path d="M4.5 6.5h15M9.5 6.5v-2h5v2M6.5 6.5l.9 13h9.2l.9-13"/><path d="M10.2 10.5v5.5M13.8 10.5v5.5"/>',
pencil:'<path d="M5 19l.9-3.9L15.6 5.4a1.9 1.9 0 012.7 0l.3.3a1.9 1.9 0 010 2.7L8.9 18.1z"/><path d="M13.8 7.2l3 3"/>',
lock:'<rect x="5.5" y="10.5" width="13" height="9.5" '+R+'/><path d="M8.5 10.5V8a3.5 3.5 0 017 0v2.5"/>',
unlock:'<rect x="5.5" y="10.5" width="13" height="9.5" '+R+'/><path d="M8.5 10.5V8a3.5 3.5 0 016.8-1.2"/>',
eye:'<path d="M2.5 12c2.2-4 5.4-6 9.5-6s7.3 2 9.5 6c-2.2 4-5.4 6-9.5 6s-7.3-2-9.5-6z"/><circle cx="12" cy="12" r="2.75"/>',
eyeOff:'<path d="M9.4 6.4A10 10 0 0112 6c4.1 0 7.3 2 9.5 6a15 15 0 01-2.6 3.4M6.4 7.8A14 14 0 002.5 12c2.2 4 5.4 6 9.5 6a9.6 9.6 0 004.5-1.1"/><path d="M4 4l16 16"/>',
eyedropper:'<path d="M13.5 7.5L5.5 15.5V18.5h3l8-8"/><path d="M12 6l6 6"/><path d="M15 9l3-3a2.1 2.1 0 00-3-3l-3 3"/>',
reset:'<path d="M4.5 12a7.5 7.5 0 102.2-5.3L4.5 9"/><path d="M4.5 4.5V9H9"/>',
pin:'<path d="M9.5 4.5h5l-.8 5.5 2.8 3H7.5l2.8-3z"/><path d="M12 13v6.5"/>',
cursor:'<path d="M6.5 4v14l3.7-3.4 2.6 5.7 2.4-1.1-2.6-5.6 5-.4z"/>',
hand:'<path d="M8 13V6.5a1.5 1.5 0 013 0V12M11 11.5V5a1.5 1.5 0 013 0v6.5M14 11.5V7a1.5 1.5 0 013 0v7a6.5 6.5 0 01-6.5 6.5h-.4a6 6 0 01-4.7-2.3L5 15.6a1.6 1.6 0 012.6-1.9L8 14.3"/>',
// ----- files -----
file:'<path d="M6.5 3.5h7l4 4v13h-11z"/><path d="M13.5 3.5v4h4"/>',
fileText:'<path d="M6.5 3.5h7l4 4v13h-11z"/><path d="M13.5 3.5v4h4M9.5 12.5h5M9.5 15.5h5"/>',
template:'<rect x="4" y="4" width="16" height="16" '+R+'/><path d="M4 9.5h16M10 9.5V20"/>',
folder:'<path d="M3.5 6.5A1.5 1.5 0 015 5h4l2 2.5h8A1.5 1.5 0 0120.5 9v9a1.5 1.5 0 01-1.5 1.5H5A1.5 1.5 0 013.5 18z"/>',
folderOpen:'<path d="M3.5 18.5v-12A1.5 1.5 0 015 5h4l2 2.5h6.5A1.5 1.5 0 0119 9v1.5"/><path d="M3.5 18.5l2.6-7a1.5 1.5 0 011.4-1h13l-2.8 7.5a1.5 1.5 0 01-1.4 1z"/>',
folderNew:'<path d="M3.5 6.5A1.5 1.5 0 015 5h4l2 2.5h8A1.5 1.5 0 0120.5 9v9a1.5 1.5 0 01-1.5 1.5H5A1.5 1.5 0 013.5 18z"/><path d="M12 10.5v6M9 13.5h6"/>',
home:'<path d="M4 11l8-6.5 8 6.5"/><path d="M6.5 9v10.5h11V9"/>',
save:'<path d="M5.5 4h10l3.5 3.5v11a1.5 1.5 0 01-1.5 1.5h-12A1.5 1.5 0 014 18.5v-13A1.5 1.5 0 015.5 4z"/><path d="M8 4v4.5h7V4M8 20v-5.5h8V20"/>',
bookmark:'<path d="M7 4h10v16l-5-3.5L7 20z"/>',
importIc:'<path d="M12 15V4.5M8 8.5l4-4 4 4"/><path d="M4.5 14.5v4A1.5 1.5 0 006 20h12a1.5 1.5 0 001.5-1.5v-4"/>',
download:'<path d="M12 4.5V15M8 11l4 4 4-4"/><path d="M4.5 14.5v4A1.5 1.5 0 006 20h12a1.5 1.5 0 001.5-1.5v-4"/>',
image:'<rect x="3.5" y="4.5" width="17" height="15" '+R+'/><circle cx="9" cy="9.5" r="1.5"/><path d="M3.5 17l5-5 4 4 2.5-2.5 5.5 5.5"/>',
pen:'<path d="M12 3.5L6.5 12l2 7.5h7l2-7.5z"/><path d="M12 3.5v7"/><circle cx="12" cy="12" r="1.4"/>',
spread:'<rect x="3.5" y="5" width="17" height="14" '+R+'/><path d="M9.5 5v14M14.5 5v14"/>',
eraser:'<path d="M9 20h10.5"/><path d="M4.9 14.6l8.6-8.6a1.5 1.5 0 012.1 0l2.9 2.9a1.5 1.5 0 010 2.1L10.5 19H8.6l-3.7-3.7a.5.5 0 010-.7z"/><path d="M9.3 10.2l4.5 4.5"/>',
settings:'<path d="M10.27 5.53L10.36 3.56h3.28l.09 1.97 1.62.67 1.46-1.33 2.32 2.32-1.33 1.46.67 1.62 1.97.09v3.28l-1.97.09-.67 1.62 1.33 1.46-2.32 2.32-1.46-1.33-1.62.67-.09 1.97h-3.28l-.09-1.97-1.62-.67-1.46 1.33-2.32-2.32 1.33-1.46-.67-1.62-1.97-.09v-3.28l1.97-.09.67-1.62-1.33-1.46 2.32-2.32 1.46 1.33z"/><circle cx="12" cy="12" r="2.8"/>',
user:'<circle cx="12" cy="8.5" r="3.5"/><path d="M5 20a7 7 0 0114 0"/>',
feedback:'<path d="M4.5 5.5h15v10.5H11l-4.5 3.5V16h-2z"/>',
sun:'<circle cx="12" cy="12" r="3.5"/><path d="M12 3.5v2M12 18.5v2M3.5 12h2M18.5 12h2M6 6l1.4 1.4M16.6 16.6L18 18M6 18l1.4-1.4M16.6 7.4L18 6"/>',
moon:'<path d="M19.5 14.5A7.5 7.5 0 019.5 4.5a7.5 7.5 0 1010 10z"/>',
// ----- windows -----
panels:'<rect x="3.5" y="4.5" width="17" height="15" '+R+'/><path d="M14.5 4.5v15"/>',
panelsDefault:'<rect x="3.5" y="4.5" width="17" height="15" '+R+'/><path d="M14.5 4.5v15M9 9.5v5M6.5 12h5"/>',
panelsClose:'<rect x="3.5" y="4.5" width="17" height="15" '+R+'/><path d="M14.5 4.5v15M7 10l4 4M11 10l-4 4"/>',
popout:'<path d="M13.5 4h6.5v6.5M20 4l-8.5 8.5"/><path d="M17.5 13.5v5a1.5 1.5 0 01-1.5 1.5H5.5A1.5 1.5 0 014 18.5V8A1.5 1.5 0 015.5 6.5h5"/>',
// ----- arrange -----
front:'<path d="M5 4.5h14M12 20V8.5M7.5 13L12 8.5l4.5 4.5"/>',
back:'<path d="M5 19.5h14M12 4v11.5M7.5 11l4.5 4.5 4.5-4.5"/>',
flip:'<path d="M12 3.5v17M9 7L4 17h5zM15 7l5 10h-5z"/>',
group:'<path d="M4 8V5.5A1.5 1.5 0 015.5 4H8M16 4h2.5A1.5 1.5 0 0120 5.5V8M20 16v2.5a1.5 1.5 0 01-1.5 1.5H16M8 20H5.5A1.5 1.5 0 014 18.5V16"/><rect x="8" y="8" width="8" height="8" rx="1"/>',
ungroup:'<rect x="4" y="4" width="7" height="7" '+R+'/><rect x="13" y="13" width="7" height="7" '+R+'/>',
knockout:'<rect x="4" y="4" width="16" height="16" '+R+'/><circle cx="12" cy="12" r="4"/>',
split:'<rect x="4" y="5" width="16" height="14" '+R+'/><path d="M8 16.5l8-9"/>',
marquee:'<path d="M4 7V5.5A1.5 1.5 0 015.5 4H7M10.5 4h3M17 4h1.5A1.5 1.5 0 0120 5.5V7M20 10.5v3M20 17v1.5a1.5 1.5 0 01-1.5 1.5H17M13.5 20h-3M7 20H5.5A1.5 1.5 0 014 18.5V17M4 13.5v-3"/>',
// ----- tools (rail and element bar) -----
crop:'<path d="M7 3.5V17h13.5"/><path d="M3.5 7H17v13.5"/>',
colours:'<circle cx="9" cy="9.5" r="5"/><circle cx="15" cy="9.5" r="5"/><circle cx="12" cy="14.5" r="5"/>',
layers:'<path d="M12 4l8.5 4.5L12 13 3.5 8.5z"/><path d="M3.5 12.2L12 16.7l8.5-4.5"/><path d="M3.5 15.7L12 20.2l8.5-4.5"/>',
grid:'<rect x="4" y="4" width="16" height="16" '+R+'/><path d="M4 9.33h16M4 14.67h16M9.33 4v16M14.67 4v16"/>',
history:'<path d="M4.5 12a7.5 7.5 0 102.2-5.3"/><path d="M4.5 4.5v4h4"/><path d="M12 8v4l2.8 1.8"/>',
dice:'<rect x="4" y="4" width="16" height="16" rx="2.5"/><circle cx="8.6" cy="8.6" r="1.1"/><circle cx="15.4" cy="8.6" r="1.1"/><circle cx="12" cy="12" r="1.1"/><circle cx="8.6" cy="15.4" r="1.1"/><circle cx="15.4" cy="15.4" r="1.1"/>',
books:'<rect x="4" y="5" width="4.5" height="14.5" rx="1"/><rect x="10" y="5" width="4.5" height="14.5" rx="1"/><path d="M16.2 6.3l2.9-.8 2.4 13.3-2.9.8z"/>',
pattern:'<rect x="4" y="4" width="6.5" height="6.5" rx="1"/><rect x="13.5" y="4" width="6.5" height="6.5" rx="1"/><rect x="4" y="13.5" width="6.5" height="6.5" rx="1"/><rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1"/>',
stamp:'<circle cx="12" cy="6.5" r="2.5"/><path d="M10.6 9l-.6 3.5h4L13.4 9"/><path d="M5 12.5h14a1 1 0 011 1v3H4v-3a1 1 0 011-1z"/><path d="M5.5 19.5h13"/>',
motif:'<circle cx="8.5" cy="8.5" r="4.5"/><rect x="12.5" y="12.5" width="8" height="8" rx="1"/><path d="M4.5 20.5l3.3-6 3.3 6z"/>',
sheet:'<rect x="3.5" y="4.5" width="17" height="15" '+R+'/><path d="M3.5 15.5l11-11M9.5 19.5l11-11"/>',
shape:'<rect x="4" y="4" width="10" height="10" '+R+'/><circle cx="15.5" cy="15.5" r="4.75"/>',
text:'<path d="M5 7V5h14v2M12 5v14M9.5 19h5"/>',
brush:'<path d="M19.5 4.5c-1 2.6-4.9 6.5-7.6 8.1l-1.5-1.5c1.6-2.7 5.5-6.6 8.1-7.6z"/><path d="M10.2 13.3c-2 0-3.4 1.4-3.4 3.2 0 1.3-.8 2.3-2.3 2.6 1 .6 2.2.9 3.4.9 2.5 0 4-1.6 4-3.7"/>',
// ----- view toggles -----
texture:'<rect x="4" y="4" width="16" height="16" '+R+'/><path d="M8 16l8-8M8 11.5l3.5-3.5M12.5 16l3.5-3.5"/>',
canvasTexture:'<path d="M3.5 8c2.8 0 2.8-2 5.6-2s2.8 2 5.8 2 2.8-2 5.6-2M3.5 13c2.8 0 2.8-2 5.6-2s2.8 2 5.8 2 2.8-2 5.6-2M3.5 18c2.8 0 2.8-2 5.6-2s2.8 2 5.8 2 2.8-2 5.6-2"/>',
mask:'<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4"/>',
dots:'<circle cx="6" cy="6" r="1"/><circle cx="12" cy="6" r="1"/><circle cx="18" cy="6" r="1"/><circle cx="6" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="18" cy="12" r="1"/><circle cx="6" cy="18" r="1"/><circle cx="12" cy="18" r="1"/><circle cx="18" cy="18" r="1"/>',
// ----- grading masks (kept with the hidden grade code) -----
gradLinear:'<rect x="4" y="4" width="16" height="16" '+R+'/><path d="M4 12h16M8 4v16"/>',
gradRadial:'<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4"/><circle cx="12" cy="12" r="1"/>',
drop:'<path d="M12 3.5s6 6.2 6 10.2a6 6 0 01-12 0c0-4 6-10.2 6-10.2z"/>',
contrast:'<circle cx="12" cy="12" r="8.5"/><path d="M12 3.5v17M12 7.5h4.5M12 11.5h6.5M12 15.5h5"/>',
// ----- align -----
alignCx:'<path d="M12 3.5v17"/><rect x="6" y="9" width="12" height="6" rx="1"/>',
alignCy:'<path d="M3.5 12h17"/><rect x="9" y="6" width="6" height="12" rx="1"/>',
distX:'<path d="M4 4v16M20 4v16"/><rect x="9.5" y="8" width="5" height="8" rx="1"/>',
distY:'<path d="M4 4h16M4 20h16"/><rect x="8" y="9.5" width="8" height="5" rx="1"/>',
// ----- the tray -----
tray:'<path d="M3.8 13.5l2.3-6.8A1.8 1.8 0 017.8 5.5h8.4a1.8 1.8 0 011.7 1.2l2.3 6.8V18a1.5 1.5 0 01-1.5 1.5H5.3A1.5 1.5 0 013.8 18z"/><path d="M3.8 13.5H9a3 3 0 006 0h5.2"/>'
};
// one position of the 3x3 align grid: a frame and a small square in row r, column c
const icAlign=(r,c)=>`<rect x="4" y="4" width="16" height="16" ${R}/><rect x="${6+c*4}" y="${6+r*4}" width="4" height="4" rx=".75"/>`;
const IC_OPEN='<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">';
// an icon as markup: a name from the set, or inner markup
function ic(n){return IC_OPEN+(ICN[n]!=null?ICN[n]:n)+'</svg>'}
// fill the page's own icons (<svg data-ic="name">); an unknown name leaves the icon empty
function icFill(root){(root||document).querySelectorAll('svg[data-ic]').forEach(s=>{const d=ICN[s.dataset.ic];if(d!=null&&!s.firstChild)s.innerHTML=d})}
// Every icon-only button shows its name on hover and has the same accessible name (Part 9, section 8; 2.29.0). The accessible name leads: a button with only one of
// the two gets the other, and a title that says something else is set to the name. A title may add a shortcut in brackets ("Undo (Ctrl+Z)"); that is kept.
// One watcher keeps every button on the page in line as lists and menus are redrawn, so no panel has to remember it.
const icBare=t=>String(t||'').replace(/ \([^)]*\)$/,'');
function icNm(b){if(!b||b.tagName!=='BUTTON'||!b.querySelector('svg')||b.textContent.trim())return;const t=b.getAttribute('title'),a=b.getAttribute('aria-label');
 if(a){if(!t||(t!==a&&icBare(t)!==a))b.setAttribute('title',a)}else if(t)b.setAttribute('aria-label',icBare(t))}   // a name that itself ends in brackets is left alone, so this never sets the same title again
function icNames(root){(root||document).querySelectorAll('button').forEach(icNm)}
function icNamesWatch(){icNames();if(typeof MutationObserver!='function')return;
 new MutationObserver(ms=>{for(const m of ms){const n=m.target;if(m.type==='attributes'){icNm(n);continue}if(n.closest&&n.closest('svg'))continue;   // the artwork and its overlays are never buttons
  m.addedNodes.forEach(x=>{if(x.nodeType!==1)return;if(x.tagName==='BUTTON')icNm(x);else if(x.tagName!=='svg'&&x.querySelectorAll)x.querySelectorAll('button').forEach(icNm)})}})
  .observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['title','aria-label']})}
export {ICN,IC_OPEN,ic,icAlign,icFill,icNames,icNamesWatch};
