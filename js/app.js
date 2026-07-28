const STORAGE_KEY = 'training-log-v1';
const THEME_KEY = 'training-log-theme-v1';
const BG_KEY = 'training-log-bg-v1';

// Available hero background images. 'file' is relative to assets/, 'thumb' to assets/thumbs/.
const BG_OPTIONS = [
  {id:'diamond',    label:'Diamond',            file:'mountain-bg.jpg'},
  {id:'el-cap',     label:'El Cap',             file:'diamond.jpg'},
  {id:'patagonia-1',label:'Patagonia 1',        file:'patagonia-1.jpg'},
  {id:'patagonia-2',label:'Patagonia 2',        file:'patagonia-2.jpg'},
];

/* ===================== THEME (light/dark) ===================== */
function effectiveTheme() {
  const explicit=document.documentElement.getAttribute('data-theme');
  if(explicit==='light'||explicit==='dark') return explicit;
  return (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) ? 'dark' : 'light';
}
function updateThemeToggleIcon() {
  const btn=document.getElementById('theme-toggle-btn');
  if(!btn) return;
  btn.textContent = effectiveTheme()==='dark' ? '\u{1F319}' : '\u2600\uFE0F';
}
function initTheme() {
  let saved;
  try { saved=localStorage.getItem(THEME_KEY); } catch(e){}
  if(saved==='light'||saved==='dark') document.documentElement.setAttribute('data-theme',saved);
  updateThemeToggleIcon();
}
function toggleTheme() {
  const next = effectiveTheme()==='dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme',next);
  try { localStorage.setItem(THEME_KEY,next); } catch(e){}
  updateThemeToggleIcon();
}

/* ===================== BACKGROUND PICKER ===================== */
function applyBackground(id, persist) {
  const opt=BG_OPTIONS.find(o=>o.id===id)||BG_OPTIONS[0];
  const url="url('assets/"+opt.file+"')";
  const blur=document.querySelector('.hero-bg-blur');
  const fg=document.querySelector('.hero-bg-fg');
  if(blur) blur.style.backgroundImage=url;
  if(fg) fg.style.backgroundImage=url;
  if(persist!==false){ try { localStorage.setItem(BG_KEY,opt.id); } catch(e){} }
}
function initBackground() {
  let saved;
  try { saved=localStorage.getItem(BG_KEY); } catch(e){}
  const opt=BG_OPTIONS.find(o=>o.id===saved)||BG_OPTIONS[0];
  applyBackground(opt.id,false);
}
function openBgPickerModal() {
  let current;
  try { current=localStorage.getItem(BG_KEY); } catch(e){}
  if(!current) current=BG_OPTIONS[0].id;
  const gridHtml=BG_OPTIONS.map(o=>
    '<button class="bg-picker-option'+(o.id===current?' selected':'')+'" onclick="selectBackground(\''+o.id+'\')">'+
    '<img src="assets/thumbs/'+o.file+'" alt="'+esc(o.label)+'">'+
    '<span class="bg-picker-label">'+esc(o.label)+'</span></button>'
  ).join('');
  openModal(
    '<div class="modal-header"><span class="modal-title">Background</span>'+
    '<button class="close-btn" onclick="closeModal()">&times;</button></div>'+
    '<div class="bg-picker-grid">'+gridHtml+'</div>');
}
function selectBackground(id) { applyBackground(id,true); closeModal(); }

// Grade catalog used to populate dropdowns and group pitch counts.
// No points/weighting anymore -- this is purely a list of selectable grades per category+venue.
const CLIMB_GRADES = [
  {k:'Indoor V0',cat:'boulder',venue:'indoor'},
  {k:'Indoor V1',cat:'boulder',venue:'indoor'},
  {k:'Indoor V2',cat:'boulder',venue:'indoor'},
  {k:'Indoor V3',cat:'boulder',venue:'indoor'},
  {k:'Indoor V4',cat:'boulder',venue:'indoor'},
  {k:'Indoor V5',cat:'boulder',venue:'indoor'},
  {k:'Indoor V6',cat:'boulder',venue:'indoor'},
  {k:'Indoor V7',cat:'boulder',venue:'indoor'},
  {k:'Indoor \u2265V8',cat:'boulder',venue:'indoor'},
  {k:'Indoor 5.9',cat:'sport',venue:'indoor'},
  {k:'Indoor 5.10',cat:'sport',venue:'indoor'},
  {k:'Indoor 5.11',cat:'sport',venue:'indoor'},
  {k:'Indoor 5.12',cat:'sport',venue:'indoor'},
  {k:'Sport \u22645.6',cat:'sport',venue:'outdoor'},
  {k:'Sport 5.7',cat:'sport',venue:'outdoor'},
  {k:'Sport 5.8',cat:'sport',venue:'outdoor'},
  {k:'Sport 5.9',cat:'sport',venue:'outdoor'},
  {k:'Sport 5.10a/b',cat:'sport',venue:'outdoor'},
  {k:'Sport 5.10c/d',cat:'sport',venue:'outdoor'},
  {k:'Sport 5.11a/b',cat:'sport',venue:'outdoor'},
  {k:'Sport 5.11c/d',cat:'sport',venue:'outdoor'},
  {k:'Sport 5.12a/b',cat:'sport',venue:'outdoor'},
  {k:'Sport 5.12c/d',cat:'sport',venue:'outdoor'},
  {k:'Sport \u22655.13a',cat:'sport',venue:'outdoor'},
  {k:'Trad \u22645.6',cat:'trad',venue:'outdoor'},
  {k:'Trad 5.7',cat:'trad',venue:'outdoor'},
  {k:'Trad 5.8',cat:'trad',venue:'outdoor'},
  {k:'Trad 5.9',cat:'trad',venue:'outdoor'},
  {k:'Trad 5.10a/b',cat:'trad',venue:'outdoor'},
  {k:'Trad 5.10c/d',cat:'trad',venue:'outdoor'},
  {k:'Trad 5.11a/b',cat:'trad',venue:'outdoor'},
  {k:'Trad 5.11c/d',cat:'trad',venue:'outdoor'},
  {k:'Trad 5.12a/b',cat:'trad',venue:'outdoor'},
  {k:'Trad 5.12c/d',cat:'trad',venue:'outdoor'},
  {k:'Trad \u22655.13a',cat:'trad',venue:'outdoor'},
];

// Exercise library: per focus-area lists of named exercises, used to
// populate the checklist inside a strength session. Fully user-editable
// via the "Manage exercises" screen -- these are just sensible starting
// points seeded once, mirroring what showed up across the finger/upper/
// lower spreadsheets. `unilateral` is just the *default* for a brand new
// row of that exercise; the per-row toggle in the modal always wins.
const STRENGTH_AREAS = ['upper','lower','core','wrist'];
const DEFAULT_EXERCISE_LIBRARY = {
  wrist: [ // finger strength
    {id:'ex-3fd',    name:'3 Finger Drag (20mm)', unilateral:false},
    {id:'ex-hc20',   name:'Half Crimp (20mm)',     unilateral:false},
    {id:'ex-hc10',   name:'Half Crimp (10mm)',     unilateral:false},
    {id:'ex-fc',     name:'Full Crimp (10mm)',     unilateral:false},
    {id:'ex-pinch',  name:'Pinch Block',           unilateral:false},
  ],
  upper: [
    {id:'ex-pullup',   name:'Pull-ups',                unilateral:false},
    {id:'ex-pushup',   name:'Push-ups',                unilateral:false},
    {id:'ex-tripush',  name:'Tricep push-ups',         unilateral:false},
    {id:'ex-dip',      name:'Dips',                    unilateral:false},
    {id:'ex-ohp',      name:'Overhead / Arnold press', unilateral:false},
    {id:'ex-shoulder', name:'Shoulder press',          unilateral:false},
    {id:'ex-chest',    name:'Chest press',             unilateral:false},
    {id:'ex-latraise', name:'Lateral raises',          unilateral:false},
    {id:'ex-frontraise',name:'Front raise',            unilateral:false},
    {id:'ex-fly',      name:'Supine dumbbell fly',     unilateral:false},
    {id:'ex-scap',     name:'Scapular pulls',          unilateral:false},
  ],
  core: [
    {id:'ex-plank',     name:'Plank',                          unilateral:false},
    {id:'ex-deadbug',   name:'Dead bug',                       unilateral:false},
    {id:'ex-hollow',    name:'Hollow body hold',               unilateral:false},
    {id:'ex-h2t',       name:'Hands to toes',                  unilateral:false},
    {id:'ex-legraise',  name:'Hanging leg / knee raises',       unilateral:false},
    {id:'ex-rotation',  name:'Weighted rotations',              unilateral:false},
    {id:'ex-sideplank', name:'Side plank w/ hip abduction',    unilateral:true},
  ],
  lower: [
    {id:'ex-deadlift',  name:'Deadlift',        unilateral:false},
    {id:'ex-squat',     name:'Squat',           unilateral:false},
    {id:'ex-stepup',    name:'Step up',         unilateral:true},
    {id:'ex-stepdown',  name:'Step down',       unilateral:true},
    {id:'ex-crossover', name:'Cross over steps',unilateral:true},
    {id:'ex-calf',      name:'Calf raises',     unilateral:false},
  ],
};
function ensureExerciseLibrary() {
  state.exerciseLibrary = state.exerciseLibrary || {};
  STRENGTH_AREAS.forEach(a=>{
    if(!Array.isArray(state.exerciseLibrary[a])) {
      state.exerciseLibrary[a] = DEFAULT_EXERCISE_LIBRARY[a].map(e=>({...e}));
    }
  });
}
function genExId() { return 'ex'+Date.now().toString(36)+Math.random().toString(36).slice(2,6); }
function mergeExerciseLibrary(cur, inc) {
  cur = cur || {};
  inc = inc || {};
  STRENGTH_AREAS.forEach(a=>{
    const curList = Array.isArray(cur[a]) ? cur[a] : [];
    const incList = Array.isArray(inc[a]) ? inc[a] : [];
    const seenNames = new Set(curList.map(e=>e.name.trim().toLowerCase()));
    incList.forEach(e=>{
      const key = (e.name||'').trim().toLowerCase();
      if(key && !seenNames.has(key)) { seenNames.add(key); curList.push({...e}); }
    });
    cur[a] = curList;
  });
  return cur;
}

let state = {days:{}, climbs:[], cardio:[], fuel:[], strength:[], plan:{}, goals:[], cycles:[], exerciseLibrary:{}};
let currentWeekStart = getMonday(new Date());
let currentMonthDate = new Date();
let calView = 'week';
let appMode = 'log'; // 'log' or 'plan'
let currentPlanMonthDate = new Date();
let currentPlanWeekStart = getMonday(new Date());
let currentYear = new Date().getFullYear();

function genId() { return 'id'+Date.now().toString(36)+Math.random().toString(36).slice(2,7); }

function loadState() {
  try { const r=localStorage.getItem(STORAGE_KEY); if(r) state=JSON.parse(r); } catch(e){}
  state.strength = state.strength || []; // backfill for states saved before this field existed
  state.plan = state.plan || {}; // backfill for states saved before the plan feature existed
  state.goals = state.goals || []; // backfill for states saved before goals existed
  state.cycles = state.cycles || []; // backfill for states saved before cycles existed
  state.strength.forEach(s=>{ s.exercises = s.exercises || []; }); // backfill for entries saved before per-exercise tracking existed
  ensureExerciseLibrary(); // backfill for states saved before the exercise library existed, and top up any new default categories
  dedupeState();
  renderCalendar(); renderClimbs(); renderCardio(); renderStrength(); renderFuel(); renderStats();
  renderGoals(); renderCycles(); renderYearly(); renderPlanMonth(); renderPlanWeek();
  refreshSyncStatusIdle();
}
function saveState() { try { localStorage.setItem(STORAGE_KEY,JSON.stringify(state)); } catch(e){} scheduleGistSync(); }

// Removes exact-duplicate entries (e.g. from the old re-merge-every-load bug).
// Runs automatically on every load -- cheap, and harmless once data is clean.
// Content-aware dedup: compares only the meaningful fields for each entry
// type, so legacy cruft (like the old "points" field, or differing key
// order) doesn't prevent a real duplicate from being caught.
function cardioKey(c) { return ['date','actType','objective','miles','vert','time','notes'].map(k=>c[k]||'').join('|') + '|' + (c.alpine?'1':'0') + '|' + (c.weighted?'1':'0'); }
function climbKey(c) { return ['date','venue','climbType','notes'].map(k=>c[k]||'').join('|') + '|' + (c.alpine?'1':'0') + '|' + JSON.stringify(c.rows||[]); }
function fuelKey(f) { return ['date','objective','food','gear','notes'].map(k=>f[k]||'').join('|'); }
function strengthKey(s) { return ['date','kind','area','time','notes'].map(k=>s[k]||'').join('|') + '|' + JSON.stringify(s.exercises||[]); }

function dedupeArr(arr, keyFn) {
  const seen = new Set(); const out = []; let removed = 0;
  for (const item of arr) {
    const k = keyFn(item);
    if (seen.has(k)) { removed++; continue; }
    seen.add(k); out.push(item);
  }
  return { out, removed };
}

function dedupeState() {
  // Strip legacy "points" field left over from the old points-based system --
  // both the top-level one, and the per-row "pts" field that lived inside
  // each grade row, which was masking real duplicates from being caught.
  state.climbs.forEach(c => { delete c.points; (c.rows||[]).forEach(r => { delete r.pts; }); });
  state.cardio.forEach(c => { delete c.points; });

  // Terrain tag was retired in favor of a standalone "Weighted" toggle
  // (like Alpine). Carry forward anyone who had terrain==='weighted', then
  // drop the field entirely so it can't reintroduce stale duplicates.
  state.cardio.forEach(c => {
    if (c.terrain === 'weighted' && !c.weighted) c.weighted = true;
    delete c.terrain;
  });

  const c = dedupeArr(state.climbs, climbKey);
  const ca = dedupeArr(state.cardio, cardioKey);
  const f = dedupeArr(state.fuel, fuelKey);
  const s = dedupeArr(state.strength, strengthKey);
  let total = c.removed + ca.removed + f.removed + s.removed;
  state.climbs = c.out; state.cardio = ca.out; state.fuel = f.out; state.strength = s.out;

  // Some very old imports left behind a THIRD copy per session: an
  // "empty rows, text-summary-in-notes" record from before structured
  // grade rows existed. Different notes text means the plain content
  // match above can't catch it -- so for any date+venue+type group that
  // has at least one entry with real rows, drop the empty-rows entries
  // as redundant leftovers.
  const groups = {};
  state.climbs.forEach(cl => { const gk = cl.date+'|'+cl.venue+'|'+cl.climbType; (groups[gk]=groups[gk]||[]).push(cl); });
  const keep = [];
  Object.values(groups).forEach(arr => {
    const withRows = arr.filter(cl => (cl.rows||[]).length > 0);
    if (withRows.length > 0 && withRows.length < arr.length) {
      total += arr.length - withRows.length;
      keep.push(...withRows);
    } else {
      keep.push(...arr);
    }
  });
  state.climbs = keep;

  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch(e){}
  if (total > 0) showToast('Cleaned up ' + total + ' duplicate ' + (total===1?'entry':'entries'));
  return total;
}

function getMonday(d) {
  const dt=new Date(d), day=dt.getDay();
  dt.setDate(dt.getDate()+(day===0?-6:1-day)); dt.setHours(0,0,0,0); return dt;
}
function addDays(d,n) { const dt=new Date(d); dt.setDate(dt.getDate()+n); return dt; }
function fmtDate(d) { return d.toLocaleDateString('en-US',{month:'short',day:'numeric'}); }
function fmtISO(d) { return d.toISOString().split('T')[0]; }
function fmtDisplay(iso) {
  if(!iso) return '';
  const [y,m,d]=iso.split('-');
  return new Date(+y,+m-1,+d).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'});
}
function esc(s) { return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
function todayISO() { return fmtISO(new Date()); }

function showTab(id,btn) {
  document.querySelectorAll('.tab').forEach(t=>t.classList.remove('active'));
  document.querySelectorAll('.section').forEach(s=>s.classList.remove('active'));
  document.getElementById(id).classList.add('active'); btn.classList.add('active');
  if(id==='weekly') renderCalendar();
  if(id==='climbs') renderClimbs();
  if(id==='cardio') renderCardio();
  if(id==='strength') renderStrength();
  if(id==='fuel') renderFuel();
  if(id==='stats') renderStats();
  if(id==='goals') renderGoals();
  if(id==='yearly') renderYearly();
  if(id==='cycles') renderCycles();
  if(id==='plan-month') renderPlanMonth();
  if(id==='plan-week') renderPlanWeek();
}

function setMode(mode) {
  appMode=mode;
  document.getElementById('mode-log-btn').classList.toggle('active',mode==='log');
  document.getElementById('mode-plan-btn').classList.toggle('active',mode==='plan');
  document.getElementById('log-tabs').style.display = mode==='log' ? '' : 'none';
  document.getElementById('plan-tabs').style.display = mode==='plan' ? '' : 'none';
  const tabsEl=document.getElementById(mode==='log'?'log-tabs':'plan-tabs');
  const firstTab=tabsEl.querySelector('.tab');
  if(firstTab) firstTab.click();
}

function setView(v) {
  calView=v;
  document.getElementById('toggle-week').classList.toggle('active',v==='week');
  document.getElementById('toggle-month').classList.toggle('active',v==='month');
  renderCalendar();
}

function changePeriod(dir) {
  if(calView==='week') currentWeekStart=addDays(currentWeekStart,dir*7);
  else currentMonthDate=new Date(currentMonthDate.getFullYear(),currentMonthDate.getMonth()+dir,1);
  renderCalendar();
}

function renderCalendar() {
  if(calView==='week') renderWeek(); else renderMonth();
}

/* Build the activity badge HTML for a given date */
function cellBadges(dateISO) {
  const hasClimb = state.climbs.some(c=>c.date===dateISO);
  const hasCardio = state.cardio.some(c=>c.date===dateISO);
  const hasStrength = state.strength.some(s=>s.date===dateISO);
  const hasFuel   = state.fuel.some(f=>f.date===dateISO);
  let b='';
  if(hasClimb)  b+='<span class="cell-badge cb-climb">climb</span>';
  if(hasCardio) b+='<span class="cell-badge cb-cardio">cardio</span>';
  if(hasStrength) b+='<span class="cell-badge cb-strength">strength</span>';
  if(hasFuel)   b+='<span class="cell-badge cb-fuel">fuel</span>';
  return b ? '<div class="cell-badges">'+b+'</div>' : '';
}

/* Vibe CSS class for a day entry */
function vibeClass(entry) {
  if(!entry) return '';
  const v=entry.vibe||'';
  if(v==='great') return 'vibe-great';
  if(v==='good') return 'vibe-good';
  if(v==='medium') return 'vibe-medium';
  if(v==='bad') return 'vibe-bad';
  return '';
}

function renderWeek() {
  const ws=currentWeekStart, we=addDays(ws,6);
  document.getElementById('period-label').textContent=fmtDate(ws)+' \u2013 '+fmtDate(we);
  const today=todayISO();
  const weekISOs=Array.from({length:7},(_,i)=>fmtISO(addDays(ws,i)));

  let html='<div class="cal-header">';
  ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].forEach(d=>html+='<div class="day-name">'+d+'</div>');
  html+='</div><div class="day-grid">';
  for(let i=0;i<7;i++){
    const d=addDays(ws,i), key=fmtISO(d), entry=state.days[key]||null;
    const vc=vibeClass(entry);
    const isToday=key===today;
    html+='<div class="day-cell '+vc+'" onclick="openDaySummaryModal(\''+key+'\')">'+
      '<div class="day-num'+(isToday?' today':'')+'">'+(isToday?'\u2022 ':'')+d.getDate()+'</div>'+
      cellBadges(key)+
      '<div class="day-content">'+esc(entry?entry.text:'')+'</div></div>';
  }
  html+='</div>';
  document.getElementById('calendar-area').innerHTML=html;
  renderPeriodStats(weekISOs, 'Week');
}

function renderMonth() {
  const y=currentMonthDate.getFullYear(), m=currentMonthDate.getMonth();
  document.getElementById('period-label').textContent=new Date(y,m,1).toLocaleDateString('en-US',{month:'long',year:'numeric'});
  const today=todayISO();

  const firstOfMonth=new Date(y,m,1);
  const startCell=getMonday(firstOfMonth);
  const lastOfMonth=new Date(y,m+1,0);
  const lastDay=lastOfMonth.getDay();
  const endCell=addDays(lastOfMonth,lastDay===0?0:7-lastDay);
  const totalCells=Math.round((endCell-startCell)/86400000)+1;

  let html='<div class="cal-header">';
  ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].forEach(d=>html+='<div class="day-name">'+d+'</div>');
  html+='</div><div class="month-grid">';
  const monthISOs=[];
  for(let i=0;i<totalCells;i++){
    const d=addDays(startCell,i), key=fmtISO(d), entry=state.days[key]||null;
    const otherMonth=d.getMonth()!==m;
    if(!otherMonth) monthISOs.push(key);
    const vc=vibeClass(entry);
    const isToday=key===today;
    html+='<div class="month-cell '+vc+(otherMonth?' other-month':'')+'" onclick="openDaySummaryModal(\''+key+'\')">'+
      '<div class="day-num'+(isToday?' today':'')+'">'+(isToday?'\u2022 ':'')+d.getDate()+'</div>'+
      cellBadges(key)+
      '<div class="day-content">'+esc(entry?entry.text:'')+'</div></div>';
  }
  html+='</div>';
  document.getElementById('calendar-area').innerHTML=html;
  renderPeriodStats(monthISOs, 'Month');
}

function changePlanMonth(dir) {
  currentPlanMonthDate=new Date(currentPlanMonthDate.getFullYear(),currentPlanMonthDate.getMonth()+dir,1);
  renderPlanMonth();
}
function changePlanWeek(dir) {
  currentPlanWeekStart=addDays(currentPlanWeekStart,dir*7);
  renderPlanWeek();
}

function renderPlanMonth() {
  const el=document.getElementById('plan-month-calendar');
  if(!el) return;
  const y=currentPlanMonthDate.getFullYear(), m=currentPlanMonthDate.getMonth();
  document.getElementById('plan-month-label').textContent=new Date(y,m,1).toLocaleDateString('en-US',{month:'long',year:'numeric'});
  const today=todayISO();

  const firstOfMonth=new Date(y,m,1);
  const startCell=getMonday(firstOfMonth);
  const lastOfMonth=new Date(y,m+1,0);
  const lastDay=lastOfMonth.getDay();
  const endCell=addDays(lastOfMonth,lastDay===0?0:7-lastDay);
  const totalCells=Math.round((endCell-startCell)/86400000)+1;

  let html='<div class="cal-header">';
  ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].forEach(d=>html+='<div class="day-name">'+d+'</div>');
  html+='</div><div class="month-grid">';
  for(let i=0;i<totalCells;i++){
    const d=addDays(startCell,i), key=fmtISO(d), plan=state.plan[key]||null;
    const otherMonth=d.getMonth()!==m;
    const isToday=key===today;
    const doneClass = plan&&plan.done ? ' plan-done' : '';
    html+='<div class="month-cell plan-cell'+doneClass+(otherMonth?' other-month':'')+'" onclick="openPlanModal(\''+key+'\')">'+
      '<div class="day-num'+(isToday?' today':'')+'">'+(isToday?'\u2022 ':'')+d.getDate()+'</div>'+
      (plan&&plan.done?'<div class="plan-check">\u2713</div>':'')+
      '<div class="day-content">'+esc(plan?plan.title:'')+'</div></div>';
  }
  html+='</div>';
  el.innerHTML=html;
}

function renderPlanWeek() {
  const el=document.getElementById('plan-week-body');
  if(!el) return;
  const ws=currentPlanWeekStart, we=addDays(ws,6);
  document.getElementById('plan-week-label').textContent=fmtDate(ws)+' \u2013 '+fmtDate(we);
  const today=todayISO();
  const dayNames=['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];

  let html='<div class="plan-week-list">';
  for(let i=0;i<7;i++){
    const d=addDays(ws,i), key=fmtISO(d), plan=state.plan[key]||null;
    const isToday=key===today;
    const done=!!(plan&&plan.done);
    html+='<div class="plan-day-card'+(done?' plan-done':'')+(isToday?' plan-today':'')+'">'+
      '<label class="plan-checkbox-wrap"><input type="checkbox" '+(done?'checked':'')+' onclick="event.stopPropagation();togglePlanDone(\''+key+'\')"></label>'+
      '<div class="plan-day-body" onclick="openPlanModal(\''+key+'\')">'+
      '<div class="plan-day-head">'+
        '<span class="plan-day-name">'+dayNames[i]+'</span>'+
        '<span class="plan-day-date">'+fmtDate(d)+'</span>'+
        (isToday?'<span class="plan-today-badge">Today</span>':'')+
      '</div>'+
      (plan&&plan.title?'<div class="plan-day-title">'+esc(plan.title)+'</div>':'<div class="plan-day-title plan-empty">No plan set \u2014 tap to add</div>')+
      (plan&&plan.detail?'<div class="plan-day-detail">'+esc(plan.detail)+'</div>':'')+
      '</div></div>';
  }
  html+='</div>';
  el.innerHTML=html;
}

/* Count total pitches/problems logged in a climb session */
function climbPitchCount(c) {
  return (c.rows||[]).reduce((s,r)=>s+(r.count||0),0);
}

function renderPeriodStats(isos, label) {
  const pC=state.climbs.filter(c=>isos.includes(c.date));
  const pA=state.cardio.filter(c=>isos.includes(c.date));
  const pS=state.strength.filter(s=>isos.includes(s.date));
  const pitches=pC.reduce((s,c)=>s+climbPitchCount(c),0);
  const mi=pA.reduce((s,c)=>s+(parseFloat(c.miles)||0),0);
  const vt=pA.reduce((s,c)=>s+(parseFloat(c.vert)||0),0);
  const sessions=pC.length+pA.length+pS.length;
  document.getElementById('period-stats').innerHTML=
    '<div class="stat-grid" style="margin-top:0.5rem">'+
    '<div class="stat-card"><div class="stat-val">'+pitches+'</div><div class="stat-label">'+label+' pitches/problems</div></div>'+
    '<div class="stat-card"><div class="stat-val">'+mi.toFixed(1)+'</div><div class="stat-label">'+label+' miles</div></div>'+
    '<div class="stat-card"><div class="stat-val">'+Math.round(vt).toLocaleString()+'</div><div class="stat-label">'+label+' vert (ft)</div></div>'+
    '<div class="stat-card"><div class="stat-val">'+sessions+'</div><div class="stat-label">'+label+' sessions</div></div></div>';
}

function climbEntryHtml(c) {
  const rows=(c.rows||[]).map(r=>r.count+'\u00d7 '+r.grade).join(' \u00b7 ');
  const pitchCount=climbPitchCount(c);
  return '<div class="log-entry" onclick="openClimbModal('+c._i+')">'+
    '<div class="entry-header"><span class="pill pill-'+esc(c.climbType||'climb')+'">'+esc(c.venue||'')+' '+esc(c.climbType||'')+'</span>'+
    (c.alpine?'<span class="pill pill-alpine">alpine</span>':'')+
    '<span class="entry-date">'+fmtDisplay(c.date)+'</span>'+
    (pitchCount?'<span class="entry-pts">'+pitchCount+' pitches</span>':'')+'</div>'+
    '<div class="entry-detail">'+esc(rows)+(c.notes?'<br><span class="entry-note">'+esc(c.notes)+'</span>':'')+'</div></div>';
}
function renderClimbs() {
  const tf=document.getElementById('climb-type-filter')?.value||'all';
  const vf=document.getElementById('climb-venue-filter')?.value||'all';
  const filtered=state.climbs.map((c,i)=>({...c,_i:i})).filter(c=>(tf==='all'||c.climbType===tf)&&(vf==='all'||c.venue===vf)).sort((a,b)=>b.date.localeCompare(a.date));
  const el=document.getElementById('climb-list');
  if(!filtered.length){el.innerHTML='<div class="empty-state">No sessions logged yet</div>';return;}
  el.innerHTML=filtered.map(climbEntryHtml).join('');
}

function cardioEntryHtml(c) {
  return '<div class="log-entry" onclick="openCardioModal('+c._i+')">'+
    '<div class="entry-header"><span class="pill pill-cardio">'+esc(c.actType||'cardio')+'</span>'+
    (c.alpine?'<span class="pill pill-alpine">alpine</span>':'')+
    (c.weighted?'<span class="pill pill-alpine">weighted</span>':'')+
    '<span class="entry-date">'+fmtDisplay(c.date)+'</span></div>'+
    '<div class="entry-detail">'+(c.objective?'<strong>'+esc(c.objective)+'</strong> \u00b7 ':'')+
    (c.miles?c.miles+' mi':'')+(c.vert?' \u00b7 '+Number(c.vert).toLocaleString()+' ft vert':'')+(c.time?' \u00b7 '+c.time+' hrs':'')+
    (c.notes?'<br><span class="entry-note">'+esc(c.notes)+'</span>':'')+'</div></div>';
}
function renderCardio() {
  const sorted=state.cardio.map((c,i)=>({...c,_i:i})).sort((a,b)=>b.date.localeCompare(a.date));
  const el=document.getElementById('cardio-list');
  if(!sorted.length){el.innerHTML='<div class="empty-state">No activities logged yet</div>';return;}
  el.innerHTML=sorted.map(cardioEntryHtml).join('');
}

function fuelEntryHtml(f) {
  return '<div class="fuel-entry" onclick="openFuelModal('+f._i+')">'+
    '<div class="fuel-header"><span class="pill pill-fuel">fuel &amp; gear</span>'+
    '<strong style="font-size:14px">'+esc(f.objective||'')+'</strong>'+
    '<span class="entry-date" style="margin-left:auto">'+fmtDisplay(f.date)+'</span></div>'+
    '<div class="fuel-body">'+esc([f.food&&('Food: '+f.food),f.gear&&('Gear: '+f.gear),f.notes&&('Notes: '+f.notes)].filter(Boolean).join('\n\n'))+'</div></div>';
}
function renderFuel() {
  const sorted=state.fuel.map((f,i)=>({...f,_i:i})).sort((a,b)=>b.date.localeCompare(a.date));
  const el=document.getElementById('fuel-list');
  if(!sorted.length){el.innerHTML='<div class="empty-state">No notes yet \u2014 log what you ate, drank, and wore on big days</div>';return;}
  el.innerHTML=sorted.map(fuelEntryHtml).join('');
}

/* ===================== STATS / PITCH BREAKDOWN ===================== */

// Current filter state for the pitch-count breakdown on the Stats tab
let statsFilter = { range: 'all', venue: 'all', type: 'all' };

function statsFilteredClimbs() {
  const now = new Date();
  let cutoff = null;
  if (statsFilter.range === '30d') cutoff = addDays(now, -30);
  else if (statsFilter.range === '90d') cutoff = addDays(now, -90);
  else if (statsFilter.range === 'ytd') cutoff = new Date(now.getFullYear(), 0, 1);
  const cutoffISO = cutoff ? fmtISO(cutoff) : null;

  return state.climbs.filter(c => {
    if (cutoffISO && c.date < cutoffISO) return false;
    if (statsFilter.venue !== 'all' && c.venue !== statsFilter.venue) return false;
    if (statsFilter.type !== 'all' && c.climbType !== statsFilter.type) return false;
    return true;
  });
}

function setStatsFilter(field, value) {
  statsFilter[field] = value;
  renderStats();
}

function renderStats() {
  const totalMi=state.cardio.reduce((s,c)=>s+(parseFloat(c.miles)||0),0);
  const totalVert=state.cardio.reduce((s,c)=>s+(parseFloat(c.vert)||0),0);
  const totalPitches=state.climbs.reduce((s,c)=>s+climbPitchCount(c),0);
  document.getElementById('stat-grid').innerHTML=
    '<div class="stat-card"><div class="stat-val">'+totalPitches+'</div><div class="stat-label">Total pitches/problems</div></div>'+
    '<div class="stat-card"><div class="stat-val">'+totalMi.toFixed(0)+'</div><div class="stat-label">Total miles</div></div>'+
    '<div class="stat-card"><div class="stat-val">'+Math.round(totalVert).toLocaleString()+'</div><div class="stat-label">Total vert (ft)</div></div>'+
    '<div class="stat-card"><div class="stat-val">'+(state.climbs.length+state.cardio.length)+'</div><div class="stat-label">Sessions</div></div>';
  const outC=state.climbs.filter(c=>c.venue==='outdoor').length;
  const inC=state.climbs.filter(c=>c.venue==='indoor').length;
  document.getElementById('stats-breakdown').innerHTML=
    '<div class="stat-grid">'+
    '<div class="stat-card"><div class="stat-val">'+outC+'</div><div class="stat-label">Outdoor sessions</div></div>'+
    '<div class="stat-card"><div class="stat-val">'+inC+'</div><div class="stat-label">Indoor sessions</div></div>'+
    '<div class="stat-card"><div class="stat-val">'+state.climbs.length+'</div><div class="stat-label">Climb sessions</div></div>'+
    '<div class="stat-card"><div class="stat-val">'+state.cardio.length+'</div><div class="stat-label">Cardio sessions</div></div></div>';

  renderPitchBreakdown();
}

function renderPitchBreakdown() {
  const climbs = statsFilteredClimbs();

  // Tally counts per grade label
  const tally = {}; // grade -> {count, cat, venue}
  climbs.forEach(c => {
    (c.rows||[]).forEach(r => {
      if (!r.grade || !r.count) return;
      if (!tally[r.grade]) tally[r.grade] = { count: 0, cat: c.climbType, venue: c.venue };
      tally[r.grade].count += r.count;
    });
  });

  const entries = Object.entries(tally).sort((a,b) => b[1].count - a[1].count);
  const totalForFilter = entries.reduce((s,[,v])=>s+v.count, 0);

  const filterRow =
    '<div class="filter-row" style="margin-top:1.5rem">'+
    '<select id="stats-range-filter" onchange="setStatsFilter(\'range\',this.value)" style="font-size:13px;padding:5px 10px;width:auto">'+
      '<option value="all"'+(statsFilter.range==='all'?' selected':'')+'>All time</option>'+
      '<option value="ytd"'+(statsFilter.range==='ytd'?' selected':'')+'>This year</option>'+
      '<option value="90d"'+(statsFilter.range==='90d'?' selected':'')+'>Last 90 days</option>'+
      '<option value="30d"'+(statsFilter.range==='30d'?' selected':'')+'>Last 30 days</option>'+
    '</select>'+
    '<select id="stats-venue-filter" onchange="setStatsFilter(\'venue\',this.value)" style="font-size:13px;padding:5px 10px;width:auto">'+
      '<option value="all"'+(statsFilter.venue==='all'?' selected':'')+'>Indoor + outdoor</option>'+
      '<option value="indoor"'+(statsFilter.venue==='indoor'?' selected':'')+'>Indoor</option>'+
      '<option value="outdoor"'+(statsFilter.venue==='outdoor'?' selected':'')+'>Outdoor</option>'+
    '</select>'+
    '<select id="stats-type-filter" onchange="setStatsFilter(\'type\',this.value)" style="font-size:13px;padding:5px 10px;width:auto">'+
      '<option value="all"'+(statsFilter.type==='all'?' selected':'')+'>All types</option>'+
      '<option value="boulder"'+(statsFilter.type==='boulder'?' selected':'')+'>Boulder</option>'+
      '<option value="sport"'+(statsFilter.type==='sport'?' selected':'')+'>Sport</option>'+
      '<option value="trad"'+(statsFilter.type==='trad'?' selected':'')+'>Trad</option>'+
    '</select>'+
    '</div>';

  let bodyHtml;
  if (!entries.length) {
    bodyHtml = '<div class="empty-state">No pitches/problems match this filter</div>';
  } else {
    const maxCount = entries[0][1].count;
    bodyHtml = '<div class="pitch-breakdown">' + entries.map(([grade, v]) => {
      const pct = maxCount ? Math.round((v.count / maxCount) * 100) : 0;
      return '<div class="pitch-row">'+
        '<div class="pitch-row-label">'+esc(grade)+'</div>'+
        '<div class="pitch-row-bar-track"><div class="pitch-row-bar" style="width:'+pct+'%"></div></div>'+
        '<div class="pitch-row-count">'+v.count+'</div>'+
      '</div>';
    }).join('') + '</div>';
  }

  const header = '<div class="section-divider" style="margin-top:0">Pitch / problem breakdown by grade'+
    (totalForFilter ? ' <span style="font-weight:400;color:var(--text-muted,inherit)">('+totalForFilter+' total)</span>' : '')+
    '</div>';

  document.getElementById('stats-pitch-breakdown').innerHTML = filterRow + header + bodyHtml;
}

function closeModal() { document.getElementById('modal-bg').classList.remove('open'); }
document.addEventListener('keydown',e=>{ if(e.key==='Escape') closeModal(); });
function openModal(html) { document.getElementById('modal-content').innerHTML=html; document.getElementById('modal-bg').classList.add('open'); }

function selTag(el,groupId) {
  document.getElementById(groupId).querySelectorAll('.tag,.vibe-tag').forEach(t=>t.classList.remove('selected'));
  el.classList.add('selected');
}
function getSelectedTag(groupId) {
  const el=document.getElementById(groupId)?.querySelector('.tag.selected,.vibe-tag.selected');
  return el?.dataset.val||el?.textContent.trim()||'';
}
/* Standalone (non-exclusive) toggle, used for the Alpine tag */
function toggleSoloTag(el) { el.classList.toggle('selected'); }

/* DAY MODAL */
/* Shown when a calendar cell is clicked -- a summary of everything logged
   that day (climbs, cardio, strength, vibe notes), each entry clickable to
   edit, plus buttons to add something new for the day. */
function dayVibeEntryHtml(dateISO) {
  const entry=state.days[dateISO];
  if(!entry || (!entry.text && !entry.vibe)) return '';
  const vLabel=entry.vibe ? entry.vibe.charAt(0).toUpperCase()+entry.vibe.slice(1) : '';
  return '<div class="log-entry" onclick="openDayModal(\''+dateISO+'\')">'+
    (entry.vibe?'<div class="entry-header"><span class="legend-dot ld-'+entry.vibe+'"></span><span class="entry-date">'+vLabel+'</span></div>':'')+
    (entry.text?'<div class="entry-detail"><span class="entry-note">'+esc(entry.text)+'</span></div>':'')+
    '</div>';
}
function openDaySummaryModal(dateISO) {
  dateISO = dateISO || todayISO();
  const climbs=state.climbs.map((c,i)=>({...c,_i:i})).filter(c=>c.date===dateISO);
  const cardio=state.cardio.map((c,i)=>({...c,_i:i})).filter(c=>c.date===dateISO);
  const strength=state.strength.map((s,i)=>({...s,_i:i})).filter(s=>s.date===dateISO);
  const fuel=state.fuel.map((f,i)=>({...f,_i:i})).filter(f=>f.date===dateISO);
  const entriesHtml = dayVibeEntryHtml(dateISO) +
    climbs.map(climbEntryHtml).join('') +
    cardio.map(cardioEntryHtml).join('') +
    strength.map(strengthEntryHtml).join('') +
    fuel.map(fuelEntryHtml).join('');
  const d="'"+dateISO+"'";
  openModal(
    '<div class="modal-header"><span class="modal-title">'+fmtDisplay(dateISO)+'</span>'+
    '<button class="close-btn" onclick="closeModal()">&times;</button></div>'+
    (entriesHtml || '<div class="empty-state">Nothing logged yet</div>')+
    '<div class="section-divider">Add</div>'+
    '<div class="form-row single"><div style="display:flex;flex-direction:column;gap:8px">'+
    '<button class="btn btn-accent" onclick="openClimbModal(null,'+d+')">Climb session</button>'+
    '<button class="btn btn-accent" onclick="openCardioModal(null,'+d+')">Cardio activity</button>'+
    '<button class="btn btn-accent" onclick="openStrengthModal(null,'+d+')">Strength / Stretch</button>'+
    '<button class="btn btn-accent" onclick="openDayModal('+d+')">Vibe notes</button>'+
    '</div></div>');
}

function openDayModal(key) {
  const entry=key?(state.days[key]||{}):{}; const dateVal=key||fmtISO(new Date());
  const dt=key?fmtDisplay(key):'New day';
  const vibe=entry.vibe||'';
  openModal(
    '<div class="modal-header"><span class="modal-title">'+(key?dt:'Log a day')+'</span>'+
    '<button class="close-btn" onclick="closeModal()">&times;</button></div>'+
    '<div class="form-row single"><div><label>Date</label><input type="date" id="m-date" value="'+dateVal+'"></div></div>'+
    '<div style="margin-bottom:14px"><label style="margin-bottom:8px;display:block">How did it go?</label>'+
    '<div class="tag-row" id="vibe-tags" style="gap:8px">'+
    '<button class="vibe-tag vgr'+(vibe==='great'?' selected':'')+'" data-val="great" onclick="selTag(this,\'vibe-tags\')">Great</button>'+
    '<button class="vibe-tag vg'+(vibe==='good'?' selected':'')+'" data-val="good" onclick="selTag(this,\'vibe-tags\')">Good</button>'+
    '<button class="vibe-tag vm'+(vibe==='medium'?' selected':'')+'" data-val="medium" onclick="selTag(this,\'vibe-tags\')">Medium</button>'+
    '<button class="vibe-tag vb'+(vibe==='bad'?' selected':'')+'" data-val="bad" onclick="selTag(this,\'vibe-tags\')">Bad</button>'+
    '</div></div>'+
    '<div class="form-row single"><div><label>Notes</label><textarea id="m-text" placeholder="What did you do? How\'d it feel?">'+esc(entry.text||'')+'</textarea></div></div>'+
    '<div class="modal-footer"><div class="modal-footer-left">'+
    (key?'<button class="btn btn-sm btn-danger" onclick="deleteDay(\''+key+'\')">Delete</button>':'')+
    '</div><button class="btn btn-sm btn-accent" onclick="saveDay(\''+esc(key||'')+'\')" >Save</button></div>');
}

function saveDay(key) {
  const date=document.getElementById('m-date').value;
  const text=document.getElementById('m-text').value;
  const vibe=document.getElementById('vibe-tags')?.querySelector('.vibe-tag.selected')?.dataset.val||'';
  // infer dayType from logged sessions for backward compat
  const hasClimb=state.climbs.some(c=>c.date===date);
  const hasCardio=state.cardio.some(c=>c.date===date);
  const dayType=hasClimb&&hasCardio?'both':hasClimb?'climb':hasCardio?'cardio':'';
  if(!date) return;
  state.days[date]={text,vibe,dayType};
  saveState(); closeModal(); renderCalendar();
}
function deleteDay(key) { delete state.days[key]; saveState(); closeModal(); renderCalendar(); }

/* PLAN MODAL -- planned workouts/trips, separate store from actual logged days */
function renderPlanViews() { renderPlanMonth(); renderPlanWeek(); }

function togglePlanDone(key) {
  if(!state.plan[key]) state.plan[key]={title:'',detail:'',done:false};
  state.plan[key].done=!state.plan[key].done;
  saveState(); renderPlanViews();
}

function openPlanModal(key) {
  const plan=key?(state.plan[key]||{}):{};
  const dateVal=key||fmtISO(new Date());
  const hasContent=!!(plan.title||plan.detail);
  openModal(
    '<div class="modal-header"><span class="modal-title">'+(key?'Plan \u2014 '+fmtDisplay(key):'Add plan item')+'</span>'+
    '<button class="close-btn" onclick="closeModal()">&times;</button></div>'+
    '<div class="form-row single"><div><label>Date</label><input type="date" id="m-date" value="'+dateVal+'"'+(key?' readonly':'')+'></div></div>'+
    '<div class="form-row single"><div><label>Title</label><input type="text" id="m-plan-title" value="'+esc(plan.title||'')+'" placeholder="e.g. Boulder session, Yosemite trip, Rest day"></div></div>'+
    '<div class="form-row single"><div><label>Details</label><textarea id="m-plan-detail" placeholder="What to focus on, trip logistics, anything worth noting...">'+esc(plan.detail||'')+'</textarea></div></div>'+
    '<div class="form-row single"><div><label class="plan-modal-done-label"><input type="checkbox" id="m-plan-done" '+(plan.done?'checked':'')+'> Mark as done</label></div></div>'+
    '<div class="modal-footer"><div class="modal-footer-left">'+
    (key&&hasContent?'<button class="btn btn-sm btn-danger" onclick="deletePlan(\''+key+'\')">Delete</button>':'')+
    '</div><button class="btn btn-sm btn-accent" onclick="savePlan(\''+esc(key||'')+'\')">Save</button></div>');
}

function savePlan(key) {
  const dateInput=document.getElementById('m-date').value;
  const date=key||dateInput;
  const title=document.getElementById('m-plan-title').value;
  const detail=document.getElementById('m-plan-detail').value;
  const done=document.getElementById('m-plan-done').checked;
  if(!date) return;
  if(!title&&!detail) delete state.plan[date];
  else state.plan[date]={title,detail,done};
  saveState(); closeModal(); renderPlanViews();
}
function deletePlan(key) { delete state.plan[key]; saveState(); closeModal(); renderPlanViews(); }

/* ===================== BIG GOALS ===================== */
const GOAL_CATEGORIES = ['climbing','cardio','strength','general'];

function renderGoals() {
  const el=document.getElementById('goals-list');
  if(!el) return;
  const sf=document.getElementById('goals-status-filter')?.value||'all';
  const filtered=state.goals.filter(g=>sf==='all'||g.status===sf);
  if(!filtered.length){el.innerHTML='<div class="empty-state">No goals yet \u2014 add your big picture targets for the year (or years) ahead</div>';return;}
  const sorted=[...filtered].sort((a,b)=>(a.targetDate||'9999-99-99').localeCompare(b.targetDate||'9999-99-99'));
  el.innerHTML=sorted.map(g=>{
    const idx=state.goals.indexOf(g);
    const total=(g.milestones||[]).length;
    const doneCount=(g.milestones||[]).filter(m=>m.done).length;
    const pct=total?Math.round(doneCount/total*100):0;
    const msHtml=(g.milestones||[]).map(ms=>
      '<div class="milestone-item'+(ms.done?' done':'')+'">'+
      '<input type="checkbox" '+(ms.done?'checked':'')+' onclick="event.stopPropagation();toggleMilestone(\''+g.id+'\',\''+ms.id+'\')">'+
      '<span>'+esc(ms.text)+'</span></div>'
    ).join('');
    return '<div class="goal-card status-'+esc(g.status||'not-started')+'">'+
      '<div class="goal-header" onclick="openGoalModal('+idx+')">'+
        '<span class="pill pill-goal-'+esc(g.category||'general')+'">'+esc(g.category||'general')+'</span>'+
        '<span class="goal-title">'+esc(g.title)+'</span>'+
        (g.targetDate?'<span class="entry-date" style="margin-left:auto">'+fmtDisplay(g.targetDate)+'</span>':'')+
      '</div>'+
      (g.notes?'<div class="goal-notes" onclick="openGoalModal('+idx+')">'+esc(g.notes)+'</div>':'')+
      (total?'<div class="goal-progress-track"><div class="goal-progress-bar" style="width:'+pct+'%"></div></div><div class="milestone-list">'+msHtml+'</div>':'')+
    '</div>';
  }).join('');
}

function setGoalsFilter() { renderGoals(); }

function toggleMilestone(goalId,msId) {
  const g=state.goals.find(g=>g.id===goalId);
  if(!g) return;
  const ms=(g.milestones||[]).find(m=>m.id===msId);
  if(!ms) return;
  ms.done=!ms.done;
  saveState(); renderGoals(); renderYearly();
}

function milestoneRowHtml(ms) {
  return '<div class="subrow milestone-row" data-id="'+esc(ms.id||'')+'" style="grid-template-columns:24px 1fr 28px">'+
    '<input type="checkbox" '+(ms.done?'checked':'')+'>'+
    '<input type="text" value="'+esc(ms.text||'')+'" placeholder="Milestone...">'+
    '<button class="remove-btn" onclick="this.closest(\'.milestone-row\').remove()">&times;</button></div>';
}
function addMilestoneRow() {
  const wrap=document.getElementById('goal-milestones');
  const div=document.createElement('div');
  div.innerHTML=milestoneRowHtml({});
  wrap.appendChild(div.firstElementChild);
}

function openGoalModal(idx) {
  const editing=idx!==null&&idx!==undefined&&idx>=0;
  const g=editing?state.goals[idx]:{};
  const category=g.category||'climbing', status=g.status||'not-started';
  const msHtml=(g.milestones||[]).map(milestoneRowHtml).join('');
  openModal(
    '<div class="modal-header"><span class="modal-title">'+(editing?'Edit goal':'Add a big goal')+'</span>'+
    '<button class="close-btn" onclick="closeModal()">&times;</button></div>'+
    '<div class="form-row single"><div><label>Title</label><input type="text" id="m-goal-title" value="'+esc(g.title||'')+'" placeholder="e.g. Send a 5.12 outdoors, run a 50k"></div></div>'+
    '<div class="form-row">'+
    '<div><label>Target date</label><input type="date" id="m-goal-date" value="'+esc(g.targetDate||'')+'"></div>'+
    '<div><label>Category</label><select id="m-goal-category">'+
    GOAL_CATEGORIES.map(c=>'<option value="'+c+'"'+(c===category?' selected':'')+'>'+c.charAt(0).toUpperCase()+c.slice(1)+'</option>').join('')+
    '</select></div></div>'+
    '<div class="form-row single"><div><label>Status</label><select id="m-goal-status">'+
    '<option value="not-started"'+(status==='not-started'?' selected':'')+'>Not started</option>'+
    '<option value="in-progress"'+(status==='in-progress'?' selected':'')+'>In progress</option>'+
    '<option value="done"'+(status==='done'?' selected':'')+'>Done</option>'+
    '</select></div></div>'+
    '<div class="form-row single"><div><label>Notes</label><textarea id="m-goal-notes" placeholder="Why this matters, what success looks like...">'+esc(g.notes||'')+'</textarea></div></div>'+
    '<div class="section-divider">Milestones</div>'+
    '<div id="goal-milestones">'+msHtml+'</div>'+
    '<button class="add-row-btn" onclick="addMilestoneRow()">+ Add milestone</button>'+
    '<div class="modal-footer"><div class="modal-footer-left">'+
    (editing?'<button class="btn btn-sm btn-danger" onclick="deleteGoal('+idx+')">Delete</button>':'')+
    '</div><button class="btn btn-sm btn-accent" onclick="saveGoal('+(editing?idx:-1)+')">Save goal</button></div>');
}

function saveGoal(idx) {
  const title=document.getElementById('m-goal-title').value.trim();
  if(!title) return;
  const targetDate=document.getElementById('m-goal-date').value;
  const category=document.getElementById('m-goal-category').value;
  const status=document.getElementById('m-goal-status').value;
  const notes=document.getElementById('m-goal-notes').value;
  const milestones=[];
  document.querySelectorAll('#goal-milestones .milestone-row').forEach(row=>{
    const text=row.querySelector('input[type="text"]').value.trim();
    if(!text) return;
    const done=row.querySelector('input[type="checkbox"]').checked;
    milestones.push({id:row.dataset.id||genId(),text,done});
  });
  const entry={id:(idx>=0?state.goals[idx].id:genId()),title,targetDate,category,status,notes,milestones};
  if(idx>=0) state.goals[idx]=entry; else state.goals.push(entry);
  saveState(); closeModal(); renderGoals(); renderYearly();
}
function deleteGoal(idx) { state.goals.splice(idx,1); saveState(); closeModal(); renderGoals(); renderYearly(); }

/* ===================== TRAINING CYCLES ===================== */
function renderCycles() {
  const el=document.getElementById('cycles-list');
  if(!el) return;
  if(!state.cycles.length){el.innerHTML='<div class="empty-state">No training cycles yet \u2014 block out phases like "Yosemite prep" or "Winter base building"</div>';return;}
  const sorted=[...state.cycles].sort((a,b)=>(a.startDate||'').localeCompare(b.startDate||''));
  const today=todayISO();
  el.innerHTML=sorted.map(c=>{
    const idx=state.cycles.indexOf(c);
    const isCurrent=!!(c.startDate&&c.endDate&&today>=c.startDate&&today<=c.endDate);
    return '<div class="log-entry cycle-card'+(isCurrent?' cycle-current':'')+'" onclick="openCycleModal('+idx+')">'+
      '<div class="entry-header"><span class="cycle-title">'+esc(c.title)+'</span>'+
      (isCurrent?'<span class="pill pill-current">current</span>':'')+
      '<span class="entry-date" style="margin-left:auto">'+(c.startDate?fmtDisplay(c.startDate):'?')+' \u2013 '+(c.endDate?fmtDisplay(c.endDate):'?')+'</span></div>'+
      (c.focus?'<div class="entry-detail">'+esc(c.focus)+'</div>':'')+
    '</div>';
  }).join('');
}

function openCycleModal(idx) {
  const editing=idx!==null&&idx!==undefined&&idx>=0;
  const c=editing?state.cycles[idx]:{};
  openModal(
    '<div class="modal-header"><span class="modal-title">'+(editing?'Edit training cycle':'Add a training cycle')+'</span>'+
    '<button class="close-btn" onclick="closeModal()">&times;</button></div>'+
    '<div class="form-row single"><div><label>Title</label><input type="text" id="m-cycle-title" value="'+esc(c.title||'')+'" placeholder="e.g. Yosemite prep, Winter base building"></div></div>'+
    '<div class="form-row">'+
    '<div><label>Start date</label><input type="date" id="m-cycle-start" value="'+esc(c.startDate||'')+'"></div>'+
    '<div><label>End date</label><input type="date" id="m-cycle-end" value="'+esc(c.endDate||'')+'"></div></div>'+
    '<div class="form-row single"><div><label>Focus</label><textarea id="m-cycle-focus" placeholder="What this block is building toward...">'+esc(c.focus||'')+'</textarea></div></div>'+
    '<div class="modal-footer"><div class="modal-footer-left">'+
    (editing?'<button class="btn btn-sm btn-danger" onclick="deleteCycle('+idx+')">Delete</button>':'')+
    '</div><button class="btn btn-sm btn-accent" onclick="saveCycle('+(editing?idx:-1)+')">Save cycle</button></div>');
}

function saveCycle(idx) {
  const title=document.getElementById('m-cycle-title').value.trim();
  if(!title) return;
  const startDate=document.getElementById('m-cycle-start').value;
  const endDate=document.getElementById('m-cycle-end').value;
  const focus=document.getElementById('m-cycle-focus').value;
  const entry={id:(idx>=0?state.cycles[idx].id:genId()),title,startDate,endDate,focus};
  if(idx>=0) state.cycles[idx]=entry; else state.cycles.push(entry);
  saveState(); closeModal(); renderCycles(); renderYearly();
}
function deleteCycle(idx) { state.cycles.splice(idx,1); saveState(); closeModal(); renderCycles(); renderYearly(); }

/* ===================== YEARLY OVERVIEW ===================== */
function changeYear(dir) { currentYear+=dir; renderYearly(); }

function dayActivityCount(iso) {
  let n=0;
  n+=state.climbs.filter(c=>c.date===iso).length;
  n+=state.cardio.filter(c=>c.date===iso).length;
  n+=state.strength.filter(c=>c.date===iso).length;
  return n;
}
function heatLevel(n) { if(n<=0) return 0; if(n===1) return 1; if(n===2) return 2; if(n<=4) return 3; return 4; }

function renderYearlyHeatmap(year) {
  const jan1=new Date(year,0,1);
  const startOffset=(jan1.getDay()+6)%7; // days to prepend so weeks start Monday
  const dec31=new Date(year,11,31);
  const totalDays=Math.round((dec31-jan1)/86400000)+1;
  const cells=[];
  for(let i=0;i<startOffset;i++) cells.push(null);
  for(let i=0;i<totalDays;i++) cells.push(fmtISO(addDays(jan1,i)));
  const weekCols=[];
  for(let i=0;i<cells.length;i+=7) weekCols.push(cells.slice(i,i+7));
  const monthNames=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  let lastMonth=-1;
  const colsHtml=weekCols.map(week=>{
    let label='';
    week.forEach(iso=>{
      if(!iso) return;
      const day=+iso.slice(8,10), month=+iso.slice(5,7)-1;
      if(day===1&&month!==lastMonth){ label=monthNames[month]; lastMonth=month; }
    });
    const dayCells=week.map(iso=>{
      if(!iso) return '<div class="heat-cell heat-empty"></div>';
      const n=dayActivityCount(iso), lvl=heatLevel(n);
      return '<div class="heat-cell heat-lvl'+lvl+'" title="'+fmtDisplay(iso)+' \u2014 '+n+' session'+(n===1?'':'s')+'"></div>';
    }).join('');
    return '<div class="heat-week-col"><div class="heat-month-label">'+label+'</div><div class="heat-week-cells">'+dayCells+'</div></div>';
  }).join('');
  return '<div class="heatmap-wrap"><div class="heatmap-scroll">'+colsHtml+'</div></div>'+
    '<div class="heat-legend">Less <span class="heat-cell heat-lvl0"></span><span class="heat-cell heat-lvl1"></span><span class="heat-cell heat-lvl2"></span><span class="heat-cell heat-lvl3"></span><span class="heat-cell heat-lvl4"></span> More</div>';
}

function renderYearlyMonths(year) {
  const monthNames=['January','February','March','April','May','June','July','August','September','October','November','December'];
  let html='<div class="year-month-grid">';
  for(let m=0;m<12;m++){
    const first=fmtISO(new Date(year,m,1));
    const last=fmtISO(new Date(year,m+1,0));
    const inMonth=iso=>iso&&iso>=first&&iso<=last;
    const climbs=state.climbs.filter(c=>inMonth(c.date));
    const cardio=state.cardio.filter(c=>inMonth(c.date));
    const strength=state.strength.filter(c=>inMonth(c.date));
    const pitches=climbs.reduce((s,c)=>s+climbPitchCount(c),0);
    const miles=cardio.reduce((s,c)=>s+(parseFloat(c.miles)||0),0);
    const sessions=climbs.length+cardio.length+strength.length;
    const goalsThisMonth=state.goals.filter(g=>inMonth(g.targetDate));
    const cyclesThisMonth=state.cycles.filter(c=>c.startDate&&c.endDate&&c.startDate<=last&&c.endDate>=first);
    html+='<div class="year-month-card">'+
      '<div class="year-month-title">'+monthNames[m]+'</div>'+
      '<div class="year-month-stats">'+sessions+' sessions \u00b7 '+pitches+' pitches \u00b7 '+miles.toFixed(1)+' mi</div>'+
      (cyclesThisMonth.length?'<div class="year-month-tags">'+cyclesThisMonth.map(c=>'<span class="pill pill-cycle">'+esc(c.title)+'</span>').join('')+'</div>':'')+
      (goalsThisMonth.length?'<div class="year-month-tags">'+goalsThisMonth.map(g=>'<span class="pill pill-goal-deadline">\ud83c\udfaf '+esc(g.title)+'</span>').join('')+'</div>':'')+
    '</div>';
  }
  html+='</div>';
  return html;
}

function renderYearly() {
  if(!document.getElementById('yearly-heatmap')) return;
  document.getElementById('year-label').textContent=String(currentYear);
  document.getElementById('yearly-heatmap').innerHTML=renderYearlyHeatmap(currentYear);
  document.getElementById('yearly-months').innerHTML=renderYearlyMonths(currentYear);
}

/* CLIMB MODAL */
function climbGradeOpts(cat,venue) {
  return CLIMB_GRADES.filter(g=>g.cat===cat&&g.venue===venue).map(g=>'<option value="'+esc(g.k)+'">'+esc(g.k)+'</option>').join('');
}
function openClimbModal(idx, presetDate) {
  const editing=idx!==null&&idx!==undefined&&idx>=0;
  const c=editing?state.climbs[idx]:{};
  const venue=c.venue||'indoor', ct=c.climbType||'boulder';
  const dateVal=c.date||presetDate||fmtISO(new Date());
  const rowsHtml=(c.rows&&c.rows.length?c.rows:[{grade:'',count:1}]).map(r=>{
    const opts=CLIMB_GRADES.filter(g=>g.cat===ct&&g.venue===venue).map(g=>'<option value="'+esc(g.k)+'"'+(g.k===r.grade?' selected':'')+'>'+esc(g.k)+'</option>').join('');
    return '<div class="subrow"><select>'+opts+'</select>'+
      '<input type="number" min="1" max="99" value="'+(r.count||1)+'">'+
      '<button class="remove-btn" onclick="this.closest(\'.subrow\').remove()">&times;</button></div>';
  }).join('');
  openModal(
    '<div class="modal-header"><span class="modal-title">'+(editing?'Edit session':'Log a climb session')+'</span>'+
    '<button class="close-btn" onclick="closeModal()">&times;</button></div>'+
    '<div class="form-row">'+
    '<div><label>Date</label><input type="date" id="m-date" value="'+dateVal+'"></div>'+
    '<div><label>Venue</label><select id="m-venue" onchange="refreshClimbGrades()">'+
    '<option value="indoor"'+(venue==='indoor'?' selected':'')+'>Indoor</option>'+
    '<option value="outdoor"'+(venue==='outdoor'?' selected':'')+'>Outdoor</option>'+
    '</select></div></div>'+
    '<div style="margin-bottom:12px"><label style="margin-bottom:6px">Type</label>'+
    '<div class="tag-row" id="climb-type-tags">'+
    '<button class="tag'+(ct==='boulder'?' selected':'')+'" onclick="selTag(this,\'climb-type-tags\');refreshClimbGrades()">Boulder</button>'+
    '<button class="tag'+(ct==='sport'?' selected':'')+'" onclick="selTag(this,\'climb-type-tags\');refreshClimbGrades()">Sport</button>'+
    '<button class="tag'+(ct==='trad'?' selected':'')+'" onclick="selTag(this,\'climb-type-tags\');refreshClimbGrades()">Trad</button>'+
    '</div></div>'+
    '<div id="climb-alpine-wrap" style="margin-bottom:12px'+(ct==='boulder'?';display:none':'')+'">'+
    '<button class="tag'+(c.alpine?' selected':'')+'" id="climb-alpine-tag" onclick="toggleSoloTag(this)">Alpine</button>'+
    '</div>'+
    '<div class="section-divider">Pitches / problems</div>'+
    '<div id="climb-subrows">'+rowsHtml+'</div>'+
    '<button class="add-row-btn" onclick="addClimbRow()">+ Add grade</button>'+
    '<div class="form-row single"><div><label>Notes</label><textarea id="m-notes" placeholder="Sends, projects, how you felt...">'+esc(c.notes||'')+'</textarea></div></div>'+
    '<div class="modal-footer"><div class="modal-footer-left">'+
    (editing?'<button class="btn btn-sm btn-danger" onclick="deleteClimb('+idx+')">Delete</button>':'')+
    '</div><button class="btn btn-sm btn-accent" onclick="saveClimb('+(editing?idx:-1)+')">Save session</button></div>');
}
function refreshClimbGrades() {
  const venue=document.getElementById('m-venue').value;
  const ct=getSelectedTag('climb-type-tags').toLowerCase();
  document.querySelectorAll('#climb-subrows .subrow').forEach(row=>{
    row.querySelector('select').innerHTML=climbGradeOpts(ct,venue);
  });
  const alpineWrap=document.getElementById('climb-alpine-wrap');
  if(alpineWrap) alpineWrap.style.display = ct==='boulder' ? 'none' : '';
}
function addClimbRow() {
  const venue=document.getElementById('m-venue')?.value||'indoor';
  const ct=getSelectedTag('climb-type-tags').toLowerCase()||'boulder';
  const row=document.createElement('div'); row.className='subrow';
  row.innerHTML='<select>'+climbGradeOpts(ct,venue)+'</select>'+
    '<input type="number" min="1" max="99" value="1">'+
    '<button class="remove-btn" onclick="this.closest(\'.subrow\').remove()">&times;</button>';
  document.getElementById('climb-subrows').appendChild(row);
}
function saveClimb(idx) {
  const date=document.getElementById('m-date').value;
  const venue=document.getElementById('m-venue').value;
  const ct=getSelectedTag('climb-type-tags').toLowerCase()||'boulder';
  const alpine=document.getElementById('climb-alpine-tag')?.classList.contains('selected')&&ct!=='boulder';
  const notes=document.getElementById('m-notes').value;
  const rows=[];
  document.querySelectorAll('#climb-subrows .subrow').forEach(row=>{
    const sel=row.querySelector('select'),inp=row.querySelector('input');
    const count=parseInt(inp?.value)||0;
    const grade=sel?.value||'';
    if(count>0 && grade){rows.push({grade,count});}
  });
  const entry={date,venue,climbType:ct,alpine,rows,notes};
  if(idx>=0) state.climbs[idx]=entry; else state.climbs.push(entry);
  saveState(); closeModal(); renderClimbs(); renderCalendar(); renderStats();
}
function deleteClimb(idx) { state.climbs.splice(idx,1); saveState(); closeModal(); renderClimbs(); renderCalendar(); renderStats(); }

/* CARDIO MODAL */
function openCardioModal(idx, presetDate) {
  const editing=idx!==null&&idx!==undefined&&idx>=0;
  const c=editing?state.cardio[idx]:{};
  const dateVal=c.date||presetDate||fmtISO(new Date());
  openModal(
    '<div class="modal-header"><span class="modal-title">'+(editing?'Edit activity':'Log a cardio activity')+'</span>'+
    '<button class="close-btn" onclick="closeModal()">&times;</button></div>'+
    '<div class="form-row">'+
    '<div><label>Date</label><input type="date" id="m-date" value="'+dateVal+'"></div>'+
    '<div><label>Activity type</label><select id="m-acttype">'+
    ['run','trail run','hike','scramble','bike','stationary bike'].map(t=>'<option value="'+t+'"'+(c.actType===t?' selected':'')+'>'+t+'</option>').join('')+
    '</select></div></div>'+
    '<div class="tag-row" style="margin-bottom:12px">'+
    '<button class="tag'+(c.alpine?' selected':'')+'" id="cardio-alpine-tag" onclick="toggleSoloTag(this)">Alpine</button>'+
    '<button class="tag'+(c.weighted?' selected':'')+'" id="cardio-weighted-tag" onclick="toggleSoloTag(this)">Weighted</button>'+
    '</div>'+
    '<div class="form-row single"><div><label>Objective / route</label><input type="text" id="m-objective" value="'+esc(c.objective||'')+'" placeholder="e.g. Green Mountain, Anenome loop"></div></div>'+
    '<div class="form-row three">'+
    '<div><label>Miles</label><input type="number" id="m-miles" step="0.1" min="0" value="'+esc(c.miles||'')+'" placeholder="0.0"></div>'+
    '<div><label>Vert (ft)</label><input type="number" id="m-vert" step="100" min="0" value="'+esc(c.vert||'')+'" placeholder="0"></div>'+
    '<div><label>Time (hrs)</label><input type="number" id="m-time" step="0.1" min="0" value="'+esc(c.time||'')+'" placeholder="0.0"></div></div>'+
    '<div class="form-row single"><div><label>Notes</label><textarea id="m-notes" placeholder="How it felt, conditions, anything notable...">'+esc(c.notes||'')+'</textarea></div></div>'+
    '<div class="modal-footer"><div class="modal-footer-left">'+
    (editing?'<button class="btn btn-sm btn-danger" onclick="deleteCardio('+idx+')">Delete</button>':'')+
    '</div><button class="btn btn-sm btn-accent" onclick="saveCardio('+(editing?idx:-1)+')">Save activity</button></div>');
}
function saveCardio(idx) {
  const date=document.getElementById('m-date').value;
  const actType=document.getElementById('m-acttype').value;
  const alpine=document.getElementById('cardio-alpine-tag')?.classList.contains('selected');
  const weighted=document.getElementById('cardio-weighted-tag')?.classList.contains('selected');
  const objective=document.getElementById('m-objective').value;
  const miles=document.getElementById('m-miles').value;
  const vert=document.getElementById('m-vert').value;
  const time=document.getElementById('m-time').value;
  const notes=document.getElementById('m-notes').value;
  const entry={date,actType,alpine,weighted,objective,miles,vert,time,notes};
  if(idx>=0) state.cardio[idx]=entry; else state.cardio.push(entry);
  saveState(); closeModal(); renderCardio(); renderCalendar(); renderStats();
}
function deleteCardio(idx) { state.cardio.splice(idx,1); saveState(); closeModal(); renderCardio(); renderCalendar(); renderStats(); }

/* STRENGTH / PT MODAL */
function strengthAreaLabel(area) {
  return area==='upper'?'Upper body':area==='lower'?'Lower body':area==='core'?'Core':area==='wrist'?'Finger strength':area;
}
function strengthKindLabel(kind) { return kind==='stretch'?'Stretch':'Strength'; }

function exerciseOptionsHtml(area, selectedId) {
  ensureExerciseLibrary();
  const list=state.exerciseLibrary[area]||[];
  if(!list.length) return '<option value="">No exercises yet -- add one under Manage exercises</option>';
  return list.map(e=>'<option value="'+esc(e.id)+'"'+(e.id===selectedId?' selected':'')+'>'+esc(e.name)+'</option>').join('');
}
function findLibraryExercise(area, exId) {
  ensureExerciseLibrary();
  return (state.exerciseLibrary[area]||[]).find(e=>e.id===exId);
}
function exerciseRowHtml(area, ex) {
  ex = ex || {};
  const libEx = findLibraryExercise(area, ex.exId) || (state.exerciseLibrary[area]||[])[0] || {};
  const exId = ex.exId || libEx.id || '';
  const isWrist = area==='wrist';
  const uni = !isWrist && (ex.unilateral!==undefined ? !!ex.unilateral : !!libEx.unilateral);
  const status = ex.status || (ex.done ? 'done' : '');
  const statusBtn = (val, label, icon) => '<button type="button" class="ex-status-btn ex-status-'+val+(status===val?' selected':'')+'" data-status="'+val+'" onclick="setExStatus(this)" title="'+label+'">'+icon+'</button>';
  const statusGroupHtml = '<div class="ex-status-group">'+
    statusBtn('done','Done','\u2713')+
    statusBtn('not-done','Not done','\u2715')+
    statusBtn('transferred','Transferred to a different day/workout','\u21b7')+
    '</div>';
  const fieldsHtml = isWrist
    ? '<div class="ex-row-fields wrist-fields">'+
      '<input type="number" class="ex-sets" min="0" placeholder="Sets" value="'+esc(ex.sets||'')+'">'+
      '<input type="number" class="ex-time" min="0" step="0.5" placeholder="Time (s)" value="'+esc(ex.time||'')+'">'+
      '<input type="number" class="ex-addedweight" min="0" step="0.5" placeholder="Added wt (lb)" value="'+esc(ex.addedWeight||'')+'">'+
      '<select class="ex-type">'+
      '<option value="repeater"'+(ex.fingerType==='repeater'||!ex.fingerType?' selected':'')+'>Repeater</option>'+
      '<option value="maxhang"'+(ex.fingerType==='maxhang'?' selected':'')+'>Max hang</option>'+
      '</select>'+
      '</div>'
    : '<div class="ex-row-fields" style="'+(uni?'display:none':'')+'">'+
      '<input type="number" class="ex-sets" min="0" placeholder="Sets" value="'+esc(ex.sets||'')+'">'+
      '<input type="number" class="ex-reps" min="0" placeholder="Reps" value="'+esc(ex.reps||'')+'">'+
      '<input type="number" class="ex-weight" min="0" step="0.5" placeholder="Weight (lb)" value="'+esc(ex.weight||'')+'">'+
      '</div>'+
      '<div class="ex-row-sides" style="'+(uni?'':'display:none')+'">'+
      '<div class="ex-side"><span class="ex-side-label">L</span>'+
      '<input type="number" class="ex-setsL" min="0" placeholder="Sets" value="'+esc(ex.setsL||'')+'">'+
      '<input type="number" class="ex-repsL" min="0" placeholder="Reps" value="'+esc(ex.repsL||'')+'">'+
      '<input type="number" class="ex-weightL" min="0" step="0.5" placeholder="Wt" value="'+esc(ex.weightL||'')+'">'+
      '</div>'+
      '<div class="ex-side"><span class="ex-side-label">R</span>'+
      '<input type="number" class="ex-setsR" min="0" placeholder="Sets" value="'+esc(ex.setsR||'')+'">'+
      '<input type="number" class="ex-repsR" min="0" placeholder="Reps" value="'+esc(ex.repsR||'')+'">'+
      '<input type="number" class="ex-weightR" min="0" step="0.5" placeholder="Wt" value="'+esc(ex.weightR||'')+'">'+
      '</div>'+
      '</div>';
  return '<div class="ex-row" data-uni="'+(uni?'1':'0')+'" data-area="'+esc(area)+'">'+
    '<div class="ex-row-top">'+
    statusGroupHtml+
    '<select class="ex-select">'+exerciseOptionsHtml(area, exId)+'</select>'+
    (isWrist ? '' : '<button type="button" class="ex-uni-toggle'+(uni?' selected':'')+'" onclick="toggleExUnilateral(this)" title="Track left/right separately">L/R</button>')+
    '<button class="remove-btn" onclick="this.closest(\'.ex-row\').remove()">&times;</button>'+
    '</div>'+
    fieldsHtml+
    '<input type="text" class="ex-notes" placeholder="'+(status==='transferred'?'Where/when did it move to? (optional)':status==='not-done'?'Why not done? (optional)':'Notes for this exercise (optional)...')+'" value="'+esc(ex.notes||'')+'">'+
    '</div>';
}
function setExStatus(btn) {
  const group=btn.closest('.ex-status-group');
  const wasSelected=btn.classList.contains('selected');
  group.querySelectorAll('.ex-status-btn').forEach(b=>b.classList.remove('selected'));
  if(!wasSelected) btn.classList.add('selected');
  const status=wasSelected?'':btn.dataset.status;
  const notesInput=btn.closest('.ex-row').querySelector('.ex-notes');
  if(notesInput && !notesInput.value) {
    notesInput.placeholder = status==='transferred' ? 'Where/when did it move to? (optional)'
      : status==='not-done' ? 'Why not done? (optional)'
      : 'Notes for this exercise (optional)...';
  }
}
function toggleExUnilateral(btn) {
  const row=btn.closest('.ex-row');
  const nowUni=!btn.classList.contains('selected');
  btn.classList.toggle('selected', nowUni);
  row.dataset.uni = nowUni?'1':'0';
  row.querySelector('.ex-row-fields').style.display = nowUni?'none':'';
  row.querySelector('.ex-row-sides').style.display = nowUni?'':'none';
}
function addExerciseRow() {
  const area=getSelectedTag('strength-area-tags')||'upper';
  const wrap=document.getElementById('strength-exercise-rows');
  if(!wrap) return;
  const holder=document.createElement('div');
  holder.innerHTML=exerciseRowHtml(area, null);
  wrap.appendChild(holder.firstElementChild);
}
function refreshExerciseRowsForArea() {
  // Area changed -- each row's exercise dropdown needs to reflect the new
  // area's library (exercises are area-specific), so re-populate options.
  const area=getSelectedTag('strength-area-tags')||'upper';
  document.querySelectorAll('#strength-exercise-rows .ex-row').forEach(row=>{
    row.querySelector('.ex-select').innerHTML=exerciseOptionsHtml(area, null);
  });
}
function openStrengthModal(idx, presetDate) {
  const editing=idx!==null&&idx!==undefined&&idx>=0;
  const s=editing?state.strength[idx]:{};
  const area=s.area||'upper';
  const kind=s.kind||'strength';
  const dateVal=s.date||presetDate||fmtISO(new Date());
  ensureExerciseLibrary();
  const exercises=(s.exercises&&s.exercises.length)?s.exercises:[];
  const rowsHtml = exercises.length
    ? exercises.map(ex=>exerciseRowHtml(area, ex)).join('')
    : (kind==='strength' ? exerciseRowHtml(area, null) : '');
  openModal(
    '<div class="modal-header"><span class="modal-title">'+(editing?'Edit session':'Log a session')+'</span>'+
    '<button class="close-btn" onclick="closeModal()">&times;</button></div>'+
    '<div style="margin-bottom:12px"><label style="margin-bottom:6px">Kind</label>'+
    '<div class="tag-row" id="strength-kind-tags">'+
    '<button class="tag'+(kind==='strength'?' selected':'')+'" data-val="strength" onclick="selTag(this,\'strength-kind-tags\');refreshStrengthFields()">Strength</button>'+
    '<button class="tag'+(kind==='stretch'?' selected':'')+'" data-val="stretch" onclick="selTag(this,\'strength-kind-tags\');refreshStrengthFields()">Stretch</button>'+
    '</div></div>'+
    '<div class="form-row">'+
    '<div><label>Date</label><input type="date" id="m-date" value="'+dateVal+'"></div>'+
    '<div id="strength-time-wrap" style="'+(kind==='stretch'?'display:none':'')+'"><label>Time (hrs)</label><input type="number" id="m-time" step="0.1" min="0" value="'+esc(s.time||'')+'" placeholder="0.0"></div></div>'+
    '<div style="margin-bottom:12px"><label style="margin-bottom:6px">Focus area</label>'+
    '<div class="tag-row" id="strength-area-tags">'+
    '<button class="tag'+(area==='upper'?' selected':'')+'" data-val="upper" onclick="selTag(this,\'strength-area-tags\');refreshExerciseRowsForArea()">Upper body</button>'+
    '<button class="tag'+(area==='lower'?' selected':'')+'" data-val="lower" onclick="selTag(this,\'strength-area-tags\');refreshExerciseRowsForArea()">Lower body</button>'+
    '<button class="tag'+(area==='core'?' selected':'')+'" data-val="core" onclick="selTag(this,\'strength-area-tags\');refreshExerciseRowsForArea()">Core</button>'+
    '<button class="tag'+(area==='wrist'?' selected':'')+'" data-val="wrist" onclick="selTag(this,\'strength-area-tags\');refreshExerciseRowsForArea()">Finger strength</button>'+
    '</div></div>'+
    '<div id="strength-exercises-wrap" style="'+(kind==='stretch'?'display:none':'')+'">'+
    '<div class="section-divider">Exercises</div>'+
    '<div id="strength-exercise-rows">'+rowsHtml+'</div>'+
    '<button type="button" class="add-row-btn" onclick="addExerciseRow()">+ Add exercise</button>'+
    '</div>'+
    '<div class="form-row single"><div><label>Session notes</label><textarea id="m-notes" placeholder="How the whole session felt overall...">'+esc(s.notes||'')+'</textarea></div></div>'+
    '<div class="modal-footer"><div class="modal-footer-left">'+
    (editing?'<button class="btn btn-sm btn-danger" onclick="deleteStrength('+idx+')">Delete</button>':'')+
    '</div><button class="btn btn-sm btn-accent" onclick="saveStrength('+(editing?idx:-1)+')">Save session</button></div>');
}
function refreshStrengthFields() {
  const kind=getSelectedTag('strength-kind-tags')||'strength';
  const timeWrap=document.getElementById('strength-time-wrap');
  if(timeWrap) timeWrap.style.display = kind==='stretch' ? 'none' : '';
  const exWrap=document.getElementById('strength-exercises-wrap');
  if(exWrap) exWrap.style.display = kind==='stretch' ? 'none' : '';
  if(kind==='strength' && exWrap && !document.querySelector('#strength-exercise-rows .ex-row')) addExerciseRow();
}
function readExerciseRows() {
  const area=getSelectedTag('strength-area-tags')||'upper';
  const out=[];
  document.querySelectorAll('#strength-exercise-rows .ex-row').forEach(row=>{
    const exId=row.querySelector('.ex-select').value;
    if(!exId) return;
    const libEx=findLibraryExercise(area, exId);
    const statusBtn=row.querySelector('.ex-status-btn.selected');
    const status=statusBtn?statusBtn.dataset.status:'';
    const uni=row.dataset.uni==='1';
    const notes=row.querySelector('.ex-notes').value;
    const entry={exId, name: libEx?libEx.name:'', status, done: status==='done', unilateral: uni, notes};
    if(area==='wrist') {
      entry.sets=row.querySelector('.ex-sets').value;
      entry.time=row.querySelector('.ex-time').value;
      entry.addedWeight=row.querySelector('.ex-addedweight').value;
      entry.fingerType=row.querySelector('.ex-type').value;
    } else if(uni) {
      entry.setsL=row.querySelector('.ex-setsL').value;
      entry.repsL=row.querySelector('.ex-repsL').value;
      entry.weightL=row.querySelector('.ex-weightL').value;
      entry.setsR=row.querySelector('.ex-setsR').value;
      entry.repsR=row.querySelector('.ex-repsR').value;
      entry.weightR=row.querySelector('.ex-weightR').value;
    } else {
      entry.sets=row.querySelector('.ex-sets').value;
      entry.reps=row.querySelector('.ex-reps').value;
      entry.weight=row.querySelector('.ex-weight').value;
    }
    // Skip a row that's still fully blank (no data entered, not ticked) so an
    // extra row left over from "+ Add exercise" doesn't get saved as noise.
    const hasData = status || entry.sets || entry.reps || entry.weight || entry.time || entry.addedWeight ||
      entry.setsL || entry.repsL || entry.weightL || entry.setsR || entry.repsR || entry.weightR || entry.notes;
    if(hasData) out.push(entry);
  });
  return out;
}
function saveStrength(idx) {
  const date=document.getElementById('m-date').value;
  const kind=getSelectedTag('strength-kind-tags')||'strength';
  const time=kind==='stretch'?'':document.getElementById('m-time').value;
  const area=getSelectedTag('strength-area-tags')||'upper';
  const notes=document.getElementById('m-notes').value;
  const exercises=kind==='strength'?readExerciseRows():[];
  const entry={date,kind,area,time,notes,exercises};
  if(idx>=0) state.strength[idx]=entry; else state.strength.push(entry);
  saveState(); closeModal(); renderStrength(); renderCalendar(); renderStats();
}
function deleteStrength(idx) { state.strength.splice(idx,1); saveState(); closeModal(); renderStrength(); renderCalendar(); renderStats(); }

/* Exercise library management (separate top-level modal so it never clobbers an in-progress session edit) */
function openExerciseLibraryModal() {
  ensureExerciseLibrary();
  openModal(
    '<div class="modal-header"><span class="modal-title">Manage exercises</span>'+
    '<button class="close-btn" onclick="closeModal()">&times;</button></div>'+
    '<div class="tag-row" id="exlib-area-tags">'+
    STRENGTH_AREAS.map((a,i)=>'<button class="tag'+(i===0?' selected':'')+'" data-val="'+a+'" onclick="selTag(this,\'exlib-area-tags\');renderExerciseLibraryRows()">'+esc(strengthAreaLabel(a))+'</button>').join('')+
    '</div>'+
    '<div id="exlib-rows"></div>'+
    '<button type="button" class="add-row-btn" onclick="addExerciseLibraryRow()">+ Add exercise</button>'+
    '<div class="modal-footer"><div></div><button class="btn btn-sm btn-accent" onclick="closeModal()">Done</button></div>');
  renderExerciseLibraryRows();
}
function renderExerciseLibraryRows() {
  const area=getSelectedTag('exlib-area-tags')||'upper';
  const wrap=document.getElementById('exlib-rows');
  if(!wrap) return;
  const list=state.exerciseLibrary[area]||[];
  wrap.innerHTML = list.length ? list.map((e,i)=>
    '<div class="subrow exlib-row">'+
    '<input type="text" value="'+esc(e.name)+'" placeholder="Exercise name" onchange="renameExercise(\''+area+'\','+i+',this.value)">'+
    '<button class="remove-btn" onclick="removeExercise(\''+area+'\','+i+')" title="Remove">&times;</button>'+
    '</div>').join('') : '<div class="empty-state" style="padding:8px 0">No exercises yet -- add one below</div>';
}
function renameExercise(area, i, val) {
  if(state.exerciseLibrary[area] && state.exerciseLibrary[area][i]) {
    state.exerciseLibrary[area][i].name=val;
    saveState();
  }
}
function removeExercise(area, i) {
  if(!state.exerciseLibrary[area]) return;
  state.exerciseLibrary[area].splice(i,1);
  saveState();
  renderExerciseLibraryRows();
}
function addExerciseLibraryRow() {
  const area=getSelectedTag('exlib-area-tags')||'upper';
  state.exerciseLibrary[area]=state.exerciseLibrary[area]||[];
  state.exerciseLibrary[area].push({id:genExId(), name:'', unilateral:false});
  saveState();
  renderExerciseLibraryRows();
  const inputs=document.querySelectorAll('#exlib-rows input[type="text"]');
  if(inputs.length) inputs[inputs.length-1].focus();
}

function exerciseSummaryLine(ex, area) {
  const status = ex.status || (ex.done ? 'done' : '');
  const mark = status==='done' ? '\u2713 ' : status==='not-done' ? '\u2715 ' : status==='transferred' ? '\u21b7 ' : '\u2013 ';
  const lineClass = status==='done' ? ' ex-done-line' : status==='not-done' ? ' ex-status-line-not-done' : status==='transferred' ? ' ex-status-line-transferred' : '';
  let detail='';
  if(area==='wrist') {
    const parts=[];
    if(ex.fingerType) parts.push(ex.fingerType==='maxhang'?'Max hang':'Repeater');
    if(ex.sets) parts.push(ex.sets+' sets');
    if(ex.time) parts.push(ex.time+'s');
    if(ex.addedWeight) parts.push('+'+ex.addedWeight+' lb');
    detail=parts.join(' \u00b7 ');
  } else if(ex.unilateral) {
    const l=(ex.setsL||ex.repsL||ex.weightL) ? (ex.setsL||'?')+'x'+(ex.repsL||'?')+(ex.weightL?' @ '+ex.weightL+'lb':'') : '';
    const r=(ex.setsR||ex.repsR||ex.weightR) ? (ex.setsR||'?')+'x'+(ex.repsR||'?')+(ex.weightR?' @ '+ex.weightR+'lb':'') : '';
    detail=[l?('L '+l):'', r?('R '+r):''].filter(Boolean).join('  \u00b7  ');
  } else {
    const parts=[];
    if(ex.sets||ex.reps) parts.push((ex.sets||'?')+'x'+(ex.reps||'?'));
    if(ex.weight) parts.push(ex.weight+' lb');
    detail=parts.join(' @ ');
  }
  return '<div class="ex-summary-line'+lineClass+'">'+mark+'<strong>'+esc(ex.name)+'</strong>'+
    (detail?' &mdash; '+esc(detail):'')+
    (ex.notes?' <span class="ex-summary-note">('+esc(ex.notes)+')</span>':'')+'</div>';
}
function strengthEntryHtml(s) {
  const exHtml=(s.exercises&&s.exercises.length) ? '<div class="ex-summary">'+s.exercises.map(ex=>exerciseSummaryLine(ex, s.area)).join('')+'</div>' : '';
  return '<div class="log-entry" onclick="openStrengthModal('+s._i+')">'+
    '<div class="entry-header"><span class="pill pill-strength">'+esc(strengthKindLabel(s.kind))+'</span>'+
    '<span class="pill pill-strength-area">'+esc(strengthAreaLabel(s.area))+'</span>'+
    '<span class="entry-date">'+fmtDisplay(s.date)+'</span>'+
    (s.time?'<span class="entry-pts">'+s.time+' hrs</span>':'')+'</div>'+
    exHtml+
    (s.notes?'<div class="entry-detail"><span class="entry-note">'+esc(s.notes)+'</span></div>':'')+'</div>';
}
function renderStrength() {
  const sorted=state.strength.map((s,i)=>({...s,_i:i})).sort((a,b)=>b.date.localeCompare(a.date));
  const el=document.getElementById('strength-list');
  if(!el) return;
  if(!sorted.length){el.innerHTML='<div class="empty-state">No strength/stretch sessions logged yet</div>';return;}
  el.innerHTML=sorted.map(strengthEntryHtml).join('');
}

/* FUEL MODAL */
function openFuelModal(idx) {
  const editing=idx!==null&&idx!==undefined&&idx>=0;
  const f=editing?state.fuel[idx]:{};
  openModal(
    '<div class="modal-header"><span class="modal-title">'+(editing?'Edit fuel &amp; gear note':'Add fuel &amp; gear note')+'</span>'+
    '<button class="close-btn" onclick="closeModal()">&times;</button></div>'+
    '<div class="form-row">'+
    '<div><label>Date</label><input type="date" id="m-date" value="'+(f.date||fmtISO(new Date()))+'"></div>'+
    '<div><label>Objective / route</label><input type="text" id="m-objective" value="'+esc(f.objective||'')+'" placeholder="e.g. Wild Basin high route"></div></div>'+
    '<div class="form-row single" style="margin-bottom:8px"><div><label>Food &amp; hydration</label>'+
    '<textarea id="m-food" style="min-height:80px" placeholder="What you ate, when, how many cals, hydration totals...">'+esc(f.food||'')+'</textarea></div></div>'+
    '<div class="form-row single" style="margin-bottom:8px"><div><label>Gear &amp; clothing</label>'+
    '<textarea id="m-gear" style="min-height:60px" placeholder="Shoes, layers, pack, what worked, what didn\'t...">'+esc(f.gear||'')+'</textarea></div></div>'+
    '<div class="form-row single"><div><label>Other notes</label>'+
    '<textarea id="m-notes" style="min-height:60px" placeholder="Knee tape, ibuprofen timing, anything to remember next time...">'+esc(f.notes||'')+'</textarea></div></div>'+
    '<div class="modal-footer"><div class="modal-footer-left">'+
    (editing?'<button class="btn btn-sm btn-danger" onclick="deleteFuel('+idx+')">Delete</button>':'')+
    '</div><button class="btn btn-sm btn-accent" onclick="saveFuel('+(editing?idx:-1)+')">Save note</button></div>');
}
function saveFuel(idx) {
  const date=document.getElementById('m-date').value;
  const objective=document.getElementById('m-objective').value;
  const food=document.getElementById('m-food').value;
  const gear=document.getElementById('m-gear').value;
  const notes=document.getElementById('m-notes').value;
  const entry={date,objective,food,gear,notes};
  if(idx>=0) state.fuel[idx]=entry; else state.fuel.push(entry);
  saveState(); closeModal(); renderFuel(); renderCalendar();
}
function deleteFuel(idx) { state.fuel.splice(idx,1); saveState(); closeModal(); renderFuel(); renderCalendar(); }

/* ===================== GIST CLOUD BACKUP =====================
   Auto-backs up state to a private GitHub Gist on every save.
   The token lives only in this browser's localStorage and is sent
   directly to api.github.com -- it never touches any third-party
   server. Scope needed on the token: "gist" only. */
const GIST_TOKEN_KEY = 'training-log-gist-token';
const GIST_ID_KEY = 'training-log-gist-id';
const GIST_FILENAME = 'training-log-backup.json';
let gistSyncTimer = null;

function getGistConfig() {
  return { token: localStorage.getItem(GIST_TOKEN_KEY) || '', gistId: localStorage.getItem(GIST_ID_KEY) || '' };
}
function setSyncStatus(text, cls) {
  const el = document.getElementById('gist-sync-status');
  if (!el) return;
  el.textContent = text;
  el.className = 'sync-status' + (cls ? ' ' + cls : '');
}
function refreshSyncStatusIdle() {
  const { token, gistId } = getGistConfig();
  if (!token) { setSyncStatus(''); return; }
  const last = localStorage.getItem(GIST_ID_KEY + '-last-sync');
  setSyncStatus(gistId ? ('Backed up' + (last ? ' ' + last : '')) : 'Cloud backup on', 'synced');
}

// Debounce so rapid edits don't hammer the API -- fires ~2.5s after the last change.
function scheduleGistSync() {
  const { token } = getGistConfig();
  if (!token) return;
  clearTimeout(gistSyncTimer);
  setSyncStatus('Syncing\u2026');
  gistSyncTimer = setTimeout(syncToGist, 2500);
}

async function syncToGist() {
  const { token, gistId } = getGistConfig();
  if (!token) return;
  try {
    const body = { description: 'Training log backup (auto-synced)', public: false,
      files: { [GIST_FILENAME]: { content: JSON.stringify(state, null, 2) } } };
    const url = gistId ? 'https://api.github.com/gists/' + gistId : 'https://api.github.com/gists';
    const res = await fetch(url, {
      method: gistId ? 'PATCH' : 'POST',
      headers: { 'Authorization': 'token ' + token, 'Accept': 'application/vnd.github+json', 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();
    if (!gistId) localStorage.setItem(GIST_ID_KEY, data.id);
    const stamp = new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    localStorage.setItem(GIST_ID_KEY + '-last-sync', 'at ' + stamp);
    setSyncStatus('Backed up at ' + stamp, 'synced');
  } catch (e) {
    console.warn('Gist sync failed:', e);
    setSyncStatus('Backup sync failed', 'error');
  }
}

async function restoreFromGist() {
  const { token, gistId } = getGistConfig();
  if (!token || !gistId) { alert('Connect cloud backup first.'); return; }
  if (!confirm('This will merge your cloud backup into your current data (same as Import backup). Continue?')) return;
  try {
    const res = await fetch('https://api.github.com/gists/' + gistId, {
      headers: { 'Authorization': 'token ' + token, 'Accept': 'application/vnd.github+json' }
    });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();
    const file = data.files && data.files[GIST_FILENAME];
    if (!file) throw new Error('Backup file not found in gist');
    const imp = JSON.parse(file.content);
    const days = typeof imp.days === 'object' ? imp.days : {};
    const plan = typeof imp.plan === 'object' ? imp.plan : {};
    const climbs = Array.isArray(imp.climbs) ? imp.climbs : [];
    const cardio = Array.isArray(imp.cardio) ? imp.cardio : [];
    const fuel = Array.isArray(imp.fuel) ? imp.fuel : [];
    const strength = Array.isArray(imp.strength) ? imp.strength : [];
    const goals = Array.isArray(imp.goals) ? imp.goals : [];
    const cycles = Array.isArray(imp.cycles) ? imp.cycles : [];
    state.days = { ...state.days, ...days };
    state.plan = { ...state.plan, ...plan };
    function mergeArr(ex, inc) { const seen = new Set(ex.map(x => JSON.stringify(x))); inc.forEach(x => { const k = JSON.stringify(x); if (!seen.has(k)) { seen.add(k); ex.push(x); } }); return ex; }
    state.climbs = mergeArr(state.climbs, climbs);
    state.cardio = mergeArr(state.cardio, cardio);
    state.fuel = mergeArr(state.fuel, fuel);
    state.strength = mergeArr(state.strength, strength);
    state.goals = mergeArr(state.goals, goals);
    state.cycles = mergeArr(state.cycles, cycles);
    ensureExerciseLibrary();
    state.exerciseLibrary = mergeExerciseLibrary(state.exerciseLibrary, imp.exerciseLibrary);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    renderCalendar(); renderClimbs(); renderCardio(); renderStrength(); renderFuel(); renderStats();
    renderGoals(); renderCycles(); renderYearly(); renderPlanMonth(); renderPlanWeek();
    showToast('Restored from cloud backup');
    closeModal();
  } catch (e) {
    console.warn('Gist restore failed:', e);
    alert('Could not restore from cloud backup: ' + e.message);
  }
}

function openGistSettingsModal() {
  const { token, gistId } = getGistConfig();
  openModal(
    '<div class="modal-header"><span class="modal-title">Cloud backup</span>' +
    '<button class="close-btn" onclick="closeModal()">&times;</button></div>' +
    '<div class="form-row single"><div>' +
    (token
      ? '<p style="margin:0 0 10px;font-size:13px">Cloud backup is <strong>on</strong>. Every change auto-saves to a private GitHub Gist' + (gistId ? ' (<a href="https://gist.github.com/' + esc(gistId) + '" target="_blank" rel="noopener">view gist</a>)' : '') + '.</p>' +
        '<button class="btn btn-sm" onclick="restoreFromGist()">Restore latest from cloud</button> ' +
        '<button class="btn btn-sm btn-danger" onclick="disconnectGist()">Disconnect</button>'
      : '<p style="margin:0 0 10px;font-size:13px">Paste a GitHub personal access token with just the <strong>gist</strong> scope. It\'s stored only in this browser and sent directly to api.github.com to auto-save a private backup Gist on every change.</p>' +
        '<p style="margin:0 0 10px;font-size:13px">Create one at <a href="https://github.com/settings/tokens/new?scopes=gist&description=Training%20log%20backup" target="_blank" rel="noopener">github.com/settings/tokens/new</a> (select only the "gist" checkbox), then paste it below.</p>' +
        '<label>Personal access token</label><input type="password" id="gist-token-input" placeholder="ghp_...">' +
        '<div class="modal-footer"><div></div><button class="btn btn-sm btn-accent" onclick="connectGist()">Connect</button></div>') +
    '</div></div>');
}
function connectGist() {
  const val = document.getElementById('gist-token-input').value.trim();
  if (!val) return;
  localStorage.setItem(GIST_TOKEN_KEY, val);
  closeModal();
  setSyncStatus('Connecting\u2026');
  syncToGist().then(() => showToast('Cloud backup connected'));
}
function disconnectGist() {
  if (!confirm('Stop auto-syncing to the cloud? Your existing gist backup will remain on GitHub until you delete it manually.')) return;
  localStorage.removeItem(GIST_TOKEN_KEY);
  localStorage.removeItem(GIST_ID_KEY);
  localStorage.removeItem(GIST_ID_KEY + '-last-sync');
  setSyncStatus('');
  closeModal();
  showToast('Cloud backup disconnected');
}

/* BACKUP */
function showToast(msg) {
  const t=document.getElementById('toast'); t.textContent=msg; t.style.opacity='1';
  clearTimeout(t._tid); t._tid=setTimeout(()=>t.style.opacity='0',2500);
}
function exportData() {
  const filename='training-log-backup-'+fmtISO(new Date())+'.json';
  const blob=new Blob([JSON.stringify(state,null,2)],{type:'application/json'});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a'); a.href=url; a.download=filename;
  document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
  showToast('Backup saved as '+filename);
}
function importData(event) {
  const file=event.target.files[0]; if(!file) return;
  const reader=new FileReader();
  reader.onload=e=>{
    try {
      const imp=JSON.parse(e.target.result);
      if(typeof imp!=='object'||Array.isArray(imp)) throw new Error();
      const days=typeof imp.days==='object'?imp.days:{};
      const plan=typeof imp.plan==='object'?imp.plan:{};
      const climbs=Array.isArray(imp.climbs)?imp.climbs:[];
      const cardio=Array.isArray(imp.cardio)?imp.cardio:[];
      const fuel=Array.isArray(imp.fuel)?imp.fuel:[];
      const strength=Array.isArray(imp.strength)?imp.strength:[];
      const goals=Array.isArray(imp.goals)?imp.goals:[];
      const cycles=Array.isArray(imp.cycles)?imp.cycles:[];
      const existing=Object.keys(state.days).length+state.climbs.length+state.cardio.length+state.fuel.length+state.strength.length;
      if(existing>0&&!confirm('This will merge the backup with your current data. Continue?')){event.target.value='';return;}
      state.days={...state.days,...days};
      state.plan={...state.plan,...plan};
      function mergeArr(ex,inc){const seen=new Set(ex.map(x=>JSON.stringify(x)));inc.forEach(x=>{const k=JSON.stringify(x);if(!seen.has(k)){seen.add(k);ex.push(x);}});return ex;}
      state.climbs=mergeArr(state.climbs,climbs);
      state.cardio=mergeArr(state.cardio,cardio);
      state.fuel=mergeArr(state.fuel,fuel);
      state.strength=mergeArr(state.strength,strength);
      state.goals=mergeArr(state.goals,goals);
      state.cycles=mergeArr(state.cycles,cycles);
      ensureExerciseLibrary();
      state.exerciseLibrary=mergeExerciseLibrary(state.exerciseLibrary, imp.exerciseLibrary);
      saveState();
      renderCalendar(); renderClimbs(); renderCardio(); renderStrength(); renderFuel(); renderStats();
      renderGoals(); renderCycles(); renderYearly(); renderPlanMonth(); renderPlanWeek();
      showToast('Backup imported successfully');
    } catch(err){ alert('That file doesn\'t look like a valid training log backup.'); }
    event.target.value='';
  };
  reader.readAsText(file);
}


// Bootstrap historical data from data/seed-data.json on first load ONLY.
// A persistent flag guards this so it truly runs once, even if seed-data.json's
// shape changes across deploys (the old merge-every-load approach silently
// re-added entries as "new" whenever the seed file's serialization differed
// even slightly from what was already merged in, causing duplicates).
const SEEDED_FLAG_KEY = 'training-log-seeded-v1';
async function bootstrapSeedData() {
  try {
    if (localStorage.getItem(SEEDED_FLAG_KEY)) return; // already seeded, never touch again
    const existing = localStorage.getItem(STORAGE_KEY);
    const res = await fetch('data/seed-data.json');
    if (!res.ok) { localStorage.setItem(SEEDED_FLAG_KEY, '1'); return; } // no seed file present, fine
    const seed = await res.json();
    if (!existing) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
    } else {
      // Merge seed into existing without overwriting newer entries
      const cur = JSON.parse(existing);
      const mergedDays = Object.assign({}, seed.days, cur.days);
      const mergedPlan = Object.assign({}, seed.plan, cur.plan);
      function mergeArr(ex, inc) {
        const seen = new Set(ex.map(x => JSON.stringify(x)));
        inc.forEach(x => { const k = JSON.stringify(x); if (!seen.has(k)) { seen.add(k); ex.push(x); } });
        return ex;
      }
      const merged = {
        days: mergedDays,
        plan: mergedPlan,
        climbs: mergeArr(cur.climbs || [], seed.climbs || []),
        cardio: mergeArr(cur.cardio || [], seed.cardio || []),
        fuel: mergeArr(cur.fuel || [], seed.fuel || []),
        strength: mergeArr(cur.strength || [], seed.strength || []),
        goals: mergeArr(cur.goals || [], seed.goals || []),
        cycles: mergeArr(cur.cycles || [], seed.cycles || []),
        exerciseLibrary: mergeExerciseLibrary(cur.exerciseLibrary || {}, seed.exerciseLibrary || {}),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
    }
    localStorage.setItem(SEEDED_FLAG_KEY, '1');
  } catch (e) {
    console.warn('Seed data bootstrap skipped:', e);
  }
}

initTheme();
initBackground();
bootstrapSeedData().then(loadState);
