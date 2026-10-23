import {apps} from './config.js';
import {appIcon,icon} from './icons.js';
import {deletedShortcuts,shortcutLabel,restoreShortcut,restoreAllShortcuts} from './desktop-state.js';
import {escapeHTML,shortcutsHTML} from './settings.js';

export function renderTaskManager(body,manager){
  let signature='';
  function refresh(){
    const states=[...manager.windows.values()];const next=JSON.stringify(states.map(s=>[s.id,s.desktop,s.minimized]));
    if(next===signature)return;signature=next;
    body.innerHTML=`<div class="taskmanager-app"><header><h1>Aplicaciones</h1><span class="availability">${states.length} abiertas</span></header><p class="muted">Ventanas de este portafolio. Finalizar una tarea cierra su ventana; no controla procesos de tu equipo.</p><div class="process-table"><div class="process-row process-heading"><strong>Nombre</strong><strong>Estado</strong><strong>Escritorio</strong><strong>Acción</strong></div>${states.map(s=>`<div class="process-row"><span>${appIcon(s.id)}${escapeHTML(apps[s.id].title)}</span><span>${s.minimized?'Minimizada':'Abierta'}</span><span>${escapeHTML(manager.desktops.find(d=>d.id===s.desktop)?.name||'')}</span><button class="fluent-btn-secondary" data-end-task="${s.id}">Finalizar tarea</button></div>`).join('')}</div><button class="fluent-btn-secondary" data-action="run">Ejecutar nueva tarea</button></div>`;
  }
  body.addEventListener('click',event=>{const button=event.target.closest('[data-end-task]');if(button)manager.close(button.dataset.endTask);});
  manager.addEventListener('change',refresh);queueMicrotask(refresh);
  queueMicrotask(()=>body.closest('.os-window')?.addEventListener('app:close',()=>manager.removeEventListener('change',refresh),{once:true}));
}
export function renderRecycle(body){
  function refresh(){const ids=deletedShortcuts();body.innerHTML=`<div class="explorer-toolbar">${icon('trash')} Papelera de reciclaje${ids.length?'<button class="fluent-btn-secondary" data-restore-all>Restaurar todos</button>':''}</div>${ids.length?`<div class="recycle-list"><p class="muted">Solo contiene accesos del escritorio. Tus proyectos y documentos originales siguen disponibles en Inicio.</p>${ids.map(id=>`<div class="recycle-row"><span>${appIcon(id)}${escapeHTML(shortcutLabel(id))}</span><button class="fluent-btn-secondary" data-restore="${id}">Restaurar</button></div>`).join('')}</div>`:`<div class="empty-state">${appIcon('recycle')}<h2>La papelera está vacía</h2><p>No hay accesos eliminados de este escritorio.</p></div>`}<footer class="explorer-status">${ids.length} elementos</footer>`;}
  body.addEventListener('click',event=>{const restore=event.target.closest('[data-restore]');if(restore)restoreShortcut(restore.dataset.restore);if(event.target.closest('[data-restore-all]'))restoreAllShortcuts();});
  document.addEventListener('desktop:change',refresh);refresh();
  queueMicrotask(()=>body.closest('.os-window')?.addEventListener('app:close',()=>document.removeEventListener('desktop:change',refresh),{once:true}));
}
export function renderSystemApp(id,body){
  if(id==='shortcuts')body.innerHTML=`<div class="shortcuts-app">${shortcutsHTML()}</div>`;
  if(id==='system')body.innerHTML=`<div class="winver-app"><div class="system-about">${icon('windows')}<div><h1>Portfolio OS</h1><p>Inspirado en Windows 11</p></div></div><hr><p>Versión 4.0 · Experiencia web</p><p>Creado por <strong>Iván Pieretto</strong>, Rosario, Argentina.</p><p>Explorá mis proyectos, formación, tecnologías y currículum desde un escritorio familiar.</p><p class="muted">Windows y sus marcas pertenecen a Microsoft. Este portafolio es una experiencia independiente.</p><div class="system-actions"><button class="fluent-btn-primary" data-open="about">Conocer a Iván</button><button class="fluent-btn-secondary" data-open="shortcuts">Ver atajos</button></div></div>`;
}
