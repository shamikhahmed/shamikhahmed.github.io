/* Capricorn homepage experience
   Three.js particle galaxy + GSAP/ScrollTrigger storytelling + Lenis
   smooth scroll + custom cursor. Everything degrades: reduced-motion
   gets a static frame and instant content; no-WebGL gets no canvas. */
import * as THREE from 'three';

const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
const gsap = window.gsap;
const ScrollTrigger = window.ScrollTrigger;
if (gsap && ScrollTrigger) gsap.registerPlugin(ScrollTrigger);

/* ════════ Lenis smooth scroll ════════ */
let lenis = null;
if (!reduced && window.Lenis && gsap) {
  lenis = new window.Lenis({ lerp: 0.11, wheelMultiplier: 1.0 });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((t) => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
  window.lenis = lenis;
  // Native anchor jumps get overridden by Lenis's internal scroll state —
  // route same-page hash links through it instead.
  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const target = document.querySelector(a.getAttribute('href'));
      if (!target) return;
      e.preventDefault();
      lenis.scrollTo(target, { offset: -70, duration: 1.4 });
    });
  });
}

/* ════════ Three.js galaxy ════════ */
(function galaxy() {
  const canvas = document.getElementById('webgl');
  if (!canvas) return;
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false, powerPreference: 'low-power' });
  } catch { canvas.remove(); return; }

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(58, innerWidth / innerHeight, 0.1, 60);
  camera.position.set(0, 0.6, 7.5);

  const GOLD = new THREE.Color('#c9a227');
  const CREAM = new THREE.Color('#f4f0e8');
  const BLUE = new THREE.Color('#5b8dee');

  /* Spiral galaxy point cloud */
  const N = innerWidth < 760 ? 1500 : 2600;
  const pos = new Float32Array(N * 3);
  const col = new Float32Array(N * 3);
  const scl = new Float32Array(N);
  for (let i = 0; i < N; i++) {
    const arm = i % 3;
    const r = Math.pow(Math.random(), 0.6) * 6.2;
    const spin = r * 0.85;
    const angle = (arm / 3) * Math.PI * 2 + spin + (Math.random() - 0.5) * 0.55;
    const spread = (Math.random() - 0.5) * (0.55 + r * 0.12);
    pos[i * 3] = Math.cos(angle) * r + spread * (Math.random() - 0.5);
    pos[i * 3 + 1] = (Math.random() - 0.5) * (0.5 + (6.2 - r) * 0.14);
    pos[i * 3 + 2] = Math.sin(angle) * r + spread * (Math.random() - 0.5);
    const t = Math.random();
    const c = t < 0.16 ? GOLD : (t < 0.22 ? BLUE : CREAM);
    const fade = 0.35 + 0.65 * Math.random();
    col[i * 3] = c.r * fade; col[i * 3 + 1] = c.g * fade; col[i * 3 + 2] = c.b * fade;
    scl[i] = Math.random() * 1.6 + 0.4;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  geo.setAttribute('aScale', new THREE.BufferAttribute(scl, 1));

  const mat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    vertexColors: true,
    uniforms: { uTime: { value: 0 }, uSize: { value: Math.min(devicePixelRatio, 2) * 26 } },
    vertexShader: `
      attribute float aScale;
      uniform float uTime; uniform float uSize;
      varying vec3 vColor; varying float vTw;
      void main() {
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        gl_Position = projectionMatrix * mv;
        gl_PointSize = uSize * aScale / -mv.z;
        vColor = color;
        vTw = 0.7 + 0.3 * sin(uTime * 1.4 + position.x * 9.0 + position.z * 7.0);
      }`,
    fragmentShader: `
      varying vec3 vColor; varying float vTw;
      void main() {
        float d = smoothstep(0.5, 0.04, length(gl_PointCoord - 0.5));
        gl_FragColor = vec4(vColor, d * vTw);
      }`,
  });
  const galaxyPts = new THREE.Points(geo, mat);
  galaxyPts.rotation.x = 0.42;
  scene.add(galaxyPts);

  function resize() {
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    renderer.setSize(innerWidth, innerHeight);
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
  }
  resize();
  addEventListener('resize', resize, { passive: true });

  let px = 0, py = 0, tx = 0, ty = 0;
  if (finePointer) addEventListener('pointermove', (e) => {
    tx = (e.clientX / innerWidth - 0.5) * 2;
    ty = (e.clientY / innerHeight - 0.5) * 2;
  }, { passive: true });

  /* Scroll-driven camera: dolly out + tilt across the whole page */
  let prog = 0;
  if (gsap && ScrollTrigger && !reduced) {
    ScrollTrigger.create({
      start: 0, end: () => document.documentElement.scrollHeight - innerHeight,
      onUpdate: (st) => { prog = st.progress; },
    });
  }

  if (reduced) { renderer.render(scene, camera); return; }

  let running = true, raf = 0;
  const clock = new THREE.Clock();
  function frame() {
    if (!running) return;
    const t = clock.getElapsedTime();
    mat.uniforms.uTime.value = t;
    px += (tx - px) * 0.06; py += (ty - py) * 0.06;
    galaxyPts.rotation.y = t * 0.045 + prog * 1.6;
    galaxyPts.rotation.x = 0.42 + prog * 0.5 + py * 0.05;
    camera.position.z = 7.5 + prog * 3.2;
    camera.position.x = px * 0.7;
    camera.position.y = 0.6 - prog * 1.1 - py * 0.4;
    camera.lookAt(0, 0, 0);
    renderer.render(scene, camera);
    raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);
  document.addEventListener('visibilitychange', () => {
    running = !document.hidden;
    if (running) { clock.start(); raf = requestAnimationFrame(frame); }
    else cancelAnimationFrame(raf);
  });
})();

/* ════════ Optional cinematic loop (Higgsfield slot) ════════ */
(function heroVideo() {
  const v = document.querySelector('.hero-video');
  if (!v || reduced) return;
  v.addEventListener('canplay', () => v.classList.add('is-live'), { once: true });
  v.addEventListener('error', () => v.remove(), { once: true });
  v.load();
})();

/* ════════ GSAP storytelling ════════ */
(function story() {
  if (!gsap) return;

  /* Scroll progress bar */
  const bar = document.querySelector('.scroll-progress');
  if (bar && ScrollTrigger && !reduced) {
    gsap.to(bar, { scaleX: 1, ease: 'none',
      scrollTrigger: { start: 0, end: () => document.documentElement.scrollHeight - innerHeight, scrub: 0.3 } });
  }

  if (reduced) return; // content is fully visible without JS animation

  /* Hero intro */
  gsap.timeline({ defaults: { ease: 'power4.out' } })
    .from('.hero-eyebrow', { y: 18, opacity: 0, duration: 0.9 }, 0.05)
    .from('.hero h1 .hl > span', { yPercent: 115, duration: 1.15, stagger: 0.09 }, 0.18)
    .from('.hero .lead', { y: 26, opacity: 0, duration: 0.9 }, 0.62)
    .from('.hero-actions .btn', { y: 22, opacity: 0, duration: 0.7, stagger: 0.08 }, 0.78)
    .from('.hero-meta span', { y: 14, opacity: 0, duration: 0.6, stagger: 0.06 }, 0.95)
    .from('.scroll-cue', { opacity: 0, duration: 0.8 }, 1.2);

  /* Marquee — endless drift */
  const track = document.querySelector('.marquee-track');
  if (track) gsap.to(track, { xPercent: -50, ease: 'none', duration: 26, repeat: -1 });

  if (!ScrollTrigger) return;

  /* Pinned horizontal product showcase (desktop).
     Created BEFORE the reveal triggers so every trigger below accounts
     for the pin spacer when positions are computed. */
  const mm = gsap.matchMedia();
  mm.add('(min-width: 901px)', () => {
    const viewport = document.querySelector('.showcase-viewport');
    const strip = document.querySelector('.showcase-track');
    if (!viewport || !strip) return;
    const dist = () => strip.scrollWidth - viewport.clientWidth;
    const tween = gsap.to(strip, {
      x: () => -dist(), ease: 'none',
      scrollTrigger: {
        trigger: '.showcase',
        start: 'top top',
        end: () => '+=' + dist(),
        pin: true,
        scrub: 0.6,
        anticipatePin: 1,
        invalidateOnRefresh: true,
      },
    });
    return () => tween.scrollTrigger?.kill();
  });

  /* Generic section reveals */
  document.querySelectorAll('[data-reveal]').forEach((el) => {
    const kids = el.dataset.reveal === 'children' ? el.children : [el];
    gsap.from(kids, {
      y: 44, opacity: 0, duration: 1, ease: 'power3.out',
      stagger: 0.09,
      scrollTrigger: { trigger: el, start: 'top 82%', once: true },
    });
  });

  /* Stats count-up */
  document.querySelectorAll('[data-count]').forEach((el) => {
    const to = parseFloat(el.dataset.count);
    const suffix = el.dataset.countSuffix || '';
    const obj = { v: 0 };
    el.textContent = '0' + suffix; // markup holds the final value for no-JS/reduced-motion
    gsap.to(obj, {
      v: to, duration: 1.6, ease: 'power3.out',
      onUpdate: () => { el.textContent = Math.round(obj.v) + suffix; },
      scrollTrigger: { trigger: el, start: 'top 85%', once: true },
    });
  });

  /* Dark ↔ paper theme morph */
  document.querySelectorAll('.paper-section').forEach((sec) => {
    ScrollTrigger.create({
      trigger: sec,
      start: 'top 58%',
      end: 'bottom 42%',
      onToggle: (st) => document.body.classList.toggle('is-paper', st.isActive),
    });
  });

  /* Manifesto kinetic lines */
  document.querySelectorAll('.manifesto .mline > span').forEach((line) => {
    gsap.from(line, {
      yPercent: 115, duration: 1.05, ease: 'power4.out',
      scrollTrigger: { trigger: line.parentElement, start: 'top 84%', once: true },
    });
  });

  /* Footer giant letters */
  const letters = document.querySelectorAll('.footer-giant .fl');
  if (letters.length) {
    gsap.from(letters, {
      yPercent: 60, opacity: 0, duration: 0.9, ease: 'power3.out', stagger: 0.05,
      scrollTrigger: { trigger: '.footer-giant', start: 'top 92%', once: true },
    });
  }

  /* Refresh after images settle (showcase width depends on them).
     The module can execute after `load` has already fired — guard it. */
  if (document.readyState === 'complete') ScrollTrigger.refresh();
  else addEventListener('load', () => ScrollTrigger.refresh());
})();

/* ════════ Custom cursor ════════ */
(function cursor() {
  if (!finePointer || reduced || !gsap) return;
  const dot = document.querySelector('.cursor-dot');
  const ring = document.querySelector('.cursor-ring');
  if (!dot || !ring) return;
  const setDot = { x: gsap.quickTo(dot, 'x', { duration: 0.08 }), y: gsap.quickTo(dot, 'y', { duration: 0.08 }) };
  const setRing = { x: gsap.quickTo(ring, 'x', { duration: 0.12, ease: 'power2.out' }), y: gsap.quickTo(ring, 'y', { duration: 0.12, ease: 'power2.out' }) };
  addEventListener('pointermove', (e) => {
    document.body.classList.add('has-cursor'); // stays hidden until the pointer actually moves
    setDot.x(e.clientX - 3); setDot.y(e.clientY - 3);
    setRing.x(e.clientX - 18); setRing.y(e.clientY - 18);
  }, { passive: true });
  document.querySelectorAll('a, button, [data-cursor]').forEach((el) => {
    el.addEventListener('pointerenter', () => gsap.to(ring, { scale: 1.8, duration: 0.25 }), { passive: true });
    el.addEventListener('pointerleave', () => gsap.to(ring, { scale: 1, duration: 0.25 }), { passive: true });
  });
})();
