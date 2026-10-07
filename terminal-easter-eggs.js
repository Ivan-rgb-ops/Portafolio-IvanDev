/**
 * terminal-easter-eggs.js
 * Modular Interactive Easter Eggs for Portfolio OS Terminal
 *
 * Commands:
 * - "doom"         : Opens DOOM (1993) floating window with playable web DOS emulator
 * - "matrix"       : Fullscreen Matrix green digital rain effect with cyber audio
 * - "sudo hire-me" : Root authorization hiring card, confetti cannon & victory fanfare
 * - "coffee"       : Steaming ASCII art cup of developer coffee
 * - "secrets"      : Lists all available secret commands
 */

(function () {
  'use strict';

  let matrixAnimFrame = null;
  let matrixCanvas = null;
  let matrixKeyHandler = null;
  let matrixAutoTimeout = null;

  let confettiAnimFrame = null;
  let confettiCanvas = null;

  // Web Audio Synthesizer for retro & sci-fi audio effects (zero external assets required)
  const AudioFx = {
    ctx: null,
    getCtx() {
      if (!this.ctx && (window.AudioContext || window.webkitAudioContext)) {
        try {
          const AudioCtor = window.AudioContext || window.webkitAudioContext;
          this.ctx = new AudioCtor();
        } catch (e) {
          this.ctx = null;
        }
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
      return this.ctx;
    },

    playBeep(freq = 440, duration = 0.08, type = 'sine') {
      const ctx = this.getCtx();
      if (!ctx) return;
      try {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, ctx.currentTime);
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + duration);
      } catch (e) {}
    },

    playMatrixSound() {
      const ctx = this.getCtx();
      if (!ctx) return;
      try {
        const notes = [220, 330, 440, 660, 880, 1100, 1320];
        notes.forEach((freq, i) => {
          setTimeout(() => {
            this.playBeep(freq, 0.06, 'sawtooth');
          }, i * 45);
        });
      } catch (e) {}
    },

    playVictoryFanfare() {
      const ctx = this.getCtx();
      if (!ctx) return;
      try {
        // C5, E5, G5, C6 triumph chord progression
        const chord = [523.25, 659.25, 783.99, 1046.50];
        chord.forEach((freq, idx) => {
          setTimeout(() => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, ctx.currentTime);
            gain.gain.setValueAtTime(0.12, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + 0.35);
          }, idx * 110);
        });
      } catch (e) {}
    }
  };

  /* ==================== 1. DOOM EASTER EGG ==================== */
  function launchDoom() {
    const doomWin = document.getElementById('win-doom');
    const iframe = document.getElementById('doom-iframe');

    if (iframe) {
      const targetSrc = iframe.getAttribute('data-src') || 'https://archive.org/embed/doom_dos';
      if (!iframe.src || iframe.src === 'about:blank' || !iframe.src.includes('archive.org')) {
        iframe.src = targetSrc;
      }
    }

    if (typeof window.openWindow === 'function') {
      window.openWindow('doom');
    } else if (doomWin) {
      doomWin.style.display = 'flex';
    }

    AudioFx.playBeep(180, 0.25, 'sawtooth');
  }

  function onDoomClosed() {
    const iframe = document.getElementById('doom-iframe');
    if (iframe) {
      // Unload emulator to stop background game audio
      iframe.src = 'about:blank';
    }
  }

  /* ==================== 2. MATRIX RAIN EFFECT ==================== */
  function launchMatrix() {
    stopMatrix(); // Ensure any existing instance is cleaned up

    AudioFx.playMatrixSound();

    matrixCanvas = document.createElement('canvas');
    matrixCanvas.id = 'matrix-rain-overlay';
    matrixCanvas.style.cssText = `
      position: fixed;
      inset: 0;
      width: 100vw;
      height: 100vh;
      z-index: 999999;
      background: rgba(3, 8, 4, 0.94);
      cursor: pointer;
      opacity: 1;
      transition: opacity 0.35s ease;
    `;
    document.body.appendChild(matrixCanvas);

    // Instructions banner
    const hud = document.createElement('div');
    hud.id = 'matrix-hud';
    hud.style.cssText = `
      position: fixed;
      bottom: 24px;
      left: 50%;
      transform: translateX(-50%);
      z-index: 1000000;
      background: rgba(0, 0, 0, 0.88);
      border: 1px solid rgba(34, 197, 94, 0.6);
      box-shadow: 0 0 20px rgba(34, 197, 94, 0.35);
      color: #4ade80;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 0.85rem;
      padding: 8px 20px;
      border-radius: 9999px;
      pointer-events: none;
      user-select: none;
      letter-spacing: 0.05em;
    `;
    hud.innerHTML = `⌨️ Presiona <b style="color:#fff;">ESC</b> o haz clic para salir • Modo Matrix Iván OS`;
    document.body.appendChild(hud);

    const ctx = matrixCanvas.getContext('2d');
    let width = (matrixCanvas.width = window.innerWidth);
    let height = (matrixCanvas.height = window.innerHeight);

    const handleResize = () => {
      if (!matrixCanvas) return;
      width = matrixCanvas.width = window.innerWidth;
      height = matrixCanvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize, { passive: true });

    // Matrix characters: Katakana + digits + code symbols
    const chars = 'ﾊﾐﾋｰｳｼﾅﾓﾆｻﾜﾂｵﾘｱﾎﾃﾏｹﾒｴｶｷﾑﾕﾗｾﾈｽﾀﾇﾍ0123456789ABCDEF<>/*+=!#@$%&';
    const fontSize = 16;
    const columns = Math.floor(width / fontSize);
    // Initialize drops randomly distributed across full screen height
    const drops = new Array(columns).fill(0).map(() => Math.floor(Math.random() * (height / fontSize)));

    function renderMatrix() {
      if (!ctx || !matrixCanvas) return;

      // Dark translucent wash to create fading phosphor trail
      ctx.fillStyle = 'rgba(2, 6, 3, 0.08)';
      ctx.fillRect(0, 0, width, height);

      ctx.font = `${fontSize}px monospace`;

      for (let i = 0; i < drops.length; i++) {
        const char = chars.charAt(Math.floor(Math.random() * chars.length));
        const x = i * fontSize;
        const y = drops[i] * fontSize;

        // Leading char is bright white-green with glow
        if (Math.random() > 0.4) {
          ctx.fillStyle = '#f0fdf4';
          ctx.shadowBlur = 8;
          ctx.shadowColor = '#4ade80';
        } else {
          ctx.fillStyle = '#22c55e';
          ctx.shadowBlur = 0;
        }

        ctx.fillText(char, x, y);

        if (y > height && Math.random() > 0.975) {
          drops[i] = 0;
        }
        drops[i]++;
      }

      matrixAnimFrame = requestAnimationFrame(renderMatrix);
    }

    matrixAnimFrame = requestAnimationFrame(renderMatrix);

    // Dismiss listeners
    matrixKeyHandler = (e) => {
      if (e.key === 'Escape' || e.key === 'q' || e.key === 'Q') {
        stopMatrix();
      }
    };
    window.addEventListener('keydown', matrixKeyHandler);
    
    // Add click listener with slight delay to avoid triggering on input click
    setTimeout(() => {
      if (matrixCanvas) {
        matrixCanvas.addEventListener('click', stopMatrix);
      }
    }, 200);

    // Auto-timeout after 12 seconds
    matrixAutoTimeout = setTimeout(() => {
      stopMatrix();
    }, 12000);
  }

  function safeRemove(elem) {
    if (!elem) return;
    if (typeof elem.remove === 'function') {
      elem.remove();
    } else if (elem.parentNode) {
      elem.parentNode.removeChild(elem);
    }
  }

  function stopMatrix() {
    if (matrixAutoTimeout) {
      clearTimeout(matrixAutoTimeout);
      matrixAutoTimeout = null;
    }
    if (matrixKeyHandler) {
      window.removeEventListener('keydown', matrixKeyHandler);
      matrixKeyHandler = null;
    }
    if (matrixAnimFrame) {
      cancelAnimationFrame(matrixAnimFrame);
      matrixAnimFrame = null;
    }

    const hud = document.getElementById('matrix-hud');
    if (hud) safeRemove(hud);

    if (matrixCanvas) {
      matrixCanvas.style.opacity = '0';
      const ref = matrixCanvas;
      matrixCanvas = null;
      setTimeout(() => {
        safeRemove(ref);
      }, 350);
    }
  }

  /* ==================== 3. SUDO HIRE-ME & CONFETTI CANNON ==================== */
  function launchHireMe() {
    AudioFx.playVictoryFanfare();
    if (window.SoundSystem) {
      try { window.SoundSystem.play('boot'); } catch (e) {}
    }

    launchConfetti();

    if (typeof window.showToast === 'function') {
      window.showToast(
        window.currentLang === 'es'
          ? '🎉 ¡Candidato contratado! Iván Pieretto se suma al equipo.'
          : '🎉 Candidate hired! Iván Pieretto joins the team.'
      );
    }
  }

  function launchConfetti() {
    if (confettiCanvas) {
      if (confettiAnimFrame) cancelAnimationFrame(confettiAnimFrame);
      safeRemove(confettiCanvas);
      confettiCanvas = null;
    }

    confettiCanvas = document.createElement('canvas');
    confettiCanvas.id = 'hire-confetti-canvas';
    confettiCanvas.style.cssText = `
      position: fixed;
      inset: 0;
      width: 100vw;
      height: 100vh;
      pointer-events: none;
      z-index: 999999;
    `;
    document.body.appendChild(confettiCanvas);

    const ctx = confettiCanvas.getContext('2d');
    const width = (confettiCanvas.width = window.innerWidth);
    const height = (confettiCanvas.height = window.innerHeight);

    const colors = ['#22d3c5', '#38bdf8', '#fbbf24', '#f43f5e', '#a855f7', '#4ade80', '#ffffff'];
    const particles = [];
    const particleCount = 140;

    // Launch dual cannons from bottom corners towards center
    for (let i = 0; i < particleCount; i++) {
      const fromLeft = i % 2 === 0;
      particles.push({
        x: fromLeft ? Math.random() * (width * 0.25) : width - Math.random() * (width * 0.25),
        y: height - 20,
        vx: fromLeft ? (Math.random() * 8 + 4) : -(Math.random() * 8 + 4),
        vy: -(Math.random() * 15 + 10),
        size: Math.random() * 8 + 5,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * 360,
        rotSpeed: (Math.random() - 0.5) * 12,
        wobble: Math.random() * 10,
        wobbleSpeed: Math.random() * 0.1 + 0.05,
        gravity: 0.32,
        drag: 0.98,
        opacity: 1
      });
    }

    const startTime = performance.now();
    const duration = 4000; // 4 seconds

    function renderConfetti(now) {
      if (!ctx || !confettiCanvas) return;
      ctx.clearRect(0, 0, width, height);

      const elapsed = now - startTime;
      const progress = elapsed / duration;

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.vx *= p.drag;
        p.vy *= p.drag;
        p.vy += p.gravity;
        p.x += p.vx;
        p.y += p.vy;
        p.rotation += p.rotSpeed;
        p.wobble += p.wobbleSpeed;

        if (progress > 0.6) {
          p.opacity = Math.max(0, 1 - (progress - 0.6) / 0.4);
        }

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.scale(Math.cos(p.wobble), 1);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.opacity;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.65);
        ctx.restore();
      }

      if (progress < 1) {
        confettiAnimFrame = requestAnimationFrame(renderConfetti);
      } else {
        if (confettiCanvas) {
          safeRemove(confettiCanvas);
          confettiCanvas = null;
        }
      }
    }

    confettiAnimFrame = requestAnimationFrame(renderConfetti);
  }

  /* ==================== 4. COFFEE ASCII ART ==================== */
  function getCoffeeOutput() {
    return `
<pre style="color: #f59e0b; font-family: ui-monospace, monospace; font-size: 0.78rem; line-height: 1.25; margin: 0.35rem 0; text-shadow: 0 0 10px rgba(245, 158, 11, 0.25);">
      (  )   (   )  )
       ) (   )  (  (
      ( )  (    ) )
      _____________
     &lt;_____________&gt; ===.
     |             |/ _ \\
     |   Iván OS   | | | |
     |   COFFEE    |\\ \\_/
     |             | \\===
     \\_____________/
   ~~~~~~~~~~~~~~~~~~~
</pre>
<div style="color: #fcd34d; font-size: 0.88rem; margin-top: 4px; line-height: 1.4;">
  ☕ <b>Café recién preparado: 100% Arábica · 0% Bugs · 200% Enfoque.</b><br>
  <span style="color: #94a3b8; font-size: 0.8rem;">
    "Un desarrollador de software es un mecanismo que transforma café en arquitecturas escalables."
  </span>
</div>
`;
  }

  /* ==================== 5. SECRETS DIRECTORY ==================== */
  function getSecretsHelp() {
    return `
<div style="line-height: 1.5; font-size: 0.85rem;">
  <span style="color: #a855f7; font-weight: 700;">🔮 Comandos Secretos & Easter Eggs de Iván OS:</span><br>
  • <span style="color: #ef4444; font-weight: 600;">doom</span> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;- Inicia DOOM (1993) en una ventana flotante jugable con emulador DOS.<br>
  • <span style="color: #22c55e; font-weight: 600;">matrix</span> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;- Activa la legendaria lluvia de código digital en pantalla completa.<br>
  • <span style="color: #38bdf8; font-weight: 600;">sudo hire-me</span> &nbsp;&nbsp;- Concede permisos root y lanza la celebración oficial de contratación.<br>
  • <span style="color: #f59e0b; font-weight: 600;">coffee</span> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;- Sirve una taza de café recién destilada en arte ASCII.
</div>
`;
  }

  /* ==================== COMMAND PARSER HOOK ==================== */
  function handle(cleanCmd, respElement, outputContainer) {
    if (!cleanCmd) return false;

    // "doom"
    if (cleanCmd === 'doom') {
      respElement.innerHTML = `
        <div style="line-height: 1.45;">
          <span style="color: #ef4444; font-weight: 700;">[DOOM v1.9 Shareware — id Software 1993]</span><br>
          Cargando motor id Tech 1... Modo Dios activado (<span style="color: #fbbf24; font-weight: 700;">IDDQD</span>).<br>
          <span style="color: #22d3c5;">Abriendo ventana de juego... ¡Que comience la acción! 🚀</span>
        </div>
      `;
      launchDoom();
      return true;
    }

    // "matrix"
    if (cleanCmd === 'matrix') {
      respElement.innerHTML = `
        <div style="color: #22c55e; font-family: ui-monospace, monospace; line-height: 1.4;">
          Wake up, Neo...<br>
          The Matrix has you.<br>
          Follow the white rabbit. 🐇<br>
          <span style="color: #86efac; font-size: 0.8rem;">[Iniciando flujo de código verde... Pulsa ESC para salir]</span>
        </div>
      `;
      launchMatrix();
      return true;
    }

    // "sudo hire-me" (and natural variants)
    if (
      cleanCmd === 'sudo hire-me' ||
      cleanCmd === 'sudo hire me' ||
      cleanCmd === 'hire-me' ||
      cleanCmd === 'hire me'
    ) {
      respElement.innerHTML = `
        <div style="font-family: ui-monospace, monospace; line-height: 1.45;">
          <span style="color: #64748b;">[sudo] password for guest:</span> ************************<br>
          <span style="color: #22c55e; font-weight: 700;">✓ AUTORIZACIÓN CONCEDIDA — ACCESO ROOT DESBLOQUEADO</span><br><br>
          <div style="background: rgba(34, 197, 94, 0.1); border: 1px solid rgba(34, 197, 94, 0.35); border-radius: 8px; padding: 12px 16px; margin: 4px 0;">
            <span style="color: #4ade80; font-size: 1rem; font-weight: 700;">🎉 ¡OFERTA ACEPTADA! CANDIDATO CONTRATADO CON ÉXITO</span><br>
            <span style="color: #f1f5f9; display: block; margin-top: 4px;">
              • <b>Candidato:</b> Iván Pieretto (Desarrollador de Software · Full-Stack & Python)<br>
              • <b>Stack Principal:</b> Python, FastAPI, Docker, PostgreSQL, React, TypeScript<br>
              • <b>Disponibilidad:</b> Inmediata · Remoto / Híbrido / Presencial (Rosario, Santa Fe)<br>
              • <b>Siguiente paso:</b> 
              <a href="https://wa.me/5493413554160" target="_blank" style="color: #38bdf8; text-decoration: underline; font-weight: 600;">Escribir a WhatsApp</a> o 
              <a href="Ivan_Pieretto_CV.pdf" target="_blank" download style="color: #38bdf8; text-decoration: underline; font-weight: 600;">Descargar CV (PDF)</a>.
            </span>
          </div>
        </div>
      `;
      launchHireMe();
      return true;
    }

    // "coffee" / "cafe"
    if (cleanCmd === 'coffee' || cleanCmd === 'cafe' || cleanCmd === 'café') {
      respElement.innerHTML = getCoffeeOutput();
      AudioFx.playBeep(520, 0.08, 'sine');
      return true;
    }

    // "secrets" / "eastereggs" / "easter-eggs"
    if (cleanCmd === 'secrets' || cleanCmd === 'eastereggs' || cleanCmd === 'easter-eggs' || cleanCmd === 'secret') {
      respElement.innerHTML = getSecretsHelp();
      return true;
    }

    return false;
  }

  // Export module to global scope
  window.TerminalEasterEggs = {
    handle,
    launchDoom,
    onDoomClosed,
    launchMatrix,
    stopMatrix,
    launchHireMe,
    getCoffeeOutput,
    getSecretsHelp
  };
})();
