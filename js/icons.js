const paths = {
  search: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/>',
  minimize: '<path d="M5 12h14"/>', maximize: '<rect x="5" y="5" width="14" height="14" rx="1"/>',
  restore: '<path d="M8 5V3h13v13h-2"/><rect x="3" y="8" width="13" height="13" rx="1"/>',
  close: '<path d="m6 6 12 12M18 6 6 18"/>',
  folder: '<path d="M3 7V5h7l2 2h9v13H3z"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21v-2a8 8 0 0 1 16 0v2"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 6 9 7 9-7"/>',
  terminal: '<path d="m4 6 6 6-6 6m9 0h7"/>',
  settings: '<path d="m9 3 6 0 1 3 3 1 2 5-2 5-3 1-1 3H9l-1-3-3-1-2-5 2-5 3-1z"/><circle cx="12" cy="12" r="3"/>',
  power: '<path d="M12 2v10m-6-7a9 9 0 1 0 12 0"/>',
  lock: '<rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
  refresh: '<path d="M20 7a9 9 0 1 0 1 9M20 2v6h-6"/>',
  desktop: '<rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8m-4-4v4"/>',
  paint: '<path d="m14 3 7 7-10 10H4v-7zM11 6l7 7M3 22h18"/>',
  moon: '<path d="M20 15A9 9 0 0 1 9 4a9 9 0 1 0 11 11z"/>',
  sparkles: '<path d="m12 2 3 7 7 3-7 3-3 7-3-7-7-3 7-3z"/>',
  wifi: '<path d="M2 8a16 16 0 0 1 20 0M5 12a11 11 0 0 1 14 0M8 16a6 6 0 0 1 8 0"/><circle cx="12" cy="20" r=".8" fill="currentColor"/>',
  volume: '<path d="M3 9h4l5-5v16l-5-5H3zM16 8a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14"/>',
  battery: '<rect x="2" y="6" width="18" height="12" rx="2"/><path d="M23 10v4"/><path d="M5 9h11v6H5z" fill="currentColor" stroke="none"/>',
  chevron: '<path d="m9 5 7 7-7 7"/>', back: '<path d="m10 5-7 7 7 7M3 12h18"/>',
  home: '<path d="m2 11 10-9 10 9M5 9v12h5v-7h4v7h5V9"/>',
  download: '<path d="M12 3v12m-5-5 5 5 5-5M3 16v5h18v-5"/>',
  code: '<path d="m8 6-6 6 6 6m8-12 6 6-6 6M14 3l-4 18"/>',
  chat: '<path d="M3 3h18v14H9l-6 4z"/><path d="M7 8h10M7 12h7"/>',
  trash: '<path d="M3 6h18M8 6V3h8v3M5 6l1 15h12l1-15M10 10v7m4-7v7"/>',
};

export function icon(name, className = '') {
  if (name === 'windows') return '<svg class="icon windows-logo" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M1 1h10v10H1zm12 0h10v10H13zM1 13h10v10H1zm12 0h10v10H13z"/></svg>';
  if (name === 'taskview') return '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><rect x="2" y="3" width="13" height="18" rx="2" fill="#6b8dc9"/><rect x="10" y="6" width="12" height="15" rx="2" fill="#c1a8e9" stroke="white" stroke-width="1"/></svg>';
  return `<svg class="icon ${className}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] || paths.code}</svg>`;
}

// Local, vector application artwork; shared by desktop, taskbar and title bars.
let iconSequence=0;
export function appIcon(name) {
  const id = `g-${name}-${++iconSequence}`;
  const artwork = {
    explorer: `<path d="M4 10h18l4 5h34v37H4z" fill="#e6a724"/><path d="M5 19h54v34H5z" fill="url(#${id})"/><path d="M7 23h50" stroke="#ffeb9c" stroke-width="2"/>`,
    projects: `<path d="M4 10h18l5 5h33v37H4z" fill="#dc9b24"/><path d="M5 20h54v33H5z" fill="url(#${id})"/><rect x="24" y="30" width="28" height="25" rx="4" fill="#0078d4"/><path d="m34 37-5 5 5 5m7-10 5 5-5 5" stroke="white" stroke-width="2" fill="none"/>`,
    about: `<rect x="8" y="7" width="48" height="50" rx="5" fill="url(#${id})"/><rect x="8" y="7" width="12" height="50" rx="4" fill="#0066bc"/><circle cx="37" cy="25" r="8" fill="#fff"/><path d="M24 47a13 13 0 0 1 26 0" fill="#fff"/><path d="M5 19h6M5 29h6M5 39h6" stroke="#a9ddff" stroke-width="3"/>`,
    resume: `<path d="M13 4h26l13 13v43H13z" fill="url(#${id})"/><path d="M39 4v14h13" fill="#a6d7ff"/><path d="M21 28h22M21 35h22M21 42h16M21 49h19" stroke="#3777ba" stroke-width="3"/><rect x="5" y="39" width="28" height="17" rx="3" fill="#dd3c42"/><text x="19" y="51" text-anchor="middle" font-family="sans-serif" font-weight="700" font-size="10" fill="white">PDF</text>`,
    contact: `<rect x="5" y="15" width="54" height="40" rx="4" fill="url(#${id})"/><path d="m5 17 27 22 27-22" fill="#67c3ff"/><path d="m5 55 21-20m33 20L38 35" stroke="#0879c7" stroke-width="1"/>`,
    terminal: `<rect x="4" y="9" width="56" height="46" rx="5" fill="url(#${id})" stroke="#8c9db0"/><path d="m14 23 10 9-10 9m18 1h14" stroke="#f3f6ff" stroke-width="3" fill="none"/><path d="M8 13h48" stroke="#68747d"/>`,
    chat: `<path d="M7 10h50v36H27L14 57V46H7z" fill="url(#${id})"/><path d="m32 18 3.5 9 9 3.5-9 3.5-3.5 9-3.5-9-9-3.5 9-3.5z" fill="white"/>`,
    settings: `<path d="m25 4 14 0 3 8 8 1 7 12-5 7 5 7-7 12-8 1-3 8H25l-3-8-8-1-7-12 5-7-5-7 7-12 8-1z" fill="url(#${id})"/><circle cx="32" cy="32" r="13" fill="#d0dce9"/><circle cx="32" cy="32" r="8" fill="#3489d1"/>`,
    recycle: `<path d="m15 14 3 44h28l3-44z" fill="url(#${id})" stroke="#8aa9bc"/><path d="M12 11h40v5H12z" fill="#e7f7ff"/><path d="m25 27 6-6 7 4-3 1m8 5 2 8-8 5v-4m-5 8-8-2-1-8 3 2" stroke="#49a7d5" fill="none" stroke-width="2"/>`,
  };
  const colors = {
    explorer:['#ffe699','#f4b52c'], projects:['#ffe699','#f4b52c'], about:['#58b4f5','#1480dc'],
    resume:['#fcfeff','#d2e9ff'], contact:['#39b9ff','#0873c9'], terminal:['#344454','#14212e'],
    chat:['#bb80f9','#6440d3'], settings:['#b4c4d2','#5b7289'], recycle:['#ffffff','#c7e0ed'],
  };
  const [a,b] = colors[name] || colors.about;
  return `<svg class="app-icon" viewBox="0 0 64 64" aria-hidden="true"><defs><linearGradient id="${id}" x2=".4" y2="1"><stop stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs>${artwork[name] || artwork.about}</svg>`;
}

export function hydrateIcons(root = document) {
  root.querySelectorAll('[data-icon]').forEach(el => { el.outerHTML = icon(el.dataset.icon); });
  root.querySelectorAll('[data-app-icon]').forEach(el => { el.outerHTML = appIcon(el.dataset.appIcon); });
}
