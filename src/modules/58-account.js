import {ICN} from './00-icons.js';
import {acAccount} from '../platform/account.js';
import {cmdGet,cmdRegister} from '../commands/registry.js';
import {$,WBX,WB_VER} from './01-launch-and-version.js';
import {pmsg} from './18-projects-and-cover-overlay.js';
import {accentFromAccount,stAccentGet} from './55-settings.js';
// ===== Account =====
// Only where the account system exists (the hosted app behind the sign-in gate): a name chip in the status bar, File > Account…,
// File > Send feedback…, the 7-day offline check and the active-time counter. Everywhere else (local, tests, previews) the server does not
// answer as an account server, the state stays 'off' and none of this shows. All network access is in platform/account.js.
// Active time: every 15 s, if the page is visible and the person pressed, typed or scrolled in the last minute, add 15 s. Nothing runs on
// pointer moves, so drawing and dragging are untouched.
const axTICK=15000,axIDLE=60000,axSEND=5*60000,axRECHECK=30*60000;
const axLOCK={signedout:'Signed out',notapproved:'Not approved yet',expired:'Offline too long',clock:'Check the date and time'};
const axFB_ERR={signedout:'Signed out, so feedback was not sent',notapproved:'Not approved yet, so feedback was not sent',limit:'Too much feedback today',invalid:'Could not send feedback',failed:'Could not send feedback',offline:'No connection, feedback not sent'};
let axS={state:'off'},axOpener=null,axKey='',axCat='idea',axBusy=false,axAct=0,axLastTick=0,axTicks=0,axTimer=0,axUsing=false,axChecked=0;
const axEsc=x=>String(x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const axShown=id=>!$(id).hidden;
function axOpen(id,opener){try{if(typeof WBX.wbCloseMenus=='function')WBX.wbCloseMenus()}catch(e){}
 {const a=document.activeElement;axOpener=opener||(a&&a!==document.body&&a.focus&&a.offsetParent!==null&&!a.closest('#filem')?a:$('fileb'))}
 $(id).hidden=false}
function axClose(id){if($(id).hidden)return;$(id).hidden=true;const b=axOpener&&axOpener.isConnected&&axOpener.offsetParent!==null?axOpener:$('fileb');if(b&&b.focus)b.focus()}
// ---------------------------------------------------------------- state
// The two File menu items and their commands exist only while an account is signed in, so everywhere else the menu and command search are as before.
const axIC=d=>`<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;
const axITEMS=[['acgo','Account…','account.open','Account',axIC(ICN.user),()=>axAccountShow()],
 ['fbgo','Send feedback…','feedback.open','Send feedback',axIC(ICN.feedback),()=>axFbShow()]];
function axMenu(on){let after=$('stgo');
 for(const [id,text,cmd,label,icon,run] of axITEMS){let b=$(id);
  if(on&&!b){b=document.createElement('button');b.id=id;b.type='button';b.innerHTML=icon+text;b.onclick=run;after.parentNode.insertBefore(b,after.nextSibling);after=b}
  else if(!on&&b)b.remove();
  if(on&&!cmdGet(cmd))cmdRegister({id:cmd,label,run,enabled:()=>axS.state==='ok'})}}
function axApply(s){axS=s||{state:'off'};const ok=axS.state==='ok';
 axMenu(ok);
 const chip=$('pacct');chip.hidden=!(ok&&axS.name);chip.textContent=ok&&axS.name?'Hi '+axS.name+'!':'';
 if(axS.state==='locked')axLockShow();else if(axShown('aclk')){$('aclk').hidden=true}
 if(ok&&!axUsing)axUsageStart();
 if(!ok&&axShown('acdlg'))axClose('acdlg');if(!ok&&axShown('fbdlg'))axClose('fbdlg')}
// the colour saved with the account follows the person between devices (only when the server answered, not on an offline pass)
async function axAccent(s){if(s.state!=='ok'||!s.online)return;try{const a=await acAccount.syncAccent(s.accent,stAccentGet());if(a!==null)accentFromAccount(a)}catch(e){}}
async function axRefresh(){axChecked=Date.now();try{const s=await acAccount.check();axApply(s);axAccent(s)}catch(e){}}
// ---------------------------------------------------------------- account dialog
function axAccountPaint(){const row=(k,v)=>v?`<div class="stgr"><span>${k}</span><b>${axEsc(v)}</b></div>`:'';
 const until=axS.until?new Date(axS.until).toLocaleDateString(undefined,{day:'numeric',month:'short',year:'numeric'}):'';
 $('acbody').innerHTML=row('Name',axS.name)+row('Email',axS.email)+row('Account',acAccount.typeName(axS.type))+row('Works offline until',until)
  +`<div class="row"><button type="button" class="alt" id="acmng">Manage account</button><button type="button" class="alt" id="acout">Sign out</button></div>`;
 const site=acAccount.siteUrl();$('acmng').hidden=!site;
 $('acmng').onclick=()=>{if(site)window.open(site+'/?account=1','_blank','noopener')};
 $('acout').onclick=async()=>{const to=await acAccount.signOut();if(to)location.href=to;else axRefresh()}}
function axAccountShow(opener){if(axS.state!=='ok')return;axAccountPaint();axOpen('acdlg',opener);$('acclose').focus()}
// ---------------------------------------------------------------- feedback dialog
function axFbLabel(){$('fbok').disabled=axBusy||!$('fbmsg').value.trim()}
function axFbShow(){if(axS.state!=='ok')return;axOpen('fbdlg');if(!axKey)axKey=acAccount.newKey();
 $('fbcat').querySelectorAll('[data-v]').forEach(b=>{const on=b.dataset.v===axCat;b.classList.toggle('on',on);b.setAttribute('aria-pressed',String(on))});
 axFbLabel();$('fbmsg').focus()}
async function axFbSend(){const msg=$('fbmsg').value.trim();if(!msg||axBusy)return;axBusy=true;axFbLabel();
 const r=await acAccount.sendFeedback({key:axKey,category:axCat,message:msg,version:WB_VER});axBusy=false;
 if(r.ok){axKey='';$('fbmsg').value='';axClose('fbdlg');pmsg('Sent feedback')}
 else{pmsg(axFB_ERR[r.error]||axFB_ERR.failed);if(r.error==='signedout'||r.error==='notapproved')axRefresh()}
 axFbLabel()}
// ---------------------------------------------------------------- locked: signed out, not approved, or offline for too long
function axLockShow(){$('aclt').textContent=axLOCK[axS.reason]||axLOCK.signedout;
 const site=acAccount.siteUrl();$('aclin').hidden=!site;$('aclin').onclick=()=>{if(site)location.href=site+'/?signin=1'};
 $('aclk').hidden=false;if(!$('aclk').contains(document.activeElement))($('aclin').hidden?$('aclre'):$('aclin')).focus()}
// ---------------------------------------------------------------- active time
function axUsageStart(){if(axS.state!=='ok'||!acAccount.usage.tracked(axS.type))return;axUsing=true;
 try{acAccount.usage.open()}catch(e){}
 axAct=Date.now();axLastTick=axAct;
 const mark=()=>{axAct=Date.now()};
 document.addEventListener('pointerdown',mark,{capture:true,passive:true});document.addEventListener('keydown',mark,{capture:true,passive:true});document.addEventListener('wheel',mark,{capture:true,passive:true});
 axTimer=setInterval(axTick,axTICK);
 document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')axFlush(true);else if(Date.now()-axChecked>axRECHECK)axRefresh()});
 addEventListener('pagehide',()=>axFlush(true))}
function axTick(){const now=Date.now(),dt=Math.min(axTICK*2,now-axLastTick)/1000;axLastTick=now;
 if(document.visibilityState==='visible'&&now-axAct<axIDLE)try{acAccount.usage.add(dt)}catch(e){}
 if(++axTicks%(axSEND/axTICK)===0)axFlush(false)}
function axFlush(keep){if(axS.state!=='ok'||!acAccount.usage.tracked(axS.type))return;try{acAccount.usage.send(WB_VER,{keepalive:keep})}catch(e){}}
// ---------------------------------------------------------------- start-up
function init58(){
 $('pacct').onclick=e=>axAccountShow(e.currentTarget);
 $('acclose').onclick=()=>axClose('acdlg');$('acdlg').addEventListener('click',e=>{if(e.target===$('acdlg'))axClose('acdlg')});
 $('fbx').onclick=()=>axClose('fbdlg');$('fbcx').onclick=()=>axClose('fbdlg');$('fbdlg').addEventListener('click',e=>{if(e.target===$('fbdlg'))axClose('fbdlg')});
 $('fbcat').addEventListener('click',e=>{const b=e.target.closest('[data-v]');if(!b)return;axCat=b.dataset.v;$('fbcat').querySelectorAll('[data-v]').forEach(y=>{const on=y===b;y.classList.toggle('on',on);y.setAttribute('aria-pressed',String(on))})});
 $('fbmsg').addEventListener('input',axFbLabel);
 $('fbmsg').addEventListener('keydown',e=>{e.stopPropagation();if(e.key=='Enter'&&(e.metaKey||e.ctrlKey)){e.preventDefault();axFbSend()}});
 $('fbok').onclick=axFbSend;
 $('aclre').onclick=()=>axRefresh();
 $('aclsv').onclick=()=>$('psv').click();
 // Escape closes the account and feedback dialogs (before the app's own Escape handling); the locked screen has no Escape
 document.addEventListener('keydown',e=>{if(e.key!='Escape')return;if(axShown('fbdlg')){e.stopImmediatePropagation();e.preventDefault();axClose('fbdlg')}else if(axShown('acdlg')){e.stopImmediatePropagation();e.preventDefault();axClose('acdlg')}else if(axShown('aclk')){e.stopImmediatePropagation();e.preventDefault()}},true);
 addEventListener('online',()=>axRefresh());
 setInterval(()=>{if(document.visibilityState==='visible')axRefresh()},axRECHECK);
 // ask once the page has settled, so start-up and the first paint are never held up
 setTimeout(axRefresh,0)}
export {init58};
