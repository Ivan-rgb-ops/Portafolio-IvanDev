import {storage} from './config.js';

export class Preferences {
  constructor() {
    this.theme=storage.get('theme','light'); this.wallpaper=storage.get('wallpaper','bloom');
    this.accent=storage.get('accent','#0067c0');this.motion=storage.get('motion',true);this.sync();
  }
  setTheme(theme) { this.theme=theme==='dark'?'dark':'light';storage.set('theme',this.theme);this.sync(); }
  setWallpaper(value) { this.wallpaper=['bloom','space','city'].includes(value)?value:'bloom';storage.set('wallpaper',this.wallpaper);this.sync(); }
  setAccent(value) { if(!/^#[a-f\d]{6}$/i.test(value))return;this.accent=value;storage.set('accent',value);this.sync(); }
  toggleMotion() {this.motion=!this.motion;storage.set('motion',this.motion);this.sync();}
  sync() {
    document.documentElement.dataset.theme=this.theme;
    document.documentElement.dataset.motion=this.motion?'on':'off';
    document.documentElement.style.setProperty('--accent',this.accent);
    const wallpaper=this.wallpaper==='space'?'wallpaper.jpg':this.wallpaper==='city'?'wallpaper2.jpg':`assets/bloom-${this.theme}.jpg`;
    document.documentElement.style.setProperty('--wallpaper',`url("${wallpaper}")`);
    document.getElementById('quick-theme')?.setAttribute('aria-pressed',String(this.theme==='dark'));
    document.getElementById('quick-motion')?.setAttribute('aria-pressed',String(this.motion));
    document.getElementById('motion-toggle')?.setAttribute('aria-checked',String(this.motion));
    document.querySelectorAll('[data-theme-choice]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.themeChoice===this.theme)));
    document.querySelectorAll('[data-accent]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.accent===this.accent)));
    const select=document.getElementById('wallpaper-choice');if(select)select.value=this.wallpaper;
  }
}
