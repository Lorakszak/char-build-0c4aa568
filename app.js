'use strict';

/* ---------- data ---------- */
const TRIPTYCH = [1,2,3,4,5,6,7,8,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32];
const GAL = TRIPTYCH.slice();

const WF_CORE = [
  ['workflows/face_crop','Stage 1 graph: SAM3 head segmentation, 1:1 crop + coords'],
  ['workflows/face_paste','Stage 2 graph: edited face downscaled + feathered back by geometry'],
  ['workflows/seedvr_upscale','SeedVR2 2K upscaling workflow'],
  ['workflows/skin_detailer','Skin-detail pass for natural texture (anti-plastic)'],
];
const WF_MORE = [
  ['workflows/local_batch','Qwen Rapid AIO inpainted locally pictures for the project.'],
  ['misc/higgie_list','Higgie: prompt-list batch queue UI'],
  ['misc/higgie_single','Higgie: single-prompt mode'],
  ['workflows/civitai_wan2_2_for_sigma_face','WAN2.2 face workflow (shared on Civitai)'],
  ['workflows/civitai_flux_grid_compare','Flux grid-compare workflow (shared on Civitai)'],
  ['workflows/old_workflow_sam3_extraction','Older project: SAM3 extraction graph'],
  ['workflows/old_workflow_adaptive_replacement','Older project: adaptive replacement'],
];

const V_LIFE = [
  ['morning_routine','Morning routine','Lifestyle scene, consistent identity'],
  ['studio_session','Studio session','Controlled-light studio shot'],
  ['restaurant_vlog','Restaurant vlog','Scene + character in context'],
  ['goodnight','Goodnight','Soft-light intimate framing'],
];
const V_PORSCHE = [
  ['porsche_best','Best take','Seedance 2: character + car, consistent identity'],
  ['porsche_audio','With audio','Same session, generated audio'],
  ['porsche_alt1','Alt take 1','Same identity, different motion'],
  ['porsche_alt2','Alt take 2','Same identity, different motion'],
];
const PORSCHE_REFS = ['porsche_front','porsche_ref1','porsche_ref2'];
const V_MOTION = [
  ['mt1_ref','Reference 1','Driving motion input'],
  ['mt1_out','Generated 1','Character mapped onto the motion'],
  ['mt2_ref','Reference 2','Driving motion input'],
  ['mt2_out','Generated 2','Character mapped onto the motion'],
  ['mt4_ref','Reference 4','Driving motion input'],
  ['mt4_out','Generated 4','Character mapped onto the motion'],
];
const V_TPL = [
  ['tpl_meadow','Meadow template','Higgsfield template-driven'],
  ['tpl_night','Night monochrome','Higgsfield template-driven'],
];
const FACES = ['front_face','smile','left_3_4','right_3_4','ponytail','surprised',
               'body_front','body_back',
               'sheet1','sheet2','sheet3','sheet4','sheet5','sheet6'];

/* ---------- safe DOM helpers ---------- */
const $ = s => document.querySelector(s);
function E(tag, cls, text){
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text != null) e.textContent = text;
  return e;
}
function IMG(src, alt, cls){
  const e = document.createElement('img');
  e.loading = 'lazy'; e.src = src; e.alt = alt || ''; if (cls) e.className = cls;
  return e;
}
function A(href, text){
  const a = document.createElement('a');
  a.href = href; a.textContent = text;
  if (href.startsWith('http') || href.endsWith('.pdf')) { a.target='_blank'; a.rel='noopener'; }
  return a;
}

/* ---------- triptych strip ---------- */
(function(){
  const s = $('#strip');
  const cols = [['native','RAW'],['improved','EDITED'],['final','FINAL']];
  TRIPTYCH.forEach(i=>{
    const t = E('div','trip'); t.style.cursor='pointer';
    cols.forEach(([dir,lbl])=>{
      const fig = document.createElement('figure');
      fig.appendChild(IMG(`assets/img/${dir}/${i}.webp`, `${i} ${lbl}`));
      fig.appendChild(E('figcaption',null,`${i} ${lbl}`));
      t.appendChild(fig);
    });
    t.addEventListener('click',()=>setBA(i));
    s.appendChild(t);
  });
  // fade out the right-edge scroll hint once the strip is scrolled to the end
  const wrap=$('#stripWrap');
  if(wrap){
    const upd=()=>{
      const atEnd = s.scrollLeft + s.clientWidth >= s.scrollWidth - 4;
      wrap.classList.toggle('at-end', atEnd);
    };
    s.addEventListener('scroll',upd,{passive:true});
    addEventListener('resize',upd);
    upd();
  }
})();

/* ---------- before / after ---------- */
function setBA(i){
  $('#baBefore').src = `assets/img/native/${i}.webp`;
  $('#baAfter').src  = `assets/img/final/${i}.webp`;
}
(function(){
  const box=$('#ba'), after=$('#baAfter'), div=$('#baDiv'), knob=$('#baKnob');
  let drag=false;
  const move=cx=>{
    const r=box.getBoundingClientRect();
    let p=((cx-r.left)/r.width)*100; p=Math.max(2,Math.min(98,p));
    after.style.clipPath=`inset(0 0 0 ${p}%)`;
    div.style.left=p+'%'; knob.style.left=p+'%';
  };
  box.addEventListener('pointerdown',e=>{drag=true;move(e.clientX);});
  window.addEventListener('pointermove',e=>{if(drag)move(e.clientX);});
  window.addEventListener('pointerup',()=>drag=false);
})();

/* ---------- lightbox ---------- */
let lbList=[], lbIdx=0;
function openLb(list,idx){ lbList=list; lbIdx=idx; $('#lbImg').src=list[idx]; $('#lb').classList.add('on'); }
function lbClose(){ $('#lb').classList.remove('on'); }
function lbStep(d){ lbIdx=(lbIdx+d+lbList.length)%lbList.length; $('#lbImg').src=lbList[lbIdx]; }
$('#lbX').onclick=lbClose;
$('#lbPrev').onclick=e=>{e.stopPropagation();lbStep(-1);};
$('#lbNext').onclick=e=>{e.stopPropagation();lbStep(1);};
$('#lb').addEventListener('click',e=>{if(e.target.id==='lb')lbClose();});
document.addEventListener('keydown',e=>{
  if(!$('#lb').classList.contains('on'))return;
  if(e.key==='Escape')lbClose();
  if(e.key==='ArrowLeft')lbStep(-1);
  if(e.key==='ArrowRight')lbStep(1);
});

/* ---------- gallery ---------- */
(function(){
  const g=$('#gal');
  const full = GAL.map(x=>`assets/img/gallery/${x}.webp`);
  GAL.forEach((i,k)=>{
    const im=IMG(`assets/img/thumb/${i}.webp`,`Freya ${i}`);
    im.addEventListener('click',()=>openLb(full,k));
    g.appendChild(im);
  });
})();

/* ---------- restore before/after pairs ---------- */
(function(){
  const c=$('#restorePairs'); if(!c) return;
  [12,17,22].forEach(n=>{
    const pair=E('div','rest-pair');
    [['in','SEGMENTED INPUT'],['out','EDITED FACE']].forEach(([k,lbl])=>{
      const src=`assets/img/restore/${n}_${k}.webp`;
      const fig=document.createElement('figure');
      const im=IMG(src,`restore ${n} ${k}`);
      im.addEventListener('click',()=>openLb([`assets/img/restore/${n}_in.webp`,`assets/img/restore/${n}_out.webp`], k==='in'?0:1));
      fig.appendChild(im);
      fig.appendChild(E('figcaption',null,lbl));
      pair.appendChild(fig);
    });
    c.appendChild(pair);
  });
})();

/* ---------- pose translation flow ---------- */
(function(){
  const c=$('#poseFlow'); if(!c) return;
  const cols=[
    ['pose','INPUT POSE'],
    ['native','OUR CHARACTER (RAW)'],
    ['final','FINAL'],
  ];
  [17,20].forEach(n=>{
    const row=E('div','pose-row');
    const srcs=cols.map(([dir])=>`assets/img/${dir}/${n}.webp`);
    cols.forEach(([dir,lbl],k)=>{
      if(k>0) row.appendChild(E('div','pose-arrow','→'));
      const fig=document.createElement('figure');
      const im=IMG(srcs[k],`pose ${n} ${lbl}`);
      im.style.cursor='pointer';
      im.addEventListener('click',()=>openLb(srcs,k));
      fig.appendChild(im);
      fig.appendChild(E('figcaption',null,lbl));
      row.appendChild(fig);
    });
    c.appendChild(row);
  });
})();

/* ---------- workflow grids ---------- */
function wfInto(sel,list){
  const c=$(sel);
  const full=list.map(([path])=>`assets/img/${path}.webp`);
  list.forEach(([path,cap],k)=>{
    const fig=document.createElement('figure');
    fig.appendChild(IMG(full[k],cap));
    fig.appendChild(E('figcaption',null,cap));
    fig.addEventListener('click',()=>openLb(full,k));
    c.appendChild(fig);
  });
}
wfInto('#wf',WF_CORE);
wfInto('#wf2',WF_MORE);

/* ---------- video grids ---------- */
function vInto(sel,list){
  const c=$(sel);
  list.forEach(([f,title,sub])=>{
    const card=E('div','vcard');
    const v=document.createElement('video');
    v.preload='none'; v.playsInline=true; v.controls=true; v.loop=true;
    v.poster=`assets/video/${f}_poster.webp`;
    v.src=`assets/video/${f}.mp4`;
    // sound is on by default; pause any other video so audio never overlaps
    v.addEventListener('play',()=>{
      document.querySelectorAll('video').forEach(o=>{ if(o!==v) o.pause(); });
    });
    const meta=E('div','vmeta');
    meta.appendChild(E('b',null,title));
    meta.appendChild(E('p',null,sub));
    card.appendChild(v); card.appendChild(meta);
    c.appendChild(card);
  });
}
vInto('#vLife',V_LIFE);
vInto('#vPorsche',V_PORSCHE);
vInto('#vMotion',V_MOTION);
vInto('#vTpl',V_TPL);

/* ---------- porsche reference inputs ---------- */
(function(){
  const c=$('#porscheRefs'); if(!c) return;
  const full=PORSCHE_REFS.map(n=>`assets/img/refs/${n}.webp`);
  PORSCHE_REFS.forEach((n,k)=>{
    const im=IMG(full[k],`reference ${n}`); im.style.cursor='pointer';
    im.addEventListener('click',()=>openLb(full,k));
    c.appendChild(im);
  });
})();

/* ---------- persona faces ---------- */
(function(){
  const f=$('#faces');
  const full=FACES.map(n=>`assets/img/persona/${n}.webp`);
  FACES.forEach((n,k)=>{
    const im=IMG(full[k],n); im.style.cursor='pointer';
    im.addEventListener('click',()=>openLb(full,k));
    f.appendChild(im);
  });
})();

/* ---------- nav + reveal ---------- */
const nav=$('#nav');
addEventListener('scroll',()=>nav.classList.toggle('scrolled',scrollY>40));
$('#navToggle').addEventListener('click',()=>$('#navlinks').classList.toggle('mobile'));
document.querySelectorAll('#navlinks a').forEach(a=>a.addEventListener('click',()=>$('#navlinks').classList.remove('mobile')));

const navMap={};
document.querySelectorAll('#navlinks a').forEach(a=>{
  const h=a.getAttribute('href'); if(h&&h.startsWith('#'))navMap[h.slice(1)]=a;
});
const spy=new IntersectionObserver(es=>{
  es.forEach(e=>{ if(e.isIntersecting){
    Object.values(navMap).forEach(a=>a.classList.remove('active'));
    if(navMap[e.target.id])navMap[e.target.id].classList.add('active');
  }});
},{rootMargin:'-45% 0px -50% 0px'});
['disclaimer','pipeline','gallery','video','tooling','track','contact']
  .forEach(id=>{const s=document.getElementById(id);if(s)spy.observe(s);});

const rev=new IntersectionObserver(es=>{
  es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');rev.unobserve(e.target);}});
},{threshold:.08});
function tagRev(){document.querySelectorAll('.reveal:not(.in)').forEach(n=>rev.observe(n));}
tagRev();
