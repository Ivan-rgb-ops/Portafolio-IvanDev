import {apps,pinned,taskbarPinned,normalize,storage} from './js/config.js';
import {icon,appIcon,hydrateIcons} from './js/icons.js';
import {WindowManager} from './js/window-manager.js';
import {createAppRenderer} from './js/apps.js';
import {Preferences} from './js/preferences.js';
import {renderDesktop as drawDesktop} from './js/desktop.js';
import {shortcutAction,resolveRunCommand} from './js/shortcuts.js';
import {createLogin} from './js/login.js';
import {escapeHTML} from './js/settings.js';
import {shortcutLabel,renameShortcut,deleteShortcut,undoShortcut,resetShortcuts,sortShortcuts} from './js/desktop-state.js';
import {clampRect} from './js/geometry.js';

const $=id=>document.getElementById(id);
const preferences=new Preferences();
let toastTimer,allApps=false,calendarOffset=0,panelFocus=null,menuTarget=null,renameTarget=null,keyboardLayout=null,metaOnly=false;
const manager=new WindowManager($('windows'),createAppRenderer({open:openApp,notify:toast,preferences,getManager:()=>manager,action:handleAction}));
const login=createLogin({preferences,onEnter:()=>{if(!manager.windows.size)openApp('explorer');else if(manager.active)manager.focus(manager.active);},onRestart:restart,onShutdown:shutdown});
const panels=['start-menu','quick-settings','calendar-panel','context-menu','task-switcher','run-panel','snap-panel','rename-panel'];
const panelButtons={'start-menu':'start-button','quick-settings':'quick-button','calendar-panel':'clock-button','task-switcher':'task-view-button'};

function toast(message){clearTimeout(toastTimer);$('toast').textContent=message;$('toast').hidden=false;toastTimer=setTimeout(()=>$('toast').hidden=true,4200);}
function closePanels(returnFocus=false){
  panels.forEach(id=>$(id).hidden=true);
  Object.values(panelButtons).forEach(id=>$(id).setAttribute('aria-expanded','false'));
  $('power-menu').hidden=true;$('power-button').setAttribute('aria-expanded','false');
  if(returnFocus&&panelFocus?.isConnected&&panelFocus.getClientRects().length)panelFocus.focus();
}
function showPanel(id){
  panelFocus=document.activeElement;closePanels();$(id).hidden=false;
  if(panelButtons[id])$(panelButtons[id]).setAttribute('aria-expanded','true');
}
function togglePanel(id,search=false){
  if(!$(id).hidden){closePanels(true);return;}
  showPanel(id);
  if(id==='start-menu'){$('start-search').value='';allApps=false;renderStart();(search?$('start-search'):$('all-apps')).focus();}
  else if(id==='calendar-panel'){renderCalendar();$('calendar-prev').focus();}
  else $(id).querySelector('button,input')?.focus();
}
function openApp(route){
  const [id,section]=route.split(':');closePanels();const state=manager.open(id);
  if(id==='terminal')state?.el.querySelector('input')?.focus();
  if(id==='settings'&&section)state.el.querySelector('.window-app').dispatchEvent(new CustomEvent('settings:navigate',{detail:section}));
}
function pinnedApps(){const saved=storage.get('taskbar-pinned',taskbarPinned);return [...new Set(Array.isArray(saved)?saved:taskbarPinned)].filter(id=>apps[id]);}
function renderStart(){
  const query=normalize($('start-search').value.trim());
  const ids=(allApps?Object.keys(apps).filter(id=>id!=='doom'):pinned).filter(id=>normalize(`${apps[id].label} ${apps[id].keywords||''}`).includes(query));
  if(allApps)ids.sort((a,b)=>apps[a].label.localeCompare(apps[b].label,'es'));
  $('pinned-apps').innerHTML=ids.map(id=>`<button data-open="${id}">${appIcon(id)}<span>${apps[id].label}</span></button>`).join('')||'<p class="no-results">No encontramos esa aplicación.</p>';
  $('pinned-title').textContent=query?'Resultados de búsqueda':allApps?'Todas las aplicaciones':'Anclado';
  $('all-apps').innerHTML=allApps?'‹ Volver':'Todas las aplicaciones <span>›</span>';
  $('recommended').hidden=!!query||allApps;
}
function renderTaskbar(){
  const current=[...manager.windows.values()].filter(s=>s.desktop===manager.currentDesktop);
  const ids=[...new Set([...pinnedApps(),...current.map(s=>s.id)])];const tray=$('taskbar-apps');
  for(const el of [...tray.children])if(!ids.includes(el.dataset.task))el.remove();
  ids.forEach(id=>{
    let button=tray.querySelector(`[data-task="${id}"]`);
    if(!button){button=document.createElement('button');button.className='taskbar-button taskbar-app';button.dataset.task=id;button.innerHTML=appIcon(id);button.title=apps[id].title;button.setAttribute('aria-label',apps[id].label);button.onclick=()=>{closePanels();manager.taskbarClick(id);};tray.append(button);}
    const state=manager.windows.get(id),here=state?.desktop===manager.currentDesktop,active=manager.active===id&&!state?.minimized;
    button.classList.toggle('is-open',!!state&&here);button.classList.toggle('is-active',active);button.setAttribute('aria-pressed',String(active));
  });
}
function renderDesktop(){drawDesktop($('desktop-icons'),openApp);}
function updateClock(){
  const now=new Date(),time=now.toLocaleTimeString('es-AR',{hour:'2-digit',minute:'2-digit',hour12:false});
  $('clock-time').textContent=time;$('clock-time').dateTime=now.toISOString();$('clock-date').textContent=now.toLocaleDateString('es-AR');$('clock-date').dateTime=now.toISOString().slice(0,10);
  $('clock-button').setAttribute('aria-label',`${time}, ${now.toLocaleDateString('es-AR',{dateStyle:'full'})}. Abrir calendario`);
  $('lock-time').textContent=time;$('lock-date').textContent=now.toLocaleDateString('es-AR',{weekday:'long',day:'numeric',month:'long'});
}
function renderCalendar(){
  const now=new Date(),month=new Date(now.getFullYear(),now.getMonth()+calendarOffset,1);$('calendar-month').textContent=month.toLocaleDateString('es-AR',{month:'long',year:'numeric'});
  const first=(month.getDay()+6)%7,days=new Date(month.getFullYear(),month.getMonth()+1,0).getDate();$('calendar-days').replaceChildren();
  for(let i=0;i<42;i++){const day=i-first+1,date=new Date(month.getFullYear(),month.getMonth(),day),el=document.createElement('span');el.textContent=date.getDate();if(day<1||day>days)el.className='other-month';if(date.toDateString()===now.toDateString()){el.classList.add('today');el.setAttribute('aria-label','Hoy, '+date.toLocaleDateString('es-AR'));}$('calendar-days').append(el);}
}
function renderTaskView(){
  const windows=[...manager.windows.values()].filter(s=>s.desktop===manager.currentDesktop);
  $('task-switcher').innerHTML=`<div class="section-heading"><strong>Vista de tareas</strong><button class="icon-button" data-close-panel aria-label="Cerrar vista de tareas">${icon('close')}</button></div><div class="virtual-desktops">${manager.desktops.map(d=>`<div class="virtual-desktop ${d.id===manager.currentDesktop?'selected':''}"><button data-switch-desktop="${d.id}"><span class="desktop-mini-preview"></span><strong>${escapeHTML(d.name)}</strong><small>${[...manager.windows.values()].filter(s=>s.desktop===d.id).length} ventanas</small></button>${manager.desktops.length>1?`<button class="remove-desktop" data-remove-desktop="${d.id}" aria-label="Cerrar ${d.name}">${icon('close')}</button>`:''}</div>`).join('')}<button class="new-desktop" data-action="new-desktop" ${manager.desktops.length>=8?'disabled':''}><span>＋</span>Nuevo escritorio</button></div><div class="task-cards">${windows.map(s=>`<div class="task-card"><button data-open="${s.id}"><div class="task-card-preview">${appIcon(s.id)}</div><span>${apps[s.id].title}</span><small>${s.minimized?'Minimizada':'Abierta'}</small></button><button class="task-card-close" data-close-task="${s.id}" aria-label="Cerrar ${apps[s.id].label}">${icon('close')}</button>${manager.desktops.length>1?`<select data-move-task="${s.id}" aria-label="Mover ${apps[s.id].label} a otro escritorio">${manager.desktops.map(d=>`<option value="${d.id}" ${s.desktop===d.id?'selected':''}>${d.name}</option>`).join('')}</select>`:''}</div>`).join('')||'<p class="muted">Este escritorio está vacío. Abrí una aplicación desde Inicio.</p>'}</div>`;
}
function taskView(){if(!$('task-switcher').hidden){closePanels(true);return;}showPanel('task-switcher');renderTaskView();$('task-switcher').querySelector('button')?.focus();}
function run(){showPanel('run-panel');$('run-error').textContent='';$('run-input').value=storage.get('last-run','');$('run-input').focus();$('run-input').select();}
function snapPicker(){
  if(!manager.active){toast('Abrí una ventana para elegir un diseño.');return;}
  const layouts=[['Mitades',['left','right']],['Tres columnas',['third-left','third-center','third-right']],['Cuadrantes',['top-left','top-right','bottom-left','bottom-right']],['Ventana amplia',['wide-left','third-right']],['Amplia a la derecha',['third-left','wide-right']]];
  showPanel('snap-panel');$('snap-panel').innerHTML=`<div class="section-heading"><strong>Elegí dónde acomodar la ventana</strong><button class="icon-button" data-close-panel aria-label="Cerrar diseños">${icon('close')}</button></div><p class="muted">${innerWidth<=600?'En pantallas pequeñas las ventanas usan todo el espacio disponible.':escapeHTML(apps[manager.active].title)}</p><div class="snap-options">${layouts.map(([label,modes])=>`<div><span>${label}</span><div class="snap-option snap-${modes.length}">${modes.map((mode,index)=>`<button data-action="snap:${mode}" aria-label="${label}, zona ${index+1}" ${innerWidth<=600?'disabled':''}>${index+1}</button>`).join('')}</div></div>`).join('')}</div>`;$('snap-panel').querySelector('button')?.focus();
}
function menuItem(label,action,symbol='code',shortcut='',disabled=false,checked=null){return `<button role="${checked===null?'menuitem':'menuitemcheckbox'}" ${checked===null?'':`aria-checked="${checked}"`} data-menu-action="${action}" ${disabled?'disabled':''}>${icon(symbol)}<span>${label}</span>${shortcut?`<kbd>${shortcut}</kbd>`:''}${checked===true?'<span class="menu-check">✓</span>':''}</button>`;}
function showMenu(content,x,y,target=null){
  showPanel('context-menu');menuTarget=target;const menu=$('context-menu');menu.innerHTML=content;
  menu.style.left=Math.max(8,Math.min(x,innerWidth-menu.offsetWidth-8))+'px';menu.style.top=Math.max(8,Math.min(y,innerHeight-menu.offsetHeight-56))+'px';menu.querySelector('button:not(:disabled)')?.focus();
}
function desktopMenu(event){
  const shortcut=event.target.closest('[data-desktop-app]');
  if(shortcut){const id=shortcut.dataset.desktopApp;showMenu(menuItem('Abrir','open:'+id,'folder')+'<hr>'+menuItem('Cambiar nombre','rename','paint','F2')+menuItem('Enviar acceso a la papelera','delete-shortcut','trash','Supr',id==='recycle')+'<hr>'+menuItem('Propiedades del portafolio','open:system','settings'),event.clientX,event.clientY,{kind:'shortcut',id});return;}
  showMenu(`<div class="menu-section-label">Ver</div>${['large','medium','small'].map((size,i)=>menuItem(['Iconos grandes','Iconos medianos','Iconos pequeños'][i],'icon-size:'+size,'desktop','',false,preferences.iconSize===size)).join('')}${menuItem('Mostrar iconos del escritorio','show-icons','desktop','',false,preferences.showIcons)}<hr>${menuItem('Ordenar por nombre','sort-icons','folder')}${menuItem('Actualizar','refresh','refresh','F5')}${menuItem('Siguiente fondo de escritorio','next-wallpaper','paint')}<hr>${menuItem('Abrir en Terminal','open:terminal','terminal')}${menuItem('Configuración del escritorio','open:settings:desktop','settings')}${menuItem('Personalizar','open:settings:background','paint')}`,event.clientX,event.clientY);
}
function windowMenu(id=manager.active,x,y){
  const state=manager.windows.get(id);if(!state)return;const r=state.el.getBoundingClientRect();
  showMenu(menuItem('Restaurar','restore','restore','',state.mode==='normal')+menuItem('Mover','move-window','desktop','',state.mode!=='normal'||innerWidth<=600)+menuItem('Tamaño','resize-window','maximize','',state.mode!=='normal'||innerWidth<=600)+menuItem('Minimizar','minimize','minimize')+menuItem('Maximizar','maximize','maximize','',state.mode==='max')+menuItem('Diseños de acoplamiento','snap','taskview')+'<hr>'+menuItem('Cerrar','close','close','Alt F4'),x??r.x+10,y??r.y+35,{kind:'window',id});
}
function powerUser(){const r=$('start-button').getBoundingClientRect();showMenu(menuItem('Aplicaciones del portafolio','open:explorer','folder')+menuItem('Administrador de tareas','open:taskmanager','taskview')+menuItem('Configuración','open:settings','settings')+menuItem('Terminal','open:terminal','terminal')+menuItem('Ejecutar','run','code')+'<hr>'+menuItem('Bloquear','lock','lock')+menuItem('Suspender escritorio','sleep','moon')+menuItem('Reiniciar escritorio','restart','refresh')+menuItem('Apagar escritorio','shutdown','power')+'<hr>'+menuItem('Escritorio','desktop','desktop'),r.x,innerHeight-520);}
function rename(id){if(!id)return;renameTarget=id;showPanel('rename-panel');$('rename-input').value=shortcutLabel(id);$('rename-input').focus();$('rename-input').select();}
function lock(){closePanels();login.lock();}
function resetSession(){[...manager.windows.keys()].forEach(id=>manager.close(id));manager.desktops=[{id:1,name:'Escritorio 1'}];manager.currentDesktop=1;manager.desktopCounter=1;manager.hiddenWindows=[];closePanels();}
function restart(){resetSession();login.lock();}
function shutdown(){resetSession();login.off();}
function beginKeyboardLayout(id,type){const state=manager.windows.get(id);if(!state)return;keyboardLayout={id,type,original:{...state.rect}};closePanels();manager.focus(id);toast(`${type==='move'?'Mover':'Cambiar tamaño'}: usá las flechas. Enter confirma; Esc cancela.`);}
async function fullscreen(){try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen();}catch{toast('La pantalla completa no está disponible en este navegador.');}}

function handleAction(action,target=menuTarget){
  const id=target?.kind==='window'?target.id:manager.active;
  if(action.startsWith('open:')){openApp(action.slice(5));return;}
  if(action.startsWith('snap:')){closePanels();if(id&&innerWidth>600)manager.snap(id,action.slice(5));return;}
  if(action.startsWith('icon-size:')){preferences.set('iconSize',action.slice(10));closePanels();return;}
  if(action.startsWith('pinned-')){const app=pinnedApps()[Number(action.slice(7))-1];if(app)openApp(app);return;}
  switch(action){
    case 'start':togglePanel('start-menu');break;
    case 'search':togglePanel('start-menu',true);break;
    case 'explorer':case 'settings':case 'taskmanager':openApp(action);break;
    case 'accessibility':openApp('settings:accessibility');break;
    case 'desktop':closePanels();manager.showDesktop();break;
    case 'minimize-all':closePanels();manager.minimizeAll();break;
    case 'restore-all':closePanels();[...manager.windows.values()].filter(s=>s.desktop===manager.currentDesktop).forEach(s=>manager.open(s.id));break;
    case 'lock':case 'sleep':lock();break;
    case 'restart':restart();break;
    case 'shutdown':shutdown();break;
    case 'quick':togglePanel('quick-settings');break;
    case 'toggle-transparency':preferences.set('transparency',!preferences.transparency);break;
    case 'calendar':calendarOffset=0;togglePanel('calendar-panel');break;
    case 'run':run();break;
    case 'tasks':taskView();break;
    case 'power-user':powerUser();break;
    case 'window-menu':windowMenu();break;
    case 'snap':if(id)manager.focus(id);snapPicker();break;
    case 'snap-left':case 'snap-right':if(id&&innerWidth>600)manager.snap(id,action.slice(5));break;
    case 'maximize':closePanels();if(id)manager.snap(id,'max');break;
    case 'restore':closePanels();if(id){manager.restore(manager.windows.get(id));manager.focus(id);}break;
    case 'down':if(id)manager.down(id);break;
    case 'minimize':closePanels();if(id)manager.minimize(id);break;
    case 'close':closePanels();if(id)manager.close(id);break;
    case 'move-window':beginKeyboardLayout(id,'move');break;
    case 'resize-window':beginKeyboardLayout(id,'resize');break;
    case 'cycle':case 'cycle-back':manager.cycle(action==='cycle'?1:-1);break;
    case 'new-desktop':if(!manager.createDesktop())toast('Podés usar hasta 8 escritorios virtuales.');if(!$('task-switcher').hidden)renderTaskView();else{showPanel('task-switcher');renderTaskView();}break;
    case 'previous-desktop':manager.adjacentDesktop(-1);break;
    case 'next-desktop':manager.adjacentDesktop(1);break;
    case 'close-desktop':manager.removeDesktop(manager.currentDesktop);break;
    case 'tray':closePanels();$('quick-button').focus();break;
    case 'help':openApp('shortcuts');break;
    case 'refresh':renderDesktop();closePanels();toast('Escritorio actualizado');break;
    case 'sort-icons':sortShortcuts();closePanels();break;
    case 'reset-icons':resetShortcuts();closePanels();break;
    case 'show-icons':preferences.set('showIcons',!preferences.showIcons);closePanels();break;
    case 'next-wallpaper':preferences.nextWallpaper();closePanels();break;
    case 'reset-preferences':preferences.reset();toast('Personalización restablecida');break;
    case 'rename':rename(target?.kind==='shortcut'?target.id:document.activeElement.closest('[data-desktop-app]')?.dataset.desktopApp);break;
    case 'delete-shortcut':{const shortcut=target?.kind==='shortcut'?target.id:document.activeElement.closest('[data-desktop-app]')?.dataset.desktopApp;if(shortcut&&shortcut!=='recycle'){deleteShortcut(shortcut);closePanels();toast('Acceso enviado a la papelera. Ctrl Z para restaurarlo.');}break;}
    case 'undo-shortcut':undoShortcut();break;
    case 'find':$('win-explorer')?.querySelector('.explorer-search input')?.focus();break;
    case 'pin':{const app=target?.id;if(app){const ids=pinnedApps();storage.set('taskbar-pinned',ids.includes(app)?ids.filter(item=>item!==app):[...ids,app]);renderTaskbar();}closePanels();break;}
    case 'fullscreen':fullscreen();break;
  }
}

hydrateIcons();renderDesktop();renderStart();renderTaskbar();updateClock();setInterval(updateClock,15000);
manager.addEventListener('change',()=>{renderTaskbar();if(!$('task-switcher').hidden)renderTaskView();});
document.addEventListener('desktop:change',renderDesktop);
document.addEventListener('shell:window-menu',event=>windowMenu(event.detail.id,event.detail.x,event.detail.y));
document.addEventListener('click',event=>{
  if(event.target.closest('[data-close-panel]')){closePanels(true);return;}
  const menuAction=event.target.closest('[data-menu-action]');if(menuAction){handleAction(menuAction.dataset.menuAction);return;}
  const launcher=event.target.closest('[data-open]');if(launcher){openApp(launcher.dataset.open);return;}
  const action=event.target.closest('[data-action]');if(action&&!action.closest('.window-controls')){handleAction(action.dataset.action,null);return;}
  if(!event.target.closest('.shell-panel,.taskbar'))closePanels();
});
$('start-button').onclick=()=>handleAction('start');$('search-button').onclick=()=>handleAction('search');
$('start-search').oninput=renderStart;
$('start-search').onkeydown=event=>{if(event.key==='Enter'){$('pinned-apps').querySelector('button')?.click();event.preventDefault();}else if(event.key==='ArrowDown'){event.preventDefault();$('pinned-apps').querySelector('button')?.focus();}};
$('all-apps').onclick=()=>{allApps=!allApps;renderStart();};
$('quick-button').onclick=()=>handleAction('quick');$('clock-button').onclick=()=>handleAction('calendar');
$('calendar-prev').onclick=()=>{calendarOffset--;renderCalendar();};$('calendar-next').onclick=()=>{calendarOffset++;renderCalendar();};
$('task-view-button').onclick=()=>taskView();$('show-desktop').onclick=()=>handleAction('desktop');
$('quick-theme').onclick=()=>preferences.setTheme(preferences.theme==='light'?'dark':'light');$('quick-motion').onclick=()=>preferences.toggleMotion();$('quick-fullscreen').onclick=fullscreen;
$('power-button').onclick=()=>{const open=$('power-menu').hidden;$('power-menu').hidden=!open;$('power-button').setAttribute('aria-expanded',String(open));};
$('lock-button').onclick=lock;$('restart-button').onclick=restart;
$('run-form').onsubmit=event=>{event.preventDefault();const command=$('run-input').value;const route=resolveRunCommand(command);if(!route){$('run-error').textContent=`No encontramos «${command}». Probá explorer, projects, taskmgr, wt o ms-settings:.`;$('run-input').focus();return;}storage.set('last-run',command);openApp(route);};
$('rename-form').onsubmit=event=>{event.preventDefault();renameShortcut(renameTarget,$('rename-input').value);closePanels();};
$('task-switcher').addEventListener('click',event=>{const select=event.target.closest('[data-switch-desktop]'),remove=event.target.closest('[data-remove-desktop]'),close=event.target.closest('[data-close-task]');if(select)manager.switchDesktop(Number(select.dataset.switchDesktop));if(remove)manager.removeDesktop(Number(remove.dataset.removeDesktop));if(close)manager.close(close.dataset.closeTask);});
$('task-switcher').addEventListener('change',event=>{if(event.target.matches('[data-move-task]'))manager.moveToDesktop(event.target.dataset.moveTask,Number(event.target.value));});
$('desktop').addEventListener('contextmenu',event=>{if(event.target.closest('.os-window'))return;event.preventDefault();desktopMenu(event);});
$('taskbar').addEventListener('contextmenu',event=>{
  event.preventDefault();if(event.target.closest('#start-button')){powerUser();return;}
  const app=event.target.closest('[data-task]')?.dataset.task;
  showMenu((app?menuItem(apps[app].label,'open:'+app,'folder')+menuItem(pinnedApps().includes(app)?'Desanclar de la barra de tareas':'Anclar a la barra de tareas','pin','desktop')+menuItem('Cerrar ventana','close','close','',!manager.windows.has(app))+'<hr>':'')+menuItem('Administrador de tareas','open:taskmanager','taskview')+menuItem('Configuración de la barra','open:settings:desktop','settings'),event.clientX,event.clientY,app?{kind:'window',id:app}:null);
});
document.addEventListener('keydown',event=>{
  if(login.active)return;
  if(event.key==='Meta'){metaOnly=true;return;}metaOnly=false;
  if(keyboardLayout){
    if(event.key==='Enter'){event.preventDefault();keyboardLayout=null;return;}
    const state=manager.windows.get(keyboardLayout.id);
    if(event.key==='Escape'){event.preventDefault();if(state){state.rect=keyboardLayout.original;manager.apply(state);}keyboardLayout=null;return;}
    if(state&&event.key.startsWith('Arrow')){event.preventDefault();const amount=event.shiftKey?40:10,dx=event.key==='ArrowLeft'?-amount:event.key==='ArrowRight'?amount:0,dy=event.key==='ArrowUp'?-amount:event.key==='ArrowDown'?amount:0;const r=state.rect;state.rect=clampRect(keyboardLayout.type==='move'?{...r,x:r.x+dx,y:r.y+dy}:{...r,width:r.width+dx,height:r.height+dy},manager.area);manager.apply(state);return;}
  }
  if(event.key==='Escape'){event.preventDefault();closePanels(true);return;}
  const panel=panels.map($).find(p=>!p.hidden),editing=!!event.target.closest('input,textarea,select,[contenteditable="true"]');
  if(panel&&event.key==='Tab'){
    const items=[...panel.querySelectorAll('button,input,select,[tabindex="0"]')].filter(el=>el.getClientRects().length&&!el.disabled),first=items[0],last=items.at(-1);
    if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus();}
  }
  if(panel&&!editing&&['ArrowDown','ArrowUp','Home','End'].includes(event.key)){
    const items=[...panel.querySelectorAll('button')].filter(el=>el.getClientRects().length&&!el.disabled);if(items.length){event.preventDefault();const index=items.indexOf(document.activeElement),next=event.key==='Home'?0:event.key==='End'?items.length-1:(index+(event.key==='ArrowDown'?1:-1)+items.length)%items.length;items[next].focus();return;}
  }
  const action=shortcutAction(event,{editing,desktopSelected:!!event.target.closest('[data-desktop-app]'),explorerActive:manager.active==='explorer'});
  if(action){event.preventDefault();handleAction(action,null);return;}
  if(!$('start-menu').hidden&&!editing&&!event.ctrlKey&&!event.altKey&&!event.metaKey&&event.key.length===1){event.preventDefault();$('start-search').focus();$('start-search').value+=event.key;renderStart();}
});
document.addEventListener('keyup',event=>{if(event.key==='Meta'&&metaOnly&&!login.active){metaOnly=false;handleAction('start');}});

window.openWindow=openApp;window.showToast=toast;window.currentLang='es';
preferences.sync();login.start();
