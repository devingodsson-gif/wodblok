import {kv} from '../platform/index.js';
import {CH,CW,physNow} from './04-canvas-and-stamp-outlines.js';

// ===== Units (2.87.1, docs/pro-basics-plan.md step 1; owner Nov 3 2026: mm by default). One setting, Settings > General > Units (px, in, mm, cm), for every length the
// panels show in real units. A length on the canvas (canvas units) is turned into the unit through the canvas's physical size (Canvas > Format: its size and DPI). A canvas
// with only a ratio is taken as 300 mm on its long side at 300 DPI until a size is set (owner, Nov 3). Changing Units changes what is shown, never the document.
const UN_K='wb2871_units',UNITS=['px','in','mm','cm'],UN_DP={px:0,in:3,mm:1,cm:2};
const unGet=()=>{let v='';try{v=kv.get(UN_K)||''}catch(e){}return UNITS.includes(v)?v:'mm'};
const unSet=u=>{if(UNITS.includes(u))try{kv.set(UN_K,u)}catch(e){}};
// millimetres per canvas unit, and the DPI px are counted at
function unBase(){const P=physNow();if(P)return{mm:P.inW*25.4/CW,dpi:P.dpi};return{mm:300/Math.max(CW,CH),dpi:300}}
const unPer=u=>{const b=unBase();return u=='mm'?b.mm:u=='cm'?b.mm/10:u=='in'?b.mm/25.4:b.mm/25.4*b.dpi};
// canvas units to the chosen unit (a number), and back
const unTo=(v,u=unGet())=>v*unPer(u);
const unFrom=(n,u=unGet())=>n/unPer(u);
const unFmt=(v,u=unGet())=>{const n=unTo(v,u),d=UN_DP[u];return String(+n.toFixed(d))};
// what is typed: a number in the chosen unit, a number with its own unit ("2in", "50 mm", "120px"), simple arithmetic ("10+5", "100/3", "2in-3mm"); a leading + or -
// with nothing before it is a change from the value there ("+10"). Returns canvas units, or null for what cannot be read.
function unParse(text,cur){const u=unGet(),s=String(text||'').trim().toLowerCase().replace(/,/g,'.');if(!s)return null;
 const rel=/^[+\-]/.test(s)&&cur!=null,src=rel?String(+unTo(cur,u).toFixed(6))+s:s;let i=0;
 const ws=()=>{while(src[i]==' ')i++},num=()=>{ws();const m=/^(\d+\.?\d*|\.\d+)\s*(px|in|mm|cm|")?/.exec(src.slice(i));if(!m)return NaN;i+=m[0].length;const n=+m[1],un=m[2]=='"'?'in':m[2];return un&&un!==u?unTo(unFrom(n,un),u):n};
 const fac=()=>{ws();if(src[i]=='-'){i++;return-fac()}if(src[i]=='+'){i++;return fac()}if(src[i]=='('){i++;const v=add();ws();if(src[i]==')')i++;return v}return num()};
 const mul=()=>{let v=fac();for(;;){ws();const c=src[i];if(c=='*'||c=='x'){i++;v*=fac()}else if(c=='/'){i++;const d=fac();v=d?v/d:NaN}else return v}};
 const add=()=>{let v=mul();for(;;){ws();const c=src[i];if(c=='+'){i++;v+=mul()}else if(c=='-'){i++;v-=mul()}else return v}};
 const v=add();ws();if(i<src.length||!Number.isFinite(v))return null;return unFrom(v,u)}
export {UNITS,unGet,unSet,unTo,unFrom,unFmt,unParse};
