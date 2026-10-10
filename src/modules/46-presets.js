import {kv} from '../platform/index.js';
import {$,WBS,WBX} from './01-launch-and-version.js';
import {PL,col} from './04-canvas-and-stamp-outlines.js';
import {txEnsure} from './16-texture-generators.js';
import {coreStr,newId,pmsg,thumb} from './18-projects-and-cover-overlay.js';
// ===== Presets =====
// A look is a saved finish for a piece: the palette (paper and up to three inks), the colour grade, the canvas texture and the print
// effects. Applying one never touches the stamps or the layout, and is one step in the history (Undo brings the old look back). Starting
// looks are built in; "Save look" keeps the current one under a name (with a small picture), in your settings. The palette list holds all
// 348 combinations of Wada's book with their names; one click sets the palette (and moves the stamps' own accent inks onto it).
const LK_KEY='wb98_presets',LK_MAX=60,LK_GK=['ex','ct','hi','sh','wh','bl','tp','tn','sat','vib','hue','fd'];
const LK_START=[
  {id:'s-soft',name:'Soft cotton',pr:{e:1,q:1},grade:{ct:-6,sat:-8,tp:6,fd:12},tex:[{t:'cotton',a:38,sc:110}]},
  {id:'s-ink',name:'Strong ink',pr:{e:0,q:0},grade:{ct:18,sh:-6,sat:10},tex:[]},
  {id:'s-block',name:'Worn block',pr:{e:4,q:3},grade:{ct:6,fd:8},tex:[{t:'cold',a:45,sc:100}]},
  {id:'s-linen',name:'Faded linen',pr:{e:2,q:0},grade:{ex:4,sat:-18,fd:24},tex:[{t:'linen',a:42,sc:100}]},
  {id:'s-riso',name:'Warm riso',pr:{e:3,q:2},grade:{ct:8,tp:14,sat:12},tex:[{t:'riso',a:40,sc:100}]},
  {id:'s-clean',name:'Clean',pr:{e:0,q:0},grade:{},tex:[]},
];
const lkLoad=()=>{try{const a=JSON.parse(kv.get(LK_KEY)||'[]');return Array.isArray(a)?a.filter(r=>r&&typeof r.id=='string'&&typeof r.name=='string'&&r.look):[]}catch(e){return[]}};
const lkStore=a=>{try{kv.set(LK_KEY,JSON.stringify(a))}catch(e){pmsg('Could not keep the looks in this browser.')}};
// what a look keeps of the current piece (grade masks tied to a layer or a stamp stay with that piece)
function lkCapture(){
  const c=JSON.parse(coreStr()),g=c.grade||null,u=(c.tex&&Array.isArray(c.tex.u)?c.tex.u:[]).map(x=>({...x})),ids=new Set(u.map(x=>x.x));
  const proj={};['bg','ink','c3','c4'].forEach(k=>{if(c.proj[k])proj[k]=c.proj[k]});
  return{proj,pr:{...c.pr},grade:g?{...g,masks:(g.masks||[]).filter(m=>!m.lay&&!m.sc).map(m=>JSON.parse(JSON.stringify(m)))}:null,tex:{u},texLib:(c.texLib||[]).filter(x=>ids.has(x.id)).map(x=>({...x}))};
}
// moving to a new palette: each ink the stamps and layers use keeps its place in the palette (paper, ink, 3rd, 4th); inks from outside it spread over the new accents
function lkNameMap(c,np){
  const op=c.proj,pos=n=>n===op.bg?'bg':n===op.ink?'ink':n===op.c3?'c3':n===op.c4?'c4':null;
  const accents=[np.c3,np.c4].filter(Boolean),fallback=accents.length?accents:[np.ink],foreign=[];
  return n=>{if(!n)return n;const p=pos(n);if(p)return np[p]||np.ink;if(!foreign.includes(n))foreign.push(n);return fallback[(foreign.indexOf(n))%fallback.length]};
}
function lkRemap(c,np){
  const to=lkNameMap(c,np);
  c.tiles.forEach(t=>{if(t.ink)t.ink=to(t.ink)});c.layers.forEach(l=>{if(l.ink)l.ink=to(l.ink)});
}
function lkDo(label,mut){
  const c=JSON.parse(coreStr());mut(c);WBX.wbApply(c);WBX.wbLabelNext={t:String(label).replace(/\.$/,''),at:performance.now()};if(WBX.wbCap)WBX.wbCap();pmsg(label);
}
const lkSetProj=(c,p)=>{const np={};['bg','ink','c3','c4'].forEach(k=>{if(p[k])np[k]=p[k]});if(!np.bg||!np.ink)return;lkRemap(c,np);c.proj={...c.proj};['bg','ink','c3','c4'].forEach(k=>{if(np[k])c.proj[k]=np[k];else if(k=='c3'||k=='c4')delete c.proj[k]})};
function lkSetGrade(c,g){
  const z=Object.fromEntries(LK_GK.map(k=>[k,0])),keep=((c.grade&&c.grade.masks)||[]).filter(m=>m.lay||m.sc);
  c.grade={...z,...(g||{}),cov:!!(c.grade&&c.grade.cov),masks:[...(g&&g.masks?g.masks.map(m=>JSON.parse(JSON.stringify(m))):[]),...keep]};
}
function lkApplyUser(rec){
  const L=rec.look;
  lkDo('Look “'+rec.name+'”.',c=>{
    if(L.proj)lkSetProj(c,L.proj);
    if(L.pr)c.pr={...c.pr,...L.pr};
    if('grade' in L)lkSetGrade(c,L.grade);
    if(L.tex){c.tex={...c.tex,u:L.tex.u.map(x=>({...x}))};const have=new Set((c.texLib||[]).map(x=>x.id));c.texLib=c.texLib||[];(L.texLib||[]).forEach(x=>{if(!have.has(x.id))c.texLib.push({...x})})}
  });
}
function lkApplyStart(s){
  const u=s.tex.map((x,i)=>({x:txEnsure({t:x.t,a:x.a,sc:x.sc,az:225}),sd:7+i*131,md:'relief'}));   // the textures join the library first, so the snapshot has them
  lkDo('Look “'+s.name+'”.',c=>{
    c.pr={...c.pr,...s.pr};lkSetGrade(c,s.grade);c.tex={...c.tex,u};c.texLib=JSON.parse(JSON.stringify(WBS.texLib));
  });
}
function lkApplyPalette(i){
  const p=PL[i];if(!p)return;
  lkDo('Palette “'+p[0]+'”.',c=>lkSetProj(c,{ink:p[1],bg:p[2],c3:p[3],c4:p[4]}));
}
function init46(){
  const list=$('psl'),pal=$('ppl'),q=$('prfind'),nm=$('psn');let ren=null;
  const icon=d=>`<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;
  function paintLooks(){
    list.textContent='';
    const row=(r,own)=>{
      const e=document.createElement('div');e.className='psr';e.dataset.id=r.id;e.setAttribute('role','listitem');e.tabIndex=0;
      const th=document.createElement('div');th.className='th';if(own&&r.thumb){const im=document.createElement('img');im.alt='';im.src=r.thumb;th.appendChild(im)}else th.appendChild(document.createElement('i'));
      e.appendChild(th);
      if(own&&ren==r.id){
        const i=document.createElement('input');i.type='text';i.maxLength=40;i.value=r.name;i.setAttribute('aria-label','Look name');e.appendChild(i);
        const done=ok=>{if(ren!=r.id)return;ren=null;if(ok&&i.value.trim()){const a=lkLoad(),x=a.find(y=>y.id==r.id);if(x){x.name=i.value.trim().slice(0,40);lkStore(a)}}paintLooks()};
        i.addEventListener('keydown',ev=>{ev.stopPropagation();if(ev.key=='Enter')done(true);else if(ev.key=='Escape')done(false)});i.addEventListener('blur',()=>done(true));
        list.appendChild(e);setTimeout(()=>{i.focus();i.select()},0);return;
      }
      const b=document.createElement('b');b.textContent=r.name;e.appendChild(b);
      if(own){
        const a=document.createElement('button');a.type='button';a.className='ib';a.dataset.act='ren';a.setAttribute('aria-label','Rename '+r.name);a.innerHTML=icon('<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M13.5 6.5l4 4"/>');
        const d=document.createElement('button');d.type='button';d.className='ib';d.dataset.act='del';d.setAttribute('aria-label','Delete '+r.name);d.innerHTML=icon('<path d="M5 7h14M10 7V5h4v2M7 7l1 12h8l1-12"/>');
        e.append(a,d);
      }
      list.appendChild(e);
    };
    LK_START.forEach(s=>row(s,false));
    lkLoad().forEach(r=>row(r,true));
  }
  function paintPalettes(){
    const w=q.value.trim().toLowerCase().split(/\s+/).filter(Boolean);pal.textContent='';let n=0;const frag=document.createDocumentFragment();
    PL.forEach((p,i)=>{
      const hay=(p[0]+' '+[p[1],p[2],p[3],p[4]].filter(Boolean).join(' ')+' no '+(i+1)).toLowerCase();if(w.some(t=>!hay.includes(t)))return;n++;
      const r=document.createElement('div');r.className='ppr';r.dataset.i=i;r.setAttribute('role','listitem');r.tabIndex=0;
      const sw=document.createElement('span');sw.className='sw4';[p[2],p[1],p[3],p[4]].filter(Boolean).forEach(c=>{const s=document.createElement('i');s.style.background=col(c);sw.appendChild(s)});
      const b=document.createElement('b');b.textContent=p[0];const sm=document.createElement('small');sm.textContent='No. '+(i+1);
      r.append(sw,b,sm);frag.appendChild(r);
    });
    if(!n){const d=document.createElement('div');d.className='ppn';d.textContent='No matching palette';pal.appendChild(d)}else pal.appendChild(frag);
    $('pspc').textContent=n==PL.length?String(PL.length):n+' of '+PL.length;
  }
  list.addEventListener('click',e=>{
    const r=e.target.closest('.psr');if(!r)return;const id=r.dataset.id,btn=e.target.closest('button');
    if(btn&&btn.dataset.act=='del'){lkStore(lkLoad().filter(x=>x.id!=id));paintLooks();return}
    if(btn&&btn.dataset.act=='ren'){ren=id;paintLooks();return}
    if(e.target.closest('input'))return;
    const s=LK_START.find(x=>x.id==id);if(s)return lkApplyStart(s);
    const u=lkLoad().find(x=>x.id==id);if(u)lkApplyUser(u);
  });
  pal.addEventListener('click',e=>{const r=e.target.closest('.ppr');if(r)lkApplyPalette(+r.dataset.i)});
  const key=e=>{if((e.key=='Enter'||e.key==' ')&&e.target.classList&&(e.target.classList.contains('psr')||e.target.classList.contains('ppr'))){e.preventDefault();e.target.click()}};
  list.addEventListener('keydown',key);pal.addEventListener('keydown',key);
  $('pssave').onclick=async()=>{
    const a=lkLoad();let name=nm.value.trim().slice(0,40);if(!name)name='Look '+(a.length+1);
    if(a.length>=LK_MAX&&!a.some(x=>x.name.toLowerCase()==name.toLowerCase()))return pmsg('That is the most looks that can be kept ('+LK_MAX+'). Delete one first.');
    const look=lkCapture(),th=await thumb(160),same=a.find(x=>x.name.toLowerCase()==name.toLowerCase());
    if(same){same.look=look;same.thumb=th}else a.push({id:newId(),name,thumb:th,look});
    lkStore(a);nm.value='';paintLooks();pmsg((same?'Updated look “':'Saved look “')+(same?same.name:name)+'”.');
  };
  nm.addEventListener('keydown',e=>{e.stopPropagation();if(e.key=='Enter')$('pssave').click()});
  q.addEventListener('keydown',e=>e.stopPropagation());q.addEventListener('input',paintPalettes);
  paintLooks();paintPalettes();
}
export {init46,lkApplyPalette,lkNameMap};
