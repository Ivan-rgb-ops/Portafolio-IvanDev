import {storage,apps} from './config.js';
import {appIcon} from './icons.js';
import {desktopShortcuts as shortcuts,deletedShortcuts,shortcutLabel} from './desktop-state.js';
import {escapeHTML} from './settings.js';

export function renderDesktop(container,open) {
  const saved=storage.get('desktop-order',shortcuts);
  const order=[...new Set([...(Array.isArray(saved)?saved:[]),...shortcuts])].filter(id=>shortcuts.includes(id)&&!deletedShortcuts().includes(id));
  let suppressUntil=0;
  container.innerHTML=order.map(id=>`<button class="desktop-icon" data-desktop-app="${id}" aria-label="${escapeHTML(shortcutLabel(id))}" title="Doble clic para abrir">${appIcon(id)}<span>${escapeHTML(shortcutLabel(id))}</span>${id==='recycle'?'':'<span class="shortcut-arrow" aria-hidden="true">↗</span>'}</button>`).join('');
  container.querySelectorAll('button').forEach(button=>{
    button.addEventListener('dblclick',()=>{if(performance.now()>suppressUntil)open(button.dataset.desktopApp);});
    button.addEventListener('click',event=>{
      if(performance.now()<suppressUntil){event.preventDefault();return;}
      container.querySelectorAll('button').forEach(el=>el.classList.toggle('selected',el===button));
      if(event.pointerType==='touch'||matchMedia('(pointer: coarse)').matches)open(button.dataset.desktopApp);
    });
    button.addEventListener('keydown',event=>{
      if(event.key==='Enter'||event.key===' '){event.preventDefault();open(button.dataset.desktopApp);}
      if(event.key==='ArrowDown'||event.key==='ArrowUp'){
        event.preventDefault();const buttons=[...container.children],index=buttons.indexOf(button);buttons[(index+(event.key==='ArrowDown'?1:-1)+buttons.length)%buttons.length].focus();
      }
    });
    button.addEventListener('pointerdown',event=>{
      if(event.button!==0||event.pointerType==='touch')return;
      const start={x:event.clientX,y:event.clientY},rect=button.getBoundingClientRect();let ghost,target,moved=false;
      const pointerId=event.pointerId;button.setPointerCapture(pointerId);
      function move(e){
        if(e.pointerId!==pointerId)return;
        const dx=e.clientX-start.x,dy=e.clientY-start.y;
        if(!moved&&Math.abs(dx)+Math.abs(dy)<7)return;
        if(!moved){moved=true;ghost=button.cloneNode(true);ghost.removeAttribute('data-desktop-app');ghost.removeAttribute('aria-label');ghost.setAttribute('aria-hidden','true');ghost.tabIndex=-1;ghost.className='desktop-icon desktop-drag-ghost';Object.assign(ghost.style,{left:rect.left+'px',top:rect.top+'px',width:rect.width+'px',height:rect.height+'px'});document.body.append(ghost);button.classList.add('desktop-drag-source');}
        ghost.style.transform=`translate(${dx}px,${dy}px)`;
        target?.classList.remove('desktop-drop-target');target=document.elementFromPoint(e.clientX,e.clientY)?.closest('[data-desktop-app]');
        if(target===button)target=null;target?.classList.add('desktop-drop-target');
      }
      function finish(e){
        if(e?.pointerId!==undefined&&e.pointerId!==pointerId)return;
        button.removeEventListener('pointermove',move);button.removeEventListener('pointerup',finish);button.removeEventListener('pointercancel',finish);button.removeEventListener('lostpointercapture',finish);window.removeEventListener('blur',finish);
        if(button.hasPointerCapture(pointerId))button.releasePointerCapture(pointerId);
        ghost?.remove();button.classList.remove('desktop-drag-source');target?.classList.remove('desktop-drop-target');
        if(moved){suppressUntil=performance.now()+500;if(target&&e?.type==='pointerup'){const placeholder=document.createElement('span');button.replaceWith(placeholder);target.replaceWith(button);placeholder.replaceWith(target);storage.set('desktop-order',[...container.children].map(el=>el.dataset.desktopApp));button.focus();}}
      }
      button.addEventListener('pointermove',move);button.addEventListener('pointerup',finish);button.addEventListener('pointercancel',finish);button.addEventListener('lostpointercapture',finish);window.addEventListener('blur',finish);
    });
  });
}
