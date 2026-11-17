'use strict';
const $ = (selector) => document.querySelector(selector);
const durations = { focus: 25 * 60, short: 5 * 60, long: 15 * 60 };
const modeLabels = { focus: 'โฟกัส', short: 'พักสั้น', long: 'พักยาว' };
let mode = 'focus', remaining = durations.focus, running = false, deadline = 0, completed = 0;
let toastTimeout;
function notify(message) {
  $('#notification').textContent = message;
  $('#notification').classList.add('visible');
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => $('#notification').classList.remove('visible'), 4000);
}
$('#date').textContent = new Intl.DateTimeFormat('th-TH', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date());
$('#date').dateTime = new Date().toISOString().slice(0, 10);
function renderTimer() {
  const formatted = `${String(Math.floor(remaining / 60)).padStart(2, '0')}:${String(remaining % 60).padStart(2, '0')}`;
  $('#timer').textContent = formatted;
  document.title = running ? `${formatted} · ${modeLabels[mode]} | พักแป๊บ` : 'พักแป๊บ · เวลาของคุณ';
  $('#start span').textContent = running ? 'หยุดชั่วคราว' : remaining === durations[mode] ? (mode === 'focus' ? 'เริ่มโฟกัส' : 'เริ่มพัก') : 'ทำต่อ';
  $('#start use').setAttribute('href', running ? '#pause' : '#play');
  $('.focus-panel').classList.toggle('running', running);
}
function updateTimer() {
  if (!running) return;
  remaining = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
  if (remaining === 0) {
    running = false;
    if (mode === 'focus') {
      completed++;
      $('#session-note').textContent = `วันนี้ให้เวลาตัวเองแล้ว ${completed} รอบ`;
    }
    $('#timer-message').textContent = 'ครบเวลาแล้ว พักสายตาสักหน่อยนะ';
    notify('ครบเวลาแล้ว เก่งมาก! ให้ตัวเองได้พักบ้างนะ');
    remaining = durations[mode];
  }
  renderTimer();
}
$('#start').addEventListener('click', () => {
  if (running) updateTimer();
  running = !running;
  if (running) deadline = Date.now() + remaining * 1000;
  $('#timer-message').textContent = running ? (mode === 'focus' ? 'อยู่กับสิ่งตรงหน้า เรื่องอื่นรอได้' : 'พักสายตา ยืดตัว แล้วค่อยกลับมา') : 'พร้อมเมื่อไหร่ ค่อยไปต่อ';
  renderTimer();
});
$('#reset').addEventListener('click', () => {
  running = false; remaining = durations[mode];
  $('#timer-message').textContent = 'เริ่มใหม่ได้เสมอ ไม่เป็นไรเลย';
  renderTimer();
});
for (const button of document.querySelectorAll('.mode')) {
  button.addEventListener('click', () => {
    mode = button.dataset.mode; remaining = durations[mode]; running = false;
    for (const tab of document.querySelectorAll('.mode')) {
      const active = tab === button;
      tab.classList.toggle('active', active); tab.setAttribute('aria-pressed', String(active));
    }
    $('#timer-message').textContent = mode === 'focus' ? 'ไม่ต้องรีบ แค่เริ่มก็เก่งแล้ว' : 'ปล่อยให้ตัวเองได้พักเต็มที่';
    renderTimer();
  });
}
setInterval(updateTimer, 250);
document.addEventListener('visibilitychange', updateTimer);
let tasks = [];
let storageWorks = true;
try {
  const saved = JSON.parse(localStorage.getItem('pakpaep.tasks') || '[]');
  if (Array.isArray(saved)) tasks = saved.filter(t => t && typeof t.id === 'string' && typeof t.text === 'string' && typeof t.done === 'boolean').slice(0, 100);
} catch { storageWorks = false; }
function saveTasks() {
  try { localStorage.setItem('pakpaep.tasks', JSON.stringify(tasks)); }
  catch { storageWorks = false; $('#storage-note').textContent = 'เบราว์เซอร์บันทึกไม่ได้ รายการนี้จะอยู่จนกว่าจะปิดหน้า'; }
}
function renderTasks() {
  $('#tasks').replaceChildren();
  for (const task of tasks) {
    const row = document.createElement('li');
    const label = document.createElement('label');
    const checkbox = document.createElement('input'); checkbox.type = 'checkbox'; checkbox.checked = task.done;
    checkbox.addEventListener('change', () => {
      task.done = checkbox.checked;
      saveTasks();
      $('#task-count').textContent = `${tasks.filter(t => t.done).length}/${tasks.length}`;
    });
    const text = document.createElement('span'); text.textContent = task.text;
    label.append(checkbox, text);
    const remove = document.createElement('button'); remove.className = 'delete-task';
    remove.setAttribute('aria-label', `ลบ ${task.text}`);
    remove.innerHTML = '<svg aria-hidden="true"><use href="#close"/></svg>';
    remove.addEventListener('click', () => { tasks = tasks.filter(t => t.id !== task.id); saveTasks(); renderTasks(); $('#task-input').focus(); });
    row.append(label, remove); $('#tasks').append(row);
  }
  $('#empty').hidden = tasks.length > 0;
  $('#task-count').textContent = `${tasks.filter(t => t.done).length}/${tasks.length}`;
}
$('#task-form').addEventListener('submit', event => {
  event.preventDefault();
  const text = $('#task-input').value.trim();
  if (!text) { $('#task-input').value = ''; $('#task-input').focus(); return; }
  if (tasks.length >= 100) { notify('ครบ 100 รายการแล้ว ลบรายการเก่าก่อนเพิ่มนะ'); return; }
  tasks.push({ id: `${Date.now()}-${Math.random().toString(36).slice(2)}`, text, done: false });
  saveTasks(); renderTasks(); $('#task-input').value = ''; $('#task-input').focus();
});
if (!storageWorks) $('#storage-note').textContent = 'บันทึกในเบราว์เซอร์ไม่ได้ รายการจะอยู่เฉพาะครั้งนี้';
renderTasks();
// Both ambience tracks are generated locally. No recordings or network requests.
let audioContext;
const tracks = new Map();
async function toggleSound(kind, button) {
  button.disabled = true;
  try {
    if (tracks.has(kind)) {
      const track = tracks.get(kind); track.source.stop(); track.source.disconnect(); track.filter.disconnect(); track.gain.disconnect(); tracks.delete(kind);
      button.setAttribute('aria-pressed', 'false');
      $(`#${kind}-state`).textContent = 'ปิดอยู่';
      return;
    }
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) throw new Error('Audio not supported');
    audioContext ||= new AudioCtx();
    await audioContext.resume();
    const buffer = audioContext.createBuffer(1, audioContext.sampleRate * 6, audioContext.sampleRate);
    const data = buffer.getChannelData(0);
    let brown = 0;
    for (let i = 0; i < data.length; i++) {
      const white = Math.random() * 2 - 1;
      brown = (brown + .02 * white) / 1.02;
      data[i] = kind === 'forest' ? brown * 3.5 : white * .65 + brown;
    }
    const source = audioContext.createBufferSource(); source.buffer = buffer; source.loop = true;
    const filter = audioContext.createBiquadFilter(); filter.type = 'lowpass'; filter.frequency.value = kind === 'rain' ? 1800 : 500;
    const gain = audioContext.createGain(); gain.gain.value = Number($(`#${kind}-volume`).value) / 100 * .45;
    source.connect(filter).connect(gain).connect(audioContext.destination); source.start();
    tracks.set(kind, { source, filter, gain });
    button.setAttribute('aria-pressed', 'true'); $(`#${kind}-state`).textContent = 'กำลังเล่น';
  } catch { notify('เปิดเสียงไม่ได้ ลองใช้เบราว์เซอร์รุ่นใหม่อีกครั้ง'); }
  finally { button.disabled = false; button.setAttribute('aria-label', `${tracks.has(kind) ? 'ปิด' : 'เปิด'}เสียง${kind === 'rain' ? 'ฝน' : 'ลมในป่า'}`); }
}
for (const button of document.querySelectorAll('.sound-toggle')) button.addEventListener('click', () => toggleSound(button.dataset.sound, button));
for (const kind of ['rain', 'forest']) {
  $(`#${kind}-volume`).addEventListener('input', event => {
    const track = tracks.get(kind);
    if (track) track.gain.gain.setTargetAtTime(Number(event.target.value) / 100 * .45, audioContext.currentTime, .08);
  });
}
let breathInterval;
$('#breath').addEventListener('click', () => {
  $('#breath-dialog').showModal();
  let inward = true; $('#breath-instruction').textContent = 'หายใจเข้า…';
  clearInterval(breathInterval);
  breathInterval = setInterval(() => { inward = !inward; $('#breath-instruction').textContent = inward ? 'หายใจเข้า…' : 'หายใจออก…'; }, 4000);
});
$('#close-breath').addEventListener('click', () => $('#breath-dialog').close());
$('#breath-dialog').addEventListener('close', () => { clearInterval(breathInterval); $('#breath').focus(); });
$('#breath-dialog').addEventListener('click', event => { if (event.target === event.currentTarget) { const rect = event.currentTarget.getBoundingClientRect(); if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) event.currentTarget.close(); } });
renderTimer();
