const STORAGE_KEY = 'training-log-v1';
const CLIMB_GRADES = [
  {k:'Indoor v0-v2',pts:0.2,cat:'boulder',venue:'indoor'},
  {k:'Indoor v3-v4',pts:0.4,cat:'boulder',venue:'indoor'},
  {k:'Indoor v5-v6',pts:0.8,cat:'boulder',venue:'indoor'},
  {k:'Indoor >=v7',pts:1.4,cat:'boulder',venue:'indoor'},
  {k:'Indoor 5.9',pts:0.25,cat:'sport',venue:'indoor'},
  {k:'Indoor 5.10',pts:0.5,cat:'sport',venue:'indoor'},
  {k:'Indoor 5.11',pts:1.0,cat:'sport',venue:'indoor'},
  {k:'Indoor 5.12',pts:1.5,cat:'sport',venue:'indoor'},
  {k:'Sport \u22645.9',pts:0.5,cat:'sport',venue:'outdoor'},
  {k:'Sport 5.10a/b',pts:0.75,cat:'sport',venue:'outdoor'},
  {k:'Sport 5.10c/d',pts:1.0,cat:'sport',venue:'outdoor'},
  {k:'Sport 5.11a/b',pts:1.5,cat:'sport',venue:'outdoor'},
  {k:'Sport 5.11c/d',pts:2.0,cat:'sport',venue:'outdoor'},
  {k:'Sport 5.12a/b',pts:3.0,cat:'sport',venue:'outdoor'},
  {k:'Sport 5.12c/d',pts:4.0,cat:'sport',venue:'outdoor'},
  {k:'Trad \u22645.6',pts:0.4,cat:'trad',venue:'outdoor'},
  {k:'Trad 5.7-5.8',pts:0.5,cat:'trad',venue:'outdoor'},
  {k:'Trad \u22645.9',pts:0.75,cat:'trad',venue:'outdoor'},
  {k:'Trad 5.10a/b',pts:1.5,cat:'trad',venue:'outdoor'},
  {k:'Trad 5.10c/d',pts:2.0,cat:'trad',venue:'outdoor'},
  {k:'Trad 5.11a/b',pts:2.5,cat:'trad',venue:'outdoor'},
  {k:'Trad 5.11c/d',pts:3.0,cat:'trad',venue:'outdoor'},
  {k:'Trad 5.12a/b',pts:3.5,cat:'trad',venue:'outdoor'},
  {k:'Trad 5.12c/d',pts:4.5,cat:'trad',venue:'outdoor'},
  {k:'Alpine \u22645.6',pts:0.4,cat:'alpine',venue:'outdoor'},
  {k:'Alpine 5.7-5.9',pts:0.75,cat:'alpine',venue:'outdoor'},
  {k:'Alpine 5.10+',pts:1.5,cat:'alpine',venue:'outdoor'},
];
const TERRAIN_MILE_PTS = {trail:1.0,road:0.5,weighted:1.5,scramble:1.7};
const TERRAIN_VERT_PTS = {trail:0.002,road:0.002,weighted:0.003,scramble:0.0034};

let state = {days:{}, climbs:[], cardio:[], fuel:[]};
let currentWeekStart = getMonday(new Date());
let currentMonthDate = new Date();
let calView = 'week';

function loadState() {
  try { const r=localStorage.getItem(STORAGE_KEY); if(r) state=JSON.parse(r); } catch(e){}
  renderCalendar(); renderClimbs(); renderCardio(); renderFuel(); renderStats();
}
function saveState() { try { localStorage.setItem(STORAGE_KEY,JSON.stringify(state)); } catch(e){} }

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
  const hasFuel   = state.fuel.some(f=>f.date===dateISO);
  let b='';
  if(hasClimb)  b+='<span class="cell-badge cb-climb">climb</span>';
  if(hasCardio) b+='<span class="cell-badge cb-cardio">cardio</span>';
  if(hasFuel)   b+='<span class="cell-badge cb-fuel">fuel</span>';
  return b ? '<div class="cell-badges">'+b+'</div>' : '';
}

/* Vibe CSS class for a day entry */
function vibeClass(entry) {
  if(!entry) return '';
  const v=entry.vibe||'';
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

function renderPeriodStats(isos, label) {
  const pC=state.climbs.filter(c=>isos.includes(c.date));
  const pA=state.cardio.filter(c=>isos.includes(c.date));
  const cPts=pC.reduce((s,c)=>s+(c.points||0),0);
  const aPts=pA.reduce((s,c)=>s+(c.points||0),0);
  const mi=pA.reduce((s,c)=>s+(parseFloat(c.miles)||0),0);
  const vt=pA.reduce((s,c)=>s+(parseFloat(c.vert)||0),0);
  const sessions=pC.length+pA.length;
  document.getElementById('period-stats').innerHTML=
    '<div class="stat-grid" style="margin-top:0.5rem">'+
    '<div class="stat-card"><div class="stat-val">'+(cPts+aPts).toFixed(1)+'</div><div class="stat-label">'+label+' points</div></div>'+
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
    return '<div class="log-entry" onclick="openClimbModal('+c._i+')">'+
      '<div class="entry-header"><span class="pill pill-'+esc(c.climbType||'climb')+'">'+esc(c.venue||'')+' '+esc(c.climbType||'')+'</span>'+
      '<span class="entry-date">'+fmtDisplay(c.date)+'</span>'+
      '<span class="entry-pts">'+(c.points||0).toFixed(1)+' pts</span></div>'+
      '<div class="entry-detail">'+esc(rows)+(c.notes?'<br><span class="entry-note">'+esc(c.notes)+'</span>':'')+'</div></div>';
  }).join('');
}

function renderCardio() {
  const sorted=state.cardio.map((c,i)=>({...c,_i:i})).sort((a,b)=>b.date.localeCompare(a.date));
  const el=document.getElementById('cardio-list');
  if(!sorted.length){el.innerHTML='<div class="empty-state">No activities logged yet</div>';return;}
  el.innerHTML=sorted.map(c=>'<div class="log-entry" onclick="openCardioModal('+c._i+')">'+
    '<div class="entry-header"><span class="pill pill-cardio">'+esc(c.actType||'cardio')+'</span>'+
    '<span class="entry-date">'+fmtDisplay(c.date)+'</span>'+
    '<span class="entry-pts">'+(c.points||0).toFixed(1)+' pts</span></div>'+
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

function renderStats() {
  const climbPts=state.climbs.reduce((s,c)=>s+(c.points||0),0);
  const cardioPts=state.cardio.reduce((s,c)=>s+(c.points||0),0);
  const totalMi=state.cardio.reduce((s,c)=>s+(parseFloat(c.miles)||0),0);
  const totalVert=state.cardio.reduce((s,c)=>s+(parseFloat(c.vert)||0),0);
  document.getElementById('stat-grid').innerHTML=
    '<div class="stat-card"><div class="stat-val">'+(climbPts+cardioPts).toFixed(0)+'</div><div class="stat-label">Total points</div></div>'+
    '<div class="stat-card"><div class="stat-val">'+totalMi.toFixed(0)+'</div><div class="stat-label">Total miles</div></div>'+
    '<div class="stat-card"><div class="stat-val">'+Math.round(totalVert).toLocaleString()+'</div><div class="stat-label">Total vert (ft)</div></div>'+
    '<div class="stat-card"><div class="stat-val">'+(state.climbs.length+state.cardio.length)+'</div><div class="stat-label">Sessions</div></div>';
  const outC=state.climbs.filter(c=>c.venue==='outdoor').length;
  const inC=state.climbs.filter(c=>c.venue==='indoor').length;
  document.getElementById('stats-breakdown').innerHTML=
    '<div class="stat-grid">'+
    '<div class="stat-card"><div class="stat-val">'+climbPts.toFixed(1)+'</div><div class="stat-label">Climbing pts</div></div>'+
    '<div class="stat-card"><div class="stat-val">'+cardioPts.toFixed(1)+'</div><div class="stat-label">Cardio pts</div></div>'+
    '<div class="stat-card"><div class="stat-val">'+outC+'</div><div class="stat-label">Outdoor sessions</div></div>'+
    '<div class="stat-card"><div class="stat-val">'+inC+'</div><div class="stat-label">Indoor sessions</div></div></div>';
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

/* DAY MODAL */
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
  return CLIMB_GRADES.filter(g=>g.cat===cat&&g.venue===venue).map(g=>'<option value="'+g.pts+'">'+esc(g.k)+'</option>').join('');
}
function openClimbModal(idx) {
  const editing=idx!==null&&idx!==undefined&&idx>=0;
  const c=editing?state.climbs[idx]:{};
  const venue=c.venue||'indoor', ct=c.climbType||'boulder';
  const rowsHtml=(c.rows&&c.rows.length?c.rows:[{grade:'',count:1,pts:0}]).map(r=>{
    const opts=CLIMB_GRADES.filter(g=>g.cat===ct&&g.venue===venue).map(g=>'<option value="'+g.pts+'"'+(g.k===r.grade?' selected':'')+'>'+esc(g.k)+'</option>').join('');
    return '<div class="subrow"><select onchange="recalcRow(this)">'+opts+'</select>'+
      '<input type="number" min="1" max="99" value="'+(r.count||1)+'" oninput="recalcRow(this)">'+
      '<div class="pts-badge">0.0 pts</div>'+
      '<button class="remove-btn" onclick="this.closest(\'.subrow\').remove();updateClimbTotal()">&times;</button></div>';
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
    '<button class="tag'+(ct==='alpine'?' selected':'')+'" onclick="selTag(this,\'climb-type-tags\');refreshClimbGrades()">Alpine</button>'+
    '</div></div>'+
    '<div class="section-divider">Pitches / problems</div>'+
    '<div id="climb-subrows">'+rowsHtml+'</div>'+
    '<button class="add-row-btn" onclick="addClimbRow()">+ Add grade</button>'+
    '<div class="form-row single"><div><label>Notes</label><textarea id="m-notes" placeholder="Sends, projects, how you felt...">'+esc(c.notes||'')+'</textarea></div></div>'+
    '<div class="modal-footer"><div class="modal-footer-left">'+
    (editing?'<button class="btn btn-sm btn-danger" onclick="deleteClimb('+idx+')">Delete</button>':'')+
    '<span style="font-size:13px;color:var(--text)">Total: <strong id="climb-total">0.0</strong> pts</span></div>'+
    '<button class="btn btn-sm btn-accent" onclick="saveClimb('+(editing?idx:-1)+')">Save session</button></div>');
  document.querySelectorAll('#climb-subrows .subrow').forEach(r=>updateSubrowBadge(r));
  updateClimbTotal();
}
function refreshClimbGrades() {
  const venue=document.getElementById('m-venue').value;
  const ct=getSelectedTag('climb-type-tags').toLowerCase();
  document.querySelectorAll('#climb-subrows .subrow').forEach(row=>{
    row.querySelector('select').innerHTML=climbGradeOpts(ct,venue);
    updateSubrowBadge(row);
  }); updateClimbTotal();
}
function addClimbRow() {
  const venue=document.getElementById('m-venue')?.value||'indoor';
  const ct=getSelectedTag('climb-type-tags').toLowerCase()||'boulder';
  const row=document.createElement('div'); row.className='subrow';
  row.innerHTML='<select onchange="recalcRow(this)">'+climbGradeOpts(ct,venue)+'</select>'+
    '<input type="number" min="1" max="99" value="1" oninput="recalcRow(this)">'+
    '<div class="pts-badge">0.0 pts</div>'+
    '<button class="remove-btn" onclick="this.closest(\'.subrow\').remove();updateClimbTotal()">&times;</button>';
  document.getElementById('climb-subrows').appendChild(row);
  updateSubrowBadge(row); updateClimbTotal();
}
function recalcRow(el) { updateSubrowBadge(el.closest('.subrow')); updateClimbTotal(); }
function updateSubrowBadge(row) {
  const sel=row.querySelector('select'),inp=row.querySelector('input');
  const pts=(parseFloat(sel?.value)||0)*(parseInt(inp?.value)||0);
  const badge=row.querySelector('.pts-badge'); if(badge) badge.textContent=pts.toFixed(1)+' pts';
}
function updateClimbTotal() {
  let t=0;
  document.querySelectorAll('#climb-subrows .subrow').forEach(r=>{
    t+=(parseFloat(r.querySelector('select')?.value)||0)*(parseInt(r.querySelector('input')?.value)||0);
  });
  const el=document.getElementById('climb-total'); if(el) el.textContent=t.toFixed(1);
}
function saveClimb(idx) {
  const date=document.getElementById('m-date').value;
  const venue=document.getElementById('m-venue').value;
  const ct=getSelectedTag('climb-type-tags').toLowerCase()||'boulder';
  const notes=document.getElementById('m-notes').value;
  let total=0; const rows=[];
  document.querySelectorAll('#climb-subrows .subrow').forEach(row=>{
    const sel=row.querySelector('select'),inp=row.querySelector('input');
    const count=parseInt(inp?.value)||0, pts=parseFloat(sel?.value)||0;
    if(count>0){rows.push({grade:sel.options[sel.selectedIndex]?.text||'',count,pts});total+=pts*count;}
  });
  const entry={date,venue,climbType:ct,rows,notes,points:total};
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
    ['run','trail run','hike','scramble','alpine','bike'].map(t=>'<option value="'+t+'"'+(c.actType===t?' selected':'')+'>'+t+'</option>').join('')+
    '</select></div></div>'+
    '<div class="form-row single"><div><label>Objective / route</label><input type="text" id="m-objective" value="'+esc(c.objective||'')+'" placeholder="e.g. Green Mountain, Anenome loop"></div></div>'+
    '<div class="form-row three">'+
    '<div><label>Miles</label><input type="number" id="m-miles" step="0.1" min="0" value="'+esc(c.miles||'')+'" placeholder="0.0" oninput="calcCardioPts()"></div>'+
    '<div><label>Vert (ft)</label><input type="number" id="m-vert" step="100" min="0" value="'+esc(c.vert||'')+'" placeholder="0" oninput="calcCardioPts()"></div>'+
    '<div><label>Time (hrs)</label><input type="number" id="m-time" step="0.1" min="0" value="'+esc(c.time||'')+'" placeholder="0.0"></div></div>'+
    '<div style="margin-bottom:12px"><label style="margin-bottom:6px">Terrain</label>'+
    '<div class="tag-row" id="terrain-tags">'+
    '<button class="tag'+(terrain==='trail'?' selected':'')+'" onclick="selTag(this,\'terrain-tags\');calcCardioPts()">Trail</button>'+
    '<button class="tag'+(terrain==='road'?' selected':'')+'" onclick="selTag(this,\'terrain-tags\');calcCardioPts()">Road</button>'+
    '<button class="tag'+(terrain==='weighted'?' selected':'')+'" onclick="selTag(this,\'terrain-tags\');calcCardioPts()">Weighted (pack)</button>'+
    '<button class="tag'+(terrain==='scramble'?' selected':'')+'" onclick="selTag(this,\'terrain-tags\');calcCardioPts()">Scramble</button>'+
    '</div></div>'+
    '<div class="form-row single"><div><label>Notes</label><textarea id="m-notes" placeholder="How it felt, conditions, anything notable...">'+esc(c.notes||'')+'</textarea></div></div>'+
    '<div class="modal-footer"><div class="modal-footer-left">'+
    (editing?'<button class="btn btn-sm btn-danger" onclick="deleteCardio('+idx+')">Delete</button>':'')+
    '<span style="font-size:13px;color:var(--text)">Est. points: <strong id="cardio-pts">0.0</strong></span></div>'+
    '<button class="btn btn-sm btn-accent" onclick="saveCardio('+(editing?idx:-1)+')">Save activity</button></div>');
  calcCardioPts();
}
function calcCardioPts() {
  const tt=getSelectedTag('terrain-tags').toLowerCase();
  const tKey=tt==='weighted (pack)'?'weighted':(tt||'trail');
  const mi=parseFloat(document.getElementById('m-miles')?.value)||0;
  const vt=parseFloat(document.getElementById('m-vert')?.value)||0;
  let pts=mi*(TERRAIN_MILE_PTS[tKey]||1.0)+vt*(TERRAIN_VERT_PTS[tKey]||0.002);
  if(mi>20) pts*=1.3; else if(mi>10) pts*=1.2;
  const el=document.getElementById('cardio-pts'); if(el) el.textContent=pts.toFixed(1);
}
function saveCardio(idx) {
  const date=document.getElementById('m-date').value;
  const actType=document.getElementById('m-acttype').value;
  const objective=document.getElementById('m-objective').value;
  const miles=document.getElementById('m-miles').value;
  const vert=document.getElementById('m-vert').value;
  const time=document.getElementById('m-time').value;
  const notes=document.getElementById('m-notes').value;
  const tt=getSelectedTag('terrain-tags').toLowerCase();
  const terrain=tt==='weighted (pack)'?'weighted':(tt||'trail');
  const mi=parseFloat(miles)||0, vt=parseFloat(vert)||0;
  let pts=mi*(TERRAIN_MILE_PTS[terrain]||1.0)+vt*(TERRAIN_VERT_PTS[terrain]||0.002);
  if(mi>20) pts*=1.3; else if(mi>10) pts*=1.2;
  const entry={date,actType,objective,miles,vert,time,notes,terrain,points:pts};
  if(idx>=0) state.cardio[idx]=entry; else state.cardio.push(entry);
  saveState(); closeModal(); renderCardio(); renderCalendar(); renderStats();
}
function deleteCardio(idx) { state.cardio.splice(idx,1); saveState(); closeModal(); renderCardio(); renderCalendar(); renderStats(); }

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
      const existing=Object.keys(state.days).length+state.climbs.length+state.cardio.length+state.fuel.length;
      if(existing>0&&!confirm('This will merge the backup with your current data. Continue?')){event.target.value='';return;}
      state.days={...state.days,...days};
      function mergeArr(ex,inc){const seen=new Set(ex.map(x=>JSON.stringify(x)));inc.forEach(x=>{const k=JSON.stringify(x);if(!seen.has(k)){seen.add(k);ex.push(x);}});return ex;}
      state.climbs=mergeArr(state.climbs,climbs);
      state.cardio=mergeArr(state.cardio,cardio);
      state.fuel=mergeArr(state.fuel,fuel);
      saveState();
      renderCalendar(); renderClimbs(); renderCardio(); renderFuel(); renderStats();
      showToast('Backup imported successfully');
    } catch(err){ alert('That file doesn\'t look like a valid training log backup.'); }
    event.target.value='';
  };
  reader.readAsText(file);
}


// Bootstrap historical data from data/seed-data.json on first load (if storage is empty).
// This only seeds the app once; after that, all data lives in localStorage and
// edits/imports are never overwritten by the seed file.
async function bootstrapSeedData() {
  try {
    const existing = localStorage.getItem(STORAGE_KEY);
    const res = await fetch('data/seed-data.json');
    if (!res.ok) return; // no seed file present, fine
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
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
    }
  } catch (e) {
    console.warn('Seed data bootstrap skipped:', e);
  }
}

bootstrapSeedData().then(loadState);