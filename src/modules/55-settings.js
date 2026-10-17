import {kv,storage} from '../platform/index.js';
import {cmdList,cmdFormatShortcut} from '../commands/registry.js';
import {$,WBS,WBX,WB_VER} from './01-launch-and-version.js';
import {openPicker,closePicker} from './51-colour-picker.js';
import {setTrayView,TRAY_MAX} from './50-tray-core.js';
import {setAutosaveEvery} from './38-crash-recovery.js';
import {paintDock} from './52-tray-ui.js';
import {acAccount} from '../platform/account.js';
// ===== Settings =====
// One dialog, six pages (General, Colour, Speed, Files, Shortcuts, About). Every control here changes something that already exists in the
// app and is remembered in the settings record (kv). Nothing opens at launch; the dialog opens from File > Settings… or the command.
// The accent colour is made here: one picked colour becomes the four accent tokens of both themes (see accentVars).
const stK_ACC='wb114_accent',stK_DRAFT='wb114_draft',stK_CALM='wb114_calm',stK_TRAY='wb114_trayview',stK_SAVE='wb114_autosave',stK_PAGE='wb114_page',stK_TPL='wb111_tplstart';
const stPAGES=[['general','General'],['colour','Colour'],['speed','Speed'],['files','Files'],['keys','Shortcuts'],['about','About']];
// Accent presets. They are the person's colours, not chrome, so literal values are allowed (style guide 3). The first is the built-in bronze
// and stays the stylesheet's own values (no override is written for it).
// Named after woods, desaturated and warm so they sit with Oak. Each is the base colour; the accent tokens of each theme are derived from it.
// Shown in hue order (red, brown, bronze, green, blue, purple, pink); Birch, the grey, has no hue and comes last.
const stACCENTS=[['Rosewood','#a85a52'],['Walnut','#744f3b'],['Oak',''],['Eucalyptus','#72977f'],['Ironwood','#5f7f9a'],['Purpleheart','#86629a'],['Maple','#c48a96'],['Birch','#a3a09a']];
const stAccentName=cur=>{const a=stACCENTS.find(x=>x[1]===(cur||''));return a?a[0]:'Custom'};
const stSAVE_EVERY=[[8,'8 s'],[30,'30 s'],[120,'2 min']];
const stHEX6=/^#[0-9a-f]{6}$/i;
// ---------------------------------------------------------------- accent colour maths
const stToRgb=h=>[1,3,5].map(i=>parseInt(h.slice(i,i+2),16));
const stToHex=([r,g,b])=>'#'+[r,g,b].map(v=>Math.max(0,Math.min(255,Math.round(v))).toString(16).padStart(2,'0')).join('');
function stRgb2hsl([r,g,b]){r/=255;g/=255;b/=255;const mx=Math.max(r,g,b),mn=Math.min(r,g,b),l=(mx+mn)/2;let h=0,s=0;
 if(mx!==mn){const d=mx-mn;s=l>.5?d/(2-mx-mn):d/(mx+mn);h=mx===r?(g-b)/d+(g<b?6:0):mx===g?(b-r)/d+2:(r-g)/d+4;h/=6}return[h,s,l]}
function stHsl2rgb([h,s,l]){const f=(p,q,t)=>{if(t<0)t+=1;if(t>1)t-=1;return t<1/6?p+(q-p)*6*t:t<1/2?q:t<2/3?p+(q-p)*(2/3-t)*6:p};
 if(!s)return[l*255,l*255,l*255];const q=l<.5?l*(1+s):l+s-l*s,p=2*l-q;return[f(p,q,h+1/3)*255,f(p,q,h)*255,f(p,q,h-1/3)*255]}
const stLum=c=>{const a=stToRgb(c).map(v=>{v/=255;return v<=.03928?v/12.92:Math.pow((v+.055)/1.055,2.4)});return .2126*a[0]+.7152*a[1]+.0722*a[2]};
const stContrast=(a,b)=>{const x=stLum(a),y=stLum(b);return(Math.max(x,y)+.05)/(Math.min(x,y)+.05)};
// the two surfaces the accent text sits on (the --panel of each theme)
const stPANEL={light:'#f6f2e9',dark:'#242220'};
// Move the lightness until the colour reads at 4.5:1 on the panel (the soft accent fill is only 16% of it, so the panel is the worst case).
function stInkOn(h,s,l,panel,dir){let c=stToHex(stHsl2rgb([h,s,l]));for(let i=0;i<40&&stContrast(c,panel)<4.5;i++){l=Math.max(.05,Math.min(.95,l+dir*.02));c=stToHex(stHsl2rgb([h,s,l]))}return c}
// One colour in, the four accent tokens of both themes out. Light: the fill sits mid-dark, the ink darker. Dark: the fill is lifted and the ink is the fill.
function accentVars(hex){
 const[h,s0,l0]=stRgb2hsl(stToRgb(hex)),s=Math.min(s0,.75);
 const lAcc=Math.max(.4,Math.min(.56,l0)),dAcc=Math.max(.56,Math.min(.72,l0<.56?.6:l0));
 const lightAcc=stToHex(stHsl2rgb([h,s,lAcc])),darkAcc=stToHex(stHsl2rgb([h,s,dAcc]));
 const lightInk=stInkOn(h,s,Math.min(lAcc,.4),stPANEL.light,-1),darkInk=stInkOn(h,s,dAcc,stPANEL.dark,1);
 const fg=c=>stContrast(c,'#1b1a18')>=stContrast(c,'#ffffff')?'#1b1a18':'#ffffff',soft=c=>{const[r,g,b]=stToRgb(c);return`rgba(${r},${g},${b},.16)`};
 return{light:{acc:lightAcc,ink:lightInk,fg:fg(lightAcc),soft:soft(lightAcc)},dark:{acc:darkAcc,ink:darkInk,fg:fg(darkAcc),soft:soft(darkAcc)}}}
const stRule=(sel,v)=>`${sel}{--acc:${v.acc};--acc-ink:${v.ink};--acc-fg:${v.fg};--acc-soft:${v.soft}}`;
// A style element written after the page's own rules. The theme is always set on :root (light or dark), so these two selectors cover both.
function accentApply(hex){let el=$('accstyle');if(!stHEX6.test(hex||'')){if(el)el.textContent='';return}
 if(!el){el=document.createElement('style');el.id='accstyle';document.body.appendChild(el)}   // last in the page, after the app's own colour rules
 const v=accentVars(hex);el.textContent=stRule('html:root[data-theme="light"]',v.light)+stRule('html:root[data-theme="dark"]',v.dark)}
const stAccentGet=()=>{let v='';try{v=kv.get(stK_ACC)||''}catch(e){}return stHEX6.test(v)?v.toLowerCase():''};
const stAccentSet=hex=>{try{if(hex)kv.set(stK_ACC,hex);else kv.remove(stK_ACC)}catch(e){}accentApply(hex);acAccount.shareAccent(hex)};   // the website reads the same colour (platform/account.js)
// ---------------------------------------------------------------- remembered flags
const stFlag=(k,d)=>{try{const v=kv.get(k);return v==null?d:v==='1'}catch(e){return d}};
const stFlagSet=(k,on)=>{try{kv.set(k,on?'1':'0')}catch(e){}};
function stNumGet(k,d,lo,hi){try{const n=+kv.get(k);return Number.isFinite(n)&&n>=lo&&n<=hi?n:d}catch(e){return d}}
// the live effects of the flags
const stDraftApply=on=>{WBS.NODR=!on};
const stCalmApply=on=>document.body.classList.toggle('calm',on);
// ---------------------------------------------------------------- the dialog
const stEsc=x=>String(x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const stD=()=>$('stgdlg'),stIsOpen=()=>!stD().hidden;
let stPage='general',stKeyQ='',stOpener=null;
const stTgl=(id,on,label)=>`<div class="stgr"><span>${label}</span><button type="button" class="pvc" id="${id}" aria-pressed="${on}" aria-label="${label}">${on?'On':'Off'}</button></div>`;
const stSegH=(id,label,opts,cur)=>`<div class="stgr"><span>${label}</span><div class="seg" id="${id}" role="group" aria-label="${label}" style="--n:${opts.length}">${opts.map(([v,t])=>`<button type="button" data-v="${v}" class="${String(v)===String(cur)?'on':''}" aria-pressed="${String(v)===String(cur)}">${t}</button>`).join('')}</div></div>`;
// The four view-only toggles (formerly the Display menu). Each one drives the existing hidden button, so the state, keys and commands stay shared.
const stVIEW=[['stgti','gti','Stamp texture'],['stgtx','gtx','Canvas texture'],['stgtm','gtm','Grading masks'],['stgdt','gdt','Stage dots']];
const stViewOn=id=>$(id)?.getAttribute('aria-pressed')==='true';
const stViewToggles=()=>stVIEW.map(([sid,bid,t])=>stTgl(sid,stViewOn(bid),t)).join('');
const stThemeNow=()=>document.documentElement.getAttribute('data-theme')==='light'?'light':'dark';
const stDotsNow=()=>!document.body.classList.contains('plain');
function stAccentRow(){const cur=stAccentGet(),custom=cur&&!stACCENTS.some(a=>a[1]===cur);
 return`<div class="stgr stgacc"><span>Accent</span><b id="stgan">${stAccentName(cur)}</b><div class="stga" id="stgacc" role="group" aria-label="Accent colour">${stACCENTS.map(([n,h])=>`<button type="button" class="stgab" data-h="${h}" aria-label="${n}" aria-pressed="${(h||'')===cur}" style="--c:${h||'#b8914f'}"></button>`).join('')}<button type="button" class="stgab stgac" data-custom="1" aria-label="Custom colour" aria-pressed="${!!custom}" aria-haspopup="dialog" style="--c:${custom?cur:'transparent'}"><svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><path d="M12 6v12M6 12h12"/></svg></button></div></div>`}
function stPageHtml(p){
 if(p=='general')return stSegH('stgth','Theme',[['light','Light'],['dark','Dark']],stThemeNow())+stTgl('stgtl',stFlag(stK_TPL,true),'Templates at launch')+stViewToggles()+stAccentRow();
 if(p=='colour')return`<div class="ctl stgr"><label for="stgtv">Places shown</label><input type="range" id="stgtv" min="7" max="${TRAY_MAX}" step="1" value="${stNumGet(stK_TRAY,7,7,TRAY_MAX)}"><output id="stgtvo">${stNumGet(stK_TRAY,7,7,TRAY_MAX)}</output></div><div class="stgr"><span>Recent colours</span><button type="button" class="alt" id="stgrc">Clear</button></div>`;
 if(p=='speed')return stTgl('stgdr',stFlag(stK_DRAFT,true),'Draft while dragging')+stTgl('stgca',stFlag(stK_CALM,false),'Reduce motion');
 if(p=='files')return stSegH('stgas','Autosave every',stSAVE_EVERY,stNumGet(stK_SAVE,8,8,120))+`<div class="stgr"><span>Storage</span><b id="stguse">…</b></div><div class="stgr"><span>Keep my data</span><button type="button" class="pvc" id="stgkp" aria-pressed="false" aria-label="Keep my data">…</button></div>`;
 if(p=='keys'){const m=/Mac|iPhone|iPad/.test(navigator.platform||'');
  const rows=cmdList().filter(c=>c.shortcut).filter(c=>!stKeyQ||(c.label+' '+c.shortcut).toLowerCase().includes(stKeyQ.toLowerCase()));
  return`<input type="text" id="stgkq" aria-label="Search shortcuts" placeholder="Search" value="${stEsc(stKeyQ)}"><div class="stgk" id="stgkl">${rows.map(c=>`<div class="stgkr"><span>${stEsc(c.label)}</span><kbd>${stEsc(cmdFormatShortcut(c.shortcut,m))}</kbd></div>`).join('')||'<div class="stgkr"><span>No match</span></div>'}</div>`}
 const lic=[['Hanken Grotesk','SIL OFL 1.1'],['IM Fell English','SIL OFL 1.1'],['fflate','MIT']];
 return`<div class="stgr"><span>Version</span><b>v${stEsc(WB_VER)}</b></div><div class="glb">Licences</div>${lic.map(([n,l])=>`<div class="stgr"><span>${n}</span><b>${l}</b></div>`).join('')}`}
function stPaint(){const nav=$('stgnav');nav.innerHTML=stPAGES.map(([k,t])=>`<button type="button" role="tab" data-p="${k}" aria-selected="${k===stPage}" class="${k===stPage?'on':''}">${t}</button>`).join('');
 $('stgbody').innerHTML=stPageHtml(stPage);$('stgbody').setAttribute('aria-labelledby','stgnav');stWire();if(stPage=='files')stStoragePaint()}
async function stStoragePaint(){const u=$('stguse'),k=$('stgkp');if(!u||!k)return;
 try{if(!storage.available()){u.textContent='Not available';k.hidden=true;return}
  const e=await storage.estimate(),keep=await storage.persisted();if(stPage!='files'||!$('stguse'))return;
  const f=n=>n>=1048576?(n/1048576).toFixed(n>=1e8?0:1)+' MB':Math.max(1,Math.round(n/1024))+' KB';
  u.textContent=f(e.used)+' of '+f(e.quota);k.textContent=keep?'On':'Off';k.setAttribute('aria-pressed',String(keep));k.disabled=keep}catch(e){u.textContent='Not available';k.hidden=true}}
function stSetPage(p){if(!stPAGES.some(x=>x[0]===p))return;stPage=p;try{kv.set(stK_PAGE,p)}catch(e){}stPaint()}
function stWire(){const b=$('stgbody');
 const on=(id,fn)=>{const e=$(id);if(e)e.addEventListener('click',fn)};
 const seg=(id,fn)=>{const g=$(id);if(g)g.addEventListener('click',e=>{const x=e.target.closest('[data-v]');if(!x)return;fn(x.dataset.v);g.querySelectorAll('[data-v]').forEach(y=>{y.classList.toggle('on',y===x);y.setAttribute('aria-pressed',String(y===x))})})};
 const flip=(id,k,fn)=>on(id,()=>{const e=$(id),v=e.getAttribute('aria-pressed')!=='true';e.setAttribute('aria-pressed',String(v));e.textContent=v?'On':'Off';stFlagSet(k,v);fn(v)});
 seg('stgth',v=>{if(stThemeNow()!==v)$('thm').click()});
 stVIEW.forEach(([sid,bid])=>on(sid,()=>{$(bid).click();const v=stViewOn(bid),e=$(sid);e.setAttribute('aria-pressed',String(v));e.textContent=v?'On':'Off'}));
 const g=$('stgacc');if(g)g.addEventListener('click',e=>{const x=e.target.closest('.stgab');if(!x)return;
  if(x.dataset.custom){const cur=stAccentGet()||'#b8914f';openPicker(x,{value:cur,alpha:false,onInput:h=>{const v=String(h).slice(0,7).toLowerCase();if(stHEX6.test(v)){stAccentSet(v);stAccentMarks()}},onClose:()=>stAccentMarks()});return}
  closePicker();stAccentSet(x.dataset.h);stAccentMarks()});
 const tv=$('stgtv');if(tv)tv.addEventListener('input',()=>{const n=+tv.value;$('stgtvo').textContent=n;try{kv.set(stK_TRAY,String(n))}catch(e){}setTrayView(n);try{paintDock(true)}catch(e){}});
 on('stgrc',()=>{try{kv.remove('wb200_recent')}catch(e){}const c=$('stgrc');c.textContent='Cleared';c.disabled=true});
 flip('stgtl',stK_TPL,()=>{});flip('stgdr',stK_DRAFT,stDraftApply);flip('stgca',stK_CALM,stCalmApply);
 seg('stgas',v=>{const n=+v;try{kv.set(stK_SAVE,String(n))}catch(e){}setAutosaveEvery(n*1000)});
 on('stgkp',async()=>{try{await storage.persist()}catch(e){}stStoragePaint()});
 const q=$('stgkq');if(q)q.addEventListener('input',()=>{stKeyQ=q.value;const m=/Mac|iPhone|iPad/.test(navigator.platform||'');
  const rows=cmdList().filter(c=>c.shortcut).filter(c=>!stKeyQ||(c.label+' '+c.shortcut).toLowerCase().includes(stKeyQ.toLowerCase()));
  $('stgkl').innerHTML=rows.map(c=>`<div class="stgkr"><span>${stEsc(c.label)}</span><kbd>${stEsc(cmdFormatShortcut(c.shortcut,m))}</kbd></div>`).join('')||'<div class="stgkr"><span>No match</span></div>'})}
// the swatch row follows the stored accent (the picker changes it live)
function stAccentMarks(){const g=$('stgacc');if(!g)return;const cur=stAccentGet(),custom=cur&&!stACCENTS.some(a=>a[1]===cur),n=$('stgan');if(n)n.textContent=stAccentName(cur);
 g.querySelectorAll('.stgab').forEach(b=>{const c=b.dataset.custom;b.setAttribute('aria-pressed',String(c?!!custom:(b.dataset.h||'')===cur));if(c)b.style.setProperty('--c',custom?cur:'transparent')})}
function stShow(){try{if(typeof WBX.wbCloseMenus=='function')WBX.wbCloseMenus()}catch(e){}
 {const a=document.activeElement;stOpener=a&&a!==document.body&&a.focus&&a.offsetParent!==null&&!a.closest('#filem')?a:$('fileb')}
 try{const p=kv.get(stK_PAGE);if(stPAGES.some(x=>x[0]===p))stPage=p}catch(e){}
 stKeyQ='';stPaint();stD().hidden=false;const t=$('stgnav').querySelector('.on');if(t)t.focus()}
function stHide(){if(stD().hidden)return;closePicker();stD().hidden=true;const b=stOpener&&stOpener.isConnected?stOpener:$('fileb');if(b&&b.focus)b.focus()}
function init55(){
 accentApply(stAccentGet());acAccount.shareAccent(stAccentGet());stDraftApply(stFlag(stK_DRAFT,true));stCalmApply(stFlag(stK_CALM,false));
 {const tv=stNumGet(stK_TRAY,7,7,TRAY_MAX);setTrayView(tv);if(tv>7)try{paintDock(true)}catch(e){}}setAutosaveEvery(stNumGet(stK_SAVE,8,8,120)*1000);
 $('stgo').onclick=stShow;$('stgclose').onclick=stHide;stD().addEventListener('click',e=>{if(e.target===stD())stHide()});
 $('stgnav').addEventListener('click',e=>{const b=e.target.closest('[data-p]');if(b){stSetPage(b.dataset.p);const n=$('stgnav').querySelector('.on');if(n)n.focus()}});
 // arrow keys move between the pages
 $('stgnav').addEventListener('keydown',e=>{if(!['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;e.preventDefault();
  const i=stPAGES.findIndex(x=>x[0]===stPage),n=e.key=='Home'?0:e.key=='End'?stPAGES.length-1:(i+(e.key=='ArrowUp'||e.key=='ArrowLeft'?-1:1)+stPAGES.length)%stPAGES.length;stSetPage(stPAGES[n][0]);const b=$('stgnav').querySelector('.on');if(b)b.focus()});
 // Escape closes the dialog (before the app's own Escape handling), unless the colour picker has it first
 document.addEventListener('keydown',e=>{if(e.key!='Escape'||!stIsOpen())return;if(document.querySelector('.cpk:not([hidden])'))return;if(e.target.matches&&e.target.matches('#stgkq')&&e.target.value){e.target.value='';e.target.dispatchEvent(new Event('input'));e.stopImmediatePropagation();e.preventDefault();return}
  e.stopImmediatePropagation();e.preventDefault();stHide()},true)}
export {init55,accentVars,accentApply};
