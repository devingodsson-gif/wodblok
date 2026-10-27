import {$} from './01-launch-and-version.js';
// ===== The Text panel's controls, read and written in ONE place. A stamp's text (22) and the Text layer (26) both use these, so a new text option is added here and in the engine only.
// Optional options are saved on a text only when set, so old files and snapshots do not change.
const TXO_NUM=[['sz','tx_sz'],['ls','tx_ls'],['ws','tx_ws'],['lh','tx_lh']],TXO_BOX=[['wd','tx_wd'],['ht','tx_ht'],['cv','tx_cv'],['rot','tx_rot']],TXO_OPT=[['pd','tx_pd'],['rp','tx_rp'],['rr','tx_rr'],['rs','tx_rs'],['bb','tx_bb'],['ind','tx_ind'],['psp','tx_psp'],['wa','tx_wa']];
const TXO_SEG=[['al','tx_al','a',1],['tc','tx_tc','c',1],['va','tx_va','v',1],['ov','tx_ov','o',0],['sc','tx_scat','s',0],['bal','tx_bal','b',0]];
const TXO_SELV=[['ft','tx_ft'],['wp','tx_wp'],['pt','tx_pt']],TXO_PATH=[['pa','tx_pa'],['pw','tx_pw']];
const TXO_KEYS=['pd','ft','ov','rp','rr','rs','bb','sc','sd','ind','psp','bal','sty','wp','wa','pt','pa','pw'];   // every optional key a text can carry
const TXO_IDS=['tx_f','tx_ft','tx_wp','tx_pt','tx_pa','tx_pw',...TXO_NUM.map(a=>a[1]),...TXO_BOX.map(a=>a[1]),...TXO_OPT.map(a=>a[1])];
let txoSd=0,txoSty=[],txoPrev='',txoQuiet=0;
const txoSeed=v=>{if(v!==undefined)txoSd=v;return txoSd};
const txoSegV=(id,dk,d)=>{const b=document.querySelector('#'+id+' .on');return b&&b.dataset[dk]!=null?b.dataset[dk]:d};
const txoSegD={al:'c',tc:'',va:'t',ov:'',sc:'',bal:''};
// letter i of the text, counting letters not UTF-16 units
const txoCp=(s,u)=>[...s.slice(0,u)].length;
// a run is [from, to, size %, raise %, spacing %] and, since 2.62.0, a colour (a tray colour or a hex) as its sixth item when the letters have one
function txoCompile(sty,n){const a=new Array(n).fill(null);sty.forEach(r=>{for(let i=r[0];i<r[1]&&i<n;i++)a[i]=[r[2],r[3],r[4],r[5]||'',r[6]||'',r[7]||'']});return a}   // 2.65.0: r[6] styles (b, i, u, s), r[7] highlight colour
function txoPack(a){const out=[];let i=0;while(i<a.length){const v=a[i];if(!v||(v[0]==100&&!v[1]&&!v[2]&&!v[3]&&!v[4]&&!v[5])){i++;continue}let j=i+1;while(j<a.length&&a[j]&&[0,1,2,3,4,5].every(k=>(a[j][k]||'')==(v[k]||'')))j++;
 const r=[i,j,v[0],v[1],v[2]];if(v[3]||v[4]||v[5])r.push(v[3]||'');if(v[4]||v[5])r.push(v[4]||'');if(v[5])r.push(v[5]);out.push(r);i=j}return out}
// set (or with patch null, clear) the size / raise / spacing of letters A to B
function txoApply(sty,n,A,B,patch){const a=txoCompile(sty,n);for(let i=Math.max(0,A);i<B&&i<n;i++){if(!patch){a[i]=null;continue}const v=a[i]||[100,0,0,'','',''];let fl=v[4]||'';if(patch.fon)fl=[...new Set((fl+patch.fon).split(''))].sort().join('');if(patch.foff)fl=fl.split('').filter(x=>x!=patch.foff).join('');
 a[i]=[patch.z!=null?patch.z:v[0],patch.d!=null?patch.d:v[1],patch.l!=null?patch.l:v[2],patch.c!=null?patch.c:(v[3]||''),fl,patch.h!=null?patch.h:(v[5]||'')]}return txoPack(a)}
// after the words are edited, the styles stay with their letters; new letters take the style of the letter before them
function txoShift(sty,o,n){if(!sty.length||o===n)return sty;const A=[...o],B=[...n];let p=0;while(p<A.length&&p<B.length&&A[p]===B[p])p++;let s=0;while(s<A.length-p&&s<B.length-p&&A[A.length-1-s]===B[B.length-1-s])s++;const a=txoCompile(sty,A.length),ins=Math.max(0,B.length-p-s),fill=p>0?a[p-1]:null;return txoPack(a.slice(0,p).concat(new Array(ins).fill(fill),a.slice(A.length-s)))}
function txoRead(){const t=$('tx_t').value.replace(/\r/g,'').slice(0,200);if(txoSty.length&&t!==txoPrev)txoSty=txoShift(txoSty,txoPrev,t);txoPrev=t;const n=id=>+$(id).value,o={text:t,f:$('tx_f').value||'cinzel'};
TXO_NUM.forEach(([k,id])=>o[k]=n(id));o.al=txoSegV('tx_al','a','c');o.tc=txoSegV('tx_tc','c','');o.va=txoSegV('tx_va','v','t');TXO_BOX.forEach(([k,id])=>o[k]=n(id));
if(n('tx_pd'))o.pd=n('tx_pd');if($('tx_ft').value)o.ft=$('tx_ft').value;const ov=txoSegV('tx_ov','o','');if(ov)o.ov=ov;['rp','rr','rs','bb'].forEach(k=>{if(n('tx_'+k))o[k]=n('tx_'+k)});const sc=txoSegV('tx_scat','s','');if(sc)o.sc=sc;if(txoSd)o.sd=txoSd;
if($('tx_wp').value&&n('tx_wa')){o.wp=$('tx_wp').value;o.wa=n('tx_wa')}if($('tx_pt').value){o.pt=$('tx_pt').value;o.pa=n('tx_pa');o.pw=n('tx_pw')}if(n('tx_ind'))o.ind=n('tx_ind');if(n('tx_psp'))o.psp=n('tx_psp');if(txoSegV('tx_bal','b',''))o.bal=1;if(txoSty.length)o.sty=txoSty.map(r=>r.slice());
// 2.64.0 (docs/text-plan.md): word spacing, letter rotation, balance and the random letters are gone (the Jitter effect does random letters)
o.ws=0;o.rot=0;['rp','rr','rs','bb','sc','sd','bal'].forEach(k=>delete o[k]);return o}
const txoSetR=(id,v,force)=>{const el=$(id);if(force||+el.value!=+v){el.value=v;el.dispatchEvent(new Event('input',{bubbles:true,cancelable:true}))}};
const txoSetS=(id,dk,v)=>document.querySelectorAll('#'+id+' [data-'+dk+']').forEach(b=>b.classList.toggle('on',b.dataset[dk]==v));
// put a text's options into the controls. ov = values to show instead for some controls (a layer text shows sizes in canvas units); force = always send the input event
function txoWrite(o,ov,force){ov=ov||{};if($('tx_t').value!==o.text)$('tx_t').value=o.text;txoPrev=o.text;$('tx_f').value=o.f;
[...TXO_NUM,...TXO_BOX].forEach(([k,id])=>txoSetR(id,ov[k]!=null?ov[k]:(o[k]||0),force));TXO_OPT.forEach(([k,id])=>txoSetR(id,o[k]||0,force));
TXO_SELV.forEach(([k,id])=>{$(id).value=o[k]||''});TXO_PATH.forEach(([k,id])=>txoSetR(id,o[k]!=null?o[k]:50,force));TXO_SEG.forEach(([k,id,dk])=>txoSetS(id,dk,o[k]!=null?o[k]:txoSegD[k]));txoSd=o.sd||0;txoSty=Array.isArray(o.sty)?o.sty.map(r=>r.slice()):[];txoShapeShow()}
// the Size / Raise / Spacing sliders and the Super / Sub / Clear buttons act on the letters selected in the text field
const TXO_SEL=[['tx_zs','z'],['tx_dy','d'],['tx_sl','l']];
function txoSel(){const t=$('tx_t');return[txoCp(t.value,t.selectionStart),txoCp(t.value,t.selectionEnd)]}
function txoShow(){const[a]=txoSel(),v=txoCompile(txoSty,[...$('tx_t').value].length)[a]||[100,0,0];txoQuiet++;try{[['tx_zs',v[0]],['tx_dy',v[1]],['tx_sl',v[2]]].forEach(([id,x])=>txoSetR(id,x))}finally{txoQuiet--}}
function txoSelBind(guard,cb){const t=$('tx_t'),run=(patch)=>{if(!guard())return;const[a,b]=txoSel(),n=[...t.value].length;if(a>=b){if(patch){txoQuiet++;try{txoShow()}finally{txoQuiet--}}return}txoPrev=t.value;txoSty=txoApply(txoSty,n,a,b,patch);cb()};
TXO_SEL.forEach(([id,k])=>$(id).addEventListener('input',()=>{if(txoQuiet||!guard())return;run({[k]:+$(id).value})}));
$('tx_sup').addEventListener('click',()=>{run({z:60,d:35});txoShow()});$('tx_sub').addEventListener('click',()=>{run({z:60,d:-15});txoShow()});$('tx_clr').addEventListener('click',()=>{if(!guard())return;const[a,b]=txoSel(),n=[...t.value].length;txoPrev=t.value;txoSty=a<b?txoApply(txoSty,n,a,b,null):[];txoShow();cb()});
['select','keyup','mouseup','focus'].forEach(ev=>t.addEventListener(ev,()=>{if(guard())txoShow()}))}
// the Align, Case, Vertical, Overflow, Scatter and Balance buttons
function txoBind(guard,cb){TXO_SEG.forEach(([k,id,dk])=>{const el=$(id);el.addEventListener('click',e=>{if(!guard())return;const b=e.target.closest('[data-'+dk+']');if(!b)return;el.querySelectorAll('[data-'+dk+']').forEach(x=>x.classList.toggle('on',x===b));cb(k)})})}
// 2.62.0 (owner Oct 27 2026, the text overhaul: style parts of a text): the colour of the selected letters (all of them when none are selected). '' takes the colour away.
function txoLetterCol(){const t=$('tx_t'),n=[...t.value].length;if(!n)return'';const[a,b]=txoSel(),i=a<b?a:0,v=txoCompile(txoSty,n)[i];return v&&v[3]||''}
function txoSetLetterCol(c,cb){const t=$('tx_t'),n=[...t.value].length;if(!n)return;let[a,b]=txoSel();if(a>=b){a=0;b=n}txoPrev=t.value;txoSty=txoApply(txoSty,n,a,b,{c:c||''});cb()}
// ---- Shape (2.64.0): one choice for the line the letters sit on (None, Arc, Wave, Spiral, Bulge, Rise, Flag) with Amount, and Length for a wave or a spiral. It writes the
// engine's own options (cv Curve; pt Path with pa, pw; wp Warp with wa), which stay in hidden controls, so a text keeps the same fields as before.
const TXO_SHK={arc:{lo:-100},wave:{lo:0,len:1},spiral:{lo:0,len:1},b:{lo:-100},r:{lo:-100},f:{lo:-100}};
function txoShapeOf(){const pt=$('tx_pt').value,wp=$('tx_wp').value;if(pt)return pt=='w'?'wave':'spiral';if(wp)return wp;return Math.abs(+$('tx_cv').value)>0?'arc':''}
function txoShapeShow(){const k=txoShapeOf(),d=TXO_SHK[k];$('tx_shk').value=k;$('tx_shar').hidden=!d;$('tx_shlr').hidden=!(d&&d.len);if(!d)return;const a=$('tx_sha');a.min=d.lo;
 const v=k=='arc'?+$('tx_cv').value:d.len?+$('tx_pa').value:+$('tx_wa').value;txoQuiet++;try{txoSetR('tx_sha',v);if(d.len)txoSetR('tx_shl',+$('tx_pw').value)}finally{txoQuiet--}}
// put the choice into the engine's controls; each sends its input event, so the text follows as with any control
function txoShapeSet(k,amt,len){const d=TXO_SHK[k];txoSetR('tx_cv',k=='arc'?amt:0);$('tx_wp').value=d&&!d.len&&k!='arc'?k:'';txoSetR('tx_wa',d&&!d.len&&k!='arc'?amt:0);$('tx_pt').value=k=='wave'?'w':k=='spiral'?'s':'';
 if(d&&d.len){txoSetR('tx_pa',Math.max(0,amt));txoSetR('tx_pw',len)}['tx_wp','tx_pt'].forEach(id=>$(id).dispatchEvent(new Event('input',{bubbles:true})))}
function txoShapeBind(){$('tx_shk').addEventListener('change',()=>{const k=$('tx_shk').value,d=TXO_SHK[k];txoShapeSet(k,d?(k=='arc'?40:d.len?50:50):0,50);txoShapeShow()});
 $('tx_sha').addEventListener('input',()=>{if(txoQuiet)return;const k=$('tx_shk').value;if(TXO_SHK[k])txoShapeSet(k,+$('tx_sha').value,+$('tx_shl').value)});
 $('tx_shl').addEventListener('input',()=>{if(txoQuiet)return;const k=$('tx_shk').value;if(TXO_SHK[k]&&TXO_SHK[k].len)txoShapeSet(k,+$('tx_sha').value,+$('tx_shl').value)})}
// 2.65.0: Bold, Italic, Underline and Strikethrough (b, i, u, s) and the Highlight colour of the selected letters (all of them when none are selected). A style button
// shows on when every one of those letters has it, and pressing it then takes it off them; otherwise it puts it on all of them.
function txoRange(){const t=$('tx_t'),n=[...t.value].length;let[a,b]=txoSel();if(a>=b){a=0;b=n}return[a,b,n]}
function txoFlagOn(f){const[a,b,n]=txoRange();if(!n||a>=b)return false;const c=txoCompile(txoSty,n);for(let i=a;i<b;i++){if(/\s/.test([...$('tx_t').value][i]))continue;if(!(c[i]&&(c[i][4]||'').includes(f)))return false}return true}
function txoFlag(f,cb){const[a,b,n]=txoRange();if(!n)return;const on=txoFlagOn(f);txoPrev=$('tx_t').value;txoSty=txoApply(txoSty,n,a,b,on?{foff:f}:{fon:f});cb()}
function txoHl(){const[a,b,n]=txoRange();if(!n)return'';const v=txoCompile(txoSty,n)[a];return v&&v[5]||''}
function txoSetHl(h,cb){const[a,b,n]=txoRange();if(!n)return;txoPrev=$('tx_t').value;txoSty=txoApply(txoSty,n,a,b,{h:h||''});cb()}
export {txoFlag,txoFlagOn,txoHl,txoSetHl,txoShapeBind,txoLetterCol,txoSetLetterCol,TXO_KEYS,TXO_IDS,txoRead,txoWrite,txoBind,txoSelBind,txoSeed,txoShow};
