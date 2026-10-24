export const shortcuts = [
  ['Inicio','⊞ / Ctrl + Esc','Ctrl + Alt + K','start'],
  ['Buscar aplicaciones','⊞ + S','Ctrl + K','search'],
  ['Explorador de archivos','⊞ + E','Ctrl + Alt + E','explorer'],
  ['Configuración','⊞ + I','Ctrl + Alt + I','settings'],
  ['Accesibilidad','⊞ + U','Ctrl + Alt + U','accessibility'],
  ['Mostrar / restaurar escritorio','⊞ + D','Ctrl + Alt + D','desktop'],
  ['Minimizar ventanas','⊞ + M','Ctrl + Alt + M','minimize-all'],
  ['Restaurar ventanas minimizadas','⊞ + Mayús + M','Ctrl + Alt + Mayús + M','restore-all'],
  ['Bloquear este escritorio','⊞ + L','Ctrl + Alt + L','lock'],
  ['Configuración rápida','⊞ + A','Ctrl + Alt + A','quick'],
  ['Calendario y notificaciones','⊞ + N','Ctrl + Alt + N','calendar'],
  ['Ejecutar','⊞ + R','Ctrl + Alt + R','run'],
  ['Menú de acceso rápido','⊞ + X','Ctrl + Alt + X','power-user'],
  ['Vista de tareas','⊞ + Tab','Ctrl + Alt + T','tasks'],
  ['Diseños de acoplamiento','⊞ + Z','Ctrl + Alt + Z','snap'],
  ['Acoplar a la izquierda / derecha','⊞ + ← / →','Ctrl + Alt + ← / →','snap-arrows'],
  ['Maximizar / restaurar o minimizar','⊞ + ↑ / ↓','Ctrl + Alt + ↑ / ↓','vertical-arrows'],
  ['Cambiar de ventana','Alt + Tab / Alt + Mayús + Tab','Ctrl + F6 / Ctrl + Mayús + F6','cycle'],
  ['Menú de la ventana','Alt + Espacio','Ctrl + Alt + W','window-menu'],
  ['Cerrar ventana activa','Alt + F4','Ctrl + Alt + Q','close'],
  ['Administrador de tareas del portafolio','Ctrl + Mayús + Esc','Ctrl + Alt + P','taskmanager'],
  ['Crear escritorio virtual','⊞ + Ctrl + D','Ctrl + Alt + Mayús + D','new-desktop'],
  ['Cambiar de escritorio virtual','⊞ + Ctrl + ← / →','Ctrl + Alt + [ / ]','switch-desktop'],
  ['Cerrar escritorio virtual','⊞ + Ctrl + F4','Ctrl + Alt + Mayús + Q','close-desktop'],
  ['Abrir app anclada de la barra','⊞ + 1…9','Ctrl + Alt + 1…9','pinned'],
  ['Enfocar la bandeja del sistema','⊞ + B','Ctrl + Alt + B','tray'],
  ['Ayuda y todos los atajos','F1','Ctrl + Alt + H','help'],
  ['Actualizar el escritorio','F5','Ctrl + Alt + F5','refresh'],
  ['Cambiar nombre de un acceso','F2','F2','rename'],
  ['Enviar acceso a la papelera','Supr','Supr','delete-shortcut'],
  ['Restaurar el último acceso eliminado','Ctrl + Z','Ctrl + Z','undo-shortcut'],
  ['Buscar dentro del Explorador','Ctrl + F','Ctrl + F','find'],
  ['Cambiar al siguiente fondo','—','Ctrl + Alt + PageDown','next-wallpaper'],
];

// Only handles delivered browser events. OS shortcuts cannot be captured reliably.
export function shortcutAction(event,{editing=false,desktopSelected=false,explorerActive=false}={}) {
  if(event.getModifierState?.('AltGraph'))return null;
  const key=event.key.toLowerCase(),ctrl=event.ctrlKey,alt=event.altKey,shift=event.shiftKey,win=event.metaKey;
  if((ctrl||win)&&!alt&&!shift&&key==='k')return 'search';
  if(ctrl&&alt&&!win){
    if(shift){return {d:'new-desktop',q:'close-desktop',m:'restore-all'}[key]||null;}
    const action={k:'start',s:'search',e:'explorer',i:'settings',u:'accessibility',d:'desktop',m:'minimize-all',l:'lock',a:'quick',n:'calendar',r:'run',x:'power-user',t:'tasks',z:'snap',w:'window-menu',q:'close',p:'taskmanager',h:'help',b:'tray',f5:'refresh',pagedown:'next-wallpaper','[':'previous-desktop',']':'next-desktop',arrowleft:'snap-left',arrowright:'snap-right',arrowup:'maximize',arrowdown:'down'}[key];
    return action||(/^[1-9]$/.test(key)?`pinned-${key}`:null);
  }
  if(win&&!alt){
    if(ctrl)return {d:'new-desktop',f4:'close-desktop',arrowleft:'previous-desktop',arrowright:'next-desktop'}[key]||null;
    if(shift&&key==='m')return 'restore-all';
    if(shift)return null;
    return {s:'search',e:'explorer',i:'settings',u:'accessibility',d:'desktop',m:'minimize-all',l:'lock',a:'quick',n:'calendar',r:'run',x:'power-user',tab:'tasks',z:'snap',b:'tray',arrowleft:'snap-left',arrowright:'snap-right',arrowup:'maximize',arrowdown:'down'}[key]||(/^[1-9]$/.test(key)?`pinned-${key}`:null);
  }
  if(alt&&!ctrl){if(key==='tab')return shift?'cycle-back':'cycle';if(key==='f4')return 'close';if(key===' ')return 'window-menu';}
  if(ctrl&&shift&&key==='escape')return 'taskmanager';
  if(ctrl&&key==='escape')return 'start';
  if(ctrl&&key==='f6')return shift?'cycle-back':'cycle';
  if(editing)return null;
  if(key==='f1')return 'help';
  if(key==='f5')return 'refresh';
  if(desktopSelected&&key==='f2')return 'rename';
  if(desktopSelected&&key==='delete')return 'delete-shortcut';
  if(ctrl&&key==='z')return 'undo-shortcut';
  if(ctrl&&key==='f'&&explorerActive)return 'find';
  return null;
}

const aliases={explorer:'explorer','explorer.exe':'explorer',projects:'projects',proyectos:'projects',resume:'resume',cv:'resume',contact:'contact',contacto:'contact',about:'about',chat:'chat',recruiter:'recruiter',wt:'terminal',cmd:'terminal',powershell:'terminal',terminal:'terminal',taskmgr:'taskmanager','taskmgr.exe':'taskmanager',help:'shortcuts',ayuda:'shortcuts',winver:'system',control:'settings','ms-settings:':'settings','ms-settings:personalization':'settings','ms-settings:personalization-background':'settings:background','ms-settings:taskbar':'settings:desktop','ms-settings:easeofaccess':'settings:accessibility'};
export function resolveRunCommand(value){return aliases[value.trim().toLowerCase()]||null;}
