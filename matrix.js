// matrix.js — v2
// Fixes:
//  1. Matrix loop now pauses when tab is hidden (Page Visibility API) — saves battery/CPU
//  2. fitCanvas() cancels the previous rAF before scheduling a new one — no duplicate loops on resize
//  3. Reveal observer sets initial styles BEFORE the element enters the viewport — no instant-snap bug
//  4. Typing effect respects prefers-reduced-motion (skips animation, shows text immediately)
//  5. Mobile hamburger nav toggle
//  6. Active nav-link highlight on scroll (IntersectionObserver)

/* ===== Matrix Rain ===== */
(function () {
  const canvas = document.getElementById('matrix');
  if (!canvas) return;
  const ctx = canvas.getContext('2d', { alpha: true });

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduceMotion) {
    // Just paint a very faint static bg — no animation
    canvas.style.opacity = '0.3';
    return;
  }

  let dpr = Math.max(1, window.devicePixelRatio || 1);
  let w = 0, h = 0;
  const chars = "010101{}[]()<>/*-+|=~`!@#$%^&ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const charArr = chars.split('');
  const fontSizeBase = 14;
  let fontSize = fontSizeBase;
  let columns = 0;
  let drops = [];
  const colors = [
    'rgba(0,255,65,0.95)',
    'rgba(158,255,184,0.75)',
    'rgba(0,200,120,0.8)',
  ];
  const alphaTrail = 0.055;

  // FIX: track the active rAF id so fitCanvas can cancel before restarting
  let rafId = null;
  let running = true;

  function fitCanvas() {
    if (rafId) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }

    dpr = Math.max(1, window.devicePixelRatio || 1);
    w = window.innerWidth;
    h = window.innerHeight;
    canvas.width  = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    canvas.style.width  = w + 'px';
    canvas.style.height = h + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    fontSize = Math.max(12, Math.floor(fontSizeBase * Math.min(dpr, 2)));
    ctx.font = fontSize + 'px monospace';
    ctx.textBaseline = 'top';

    columns = Math.floor(w / fontSize) + 2;
    // Re-seed drops; preserve existing positions where possible
    drops = Array.from({ length: columns }, (_, i) =>
      drops[i] !== undefined ? drops[i] : Math.floor(Math.random() * (h / fontSize))
    );

    if (running) rafId = requestAnimationFrame(draw);
  }

  function draw() {
    if (!running) { rafId = null; return; }

    ctx.fillStyle = `rgba(0,0,0,${alphaTrail})`;
    ctx.fillRect(0, 0, w, h);

    for (let i = 0; i < columns; i++) {
      const ch = charArr[Math.floor(Math.random() * charArr.length)];
      ctx.fillStyle = colors[Math.floor(Math.random() * colors.length)];
      ctx.fillText(ch, i * fontSize, drops[i] * fontSize);
      if (drops[i] * fontSize > h && Math.random() > 0.975) drops[i] = 0;
      drops[i]++;
    }

    rafId = requestAnimationFrame(draw);
  }

  fitCanvas();

  // Debounce resize so fitCanvas isn't called on every pixel
  let resizeTimer = null;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(fitCanvas, 150);
  });

  // FIX: pause when tab hidden, resume when visible — huge battery saving
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      running = false;
      if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
    } else {
      running = true;
      rafId = requestAnimationFrame(draw);
    }
  });

  // Respect dynamic preference changes
  window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', (e) => {
    if (e.matches) {
      running = false;
      if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
      ctx.clearRect(0, 0, w, h);
    } else {
      running = true;
      rafId = requestAnimationFrame(draw);
    }
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
    "ls projects/",
    "nmap -sV target.local",
  ];

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // FIX: if motion is reduced, just cycle through commands statically
  if (reduceMotion) {
    el.textContent = commands[0];
    return;
  }

  let cmdIndex = 0;
  let charIndex = 0;
  const speedBase = parseInt(
    getComputedStyle(document.documentElement).getPropertyValue('--typing-speed').trim()
  ) || 48;
  const pauseAfter = 1100;
  const pauseBefore = 220;

  function type() {
    const cmd = commands[cmdIndex];
    if (charIndex <= cmd.length) {
      el.textContent = cmd.slice(0, charIndex);
      charIndex++;
      setTimeout(type, speedBase + Math.random() * 35);
    } else {
      // Hold, then erase and move on
      setTimeout(() => {
        erase();
      }, pauseAfter);
    }
  }

  function erase() {
    const cmd = commands[cmdIndex];
    if (charIndex > 0) {
      charIndex--;
      el.textContent = cmd.slice(0, charIndex);
      setTimeout(erase, 22 + Math.random() * 15);
    } else {
      cmdIndex = (cmdIndex + 1) % commands.length;
      setTimeout(type, pauseBefore);
    }
  }

  // Start only when tab is active
  function start() {
    if (document.visibilityState === 'visible') {
      type();
    } else {
      document.addEventListener('visibilitychange', function onVis() {
        if (document.visibilityState === 'visible') {
          type();
          document.removeEventListener('visibilitychange', onVis);
        }
      });
    }
  }

  start();
})();


/* ===== Reveal on scroll (IntersectionObserver) ===== */
(function () {
  const items = document.querySelectorAll('[data-reveal]');
  if (!items.length) return;

  // FIX: set initial hidden state BEFORE observing, so the transition
  // starts from the correct off-screen position — no instant-snap on entry.
  items.forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(18px)';
  });

  if (!('IntersectionObserver' in window)) {
    // Fallback: show everything immediately
    items.forEach(el => {
      el.style.opacity = '1';
      el.style.transform = '';
      el.classList.add('revealed');
    });
    return;
  }

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const obs = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      const delay = reduceMotion ? 0 : Math.floor(Math.random() * 180);

      el.style.transition = reduceMotion
        ? 'none'
        : 'opacity 400ms ease, transform 400ms cubic-bezier(.2,.9,.2,1)';

      setTimeout(() => {
        el.style.opacity = '1';
        el.style.transform = 'translateY(0)';
        el.classList.add('revealed');
      }, delay);

      observer.unobserve(el);
    });
  }, { threshold: 0.1 });

  items.forEach(el => obs.observe(el));
})();


/* ===== Mobile nav toggle ===== */
(function () {
  const toggle = document.getElementById('navToggle');
  const links  = document.getElementById('navLinks');
  if (!toggle || !links) return;

  toggle.addEventListener('click', () => {
    const isOpen = links.classList.toggle('open');
    toggle.setAttribute('aria-expanded', String(isOpen));
  });

  // Close nav when a link is tapped
  links.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => {
      links.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
    });
  });

  // Close on outside click
  document.addEventListener('click', (e) => {
    if (!toggle.contains(e.target) && !links.contains(e.target)) {
      links.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
    }
  });
})();


/* ===== Active nav highlight on scroll ===== */
(function () {
  const sections = document.querySelectorAll('main section[id]');
  const navLinks = document.querySelectorAll('.nav-links a[href^="#"]');
  if (!sections.length || !navLinks.length) return;
  if (!('IntersectionObserver' in window)) return;

  const obs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const id = entry.target.id;
      navLinks.forEach(a => {
        const active = a.getAttribute('href') === '#' + id;
        a.style.color = active ? '#fff' : '';
        a.style.background = active ? 'rgba(0,255,65,0.08)' : '';
      });
    });
  }, { rootMargin: '-40% 0px -55% 0px' });

  sections.forEach(s => obs.observe(s));
})();


/* ===== Keyboard shortcut: press G then H to focus main content ===== */
(function () {
  let seq = '';
  let timer = null;
  const timeout = 800;

  window.addEventListener('keydown', (e) => {
    if (!e.key || e.key.length !== 1) return;
    seq += e.key.toLowerCase();
    clearTimeout(timer);
    timer = setTimeout(() => { seq = ''; }, timeout);
    if (seq.endsWith('gh')) {
      const main = document.getElementById('content');
      if (main) main.focus();
      seq = '';
    }
  });
})();
