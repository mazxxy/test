// lapis.js: o motor de desenho a lapis da Obliq (metodo do fable, motivos da casa).
// Usado por jardim-obliq.html (o vocabulario) e cheiro.html (a dose).

// ---------- semente, geometria ----------
const FAST = /[?&]fast/.test(location.search) || matchMedia('(prefers-reduced-motion: reduce)').matches
const TAU=Math.PI*2
function mulberry(a){ return function(){ a|=0; a=a+0x6D2B79F5|0; let t=Math.imul(a^a>>>15,1|a); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296 } }
const SEED=2946; const stream=s=>mulberry(s)
const rd=(r,a,b)=>a+r()*(b-a), ch=(r,p)=>r()<p, pk=(r,arr)=>arr[Math.floor(r()*arr.length)]
function resample(pts, step=2.4){ const out=[pts[0]]; for(let i=1;i<pts.length;i++){ const [x0,y0]=pts[i-1],[x1,y1]=pts[i]; const L=Math.hypot(x1-x0,y1-y0); const n=Math.max(1,Math.round(L/step)); for(let k=1;k<=n;k++) out.push([x0+(x1-x0)*k/n, y0+(y1-y0)*k/n]) } return out }
function chaikin(pts, closed=false, times=1){ let p=pts; for(let t=0;t<times;t++){ const o=closed?[]:[p[0]]; const n=closed?p.length:p.length-1; for(let i=0;i<n;i++){ const a=p[i], b=p[(i+1)%p.length]; o.push([a[0]*0.75+b[0]*0.25,a[1]*0.75+b[1]*0.25],[a[0]*0.25+b[0]*0.75,a[1]*0.25+b[1]*0.75]) } if(!closed) o.push(p[p.length-1]); p=o } return p }
function blob(r,cx,cy,rx,ry){ const rot=rd(r,0,TAU),ph=rd(r,0,7),n=14,pts=[]; for(let i=0;i<n;i++){ const t=i/n*TAU; const m=1+0.16*Math.sin(t*2+ph)+0.09*Math.sin(t*5+ph*2.1); const x=Math.cos(t)*rx*m,y=Math.sin(t)*ry*m; pts.push([cx+x*Math.cos(rot)-y*Math.sin(rot), cy+x*Math.sin(rot)+y*Math.cos(rot)]) } return chaikin(pts,true,1) }
function circ(cx,cy,r,n=40,frac=1,a0=-1.2){ const p=[]; for(let i=0;i<=n;i++){ const a=a0+frac*TAU*i/n; p.push([cx+r*Math.cos(a), cy+r*Math.sin(a)]) } return p }
function rect(x,y,w,h){ return [[x,y],[x+w,y],[x+w,y+h],[x,y+h],[x,y]] }

// ---------- a caneta ----------
const TINTA='#1B1814', TINTA2='#5A564D', AZUL='#2946D8', AZUL_SOFT='#93A8FF', PAPEL='#FAF7F0', NOITE='#0B0D13', NOITE_TXT='#F4F1E8', NOITE_DIM='#A9ACB8'
function wob(ctx, pts, o={}){
  const r=o.rng||Math.random; const w=o.w||1.6; const amp=o.amp ?? (w*0.38+0.55)
  const f1=1.6+r()*1.6, f2=5+r()*4, f3=17, p1=r()*6.28, p2=r()*6.28, p3=r()*6.28
  const rs=resample(pts, 2.4); const n=rs.length; if(n<2) return; const out=[]
  for(let i=0;i<n;i++){ const a=rs[Math.max(0,i-1)], b=rs[Math.min(n-1,i+1)]; const L=Math.hypot(b[0]-a[0],b[1]-a[1])||1; const nx=-(b[1]-a[1])/L, ny=(b[0]-a[0])/L
    const s=i/n*6.28; const d=amp*(Math.sin(s*f1+p1)*0.55+Math.sin(s*f2+p2)*0.3+Math.sin(s*f3+p3)*0.15)+(r()-0.5)*0.6
    out.push([rs[i][0]+nx*d, rs[i][1]+ny*d]) }
  const passes=o.passes||1; const col=o.color||TINTA
  for(let p=0;p<passes;p++){
    ctx.strokeStyle=col; ctx.lineCap='round'; ctx.lineJoin='round'
    const alpha=(o.alpha??1)*(p?0.35:1); const gap=o.gap||0
    for(let i=1;i<out.length;i++){
      if(gap && r()<gap) continue
      const t=i/out.length; let ww=w
      if(o.taper==='out') ww=w*(0.3+0.7*(1-t)); if(o.taper==='in') ww=w*(0.3+0.7*t); if(o.taper==='both') ww=w*(0.3+0.7*Math.sin(t*3.1416))
      ctx.lineWidth=ww*(p?1.5:1); ctx.globalAlpha=alpha*(0.8+r()*0.2)
      const dx=p?(r()-0.5)*1.5:0, dy=p?(r()-0.5)*1.5:0
      ctx.beginPath(); ctx.moveTo(out[i-1][0]+dx,out[i-1][1]+dy); ctx.lineTo(out[i][0]+dx,out[i][1]+dy); ctx.stroke()
      if(!o.noDust && ww>=1.9 && r()<0.25){ ctx.globalAlpha=0.14+r()*0.16; ctx.fillStyle=col; const g=0.6+r()*0.6; ctx.fillRect(out[i][0]+(r()-0.5)*6, out[i][1]+(r()-0.5)*6, g, g) }
    }
  }
  ctx.globalAlpha=1
}
function dot(ctx,x,y,rad,a,col){ ctx.globalAlpha=a; ctx.fillStyle=col||TINTA; ctx.beginPath(); ctx.arc(x,y,rad,0,TAU); ctx.fill(); ctx.globalAlpha=1 }
function fillPoly(ctx,poly,col,a){ ctx.globalAlpha=a; ctx.fillStyle=col; ctx.beginPath(); poly.forEach((p,i)=>i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1])); ctx.closePath(); ctx.fill(); ctx.globalAlpha=1 }
function scrib(ctx, poly, o={}){ const r=o.rng||Math.random; ctx.save(); ctx.beginPath(); poly.forEach((p,i)=>i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1])); ctx.closePath(); ctx.clip()
  const xs=poly.map(p=>p[0]), ys=poly.map(p=>p[1]); const x0=Math.min(...xs)-10,x1=Math.max(...xs)+10,y0=Math.min(...ys),y1=Math.max(...ys)
  for(let y=y0;y<y1;y+=o.step||6){ const pts=[]; const incl=(r()-0.5)*0.4; for(let x=x0;x<=x1;x+=6) pts.push([x, y+Math.sin(x*0.5)*1.5+(x-x0)*incl*0.1]); wob(ctx,pts,{w:o.w||1.2,color:o.color||TINTA2,rng:r,alpha:(o.alpha??0.5)*(0.6+r()*0.45),amp:0.8,noDust:true}) }
  ctx.restore() }
function hatch(ctx, poly, o={}){ const r=o.rng||Math.random; ctx.save(); ctx.beginPath(); poly.forEach((p,i)=>i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1])); ctx.closePath(); ctx.clip()
  const xs=poly.map(p=>p[0]), ys=poly.map(p=>p[1]); const x0=Math.min(...xs)-40,x1=Math.max(...xs)+40,y0=Math.min(...ys)-40,y1=Math.max(...ys)+40
  const ang=o.ang??-0.6, step=o.step||9; const c=Math.cos(ang), s=Math.sin(ang); const D=Math.hypot(x1-x0,y1-y0)
  for(let d=-D;d<D;d+=step){ const cx=(x0+x1)/2+(-s)*d, cy=(y0+y1)/2+c*d; wob(ctx,[[cx-c*D,cy-s*D],[cx+c*D,cy+s*D]],{w:o.w||1,color:o.color||TINTA2,rng:r,amp:0.9,alpha:(o.alpha??0.5)*(0.6+r()*0.45),noDust:true}) }
  ctx.restore() }

// alfabeto traçado
const A = {
 a:[[[0.5,0.55],[0.45,0.45],[0.2,0.45],[0.05,0.6],[0.05,0.9],[0.2,1],[0.45,0.9],[0.5,0.7]],[[0.5,0.45],[0.5,1]]], b:[[[0.05,0],[0.05,1]],[[0.05,0.55],[0.3,0.42],[0.55,0.55],[0.55,0.9],[0.3,1],[0.05,0.9]]],
 c:[[[0.55,0.5],[0.35,0.42],[0.08,0.55],[0.05,0.85],[0.3,1],[0.55,0.92]]], d:[[[0.55,0],[0.55,1]],[[0.55,0.55],[0.3,0.42],[0.05,0.55],[0.05,0.9],[0.3,1],[0.55,0.9]]],
 e:[[[0.05,0.72],[0.55,0.7],[0.5,0.48],[0.25,0.42],[0.05,0.6],[0.08,0.9],[0.32,1],[0.55,0.92]]], f:[[[0.5,0.05],[0.3,0],[0.22,0.2],[0.22,1]],[[0.05,0.45],[0.45,0.45]]],
 g:[[[0.55,0.55],[0.3,0.42],[0.05,0.55],[0.05,0.85],[0.3,0.95],[0.55,0.85]],[[0.55,0.45],[0.55,1.15],[0.35,1.3],[0.1,1.22]]], h:[[[0.05,0],[0.05,1]],[[0.05,0.55],[0.3,0.42],[0.55,0.55],[0.55,1]]],
 i:[[[0.3,0.45],[0.3,1]],[[0.3,0.2],[0.31,0.24]]], j:[[[0.4,0.45],[0.4,1.15],[0.25,1.3],[0.05,1.2]],[[0.4,0.2],[0.41,0.24]]], k:[[[0.05,0],[0.05,1]],[[0.5,0.45],[0.08,0.75]],[[0.22,0.66],[0.55,1]]],
 l:[[[0.3,0],[0.3,0.95],[0.45,1]]], m:[[[0.05,1],[0.05,0.45]],[[0.05,0.55],[0.2,0.42],[0.32,0.55],[0.32,1]],[[0.32,0.55],[0.47,0.42],[0.6,0.55],[0.6,1]]],
 n:[[[0.05,1],[0.05,0.45]],[[0.05,0.55],[0.3,0.42],[0.55,0.55],[0.55,1]]], o:[[[0.3,0.42],[0.06,0.6],[0.06,0.85],[0.3,1],[0.55,0.85],[0.55,0.6],[0.3,0.42]]],
 p:[[[0.05,0.45],[0.05,1.3]],[[0.05,0.55],[0.3,0.42],[0.55,0.55],[0.55,0.9],[0.3,1],[0.05,0.9]]], q:[[[0.55,0.45],[0.55,1.3]],[[0.55,0.55],[0.3,0.42],[0.05,0.55],[0.05,0.9],[0.3,1],[0.55,0.9]]],
 r:[[[0.08,1],[0.08,0.45]],[[0.08,0.6],[0.3,0.42],[0.55,0.5]]], s:[[[0.55,0.5],[0.3,0.42],[0.08,0.55],[0.3,0.7],[0.52,0.85],[0.3,1],[0.05,0.92]]],
 t:[[[0.28,0.1],[0.28,0.9],[0.45,1]],[[0.08,0.45],[0.5,0.45]]], u:[[[0.05,0.45],[0.05,0.9],[0.28,1],[0.52,0.88],[0.55,0.45]],[[0.55,0.45],[0.55,1]]],
 v:[[[0.05,0.45],[0.3,1],[0.55,0.45]]], w:[[[0.02,0.45],[0.18,1],[0.32,0.6],[0.46,1],[0.6,0.45]]], x:[[[0.05,0.45],[0.55,1]],[[0.55,0.45],[0.05,1]]],
 y:[[[0.05,0.45],[0.3,1]],[[0.55,0.45],[0.28,1.05],[0.12,1.3]]], z:[[[0.05,0.45],[0.55,0.45],[0.05,1],[0.55,1]]],
 '.':[[[0.25,0.95],[0.27,0.98]]], ',':[[[0.3,0.95],[0.2,1.15]]], '-':[[[0.1,0.7],[0.5,0.7]]], "'":[[[0.3,0.1],[0.28,0.3]]], '(':[[[0.4,0],[0.2,0.5],[0.4,1]]], ')':[[[0.2,0],[0.4,0.5],[0.2,1]]],
 '0':[[[0.3,0],[0.08,0.2],[0.08,0.8],[0.3,1],[0.52,0.8],[0.52,0.2],[0.3,0]]], '1':[[[0.15,0.2],[0.35,0],[0.35,1]]], '2':[[[0.08,0.2],[0.3,0],[0.52,0.2],[0.08,1],[0.55,1]]], '3':[[[0.08,0.1],[0.3,0],[0.5,0.2],[0.28,0.48],[0.52,0.75],[0.3,1],[0.06,0.9]]],
 '5':[[[0.5,0],[0.12,0],[0.08,0.45],[0.32,0.4],[0.52,0.65],[0.3,1],[0.06,0.9]]], '6':[[[0.5,0.05],[0.2,0.35],[0.08,0.75],[0.3,1],[0.52,0.78],[0.3,0.55],[0.08,0.72]]], '7':[[[0.05,0],[0.55,0],[0.22,1]]], '9':[[[0.5,0.4],[0.28,0.5],[0.08,0.3],[0.28,0],[0.5,0.2],[0.48,0.75],[0.3,1]]],
 // Glifo que falta SOME CALADO, e a frase perde uma letra sem ninguém ver:
 // "8 produtos" virou "produtos" e "o jardim:" virou "o jardim". Antes de
 // escrever texto novo, rodar a varredura de glifos (brand/_glifos.cjs).
 '4':[[[0.42,0],[0.05,0.72],[0.56,0.72]],[[0.42,0],[0.42,1]]],
 '8':[[[0.3,0],[0.1,0.16],[0.3,0.45],[0.5,0.16],[0.3,0]],[[0.3,0.45],[0.06,0.7],[0.3,1],[0.54,0.7],[0.3,0.45]]],
 ':':[[[0.28,0.5],[0.3,0.53]],[[0.28,0.95],[0.3,0.98]]],
 '+':[[[0.1,0.7],[0.5,0.7]],[[0.3,0.5],[0.3,0.9]]],
 '$':[[[0.5,0.15],[0.3,0.05],[0.1,0.25],[0.5,0.7],[0.3,0.95],[0.08,0.85]],[[0.3,-0.05],[0.3,1.05]]]
}
window.__A = A
function largGlifo(g){ let m=0; for(const t of g) for(const q of t) if(q[0]>m) m=q[0]; return m }
// A escrita à mão. O que a fazia parecer mal feita (medido em _teste-letra.png):
//   1. traço grosso demais (0,115 do corpo) e sem suavizar, então cada letra
//      era um polígono de marcador, não uma letra;
//   2. avanço FIXO: o "i" ocupava a mesma largura do "m", e a palavra saía com
//      buraco no meio.
// Agora: dois passes de Chaikin em cada traço, traço 0,082, avanço próprio de
// cada glifo e 6 graus de inclinação, que é o que a mão faz sozinha.
function atext(ctx, txt, x, y, sz, o={}){ const r=o.rng||Math.random; let cx=x
  const t=txt.normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase()
  const incl=o.incl??0.105
  for(let i=0;i<t.length;i++){ const chr=t[i]
    if(chr===' '){ cx+=sz*0.38; continue }
    const g=A[chr]; if(!g){ cx+=sz*0.5; continue }
    const base=y+Math.sin(i*0.8)*sz*0.045
    for(const traco of g){
      let pts=traco.map(q=>[cx+(q[0]-(q[1]-0.5)*incl)*sz+(r()-0.5)*sz*0.02, base+(q[1]-1)*sz+(r()-0.5)*sz*0.02])
      pts=chaikin(chaikin(pts,false,1),false,1)
      wob(ctx,pts,{w:Math.max(0.8,sz*0.082), color:o.color||TINTA, rng:r, amp:0.22, alpha:o.alpha??1, noDust:true}) }
    cx+=sz*(largGlifo(g)+0.19) }
  return cx-x }
function seta(ctx, pts, o={}){ const sm=chaikin(pts); wob(ctx, sm, {...o, taper:'out'}); const [bx,by]=sm[sm.length-1], [ax,ay]=sm[sm.length-3]||sm[0]; const a=Math.atan2(by-ay,bx-ax); const L=o.cabeca||9
  wob(ctx,[[bx-L*Math.cos(a-0.5),by-L*Math.sin(a-0.5)],[bx,by],[bx-L*Math.cos(a+0.5),by-L*Math.sin(a+0.5)]],{...o,taper:'none',amp:0.4}) }

// ---------- o que cresce ----------
function folha(ctx,r,x,y,ang,col=TINTA,a=1){ const L=rd(r,9,16); const tip=[x+Math.cos(ang)*L,y+Math.sin(ang)*L]; const b=blob(r,(x+tip[0])/2,(y+tip[1])/2,L*0.52,L*0.26); fillPoly(ctx,b,col,0.22*a); wob(ctx,[[x,y],tip],{w:1,color:col,rng:r,amp:0.3,alpha:0.5*a,noDust:true}) }
// A flor carrega a TINTA DO PRODUTO (§2b: marca de produto entra como marca, não
// se adapta ao lápis). forma 'aro' é a flor sem tinta: papel com moldura, como
// o ícone da Adega. forma 'cheia' é a flor de tinta cheia, como o do Controle.
function flor(ctx,r,x,y,s,col=AZUL,a=0.85,forma='raios'){
  if(forma==='aro'){ wob(ctx,circ(x,y,s*0.55,18,1.04,rd(r,0,6)),{w:1.5,color:TINTA,rng:r,amp:0.35,alpha:a,noDust:true}); dot(ctx,x,y,s*0.55-1.2,1,PAPEL); dot(ctx,x,y,1.4,a,TINTA); return }
  const n=Math.floor(rd(r,5,8)); for(let k=0;k<n;k++){ const ang=k/n*TAU+rd(r,-0.2,0.2); wob(ctx,[[x,y],[x+Math.cos(ang)*s,y+Math.sin(ang)*s]],{w:forma==='cheia'?2.4:1.7,color:col,rng:r,amp:0.3,alpha:a,taper:'out',noDust:true}) } dot(ctx,x,y,forma==='cheia'?2.6:1.6,a,col) }
function arvore(ctx,r,x,y,ang,len,d,o={}){ // recursiva, a do fable
  const dentro=o.dentro||(()=>true); const col=o.col||TINTA
  if(d<=0||len<8){ if(ch(r,0.5)) folha(ctx,r,x,y,ang,col); else if(ch(r,o.flor??0.35)) flor(ctx,r,x,y,rd(r,7,12),o.florCol||AZUL,0.85,o.florForma||'raios'); else dot(ctx,x,y,1.8,0.5,col); return }
  const n=6, pts=[[x,y]]; let cx=x, cy=y, a2=ang; const bend=rd(r,-0.12,0.12); let cut=false
  for(let k=0;k<n;k++){ a2+=bend+rd(r,-0.05,0.05); cx+=Math.cos(a2)*len/n; cy+=Math.sin(a2)*len/n; if(!dentro(cx,cy)){ cut=true; break } pts.push([cx,cy]) }
  if(pts.length>1) wob(ctx,pts,{w:Math.max(0.9,Math.min(o.wmax||5,d*0.72)),color:col,rng:r,alpha:0.62,amp:0.4,taper:d<=2?'out':undefined})
  if(cut){ if(ch(r,0.7)) folha(ctx,r,cx,cy,a2,col); return }
  if(ch(r,0.3)&&d<6) folha(ctx,r,cx,cy,a2+rd(r,-1.2,1.2),col)
  const kids=d>5?2:(ch(r,0.3)?3:2)
  for(let k=0;k<kids;k++) arvore(ctx,r,cx,cy,a2+rd(r,0.14,0.5)*(k%2?1:-1),len*rd(r,0.72,0.84),d-1,o) }
// evitar:[x0,x1] é a coluna onde mora texto: ali o capim fica baixo e a
// umbela não nasce. Planta alta atravessando letra tira a leitura, e este é o
// tipo de ruído que só aparece no aparelho, nunca no plano.
function capim(ctx,r,x0,x1,base,n,o={}){ const col=o.col||TINTA2
  const ev=o.evitar, dentro=x=>ev && x>ev[0] && x<ev[1]
  for(let i=0;i<n;i++){ const x=rd(r,x0,x1),b=base+rd(r,-6,6); const h=rd(r,o.hmin||30,o.hmax||110)*(dentro(x)?0.42:1),tipx=x+rd(r,-26,54); const pts=[]; for(let k=0;k<=5;k++){ const t=k/5; pts.push([x+(tipx-x)*t*t,b-h*t]) }
    wob(ctx,pts,{w:rd(r,1.2,2.2),color:col,rng:r,alpha:rd(r,0.45,0.85),amp:0.3,taper:'out',noDust:true}); if(ch(r,0.12)) for(let k=0;k<3;k++) dot(ctx,pts[5][0]+rd(r,-4,4),pts[5][1]+k*5,1.3,0.6,col) }
  // a ponta da haste é sorteada UMA vez: sorteando de novo para a cabeça, a
  // umbela nascia ao lado do talo, solta no ar (defeito visto em 09/2026)
  for(let i=0;i<(o.umbelas??5);i++){ let x=rd(r,x0+80,x1-80); for(let t=0;t<8 && dentro(x);t++) x=rd(r,x0+80,x1-80); if(dentro(x)) continue
    const h=rd(r,120,190); const tx=x+rd(r,-14,14), ty=base-h
    wob(ctx,[[x,base],[tx,ty]],{w:1.6,color:col,rng:r,alpha:0.75,amp:0.5,noDust:true})
    for(let k=0;k<9;k++){ const a2=-Math.PI/2+rd(r,-1,1); const ex=tx+Math.cos(a2)*rd(r,14,26),ey=ty+Math.sin(a2)*rd(r,14,26); wob(ctx,[[tx,ty],[ex,ey]],{w:0.9,color:col,rng:r,alpha:0.6,amp:0.2,noDust:true}); dot(ctx,ex,ey,1.4,0.6,col) } } }
function samambaia(ctx,r,x,y,h,col=TINTA){ const spine=[]; for(let t=0;t<=1;t+=0.07) spine.push([x+Math.sin(t*2.6)*h*0.14,y-t*h]); wob(ctx,spine,{w:1.5,color:col,rng:r,alpha:0.6,amp:0.5,taper:'out'})
  for(let t=0.08;t<0.95;t+=0.06){ const i=Math.min(spine.length-1,Math.round(t*spine.length)); const p=spine[i],L=h*0.16*(1-t*0.8); for(const sd of [-1,1]) wob(ctx,[p,[p[0]+sd*L,p[1]-L*0.5]],{w:1,color:col,rng:r,alpha:0.5,amp:0.4,taper:'out',noDust:true}) } }
function mariposa(ctx,r,x,y,s,col=TINTA,a=0.6){ for(const sd of [-1,1]){ const wing=blob(r,x+sd*s*0.55,y-s*0.1,s*0.62,s*0.45); wob(ctx,wing.concat([wing[0]]),{w:1.1,color:col,rng:r,alpha:a,amp:0.5}); scrib(ctx,wing,{rng:r,step:s*0.3,alpha:a*0.4,color:col,w:0.9})
  const wl=blob(r,x+sd*s*0.38,y+s*0.34,s*0.34,s*0.26); wob(ctx,wl.concat([wl[0]]),{w:1,color:col,rng:r,alpha:a*0.85,amp:0.4}) }
  wob(ctx,[[x,y-s*0.45],[x,y+s*0.5]],{w:1.6,color:col,rng:r,alpha:a,amp:0.3}); for(const sd of [-1,1]) wob(ctx,[[x,y-s*0.42],[x+sd*s*0.3,y-s*0.75]],{w:0.9,color:col,rng:r,alpha:a*0.8,amp:0.3,taper:'out'}) }
function passaro(ctx,r,x,y,s,col=TINTA,a=0.6,o={}){
  const w=o.w||1.4, amp=o.amp??0.4, ang=o.ang||0
  if(ang){ ctx.save(); ctx.translate(x,y); ctx.rotate(ang); x=0; y=0 }
  wob(ctx,[[x-s,y],[x-s*0.4,y-s*0.55],[x,y]],{w,color:col,rng:r,alpha:a,amp,taper:'out',noDust:true})
  wob(ctx,[[x,y],[x+s*0.4,y-s*0.55],[x+s,y]],{w,color:col,rng:r,alpha:a,amp,taper:'out',noDust:true})
  if(ang) ctx.restore() }
// revoada: "one motion, many small marks". Não é meia dúzia de pássaros
// espalhados: é um RIO de centenas de marcas pequenas ao longo de uma curva,
// com densidade em grumos (uns trechos fecham, outros abrem), fraco na entrada,
// cheio no meio, fraco na saída. Cada bicho é duas curvas de 3 a 7 px.
function revoada(ctx, r, guia, n, o={}){
  const col=o.col||TINTA
  const sm=chaikin(chaikin(resample(guia,12)))
  const em=t=>{ const f=Math.max(0,Math.min(1,t))*(sm.length-1); const i=Math.min(sm.length-2,Math.floor(f)); const k=f-i
    return [sm[i][0]+(sm[i+1][0]-sm[i][0])*k, sm[i][1]+(sm[i+1][1]-sm[i][1])*k, Math.atan2(sm[i+1][1]-sm[i][1], sm[i+1][0]-sm[i][0])] }
  const faixa=o.faixa??110, ph1=r()*6.28, ph2=r()*6.28, ph3=r()*6.28
  for(let i=0;i<n;i++){
    const t=r(), u=(r()-0.5)*2
    const foco=Math.pow(Math.sin(Math.PI*t), o.curva??1.1)
    // grumo: o bando não é uma nuvem uniforme, tem veios e buracos
    const grumo=0.5+0.25*Math.sin(t*21+ph1)+0.25*Math.sin(u*3.4+t*9+ph2)
    if(r() > foco*0.62+grumo*0.38-0.18) continue
    // a faixa é mais fina onde o bando está cheio
    const [x0,y0,ang]=em(t); const nx=-Math.sin(ang), ny=Math.cos(ang)
    const d=u*faixa*(0.55+0.45*(1-foco))+Math.sin(t*13+ph3)*faixa*0.18
    const x=x0+nx*d, y=y0+ny*d
    const s=(o.smin??2.6)+(o.smax??4.4)*foco*(0.6+r()*0.8)
    const a=(o.amin??0.22)+(o.amax??0.62)*foco*(0.55+r()*0.6)
    passaro(ctx, r, x, y, s, col, Math.min(1,a), { ang: ang+rd(r,-0.5,0.5)*(1.3-foco*0.6)+Math.sin(x*0.008)*0.18, w:0.7+0.7*foco, amp:0.25+0.4*(1-foco) })
  }
  // os retardatários, correndo atrás
  for(let i=0;i<(o.atrasados??10);i++){ const [x0,y0,ang]=em(rd(r,0,0.16)); const nx=-Math.sin(ang), ny=Math.cos(ang)
    passaro(ctx,r, x0+rd(r,-120,-20)+nx*rd(r,-70,70), y0+ny*rd(r,-70,70)+rd(r,-20,20), rd(r,2.4,3.6), col, rd(r,0.2,0.36), {ang:ang+rd(r,-0.4,0.4), w:0.75, amp:0.5}) }
}
function busto(r,cx,cy,s){ // cabeça elipse, pescoço, ombros com flare; devolve contorno e "dentro"
  const hr=rd(r,195,215); const hrx=hr*rd(r,0.92,1), hry=hr; const hc=[540+rd(r,-10,10), rd(r,370,398)]; const nw=hrx*rd(r,0.47,0.54)
  const yj=hc[1]+hry*Math.sqrt(1-(nw/hrx)*(nw/hrx)); const shY=hc[1]+hry*rd(r,1.1,1.22); const shW=rd(r,380,440); const flare=rd(r,0.5,0.62); const yCap=1080
  const bw=y=>{ const t=Math.max(0,Math.min(1,(y-shY)/(980-shY))); return nw+(shW-nw)*Math.pow(t,flare) }
  const L2W=p=>[cx+(p[0]-540)*s, cy+(p[1]-560)*s]
  const insideL=(x,y)=>{ const ex=(x-hc[0])/hrx, ey=(y-hc[1])/hry; if(ex*ex+ey*ey<1) return true; if(y>=yj-2&&y<shY&&Math.abs(x-hc[0])<nw) return true; if(y>=shY&&y<=yCap+10) return Math.abs(x-hc[0])<bw(y); return false }
  const contour=()=>{ const pts=[]; for(let y=yCap;y>=shY;y-=16) pts.push([hc[0]-bw(y),y]); pts.push([hc[0]-nw,shY],[hc[0]-nw,yj]); const aL=Math.acos(-nw/hrx), aR=Math.acos(nw/hrx); for(let a=aL;a<=TAU+aR;a+=0.08) pts.push([hc[0]+Math.cos(a)*hrx,hc[1]+Math.sin(a)*hry]); pts.push([hc[0]+nw,yj],[hc[0]+nw,shY]); for(let y=shY;y<=yCap;y+=16) pts.push([hc[0]+bw(y),y]); return chaikin(pts,false,2).map(L2W) }
  return { contour, inside:(x,y)=>insideL((x-cx)/s+540,(y-cy)/s+560), head:L2W(hc), base:L2W([hc[0],yCap]), yj:L2W([hc[0],yj])[1], hc, s, L2W } }
function sussurros(ctx, r, W, y0, y1, col=TINTA2){ for(let k=0;k<4;k++){ const lado=r()<0.5; const x=lado? 40+r()*100 : W-140+r()*100; const y=y0+80+r()*(y1-y0-160); const t=Math.floor(r()*5)
    if(t===0){ const p=[]; for(let a=0;a<12;a+=0.35) p.push([x+a*1.6*Math.cos(a), y+a*1.6*Math.sin(a)]); wob(ctx,p,{w:0.9,color:col,rng:r,alpha:0.35,noDust:true}) }
    if(t===1){ for(let i=0;i<6;i++) dot(ctx,x+i*7,y+(r()-0.5)*2,1.1,0.3,col) }
    if(t===2){ wob(ctx,[[x-6,y],[x+6,y]],{w:0.9,color:col,rng:r,alpha:0.35,noDust:true}); wob(ctx,[[x,y-6],[x,y+6]],{w:0.9,color:col,rng:r,alpha:0.35,noDust:true}) }
    if(t===3){ atext(ctx, ['ok','sim','isso','aqui','ver'][Math.floor(r()*5)], x, y, 13, {rng:r, alpha:0.5, color:col}) }
    if(t===4){ folha(ctx,r,x,y,rd(r,0,TAU),col,0.5) } } }
// o fio: azul, a conversa
// esc: o fio foi traçado em coordenadas de 1600. No telefone ele entra
// multiplicado pela razão da largura, senão sai da página.
function fio(ctx,r,yA,yB,dy,col=AZUL,a=0.6,esc=1){ let y=yA; while(y<yB){ const y2=Math.min(yB,y+rd(r,260,420)); const pts=[]; for(let yy=y;yy<=y2;yy+=13) pts.push([fioX(yy+dy)*esc,yy]); if(pts.length>1) wob(ctx,pts,{w:1.7,color:col,rng:r,alpha:a*rd(r,0.9,1.15),amp:1.1}); if(ch(r,0.3)) dot(ctx,fioX(y2+dy)*esc,y2,2.2,a,col); if(y2>=yB) break; y=y2 } }
const WPT=[[0,1320],[500,1250],[900,1180],[1400,1250],[1900,1130],[2400,1060],[2900,1000],[3400,1120],[3900,1200],[4300,880],[4600,810]]
function fioX(y){ let i=0; while(i<WPT.length-2&&WPT[i+1][0]<y) i++; const [ya,xa]=WPT[i],[yb,xb]=WPT[i+1]; let t=Math.max(0,Math.min(1,(y-ya)/(yb-ya||1))); t=t*t*(3-2*t); return xa+(xb-xa)*t+Math.sin(y*0.0061+1.7)*22+Math.sin(y*0.0013+0.4)*38 }


// ---------- a mão em SVG (para marca que se REDESENHA na tela) ----------
// O canvas é para o que fica; o SVG é para o que a mão refaz enquanto a pessoa
// olha. Mesma matemática de tremor do wob, cuspida como "d" de <path>.
function caminho(pts, semente, amp=1.3){
  const r=mulberry(semente|0); const rs=resample(pts,3)
  const f1=1.6+r()*1.6, f2=5+r()*4, f3=17, p1=r()*6.28, p2=r()*6.28, p3=r()*6.28
  const out=[]
  for(let i=0;i<rs.length;i++){ const a=rs[Math.max(0,i-1)], b=rs[Math.min(rs.length-1,i+1)]
    const L=Math.hypot(b[0]-a[0],b[1]-a[1])||1; const nx=-(b[1]-a[1])/L, ny=(b[0]-a[0])/L
    const t=i/rs.length*6.28
    const d=amp*(Math.sin(t*f1+p1)*0.55+Math.sin(t*f2+p2)*0.3+Math.sin(t*f3+p3)*0.15)+(r()-0.5)*0.6
    out.push([rs[i][0]+nx*d, rs[i][1]+ny*d]) }
  return 'M'+out.map(q=>q[0].toFixed(1)+' '+q[1].toFixed(1)).join('L')
}
function elipsePts(cx,cy,rx,ry,frac=1.06,a0=-1.1,n=44){ const p=[]; for(let i=0;i<=n;i++){ const a=a0+frac*TAU*i/n; p.push([cx+rx*Math.cos(a), cy+ry*Math.sin(a)]) } return p }


// carimbo da casa, desenhado à mão: moldura dupla torta + duas linhas dentro.
// É o grafismo-assinatura da Obliq (§5.1), e vale UM por peça.
function carimbo(ctx, r, cx, cy, larg, l1, l2, cor, ang=-0.14){
  const alt=larg*0.34
  ctx.save(); ctx.translate(cx,cy); ctx.rotate(ang)
  wob(ctx, rect(-larg/2,-alt/2,larg,alt), {w:3.4,color:cor,rng:r,alpha:0.9,amp:1.8,passes:2,gap:0.02})
  wob(ctx, rect(-larg/2+9,-alt/2+9,larg-18,alt-18), {w:1.3,color:cor,rng:r,alpha:0.55,amp:1.2,gap:0.05})
  const sz=larg*0.082
  const w1=atext(ctx,l1,-9999,-9999,sz,{rng:stream(11),alpha:0})
  const w2=atext(ctx,l2,-9999,-9999,sz*0.82,{rng:stream(12),alpha:0})
  atext(ctx,l1,-w1/2,-alt*0.06,sz,{rng:r,color:cor,alpha:0.95})
  atext(ctx,l2,-w2/2,alt*0.3,sz*0.82,{rng:r,color:cor,alpha:0.8})
  ctx.restore()
}


// No telefone o fio NÃO pode descer pelo meio: a coluna é uma só e ele corta o
// texto. Aqui ele corre pela margem direita, com a mesma respiração.
function fioCel(ctx,r,yA,yB,dy,col=AZUL,a=0.55){
  const x=yy=> W-26+Math.sin((yy+dy)*0.006)*11+Math.sin((yy+dy)*0.0017)*6
  let y=yA
  while(y<yB){ const y2=Math.min(yB,y+rd(r,220,360)); const pts=[]
    for(let yy=y;yy<=y2;yy+=13) pts.push([x(yy),yy])
    if(pts.length>1) wob(ctx,pts,{w:1.6,color:col,rng:r,alpha:a*rd(r,0.9,1.1),amp:1})
    if(ch(r,0.3)) dot(ctx,x(y2),y2,2,a,col)
    if(y2>=yB) break; y=y2 }
  return x
}


// ---------- a prancha pintada ----------
// No canteiro, dez plantas lado a lado, a linha basta e é o certo: catálogo.
// Quando UMA é escolhida, ela vira retrato, e retrato de espécime na tradição
// da prancha botânica é PINTADO: demãos translúcidas, sombra do lado de dentro,
// contorno no próprio pigmento (nunca em preto) e nervura por cima da lavagem.
// A folhagem tem cor de folha, não cor de marca: a prancha é uma DEPICÇÃO, e o
// que ela pinta tem a cor da coisa, como a foto de um cliente tem a cor dele.
// A tinta do produto fica onde é acento: na flor.
const SALVIA='#7E8C63', OLIVA='#4A5730', CAULE='#6B7248'
function mistura(a,b,t){ const p=h=>[parseInt(h.slice(1,3),16),parseInt(h.slice(3,5),16),parseInt(h.slice(5,7),16)]
  const A=p(a),B=p(b); return '#'+A.map((v,i)=>Math.round(v+(B[i]-v)*t).toString(16).padStart(2,'0')).join('') }
function lavagem(ctx,poly,cor,n,alpha){ ctx.fillStyle=cor
  for(let k=0;k<n;k++){ ctx.globalAlpha=alpha; ctx.beginPath(); poly.forEach((q,i)=>i?ctx.lineTo(q[0],q[1]):ctx.moveTo(q[0],q[1])); ctx.closePath(); ctx.fill() }
  ctx.globalAlpha=1 }
function folhaPintada(ctx,r,x,y,ang,L,c1,c2){
  const tip=[x+Math.cos(ang)*L, y+Math.sin(ang)*L], mx=(x+tip[0])/2, my=(y+tip[1])/2
  const b=blob(r,mx,my,L*0.5,L*0.27)
  lavagem(ctx,b,c1,2,0.17)
  lavagem(ctx,blob(r,mx-Math.cos(ang)*L*0.1,my-Math.sin(ang)*L*0.1,L*0.33,L*0.16),c2,2,0.15)
  wob(ctx,b.concat([b[0]]),{w:0.85,color:mistura(c2,TINTA,0.3),rng:r,alpha:0.45,amp:0.35,noDust:true})
  wob(ctx,[[x,y],tip],{w:1,color:mistura(c2,TINTA,0.25),rng:r,alpha:0.55,amp:0.25,noDust:true})
  for(let k=1;k<=4;k++){ const t=k/5, px=x+(tip[0]-x)*t, py=y+(tip[1]-y)*t
    for(const sd of [-1,1]) wob(ctx,[[px,py],[px+Math.cos(ang+sd*1.15)*L*0.19, py+Math.sin(ang+sd*1.15)*L*0.19]],{w:0.55,color:mistura(c2,TINTA,0.2),rng:r,alpha:0.3,amp:0.18,noDust:true}) } }
function florPintada(ctx,r,x,y,s,tinta){
  const claro=mistura(tinta,PAPEL,0.52), escuro=mistura(tinta,TINTA,0.32)
  const n=5+Math.floor(r()*2)
  for(let k=0;k<n;k++){ const a=k/n*TAU+rd(r,-0.14,0.14)
    const pet=blob(r,x+Math.cos(a)*s*0.56,y+Math.sin(a)*s*0.56,s*0.5,s*0.35)
    lavagem(ctx,pet,claro,2,0.2)
    lavagem(ctx,blob(r,x+Math.cos(a)*s*0.32,y+Math.sin(a)*s*0.32,s*0.3,s*0.21),tinta,2,0.15)
    wob(ctx,pet.concat([pet[0]]),{w:0.7,color:escuro,rng:r,alpha:0.4,amp:0.28,noDust:true}) }
  lavagem(ctx,blob(r,x,y,s*0.2,s*0.2),escuro,3,0.2)
  for(let k=0;k<6;k++){ const a=r()*TAU; wob(ctx,[[x,y],[x+Math.cos(a)*s*0.28,y+Math.sin(a)*s*0.28]],{w:0.55,color:escuro,rng:r,alpha:0.45,amp:0.18,noDust:true}) } }
function frutoPintado(ctx,r,x,y,s,tinta){
  // Prancha clássica mostra flor, botão E fruto. Onde a tinta do produto é
  // verde, a flor some na folhagem: o fruto separa por VALOR, não por matiz, e
  // no Validade & Estoque ele diz o que o produto faz melhor que uma flor.
  const escuro=mistura(tinta,TINTA,0.42), claro=mistura(tinta,PAPEL,0.32)
  const n=3+Math.floor(r()*3)
  for(let k=0;k<n;k++){
    const a=k/n*TAU+rd(r,-0.3,0.3), d=s*rd(r,0.3,0.66)
    const cx=x+Math.cos(a)*d, cy=y+Math.sin(a)*d, rr=s*rd(r,0.3,0.44)
    wob(ctx,[[cx,cy-rr*0.8],[x,y]],{w:0.9,color:mistura(OLIVA,TINTA,0.25),rng:r,alpha:0.55,amp:0.2,noDust:true})
    const b=blob(r,cx,cy,rr,rr*0.95)
    lavagem(ctx,b,tinta,3,0.2)
    lavagem(ctx,blob(r,cx+rr*0.24,cy+rr*0.24,rr*0.62,rr*0.58),escuro,2,0.2)
    lavagem(ctx,blob(r,cx-rr*0.32,cy-rr*0.34,rr*0.24,rr*0.2),claro,2,0.34)
    wob(ctx,b.concat([b[0]]),{w:0.75,color:escuro,rng:r,alpha:0.5,amp:0.22,noDust:true}) } }
function arvorePintada(ctx,r,x,y,ang,len,d,o={}){
  // o.ops: em vez de pintar agora, EMPILHA cada marca. Quem chamou desenha uma
  // por vez, e a planta se pinta na frente de quem olha, como o resto da parede.
  const faz = fn => o.ops ? o.ops.push(fn) : fn()
  const dentro=o.dentro||(()=>true), c1=o.c1||SALVIA, c2=o.c2||OLIVA
  if(d<=0||len<8){
    if(ch(r,0.6)){ const L=rd(r,(o.fmin||20),(o.fmax||32)); faz(()=>folhaPintada(ctx,r,x,y,ang,L,c1,c2)) }
    else if(ch(r,o.flor??0.5)){ const S=rd(r,(o.smin||14),(o.smax||22)); faz(()=>(o.fruto?frutoPintado:florPintada)(ctx,r,x,y,S,o.tinta||AZUL)) }
    else faz(()=>lavagem(ctx,blob(r,x,y,2.4,2.4),c2,2,0.3))
    return }
  const nseg=6, pts=[[x,y]]; let cx=x, cy=y, a2=ang; const bend=rd(r,-0.12,0.12); let cut=false
  for(let k=0;k<nseg;k++){ a2+=bend+rd(r,-0.05,0.05); cx+=Math.cos(a2)*len/nseg; cy+=Math.sin(a2)*len/nseg; if(!dentro(cx,cy)){ cut=true; break } pts.push([cx,cy]) }
  const esp=Math.max(1,Math.min(o.wmax||6,d*0.8))
  if(pts.length>1) faz(()=>{
    wob(ctx,pts,{w:esp,color:CAULE,rng:r,alpha:0.55,amp:0.35,noDust:true})
    wob(ctx,pts.map(q=>[q[0]-esp*0.22,q[1]]),{w:esp*0.4,color:mistura(CAULE,PAPEL,0.5),rng:r,alpha:0.4,amp:0.3,noDust:true})
    wob(ctx,pts,{w:0.7,color:mistura(OLIVA,TINTA,0.35),rng:r,alpha:0.35,amp:0.3,noDust:true}) })
  if(cut){ if(ch(r,0.7)){ const L=rd(r,(o.fmin||20)*0.8,(o.fmax||32)*0.8); faz(()=>folhaPintada(ctx,r,cx,cy,a2,L,c1,c2)) } return }
  if(ch(r,0.34)&&d<6){ const L=rd(r,(o.fmin||20)*0.85,(o.fmax||32)*0.85), A=a2+rd(r,-1.2,1.2); faz(()=>folhaPintada(ctx,r,cx,cy,A,L,c1,c2)) }
  const kids=d>5?2:(ch(r,0.3)?3:2)
  for(let k=0;k<kids;k++) arvorePintada(ctx,r,cx,cy,a2+rd(r,0.14,0.5)*(k%2?1:-1),len*rd(r,0.72,0.84),d-1,o) }

// ---------- fila de replay ----------
const fila=[]; let ativo=false
function agenda(fn){ fila.push(fn); if(FAST){ while(fila.length){ try{ fila.shift()() }catch(e){ console.error(e) } } } else if(!ativo){ ativo=true; requestAnimationFrame(passo) } }
function passo(){ const t0=performance.now(); while(fila.length && performance.now()-t0<7){ try{ fila.shift()() }catch(e){ console.error(e) } } if(fila.length) requestAnimationFrame(passo); else ativo=false }

// ---------- a parede ----------
// A largura é decidida pela PÁGINA, não pelo motor: a parede de mesa mede 1600
// e a de telefone mede a viewport. Tudo que desenha usa W, então a mesma caneta
// serve para as duas composições (que são composições diferentes, não a mesma
// encolhida).
let W=1600, ESCALA_CANVAS=2
function largura(v){ W=v }
const parede=document.getElementById('parede'); const PAINEIS=[]
// id: vira o id do bloco HTML do painel, para âncora e para leitor de tela
function painel(h, desenha, html, id){ const y=PAINEIS.reduce((a,p)=>a+p.h,0); PAINEIS.push({y,h,desenha,html,id,feito:false}) }
const tipo=(txt,x,y,sz,extra='')=>`<div class="tipo" style="left:${x}px;top:${y}px;font-size:${sz}px;${extra}">${txt}</div>`
const hk=(txt,x,y,w=420,cls='')=>`<div class="h ${cls}" style="left:${x}px;top:${y}px;width:${w}px">${txt}</div>`
const lapis=(txt,x,y,rot=-2)=>`<div class="lapis" style="left:${x}px;top:${y}px;transform:rotate(${rot}deg)">${txt}</div>`

// monta a parede: chama depois de declarar os paineis
function montar(){
const ALT=PAINEIS.reduce((a,p)=>a+p.h,0); parede.style.height=ALT+'px'; parede.style.width=W+'px'
PAINEIS.forEach((p,i)=>{ const c=document.createElement('canvas'); c.className='tile'; c.width=Math.round(W*ESCALA_CANVAS); c.height=Math.round(p.h*ESCALA_CANVAS); c.style.width=W+'px'; c.style.height=p.h+'px'; c.style.top=p.y+'px'; parede.appendChild(c); p.c=c
  // o canvas é decoração para o leitor de tela: o que ele diz está no HTML do painel
  c.setAttribute('aria-hidden','true')
  const d=document.createElement('div'); d.style.cssText=`position:absolute;left:0;top:${p.y}px;width:${W}px;height:${p.h}px;z-index:2;pointer-events:none`; if(p.id){ d.id=p.id; d.setAttribute('role','region') } d.innerHTML=p.html||''; parede.appendChild(d) })
function ativa(){ const top=scrollY-parede.offsetTop, vh=innerHeight
  PAINEIS.forEach((p,i)=>{ if(!p.feito && (FAST || p.y < top+vh*1.8)){ p.feito=true; const ctx=p.c.getContext('2d'); ctx.scale(ESCALA_CANVAS,ESCALA_CANVAS); p.desenha(ctx, stream(SEED*101+i)) } }) }
document.fonts.ready.then(()=>{ ativa(); addEventListener('scroll', ativa, {passive:true}) })
}
