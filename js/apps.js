import {apps, normalize} from './config.js';
import {icon, appIcon} from './icons.js';
import {renderSettings} from './settings.js';
import {renderTaskManager,renderRecycle,renderSystemApp} from './system-apps.js';
import {renderProjectPreviews} from './project-previews.js';

const folders=[['projects','Proyectos','3 proyectos destacados'],['about','Sobre mí','Mi recorrido y habilidades'],['resume','Documentos','Currículum en PDF'],['contact','Contacto','Conectemos']];
const files=[['resume','Iván_Pieretto_CV.pdf','Documento PDF · Currículum'],['projects','adaptIA','Proyecto · React, IA y Vite'],['projects','Estudio el Oso','Proyecto · Three.js y GSAP'],['projects','Chappie-bot','Proyecto · Python e IA local']];

export function createAppRenderer({open,notify,preferences,getManager,action}) {
  return function render(id,body) {
    const template=document.getElementById(`app-${id}`);
    if(template)body.append(template.content.cloneNode(true));
    else if(id==='explorer')renderExplorer(body,open);
    else if(id==='settings')renderSettings(body,preferences,{notify,action});
    else if(id==='terminal')renderTerminal(body,open,notify,preferences);
    else if(id==='chat')renderChat(body);
    else if(id==='recruiter')body.innerHTML=`<div class="recruiter-summary"><span class="eyebrow">RESUMEN PARA RECLUTADORES</span><h1>Iván Pieretto</h1><p>Desarrollo de software · Front-End & IA</p><span class="availability"><i></i> Disponible para trabajar</span><p class="muted">Rosario, Santa Fe, Argentina</p><h2>Perfil</h2><p>Busco desarrollarme profesionalmente como Software Developer, Front-End Developer o IT Trainee. Me apasiona resolver problemas reales con tecnología, construir aplicaciones y explorar flujos con inteligencia artificial.</p><h2>Proyectos destacados</h2><div class="fluent-group"><button data-open="projects"><strong>adaptIA</strong><span>Adaptación y optimización de currículums con IA</span>${icon('chevron')}</button><button data-open="projects"><strong>Estudio el Oso</strong><span>Web para un estudio de fotografía con una lente 3D procedural</span>${icon('chevron')}</button><button data-open="projects"><strong>Chappie-bot</strong><span>Asistente local con control por voz y LLMs</span>${icon('chevron')}</button></div><h2>Stack</h2><p>JavaScript · TypeScript · Python · SQL · React · Vite · Three.js · GSAP · Node.js · React Native · Ollama · n8n</p><div class="recruiter-actions"><a class="fluent-btn-primary" href="Ivan_Pieretto_CV.pdf" download>${icon('download')} Descargar CV (PDF)</a><button class="fluent-btn-secondary" data-open="contact">${icon('mail')} Contactar</button><button class="fluent-btn-secondary" data-open="about">Ver formación y habilidades</button></div></div>`;
    else if(id==='recycle')renderRecycle(body);
    else if(id==='taskmanager')renderTaskManager(body,getManager());
    else if(id==='shortcuts'||id==='system')renderSystemApp(id,body);
    else if(id==='doom')body.innerHTML='<iframe id="doom-iframe" data-src="https://archive.org/embed/doom_dos" title="DOOM en DOS" allow="autoplay; fullscreen; gamepad" allowfullscreen></iframe>';
    bindPortfolio(body,notify);
    if(id==='projects')renderProjectPreviews(body);
  };
}

function renderExplorer(body,open) {
  body.innerHTML=`<div class="explorer-toolbar"><button class="icon-button" data-open="about" aria-label="Ir a mi perfil">${icon('user')}</button><div class="address-bar">${icon('home')}<span>Inicio</span>${icon('chevron')}<span class="muted">Iván Pieretto</span></div><label class="explorer-search">${icon('search')}<input aria-label="Buscar en el Explorador" placeholder="Buscar en Inicio" type="search"></label></div><div class="explorer-commandbar"><span>${icon('folder')} Mi portafolio</span><div><button class="subtle-button" id="explorer-sort">Ordenar A–Z</button><button class="subtle-button" id="explorer-view">Vista de lista</button></div></div><div class="explorer-layout"><aside class="explorer-sidebar"><button class="selected" data-home>${icon('home')} Inicio</button><span class="sidebar-label">Acceso rápido</span>${folders.map(([id,label])=>`<button data-open="${id}">${icon(id==='projects'?'folder':id==='about'?'user':id==='resume'?'download':'mail')} ${label}</button>`).join('')}<hr><button data-open="terminal">${icon('terminal')} Terminal</button><button data-open="settings">${icon('settings')} Configuración</button><div class="sidebar-bottom"><span class="avatar">IP</span><span>Iván Pieretto<small>Cuenta de visitante</small></span></div></aside><div class="explorer-main"><div class="explorer-welcome"><span class="eyebrow">MI ESPACIO DE TRABAJO</span><h1>Hola, soy Iván<span>.</span></h1><p>Desarrollo experiencias web y exploro lo que la IA hace posible.</p><span class="availability"><i></i> Disponible para trabajar</span></div><h2 class="explorer-section-title">${icon('folder')} Acceso rápido</h2><div class="folder-grid">${folders.map(([id,label,sub])=>`<button class="folder-card" data-open="${id}" data-search="${label} ${sub}">${appIcon(id==='resume'?'explorer':id)}<span>${label}<small>${sub}</small></span></button>`).join('')}</div><h2 class="explorer-section-title">${icon('refresh')} Archivos recomendados</h2><div class="file-table"><div class="file-table-heading"><span>Nombre</span><span>Tipo / contenido</span></div><div class="file-rows">${files.map(([id,label,sub])=>`<button class="file-row" data-open="${id}" data-search="${label} ${sub}"><span>${appIcon(id)}${label}</span><small>${sub}</small></button>`).join('')}</div></div><p class="search-empty muted" hidden>No se encontraron archivos.</p></div></div><footer class="explorer-status"><span id="explorer-count">8 elementos</span><span>Portfolio OS · Hecho con curiosidad</span></footer>`;
  body.querySelector('.explorer-search input').addEventListener('input',event=>{
    const query=normalize(event.target.value);let count=0;
    body.querySelectorAll('[data-search]').forEach(el=>{el.hidden=!normalize(el.dataset.search).includes(query);if(!el.hidden)count++;});
    body.querySelector('.search-empty').hidden=count>0;
    body.querySelector('#explorer-count').textContent=`${count} elementos`;
  });
  body.querySelector('[data-home]').onclick=()=>{const input=body.querySelector('.explorer-search input');input.value='';input.dispatchEvent(new Event('input'));};
  let descending=false;
  body.querySelector('#explorer-sort').onclick=event=>{
    const rows=body.querySelector('.file-rows');descending=!descending;
    [...rows.children].sort((a,b)=>a.dataset.search.localeCompare(b.dataset.search,'es')*(descending?-1:1)).forEach(el=>rows.append(el));
    event.currentTarget.textContent=descending?'Ordenar Z–A':'Ordenar A–Z';
  };
  body.querySelector('#explorer-view').onclick=event=>{const list=body.classList.toggle('explorer-list');event.currentTarget.textContent=list?'Vista de iconos':'Vista de lista';};
}

function bindPortfolio(body,notify) {
  body.querySelectorAll('[data-tab]').forEach(button=>button.onclick=()=>{
    const isResume=button.dataset.tab.startsWith('tab-resume');
    body.querySelectorAll(isResume?'.resume-segment-btn':'.about-tab-btn').forEach(b=>{const selected=b===button;b.classList.toggle('active',selected);b.setAttribute('aria-pressed',String(selected));});
    body.querySelectorAll(isResume?'.resume-tab-pane':'.about-tab-pane').forEach(p=>p.style.display=p.id===button.dataset.tab?'block':'none');
  });
  body.querySelectorAll('[data-copy]').forEach(button=>button.onclick=async()=>{
    try {await navigator.clipboard.writeText(button.dataset.copy);notify('Copiado al portapapeles');}catch{notify('No se pudo copiar. Podés seleccionar el texto y copiarlo.');}
  });
  const form=body.querySelector('#contact-name')?.closest('form');
  if(form)form.addEventListener('submit',event=>{
    event.preventDefault();const name=form.querySelector('#contact-name').value, email=form.querySelector('#contact-email').value, msg=form.querySelector('#contact-msg').value;
    location.href=`mailto:pierettoivan2004@gmail.com?subject=${encodeURIComponent('Contacto Portfolio — '+name)}&body=${encodeURIComponent(`De: ${name} (${email})\n\n${msg}`)}`;
    notify('Se abrirá tu aplicación de correo para enviar el mensaje.');
  });
  if(form){const hint=document.createElement('small');hint.className='muted';hint.textContent='El formulario abre tu aplicación de correo. El mensaje se envía desde allí.';form.append(hint);}
}

function renderTerminal(body,open,notify,prefs) {
  body.innerHTML=`<div class="terminal-body"><div class="terminal-banner">Portfolio OS [Versión 3.0]<br>Iván Pieretto · Terminal web<br><br>Escribí <strong>help</strong> para ver los comandos.</div><div id="term-output" role="log" aria-label="Salida de la terminal"></div><form class="terminal-line-input"><label for="term-input">PS C:\\Users\\Visitante&gt;</label><input id="term-input" autocomplete="off" spellcheck="false" aria-label="Comando de terminal"></form></div>`;
  const output=body.querySelector('#term-output'),input=body.querySelector('input');let history=[],index=0;
  const responses={
    help:'about · projects · skills · contact · neofetch · whoami · date · dir · clear\nopen [about / projects / resume / contact / chat / settings]\ntheme [light / dark] · coffee · matrix · doom · secrets',
    about:'Iván Pieretto · Rosario, Santa Fe, Argentina.\nDesarrollo de software, experiencias web y flujos con IA.',
    projects:'adaptIA — Adaptador de currículums con IA\nEstudio el Oso — Experiencia web inmersiva\nChappie-bot — Asistente de IA local por voz',
    skills:'HTML · CSS · JavaScript · TypeScript · Python · SQL\nReact · Vite · Three.js · GSAP · Node.js · React Native\nGit · GitHub · Ollama · n8n · IA generativa',
    contact:'pierettoivan2004@gmail.com\nlinkedin.com/in/ivan-pieretto\ngithub.com/Ivan-rgb-ops\nAbrí Contacto para ver todos los canales.',
    neofetch:'▦  Portfolio OS 3.0\n   Interfaz: inspirada en Windows 11\n   Motor: HTML + CSS + JavaScript modular\n   Shell: terminal web\n   Autor: Iván Pieretto',
    whoami:'Visitante · bienvenido al escritorio de Iván', dir:'Proyectos/  Sobre mí/  Contacto/  Iván_Pieretto_CV.pdf',ls:'Proyectos/  Sobre mí/  Contacto/  Iván_Pieretto_CV.pdf',
  };
  body.querySelector('form').onsubmit=event=>{
    event.preventDefault();const value=input.value.trim();input.value='';if(!value)return;
    history.push(value);index=history.length;const command=normalize(value);const line=document.createElement('div');line.className='terminal-command';line.textContent='PS C:\\Users\\Visitante> '+value;output.append(line);
    const response=document.createElement('div');response.className='terminal-response';
    if(command==='clear'||command==='cls'){output.replaceChildren();return;}
    if(command==='doom')open('doom');
    if(window.TerminalEasterEggs?.handle(command,response,output)){output.append(response);body.querySelector('.terminal-body').scrollTop=1e7;return;}
    if(command.startsWith('open ')){const id=command.slice(5).trim();response.textContent=apps[id]?`Abriendo ${apps[id].title}…`:'No se encontró esa aplicación.';if(apps[id])open(id);}
    else if(command==='theme light'||command==='theme dark'){prefs.setTheme(command.split(' ')[1]);response.textContent='Tema actualizado.';}
    else response.textContent=responses[command]||(command==='date'?new Date().toLocaleString('es-AR'):`Comando desconocido: ${value}. Escribí help.`);
    output.append(response);body.querySelector('.terminal-body').scrollTop=1e7;
  };
  input.addEventListener('keydown',event=>{
    if(event.key==='ArrowUp'||event.key==='ArrowDown'){event.preventDefault();index=Math.max(0,Math.min(history.length,index+(event.key==='ArrowUp'?-1:1)));input.value=history[index]||'';}
  });
  body.addEventListener('click',event=>{if(!getSelection().toString()&&!event.target.closest('a,button'))input.focus();});
}

function renderChat(body) {
  body.innerHTML=`<div class="chat-container"><div class="chat-header">${appIcon('chat')}<div><strong>Asistente de Iván</strong><small>Respuestas locales sobre mi portafolio</small></div></div><div id="chat-messages" role="log" aria-label="Conversación"><div class="chat-bubble ai">¡Hola! Puedo contarte sobre mis proyectos, tecnologías o cómo contactarme. Este asistente usa respuestas predefinidas y funciona sin conexión a un modelo de IA.</div></div><div class="chat-suggestions"><button data-query="Proyectos">Proyectos</button><button data-query="Tecnologías">Tecnologías</button><button data-query="Contacto">Contacto</button></div><form class="chat-input-bar"><input aria-label="Mensaje para el asistente" placeholder="¿Qué te gustaría saber?" maxlength="1000" required><button class="fluent-btn-primary">Enviar</button></form></div>`;
  const log=body.querySelector('#chat-messages'),input=body.querySelector('input');
  function send(value) {
    const bubble=document.createElement('div');bubble.className='chat-bubble user';bubble.textContent=value;log.append(bubble);
    const query=normalize(value);const reply=document.createElement('div');reply.className='chat-bubble ai';
    reply.textContent=/proyect|trabaj|repo/.test(query)?'Mis proyectos destacados son adaptIA (optimización de CVs con IA), Estudio el Oso (experiencia web con Three.js y GSAP) y Chappie-bot (asistente local por voz). Podés ver sus repositorios en la aplicación Proyectos.':/tecnolog|stack|skill|lenguaj/.test(query)?'Trabajo con HTML, CSS, JavaScript, TypeScript, Python y SQL. También con React, Vite, Three.js, GSAP, Node.js y React Native, además de herramientas de IA como Ollama y n8n.':/contact|mail|contrat|linkedin/.test(query)?'Podés escribirme a pierettoivan2004@gmail.com o encontrarme en linkedin.com/in/ivan-pieretto. La aplicación Contacto reúne mis canales.':/cv|curricul/.test(query)?'Abrí Currículum para ver el CV completo y descargar el PDF.':/educ|experien|sobre|quien/.test(query)?'Soy Iván Pieretto, de Rosario, Santa Fe. Estudio Desarrollo de Software en el Complejo Educativo Brigadier López y busco desarrollarme como Software Developer, Front-End Developer o IT Trainee.':'Puedo ayudarte con proyectos, tecnologías, formación, CV y contacto. Elegí uno de esos temas para conocer más sobre mí.';
    log.append(reply);log.scrollTop=log.scrollHeight;
  }
  body.querySelector('form').onsubmit=event=>{event.preventDefault();const value=input.value.trim();if(value){send(value);input.value='';}};
  body.querySelectorAll('[data-query]').forEach(b=>b.onclick=()=>send(b.dataset.query));
}
