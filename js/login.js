import {LoginSequence} from './login-sequence.js';

export function createLogin({preferences,onEnter,onRestart,onShutdown}) {
  const overlay=document.getElementById('lock-screen');
  const input=document.getElementById('login-password');
  let savedFocus;
  const sequence=new LoginSequence(({state,count})=>{
    const locked=state!=='desktop';
    overlay.hidden=!locked;overlay.dataset.phase=state;
    document.getElementById('desktop').inert=locked;
    document.getElementById('taskbar').inert=locked;
    input.value='ivan'.slice(0,count);
    document.getElementById('login-status').textContent=state==='welcome'?'Bienvenido':state==='typing'?'Iniciando sesión como visitante…':'';
    if(state==='lock')document.getElementById('unlock-button').focus();
    if(state==='typing')input.focus({preventScroll:true});
    if(state==='off')document.getElementById('power-on').focus();
    if(!locked){onEnter();if(savedFocus?.isConnected)savedFocus.focus({preventScroll:true});}
  },{reducedMotion:()=>!preferences.motion||matchMedia('(prefers-reduced-motion: reduce)').matches});
  overlay.querySelector('#unlock-button').onclick=()=>sequence.begin();
  overlay.querySelector('#login-submit').onclick=()=>sequence.welcome();
  overlay.querySelector('#login-skip').onclick=()=>sequence.finish();
  overlay.querySelector('#power-on').onclick=()=>sequence.lock();
  overlay.querySelector('#login-back').onclick=()=>sequence.lock();
  overlay.querySelector('#login-accessibility').onclick=()=>preferences.toggleMotion();
  overlay.querySelector('#login-power').onclick=()=>{const menu=document.getElementById('login-power-menu');menu.hidden=!menu.hidden;};
  overlay.querySelector('#login-restart').onclick=()=>{document.getElementById('login-power-menu').hidden=true;onRestart();};
  overlay.querySelector('#login-shutdown').onclick=()=>{document.getElementById('login-power-menu').hidden=true;onShutdown();};
  overlay.addEventListener('keydown',event=>{
    if(event.key==='Tab'){
      const items=[...overlay.querySelectorAll('button,input')].filter(el=>el.getClientRects().length&&!el.disabled);const first=items[0],last=items.at(-1);
      if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}return;
    }
    if(event.key==='Escape'&&sequence.state==='typing'){event.preventDefault();sequence.lock();return;}
    if(event.target.closest('button')&&event.key===' ')return;
    if(event.key==='Enter'||(sequence.state==='lock'&&event.key.length===1)){
      event.preventDefault();if(sequence.state==='lock')sequence.begin();else if(sequence.state==='typing')sequence.welcome();
    }
  });
  return {
    get active(){return sequence.state!=='desktop';},
    lock(){savedFocus=document.activeElement;sequence.lock();},
    off(){sequence.powerOff();},
    start(){if(preferences.loginAnimation)sequence.lock();else sequence.finish();},
  };
}
