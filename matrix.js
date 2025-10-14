// matrix.js
// Modern Matrix rain + typing + reveal animations
// - Uses requestAnimationFrame and DPR scaling
// - Respects prefers-reduced-motion
// - Typing effect updates aria-live region
// - Simple IntersectionObserver reveal for .card

/* ===== Matrix Rain ===== */
(function () {
  const canvas = document.getElementById('matrix');
  if (!canvas) return;
  const ctx = canvas.getContext('2d', { alpha: true });

  let dpr = Math.max(1, window.devicePixelRatio || 1);
  let w = 0, h = 0;
  const chars = "010101{}[]()<>/*-+|=~`!@#$%^&*ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const charArr = chars.split('');
  const fontSizeBase = 14;
  let fontSize = Math.floor(fontSizeBase * (dpr / 1));
  let columns = 0;
  let drops = [];
  const colors = ['rgba(0,255,65,0.95)', 'rgba(158,255,184,0.85)', 'rgba(0,200,120,0.85)'];
  const alphaTrail = 0.06;

  function fitCanvas() {
    dpr = Math.max(1, window.devicePixelRatio || 1);
    w = window.innerWidth;
    h = window.innerHeight;
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    fontSize = Math.max(12, Math.floor(fontSizeBase * (dpr / 1)));
    ctx.font = fontSize + 'px monospace';
    ctx.textBaseline = 'top';
    columns = Math.floor(w / fontSize) + 2;
    drops = new Array(columns).fill(0).map(() => Math.floor(Math.random() * (h / fontSize)));
  }

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let running = !reduceMotion;

  function draw() {
    if (!running) {
      // draw faint static overlay if motion is reduced
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, w, h);
      return;
    }

    ctx.fillStyle = `rgba(0,0,0,${alphaTrail})`;
    ctx.fillRect(0, 0, w, h);

    for (let i = 0; i < columns; i++) {
      const ch = charArr[Math.floor(Math.random() * charArr.length)];
      ctx.fillStyle = colors[Math.floor(Math.random() * colors.length)];
      const x = i * fontSize;
      const y = drops[i] * fontSize;
      ctx.fillText(ch, x, y);
      if (y > h && Math.random() > 0.975) drops[i] = 0;
      drops[i]++;
    }
    requestAnimationFrame(draw);
  }

  fitCanvas();
  window.addEventListener('resize', () => requestAnimationFrame(fitCanvas));
  if (running) requestAnimationFrame(draw);
  window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', (e) => {
    running = !e.matches;
    if (running) requestAnimationFrame(draw);
  });
})();

/* ===== Typing / Terminal effect ===== */
(function () {
  const el = document.getElementById('typed');
  if (!el) return;
  const commands = [
    "whoami",
    "cat location.txt",
    "echo \"Red Team | Junior Security Analyst\"",
    "ls projects"
  ];
  let cmdIndex = 0;
  let charIndex = 0;
  const speed = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--typing-speed')) || 48;
  const pauseAfter = 900;

  function type() {
    const cmd = commands[cmdIndex];
    if (charIndex <= cmd.length) {
      el.textContent = cmd.slice(0, charIndex);
      charIndex++;
      setTimeout(type, speed + Math.random() * 30);
    } else {
      setTimeout(() => {
        // clear and move to next
        charIndex = 0;
        cmdIndex = (cmdIndex + 1) % commands.length;
        setTimeout(type, 200);
      }, pauseAfter);
    }
  }

  if (document.visibilityState === 'visible') {
    type();
  } else {
    document.addEventListener('visibilitychange', function onVis() {
      if (document.visibilityState === 'visible') { type(); document.removeEventListener('visibilitychange', onVis); }
    });
  }
})();

/* ===== Reveal on scroll (IntersectionObserver) ===== */
(function () {
  const items = document.querySelectorAll('[data-reveal]');
  if (!items.length) return;
  if (!('IntersectionObserver' in window)) {
    items.forEach(i => (i.style.opacity = 1));
    return;
  }
  const obs = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el = entry.target;
        el.style.opacity = 0;
        el.style.transform = 'translateY(12px)';
        el.style.transition = `opacity 360ms ease, transform 360ms cubic-bezier(.2,.9,.2,1)`;
        setTimeout(() => {
          el.style.opacity = 1;
          el.style.transform = 'translateY(0)';
        }, Math.floor(Math.random() * 220));
        observer.unobserve(el);
      }
    });
  }, { threshold: 0.12 });

  items.forEach(i => obs.observe(i));
})();

/* ===== Keyboard helper (accessibility) =====
   Press 'g' then 'h' quickly to focus main content.
*/
(function () {
  let seq = '';
  let timer = null;
  const timeout = 800;
  window.addEventListener('keydown', (e) => {
    if (e.key && e.key.length === 1) {
      seq += e.key.toLowerCase();
      clearTimeout(timer);
      timer = setTimeout(() => seq = '', timeout);
      if (seq.endsWith('gh')) {
        const main = document.getElementById('content');
        if (main) main.focus();
        seq = '';
      }
    }
  });
})();
