import test from 'node:test';
import assert from 'node:assert/strict';
import {LoginSequence} from '../js/login-sequence.js';
import {shortcutAction,resolveRunCommand} from '../js/shortcuts.js';
import {validPreference} from '../js/preferences.js';
import {wallpaperBackground} from '../js/wallpapers.js';
import {snapRect} from '../js/geometry.js';
import {WindowManager} from '../js/window-manager.js';

function clock(){let now=0,counter=0;const jobs=new Map();return {schedule(callback,delay){const id=++counter;jobs.set(id,{time:now+delay,callback});return id;},cancel(id){jobs.delete(id);},tick(duration){const end=now+duration;while(true){const next=[...jobs].filter(([,job])=>job.time<=end).sort((a,b)=>a[1].time-b[1].time)[0];if(!next)break;jobs.delete(next[0]);now=next[1].time;next[1].callback();}now=end;}};}
test('login types four demo characters, welcomes the visitor and enters once',()=>{
  const timer=clock(),states=[];const login=new LoginSequence(state=>states.push(state),timer);
  login.lock();login.begin();login.begin();timer.tick(1000);
  assert.deepEqual(states.filter(s=>s.state==='typing').map(s=>s.count),[0,1,2,3,4]);
  timer.tick(250);assert.equal(login.state,'welcome');timer.tick(750);assert.equal(login.state,'desktop');
  assert.equal(states.filter(s=>s.state==='desktop').length,1);
});
test('skipping or powering off cancels outstanding login timers',()=>{
  for(const action of ['finish','powerOff']){const timer=clock(),states=[];const login=new LoginSequence(s=>states.push(s),timer);login.lock();login.begin();timer.tick(500);login[action]();const count=states.length;timer.tick(10000);assert.equal(states.length,count);assert.equal(login.state,action==='finish'?'desktop':'off');}
});
test('locking during typing starts a fresh sequence without stale callbacks',()=>{
  const timer=clock(),login=new LoginSequence(()=>{},timer);login.lock();login.begin();timer.tick(700);login.lock();timer.tick(5000);assert.equal(login.state,'lock');login.begin();timer.tick(2000);assert.equal(login.state,'desktop');
});
test('reduced motion enters without artificial typing delays',()=>{
  const timer=clock(),login=new LoginSequence(()=>{},{...timer,reducedMotion:()=>true});login.lock();login.begin();assert.equal(login.state,'desktop');
});
test('default login timers are invoked without binding them to the controller',()=>{
  const originalSet=globalThis.setTimeout,originalClear=globalThis.clearTimeout;let scheduled=0;
  try{globalThis.setTimeout=function(){assert.equal(this,undefined);return ++scheduled;};globalThis.clearTimeout=function(){assert.equal(this,undefined);};const login=new LoginSequence(()=>{});login.lock();login.begin();assert.equal(scheduled,5);login.finish();}finally{globalThis.setTimeout=originalSet;globalThis.clearTimeout=originalClear;}
});
const key=(key,modifiers={},context={})=>shortcutAction({key,ctrlKey:false,altKey:false,shiftKey:false,metaKey:false,...modifiers},context);
test('browser alternatives map to desktop actions and virtual desktops',()=>{
  assert.equal(key('r',{ctrlKey:true,altKey:true}),'run');
  assert.equal(key('d',{metaKey:true,ctrlKey:true}),'new-desktop');
  assert.equal(key('d',{ctrlKey:true,altKey:true,shiftKey:true}),'new-desktop');
  assert.equal(key('3',{ctrlKey:true,altKey:true}),'pinned-3');
  assert.equal(key('Tab',{altKey:true,shiftKey:true}),'cycle-back');
  assert.equal(key('k',{metaKey:true}),'search');
});
test('AltGr and normal text editing are never interpreted as shell actions',()=>{
  assert.equal(key('q',{ctrlKey:true,altKey:true,getModifierState:name=>name==='AltGraph'}),null);
  assert.equal(key('z',{ctrlKey:true},{editing:true}),null);
  assert.equal(key('a',{ctrlKey:true},{editing:true}),null);
  assert.equal(key('1',{ctrlKey:true}),null);
  assert.equal(key('Delete',{},{}),null);
  assert.equal(key('Delete',{},{desktopSelected:true}),'delete-shortcut');
});
test('Run accepts known portfolio apps and never arbitrary scripts or URLs',()=>{
  assert.equal(resolveRunCommand('  TASKMGR.EXE '),'taskmanager');
  assert.equal(resolveRunCommand('ms-settings:personalization-background'),'settings:background');
  for(const value of ['javascript:alert(1)','https://example.com','powershell rm *','<script>'])assert.equal(resolveRunCommand(value),null);
});
test('preference validation rejects malformed values and wallpaper CSS injection',()=>{
  assert.equal(validPreference('motion','false'),false);assert.equal(validPreference('accent','red;display:none'),false);assert.equal(validPreference('themeChoice','system'),true);assert.equal(validPreference('alignment','right'),false);assert.equal(validPreference('wallpaper','url(evil)'),false);
  assert.equal(wallpaperBackground('unknown'),'url("assets/bloom-light.jpg")');assert.equal(wallpaperBackground('bloom','dark'),'url("assets/bloom-dark.jpg")');
});
test('all snap partitions tile odd width and height work areas exactly',()=>{
  const area={width:1365,height:721};
  for(const modes of [['left','right'],['third-left','third-center','third-right'],['wide-left','third-right'],['third-left','wide-right']]){const rectangles=modes.map(mode=>snapRect(mode,area));assert.equal(rectangles.reduce((sum,r)=>sum+r.width,0),area.width);for(let i=1;i<rectangles.length;i++)assert.equal(rectangles[i].x,rectangles[i-1].x+rectangles[i-1].width);}
  const quarters=['top-left','top-right','bottom-left','bottom-right'].map(mode=>snapRect(mode,area));assert.equal(quarters.reduce((sum,r)=>sum+r.width*r.height,0),area.width*area.height);assert.equal(quarters[0].height+quarters[2].height,area.height);
});
function virtualManager(){const manager=Object.create(WindowManager.prototype);Object.assign(manager,{desktops:[{id:1,name:'Escritorio 1'},{id:2,name:'Escritorio 2'}],currentDesktop:1,desktopCounter:2,windows:new Map([['about',{id:'about',desktop:1,minimized:false,el:{hidden:false}}],['projects',{id:'projects',desktop:2,minimized:true,el:{hidden:true}}]]),endGesture(){},focusTop(){},changed(){}});return manager;}
test('switching desktops preserves minimized state and hides windows from other desktops',()=>{const manager=virtualManager();manager.switchDesktop(2);assert.equal(manager.windows.get('about').el.hidden,true);assert.equal(manager.windows.get('projects').el.hidden,true);manager.windows.get('projects').minimized=false;manager.switchDesktop(2);assert.equal(manager.windows.get('projects').el.hidden,false);});
test('closing a desktop moves its apps without losing them',()=>{const manager=virtualManager();manager.switchDesktop(2);manager.removeDesktop(2);assert.equal(manager.currentDesktop,1);assert.equal(manager.windows.size,2);assert.equal(manager.windows.get('projects').desktop,1);assert.equal(manager.windows.get('projects').minimized,true);manager.removeDesktop(1);assert.equal(manager.desktops.length,1);});
test('virtual desktop creation has a bounded limit and unique identities',()=>{const manager=virtualManager();for(let i=0;i<6;i++)assert.ok(manager.createDesktop());assert.equal(manager.createDesktop(),false);assert.equal(new Set(manager.desktops.map(d=>d.id)).size,8);});
test('windows regain their desktop dimensions after a narrow viewport',()=>{
  const manager=virtualManager();let area={width:1366,height:852};Object.defineProperty(manager,'area',{get:()=>area});manager.previousWidth=375;manager.apply=()=>{};manager.windows=new Map([['about',{id:'about',mode:'normal',rect:{x:0,y:0,width:375,height:650}}]]);manager.reflow();assert.equal(manager.windows.get('about').rect.width,900);const wide={...manager.windows.get('about').rect};area={width:390,height:796};manager.reflow();assert.equal(manager.windows.get('about').rect.width,390);area={width:1366,height:852};manager.reflow();assert.deepEqual(manager.windows.get('about').rect,wide);
});
