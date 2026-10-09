import {use} from '../platform/index.js';
import {$,WBS,WB_VER} from './01-launch-and-version.js';
import {CH,CW,PL,bk,col,csk,tileOn} from './04-canvas-and-stamp-outlines.js';
import {expName,ser} from './14-presets-and-layer-grid-ui.js';
import {pmsg} from './18-projects-and-cover-overlay.js';
import {pdfJpeg} from './30-print-cover.js';
// ===== Print proof =====
// One page to check before printing: the piece (and, for a repeat tile, the tile repeated 3 x 3), the colours with their names and
// the book's number for the palette, the size, and the date. Letter or A4, as a PDF or a PNG. Drawn from the same picture the exports make.
const PAPERS={letter:[8.5,11],a4:[8.27,11.69]},DPI=150;
const loadImg=url=>new Promise((res,rej)=>{const i=new Image();i.onload=()=>res(i);i.onerror=()=>rej(new Error('The picture could not be made.'));i.src=url});
const fit=(w,h,bw,bh)=>{const k=Math.min(bw/w,bh/h);return[w*k,h*k]};
function colours(){
  const p=WBS.proj,list=[['Paper',p.bg],['Ink',p.ink],['3rd colour',p.c3],['4th colour',p.c4]].filter(x=>x[1]),seen=new Set(list.map(x=>x[1]));
  const more=[];[...WBS.tiles.map(t=>t.ink),...WBS.layers.map(l=>l.ink)].forEach(n=>{if(n&&!seen.has(n)){seen.add(n);more.push(['Also used',n])}});
  return list.concat(more).filter(x=>{try{return !!col(x[1])}catch(e){return false}});
}
async function proofCanvas(paper){
  const [pw,ph]=PAPERS[paper]||PAPERS.letter,W=Math.round(pw*DPI),H=Math.round(ph*DPI),m=Math.round(W*.07);
  await Promise.all(['600 40px Fraunces','400 20px "Hanken Grotesk"','600 20px "Hanken Grotesk"'].map(f=>document.fonts.load(f).catch(()=>{})));
  const c=document.createElement('canvas');c.width=W;c.height=H;const x=c.getContext('2d');
  x.fillStyle='#fff';x.fillRect(0,0,W,H);x.textBaseline='alphabetic';
  const ink='#26221d',mut='#706858',line='#ddd5c6',serif='Fraunces, Georgia, serif',sans='"Hanken Grotesk", system-ui, sans-serif';
  const text=(s,px,y,o={})=>{x.font=`${o.w||400} ${px}px ${o.f||sans}`;x.fillStyle=o.c||ink;x.textAlign=o.a||'left';x.fillText(s,o.x??m,y)};
  const clip=(s,px,maxw,o={})=>{x.font=`${o.w||400} ${px}px ${o.f||sans}`;while(s.length>3&&x.measureText(s).width>maxw)s=s.slice(0,-2);return s};
  // header
  const name=($('pnm').value||'').trim()||'Untitled pattern',date=new Date().toLocaleDateString(undefined,{year:'numeric',month:'long',day:'numeric'});
  text(clip(name,46,W-2*m,{w:600,f:serif}),46,m+34,{w:600,f:serif});
  text(`Print proof  ·  ${date}  ·  WODBLOK v${WB_VER}`,20,m+70,{c:mut});
  x.strokeStyle=line;x.lineWidth=2;x.beginPath();x.moveTo(m,m+92);x.lineTo(W-m,m+92);x.stroke();
  // the picture
  const tile=tileOn(),top=m+120,ah=Math.round(H*.45),aw=W-2*m;
  const img=await loadImg('data:image/svg+xml;charset=utf-8,'+encodeURIComponent(ser()));
  const frame=(px,py,pw2,ph2)=>{x.strokeStyle=line;x.lineWidth=2;x.strokeRect(px-1,py-1,pw2+2,ph2+2)};
  if(tile){
    const lw=Math.round(aw*.42),rw=Math.round(aw*.52),gap=aw-lw-rw;
    const [a,b]=fit(CW,CH,lw,ah);x.drawImage(img,m,top,a,b);frame(m,top,a,b);
    const [tw,th]=fit(3*CW,3*CH,rw,ah),rx=m+lw+gap;
    for(let i=0;i<3;i++)for(let j=0;j<3;j++)x.drawImage(img,rx+i*tw/3,top+j*th/3,tw/3+.5,th/3+.5);frame(rx,top,tw,th);
    text('One tile',20,top+Math.max(b,th)+34,{c:mut});text('Repeated 3 × 3',20,top+Math.max(b,th)+34,{c:mut,x:rx});
  }else{
    const [a,b]=fit(CW,CH,aw,ah),px=m+(aw-a)/2;x.drawImage(img,px,top,a,b);frame(px,top,a,b);
  }
  // colours
  let y=top+ah+(tile?96:40);
  text('COLOURS',18,y,{w:600,c:mut});
  const pal=WBS.proj,bi=PL.findIndex(p=>p[2]==pal.bg&&p[1]==pal.ink&&(p[3]||'')==(pal.c3||'')&&(p[4]||'')==(pal.c4||''));
  if(bi>=0)text(`${PL[bi][0]}  ·  No. ${bi+1} in Sanzo Wada's Dictionary of Color Combinations`,20,y+34);
  y+=bi>=0?62:30;
  const sw=Math.round((aw-3*18)/4),sh=Math.round(sw*.55);
  colours().forEach((cl,k)=>{
    const cx=m+(k%4)*(sw+18),cy=y+Math.floor(k/4)*(sh+84);
    x.fillStyle=col(cl[1]);x.fillRect(cx,cy,sw,sh);x.strokeStyle=line;x.lineWidth=2;x.strokeRect(cx,cy,sw,sh);
    text(clip(cl[1],22,sw,{w:600}),22,cy+sh+28,{w:600,x:cx});
    text(`${cl[0]}  ·  ${col(cl[1]).toUpperCase()}`,17,cy+sh+52,{c:mut,x:cx});
  });
  // size and counts
  const rows=[];
  const asp=(WBS.dim.c&&WBS.dim.c.length==2)?WBS.dim.c.join(':'):'';
  if(WBS.book.on){const g=bk();rows.push(`Print cover ${g.W.toFixed(3)} × ${g.H.toFixed(3)} in  ·  spine ${g.sw.toFixed(3)} in  ·  at 300 DPI ${Math.round(g.W*300)} × ${Math.round(g.H*300)} px`)}
  else if(tile)rows.push(`Repeat tile${asp?', ratio '+asp:''}  ·  the edges meet, so copies placed side by side show no seam`);
  else rows.push(`Canvas${asp?' ratio '+asp:''}${csk()!='rect'?'  ·  shape '+csk():''}`);
  rows.push(`${WBS.tiles.length} stamp${WBS.tiles.length==1?'':'s'}  ·  ${WBS.layers.length} layer${WBS.layers.length==1?'':'s'}`);
  rows.forEach((r,k)=>text(clip(r,19,aw),19,H-m-(rows.length-1-k)*30,{c:mut}));
  return{c,W,H,pw,ph};
}
const proofName=ext=>{const f=expName(ext),n=f.slice(0,-(ext.length+1));return n+'-proof.'+ext};
function init45(){
  const paper=()=>$('xpp').value;
  async function save(kind){
    const d=await use('downloads');if(!d)return pmsg('Saving is not available here.');
    try{
      pmsg('Making the proof…');const{c,W,H,pw,ph}=await proofCanvas(paper());
      if(kind=='png'){const b=await new Promise((res,rej)=>c.toBlob(v=>v?res(v):rej(new Error('The proof could not be made.')),'image/png'));await d.save({filename:proofName('png'),data:b})}
      else{const jb=await new Promise((res,rej)=>c.toBlob(v=>v?res(v):rej(new Error('The proof could not be made.')),'image/jpeg',.95));await d.save({filename:proofName('pdf'),data:pdfJpeg(new Uint8Array(await jb.arrayBuffer()),W,H,{W:pw,H:ph,b:0})})}
      pmsg('Print proof saved.');
    }catch(e){if(e&&e.code=='declined')return pmsg('');pmsg((e&&e.message)||'Could not make the proof.')}
  }
  $('xppdf').onclick=()=>save('pdf');$('xppng').onclick=()=>save('png');
}
export {init45};
