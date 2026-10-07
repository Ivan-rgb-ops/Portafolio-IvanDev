// Portfolio OS - Core Window & System Manager (GSAP 3 + Apple HIG + Emil Kowalski Design)
// Iván Pieretto — Full Stack Developer

// Safe Storage Helper to prevent SecurityError in incognito or iframe sandboxes
const SafeStorage = {
  get(key, fallback = null) {
    try {
      const val = localStorage.getItem(key);
      return val !== null ? val : fallback;
    } catch (e) {
      return fallback;
    }
  },
  set(key, val) {
    try {
      localStorage.setItem(key, String(val));
    } catch (e) {}
  },
  remove(key) {
    try {
      localStorage.removeItem(key);
    } catch (e) {}
  }
};

let zIndexCounter = 100;
let activeWindowId = null;
let currentLang = SafeStorage.get('portfolio-os-lang', 'es');
let isBooting = true;
let loginAutoTyping = false;
let dragState = null;
let wallpaperAnimFrame = null;
let starlightResizeHandler = null;
let toastTimer = null;

/* ==================== SOUND SYSTEM (WEB AUDIO API - APPLE HIG SOUND DESIGN) ==================== */
const SoundSystem = {
  ctx: null,
  muted: false,
  lastTickTime: 0,

  _initialized: false,
  init() {
    if (this._initialized) return;
    const saved = SafeStorage.get('portfolio-sound-muted');
    if (saved !== null) {
      this.muted = saved === 'true';
    }
    this._initialized = true;
  },

  unlockAudio() {
    try {
      if (!this.ctx && (window.AudioContext || window.webkitAudioContext)) {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
    } catch(e) {
      console.warn('[SoundSystem] Init error:', e);
    }
  },

  toggleMute() {
    this.unlockAudio();
    this.muted = !this.muted;
    SafeStorage.set('portfolio-sound-muted', this.muted);
    this.updateUI();
    if (!this.muted) {
      this.play('click');
      showToast(currentLang === 'es' ? 'Sonido activado 🔊' : 'Sound unmuted 🔊');
    } else {
      showToast(currentLang === 'es' ? 'Sonido silenciado 🔇' : 'Sound muted 🔇');
    }
  },

  updateUI() {
    this.init();
    const iconOn = document.getElementById('sound-icon-on');
    const iconOff = document.getElementById('sound-icon-off');
    const btn = document.getElementById('sound-toggle-btn');
    if (iconOn && iconOff) {
      if (this.muted) {
        iconOn.style.display = 'none';
        iconOff.style.display = 'inline-block';
        if (btn) btn.title = currentLang === 'es' ? 'Sonido silenciado (clic para activar)' : 'Sound muted (click to unmute)';
      } else {
        iconOn.style.display = 'inline-block';
        iconOff.style.display = 'none';
        if (btn) btn.title = currentLang === 'es' ? 'Sonido activado (clic para silenciar)' : 'Sound active (click to mute)';
      }
    }
  },

  play(type) {
    if (this.muted) return;
    this.unlockAudio();
    if (!this.ctx) return;

    if (this.ctx.state === 'suspended') {
      this.ctx.resume().then(() => this._synth(type)).catch(() => {});
    } else {
      this._synth(type);
    }
  },

  _synth(type) {
    try {
      const now = this.ctx.currentTime;

      if (type === 'startup') {
        // Iconic Apple Startup Chime (F# Major) - Soft, warm, velvety
        const chord = [
          { freq: 185.00, vol: 0.10 },
          { freq: 277.18, vol: 0.07 },
          { freq: 369.99, vol: 0.05 },
          { freq: 466.16, vol: 0.035 },
          { freq: 554.37, vol: 0.025 }
        ];
        const masterGain = this.ctx.createGain();
        masterGain.gain.setValueAtTime(0.0001, now);
        masterGain.gain.linearRampToValueAtTime(0.10, now + 0.14);
        masterGain.gain.exponentialRampToValueAtTime(0.00001, now + 2.7);

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1400, now);
        filter.frequency.exponentialRampToValueAtTime(450, now + 2.6);

        masterGain.connect(filter);
        filter.connect(this.ctx.destination);

        chord.forEach(item => {
          const osc = this.ctx.createOscillator();
          const oscGain = this.ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(item.freq, now);
          oscGain.gain.setValueAtTime(item.vol, now);
          osc.connect(oscGain);
          oscGain.connect(masterGain);
          osc.start(now);
          osc.stop(now + 2.7);
        });
      }

      else if (type === 'click') {
        // Crisp tactile click
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(1100, now);
        osc.frequency.exponentialRampToValueAtTime(280, now + 0.06);
        gain.gain.setValueAtTime(0.18, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.06);
      }

      else if (type === 'open') {
        // Bright harmonic chime
        const notes = [523.25, 783.99, 1046.50]; // C5, G5, C6
        notes.forEach((freq, idx) => {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          const start = now + idx * 0.04;
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, start);
          gain.gain.setValueAtTime(0, start);
          gain.gain.linearRampToValueAtTime(0.14, start + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.42);
          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start(start);
          osc.stop(start + 0.43);
        });
      }

      else if (type === 'close') {
        // Satisfying acoustic descending pop
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(560, now);
        osc.frequency.exponentialRampToValueAtTime(160, now + 0.08);
        gain.gain.setValueAtTime(0.16, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.08);
      }

      else if (type === 'minimize') {
        // Subtle whoosh swooping down
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(620, now);
        osc.frequency.exponentialRampToValueAtTime(180, now + 0.16);
        gain.gain.setValueAtTime(0.14, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.16);
      }

      else if (type === 'dockHover') {
        const timeSince = now - this.lastTickTime;
        if (timeSince > 0.09) {
          this.lastTickTime = now;
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(950, now);
          osc.frequency.exponentialRampToValueAtTime(520, now + 0.025);
          gain.gain.setValueAtTime(0.035, now);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.025);
          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start(now);
          osc.stop(now + 0.025);
        }
      }

      else if (type === 'dockBounce') {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(280, now);
        osc.frequency.exponentialRampToValueAtTime(600, now + 0.10);
        gain.gain.setValueAtTime(0.16, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.12);
      }

      else if (type === 'keystroke') {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(750 + Math.random() * 250, now);
        gain.gain.setValueAtTime(0.05, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.03);
      }

      else if (type === 'toast') {
        [880, 1318.5].forEach((freq, i) => {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          const start = now + i * 0.09;
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, start);
          gain.gain.setValueAtTime(0.14, start);
          gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.22);
          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start(start);
          osc.stop(start + 0.23);
        });
      }
    } catch(err) {
      console.warn('[SoundSystem] Play error:', err);
    }
  }
};

// Global audio unlock listeners
['click', 'pointerdown', 'keydown', 'touchstart'].forEach(evt => {
  window.addEventListener(evt, () => SoundSystem.unlockAudio(), { passive: true });
});

// Window Configurations
const windowConfigs = {
  about: { title: 'Sobre Mí', titleEn: 'About Me', defaultW: 780, defaultH: 540, minW: 340, minH: 260 },
  projects: { title: 'Proyectos', titleEn: 'Projects', defaultW: 860, defaultH: 580, minW: 360, minH: 280 },
  resume: { title: 'Currículum', titleEn: 'Resume', defaultW: 760, defaultH: 600, minW: 340, minH: 280 },
  contact: { title: 'Contacto', titleEn: 'Contact', defaultW: 680, defaultH: 500, minW: 320, minH: 260 },
  terminal: { title: 'Terminal', titleEn: 'Terminal', defaultW: 640, defaultH: 420, minW: 340, minH: 220 },
  chat: { title: 'Iván AI', titleEn: 'Iván AI', defaultW: 560, defaultH: 520, minW: 320, minH: 260 },
  settings: { title: 'Configuración', titleEn: 'Settings', defaultW: 600, defaultH: 480, minW: 340, minH: 260 },
  doom: { title: 'DOOM (1993)', titleEn: 'DOOM (1993)', defaultW: 760, defaultH: 540, minW: 360, minH: 260 }
};

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  initClock();
  initDesktopIcons();
  initTaskbarIcons();
  initDockMagnification();
  SoundSystem.updateUI();
  initStartMenu();
  initTerminal();
  initChat();
  initSettings();
  initBootSequence();
  initContextMenu();
  initSpotlight();
  initWindowResizing();
  applyLanguage(currentLang);

  // Close menus on outside click
  document.addEventListener('click', (e) => {
    const startMenu = document.getElementById('start-menu-card');
    const startBtn = document.getElementById('start-btn');
    if (startMenu && startMenu.classList.contains('open')) {
      if (!startMenu.contains(e.target) && !startBtn.contains(e.target)) {
        startMenu.classList.remove('open');
      }
    }
  });

  // Global keyboard shortcuts (Unified Priority Dispatcher)
  document.addEventListener('keydown', (e) => {
    // Alt + W or Ctrl + Shift + W: Close all open windows
    if ((e.altKey && e.key.toLowerCase() === 'w') || (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'w')) {
      e.preventDefault();
      closeAllWindows();
      return;
    }

    // F5: Refresh desktop
    if (e.key === 'F5') {
      e.preventDefault();
      refreshDesktop();
      return;
    }

    // Escape Key Unified Priority: Modales > Spotlight > Menú Inicio > Menú Contextual > Ventana Activa
    if (e.key === 'Escape') {
      const anyModalOpen = document.querySelector('.modal-overlay.open') || document.querySelector('.modal-overlay[style*="display: flex"]');
      const spotlightOpen = document.querySelector('#spotlight-overlay.open');
      const startMenu = document.getElementById('start-menu-card');
      const contextMenu = document.getElementById('desktop-context-menu') || document.getElementById('context-menu');
      const isContextOpen = contextMenu && (contextMenu.classList.contains('open') || contextMenu.style.display === 'block');

      if (anyModalOpen) {
        closeAllModals();
      } else if (spotlightOpen) {
        closeSpotlight();
      } else if (startMenu && startMenu.classList.contains('open')) {
        startMenu.classList.remove('open');
      } else if (isContextOpen) {
        closeContextMenu();
      } else if (activeWindowId) {
        closeWindow(activeWindowId);
      }
    }
  });
});

/* ==================== BOOT & LOGIN ANIMATION ==================== */
function initBootSequence() {
  updateLockClock();
  setInterval(updateLockClock, 1000);

  const lockView = document.getElementById('lock-view');
  if (lockView) {
    lockView.addEventListener('click', transitionLockToLogin);
  }
  document.addEventListener('keydown', handleBootKeydown);
}

function updateLockClock() {
  const now = new Date();
  const lockClock = document.getElementById('lock-clock');
  const lockDate = document.getElementById('lock-date');

  if (lockClock) {
    let hours = now.getHours();
    let mins = now.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    const hoursStr = hours < 10 ? `0${hours}` : `${hours}`;
    const minsStr = mins < 10 ? `0${mins}` : `${mins}`;
    lockClock.innerText = `${hoursStr}:${minsStr} ${ampm}`;
  }

  if (lockDate) {
    const options = { weekday: 'long', month: 'long', day: 'numeric' };
    const dateStr = now.toLocaleDateString(currentLang === 'es' ? 'es-ES' : 'en-US', options);
    lockDate.innerText = dateStr.charAt(0).toUpperCase() + dateStr.slice(1);
  }
}

function transitionLockToLogin() {
  const lockView = document.getElementById('lock-view');
  const loginView = document.getElementById('login-view');
  if (!lockView || !loginView || loginAutoTyping) return;

  if (window.gsap) {
    gsap.to(lockView, {
      y: -40,
      opacity: 0,
      duration: 0.35,
      ease: "power2.in",
      onComplete: () => {
        lockView.style.display = 'none';
        loginView.style.display = 'flex';
        gsap.fromTo(loginView,
          { opacity: 0, scale: 0.94, y: 30 },
          { opacity: 1, scale: 1, y: 0, duration: 0.45, ease: "back.out(1.2)" }
        );
      }
    });
  } else {
    lockView.classList.add('hidden-phase');
    loginView.classList.add('active-phase');
  }

  loginAutoTyping = true;
  setTimeout(startPasswordTypingAnimation, 450);
}

function startPasswordTypingAnimation() {
  const pwdInput = document.getElementById('login-password');
  const submitBtn = document.getElementById('login-submit-btn');
  if (!pwdInput) return;

  pwdInput.classList.add('typing');
  const targetPassword = "ivan";
  let currentIdx = 0;

  function typeNextChar() {
    if (!isBooting) return;
    if (currentIdx < targetPassword.length) {
      pwdInput.value = targetPassword.slice(0, currentIdx + 1);
      currentIdx++;
      SoundSystem.play('keystroke');
      const delay = Math.floor(Math.random() * 40) + 90;
      setTimeout(typeNextChar, delay);
    } else {
      pwdInput.classList.remove('typing');
      if (submitBtn) submitBtn.classList.add('pulse-active');
      setTimeout(() => {
        submitLogin();
      }, 350);
    }
  }

  typeNextChar();
}

function submitLogin() {
  if (!isBooting) return;
  const statusLabel = document.getElementById('login-status-text');
  const spinner = document.getElementById('login-spinner');
  const submitBtn = document.getElementById('login-submit-btn');

  SoundSystem.play('click');
  if (spinner) spinner.style.display = 'block';
  if (submitBtn) submitBtn.classList.remove('pulse-active');

  const steps = [
    currentLang === 'es' ? 'Iniciando sesión…' : 'Signing in…',
    currentLang === 'es' ? 'Preparando escritorio…' : 'Preparing desktop…'
  ];

  let stepIdx = 0;
  if (statusLabel) statusLabel.innerText = steps[0];

  const interval = setInterval(() => {
    stepIdx++;
    if (stepIdx < steps.length) {
      if (statusLabel) statusLabel.innerText = steps[stepIdx];
    } else {
      clearInterval(interval);
      finishBoot();
    }
  }, 280);
}

function finishBoot() {
  isBooting = false;
  document.removeEventListener('keydown', handleBootKeydown);
  SoundSystem.play('startup');
  const bootScreen = document.getElementById('boot-screen');

  if (bootScreen) {
    if (window.gsap) {
      gsap.to(bootScreen, {
        opacity: 0,
        scale: 1.04,
        duration: 0.55,
        ease: "power2.inOut",
        onComplete: () => {
          bootScreen.style.display = 'none';
        }
      });
      // Stagger desktop icons in with Apple precision
      gsap.from('.desktop-icon', {
        opacity: 0,
        y: 16,
        scale: 0.9,
        stagger: 0.035,
        duration: 0.45,
        ease: "back.out(1.2)",
        clearProps: "opacity,y,scale"
      });
      // Slide dock and tray in
      gsap.from('#taskbar-nav, [aria-label="System tray"]', {
        opacity: 0,
        y: 20,
        duration: 0.45,
        ease: "power3.out",
        delay: 0.1
      });
    } else {
      bootScreen.classList.add('dismissed');
      setTimeout(() => {
        bootScreen.style.display = 'none';
      }, 600);
    }
  }
}

function handleBootKeydown(e) {
  if (!isBooting) return;
  if (e.key === 'Enter' || e.key === 'ArrowRight' || e.key === ' ') {
    e.preventDefault();
    if (!loginAutoTyping) {
      transitionLockToLogin();
    } else {
      submitLogin();
    }
  }
}

function lockScreen() {
  const bootScreen = document.getElementById('boot-screen');
  const lockView = document.getElementById('lock-view');
  const loginView = document.getElementById('login-view');
  const pwdInput = document.getElementById('login-password');
  const spinner = document.getElementById('login-spinner');
  const statusLabel = document.getElementById('login-status-text');

  if (!bootScreen) return;
  isBooting = true;
  loginAutoTyping = false;

  if (pwdInput) pwdInput.value = '';
  if (spinner) spinner.style.display = 'none';
  if (statusLabel) statusLabel.innerText = currentLang === 'es' ? 'Iniciando sesión como invitado…' : 'Signing in as guest…';

  lockView.style.display = 'flex';
  lockView.style.opacity = '1';
  lockView.style.transform = 'none';
  loginView.style.display = 'none';
  bootScreen.style.display = 'flex';
  bootScreen.style.opacity = '1';
  bootScreen.style.transform = 'none';

  document.addEventListener('keydown', handleBootKeydown);
  const startMenu = document.getElementById('start-menu-card');
  if (startMenu) startMenu.classList.remove('open');

  showToast(currentLang === 'es' ? 'Pantalla bloqueada' : 'Screen locked');
}

/* ==================== WINDOW MANAGEMENT (GSAP-POWERED) ==================== */
function openWindow(name) {
  const win = document.getElementById(`win-${name}`);
  if (!win) return;
  attachWindowResizeHandles(win);

  const cfg = windowConfigs[name] || { defaultW: 740, defaultH: 520 };
  const isClosed = win.style.display === 'none' || !win.style.display;

  if (window.gsap) gsap.killTweensOf(win);

  if (isClosed) {
    SoundSystem.play('open');
    const screenW = window.innerWidth;
    const screenH = window.innerHeight;
    const w = Math.min(cfg.defaultW, screenW - 32);
    const h = Math.min(cfg.defaultH, screenH - 96);

    const stagger = (zIndexCounter % 6) * 18;
    const left = Math.max(16, Math.floor((screenW - w) / 2) + stagger);
    const top = Math.max(16, Math.floor((screenH - h) / 2) - 20 + stagger);

    win.style.width = `${w}px`;
    win.style.height = `${h}px`;
    win.style.left = `${left}px`;
    win.style.top = `${top}px`;
    win.style.display = 'flex';

    if (win._isMinimized) {
      // Restore from Dock position with physical spring
      win._isMinimized = false;
      const dockBtn = document.querySelector(`.island-icon[data-window-origin="${name}"]`) || document.querySelector(`.dock-item-wrap[data-dock-origin="${name}"]`);
      const dockRect = dockBtn ? dockBtn.getBoundingClientRect() : { left: screenW/2, top: screenH - 40, width: 40, height: 40 };
      const deltaX = (dockRect.left + dockRect.width / 2) - (left + w / 2);
      const deltaY = (dockRect.top + dockRect.height / 2) - (top + h / 2);

      if (window.gsap) {
        gsap.fromTo(win,
          { opacity: 0, scale: 0.15, x: deltaX, y: deltaY },
          { opacity: 1, scale: 1, x: 0, y: 0, duration: 0.32, ease: "back.out(1.15)", clearProps: "transform" }
        );
      }
    } else {
      // Emil Kowalski entrance: Never start from 0. Enter from 0.95 with smooth organic ease
      if (window.gsap) {
        gsap.fromTo(win,
          { opacity: 0, scale: 0.95, y: 14 },
          { opacity: 1, scale: 1, y: 0, duration: 0.28, ease: "power3.out", clearProps: "transform" }
        );
      }
    }
  } else if (win.classList.contains('active')) {
    // Already open and active: gentle tactile nudge
    if (window.gsap) {
      gsap.fromTo(win, { scale: 1.01 }, { scale: 1, duration: 0.2, ease: "power2.out", clearProps: "transform" });
    }
  }

  focusWindow(name);
  updateDockState(name, true);

  const startMenu = document.getElementById('start-menu-card');
  if (startMenu) startMenu.classList.remove('open');
}

function closeWindow(name) {
  const win = document.getElementById(`win-${name}`);
  if (!win) return;

  if (name === 'doom' && window.TerminalEasterEggs && typeof window.TerminalEasterEggs.onDoomClosed === 'function') {
    window.TerminalEasterEggs.onDoomClosed();
  }

  SoundSystem.play('close');
  updateDockState(name, false);

  if (window.gsap) {
    gsap.killTweensOf(win);
    gsap.to(win, {
      opacity: 0,
      scale: 0.96,
      y: 8,
      duration: 0.16,
      ease: "power2.in",
      onComplete: () => {
        win.style.display = 'none';
        win.classList.remove('active', 'maximized');
        gsap.set(win, { clearProps: "all" });
        focusNextTopWindow();
      }
    });
  } else {
    win.style.display = 'none';
    win.classList.remove('active', 'maximized');
    focusNextTopWindow();
  }
}

function closeAllWindows() {
  const openWins = Array.from(document.querySelectorAll('.os-window'))
    .filter(w => w.style.display === 'flex');

  if (openWins.length === 0) {
    showToast(currentLang === 'es' ? 'No hay ventanas abiertas' : 'No open windows');
    return;
  }

  SoundSystem.play('close');

  openWins.forEach((win, index) => {
    const name = win.id.replace('win-', '');
    updateDockState(name, false);

    if (window.gsap) {
      gsap.killTweensOf(win);
      gsap.to(win, {
        opacity: 0,
        scale: 0.95,
        y: 10,
        duration: 0.16,
        delay: index * 0.035,
        ease: "power2.in",
        onComplete: () => {
          win.style.display = 'none';
          win.classList.remove('active', 'maximized');
          gsap.set(win, { clearProps: "all" });
        }
      });
    } else {
      win.style.display = 'none';
      win.classList.remove('active', 'maximized');
    }
  });

  activeWindowId = null;
  document.querySelectorAll('.island-icon').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.dock-item-wrap').forEach(w => w.classList.remove('is-active'));
  showToast(currentLang === 'es' ? 'Todas las ventanas cerradas' : 'All windows closed');
}

function minimizeAllWindows() {
  const openWins = Array.from(document.querySelectorAll('.os-window'))
    .filter(w => w.style.display === 'flex');

  if (openWins.length === 0) return;
  openWins.forEach(win => {
    const name = win.id.replace('win-', '');
    minimizeWindow(name);
  });
  showToast(currentLang === 'es' ? 'Escritorio visible' : 'Desktop revealed');
}

function minimizeWindow(name) {
  const win = document.getElementById(`win-${name}`);
  if (!win) return;

  SoundSystem.play('minimize');
  win._isMinimized = true;

  const dockBtn = document.querySelector(`.island-icon[data-window-origin="${name}"]`) || document.querySelector(`.dock-item-wrap[data-dock-origin="${name}"]`);
  const winRect = win.getBoundingClientRect();
  const dockRect = dockBtn ? dockBtn.getBoundingClientRect() : { left: window.innerWidth / 2, top: window.innerHeight - 40, width: 40, height: 40 };

  const targetX = (dockRect.left + dockRect.width / 2) - (winRect.left + winRect.width / 2);
  const targetY = (dockRect.top + dockRect.height / 2) - (winRect.top + winRect.height / 2);

  if (window.gsap) {
    gsap.killTweensOf(win);
    gsap.to(win, {
      opacity: 0,
      scale: 0.12,
      x: targetX,
      y: targetY,
      duration: 0.26,
      ease: "power2.inOut",
      onComplete: () => {
        win.style.display = 'none';
        win.classList.remove('active');
        gsap.set(win, { clearProps: "transform" });
        focusNextTopWindow();
      }
    });
  } else {
    win.style.display = 'none';
    win.classList.remove('active');
    focusNextTopWindow();
  }
}

function toggleMaximize(name) {
  const win = document.getElementById(`win-${name}`);
  if (!win) return;

  SoundSystem.play('click');
  focusWindow(name);

  if (win.classList.contains('maximized')) {
    // Restore previous bounds
    win.classList.remove('maximized');
    if (win._prevBounds) {
      if (window.gsap) {
        gsap.to(win, {
          left: win._prevBounds.left,
          top: win._prevBounds.top,
          width: win._prevBounds.width,
          height: win._prevBounds.height,
          duration: 0.28,
          ease: "power3.out"
        });
      } else {
        win.style.left = win._prevBounds.left;
        win.style.top = win._prevBounds.top;
        win.style.width = win._prevBounds.width;
        win.style.height = win._prevBounds.height;
      }
    }
  } else {
    // Save current bounds
    win._prevBounds = {
      left: win.style.left,
      top: win.style.top,
      width: win.style.width,
      height: win.style.height
    };
    win.classList.add('maximized');

    const maxW = window.innerWidth - 16;
    const maxH = window.innerHeight - 84; // Leave safe space for dock

    if (window.gsap) {
      gsap.to(win, {
        left: 8,
        top: 8,
        width: maxW,
        height: maxH,
        duration: 0.28,
        ease: "power3.out"
      });
    } else {
      win.style.left = '8px';
      win.style.top = '8px';
      win.style.width = `${maxW}px`;
      win.style.height = `${maxH}px`;
    }
  }
}

function focusWindow(name) {
  const win = document.getElementById(`win-${name}`);
  if (!win) return;

  zIndexCounter += 2;
  win.style.zIndex = zIndexCounter;

  document.querySelectorAll('.os-window').forEach(w => w.classList.remove('active'));
  win.classList.add('active');
  activeWindowId = name;

  // Highlight active icon in dock
  document.querySelectorAll('.island-icon').forEach(btn => {
    if (btn.getAttribute('data-window-origin') === name) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  document.querySelectorAll('.dock-item-wrap').forEach(wrap => {
    if (wrap.getAttribute('data-dock-origin') === name) {
      wrap.classList.add('is-active');
    } else {
      wrap.classList.remove('is-active');
    }
  });
}

function focusNextTopWindow() {
  activeWindowId = null;
  const openWins = Array.from(document.querySelectorAll('.os-window'))
    .filter(w => w.style.display === 'flex')
    .sort((a, b) => (parseInt(b.style.zIndex) || 0) - (parseInt(a.style.zIndex) || 0));

  if (openWins.length > 0) {
    const topName = openWins[0].id.replace('win-', '');
    focusWindow(topName);
  } else {
    // Reset dock active indicators
    document.querySelectorAll('.island-icon').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.dock-item-wrap').forEach(w => w.classList.remove('is-active'));
  }
}

function updateDockState(name, isOpen) {
  const dockBtn = document.querySelector(`.island-icon[data-window-origin="${name}"]`);
  const dockWrap = document.querySelector(`.dock-item-wrap[data-dock-origin="${name}"]`);
  if (dockBtn) {
    if (isOpen) dockBtn.classList.add('active');
    else dockBtn.classList.remove('active');
  }
  if (dockWrap) {
    if (isOpen) dockWrap.classList.add('is-open');
    else dockWrap.classList.remove('is-open', 'is-active');
  }
}

/* ==================== UNIVERSAL POINTER-EVENT WINDOW DRAGGING ==================== */
function handleWindowDragStart(e, winId) {
  // Ignore clicks on buttons, inputs, links, traffic lights, or resize handles
  if (e.target.closest('.traffic-lights, .os-window-resize-handle, button, a, input, select, textarea')) return;

  const win = document.getElementById(winId);
  if (!win || win.classList.contains('maximized')) return;

  focusWindow(winId.replace('win-', ''));

  const rect = win.getBoundingClientRect();
  const winWidth = rect.width;
  const pointerId = e.pointerId;
  const startX = e.clientX;
  const startY = e.clientY;
  const origLeft = rect.left;
  const origTop = rect.top;

  win.classList.add('is-dragging');

  function onPointerMove(ev) {
    if (ev.pointerId !== pointerId) return;
    const dx = ev.clientX - startX;
    const dy = ev.clientY - startY;

    let newLeft = origLeft + dx;
    let newTop = origTop + dy;

    // Bounds checking without forced layout reflow
    newTop = Math.max(0, Math.min(window.innerHeight - 80, newTop));
    newLeft = Math.max(-winWidth + 80, Math.min(window.innerWidth - 80, newLeft));

    win.style.left = `${newLeft}px`;
    win.style.top = `${newTop}px`;
  }

  function onPointerUp(ev) {
    if (ev.pointerId !== pointerId) return;
    win.classList.remove('is-dragging');
    window.removeEventListener('pointermove', onPointerMove);
    window.removeEventListener('pointerup', onPointerUp);
    window.removeEventListener('pointercancel', onPointerUp);
  }

  window.addEventListener('pointermove', onPointerMove, { passive: true });
  window.addEventListener('pointerup', onPointerUp);
  window.addEventListener('pointercancel', onPointerUp);
}

/* ==================== UNIVERSAL WINDOW RESIZING SYSTEM ==================== */
function attachWindowResizeHandles(win) {
  if (!win || win._hasResizeHandles) return;
  win._hasResizeHandles = true;

  const directions = [
    'top', 'right', 'bottom', 'left',
    'top-left', 'top-right', 'bottom-left', 'bottom-right'
  ];

  directions.forEach(dir => {
    const handle = document.createElement('div');
    handle.className = `os-window-resize-handle ${dir}`;
    handle.setAttribute('data-resize-dir', dir);
    handle.addEventListener('pointerdown', (e) => handleWindowResizeStart(e, win, dir));
    win.appendChild(handle);
  });
}

function initWindowResizing() {
  document.querySelectorAll('.os-window').forEach(win => {
    attachWindowResizeHandles(win);
  });
}

function handleWindowResizeStart(e, win, dir) {
  // Only handle primary pointer (usually left button or touch)
  if (e.button !== 0 && e.pointerType === 'mouse') return;
  if (!win || win.classList.contains('maximized')) return;

  e.preventDefault();
  e.stopPropagation();

  // Bring window to front and focus
  const name = win.id.replace('win-', '');
  focusWindow(name);

  if (window.gsap) gsap.killTweensOf(win);

  const rect = win.getBoundingClientRect();
  const startX = e.clientX;
  const startY = e.clientY;
  const startLeft = rect.left;
  const startTop = rect.top;
  const startWidth = rect.width;
  const startHeight = rect.height;
  const pointerId = e.pointerId;

  // Window min/max bounds
  const cfg = windowConfigs[name] || {};
  const minW = cfg.minW || 340;
  const minH = cfg.minH || 220;
  const maxW = Math.max(minW, window.innerWidth - 16);
  const maxH = Math.max(minH, window.innerHeight - 60);

  const handle = e.currentTarget;
  try {
    handle.setPointerCapture(pointerId);
  } catch (err) {}

  win.classList.add('is-resizing');
  document.body.classList.add('is-window-resizing');

  // Set global cursor matching the active resize direction
  const activeCursor = window.getComputedStyle(handle).cursor || 'nwse-resize';
  document.body.style.cursor = activeCursor;

  function onPointerMove(ev) {
    if (ev.pointerId !== pointerId) return;

    const dx = ev.clientX - startX;
    const dy = ev.clientY - startY;

    let newWidth = startWidth;
    let newHeight = startHeight;
    let newLeft = startLeft;
    let newTop = startTop;

    // --- HORIZONTAL RESIZING ---
    if (dir.includes('right')) {
      newWidth = Math.max(minW, Math.min(maxW, startWidth + dx));
      if (startLeft + newWidth > window.innerWidth - 8) {
        newWidth = Math.max(minW, window.innerWidth - 8 - startLeft);
      }
    } else if (dir.includes('left')) {
      let candidateWidth = startWidth - dx;
      if (candidateWidth < minW) {
        candidateWidth = minW;
      } else if (candidateWidth > maxW) {
        candidateWidth = maxW;
      }
      const appliedDx = startWidth - candidateWidth;
      newLeft = startLeft + appliedDx;
      if (newLeft < 8) {
        newLeft = 8;
        candidateWidth = Math.max(minW, startLeft + startWidth - 8);
      }
      newWidth = candidateWidth;
    }

    // --- VERTICAL RESIZING ---
    if (dir.includes('bottom')) {
      newHeight = Math.max(minH, Math.min(maxH, startHeight + dy));
      if (startTop + newHeight > window.innerHeight - 60) {
        newHeight = Math.max(minH, window.innerHeight - 60 - startTop);
      }
    } else if (dir.includes('top')) {
      let candidateHeight = startHeight - dy;
      if (candidateHeight < minH) {
        candidateHeight = minH;
      } else if (candidateHeight > maxH) {
        candidateHeight = maxH;
      }
      const appliedDy = startHeight - candidateHeight;
      newTop = startTop + appliedDy;
      if (newTop < 0) {
        newTop = 0;
        candidateHeight = Math.max(minH, startTop + startHeight);
      }
      newHeight = candidateHeight;
    }

    // Apply dimensions to window
    win.style.width = `${Math.round(newWidth)}px`;
    win.style.height = `${Math.round(newHeight)}px`;
    win.style.left = `${Math.round(newLeft)}px`;
    win.style.top = `${Math.round(newTop)}px`;

    // Keep restore bounds in sync for maximize/restore
    win._prevBounds = {
      left: win.style.left,
      top: win.style.top,
      width: win.style.width,
      height: win.style.height
    };
  }

  function onPointerUp(ev) {
    if (ev.pointerId !== pointerId) return;

    try {
      handle.releasePointerCapture(pointerId);
    } catch (err) {}

    win.classList.remove('is-resizing');
    document.body.classList.remove('is-window-resizing');
    document.body.style.cursor = '';

    window.removeEventListener('pointermove', onPointerMove);
    window.removeEventListener('pointerup', onPointerUp);
    window.removeEventListener('pointercancel', onPointerUp);
  }

  window.addEventListener('pointermove', onPointerMove, { passive: true });
  window.addEventListener('pointerup', onPointerUp);
  window.addEventListener('pointercancel', onPointerUp);
}

/* ==================== DESKTOP & DOCK ICONS ==================== */
let iconPositions = {};
try {
  iconPositions = JSON.parse(SafeStorage.get('portfolio-os-icon-positions', '{}'));
} catch (e) {
  iconPositions = {};
}

function checkIconCollision(draggedIcon, targetX, targetY) {
  const draggedParent = draggedIcon.closest('.desktop-grid-cell');
  if (!draggedParent) return false;

  const parentRect = draggedParent.getBoundingClientRect();
  const iconBaseCenterX = parentRect.left + parentRect.width / 2;
  const iconBaseCenterY = parentRect.top + parentRect.height / 2;

  const candidateCenterX = iconBaseCenterX + targetX;
  const candidateCenterY = iconBaseCenterY + targetY;

  // Boundary check
  const iconHalfWidth = 40;
  const iconHalfHeight = 42;
  if (candidateCenterX - iconHalfWidth < 8 || candidateCenterX + iconHalfWidth > window.innerWidth - 8) {
    return true;
  }
  if (candidateCenterY - iconHalfHeight < 8 || candidateCenterY + iconHalfHeight > window.innerHeight - 76) {
    return true;
  }

  // Overlap check with other icons
  const allIcons = document.querySelectorAll('.desktop-icon');
  for (const other of allIcons) {
    if (other === draggedIcon) continue;
    const otherParent = other.closest('.desktop-grid-cell');
    if (!otherParent) continue;

    const otherParentRect = otherParent.getBoundingClientRect();
    const otherPosX = parseFloat(other.dataset.posX) || 0;
    const otherPosY = parseFloat(other.dataset.posY) || 0;
    const otherCenterX = otherParentRect.left + otherParentRect.width / 2 + otherPosX;
    const otherCenterY = otherParentRect.top + otherParentRect.height / 2 + otherPosY;

    const dist = Math.hypot(candidateCenterX - otherCenterX, candidateCenterY - otherCenterY);
    if (dist < 64) {
      return true;
    }
  }

  return false;
}

function initDesktopIcons() {
  document.querySelectorAll('.desktop-icon').forEach(icon => {
    const origin = icon.getAttribute('data-window-origin');
    let isDragging = false;
    let startX = 0, startY = 0;
    let currentX = 0, currentY = 0;
    let prevValidX = 0, prevValidY = 0;
    let hasMoved = false;
    let tiltAngle = 0;
    let lastClientX = 0;

    if (origin && iconPositions[origin]) {
      currentX = iconPositions[origin].x || 0;
      currentY = iconPositions[origin].y || 0;
      prevValidX = currentX;
      prevValidY = currentY;
      icon.dataset.posX = currentX;
      icon.dataset.posY = currentY;
      if (currentX !== 0 || currentY !== 0) {
        icon.style.transform = `translate3d(${currentX}px, ${currentY}px, 0)`;
      }
    } else {
      icon.dataset.posX = '0';
      icon.dataset.posY = '0';
    }

    icon.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        if (origin) openWindow(origin);
      }
    });

    icon.addEventListener('pointerdown', (e) => {
      if (e.button !== 0) return;
      currentX = parseFloat(icon.dataset.posX) || 0;
      currentY = parseFloat(icon.dataset.posY) || 0;
      prevValidX = currentX;
      prevValidY = currentY;

      isDragging = true;
      hasMoved = false;
      const initialClickX = e.clientX;
      const initialClickY = e.clientY;
      startX = e.clientX - currentX;
      startY = e.clientY - currentY;
      lastClientX = e.clientX;
      tiltAngle = 0;

      icon.style.zIndex = '9999';
      icon.style.transition = 'none';

      function onPointerMove(me) {
        if (!isDragging) return;
        const totalDist = Math.hypot(me.clientX - initialClickX, me.clientY - initialClickY);

        if (!hasMoved && totalDist > 4) {
          hasMoved = true;
          icon.classList.add('is-dragging');
        }

        if (hasMoved) {
          const dx = me.clientX - startX;
          const dy = me.clientY - startY;

          const deltaX = me.clientX - lastClientX;
          lastClientX = me.clientX;
          tiltAngle = tiltAngle * 0.65 + (deltaX * 1.5) * 0.35;
          tiltAngle = Math.max(-12, Math.min(12, tiltAngle));

          currentX = dx;
          currentY = dy;
          icon.style.transform = `translate3d(${currentX}px, ${currentY}px, 0) scale(1.08) rotate(${tiltAngle.toFixed(1)}deg)`;
        }
      }

      function onPointerUp() {
        if (!isDragging) return;
        isDragging = false;
        icon.classList.remove('is-dragging');
        window.removeEventListener('pointermove', onPointerMove);
        window.removeEventListener('pointerup', onPointerUp);
        window.removeEventListener('pointercancel', onPointerUp);

        if (hasMoved) {
          const isColliding = checkIconCollision(icon, currentX, currentY);

          if (isColliding) {
            SoundSystem.play('close');
            showToast(currentLang === 'es' ? 'Los íconos no pueden solaparse' : 'Icons cannot overlap');
            currentX = prevValidX;
            currentY = prevValidY;
            icon.dataset.posX = currentX;
            icon.dataset.posY = currentY;

            if (window.gsap) {
              gsap.to(icon, {
                x: currentX,
                y: currentY,
                scale: 1,
                rotation: 0,
                duration: 0.35,
                ease: "back.out(1.4)",
                onComplete: () => { icon.style.zIndex = '20'; }
              });
            } else {
              icon.style.transform = `translate3d(${currentX}px, ${currentY}px, 0) scale(1)`;
              icon.style.zIndex = '20';
            }
          } else {
            prevValidX = currentX;
            prevValidY = currentY;
            icon.dataset.posX = currentX;
            icon.dataset.posY = currentY;
            if (origin) {
              iconPositions[origin] = { x: currentX, y: currentY };
              try {
                SafeStorage.set('portfolio-os-icon-positions', JSON.stringify(iconPositions));
              } catch (err) {}
            }
            SoundSystem.play('click');
            if (window.gsap) {
              gsap.to(icon, {
                x: currentX,
                y: currentY,
                scale: 1,
                rotation: 0,
                duration: 0.3,
                ease: "power2.out",
                onComplete: () => { icon.style.zIndex = '20'; }
              });
            } else {
              icon.style.transform = `translate3d(${currentX}px, ${currentY}px, 0) scale(1)`;
              icon.style.zIndex = '20';
            }
          }
        } else {
          // Normal click without movement -> Open app
          icon.style.zIndex = '20';
          if (currentX !== 0 || currentY !== 0) {
            icon.style.transform = `translate3d(${currentX}px, ${currentY}px, 0)`;
          } else {
            icon.style.transform = '';
          }
          if (origin) openWindow(origin);
        }
      }

      window.addEventListener('pointermove', onPointerMove, { passive: true });
      window.addEventListener('pointerup', onPointerUp);
      window.addEventListener('pointercancel', onPointerUp);
    });
  });
}

function initTaskbarIcons() {
  document.querySelectorAll('.dock-item-wrap').forEach(wrap => {
    const origin = wrap.getAttribute('data-dock-origin');
    const btn = wrap.querySelector('.island-icon') || wrap.querySelector('button');

    if (btn && origin && origin !== 'start' && origin !== 'recruiter') {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const win = document.getElementById(`win-${origin}`);
        const isClosed = !win || win.style.display === 'none' || !win.style.display;

        if (isClosed) {
          SoundSystem.play('dockBounce');
          wrap.classList.add('dock-bouncing');
          setTimeout(() => wrap.classList.remove('dock-bouncing'), 650);
          openWindow(origin);
        } else if (activeWindowId === origin) {
          minimizeWindow(origin);
        } else {
          SoundSystem.play('click');
          focusWindow(origin);
        }
      });
    }
  });
}

/* ==================== macOS DOCK MAGNIFICATION EFFECT ==================== */
function initDockMagnification() {
  const dock = document.getElementById('taskbar-nav');
  if (!dock) return;

  const items = Array.from(dock.querySelectorAll('.dock-item-wrap'));
  const maxDistance = 140;
  const maxScale = 1.45;
  let isHovering = false;
  let resetTimeout = null;
  let rafId = null;
  let latestMouseX = 0;
  let cachedCenters = [];

  function updateCachedCenters() {
    cachedCenters = items.map(item => {
      const rect = item.getBoundingClientRect();
      return rect.left + rect.width / 2;
    });
  }

  dock.addEventListener('mouseenter', () => {
    isHovering = true;
    clearTimeout(resetTimeout);
    items.forEach(it => it.style.transition = 'none');
    updateCachedCenters();
  });

  dock.addEventListener('mousemove', (e) => {
    if (!isHovering) return;
    latestMouseX = e.clientX;

    if (rafId) return;
    rafId = requestAnimationFrame(() => {
      rafId = null;
      if (!isHovering) return;

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const itemCenterX = cachedCenters[i] || 0;
        const distance = Math.abs(latestMouseX - itemCenterX);

        if (distance < maxDistance) {
          const norm = distance / maxDistance;
          const factor = Math.cos(norm * (Math.PI / 2));
          const scale = 1 + (maxScale - 1) * Math.pow(factor, 1.4);
          const translateY = -(scale - 1) * 20;
          item.style.transform = `scale(${scale.toFixed(3)}) translateY(${translateY.toFixed(1)}px)`;
          item.style.zIndex = Math.round(10 + factor * 20);

          if (distance < 24) {
            SoundSystem.play('dockHover');
          }
        } else {
          item.style.transform = 'scale(1) translateY(0px)';
          item.style.zIndex = '1';
        }
      }
    });
  });

  dock.addEventListener('mouseleave', () => {
    isHovering = false;
    if (rafId) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
    items.forEach(item => {
      item.style.transition = 'transform 0.28s cubic-bezier(0.16, 1, 0.3, 1)';
      item.style.transform = 'scale(1) translateY(0px)';
      item.style.zIndex = '1';
    });
    resetTimeout = setTimeout(() => {
      items.forEach(item => item.style.transition = '');
    }, 300);
  });
}

/* ==================== START MENU ==================== */
function initStartMenu() {
  const startBtn = document.getElementById('start-btn');
  if (startBtn) {
    startBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleStartMenu();
    });
  }
}

function toggleStartMenu() {
  const menu = document.getElementById('start-menu-card');
  if (!menu) return;

  SoundSystem.play('click');
  const isOpen = menu.classList.contains('open');

  if (isOpen) {
    if (window.gsap) {
      gsap.to(menu, {
        opacity: 0,
        scale: 0.96,
        y: 10,
        duration: 0.16,
        ease: "power2.in",
        onComplete: () => { menu.classList.remove('open'); }
      });
    } else {
      menu.classList.remove('open');
    }
  } else {
    menu.classList.add('open');
    if (window.gsap) {
      gsap.fromTo(menu,
        { opacity: 0, scale: 0.95, y: 12 },
        { opacity: 1, scale: 1, y: 0, duration: 0.24, ease: "power3.out" }
      );
    }
  }
}

/* ==================== SYSTEM CLOCK ==================== */
function initClock() {
  const timeEl = document.getElementById('tray-time');
  const dateEl = document.getElementById('tray-date');

  function update() {
    const now = new Date();
    let hours = now.getHours();
    let mins = now.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    const hoursStr = hours < 10 ? `0${hours}` : `${hours}`;
    const minsStr = mins < 10 ? `0${mins}` : `${mins}`;

    if (timeEl) timeEl.innerText = `${hoursStr}:${minsStr} ${ampm}`;

    if (dateEl) {
      const options = { month: 'short', day: 'numeric', year: 'numeric' };
      dateEl.innerText = now.toLocaleDateString(currentLang === 'es' ? 'es-ES' : 'en-US', options);
    }
  }
  update();
  setInterval(update, 1000);
}

/* ==================== LANGUAGE SYSTEM & DYNAMIC TRANSLATION ==================== */
function toggleLanguage() {
  const newLang = currentLang === 'es' ? 'en' : 'es';
  applyLanguage(newLang);
  showToast(newLang === 'es' ? 'Idioma cambiado a Español' : 'Language switched to English');
  if (window.SoundSystem) SoundSystem.play('click');
}

function applyLanguage(lang) {
  currentLang = lang;
  try {
    SafeStorage.set('portfolio-os-lang', currentLang);
  } catch(e) {}
  document.documentElement.lang = currentLang;

  // Language badge in taskbar tray
  const langLabel = document.getElementById('lang-label');
  if (langLabel) {
    langLabel.innerText = currentLang === 'es' ? 'ES' : 'EN';
    const langBtn = langLabel.closest('button');
    if (langBtn) {
      langBtn.title = currentLang === 'es' ? 'Cambiar Idioma' : 'Change Language';
    }
  }

  // Spotlight Tray Button
  const spotBtn = document.querySelector('button[onclick="toggleSpotlight()"]');
  if (spotBtn) {
    spotBtn.title = currentLang === 'es' ? 'Buscar apps y comandos (Ctrl + K)' : 'Search apps & commands (Ctrl + K)';
  }

  // Settings Tray Button
  const settingsTrayBtn = document.querySelector('button[onclick="openWindow(\'settings\')"]');
  if (settingsTrayBtn) {
    settingsTrayBtn.title = currentLang === 'es' ? 'Configuración' : 'Settings';
  }

  // Sound System UI
  if (window.SoundSystem) {
    SoundSystem.updateUI();
  }

  // Dock Items (Tooltips & accessibility labels)
  const dockDict = {
    start: { tooltip: { es: 'Inicio', en: 'Start' }, aria: { es: 'Menú Inicio', en: 'Start Menu' } },
    about: { tooltip: { es: 'Sobre Mí', en: 'About Me' }, aria: { es: 'Sobre Mí', en: 'About Me' } },
    projects: { tooltip: { es: 'Proyectos', en: 'Projects' }, aria: { es: 'Proyectos', en: 'Projects' } },
    chat: { tooltip: { es: 'Iván AI', en: 'Iván AI' }, aria: { es: 'Iván AI', en: 'Iván AI' } },
    resume: { tooltip: { es: 'Currículum', en: 'Resume' }, aria: { es: 'Currículum', en: 'Resume' } },
    contact: { tooltip: { es: 'Contacto', en: 'Contact' }, aria: { es: 'Contacto', en: 'Contact' } },
    terminal: { tooltip: { es: 'Terminal', en: 'Terminal' }, aria: { es: 'Terminal', en: 'Terminal' } },
    recruiter: { tooltip: { es: 'Reclutador', en: 'Recruiter' }, aria: { es: 'Modo Reclutador', en: 'Recruiter Mode' } }
  };

  document.querySelectorAll('.dock-item-wrap').forEach(wrap => {
    const origin = wrap.getAttribute('data-dock-origin');
    if (origin && dockDict[origin]) {
      const trans = dockDict[origin];
      const tooltip = wrap.querySelector('.island-tooltip');
      if (tooltip) tooltip.textContent = trans.tooltip[lang];
      const btn = wrap.querySelector('button');
      if (btn) btn.setAttribute('aria-label', trans.aria[lang]);
    }
  });

  // Desktop Icons (Labels & accessibility labels)
  const desktopDict = {
    about: { label: { es: 'Sobre Mí', en: 'About Me' }, aria: { es: 'Sobre Mí', en: 'About Me' } },
    chat: { label: { es: 'Iván AI', en: 'Iván AI' }, aria: { es: 'Iván AI', en: 'Iván AI' } },
    resume: { label: { es: 'Currículum', en: 'Resume' }, aria: { es: 'Currículum', en: 'Resume' } },
    terminal: { label: { es: 'Terminal', en: 'Terminal' }, aria: { es: 'Terminal', en: 'Terminal' } },
    projects: { label: { es: 'Proyectos', en: 'Projects' }, aria: { es: 'Proyectos', en: 'Projects' } },
    contact: { label: { es: 'Contacto', en: 'Contact' }, aria: { es: 'Contacto', en: 'Contact' } }
  };

  document.querySelectorAll('.desktop-icon').forEach(icon => {
    const origin = icon.getAttribute('data-window-origin');
    if (origin && desktopDict[origin]) {
      const trans = desktopDict[origin];
      const label = icon.querySelector('.desktop-icon-label');
      if (label) label.textContent = trans.label[lang];
      icon.setAttribute('aria-label', trans.aria[lang]);
    }
  });

  // Windows Configurations & Titlebars
  Object.keys(windowConfigs).forEach(key => {
    const cfg = windowConfigs[key];
    const titleEl = document.querySelector(`#win-${key} .os-window-title span:last-child`);
    if (titleEl) {
      titleEl.innerText = lang === 'es' ? cfg.title : cfg.titleEn;
    }
  });

  // Window Controls Tooltips (Traffic Lights)
  const closeTxt = lang === 'es' ? 'Cerrar' : 'Close';
  const minTxt = lang === 'es' ? 'Minimizar' : 'Minimize';
  const maxTxt = lang === 'es' ? 'Maximizar' : 'Maximize';
  document.querySelectorAll('.traffic-light.close, .os-window-control-btn.close').forEach(b => {
    b.setAttribute('title', closeTxt);
    b.setAttribute('aria-label', closeTxt);
  });
  document.querySelectorAll('.traffic-light.minimize').forEach(b => {
    b.setAttribute('title', minTxt);
    b.setAttribute('aria-label', minTxt);
  });
  document.querySelectorAll('.traffic-light.maximize').forEach(b => {
    b.setAttribute('title', maxTxt);
    b.setAttribute('aria-label', maxTxt);
  });

  // Start Menu
  const startSubtitle = document.getElementById('start-menu-subtitle');
  if (startSubtitle) {
    startSubtitle.innerText = lang === 'es'
      ? 'Desarrollador de Software · Rosario, Santa Fe'
      : 'Software Developer · Rosario, Santa Fe';
  }
  const startSearch = document.getElementById('start-search');
  if (startSearch) {
    startSearch.placeholder = lang === 'es'
      ? 'Buscar apps, proyectos, ajustes...'
      : 'Search apps, projects, settings...';
  }
  const startAppItemsMap = {
    about: { es: 'Sobre Mí', en: 'About Me' },
    projects: { es: 'Proyectos', en: 'Projects' },
    resume: { es: 'Currículum', en: 'Resume' },
    terminal: { es: 'Terminal', en: 'Terminal' },
    chat: { es: 'Iván AI', en: 'Iván AI' },
    settings: { es: 'Configuración', en: 'Settings' }
  };
  document.querySelectorAll('.start-app-item').forEach(item => {
    const onclickStr = item.getAttribute('onclick') || '';
    Object.keys(startAppItemsMap).forEach(key => {
      if (onclickStr.includes(`'${key}'`)) {
        const textSpan = item.querySelector('span:last-child');
        if (textSpan) textSpan.innerText = startAppItemsMap[key][lang];
      }
    });
  });
  const startCopyEmail = document.getElementById('start-btn-copy-email');
  if (startCopyEmail) {
    startCopyEmail.innerText = lang === 'es' ? '📋 Copiar Email' : '📋 Copy Email';
  }
  const startCloseWins = document.getElementById('start-btn-close-wins');
  if (startCloseWins) {
    startCloseWins.innerText = lang === 'es' ? '✕ Cerrar ventanas' : '✕ Close Windows';
    startCloseWins.title = lang === 'es' ? 'Cerrar todas las ventanas (Alt+W)' : 'Close all windows (Alt+W)';
  }
  const startLock = document.getElementById('start-btn-lock');
  if (startLock) {
    startLock.innerText = lang === 'es' ? '🔒 Bloquear' : '🔒 Lock';
  }

  // Desktop Context Menu
  const contextDict = {
    refresh: { es: 'Actualizar', en: 'Refresh' },
    'close-all': { es: 'Cerrar todas las ventanas', en: 'Close all windows' },
    'minimize-all': { es: 'Minimizar todo al Dock', en: 'Minimize all to Dock' },
    wallpaper: { es: 'Cambiar fondo', en: 'Change wallpaper' },
    accent: { es: 'Color de acento', en: 'Accent color' },
    arrange: { es: 'Ordenar íconos', en: 'Auto-arrange icons' },
    terminal: { es: 'Abrir terminal', en: 'Open terminal' },
    search: { es: 'Buscar…', en: 'Search…' },
    settings: { es: 'Personalizar OS…', en: 'Customize OS…' },
    lock: { es: 'Bloquear pantalla', en: 'Lock screen' }
  };
  Object.keys(contextDict).forEach(ctxId => {
    const el = document.querySelector(`[data-ctx-id="${ctxId}"] .context-menu-item-left span:last-child`);
    if (el) el.innerText = contextDict[ctxId][lang];
  });

  // Window: About Me
  const aboutBadge = document.getElementById('about-badge-status');
  if (aboutBadge) aboutBadge.innerText = lang === 'es' ? '● Disponible para trabajar' : '● Available for work';

  const aboutRole = document.getElementById('about-role-title');
  if (aboutRole) aboutRole.innerText = lang === 'es'
    ? 'Técnico Superior en Desarrollo de Software · Front-End & IA'
    : 'Software Developer · Front-End & AI';

  const aboutBio = document.getElementById('about-bio-desc');
  if (aboutBio) aboutBio.innerText = lang === 'es'
    ? 'Me apasiona resolver problemas reales con tecnología, desde construir aplicaciones que impacten el día a día hasta explorar flujos de trabajo con inteligencia artificial. Ese mismo impulso me llevó a gestionar proyectos propios. Busco desarrollarme profesionalmente como Software Developer, Front-End Developer o IT Trainee.'
    : 'I am passionate about solving real-world problems with technology, from building impactful applications to exploring AI-driven workflows. That same drive led me to manage my own projects. I am seeking opportunities as a Software Developer, Front-End Developer, or IT Trainee.';

  const aboutTabEdu = document.querySelector('#about-tab-btn-edu .tab-text');
  if (aboutTabEdu) aboutTabEdu.innerText = lang === 'es' ? 'Educación & Certificaciones' : 'Education & Certifications';

  const aboutTabSkills = document.querySelector('#about-tab-btn-skills .tab-text');
  if (aboutTabSkills) aboutTabSkills.innerText = lang === 'es' ? 'Competencias Técnicas' : 'Technical Skills';

  const aboutTabContact = document.querySelector('#about-tab-btn-contact .tab-text');
  if (aboutTabContact) aboutTabContact.innerText = lang === 'es' ? 'Contacto Directo' : 'Direct Contact';

  const aboutBtnCv = document.querySelector('#about-btn-download-cv span');
  if (aboutBtnCv) aboutBtnCv.innerText = lang === 'es' ? 'Descargar CV' : 'Download CV';

  const aboutEduFormal = document.getElementById('about-edu-formal-title');
  if (aboutEduFormal) aboutEduFormal.innerText = lang === 'es' ? 'Educación Formal' : 'Formal Education';

  const aboutEduDate1 = document.getElementById('about-edu-date-1');
  if (aboutEduDate1) aboutEduDate1.innerText = lang === 'es' ? 'Marzo 2026 – Actualidad' : 'March 2026 – Present';

  const aboutEduDate2 = document.getElementById('about-edu-date-2');
  if (aboutEduDate2) aboutEduDate2.innerText = lang === 'es' ? 'Marzo 2018 – Diciembre 2021' : 'March 2018 – December 2021';

  const aboutEduCerts = document.getElementById('about-edu-certs-title');
  if (aboutEduCerts) aboutEduCerts.innerText = lang === 'es' ? 'Certificaciones Profesionales' : 'Professional Certifications';

  const aboutSkillsT1 = document.getElementById('about-skills-title-1');
  if (aboutSkillsT1) aboutSkillsT1.innerText = lang === 'es' ? 'Lenguajes de Programación' : 'Programming Languages';

  const aboutSkillsT2 = document.getElementById('about-skills-title-2');
  if (aboutSkillsT2) aboutSkillsT2.innerText = lang === 'es' ? 'Frontend & Gráficos 3D' : 'Frontend & 3D Graphics';

  const aboutSkillsT3 = document.getElementById('about-skills-title-3');
  if (aboutSkillsT3) aboutSkillsT3.innerText = lang === 'es' ? 'Backend, Mobile & Bases de Datos' : 'Backend, Mobile & Databases';

  const aboutSkillsT4 = document.getElementById('about-skills-title-4');
  if (aboutSkillsT4) aboutSkillsT4.innerText = lang === 'es' ? 'Cloud & Inteligencia Artificial' : 'Cloud & Artificial Intelligence';

  const aboutContactGh = document.querySelector('#about-contact-btn-github span');
  if (aboutContactGh) aboutContactGh.innerText = lang === 'es' ? 'GitHub Perfil' : 'GitHub Profile';

  const aboutContactProj = document.getElementById('about-contact-btn-projects');
  if (aboutContactProj) aboutContactProj.innerText = lang === 'es' ? 'Ver Proyectos' : 'View Projects';

  // Window: Projects
  const projBtnGhAll = document.querySelector('#projects-btn-github-all span');
  if (projBtnGhAll) projBtnGhAll.innerText = lang === 'es' ? 'Ver Todos en GitHub ↗' : 'View All on GitHub ↗';

  const projAdaptiaSub = document.getElementById('proj-adaptia-sub');
  if (projAdaptiaSub) projAdaptiaSub.innerText = lang === 'es' ? 'Adaptador de Currículums con IA' : 'AI Resume Tailoring Platform';

  const projAdaptiaDesc = document.getElementById('proj-adaptia-desc');
  if (projAdaptiaDesc) projAdaptiaDesc.innerText = lang === 'es'
    ? 'Aplicación web creada para adaptar y optimizar currículums utilizando Inteligencia Artificial. Permite ajustar el perfil y la experiencia laboral al perfil del puesto de trabajo en segundos, mejorando la compatibilidad con filtros ATS.'
    : 'Web app built to optimize and tailor resumes using Artificial Intelligence. Adapts candidate profile and experience to job descriptions in seconds, boosting ATS filter compatibility.';

  const projOsoSub = document.getElementById('proj-oso-sub');
  if (projOsoSub) projOsoSub.innerText = lang === 'es' ? 'Landings de Fotografía · Studio Bear' : 'Photography Studio Landings · Studio Bear';

  const projOsoDesc = document.getElementById('proj-oso-desc');
  if (projOsoDesc) projOsoDesc.innerText = lang === 'es'
    ? 'Desarrollo de sitio web a medida para un estudio de fotografía profesional especializado en eventos. Presenta animaciones dirigidas por scroll y la construcción desde cero de una lente 3D procedural como pieza central de la experiencia visual interactiva.'
    : 'Custom website built for a professional event photography studio. Features scroll-driven animations and a procedural 3D camera lens built from scratch as the centerpiece.';

  const projChappieSub = document.getElementById('proj-chappie-sub');
  if (projChappieSub) projChappieSub.innerText = lang === 'es' ? 'Asistente de IA en tu Computadora' : 'AI Assistant on Your Computer';

  const projChappieDesc = document.getElementById('proj-chappie-desc');
  if (projChappieDesc) projChappieDesc.innerText = lang === 'es'
    ? 'Diseño y desarrollo de un asistente de IA integrado en el sistema con motor propio de memoria persistente y personalidad dinámica. Implementación de interfaz web, control por voz con wake word y clasificación de intención mediante LLMs locales para ejecutar comandos del sistema.'
    : 'Design and development of an OS-integrated AI assistant with persistent memory and dynamic persona. Web UI, wake word voice control, and local LLM intent classification to trigger system commands.';



  // Project cards action buttons
  document.querySelectorAll('.project-card-apple').forEach(card => {
    const ghLink = card.querySelector('a.apple-btn-primary');
    if (ghLink) {
      ghLink.childNodes.forEach(node => {
        if (node.nodeType === Node.TEXT_NODE && node.nodeValue.trim()) {
          node.nodeValue = lang === 'es' ? ' Ver en GitHub ↗' : ' View on GitHub ↗';
        }
      });
    }
    const copyBtn = card.querySelector('button.apple-btn-secondary');
    if (copyBtn) copyBtn.innerText = lang === 'es' ? 'Copiar' : 'Copy';
  });

  // Window: Resume
  const resumeTabPrev = document.getElementById('resume-tab-btn-preview');
  if (resumeTabPrev) resumeTabPrev.innerText = lang === 'es' ? '📄 Vista Previa de CV' : '📄 CV Preview';

  const resumeTabTxt = document.getElementById('resume-tab-btn-text');
  if (resumeTabTxt) resumeTabTxt.innerText = lang === 'es' ? '📋 Datos en Formato Texto' : '📋 Plain Text Format';

  const resumeBtnFull = document.querySelector('#resume-btn-fullscreen span');
  if (resumeBtnFull) resumeBtnFull.innerText = lang === 'es' ? 'Pantalla Completa' : 'Fullscreen';

  const resumeBtnDl = document.querySelector('#resume-btn-download span');
  if (resumeBtnDl) resumeBtnDl.innerText = lang === 'es' ? 'Descargar CV' : 'Download CV';

  const resumeHint = document.getElementById('resume-preview-hint');
  if (resumeHint) {
    resumeHint.innerHTML = lang === 'es'
      ? 'Hacé click en la imagen para ver en máxima resolución o usá el botón <strong>Descargar CV</strong>'
      : 'Click the image to view in full resolution or use the <strong>Download CV</strong> button';
  }

  const resumeTextRole = document.getElementById('resume-text-role');
  if (resumeTextRole) resumeTextRole.innerText = lang === 'es' ? 'Técnico Superior en Desarrollo de Software' : 'Software Developer';

  const resumeTextAboutH = document.getElementById('resume-text-about-h');
  if (resumeTextAboutH) resumeTextAboutH.innerText = lang === 'es' ? 'Sobre Mí' : 'About Me';

  const resumeTextAboutP = document.getElementById('resume-text-about-p');
  if (resumeTextAboutP) {
    resumeTextAboutP.innerText = lang === 'es'
      ? 'Me apasiona resolver problemas reales con tecnología, desde construir aplicaciones que impacten el día a día hasta explorar flujos de trabajo con inteligencia artificial. Ese mismo impulso me llevó a gestionar proyectos propios. Busco desarrollarme profesionalmente como Software Developer, Front-End Developer o IT Trainee, aportando capacidad analítica, aprendizaje continuo y orientación a resultados.'
      : 'I am passionate about solving real-world problems with technology, from building impactful applications to exploring AI-driven workflows. That same drive led me to manage my own projects. I am seeking opportunities as a Software Developer, Front-End Developer, or IT Trainee.';
  }

  const resumeTextEduH = document.getElementById('resume-text-edu-h');
  if (resumeTextEduH) resumeTextEduH.innerText = lang === 'es' ? 'Educación' : 'Education';

  const resumeTextCertsH = document.getElementById('resume-text-certs-h');
  if (resumeTextCertsH) resumeTextCertsH.innerText = lang === 'es' ? 'Certificaciones' : 'Certifications';

  const resumeTextSkillsH = document.getElementById('resume-text-skills-h');
  if (resumeTextSkillsH) resumeTextSkillsH.innerText = lang === 'es' ? 'Competencias Técnicas' : 'Technical Skills';

  // Window: Contact
  const contactTitle = document.getElementById('contact-title');
  if (contactTitle) contactTitle.innerText = lang === 'es' ? '¡Hablemos!' : "Let's Talk!";

  const contactSub = document.getElementById('contact-sub');
  if (contactSub) {
    contactSub.innerText = lang === 'es'
      ? '¿Tenés una propuesta laboral, un proyecto en mente o querés conectar? Mandame un mensaje directo por el formulario o por mis canales oficiales.'
      : 'Do you have a job opportunity, a project in mind, or want to connect? Send me a message through the form or my official channels.';
  }

  const contactLblName = document.getElementById('contact-label-name');
  if (contactLblName) contactLblName.innerText = lang === 'es' ? 'Tu Nombre' : 'Your Name';

  const contactInpName = document.getElementById('contact-name');
  if (contactInpName) contactInpName.placeholder = lang === 'es' ? 'Nombre completo' : 'Full name';

  const contactLblEmail = document.getElementById('contact-label-email');
  if (contactLblEmail) contactLblEmail.innerText = lang === 'es' ? 'Tu Email' : 'Your Email';

  const contactInpEmail = document.getElementById('contact-email');
  if (contactInpEmail) contactInpEmail.placeholder = lang === 'es' ? 'nombre@correo.com' : 'name@example.com';

  const contactLblMsg = document.getElementById('contact-label-msg');
  if (contactLblMsg) contactLblMsg.innerText = lang === 'es' ? 'Mensaje' : 'Message';

  const contactInpMsg = document.getElementById('contact-msg');
  if (contactInpMsg) contactInpMsg.placeholder = lang === 'es' ? 'Escribe tu propuesta o mensaje...' : 'Write your message or inquiry...';

  const contactBtnSub = document.getElementById('contact-btn-submit');
  if (contactBtnSub) contactBtnSub.innerText = lang === 'es' ? 'Enviar Mensaje' : 'Send Message';

  // Window: Settings
  const settingsTitle = document.getElementById('settings-title');
  if (settingsTitle) settingsTitle.innerText = lang === 'es' ? 'Personalización' : 'Personalization';

  const settingsAccentLbl = document.getElementById('settings-accent-label');
  if (settingsAccentLbl) settingsAccentLbl.innerText = lang === 'es' ? 'Color de Acento' : 'Accent Color';

  const settingsWpLbl = document.getElementById('settings-wallpaper-label');
  if (settingsWpLbl) settingsWpLbl.innerText = lang === 'es' ? 'Fondo de Pantalla' : 'Wallpaper';

  const settingsBtnMoreWp = document.getElementById('settings-btn-more-wallpapers');
  if (settingsBtnMoreWp) settingsBtnMoreWp.innerText = lang === 'es' ? 'Ver todos los fondos…' : 'View all wallpapers…';

  const settingsPerfLbl = document.getElementById('settings-perf-label');
  if (settingsPerfLbl) settingsPerfLbl.innerText = lang === 'es' ? 'Modo de Rendimiento' : 'Performance Mode';

  const settingsBtnPerf = document.getElementById('settings-btn-perf');
  if (settingsBtnPerf) settingsBtnPerf.innerText = lang === 'es' ? 'Optimizar transiciones' : 'Optimize animations';

  // Window: Terminal
  const termWelcome = document.getElementById('term-welcome-msg');
  if (termWelcome) {
    termWelcome.innerHTML = lang === 'es'
      ? 'Portfolio OS v2.0.0 (x86_64-ivan-web)<br>Escribí <span style="color: var(--color-primary, #22d3c5);">help</span> para ver todos los comandos disponibles.'
      : 'Portfolio OS v2.0.0 (x86_64-ivan-web)<br>Type <span style="color: var(--color-primary, #22d3c5);">help</span> to view all available commands.';
  }

  // Window: Iván AI
  const chatBubble = document.getElementById('chat-greeting-bubble');
  if (chatBubble) {
    chatBubble.innerHTML = lang === 'es'
      ? '¡Hola! Soy <strong>Iván AI</strong>, el asistente virtual de este portfolio. Preguntame lo que quieras sobre la experiencia de Iván, sus tecnologías favoritas o sus proyectos.'
      : "Hello! I am <strong>Iván AI</strong>, this portfolio's virtual assistant. Ask me anything about Iván's experience, favorite technologies, or projects.";
  }

  const chatInput = document.getElementById('chat-input');
  if (chatInput) chatInput.placeholder = lang === 'es' ? 'Pregúntale algo a Iván AI...' : 'Ask Iván AI anything...';

  const chatBtn = document.getElementById('chat-send-btn');
  if (chatBtn) chatBtn.innerText = lang === 'es' ? 'Enviar' : 'Send';

  const chatSuggestions = document.querySelectorAll('.chat-suggestion-btn');
  if (chatSuggestions.length >= 3) {
    chatSuggestions[0].innerText = lang === 'es' ? '⚡ Stack principal' : '⚡ Tech Stack';
    chatSuggestions[0].setAttribute('data-prompt', lang === 'es' ? '¿Cuáles son tus tecnologías principales?' : 'What is your main tech stack?');

    chatSuggestions[1].innerText = lang === 'es' ? '🚀 Proyectos' : '🚀 Projects';
    chatSuggestions[1].setAttribute('data-prompt', lang === 'es' ? '¿Qué proyectos destacados tenés?' : 'What are your featured projects?');

    chatSuggestions[2].innerText = lang === 'es' ? '📬 Contacto' : '📬 Contact';
    chatSuggestions[2].setAttribute('data-prompt', lang === 'es' ? '¿Cómo puedo contactarte?' : 'How can I contact you?');
  }

  // Modal: Recruiter
  const recTitle = document.getElementById('recruiter-title');
  if (recTitle) recTitle.innerText = lang === 'es' ? 'Resumen para Reclutadores' : 'Recruiter Summary';

  const recSub = document.getElementById('recruiter-sub');
  if (recSub) recSub.innerText = lang === 'es'
    ? 'Toda la información clave de Iván Pieretto en 30 segundos.'
    : 'Key information about Iván Pieretto in 30 seconds.';

  const recRole = document.getElementById('recruiter-role');
  if (recRole) recRole.innerText = lang === 'es'
    ? 'Desarrollador de Software · Full-Stack & Python / Backend'
    : 'Software Developer · Full-Stack & Python / Backend';

  const recLoc = document.getElementById('recruiter-location');
  if (recLoc) recLoc.innerText = lang === 'es'
    ? '📍 Rosario, Santa Fe, Argentina · Modalidad Remota / Híbrida / Presencial'
    : '📍 Rosario, Santa Fe, Argentina · Remote / Hybrid / On-site';

  const recBadge = document.getElementById('recruiter-badge-text');
  if (recBadge) recBadge.innerText = lang === 'es' ? 'Disponible para incorporación inmediata' : 'Available for immediate hire';

  const recProjTitle = document.getElementById('recruiter-projects-title');
  if (recProjTitle) recProjTitle.innerText = lang === 'es' ? '🚀 Proyectos Clave' : '🚀 Key Projects';

  const recProjBody = document.getElementById('recruiter-projects-body');
  if (recProjBody) {
    recProjBody.innerHTML = lang === 'es'
      ? '• <b>adaptIA:</b> Plataforma SaaS con IA, microservicios y arquitectura multi-tenant.<br>• <b>Estudio el Oso:</b> Plataforma de producción y streaming de audio con UI hiper-reactiva.<br>• <b>Chappie-bot:</b> Automatización con IA y bots de mensajería empresarial.'
      : '• <b>adaptIA:</b> SaaS platform with AI, microservices, and multi-tenant architecture.<br>• <b>Estudio el Oso:</b> Audio production & streaming platform with hyper-reactive UI.<br>• <b>Chappie-bot:</b> Intelligent automation & business messaging bot.';
  }

  const recStackTitle = document.getElementById('recruiter-stack-title');
  if (recStackTitle) {
    recStackTitle.innerHTML = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display:inline-block;vertical-align:-2px;margin-right:5px;"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>${lang === 'es' ? 'Stack Principal' : 'Primary Stack'}`;
  }

  const recBtnCv = document.querySelector('#recruiter-btn-download-cv span');
  if (recBtnCv) recBtnCv.innerText = lang === 'es' ? 'Descargar CV (PDF)' : 'Download CV (PDF)';

  const recBtnWa = document.querySelector('#recruiter-btn-whatsapp span');
  if (recBtnWa) recBtnWa.innerText = lang === 'es' ? 'WhatsApp Directo' : 'Direct WhatsApp';

  const recBtnEmail = document.querySelector('#recruiter-btn-copy-email span');
  if (recBtnEmail) recBtnEmail.innerText = lang === 'es' ? 'Copiar Email' : 'Copy Email';

  const recBtnProj = document.querySelector('#recruiter-btn-view-projects span');
  if (recBtnProj) recBtnProj.innerText = lang === 'es' ? 'Ver Proyectos' : 'View Projects';

  // Modal: Phone
  const phoneTitle = document.getElementById('modal-phone-title');
  if (phoneTitle) phoneTitle.innerText = lang === 'es' ? 'Probalo en tu celular' : 'Try it on your phone';

  const phoneDesc = document.getElementById('modal-phone-desc');
  if (phoneDesc) phoneDesc.innerText = lang === 'es'
    ? 'Escaneá el código QR con la cámara de tu celular para abrir este portfolio como una Web App nativa.'
    : 'Scan the QR code with your phone camera to open this portfolio as a native Web App.';

  const phoneBtn = document.getElementById('modal-phone-btn');
  if (phoneBtn) phoneBtn.innerText = lang === 'es' ? 'Copiar Enlace Web' : 'Copy Web Link';

  // Modal: Share
  const shareTitle = document.getElementById('modal-share-title');
  if (shareTitle) shareTitle.innerText = lang === 'es' ? '🔗 Compartir Portfolio' : '🔗 Share Portfolio';

  const shareDesc = document.getElementById('modal-share-desc');
  if (shareDesc) shareDesc.innerText = lang === 'es'
    ? '¡Compartí el portfolio interactivo de Iván Pieretto con colegas, reclutadores o en tus redes sociales!'
    : 'Share Iván Pieretto’s interactive portfolio with colleagues, recruiters, or friends!';

  const shareBtnCopy = document.getElementById('modal-share-btn-copy');
  if (shareBtnCopy) shareBtnCopy.innerText = lang === 'es' ? 'Copiar URL' : 'Copy URL';

  // Modal: Wallpapers
  const wpModalTitle = document.querySelector('#modal-wallpapers h3');
  if (wpModalTitle) wpModalTitle.innerText = lang === 'es' ? '🖼️ Fondos de Pantalla' : '🖼️ Wallpapers';
  const wpModalDesc = document.querySelector('#modal-wallpapers p');
  if (wpModalDesc) wpModalDesc.innerText = lang === 'es'
    ? 'Fondos relajantes, minimalistas y atmosféricos seleccionados para descansar la vista.'
    : 'Relaxing, minimalist, and atmospheric wallpapers chosen for eye comfort.';

  // Spotlight Search
  const spotInp = document.getElementById('spotlight-input');
  if (spotInp) spotInp.placeholder = lang === 'es'
    ? 'Buscar apps, proyectos, habilidades o comandos…'
    : 'Search apps, projects, skills or commands…';

  const spotBadge = document.querySelector('.spotlight-badge');
  if (spotBadge) spotBadge.innerText = lang === 'es' ? 'ESC para salir' : 'ESC to exit';

  const spotKeys = document.querySelector('.spotlight-keys');
  if (spotKeys) {
    spotKeys.innerHTML = lang === 'es'
      ? '<span><kbd>↑</kbd> <kbd>↓</kbd> Navegar</span> <span><kbd>↵</kbd> Abrir</span> <span><kbd>esc</kbd> Cerrar</span>'
      : '<span><kbd>↑</kbd> <kbd>↓</kbd> Navigate</span> <span><kbd>↵</kbd> Open</span> <span><kbd>esc</kbd> Close</span>';
  }

  // Lock Screen
  const lockHint = document.getElementById('lock-hint-text');
  if (lockHint) lockHint.innerText = lang === 'es'
    ? 'Hacé click o presioná cualquier tecla para desbloquear'
    : 'Click or press any key to unlock';

  const loginPass = document.getElementById('login-password');
  if (loginPass) loginPass.placeholder = lang === 'es' ? 'Contraseña' : 'Password';

  const loginSubmit = document.getElementById('login-submit-btn');
  if (loginSubmit) loginSubmit.setAttribute('aria-label', lang === 'es' ? 'Entrar' : 'Enter');

  const loginStatus = document.getElementById('login-status-text');
  if (loginStatus) loginStatus.innerText = lang === 'es' ? 'Iniciando sesión como invitado…' : 'Logging in as guest…';

  const loginHint = document.getElementById('login-hint-text');
  if (loginHint) {
    loginHint.innerHTML = lang === 'es'
      ? 'Presioná <kbd>Enter</kbd> o <kbd>→</kbd> para entrar ya'
      : 'Press <kbd>Enter</kbd> or <kbd>→</kbd> to enter now';
  }
}

/* ==================== MODALS & TOAST ==================== */
function showModal(id) {
  const modal = document.getElementById(id);
  if (!modal) return;
  SoundSystem.play('open');
  modal.classList.add('open');

  const card = modal.querySelector('.modal-card');
  if (card && window.gsap) {
    gsap.fromTo(card,
      { opacity: 0, scale: 0.95, y: 15 },
      { opacity: 1, scale: 1, y: 0, duration: 0.28, ease: "power3.out" }
    );
  }
}

function closeModal(id) {
  const modal = document.getElementById(id);
  if (!modal) return;
  SoundSystem.play('close');

  const card = modal.querySelector('.modal-card');
  if (card && window.gsap) {
    gsap.to(card, {
      opacity: 0,
      scale: 0.96,
      y: 8,
      duration: 0.16,
      ease: "power2.in",
      onComplete: () => { modal.classList.remove('open'); }
    });
  } else {
    modal.classList.remove('open');
  }
}

function closeAllModals() {
  document.querySelectorAll('.modal-overlay.open').forEach(m => {
    closeModal(m.id);
  });
}

function showToast(msg) {
  const toast = document.getElementById('toast-msg');
  if (!toast) return;
  SoundSystem.play('toast');
  toast.innerText = msg;
  toast.classList.add('show');

  if (toastTimer) {
    clearTimeout(toastTimer);
    toastTimer = null;
  }

  if (window.gsap) {
    gsap.killTweensOf(toast);
    gsap.fromTo(toast,
      { opacity: 0, y: 10, scale: 0.96 },
      { opacity: 1, y: 0, scale: 1, duration: 0.22, ease: "power3.out" }
    );
  }

  toastTimer = setTimeout(() => {
    if (window.gsap) {
      gsap.to(toast, {
        opacity: 0,
        y: 8,
        duration: 0.2,
        ease: "power2.in",
        onComplete: () => toast.classList.remove('show')
      });
    } else {
      toast.classList.remove('show');
    }
    toastTimer = null;
  }, 2400);
}

function copyToClipboard(text, successMsg) {
  if (navigator.clipboard) {
    navigator.clipboard.writeText(text).then(() => {
      showToast(successMsg || 'Copiado al portapapeles');
    }).catch(() => fallbackCopy(text, successMsg));
  } else {
    fallbackCopy(text, successMsg);
  }
}

function fallbackCopy(text, successMsg) {
  const tempInput = document.createElement('input');
  tempInput.value = text;
  document.body.appendChild(tempInput);
  tempInput.select();
  try {
    document.execCommand('copy');
    showToast(successMsg || 'Copiado al portapapeles');
  } catch (err) {
    showToast('No se pudo copiar');
  }
  document.body.removeChild(tempInput);
}

/* ==================== SPOTLIGHT SEARCH SYSTEM (CMD+K / CTRL+K) ==================== */
let spotlightIndex = 0;
let spotlightFilteredItems = [];

function getLocalized(val) {
  if (typeof val === 'object' && val !== null) {
    return val[currentLang] || val.es || '';
  }
  return String(val || '');
}

const spotlightCatalog = [
  // Apps
  { category: { es: 'Aplicaciones', en: 'Applications' }, title: { es: 'Sobre Mí', en: 'About Me' }, subtitle: { es: 'Perfil, trayectoria y bio de Iván Pieretto', en: 'Bio, background, and career of Iván Pieretto' }, icon: '👤', action: () => openWindow('about') },
  { category: { es: 'Aplicaciones', en: 'Applications' }, title: { es: 'Proyectos', en: 'Projects' }, subtitle: { es: 'adaptIA, Estudio el Oso, Chappie-bot', en: 'adaptIA, Estudio el Oso, Chappie-bot' }, icon: '🌐', action: () => openWindow('projects') },
  { category: { es: 'Aplicaciones', en: 'Applications' }, title: { es: 'Currículum', en: 'Resume' }, subtitle: { es: 'Experiencia laboral y formación técnica', en: 'Work experience & technical background' }, icon: '📄', action: () => openWindow('resume') },
  { category: { es: 'Aplicaciones', en: 'Applications' }, title: { es: 'Contacto', en: 'Contact' }, subtitle: { es: 'Email, WhatsApp y redes sociales', en: 'Email, WhatsApp & social networks' }, icon: '✉️', action: () => openWindow('contact') },
  { category: { es: 'Aplicaciones', en: 'Applications' }, title: { es: 'Terminal', en: 'Terminal' }, subtitle: { es: 'Consola interactiva con comandos UNIX', en: 'Interactive UNIX-style console' }, icon: '💻', action: () => openWindow('terminal') },
  { category: { es: 'Aplicaciones', en: 'Applications' }, title: { es: 'Iván AI', en: 'Iván AI' }, subtitle: { es: 'Asistente interactivo con IA', en: 'Interactive AI assistant' }, icon: '💬', action: () => openWindow('chat') },
  { category: { es: 'Aplicaciones', en: 'Applications' }, title: { es: 'Configuración', en: 'Settings' }, subtitle: { es: 'Personalización de fondo, acento y sonido', en: 'Wallpaper, accent color & sound controls' }, icon: '⚙️', action: () => openWindow('settings') },

  // Projects
  { category: { es: 'Proyectos', en: 'Projects' }, title: 'adaptIA', subtitle: { es: 'Plataforma SaaS con IA y arquitectura multi-tenant', en: 'AI SaaS platform with multi-tenant architecture' }, icon: '🚀', action: () => openWindow('projects') },
  { category: { es: 'Proyectos', en: 'Projects' }, title: 'Estudio el Oso', subtitle: { es: 'Plataforma de audio y producción musical', en: 'Audio production & streaming platform' }, icon: '🎸', action: () => openWindow('projects') },
  { category: { es: 'Proyectos', en: 'Projects' }, title: 'Chappie-bot', subtitle: { es: 'Automatización inteligente y bots de mensajería', en: 'Local voice AI assistant & system automation' }, icon: '🤖', action: () => openWindow('projects') },

  // Wallpapers
  { category: { es: 'Fondos de Pantalla', en: 'Wallpapers' }, title: 'Dark Matter', subtitle: { es: 'Gradiente oscuro minimalista y profundo', en: 'Deep minimalist dark gradient wallpaper' }, icon: '🌑', action: () => setWallpaper('gradient-dark') },
  { category: { es: 'Fondos de Pantalla', en: 'Wallpapers' }, title: { es: 'Deep Space (Fotografía)', en: 'Deep Space (Photo)' }, subtitle: { es: 'Fondo oficial espacial en alta resolución', en: 'High-res space photography wallpaper' }, icon: '🌌', action: () => setWallpaper('photo-space') },
  { category: { es: 'Fondos de Pantalla', en: 'Wallpapers' }, title: { es: 'Cyber City (Fotografía)', en: 'Cyber City (Photo)' }, subtitle: { es: 'Metrópolis futurista en alta resolución', en: 'High-res cyberpunk metropolis wallpaper' }, icon: '🏙️', action: () => setWallpaper('photo-cyber') },
  { category: { es: 'Fondos de Pantalla', en: 'Wallpapers' }, title: { es: 'Estrellas Starlight (Chill)', en: 'Starlight (Chill)' }, subtitle: { es: 'Cielo estrellado calmo con estrellas titilantes', en: 'Animated starry night sky' }, icon: '✨', action: () => setWallpaper('starlight') },
  { category: { es: 'Fondos de Pantalla', en: 'Wallpapers' }, title: { es: 'Aurora Velvet', en: 'Aurora Velvet' }, subtitle: { es: 'Aura suave esmeralda e índigo relajante', en: 'Gentle emerald & indigo gradient' }, icon: '🍃', action: () => setWallpaper('velvet-aurora') },
  { category: { es: 'Fondos de Pantalla', en: 'Wallpapers' }, title: { es: 'Atardecer Calmo (Zen)', en: 'Sunset Calm (Zen)' }, subtitle: { es: 'Degradé crepuscular relajante', en: 'Soothing twilight dusk gradient' }, icon: '🌅', action: () => setWallpaper('sunset-calm') },

  // Quick Actions
  { category: { es: 'Acciones Rápidas', en: 'Quick Actions' }, title: { es: 'Cerrar todas las ventanas', en: 'Close all windows' }, subtitle: { es: 'Cierra todas las ventanas abiertas en el escritorio (Alt+W)', en: 'Closes all open desktop windows (Alt+W)' }, icon: '✕', action: () => closeAllWindows() },
  { category: { es: 'Acciones Rápidas', en: 'Quick Actions' }, title: { es: 'Minimizar todo / Ver escritorio', en: 'Minimize all / Show desktop' }, subtitle: { es: 'Minimiza todas las ventanas abiertas al Dock', en: 'Minimizes all open windows to the Dock' }, icon: '🗂️', action: () => minimizeAllWindows() },
  { category: { es: 'Acciones Rápidas', en: 'Quick Actions' }, title: { es: 'Modo Reclutador', en: 'Recruiter Mode' }, subtitle: { es: 'Resumen ejecutivo de Iván en 30 segundos', en: "Executive 30-second summary of Iván's profile" }, icon: '⚡', action: () => showModal('modal-recruiter') },
  { category: { es: 'Acciones Rápidas', en: 'Quick Actions' }, title: { es: 'Descargar CV (PDF)', en: 'Download CV (PDF)' }, subtitle: { es: 'Currículum vitae oficial en PDF', en: 'Official resume in PDF format' }, icon: '📥', action: () => { window.open('Ivan_Pieretto_CV.pdf', '_blank'); } },
  { category: { es: 'Acciones Rápidas', en: 'Quick Actions' }, title: { es: 'Copiar Email', en: 'Copy Email' }, subtitle: 'pierettoivan2004@gmail.com', icon: '📋', action: () => copyToClipboard('pierettoivan2004@gmail.com', currentLang === 'es' ? 'Email copiado' : 'Email copied') },
  { category: { es: 'Acciones Rápidas', en: 'Quick Actions' }, title: { es: 'WhatsApp Directo', en: 'Direct WhatsApp' }, subtitle: '+54 9 341 355-4160', icon: '💬', action: () => window.open('https://wa.me/5493413554160', '_blank') },
  { category: { es: 'Acciones Rápidas', en: 'Quick Actions' }, title: { es: 'Probar en Celular', en: 'Try on Mobile' }, subtitle: { es: 'Abrir código QR para mobile', en: 'Open mobile QR code' }, icon: '📱', action: () => showModal('modal-phone') },
  { category: { es: 'Acciones Rápidas', en: 'Quick Actions' }, title: { es: 'Silenciar / Activar Sonido', en: 'Mute / Unmute Sound' }, subtitle: { es: 'Conmutar efectos sonoros Apple HIG', en: 'Toggle Apple HIG sound effects' }, icon: '🔊', action: () => SoundSystem.toggleMute() },
  { category: { es: 'Acciones Rápidas', en: 'Quick Actions' }, title: { es: 'Bloquear Pantalla', en: 'Lock Screen' }, subtitle: { es: 'Volver a la pantalla de bloqueo macOS', en: 'Return to macOS lock screen' }, icon: '🔒', action: () => lockScreen() },

  // Tech Stack
  { category: { es: 'Tecnologías', en: 'Tech Stack' }, title: 'Python & FastAPI', subtitle: { es: 'Stack backend principal · APIs REST & microservicios', en: 'Main backend stack · REST APIs & microservices' }, icon: '🐍', action: () => openWindow('about') },
  { category: { es: 'Tecnologías', en: 'Tech Stack' }, title: 'Docker & Contenedores', subtitle: { es: 'Entornos reproducibles y arquitectura contenerizada', en: 'Reproducible environments & containerization' }, icon: '🐳', action: () => openWindow('about') },
  { category: { es: 'Tecnologías', en: 'Tech Stack' }, title: 'PostgreSQL & SQL', subtitle: { es: 'Bases de datos relacionales, optimización de queries', en: 'Relational databases & query optimization' }, icon: '🐘', action: () => openWindow('about') },
  { category: { es: 'Tecnologías', en: 'Tech Stack' }, title: 'TypeScript & React', subtitle: { es: 'Interfaces reactivas de alta gama y arquitecturas SPA', en: 'High-end reactive UIs & SPA architectures' }, icon: '⚛️', action: () => openWindow('about') }
];

function initSpotlight() {
  const overlay = document.getElementById('spotlight-overlay');
  const input = document.getElementById('spotlight-input');
  if (!overlay || !input) return;

  // Dedicated Cmd+K / Ctrl+K keyboard shortcut
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      toggleSpotlight();
    }
  });

  input.addEventListener('input', (e) => {
    renderSpotlightResults(e.target.value.trim());
  });

  input.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (spotlightFilteredItems.length > 0) {
        spotlightIndex = (spotlightIndex + 1) % spotlightFilteredItems.length;
        updateSpotlightSelection();
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (spotlightFilteredItems.length > 0) {
        spotlightIndex = (spotlightIndex - 1 + spotlightFilteredItems.length) % spotlightFilteredItems.length;
        updateSpotlightSelection();
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (spotlightFilteredItems[spotlightIndex]) {
        executeSpotlightItem(spotlightFilteredItems[spotlightIndex]);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      closeSpotlight();
    }
  });
}

function openSpotlight() {
  const overlay = document.getElementById('spotlight-overlay');
  const input = document.getElementById('spotlight-input');
  if (!overlay || !input) return;

  SoundSystem.play('open');
  overlay.classList.add('open');
  input.value = '';
  spotlightIndex = 0;
  renderSpotlightResults('');

  const card = overlay.querySelector('.spotlight-card');
  if (card && window.gsap) {
    gsap.fromTo(card,
      { opacity: 0, scale: 0.96, y: -14 },
      { opacity: 1, scale: 1, y: 0, duration: 0.24, ease: "power3.out" }
    );
  }

  setTimeout(() => input.focus(), 60);
}

function closeSpotlight() {
  const overlay = document.getElementById('spotlight-overlay');
  if (!overlay || !overlay.classList.contains('open')) return;

  const card = overlay.querySelector('.spotlight-card');
  if (card && window.gsap) {
    gsap.to(card, {
      opacity: 0,
      scale: 0.97,
      y: -8,
      duration: 0.15,
      ease: "power2.in",
      onComplete: () => { overlay.classList.remove('open'); }
    });
  } else {
    overlay.classList.remove('open');
  }
}

function toggleSpotlight() {
  const overlay = document.getElementById('spotlight-overlay');
  if (overlay && overlay.classList.contains('open')) {
    closeSpotlight();
  } else {
    openSpotlight();
  }
}

function renderSpotlightResults(query) {
  const resultsContainer = document.getElementById('spotlight-results');
  if (!resultsContainer) return;

  const q = query.toLowerCase();
  if (!q) {
    spotlightFilteredItems = spotlightCatalog.slice(0, 10);
  } else {
    spotlightFilteredItems = spotlightCatalog.filter(item => {
      const catEs = typeof item.category === 'object' ? item.category.es : item.category;
      const catEn = typeof item.category === 'object' ? item.category.en : item.category;
      const titEs = typeof item.title === 'object' ? item.title.es : item.title;
      const titEn = typeof item.title === 'object' ? item.title.en : item.title;
      const subEs = typeof item.subtitle === 'object' ? item.subtitle.es : item.subtitle;
      const subEn = typeof item.subtitle === 'object' ? item.subtitle.en : item.subtitle;

      return (catEs && catEs.toLowerCase().includes(q)) ||
        (catEn && catEn.toLowerCase().includes(q)) ||
        (titEs && titEs.toLowerCase().includes(q)) ||
        (titEn && titEn.toLowerCase().includes(q)) ||
        (subEs && subEs.toLowerCase().includes(q)) ||
        (subEn && subEn.toLowerCase().includes(q));
    });
  }

  spotlightIndex = 0;

  if (spotlightFilteredItems.length === 0) {
    resultsContainer.innerHTML = `
      <div style="padding: 2.2rem 1rem; text-align: center; color: rgba(255,255,255,0.45); font-size: 0.9rem;">
        ${currentLang === 'es' ? `No se encontraron resultados para "<b>${escapeHtml(query)}</b>"` : `No results found for "<b>${escapeHtml(query)}</b>"`}
      </div>
    `;
    return;
  }

  let html = '';
  let currentCat = '';

  spotlightFilteredItems.forEach((item, idx) => {
    const categoryName = getLocalized(item.category);
    if (categoryName !== currentCat) {
      currentCat = categoryName;
      html += `<div class="spotlight-group-title">${currentCat}</div>`;
    }

    const itemTitle = getLocalized(item.title);
    const itemSubtitle = getLocalized(item.subtitle);
    const isSelected = idx === spotlightIndex;
    html += `
      <div class="spotlight-item ${isSelected ? 'selected' : ''}" data-index="${idx}" onclick="executeSpotlightIndex(${idx})">
        <div class="spotlight-item-icon">${item.icon}</div>
        <div class="spotlight-item-content">
          <div class="spotlight-item-title">${escapeHtml(itemTitle)}</div>
          <div class="spotlight-item-subtitle">${escapeHtml(itemSubtitle)}</div>
        </div>
        <div class="spotlight-item-shortcut">↵</div>
      </div>
    `;
  });

  resultsContainer.innerHTML = html;
}

function updateSpotlightSelection() {
  const items = document.querySelectorAll('.spotlight-item');
  items.forEach((item, idx) => {
    const isSelected = idx === spotlightIndex;
    item.classList.toggle('selected', isSelected);
    if (isSelected) {
      item.scrollIntoView({ block: 'nearest' });
    }
  });
}

function executeSpotlightIndex(idx) {
  if (spotlightFilteredItems[idx]) {
    executeSpotlightItem(spotlightFilteredItems[idx]);
  }
}

function executeSpotlightItem(item) {
  closeSpotlight();
  SoundSystem.play('click');
  if (typeof item.action === 'function') {
    setTimeout(item.action, 80);
  }
}

/* ==================== TERMINAL ==================== */
function initTerminal() {
  const input = document.getElementById('term-input');
  if (!input) return;

  input.addEventListener('keydown', (e) => {
    SoundSystem.unlockAudio();
    if (e.key === 'Enter') {
      SoundSystem.play('click');
      const cmd = input.value.trim();
      input.value = '';
      executeCommand(cmd);
    } else if (e.key.length === 1 || e.key === 'Backspace') {
      SoundSystem.play('keystroke');
    }
  });
}

function executeCommand(cmd) {
  const output = document.getElementById('term-output');
  if (!output) return;

  const line = document.createElement('div');
  line.className = 'terminal-line';
  line.innerHTML = `<span class="terminal-prompt">guest@ivan-os:~$</span> ${escapeHtml(cmd)}`;
  output.appendChild(line);

  const cleanCmd = cmd.toLowerCase().trim();
  const resp = document.createElement('div');
  resp.className = 'terminal-line';
  resp.style.color = '#e2e8f0';

  // Modular Easter Eggs Check (doom, matrix, sudo hire-me, coffee, secrets)
  if (window.TerminalEasterEggs && typeof window.TerminalEasterEggs.handle === 'function' && window.TerminalEasterEggs.handle(cleanCmd, resp, output)) {
    output.appendChild(resp);
    const winContent = output.closest('.os-window-content');
    if (winContent) {
      winContent.scrollTop = winContent.scrollHeight;
    }
    return;
  }

  switch (cleanCmd) {
    case 'help':
      resp.innerHTML = `
Comandos disponibles:<br>
  <span style="color: var(--color-primary, #38bdf8)">about</span>       - Resumen sobre Iván Pieretto<br>
  <span style="color: var(--color-primary, #38bdf8)">projects</span>    - Listado de proyectos destacados<br>
  <span style="color: var(--color-primary, #38bdf8)">skills</span>      - Stack tecnológico y herramientas<br>
  <span style="color: var(--color-primary, #38bdf8)">contact</span>     - Canales de contacto directo<br>
  <span style="color: var(--color-primary, #38bdf8)">neofetch</span>    - Especificaciones del sistema<br>
  <span style="color: var(--color-primary, #38bdf8)">theme</span>       - Cambiar tema de acento (cyan, blue, purple, emerald)<br>
  <span style="color: var(--color-primary, #38bdf8)">clear</span>       - Limpiar la pantalla<br>
  <span style="color: var(--color-primary, #38bdf8)">whoami</span>      - Usuario actual<br>
  <span style="color: #a855f7">easter eggs</span> - Comandos secretos (doom, matrix, coffee, sudo hire-me)
`;
      break;

    case 'about':
      resp.innerHTML = `Iván Pieretto — Técnico Superior en Desarrollo de Software (Rosario, Santa Fe). Apasionado por desarrollo web front-end de alta gama y flujos de trabajo con inteligencia artificial.`;
      break;

    case 'projects':
      resp.innerHTML = `
Proyectos destacados:<br>
  • <strong>adaptIA</strong>: Plataforma SaaS para optimización de CVs con IA.<br>
  • <strong>Estudio el Oso</strong>: Experiencia 3D y web portfolio con Three.js y GSAP.<br>
  • <strong>Chappie-bot</strong>: Asistente local de IA para control de PC por voz.<br>
Tip: Escribí <span style="color:var(--color-primary)">open projects</span> para abrir la ventana gráfica.
`;
      break;

    case 'skills':
      resp.innerHTML = `
Stack Tecnológico:<br>
  • <strong>Front-End</strong>: HTML5, CSS3/Tailwind, JavaScript ES6+, React, Vite, Three.js, GSAP.<br>
  • <strong>Back-End & DB</strong>: Python, FastAPI, Node.js, SQL, PostgreSQL, Docker.<br>
  • <strong>IA & Flujos</strong>: Modelos locales (Ollama), LLMs, automatizaciones n8n.<br>
  • <strong>Herramientas</strong>: Git, GitHub, Linux/Bash, VS Code, Figma.
`;
      break;

    case 'contact':
      resp.innerHTML = `
Email:    pierettoivan2004@gmail.com<br>
WhatsApp: +54 9 341 355-4160<br>
LinkedIn: linkedin.com/in/ivan-pieretto<br>
GitHub:   github.com/Ivan-rgb-ops
`;
      break;

    case 'neofetch':
      resp.innerHTML = `
<pre style="color:var(--color-primary); margin:0; font-size:0.75rem; line-height:1.2;">
       /\_八_/\      <strong>guest@ivan-portfolio-os</strong>
      (  o.o  )     ------------------------
       > ^ <       <strong>OS</strong>: Portfolio OS 2.0 (macOS/Linux Architecture)
      /|     |\     <strong>Host</strong>: Web Browser (V8 / JavaScript Engine)
     (_|_/ \_|_)    <strong>Kernel</strong>: Vanilla Web Standards + GSAP 3
                    <strong>Uptime</strong>: 100% Client-side
                    <strong>Shell</strong>: zsh / ivan-terminal
                    <strong>UI</strong>: Apple HIG + Glassmorphism
                    <strong>Author</strong>: Iván Pieretto
</pre>
`;
      break;

    case 'clear':
      output.innerHTML = '';
      return;

    case 'whoami':
      resp.innerText = 'guest (Recruiter / Visitor)';
      break;

    case 'date':
      resp.innerText = new Date().toString();
      break;

    case 'ls':
      resp.innerHTML = `About.app &nbsp; Projects.app &nbsp; Resume.pdf &nbsp; Contact.app &nbsp; ChatAI.app &nbsp; Settings.app`;
      break;

    case '':
      return;

    default:
      if (cleanCmd.startsWith('theme ')) {
        const themeColor = cleanCmd.replace('theme ', '').trim();
        setAccent(themeColor);
        resp.innerText = `Acento cambiado a: ${themeColor}`;
      } else if (cleanCmd.startsWith('open ')) {
        const appName = cleanCmd.replace('open ', '').trim();
        if (windowConfigs[appName]) {
          openWindow(appName);
          resp.innerText = `Abriendo ${appName}...`;
        } else {
          resp.innerText = `Aplicación desconocida: ${appName}. Opciones: about, projects, resume, contact, terminal, chat, settings.`;
        }
      } else {
        resp.innerHTML = `Comando no reconocido: <code>${escapeHtml(cmd)}</code>. Escribí <span style="color:var(--color-primary)">help</span> para ver opciones.`;
      }
      break;
  }

  output.appendChild(resp);
  const winContent = output.closest('.os-window-content');
  if (winContent) {
    winContent.scrollTop = winContent.scrollHeight;
  }
}

/* ==================== IVÁN AI CHAT ==================== */
function initChat() {
  const input = document.getElementById('chat-input');
  const btn = document.getElementById('chat-send-btn');
  if (!input || !btn) return;

  function send() {
    const text = input.value.trim();
    if (!text) return;
    SoundSystem.play('click');
    addChatMessage('user', escapeHtml(text));
    input.value = '';

    setTimeout(() => {
      respondAiChat(text);
    }, 400);
  }

  btn.addEventListener('click', send);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      send();
    }
  });

  document.querySelectorAll('.chat-suggestion-btn').forEach((suggestionBtn) => {
    suggestionBtn.addEventListener('click', () => {
      const prompt = suggestionBtn.getAttribute('data-prompt');
      if (prompt) {
        askChatPrompt(prompt);
      }
    });
  });
}

function askChatPrompt(promptText) {
  const input = document.getElementById('chat-input');
  if (input) {
    input.value = promptText;
    const btn = document.getElementById('chat-send-btn');
    if (btn) btn.click();
  }
}

function addChatMessage(role, text) {
  const box = document.getElementById('chat-messages');
  if (!box) return;

  const bubble = document.createElement('div');
  bubble.className = `chat-bubble ${role}`;
  if (role === 'user') {
    bubble.textContent = text;
  } else {
    bubble.innerHTML = text;
  }
  box.appendChild(bubble);

  if (window.gsap) {
    gsap.fromTo(bubble,
      { opacity: 0, y: 10, scale: 0.97 },
      { opacity: 1, y: 0, scale: 1, duration: 0.22, ease: "power2.out" }
    );
  }

  box.scrollTop = box.scrollHeight;
}

function respondAiChat(query) {
  const q = query.toLowerCase();
  let answer = '';

  if (currentLang === 'en') {
    if (q.includes('tech') || q.includes('stack') || q.includes('skill') || q.includes('language') || q.includes('framework')) {
      answer = `Iván is proficient in <strong>React, Vite, Three.js, GSAP, Node.js, React Native, SQL, PostgreSQL, and Python</strong>. He has strong foundation in software development and advanced workflows with <strong>Generative AI (Ollama, local LLMs, n8n)</strong>.`;
    } else if (q.includes('project') || q.includes('portfolio') || q.includes('work') || q.includes('repo')) {
      answer = `Among his featured real-world projects:<br>• <strong><a href="https://github.com/Ivan-rgb-ops/adaptIA" target="_blank" style="color:var(--color-primary);">adaptIA</a></strong>: AI-powered resume tailoring platform.<br>• <strong><a href="https://github.com/Ivan-rgb-ops/estudioeloso" target="_blank" style="color:var(--color-primary);">Estudio el Oso</a></strong>: Immersive site with Three.js, GSAP, and a custom 3D lens.<br>• <strong><a href="https://github.com/Ivan-rgb-ops/Chappie-bot" target="_blank" style="color:var(--color-primary);">Chappie-bot</a></strong>: Local AI assistant for voice PC control.<br>Open the <em>Projects</em> window from the Dock to inspect screenshots and repos!`;
    } else if (q.includes('contact') || q.includes('mail') || q.includes('hire') || q.includes('reach') || q.includes('linkedin') || q.includes('phone') || q.includes('whatsapp')) {
      answer = `Direct contact channels for Iván:<br>• <strong>Email</strong>: <a href="mailto:pierettoivan2004@gmail.com" style="color:var(--color-primary);text-decoration:underline;">pierettoivan2004@gmail.com</a><br>• <strong>WhatsApp</strong>: <a href="https://wa.me/5493413554160" target="_blank" style="color:var(--color-primary);text-decoration:underline;">+54 9 341 355-4160</a><br>• <strong>LinkedIn</strong>: <a href="https://linkedin.com/in/ivan-pieretto" target="_blank" style="color:var(--color-primary);text-decoration:underline;">linkedin.com/in/ivan-pieretto</a><br>• <strong>GitHub</strong>: <a href="https://github.com/Ivan-rgb-ops" target="_blank" style="color:var(--color-primary);text-decoration:underline;">github.com/Ivan-rgb-ops</a>.`;
    } else if (q.includes('cv') || q.includes('resume') || q.includes('summary')) {
      answer = `You can preview and download Iván's CV by opening the <strong>Resume</strong> app from the Dock or downloading it directly in PDF format!`;
    } else if (q.includes('about') || q.includes('who') || q.includes('experience') || q.includes('education') || q.includes('background')) {
      answer = `Iván Pieretto is a Software Development Technician based in Rosario, Santa Fe, Argentina. He specializes in highly interactive front-end experiences, Python/backend solutions, and AI integration.`;
    } else {
      answer = `Hello! I am Iván's virtual assistant. I can tell you about his <strong>real-world projects</strong> (adaptIA, Estudio el Oso, Chappie-bot), his <strong>technical stack</strong>, or how to <strong>contact him</strong>. What would you like to know?`;
    }
  } else {
    if (q.includes('tecnolog') || q.includes('stack') || q.includes('skill')) {
      answer = `Iván domina <strong>React, Vite, Three.js, GSAP, Node.js, React Native, SQL, PostgreSQL y Python</strong>. Cuenta con formación sólida en desarrollo de software y flujos avanzados con <strong>IA Generativa (Ollama, LLMs locales, n8n)</strong>.`;
    } else if (q.includes('proyecto') || q.includes('portfolio') || q.includes('trabajo') || q.includes('repo')) {
      answer = `Entre sus proyectos reales más destacados están: <br>• <strong><a href="https://github.com/Ivan-rgb-ops/adaptIA" target="_blank" style="color:var(--color-primary);">adaptIA</a></strong>: Aplicación web para optimizar CVs con IA.<br>• <strong><a href="https://github.com/Ivan-rgb-ops/estudioeloso" target="_blank" style="color:var(--color-primary);">Estudio el Oso</a></strong>: Web inmersiva con Three.js, GSAP y lente fotográfica 3D.<br>• <strong><a href="https://github.com/Ivan-rgb-ops/Chappie-bot" target="_blank" style="color:var(--color-primary);">Chappie-bot</a></strong>: Asistente local de IA para control de PC por voz.<br>¡Podés abrir la ventana <em>Proyectos</em> para ver las capturas y repos!`;
    } else if (q.includes('contacto') || q.includes('mail') || q.includes('contratar') || q.includes('linkedin') || q.includes('telefono')) {
      answer = `Canales de contacto directo con Iván:<br>• <strong>Email</strong>: <a href="mailto:pierettoivan2004@gmail.com" style="color:var(--color-primary);text-decoration:underline;">pierettoivan2004@gmail.com</a><br>• <strong>WhatsApp</strong>: <a href="https://wa.me/5493413554160" target="_blank" style="color:var(--color-primary);text-decoration:underline;">+54 9 341 355-4160</a><br>• <strong>LinkedIn</strong>: <a href="https://linkedin.com/in/ivan-pieretto" target="_blank" style="color:var(--color-primary);text-decoration:underline;">linkedin.com/in/ivan-pieretto</a><br>• <strong>GitHub</strong>: <a href="https://github.com/Ivan-rgb-ops" target="_blank" style="color:var(--color-primary);text-decoration:underline;">github.com/Ivan-rgb-ops</a>.`;
    } else if (q.includes('cv') || q.includes('curriculum') || q.includes('resumen')) {
      answer = `¡Podés ver y descargar el currículum de Iván abriendo la ventana <strong>Currículum</strong> en el Dock o descargarlo directamente en formato PDF!`;
    } else if (q.includes('experiencia') || q.includes('quien') || q.includes('sobre') || q.includes('educacion')) {
      answer = `Iván Pieretto es Técnico Superior en Desarrollo de Software (Complejo Educativo Brigadier López) con base en Rosario, Santa Fe. Se especializa en desarrollo front-end de alta interactividad y soluciones tecnológicas reales.`;
    } else {
      answer = `¡Hola! Soy el asistente virtual de Iván. Puedo contarte sobre sus <strong>proyectos reales</strong> (adaptIA, Estudio el Oso, Chappie-bot), sus <strong>habilidades técnicas</strong> o su <strong>contacto</strong>. ¿Qué te gustaría consultar?`;
    }
  }

  addChatMessage('ai', answer);
}

/* ==================== SETTINGS & WALLPAPERS ==================== */
function initSettings() {
  document.querySelectorAll('.accent-dot').forEach(dot => {
    dot.addEventListener('click', () => {
      const color = dot.getAttribute('data-color');
      setAccent(color);
    });
  });

  let savedWp = SafeStorage.get('portfolio-os-wallpaper', 'photo-space');
  setWallpaper(savedWp, false);
}

function setAccent(color) {
  let hex = '#38bdf8';
  if (color === 'blue') hex = '#3b82f6';
  if (color === 'purple') hex = '#a855f7';
  if (color === 'emerald') hex = '#10b981';
  if (color === 'rose') hex = '#f43f5e';
  if (color === 'cyan') hex = '#22d3c5';

  document.documentElement.style.setProperty('--color-primary', hex);
  showToast(`Acento: ${color}`);
}

function stopWallpaperAnimation() {
  if (wallpaperAnimFrame) {
    cancelAnimationFrame(wallpaperAnimFrame);
    wallpaperAnimFrame = null;
  }
  if (starlightResizeHandler) {
    window.removeEventListener('resize', starlightResizeHandler);
    starlightResizeHandler = null;
  }
  const canvas = document.getElementById('wallpaper-canvas');
  if (canvas) {
    canvas.style.display = 'none';
    const ctx = canvas.getContext('2d');
    if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
  }
}

function startStarlightWallpaper() {
  stopWallpaperAnimation();
  const canvas = document.getElementById('wallpaper-canvas');
  if (!canvas) return;
  canvas.style.display = 'block';
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  const ctx = canvas.getContext('2d');

  starlightResizeHandler = () => {
    if (canvas && canvas.style.display !== 'none') {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
  };
  window.addEventListener('resize', starlightResizeHandler, { passive: true });

  const numStars = 135;
  const stars = [];
  const palette = [
    '235, 243, 255',
    '210, 230, 255',
    '255, 248, 230',
    '240, 230, 255'
  ];

  for (let i = 0; i < numStars; i++) {
    stars.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      radius: Math.random() * 1.1 + 0.6,
      baseAlpha: Math.random() * 0.35 + 0.2,
      twinkleSpeed: Math.random() * 0.015 + 0.006,
      phase: Math.random() * Math.PI * 2,
      color: palette[Math.floor(Math.random() * palette.length)],
      driftX: (Math.random() - 0.5) * 0.035,
      driftY: (Math.random() - 0.5) * 0.018
    });
  }

  let shootingStar = null;
  let lastShootingTime = performance.now();

  function spawnShootingStar() {
    const startX = Math.random() * (canvas.width * 0.75);
    const startY = Math.random() * (canvas.height * 0.35);
    shootingStar = {
      x: startX,
      y: startY,
      len: Math.random() * 70 + 50,
      speed: Math.random() * 9 + 7,
      opacity: 0.9,
      dx: 1,
      dy: 0.55
    };
  }

  function render(time) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    grad.addColorStop(0, '#04060d');
    grad.addColorStop(1, '#0c1022');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (let i = 0; i < stars.length; i++) {
      const s = stars[i];
      s.x += s.driftX;
      s.y += s.driftY;
      if (s.x < 0) s.x = canvas.width;
      if (s.x > canvas.width) s.x = 0;
      if (s.y < 0) s.y = canvas.height;
      if (s.y > canvas.height) s.y = 0;

      const alpha = s.baseAlpha + (1 - s.baseAlpha) * 0.45 * Math.sin(time * s.twinkleSpeed + s.phase);

      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${s.color}, ${Math.max(0.12, alpha)})`;
      ctx.fill();
    }

    if (!shootingStar && time - lastShootingTime > 12000) {
      if (Math.random() < 0.45) {
        spawnShootingStar();
      }
      lastShootingTime = time;
    }

    if (shootingStar) {
      shootingStar.x += shootingStar.dx * shootingStar.speed;
      shootingStar.y += shootingStar.dy * shootingStar.speed;
      shootingStar.opacity -= 0.016;

      const tailX = shootingStar.x - shootingStar.dx * shootingStar.len * 0.4;
      const tailY = shootingStar.y - shootingStar.dy * shootingStar.len * 0.4;

      const shootGrad = ctx.createLinearGradient(tailX, tailY, shootingStar.x, shootingStar.y);
      shootGrad.addColorStop(0, 'rgba(255, 255, 255, 0)');
      shootGrad.addColorStop(1, `rgba(225, 240, 255, ${Math.max(0, shootingStar.opacity)})`);

      ctx.beginPath();
      ctx.moveTo(tailX, tailY);
      ctx.lineTo(shootingStar.x, shootingStar.y);
      ctx.strokeStyle = shootGrad;
      ctx.lineWidth = 1.3;
      ctx.stroke();

      if (shootingStar.opacity <= 0 || shootingStar.x > canvas.width || shootingStar.y > canvas.height) {
        shootingStar = null;
        lastShootingTime = time;
      }
    }

    wallpaperAnimFrame = requestAnimationFrame(render);
  }

  wallpaperAnimFrame = requestAnimationFrame(render);
}

function updateWallpaperActive(card) {
  document.querySelectorAll('.wallpaper-card').forEach(c => c.classList.remove('active'));
  if (card && card.classList) {
    card.classList.add('active');
  }
}
window.updateWallpaperActive = updateWallpaperActive;

function setWallpaper(type, notify = true) {
  const bg = document.getElementById('desktop-bg');
  if (!bg) return;

  const key = (type || 'photo-space').trim();
  SafeStorage.set('portfolio-os-wallpaper', key);

  // 1. Rigorous cleanup: cancel running canvas animations & listeners
  stopWallpaperAnimation();

  // 2. Clear all previous inline background properties to avoid stale state or leaks
  bg.style.backgroundImage = '';
  bg.style.backgroundColor = '';
  bg.style.backgroundSize = '';
  bg.style.backgroundPosition = '';
  bg.style.backgroundRepeat = '';
  bg.style.backgroundAttachment = '';
  bg.style.backgroundOrigin = '';
  bg.style.backgroundClip = '';
  bg.style.background = '';
  bg.style.transition = 'background 0.4s ease, background-color 0.4s ease';

  // 3. Apply the designated wallpaper aesthetic
  switch (key) {
    case 'gradient-dark':
    case 'dark-matter':
      bg.style.background = 'radial-gradient(ellipse at bottom, #0f172a 0%, #030508 100%)';
      bg.style.backgroundColor = '#030508';
      break;

    case 'sunset-calm':
    case 'sunset':
      bg.style.background = 'linear-gradient(160deg, #0e0c19 0%, #1c142b 35%, #2a192c 70%, #3a1e26 100%)';
      bg.style.backgroundColor = '#0e0c19';
      break;

    case 'nordic-mist':
    case 'nordic':
      bg.style.background = 'linear-gradient(135deg, #0c1017 0%, #151b24 50%, #1e2634 100%)';
      bg.style.backgroundColor = '#0c1017';
      break;

    case 'quiet-forest':
    case 'forest':
      bg.style.background = 'radial-gradient(ellipse at 50% 40%, #0c1e16 0%, #07130e 55%, #030806 100%)';
      bg.style.backgroundColor = '#030806';
      break;

    case 'cozy-mocha':
    case 'mocha':
      bg.style.background = 'linear-gradient(145deg, #110d0c 0%, #1b1413 50%, #261b19 100%)';
      bg.style.backgroundColor = '#110d0c';
      break;

    case 'lavender-dusk':
    case 'lavender':
      bg.style.background = 'radial-gradient(ellipse at bottom, #1d1738 0%, #120f24 50%, #090814 100%)';
      bg.style.backgroundColor = '#090814';
      break;

    case 'solid-dark':
    case 'oled':
    case 'dark':
      bg.style.background = '#050608';
      bg.style.backgroundColor = '#050608';
      break;

    case 'solid-light':
    case 'light':
      bg.style.background = 'linear-gradient(135deg, #f1f5f9 0%, #cbd5e1 100%)';
      bg.style.backgroundColor = '#cbd5e1';
      break;

    case 'nebula':
      bg.style.background = 'radial-gradient(1px 1px at 20% 30%, rgba(255,255,255,0.6), transparent), radial-gradient(100% 100% at 30% 20%, color-mix(in srgb, var(--color-primary, #22d3c5) 25%, #03060a), #03060a)';
      bg.style.backgroundColor = '#03060a';
      break;

    case 'horizon':
      bg.style.background = 'linear-gradient(180deg, #03060a 0%, color-mix(in srgb, var(--color-primary, #22d3c5) 30%, #03060a) 100%)';
      bg.style.backgroundColor = '#03060a';
      break;

    case 'starlight':
    case 'starlight-chill':
    case 'starfield':
      bg.style.background = '#03050c';
      bg.style.backgroundColor = '#03050c';
      startStarlightWallpaper();
      break;

    case 'velvet-aurora':
    case 'aurora':
      bg.style.background = `radial-gradient(ellipse at 25% 15%, rgba(34, 211, 197, 0.28) 0%, transparent 55%),
        radial-gradient(ellipse at 80% 30%, rgba(99, 102, 241, 0.3) 0%, transparent 60%),
        linear-gradient(145deg, #020409 0%, #06111a 45%, #0b152d 100%)`;
      bg.style.backgroundColor = '#020409';
      break;

    case 'midnight-sonoma':
    case 'sonoma':
      bg.style.background = `radial-gradient(circle at 80% 25%, rgba(168, 85, 247, 0.25) 0%, transparent 50%),
        radial-gradient(circle at 20% 80%, rgba(244, 63, 94, 0.2) 0%, transparent 50%),
        linear-gradient(160deg, #05060d 0%, #0c0f1d 50%, #17182e 100%)`;
      bg.style.backgroundColor = '#05060d';
      break;

    case 'dusk-pastels':
    case 'dusk':
      bg.style.background = 'linear-gradient(175deg, #070913 0%, #131428 40%, #29182d 75%, #3d212b 100%)';
      bg.style.backgroundColor = '#070913';
      break;

    case 'emerald-deep':
    case 'emerald':
      bg.style.background = 'radial-gradient(ellipse at 50% 95%, rgba(16, 185, 129, 0.28) 0%, rgba(6, 44, 30, 0.45) 45%, #010805 100%)';
      bg.style.backgroundColor = '#010805';
      break;

    case 'mountain-terrain':
    case 'mountain':
      bg.style.background = "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1440 320' preserveAspectRatio='none'%3E%3Cpolygon points='0,320 280,140 520,230 840,90 1080,180 1440,320' fill='%23060a10' opacity='0.85'/%3E%3Cpolygon points='0,320 180,210 420,270 720,170 1020,250 1260,190 1440,320' fill='%2304060b' opacity='0.95'/%3E%3C/svg%3E\") bottom/100% 280px no-repeat, linear-gradient(180deg, #0a0e17 0%, #151e2e 60%, #1e293b 100%)";
      bg.style.backgroundColor = '#0a0e17';
      break;

    case 'photo-cyber':
    case 'cyber-city':
    case 'cyber':
      bg.style.background = "url('wallpaper2.jpg') center/cover no-repeat";
      bg.style.backgroundColor = '#080c14';
      break;

    case 'photo-space':
    case 'space':
    default:
      bg.style.background = "url('wallpaper.jpg') center/cover no-repeat";
      bg.style.backgroundColor = '#090a0f';
      break;
  }

  // 4. Highlight active card in Wallpapers modal
  document.querySelectorAll('.wallpaper-card').forEach(c => {
    const fnAttr = c.getAttribute('onclick') || '';
    if (fnAttr.includes(`'${key}'`) ||
       (key === 'gradient-dark' && fnAttr.includes("'gradient-dark'")) ||
       (key === 'photo-space' && fnAttr.includes("'photo-space'"))) {
      c.classList.add('active');
    } else {
      c.classList.remove('active');
    }
  });

  // 5. Sound feedback
  if (notify && window.SoundSystem) {
    SoundSystem.play('click');
  }

  // 6. Toast notification
  if (notify) {
    showToast(currentLang === 'es' ? 'Fondo de pantalla actualizado' : 'Wallpaper updated');
  }
}

/* ==================== CONTEXT MENU & DESKTOP HELPERS ==================== */
function refreshDesktop() {
  closeContextMenu();
  SoundSystem.play('click');
  if (window.gsap) {
    gsap.fromTo('.desktop-icon',
      { opacity: 0.5, scale: 0.94 },
      { opacity: 1, scale: 1, stagger: 0.035, duration: 0.32, ease: "back.out(1.2)", clearProps: "opacity,scale" }
    );
  }
  showToast(currentLang === 'es' ? 'Escritorio actualizado' : 'Desktop refreshed');
}

function closeAllWindows() {
  closeContextMenu();
  SoundSystem.play('close');
  if (typeof windowConfigs !== 'undefined') {
    Object.keys(windowConfigs).forEach(name => {
      const win = document.getElementById(`win-${name}`);
      if (win && win.style.display !== 'none' && win.style.display) {
        closeWindow(name);
      }
    });
  }
  showToast(currentLang === 'es' ? 'Todas las ventanas cerradas' : 'All windows closed');
}

function minimizeAllWindows() {
  closeContextMenu();
  SoundSystem.play('minimize');
  if (typeof windowConfigs !== 'undefined') {
    Object.keys(windowConfigs).forEach(name => {
      const win = document.getElementById(`win-${name}`);
      if (win && win.style.display !== 'none' && win.style.display && !win._isMinimized) {
        minimizeWindow(name);
      }
    });
  }
}

function initContextMenu() {
  const menu = document.getElementById('desktop-context-menu') || document.getElementById('context-menu');
  if (!menu) return;

  // Prevent browser context menu on the entire page/desktop, except on native form controls
  document.addEventListener('contextmenu', (e) => {
    // Allow native context menu on interactive form elements and selectable inputs
    if (e.target.closest('input, textarea, select, [contenteditable="true"], .terminal-body')) {
      return;
    }

    e.preventDefault();

    // Do not show desktop context menu while locked / booting
    const bootScreen = document.getElementById('boot-screen');
    if (isBooting || (bootScreen && bootScreen.style.display !== 'none' && !bootScreen.classList.contains('dismissed'))) {
      return;
    }

    // Do not show on open modals or spotlight
    if (e.target.closest('.modal-overlay.open, #spotlight-overlay.open')) {
      return;
    }

    SoundSystem.play('click');

    // Close start menu if open
    const startMenu = document.getElementById('start-menu-card');
    if (startMenu) startMenu.classList.remove('open');

    const menuW = 230;
    const menuH = 340;
    let x = e.clientX;
    let y = e.clientY;

    if (x + menuW > window.innerWidth) {
      x = Math.max(10, window.innerWidth - menuW - 14);
      menu.classList.add('submenu-left');
    } else {
      menu.classList.remove('submenu-left');
    }

    if (y + menuH > window.innerHeight) {
      y = Math.max(10, window.innerHeight - menuH - 14);
      menu.classList.add('submenu-up');
    } else {
      menu.classList.remove('submenu-up');
    }

    menu.style.left = `${x}px`;
    menu.style.top = `${y}px`;
    menu.classList.add('open');
  });

  // Close context menu on click outside
  document.addEventListener('click', (e) => {
    if (!menu.contains(e.target)) {
      closeContextMenu();
    }
  });

  window.addEventListener('resize', closeContextMenu);
}

function closeContextMenu() {
  const menu = document.getElementById('desktop-context-menu') || document.getElementById('context-menu');
  if (menu) {
    menu.classList.remove('open');
  }
}

// Expose functions globally for inline HTML events
window.refreshDesktop = refreshDesktop;
window.closeAllWindows = closeAllWindows;
window.minimizeAllWindows = minimizeAllWindows;
window.closeContextMenu = closeContextMenu;

function arrangeIcons() {
  closeContextMenu();
  iconPositions = {};
  try {
    SafeStorage.remove('portfolio-os-icon-positions');
  } catch (err) {}

  document.querySelectorAll('.desktop-icon').forEach(icon => {
    icon.dataset.posX = '0';
    icon.dataset.posY = '0';
    if (window.gsap) {
      gsap.to(icon, {
        x: 0,
        y: 0,
        scale: 1,
        rotation: 0,
        duration: 0.35,
        ease: "back.out(1.2)",
        onComplete: () => {
          icon.style.transform = '';
        }
      });
    } else {
      icon.style.transform = '';
    }
  });

  SoundSystem.play('click');
  showToast(currentLang === 'es' ? 'Íconos organizados' : 'Icons arranged');
}

/* ==================== CONTACT FORM HANDLER ==================== */
function handleContactSubmit(e) {
  e.preventDefault();
  SoundSystem.play('click');
  const name = document.getElementById('contact-name')?.value || '';
  const email = document.getElementById('contact-email')?.value || '';
  const msg = document.getElementById('contact-msg')?.value || '';

  const mailtoUrl = `mailto:pierettoivan2004@gmail.com?subject=Contacto Portfolio OS - ${encodeURIComponent(name)}&body=${encodeURIComponent(`De: ${name} (${email})

Mensaje:
${msg}`)}`;
  window.open(mailtoUrl, '_blank');

  showToast(currentLang === 'es' ? 'Abriendo cliente de correo…' : 'Opening email client…');
  closeWindow('contact');
}

function switchResumeTab(btn, tabId) {
  SoundSystem.play('click');
  document.querySelectorAll('.resume-tab-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.resume-tab-pane').forEach(p => p.style.display = 'none');
  btn.classList.add('active');
  const target = document.getElementById(tabId);
  if (target) target.style.display = 'block';
}

function switchAboutTab(btn, tabId) {
  SoundSystem.play('click');
  document.querySelectorAll('.about-tab-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.about-tab-pane').forEach(p => p.style.display = 'none');
  btn.classList.add('active');
  const target = document.getElementById(tabId);
  if (target) target.style.display = 'block';
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/[&<>"']/g, function(m) {
    return {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    }[m];
  });
}
