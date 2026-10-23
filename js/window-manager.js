import {apps} from './config.js';
import {icon, appIcon} from './icons.js';
import {workArea, clampRect, snapRect, initialRect} from './geometry.js';

export class WindowManager extends EventTarget {
  constructor(container, renderContent) {
    super(); this.container=container; this.renderContent=renderContent;
    this.windows=new Map(); this.active=null; this.layer=10; this.gesture=null; this.hiddenWindows=[];
    window.addEventListener('resize',()=>this.reflow());
    window.addEventListener('blur',()=>this.endGesture(false));
  }
  get area() { return workArea(window.innerWidth,window.innerHeight); }
  changed() { this.dispatchEvent(new Event('change')); }
  open(id) {
    if (!apps[id]) return;
    let state=this.windows.get(id);
    if (!state) {
      const el=document.createElement('article');
      el.className='os-window'; el.id=`win-${id}`; el.tabIndex=-1;
      el.setAttribute('role','dialog'); el.setAttribute('aria-label',apps[id].title);
      el.innerHTML=`<header class="window-titlebar"><div class="window-title">${appIcon(id)}<span>${apps[id].title}</span></div><div class="window-controls"><button data-action="minimize" aria-label="Minimizar" title="Minimizar">${icon('minimize')}</button><div class="maximize-control"><button data-action="maximize" aria-label="Maximizar" title="Maximizar o restaurar">${icon('maximize')}</button><div class="snap-layouts" aria-label="Acoplar ventana"><button data-snap="left" aria-label="Acoplar a la izquierda"><span></span><span></span></button><button data-snap="right" aria-label="Acoplar a la derecha"><span></span><span></span></button></div></div><button data-action="close" class="window-close" aria-label="Cerrar" title="Cerrar">${icon('close')}</button></div></header><div class="window-app"></div>`;
      const body=el.querySelector('.window-app');
      this.renderContent(id,body);
      state={id,el,rect:initialRect(apps[id],this.area,this.windows.size),mode:'normal',restore:null,minimized:false};
      this.windows.set(id,state); this.container.append(el); this.apply(state);
      el.addEventListener('pointerdown',()=>this.focus(id));
      el.addEventListener('focusin',()=>{if(this.active!==id)this.focus(id);});
      const titlebar=el.querySelector('.window-titlebar');
      titlebar.addEventListener('dblclick',event=>{if(!event.target.closest('button'))this.maximize(id);});
      titlebar.addEventListener('pointerdown',event=>this.startGesture(event,state,'move'));
      el.querySelector('[data-action="minimize"]').onclick=()=>this.minimize(id);
      el.querySelector('[data-action="maximize"]').onclick=()=>this.maximize(id);
      el.querySelector('[data-action="close"]').onclick=()=>this.close(id);
      el.querySelectorAll('[data-snap]').forEach(button=>button.onclick=()=>this.snap(id,button.dataset.snap));
      for(const direction of ['n','e','s','w','ne','nw','se','sw']) {
        const handle=document.createElement('div'); handle.className=`resize-handle resize-${direction}`;
        handle.addEventListener('pointerdown',event=>this.startGesture(event,state,direction)); el.append(handle);
      }
    }
    state.minimized=false; state.el.hidden=false; this.focus(id); this.changed();
    return state;
  }
  apply(state) {
    const {x,y,width,height}=state.rect;
    Object.assign(state.el.style,{left:`${x}px`,top:`${y}px`,width:`${width}px`,height:`${height}px`});
    state.el.classList.toggle('is-maximized',state.mode==='max');
    state.el.classList.toggle('is-snapped',state.mode==='left'||state.mode==='right');
    const button=state.el.querySelector('[data-action="maximize"]');
    button.innerHTML=icon(state.mode==='normal'?'maximize':'restore');
    button.setAttribute('aria-label',state.mode==='normal'?'Maximizar':'Restaurar');
  }
  focus(id) {
    const state=this.windows.get(id); if(!state||state.minimized)return;
    this.active=id;
    this.windows.forEach(win=>win.el.classList.toggle('is-active',win.id===id));
    state.el.style.zIndex=++this.layer;
    if(!state.el.contains(document.activeElement))state.el.focus({preventScroll:true});
    this.changed();
  }
  focusTop() {
    const top=[...this.windows.values()].filter(s=>!s.minimized).sort((a,b)=>Number(b.el.style.zIndex)-Number(a.el.style.zIndex))[0];
    this.active=null; if(top)this.focus(top.id); else document.getElementById('start-button').focus({preventScroll:true});
  }
  minimize(id) {
    const state=this.windows.get(id); if(!state)return;
    state.minimized=true; state.el.hidden=true; if(this.active===id)this.focusTop(); this.changed();
  }
  close(id) {
    const state=this.windows.get(id); if(!state)return;
    if(this.gesture?.state===state)this.endGesture(false);
    state.el.dispatchEvent(new Event('app:close')); state.el.remove(); this.windows.delete(id);
    if(this.active===id)this.focusTop(); this.changed();
  }
  taskbarClick(id) {
    const state=this.windows.get(id);
    if(state&&!state.minimized&&this.active===id)this.minimize(id); else this.open(id);
  }
  maximize(id) {
    const state=this.windows.get(id); if(!state)return;
    if(state.mode!=='normal')this.restore(state); else this.snap(id,'max');
    this.focus(id);
  }
  restore(state) {
    state.rect=clampRect(state.restore||initialRect(apps[state.id],this.area),this.area);
    state.mode='normal'; state.restore=null; this.apply(state);
  }
  snap(id,side) {
    const state=this.windows.get(id); if(!state)return;
    if(state.mode==='normal')state.restore={...state.rect};
    state.mode=side; state.rect=snapRect(side,this.area); this.apply(state); this.focus(id);
  }
  startGesture(event,state,direction) {
    if(event.button!==0||event.target.closest('button')||innerWidth<=600)return;
    if(direction!=='move'&&state.mode!=='normal')return;
    event.preventDefault();
    this.endGesture(false);
    const target=event.currentTarget; target.setPointerCapture(event.pointerId);
    this.gesture={state,direction,target,pointerId:event.pointerId,x:event.clientX,y:event.clientY,rect:{...state.rect},started:false,side:null};
    document.body.classList.add('is-dragging');
    const move=event=>this.moveGesture(event);
    const end=event=>{if(event.pointerId===this.gesture?.pointerId)this.endGesture(event.type==='pointerup');};
    const cancel=()=>this.endGesture(false);
    target.addEventListener('pointermove',move); target.addEventListener('pointerup',end); target.addEventListener('pointercancel',end); target.addEventListener('lostpointercapture',cancel);
    this.gesture.cleanup=()=>{ target.removeEventListener('pointermove',move); target.removeEventListener('pointerup',end); target.removeEventListener('pointercancel',end); target.removeEventListener('lostpointercapture',cancel); };
  }
  moveGesture(event) {
    const g=this.gesture;if(!g||event.pointerId!==g.pointerId)return;
    let dx=event.clientX-g.x, dy=event.clientY-g.y;
    if(!g.started&&Math.abs(dx)+Math.abs(dy)<5)return;
    if(!g.started&&g.direction==='move'&&g.state.mode!=='normal') {
      const ratio=(event.clientX-g.rect.x)/g.rect.width;
      this.restore(g.state); g.rect={...g.state.rect,x:event.clientX-g.state.rect.width*ratio,y:Math.max(0,event.clientY-20)};
      g.x=event.clientX;g.y=event.clientY;dx=0;dy=0;
    }
    g.started=true;
    if(g.direction==='move') {
      g.state.rect=clampRect({...g.rect,x:g.rect.x+dx,y:g.rect.y+dy},this.area);
      g.side=event.clientY<=8?'max':event.clientX<=12?'left':event.clientX>=this.area.width-12?'right':null;
      const preview=document.getElementById('snap-preview');preview.hidden=!g.side;
      if(g.side){const r=snapRect(g.side,this.area);Object.assign(preview.style,{left:`${r.x+5}px`,top:`${r.y+5}px`,width:`${r.width-10}px`,height:`${r.height-10}px`});}
    } else {
      let r={...g.rect}, right=r.x+r.width,bottom=r.y+r.height;
      if(g.direction.includes('e'))r.width=Math.max(340,Math.min(this.area.width-r.x,g.rect.width+dx));
      if(g.direction.includes('s'))r.height=Math.max(240,Math.min(this.area.height-r.y,g.rect.height+dy));
      if(g.direction.includes('w')){r.x=Math.max(0,Math.min(right-340,g.rect.x+dx));r.width=right-r.x;}
      if(g.direction.includes('n')){r.y=Math.max(0,Math.min(bottom-240,g.rect.y+dy));r.height=bottom-r.y;}
      g.state.rect=clampRect(r,this.area);
    }
    this.apply(g.state);
  }
  endGesture(commit=true) {
    const g=this.gesture;if(!g)return;this.gesture=null;g.cleanup?.();
    if(g.target.hasPointerCapture(g.pointerId))g.target.releasePointerCapture(g.pointerId);
    document.body.classList.remove('is-dragging');document.getElementById('snap-preview').hidden=true;
    if(commit&&g.side)this.snap(g.state.id,g.side);
  }
  showDesktop() {
    const visible=[...this.windows.values()].filter(s=>!s.minimized);
    if(visible.length){this.hiddenWindows=visible.map(s=>s.id);visible.forEach(s=>this.minimize(s.id));}
    else {this.hiddenWindows.forEach(id=>{if(this.windows.has(id))this.open(id);});this.hiddenWindows=[];}
  }
  cycle() {
    const visible=[...this.windows.values()].filter(s=>!s.minimized);
    if(visible.length<2)return;
    const index=visible.findIndex(s=>s.id===this.active);this.focus(visible[(index+1)%visible.length].id);
  }
  reflow() {
    this.endGesture(false);
    this.windows.forEach(state=>{state.rect=state.mode==='normal'?clampRect(state.rect,this.area):snapRect(state.mode,this.area);this.apply(state);});
  }
}
