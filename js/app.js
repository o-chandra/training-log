const STORAGE_KEY = 'training-log-v1';

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

let state = {days:{}, climbs:[], cardio:[], fuel:[], strength:[]};
let currentWeekStart = getMonday(new Date());
let currentMonthDate = new Date();
let calView = 'week';

function loadState() {
  try { const r=localStorage.getItem(STORAGE_KEY); if(r) state=JSON.parse(r); } catch(e){}
  state.strength = state.strength || []; // backfill for states saved before this field existed
  dedupeState();
  renderCalendar(); renderClimbs(); renderCardio(); renderStrength(); renderFuel(); renderStats();
  refreshSyncStatusIdle();
}
function saveState() { try { localStorage.setItem(STORAGE_KEY,JSON.stringify(state)); } catch(e){} scheduleGistSync(); }

// Removes exact-duplicate entries (e.g. from the old re-merge-every-load bug).
// Runs automatically on every load -- cheap, and harmless once data is clean.
// Content-aware dedup: compares only the meaningful fields for each entry
// type, so legacy cruft (like the old "points" field, or differing key
// order) doesn't prevent a real duplicate from being caught.
function cardioKey(c) { return ['date','actType','objective','miles','vert','time','terrain','notes'].map(k=>c[k]||'').join('|') + '|' + (c.alpine?'1':'0'); }
function climbKey(c) { return ['date','venue','climbType','notes'].map(k=>c[k]||'').join('|') + '|' + (c.alpine?'1':'0') + '|' + JSON.stringify(c.rows||[]); }
function fuelKey(f) { return ['date','objective','food','gear','notes'].map(k=>f[k]||'').join('|'); }
function strengthKey(s) { return ['date','kind','area','time','notes'].map(k=>s[k]||'').join('|'); }

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
  // Strip legacy "points" field left over from the old points-based system
  // before comparing, so it can't mask an otherwise-identical duplicate.
  state.climbs.forEach(c => { delete c.points; });
  state.cardio.forEach(c => { delete c.points; });

  const c = dedupeArr(state.climbs, climbKey);
  const ca = dedupeArr(state.cardio, cardioKey);
  const f = dedupeArr(state.fuel, fuelKey);
  const s = dedupeArr(state.strength, strengthKey);
  const total = c.removed + ca.removed + f.removed + s.removed;
  state.climbs = c.out; state.cardio = ca.out; state.fuel = f.out; state.strength = s.out;
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
  if(id==='climbs') renderClimbs();
  if(id==='cardio') renderCardio();
  if(id==='strength') renderStrength();
  if(id==='fuel') renderFuel();
  if(id==='stats') renderStats();
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
    html+='<div class="day-cell '+vc+'" onclick="openDayModal(\''+key+'\')">'+
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
    html+='<div class="month-cell '+vc+(otherMonth?' other-month':'')+'" onclick="openDayModal(\''+key+'\')">'+
      '<div class="day-num'+(isToday?' today':'')+'">'+(isToday?'\u2022 ':'')+d.getDate()+'</div>'+
      cellBadges(key)+
      '<div class="day-content">'+esc(entry?entry.text:'')+'</div></div>';
  }
  html+='</div>';
  document.getElementById('calendar-area').innerHTML=html;
  renderPeriodStats(monthISOs, 'Month');
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

function renderClimbs() {
  const tf=document.getElementById('climb-type-filter')?.value||'all';
  const vf=document.getElementById('climb-venue-filter')?.value||'all';
  const filtered=state.climbs.map((c,i)=>({...c,_i:i})).filter(c=>(tf==='all'||c.climbType===tf)&&(vf==='all'||c.venue===vf)).sort((a,b)=>b.date.localeCompare(a.date));
  const el=document.getElementById('climb-list');
  if(!filtered.length){el.innerHTML='<div class="empty-state">No sessions logged yet</div>';return;}
  el.innerHTML=filtered.map(c=>{
    const rows=(c.rows||[]).map(r=>r.count+'\u00d7 '+r.grade).join(' \u00b7 ');
    const pitchCount=climbPitchCount(c);
    return '<div class="log-entry" onclick="openClimbModal('+c._i+')">'+
      '<div class="entry-header"><span class="pill pill-'+esc(c.climbType||'climb')+'">'+esc(c.venue||'')+' '+esc(c.climbType||'')+'</span>'+
      (c.alpine?'<span class="pill pill-alpine">alpine</span>':'')+
      '<span class="entry-date">'+fmtDisplay(c.date)+'</span>'+
      (pitchCount?'<span class="entry-pts">'+pitchCount+' pitches</span>':'')+'</div>'+
      '<div class="entry-detail">'+esc(rows)+(c.notes?'<br><span class="entry-note">'+esc(c.notes)+'</span>':'')+'</div></div>';
  }).join('');
}

function renderCardio() {
  const sorted=state.cardio.map((c,i)=>({...c,_i:i})).sort((a,b)=>b.date.localeCompare(a.date));
  const el=document.getElementById('cardio-list');
  if(!sorted.length){el.innerHTML='<div class="empty-state">No activities logged yet</div>';return;}
  el.innerHTML=sorted.map(c=>'<div class="log-entry" onclick="openCardioModal('+c._i+')">'+
    '<div class="entry-header"><span class="pill pill-cardio">'+esc(c.actType||'cardio')+'</span>'+
    (c.alpine?'<span class="pill pill-alpine">alpine</span>':'')+
    '<span class="entry-date">'+fmtDisplay(c.date)+'</span></div>'+
    '<div class="entry-detail">'+(c.objective?'<strong>'+esc(c.objective)+'</strong> \u00b7 ':'')+
    (c.miles?c.miles+' mi':'')+(c.vert?' \u00b7 '+Number(c.vert).toLocaleString()+' ft vert':'')+(c.time?' \u00b7 '+c.time+' hrs':'')+
    (c.notes?'<br><span class="entry-note">'+esc(c.notes)+'</span>':'')+'</div></div>').join('');
}

function renderFuel() {
  const sorted=state.fuel.map((f,i)=>({...f,_i:i})).sort((a,b)=>b.date.localeCompare(a.date));
  const el=document.getElementById('fuel-list');
  if(!sorted.length){el.innerHTML='<div class="empty-state">No notes yet \u2014 log what you ate, drank, and wore on big days</div>';return;}
  el.innerHTML=sorted.map(f=>'<div class="fuel-entry" onclick="openFuelModal('+f._i+')">'+
    '<div class="fuel-header"><span class="pill pill-fuel">fuel &amp; gear</span>'+
    '<strong style="font-size:14px">'+esc(f.objective||'')+'</strong>'+
    '<span class="entry-date" style="margin-left:auto">'+fmtDisplay(f.date)+'</span></div>'+
    '<div class="fuel-body">'+esc([f.food&&('Food: '+f.food),f.gear&&('Gear: '+f.gear),f.notes&&('Notes: '+f.notes)].filter(Boolean).join('\n\n'))+'</div></div>').join('');
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
/* Chooser shown by "+ Log day" -- picks climb, cardio, or a plain rest-day/notes entry */
function openLogChoiceModal() {
  openModal(
    '<div class="modal-header"><span class="modal-title">Log</span>' +
    '<button class="close-btn" onclick="closeModal()">&times;</button></div>' +
    '<div class="form-row single"><div style="display:flex;flex-direction:column;gap:8px">' +
    '<button class="btn btn-accent" onclick="openClimbModal(null)">Climb session</button>' +
    '<button class="btn btn-accent" onclick="openCardioModal(null)">Cardio activity</button>' +
    '<button class="btn btn-accent" onclick="openStrengthModal(null)">Strength / Stretch</button>' +
    '<button class="btn btn-accent" onclick="openDayModal(null)">Rest day / notes</button>' +
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

/* CLIMB MODAL */
function climbGradeOpts(cat,venue) {
  return CLIMB_GRADES.filter(g=>g.cat===cat&&g.venue===venue).map(g=>'<option value="'+esc(g.k)+'">'+esc(g.k)+'</option>').join('');
}
function openClimbModal(idx) {
  const editing=idx!==null&&idx!==undefined&&idx>=0;
  const c=editing?state.climbs[idx]:{};
  const venue=c.venue||'indoor', ct=c.climbType||'boulder';
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
    '<div><label>Date</label><input type="date" id="m-date" value="'+(c.date||fmtISO(new Date()))+'"></div>'+
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
function openCardioModal(idx) {
  const editing=idx!==null&&idx!==undefined&&idx>=0;
  const c=editing?state.cardio[idx]:{};
  const terrain=c.terrain||'trail';
  openModal(
    '<div class="modal-header"><span class="modal-title">'+(editing?'Edit activity':'Log a cardio activity')+'</span>'+
    '<button class="close-btn" onclick="closeModal()">&times;</button></div>'+
    '<div class="form-row">'+
    '<div><label>Date</label><input type="date" id="m-date" value="'+(c.date||fmtISO(new Date()))+'"></div>'+
    '<div><label>Activity type</label><select id="m-acttype">'+
    ['run','trail run','hike','scramble','bike'].map(t=>'<option value="'+t+'"'+(c.actType===t?' selected':'')+'>'+t+'</option>').join('')+
    '</select></div></div>'+
    '<div style="margin-bottom:12px">'+
    '<button class="tag'+(c.alpine?' selected':'')+'" id="cardio-alpine-tag" onclick="toggleSoloTag(this)">Alpine</button>'+
    '</div>'+
    '<div class="form-row single"><div><label>Objective / route</label><input type="text" id="m-objective" value="'+esc(c.objective||'')+'" placeholder="e.g. Green Mountain, Anenome loop"></div></div>'+
    '<div class="form-row three">'+
    '<div><label>Miles</label><input type="number" id="m-miles" step="0.1" min="0" value="'+esc(c.miles||'')+'" placeholder="0.0"></div>'+
    '<div><label>Vert (ft)</label><input type="number" id="m-vert" step="100" min="0" value="'+esc(c.vert||'')+'" placeholder="0"></div>'+
    '<div><label>Time (hrs)</label><input type="number" id="m-time" step="0.1" min="0" value="'+esc(c.time||'')+'" placeholder="0.0"></div></div>'+
    '<div style="margin-bottom:12px"><label style="margin-bottom:6px">Terrain</label>'+
    '<div class="tag-row" id="terrain-tags">'+
    '<button class="tag'+(terrain==='trail'?' selected':'')+'" onclick="selTag(this,\'terrain-tags\')">Trail</button>'+
    '<button class="tag'+(terrain==='road'?' selected':'')+'" onclick="selTag(this,\'terrain-tags\')">Road</button>'+
    '<button class="tag'+(terrain==='weighted'?' selected':'')+'" onclick="selTag(this,\'terrain-tags\')">Weighted (pack)</button>'+
    '<button class="tag'+(terrain==='scramble'?' selected':'')+'" onclick="selTag(this,\'terrain-tags\')">Scramble</button>'+
    '</div></div>'+
    '<div class="form-row single"><div><label>Notes</label><textarea id="m-notes" placeholder="How it felt, conditions, anything notable...">'+esc(c.notes||'')+'</textarea></div></div>'+
    '<div class="modal-footer"><div class="modal-footer-left">'+
    (editing?'<button class="btn btn-sm btn-danger" onclick="deleteCardio('+idx+')">Delete</button>':'')+
    '</div><button class="btn btn-sm btn-accent" onclick="saveCardio('+(editing?idx:-1)+')">Save activity</button></div>');
}
function saveCardio(idx) {
  const date=document.getElementById('m-date').value;
  const actType=document.getElementById('m-acttype').value;
  const alpine=document.getElementById('cardio-alpine-tag')?.classList.contains('selected');
  const objective=document.getElementById('m-objective').value;
  const miles=document.getElementById('m-miles').value;
  const vert=document.getElementById('m-vert').value;
  const time=document.getElementById('m-time').value;
  const notes=document.getElementById('m-notes').value;
  const tt=getSelectedTag('terrain-tags').toLowerCase();
  const terrain=tt==='weighted (pack)'?'weighted':(tt||'trail');
  const entry={date,actType,alpine,objective,miles,vert,time,notes,terrain};
  if(idx>=0) state.cardio[idx]=entry; else state.cardio.push(entry);
  saveState(); closeModal(); renderCardio(); renderCalendar(); renderStats();
}
function deleteCardio(idx) { state.cardio.splice(idx,1); saveState(); closeModal(); renderCardio(); renderCalendar(); renderStats(); }

/* STRENGTH / PT MODAL */
function openStrengthModal(idx) {
  const editing=idx!==null&&idx!==undefined&&idx>=0;
  const s=editing?state.strength[idx]:{};
  const area=s.area||'upper';
  const kind=s.kind||'strength';
  openModal(
    '<div class="modal-header"><span class="modal-title">'+(editing?'Edit session':'Log a session')+'</span>'+
    '<button class="close-btn" onclick="closeModal()">&times;</button></div>'+
    '<div style="margin-bottom:12px"><label style="margin-bottom:6px">Kind</label>'+
    '<div class="tag-row" id="strength-kind-tags">'+
    '<button class="tag'+(kind==='strength'?' selected':'')+'" data-val="strength" onclick="selTag(this,\'strength-kind-tags\');refreshStrengthFields()">Strength</button>'+
    '<button class="tag'+(kind==='stretch'?' selected':'')+'" data-val="stretch" onclick="selTag(this,\'strength-kind-tags\');refreshStrengthFields()">Stretch</button>'+
    '</div></div>'+
    '<div class="form-row">'+
    '<div><label>Date</label><input type="date" id="m-date" value="'+(s.date||fmtISO(new Date()))+'"></div>'+
    '<div id="strength-time-wrap" style="'+(kind==='stretch'?'display:none':'')+'"><label>Time (hrs)</label><input type="number" id="m-time" step="0.1" min="0" value="'+esc(s.time||'')+'" placeholder="0.0"></div></div>'+
    '<div style="margin-bottom:12px"><label style="margin-bottom:6px">Focus area</label>'+
    '<div class="tag-row" id="strength-area-tags">'+
    '<button class="tag'+(area==='upper'?' selected':'')+'" data-val="upper" onclick="selTag(this,\'strength-area-tags\')">Upper body</button>'+
    '<button class="tag'+(area==='lower'?' selected':'')+'" data-val="lower" onclick="selTag(this,\'strength-area-tags\')">Lower body</button>'+
    '<button class="tag'+(area==='wrist'?' selected':'')+'" data-val="wrist" onclick="selTag(this,\'strength-area-tags\')">Wrist/fingers</button>'+
    '</div></div>'+
    '<div class="form-row single"><div><label>Notes</label><textarea id="m-notes" placeholder="Exercises, sets/reps, how it felt...">'+esc(s.notes||'')+'</textarea></div></div>'+
    '<div class="modal-footer"><div class="modal-footer-left">'+
    (editing?'<button class="btn btn-sm btn-danger" onclick="deleteStrength('+idx+')">Delete</button>':'')+
    '</div><button class="btn btn-sm btn-accent" onclick="saveStrength('+(editing?idx:-1)+')">Save session</button></div>');
}
function refreshStrengthFields() {
  const kind=getSelectedTag('strength-kind-tags')||'strength';
  const timeWrap=document.getElementById('strength-time-wrap');
  if(timeWrap) timeWrap.style.display = kind==='stretch' ? 'none' : '';
}
function saveStrength(idx) {
  const date=document.getElementById('m-date').value;
  const kind=getSelectedTag('strength-kind-tags')||'strength';
  const time=kind==='stretch'?'':document.getElementById('m-time').value;
  const area=getSelectedTag('strength-area-tags')||'upper';
  const notes=document.getElementById('m-notes').value;
  const entry={date,kind,area,time,notes};
  if(idx>=0) state.strength[idx]=entry; else state.strength.push(entry);
  saveState(); closeModal(); renderStrength(); renderCalendar(); renderStats();
}
function deleteStrength(idx) { state.strength.splice(idx,1); saveState(); closeModal(); renderStrength(); renderCalendar(); renderStats(); }
function strengthAreaLabel(area) { return area==='upper'?'Upper body':area==='lower'?'Lower body':area==='wrist'?'Wrist/fingers':area; }
function strengthKindLabel(kind) { return kind==='stretch'?'Stretch':'Strength'; }
function renderStrength() {
  const sorted=state.strength.map((s,i)=>({...s,_i:i})).sort((a,b)=>b.date.localeCompare(a.date));
  const el=document.getElementById('strength-list');
  if(!el) return;
  if(!sorted.length){el.innerHTML='<div class="empty-state">No strength/stretch sessions logged yet</div>';return;}
  el.innerHTML=sorted.map(s=>'<div class="log-entry" onclick="openStrengthModal('+s._i+')">'+
    '<div class="entry-header"><span class="pill pill-strength">'+esc(strengthKindLabel(s.kind))+'</span>'+
    '<span class="pill pill-strength-area">'+esc(strengthAreaLabel(s.area))+'</span>'+
    '<span class="entry-date">'+fmtDisplay(s.date)+'</span>'+
    (s.time?'<span class="entry-pts">'+s.time+' hrs</span>':'')+'</div>'+
    (s.notes?'<div class="entry-detail"><span class="entry-note">'+esc(s.notes)+'</span></div>':'')+'</div>').join('');
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
    const climbs = Array.isArray(imp.climbs) ? imp.climbs : [];
    const cardio = Array.isArray(imp.cardio) ? imp.cardio : [];
    const fuel = Array.isArray(imp.fuel) ? imp.fuel : [];
    const strength = Array.isArray(imp.strength) ? imp.strength : [];
    state.days = { ...state.days, ...days };
    function mergeArr(ex, inc) { const seen = new Set(ex.map(x => JSON.stringify(x))); inc.forEach(x => { const k = JSON.stringify(x); if (!seen.has(k)) { seen.add(k); ex.push(x); } }); return ex; }
    state.climbs = mergeArr(state.climbs, climbs);
    state.cardio = mergeArr(state.cardio, cardio);
    state.fuel = mergeArr(state.fuel, fuel);
    state.strength = mergeArr(state.strength, strength);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    renderCalendar(); renderClimbs(); renderCardio(); renderStrength(); renderFuel(); renderStats();
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
      const climbs=Array.isArray(imp.climbs)?imp.climbs:[];
      const cardio=Array.isArray(imp.cardio)?imp.cardio:[];
      const fuel=Array.isArray(imp.fuel)?imp.fuel:[];
      const strength=Array.isArray(imp.strength)?imp.strength:[];
      const existing=Object.keys(state.days).length+state.climbs.length+state.cardio.length+state.fuel.length+state.strength.length;
      if(existing>0&&!confirm('This will merge the backup with your current data. Continue?')){event.target.value='';return;}
      state.days={...state.days,...days};
      function mergeArr(ex,inc){const seen=new Set(ex.map(x=>JSON.stringify(x)));inc.forEach(x=>{const k=JSON.stringify(x);if(!seen.has(k)){seen.add(k);ex.push(x);}});return ex;}
      state.climbs=mergeArr(state.climbs,climbs);
      state.cardio=mergeArr(state.cardio,cardio);
      state.fuel=mergeArr(state.fuel,fuel);
      state.strength=mergeArr(state.strength,strength);
      saveState();
      renderCalendar(); renderClimbs(); renderCardio(); renderStrength(); renderFuel(); renderStats();
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
      function mergeArr(ex, inc) {
        const seen = new Set(ex.map(x => JSON.stringify(x)));
        inc.forEach(x => { const k = JSON.stringify(x); if (!seen.has(k)) { seen.add(k); ex.push(x); } });
        return ex;
      }
      const merged = {
        days: mergedDays,
        climbs: mergeArr(cur.climbs || [], seed.climbs || []),
        cardio: mergeArr(cur.cardio || [], seed.cardio || []),
        fuel: mergeArr(cur.fuel || [], seed.fuel || []),
        strength: mergeArr(cur.strength || [], seed.strength || []),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
    }
    localStorage.setItem(SEEDED_FLAG_KEY, '1');
  } catch (e) {
    console.warn('Seed data bootstrap skipped:', e);
  }
}

bootstrapSeedData().then(loadState);
