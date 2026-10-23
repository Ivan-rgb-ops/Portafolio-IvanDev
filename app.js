import {apps,pinned,taskbarPinned,normalize} from './js/config.js';
import {icon,appIcon,hydrateIcons} from './js/icons.js';
import {WindowManager} from './js/window-manager.js';
import {createAppRenderer} from './js/apps.js';
import {Preferences} from './js/preferences.js';
import {renderDesktop as drawDesktop} from './js/desktop.js';

const $=id=>document.getElementById(id);
let toastTimer,allApps=false,calendarOffset=0;
const preferences=new Preferences();
const manager=new WindowManager($('windows'),createAppRenderer({open:id=>openApp(id),notify:toast,preferences}));

function toast(message) {
  clearTimeout(toastTimer);$('toast').textContent=message;$('toast').hidden=false;
  toastTimer=setTimeout(()=>$('toast').hidden=true,4200);
}

const panels=['start-menu','quick-settings','calendar-panel','context-menu','task-switcher'];
const panelButtons={'start-menu':'start-button','quick-settings':'quick-button','calendar-panel':'clock-button','task-switcher':'task-view-button'};
function closePanels(returnFocus=false) {
  let lastButton;
  panels.forEach(id=>{if(!$(id).hidden)lastButton=panelButtons[id];$(id).hidden=true;});
  Object.values(panelButtons).forEach(id=>$(id).setAttribute('aria-expanded','false'));
  $('power-menu').hidden=true;$('power-button').setAttribute('aria-expanded','false');
  if(returnFocus&&lastButton)$(lastButton).focus();
}
function togglePanel(id,search=false) {
  const shouldOpen=$(id).hidden;closePanels();
  if(!shouldOpen)return;
  $(id).hidden=false;if(panelButtons[id])$(panelButtons[id]).setAttribute('aria-expanded','true');
  if(id==='start-menu') {
    $('start-search').value='';allApps=false;renderStart();
    (search?$('start-search'):$('all-apps')).focus();
  } else if(id==='calendar-panel')renderCalendar();
}
function openApp(id) {
  closePanels();const state=manager.open(id);
  if(id==='terminal')state?.el.querySelector('input')?.focus();
}

function renderStart() {
  const query=normalize($('start-search').value.trim());
  const ids=(allApps?Object.keys(apps).filter(id=>id!=='doom'):pinned).filter(id=>normalize(`${apps[id].label} ${apps[id].keywords||''}`).includes(query));
  if(allApps)ids.sort((a,b)=>apps[a].label.localeCompare(apps[b].label,'es'));
  $('pinned-apps').innerHTML=ids.map(id=>`<button data-open="${id}">${appIcon(id)}<span>${apps[id].label}</span></button>`).join('')||'<p class="no-results">No encontramos esa aplicación.</p>';
  $('pinned-title').textContent=query?'Resultados de búsqueda':allApps?'Todas las aplicaciones':'Anclado';
  $('all-apps').innerHTML=allApps?'‹ Volver':'Todas las aplicaciones <span>›</span>';
  $('recommended').hidden=!!query||allApps;
}

function renderTaskbar() {
  const ids=[...new Set([...taskbarPinned,...manager.windows.keys()])];
  // Reuse buttons so window focus updates never replace a pointer target mid-click.
  const tray=$('taskbar-apps');
  for(const el of [...tray.children])if(!ids.includes(el.dataset.task))el.remove();
  ids.forEach(id=>{
    let button=tray.querySelector(`[data-task="${id}"]`);
    if(!button){button=document.createElement('button');button.className='taskbar-button taskbar-app';button.dataset.task=id;button.innerHTML=appIcon(id);button.title=apps[id].title;button.setAttribute('aria-label',apps[id].label);button.onclick=()=>{closePanels();manager.taskbarClick(id);};tray.append(button);}
    const state=manager.windows.get(id);button.classList.toggle('is-open',!!state);button.classList.toggle('is-active',manager.active===id&&!state?.minimized);button.setAttribute('aria-pressed',String(manager.active===id&&!state?.minimized));
  });
}

function renderDesktop() {
  drawDesktop($('desktop-icons'),openApp);
}

function updateClock() {
  const now=new Date();
  const time=now.toLocaleTimeString('es-AR',{hour:'2-digit',minute:'2-digit',hour12:false});
  $('clock-time').textContent=time;$('clock-time').dateTime=now.toISOString();
  $('clock-date').textContent=now.toLocaleDateString('es-AR');
  $('clock-date').dateTime=now.toISOString().slice(0,10);
  $('clock-button').setAttribute('aria-label',`${time}, ${now.toLocaleDateString('es-AR',{dateStyle:'full'})}. Abrir calendario`);
  $('lock-time').textContent=time;$('lock-date').textContent=now.toLocaleDateString('es-AR',{weekday:'long',day:'numeric',month:'long'});
}

function renderCalendar() {
  const now=new Date(),month=new Date(now.getFullYear(),now.getMonth()+calendarOffset,1);
  $('calendar-month').textContent=month.toLocaleDateString('es-AR',{month:'long',year:'numeric'});
  const first=(month.getDay()+6)%7,days=new Date(month.getFullYear(),month.getMonth()+1,0).getDate();
  $('calendar-days').replaceChildren();
  for(let i=0;i<42;i++){
    const day=i-first+1,date=new Date(month.getFullYear(),month.getMonth(),day),el=document.createElement('span');el.textContent=date.getDate();
    if(day<1||day>days)el.className='other-month';
    if(date.toDateString()===now.toDateString()){el.classList.add('today');el.setAttribute('aria-label','Hoy, '+date.toLocaleDateString('es-AR'));}
    $('calendar-days').append(el);
  }
}

function taskView() {
  if(!$('task-switcher').hidden){closePanels();return;}
  closePanels();const windows=[...manager.windows.values()];
  $('task-switcher').innerHTML='<div class="section-heading"><strong>Ventanas abiertas</strong><button class="icon-button" id="close-task-view" aria-label="Cerrar vista de tareas">'+icon('close')+'</button></div>'+(windows.length?'<div class="task-cards">'+windows.map(s=>`<button data-open="${s.id}"><div class="task-card-preview">${appIcon(s.id)}</div><span>${apps[s.id].title}</span><small>${s.minimized?'Minimizada':'Abierta'}</small></button>`).join('')+'</div>':'<p class="muted">Todavía no hay ventanas abiertas. Abrí una aplicación desde Inicio.</p>');
  $('task-switcher').hidden=false;$('task-view-button').setAttribute('aria-expanded','true');
  $('close-task-view').onclick=()=>closePanels(true);
}

function lock() {closePanels();$('lock-screen').hidden=false;$('desktop').inert=true;$('taskbar').inert=true;$('unlock-button').focus();}
function unlock() {$('lock-screen').hidden=true;$('desktop').inert=false;$('taskbar').inert=false;if(manager.active)manager.focus(manager.active);else $('start-button').focus();}

hydrateIcons();renderDesktop();renderStart();renderTaskbar();updateClock();
setInterval(updateClock,1000*15);
manager.addEventListener('change',renderTaskbar);

document.addEventListener('click',event=>{
  const launcher=event.target.closest('[data-open]');if(launcher){openApp(launcher.dataset.open);return;}
  if(!event.target.closest('.shell-panel,.taskbar'))closePanels();
});
$('start-button').onclick=()=>togglePanel('start-menu');
$('search-button').onclick=()=>togglePanel('start-menu',true);
$('start-search').oninput=renderStart;
$('start-search').onkeydown=event=>{if(event.key==='Enter')$('pinned-apps').querySelector('button')?.click();};
$('all-apps').onclick=()=>{allApps=!allApps;renderStart();};
$('quick-button').onclick=()=>togglePanel('quick-settings');
$('clock-button').onclick=()=>{calendarOffset=0;togglePanel('calendar-panel');};
$('calendar-prev').onclick=()=>{calendarOffset--;renderCalendar();};
$('calendar-next').onclick=()=>{calendarOffset++;renderCalendar();};
$('task-view-button').onclick=taskView;
$('show-desktop').onclick=()=>{closePanels();manager.showDesktop();};
$('show-desktop-menu').onclick=()=>{closePanels();manager.showDesktop();};
$('refresh-desktop').onclick=()=>{renderDesktop();closePanels();toast('Escritorio actualizado');};
$('quick-theme').onclick=()=>preferences.setTheme(preferences.theme==='light'?'dark':'light');
$('quick-motion').onclick=()=>preferences.toggleMotion();
$('quick-fullscreen').onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen();}catch{toast('La pantalla completa no está disponible en este navegador.');}};
$('power-button').onclick=()=>{const open=$('power-menu').hidden;$('power-menu').hidden=!open;$('power-button').setAttribute('aria-expanded',String(open));};
$('lock-button').onclick=lock;
$('unlock-button').onclick=unlock;
$('restart-button').onclick=()=>{[...manager.windows.keys()].forEach(id=>manager.close(id));closePanels();openApp('explorer');toast('Escritorio reiniciado');};

$('desktop').addEventListener('contextmenu',event=>{
  if(event.target.closest('.os-window'))return;event.preventDefault();closePanels();const menu=$('context-menu');menu.hidden=false;
  menu.style.left=Math.max(8,Math.min(event.clientX,innerWidth-menu.offsetWidth-8))+'px';menu.style.top=Math.max(8,Math.min(event.clientY,innerHeight-menu.offsetHeight-56))+'px';
  menu.querySelector('button').focus();
});
document.addEventListener('keydown',event=>{
  if(!$('lock-screen').hidden){if(event.key==='Enter'||event.key===' ') {event.preventDefault();unlock();}return;}
  const editing=event.target.closest('input,textarea,select,[contenteditable="true"]');
  if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==='k'){event.preventDefault();togglePanel('start-menu',true);return;}
  if(event.key==='Escape'){closePanels(true);return;}
  if(event.key==='Tab') {
    const panel=panels.map($).find(p=>!p.hidden);
    if(panel){const focusable=[...panel.querySelectorAll('button,input,[tabindex="0"]')].filter(el=>el.getClientRects().length);const first=focusable[0],last=focusable.at(-1);if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus();}}
  }
  if(editing)return;
  if(event.ctrlKey&&event.altKey){
    if(event.key.toLowerCase()==='d'){event.preventDefault();manager.showDesktop();}
    else if(event.key==='ArrowLeft'||event.key==='ArrowRight'){event.preventDefault();if(manager.active)manager.snap(manager.active,event.key==='ArrowLeft'?'left':'right');}
    else if(event.key==='ArrowUp'){event.preventDefault();if(manager.active)manager.maximize(manager.active);}
  }
  if(event.ctrlKey&&event.key==='F6'){event.preventDefault();manager.cycle();}
});

// Compatibility boundary for the retained, optional terminal easter eggs.
window.openWindow=openApp;window.showToast=toast;window.currentLang='es';
openApp('explorer');
