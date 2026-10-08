// ===== Print cover controls, guides and 300 DPI export =====
$('bktr').innerHTML=TRIMS.map(t=>`<option value="${t[0]}">${t[1]}</option>`).join('');$('bkpp').innerHTML=Object.entries(PAPER).map(([k,v])=>`<option value="${k}">${v[0]}</option>`).join('');
function bookSync(){const g=bk(),on=WBS.book.on,px=v=>Math.round(v*300);$('bkon').checked=on;$('bkc').hidden=!on;$('bktr').value=TRIMS.some(t=>t[0]==WBS.book.trim)?WBS.book.trim:'custom';$('bkcu').hidden=WBS.book.trim!='custom';
if(document.activeElement!==$('bktw'))$('bktw').value=+g.tw.toFixed(3);if(document.activeElement!==$('bkth'))$('bkth').value=+g.th.toFixed(3);if(document.activeElement!==$('bkpg'))$('bkpg').value=WBS.book.pages;$('bkpp').value=WBS.book.paper;$('bkman').checked=!!WBS.book.man;
$('bksw').disabled=!WBS.book.man;if(document.activeElement!==$('bksw'))$('bksw').value=+g.sw.toFixed(4);if(document.activeElement!==$('bkbl'))$('bkbl').value=+g.b.toFixed(4);$('bkgd').checked=!!WBS.book.gd;
const mm=v=>(v*25.4).toFixed(1);let w='';if(!WBS.book.man&&(WBS.book.pages<24||WBS.book.pages>828))w='<div class="w">KDP paperbacks take 24 to 828 pages.</div>';if(covS.img&&!WBS.book.man&&WBS.book.pages<100)w+='<div class="w">KDP only allows spine text on books with 100 or more pages.</div>';
$('bkinfo').innerHTML=`<b>Full cover</b> ${g.W.toFixed(3)} × ${g.H.toFixed(3)} in (${mm(g.W)} × ${mm(g.H)} mm)<br><b>At 300 DPI</b> ${px(g.W)} × ${px(g.H)} px<br><b>Spine</b> ${g.sw.toFixed(3)} in (${mm(g.sw)} mm)${w}`;
$('bksum').textContent=on?`${g.W.toFixed(2)} × ${g.H.toFixed(2)} in`:'';
['bkpdf','bkpng','bkxs'].forEach(id=>$(id).hidden=!on);$('cfree').hidden=on;$('bkgrp').hidden=!on;document.querySelectorAll('#cfmt [data-f]').forEach(b=>b.classList.toggle('on',(b.dataset.f=='book')==on));['casp','cswp','caw','cah'].forEach(id=>{if($(id))$(id).disabled=on});paintCov()}
WBX.wbBookSync=()=>{bookSync();setDim();WBS.covKey='';renderCover();if(typeof buildTex=='function')buildTex();upd();if(WBX.wbApplyZ)requestAnimationFrame(WBX.wbApplyZ)};
const bookSet=o=>{WBS.book={...WBS.book,...o};try{localStorage.setItem('wb40_book',JSON.stringify(WBS.book))}catch(e){}WBX.wbBookSync()};
$('bkon').onchange=()=>bookSet({on:$('bkon').checked});
$('cfmt').onclick=e=>{const b=e.target.closest('[data-f]');if(!b)return;const on=b.dataset.f=='book';if(on!=WBS.book.on)bookSet({on})};
$('bktr').onchange=()=>{const v=$('bktr').value,g=bk();bookSet(v=='custom'?{trim:'custom',tw:g.tw,th:g.th}:{trim:v})};
$('bktw').onchange=()=>bookSet({trim:'custom',tw:+$('bktw').value});$('bkth').onchange=()=>bookSet({trim:'custom',th:+$('bkth').value});
$('bkpg').oninput=()=>{const v=Math.round(+$('bkpg').value);if(v>0)bookSet({pages:v})};$('bkpp').onchange=()=>bookSet({paper:$('bkpp').value});
$('bkman').onchange=()=>bookSet({man:$('bkman').checked,sw:+bk().sw.toFixed(4)});$('bksw').oninput=()=>{if($('bksw').value!=='')bookSet({sw:+$('bksw').value})};
$('bkbl').oninput=()=>{if($('bkbl').value!=='')bookSet({bleed:+$('bkbl').value})};$('bkgd').onchange=()=>bookSet({gd:$('bkgd').checked});
$('cvslot').onclick=e=>{const b=e.target.closest('[data-s]');if(!b)return;WBS.cslot=b.dataset.s;$('cvmsg').textContent='';paintCov()};
// --- export at 300 DPI (PNG, or a PDF sized to the full cover with trim and bleed boxes)
function coverRaster(cb){const g=bk(),W=Math.round(g.W*300),H=Math.round(g.H*300);$('pmsg').textContent='Rendering the print cover at 300 DPI…';
let sv=ser().replace(/^<svg([^>]*?)>/,(m,a)=>`<svg${a.replace(/\s(width|height|preserveAspectRatio)="[^"]*"/g,'')} width="${W}" height="${H}" preserveAspectRatio="none">`);
const img=new Image();img.onload=()=>{try{const c=document.createElement('canvas');c.width=W;c.height=H;const x=c.getContext('2d');x.fillStyle=col(WBS.proj.bg);x.fillRect(0,0,W,H);x.drawImage(img,0,0,W,H);cb(c,g,W,H)}catch(e){$('pmsg').textContent='The cover was too large to render here: '+e.message}};
img.onerror=()=>{$('pmsg').textContent='Print cover export failed.'};img.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(sv)}
function pdfJpeg(jpg,W,H,g){const enc=new TextEncoder(),pt=v=>(v*72).toFixed(3),pw=pt(g.W),ph=pt(g.H),b=pt(g.b),tr=`${b} ${b} ${(g.W*72-g.b*72).toFixed(3)} ${(g.H*72-g.b*72).toFixed(3)}`,parts=[],off=[];let len=0;
const push=x=>{const u=typeof x=='string'?enc.encode(x):x;parts.push(u);len+=u.length},obj=(n,body,stream)=>{off[n]=len;push(`${n} 0 obj\n${body}\n`);if(stream){push('stream\n');push(stream);push('\nendstream\n')}push('endobj\n')};
const cs=enc.encode(`q ${pw} 0 0 ${ph} 0 0 cm /Im0 Do Q`);push('%PDF-1.4\n%\xE2\xE3\xCF\xD3\n');
obj(1,'<< /Type /Catalog /Pages 2 0 R >>');obj(2,'<< /Type /Pages /Kids [3 0 R] /Count 1 >>');
obj(3,`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pw} ${ph}] /BleedBox [0 0 ${pw} ${ph}] /TrimBox [${tr}] /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>`);
obj(4,`<< /Type /XObject /Subtype /Image /Width ${W} /Height ${H} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpg.length} >>`,jpg);obj(5,`<< /Length ${cs.length} >>`,cs);
const x0=len;let xr='xref\n0 6\n0000000000 65535 f \n';for(let i=1;i<=5;i++)xr+=String(off[i]).padStart(10,'0')+' 00000 n \n';push(xr+`trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${x0}\n%%EOF\n`);
const out=new Uint8Array(len);let p=0;parts.forEach(u=>{out.set(u,p);p+=u.length});return new Blob([out],{type:'application/pdf'})}
const bkName=ext=>{const g=bk(),n=($('pnm')&&$('pnm').value.trim()||'book-cover').replace(/[^\w\- ]+/g,'').trim().replace(/\s+/g,'-')||'book-cover';return`${n}_${g.tw}x${g.th}in_${g.sw.toFixed(3)}spine_300dpi.${ext}`};
$('bkpng').onclick=async()=>{const d=await use('downloads');if(!d)return $('pmsg').textContent='Saving is not available here.';coverRaster(c=>c.toBlob(async bl=>{try{await d.save({filename:bkName('png'),data:bl});$('pmsg').textContent='Print cover PNG saved.'}catch(e){if(e&&e.code!='declined')$('pmsg').textContent='Could not save: '+e.message}},'image/png'))};
$('bkpdf').onclick=async()=>{const d=await use('downloads');if(!d)return $('pmsg').textContent='Saving is not available here.';coverRaster((c,g,W,H)=>c.toBlob(async jb=>{const jpg=new Uint8Array(await jb.arrayBuffer());try{await d.save({filename:bkName('pdf'),data:pdfJpeg(jpg,W,H,g)});$('pmsg').textContent='Print cover PDF saved.'}catch(e){if(e&&e.code!='declined')$('pmsg').textContent='Could not save: '+e.message}},'image/jpeg',.95))};
WBX.wbCoverPDF=(cb)=>coverRaster((c,g,W,H)=>c.toBlob(async jb=>cb(pdfJpeg(new Uint8Array(await jb.arrayBuffer()),W,H,g),W,H),'image/jpeg',.95));
bookSync();

