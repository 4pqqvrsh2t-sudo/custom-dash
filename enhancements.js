'use strict';
// Optional presentation layer; no network requests or character recordings.
(() => {
  const synth = window.speechSynthesis;
  let options = {voice:true, animations:true, voiceURI:''}, voices = [], scannerZoom = 1;
  try { Object.assign(options, JSON.parse(localStorage.getItem('surface-feedback') || '{}')); } catch {}
  options.voice = options.voice === true;
  options.animations = options.animations !== false;
  const save = () => { try { localStorage.setItem('surface-feedback', JSON.stringify(options)); } catch {} };
  const status = $('#voice-status');
  function apply() {
    $('#voice').checked = options.voice;
    $('#animations').checked = options.animations;
    document.body.classList.toggle('no-animations', !options.animations);
    save();
  }
  function populateVoices() {
    if (!synth) { status.textContent = 'Speech is unavailable in this browser. Visual prompts remain enabled.'; $('#voice').disabled = true; $('#test-voice').disabled = true; return; }
    voices = synth.getVoices();
    $('#voice-select').replaceChildren(new Option('Automatic ship computer', ''));
    voices.forEach(v => $('#voice-select').add(new Option(v.name + ' / ' + v.lang, v.voiceURI)));
    $('#voice-select').value = voices.some(v => v.voiceURI === options.voiceURI) ? options.voiceURI : '';
  }
  function speak(message) {
    if (!options.voice || !synth || document.hidden) return;
    synth.cancel(); // Latest event wins; never build a stale navigation queue.
    const utterance = new SpeechSynthesisUtterance(message);
    const selected = voices.find(v => v.voiceURI === options.voiceURI) || voices.find(v => /^en/i.test(v.lang) && /Daniel|David|Alex|George|James|Oliver/i.test(v.name)) || voices.find(v => /^en/i.test(v.lang));
    if (selected) { utterance.voice = selected; utterance.lang = selected.lang; }
    else utterance.lang = 'en-US';
    utterance.pitch = .72; utterance.rate = .87; utterance.volume = prefs.volume / 100;
    utterance.onstart = () => { status.textContent = 'VOICE / ' + message.toUpperCase(); document.body.classList.add('voice-active'); };
    utterance.onend = () => { document.body.classList.remove('voice-active'); status.textContent = 'Voice channel ready.'; };
    utterance.onerror = e => { document.body.classList.remove('voice-active'); if (!['interrupted','canceled'].includes(e.error)) status.textContent = 'Voice could not play. Try TEST VOICE or choose another device voice.'; };
    synth.speak(utterance);
  }
  function cue(type = 'tap') {
    if (!prefs.sounds || document.hidden) return;
    try {
      const c = audioContext(); c.resume().catch(() => {});
      const notes = type === 'engage' ? [82,123,164] : type === 'lock' ? [196,98] : type === 'zoom' ? [110,146] : type === 'port' ? [73,110,147] : [130,65];
      notes.forEach((frequency,i) => {
        const start = c.currentTime + i * .065, o = c.createOscillator(), g = c.createGain();
        o.type = i % 2 ? 'sine' : 'triangle'; o.frequency.setValueAtTime(frequency,start); o.frequency.exponentialRampToValueAtTime(frequency * .55,start + .18);
        g.gain.setValueAtTime(0,start); g.gain.linearRampToValueAtTime(.07 * prefs.volume / 100,start + .008); g.gain.exponentialRampToValueAtTime(.0001,start + .22);
        o.connect(g).connect(c.destination); o.start(start); o.stop(start + .23); o.onended = () => { o.disconnect(); g.disconnect(); };
      });
    } catch {}
  }
  document.addEventListener('click', e => {
    const button = e.target.closest('button');
    if (!button || button.disabled) return;
    cue(button.dataset.view === 'port' || /connect-port/.test(button.id) ? 'port' : button.id === 'route-toggle' ? 'engage' : /zoom|scanner/.test(button.id) ? 'zoom' : 'tap');
    button.classList.remove('hud-pressed');
    if (options.animations && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
      button.animate([{filter:'brightness(1.8)'},{filter:'brightness(1)'}],{duration:260});
    }
  });
  $('#sounds').addEventListener('change', () => cue('lock'));
  $('#voice').addEventListener('change', e => { options.voice = e.target.checked; apply(); if (options.voice) speak('Voice interface online.'); else if (synth) { synth.cancel(); document.body.classList.remove('voice-active'); } });
  $('#animations').addEventListener('change', e => { options.animations = e.target.checked; apply(); });
  $('#voice-select').addEventListener('change', e => { options.voiceURI = e.target.value; save(); });
  $('#test-voice').addEventListener('click', () => { options.voice = true; apply(); speak('Starting route. Navigation systems online.'); });
  $('#route-toggle').addEventListener('click', () => speak(routeRunning ? routeProgress === 0 ? 'Starting route.' : 'Resuming route.' : 'Route paused.'));
  const routeObserver = new MutationObserver(() => {
    document.body.classList.toggle('route-active', routeRunning);
    if ($('#route-state').textContent === 'DESTINATION REACHED') { cue('lock'); speak('Destination reached. Route complete.'); }
  });
  routeObserver.observe($('#route-state'), {childList:true});
  const tunerObserver = new MutationObserver(() => { if (!scanning && $('#tuner-state').textContent === 'SIGNAL LOCKED') cue('lock'); });
  tunerObserver.observe($('#tuner-state'), {childList:true});
  function renderScanner() {
    $('#scanner-world').style.transform = `translate(${180 - 180 * scannerZoom}px, ${110 - 110 * scannerZoom}px) scale(${scannerZoom})`;
    $('#scanner-range').textContent = (2 / scannerZoom).toFixed(1) + ' MI';
    $('#scanner-reset').textContent = scannerZoom.toFixed(1) + '× RANGE';
    $('#scanner-in').disabled = scannerZoom >= 4; $('#scanner-out').disabled = scannerZoom <= .5;
    $('#scanner-svg').setAttribute('aria-label', `Simulated proximity scanner, ${(2 / scannerZoom).toFixed(1)} mile range, ${scannerZoom} times zoom`);
  }
  $('#scanner-in').onclick = () => { scannerZoom = Math.min(4, scannerZoom + .5); renderScanner(); };
  $('#scanner-out').onclick = () => { scannerZoom = Math.max(.5, scannerZoom - .5); renderScanner(); };
  $('#scanner-reset').onclick = () => { scannerZoom = 1; renderScanner(); };
  document.addEventListener('visibilitychange', () => { if (document.hidden && synth) { synth.cancel(); document.body.classList.remove('voice-active'); } });
  apply(); populateVoices(); renderScanner();
  if (synth) synth.addEventListener('voiceschanged', populateVoices);
})();
