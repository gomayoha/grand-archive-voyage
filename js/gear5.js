// Gear 5 mode — "Nika's playground". Luffy's awakened power turns whatever he touches into rubber and
// lets him fight as freely as he imagines, so the archive stops being a museum and becomes a cartoon.
//  - Awakening: a white burst, "GEAR 5" bouncing in, the Drums of Liberation start.
//  - Toon world: headlines redrawn as cartoon titles, labels become speech bubbles, cards turn into
//    ink-framed stickers slapped on slightly crooked.
//  - Rubber letters: every headline letter bobs, hops on the drums, dodges the mouse, bursts when tapped.
//  - Rubber body: headlines squash & stretch with scroll speed (CSS var --sq).
//  - Drums of Liberation: bass energy from the track drives --beat; big hits pop the logo.
//  - Toon force: a tap anywhere pops a cartoon cloud with a sound word.
//  - Gomu Gomu: drag a photo with the mouse and it stretches like rubber, then snaps back.
//  - Chibi Nika lives in the corner: eyes follow you, pop out on springs when you scroll too fast,
//    comments on each section, and does a trick on every tap (Pistol, Balloon, Gravity, Upside-down,
//    Gigant, the Laugh). Double-click anything on a Mac and he punches it. He steps away for Book II.
// Music starts only from the toggle (a user gesture), so it works on iPhone too.
const WORDS = ['BOING!', 'DON!', 'GOMU!', 'HAHAHA!', 'POP!', 'NIKA!', 'BWOING!', 'DON DON!'];
const STRETCHY = '.wanted,.pc figure,.door,.stop-img,.polaroid,.rcard,.role-pic,.art-col button,.reel,.ro-img,.sp-card,.tt-poster,.vol';
const OPEN = 'main section:not(#life)';
const TILT = '.stop-card,.vol,.pc';
const DROP = 'h1,h2,h3,p,.eyebrow,.pill,figure,.wanted,.door,.stop-card,.vol,.chips button,.link';
const QUIPS = {
  home: 'Anime is for WHAT?! Shishishi!',
  characters: 'Everyone here is my nakama now. Shishishi!',
  crew: 'My bounty is WAY bigger than these!',
  voyage: 'Ten seas! Let\'s go! Shishishi!',
  spreads: 'Woah… Oda drew ALL of these?!',
  panels: 'Hey! I remember this panel!',
  journey: 'That little ship is the Merry! …Right?',
  top: 'Number one?! Of course it is!',
  records: 'So many shelves… and none of them have meat.',
  logbook: 'Look how far you\'ve sailed!',
  worlds: 'Other worlds?! Let\'s go on an adventure!',
  vault: 'Can I eat these cards? …No? Okay.',
  scenes: 'Hey, that\'s ME! Shishishi!',
  library: 'Robin would never leave this place.',
  outro: 'Again! Again! Scroll back up!'
};
const TRICKS = [
  ['pistol', 'Gomu Gomu no… PISTOL!'],
  ['balloon', 'Gomu Gomu no… BALLOON!'],
  ['gravity', 'Oops. I dropped everything.'],
  ['flip', 'Toon logic! The world is upside down!'],
  ['gigant', ''],
  ['laugh', 'HAHAHAHA!']
];
// Chibi Nika floating on his back: cloud hair, eyes shut, easy smile. Eyes spring open when the page is flung.
const NIKA_SVG = `<svg viewBox="0 0 100 100" aria-hidden="true">
<g class="n-wisp" fill="none" stroke="#9a83e0" stroke-width="2" stroke-linecap="round"><path d="M86 58c5 1 7 6 3 8-3 1-4-2-2-3"/><path d="M12 30c-4-2-4-7 0-8 3 0 3 3 1 3"/></g>
<g stroke="#3b2a63" stroke-width="1.3" stroke-linejoin="round" stroke-linecap="round">
 <path d="M41 74c-5 1-10 5-11 9l5 2c2-3 6-5 9-5z" fill="#fde3cf"/>
 <path d="M33 73l-12-12c-2-2 1-5 3-3l13 10z" fill="#fde3cf"/><path d="M15 55l8 5c1 1 0 3-1 3l-8-4c-2-1-1-5 1-4z" fill="#c48a5f"/>
 <path d="M37 79l-17-2c-3 0-3-4 0-4l18 0z" fill="#fde3cf"/><path d="M15 71l9 0c1 0 1 3 0 4l-9 0c-2 0-2-4 0-4z" fill="#c48a5f"/>
 <path d="M28 66c3-3 7-3 9-1l1 6c-3 2-7 2-10-1zM29 74c3-2 7-2 9 0l0 6c-3 2-7 1-9-1z" fill="#fbf8ff"/>
 <path d="M34 70c6-6 18-7 27-2l1 11c-9 6-21 6-28 0z" fill="#fbf8ff"/>
 <path d="M36 70c-3 2-4 5-3 8M34 74c-2 1-2 3-1 5" fill="none" stroke="#bfb2dc"/>
 <path d="M44 70l5 5 5-5" fill="none" stroke="#c4473f" stroke-width="1.2"/>
 <path d="M34 78c8 3 18 3 27-1l1 4c-9 4-19 5-28 1z" fill="#6c4fb8"/><path d="M52 81l3 11 4-1-3-11z" fill="#5b3fa6"/>
</g>
<g fill="#fff" stroke="#8b6fd6" stroke-width="2.6" stroke-linejoin="round"><path d="M43.7 59.3L37.5 56.5C28.1 65.9 27.0 53.0 20.0 47.0Q20.0 43.4 23.5 43.8C25.9 43.2 26.0 46.0 32.0 46.2C18.6 49.3 25.7 38.2 22.5 29.5Q24.3 26.4 27.1 28.4C29.5 29.1 29.3 33.9 34.6 36.7C20.0 33.0 30.2 23.4 31.1 14.2Q34.0 12.2 35.7 15.3C37.6 16.9 37.5 24.3 41.1 29.2C29.0 18.8 41.8 12.6 46.5 4.7Q50.1 4.0 50.3 7.5C51.3 9.8 48.4 20.6 49.6 26.5C42.8 11.7 57.8 9.7 65.4 4.5Q68.9 5.4 67.6 8.7C67.5 11.2 60.5 20.8 59.1 26.6C59.2 11.3 71.8 17.4 80.9 16.1Q83.6 18.4 81.0 20.8C79.9 23.0 72.0 25.6 68.1 30.1C74.2 17.4 79.3 29.8 88.1 32.5Q89.5 35.9 86.1 36.9C84.1 38.4 79.6 35.6 74.1 38.1C83.5 37.7 27.6 51.2 21.1 44.7Q21.3 41.1 24.8 41.7C27.3 41.3 81.9 49.0 75.9 48.5C86.9 45.7 75.1 52.7 78.0 61.4Q76.1 64.5 73.4 62.4C71.0 61.6 76.5 60.0 71.3 57.0L64.3 59.3Z"/><path d="M36 50a18 18 0 1 1 36 0a18 18 0 1 1 -36 0z"/></g>
<defs><linearGradient id="nk-h" x1="0" y1="0" x2=".3" y2="1"><stop offset=".35" stop-color="#fff"/><stop offset="1" stop-color="#e6dcff"/></linearGradient></defs><g fill="url(#nk-h)"><path d="M43.7 59.3L37.5 56.5C28.1 65.9 27.0 53.0 20.0 47.0Q20.0 43.4 23.5 43.8C25.9 43.2 26.0 46.0 32.0 46.2C18.6 49.3 25.7 38.2 22.5 29.5Q24.3 26.4 27.1 28.4C29.5 29.1 29.3 33.9 34.6 36.7C20.0 33.0 30.2 23.4 31.1 14.2Q34.0 12.2 35.7 15.3C37.6 16.9 37.5 24.3 41.1 29.2C29.0 18.8 41.8 12.6 46.5 4.7Q50.1 4.0 50.3 7.5C51.3 9.8 48.4 20.6 49.6 26.5C42.8 11.7 57.8 9.7 65.4 4.5Q68.9 5.4 67.6 8.7C67.5 11.2 60.5 20.8 59.1 26.6C59.2 11.3 71.8 17.4 80.9 16.1Q83.6 18.4 81.0 20.8C79.9 23.0 72.0 25.6 68.1 30.1C74.2 17.4 79.3 29.8 88.1 32.5Q89.5 35.9 86.1 36.9C84.1 38.4 79.6 35.6 74.1 38.1C83.5 37.7 27.6 51.2 21.1 44.7Q21.3 41.1 24.8 41.7C27.3 41.3 81.9 49.0 75.9 48.5C86.9 45.7 75.1 52.7 78.0 61.4Q76.1 64.5 73.4 62.4C71.0 61.6 76.5 60.0 71.3 57.0L64.3 59.3Z"/><path d="M36 50a18 18 0 1 1 36 0a18 18 0 1 1 -36 0z"/></g>
<g fill="none" stroke="#c8b8f4" stroke-width="1.5" stroke-linecap="round">
 <path d="M44 22c-3-1-5 2-3 4 2 1 3-1 2-2"/><path d="M66 24c3 0 4 3 2 4-2 1-3-1-1-2"/><path d="M33 34c-3 1-3 5 0 5 2 0 2-2 1-3"/><path d="M76 40c2 2 0 5-2 4"/>
</g>
<path d="M38 47c0-10 7-16 16-16s16 6 16 16c0 11-7 18-16 18s-16-7-16-18z" fill="#fff6ef"/><path d="M38.2 49c.8 9 7.5 16 15.8 16s15-7 15.8-16" fill="none" stroke="#3b2a63" stroke-width="1.2"/>
<path d="M36 48c0-10 8-18 18-18s18 8 18 18c-2-3-5-5-8-3-2-4-6-4-8-2-2-3-7-3-9 0-3-2-6-1-8 1-1-1-2 0-3 4z" fill="#fff"/>
<g fill="none" stroke="#b9a6ee" stroke-width="1" stroke-linecap="round"><path d="M38 47c1-3 3-4 5-3"/><path d="M47 43c2-2 5-2 6 0"/><path d="M57 43c2-2 5-2 6 1"/><path d="M66 44c2-1 4 0 5 3"/></g>
<g fill="none" stroke="#8b6fd6" stroke-width="1.2" stroke-linecap="round"><path d="M42 44c2-2 5-1 5 1 0 1-2 1-2 0"/><path d="M66 44c-2-2-5-1-5 1 0 1 2 1 2 0"/></g>
<ellipse cx="43" cy="55" rx="3" ry="1.7" fill="#f7a8b0" opacity=".65"/><ellipse cx="65" cy="55" rx="3" ry="1.7" fill="#f7a8b0" opacity=".65"/>
<g class="n-shut" fill="none" stroke="#2a1b4a" stroke-width="1.6" stroke-linecap="round"><path d="M43 50q3.5 3 7 0"/><path d="M58 50q3.5 3 7 0"/><path d="M42.6 49.6l-1.4-.9M65.4 49.6l1.4-.9"/></g>
<path d="M60 54.6l5 2M61.6 53.6l-.8 3.8M63.6 54.4l-.8 3.6" stroke="#2a1b4a" stroke-width=".9" stroke-linecap="round"/>
<g fill="none" stroke="#2a1b4a" stroke-width="2" stroke-linejoin="round"><path class="n-spring" d="M46 50 l-3 -3 6 -3 -6 -3 6 -3 -6 -3 3 -3"/><path class="n-spring" d="M62 50 l-3 -3 6 -3 -6 -3 6 -3 -6 -3 3 -3"/></g>
<g class="n-eye"><g class="n-ball"><circle cx="46" cy="50" r="5.6" fill="#fff" stroke="#d7323a" stroke-width="1.6"/><circle class="n-pupil" cx="46" cy="50" r="2.6" fill="#140c24"/></g></g>
<g class="n-eye"><g class="n-ball"><circle cx="62" cy="50" r="5.6" fill="#fff" stroke="#d7323a" stroke-width="1.6"/><circle class="n-pupil" cx="62" cy="50" r="2.6" fill="#140c24"/></g></g>
<g class="n-mouth"><path class="n-smile" d="M47.5 58.6q6.5 5 13 0" fill="none" stroke="#2a1b4a" stroke-width="1.4" stroke-linecap="round"/><path class="n-open" d="M45 58q9 13 18 0q-9 2.5-18 0z" fill="#4a1426" stroke="#2a1b4a" stroke-width="1.4" stroke-linejoin="round"/></g>
</svg>`;

export function initGear5({ button, isReduced }) {
  const root = document.documentElement, body = document.body, main = document.querySelector('main');
  const mk = (cls, html = '') => { const el = document.createElement('div'); el.className = cls; el.setAttribute('aria-hidden', 'true'); el.innerHTML = html; return el; };
  const fx = mk('g5-fx');
  const splash = mk('g5-splash', '<span class="g5-sunburst"></span><b class="g5-word">GEAR</b><b class="g5-five">5</b><small>The Drums of Liberation</small>');
  const sky = mk('g5-sky');
  const nikaWrap = document.createElement('div'); nikaWrap.className = 'g5-nika-wrap';
  nikaWrap.innerHTML = `<p class="g5-bubble" role="status" aria-live="polite"></p><button type="button" class="g5-nika" aria-label="Gear 5 Luffy: tap for a trick">${NIKA_SVG}</button>`;
  body.append(sky, nikaWrap, fx, splash);
  const nika = nikaWrap.querySelector('.g5-nika'), bubble = nikaWrap.querySelector('.g5-bubble');
  const pupils = [...nika.querySelectorAll('.n-pupil')];

  let on = false, audio = null, ctx = null, gain = null, analyser = null, bins = null, raf = 0, noise = null;
  let lastY = scrollY, vel = 0, sq = 0, energyAvg = 0, beat = 0, lastHit = 0, ducked = false;
  let busy = false, trick = 0, lastEyePop = 0, lastAct = performance.now(), boredShown = false, mouse = null, lifeNear = false;
  const timers = new Set();
  const later = (fn, ms) => { const id = setTimeout(() => { timers.delete(id); fn(); }, ms); timers.add(id); return id; };
  const wait = ms => new Promise(r => later(r, ms));
  const anims = new Set();
  const A = (el, frames, opts) => { if (opts.keyEase) { frames = frames.map(f => ({ easing: opts.keyEase, ...f })); opts = { ...opts, easing: 'linear' }; delete opts.keyEase; }
    const a = el.animate(frames, opts); anims.add(a); a.finished.then(() => anims.delete(a), () => anims.delete(a)); return a; };
  const rnd = (a, b) => a + Math.random() * (b - a);
  const inView = r => r.bottom > 0 && r.top < innerHeight && r.right > 0 && r.left < innerWidth && r.width > 0;

  /* ---------------- audio: the drums + a tiny cartoon sound kit ---------------- */
  function ensureAudio() {
    if (audio) return;
    audio = new Audio('assets/audio/drums-of-liberation.mp3'); audio.loop = true; audio.preload = 'auto'; audio.crossOrigin = 'anonymous';
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
    const src = ctx.createMediaElementSource(audio);
    gain = ctx.createGain(); gain.gain.value = 0;
    analyser = ctx.createAnalyser(); analyser.fftSize = 1024; analyser.smoothingTimeConstant = 0.6;
    bins = new Uint8Array(analyser.frequencyBinCount);
    src.connect(analyser); analyser.connect(gain); gain.connect(ctx.destination);
    noise = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const d = noise.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  const ramp = (to, secs) => { if (!gain) { if (audio) audio.volume = to; return; } const t = ctx.currentTime; gain.gain.cancelScheduledValues(t); gain.gain.setValueAtTime(gain.gain.value, t); gain.gain.linearRampToValueAtTime(to, t + secs); };
  const VOL = 0.75;
  function tone(type, f0, f1, dur, vol, when = 0, f2) {
    const t = ctx.currentTime + when, o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(f0, t);
    if (f2) { o.frequency.exponentialRampToValueAtTime(f1, t + dur * 0.35); o.frequency.exponentialRampToValueAtTime(f2, t + dur); }
    else o.frequency.exponentialRampToValueAtTime(f1, t + dur);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.012); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(ctx.destination); o.start(t); o.stop(t + dur + 0.05);
  }
  function hiss(f0, f1, dur, vol, when = 0) {
    const t = ctx.currentTime + when, s = ctx.createBufferSource(), bp = ctx.createBiquadFilter(), g = ctx.createGain();
    s.buffer = noise; s.loop = true; bp.type = 'bandpass'; bp.Q.value = 1.2;
    bp.frequency.setValueAtTime(f0, t); bp.frequency.exponentialRampToValueAtTime(f1, t + dur);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.03); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(bp); bp.connect(g); g.connect(ctx.destination); s.start(t); s.stop(t + dur + 0.05);
  }
  function sfx(kind) {
    if (!ctx || ctx.state !== 'running' || ducked) return;
    if (kind === 'pop') tone('triangle', 1100, 240, 0.09, 0.09);
    else if (kind === 'boing') tone('sine', 150, 640, 0.42, 0.16, 0, 230);
    else if (kind === 'whoosh') hiss(500, 3200, 0.22, 0.22);
    else if (kind === 'thud') { tone('sine', 150, 42, 0.3, 0.4); hiss(900, 200, 0.12, 0.12); }
    else if (kind === 'inflate') tone('sawtooth', 110, 420, 0.8, 0.05);
    else if (kind === 'deflate') { hiss(2400, 700, 1.2, 0.14); tone('square', 520, 120, 1.2, 0.025); }
    else if (kind === 'giant') { tone('sawtooth', 55, 220, 0.9, 0.08); tone('sine', 70, 35, 1.2, 0.3, 0.85); }
    else if (kind === 'ha') tone('square', rnd(380, 520), rnd(300, 360), 0.1, 0.03);
  }

  /* ---------------- per-frame: rubber scroll, drums, Nika's eyes ---------------- */
  let nikaRect = null, nikaRectAt = 0;
  function loop(t) {
    raf = requestAnimationFrame(loop);
    const reduced = isReduced();
    const y = scrollY; vel = vel * 0.8 + (y - lastY) * 0.2; lastY = y;
    const target = reduced ? 0 : Math.max(-0.2, Math.min(0.2, vel * 0.006));
    sq += (target - sq) * 0.25;
    let e = 0;
    if (analyser && !ducked) { analyser.getByteFrequencyData(bins); for (let i = 1; i < 9; i++) e += bins[i]; e /= 8 * 255; }
    energyAvg = energyAvg * 0.96 + e * 0.04;
    beat = Math.max(beat * 0.86, Math.max(0, (e - energyAvg * 0.9) * 4));
    if (e > energyAvg * 1.3 && e > 0.35 && t - lastHit > 280) {
      lastHit = t; body.classList.remove('g5-hit'); void body.offsetWidth; body.classList.add('g5-hit');
    }
    root.style.setProperty('--sq', sq.toFixed(4));
    root.style.setProperty('--beat', (reduced ? 0 : Math.min(1, beat)).toFixed(3));
    if (Math.abs(y - lastScrollSeen) > 2) { lastScrollSeen = y; activity(); }
    // eyes pop out on springs when you fling the page
    if (!reduced && !busy && Math.abs(vel) > 48 && t - lastEyePop > 5000 && !lifeNear) { lastEyePop = t; popEyes(); }
    // pupils: follow the mouse, or look where the page is going on touch
    if (t - nikaRectAt > 400) { nikaRect = nika.getBoundingClientRect(); nikaRectAt = t; }
    let lx = 0, ly = 0;
    if (mouse && nikaRect) { const dx = mouse.x - (nikaRect.left + nikaRect.width / 2), dy = mouse.y - (nikaRect.top + nikaRect.height * 0.5), d = Math.hypot(dx, dy) || 1; const k = Math.min(1, d / 160) * 3.2; lx = dx / d * k; ly = dy / d * k; }
    else ly = Math.max(-3, Math.min(3, vel * 0.25));
    for (const p of pupils) p.style.translate = `${lx.toFixed(2)}px ${ly.toFixed(2)}px`;
    if (!boredShown && !busy && t - lastAct > 18000 && !lifeNear) { boredShown = true; say('Oi… I\'m bored. Tap me!'); }
  }
  let lastScrollSeen = scrollY;
  const activity = () => { lastAct = performance.now(); boredShown = false; };

  /* ---------------- Nika: speech + eyes ---------------- */
  let sayTimer = 0;
  function say(text, ms = 3200) {
    if (!text) return;
    bubble.textContent = text; bubble.classList.add('show');
    clearTimeout(sayTimer); sayTimer = setTimeout(() => bubble.classList.remove('show'), ms);
  }
  function popEyes() {
    nika.classList.add('pop'); sfx('boing');
    if (Math.random() < 0.6) say(Math.random() < 0.5 ? 'WOAH! Slow down!!' : 'My eyes!!', 1800);
    later(() => nika.classList.remove('pop'), 900);
  }
  const quipSeen = new Set();
  const quipIO = new IntersectionObserver(entries => {
    for (const en of entries) {
      if (!on || !en.isIntersecting || busy || lifeNear || bubble.classList.contains('show')) continue;
      const id = en.target.id; if (quipSeen.has(id) || !QUIPS[id]) continue;
      quipSeen.add(id); say(QUIPS[id]);
    }
  }, { threshold: 0.35 });
  document.querySelectorAll('main > section[id]').forEach(s => quipIO.observe(s));
  // Book II is his own life. Nika steps out of the way there.
  const life = document.getElementById('life');
  if (life) new IntersectionObserver(([en]) => { lifeNear = en.isIntersecting; nikaWrap.classList.toggle('away', lifeNear); if (lifeNear) bubble.classList.remove('show'); }, { threshold: 0.08 }).observe(life);

  /* ---------------- toon world: rubber letters + crooked stickers ---------------- */
  let split = [], tilted = [];
  function splitLetters() {
    document.querySelectorAll(`${OPEN} :is(h1,h2):not(.vc-title)`).forEach(h => {
      const orig = [...h.childNodes].map(n => n.cloneNode(true)), label = h.getAttribute('aria-label');
      let li = 0;
      const walk = node => [...node.childNodes].forEach(ch => {
        if (ch.nodeType === 1) return walk(ch);
        if (ch.nodeType !== 3) return;
        const frag = document.createDocumentFragment();
        ch.textContent.split(/(\s+)/).forEach(tok => {
          if (!tok) return;
          if (/^\s+$/.test(tok)) return frag.append(tok);
          const w = document.createElement('span'); w.className = 'g5w';
          for (const c of tok) { const s = document.createElement('span'); s.className = 'g5l'; s.textContent = c; s.style.setProperty('--li', li++); s.style.setProperty('--k', rnd(0.1, 0.42).toFixed(2)); w.append(s); }
          frag.append(w);
        });
        ch.replaceWith(frag);
      });
      h.setAttribute('aria-label', h.textContent.replace(/\s+/g, ' ').trim());
      walk(h); h.classList.add('g5-split'); split.push([h, orig, label]);
    });
    document.querySelectorAll(`${OPEN} :is(${TILT})`).forEach(el => { el.style.rotate = rnd(-2.6, 2.6).toFixed(2) + 'deg'; tilted.push(el); });
  }
  function unsplit() {
    split.forEach(([h, orig, label]) => { h.replaceChildren(...orig); h.classList.remove('g5-split'); label === null ? h.removeAttribute('aria-label') : h.setAttribute('aria-label', label); });
    tilted.forEach(el => { el.style.rotate = ''; }); split = []; tilted = [];
  }
  // letters dodge the mouse like rubber
  let hoverH = null, cache = [];
  function releaseLetters() { cache.forEach(c => { c.el.style.transitionDuration = ''; c.el.style.transform = ''; }); cache = []; }
  function dodge(e) {
    const h = e.target.closest && e.target.closest('.g5-split');
    if (h !== hoverH) { releaseLetters(); hoverH = h; if (h) cache = [...h.querySelectorAll('.g5l')].map(el => { const r = el.getBoundingClientRect(); return { el, x: r.left + r.width / 2, y: r.top + r.height / 2 + scrollY, pushed: false }; }); }
    if (!hoverH) return;
    const R = 120;
    for (const c of cache) {
      const dx = c.x - e.clientX, dy = c.y - scrollY - e.clientY, d = Math.hypot(dx, dy) || 1;
      if (d < R) { const f = (1 - d / R) ** 2 * 52; c.el.style.transitionDuration = '.12s'; c.el.style.transform = `translate(${(dx / d * f).toFixed(1)}px,${(dy / d * f).toFixed(1)}px) rotate(${(dx / d * f * 0.7).toFixed(1)}deg)`; c.pushed = true; }
      else if (c.pushed) { c.el.style.transitionDuration = ''; c.el.style.transform = ''; c.pushed = false; }
    }
  }
  function burst(h, power = 1) {
    const letters = [...h.querySelectorAll('.g5l')];
    letters.forEach(el => { const a = rnd(0, Math.PI * 2), d = rnd(30, 110) * power; el.style.transitionDuration = '.16s'; el.style.transform = `translate(${(Math.cos(a) * d).toFixed(1)}px,${(Math.sin(a) * d).toFixed(1)}px) rotate(${rnd(-80, 80).toFixed(0)}deg)`; });
    later(() => letters.forEach(el => { el.style.transitionDuration = ''; el.style.transform = ''; }), 170);
  }

  /* ---------------- toon force pops ---------------- */
  function pop(x, y, word, big = false) {
    if (fx.childElementCount > 14 || isReduced()) return;
    const el = document.createElement('span'); el.className = 'g5-pop' + (big ? ' big' : '');
    el.style.left = x + 'px'; el.style.top = y + 'px'; el.style.setProperty('--r', rnd(-12, 12).toFixed(1) + 'deg');
    el.innerHTML = `<i class="c1"></i><i class="c2"></i><i class="c3"></i><i class="c4"></i><b>${word || WORDS[Math.floor(Math.random() * WORDS.length)]}</b>`;
    fx.append(el); el.addEventListener('animationend', e => { if (e.target === el) el.remove(); });
    setTimeout(() => el.remove(), 1400);
  }
  function lines(x, y) {
    const el = document.createElement('span'); el.className = 'g5-lines';
    el.style.left = x + 'px'; el.style.top = y + 'px'; fx.append(el); setTimeout(() => el.remove(), 700);
  }
  const shake = (px = 10, ms = 380) => A(main, [{ translate: '0 0' }, { translate: `${px}px ${-px * 0.6}px` }, { translate: `${-px}px ${px * 0.5}px` }, { translate: `${px * 0.6}px ${px * 0.4}px` }, { translate: `${-px * 0.3}px 0` }, { translate: '0 0' }], { duration: ms });

  const onPointer = e => {
    if (!on || !e.isPrimary || (e.target.closest && e.target.closest('.gate,dialog,input,select,.bar,.g5-nika-wrap'))) return;
    activity();
    if (e.pointerType === 'mouse') mouse = { x: e.clientX, y: e.clientY };
    const h = e.target.closest && e.target.closest('.g5-split');
    if (h && !isReduced()) burst(h);
    pop(e.clientX, e.clientY); sfx('pop');
  };

  // Gomu Gomu stretch (mouse only; on touch, dragging must stay scrolling)
  let drag = null;
  const onDown = e => {
    if (!on || e.pointerType !== 'mouse' || e.button !== 0 || isReduced()) return;
    const el = e.target.closest(STRETCHY); if (!el) return;
    drag = { el, x: e.clientX, y: e.clientY, moved: false }; e.preventDefault();
  };
  const onMove = e => {
    if (e.pointerType === 'mouse') { mouse = { x: e.clientX, y: e.clientY }; activity(); if (!drag && !isReduced()) dodge(e); }
    if (!drag) return;
    const dx = e.clientX - drag.x, dy = e.clientY - drag.y, d = Math.hypot(dx, dy);
    if (d > 6) drag.moved = true;
    const k = Math.min(0.6, d / 600);
    drag.el.style.transition = 'none';
    drag.el.style.translate = `${(dx * 0.55).toFixed(1)}px ${(dy * 0.55).toFixed(1)}px`;
    drag.el.style.rotate = `${(dx * 0.02).toFixed(2)}deg`;
    drag.el.style.scale = Math.abs(dx) > Math.abs(dy) ? `${(1 + k).toFixed(3)} ${(1 - k * 0.45).toFixed(3)}` : `${(1 - k * 0.45).toFixed(3)} ${(1 + k).toFixed(3)}`;
    drag.el.style.zIndex = 50;
  };
  const onUp = e => {
    if (!drag) return;
    const el = drag.el, moved = drag.moved; drag = null;
    const from = { translate: el.style.translate || '0px 0px', scale: el.style.scale || '1', rotate: el.style.rotate || '0deg' };
    el.style.translate = ''; el.style.scale = ''; el.style.transition = '';
    el.style.rotate = tilted.includes(el) ? rnd(-2.6, 2.6).toFixed(2) + 'deg' : '';
    const endRot = el.style.rotate || '0deg';
    A(el, [from, { translate: '0px 0px', scale: '1.12 0.9', rotate: endRot, offset: 0.35 }, { scale: '0.95 1.06', offset: 0.6 }, { scale: '1.02 0.98', offset: 0.8 }, { translate: '0px 0px', scale: '1', rotate: endRot }], { duration: 700, easing: 'cubic-bezier(.2,.9,.2,1)' }).finished.then(() => { el.style.zIndex = ''; }, () => {});
    if (moved) { pop(e.clientX, e.clientY); sfx('boing'); const stop = ev => { ev.stopPropagation(); ev.preventDefault(); }; addEventListener('click', stop, { capture: true, once: true }); setTimeout(() => removeEventListener('click', stop, true), 50); }
  };
  const onLeave = () => { mouse = null; releaseLetters(); hoverH = null; };

  /* ---------------- tricks ---------------- */
  const nikaCenter = () => { const r = nika.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; };
  function pickTarget() {
    const cands = [...document.querySelectorAll(`${OPEN} :is(.g5-split,${STRETCHY})`)].filter(el => { const r = el.getBoundingClientRect(); return inView(r) && r.top > 60; });
    if (!cands.length) return null;
    const heads = cands.filter(el => el.classList.contains('g5-split')), pool = heads.length && Math.random() < 0.7 ? heads : cands;
    return pool[Math.floor(Math.random() * pool.length)];
  }
  async function pistol(target, px, py) {
    const o = nikaCenter();
    let tx = px, ty = py;
    if (target && tx == null) { const r = target.getBoundingClientRect(); tx = r.left + r.width / 2; ty = r.top + Math.min(r.height / 2, innerHeight * 0.5); }
    if (tx == null) { tx = innerWidth * 0.6; ty = innerHeight * 0.4; }
    const dx = tx - o.x, dy = ty - o.y, d = Math.hypot(dx, dy), ang = Math.atan2(dy, dx);
    const arm = document.createElement('span'); arm.className = 'g5-arm'; arm.innerHTML = '<i></i>';
    arm.style.left = o.x + 'px'; arm.style.top = o.y + 'px'; arm.style.rotate = ang + 'rad';
    fx.append(arm); sfx('whoosh'); nika.classList.add('punch');
    const reach = Math.max(0, d - 22);
    await A(arm, [{ width: '0px' }, { width: reach + 'px' }], { duration: 150, easing: 'cubic-bezier(.3,.9,.4,1.05)', fill: 'forwards' }).finished;
    sfx('thud'); lines(tx, ty); pop(tx, ty - 10, 'DON!!', true); shake(9, 320);
    if (target) {
      if (target.classList.contains('g5-split')) burst(target, 1.4);
      const kx = Math.cos(ang) * 70, ky = Math.sin(ang) * 70, rot = target.style.rotate || '0deg';
      A(target, [{ translate: '0 0', scale: '1' }, { translate: `${kx}px ${ky}px`, scale: '.88 1.1', rotate: `calc(${rot} + ${Math.cos(ang) > 0 ? 9 : -9}deg)`, offset: 0.25 }, { translate: `${-kx * 0.12}px ${-ky * 0.12}px`, scale: '1.06 .95', offset: 0.6 }, { translate: '0 0', scale: '1', rotate: rot }], { duration: 850, easing: 'cubic-bezier(.2,.9,.2,1)' });
    }
    await wait(110);
    await A(arm, [{ width: reach + 'px' }, { width: '0px' }], { duration: 260, easing: 'cubic-bezier(.6,0,.4,1)', fill: 'forwards' }).finished;
    arm.remove(); nika.classList.remove('punch');
  }
  // the page becomes a rubber card floating on Nika-white sky
  function card(on_) {
    if (on_) {
      const top = -main.getBoundingClientRect().top, h = main.offsetHeight;
      main.style.transformOrigin = `50% ${top + innerHeight / 2}px`;
      main.style.clipPath = `inset(${top}px 0 ${Math.max(0, h - top - innerHeight)}px 0 round 34px)`;
      root.classList.add('g5-sky-on');
    } else { main.style.transformOrigin = ''; main.style.clipPath = ''; root.classList.remove('g5-sky-on'); }
  }
  async function balloon() {
    card(true); sfx('inflate');
    const a = A(main, [
      { transform: 'none' }, { transform: 'scale(.92)', offset: 0.08 }, { transform: 'scale(1.06,1.1)', offset: 0.18 }, { transform: 'scale(1.03,1.06)', offset: 0.24 }, { transform: 'scale(1.14,1.2)', offset: 0.34 },
      { transform: 'translate(-26vw,-22vh) rotate(-38deg) scale(.5)', offset: 0.46 }, { transform: 'translate(24vw,-6vh) rotate(52deg) scale(.4)', offset: 0.56 },
      { transform: 'translate(-8vw,20vh) rotate(-24deg) scale(.34)', offset: 0.66 }, { transform: 'translate(10vw,4vh) rotate(18deg) scale(.3)', offset: 0.74 },
      { transform: 'scale(1.06)', offset: 0.86 }, { transform: 'scale(.98)', offset: 0.93 }, { transform: 'none' }
    ], { duration: 3600, keyEase: 'ease-in-out' });
    later(() => sfx('deflate'), 1200); later(() => sfx('boing'), 3000);
    await a.finished.catch(() => {}); card(false);
  }
  async function flip() {
    card(true); sfx('boing');
    const a = A(main, [
      { transform: 'none' }, { transform: 'scale(.62)', offset: 0.1 }, { transform: 'rotate(200deg) scale(.62)', offset: 0.28 }, { transform: 'rotate(172deg) scale(.66)', offset: 0.36 },
      { transform: 'rotate(180deg) scale(.9)', offset: 0.44 }, { transform: 'rotate(180deg) scale(.9)', offset: 0.64 }, { transform: 'rotate(180deg) scale(.62)', offset: 0.7 },
      { transform: 'rotate(380deg) scale(.62)', offset: 0.86 }, { transform: 'rotate(356deg) scale(.7)', offset: 0.92 }, { transform: 'rotate(360deg)' }
    ], { duration: 3800, keyEase: 'cubic-bezier(.45,0,.3,1)' });
    later(() => sfx('boing'), 2700);
    await a.finished.catch(() => {}); card(false);
  }
  async function gravity() {
    const vh = innerHeight;
    const all = [...document.querySelectorAll(`${OPEN} :is(${DROP})`)].filter(el => { if (el.closest('.jl-host')) return false; const r = el.getBoundingClientRect(); return inView(r) && r.height < vh * 0.85; });
    const picked = all.filter(el => !all.some(o => o !== el && o.contains(el))).slice(0, 36);
    if (!picked.length) return shake(14, 500);
    const lifted = picked.filter(el => el.matches('h1,h2,h3,p,.eyebrow,.pill,.link,.chips button') && getComputedStyle(el).position === 'static');
    lifted.forEach(el => { el.style.position = 'relative'; el.style.zIndex = '30'; });
    const anims = picked.map((el, i) => {
      const r = el.getBoundingClientRect(), fall = Math.max(0, vh - r.bottom - rnd(4, 40)), rot = rnd(-24, 24), base = el.style.rotate || '0deg', end = `calc(${base} + ${rot.toFixed(1)}deg)`;
      later(() => sfx('thud'), 380 + i * 30);
      return A(el, [
        { translate: '0 0', rotate: base, easing: 'cubic-bezier(.55,0,1,.45)' }, { translate: `0 ${fall}px`, rotate: end, offset: 0.2, easing: 'cubic-bezier(0,.55,.45,1)' },
        { translate: `0 ${fall - Math.min(60, fall * 0.2)}px`, rotate: end, offset: 0.27, easing: 'cubic-bezier(.55,0,1,.45)' }, { translate: `0 ${fall}px`, rotate: end, offset: 0.33 },
        { translate: `0 ${fall}px`, rotate: end, offset: 0.66, easing: 'cubic-bezier(.3,1.5,.5,1)' }, { translate: '0 0', rotate: base }
      ], { duration: 3600, delay: i * 30 });
    });
    later(() => shake(12, 420), 700);
    later(() => { say('…Fixed it! Shishishi!', 1800); sfx('boing'); }, 2400);
    try { await Promise.all(anims.map(a => a.finished)); } finally { lifted.forEach(el => { el.style.position = ''; el.style.zIndex = ''; }); }
  }
  async function gigant() {
    bubble.classList.remove('show');
    const r = nika.getBoundingClientRect(), s = Math.min(innerWidth, innerHeight) * 0.78 / r.width;
    const dx = innerWidth / 2 - (r.left + r.width / 2), dy = innerHeight / 2 - (r.top + r.height / 2);
    nikaWrap.classList.add('giant'); sfx('giant');
    const a = A(nikaWrap, [
      { transform: 'none' }, { transform: `translate(${dx * 0.3}px,${dy * 0.3}px) scale(${s * 0.25})`, offset: 0.12 }, { transform: `translate(${dx}px,${dy}px) scale(${s * 1.08})`, offset: 0.3 },
      { transform: `translate(${dx}px,${dy}px) scale(${s})`, offset: 0.4 }, { transform: `translate(${dx}px,${dy}px) scale(${s})`, offset: 0.72 }, { transform: `translate(${dx * 0.2}px,${dy * 0.2}px) scale(.7)`, offset: 0.9 }, { transform: 'none' }
    ], { duration: 3200, keyEase: 'cubic-bezier(.3,1.25,.5,1)' });
    later(() => { pop(innerWidth / 2, innerHeight * 0.18, 'GIGANT!!', true); shake(16, 600); nika.classList.add('laugh'); }, 1000);
    later(() => nika.classList.remove('laugh'), 2300);
    await a.finished.catch(() => {}); nikaWrap.classList.remove('giant');
  }
  async function laugh() {
    body.classList.add('g5-laughing'); nika.classList.add('laugh');
    for (let i = 0; i < 9; i++) later(() => { pop(rnd(innerWidth * 0.12, innerWidth * 0.88), rnd(innerHeight * 0.15, innerHeight * 0.8), i % 3 ? 'HA!' : 'HAHAHA!'); sfx('ha'); }, i * 170);
    shake(5, 1600);
    await wait(1800); body.classList.remove('g5-laughing'); nika.classList.remove('laugh');
  }
  async function runTrick(forcePistol) {
    if (busy || !on) return;
    if (isReduced()) { say('Turn Motion on and I\'ll show you something. Shishishi!'); return; }
    busy = true; activity();
    const [name, line] = forcePistol ? TRICKS[0] : TRICKS[trick++ % TRICKS.length];
    if (line) say(line, name === 'gravity' ? 1600 : 2600);
    try {
      if (name === 'pistol') await pistol(forcePistol ? forcePistol.el : pickTarget(), forcePistol && forcePistol.x, forcePistol && forcePistol.y);
      else if (name === 'balloon') await balloon();
      else if (name === 'gravity') await gravity();
      else if (name === 'flip') await flip();
      else if (name === 'gigant') await gigant();
      else if (name === 'laugh') await laugh();
    } catch { /* cancelled by switching Gear 5 off */ } finally { busy = false; }
  }
  nika.addEventListener('click', e => { e.stopPropagation(); if (!busy) { A(nika, [{ scale: '1' }, { scale: '1.25 .8' }, { scale: '.9 1.12' }, { scale: '1' }], { duration: 380 }); } runTrick(); });
  const onDbl = e => {
    if (!on || busy || (e.target.closest && e.target.closest('.gate,dialog,input,select,.bar,.g5-nika-wrap,#life'))) return;
    getSelection && getSelection().removeAllRanges();
    runTrick({ el: e.target.closest && e.target.closest(`.g5-split,${STRETCHY},p,.pill,.rec`), x: e.clientX, y: e.clientY });
  };

  // Lower the drums while a scene video plays with sound.
  const duckCheck = () => {
    const loud = [...document.querySelectorAll('video')].some(v => !v.paused && !v.muted);
    if (on && loud !== ducked) { ducked = loud; ramp(loud ? 0.08 : VOL, 0.6); }
  };
  document.querySelectorAll('video').forEach(v => ['play', 'pause', 'volumechange'].forEach(ev => v.addEventListener(ev, duckCheck)));

  function cleanup() {
    timers.forEach(clearTimeout); timers.clear(); busy = false;
    anims.forEach(a => a.cancel()); anims.clear();
    card(false); nikaWrap.classList.remove('giant', 'in'); nika.classList.remove('pop', 'laugh', 'punch'); body.classList.remove('g5-laughing');
    bubble.classList.remove('show'); fx.replaceChildren(); releaseLetters(); hoverH = null; unsplit();
  }
  const LISTEN = [['pointerdown', onPointer, { passive: true }], ['pointerdown', onDown], ['pointermove', onMove], ['pointerup', onUp], ['pointercancel', onUp], ['dblclick', onDbl], ['mouseleave', onLeave, document]];
  function setOn(next) {
    on = next;
    button.setAttribute('aria-pressed', String(on));
    button.querySelector('b').textContent = on ? 'On' : 'Off';
    if (on) {
      ensureAudio();
      if (ctx && ctx.state === 'suspended') ctx.resume();
      audio.play().then(() => ramp(ducked ? 0.08 : VOL, 1.2)).catch(() => {});
      const reduced = isReduced();
      if (!reduced) { splash.classList.remove('go'); void splash.offsetWidth; splash.classList.add('go'); }
      // repaint the world while the sunburst covers the screen
      root.classList.add('g5-on');
      later(() => { if (!on) return; body.classList.add('gear5'); splitLetters(); }, reduced ? 0 : 420);
      later(() => { if (!on) return; nikaWrap.classList.add('in'); sfx('boing'); }, reduced ? 0 : 1500);
      later(() => { if (on && !lifeNear) say('Oi Goma! Gear 5 is ON. Tap me for tricks!', 3800); }, reduced ? 300 : 2300);
      quipSeen.clear(); activity();
      lastY = scrollY; if (!raf) raf = requestAnimationFrame(loop);
      LISTEN.forEach(([ev, fn, opt]) => (opt === document ? document : window).addEventListener(ev, fn, opt === document ? undefined : opt));
    } else {
      if (audio) { ramp(0, 0.8); setTimeout(() => { if (!on) audio.pause(); }, 850); }
      cleanup(); body.classList.remove('gear5', 'g5-hit'); root.classList.remove('g5-on');
      cancelAnimationFrame(raf); raf = 0; root.style.setProperty('--sq', '0'); root.style.setProperty('--beat', '0');
      LISTEN.forEach(([ev, fn, opt]) => (opt === document ? document : window).removeEventListener(ev, fn, opt === document ? undefined : opt));
    }
  }
  button.addEventListener('click', e => { e.stopPropagation(); setOn(!on); });
  document.addEventListener('visibilitychange', () => { if (!audio || !on) return; if (document.hidden) audio.pause(); else audio.play().catch(() => {}); });
}
