// The website's accent colour follows the one picked in the app (Settings > General > Accent).
// The app writes the colour as a cookie for the whole domain (src/platform/account.js, wb_accent=<6 hex digits>); this reads it and sets the
// same four tokens the app derives from it. The block between the two marker lines is the app's own colour maths, copied unchanged from
// src/modules/55-settings.js (tests/site-accent.test.mjs fails if the two differ). No cookie: the page keeps its built-in colour (Oak).
(function () {
  var m = /(?:^|; )wb_accent=([0-9a-f]{6})(?:;|$)/i.exec(document.cookie || '');
  if (!m) return;
  var hex = '#' + m[1].toLowerCase();
// ---- begin shared accent maths ----
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
// ---- end shared accent maths ----
  var v = accentVars(hex);
  var rule = function (sel, t) { return sel + '{--acc:' + t.acc + ';--acc-ink:' + t.ink + ';--acc-fg:' + t.fg + ';--acc-soft:' + t.soft + '}'; };
  var el = document.createElement('style');
  el.id = 'accstyle';
  el.textContent = rule(':root', v.dark) +
    '@media (prefers-color-scheme:light){' + rule(':root:not([data-theme="dark"])', v.light) + '}' +
    rule(':root[data-theme="light"]', v.light) + rule(':root[data-theme="dark"]', v.dark);
  document.head.appendChild(el);
})();
