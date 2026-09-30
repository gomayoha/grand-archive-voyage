// Gear 5 mode: the site turns rubbery and plays the Drums of Liberation.
//  - Awakening: a white burst, "GEAR 5" bouncing in.
//  - Rubber body: headlines squash & stretch with scroll speed (CSS var --sq).
//  - Drums of Liberation: bass energy from the track drives --beat; big hits pop the logo.
//  - Toon force: a tap/click anywhere pops a cartoon cloud with a sound word.
//  - Gomu Gomu: drag a photo with the mouse and it stretches like rubber, then snaps back.
// Music starts only from the toggle (a user gesture), so it works on iPhone too.
const WORDS = ['BOING!', 'DON!', 'GOMU!', 'HAHAHA!', 'POP!', 'NIKA!', 'BWOING!', 'DON DON!'];
const STRETCHY = '.tile,.pc figure,.world,.jcard figure,.polaroid,.vcard,.shot,.char-media,.art-col button,.reel,.ro-img,.sp,.rz-frame';

export function initGear5({ button, isReduced }) {
  const root = document.documentElement, body = document.body;
  const fx = document.createElement('div'); fx.className = 'g5-fx'; fx.setAttribute('aria-hidden', 'true');
  const clouds = document.createElement('div'); clouds.className = 'g5-clouds'; clouds.setAttribute('aria-hidden', 'true');
  clouds.innerHTML = '<i></i><i></i><i></i><i></i>';
  const splash = document.createElement('div'); splash.className = 'g5-splash'; splash.setAttribute('aria-hidden', 'true');
  splash.innerHTML = '<span class="g5-sunburst"></span><b class="g5-word">GEAR</b><b class="g5-five">5</b><small>The Drums of Liberation</small>';
  document.body.append(clouds, fx, splash);

  let on = false, audio = null, ctx = null, gain = null, analyser = null, bins = null, raf = 0;
  let lastY = scrollY, vel = 0, sq = 0, energyAvg = 0, beat = 0, lastHit = 0, ducked = false;

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
  }
  const ramp = (to, secs) => { if (!gain) { if (audio) audio.volume = to; return; } const t = ctx.currentTime; gain.gain.cancelScheduledValues(t); gain.gain.setValueAtTime(gain.gain.value, t); gain.gain.linearRampToValueAtTime(to, t + secs); };
  const VOL = 0.75;

  function loop(t) {
    raf = requestAnimationFrame(loop);
    const reduced = isReduced();
    // rubber: scroll velocity -> squash/stretch, eased back like a spring
    const y = scrollY; vel = vel * 0.8 + (y - lastY) * 0.2; lastY = y;
    const target = reduced ? 0 : Math.max(-0.2, Math.min(0.2, vel * 0.006));
    sq += (target - sq) * 0.25;
    // drums: low-frequency energy
    let e = 0;
    if (analyser && !ducked) { analyser.getByteFrequencyData(bins); for (let i = 1; i < 9; i++) e += bins[i]; e /= 8 * 255; }
    energyAvg = energyAvg * 0.96 + e * 0.04;
    beat = Math.max(beat * 0.86, Math.max(0, (e - energyAvg * 0.9) * 4));
    if (e > energyAvg * 1.3 && e > 0.35 && t - lastHit > 280) {
      lastHit = t; body.classList.remove('g5-hit'); void body.offsetWidth; body.classList.add('g5-hit');
    }
    root.style.setProperty('--sq', sq.toFixed(4));
    root.style.setProperty('--beat', (reduced ? 0 : Math.min(1, beat)).toFixed(3));
  }

  function pop(x, y) {
    if (fx.childElementCount > 6 || isReduced()) return;
    const el = document.createElement('span'); el.className = 'g5-pop';
    el.style.left = x + 'px'; el.style.top = y + 'px'; el.style.setProperty('--r', (Math.random() * 24 - 12).toFixed(1) + 'deg');
    el.innerHTML = `<i class="c1"></i><i class="c2"></i><i class="c3"></i><i class="c4"></i><b>${WORDS[Math.floor(Math.random() * WORDS.length)]}</b>`;
    fx.append(el); el.addEventListener('animationend', e => { if (e.target === el) el.remove(); });
    setTimeout(() => el.remove(), 1400);
  }
  const onPointer = e => { if (on && e.isPrimary && !(e.target.closest && e.target.closest('.gate,dialog,input,select,.bar'))) pop(e.clientX, e.clientY); };

  // Gomu Gomu stretch (mouse only; on touch, dragging must stay scrolling)
  let drag = null;
  const onDown = e => {
    if (!on || e.pointerType !== 'mouse' || e.button !== 0 || isReduced()) return;
    const el = e.target.closest(STRETCHY); if (!el) return;
    drag = { el, x: e.clientX, y: e.clientY, moved: false }; e.preventDefault();
  };
  const onMove = e => {
    if (!drag) return;
    const dx = e.clientX - drag.x, dy = e.clientY - drag.y, d = Math.hypot(dx, dy);
    if (d > 6) drag.moved = true;
    const k = Math.min(0.6, d / 600), ang = Math.atan2(dy, dx) * 180 / Math.PI;
    drag.el.style.transition = 'none';
    drag.el.style.translate = `${(dx * 0.55).toFixed(1)}px ${(dy * 0.55).toFixed(1)}px`;
    drag.el.style.rotate = `${(dx * 0.02).toFixed(2)}deg`;
    drag.el.style.scale = Math.abs(dx) > Math.abs(dy) ? `${(1 + k).toFixed(3)} ${(1 - k * 0.45).toFixed(3)}` : `${(1 - k * 0.45).toFixed(3)} ${(1 + k).toFixed(3)}`;
    drag.el.style.zIndex = 50; drag.ang = ang;
  };
  const onUp = e => {
    if (!drag) return;
    const el = drag.el, moved = drag.moved; drag = null;
    const from = { translate: el.style.translate || '0px 0px', scale: el.style.scale || '1', rotate: el.style.rotate || '0deg' };
    el.style.translate = ''; el.style.scale = ''; el.style.rotate = ''; el.style.transition = '';
    el.animate([from, { translate: '0px 0px', scale: '1.12 0.9', rotate: '0deg', offset: 0.35 }, { scale: '0.95 1.06', offset: 0.6 }, { scale: '1.02 0.98', offset: 0.8 }, { translate: '0px 0px', scale: '1', rotate: '0deg' }], { duration: 700, easing: 'cubic-bezier(.2,.9,.2,1)' }).finished.then(() => { el.style.zIndex = ''; });
    if (moved) { pop(e.clientX, e.clientY); const stop = ev => { ev.stopPropagation(); ev.preventDefault(); }; addEventListener('click', stop, { capture: true, once: true }); setTimeout(() => removeEventListener('click', stop, true), 50); }
  };

  // Lower the drums while a scene video plays with sound.
  const duckCheck = () => {
    const loud = [...document.querySelectorAll('video')].some(v => !v.paused && !v.muted);
    if (on && loud !== ducked) { ducked = loud; ramp(loud ? 0.08 : VOL, 0.6); }
  };
  document.querySelectorAll('video').forEach(v => ['play', 'pause', 'volumechange'].forEach(ev => v.addEventListener(ev, duckCheck)));

  function setOn(next) {
    on = next;
    button.setAttribute('aria-pressed', String(on));
    button.querySelector('b').textContent = on ? 'On' : 'Off';
    body.classList.toggle('gear5', on);
    if (on) {
      ensureAudio();
      if (ctx && ctx.state === 'suspended') ctx.resume();
      audio.play().then(() => ramp(ducked ? 0.08 : VOL, 1.2)).catch(() => {});
      if (!isReduced()) { splash.classList.remove('go'); void splash.offsetWidth; splash.classList.add('go'); }
      lastY = scrollY; if (!raf) raf = requestAnimationFrame(loop);
      addEventListener('pointerdown', onPointer, { passive: true });
      addEventListener('pointerdown', onDown); addEventListener('pointermove', onMove); addEventListener('pointerup', onUp); addEventListener('pointercancel', onUp);
    } else {
      if (audio) { ramp(0, 0.8); setTimeout(() => { if (!on) audio.pause(); }, 850); }
      cancelAnimationFrame(raf); raf = 0; root.style.setProperty('--sq', '0'); root.style.setProperty('--beat', '0');
      removeEventListener('pointerdown', onPointer); removeEventListener('pointerdown', onDown); removeEventListener('pointermove', onMove); removeEventListener('pointerup', onUp); removeEventListener('pointercancel', onUp);
    }
  }
  button.addEventListener('click', e => { e.stopPropagation(); setOn(!on); });
  document.addEventListener('visibilitychange', () => { if (!audio || !on) return; if (document.hidden) audio.pause(); else audio.play().catch(() => {}); });
}
