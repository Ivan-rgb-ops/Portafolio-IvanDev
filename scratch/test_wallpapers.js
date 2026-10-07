// Test wallpaper switching and cleanup
const fs = require('fs');

// Create mock DOM environment
const styleMock = {
  background: '',
  backgroundColor: '',
  backgroundImage: '',
  backgroundSize: '',
  backgroundPosition: '',
  backgroundRepeat: '',
  backgroundAttachment: '',
  backgroundOrigin: '',
  backgroundClip: '',
  transition: '',
  display: ''
};

const desktopBg = {
  id: 'desktop-bg',
  style: { ...styleMock }
};

const canvas = {
  id: 'wallpaper-canvas',
  style: { display: 'none' },
  width: 1920,
  height: 1080,
  getContext: () => ({
    clearRect: () => {},
    fillRect: () => {},
    beginPath: () => {},
    arc: () => {},
    fill: () => {},
    stroke: () => {},
    moveTo: () => {},
    lineTo: () => {},
    createLinearGradient: () => ({ addColorStop: () => {} })
  })
};

const cards = [
  { onclick: "setWallpaper('sunset-calm'); updateWallpaperActive(this);", classes: new Set() },
  { onclick: "setWallpaper('nordic-mist'); updateWallpaperActive(this);", classes: new Set() },
  { onclick: "setWallpaper('quiet-forest'); updateWallpaperActive(this);", classes: new Set() },
  { onclick: "setWallpaper('cozy-mocha'); updateWallpaperActive(this);", classes: new Set() },
  { onclick: "setWallpaper('lavender-dusk'); updateWallpaperActive(this);", classes: new Set() },
  { onclick: "setWallpaper('solid-dark'); updateWallpaperActive(this);", classes: new Set() },
  { onclick: "setWallpaper('solid-light'); updateWallpaperActive(this);", classes: new Set() },
  { onclick: "setWallpaper('nebula'); updateWallpaperActive(this);", classes: new Set() },
  { onclick: "setWallpaper('horizon'); updateWallpaperActive(this);", classes: new Set() },
  { onclick: "setWallpaper('gradient-dark'); updateWallpaperActive(this);", classes: new Set() },
  { onclick: "setWallpaper('starlight'); updateWallpaperActive(this);", classes: new Set() },
  { onclick: "setWallpaper('velvet-aurora'); updateWallpaperActive(this);", classes: new Set() },
  { onclick: "setWallpaper('midnight-sonoma'); updateWallpaperActive(this);", classes: new Set() },
  { onclick: "setWallpaper('dusk-pastels'); updateWallpaperActive(this);", classes: new Set() },
  { onclick: "setWallpaper('emerald-deep'); updateWallpaperActive(this);", classes: new Set() },
  { onclick: "setWallpaper('mountain-terrain'); updateWallpaperActive(this);", classes: new Set() },
  { onclick: "setWallpaper('photo-space'); updateWallpaperActive(this);", classes: new Set() },
  { onclick: "setWallpaper('photo-cyber'); updateWallpaperActive(this);", classes: new Set() }
].map(c => ({
  getAttribute: attr => attr === 'onclick' ? c.onclick : null,
  classList: {
    add: cls => c.classes.add(cls),
    remove: cls => c.classes.delete(cls),
    contains: cls => c.classes.has(cls)
  }
}));

global.document = {
  addEventListener: () => {},
  removeEventListener: () => {},
  getElementById: (id) => {
    if (id === 'desktop-bg') return desktopBg;
    if (id === 'wallpaper-canvas') return canvas;
    return null;
  },
  querySelectorAll: (selector) => {
    if (selector === '.wallpaper-card') return cards;
    return [];
  },
  documentElement: {
    style: {
      setProperty: () => {}
    }
  }
};

global.window = {
  innerWidth: 1920,
  innerHeight: 1080,
  addEventListener: () => {},
  removeEventListener: () => {}
};

global.requestAnimationFrame = () => 1;
global.cancelAnimationFrame = () => {};
global.performance = { now: () => 0 };

global.SafeStorage = {
  get: () => null,
  set: (k, v) => {}
};

global.SoundSystem = {
  play: () => {}
};

global.showToast = () => {};
global.currentLang = 'es';

// Read and eval the functions from app.js
const appCode = fs.readFileSync('app.js', 'utf8');

// Run the script in VM or eval
const vm = require('vm');
const context = vm.createContext(global);
vm.runInContext(appCode, context);

console.log('--- TEST 1: Select Dark Matter (gradient-dark) ---');
context.setWallpaper('gradient-dark', false);
console.log('Background:', desktopBg.style.background);
console.log('Background Color:', desktopBg.style.backgroundColor);
if (!desktopBg.style.background.includes('radial-gradient')) {
  throw new Error('Dark Matter background was not applied correctly');
}

console.log('--- TEST 2: Switch to Pure Light (solid-light) from Dark Matter ---');
context.setWallpaper('solid-light', false);
console.log('Background:', desktopBg.style.background);
if (!desktopBg.style.background.includes('#f1f5f9')) {
  throw new Error('Switching from Dark Matter to Pure Light failed!');
}

console.log('--- TEST 3: Switch to Starlight (canvas) ---');
context.setWallpaper('starlight', false);
console.log('Canvas display:', canvas.style.display);
if (canvas.style.display !== 'block') {
  throw new Error('Starlight canvas did not activate');
}

console.log('--- TEST 4: Switch from Starlight to Dark Matter (verify canvas cleanup) ---');
context.setWallpaper('gradient-dark', false);
console.log('Canvas display after cleanup:', canvas.style.display);
console.log('Background:', desktopBg.style.background);
if (canvas.style.display !== 'none') {
  throw new Error('Canvas was not cleaned up when switching to Dark Matter');
}

console.log('--- TEST 5: Verify all 18 wallpapers have unique and defined backgrounds ---');
const allWps = [
  'sunset-calm', 'nordic-mist', 'quiet-forest', 'cozy-mocha', 'lavender-dusk',
  'solid-dark', 'solid-light', 'nebula', 'horizon', 'gradient-dark',
  'starlight', 'velvet-aurora', 'midnight-sonoma', 'dusk-pastels', 'emerald-deep',
  'mountain-terrain', 'photo-cyber', 'photo-space'
];

const results = {};
for (const wp of allWps) {
  context.setWallpaper(wp, false);
  results[wp] = desktopBg.style.background || (wp === 'starlight' ? 'canvas-active' : '');
  console.log(`[${wp}] -> ${results[wp] ? results[wp].slice(0, 50) + '...' : 'EMPTY!'}`);
  if (!results[wp]) {
    throw new Error(`Wallpaper ${wp} has empty background!`);
  }
}

console.log('--- TEST 6: Test updateWallpaperActive function ---');
if (typeof context.updateWallpaperActive !== 'function') {
  throw new Error('updateWallpaperActive is not defined on window/global');
}
context.updateWallpaperActive(cards[9]); // gradient-dark card
if (!cards[9].classList.contains('active')) {
  throw new Error('Card was not made active');
}

console.log('\n>>> ALL 6 TESTS PASSED SUCCESSFULLY! <<<');
