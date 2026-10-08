// ---- Grid shapes: any canvas shape can be the cell of a grid. gModel lays the cells over W x H and lists the points a stamp can snap to.
const GSH=['rect','hex','tri','diamond'],gShOk=s=>GSH.includes(s)?s:'rect',GMC=new Map();
function gModel(sh,W,H,n,wrap){const key=sh+'|'+W+'|'+H+'|'+n+'|'+(wrap?1:0),hit=GMC.get(key);if(hit)return hit;
 const w=W/n,S3=Math.sqrt(3),f=v=>+v.toFixed(2),off=sh=='hex'||sh=='tri'||sh=='diamond',eps=1e-4;
 let rs=sh=='oval'||sh=='arch'?w*1.5:sh=='hex'||sh=='tri'?w*S3/2:sh=='diamond'?w/2:w,m=wrap?Math.max(1,Math.round(H/rs)):Math.ceil(H/rs);
 if(wrap){if(off&&m%2)m++;rs=H/m}
 const items=[],cents=[],verts=[],vk=new Map(),odd=j=>((j%2)+2)%2;
 const inD=(x,y)=>wrap?(x>=-eps&&x<W-eps&&y>=-eps&&y<H-eps):(x>=-w&&x<=W+w&&y>=-rs&&y<=H+rs);
 const addV=(x,y)=>{if(!inD(x,y))return;const k=Math.round(x*50)+','+Math.round(y*50);if(vk.has(k))return;vk.set(k,1);verts.push([x,y])};
 const addC=(x,y)=>{if(inD(x,y))cents.push([x,y])};
 const add=(d,cx,cy,hx,hy)=>{if(cx+hx>=0&&cx-hx<=W&&cy+hy>=0&&cy-hy<=H)items.push(d)};
 const P=pts=>'M'+pts.map(q=>f(q[0])+' '+f(q[1])).join('L')+'Z';
 const ell=(cx,cy,rx,ry)=>`M${f(cx-rx)} ${f(cy)}a${f(rx)} ${f(ry)} 0 1 0 ${f(2*rx)} 0a${f(rx)} ${f(ry)} 0 1 0 ${f(-2*rx)} 0Z`;
 if(sh=='tri'){for(let b=-2;b<=m+1;b++)for(let a=Math.floor(-1-b/2);a<=Math.ceil(n+1-b/2);a++){const q=(i,k)=>[i*w+k*w/2,k*rs],A=q(a,b),B=q(a+1,b),C=q(a,b+1),D=q(a+1,b+1);
  [[A,B,C],[B,C,D]].forEach(t=>{const cx=(t[0][0]+t[1][0]+t[2][0])/3,cy=(t[0][1]+t[1][1]+t[2][1])/3;add(P(t),cx,cy,w/2,rs/2);addC(cx,cy)});[A,B,C,D].forEach(v=>addV(v[0],v[1]))}}
 else for(let j=-2;j<=m+1;j++)for(let i=-2;i<=n+1;i++){
  if(sh=='hex'){const R=rs/1.5,cx=i*w+w/2+odd(j)*w/2,cy=R+j*rs,v=[[cx,cy-R],[cx+w/2,cy-R/2],[cx+w/2,cy+R/2],[cx,cy+R],[cx-w/2,cy+R/2],[cx-w/2,cy-R/2]];add(P(v),cx,cy,w/2,R);addC(cx,cy);v.forEach(q=>addV(q[0],q[1]))}
  else if(sh=='diamond'){const cx=(i+.5)*w+odd(j)*w/2,cy=(j+1)*rs,v=[[cx,cy-rs],[cx+w/2,cy],[cx,cy+rs],[cx-w/2,cy]];add(P(v),cx,cy,w/2,rs);addC(cx,cy);v.forEach(q=>addV(q[0],q[1]))}
  else if(sh=='ngon'){const cx=(i+.5)*w,cy=(j+.5)*rs,ox=w/(1+Math.SQRT2),oy=rs/(1+Math.SQRT2),v=[[cx-ox/2,cy-rs/2],[cx+ox/2,cy-rs/2],[cx+w/2,cy-oy/2],[cx+w/2,cy+oy/2],[cx+ox/2,cy+rs/2],[cx-ox/2,cy+rs/2],[cx-w/2,cy+oy/2],[cx-w/2,cy-oy/2]];
   add(P(v),cx,cy,w/2,rs/2);addC(cx,cy);v.forEach(q=>addV(q[0],q[1]));
   const qx=i*w,qy=j*rs,hx=(w-ox)/2,hy=(rs-oy)/2;add(P([[qx,qy-hy],[qx+hx,qy],[qx,qy+hy],[qx-hx,qy]]),qx,qy,hx,hy);addC(qx,qy)}
  else{const x=i*w,y=j*rs,cx=x+w/2,cy=y+rs/2;let d;
   if(sh=='rrect'){const r=Math.min(w,rs)*.24;d=`M${f(x+r)} ${f(y)}H${f(x+w-r)}a${f(r)} ${f(r)} 0 0 1 ${f(r)} ${f(r)}V${f(y+rs-r)}a${f(r)} ${f(r)} 0 0 1 ${f(-r)} ${f(r)}H${f(x+r)}a${f(r)} ${f(r)} 0 0 1 ${f(-r)} ${f(-r)}V${f(y+r)}a${f(r)} ${f(r)} 0 0 1 ${f(r)} ${f(-r)}Z`}
   else if(sh=='circle'){const r=Math.min(w,rs)/2;d=ell(cx,cy,r,r)}
   else if(sh=='oval')d=ell(cx,cy,w/2,rs/2);
   else if(sh=='arch')d=`M${f(x)} ${f(y+rs)}V${f(y+w/2)}A${f(w/2)} ${f(w/2)} 0 0 1 ${f(x+w)} ${f(y+w/2)}V${f(y+rs)}Z`;
   else d=P([[x,y],[x+w,y],[x+w,y+rs],[x,y+rs]]);
   add(d,cx,cy,w/2,rs/2);addC(cx,cy);addV(x,y);addV(x+w,y);addV(x,y+rs);addV(x+w,y+rs)}}
 const r={w,rs,m,items,cents,verts};GMC.set(key,r);if(GMC.size>12)GMC.delete(GMC.keys().next().value);return r}
function gNear(list,x,y,W,H,wrap){let b=null,bd=1e18;for(const q of list){let dx=Math.abs(q[0]-x),dy=Math.abs(q[1]-y);if(wrap){dx=Math.min(dx,W-dx);dy=Math.min(dy,H-dy)}const d=dx*dx+dy*dy;if(d<bd){bd=d;b=q}}return b}
