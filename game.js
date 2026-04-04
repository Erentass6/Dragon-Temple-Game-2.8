/* ========================================
   Dragon Temple Run - Game Engine
   ========================================
   Flappy-style browser game
   Dragon + Chinese temple obstacles
   Web Audio API for music & SFX
   ======================================== */

(function () {

  // ============================================================
  //  DOM REFERENCES
  // ============================================================
  var cv       = document.getElementById('c');
  var ctx      = cv.getContext('2d');
  var scoreTxt = document.getElementById('scoreDisplay');
  var comboEl  = document.getElementById('combo');
  var finalEl  = document.getElementById('finalScore');
  var bestEl   = document.getElementById('bestScore');
  var overlay  = document.getElementById('overlay');
  var goScreen = document.getElementById('gameOver');
  var soundBtn = document.getElementById('soundToggle');

  // ============================================================
  //  CANVAS SIZE
  // ============================================================
  var W, H, best = 0;

  function resize() {
    var wr = document.getElementById('W');
    W = cv.width  = wr.clientWidth;
    H = cv.height = wr.clientHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  // ============================================================
  //  AUDIO ENGINE  (Web Audio API — no external files)
  // ============================================================
  var audioCtx   = null;
  var soundOn    = true;
  var bgmGain    = null;
  var bgmStarted = false;

  function initAudio() {
    try {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      bgmGain  = audioCtx.createGain();
      bgmGain.gain.value = 0.12;
      bgmGain.connect(audioCtx.destination);
    } catch (e) {
      soundOn = false;
    }
  }

  /** Pentatonic melody loop — gives a Chinese / Eastern feel */
  function playBGM() {
    if (!audioCtx || !soundOn || bgmStarted) return;
    bgmStarted = true;

    var scale = [261.6, 293.7, 329.6, 392.0, 440.0, 523.3, 587.3, 659.3];
    var tempo = 0.35;
    var noteIdx = 0;

    function playNote() {
      if (!soundOn || !audioCtx) return;

      var osc  = audioCtx.createOscillator();
      var gain = audioCtx.createGain();
      osc.type = noteIdx % 3 === 0 ? 'sine' : 'triangle';
      osc.frequency.value = scale[Math.floor(Math.random() * scale.length)];

      gain.gain.setValueAtTime(0, audioCtx.currentTime);
      gain.gain.linearRampToValueAtTime(0.08, audioCtx.currentTime + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + tempo * 0.9);

      osc.connect(gain);
      gain.connect(bgmGain);
      osc.start(audioCtx.currentTime);
      osc.stop(audioCtx.currentTime + tempo);

      // Harmony (octave below, every other note)
      if (noteIdx % 2 === 0) {
        var osc2  = audioCtx.createOscillator();
        var gain2 = audioCtx.createGain();
        osc2.type = 'sine';
        osc2.frequency.value = osc.frequency.value * 0.5;
        gain2.gain.setValueAtTime(0, audioCtx.currentTime);
        gain2.gain.linearRampToValueAtTime(0.04, audioCtx.currentTime + 0.05);
        gain2.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + tempo * 0.8);
        osc2.connect(gain2);
        gain2.connect(bgmGain);
        osc2.start(audioCtx.currentTime);
        osc2.stop(audioCtx.currentTime + tempo);
      }

      noteIdx++;
      setTimeout(playNote, tempo * 1000);
    }
    playNote();

    // Ambient drone (low C)
    var drone     = audioCtx.createOscillator();
    var droneGain = audioCtx.createGain();
    drone.type = 'sine';
    drone.frequency.value = 130.8;
    droneGain.gain.value  = 0.015;
    drone.connect(droneGain);
    droneGain.connect(bgmGain);
    drone.start();
  }

  /** One-shot sound effects */
  function playSfx(type) {
    if (!audioCtx || !soundOn) return;
    try {
      var osc  = audioCtx.createOscillator();
      var gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);

      switch (type) {

        case 'flap':
          osc.type = 'sine';
          osc.frequency.setValueAtTime(600, audioCtx.currentTime);
          osc.frequency.exponentialRampToValueAtTime(900, audioCtx.currentTime + 0.08);
          osc.frequency.exponentialRampToValueAtTime(400, audioCtx.currentTime + 0.15);
          gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.15);
          osc.start(audioCtx.currentTime);
          osc.stop(audioCtx.currentTime + 0.15);
          break;

        case 'score':
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(880,  audioCtx.currentTime);
          osc.frequency.setValueAtTime(1108, audioCtx.currentTime + 0.08);
          osc.frequency.setValueAtTime(1318, audioCtx.currentTime + 0.16);
          gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);
          osc.start(audioCtx.currentTime);
          osc.stop(audioCtx.currentTime + 0.3);
          break;

        case 'fire':
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(150, audioCtx.currentTime);
          osc.frequency.exponentialRampToValueAtTime(50, audioCtx.currentTime + 0.2);
          gain.gain.setValueAtTime(0.06, audioCtx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.2);
          osc.start(audioCtx.currentTime);
          osc.stop(audioCtx.currentTime + 0.2);
          // Crackle noise
          var n  = audioCtx.sampleRate * 0.15;
          var b  = audioCtx.createBuffer(1, n, audioCtx.sampleRate);
          var d  = b.getChannelData(0);
          for (var i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * 0.3;
          var ns = audioCtx.createBufferSource();
          var ng = audioCtx.createGain();
          ns.buffer = b;
          ng.gain.setValueAtTime(0.08, audioCtx.currentTime);
          ng.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.15);
          ns.connect(ng);
          ng.connect(audioCtx.destination);
          ns.start(audioCtx.currentTime);
          ns.stop(audioCtx.currentTime + 0.15);
          break;

        case 'die':
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(400, audioCtx.currentTime);
          osc.frequency.exponentialRampToValueAtTime(60, audioCtx.currentTime + 0.6);
          gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.6);
          osc.start(audioCtx.currentTime);
          osc.stop(audioCtx.currentTime + 0.6);
          // Boom
          var n2  = audioCtx.sampleRate * 0.4;
          var b2  = audioCtx.createBuffer(1, n2, audioCtx.sampleRate);
          var d2  = b2.getChannelData(0);
          for (var j = 0; j < n2; j++) d2[j] = (Math.random() * 2 - 1) * Math.exp(-j / (n2 * 0.15));
          var bm  = audioCtx.createBufferSource();
          var bg2 = audioCtx.createGain();
          bm.buffer = b2;
          bg2.gain.value = 0.2;
          bm.connect(bg2);
          bg2.connect(audioCtx.destination);
          bm.start(audioCtx.currentTime);
          break;
      }
    } catch (e) { /* silent fail */ }
  }

  // Sound toggle button
  soundBtn.addEventListener('click', function () {
    soundOn = !soundOn;
    soundBtn.textContent = soundOn ? '\u{1F50A}' : '\u{1F507}';
    if (bgmGain) bgmGain.gain.value = soundOn ? 0.12 : 0;
  });

  // ============================================================
  //  GAME CONSTANTS
  // ============================================================
  var GRAV     = 0.4;
  var FLAP     = -7;
  var TW       = 68;       // temple pillar width
  var GAP_BASE = 168;      // gap between top & bottom temple
  var TSPD     = 2.6;      // base temple scroll speed
  var GROUND_H = 40;

  // ============================================================
  //  GAME STATE
  // ============================================================
  var dr, temps, parts, clds, lants, birds, petals, embers;
  var sc, running, spd, fr, bgOff, mtOff;
  var comboCount, lastScoreTime, screenShake;

  function init() {
    dr = {
      x: W * 0.2, y: H * 0.45, w: 48, h: 36,
      vy: 0, rot: 0, wing: 0, tail: 0, breath: 0,
      fireBreath: 0
    };
    temps  = [];
    parts  = [];
    clds   = [];
    lants  = [];
    birds  = [];
    petals = [];
    embers = [];

    sc = 0; running = true; spd = 1; fr = 0;
    bgOff = 0; mtOff = 0;
    comboCount = 0; lastScoreTime = 0; screenShake = 0;
    scoreTxt.textContent = '0';

    var i;
    for (i = 0; i < 6; i++)
      clds.push({ x: Math.random() * W * 1.6, y: Math.random() * H * 0.4, w: 50 + Math.random() * 80, sp: 0.2 + Math.random() * 0.4, op: 0.1 + Math.random() * 0.15 });
    for (i = 0; i < 4; i++)
      lants.push({ x: Math.random() * W, y: 25 + Math.random() * H * 0.25, sz: 7 + Math.random() * 6, sw: Math.random() * 6.28, sp: 0.3 + Math.random() * 0.5 });
    for (i = 0; i < 3; i++)
      birds.push({ x: W + Math.random() * 200, y: 50 + Math.random() * H * 0.3, sp: 1.5 + Math.random(), phase: Math.random() * 6.28, sz: 3 + Math.random() * 2 });
    for (i = 0; i < 12; i++)
      petals.push({ x: Math.random() * W, y: Math.random() * H, sp: 0.5 + Math.random(), sz: 2 + Math.random() * 3, rot: Math.random() * 6.28, rsp: 0.02 + Math.random() * 0.03, drift: Math.random() * 6.28 });
    for (i = 0; i < 8; i++)
      embers.push({ x: Math.random() * W, y: H - GROUND_H - Math.random() * 60, sp: 0.3 + Math.random() * 0.8, sz: 1 + Math.random() * 2, life: Math.random() * 100, phase: Math.random() * 6.28 });
  }

  // ============================================================
  //  PLAYER ACTION — FLAP
  // ============================================================
  function doFlap() {
    if (!running) return;
    dr.vy = FLAP;
    dr.fireBreath = 12;
    playSfx('flap');

    var i;
    // Fire particles from mouth
    for (i = 0; i < 8; i++) {
      parts.push({
        x: dr.x + dr.w + 5, y: dr.y + dr.h / 2 + (Math.random() - 0.5) * 10,
        vx: 3 + Math.random() * 5, vy: (Math.random() - 0.5) * 3,
        life: 15 + Math.random() * 12, ml: 27,
        sz: 3 + Math.random() * 5, tp: 'fire', r: Math.random()
      });
    }
    // Smoke behind
    for (i = 0; i < 3; i++) {
      parts.push({
        x: dr.x - 5, y: dr.y + dr.h / 2 + (Math.random() - 0.5) * 12,
        vx: -1 - Math.random() * 2, vy: (Math.random() - 0.5) * 1.5,
        life: 20 + Math.random() * 10, ml: 30,
        sz: 4 + Math.random() * 4, tp: 'smoke', r: 0
      });
    }
    if (Math.random() < 0.3) playSfx('fire');
  }

  // ============================================================
  //  DRAWING — SKY
  // ============================================================
  function drawSky() {
    var g = ctx.createLinearGradient(0, 0, 0, H);
    var dusk = Math.min(sc * 0.02, 0.5);
    g.addColorStop(0,    lerpColor('#1a0a2e', '#0a0520', dusk));
    g.addColorStop(0.25, lerpColor('#2d1b4e', '#1a0e30', dusk));
    g.addColorStop(0.5,  lerpColor('#4a2c5e', '#2a1840', dusk));
    g.addColorStop(0.75, lerpColor('#8b4513', '#6b3010', dusk));
    g.addColorStop(1,    lerpColor('#cd853f', '#a06830', dusk));
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    // Moon
    var mx = W * 0.78, my = H * 0.12;
    var mg = ctx.createRadialGradient(mx, my, 8, mx, my, 60);
    mg.addColorStop(0,   'rgba(255,250,220,0.3)');
    mg.addColorStop(0.5, 'rgba(255,240,200,0.08)');
    mg.addColorStop(1,   'rgba(255,240,200,0)');
    ctx.fillStyle = mg;
    ctx.beginPath(); ctx.arc(mx, my, 60, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(255,250,230,0.85)';
    ctx.beginPath(); ctx.arc(mx, my, 14, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(200,200,180,0.2)';
    ctx.beginPath(); ctx.arc(mx - 3, my - 2, 4, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(mx + 5, my + 4, 2.5, 0, Math.PI * 2); ctx.fill();

    // Stars
    ctx.fillStyle = 'rgba(255,255,220,0.6)';
    for (var i = 0; i < 25; i++) {
      var sx = (i * 137.5 + fr * 0.06) % W;
      var sy = (i * 97.3 + i * i * 3.7) % (H * 0.35);
      var tw = 0.3 + Math.sin(fr * 0.08 + i * 2.1) * 0.7;
      if (tw < 0) tw = 0;
      var ss = (0.8 + Math.sin(fr * 0.05 + i) * 0.5) * tw;
      ctx.globalAlpha = tw * 0.7;
      ctx.beginPath(); ctx.arc(sx, sy, ss, 0, Math.PI * 2); ctx.fill();
      if (ss > 1) {
        ctx.strokeStyle = 'rgba(255,255,220,0.15)'; ctx.lineWidth = 0.5;
        ctx.beginPath(); ctx.moveTo(sx - ss * 3, sy); ctx.lineTo(sx + ss * 3, sy); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(sx, sy - ss * 3); ctx.lineTo(sx, sy + ss * 3); ctx.stroke();
      }
    }
    ctx.globalAlpha = 1;
  }

  // ============================================================
  //  DRAWING — MOUNTAINS
  // ============================================================
  function drawMts() {
    mtOff = (mtOff + 0.3 * spd) % (W * 0.5);
    var x;

    // Far range
    ctx.fillStyle = 'rgba(20,8,40,0.5)';
    ctx.beginPath(); ctx.moveTo(0, H);
    for (x = -mtOff; x < W + 120; x += 70)
      ctx.lineTo(x, H - 100 - Math.sin(x * 0.012) * 70 - Math.cos(x * 0.007) * 45);
    ctx.lineTo(W, H); ctx.closePath(); ctx.fill();

    // Near range with pagoda silhouettes
    ctx.fillStyle = 'rgba(35,18,25,0.6)';
    ctx.beginPath(); ctx.moveTo(0, H);
    for (x = -mtOff * 1.4; x < W + 100; x += 55) {
      var mh = H - 60 - Math.sin(x * 0.018 + 0.8) * 45 - Math.cos(x * 0.009) * 30;
      ctx.lineTo(x, mh);
      if (Math.abs(Math.sin(x * 0.031)) < 0.08) {
        ctx.lineTo(x + 3, mh - 25); ctx.lineTo(x + 6, mh - 20);
        ctx.lineTo(x + 8, mh - 35); ctx.lineTo(x + 11, mh - 20);
        ctx.lineTo(x + 14, mh);
      }
    }
    ctx.lineTo(W, H); ctx.closePath(); ctx.fill();
  }

  // ============================================================
  //  DRAWING — CLOUDS, BIRDS, PETALS, EMBERS, LANTERNS
  // ============================================================
  function drawClouds() {
    for (var i = 0; i < clds.length; i++) {
      var c = clds[i]; c.x -= c.sp * spd;
      if (c.x + c.w < -20) { c.x = W + c.w + Math.random() * 50; c.y = Math.random() * H * 0.4; }
      ctx.fillStyle = 'rgba(180,160,200,' + c.op + ')';
      ctx.beginPath(); ctx.arc(c.x, c.y, c.w / 2, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(c.x - c.w * 0.25, c.y + 4, c.w / 3, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(c.x + c.w * 0.2, c.y + 3, c.w / 3.5, 0, Math.PI * 2); ctx.fill();
    }
  }

  function drawBirds() {
    for (var i = 0; i < birds.length; i++) {
      var b = birds[i]; b.x -= b.sp * spd; b.phase += 0.08;
      if (b.x < -20) { b.x = W + 50 + Math.random() * 100; b.y = 40 + Math.random() * H * 0.3; }
      var wy = Math.sin(b.phase) * b.sz;
      ctx.strokeStyle = 'rgba(50,30,60,0.5)'; ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(b.x - b.sz * 2, b.y + wy);
      ctx.quadraticCurveTo(b.x - b.sz, b.y - b.sz + wy * 0.5, b.x, b.y);
      ctx.quadraticCurveTo(b.x + b.sz, b.y - b.sz + wy * 0.5, b.x + b.sz * 2, b.y + wy);
      ctx.stroke();
    }
  }

  function drawPetals() {
    for (var i = 0; i < petals.length; i++) {
      var p = petals[i];
      p.y += p.sp * spd; p.x += Math.sin(p.drift) * 0.5; p.drift += 0.015; p.rot += p.rsp;
      if (p.y > H + 10) { p.y = -10; p.x = Math.random() * W; }
      if (p.x < -10) p.x = W + 10;
      if (p.x > W + 10) p.x = -10;
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot);
      ctx.fillStyle = 'rgba(255,180,200,0.35)';
      ctx.beginPath();
      ctx.moveTo(0, -p.sz);
      ctx.quadraticCurveTo(p.sz, -p.sz * 0.5, p.sz * 0.5, p.sz * 0.5);
      ctx.quadraticCurveTo(0, p.sz, -p.sz * 0.5, p.sz * 0.5);
      ctx.quadraticCurveTo(-p.sz, -p.sz * 0.5, 0, -p.sz);
      ctx.fill(); ctx.restore();
    }
  }

  function drawEmbers() {
    for (var i = 0; i < embers.length; i++) {
      var e = embers[i]; e.y -= e.sp; e.x += Math.sin(e.phase + fr * 0.02) * 0.5; e.life--;
      if (e.life <= 0 || e.y < 0) { e.x = Math.random() * W; e.y = H - GROUND_H - Math.random() * 20; e.life = 60 + Math.random() * 80; }
      var a = Math.min(e.life / 30, 1) * 0.6;
      ctx.fillStyle = 'rgba(255,' + Math.floor(120 + Math.random() * 80) + ',30,' + a + ')';
      ctx.beginPath(); ctx.arc(e.x, e.y, e.sz * (e.life > 20 ? 1 : e.life / 20), 0, Math.PI * 2); ctx.fill();
    }
  }

  function drawLanterns() {
    for (var i = 0; i < lants.length; i++) {
      var l = lants[i]; l.x -= 0.9 * spd; l.sw += 0.025;
      if (l.x + l.sz < -10) { l.x = W + l.sz + Math.random() * 120; l.y = 25 + Math.random() * H * 0.25; }
      var sx = Math.sin(l.sw) * 4;

      // String
      ctx.strokeStyle = 'rgba(180,120,60,0.35)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(l.x + sx, l.y - l.sz);
      ctx.quadraticCurveTo(l.x + sx + 2, l.y - l.sz * 2, l.x + sx, l.y - l.sz * 3); ctx.stroke();

      // Glow
      var gl = ctx.createRadialGradient(l.x + sx, l.y, 0, l.x + sx, l.y, l.sz * 4);
      gl.addColorStop(0, 'rgba(255,80,20,0.2)'); gl.addColorStop(0.5, 'rgba(255,60,10,0.05)'); gl.addColorStop(1, 'rgba(255,60,10,0)');
      ctx.fillStyle = gl; ctx.beginPath(); ctx.arc(l.x + sx, l.y, l.sz * 4, 0, Math.PI * 2); ctx.fill();

      // Body
      ctx.fillStyle = '#d42020';
      ctx.beginPath();
      ctx.moveTo(l.x + sx, l.y - l.sz);
      ctx.quadraticCurveTo(l.x + sx + l.sz * 0.9, l.y - l.sz * 0.3, l.x + sx + l.sz * 0.7, l.y + l.sz * 0.3);
      ctx.quadraticCurveTo(l.x + sx, l.y + l.sz + 2, l.x + sx - l.sz * 0.7, l.y + l.sz * 0.3);
      ctx.quadraticCurveTo(l.x + sx - l.sz * 0.9, l.y - l.sz * 0.3, l.x + sx, l.y - l.sz);
      ctx.fill();

      // Inner light
      ctx.fillStyle = 'rgba(255,200,100,0.3)'; ctx.beginPath(); ctx.arc(l.x + sx, l.y, l.sz * 0.4, 0, Math.PI * 2); ctx.fill();

      // Gold caps
      ctx.fillStyle = '#f5d442';
      ctx.fillRect(l.x + sx - l.sz * 0.4, l.y - l.sz - 2, l.sz * 0.8, 3);
      ctx.fillRect(l.x + sx - l.sz * 0.35, l.y + l.sz, l.sz * 0.7, 3);

      // Tassel
      ctx.strokeStyle = '#f5d442'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(l.x + sx, l.y + l.sz + 3);
      ctx.lineTo(l.x + sx + Math.sin(l.sw * 1.5) * 2, l.y + l.sz + 8 + Math.sin(l.sw) * 2); ctx.stroke();
    }
  }

  // ============================================================
  //  DRAWING — DRAGON
  // ============================================================
  function drawDragon() {
    var d = dr;
    d.wing += 0.28; d.tail += 0.15; d.breath += 0.12;
    if (d.fireBreath > 0) d.fireBreath -= 0.5;

    ctx.save();
    ctx.translate(d.x + d.w / 2, d.y + d.h / 2);

    var tgt = d.vy * 3;
    if (tgt < -25) tgt = -25;
    if (tgt > 55) tgt = 55;
    d.rot += (tgt - d.rot) * 0.12;
    ctx.rotate(d.rot * Math.PI / 180);

    var wy = Math.sin(d.wing) * 14;
    var tx = Math.sin(d.tail) * 9;

    // Aura
    var ar = 38 + Math.sin(fr * 0.06) * 4;
    var ag = ctx.createRadialGradient(0, 0, 5, 0, 0, ar);
    ag.addColorStop(0, 'rgba(255,120,30,0.2)'); ag.addColorStop(0.6, 'rgba(255,80,10,0.05)'); ag.addColorStop(1, 'rgba(255,60,10,0)');
    ctx.fillStyle = ag; ctx.beginPath(); ctx.arc(0, 0, ar, 0, Math.PI * 2); ctx.fill();

    // Tail
    ctx.strokeStyle = '#2d8c2d'; ctx.lineWidth = 6; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(-d.w / 2, 0);
    ctx.bezierCurveTo(-d.w / 2 - 12, tx * 0.5, -d.w / 2 - 22, tx, -d.w / 2 - 30 + tx * 0.5, tx * 0.8); ctx.stroke();
    ctx.strokeStyle = '#45a845'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-d.w / 2, 0);
    ctx.bezierCurveTo(-d.w / 2 - 12, tx * 0.5, -d.w / 2 - 22, tx, -d.w / 2 - 30 + tx * 0.5, tx * 0.8); ctx.stroke();

    // Tail fin
    ctx.fillStyle = '#e74c3c'; ctx.beginPath();
    ctx.moveTo(-d.w / 2 - 28 + tx * 0.5, tx * 0.8 - 6);
    ctx.quadraticCurveTo(-d.w / 2 - 40 + tx * 0.5, tx * 0.8, -d.w / 2 - 28 + tx * 0.5, tx * 0.8 + 6);
    ctx.closePath(); ctx.fill();

    // Wings
    ctx.fillStyle = 'rgba(180,40,25,0.8)';
    ctx.beginPath(); ctx.moveTo(-6, -5);
    ctx.quadraticCurveTo(-2, -22 + wy, 18, -26 + wy); ctx.lineTo(12, -18 + wy * 0.7);
    ctx.lineTo(6, -14 + wy * 0.5); ctx.quadraticCurveTo(2, -8, -3, -5); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(140,30,20,0.5)'; ctx.lineWidth = 0.7;
    ctx.beginPath(); ctx.moveTo(-2, -8); ctx.lineTo(8, -18 + wy * 0.6);
    ctx.moveTo(1, -9); ctx.lineTo(14, -22 + wy * 0.8); ctx.stroke();

    ctx.fillStyle = 'rgba(180,40,25,0.8)';
    ctx.beginPath(); ctx.moveTo(-6, 5);
    ctx.quadraticCurveTo(-2, 22 - wy, 18, 26 - wy); ctx.lineTo(12, 18 - wy * 0.7);
    ctx.lineTo(6, 14 - wy * 0.5); ctx.quadraticCurveTo(2, 8, -3, 5); ctx.closePath(); ctx.fill();

    // Body
    var bg = ctx.createLinearGradient(0, -d.h / 2, 0, d.h / 2);
    bg.addColorStop(0, '#3cb043'); bg.addColorStop(0.4, '#2d8c2d'); bg.addColorStop(1, '#1a6b1a');
    ctx.fillStyle = bg; ctx.beginPath(); ctx.arc(0, 0, d.w / 2.2, 0, Math.PI * 2); ctx.fill();

    // Scales + belly
    ctx.fillStyle = 'rgba(26,107,26,0.5)';
    var si; for (si = -2; si <= 2; si++) { ctx.beginPath(); ctx.arc(si * 5 - 1, -3, 4, 0, Math.PI); ctx.fill(); }
    ctx.fillStyle = 'rgba(245,212,66,0.45)';
    for (si = -2; si <= 2; si++) { ctx.beginPath(); ctx.arc(si * 5, 4, 3.5, 0, Math.PI); ctx.fill(); }

    // Head
    var hg = ctx.createRadialGradient(d.w / 2 - 1, -2, 3, d.w / 2 - 1, -2, 14);
    hg.addColorStop(0, '#45b545'); hg.addColorStop(1, '#1a6b1a');
    ctx.fillStyle = hg; ctx.beginPath(); ctx.arc(d.w / 2 - 1, -2, 13, 0, Math.PI * 2); ctx.fill();

    // Snout
    ctx.fillStyle = '#2d8c2d'; ctx.beginPath(); ctx.arc(d.w / 2 + 8, 0, 6, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#1a5a1a';
    ctx.beginPath(); ctx.arc(d.w / 2 + 12, -2, 1.5, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(d.w / 2 + 12, 2, 1.5, 0, Math.PI * 2); ctx.fill();

    // Horns
    ctx.fillStyle = '#f5d442';
    ctx.beginPath(); ctx.moveTo(d.w / 2 - 6, -10); ctx.lineTo(d.w / 2 - 10, -22); ctx.lineTo(d.w / 2 - 2, -12); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(d.w / 2 + 1, -9); ctx.lineTo(d.w / 2 - 1, -20); ctx.lineTo(d.w / 2 + 6, -11); ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(255,240,180,0.4)';
    ctx.beginPath(); ctx.moveTo(d.w / 2 - 8, -16); ctx.lineTo(d.w / 2 - 9, -20); ctx.lineTo(d.w / 2 - 6, -14); ctx.closePath(); ctx.fill();

    // Eye
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(d.w / 2 + 3, -5, 4.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#e74c3c'; ctx.beginPath(); ctx.arc(d.w / 2 + 4.5, -5, 2.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#111'; ctx.beginPath();
    ctx.moveTo(d.w / 2 + 4.5, -7.5); ctx.quadraticCurveTo(d.w / 2 + 6, -5, d.w / 2 + 4.5, -2.5);
    ctx.quadraticCurveTo(d.w / 2 + 4, -5, d.w / 2 + 4.5, -7.5); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.beginPath(); ctx.arc(d.w / 2 + 3, -6, 1.2, 0, Math.PI * 2); ctx.fill();

    // Fire breath cone
    if (d.fireBreath > 2) {
      var fl = d.fireBreath * 3;
      var fg = ctx.createLinearGradient(d.w / 2 + 14, 0, d.w / 2 + 14 + fl, 0);
      fg.addColorStop(0, 'rgba(255,255,100,0.9)'); fg.addColorStop(0.3, 'rgba(255,150,30,0.7)');
      fg.addColorStop(0.7, 'rgba(255,60,10,0.4)'); fg.addColorStop(1, 'rgba(255,30,0,0)');
      ctx.fillStyle = fg; ctx.beginPath();
      ctx.moveTo(d.w / 2 + 14, -3);
      ctx.quadraticCurveTo(d.w / 2 + 14 + fl * 0.5, -fl * 0.3, d.w / 2 + 14 + fl, 0);
      ctx.quadraticCurveTo(d.w / 2 + 14 + fl * 0.5, fl * 0.3, d.w / 2 + 14, 3);
      ctx.closePath(); ctx.fill();
    }

    // Spikes
    ctx.fillStyle = '#e74c3c';
    for (si = -3; si <= 2; si++) {
      ctx.beginPath(); ctx.moveTo(si * 7 - 2, -d.h / 2.4);
      ctx.lineTo(si * 7 + 1, -d.h / 2.4 - 6 - Math.sin(d.wing + si) * 2);
      ctx.lineTo(si * 7 + 4, -d.h / 2.4); ctx.closePath(); ctx.fill();
    }

    ctx.restore();
  }

  // ============================================================
  //  DRAWING — TEMPLE PILLARS
  // ============================================================
  function drawRoof(x, y, w, h) {
    ctx.fillStyle = '#141428'; ctx.beginPath();
    ctx.moveTo(x - 4, y + h); ctx.quadraticCurveTo(x + w * 0.08, y - 2, x + w / 2, y - 5);
    ctx.quadraticCurveTo(x + w * 0.92, y - 2, x + w + 4, y + h); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#f5d442'; ctx.lineWidth = 1.8; ctx.beginPath();
    ctx.moveTo(x - 4, y + h); ctx.quadraticCurveTo(x + w * 0.08, y - 2, x + w / 2, y - 5);
    ctx.quadraticCurveTo(x + w * 0.92, y - 2, x + w + 4, y + h); ctx.stroke();
    ctx.fillStyle = '#f5d442';
    ctx.beginPath(); ctx.arc(x - 5, y + h, 3, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(x + w + 5, y + h, 3, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(x + w / 2, y - 6, 2.5, 0, Math.PI * 2); ctx.fill();
  }

  function drawPillar(x, y, w, h, isTop) {
    if (h <= 0) return;
    var pg = ctx.createLinearGradient(x, y, x + w, y);
    pg.addColorStop(0, '#6b0000'); pg.addColorStop(0.15, '#a01010'); pg.addColorStop(0.35, '#cd2626');
    pg.addColorStop(0.5, '#e74c3c'); pg.addColorStop(0.65, '#cd2626'); pg.addColorStop(0.85, '#a01010'); pg.addColorStop(1, '#6b0000');
    ctx.fillStyle = pg; ctx.fillRect(x, y, w, h);

    // Gold bands
    ctx.fillStyle = '#f5d442'; var by;
    for (by = (isTop ? y + h - (h % 35) : y); by < y + h && by >= y; by += 35) {
      ctx.fillRect(x, by, w, 3);
      ctx.fillStyle = '#b8941e'; var dx;
      for (dx = x + 7; dx < x + w - 4; dx += 10) { ctx.beginPath(); ctx.arc(dx, by + 1.5, 1, 0, Math.PI * 2); ctx.fill(); }
      ctx.fillStyle = '#f5d442';
    }

    // Dragon relief
    if (h > 120) {
      ctx.strokeStyle = 'rgba(245,212,66,0.15)'; ctx.lineWidth = 1.5;
      var my0 = isTop ? y + 25 : y + h - 55; ctx.beginPath();
      for (var my = 0; my < 30; my += 1.5) {
        var mx2 = Math.sin(my * 0.35) * 9;
        if (my === 0) ctx.moveTo(x + w / 2 + mx2, my0 + my); else ctx.lineTo(x + w / 2 + mx2, my0 + my);
      }
      ctx.stroke();
    }

    // Roofs
    var cH = 18;
    if (isTop) {
      drawRoof(x - 12, y + h - 5, w + 24, cH);
      if (h > 80)  drawRoof(x - 7, y + h - 48, w + 14, cH * 0.7);
      if (h > 160) drawRoof(x - 9, y + h - 90, w + 18, cH * 0.75);
    } else {
      drawRoof(x - 12, y - cH + 5, w + 24, cH);
      if (h > 80)  drawRoof(x - 7, y + 43 - cH * 0.7, w + 14, cH * 0.7);
      if (h > 160) drawRoof(x - 9, y + 85 - cH * 0.75, w + 18, cH * 0.75);
    }

    // Moon gate window
    if (h > 95) {
      var wy = isTop ? y + h - 70 : y + 32;
      ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.beginPath(); ctx.arc(x + w / 2, wy, 11, 0, Math.PI * 2); ctx.fill();
      var wg = ctx.createRadialGradient(x + w / 2, wy, 1, x + w / 2, wy, 11);
      wg.addColorStop(0, 'rgba(255,200,80,0.5)'); wg.addColorStop(1, 'rgba(255,200,80,0)');
      ctx.fillStyle = wg; ctx.beginPath(); ctx.arc(x + w / 2, wy, 11, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#f5d442'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(x + w / 2, wy, 11, 0, Math.PI * 2); ctx.stroke();
      ctx.strokeStyle = 'rgba(245,212,66,0.35)'; ctx.lineWidth = 0.8; ctx.beginPath();
      ctx.moveTo(x + w / 2 - 11, wy); ctx.lineTo(x + w / 2 + 11, wy);
      ctx.moveTo(x + w / 2, wy - 11); ctx.lineTo(x + w / 2, wy + 11); ctx.stroke();
    }
  }

  function drawTemple(t) {
    drawPillar(t.x, 0, TW, t.gy, true);
    drawPillar(t.x, t.gy + t.gs, TW, H - t.gy - t.gs - GROUND_H, false);
  }

  // ============================================================
  //  DRAWING — PARTICLES
  // ============================================================
  function drawParts() {
    var np = [], i, p, a;
    for (i = 0; i < parts.length; i++) {
      p = parts[i]; p.x += p.vx; p.y += p.vy; p.life--;
      if (p.life <= 0) continue;
      a = p.life / p.ml;

      if (p.tp === 'fire') {
        var hue = p.r < 0.3 ? '#ffee00' : (p.r < 0.6 ? '#ff8800' : '#ff3300');
        ctx.fillStyle = hue; ctx.globalAlpha = a * 0.8;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.sz * a, 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = a * 0.2;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.sz * a * 2.5, 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = 1;
      } else if (p.tp === 'smoke') {
        ctx.fillStyle = 'rgba(120,120,140,' + (a * 0.3) + ')';
        ctx.beginPath(); ctx.arc(p.x, p.y, p.sz * (1.5 - a * 0.5), 0, Math.PI * 2); ctx.fill();
      } else if (p.tp === 'boom') {
        ctx.fillStyle = 'rgba(255,' + Math.floor(80 + Math.random() * 120) + ',20,' + a + ')';
        ctx.beginPath(); ctx.arc(p.x, p.y, p.sz * (1.2 - a * 0.4), 0, Math.PI * 2); ctx.fill();
      } else if (p.tp === 'spark') {
        ctx.fillStyle = 'rgba(255,230,100,' + a + ')';
        ctx.beginPath(); ctx.arc(p.x, p.y, p.sz * a, 0, Math.PI * 2); ctx.fill();
      } else if (p.tp === 'scorePopup') {
        ctx.fillStyle = 'rgba(245,212,66,' + a + ')';
        ctx.font = Math.floor(18 + p.sz) + 'px Georgia'; ctx.textAlign = 'center';
        ctx.fillText('+1', p.x, p.y);
      }
      np.push(p);
    }
    parts = np;
  }

  // ============================================================
  //  DRAWING — GROUND
  // ============================================================
  function drawGround() {
    bgOff = (bgOff + 2.2 * spd) % 40;
    var gg = ctx.createLinearGradient(0, H - GROUND_H, 0, H);
    gg.addColorStop(0, '#5a3410'); gg.addColorStop(0.3, '#4a2c0a'); gg.addColorStop(1, '#2a1a05');
    ctx.fillStyle = gg; ctx.fillRect(0, H - GROUND_H, W, GROUND_H);
    ctx.strokeStyle = 'rgba(245,212,66,0.08)'; ctx.lineWidth = 1;
    for (var gx = -bgOff; gx < W; gx += 40) {
      ctx.beginPath(); ctx.moveTo(gx, H - GROUND_H); ctx.lineTo(gx + 20, H); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(gx + 20, H - GROUND_H); ctx.lineTo(gx + 40, H); ctx.stroke();
    }
    ctx.fillStyle = '#f5d442'; ctx.fillRect(0, H - GROUND_H - 1, W, 2.5);
    ctx.fillStyle = 'rgba(245,212,66,0.3)'; ctx.fillRect(0, H - GROUND_H + 4, W, 1);
  }

  // ============================================================
  //  UTILITY
  // ============================================================
  function lerpColor(c1, c2, t) {
    var r1 = parseInt(c1.substr(1, 2), 16), g1 = parseInt(c1.substr(3, 2), 16), b1 = parseInt(c1.substr(5, 2), 16);
    var r2 = parseInt(c2.substr(1, 2), 16), g2 = parseInt(c2.substr(3, 2), 16), b2 = parseInt(c2.substr(5, 2), 16);
    var r = Math.floor(r1 + (r2 - r1) * t), g = Math.floor(g1 + (g2 - g1) * t), b = Math.floor(b1 + (b2 - b1) * t);
    return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  }

  function showCombo(count) {
    if (count < 2) { comboEl.style.opacity = '0'; return; }
    comboEl.textContent = count + 'x Combo!';
    comboEl.style.opacity = '1';
    comboEl.style.transform = 'translateX(-50%) scale(1.2)';
    setTimeout(function () { comboEl.style.transform = 'translateX(-50%) scale(1)'; }, 150);
  }

  // ============================================================
  //  SPAWNING & COLLISION
  // ============================================================
  function spawn() {
    var minG = 75, maxG = H - GAP_BASE - 75 - GROUND_H;
    if (maxG < minG) maxG = minG + 50;
    var gy = minG + Math.random() * (maxG - minG);
    var gs = GAP_BASE - sc; if (gs < 120) gs = 120;
    temps.push({ x: W + 20, gy: gy, gs: gs, scored: false, sp: TSPD + sc * 0.035 });
  }

  function collide() {
    var d = dr, dx = d.x + 9, dy = d.y + 7, dw = d.w - 18, dh = d.h - 14;
    if (d.y + d.h > H - GROUND_H || d.y < 0) return true;
    for (var i = 0; i < temps.length; i++) {
      var t = temps[i];
      if (dx + dw > t.x && dx < t.x + TW) {
        if (dy < t.gy || dy + dh > t.gy + t.gs) return true;
      }
    }
    return false;
  }

  function explode() {
    var i, ang, sp2;
    for (i = 0; i < 35; i++) {
      ang = (Math.PI * 2 * i) / 35; sp2 = 2 + Math.random() * 6;
      parts.push({ x: dr.x + dr.w / 2, y: dr.y + dr.h / 2, vx: Math.cos(ang) * sp2, vy: Math.sin(ang) * sp2, life: 20 + Math.random() * 20, ml: 40, sz: 2 + Math.random() * 5, tp: 'boom', r: 0 });
    }
    for (i = 0; i < 15; i++) {
      ang = Math.random() * Math.PI * 2; sp2 = 1 + Math.random() * 8;
      parts.push({ x: dr.x + dr.w / 2, y: dr.y + dr.h / 2, vx: Math.cos(ang) * sp2, vy: Math.sin(ang) * sp2 - 3, life: 30 + Math.random() * 15, ml: 45, sz: 1 + Math.random() * 2, tp: 'spark', r: 0 });
    }
    screenShake = 12;
    playSfx('die');
  }

  // ============================================================
  //  MAIN GAME LOOP
  // ============================================================
  function loop() {
    if (!running) return;
    fr++;

    ctx.save();
    if (screenShake > 0) {
      ctx.translate((Math.random() - 0.5) * screenShake, (Math.random() - 0.5) * screenShake);
      screenShake *= 0.85; if (screenShake < 0.5) screenShake = 0;
    }
    ctx.clearRect(-10, -10, W + 20, H + 20);

    drawSky(); drawMts(); drawClouds(); drawBirds(); drawLanterns(); drawPetals();

    // Spawn
    var rate = 90 - sc * 2; if (rate < 50) rate = 50;
    if (fr % rate === 0 || temps.length === 0) spawn();

    // Temples
    var nt = [], i, t;
    for (i = 0; i < temps.length; i++) {
      t = temps[i]; t.x -= t.sp * spd; drawTemple(t);
      if (!t.scored && t.x + TW < dr.x) {
        t.scored = true; sc++;
        scoreTxt.textContent = sc;
        scoreTxt.classList.add('pop');
        setTimeout(function () { scoreTxt.classList.remove('pop'); }, 150);
        spd = 1 + sc * 0.015;
        playSfx('score');
        var now = Date.now();
        if (now - lastScoreTime < 3000) comboCount++; else comboCount = 1;
        lastScoreTime = now; showCombo(comboCount);
        parts.push({ x: dr.x + dr.w, y: dr.y - 10, vx: 0, vy: -1.5, life: 30, ml: 30, sz: 4, tp: 'scorePopup', r: 0 });
        for (var j = 0; j < 6; j++)
          parts.push({ x: dr.x + dr.w / 2, y: dr.y + dr.h / 2, vx: (Math.random() - 0.5) * 4, vy: (Math.random() - 0.5) * 4, life: 15 + Math.random() * 10, ml: 25, sz: 1.5 + Math.random() * 2, tp: 'spark', r: 0 });
      }
      if (t.x + TW > -20) nt.push(t);
    }
    temps = nt;

    // Dragon physics
    dr.vy += GRAV; dr.y += dr.vy;
    drawDragon(); drawEmbers(); drawParts(); drawGround();
    ctx.restore();

    // Collision
    if (collide()) {
      running = false; explode();
      var deathFrames = 0;
      function deathAnim() {
        if (deathFrames > 20) {
          if (sc > best) best = sc;
          finalEl.textContent = sc; bestEl.textContent = 'En Iyi: ' + best;
          goScreen.classList.add('show'); comboEl.style.opacity = '0'; return;
        }
        deathFrames++;
        ctx.save();
        if (screenShake > 0) { ctx.translate((Math.random() - 0.5) * screenShake, (Math.random() - 0.5) * screenShake); screenShake *= 0.85; }
        ctx.clearRect(-10, -10, W + 20, H + 20);
        drawSky(); drawMts(); drawClouds(); drawLanterns(); drawPetals();
        for (var k = 0; k < temps.length; k++) drawTemple(temps[k]);
        drawEmbers(); drawParts(); drawGround(); ctx.restore();
        requestAnimationFrame(deathAnim);
      }
      requestAnimationFrame(deathAnim);
      return;
    }

    requestAnimationFrame(loop);
  }

  // ============================================================
  //  INPUT HANDLING
  // ============================================================
  function handleInput(e) {
    if (e && e.preventDefault) e.preventDefault();
    if (!running) return;
    doFlap();
  }

  cv.addEventListener('mousedown', function (e) { handleInput(e); }, false);
  cv.addEventListener('touchstart', function (e) { handleInput(e); }, { passive: false });
  document.addEventListener('keydown', function (e) {
    if (e.code === 'Space' || e.code === 'ArrowUp' || e.keyCode === 32 || e.keyCode === 38) {
      e.preventDefault(); handleInput(null);
    }
  }, false);

  // ============================================================
  //  BUTTON EVENTS
  // ============================================================
  document.getElementById('startBtn').addEventListener('click', function () {
    initAudio(); overlay.classList.add('hidden');
    init(); playBGM(); requestAnimationFrame(loop);
  }, false);

  document.getElementById('restartBtn').addEventListener('click', function () {
    goScreen.classList.remove('show');
    init(); requestAnimationFrame(loop);
  }, false);

  // ============================================================
  //  INITIAL RENDER (title screen background)
  // ============================================================
  init();
  drawSky(); drawMts(); drawClouds(); drawPetals(); drawGround(); drawLanterns();

})();
