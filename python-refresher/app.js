const STORAGE_KEY = 'pyrecall-state-v1';

const conceptCatalog = [
  { id: 'print', name: 'print()', desc: 'Display text and values.', defaultOn: true },
  { id: 'variables', name: 'Variables', desc: 'Store and update values.', defaultOn: true },
  { id: 'strings', name: 'Strings', desc: 'Text, quotes, concatenation, f-strings.', defaultOn: true },
  { id: 'numbers', name: 'Numbers', desc: 'Integers, floats, arithmetic, conversions.', defaultOn: true },
  { id: 'input', name: 'input()', desc: 'Read text entered by a user.', defaultOn: true },
  { id: 'booleans', name: 'Booleans', desc: 'True, False, and simple logic.', defaultOn: true },
  { id: 'comparisons', name: 'Comparisons', desc: '==, !=, >, <, >=, <=.', defaultOn: true },
  { id: 'if', name: 'if / elif / else', desc: 'Branch based on a condition.', defaultOn: true },
  { id: 'lists', name: 'Lists', desc: 'Store ordered groups of values.', defaultOn: false },
  { id: 'loops', name: 'Loops', desc: 'Repeat work with for and while.', defaultOn: false },
  { id: 'functions', name: 'Functions', desc: 'Package reusable behavior with def.', defaultOn: false },
  { id: 'dicts', name: 'Dictionaries', desc: 'Store key/value pairs.', defaultOn: false },
];

const questionBank = [
  { id:'p1', c:'print', tier:1, type:'choice', prompt:'What does this line do?', code:'print("HUD ready")', options:['Stores the text','Displays HUD ready','Asks for input','Creates a variable'], answer:'Displays HUD ready', why:'print() sends a value to the output.' },
  { id:'p2', c:'print', tier:2, type:'typed', prompt:'Make this print the number 55 instead of 35.', code:'print(35)', answer:'print(55)', normalize:'code', why:'Replace the argument inside print() with 55.' },
  { id:'p3', c:'print', tier:3, type:'typed', prompt:'Write one line that displays Speed: 42', answer:'print("Speed: 42")', accepts:['print("Speed: 42")',"print('Speed: 42')"], normalize:'code', why:'Pass the text you want displayed into print().' },

  { id:'v1', c:'variables', tier:1, type:'choice', prompt:'After this runs, what is speed?', code:'speed = 35\nspeed = 42', options:['35','42','speed','Error'], answer:'42', why:'The second assignment replaces the first value.' },
  { id:'v2', c:'variables', tier:2, type:'typed', prompt:'Change this so mph stores 50.', code:'mph = 20', answer:'mph = 50', normalize:'code', why:'Assignment uses variable = value.' },
  { id:'v3', c:'variables', tier:3, type:'typed', prompt:'Write two lines: store 45 in speed, then increase speed by 5.', answer:'speed = 45\nspeed = speed + 5', accepts:['speed=45\nspeed=speed+5','speed = 45\nspeed += 5','speed=45\nspeed+=5'], normalize:'code', why:'Assign first, then update the same variable.' },

  { id:'s1', c:'strings', tier:1, type:'choice', prompt:'Which value is a string?', options:['42','3.14','"42"','True'], answer:'"42"', why:'Quotes make text a string, even when the text looks numeric.' },
  { id:'s2', c:'strings', tier:2, type:'choice', prompt:'What prints?', code:'road = "Main"\nprint(road + " St")', options:['road St','Main St','Main+St','Error'], answer:'Main St', why:'The + joins two strings.' },
  { id:'s3', c:'strings', tier:3, type:'typed', prompt:'Use an f-string to display Speed: 47 using the variable speed.', code:'speed = 47', answer:'print(f"Speed: {speed}")', accepts:['print(f"Speed: {speed}")',"print(f'Speed: {speed}')"], normalize:'code', why:'An f-string lets you place a variable inside braces.' },

  { id:'n1', c:'numbers', tier:1, type:'choice', prompt:'What is the result?', code:'10 + 5 * 2', options:['30','20','25','15'], answer:'20', why:'Multiplication happens before addition.' },
  { id:'n2', c:'numbers', tier:2, type:'typed', prompt:'Change the expression so mph becomes 60.', code:'mph = 30 + 20', answer:'mph = 30 + 30', accepts:['mph=30+30','mph = 60','mph=60'], normalize:'code', why:'Any correct assignment that makes mph equal 60 works.' },
  { id:'n3', c:'numbers', tier:3, type:'typed', prompt:'Convert the text "55" to an integer and store it in speed.', answer:'speed = int("55")', accepts:['speed=int("55")',"speed = int('55')","speed=int('55')"], normalize:'code', why:'int() converts numeric text into an integer.' },

  { id:'i1', c:'input', tier:1, type:'choice', prompt:'What type does input() return by default?', options:['String','Integer','Float','Boolean'], answer:'String', why:'input() returns text unless you convert it.' },
  { id:'i2', c:'input', tier:2, type:'typed', prompt:'Ask the user for their speed and store the response in speed.', answer:'speed = input("Speed: ")', accepts:['speed=input("Speed: ")',"speed = input('Speed: ')","speed=input('Speed: ')", 'speed = input("Speed:")','speed=input("Speed:")'], normalize:'code', why:'input() can show a prompt and returns the entered text.' },
  { id:'i3', c:'input', tier:3, type:'typed', prompt:'Ask for speed and immediately convert the answer to an integer.', answer:'speed = int(input("Speed: "))', accepts:['speed=int(input("Speed: "))',"speed = int(input('Speed: '))","speed=int(input('Speed: '))"], normalize:'code', why:'Wrap input() with int() when you need a whole number.' },

  { id:'b1', c:'booleans', tier:1, type:'choice', prompt:'Which two values are Python booleans?', options:['yes / no','1 / 0','True / False','true / false'], answer:'True / False', why:'Python booleans are capitalized: True and False.' },
  { id:'b2', c:'booleans', tier:2, type:'choice', prompt:'What value does speeding hold?', code:'speed = 60\nspeeding = speed > 55', options:['60','55','True','False'], answer:'True', why:'60 > 55 evaluates to True.' },
  { id:'b3', c:'booleans', tier:3, type:'typed', prompt:'Store whether speed is exactly 45 in a variable named exact.', code:'speed = 45', answer:'exact = speed == 45', normalize:'code', why:'Use == to compare; = assigns.' },

  { id:'c1', c:'comparisons', tier:1, type:'choice', prompt:'Which operator asks “is equal to?”', options:['=','==','!=','>='], answer:'==', why:'== compares equality. = assigns a value.' },
  { id:'c2', c:'comparisons', tier:2, type:'choice', prompt:'What does this evaluate to?', code:'35 != 40', options:['True','False','35','Error'], answer:'True', why:'35 is not equal to 40.' },
  { id:'c3', c:'comparisons', tier:3, type:'typed', prompt:'Write a comparison that is True when speed is at least 55.', answer:'speed >= 55', accepts:['speed>=55','speed >= 55'], normalize:'code', why:'“At least” means greater than or equal to.' },

  { id:'if1', c:'if', tier:1, type:'choice', prompt:'What prints?', code:'speed = 60\nif speed > 55:\n    print("Slow down")', options:['Nothing','Slow down','60','Error'], answer:'Slow down', why:'The condition is True, so the indented line runs.' },
  { id:'if2', c:'if', tier:2, type:'choice', prompt:'What prints?', code:'speed = 45\nif speed > 55:\n    print("Fast")\nelse:\n    print("Okay")', options:['Fast','Okay','45','Nothing'], answer:'Okay', why:'The if condition is False, so else runs.' },
  { id:'if3', c:'if', tier:3, type:'typed', prompt:'Fill in the condition so the warning appears at 56 mph or higher.', code:'speed = 60\nif _____:\n    print("Warning")', answer:'speed >= 56', accepts:['speed>=56','speed >= 56'], normalize:'code', why:'Use >= when the threshold itself should count.' },

  { id:'l1', c:'lists', tier:1, type:'choice', prompt:'Which one is a list?', options:['"35, 40, 45"','[35, 40, 45]','(35, 40, 45)','{35: 40}'], answer:'[35, 40, 45]', why:'Lists use square brackets.' },
  { id:'l2', c:'lists', tier:2, type:'choice', prompt:'What prints?', code:'speeds = [30, 40, 50]\nprint(speeds[1])', options:['30','40','50','Error'], answer:'40', why:'List indexes start at 0, so index 1 is the second item.' },
  { id:'l3', c:'lists', tier:3, type:'typed', prompt:'Add 60 to this list.', code:'speeds = [30, 40, 50]', answer:'speeds.append(60)', accepts:['speeds.append(60)'], normalize:'code', why:'append() adds one item to the end of a list.' },

  { id:'loop1', c:'loops', tier:1, type:'choice', prompt:'How many times does this print?', code:'for x in [1, 2, 3]:\n    print(x)', options:['1','2','3','Forever'], answer:'3', why:'The loop runs once for each item.' },
  { id:'loop2', c:'loops', tier:2, type:'choice', prompt:'What is the final value of total?', code:'total = 0\nfor n in [2, 3]:\n    total = total + n', options:['0','2','3','5'], answer:'5', why:'The loop adds both values to total.' },
  { id:'loop3', c:'loops', tier:3, type:'typed', prompt:'Write a loop that prints every value in speeds.', code:'speeds = [30, 40, 50]', answer:'for speed in speeds:\n    print(speed)', accepts:['for speed in speeds:\nprint(speed)','for speed in speeds:\n    print(speed)'], normalize:'code', why:'A for loop visits each item in the list.' },

  { id:'f1', c:'functions', tier:1, type:'choice', prompt:'Which keyword starts a function definition?', options:['func','function','def','return'], answer:'def', why:'Python uses def to define a function.' },
  { id:'f2', c:'functions', tier:2, type:'choice', prompt:'What prints?', code:'def show_speed(speed):\n    print(speed)\n\nshow_speed(45)', options:['speed','45','Nothing','Error'], answer:'45', why:'45 is passed into the speed parameter.' },
  { id:'f3', c:'functions', tier:3, type:'typed', prompt:'Write a function named is_speeding that returns True when speed is over 55.', answer:'def is_speeding(speed):\n    return speed > 55', accepts:['def is_speeding(speed):\nreturn speed > 55','def is_speeding(speed):\n    return speed > 55'], normalize:'code', why:'A function can return the result of a comparison.' },

  { id:'d1', c:'dicts', tier:1, type:'choice', prompt:'Which structure stores key/value pairs?', options:['List','String','Dictionary','Loop'], answer:'Dictionary', why:'Dictionaries map keys to values.' },
  { id:'d2', c:'dicts', tier:2, type:'choice', prompt:'What prints?', code:'car = {"speed": 45}\nprint(car["speed"])', options:['car','speed','45','Error'], answer:'45', why:'The key "speed" maps to 45.' },
  { id:'d3', c:'dicts', tier:3, type:'typed', prompt:'Change the speed value in car to 55.', code:'car = {"speed": 45}', answer:'car["speed"] = 55', accepts:['car["speed"]=55',"car['speed'] = 55","car['speed']=55"], normalize:'code', why:'Assign a new value to the dictionary key.' },
];

function todayKey(date = new Date()) {
  return date.toISOString().slice(0,10);
}
function dayDiff(a, b) {
  const one = new Date(a + 'T00:00:00');
  const two = new Date(b + 'T00:00:00');
  return Math.round((two - one) / 86400000);
}
function initialState() {
  const learned = {};
  const memory = {};
  conceptCatalog.forEach(c => {
    learned[c.id] = c.defaultOn;
    memory[c.id] = { mastery: c.defaultOn ? 10 : 0, interval: 0, due: todayKey(), seen: 0, correct: 0 };
  });
  return {
    learned,
    memory,
    xp: 0,
    streak: 0,
    lastPracticeDay: null,
    sessions: {},
    reminderTime: '18:00',
    reminderEnabled: false,
    installDate: todayKey(),
  };
}
function loadState() {
  const fresh = initialState();
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (!saved) return fresh;
    return {
      ...fresh,
      ...saved,
      learned: {...fresh.learned, ...(saved.learned || {})},
      memory: {...fresh.memory, ...(saved.memory || {})},
      sessions: saved.sessions || {},
    };
  } catch { return fresh; }
}
let state = loadState();
let lesson = null;
let selectedAnswer = null;
let reminderTimer = null;

const $ = (id) => document.getElementById(id);
const refs = {
  homeView: $('homeView'), lessonView: $('lessonView'), conceptView: $('conceptView'),
  streakCount: $('streakCount'), xpCount: $('xpCount'), todayLabel: $('todayLabel'),
  heroTitle: $('heroTitle'), heroText: $('heroText'), masteryPercent: $('masteryPercent'),
  progressOrb: $('progressOrb'), eagerBanner: $('eagerBanner'), dueCount: $('dueCount'), dueList: $('dueList'),
  conceptSummary: $('conceptSummary'), conceptEditor: $('conceptEditor'), reminderTime: $('reminderTime'),
  reminderStatus: $('reminderStatus'), lessonProgressBar: $('lessonProgressBar'), lessonModeLabel: $('lessonModeLabel'),
  questionConcept: $('questionConcept'), questionDifficulty: $('questionDifficulty'), questionPrompt: $('questionPrompt'),
  codeBlock: $('codeBlock'), questionCode: $('questionCode'), answerArea: $('answerArea'), feedbackCard: $('feedbackCard'),
  feedbackTitle: $('feedbackTitle'), feedbackText: $('feedbackText'), checkBtn: $('checkBtn'), continueBtn: $('continueBtn'),
  lessonFooter: $('lessonFooter'), bottomNav: document.querySelector('.bottom-nav'),
};

function saveState() { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
function learnedConcepts() { return conceptCatalog.filter(c => state.learned[c.id]); }
function sessionCountToday() { return state.sessions[todayKey()] || 0; }
function dueConcepts() {
  const today = todayKey();
  return learnedConcepts().filter(c => (state.memory[c.id]?.due || today) <= today)
    .sort((a,b) => (state.memory[a.id]?.mastery || 0) - (state.memory[b.id]?.mastery || 0));
}
function conceptName(id) { return conceptCatalog.find(c => c.id === id)?.name || id; }
function masteryAverage() {
  const active = learnedConcepts();
  if (!active.length) return 0;
  return Math.round(active.reduce((sum,c) => sum + (state.memory[c.id]?.mastery || 0), 0) / active.length);
}
function difficultyFor(conceptId, mode='daily') {
  const mem = state.memory[conceptId] || { mastery: 0 };
  const age = Math.max(0, dayDiff(state.installDate, todayKey()));
  let tier = 1;
  if (mem.mastery >= 35 || age >= 3) tier = 2;
  if (mem.mastery >= 70 || age >= 10) tier = 3;
  if (mode === 'challenge') tier = Math.min(3, tier + 1);
  return tier;
}
function labelTier(tier) { return ['','Recall','Apply','Manipulate'][tier]; }

function renderHome() {
  refs.streakCount.textContent = state.streak;
  refs.xpCount.textContent = state.xp;
  refs.todayLabel.textContent = new Intl.DateTimeFormat(undefined,{weekday:'long'}).format(new Date()).toUpperCase();
  const avg = masteryAverage();
  refs.masteryPercent.textContent = `${avg}%`;
  refs.progressOrb.style.setProperty('--progress', `${avg * 3.6}deg`);
  const sessions = sessionCountToday();
  if (sessions === 0) {
    refs.heroTitle.textContent = 'Your Python memory workout';
    refs.heroText.textContent = 'A short refresh built from concepts you already know. Weak memories come back sooner.';
  } else {
    refs.heroTitle.textContent = 'Daily refresh complete';
    refs.heroText.textContent = `You’ve practiced ${sessions} time${sessions === 1 ? '' : 's'} today. Extra rounds now emphasize manipulation over recognition.`;
  }
  refs.eagerBanner.classList.toggle('hidden', sessions === 0);
  const due = dueConcepts();
  refs.dueCount.textContent = `${due.length} due`;
  refs.dueList.innerHTML = '';
  const show = due.length ? due.slice(0,5) : learnedConcepts().sort((a,b)=>(state.memory[a.id]?.mastery||0)-(state.memory[b.id]?.mastery||0)).slice(0,5);
  if (!show.length) {
    refs.dueList.innerHTML = '<p class="muted">Turn on at least one concept to begin.</p>';
  } else {
    show.forEach(c => {
      const mem = state.memory[c.id];
      const div = document.createElement('div'); div.className = 'due-item';
      div.innerHTML = `<div class="due-icon">${c.name.slice(0,2)}</div><div><strong>${c.name}</strong><small>${mem.due <= todayKey() ? 'Ready to review' : `Next: ${mem.due}`}</small></div><div class="mastery-mini">${mem.mastery}%</div>`;
      refs.dueList.appendChild(div);
    });
  }
  refs.conceptSummary.innerHTML = '';
  learnedConcepts().forEach(c => {
    const chip = document.createElement('span'); chip.className = 'concept-chip';
    chip.innerHTML = `${c.name} <b>${state.memory[c.id]?.mastery || 0}%</b>`;
    refs.conceptSummary.appendChild(chip);
  });
  refs.reminderTime.value = state.reminderTime || '18:00';
  updateReminderStatus();
}

function renderConceptEditor() {
  refs.conceptEditor.innerHTML = '';
  conceptCatalog.forEach(c => {
    const row = document.createElement('div'); row.className = 'concept-row';
    row.innerHTML = `<div><strong>${c.name}</strong><p>${c.desc}</p></div><label class="toggle"><input type="checkbox" data-concept="${c.id}" ${state.learned[c.id] ? 'checked' : ''}><span class="slider"></span></label>`;
    refs.conceptEditor.appendChild(row);
  });
  refs.conceptEditor.querySelectorAll('input').forEach(input => {
    input.addEventListener('change', () => {
      state.learned[input.dataset.concept] = input.checked;
      if (input.checked && !state.memory[input.dataset.concept]) state.memory[input.dataset.concept] = {mastery:10,interval:0,due:todayKey(),seen:0,correct:0};
      saveState(); renderHome();
    });
  });
}

function showView(name) {
  [refs.homeView, refs.lessonView, refs.conceptView].forEach(v => v.classList.remove('active'));
  refs.bottomNav.classList.toggle('hidden', name === 'lesson');
  if (name === 'home') refs.homeView.classList.add('active');
  if (name === 'lesson') refs.lessonView.classList.add('active');
  if (name === 'concepts') { refs.conceptView.classList.add('active'); renderConceptEditor(); }
  document.querySelectorAll('.nav-btn').forEach(b=>b.classList.remove('active'));
  if (name === 'home') $('homeNavBtn').classList.add('active');
  if (name === 'concepts') $('conceptsNavBtn').classList.add('active');
}

function pickQuestion(conceptId, mode, usedIds) {
  const targetTier = difficultyFor(conceptId, mode);
  const choices = questionBank.filter(q => q.c === conceptId && !usedIds.has(q.id));
  if (!choices.length) return null;
  choices.sort((a,b) => Math.abs(a.tier-targetTier)-Math.abs(b.tier-targetTier));
  const bestDelta = Math.abs(choices[0].tier-targetTier);
  const best = choices.filter(q=>Math.abs(q.tier-targetTier)===bestDelta);
  return best[Math.floor(Math.random()*best.length)];
}

function buildQueue(mode='daily') {
  const learned = learnedConcepts();
  if (!learned.length) return [];
  const used = new Set();
  const due = dueConcepts();
  const sorted = [...learned].sort((a,b)=>(state.memory[a.id]?.mastery||0)-(state.memory[b.id]?.mastery||0));
  let conceptPool = [];
  if (mode === 'daily') conceptPool = [...due, ...sorted.filter(c=>!due.some(d=>d.id===c.id))];
  else conceptPool = sorted;
  const count = mode === 'challenge' ? 6 : 5;
  const queue = [];
  for (let i=0; i<count; i++) {
    const c = conceptPool[i % conceptPool.length];
    let q = pickQuestion(c.id, mode, used);
    if (!q) {
      const fallback = learned.find(x => pickQuestion(x.id, mode, used));
      if (fallback) q = pickQuestion(fallback.id, mode, used);
    }
    if (q) { queue.push(q); used.add(q.id); }
  }
  return queue;
}

function startLesson(mode='daily') {
  const queue = buildQueue(mode);
  if (!queue.length) { showView('concepts'); return; }
  lesson = { mode, queue, index:0, correct:0, answered:false };
  showView('lesson');
  renderQuestion();
}

function renderQuestion() {
  const q = lesson.queue[lesson.index];
  selectedAnswer = null; lesson.answered = false;
  refs.lessonProgressBar.style.width = `${(lesson.index / lesson.queue.length) * 100}%`;
  refs.lessonModeLabel.textContent = lesson.mode === 'challenge' ? 'Challenge' : 'Daily';
  refs.questionConcept.textContent = conceptName(q.c);
  refs.questionDifficulty.textContent = labelTier(q.tier);
  refs.questionPrompt.textContent = q.prompt;
  refs.questionCode.textContent = q.code || '';
  refs.codeBlock.classList.toggle('hidden', !q.code);
  refs.answerArea.innerHTML = '';
  refs.feedbackCard.className = 'feedback hidden';
  refs.lessonFooter.classList.remove('hidden');
  refs.checkBtn.disabled = false;
  refs.checkBtn.textContent = 'Check';
  if (q.type === 'choice') {
    q.options.forEach(option => {
      const btn = document.createElement('button'); btn.className = 'option-btn'; btn.type='button'; btn.textContent = option;
      btn.addEventListener('click', () => {
        if (lesson.answered) return;
        selectedAnswer = option;
        refs.answerArea.querySelectorAll('.option-btn').forEach(b=>b.classList.remove('selected'));
        btn.classList.add('selected');
      });
      refs.answerArea.appendChild(btn);
    });
  } else {
    const input = document.createElement(q.tier >= 3 ? 'textarea' : 'input');
    input.className = 'answer-input'; input.placeholder = q.tier >= 3 ? 'Type the Python you would write…' : 'Type your answer…';
    input.spellcheck = false; input.autocapitalize = 'off'; input.autocomplete = 'off';
    input.addEventListener('input', ()=> selectedAnswer = input.value);
    refs.answerArea.appendChild(input);
    setTimeout(()=>input.focus(), 80);
  }
}

function normalizeCode(s='') {
  return s.trim().replace(/\r/g,'').split('\n').map(line=>line.trim()).filter(Boolean).join('\n').replace(/\s+/g,' ')
    .replace(/\s*=\s*/g,'=').replace(/\s*\+\s*/g,'+').replace(/\s*>\s*/g,'>').replace(/\s*<\s*/g,'<');
}
function isCorrect(q, answer) {
  if (answer == null || String(answer).trim() === '') return false;
  const accepted = q.accepts || [q.answer];
  if (q.type === 'choice') return answer === q.answer;
  if (q.normalize === 'code') {
    const n = normalizeCode(answer);
    return accepted.some(a => normalizeCode(a) === n);
  }
  return accepted.some(a=>String(a).trim().toLowerCase()===String(answer).trim().toLowerCase());
}

function updateMemory(conceptId, correct, tier) {
  const mem = state.memory[conceptId] || {mastery:0,interval:0,due:todayKey(),seen:0,correct:0};
  mem.seen += 1;
  if (correct) {
    mem.correct += 1;
    mem.mastery = Math.min(100, mem.mastery + 7 + tier * 3);
    mem.interval = mem.interval <= 0 ? 1 : Math.min(30, Math.max(1, Math.round(mem.interval * (1.45 + tier * .12))));
  } else {
    mem.mastery = Math.max(0, mem.mastery - (tier >= 3 ? 7 : 4));
    mem.interval = 0;
  }
  const due = new Date(); due.setDate(due.getDate() + mem.interval);
  mem.due = todayKey(due);
  state.memory[conceptId] = mem;
}

function checkAnswer() {
  if (!lesson || lesson.answered) return;
  const q = lesson.queue[lesson.index];
  const correct = isCorrect(q, selectedAnswer);
  lesson.answered = true;
  if (correct) lesson.correct += 1;
  updateMemory(q.c, correct, q.tier);
  state.xp += correct ? 10 + q.tier * 2 : 2;
  saveState();
  if (q.type === 'choice') {
    refs.answerArea.querySelectorAll('.option-btn').forEach(btn => {
      if (btn.textContent === q.answer) btn.classList.add('correct');
      else if (btn.textContent === selectedAnswer) btn.classList.add('wrong');
    });
  }
  refs.feedbackCard.className = `feedback ${correct ? 'correct' : 'wrong'}`;
  refs.feedbackTitle.textContent = correct ? 'Nice. That memory held.' : 'Not quite — this one comes back sooner.';
  refs.feedbackText.textContent = correct ? q.why : `${q.why} Answer: ${q.answer}`;
  refs.lessonFooter.classList.add('hidden');
}

function continueLesson() {
  if (!lesson) return;
  lesson.index += 1;
  if (lesson.index >= lesson.queue.length) finishLesson();
  else renderQuestion();
}
function finishLesson() {
  const today = todayKey();
  state.sessions[today] = (state.sessions[today] || 0) + 1;
  if (state.lastPracticeDay !== today) {
    if (!state.lastPracticeDay) state.streak = 1;
    else {
      const gap = dayDiff(state.lastPracticeDay, today);
      state.streak = gap === 1 ? state.streak + 1 : 1;
    }
    state.lastPracticeDay = today;
  }
  state.xp += lesson.correct === lesson.queue.length ? 20 : 5;
  saveState();
  const score = lesson.correct;
  const total = lesson.queue.length;
  lesson = null;
  showView('home'); renderHome();
  refs.heroTitle.textContent = score === total ? 'Perfect refresh.' : `${score}/${total} remembered`;
  refs.heroText.textContent = score === total ? 'Your next review will wait longer because you recalled everything cleanly.' : 'Missed concepts were moved closer in your review queue so they come back before you lose them.';
}

function markCurrentUnlearned() {
  if (!lesson) return;
  const q = lesson.queue[lesson.index];
  state.learned[q.c] = false;
  saveState();
  const used = new Set(lesson.queue.map(x=>x.id));
  const candidates = learnedConcepts().sort((a,b)=>(state.memory[a.id]?.mastery||0)-(state.memory[b.id]?.mastery||0));
  let replacement = null;
  for (const c of candidates) {
    replacement = pickQuestion(c.id, 'challenge', used);
    if (replacement) break;
  }
  if (replacement) {
    lesson.queue[lesson.index] = replacement;
    renderQuestion();
  } else {
    lesson.queue.splice(lesson.index,1);
    if (!lesson.queue.length || lesson.index >= lesson.queue.length) finishLesson(); else renderQuestion();
  }
}

async function enableReminders() {
  state.reminderTime = refs.reminderTime.value || '18:00';
  if (!('Notification' in window)) {
    state.reminderEnabled = true; saveState(); updateReminderStatus(); scheduleReminderCheck(); return;
  }
  const permission = await Notification.requestPermission();
  state.reminderEnabled = permission === 'granted';
  saveState(); updateReminderStatus(); scheduleReminderCheck();
  if (state.reminderEnabled) sendNotification('PyRecall reminders are on', 'I’ll nudge you when the app is able to deliver browser notifications.');
}
function updateReminderStatus() {
  if (!state.reminderEnabled) refs.reminderStatus.textContent = 'Reminders are off.';
  else refs.reminderStatus.textContent = `Reminder set for ${state.reminderTime}. If your browser suspends the app, the reminder appears the next time it can run.`;
}
function sendNotification(title, body) {
  if ('serviceWorker' in navigator && Notification.permission === 'granted') {
    navigator.serviceWorker.ready.then(reg => reg.showNotification(title, {body, icon:'icon.svg', badge:'icon.svg', tag:'pyrecall-daily'})).catch(()=>{});
  }
}
function scheduleReminderCheck() {
  if (reminderTimer) clearInterval(reminderTimer);
  if (!state.reminderEnabled) return;
  const check = () => {
    const now = new Date();
    const [h,m] = (state.reminderTime || '18:00').split(':').map(Number);
    const minuteNow = now.getHours()*60 + now.getMinutes();
    const target = h*60 + m;
    const today = todayKey(now);
    if (minuteNow >= target && sessionCountToday() === 0 && localStorage.getItem('pyrecall-reminded') !== today) {
      sendNotification('Your Python memory is due', 'Five quick questions. Keep yesterday’s Python from disappearing.');
      localStorage.setItem('pyrecall-reminded', today);
    }
  };
  check(); reminderTimer = setInterval(check, 30000);
}

$('startDailyBtn').addEventListener('click', ()=>startLesson(sessionCountToday() ? 'challenge' : 'daily'));
$('eagerBtn').addEventListener('click', ()=>startLesson('challenge'));
$('eagerBannerBtn').addEventListener('click', ()=>startLesson('challenge'));
$('practiceNavBtn').addEventListener('click', ()=>startLesson('challenge'));
$('editConceptsBtn').addEventListener('click', ()=>showView('concepts'));
$('conceptsNavBtn').addEventListener('click', ()=>showView('concepts'));
$('homeNavBtn').addEventListener('click', ()=>showView('home'));
$('backFromConceptsBtn').addEventListener('click', ()=>showView('home'));
$('closeLessonBtn').addEventListener('click', ()=>{ lesson=null; showView('home'); renderHome(); });
$('checkBtn').addEventListener('click', checkAnswer);
$('continueBtn').addEventListener('click', continueLesson);
$('notLearnedBtn').addEventListener('click', markCurrentUnlearned);
$('enableReminderBtn').addEventListener('click', enableReminders);
refs.reminderTime.addEventListener('change', ()=>{ state.reminderTime = refs.reminderTime.value; saveState(); scheduleReminderCheck(); updateReminderStatus(); });

document.addEventListener('keydown', e => {
  if (!lesson) return;
  if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA') {
    if (!lesson.answered) checkAnswer(); else continueLesson();
  }
});

if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(()=>{});
renderHome();
renderConceptEditor();
scheduleReminderCheck();
