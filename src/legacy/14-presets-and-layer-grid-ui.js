// ---- Canvas & stamp shape presets
const ASP={c:[['2:3',2,3],['3:4',3,4],['4:5',4,5],['5:7',5,7],['1:1 square',1,1],['A4 / A-series',1,1.4142],['US Letter',8.5,11],['6×9 book',6,9],['9:16 tall',9,16],['3:2',3,2],['4:3',4,3],['16:9 wide',16,9]],
s:[['1:1 square',1,1],['2:3',2,3],['3:2',3,2],['3:4',3,4],['4:3',4,3],['1:2',1,2],['2:1',2,1],['1:3',1,3],['3:1',3,1],['6:1 frame strip',6,1],['8:1 frame strip',8,1],['12:1 frame strip',12,1],['16:1 frame strip',16,1]]};
const aspKey=([w,h])=>(+w).toFixed(4)+':'+(+h).toFixed(4);
function syncAsp(k,p){const cur=k=='s'?shOf(WBS.tiles[window.wbCur()]).s:WBS.dim[k],i=ASP[k].findIndex(a=>aspKey([a[1],a[2]])==aspKey(cur));
if(!$(p+'asp').options.length)$(p+'asp').innerHTML=ASP[k].map((a,j)=>`<option value="${j}">${a[0]}</option>`).join('')+'<option value="x">Custom…</option>';
const custom=i<0||$(p+'asp').dataset.custom=='1';$(p+'asp').value=custom?'x':i;
const f=v=>String(+(+v).toFixed(3));if(document.activeElement!=$(p+'aw'))$(p+'aw').value=f(cur[0]);if(document.activeElement!=$(p+'ah'))$(p+'ah').value=f(cur[1])}
// Change one stamp's outline and stretch its motifs to match
function reshape(t,ch){const sh=shOf(t),a=geom(sh);if(ch.k)sh.k=ch.k;if(ch.o)sh.o=ch.o;if(ch.s)sh.s=[+ch.s[0],+ch.s[1]];const b=geom(sh);useG(b);t.items.forEach(q=>{[q.x,q.y]=wrapP(q.x*b.SW/a.SW,q.y*b.SH/a.SH)});useT(WBS.tiles[WBS.cur])}
function applyAsp(k,v,ch){if(v){const r=v[0]/v[1],lim=k=='s'?20:5;if(!(r>=1/lim&&r<=lim)){if(k=='s')pmsg('Stamps can be up to 20 times longer than they are wide.');return}}
if(k=='c'){if(v)WBS.dim.c=v;setDim()}
else{const t=WBS.tiles[WBS.cur],c={...(ch||{})};if(v)c.s=v;reshape(t,c);const sh=shOf(t);WBS.dim={...WBS.dim,k:sh.k,o:sh.o,s:[...sh.s]}}
WBS.symKey='';try{localStorage.setItem('wb14_dim',JSON.stringify(WBS.dim))}catch(e){}store();upd()}
[['c','c'],['s','s']].forEach(([k,p])=>{
$(p+'asp').oninput=()=>{const v=$(p+'asp').value;if(v=='x'){$(p+'asp').dataset.custom='1';$(p+'aw').focus();return}
$(p+'asp').dataset.custom='';const a=ASP[k][+v];applyAsp(k,[a[1],a[2]])};
const cu=()=>{const w=+$(p+'aw').value,h=+$(p+'ah').value;if(w>0&&h>0)applyAsp(k,[w,h])};$(p+'aw').oninput=$(p+'ah').oninput=cu;
$(p+'swp').onclick=()=>{const a=k=='s'?shOf(WBS.tiles[WBS.cur]).s:WBS.dim[k];applyAsp(k,[a[1],a[0]])}});
function csSet(ch){Object.assign(WBS.dim,ch);if(WBS.dim.cs=='rect')delete WBS.dim.cs;setDim();WBS.symKey='';try{localStorage.setItem('wb14_dim',JSON.stringify(WBS.dim))}catch(e){}store();upd()}
$('cshp').onclick=e=>{const b=e.target.closest('[data-s]');if(!b||WBS.book.on||b.disabled)return;const v=b.dataset.s;if(v==csk())return;csSet({cs:v})};
$('ccr').oninput=()=>csSet({cr:Math.max(0,Math.min(100,Math.round(+$('ccr').value)||0))});
$('cns').oninput=()=>csSet({n:Math.max(3,Math.min(16,Math.round(+$('cns').value)||5))});
$('cor').onclick=e=>{const b=e.target.closest('[data-o]');if(!b)return;const o=b.dataset.o=='f'?'f':'p';if((WBS.dim.co=='f'?'f':'p')==o)return;const ch={co:o};if(o=='p')delete WBS.dim.co;csSet(o=='p'?{}:ch)};
$('skind').onclick=e=>{const b=e.target.closest('[data-k]');if(b&&b.dataset.k!=SK)applyAsp('s',null,{k:b.dataset.k})};
$('shor').oninput=()=>applyAsp('s',null,{o:$('shor').value});
$('shz').oninput=()=>{shOf(WBS.tiles[WBS.cur]).z=+$('shz').value;store();upd()};
$('shrad').oninput=()=>{const sh=shOf(WBS.tiles[WBS.cur]),v=Math.max(0,Math.min(100,Math.round(+$('shrad').value)||0));if((sh.rad||0)==v)return;if(v>0)sh.rad=v;else delete sh.rad;WBS.symKey='';store();upd()};
$('sall').onclick=()=>{const sh=shOf(WBS.tiles[WBS.cur]);let n=0;WBS.tiles.forEach(t=>{if(t===WBS.tiles[WBS.cur])return;const o=shOf(t);if(o.k!=sh.k||o.o!=sh.o||o.s[0]!=sh.s[0]||o.s[1]!=sh.s[1]){reshape(t,{k:sh.k,o:sh.o,s:sh.s});n++}});WBS.symKey='';store();upd();pmsg(n?`${n} other stamp${n>1?'s':''} now use this shape.`:'Every stamp already has this shape.')};
// ---- layer grid: own grid or another layer's, where to print on it, which stamp sets its shape
function syncGrid(L,T){const others=WBS.layers.filter(x=>x!==L&&!(x.fr&&x.fr.on)&&!x.free),ky=others.map(x=>x.u+x.name).join('|');
if($('lgl').dataset.k!=ky){$('lgl').innerHTML='<option value="">Its own grid</option>'+others.map(x=>`<option value="${hx(x.u)}">Same grid as ${hx(x.name)}</option>`).join('');$('lgl').dataset.k=ky}
$('lgl').value=T.linked?L.gl:'';$('lglrow').hidden=!T.linked;
document.querySelectorAll('#lpa [data-p]').forEach(b=>b.classList.toggle('on',b.dataset.p==(L.pa||'c')));
if(T.linked)$('lglh').textContent=`Uses the grid of ${T.B.name}: same pattern, spacing and stamp size. Each stamp prints at its own Size from the Stamp panel, so small stamps sit neatly in the gaps.`;
const ls=WBS.tiles.filter(t=>L.st.includes(t.id)),lt=leadT(L);$('lldrow').hidden=T.linked||ls.length<2;
const k2=ls.map(t=>t.id+shOf(t).k).join('|');if($('lld').dataset.k!=k2){$('lld').innerHTML=ls.map(t=>`<option value="${t.id}">Stamp ${WBS.tiles.indexOf(t)+1} (${SHN[shOf(t).k]})</option>`).join('');$('lld').dataset.k=k2}
if(ls.length)$('lld').value=lt.id}
$('lgl').oninput=()=>{const L=LY(),v=$('lgl').value;if(v){L.gl=v;L.ox=0;L.oy=0;if(!L.pa)L.pa='c'}else delete L.gl;store();upd()};
$('lpa').onclick=e=>{const b=e.target.closest('[data-p]');if(!b)return;LY().pa=b.dataset.p;store();upd()};
$('lld').oninput=()=>{LY().lead=+$('lld').value;store();upd()};
$('pal').oninput=()=>{const p=PL[$('pal').value];if(p){WBS.proj={ink:p[1],bg:p[2]};store();upd()}};
$('pI').oninput=()=>{WBS.proj.ink=$('pI').value;store();upd()};
$('pB').oninput=()=>{WBS.proj.bg=$('pB').value;store();upd()};
$('stI').oninput=()=>{WBS.tiles[WBS.cur].ink=$('stI').value||null;store();upd()};
$('neg').oninput=()=>{WBS.tiles[WBS.cur].neg=$('neg').checked;store();upd()};
let lastC=null;
$('cl').onclick=e=>{if(e.target.closest('#addC')){openCF();return}const b=e.target.closest('[data-c]');if(!b)return;lastC=b.dataset.c;const n=b.dataset.c,a=$('ap').value;
if(a=='pI')WBS.proj.ink=n;else if(a=='pB')WBS.proj.bg=n;else WBS.tiles[WBS.cur].ink=n;
$('cn').textContent=n+' '+col(n);$('rmC').hidden=!CC.includes(n);store();upd()};
const normHex=v=>{const m=/^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(String(v).trim());if(!m)return null;let h=m[1].toLowerCase();if(h.length==3)h=h.split('').map(c=>c+c).join('');return'#'+h};
function openCF(){$('cf').hidden=false;$('cer').textContent='';$('cnm').focus()}
$('cpk').oninput=()=>{$('chx').value=$('cpk').value};
$('chx').oninput=()=>{const h=normHex($('chx').value);if(h)$('cpk').value=h};
$('ccl').onclick=()=>{$('cf').hidden=true};
$('csv').onclick=()=>{const h=normHex($('chx').value),n=$('cnm').value.replace(/["<>]/g,'').replace(/\s+/g,' ').trim().slice(0,30),er=t=>{$('cer').textContent=t};
if(!h)return er('Enter a color as a hex value like #8b5a2b, or use the color selector.');
if(!n)return er('Give the color a name.');
if(C.some(c=>c[0].toLowerCase()==n.toLowerCase()))return er('That name is already used. Try another.');
C.push([n,h]);CM[n]=h;CC.push(n);saveCC();paintColors();lastC=n;$('rmC').hidden=false;
$('cn').textContent='Added '+n+' '+h+'. Click it to apply.';$('cnm').value='';$('cf').hidden=true;$('cl').scrollTop=$('cl').scrollHeight;upd()};
$('rmC').onclick=()=>{const n=lastC;if(!n||!CC.includes(n))return;
C.splice(C.findIndex(c=>c[0]==n),1);delete CM[n];CC.splice(CC.indexOf(n),1);
if(WBS.proj.ink==n)WBS.proj.ink=PCOL.ink;if(WBS.proj.bg==n)WBS.proj.bg=PCOL.bg;WBS.tiles.forEach(t=>{if(t.ink==n)t.ink=null});
saveCC();store();paintColors();lastC=null;$('rmC').hidden=true;$('cn').textContent='Removed '+n+'.';upd()};
const LY=()=>WBS.layers[WBS.selL];
[['lgp','gap',Number],['ts','size',Number],['lox','ox',Number],['loy','oy',Number],['lrr','rrot',Number],['lrp','rpos',Number],['lrt','rot',Number],['lps','pst',Number],['lfs','pfl',Number],['lnm','name',v=>v]].forEach(([id,k,f])=>$(id).oninput=()=>{LY()[k]=f($(id).value);store();upd()});
[['lrtn','rtn'],['lrfh','rfh'],['lrfv','rfv']].forEach(([id,k])=>$(id).oninput=()=>{const L=LY();if($(id).checked)L[k]=true;else delete L[k];store();upd()});
$('lrsh').onclick=()=>{LY().rsd=1+Math.floor(Math.random()*99999);store();upd();if(window.wbCap)wbCap()};
$('let').oninput=()=>{WBS.tiles[WBS.cur].et=+$('let').value;store();upd()};$('ler').oninput=()=>{WBS.tiles[WBS.cur].er=+$('ler').value;store();upd()};$('lers').onclick=()=>{WBS.tiles[WBS.cur].es=(WBS.tiles[WBS.cur].es||0)+1;store();upd()};
$('lyl').onclick=e=>{const r=e.target.closest('[data-l]');if(!r)return;const i=+r.dataset.l;
const grp=lyGrp(),inG=grp.length>1&&grp.includes(i);
const mv=d=>{if(inG){const pl=WBS.layers[WBS.selL],set=new Set(grp),it=WBS.layers.map((l,k)=>({l,s:set.has(k)}));if(d>0){for(let k=it.length-2;k>=0;k--)if(it[k].s&&!it[k+1].s){const t=it[k];it[k]=it[k+1];it[k+1]=t}}else{for(let k=1;k<it.length;k++)if(it[k].s&&!it[k-1].s){const t=it[k];it[k]=it[k-1];it[k-1]=t}}WBS.layers.splice(0,WBS.layers.length,...it.map(x=>x.l));WBS.selL=WBS.layers.indexOf(pl);return}
const k=i+d;if(k<0||k>=WBS.layers.length)return;[WBS.layers[i],WBS.layers[k]]=[WBS.layers[k],WBS.layers[i]];if(WBS.selL==i)WBS.selL=k;else if(WBS.selL==k)WBS.selL=i};
if(e.target.matches('input')){if(inG)grp.forEach(k=>{WBS.layers[k].vis=e.target.checked});else WBS.layers[i].vis=e.target.checked}
else if(e.target.closest('[data-up]'))mv(1);else if(e.target.closest('[data-dn]'))mv(-1);
else if(e.shiftKey){const a0=WBS.lAnc!=null?WBS.layers.findIndex(l=>l.u==WBS.lAnc):WBS.selL,a=a0<0?WBS.selL:a0;WBS.selLM=new Set(WBS.layers.slice(Math.min(a,i),Math.max(a,i)+1).map(l=>l.u));WBS.selL=i}
else if(e.ctrlKey||e.metaKey){const st=new Set(grp.map(k=>WBS.layers[k].u)),u=WBS.layers[i].u;if(st.has(u)&&st.size>1){st.delete(u);WBS.selL=WBS.layers.findIndex(l=>st.has(l.u))}else{st.add(u);WBS.selL=i}WBS.selLM=st;WBS.lAnc=u}
else{WBS.selLM=new Set();WBS.selL=i;WBS.lAnc=WBS.layers[i].u}
store();upd()};
$('lyl').onmousedown=e=>{if(e.shiftKey)e.preventDefault()};
$('lst').onclick=e=>{const b=e.target.closest('[data-s]');if(!b)return;const id=+b.dataset.s,a=LY().st,k=a.indexOf(id);if(k<0)a.push(id);else a.splice(k,1);store();upd()};
$('addL').onclick=()=>{const L=mkL('Layer '+(WBS.layers.length+1),[],'check',180);L.ak={};WBS.layers.push(L);WBS.selL=WBS.layers.length-1;store();upd()};
$('dupL').onclick=()=>{const g=lyGrp(),pu=WBS.layers[WBS.selL].u,cps=[];let pc=null;g.slice().reverse().forEach(k=>{const c=JSON.parse(JSON.stringify(WBS.layers[k]));c.u=luid();c.name+=' copy';WBS.layers.splice(k+1,0,c);cps.push(c.u);if(WBS.layers[k].u==pu)pc=c.u});WBS.selL=WBS.layers.findIndex(l=>l.u==pc);WBS.selLM=cps.length>1?new Set(cps):new Set();store();upd()};
$('delL').onclick=()=>{const g=lyGrp();if(WBS.layers.length<=g.length)return;g.slice().reverse().forEach(k=>WBS.layers.splice(k,1));WBS.selLM=new Set();WBS.selL=Math.min(g[0],WBS.layers.length-1);store();upd()};
$('cov').addEventListener('input',upd);
const STY="One unified carved-stamp style drawn from medieval sources: the flat, heavy, firmly outlined forms of Romanesque Bible illumination; the spirals, dots and interlace of Insular manuscripts; the bold geometric shapes, stripes and scallops of Mozarabic Beatus pages; and the thick, even outline of 15th-century blockbook woodcuts. No shading, no perspective, frontal or profile poses, strong readable silhouettes.";
$('gen').onclick=async()=>{const ws=$('txt').value.split(',').map(s=>s.trim()).filter(Boolean).slice(0,4);if(!ws.length)return;
const sample=await use('sample');if(!sample)return say('Claude drawing is not available in this view.');
$('gen').disabled=true;say('Claude is drawing your motifs… this can take up to a minute.');
const prompt=`You are an expert in medieval Bible illumination and early woodcut. Style: ${STY}\n\nDraw each motif below as a carved printing-block stamp in that spirit: solemn and devotional, never cartoonish. Keep the set cohesive (same detail level and line weights). Technical rules: centered at 0,0 inside a -50..50 box (stay within radius 48). Use only path, circle, ellipse, rect, polygon, polyline, line, g. Solid silhouette shapes use fill="FILL". Incised detail lines over them use stroke="CUT" with fill="none", stroke-width 2 to 3.5, stroke-linecap="round". Every element must set fill explicitly. No other colors, gradients, text, filters or images. Strong silhouette that reads when small, under 1800 characters each. Return ONLY JSON: {"motifs":[{"name":"...","svg":"inner markup only"}]} in this order:\n${ws.map((w,i)=>`${i+1}. ${w}`).join('\n')}`;
try{const r=await sample.json(prompt,{cache:false});let n=0;
(r.motifs||[]).forEach((m,i)=>{const s=clean(m.svg||'');if(s){const nm=String(m.name||ws[i]||'motif').replace(/["<>&|]/g,''),fg=WBS.mcat.startsWith('g:')?WBS.mcat.slice(2):'';cust['c|u|'+nm]={n:nm,svg:s,...(fg?{g:fg}:{})};n++}});
store();const inF=WBS.mcat.startsWith('g:');if(n&&!inF){WBS.mcat='d';mcSave()}say(n?`${n} motif${n>1?'s':''} added to ${inF?'“'+WBS.mcat.slice(2)+'”':'Drawn by Claude'}. Click to place.`:'Nothing usable came back. Try again.');build()}
catch(e){say(e&&e.code=='not_granted'?'Permission to ask Claude was declined.':e&&e.code=='rate_limited'?'Rate limited. Try again in a bit.':'Drawing failed: '+((e&&e.message)||'unknown error'))}
$('gen').disabled=false};
const expName=ext=>{const n=($('pnm')&&$('pnm').value.trim()||'').replace(/[^\w\- ]+/g,'').trim().replace(/\s+/g,'-')||'wodblok-pattern';return n+'.'+ext};
const ser=()=>{const k=WBS.edMk;if(!k){WBS.edMk=true;upd()}try{return ser0()}finally{if(!k){WBS.edMk=false;upd()}}};
const ser0=()=>{const c=$('art').cloneNode(true);wbVec(c);['#guig','#fpgrid','#fpov','#gmov'].forEach(q=>{const g=c.querySelector(q);if(g)g.remove()});const gd=c.querySelector('#grdf');if(gd&&window.wbGrade)gd.innerHTML=wbGrade.defs(false);{const sd=c.querySelector('#surfd');if(sd&&!WBS.edInk)sd.innerHTML=WBS.tiles.map(t=>SURFC[t.id]?SURFC[t.id].s:'').join('');c.querySelectorAll('[data-tki]').forEach(g=>{g.setAttribute('mask','url(#cw)');g.removeAttribute('data-tki')});c.querySelectorAll('.txo[display]').forEach(g=>g.removeAttribute('display'));const tg=c.querySelector('#texg');if(tg)tg.style.display=''}return new XMLSerializer().serializeToString(c)};
$('cpy').onclick=async()=>{try{await navigator.clipboard.writeText(ser());say('SVG copied.')}catch(e){say('Copy was blocked here.')}};
$('sv').onclick=async()=>{const d=await use('downloads');if(!d)return say('Saving is not available here.');
try{await d.save({filename:expName('svg'),data:ser()})}catch(e){if(e&&e.code!='declined')say('Could not save: '+e.message)}};
$('png').onclick=async()=>{const d=await use('downloads');if(!d)return say('Saving is not available here.');
const img=new Image();img.onload=()=>{const c=document.createElement('canvas');c.width=CW*3;c.height=CH*3;c.getContext('2d').drawImage(img,0,0,c.width,c.height);
c.toBlob(async b=>{try{await d.save({filename:expName('png'),data:b})}catch(e){if(e&&e.code!='declined')say('Could not save: '+e.message)}},'image/png')};
img.onerror=()=>say('PNG export failed.');
img.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(ser())};
