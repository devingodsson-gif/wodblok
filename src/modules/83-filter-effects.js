import {txRid} from './16-texture-generators.js';
import {fxRegister} from './65-element-core.js';

// ===== Noise, Blur and Halftone effects (2.35.0, owner: "the top noise and blurs from Photoshop", in a Noise › and a Blur › flyout; and Halftone).
// Each is one SVG filter on the element, in the element's own units, for a box b {x, y, W, H} (the element's box with room round it, from fxPad).
// filt(e, id, b) returns {defs, wrap(markup)} or null; the effect stack (69) chains them in list order with the Colour grade.
// Settings are declared: P ranges [field, label, min, max, default, unit], S selects [field, label, [[value, name]...], default], C checks [field, label, default];
// seed: true adds a Reroll button and an `sd` field. Sizes scale with the element, so an effect looks the same on a small and a large one.
const FQK=['stamp','text','pattern','paint','motif'];
const q4=n=>+(+n).toFixed(4);
const fqClamp=(v,a,b,d)=>{v=+v;return Number.isFinite(v)?Math.max(a,Math.min(b,v)):d};
const fqFilter=(id,x,y,w,h,body)=>`<filter id="${id}" filterUnits="userSpaceOnUse" primitiveUnits="userSpaceOnUse" x="${q4(x)}" y="${q4(y)}" width="${q4(w)}" height="${q4(h)}" color-interpolation-filters="sRGB">${body}</filter>`;
const fqWrap=id=>c=>`<g filter="url(#${id})">${c}</g>`;
// an effect that works along one direction runs in a turned frame: turn the element back inside, so only the effect is turned
const fqTurn=(id,a,cx,cy)=>c=>`<g transform="rotate(${q4(a)} ${q4(cx)} ${q4(cy)})"><g filter="url(#${id})"><g transform="rotate(${q4(-a)} ${q4(cx)} ${q4(cy)})">${c}</g></g></g>`;
const fqSize=b=>Math.max(1e-6,Math.max(b.W,b.H)/1.3);   // the element's own size (fxPad adds 15% each side)
const fqSeed=e=>Math.abs(e.sd|0)%100000;
const fqPar=(e,f,a,b,d)=>fqClamp(e[f]==null?d:e[f],a,b,d);
// noise in R, G, B (or R copied to all three when mono), alpha 1
const fqMono='1 0 0 0 0 1 0 0 0 0 1 0 0 0 0 0 0 0 0 1',fqRGB='1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 0 1';
const fqLin=(k,res,inp)=>`<feComponentTransfer in="${inp}" result="${res}">${['R','G','B'].map(c=>`<feFunc${c} type="linear" slope="${q4(k)}" intercept="${q4(.5-.5*k)}"/>`).join('')}</feComponentTransfer>`;
// add (noise - 0.5) times amp to the element's colour, kept to the element's ink
const fqAdd=(inp,amp)=>`<feComposite in="SourceGraphic" in2="${inp}" operator="arithmetic" k1="0" k2="1" k3="${q4(amp)}" k4="${q4(-amp/2)}" result="fqm"/><feComposite in="fqm" in2="SourceAlpha" operator="in"/>`;
// a cut: alpha 1 where the alpha channel is at or above t
const fqCut=(t,inp,res)=>{const N=50,v=[];for(let i=0;i<N;i++)v.push(i/N>=t?1:0);return`<feComponentTransfer in="${inp}" result="${res}"><feFuncA type="discrete" tableValues="${v.join(' ')}"/></feComponentTransfer>`};
const fqToA=(inp,res)=>`<feColorMatrix in="${inp}" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0 0 0 0" result="${res}"/>`;
// one halftone cell: light in the middle, dark at the corners (tiled, it is a grid of cones)
const FQ_CELL='data:image/svg+xml,'+encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"><radialGradient id="g" cx=".5" cy=".5" r=".7071"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#000"/></radialGradient><rect width="64" height="64" fill="url(#g)"/></svg>`);

const FQ={
 noise:{label:'Add Noise',grp:'Noise',seed:true,P:[['amt','Amount',0,100,25,'%'],['sz','Size',1,100,20,'']],S:[['dist','Distribution',[['gauss','Gaussian'],['unif','Uniform']],'gauss']],C:[['mono','Monochromatic',true]],
  filt:(e,id,b)=>{const amt=fqPar(e,'amt',0,100,25);if(!amt)return null;const S=fqSize(b),g=S*(.002+fqPar(e,'sz',1,100,20)/100*.03),un=e.dist=='unif';
   const body=`<feTurbulence type="fractalNoise" baseFrequency="${q4(1/g)}" numOctaves="1" seed="${fqSeed(e)}" result="n0"/><feColorMatrix in="n0" type="matrix" values="${e.mono===false?fqRGB:fqMono}" result="n1"/>`+fqLin(2.6,'n2','n1')
    +(un?`<feComponentTransfer in="n2" result="n3">${['R','G','B'].map(c=>`<feFunc${c} type="table" tableValues="0 .08 .5 .92 1"/>`).join('')}</feComponentTransfer>`:'')+fqAdd(un?'n3':'n2',amt/100*1.2);
   return{defs:fqFilter(id,b.x,b.y,b.W,b.H,body),wrap:fqWrap(id)}}},
 grain:{label:'Film Grain',grp:'Noise',seed:true,P:[['amt','Amount',0,100,35,'%'],['sz','Size',1,100,30,''],['soft','Clumping',0,100,40,'%']],
  filt:(e,id,b)=>{const amt=fqPar(e,'amt',0,100,35);if(!amt)return null;const S=fqSize(b),g=S*(.003+fqPar(e,'sz',1,100,30)/100*.03),so=fqPar(e,'soft',0,100,40);
   const body=`<feTurbulence type="fractalNoise" baseFrequency="${q4(1/g)}" numOctaves="2" seed="${fqSeed(e)}" result="n0"/><feColorMatrix in="n0" type="matrix" values="${fqMono}" result="n1"/>`
    +(so?`<feGaussianBlur in="n1" stdDeviation="${q4(g*so/100*.6)}" result="n1b"/>`:'')+fqLin(3*(1+so/40),'n2',so?'n1b':'n1')+fqAdd('n2',amt/100*.9);
   return{defs:fqFilter(id,b.x,b.y,b.W,b.H,body),wrap:fqWrap(id)}}},
 dust:{label:'Dust & Scratches',grp:'Noise',seed:true,P:[['amt','Dust',0,100,30,'%'],['sz','Size',1,100,30,''],['scr','Scratches',0,100,30,'%']],S:[['col','Show as',[['holes','Holes'],['specks','Dark specks']],'holes']],
  filt:(e,id,b)=>{const amt=fqPar(e,'amt',0,100,30),scr=fqPar(e,'scr',0,100,30);if(!amt&&!scr)return null;const S=fqSize(b),g=S*(.004+fqPar(e,'sz',1,100,30)/100*.02),sd=fqSeed(e);let body='',parts=[];
   if(amt){body+=`<feTurbulence type="fractalNoise" baseFrequency="${q4(1/g)}" numOctaves="1" seed="${sd}" result="sp0"/>`+fqToA('sp0','sp1')+fqCut(.76-amt/100*.14,'sp1','sp');parts.push('sp')}
   if(scr){body+=`<feTurbulence type="fractalNoise" baseFrequency="${q4(1/(g*1.2))} ${q4(1/(S*.3))}" numOctaves="1" seed="${sd+7}" result="sc0"/>`+fqToA('sc0','sc1')+fqCut(.78-scr/100*.14,'sc1','sc');parts.push('sc')}
   body+=`<feMerge result="d">${parts.map(p=>`<feMergeNode in="${p}"/>`).join('')}</feMerge>`;
   body+=e.col=='specks'?`<feFlood flood-color="#000" result="k"/><feComposite in="k" in2="d" operator="in" result="kd"/><feComposite in="kd" in2="SourceAlpha" operator="in" result="kd2"/><feMerge><feMergeNode in="SourceGraphic"/><feMergeNode in="kd2"/></feMerge>`
    :`<feComposite in="SourceGraphic" in2="d" operator="out"/>`;
   return{defs:fqFilter(id,b.x,b.y,b.W,b.H,body),wrap:fqWrap(id)}}},
 blur:{label:'Gaussian Blur',grp:'Blur',P:[['amt','Radius',0,100,10,'']],
  filt:(e,id,b)=>{const sg=fqSize(b)*fqPar(e,'amt',0,100,10)/100*.06;if(!(sg>0))return null;const m=3*sg;
   return{defs:fqFilter(id,b.x-m,b.y-m,b.W+2*m,b.H+2*m,`<feGaussianBlur in="SourceGraphic" stdDeviation="${q4(sg)}"/>`),wrap:fqWrap(id)}}},
 motion:{label:'Motion Blur',grp:'Blur',P:[['amt','Distance',0,100,20,''],['ang','Angle',0,359,0,'&#176;']],
  filt:(e,id,b)=>{const sg=fqSize(b)*fqPar(e,'amt',0,100,20)/100*.08;if(!(sg>0))return null;const a=fqPar(e,'ang',0,359,0),cx=b.x+b.W/2,cy=b.y+b.H/2,h=Math.hypot(b.W,b.H)/2+3*sg;
   return{defs:fqFilter(id,cx-h,cy-h,2*h,2*h,`<feGaussianBlur in="SourceGraphic" stdDeviation="${q4(sg)} 0"/>`),wrap:fqTurn(id,a,cx,cy)}}},
 halftone:{label:'Halftone',P:[['sz','Dot size',1,100,30,''],['tone','Ink',5,100,55,'%'],['ang','Angle',0,90,45,'&#176;'],['spr','Spread',0,100,40,'%']],
  filt:(e,id,b)=>{const S=fqSize(b),c=S*(.008+fqPar(e,'sz',1,100,30)/100*.1),T=fqPar(e,'tone',5,100,55)/100*1.02,a=fqPar(e,'ang',0,90,45),sg=c*(.15+fqPar(e,'spr',0,100,40)/100*1.5),cx=b.x+b.W/2,cy=b.y+b.H/2,h=Math.hypot(b.W,b.H)/2;
   const x0=cx-h,y0=cy-h;
   const body=`<feGaussianBlur in="SourceAlpha" stdDeviation="${q4(sg)}" result="a"/><feColorMatrix in="a" type="matrix" values="0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0 0 1" result="t"/>`
    +`<feImage href="${FQ_CELL}" x="${q4(x0)}" y="${q4(y0)}" width="${q4(c)}" height="${q4(c)}" preserveAspectRatio="none" result="cell"/><feTile in="cell" result="cone"/>`
    +`<feComposite in="cone" in2="t" operator="arithmetic" k1="0" k2="1" k3="${q4(T)}" k4="-1" result="d"/><feColorMatrix in="d" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 40 0 0 0 0" result="dot"/><feComposite in="SourceGraphic" in2="dot" operator="in"/>`;
   return{defs:fqFilter(id,x0,y0,2*h,2*h,body),wrap:fqTurn(id,a,cx,cy)}}}
};
// the defaults of a new effect of kind k
function fqMake(k){const d=FQ[k],o={k,on:true};(d.P||[]).forEach(p=>o[p[0]]=p[4]);(d.S||[]).forEach(s=>o[s[0]]=s[3]);(d.C||[]).forEach(c=>o[c[0]]=c[2]);if(d.seed)o.sd=txRid();return o}
// the settings pane of one effect, for the effect stack's group (fields carry data-q; Reroll carries data-qrr)
function fqPane(k){const d=FQ[k];return`<div class="fxs" data-e="${k}" hidden>`
 +(d.P||[]).map(([f,n,a,b,v,u])=>`<div class="ctl"><label>${n}</label><input type="range" data-q="${f}" min="${a}" max="${b}" value="${v}"${u?` data-u="${u}"`:''} data-def="${v}" aria-label="${n}"></div>`).join('')
 +(d.S||[]).map(([f,n,o,v])=>`<div class="ctl"><label>${n}</label><select data-q="${f}" aria-label="${n}">${o.map(([x,t])=>`<option value="${x}"${x==v?' selected':''}>${t}</option>`).join('')}</select></div>`).join('')
 +(d.C||[]).map(([f,n,v])=>`<label class="chk"><input type="checkbox" data-q="${f}"${v?' checked':''}><span>${n}</span></label>`).join('')
 +(d.seed?'<div class="row"><button type="button" class="alt" data-qrr>Reroll</button></div>':'')+'</div>'}
// show effect e's settings in its pane
function fqSync(pane,e){const d=FQ[e.k];if(!d)return;
 (d.P||[]).forEach(([f,,a,b,v])=>{const el=pane.querySelector(`[data-q="${f}"]`),x=fqPar(e,f,a,b,v);if(el&&+el.value!==x){el.value=x;el.dispatchEvent(new Event('input',{bubbles:true}))}});
 (d.S||[]).forEach(([f,,,v])=>{const el=pane.querySelector(`[data-q="${f}"]`),x=e[f]==null?v:e[f];if(el&&el.value!==x)el.value=x});
 (d.C||[]).forEach(([f,,v])=>{const el=pane.querySelector(`[data-q="${f}"]`),x=e[f]==null?v:!!e[f];if(el&&el.checked!==x)el.checked=x})}
// a field's value from its control
const fqVal=el=>el.type=='checkbox'?el.checked:el.tagName=='SELECT'?el.value:+el.value;
// registered by the effect stack (69) after its own four, so the menu lists Texture, Pressure offset, Jitter and Colour grade first
function fqRegister(){Object.entries(FQ).forEach(([k,d])=>fxRegister(k,{label:d.label,grp:d.grp||null,kinds:FQK,make:()=>fqMake(k),filt:d.filt,pane:()=>fqPane(k),sync:fqSync,seed:!!d.seed}))}
export {FQ,fqMake,fqRegister,fqVal};
