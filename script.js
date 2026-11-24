
(() => {
  const scenes = [...document.querySelectorAll('.scene')];
  const bar = document.getElementById('bar');

  const counter = document.getElementById('counter');
  const time = document.getElementById('time');

  const playBtn = document.getElementById('play');
  const soundBtn = document.getElementById('sound');

  let elapsed = 0;
  let playing = true;
  let sound = true;
  let last = performance.now();
  let audio = null;
  let lastScene = -1;

  const duration = 60;

  // AUDIO ENGINE
  function audioCtx() {
    if (!audio) {
      const C = window.AudioContext || window.webkitAudioContext;
      if (C) audio = new C();
    }

    if (audio?.state === 'suspended') {
      audio.resume();
    }

    return audio;
  }

  // SOUND GENERATOR
  function tone(
    freq, when, len,
    type = 'sine',
    gain = .05,
    endFreq = null
  ) {
    const a = audioCtx();
    if (!a) return;

    const o = a.createOscillator();
    const g = a.createGain();

    o.type = type;
    o.frequency.setValueAtTime(freq, when);

    if (endFreq) {
      o.frequency.exponentialRampToValueAtTime(
        endFreq,
        when + len
      );
    }

    g.gain.setValueAtTime(.0001, when);
    g.gain.exponentialRampToValueAtTime(gain, when + .04);
    g.gain.exponentialRampToValueAtTime(.0001, when + len);

    o.connect(g);
    g.connect(a.destination);

    o.start(when);
    o.stop(when + len + .03);
  }

  // TRANSITION SOUND
  function whoosh() {
    const a = audioCtx();
    if (!a) return;

    const t = a.currentTime;

    tone(180, t, .75, 'sawtooth', .018, 55);
    tone(520, t + .05, .55, 'sine', .012, 160);
  }

  // CINEMATIC ACCENT
  function accent() {
    const a = audioCtx();
    if (!a) return;

    const t = a.currentTime;

    tone(392, t, .8, 'sine', .035);
    tone(587.33, t + .12, 1.0, 'sine', .025);
    tone(783.99, t + .24, 1.1, 'sine', .018);

    tone(65, t, .45, 'sine', .035, 38);
  }

  // SCENE TRANSITIONS
  function transition(i) {
    if (i !== lastScene) {
      if (sound) {
        if (i === 0) accent();
        else whoosh();

        if (i === 2 || i === 5) accent();
      }

      lastScene = i;
    }
  }

  // UPDATE SCREEN
  function render() {
    const index = Math.min(
      5,
      Math.floor(elapsed / 10)
    );

    scenes.forEach((s, i) => {
      s.classList.toggle('active', i === index);
    });

    counter.textContent =
      String(index + 1).padStart(2, '0') + ' — 06';

    bar.style.width =
      (elapsed / duration * 100) + '%';

    const sec = Math.floor(elapsed);

    time.textContent =
      `${String(Math.floor(sec / 60)).padStart(2, '0')}:${String(sec % 60).padStart(2, '0')} / 01:00`;

    transition(index);
  }

  // MAIN ANIMATION LOOP
  function frame(now) {
    const dt = Math.min(.05, (now - last) / 1000);

    last = now;

    if (playing) {
      elapsed += dt;

      if (elapsed >= duration) {
        elapsed = duration;
        playing = false;
        playBtn.textContent = '▶ PLAY';
      }

      render();
    }

    requestAnimationFrame(frame);
  }

  // PLAY / PAUSE
  playBtn.addEventListener('click', () => {
    playing = !playing;
    last = performance.now();

    playBtn.textContent =
      playing ? 'Ⅱ PAUSE' : '▶ PLAY';

    if (playing && sound) whoosh();

    audioCtx();
  });

  // SOUND CONTROL
  soundBtn.addEventListener('click', () => {
    sound = !sound;

    soundBtn.textContent =
      '♫ SOUND: ' + (sound ? 'ON' : 'OFF');

    if (sound) accent();

    audioCtx();
  });

  // RESTART
  document.getElementById('restart')
    .addEventListener('click', () => {
      elapsed = 0;
      lastScene = -1;
      playing = true;

      playBtn.textContent = 'Ⅱ PAUSE';
      last = performance.now();

      if (sound) accent();

      render();
    });

  // START
  render();
  requestAnimationFrame(frame);

})();
