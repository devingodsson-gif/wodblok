import {ic} from './00-icons.js';
import {$,WBX,WB_VER} from './01-launch-and-version.js';
import {cmdFormatShortcut,cmdRegister} from '../commands/registry.js';
import {HELP_NEWS,HELP_PAGES} from './46-help-pages.js';
import {ST_LIC,stKeys} from './55-settings.js';
// ===== Help (2.87.4, docs/pro-basics-plan.md step 4; owner Nov 3 2026: "it can be a panel floating in the middle like export at first. lets call these undocked panels,
// but it can be docked"). The Help panel ('help') is an undocked panel: with no remembered place it opens floating in the middle of the window, as Export does
// (34-desktop-shell.js), and docks like any panel. It is the one place for explanations, so the tool panels keep the no-explanatory-text rule.
// Home lists the pages; a page has a back button; the search field finds pages by their words. Keyboard shortcuts come from the command registry (the same list
// as Settings > Shortcuts) and About from the app's version, so neither goes stale. Help menu items open the panel at their page.
const HLP={page:'',q:''};
const hlEsc=t=>String(t).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const hlMac=()=>/Mac|iPhone|iPad/.test(navigator.platform||'');
// the pages that are drawn from the app, after the written ones
const HL_MORE=[['shortcuts','Keyboard shortcuts'],['news','What’s new'],['about','About Wodblok']];
const hlTitle=id=>{const p=HELP_PAGES.find(x=>x[0]==id);if(p)return p[1];const m=HL_MORE.find(x=>x[0]==id);return m?m[1]:''};
const hlText=b=>b[0]=='ul'?b[1].join(' '):b[1];
function hlBlocks(bs){return bs.map(b=>b[0]=='h'?`<h4>${hlEsc(b[1])}</h4>`:b[0]=='ul'?`<ul>${b[1].map(t=>`<li>${hlEsc(t)}</li>`).join('')}</ul>`:`<p>${hlEsc(b[1])}</p>`).join('')}
const hlRow=(id,t,sub)=>`<button type="button" class="hlpr" data-hp="${id}"><span class="hlprt">${hlEsc(t)}</span>${sub?`<span class="hlprs">${hlEsc(sub)}</span>`:''}${ic('chevR')}</button>`;
function hlHome(){return hlRow('start',hlTitle('start'))+`<div class="glb">Manual</div>`+HELP_PAGES.filter(p=>p[0]!='start').map(p=>hlRow(p[0],p[1])).join('')+'<div class="glb">More</div>'+HL_MORE.map(([id,t])=>hlRow(id,t)).join('')}
// search: every word of the query must appear in the page's title or text; a hit shows the first sentence it is in
function hlFind(q){const w=q.toLowerCase().split(/\s+/).filter(Boolean),out=[];
 const items=bs=>bs.flatMap(b=>b[0]=='ul'?b[1]:b[0]=='p'?[b[1]]:[]),heads=bs=>bs.filter(b=>b[0]=='h').map(b=>b[1]);
 const pages=[...HELP_PAGES.map(p=>[p[0],p[1],items(p[2]),heads(p[2])]),['shortcuts',hlTitle('shortcuts'),stKeys().map(c=>c.label+' ('+cmdFormatShortcut(c.shortcut,hlMac())+')'),[]],['news',hlTitle('news'),HELP_NEWS.flatMap(n=>n[2].map(t=>n[0]+': '+t)),[]]];
 pages.forEach(([id,t,its,hs])=>{const all=[t,...hs,...its].join(' ').toLowerCase();if(!w.every(x=>all.includes(x)))return;
  const hit=its.find(s=>w.every(x=>s.toLowerCase().includes(x)))||its.find(s=>w.some(x=>s.toLowerCase().includes(x)))||'';out.push(hlRow(id,t,hit))});
 return out.join('')||'<p class="hlpn">No match</p>'}
function hlPage(id){if(id=='shortcuts'){const m=hlMac();return`<div class="stgk">${stKeys().map(c=>`<div class="stgkr"><span>${hlEsc(c.label)}</span><kbd>${hlEsc(cmdFormatShortcut(c.shortcut,m))}</kbd></div>`).join('')}</div>`}
 if(id=='news')return HELP_NEWS.map(([v,d,ls])=>`<h4>${hlEsc(v)} <span class="hlpd">${hlEsc(d)}</span></h4><ul>${ls.map(t=>`<li>${hlEsc(t)}</li>`).join('')}</ul>`).join('');
 if(id=='about')return`<div class="stgr"><span>Version</span><b>v${hlEsc(WB_VER)}</b></div><div class="glb">Licences</div>${ST_LIC.map(([n,l])=>`<div class="stgr"><span>${hlEsc(n)}</span><b>${hlEsc(l)}</b></div>`).join('')}`;
 const p=HELP_PAGES.find(x=>x[0]==id);return p?hlBlocks(p[2]):''}
function hlPaint(){const b=$('hlpb');if(!b)return;const q=HLP.q.trim();$('hlpbk').hidden=!HLP.page&&!q;
 if(q)b.innerHTML=hlFind(q);else if(HLP.page)b.innerHTML=`<h3 class="hlph">${hlEsc(hlTitle(HLP.page))}</h3><div class="hlpc">${hlPage(HLP.page)}</div>`;else b.innerHTML=hlHome();
 b.scrollTop=0}
function hlGo(id){HLP.page=id||'';HLP.q='';const f=$('hlpq');if(f)f.value='';hlPaint()}
// open the panel (its place is the workspace's: the middle of the window the first time) at a page
function hlOpen(id){hlGo(id);if(WBX.wbOpenPanel)WBX.wbOpenPanel('help')}
function init47(){const b=$('hlpb'),q=$('hlpq');if(!b||!q)return;
 b.addEventListener('click',e=>{const r=e.target.closest('[data-hp]');if(r)hlGo(r.dataset.hp)});
 q.addEventListener('input',()=>{HLP.q=q.value;hlPaint()});
 q.addEventListener('keydown',e=>{if(e.key=='Escape'&&q.value){e.preventDefault();e.stopPropagation();HLP.q='';q.value='';hlPaint()}});
 $('hlpbk').addEventListener('click',()=>hlGo(''));
 hlPaint();
 cmdRegister({id:'help.start',label:'Getting started',run:()=>hlOpen('start')});
 cmdRegister({id:'help.manual',label:'Manual',run:()=>hlOpen('')});
 cmdRegister({id:'help.shortcuts',label:'Keyboard shortcuts',run:()=>hlOpen('shortcuts')});
 cmdRegister({id:'help.whatsNew',label:'What’s new',run:()=>hlOpen('news')});
 cmdRegister({id:'help.about',label:'About Wodblok',run:()=>hlOpen('about')})}
export {init47};
