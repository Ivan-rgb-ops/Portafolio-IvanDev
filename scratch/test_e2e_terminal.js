const fs = require('fs');
const vm = require('vm');

// Set up full browser mock
const elements = {};
function getOrCreateElem(id) {
  if (!elements[id]) {
    elements[id] = {
      id,
      style: {},
      classList: {
        add: () => {},
        remove: () => {},
        contains: () => false
      },
      getAttribute: (k) => k === 'data-src' ? 'https://archive.org/embed/doom_dos' : null,
      setAttribute: () => {},
      appendChild: (c) => {},
      closest: () => ({ scrollTop: 0, scrollHeight: 100 })
    };
  }
  return elements[id];
}

const docBody = {
  appendChild: (el) => { elements[el.id || Math.random()] = el; },
  removeChild: (el) => { if (el.id) delete elements[el.id]; }
};

global.window = {
  innerWidth: 1920,
  innerHeight: 1080,
  addEventListener: () => {},
  removeEventListener: () => {},
  SoundSystem: { play: () => {}, updateUI: () => {} },
  showToast: () => {},
  currentLang: 'es'
};

global.document = {
  body: docBody,
  getElementById: (id) => getOrCreateElem(id),
  createElement: (tag) => ({
    tagName: tag,
    style: {},
    classList: { add: () => {}, remove: () => {} },
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
  querySelectorAll: () => [],
  querySelector: () => null,
  addEventListener: () => {},
  removeEventListener: () => {},
  documentElement: { style: { setProperty: () => {} } }
};

global.requestAnimationFrame = (fn) => setTimeout(fn, 16);
global.cancelAnimationFrame = (id) => clearTimeout(id);
global.performance = { now: () => Date.now() };

global.SafeStorage = {
  get: (k, d) => d,
  set: () => {}
};

// 1. Load app.js
const appCode = fs.readFileSync('app.js', 'utf8');
vm.runInThisContext(appCode);

// 2. Load terminal-easter-eggs.js
const easterCode = fs.readFileSync('terminal-easter-eggs.js', 'utf8');
vm.runInThisContext(easterCode);

// Check windowConfigs has doom
if (!windowConfigs.doom) {
  throw new Error('windowConfigs.doom missing');
}
console.log('windowConfigs.doom verified:', windowConfigs.doom);

// Mock terminal output container
const termOutput = getOrCreateElem('term-output');
termOutput.appendChild = (child) => {
  termOutput.lastChild = child;
};

// Test executeCommand('doom')
console.log('\nExecuting "doom"...');
executeCommand('doom');
if (!termOutput.lastChild || !termOutput.lastChild.innerHTML.includes('DOOM')) {
  throw new Error('executeCommand("doom") failed to output Doom text');
}
console.log('Doom output:', termOutput.lastChild.innerHTML.trim());

// Test executeCommand('matrix')
console.log('\nExecuting "matrix"...');
executeCommand('matrix');
if (!termOutput.lastChild || !termOutput.lastChild.innerHTML.includes('Matrix')) {
  throw new Error('executeCommand("matrix") failed to output Matrix text');
}
console.log('Matrix output:', termOutput.lastChild.innerHTML.trim());

// Test executeCommand('sudo hire-me')
console.log('\nExecuting "sudo hire-me"...');
executeCommand('sudo hire-me');
if (!termOutput.lastChild || !termOutput.lastChild.innerHTML.includes('CANDIDATO CONTRATADO')) {
  throw new Error('executeCommand("sudo hire-me") failed');
}
console.log('Sudo hire-me output verified.');

// Test executeCommand('coffee')
console.log('\nExecuting "coffee"...');
executeCommand('coffee');
if (!termOutput.lastChild || !termOutput.lastChild.innerHTML.includes('Café recién preparado')) {
  throw new Error('executeCommand("coffee") failed');
}
console.log('Coffee output verified.');

// Test executeCommand('help')
console.log('\nExecuting "help"...');
executeCommand('help');
if (!termOutput.lastChild || !termOutput.lastChild.innerHTML.includes('easter eggs')) {
  throw new Error('executeCommand("help") does not include easter eggs');
}
console.log('Help includes easter eggs hint.');

console.log('\n>>> E2E INTEGRATION TEST PASSED! <<<');
