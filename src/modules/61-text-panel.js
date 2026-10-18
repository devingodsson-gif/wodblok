import {$} from './01-launch-and-version.js';
// ===== The Text panel's controls, read and written in ONE place. The Stamp editor (22) and the Text layer (26) both use these, so a new text option is added here and in the engine only.
// Optional options are saved on a text only when set, so old files and snapshots do not change.
const TXO_NUM=[['sz','tx_sz'],['ls','tx_ls'],['ws','tx_ws'],['lh','tx_lh']],TXO_BOX=[['wd','tx_wd'],['ht','tx_ht'],['cv','tx_cv'],['rot','tx_rot']],TXO_OPT=[['pd','tx_pd'],['rp','tx_rp'],['rr','tx_rr'],['rs','tx_rs'],['bb','tx_bb'],['ind','tx_ind'],['psp','tx_psp'],['wa','tx_wa']];
const TXO_SEG=[['al','tx_al','a',1],['tc','tx_tc','c',1],['va','tx_va','v',1],['ov','tx_ov','o',0],['sc','tx_sc','s',0],['bal','tx_bal','b',0]];
const TXO_SELV=[['ft','tx_ft'],['wp','tx_wp'],['pt','tx_pt']],TXO_PATH=[['pa','tx_pa'],['pw','tx_pw']];
const TXO_KEYS=['pd','ft','ov','rp','rr','rs','bb','sc','sd','ind','psp','bal','sty','wp','wa','pt','pa','pw'];   // every optional key a text can carry
const TXO_IDS=['tx_f','tx_ft','tx_wp','tx_pt','tx_pa','tx_pw',...TXO_NUM.map(a=>a[1]),...TXO_BOX.map(a=>a[1]),...TXO_OPT.map(a=>a[1])];
let txoSd=0,txoSty=[],txoPrev='',txoQuiet=0;
const txoSeed=v=>{if(v!==undefined)txoSd=v;return txoSd};
const txoSegV=(id,dk,d)=>{const b=document.querySelector('#'+id+' .on');return b&&b.dataset[dk]!=null?b.dataset[dk]:d};
const txoSegD={al:'c',tc:'',va:'t',ov:'',sc:'',bal:''};
// letter i of the text, counting letters not UTF-16 units
const txoCp=(s,u)=>[...s.slice(0,u)].length;
function txoCompile(sty,n){const a=new Array(n).fill(null);sty.forEach(r=>{for(let i=r[0];i<r[1]&&i<n;i++)a[i]=[r[2],r[3],r[4]]});return a}
function txoPack(a){const out=[];let i=0;while(i<a.length){const v=a[i];if(!v||(v[0]==100&&!v[1]&&!v[2])){i++;continue}let j=i+1;while(j<a.length&&a[j]&&a[j][0]==v[0]&&a[j][1]==v[1]&&a[j][2]==v[2])j++;out.push([i,j,v[0],v[1],v[2]]);i=j}return out}
// set (or with patch null, clear) the size / raise / spacing of letters A to B
function txoApply(sty,n,A,B,patch){const a=txoCompile(sty,n);for(let i=Math.max(0,A);i<B&&i<n;i++){if(!patch){a[i]=null;continue}const v=a[i]||[100,0,0];a[i]=[patch.z!=null?patch.z:v[0],patch.d!=null?patch.d:v[1],patch.l!=null?patch.l:v[2]]}return txoPack(a)}
// after the words are edited, the styles stay with their letters; new letters take the style of the letter before them
function txoShift(sty,o,n){if(!sty.length||o===n)return sty;const A=[...o],B=[...n];let p=0;while(p<A.length&&p<B.length&&A[p]===B[p])p++;let s=0;while(s<A.length-p&&s<B.length-p&&A[A.length-1-s]===B[B.length-1-s])s++;const a=txoCompile(sty,A.length),ins=Math.max(0,B.length-p-s),fill=p>0?a[p-1]:null;return txoPack(a.slice(0,p).concat(new Array(ins).fill(fill),a.slice(A.length-s)))}
function txoRead(){const t=$('tx_t').value.replace(/\r/g,'').slice(0,200);if(txoSty.length&&t!==txoPrev)txoSty=txoShift(txoSty,txoPrev,t);txoPrev=t;const n=id=>+$(id).value,o={text:t,f:$('tx_f').value||'cinzel'};
TXO_NUM.forEach(([k,id])=>o[k]=n(id));o.al=txoSegV('tx_al','a','c');o.tc=txoSegV('tx_tc','c','');o.va=txoSegV('tx_va','v','t');TXO_BOX.forEach(([k,id])=>o[k]=n(id));
if(n('tx_pd'))o.pd=n('tx_pd');if($('tx_ft').value)o.ft=$('tx_ft').value;const ov=txoSegV('tx_ov','o','');if(ov)o.ov=ov;['rp','rr','rs','bb'].forEach(k=>{if(n('tx_'+k))o[k]=n('tx_'+k)});const sc=txoSegV('tx_sc','s','');if(sc)o.sc=sc;if(txoSd)o.sd=txoSd;
if($('tx_wp').value&&n('tx_wa')){o.wp=$('tx_wp').value;o.wa=n('tx_wa')}if($('tx_pt').value){o.pt=$('tx_pt').value;o.pa=n('tx_pa');o.pw=n('tx_pw')}if(n('tx_ind'))o.ind=n('tx_ind');if(n('tx_psp'))o.psp=n('tx_psp');if(txoSegV('tx_bal','b',''))o.bal=1;if(txoSty.length)o.sty=txoSty.map(r=>r.slice());return o}
const txoSetR=(id,v,force)=>{const el=$(id);if(force||+el.value!=+v){el.value=v;el.dispatchEvent(new Event('input',{bubbles:true,cancelable:true}))}};
const txoSetS=(id,dk,v)=>document.querySelectorAll('#'+id+' [data-'+dk+']').forEach(b=>b.classList.toggle('on',b.dataset[dk]==v));
// put a text's options into the controls. ov = values to show instead for some controls (a layer text shows sizes in canvas units); force = always send the input event
function txoWrite(o,ov,force){ov=ov||{};if($('tx_t').value!==o.text)$('tx_t').value=o.text;txoPrev=o.text;$('tx_f').value=o.f;
[...TXO_NUM,...TXO_BOX].forEach(([k,id])=>txoSetR(id,ov[k]!=null?ov[k]:(o[k]||0),force));TXO_OPT.forEach(([k,id])=>txoSetR(id,o[k]||0,force));
TXO_SELV.forEach(([k,id])=>{$(id).value=o[k]||''});TXO_PATH.forEach(([k,id])=>txoSetR(id,o[k]!=null?o[k]:50,force));TXO_SEG.forEach(([k,id,dk])=>txoSetS(id,dk,o[k]!=null?o[k]:txoSegD[k]));txoSd=o.sd||0;txoSty=Array.isArray(o.sty)?o.sty.map(r=>r.slice()):[]}
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
export {TXO_KEYS,TXO_IDS,txoRead,txoWrite,txoBind,txoSelBind,txoSeed,txoShow};
