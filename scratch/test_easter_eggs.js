const fs = require('fs');
const vm = require('vm');

// Mock DOM environment
const elements = {};
function getOrCreateElem(id) {
  if (!elements[id]) {
    elements[id] = {
      id,
      style: {},
      classList: new Set(),
      getAttribute: (k) => k === 'data-src' ? 'https://archive.org/embed/doom_dos' : null,
      setAttribute: () => {},
      appendChild: (c) => {},
      remove: () => { delete elements[id]; }
    };
  }
  return elements[id];
}

const docBody = {
  appendChild: (el) => { elements[el.id || Math.random()] = el; },
  removeChild: (el) => { if (el.id) delete elements[el.id]; }
};

const domEvents = {};

global.window = {
  innerWidth: 1920,
  innerHeight: 1080,
  addEventListener: (ev, fn) => { domEvents[ev] = fn; },
  removeEventListener: (ev, fn) => { delete domEvents[ev]; },
  openWindow: (name) => {
    console.log(`[MOCK openWindow called with: ${name}]`);
    getOrCreateElem(`win-${name}`).style.display = 'flex';
  },
  SoundSystem: { play: (s) => console.log(`[Sound played: ${s}]`) },
  showToast: (msg) => console.log(`[Toast shown: ${msg}]`),
  currentLang: 'es'
};

global.document = {
  body: docBody,
  getElementById: (id) => getOrCreateElem(id),
  createElement: (tag) => ({
    tagName: tag,
    style: {},
    classList: new Set(),
    setAttribute: () => {},
    getAttribute: () => null,
    getContext: () => ({
      fillRect: () => {},
      clearRect: () => {},
      fillText: () => {},
      save: () => {},
      restore: () => {},
      translate: () => {},
      rotate: () => {},
      scale: () => {}
    }),
    addEventListener: () => {},
    removeEventListener: () => {},
    remove: function() { if (this.id) delete elements[this.id]; }
  }),
  addEventListener: () => {},
  removeEventListener: () => {}
};

global.requestAnimationFrame = (fn) => setTimeout(fn, 16);
global.cancelAnimationFrame = (id) => clearTimeout(id);
global.performance = { now: () => Date.now() };

// Load and execute terminal-easter-eggs.js
const eggCode = fs.readFileSync('terminal-easter-eggs.js', 'utf8');
vm.runInThisContext(eggCode);

if (!global.window.TerminalEasterEggs) {
  throw new Error('TerminalEasterEggs module not attached to window');
}

console.log('--- TEST 1: Command "doom" ---');
const respDoom = { innerHTML: '' };
const handledDoom = global.window.TerminalEasterEggs.handle('doom', respDoom, {});
if (!handledDoom || !respDoom.innerHTML.includes('DOOM')) {
  throw new Error('Failed to handle "doom" command');
}
const iframe = getOrCreateElem('doom-iframe');
if (!iframe.src || !iframe.src.includes('archive.org')) {
  throw new Error('DOOM iframe src not set properly');
}
console.log('Doom OK. iframe src:', iframe.src);

console.log('--- TEST 2: Command "matrix" ---');
const respMatrix = { innerHTML: '' };
const handledMatrix = global.window.TerminalEasterEggs.handle('matrix', respMatrix, {});
if (!handledMatrix || !respMatrix.innerHTML.includes('Matrix')) {
  throw new Error('Failed to handle "matrix" command');
}
if (!elements['matrix-rain-overlay']) {
  throw new Error('Matrix overlay canvas was not created');
}
console.log('Matrix overlay created. Stopping matrix...');
global.window.TerminalEasterEggs.stopMatrix();
console.log('Matrix OK.');

console.log('--- TEST 3: Command "sudo hire-me" ---');
const respHire = { innerHTML: '' };
const handledHire = global.window.TerminalEasterEggs.handle('sudo hire-me', respHire, {});
if (!handledHire || !respHire.innerHTML.includes('CANDIDATO CONTRATADO')) {
  throw new Error('Failed to handle "sudo hire-me" command');
}
if (!elements['hire-confetti-canvas']) {
  throw new Error('Confetti canvas was not created');
}
console.log('Sudo hire-me OK.');

console.log('--- TEST 4: Command "coffee" ---');
const respCoffee = { innerHTML: '' };
const handledCoffee = global.window.TerminalEasterEggs.handle('coffee', respCoffee, {});
if (!handledCoffee || !respCoffee.innerHTML.includes('Café recién preparado')) {
  throw new Error('Failed to handle "coffee" command');
}
console.log('Coffee ASCII art OK.');

console.log('--- TEST 5: Unknown command ---');
const handledUnknown = global.window.TerminalEasterEggs.handle('neofetch', {}, {});
if (handledUnknown !== false) {
  throw new Error('Easter eggs handler should return false for normal commands');
}
console.log('Unknown command fallback OK.');

console.log('\n>>> ALL EASTER EGG UNIT TESTS PASSED SUCCESSFULLY! <<<');
