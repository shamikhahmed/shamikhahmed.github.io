/* Capricorn hero — interactive WebGL star constellation.
   Bespoke shader (~6 KB) instead of three.js: one effect doesn't justify
   150 KB on an offline-first site. 3D point cloud with depth parallax,
   pointer-reactive drift, constellation lines, gold/starlight palette.
   Pauses when the tab is hidden or the canvas scrolls offscreen.
   Falls back to the static 2D starfield on no-WebGL / reduced-motion. */
(function () {
  'use strict';
  var canvas = document.getElementById('starfield');
  if (!canvas) return;

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var gl = !reduced && canvas.getContext('webgl', { alpha: true, antialias: false, powerPreference: 'low-power' });

  /* ── Fallback: static 2D starfield (also the reduced-motion path) ── */
  if (!gl) {
    var ctx = canvas.getContext('2d');
    if (!ctx) return;
    var paint = function () {
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = innerWidth * dpr;
      canvas.height = innerHeight * dpr;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (var i = 0, n = Math.min(140, canvas.width * canvas.height / 18000); i < n; i++) {
        ctx.beginPath();
        ctx.arc(Math.random() * canvas.width, Math.random() * canvas.height,
          (Math.random() * 1.2 + 0.3) * dpr, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(244,240,232,' + (Math.random() * 0.5 + 0.2).toFixed(2) + ')';
        ctx.fill();
      }
    };
    paint();
    window.addEventListener('resize', paint, { passive: true });
    return;
  }

  /* ── WebGL constellation ── */
  var N = 260;                       // stars
  var LINK_DIST = 0.22;              // constellation link radius (clip space)
  var pos = new Float32Array(N * 3); // x, y in [-1,1], z depth in [0,1]
  var phase = new Float32Array(N);   // twinkle phase
  var size = new Float32Array(N);
  for (var i = 0; i < N; i++) {
    pos[i * 3] = Math.random() * 2 - 1;
    pos[i * 3 + 1] = Math.random() * 2 - 1;
    pos[i * 3 + 2] = Math.random();
    phase[i] = Math.random() * Math.PI * 2;
    size[i] = Math.random() * 2 + 1;
  }

  /* Constellation lines: nearest pairs computed once on CPU */
  var links = [];
  for (var a = 0; a < N; a++) {
    for (var b = a + 1; b < N && links.length < 320; b++) {
      var dx = pos[a * 3] - pos[b * 3], dy = pos[a * 3 + 1] - pos[b * 3 + 1];
      var dz = pos[a * 3 + 2] - pos[b * 3 + 2];
      if (dx * dx + dy * dy < LINK_DIST * LINK_DIST * 0.25 && Math.abs(dz) < 0.2) links.push(a, b);
    }
  }

  function shader(type, src) {
    var s = gl.createShader(type);
    gl.shaderSource(s, src); gl.compileShader(s);
    return s;
  }
  function program(vs, fs) {
    var p = gl.createProgram();
    gl.attachShader(p, shader(gl.VERTEX_SHADER, vs));
    gl.attachShader(p, shader(gl.FRAGMENT_SHADER, fs));
    gl.linkProgram(p);
    return p;
  }

  var starVS =
    'attribute vec3 aPos; attribute float aPhase; attribute float aSize;' +
    'uniform float uTime; uniform vec2 uPointer; uniform float uDPR;' +
    'varying float vAlpha; varying float vGold;' +
    'void main(){' +
    '  float depth = aPos.z;' +
    '  vec2 drift = vec2(sin(uTime*0.05 + aPhase), cos(uTime*0.04 + aPhase*1.7)) * 0.012 * (1.0-depth);' +
    '  vec2 parallax = uPointer * (0.035 + depth*0.05);' +
    '  vec2 p = aPos.xy + drift + parallax;' +
    '  if (p.x > 1.05) p.x -= 2.1; if (p.x < -1.05) p.x += 2.1;' +
    '  if (p.y > 1.05) p.y -= 2.1; if (p.y < -1.05) p.y += 2.1;' +
    '  gl_Position = vec4(p, 0.0, 1.0);' +
    '  gl_PointSize = (aSize + depth * 2.0) * uDPR;' +
    '  vAlpha = (0.25 + 0.75*depth) * (0.6 + 0.4*sin(uTime*0.8 + aPhase));' +
    '  vGold = step(0.86, fract(aPhase * 7.13));' +   // ~14% of stars are gold
    '}';
  var starFS =
    'precision mediump float; varying float vAlpha; varying float vGold;' +
    'void main(){' +
    '  vec2 c = gl_PointCoord - 0.5;' +
    '  float d = smoothstep(0.5, 0.05, length(c));' +
    '  vec3 col = mix(vec3(0.957,0.941,0.910), vec3(0.788,0.635,0.153), vGold);' +
    '  gl_FragColor = vec4(col, d * vAlpha);' +
    '}';
  var lineVS =
    'attribute vec3 aPos; attribute float aPhase;' +
    'uniform float uTime; uniform vec2 uPointer;' +
    'varying float vA;' +
    'void main(){' +
    '  float depth = aPos.z;' +
    '  vec2 drift = vec2(sin(uTime*0.05 + aPhase), cos(uTime*0.04 + aPhase*1.7)) * 0.012 * (1.0-depth);' +
    '  vec2 parallax = uPointer * (0.035 + depth*0.05);' +
    '  gl_Position = vec4(aPos.xy + drift + parallax, 0.0, 1.0);' +
    '  vA = 0.05 + 0.05 * sin(uTime*0.5 + aPhase);' +
    '}';
  var lineFS =
    'precision mediump float; varying float vA;' +
    'void main(){ gl_FragColor = vec4(0.788,0.635,0.153,vA); }';

  var starProg = program(starVS, starFS);
  var lineProg = program(lineVS, lineFS);

  function buf(data, prog, attrs) {
    var b = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, b);
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
    return b;
  }

  // Interleave per-vertex data for stars
  var starData = new Float32Array(N * 5);
  for (i = 0; i < N; i++) {
    starData.set([pos[i * 3], pos[i * 3 + 1], pos[i * 3 + 2], phase[i], size[i]], i * 5);
  }
  var starBuf = buf(starData);

  var lineData = new Float32Array(links.length * 4);
  for (i = 0; i < links.length; i++) {
    var s = links[i];
    lineData.set([pos[s * 3], pos[s * 3 + 1], pos[s * 3 + 2], phase[s]], i * 4);
  }
  var lineBuf = buf(lineData);

  function bindStar() {
    gl.useProgram(starProg);
    gl.bindBuffer(gl.ARRAY_BUFFER, starBuf);
    var aPos = gl.getAttribLocation(starProg, 'aPos');
    var aPhase = gl.getAttribLocation(starProg, 'aPhase');
    var aSize = gl.getAttribLocation(starProg, 'aSize');
    gl.enableVertexAttribArray(aPos); gl.vertexAttribPointer(aPos, 3, gl.FLOAT, false, 20, 0);
    gl.enableVertexAttribArray(aPhase); gl.vertexAttribPointer(aPhase, 1, gl.FLOAT, false, 20, 12);
    gl.enableVertexAttribArray(aSize); gl.vertexAttribPointer(aSize, 1, gl.FLOAT, false, 20, 16);
  }
  function bindLine() {
    gl.useProgram(lineProg);
    gl.bindBuffer(gl.ARRAY_BUFFER, lineBuf);
    var aPos = gl.getAttribLocation(lineProg, 'aPos');
    var aPhase = gl.getAttribLocation(lineProg, 'aPhase');
    gl.enableVertexAttribArray(aPos); gl.vertexAttribPointer(aPos, 3, gl.FLOAT, false, 16, 0);
    gl.enableVertexAttribArray(aPhase); gl.vertexAttribPointer(aPhase, 1, gl.FLOAT, false, 16, 12);
  }

  var uT1 = gl.getUniformLocation(starProg, 'uTime');
  var uP1 = gl.getUniformLocation(starProg, 'uPointer');
  var uD1 = gl.getUniformLocation(starProg, 'uDPR');
  var uT2 = gl.getUniformLocation(lineProg, 'uTime');
  var uP2 = gl.getUniformLocation(lineProg, 'uPointer');

  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

  var px = 0, py = 0, tx = 0, ty = 0;   // pointer parallax, eased
  window.addEventListener('pointermove', function (e) {
    tx = (e.clientX / innerWidth) * 2 - 1;
    ty = -((e.clientY / innerHeight) * 2 - 1);
  }, { passive: true });

  function resize() {
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = innerWidth * dpr;
    canvas.height = innerHeight * dpr;
    gl.viewport(0, 0, canvas.width, canvas.height);
  }
  resize();
  window.addEventListener('resize', resize, { passive: true });

  /* Render only while visible — no battery drain on idle tabs */
  var running = false, raf = 0, t0 = performance.now();
  function frame(now) {
    if (!running) return;
    var t = (now - t0) / 1000;
    px += (tx - px) * 0.04; py += (ty - py) * 0.04;
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    bindLine();
    gl.uniform1f(uT2, t); gl.uniform2f(uP2, px, py);
    gl.drawArrays(gl.LINES, 0, links.length);
    bindStar();
    gl.uniform1f(uT1, t); gl.uniform2f(uP1, px, py);
    gl.uniform1f(uD1, Math.min(window.devicePixelRatio || 1, 2));
    gl.drawArrays(gl.POINTS, 0, N);
    raf = requestAnimationFrame(frame);
  }
  function setRunning(on) {
    if (on === running) return;
    running = on;
    if (on) raf = requestAnimationFrame(frame); else cancelAnimationFrame(raf);
  }
  new IntersectionObserver(function (e) {
    setRunning(e[0].isIntersecting && !document.hidden);
  }).observe(canvas);
  document.addEventListener('visibilitychange', function () {
    setRunning(!document.hidden && canvas.getBoundingClientRect().bottom > 0);
  });
})();
