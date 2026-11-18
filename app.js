'use strict';
/* Mi Entrenamiento v2 · funciona sin servidores, anuncios ni dependencias externas.
   Compatibilidad: lee manuel_gym_v1; escribe SOLO manuel_gym_v2.
   La clave anterior nunca se modifica ni se borra. */
(() => {
  const V2_KEY = 'manuel_gym_v2';
  const V1_KEY = 'manuel_gym_v1';
  const VERSION = 2;
  const $ = (q, node = document) => node.querySelector(q);
  const $$ = (q, node = document) => [...node.querySelectorAll(q)];
  const escapeHTML = val => String(val ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const uid = () => ('id-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2,9));
  const dayToday = () => { const d = new Date(); return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-'); };
  const normalize = s => String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,' ').trim();
  const fmtKg = val => (Number.isFinite(Number(val)) && val !== '' && val != null ? String(Number(val)).replace('.',',') : '—');
  const formatDate = s => { if(!/^\d{4}-\d{2}-\d{2}$/.test(String(s||''))) return String(s || 'Sin fecha'); const p=s.split('-'); return p[2]+'/'+p[1]+'/'+p[0]; };
  const mmss = s => { const n=Math.max(0,Math.ceil(s)); return Math.floor(n/60).toString().padStart(2,'0')+':'+(n%60).toString().padStart(2,'0'); };
  const cloned = obj => JSON.parse(JSON.stringify(obj));

  // id, nombre, series, repeticiones, descanso (segundos), peso inicial orientativo, tipo
  const workoutPresets = [
    {name:'Torso A · Pecho', short:'Torso A', subtitle:'Prioridad pecho', exercises:[
      ['press_banca','Press de banca con barra',3,'6–8',180,'45'],
      ['press_inclinado','Press inclinado con mancuernas',3,'8–10',120,'15'],
      ['dominadas','Dominadas libres',3,'4–6',180,'0','bodyweight'],
      ['remo_mancuerna','Remo con mancuerna a una mano',3,'8–12',120,'12.5'],
      ['laterales','Elevaciones laterales',3,'12–15',90,'6'],
      ['triceps_polea','Extensión de tríceps en polea',2,'10–12',90,''],
      ['predicador','Curl predicador con barra',2,'8–10',90,'20']
    ]},
    {name:'Piernas A · Cuádriceps',short:'Piernas A',subtitle:'Prioridad cuádriceps', exercises:[
      ['sentadilla','Sentadilla con barra',3,'6–8',180,'50'],
      ['prensa','Prensa de piernas',3,'10–12',150,'100'],
      ['cuadriceps','Extensiones de cuádriceps',2,'12–15',90,'35'],
      ['femoral','Curl femoral en camilla',3,'10–12',120,'40'],
      ['aductores','Aductores en máquina',2,'12–15',90,'40'],
      ['gemelos','Gemelos en máquina',3,'10–15',90,'']
    ]},
    {name:'Torso B · Espalda',short:'Torso B',subtitle:'Prioridad espalda',exercises:[
      ['dominadas','Dominadas libres',3,'4–6',180,'0','bodyweight'],
      ['remo_barra','Remo con barra',3,'6–8',150,'25'],
      ['press_banca','Press de banca con barra',3,'8–10',150,'40'],
      ['dorsalera','Dorsalera en polea alta',2,'10–12',120,'30'],
      ['aperturas','Aperturas en máquina (peck deck)',2,'10–15',90,'50'],
      ['curl_sien','Curl en polea a la sien',2,'10–12',90,'10'],
      ['martillo','Curl martillo con mancuernas',2,'10–12',90,'10'],
      ['press_frances','Press francés con barra',2,'10–12',90,'20']
    ]},
    {name:'Hombros + Piernas B',short:'Hombros + piernas',subtitle:'Deltoides completos y posterior',exercises:[
      ['militar','Press militar con mancuernas',3,'6–10',150,'10'],
      ['laterales','Elevaciones laterales',3,'12–15',90,'6'],
      ['posteriores','Peck deck invertida (posteriores)',3,'12–15',90,''],
      ['rumano','Peso muerto rumano con barra',3,'8–10',180,'30'],
      ['smith','Sentadilla en Smith',2,'8–10',150,''],
      ['femoral','Curl femoral en camilla',2,'10–12',90,'40'],
      ['gemelos','Gemelos en máquina',2,'12–15',90,'']
    ]}
  ];
  const presets = () => workoutPresets.map((d,i) => ({id:'day'+i,name:d.name,short:d.short,subtitle:d.subtitle,ex:d.exercises.map(e => ({id:e[0],name:e[1],count:e[2],target:e[3],rest:e[4],seed:e[5],kind:e[6] || 'weight'}))}));
  const oldAliases = {
    'press de banca con barra':'press_banca','press de banca':'press_banca',
    'press inclinado con mancuernas':'press_inclinado',
    'dominadas libres':'dominadas',
    'remo con mancuerna a una mano':'remo_mancuerna','remo con mancuerna apoyado':'remo_mancuerna',
    'remo con barra':'remo_barra','vuelos laterales':'laterales','elevaciones laterales':'laterales',
    'press frances con barra':'press_frances','press frances':'press_frances',
    'curl predicador con barra':'predicador','curl biceps predicador':'predicador',
    'sentadilla con barra':'sentadilla','prensa':'prensa','prensa de piernas':'prensa',
    'extensiones de cuadriceps':'cuadriceps','silla de cuadriceps':'cuadriceps',
    'curl femoral en camilla':'femoral','camilla de isquiotibiales':'femoral',
    'aductores':'aductores','aductores en maquina':'aductores',
    'gemelos en maquina':'gemelos','dorsalera':'dorsalera','dorsalera en polea alta':'dorsalera',
    'aperturas en maquina':'aperturas','aperturas en maquina peck deck':'aperturas',
    'curl martillo':'martillo','curl martillo con mancuernas':'martillo',
    'extension de triceps en polea':'triceps_polea',
    'curl en polea a la sien':'curl_sien','curl biceps en polea a la sien':'curl_sien',
    'peso muerto rumano':'rumano','peso muerto rumano con barra':'rumano',
    'sentadilla en smith':'smith','press militar con mancuernas':'militar',
    'peck deck invertida posteriores':'posteriores'
  };
  const exerciseId = name => oldAliases[normalize(name)] || ('old_' + normalize(name).replaceAll(' ','_'));
  const freshDb = () => ({schema:VERSION,days:presets(),sessions:[],drafts:{},legacyDrafts:{},legacyPlan:null,timer:null,migrated:false,createdAt:new Date().toISOString()});
  let errorStorage = false;
  function readJson(key) { try { const raw=localStorage.getItem(key); return raw===null?null:JSON.parse(raw); } catch {return null;} }
  function validDb(obj) {return !!(obj && Array.isArray(obj.days) && Array.isArray(obj.sessions));}
  function normalizeLegacySession(raw) {
    return {id:raw.id || uid(),date:raw.date || dayToday(),savedAt:raw.savedAt || null,dayName:raw.dayName || 'Entrenamiento anterior',day:Number.isInteger(raw.day)?raw.day:null,
      ex:(Array.isArray(raw.ex)?raw.ex:[]).map(ex => ({id:ex.id || exerciseId(ex.name),name:String(ex.name || 'Ejercicio'),sets:(Array.isArray(ex.sets)?ex.sets:[]).filter(s=>s && s.reps!=='' && s.reps!==null && s.reps!==undefined && (s.done!==false)).map(s=>({kg:String(s.kg??''),reps:String(s.reps??''),done:true}))})).filter(ex=>ex.sets.length)};
  }
  function load() {
    try {
      const raw=localStorage.getItem(V2_KEY);
      if(raw) {
        const parsed=JSON.parse(raw);
        if(!validDb(parsed) || !parsed.drafts || typeof parsed.drafts!=='object') throw Error('Formato de v2 no válido');
        parsed.schema=VERSION;
        parsed.days=parsed.days.map((d,i)=>({...d,id:d.id || 'day'+i,short:d.short || d.name,ex:(d.ex||[]).map(ex=>({...ex,id:ex.id || exerciseId(ex.name),count:Number(ex.count)||3,rest:Number(ex.rest)||90,kind:ex.kind || 'weight'}))}));
        parsed.sessions=parsed.sessions.map(s=>({...s,ex:(s.ex||[]).map(ex=>({...ex,id:ex.id || exerciseId(ex.name)}))}));
        parsed.legacyDrafts ||= {};
        return parsed;
      }
      const prev=readJson(V1_KEY);
      if(validDb(prev)) {
        const next=freshDb();
        next.sessions=(prev.sessions || []).map(normalizeLegacySession);
        next.legacyDrafts=cloned(prev.drafts || {});
        next.legacyPlan=cloned(prev.days);
        next.migrated=true;
        next.migratedAt=new Date().toISOString();
        return next;
      }
    } catch(e) {
      // Si la v2 está corrupta, jamás sobrescribimos los bytes sin una copia.
      try { const raw=localStorage.getItem(V2_KEY); if(raw) localStorage.setItem('manuel_gym_v2_recovery_'+Date.now(),raw); } catch {}
      errorStorage=true;
    }
    return freshDb();
  }
  let db = load();
  function save() { try {localStorage.setItem(V2_KEY,JSON.stringify(db));return true;} catch (e) {errorStorage=true;notify('No se pudo guardar. Exportá una copia y revisá el espacio disponible.',5000);return false;} }
  // Solo se escribe la v2. Nunca se borra ni sobrescribe la v1.
  if (!localStorage.getItem(V2_KEY)) save();
  const ui={tab:'train',day:0,opened:0,progressEx:'press_banca',historyOpen:null,editDay:0};
  let toastId;
  function notify(text,ms=2800) {const node=$('#toast');node.textContent=text;node.classList.remove('hidden');clearTimeout(toastId);toastId=setTimeout(()=>node.classList.add('hidden'),ms);}
  function recordSets(ex) {return (ex?.sets || []).filter(s=>s && Number(s.reps)>0 && s.kg!=='' && s.kg != null);}
  function sessionsFor(id) {
    return db.sessions.flatMap((s,index)=> (s.ex||[]).filter(e=>(e.id || exerciseId(e.name))===id).map(e=>({session:s,ex:e,index})))
      .sort((a,b)=>String(a.session.date).localeCompare(String(b.session.date)) || a.index-b.index);
  }
  function mostRecent(id) {let arr=sessionsFor(id);return arr.length?arr[arr.length-1]:null;}
  function personalBest(id,kind='weight') {
    const entries=sessionsFor(id); const sets=entries.flatMap(({session,ex})=>recordSets(ex).map(s=>({...s,date:session.date})));
    if(!sets.length) return null;
    const max = sets.reduce((best,s)=>{
      const a=Number(s.kg)||0, b=Number(best.kg)||0;
      if(kind==='bodyweight' && a===b) return Number(s.reps)>Number(best.reps)?s:best;
      if(a===b) return Number(s.reps)>Number(best.reps)?s:best;
      return a>b?s:best;
    });
    const noLastre=kind==='bodyweight' && (+max.kg===0);
    return {text:noLastre?`${max.reps} reps · sin lastre`:`${fmtKg(max.kg)} kg × ${max.reps} reps`,date:max.date,kg:Number(max.kg)||0,reps:Number(max.reps)||0};
  }
  function priorSeriesText(id,kind) {
    let old=mostRecent(id);if(!old) return 'Todavía sin registros.';
    let sets=recordSets(old.ex);
    if(!sets.length)return 'Todavía sin registros.';
    return `${formatDate(old.session.date)} · ${sets.map(s=>kind==='bodyweight'?`${s.reps} reps${+s.kg?` (+${fmtKg(s.kg)} kg)`:''}`:`${fmtKg(s.kg)} kg × ${s.reps}`).join('  /  ')}`;
  }
  function draftFromDay(idx) {
    const program=db.days[idx];
    return {id:uid(),date:dayToday(),startedAt:Date.now(),dayName:program.name,programVersion:2,ex:program.ex.map(e=>{
      const old=mostRecent(e.id); const prev=old?recordSets(old.ex):[];
      return {id:e.id,name:e.name,target:e.target,kind:e.kind,rest:e.rest,count:e.count,confirmed:false,sets:Array.from({length:e.count},(_,j)=>({kg:prev[j]?.kg??(prev.length?prev.at(-1).kg:(e.seed ?? '')),reps:'',done:false}))};
    })};
  }
  function currentDraft(){if(!db.drafts[ui.day]){db.drafts[ui.day]=draftFromDay(ui.day);save();}return db.drafts[ui.day];}
  function countConfirmed(d){return d.ex.filter(ex=>ex.confirmed).length;}
  function restText(seconds){const minutes=Math.floor(seconds/60),extra=seconds%60;return minutes?`${minutes} min${extra?` ${extra} s`:''}`:`${seconds} s`;}
  function cleanWeight(w){const trimmed=String(w??'').trim().replace(',','.');return trimmed;}
  function validSet(s){let num=Number(cleanWeight(s.kg));return String(s.kg).trim()!=='' && Number.isFinite(num) && num>=0 && Number.isInteger(Number(s.reps)) && Number(s.reps)>0;}
  function render(){
    $$('.navbtn').forEach(b=>b.classList.toggle('selected',b.dataset.tab===ui.tab));
    if(ui.tab==='train')renderTrain();
    else if(ui.tab==='history')renderHistory();
    else if(ui.tab==='progress')renderProgress();
    else renderSettings();
    renderTimer();
  }
  function renderTrain(){
    const d=currentDraft(),p=db.days[ui.day],completed=countConfirmed(d);
    const totalSets=d.ex.reduce((n,e)=>n+e.count,0), doneSets=d.ex.reduce((n,e)=>n+e.sets.filter(s=>s.done).length,0);
    const chips=db.days.map((program,i)=>{let dr=db.drafts[i];let c=dr?countConfirmed(dr):0;return `<button type="button" class="daychip ${i===ui.day?'active':''}" data-action="choose-day" data-day="${i}" aria-pressed="${i===ui.day}"><span class="num">DÍA ${i+1}</span><span class="dayname">${escapeHTML(program.short||program.name)}</span><span class="dayhint">${dr && c>0 ? `${c}/${dr.ex.length} confirmados` : escapeHTML(program.subtitle||'')}</span></button>`;}).join('');
    const recovered=Object.keys(db.legacyDrafts||{}).filter(k=>db.legacyDrafts[k]?.ex?.some(ex=>(ex.sets||[]).some(s=>s.done || s.reps))).length;
    $('#app').innerHTML=`
      <div class="page-head"><h2>Tu entrenamiento</h2><p>Elegí un día, registrá tus series y confirmá cada ejercicio.</p></div>
      ${errorStorage?'<div class="banner warn">⚠️ El dispositivo informó un problema de almacenamiento. Exportá una copia antes de continuar.</div>':''}
      ${db.migrated?'<div class="banner imported-hint">✓ Se detectaron datos de la versión anterior. El historial se conservó; la rutina se actualizó.</div>':''}
      ${recovered?`<div class="banner warn">Tenés ${recovered} borrador(es) de la rutina anterior recuperables en <b>Ajustes</b>.</div>`:''}
      <div class="daygrid">${chips}</div>
      <section class="card"><div class="row"><div class="grow"><div class="eyebrow">ENTRENAMIENTO ACTIVO</div><h2 class="sectiontitle" style="font-size:19px;margin:4px 0 5px">${escapeHTML(d.dayName||p.name)}</h2><div class="muted small">${d.ex.length} ejercicios · ${totalSets} series programadas</div></div><div class="pill">${completed}/${d.ex.length} ✓</div></div>
      ${d.programVersion===1?'<div class="banner warn">Estás editando un borrador anterior. Al terminarlo, las próximas sesiones usarán la nueva rutina.</div>':''}
      <div class="progress-inline"><div class="bar-bg"><div class="bar-fill" style="width:${d.ex.length?Math.round(completed/d.ex.length*100):0}%"></div></div><strong>${completed} confirmados</strong></div>
      <div class="row wrap" style="margin-top:11px"><label class="small muted" for="workdate">Fecha de la sesión</label><input style="width:158px;min-height:36px;padding:7px" id="workdate" data-action="date" type="date" value="${escapeHTML(d.date)}"></div></section>
      <div class="section-label">Ejercicios · ${doneSets} series marcadas</div>
      ${d.ex.map((e,i)=>renderExercise(e,i)).join('')}
      <button type="button" class="btn primary full end-btn" data-action="finish">Completar entrenamiento →</button>
      <p class="disclaimer">Se guarda un borrador automáticamente en este dispositivo. Solo los ejercicios confirmados pasan al historial cuando terminás la sesión.</p>`;
  }
  function renderExercise(ex,i){
    const isOpen=ui.opened===i, setsDone=ex.sets.filter(s=>s.done).length;
    const latest=mostRecent(ex.id),pr=personalBest(ex.id,ex.kind);
    const subtitle=ex.confirmed?`✓ Confirmado · ${setsDone} ${setsDone===1?'serie':'series'}`:`${ex.count} series × ${escapeHTML(ex.target)} reps · ${setsDone}/${ex.count} hechas`;
    const summary=ex.sets.filter(s=>s.done).map(s=>ex.kind==='bodyweight'?`${escapeHTML(s.reps)} rep${Number(s.kg)>0?` (+${fmtKg(s.kg)} kg)`:''}`:`${fmtKg(s.kg)} kg × ${escapeHTML(s.reps)}`).join(' · ');
    return `<section id="ex-${i}" class="ex-card ${ex.confirmed?'confirmed':''} ${isOpen?'open':''}">
      <button type="button" class="ex-head" data-action="expand" data-index="${i}" aria-expanded="${isOpen}"><span class="ex-index">${ex.confirmed?'✓':i+1}</span><span class="grow"><span class="ex-title">${escapeHTML(ex.name)}</span><span class="ex-sub">${subtitle}</span></span><span class="ex-state">${ex.confirmed?'<span class="green small">Listo</span>':''}<span class="arrow">${isOpen?'⌃':'⌄'}</span></span></button>
      ${isOpen?`<div class="ex-content">${ex.confirmed?
      `<p class="completed-summary" style="margin-top:12px"><b>Series registradas:</b><br>${summary||'Sin series'}</p><button type="button" class="btn secondary full" data-action="unlock" data-index="${i}">✎ Modificar ejercicio</button>`:
      `<div class="facts"><div class="fact"><div class="f-label">🏆 RÉCORD HISTÓRICO</div><div class="f-value">${pr?escapeHTML(pr.text):'Sin récord todavía'}</div></div><div class="fact"><div class="f-label">↻ ÚLTIMO REGISTRO</div><div class="f-value">${latest?formatDate(latest.session.date):'Primera sesión'}</div></div></div>
        <div class="pastsets"><b>Series anteriores:</b><br>${escapeHTML(priorSeriesText(ex.id,ex.kind))}</div>
        <span class="rest-label">◷ Descanso sugerido: ${escapeHTML(restText(ex.rest))}</span>
        <div class="sets-header"><span>Serie</span><span>${ex.kind==='bodyweight'?'Lastre kg':'Peso kg'}</span><span>Reps</span><span>Lista</span></div>
        ${ex.sets.map((s,j)=>`<div class="setrow ${s.done?'done':''}"><span class="set-index">${j+1}</span>
           <input type="text" inputmode="decimal" autocomplete="off" spellcheck="false" aria-label="Peso serie ${j+1} ${ex.name}" data-ex="${i}" data-set="${j}" data-field="kg" value="${escapeHTML(String(s.kg ?? '').replace('.',','))}" placeholder="kg">
           <input type="number" inputmode="numeric" min="1" max="999" aria-label="Repeticiones serie ${j+1} ${ex.name}" data-ex="${i}" data-set="${j}" data-field="reps" value="${escapeHTML(s.reps)}" placeholder="reps">
           <button type="button" class="setdone ${s.done?'checked':''}" data-action="setdone" data-ex="${i}" data-set="${j}" aria-pressed="${s.done}" aria-label="${s.done?'Desmarcar':'Marcar'} serie ${j+1}">${s.done?'✓':'○'}</button></div>`).join('')}
        <p class="hinttext">${ex.kind==='bodyweight'?'En dominadas, 0 kg significa sin lastre.':'El peso es por mancuerna en ejercicios con mancuernas.'} Marcá cada serie al terminar para iniciar el descanso.</p>
        <button type="button" class="btn primary full" data-action="confirm-ex" data-index="${i}">✓ Confirmar ejercicio (${setsDone}/${ex.count})</button>`}</div>`:''}</section>`;
  }
  function afterRenderScroll(idx){requestAnimationFrame(()=>{const node=document.getElementById('ex-'+idx);if(node)node.scrollIntoView({behavior:'smooth',block:'start'});});}
  function finishWorkout(){
    const d=currentDraft(); const confirmed=d.ex.filter(e=>e.confirmed);
    if(!confirmed.length){notify('Confirmá al menos un ejercicio antes de terminar.',4000);return;}
    const incomplete=d.ex.filter(e=>!e.confirmed);
    if(incomplete.length && !confirm(`Todavía hay ${incomplete.length} ejercicio(s) sin confirmar. ¿Finalizar y guardar únicamente los confirmados?`))return;
    const ex=confirmed.map(e=>({id:e.id,name:e.name,sets:e.sets.filter(s=>s.done&&validSet(s)).map(s=>({kg:cleanWeight(s.kg),reps:String(s.reps),done:true}))})).filter(e=>e.sets.length);
    if(!ex.length){notify('No hay series válidas para guardar.');return;}
    db.sessions.push({id:uid(),date:d.date||dayToday(),savedAt:new Date().toISOString(),day:ui.day,dayName:d.dayName,ex});
    delete db.drafts[ui.day];db.timer=null;ui.opened=0;ui.tab='history';ui.historyOpen=db.sessions.at(-1).id;save();render();window.scrollTo({top:0,behavior:'smooth'});notify('¡Entrenamiento completado y guardado!');
  }
  function changeDay(idx){if(!db.days[idx])return;ui.day=idx;const d=currentDraft();ui.opened=Math.max(0,d.ex.findIndex(e=>!e.confirmed));render();window.scrollTo({top:0,behavior:'smooth'});}
  function startRest(rest,exName){db.timer={durationMs:rest*1000,remainingMs:rest*1000,startedAt:Date.now(),paused:false,exercise:exName};save();renderTimer();}
  function timeRemaining(){if(!db.timer)return 0;const t=db.timer;return Math.max(0,t.remainingMs - (t.paused?0:Date.now()-t.startedAt));}
  function renderTimer(){const dock=$('#restdock');if(!db.timer){dock.classList.add('hidden');dock.innerHTML='';return;}
    const t=db.timer,remaining=timeRemaining(),done=remaining<=0;
    dock.classList.remove('hidden');dock.innerHTML=`<div class="grow"><div class="timer-text">${done?'✓ Descanso completado':`◷ Descanso · ${escapeHTML(t.exercise)}`}</div><div class="timer-number" id="timer-number">${done?'00:00':mmss(remaining/1000)}</div></div><div class="timer-actions">${!done?`<button type="button" data-action="timer-pause">${t.paused?'Seguir':'Pausar'}</button><button type="button" data-action="timer-restart">↻</button>`:''}<button class="hide-timer" type="button" data-action="timer-hide" aria-label="Ocultar temporizador">×</button></div>`;
  }
  setInterval(()=>{if(!db.timer || $('#restdock').classList.contains('hidden'))return;const left=timeRemaining();const e=$('#timer-number');if(e)e.textContent=mmss(left/1000);if(left===0 && !db.timer._renderedDone){db.timer._renderedDone=true;renderTimer();}},450);
  function pauseTimer(){if(!db.timer)return;const t=db.timer;if(t.paused){t.startedAt=Date.now();t.paused=false;} else {t.remainingMs=timeRemaining();t.paused=true;}save();renderTimer();}

  function renderHistory(){
    const sessions=[...db.sessions].sort((a,b)=>(String(b.date||'').localeCompare(String(a.date||'')) || String(b.savedAt||'').localeCompare(String(a.savedAt||''))));
    $('#app').innerHTML=`<div class="page-head"><h2>Historial</h2><p>${sessions.length} entrenamiento${sessions.length!==1?'s':''} guardado${sessions.length!==1?'s':''} en este dispositivo.</p></div>
      ${!sessions.length?`<div class="card empty-state"><div class="symbol">▤</div><h3>Todavía no hay entrenamientos</h3><p>Confirmá un ejercicio y completá tu primera sesión para ver el historial.</p></div>`:
      sessions.map(s=>{const open=ui.historyOpen===s.id;const series=(s.ex||[]).reduce((n,e)=>n+recordSets(e).length,0);
      return `<section class="card session-card"><button type="button" class="ex-head" style="padding:0;width:100%" data-action="history-toggle" data-id="${escapeHTML(s.id)}"><div class="grow"><div class="muted small">${formatDate(s.date)}</div><h3>${escapeHTML(s.dayName)}</h3><div class="muted small" style="margin-top:4px">${s.ex.length} ejercicios · ${series} series</div></div><span class="arrow">${open?'⌃':'⌄'}</span></button>${open?`<div class="line"></div>${s.ex.map(e=>`<div class="exercise-line"><strong>${escapeHTML(e.name)}</strong><small>${recordSets(e).map(x=>`${fmtKg(x.kg)} kg × ${escapeHTML(x.reps)}`).join(' · ')||'Sin datos'}</small></div>`).join('')}<button type="button" class="btn danger small" style="margin-top:12px" data-action="delete-session" data-id="${escapeHTML(s.id)}">Eliminar entrenamiento</button>`:''}</section>`;}).join('')}
      <p class="disclaimer">Tu historial queda guardado localmente. Exportá una copia desde Ajustes para protegerlo.</p>`;
  }
  function allExerciseOptions(){const found=new Map();for(const day of db.days){for(const ex of day.ex) if(!found.has(ex.id)) found.set(ex.id,{id:ex.id,name:ex.name,kind:ex.kind||'weight'});}for(const s of db.sessions){for(const ex of s.ex||[]){const id=ex.id||exerciseId(ex.name);if(!found.has(id))found.set(id,{id,name:ex.name,kind:id==='dominadas'?'bodyweight':'weight'});}}return [...found.values()];}
  function plot(series,metric){
    const W=340,H=205,MINX=39,MAXX=329,TOP=19,BOTTOM=168;const values=series.map(x=>x.val),max=Math.max(1,...values),min=Math.min(0,...values),span=max-min||1;
    const points=series.map((p,i)=>({x:MINX+(series.length>1?i*(MAXX-MINX)/(series.length-1):(MAXX-MINX)/2),y:BOTTOM-(p.val-min)/span*(BOTTOM-TOP),...p}));
    const path=points.map(p=>`${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
    const ticks=[0,.5,1].map(t=>{const v=min+t*span,y=BOTTOM-t*(BOTTOM-TOP);return `<line x1="${MINX}" x2="${MAXX}" y1="${y}" y2="${y}" stroke="#31475e" stroke-dasharray="3 5"/><text x="32" y="${y+3}" fill="#93aec8" text-anchor="end" font-size="9">${Number(v.toFixed(1)).toLocaleString('es-AR')}</text>`;}).join('');
    return `<svg class="chart-svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="Evolución de ${escapeHTML(metric)} en ${series.length} sesiones">${ticks}<polyline points="${path}" fill="none" stroke="#8cc2ff" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/>${points.map(p=>`<circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="4.8" fill="#92d5c3" stroke="#0e1826" stroke-width="1.8"><title>${escapeHTML(formatDate(p.date))}: ${p.val} ${escapeHTML(metric)}</title></circle>`).join('')}<text x="${MINX}" y="194" fill="#9eb3c6" font-size="10">${formatDate(series[0].date)}</text><text x="${MAXX}" y="194" fill="#9eb3c6" font-size="10" text-anchor="end">${formatDate(series.at(-1).date)}</text></svg>`;
  }
  function renderProgress(){
    const options=allExerciseOptions();if(!options.some(o=>o.id===ui.progressEx))ui.progressEx=options[0]?.id||'';
    const choice=options.find(o=>o.id===ui.progressEx),entries=choice?sessionsFor(choice.id):[];
    const best=choice?personalBest(choice.id,choice.kind):null,latest=choice?mostRecent(choice.id):null;
    const series=entries.map(({session,ex})=>{const sets=recordSets(ex);const weights=sets.map(s=>Number(s.kg)||0);const max=weights.length?Math.max(...weights):0;const reps=sets.filter(s=>Number(s.kg)===max).reduce((v,s)=>Math.max(v,Number(s.reps)||0),0);
      return {date:session.date,val:choice.kind==='bodyweight'&&!entries.some(entry=>recordSets(entry.ex).some(s=>Number(s.kg)>0))?Math.max(...sets.map(s=>Number(s.reps)||0),0):max,reps};});
    const onlyReps=choice?.kind==='bodyweight'&&!entries.some(entry=>recordSets(entry.ex).some(s=>Number(s.kg)>0));
    $('#app').innerHTML=`<div class="page-head"><h2>Progreso</h2><p>Seguí tus mejores marcas y compará sesiones.</p></div><section class="card"><div class="field"><label for="progselect">Ejercicio</label><select id="progselect">${options.map(o=>`<option value="${escapeHTML(o.id)}" ${ui.progressEx===o.id?'selected':''}>${escapeHTML(o.name)}</option>`).join('')}</select></div>
      ${!entries.length?`<div class="empty-state"><div class="symbol">⌁</div><h3>Tu progreso empieza acá</h3><p>Al completar entrenamientos, aparecerán los pesos máximos y la evolución.</p></div>`:
      `<div class="metric-pair"><div class="metric"><span class="num">${best?escapeHTML(best.text):'—'}</span><small>Récord histórico</small></div><div class="metric"><span class="num">${entries.length}</span><small>Sesiones registradas</small></div></div>
        <div class="section-label" style="margin-left:0">${onlyReps?'Mejores repeticiones por sesión':'Mayor peso por sesión (kg)'}</div>
        ${plot(series,onlyReps?'reps':'kg')}
        <p class="disclaimer">${onlyReps?'Dominadas sin lastre: se grafican las máximas repeticiones por serie.':'El gráfico muestra el peso máximo de cada sesión. Más peso no siempre implica más fuerza si cambian las repeticiones.'}</p>
        <div class="line"></div><p class="muted small"><b>Última sesión:</b> ${latest?escapeHTML(priorSeriesText(choice.id,choice.kind)):'—'}</p>
        <div class="section-label" style="margin-left:0">Registros recientes</div>
        ${entries.slice(-8).reverse().map(({session,ex})=>`<div class="row list-item"><span class="small">${formatDate(session.date)}</span><span class="muted small" style="text-align:right">${recordSets(ex).map(s=>`${fmtKg(s.kg)} kg × ${escapeHTML(s.reps)}`).join(' · ')}</span></div>`).join('')}`}</section>`;
  }
  function renderSettings(){
    const d=db.days[ui.editDay]||db.days[0];
    const legacy=Object.entries(db.legacyDrafts||{}).filter(([,v])=>v?.ex?.some(ex=>(ex.sets||[]).some(s=>s.done || s.reps)));
    $('#app').innerHTML=`<div class="page-head"><h2>Ajustes</h2><p>Rutina editable, copias de seguridad y datos locales.</p></div>
      <section class="card"><h3 class="sectiontitle">Tus datos, bajo tu control</h3><p class="muted small">Exportá el historial junto con las rutinas y los borradores. Podés guardar el archivo en Archivos o iCloud Drive. No hay sincronización automática con otros dispositivos.</p>
        <div class="buttonrow"><button class="btn primary" type="button" data-action="export-json">↗ Exportar copia JSON</button><button class="btn secondary" type="button" data-action="export-csv">CSV de sesiones</button></div>
        <div class="line"></div><div class="field"><label for="importfile">Importar / restaurar copia JSON</label><input type="file" id="importfile" accept=".json,application/json"></div><p class="disclaimer">Restaurar reemplaza los datos de esta versión. Exportá antes una copia actual.</p>
        ${db.migrated?'<p class="banner imported-hint">El historial de la versión 1 se copió al actualizar. La clave original sigue intacta en este dispositivo.</p>':''}</section>
      ${legacy.length?`<section class="card"><h3 class="sectiontitle">Borradores anteriores recuperables</h3><p class="muted small">Detecté borradores de la aplicación vieja que podrían tener datos sin finalizar. Podés restaurar uno a Entrenar sin perder los datos originales.</p>${legacy.map(([idx,raw])=>`<div class="row list-item"><div class="stack grow"><strong class="small">Día ${Number(idx)+1} · ${formatDate(raw.date)}</strong><span class="muted small">${raw.ex.filter(e=>e.sets.some(s=>s.done||s.reps)).length} ejercicios con datos</span></div><button type="button" class="btn small secondary" data-action="restore-legacy" data-day="${idx}">Recuperar</button></div>`).join('')}</section>`:''}
      <section class="card"><h3 class="sectiontitle">Editar rutina</h3><p class="muted small">Los cambios afectan los próximos entrenamientos. No se borran sesiones ni borradores activos.</p><div class="field"><label for="editday">Día</label><select id="editday">${db.days.map((p,i)=>`<option value="${i}" ${i===ui.editDay?'selected':''}>Día ${i+1} · ${escapeHTML(p.name)}</option>`).join('')}</select></div>
        <div class="field"><label for="editdayname">Título del día</label><input id="editdayname" data-editday="name" value="${escapeHTML(d.name)}"></div>
        ${d.ex.map((e,i)=>`<div class="edit-row"><div class="row"><span class="name">${i+1}. ${escapeHTML(e.name)}</span><div class="buttonrow" style="flex:0 0 auto"><button type="button" class="btn small secondary" aria-label="Subir ejercicio" data-action="move" data-index="${i}" data-dir="-1" ${i===0?'disabled':''}>↑</button><button type="button" class="btn small secondary" aria-label="Bajar ejercicio" data-action="move" data-index="${i}" data-dir="1" ${i===d.ex.length-1?'disabled':''}>↓</button></div></div>
        <div class="field"><label>Nombre</label><input data-edit="name" data-index="${i}" value="${escapeHTML(e.name)}"></div>
        <div class="formgrid three"><div class="field"><label>Series</label><input type="number" min="1" max="12" data-edit="count" data-index="${i}" value="${e.count}"></div><div class="field"><label>Reps</label><input data-edit="target" data-index="${i}" value="${escapeHTML(e.target)}"></div><div class="field"><label>Descanso (s)</label><input type="number" min="30" max="600" step="15" data-edit="rest" data-index="${i}" value="${e.rest}"></div></div>
        <button type="button" class="btn small danger" data-action="remove-ex" data-index="${i}">Quitar ejercicio</button></div>`).join('')}
        <button type="button" class="btn secondary full" data-action="add-ex">+ Agregar ejercicio</button></section>
      <section class="card"><h3 class="sectiontitle">Sesión en curso</h3><p class="muted small">Si querés empezar de cero en un día, podés descartar su borrador. Esto no borra el historial.</p><button type="button" class="btn danger" data-action="discard-draft">Descartar borrador del día ${ui.editDay+1}</button></section>
      <section class="card"><h3 class="sectiontitle">Almacenamiento</h3><p class="muted small">Tus datos se guardan en el almacenamiento local de la app instalada. Si la eliminás, cambiás de dispositivo o borrás sus datos, podés perderlos. Hacé copias de seguridad periódicas.</p><button type="button" class="btn danger" data-action="reset-all">Borrar historial, rutinas y borradores</button></section>
      <p class="disclaimer">Mi Entrenamiento v2 · Uso local · Sin notificaciones, alarmas ni acceso a internet obligatorio tras instalarse.</p>`;
  }
  function updateDraftField(input){
    const exIndex=Number(input.dataset.ex),setIndex=Number(input.dataset.set);
    const ex=currentDraft().ex[exIndex],s=ex?.sets?.[setIndex];if(!s||ex.confirmed)return;
    let value=input.value;
    if(input.dataset.field==='kg')value=cleanWeight(value);
    s[input.dataset.field]=value;
    save();
  }
  function onAction(action,target){
    const idx=Number(target.dataset.index),d=currentDraft();
    if(action==='choose-day'){changeDay(Number(target.dataset.day));return;}
    if(action==='expand'){ui.opened=ui.opened===idx?null:idx;render();return;}
    if(action==='setdone'){
      const i=Number(target.dataset.ex),j=Number(target.dataset.set),ex=d.ex[i],s=ex?.sets[j];if(!s||ex.confirmed)return;
      if(!s.done){if(!validSet(s)){notify('Primero completá peso y repeticiones de esa serie.',3500);return;}s.done=true;startRest(ex.rest,ex.name);}else s.done=false;
      save();render();return;
    }
    if(action==='confirm-ex'){
      const ex=d.ex[idx],finished=ex?.sets.filter(s=>s.done&&validSet(s)).length;
      if(!ex || !finished){notify('Marcá al menos una serie completa antes de confirmar.',3800);return;}
      if(ex.sets.some(s=>s.done&&!validSet(s))){notify('Hay una serie marcada sin peso o repeticiones válidas.');return;}
      if(finished<ex.count && !confirm(`Hiciste ${finished} de ${ex.count} series. ¿Confirmar este ejercicio con menos series?`))return;
      ex.confirmed=true;const next=d.ex.findIndex((e,j)=>j>idx&&!e.confirmed);const first=d.ex.findIndex(e=>!e.confirmed);
      ui.opened=next>=0?next:(first>=0?first:null);save();render();notify('Ejercicio confirmado ✓');if(ui.opened!==null)afterRenderScroll(ui.opened);return;
    }
    if(action==='unlock'){if(!d.ex[idx])return;d.ex[idx].confirmed=false;ui.opened=idx;save();render();notify('Ejercicio habilitado para modificar');return;}
    if(action==='finish'){finishWorkout();return;}
    if(action==='timer-hide'){db.timer=null;save();renderTimer();return;}
    if(action==='timer-pause'){pauseTimer();return;}
    if(action==='timer-restart'){if(!db.timer)return;db.timer.remainingMs=db.timer.durationMs;db.timer.startedAt=Date.now();db.timer.paused=false;delete db.timer._renderedDone;save();renderTimer();return;}
    if(action==='history-toggle'){ui.historyOpen=ui.historyOpen===target.dataset.id?null:target.dataset.id;renderHistory();return;}
    if(action==='delete-session'){if(!confirm('¿Eliminar este entrenamiento del historial? Esta acción no se puede deshacer.'))return;db.sessions=db.sessions.filter(s=>String(s.id)!==target.dataset.id);ui.historyOpen=null;save();renderHistory();notify('Sesión eliminada');return;}
    if(action==='export-json'){const data={app:'Mi Entrenamiento',schema:2,exportedAt:new Date().toISOString(),data:db};downloadOrShare('mi-entrenamiento-respaldo-'+dayToday()+'.json',JSON.stringify(data,null,2),'application/json');return;}
    if(action==='export-csv'){
      const rows=[['fecha','dia','ejercicio','serie','peso_kg','repeticiones']];
      db.sessions.forEach(s=>(s.ex||[]).forEach(ex=>recordSets(ex).forEach((set,i)=>rows.push([s.date,s.dayName,ex.name,i+1,set.kg,set.reps]))));
      const csv='\ufeff'+rows.map(row=>row.map(x=>'"'+String(x).replaceAll('"','""').replace(/^[=+@-]/,'\'$&')+'"').join(',')).join('\r\n');
      downloadOrShare('mi-entrenamiento-historial-'+dayToday()+'.csv',csv,'text/csv;charset=utf-8');return;
    }
    if(action==='restore-legacy'){
      const index=Number(target.dataset.day),raw=db.legacyDrafts?.[index];if(!raw?.ex)return;
      if(!confirm(`¿Restaurar el borrador antiguo del día ${index+1}? Reemplaza el borrador ACTUAL de ese día (no el historial).`))return;
      const oldDay=db.legacyPlan?.[index] || {name:'Rutina anterior'};
      db.drafts[index]={id:uid(),date:raw.date||dayToday(),startedAt:Date.now(),dayName:oldDay.name+' · versión anterior',programVersion:1,ex:raw.ex.map((e,j)=>{
        const baseEx=oldDay.ex?.[j] || {};
        const oldName=e.name||baseEx.name||'Ejercicio anterior';const id=exerciseId(oldName);
        const count=e.sets?.length||baseEx.count||3;
        return {id,name:oldName,count,target:baseEx.target||'8–12',rest:90,kind:id==='dominadas'?'bodyweight':'weight',confirmed:false,
          sets:(e.sets||Array.from({length:count},()=>({kg:'',reps:'',done:false}))).map(s=>({kg:String(s.kg??''),reps:String(s.reps??''),done:!!s.done}))};
      })};
      ui.day=index;ui.opened=0;ui.tab='train';save();render();window.scrollTo(0,0);notify('Borrador anterior restaurado');return;
    }
    if(action==='move'){
      const i=ui.editDay,other=idx+Number(target.dataset.dir);if(other<0||other>=db.days[i].ex.length)return;
      const ex=db.days[i].ex;[ex[idx],ex[other]]=[ex[other],ex[idx]];save();renderSettings();return;
    }
    if(action==='remove-ex'){
      const i=ui.editDay;if(!confirm('¿Quitar este ejercicio de los próximos entrenamientos? El historial anterior se conserva.'))return;
      db.days[i].ex.splice(idx,1);save();renderSettings();return;
    }
    if(action==='add-ex'){
      db.days[ui.editDay].ex.push({id:'custom_'+uid(),name:'Nuevo ejercicio',count:3,target:'8–12',rest:90,seed:'',kind:'weight'});
      save();renderSettings();return;
    }
    if(action==='discard-draft'){
      const i=ui.editDay;if(!db.drafts[i]){notify('No hay borrador guardado para este día.');return;}
      if(!confirm(`¿Descartar el borrador en curso del día ${i+1}? El historial se conserva.`))return;
      delete db.drafts[i];ui.opened=0;save();renderSettings();notify('Borrador descartado');return;
    }
    if(action==='reset-all'){
      if(!confirm('Atención: se borrarán TODOS los datos de la v2. ¿Ya exportaste una copia de seguridad?'))return;
      if(!confirm('Última confirmación: ¿borrar historial, rutinas y borradores de esta app?'))return;
      db=freshDb();save();ui.day=0;ui.opened=0;ui.tab='train';render();notify('Datos de v2 restablecidos');return;
    }
  }
  async function downloadOrShare(filename,content,type){
    const blob=new Blob([content],{type});
    try {
      const f=new File([blob],filename,{type});
      if(navigator.share && navigator.canShare?.({files:[f]})){
        await navigator.share({files:[f],title:'Copia de Mi Entrenamiento'});
        notify('Compartido. Guardá la copia en Archivos o iCloud Drive.');return;
      }
    }catch(e){if(e.name==='AbortError')return;}
    const url=URL.createObjectURL(blob);const link=document.createElement('a');link.href=url;link.download=filename;document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),15000);notify('Descarga iniciada. Revisá Archivos/Descargas.');
  }
  async function restoreImport(file){
    if(!file)return;
    try {
      const doc=JSON.parse(await file.text()),incoming=doc.data||doc;
      if(!validDb(incoming))throw Error('Archivo no compatible: faltan sesiones o rutinas.');
      if(!confirm('¿Reemplazar TODO el historial, rutinas y borradores de esta versión por los del archivo? Exportá primero tu copia actual.'))return;
      let restored;
      if(incoming.schema===2){restored=cloned(incoming);restored.schema=VERSION;restored.days=restored.days.map((day,i)=>({...day,id:day.id||'day'+i,ex:day.ex.map(e=>({...e,id:e.id||exerciseId(e.name),rest:Number(e.rest)||90,kind:e.kind||'weight'}))}));restored.sessions=restored.sessions.map(s=>({...s,ex:(s.ex||[]).map(e=>({...e,id:e.id||exerciseId(e.name)}))}));restored.drafts||={};restored.legacyDrafts||={};}
      else {restored=freshDb();restored.sessions=incoming.sessions.map(normalizeLegacySession);restored.legacyDrafts=cloned(incoming.drafts||{});restored.legacyPlan=cloned(incoming.days||[]);restored.migrated=true;}
      db=restored;ui.day=0;ui.opened=0;ui.tab='train';ui.historyOpen=null;save();render();notify('Copia restaurada correctamente');
    }catch(e){alert('No se pudo importar el archivo. '+e.message);}
  }
  $('#app').addEventListener('click',e=>{
    const button=e.target.closest('button[data-action]');if(button)onAction(button.dataset.action,button);
  });
  $('#app').addEventListener('input',e=>{if(e.target.matches('[data-field]')) updateDraftField(e.target);});
  $('#app').addEventListener('change',e=>{
    const t=e.target;
    if(t.id==='workdate'){currentDraft().date=t.value||dayToday();save();}
    else if(t.id==='progselect'){ui.progressEx=t.value;renderProgress();}
    else if(t.id==='editday'){ui.editDay=Number(t.value);renderSettings();}
    else if(t.id==='editdayname'){db.days[ui.editDay].name=t.value.trim()||db.days[ui.editDay].name;db.days[ui.editDay].short=db.days[ui.editDay].name;save();renderSettings();}
    else if(t.dataset.edit){
      const ex=db.days[ui.editDay].ex[Number(t.dataset.index)];if(!ex)return;
      if(t.dataset.edit==='name')ex.name=t.value.trim()||ex.name;
      else if(t.dataset.edit==='count')ex.count=Math.max(1,Math.min(12,parseInt(t.value,10)||1));
      else if(t.dataset.edit==='rest')ex.rest=Math.max(30,Math.min(600,parseInt(t.value,10)||90));
      else ex[t.dataset.edit]=t.value.trim()||ex[t.dataset.edit];
      save();renderSettings();
    } else if(t.id==='importfile'){restoreImport(t.files?.[0]);}
  });
  $('#restdock').addEventListener('click',e=>{const b=e.target.closest('button[data-action]');if(b)onAction(b.dataset.action,b);});
  $$('.navbtn').forEach(b=>b.addEventListener('click',()=>{ui.tab=b.dataset.tab;render();window.scrollTo({top:0,behavior:'instant'});}));
  render();
  if('serviceWorker' in navigator && (location.protocol==='https:' || location.hostname==='localhost')){
    navigator.serviceWorker.register('./sw.js',{updateViaCache:'none'}).catch(()=>{});
  }
})();
