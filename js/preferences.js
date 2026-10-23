import {storage} from './config.js';
import {wallpapers,wallpaperBackground,readCustomWallpaper,storeCustomWallpaper} from './wallpapers.js';

const defaults={themeChoice:'light',wallpaper:'bloom',accent:'#0067c0',motion:true,transparency:true,contrast:false,loginAnimation:true,iconSize:'medium',showIcons:true,alignment:'center',showSearch:true,wallpaperFit:'cover',slideshow:false};
const choices={themeChoice:['light','dark','system'],wallpaper:[...wallpapers.map(w=>w.id),'custom'],iconSize:['small','medium','large'],alignment:['center','left'],wallpaperFit:['cover','contain','stretch']};
export function validPreference(key,value) {
  if(!(key in defaults))return false;
  if(key==='accent')return typeof value==='string'&&/^#[a-f\d]{6}$/i.test(value);
  if(choices[key])return choices[key].includes(value);
  return typeof value==='boolean';
}
export class Preferences extends EventTarget {
  constructor() {
    super();this.customURL='';this.systemTheme=matchMedia('(prefers-color-scheme: dark)');
    for(const [key,fallback]of Object.entries(defaults)){const value=storage.get(key,key==='themeChoice'?storage.get('theme',fallback):fallback);this[key]=validPreference(key,value)?value:fallback;}
    this.systemTheme.addEventListener('change',()=>this.sync());this.sync();
    readCustomWallpaper().then(blob=>{if(blob){this.customURL=URL.createObjectURL(blob);this.sync();}}).catch(()=>{});
    setInterval(()=>{if(this.slideshow&&!document.hidden)this.nextWallpaper();},60000);
  }
  get theme(){return this.themeChoice==='system'?(this.systemTheme.matches?'dark':'light'):this.themeChoice;}
  set(key,value){if(!validPreference(key,value))return;this[key]=value;storage.set(key,value);this.sync();}
  setTheme(value){this.set('themeChoice',value);}
  setWallpaper(value){this.set('wallpaper',value);}
  setAccent(value){this.set('accent',value);}
  toggleMotion(){this.set('motion',!this.motion);}
  nextWallpaper(){const index=wallpapers.findIndex(w=>w.id===this.wallpaper);this.setWallpaper(wallpapers[(index+1)%wallpapers.length].id);}
  async upload(file){
    await storeCustomWallpaper(file);if(this.customURL)URL.revokeObjectURL(this.customURL);
    this.customURL=URL.createObjectURL(file);this.setWallpaper('custom');
  }
  reset(){for(const [key,value]of Object.entries(defaults)){this[key]=value;storage.set(key,value);}this.sync();}
  sync() {
    const root=document.documentElement;
    Object.assign(root.dataset,{theme:this.theme,motion:this.motion?'on':'off',transparency:String(this.transparency),contrast:String(this.contrast),iconSize:this.iconSize,showIcons:String(this.showIcons),alignment:this.alignment,showSearch:String(this.showSearch)});
    root.style.setProperty('--accent',this.accent);root.style.setProperty('--wallpaper',wallpaperBackground(this.wallpaper,this.theme,this.customURL));
    root.style.setProperty('--wallpaper-fit',this.wallpaperFit==='stretch'?'100% 100%':this.wallpaperFit);
    document.getElementById('quick-theme')?.setAttribute('aria-pressed',String(this.theme==='dark'));
    document.getElementById('quick-motion')?.setAttribute('aria-pressed',String(this.motion));
    document.getElementById('quick-transparency')?.setAttribute('aria-pressed',String(this.transparency));
    document.getElementById('login-accessibility')?.setAttribute('aria-pressed',String(!this.motion));
    document.querySelectorAll('[data-pref]').forEach(el=>{
      const value=this[el.dataset.pref];
      if(el.tagName==='SELECT')el.value=String(value);
      else el.setAttribute(el.getAttribute('role')==='switch'?'aria-checked':'aria-pressed',String(value===true));
    });
    document.querySelectorAll('[data-theme-choice]').forEach(el=>el.setAttribute('aria-pressed',String(el.dataset.themeChoice===this.themeChoice)));
    document.querySelectorAll('[data-wallpaper]').forEach(el=>el.setAttribute('aria-pressed',String(el.dataset.wallpaper===this.wallpaper)));
    document.querySelectorAll('[data-accent]').forEach(el=>el.setAttribute('aria-pressed',String(el.dataset.accent===this.accent)));
    this.dispatchEvent(new Event('change'));
  }
}
