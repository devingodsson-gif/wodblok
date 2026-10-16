import {kv} from '../platform/index.js';
import {$,WBX} from './01-launch-and-version.js';
import {newId,pmsg} from './18-projects-and-cover-overlay.js';
// ===== Workspaces =====
// A workspace is a saved arrangement of the tool panels (which tools are open, their tabs, and where they sit) for the Pattern view
// and the Stamp editor. Pick one to set that arrangement; save the current one under a name. Kept with your settings, not in project
// files. The app still starts with no tools open: a workspace only applies when you choose it.
const WX_KEY='wb96_workspaces';
const wxG=(tabs,o={})=>({tabs,a:tabs[0],...o});
const WX_BUILTIN=[
  {id:'b-colour',name:'Colour work',layout:{pattern:{dock:[wxG(['colors','grade','tex']),wxG(['rand'])],float:[]},stamp:{dock:[wxG(['stamp','colors','grade','tex'])],float:[]}}},
  {id:'b-layout',name:'Layout work',layout:{pattern:{dock:[wxG(['lyrs']),wxG(['layers','canvas','pgrid'])],float:[]},stamp:{dock:[wxG(['motifs','mlist']),wxG(['stamp','grid'])],float:[]}}},
  {id:'b-closed',name:'Everything closed',layout:{pattern:{dock:[],float:[]},stamp:{dock:[],float:[]}}},
];
const wxLoad=()=>{try{const a=JSON.parse(kv.get(WX_KEY)||'[]');return Array.isArray(a)?a.filter(w=>w&&typeof w.id=='string'&&typeof w.name=='string'&&w.layout):[]}catch(e){return[]}};
const wxStore=a=>{try{kv.set(WX_KEY,JSON.stringify(a))}catch(e){pmsg('Could not keep the workspaces in this browser.')}};
function init42(){
  const list=$('wxl'),inp=$('wxn');let ren=null;
  const icon=d=>`<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;
  function paint(){
    const mine=wxLoad();list.textContent='';
    const row=(w,own)=>{
      const r=document.createElement('div');r.className='wxr';r.dataset.id=w.id;r.setAttribute('role','listitem');r.tabIndex=0;
      if(own&&ren==w.id){
        const i=document.createElement('input');i.type='text';i.maxLength=40;i.value=w.name;i.setAttribute('aria-label','Workspace name');r.style.gridTemplateColumns='minmax(0,1fr)';r.appendChild(i);
        const done=ok=>{if(ren!=w.id)return;ren=null;if(ok&&i.value.trim()){const a=wxLoad(),x=a.find(y=>y.id==w.id);if(x){x.name=i.value.trim().slice(0,40);wxStore(a)}}paint()};
        i.addEventListener('keydown',e=>{e.stopPropagation();if(e.key=='Enter')done(true);else if(e.key=='Escape')done(false)});i.addEventListener('blur',()=>done(true));
        list.appendChild(r);setTimeout(()=>{i.focus();i.select()},0);return;
      }
      const b=document.createElement('b');b.textContent=w.name;r.appendChild(b);
      if(own){
        const a=document.createElement('button');a.type='button';a.className='ib';a.dataset.act='ren';a.setAttribute('aria-label','Rename '+w.name);a.innerHTML=icon('<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M13.5 6.5l4 4"/>');
        const d=document.createElement('button');d.type='button';d.className='ib';d.dataset.act='del';d.setAttribute('aria-label','Delete '+w.name);d.innerHTML=icon('<path d="M5 7h14M10 7V5h4v2M7 7l1 12h8l1-12"/>');
        r.append(a,d);
      }else r.style.gridTemplateColumns='minmax(0,1fr)';
      list.appendChild(r);
    };
    const h1=document.createElement('div');h1.className='glb';h1.textContent='Starting points';list.appendChild(h1);WX_BUILTIN.forEach(w=>row(w,false));
    if(mine.length){const h2=document.createElement('div');h2.className='glb';h2.textContent='Yours';list.appendChild(h2);mine.forEach(w=>row(w,true))}
  }
  const apply=w=>{WBX.wbWsSet(w.layout);pmsg('Workspace “'+w.name+'”.')};
  list.addEventListener('click',e=>{
    const r=e.target.closest('.wxr');if(!r)return;const id=r.dataset.id,btn=e.target.closest('button');
    if(btn&&btn.dataset.act=='del'){wxStore(wxLoad().filter(w=>w.id!=id));paint();return}
    if(btn&&btn.dataset.act=='ren'){ren=id;paint();return}
    if(e.target.closest('input'))return;
    const w=WX_BUILTIN.find(x=>x.id==id)||wxLoad().find(x=>x.id==id);if(w)apply(w);
  });
  list.addEventListener('keydown',e=>{if((e.key=='Enter'||e.key==' ')&&e.target.classList&&e.target.classList.contains('wxr')){e.preventDefault();e.target.click()}});
  $('wxsave').onclick=()=>{
    const a=wxLoad();let name=inp.value.trim().slice(0,40);if(!name)name='Workspace '+(a.length+1);
    const layout=WBX.wbWsGet();['pattern','stamp'].forEach(m=>{const L=layout[m];if(!L)return;['dock','float'].forEach(k=>{L[k]=(L[k]||[]).map(g=>({...g,tabs:g.tabs.filter(t=>t!='wspc')})).filter(g=>g.tabs.length);L[k].forEach(g=>{if(!g.tabs.includes(g.a))g.a=g.tabs[0]})})});   // the list you are choosing from is not part of a workspace
    const same=a.find(w=>w.name.toLowerCase()==name.toLowerCase());
    if(same)same.layout=layout;else a.push({id:newId(),name,layout});
    wxStore(a);inp.value='';paint();pmsg((same?'Updated workspace “':'Saved workspace “')+(same?same.name:name)+'”.');
  };
  inp.addEventListener('keydown',e=>{e.stopPropagation();if(e.key=='Enter')$('wxsave').click()});
  paint();
}
export {init42};
