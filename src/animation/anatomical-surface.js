// Shared, deterministic surface source for the playable fighter and Nexus Authoring.
// One welded skin replaces the old overlapping/open lofts. Units are metres; forward is -Z.
const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
const smooth=(a,b,x)=>{const t=clamp((x-a)/(b-a));return t*t*(3-2*t);};
const mix=(a,b,t)=>a+(b-a)*t;
const smin=(a,b,k)=>{const h=Math.max(k-Math.abs(a-b),0)/k;return Math.min(a,b)-h*h*k*.25;};
export const ANATOMY=Object.freeze({
 version:3,headHeight:.30,height:2.17,pelvisY:1.08,hipY:1.04,kneeY:.56,
 ankleY:.10,upperLeg:.48,lowerLeg:.46,shoulderY:1.68,elbowY:1.31,
 wristY:1.015,headY:1.99,spacing:.0195,
});

export function anatomicalRig(){
 const bones=[];
 const add=(name,parent,position,length)=>bones.push({name,parent,position,length});
 add('root',null,[0,0,0],.1);
 add('pelvis','root',[0,1.08,0],.22);
 add('spine','pelvis',[0,.22,0],.29);
 add('chest','spine',[0,.29,0],.22);
 add('neck','chest',[0,.22,0],.18);
 add('head','neck',[0,.18,0],.16);
 for(const side of ['l','r']){
  const s=side==='l'?1:-1;
  add(side+'_thigh','pelvis',[s*.145,-.04,0],.48);
  add(side+'_shin',side+'_thigh',[0,-.48,0],.46);
  add(side+'_foot',side+'_shin',[0,-.46,0],.17);
  add(side+'_toe',side+'_foot',[0,-.045,-.14],.09);
  add(side+'_upper_arm','chest',[s*.32,.09,0],.37);
  add(side+'_forearm',side+'_upper_arm',[s*.055,-.37,0],.295);
  add(side+'_wrist',side+'_forearm',[s*.035,-.295,-.008],.035);
  add(side+'_hand',side+'_wrist',[s*.012,-.035,0],.18);
 }
 return bones;
}

// Ellipsoid distance approximation, used only for source-surface construction.
function ell(x,y,z,cx,cy,cz,rx,ry,rz){
 x-=cx;y-=cy;z-=cz;
 const k0=Math.hypot(x/rx,y/ry,z/rz),k1=Math.hypot(x/(rx*rx),y/(ry*ry),z/(rz*rz));
 return k1<1e-12?-Math.min(rx,ry,rz):k0*(k0-1)/k1;
}
function capsule(x,y,z,a,b,ra,rb=ra){
 const dx=b[0]-a[0],dy=b[1]-a[1],dz=b[2]-a[2];
 const t=clamp(((x-a[0])*dx+(y-a[1])*dy+(z-a[2])*dz)/(dx*dx+dy*dy+dz*dz));
 return Math.hypot(x-a[0]-dx*t,y-a[1]-dy*t,z-a[2]-dz*t)-mix(ra,rb,t);
}
// Torso is a sequence of overlapping skeletal masses, not floating pectoral spheres.
// Z is depth: negative Z faces the camera in the game's neutral forward convention.
function torso(x,y,z){
 if(y<.79||y>1.99)return .2+Math.abs(y-1.4);
 let d=ell(x,y,z,0,1.073,.018,.226,.185,.143); // bony pelvic bowl
 d=smin(d,ell(x,y,z,0,1.283,-.003,.205,.237,.134),.065); // soft abdomen
 d=smin(d,ell(x,y,z,0,1.515,.019,.253,.235,.146),.066); // tapered thoracic barrel
 d=smin(d,ell(x,y,z,0,1.657,.007,.278,.108,.116),.057); // upper thorax
 d=smin(d,capsule(x,y,z,[0,1.698,.008],[0,1.89,.007],.074,.061),.056);
 for(const s of [-1,1]){
  // Pectoral plane follows the thorax volume; no independent breast masses.
  // Clavicles travel from sternum toward the acromion rather than forming balls.
  d=smin(d,capsule(x,y,z,[s*.068,1.726,-.044],[s*.259,1.662,-.015],.021,.036),.026);
  // Raised scapular plane and tapered latissimus contour on the back.
  d=smin(d,ell(x,y,z,s*.136,1.556,.115,.112,.143,.038),.033);
  d=smin(d,ell(x,y,z,s*.174,1.407,.095,.080,.151,.051),.034);
  // External obliques, iliac crest, and gluteal mass form one continuous hip.
  d=smin(d,ell(x,y,z,s*.139,1.179,.036,.091,.151,.088),.057);
  d=smin(d,ell(x,y,z,s*.151,1.044,.066,.122,.146,.099),.051);
  d=smin(d,ell(x,y,z,s*.132,.973,.095,.098,.098,.077),.045);
 }
 // Small continuous forward chest plane, never isolated pectoral balloons.
 const px=Math.abs(x);
 const chest=Math.exp(-(((px-.133)/.118)**4)-(((y-1.55)/.12)**4));
 d-=chest*(1-smooth(-.095,-.035,z))*.008;
 return d;
}
// A cranium and jaw share one continuous facial skin; smaller cheek planes,
// less prominent nasal cartilage and shallower sockets preserve readable eyes.
function head(x,y,z){
 if(y<1.79)return .2+1.79-y;
 let d=ell(x,y,z,0,2.012,.008,.116,.148,.120);
 d=smin(d,ell(x,y,z,0,1.925,-.015,.081,.063,.088),.028);
 d=smin(d,ell(x,y,z,0,1.884,-.032,.054,.026,.052),.020);
 d=smin(d,ell(x,y,z,0,1.985,-.103,.021,.044,.029),.012);
 d=smin(d,ell(x,y,z,0,1.951,-.125,.021,.016,.017),.011);
 for(const side of [-1,1]){
  d=smin(d,ell(x,y,z,side*.111,1.986,.009,.020,.036,.020),.010);
  // Malar regions blend into the head rather than an independent wedge.
  d=smin(d,ell(x,y,z,side*.060,1.968,-.070,.039,.029,.022),.013);
  // Small curved eye seats preserve the runtime eye mesh and the orbital rim.
  const orbit=ell(x,y,z,side*.045,2.017,-.107,.029,.016,.020);
  d=-smin(-d,orbit,.010);
 }
 return d;
}
function arm(x,y,z,s){
 if(y<.74||y>1.84)return .2+Math.abs(y-1.3);
 x*=s;
 // The sloping deltoid follows a downward humeral axis, not a round cap.
 let d=capsule(x,y,z,[.315,1.661,0],[.375,1.31,0],.057,.050);
 d=smin(d,ell(x,y,z,.329,1.626,.003,.068,.092,.063),.025);
 d=smin(d,ell(x,y,z,.355,1.474,-.013,.056,.123,.050),.016); // anterior biceps
 d=smin(d,ell(x,y,z,.363,1.470,.030,.051,.114,.047),.015); // posterior triceps
 d=smin(d,capsule(x,y,z,[.375,1.31,0],[.410,1.015,-.008],.054,.035),.021);
 d=smin(d,ell(x,y,z,.383,1.205,.019,.045,.108,.052),.013); // flexors
 d=smin(d,ell(x,y,z,.408,1.156,-.011,.038,.092,.040),.012); // extensors
 // The radius taper carries the elbow; no separate knuckle-like cuff.
 // Palm connects directly to wrist; thumb starts medially and rotates forward.
 d=smin(d,ell(x,y,z,.423,.947,-.009,.050,.077,.025),.018);
 d=smin(d,ell(x,y,z,.408,.989,-.011,.033,.038,.031),.017);
 // Four fingers with graded roots, lengths and narrow tips.  No new bones.
 const lengths=[.078,.106,.100,.082];
 for(let i=0;i<4;i++){
  const fx=.390+i*.023;
  d=smin(d,capsule(x,y,z,[fx,.899,-.013],[fx+(i-1.5)*.003,.899-lengths[i],-.019],.0115,.0078),.006);
 }
 // Thumb-index web and flexed thumb, still one continuous skin.
 d=smin(d,ell(x,y,z,.388,.934,-.013,.021,.027,.017),.010);
 d=smin(d,capsule(x,y,z,[.390,.960,-.012],[.362,.914,-.028],.014,.010),.012);
 return d;
}
function leg(x,y,z,s){
 if(y>1.24)return .2+y-1.24;
 x*=s;
 let d=capsule(x,y,z,[.145,1.03,0],[.145,.56,0],.107,.063);
 d=smin(d,ell(x,y,z,.155,.837,-.025,.115,.194,.103),.031); // quadriceps
 d=smin(d,ell(x,y,z,.153,.865,.067,.101,.163,.076),.031); // hamstrings
 d=smin(d,ell(x,y,z,.154,.704,.016,.081,.130,.072),.026); // inner adductor
 d=smin(d,ell(x,y,z,.145,.573,-.031,.060,.052,.053),.015); // patella
 d=smin(d,capsule(x,y,z,[.145,.56,0],[.145,.10,0],.058,.036),.019);
 d=smin(d,ell(x,y,z,.151,.396,.044,.072,.133,.070),.021); // back calf
 d=smin(d,ell(x,y,z,.150,.289,.010,.054,.110,.046),.019); // straight shin
 d=smin(d,capsule(x,y,z,[.145,.241,.052],[.145,.102,.044],.032,.025),.012); // Achilles
 d=smin(d,ell(x,y,z,.145,.072,-.072,.060,.057,.130),.023); // heel to instep
 d=smin(d,ell(x,y,z,.145,.089,.035,.046,.069,.052),.016); // heel
 d=smin(d,ell(x,y,z,.145,.110,-.079,.048,.040,.086),.016); // metatarsal roof
 for(let i=0;i<5;i++){
  const tx=.101+i*.020,r=.019-i*.0015;
  d=smin(d,ell(x,y,z,tx,.034,-.202+i*.007,r,.027,.039-i*.002),.007);
 }
 return d;
}
export function anatomicalField(x,y,z){
 let d=torso(x,y,z);
 d=smin(d,head(x,y,z),.030);
 d=smin(d,arm(x,y,z,1),.045);d=smin(d,arm(x,y,z,-1),.045);
 d=smin(d,leg(x,y,z,1),.045);d=smin(d,leg(x,y,z,-1),.045);
 return d;
}
const srgb=c=>c<=.04045?c/12.92:((c+.055)/1.055)**2.4;
function surfaceColor(x,y,z){
 let c=[.72,.50,.38];
 const lower=.917+.255*Math.abs(x);
 const shorts=smooth(lower-.016,lower+.014,y)*(1-smooth(1.096,1.112,y))*(1-smooth(.29,.31,Math.abs(x)));
 const fabric=y>1.079?[.20,.22,.235]:[.135,.155,.175];
 c=c.map((v,i)=>mix(v,fabric[i],shorts));
 // A smooth scalp-following hairline, not a detached hair cap.
 const line=z<0?2.096+.008*Math.cos(x*16):2.041;
 const hair=smooth(line-.010,line+.009,y);
 c=c.map((v,i)=>mix(v,[.18,.125,.088][i],hair));
 const browY=2.045+.006*Math.cos(x*26);
 const brow=(1-smooth(.003,.010,Math.abs(y-browY)))*smooth(.018,.026,Math.abs(x))*(1-smooth(.068,.077,Math.abs(x)))*(1-smooth(-.096,-.089,z));
 c=c.map((v,i)=>mix(v,[.23,.15,.105][i],brow));
 const lip=(1-smooth(.004,.008,Math.abs(y-1.912)))*(1-smooth(.025,.036,Math.abs(x)))*(1-smooth(-.095,-.087,z));
 c=c.map((v,i)=>mix(v,[.49,.275,.225][i],lip));
 return c.map(srgb);
}
function profileWeights(y,knots){
 if(y<=knots[0][0])return [[knots[0][1],1]];
 for(let i=1;i<knots.length;i++)if(y<=knots[i][0]){
  const t=smooth(knots[i-1][0],knots[i][0],y);
  return [[knots[i-1][1],1-t],[knots[i][1],t]];
 }
 return [[knots.at(-1)[1],1]];
}
export function anatomicalWeights(x,y,z){
 const regions=[
  [torso(x,y,z),profileWeights(y,[[1.14,'pelvis'],[1.32,'spine'],[1.56,'chest'],[1.80,'neck'],[1.94,'head']])],
  [head(x,y,z),[['head',1]]],
 ];
 for(const [side,s] of [['l',1],['r',-1]]){
  regions.push([arm(x,y,z,s),profileWeights(y,[[.963,side+'_hand'],[1.014,side+'_wrist'],[1.09,side+'_forearm'],[1.25,side+'_forearm'],[1.37,side+'_upper_arm'],[1.69,side+'_upper_arm']])]);
  let legWeights=profileWeights(y,[[.14,side+'_foot'],[.21,side+'_shin'],[.51,side+'_shin'],[.62,side+'_thigh'],[1.04,side+'_thigh']]);
  if(y<.14){const t=smooth(.115,.205,-z);legWeights=[[side+'_foot',1-t],[side+'_toe',t]];}
  regions.push([leg(x,y,z,s),legWeights]);
 }
 const nearest=Math.min(...regions.map(r=>r[0])),sum=new Map();
 for(const [d,weights] of regions){
  const influence=Math.exp(-Math.max(0,d-nearest)/.025);
  if(influence<.008)continue;
  for(const [name,w] of weights)sum.set(name,(sum.get(name)||0)+w*influence);
 }
 const best=[...sum].filter(([,v])=>v>1e-8).sort((a,b)=>b[1]-a[1]).slice(0,4);
 const total=best.reduce((v,w)=>v+w[1],0);
 return best.map(([name,w])=>[name,w/total]);
}

let cached=null;
export function createAnatomicalSurface({spacing=ANATOMY.spacing}={}){
 if(!Number.isFinite(spacing)||spacing<.014||spacing>.04)throw new RangeError('Anatomy spacing must be 0.014–0.04.');
 if(cached&&spacing===ANATOMY.spacing)return cached;
 const min=[-.59,-.045,-.31],max=[.59,2.23,.25];
 const n=min.map((v,i)=>Math.ceil((max[i]-v)/spacing)),step=n.map((v,i)=>(max[i]-min[i])/v);
 const [nx,ny,nz]=n,[sx,sy]=[nx+1,(nx+1)*(ny+1)],count=sy*(nz+1);
 const field=new Float32Array(count);
 const xyz=id=>{const k=Math.floor(id/sy),r=id-k*sy,j=Math.floor(r/sx),i=r-j*sx;
  return [min[0]+i*step[0],min[1]+j*step[1],min[2]+k*step[2]];};
 for(let k=0;k<=nz;k++)for(let j=0;j<=ny;j++)for(let i=0;i<=nx;i++)
  field[i+j*sx+k*sy]=anatomicalField(min[0]+i*step[0],min[1]+j*step[1],min[2]+k*step[2]);
 const positions=[],normals=[],colors=[],indices=[],skinIndices=[],skinWeights=[],edgeCache=new Map();
 const bones=anatomicalRig(),boneIds=new Map(bones.map((b,i)=>[b.name,i]));
 function vertex(a,b){
  if(a>b)[a,b]=[b,a];const key=a*count+b;
  if(edgeCache.has(key))return edgeCache.get(key);
  const u=xyz(a),v=xyz(b),t=field[a]/(field[a]-field[b]);
  const p=u.map((c,i)=>mix(c,v[i],t)),id=positions.length/3,h=.001;
  positions.push(...p);
  const [x,y,z]=p,g=[anatomicalField(x+h,y,z)-anatomicalField(x-h,y,z),
   anatomicalField(x,y+h,z)-anatomicalField(x,y-h,z),anatomicalField(x,y,z+h)-anatomicalField(x,y,z-h)];
  const length=Math.hypot(...g)||1;normals.push(...g.map(v=>v/length));
  colors.push(...surfaceColor(...p));
  const weights=anatomicalWeights(...p);
  for(let i=0;i<4;i++){skinIndices.push(weights[i]?boneIds.get(weights[i][0]):0);skinWeights.push(weights[i]?.[1]||0);}
  edgeCache.set(key,id);return id;
 }
 let interior=[0,0,0];
 function triangle(a,b,c){
  if(a===b||b===c||c===a)return;
  const ia=a*3,ib=b*3,ic=c*3;
  const u=[0,1,2].map(i=>positions[ib+i]-positions[ia+i]),v=[0,1,2].map(i=>positions[ic+i]-positions[ia+i]);
  const cross=[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]];
  const orientation=cross.reduce((s,t,i)=>s+t*((positions[ia+i]+positions[ib+i]+positions[ic+i])/3-interior[i]),0);
  if(orientation<0)[b,c]=[c,b];indices.push(a,b,c);
 }
 const tets=[[0,5,1,6],[0,1,2,6],[0,2,3,6],[0,3,7,6],[0,7,4,6],[0,4,5,6]];
 for(let k=0;k<nz;k++)for(let j=0;j<ny;j++)for(let i=0;i<nx;i++){
  const a=i+j*sx+k*sy,ids=[a,a+1,a+1+sx,a+sx,a+sy,a+1+sy,a+1+sx+sy,a+sx+sy];
  let inside=0;for(const id of ids)inside+=field[id]<0?1:0;
  if(inside===0||inside===8)continue;
  for(const tet of tets){
   const yes=[],no=[];for(const t of tet)(field[ids[t]]<0?yes:no).push(ids[t]);
   if(!yes.length||!no.length)continue;
   interior=[0,0,0];for(const id of yes){const p=xyz(id);for(let d=0;d<3;d++)interior[d]+=p[d]/yes.length;}
   if(yes.length===1)triangle(...no.map(b=>vertex(yes[0],b)));
   else if(yes.length===3)triangle(...yes.map(a=>vertex(a,no[0])));
   else if(yes.length===2){const [a,b]=yes,[c,d]=no,ac=vertex(a,c),ad=vertex(a,d),bc=vertex(b,c),bd=vertex(b,d);
    triangle(ac,ad,bc);triangle(ad,bd,bc);}
  }
 }
 const result={positions,normals,colors,indices,skinIndices,skinWeights,bones,spacing};
 if(spacing===ANATOMY.spacing)cached=result;
 return result;
}

// The same welded surface is consumable by n:authoring:mesh (not a renderer-only duplicate).
export function toAuthoringMesh(surface=createAnatomicalSurface()){
 const vertices=Array.from({length:surface.positions.length/3},(_,i)=>({id:'v'+i,position:surface.positions.slice(i*3,i*3+3)}));
 const faces=Array.from({length:surface.indices.length/3},(_,i)=>({id:'f'+i,vertices:surface.indices.slice(i*3,i*3+3).map(v=>'v'+v)}));
 const values=Object.fromEntries(vertices.map((v,i)=>[v.id,[...surface.colors.slice(i*3,i*3+3),1]]));
 return {vertices,faces,attributes:[{id:'color',domain:'vertex',arity:4,values}]};
}
