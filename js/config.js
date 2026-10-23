export const apps = {
  explorer: { title:'Explorador de archivos', label:'Explorador', width:1000, height:650 },
  about: { title:'Sobre mí', label:'Sobre mí', width:900, height:650, keywords:'ivan perfil experiencia habilidades educación skills' },
  projects: { title:'Proyectos', label:'Proyectos', width:960, height:640, keywords:'adaptia estudio oso chappie github react' },
  resume: { title:'Iván_Pieretto_CV.pdf', label:'Currículum', width:870, height:680, keywords:'cv curriculum pdf descargar resume' },
  contact: { title:'Contacto', label:'Contacto', width:820, height:570, keywords:'email correo whatsapp linkedin' },
  terminal: { title:'Terminal', label:'Terminal', width:750, height:470, keywords:'powershell comandos consola' },
  chat: { title:'Asistente de Iván', label:'Iván AI', width:600, height:600, keywords:'chat preguntas asistente' },
  settings: { title:'Configuración', label:'Configuración', width:850, height:620, keywords:'tema oscuro claro fondo personalizar' },
  recycle: { title:'Papelera de reciclaje', label:'Papelera de reciclaje', width:760, height:480 },
  recruiter: { title:'Resumen para reclutadores', label:'Para reclutadores', width:800, height:590, keywords:'reclutador recruiter contratar resumen ejecutivo' },
  doom: { title:'DOOM · DOS', label:'DOOM', width:800, height:600 },
  taskmanager: {title:'Administrador de tareas',label:'Administrador de tareas',width:850,height:550,keywords:'procesos apps tareas cerrar'},
  shortcuts: {title:'Atajos de teclado',label:'Atajos de teclado',width:960,height:680,keywords:'ayuda teclado windows combinaciones'},
  system: {title:'Acerca de Portfolio OS',label:'Acerca del sistema',width:630,height:480,keywords:'winver version windows sistema'},
};
export const pinned = ['explorer','about','projects','resume','contact','terminal','chat','settings','recruiter','shortcuts','taskmanager','system'];
export const taskbarPinned = ['explorer','projects','terminal','contact'];
export const storage = {
  get(key, fallback) { try { return JSON.parse(localStorage.getItem(`ivanos:${key}`)) ?? fallback; } catch { return fallback; } },
  set(key, value) { try { localStorage.setItem(`ivanos:${key}`,JSON.stringify(value)); } catch { /* Storage can be unavailable in private browsing. */ } },
};
export const normalize = value => value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
