import {icon} from './icons.js';

const captures={
  adaptia:{name:'adaptIA',src:'assets/projects/adaptia-hd.webp',video:'assets/projects/adaptia-preview.mp4',width:1575,height:884,caption:'Captura y animación de la página pública de adaptIA.',url:'https://adaptia-frontend.onrender.com/'},
  'estudio-el-oso':{name:'Estudio el Oso',src:'assets/projects/estudio-el-oso-hd.webp',video:'assets/projects/estudio-el-oso-preview.mp4',width:1569,height:881,caption:'Captura y animación del sitio de fotografía Estudio el Oso.',url:'https://estudioeloso.pages.dev/'},
  'chappie-bot':{name:'Chappie-bot',src:'assets/projects/chappie-bot-hd.webp',video:'assets/projects/chappie-bot-preview.mp4',width:1575,height:884,caption:'Detalle ampliado de la interfaz original. Demostración visual de sus estados; sin iniciar los servicios de voz, IA ni comandos del sistema.',url:'https://github.com/Ivan-rgb-ops/Chappie-bot'},
};

export function renderProjectPreviews(body,preferences){
  const controller=new AbortController(),{signal}=controller;
  const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)');
  const stops=[];
  const stopAll=()=>stops.forEach(stop=>stop());
  const app=body.closest('.os-window');
  const allowed=()=>!reducedMotion.matches&&preferences.motion&&!document.hidden&&!app.hidden;
  preferences.addEventListener('change',()=>{if(!allowed())stopAll();},{signal});
  reducedMotion.addEventListener('change',()=>{if(!allowed())stopAll();},{signal});
  document.addEventListener('visibilitychange',stopAll,{signal});
  window.addEventListener('blur',stopAll,{signal});
  const visibilityObserver=new MutationObserver(()=>{if(app.hidden)stopAll();});
  visibilityObserver.observe(app,{attributes:true,attributeFilter:['hidden']});
  const intersectionObserver=new IntersectionObserver(entries=>entries.forEach(entry=>{if(!entry.isIntersecting)entry.target.dispatchEvent(new Event('preview:stop'));}));
  app.addEventListener('app:close',()=>{stopAll();controller.abort();visibilityObserver.disconnect();intersectionObserver.disconnect();},{once:true});
  body.querySelectorAll('[data-project]').forEach(card=>{
    const capture=captures[card.dataset.project];if(!capture)return;
    const button=document.createElement('button');button.type='button';button.className='project-preview-button';button.setAttribute('aria-label',`Abrir vista previa de ${capture.name}`);
    button.innerHTML=`<img src="${capture.src}" width="${capture.width}" height="${capture.height}" alt="Vista de ${capture.name}" loading="lazy" decoding="async"><span class="project-preview-motion" aria-hidden="true">${icon('play')} Vista animada</span><span class="project-preview-caption">${icon('maximize')} Ver vista previa</span>`;
    card.querySelector('.project-desc').before(button);
    let video,hovered=false,focused=false,playRequest=0;
    const stop=()=>{playRequest++;hovered=false;focused=false;video?.pause();button.classList.remove('is-playing');if(video?.readyState>=1)video.currentTime=0;};
    const start=()=>{
      if(!allowed()||(!hovered&&!focused))return;
      if(!video){
        video=document.createElement('video');video.className='project-preview-video';video.muted=true;video.loop=true;video.playsInline=true;video.preload='none';video.setAttribute('aria-hidden','true');video.tabIndex=-1;
        video.addEventListener('playing',()=>{if(allowed()&&(hovered||focused))button.classList.add('is-playing');else stop();},{signal});
        video.addEventListener('error',stop,{signal});
        button.append(video);video.src=capture.video;
      }
      const request=++playRequest;
      video.play().catch(()=>{if(request===playRequest)button.classList.remove('is-playing');});
    };
    button.addEventListener('pointerenter',event=>{if(event.pointerType==='touch')return;hovered=true;start();},{signal});
    button.addEventListener('pointerleave',stop,{signal});
    button.addEventListener('focus',()=>{focused=button.matches(':focus-visible');start();},{signal});
    button.addEventListener('blur',stop,{signal});
    button.addEventListener('preview:stop',stop,{signal});
    button.onclick=()=>{stop();openPreview(capture,button,preferences);};
    stops.push(stop);intersectionObserver.observe(button);
  });
}

function openPreview(capture,origin,preferences){
  const controller=new AbortController(),{signal}=controller;
  const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)');
  const dialog=document.createElement('dialog');dialog.className='project-preview-dialog';dialog.setAttribute('aria-label',`Vista previa de ${capture.name}`);
  dialog.innerHTML=`<header><strong>${capture.name}</strong><button type="button" class="icon-button" aria-label="Cerrar vista previa">${icon('close')}</button></header><div class="project-preview-image"><video controls playsinline loop muted preload="metadata" poster="${capture.src}" src="${capture.video}" aria-label="Vista animada de ${capture.name}" width="${capture.width}" height="${capture.height}"></video><p class="project-preview-help">Video sin audio. Podés pausar, repetir o verlo en pantalla completa.</p><p role="status" class="project-preview-error" hidden>No se pudo cargar el video. Podés visitar el proyecto con el enlace de abajo.</p></div><footer><p>${capture.caption}</p><a href="${capture.url}" target="_blank" rel="noopener noreferrer" class="fluent-btn-primary">${capture.name==='Chappie-bot'?'Ver repositorio':'Visitar proyecto'} ↗</a></footer>`;
  const video=dialog.querySelector('video');video.muted=true;
  const pause=()=>video.pause();
  const motionChanged=()=>{if(!preferences.motion||reducedMotion.matches)pause();};
  preferences.addEventListener('change',motionChanged,{signal});
  reducedMotion.addEventListener('change',motionChanged,{signal});
  document.addEventListener('visibilitychange',()=>{if(document.hidden)pause();},{signal});
  origin.closest('.os-window')?.addEventListener('app:close',()=>dialog.close(),{signal});
  video.addEventListener('error',()=>{dialog.querySelector('.project-preview-error').hidden=false;},{signal});
  document.body.append(dialog);dialog.showModal();
  if(preferences.motion&&!reducedMotion.matches)video.play().catch(()=>{});
  dialog.addEventListener('keydown',event=>event.stopPropagation());
  dialog.querySelector('button').onclick=()=>dialog.close();
  dialog.addEventListener('click',event=>{if(event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close();}});
  dialog.addEventListener('close',()=>{pause();controller.abort();video.removeAttribute('src');video.load();dialog.remove();if(origin.isConnected)origin.focus({preventScroll:true});},{once:true});
}
