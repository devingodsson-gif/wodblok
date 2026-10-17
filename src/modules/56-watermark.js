import {kv} from '../platform/index.js';
// ===== Export watermark =====
// An option on the Export panel. When it is on, PNG, JPG and TIFF pictures (recipes, Export all, colourway zips and the Quick PNG) get the
// Wodblok mark in the top-left corner and "Made with Wodblok" in the bottom-right. Mark and "Wodblok" are the accent colour; "Wodblok" is set in
// the wordmark font (IM Fell English) and "Made with" in the interface font at its heaviest weight. "Made with" turns light or dark to suit the
// picture under it. SVG files are left clean: a vector file cannot carry the fonts. The choice is kept in this browser, off by default.
const WM_KEY='wb116_watermark';
const wmGet=()=>{try{return kv.get(WM_KEY)=='1'}catch(e){return false}};
const wmSet=on=>{try{if(on)kv.set(WM_KEY,'1');else kv.remove(WM_KEY)}catch(e){}};
// the fonts are bundled but only fetched from their data when first used, so ask for them before drawing
let ready=null;
const wmReady=()=>ready||(ready=Promise.all([document.fonts.load('400 40px "IM Fell English"','Wodblok'),document.fonts.load('600 40px "Hanken Grotesk"','Made with')]).then(()=>{},()=>{}));
// Draw the watermark onto a finished picture (a 2D canvas context of w x h pixels). Sizes follow the shorter side (logo 11%, text 4.2%).
function wmDraw(ctx,w,h){
  const u=Math.min(w,h)/100,m=4*u,acc=getComputedStyle(document.documentElement).getPropertyValue('--acc').trim()||'#b8914f';
  ctx.save();
  try{
    // top-left: the logo, drawn from the same outline as the top bar
    const svg=document.querySelector('.brand svg'),p=svg&&svg.querySelector('path');
    if(svg&&p){
      const vb=svg.viewBox.baseVal,lw=11*u,k=lw/vb.width;
      ctx.save();ctx.translate(m,m);ctx.scale(k,k);ctx.translate(-vb.x,-vb.y);
      ctx.shadowColor='rgba(0,0,0,.28)';ctx.shadowBlur=.5*u/k;ctx.fillStyle=acc;ctx.fill(new Path2D(p.getAttribute('d')));
      ctx.restore();
    }
    // bottom-right: "Made with" then "Wodblok", right-aligned on one baseline
    const fs=4.2*u,fw=`400 ${fs*1.3}px "IM Fell English",Georgia,serif`,fm=`600 ${fs}px "Hanken Grotesk",system-ui,sans-serif`;
    ctx.textAlign='right';ctx.textBaseline='alphabetic';
    ctx.font=fw;const ww=ctx.measureText('Wodblok').width;
    ctx.font=fm;const mw=ctx.measureText('Made with').width,gap=fs*.32,x1=w-m,x0=x1-ww-gap-mw,y=h-m;
    // light or dark "Made with", by the average brightness of the picture under the text
    let light=true;
    try{const rx=Math.max(0,Math.floor(x0)),ry=Math.max(0,Math.floor(y-fs*1.3)),d=ctx.getImageData(rx,ry,Math.max(1,Math.min(w-rx,Math.ceil(x1-rx))),Math.max(1,Math.min(h-ry,Math.ceil(fs*1.6)))).data;
      let s=0,n=0;for(let i=0;i<d.length;i+=16){s+=.2126*d[i]+.7152*d[i+1]+.0722*d[i+2];n++}light=n?s/n<140:true}catch(e){}
    ctx.shadowBlur=.5*u;ctx.shadowColor=light?'rgba(0,0,0,.35)':'rgba(255,255,255,.4)';
    ctx.font=fw;ctx.fillStyle=acc;ctx.fillText('Wodblok',x1,y);
    ctx.font=fm;ctx.fillStyle=light?'#fff':'#26221d';ctx.fillText('Made with',x1-ww-gap,y);
  }finally{ctx.restore()}
}
export {wmGet,wmSet,wmReady,wmDraw};
