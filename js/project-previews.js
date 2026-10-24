import {icon} from './icons.js';

const captures={
  adaptia:{name:'adaptIA',src:'assets/projects/adaptia.png',width:1280,height:800,caption:'Captura de la página pública de adaptIA.',url:'https://adaptia-frontend.onrender.com/'},
  'estudio-el-oso':{name:'Estudio el Oso',src:'assets/projects/estudio-el-oso.png',width:1280,height:800,caption:'Captura del sitio de fotografía Estudio el Oso.',url:'https://estudioeloso.pages.dev/'},
  'chappie-bot':{name:'Chappie-bot',src:'assets/projects/chappie-bot.png',width:640,height:400,caption:'Interfaz original del repositorio, en su estado visual inicial. Captura local sin iniciar los servicios de voz o IA.',url:'https://github.com/Ivan-rgb-ops/Chappie-bot'},
};

export function renderProjectPreviews(body){
  body.querySelectorAll('[data-project]').forEach(card=>{
    const capture=captures[card.dataset.project];if(!capture)return;
    const button=document.createElement('button');button.type='button';button.className='project-preview-button';button.setAttribute('aria-label',`Ampliar captura de ${capture.name}`);
    button.innerHTML=`<img src="${capture.src}" width="${capture.width}" height="${capture.height}" alt="Vista de ${capture.name}" loading="lazy" decoding="async"><span class="project-preview-caption">${icon('maximize')} Ampliar captura</span>`;
    card.querySelector('.project-desc').before(button);
    button.onclick=()=>openPreview(capture,button);
  });
}

function openPreview(capture,origin){
  const dialog=document.createElement('dialog');dialog.className='project-preview-dialog';dialog.setAttribute('aria-label',`Captura de ${capture.name}`);
  dialog.innerHTML=`<header><strong>${capture.name}</strong><button type="button" class="icon-button" aria-label="Cerrar captura">${icon('close')}</button></header><div class="project-preview-image"><img src="${capture.src}" alt="Captura ampliada de ${capture.name}" width="${capture.width}" height="${capture.height}"></div><footer><p>${capture.caption}</p><a href="${capture.url}" target="_blank" rel="noopener noreferrer" class="fluent-btn-primary">${capture.name==='Chappie-bot'?'Ver repositorio':'Visitar proyecto'} ↗</a></footer>`;
  document.body.append(dialog);dialog.showModal();
  dialog.addEventListener('keydown',event=>event.stopPropagation());
  dialog.querySelector('button').onclick=()=>dialog.close();
  dialog.addEventListener('click',event=>{if(event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close();}});
  dialog.addEventListener('close',()=>{dialog.remove();if(origin.isConnected)origin.focus({preventScroll:true});},{once:true});
}
