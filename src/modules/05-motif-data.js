import {kv} from '../platform/index.js';
import {WBS} from './01-launch-and-version.js';
import {M,N,tk} from './04-canvas-and-stamp-outlines.js';
import {SHAPES} from '../data/shapes.js';

// The built-in shapes: sets and their shapes come from src/data/shapes.js (made by tools/build-shapes.mjs).
// Keys are b0..bN in order; unknown keys fall back to a shape by index.
let CATS;
// the small dot shapes start smaller when stamped
let DOTK;
function init05(){
CATS=SHAPES.map(([n,list])=>({n,k:list.map(([nm,svg])=>{M.push(tk(svg));N.push(nm);return'b'+(M.length-1)})}));
DOTK=new Set(CATS.flatMap(c=>c.k.filter(k=>/\bdots?\b/i.test(N[+k.slice(1)]))));
WBS.mcat='/';try{WBS.mcat=kv.get('wb11_mcat')||'/'}catch(e){}
}
export {CATS,DOTK,init05};
