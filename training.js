// Training-Tracking: zwei getrennte Bereiche
//  - "fortschritt": Gym-Progress (Sätze, Gewicht, Wdh., RIR → e1RM, Wochenvolumen)
//  - "recovery":    Belastung & Erholung (Intensitätsabfrage nach Einheiten, Morgen-Check, später Uhr + Brustgurt)
// Alles per Antippen, nichts eintippen.
window.Modules = window.Modules || {};
(function () {
'use strict';

// ---------- Helfer ----------
const load = (k, d) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } };
const save = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };
const pad = n => String(n).padStart(2, '0');
const dkey = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const today = () => dkey(new Date());
const daysAgo = n => { const d = new Date(); d.setDate(d.getDate() - n); return dkey(d); };
const nowMin = () => { const d = new Date(); return d.getHours() * 60 + d.getMinutes(); };
const hm = m => `${pad(Math.floor(m / 60) % 24)}:${pad(m % 60)}`;
const fmtKg = v => (Math.round(v * 10) / 10).toLocaleString('de-DE');
const chip = (attr, v, label, on) => `<button class="chip${on ? ' on' : ''}" ${attr}="${v}">${label}</button>`;

// =====================================================================
// FORTSCHRITT (Gym)
// =====================================================================
// step = Schritt am Gewichts-Regler, bw = Körpergewichtsübung (kg = Zusatzgewicht), noKg = nur Wiederholungen
const EX = {
  // Toms Oberkörper 1 (Dienstag)
  schulterKH: { n: 'Schulterdrücken KH', g: 'Schulter', step: 2 },
  latzieh: { n: 'Latziehen', g: 'Rücken', step: 5 },
  brustpresse: { n: 'Brustpresse liegend (Griffe zusammen)', g: 'Brust', step: 5 },
  tbar: { n: 'T-Bar Rudern brustgestützt', g: 'Rücken', step: 2.5, extra: 'Teilwdh. Trapez (bis Versagen)' },
  seithebenKabel: { n: 'Seitheben Kabel einarmig', g: 'Schulter', step: 1 },
  bizepsStuetze: { n: 'Bizepscurls mit Armstütze', g: 'Arme', step: 1 },
  pushdown: { n: 'Trizeps Pushdowns', g: 'Arme', step: 2.5 },
  crunch: { n: 'Ab-Crunch Maschine', g: 'Core', step: 5 },
  // Übungen aus dem Drive-Dokument (nur zur Auswahl, kein fester Plan)
  spanish: { n: 'Spanish Squat Hold', g: 'Beine', noKg: true, sec: true },
  trapbar: { n: 'Trap Bar Deadlift', g: 'Hüfte/Beinbeuger', step: 5 },
  defLunge: { n: 'Deficit Reverse Lunge (je Bein)', g: 'Beine', step: 2 },
  copenhagen: { n: 'Copenhagen Plank (je Seite)', g: 'Adduktoren', noKg: true, sec: true },
  wadenSitz: { n: 'Wadenheben sitzend', g: 'Waden', step: 5 },
  wadenSteh: { n: 'Wadenheben stehend (Supersatz)', g: 'Waden', step: 5 },
  // weitere Auswahl
  bank: { n: 'Bankdrücken', g: 'Brust', step: 2.5 },
  schraeg: { n: 'Schrägbank (KH)', g: 'Brust', step: 2 },
  klimmzug: { n: 'Klimmzüge', g: 'Rücken', step: 2.5, bw: true },
  latzug: { n: 'Latzug', g: 'Rücken', step: 5 },
  rudern: { n: 'Rudern', g: 'Rücken', step: 2.5 },
  schulter: { n: 'Schulterdrücken', g: 'Schulter', step: 2 },
  seitheben: { n: 'Seitheben', g: 'Schulter', step: 1 },
  facepull: { n: 'Face Pulls', g: 'Schulter', step: 2.5 },
  aussenrot: { n: 'Außenrotation Kabel', g: 'Schulter', step: 1 },
  bizeps: { n: 'Bizepscurls', g: 'Arme', step: 1 },
  trizeps: { n: 'Trizepsdrücken', g: 'Arme', step: 2.5 },
  kniebeuge: { n: 'Kniebeuge', g: 'Beine', step: 2.5 },
  presse: { n: 'Beinpresse', g: 'Beine', step: 5 },
  split: { n: 'Bulgarian Split Squat', g: 'Beine', step: 2 },
  ausfall: { n: 'Ausfallschritte', g: 'Beine', step: 2 },
  rdl: { n: 'Rumänisches Kreuzheben', g: 'Hüfte/Beinbeuger', step: 2.5 },
  beuger: { n: 'Beinbeuger', g: 'Hüfte/Beinbeuger', step: 2.5 },
  hipthrust: { n: 'Hip Thrust', g: 'Hüfte/Beinbeuger', step: 5 },
  adduktor: { n: 'Adduktoren', g: 'Hüfte/Beinbeuger', step: 5 },
  waden: { n: 'Wadenheben', g: 'Waden', step: 5 },
  sprung: { n: 'Box Jumps / Sprünge', g: 'Explosiv', noKg: true },
  core: { n: 'Core (Pallof / Anti-Rotation)', g: 'Core', step: 2.5 }
};
const GYM_TYPES = { ober: 'Oberkörper 1', ober2: 'Oberkörper 2', beine: 'Beine' };
// Zielvorgaben: [Übung, Sätze, Wdh./Sek. von, bis]; RIR-Vorgabe je Tag
const PLAN_RIR = { ober: 0, beine: 2 };
const PLAN = {
  ober: [['schulterKH', 2, 5, 7], ['latzieh', 2, 4, 6], ['brustpresse', 2, 4, 6], ['tbar', 2, 6, 8],
         ['seithebenKabel', 2, 6, 8], ['bizepsStuetze', 2, 6, 8], ['pushdown', 2, 6, 8], ['crunch', 2, 6, 8]]
};
const DEF_SEL = { ober: PLAN.ober.map(x => x[0]), ober2: [], beine: [] };
const target = ex => { for (const t in PLAN) { const f = PLAN[t].find(x => x[0] === ex); if (f) return { sets: f[1], lo: f[2], hi: f[3], rir: PLAN_RIR[t] }; } return null; };
const PLAN_V = 4;
const U = E => E.sec ? ' s' : ' Wdh.';

const gym = () => {
  const g = load('tf-gym', { sel: DEF_SEL, sessions: [] });
  if (g.v !== PLAN_V) { g.sel = { ...DEF_SEL }; g.v = PLAN_V; save('tf-gym', g); }
  return g;
};
// Doppelte Progression: alle Zielsätze am oberen Ende → beim nächsten Mal mehr Gewicht
function lastSession(g, ex) {
  for (let i = g.sessions.length - 1; i >= 0; i--) { const s = g.sessions[i]; if (s.done || s.d !== today()) { const a = s.sets.filter(x => x.ex === ex); if (a.length) return a; } }
  return null;
}
function advice(g, ex) {
  const T = target(ex), last = lastSession(g, ex);
  if (!T || !last) return null;
  const top = Math.max(...last.map(x => x.kg));
  const work = last.filter(x => x.kg === top);
  const E = EX[ex], u = U(E);
  if (E.noKg) return work.every(x => x.r >= T.hi) ? { up: true, kg: 0, msg: `Letztes Mal überall ${T.hi}${u} → heute etwas schwerer (Band / Hebel / Zusatzlast)` } : { up: false, kg: 0, msg: `Ziel: ${T.hi}${u} in allen Sätzen` };
  if (work.length >= T.sets && work.every(x => x.r >= T.hi)) return { up: true, kg: top + (E.step || 2.5), msg: `Letztes Mal überall ${T.hi}+${u} → heute mit mehr Gewicht` };
  if (work.some(x => x.r < T.lo)) return { up: false, kg: top, msg: `Letztes Mal unter ${T.lo}${u} → Gewicht halten` };
  return { up: false, kg: top, msg: `Gewicht halten, Ziel: ${T.hi}${u} in allen Sätzen` };
}
const gymSave = g => save('tf-gym', g);
const active = g => g.sessions.find(s => !s.done && s.d === today()) || null;

// Geschätztes 1RM (Epley, Reserve-Wdh. mitgezählt) – vergleichbar über verschiedene Wdh.-Bereiche
const e1rm = s => s.kg > 0 ? s.kg * (1 + (s.r + (s.rir || 0)) / 30) : 0;
const allSets = (g, ex, from) => g.sessions.filter(s => !from || s.d >= from).flatMap(s => s.sets.filter(x => x.ex === ex).map(x => ({ ...x, d: s.d })));
const lastSet = (g, ex) => { const a = allSets(g, ex); return a[a.length - 1] || null; };
function bestIn(g, ex, from, to) {
  const a = allSets(g, ex, from).filter(x => !to || x.d < to);
  if (!a.length) return null;
  return EX[ex] && EX[ex].noKg ? Math.max(...a.map(x => x.r)) : Math.max(...a.map(e1rm));
}

let draft = null; // aktueller Satz im Regler

function logger(g, ex) {
  const E = EX[ex], ses = active(g), done = ses ? ses.sets.filter(x => x.ex === ex) : [];
  const l = lastSet(g, ex);
  const T = target(ex), adv = done.length ? null : advice(g, ex);
  if (!draft || draft.ex !== ex) draft = { ex, kg: adv ? adv.kg : (l ? l.kg : (E.bw || E.noKg ? 0 : 20)), r: T ? T.lo : (l ? l.r : 8), rir: T ? T.rir : (l ? (l.rir ?? 2) : 2), px: 0 };
  const kgRow = E.noKg ? '' : `
    <div class="lbl2">${E.bw ? 'Zusatzgewicht' : 'Gewicht'}</div>
    <div class="step"><button data-ga="kg-" aria-label="weniger">−</button><b>${fmtKg(draft.kg)}<small> kg</small></b><button data-ga="kg+" aria-label="mehr">+</button></div>`;
  return `<div class="gym"><h3>${E.n}</h3>
    ${T ? `<p class="mini"><b>Ziel: ${T.sets} × ${T.lo}–${T.hi}${U(E)}</b> ${T.rir ? 'kontrolliert, ca. 2 im Tank – nicht bis Versagen' : 'bis Versagen (0–1 im Tank)'}</p>` : ''}
    ${adv ? `<p class="why">${adv.up ? '⬆︎ ' : ''}${adv.msg}</p>` : ''}
    <p class="mini">${l ? `Letztes Mal: ${E.noKg ? '' : fmtKg(l.kg) + ' kg × '}${l.r}${U(E)} · RIR ${l.rir >= 4 ? '4+' : l.rir}` : 'Erster Eintrag für diese Übung'}</p>
    ${kgRow}
    <div class="lbl2">${E.sec ? 'Sekunden gehalten' : 'Wiederholungen'}</div>
    <div class="step"><button data-ga="r-" aria-label="weniger">−</button><b>${draft.r}</b><button data-ga="r+" aria-label="mehr">+</button></div>
    ${E.extra ? `<div class="lbl2">${E.extra}</div>
    <div class="step"><button data-ga="px-" aria-label="weniger">−</button><b>${draft.px}</b><button data-ga="px+" aria-label="mehr">+</button></div>` : ''}
    <div class="lbl2">Wie viele Wdh. wären noch gegangen? (RIR)</div>
    <div class="chips">${[0, 1, 2, 3, 4].map(v => chip('data-grir', v, v === 4 ? '4+' : v, draft.rir === v)).join('')}</div>
    <button class="cta" data-ga="addset">Satz ${done.length + 1} speichern</button>
    ${done.length ? `<div class="sets">${done.map((x, i) => `<div class="tl"><div class="tl-t">${i + 1}</div><div class="tl-b">${E.noKg ? '' : fmtKg(x.kg) + ' kg × '}${x.r}${U(E)}${x.px ? ` + ${x.px} Teilwdh.` : ''}<small>RIR ${x.rir >= 4 ? '4+' : x.rir}</small></div>${i === done.length - 1 ? '<button class="undo" data-ga="undoset">Rückgängig</button>' : ''}</div>`).join('')}</div>` : ''}
    <div class="row2"><button class="ghost" data-ga="close">Fertig mit ${E.n}</button></div></div>`;
}

function finishSheet() {
  return `<div class="gym"><h3>Einheit abschließen</h3>
    <p class="mini">Wie anstrengend war die Einheit insgesamt? (geht in die Recovery)</p>
    <div class="chips rpe">${RPE.map((t, i) => `<button class="chip" data-gfin="${i + 1}"><b>${i + 1}</b><small>${t}</small></button>`).join('')}</div>
    <button class="ghost" data-ga="close">Abbrechen</button></div>`;
}

function selSheet(g, t) {
  const ids = Object.keys(EX);
  return `<div class="gym"><h3>Übungen · ${GYM_TYPES[t]}</h3>
    <div class="seg2">${Object.entries(GYM_TYPES).map(([k, v]) => chip('data-gseltab', k, v, k === t)).join('')}</div>
    <div class="chips">${ids.map(id => chip('data-gsel', id, EX[id].n, (g.sel[t] || []).includes(id))).join('')}</div>
    <p class="mini">Oberkörper 1 ist dein Dienstags-Plan. Beine und Oberkörper 2 trage ich ein, sobald sie feststehen.</p>
    <button class="cta" data-ga="close">Fertig</button></div>`;
}
let selTab = 'ober';

function weekSets(g) {
  // harte Sätze (RIR ≤ 3) je Muskelgruppe, letzte 7 Tage
  const from = daysAgo(6), m = {};
  g.sessions.filter(s => s.d >= from).forEach(s => s.sets.forEach(x => { if ((x.rir ?? 2) <= 3) { const k = EX[x.ex] ? EX[x.ex].g : '?'; m[k] = (m[k] || 0) + 1; } }));
  return m;
}

function gymTodayType() {
  try {
    const t = window.Modules.essen && window.Modules.essen._today && window.Modules.essen._today();
    if (t) { if (t.some(x => x.type === 'gymBeine')) return 'beine'; if (t.some(x => x.type === 'gymOber')) return new Date().getDay() === 2 ? 'ober' : null; }
  } catch (e) {}
  return null;
}

function renderGym() {
  const g = gym(), ses = active(g);
  let h = '';
  if (ses) {
    const ids = g.sel[ses.t] || [];
    const extra = [...new Set(ses.sets.map(x => x.ex))].filter(x => !ids.includes(x));
    h += `<div class="panel now"><div class="now-l">Einheit läuft · seit ${hm(ses.start)}</div><div class="now-t">${GYM_TYPES[ses.t]}</div>
      ${[...ids, ...extra].map(id => {
        const s = ses.sets.filter(x => x.ex === id), E = EX[id];
        const T = target(id);
        const sum = s.length ? `${s.length}${T ? '/' + T.sets : ''} ${s.length === 1 && !T ? 'Satz' : 'Sätze'} · ${E.noKg ? '' : fmtKg(s[s.length - 1].kg) + ' kg × '}${s[s.length - 1].r}` : (T ? `${T.sets} × ${T.lo}–${T.hi}${U(E)}` : 'noch offen');
        return `<button class="supp${s.length ? ' on' : ''}" data-gex="${id}"><i></i><span><b>${E.n}</b><small>${sum}</small></span></button>`;
      }).join('')}
      ${ids.length ? '' : '<p class="mini">Für diesen Tag ist noch kein Plan hinterlegt – unten bei „Übungen anpassen“ auswählen.</p>'}
      <button class="cta" data-ga="finish"${ses.sets.length ? '' : ' disabled'}>Einheit abschließen</button>
      <button class="undo" data-ga="cancel">Einheit verwerfen</button></div>`;
  } else {
    const sug = gymTodayType();
    h += `<div class="panel"><h3>Gym-Einheit starten</h3>
      ${sug ? `<p class="mini">Heute laut Plan: ${GYM_TYPES[sug]}</p>` : ''}
      <div class="row2">${Object.entries(GYM_TYPES).map(([k, v]) => `<button class="chip big${k === sug ? ' on' : ''}" data-gstart="${k}">${v}</button>`).join('')}</div></div>`;
  }

  // Kraftentwicklung je Übung: bestes e1RM letzte 14 Tage vs. davor (4 Wochen)
  const rows = [...new Set(Object.values(g.sel).flat())].map(id => {
    const E = EX[id], now = bestIn(g, id, daysAgo(13)), before = bestIn(g, id, daysAgo(41), daysAgo(13)), all = bestIn(g, id);
    if (all == null) return null;
    const val = E.noKg ? `${all}${U(E)}` : `${fmtKg(Math.round(all * 2) / 2)} kg`;
    const d = now != null && before ? Math.round((now / before - 1) * 100) : null;
    return `<div class="tl"><div class="tl-b"><b>${E.n}</b><small>${E.noKg ? 'Bestwert' : 'geschätztes Maximum (1RM)'}</small></div>
      <div class="kv"><b>${val}</b>${d != null ? `<small class="${d > 0 ? 'up' : d < 0 ? 'dn' : ''}">${d > 0 ? '+' : ''}${d} %</small>` : ''}</div></div>`;
  }).filter(Boolean);
  h += `<div class="panel"><h3>Kraftentwicklung</h3>${rows.length ? rows.join('') : '<p class="mini">Sobald du die ersten Sätze einträgst, siehst du hier je Übung dein geschätztes Maximum und die Veränderung zu den Wochen davor.</p>'}</div>`;

  const ws = weekSets(g), keys = Object.keys(ws);
  h += `<div class="panel"><h3>Harte Sätze · letzte 7 Tage</h3>${keys.length ? keys.sort((a, b) => ws[b] - ws[a]).map(k => `
    <div class="bar"><div class="bar-h"><span>${k}</span><b>${ws[k]}</b></div><div class="track"><i class="eat" data-w="${Math.min(100, ws[k] / 20 * 100)}%"></i></div></div>`).join('')
    : '<p class="mini">Zählt Sätze mit höchstens 3 Wdh. Reserve je Muskelgruppe – das ist der Wert, an dem sich Muskelaufbau am besten steuern lässt.</p>'}</div>`;

  h += `<button class="ghost" data-ga="sel" style="width:100%">Übungen anpassen</button>`;
  return h;
}

function clickGym(e) {
  const b = e.target.closest('[data-ga],[data-gex],[data-gstart],[data-grir],[data-gfin],[data-gsel],[data-gseltab]');
  if (!b) return false;
  const g = gym(), ses = active(g), a = b.dataset.ga;
  if (b.dataset.gstart) { g.sessions.push({ d: today(), t: b.dataset.gstart, start: nowMin(), sets: [] }); gymSave(g); Shell.toast('Einheit gestartet'); }
  else if (b.dataset.gex) { draft = null; Shell.sheet(logger(g, b.dataset.gex)); Shell.buzz(); return true; }
  else if (b.dataset.grir != null) { draft.rir = +b.dataset.grir; Shell.sheet(logger(g, draft.ex)); Shell.buzz(); return true; }
  else if (a === 'kg-' || a === 'kg+') { const st = EX[draft.ex].step || 2.5; draft.kg = Math.max(0, draft.kg + (a === 'kg+' ? st : -st)); Shell.sheet(logger(g, draft.ex)); Shell.buzz(); return true; }
  else if (a === 'px-' || a === 'px+') { draft.px = Math.max(0, draft.px + (a === 'px+' ? 1 : -1)); Shell.sheet(logger(g, draft.ex)); Shell.buzz(); return true; }
  else if (a === 'r-' || a === 'r+') { const rs = EX[draft.ex].sec ? 5 : 1; draft.r = Math.max(rs, draft.r + (a === 'r+' ? rs : -rs)); Shell.sheet(logger(g, draft.ex)); Shell.buzz(); return true; }
  else if (a === 'addset' && ses) { ses.sets.push({ ex: draft.ex, kg: draft.kg, r: draft.r, rir: draft.rir, ...(draft.px ? { px: draft.px } : {}) }); gymSave(g); Shell.sheet(logger(g, draft.ex)); Shell.toast('Satz gespeichert'); }
  else if (a === 'undoset' && ses) { for (let i = ses.sets.length - 1; i >= 0; i--) if (ses.sets[i].ex === draft.ex) { ses.sets.splice(i, 1); break; } gymSave(g); Shell.sheet(logger(g, draft.ex)); }
  else if (a === 'close') { draft = null; Shell.closeSheet(); }
  else if (a === 'finish') { Shell.sheet(finishSheet()); Shell.buzz(); return true; }
  else if (b.dataset.gfin && ses) {
    ses.done = true; ses.end = nowMin(); ses.rpe = +b.dataset.gfin; gymSave(g);
    const dur = Math.max(20, Math.min(180, (ses.end - ses.start + 1440) % 1440 || 60));
    addRecSession({ type: ses.t === 'beine' ? 'gymBeine' : 'gymOber', dur, rpe: ses.rpe, ref: 'gym-' + ses.start });
    Shell.closeSheet(); Shell.toast('Einheit gespeichert 💪');
  }
  else if (a === 'cancel' && ses) { g.sessions.splice(g.sessions.indexOf(ses), 1); gymSave(g); Shell.toast('Einheit verworfen'); }
  else if (a === 'sel') { selTab = (ses && ses.t) || 'ober'; Shell.sheet(selSheet(g, selTab)); Shell.buzz(); return true; }
  else if (b.dataset.gseltab) { selTab = b.dataset.gseltab; Shell.sheet(selSheet(g, selTab)); return true; }
  else if (b.dataset.gsel) { const l = g.sel[selTab] = g.sel[selTab] || []; const i = l.indexOf(b.dataset.gsel); if (i >= 0) l.splice(i, 1); else l.push(b.dataset.gsel); gymSave(g); Shell.sheet(selSheet(g, selTab)); }
  else return false;
  Shell.buzz(); Shell.refresh();
  return true;
}

function glanceGym() {
  const g = gym(), ses = active(g);
  if (ses) return { num: ses.sets.length, hint: 'Sätze in laufender Einheit' };
  const n = g.sessions.filter(s => s.done && s.d >= daysAgo(6)).length;
  return { num: n, hint: n === 1 ? 'Gym-Einheit diese Woche' : 'Gym-Einheiten diese Woche' };
}

window.Modules.fortschritt = { render: renderGym, click: clickGym, glance: glanceGym };

// =====================================================================
// RECOVERY
// =====================================================================
// Belastung = Dauer × Anstrengung (Session-RPE nach Foster). Erholung = Morgen-Check + später Uhr/Gurt.
const RPE = ['sehr leicht', 'leicht', 'locker', 'mittel', 'fordernd', 'hart', 'sehr hart', 'sehr hart+', 'extrem', 'maximal'];
const TYPES = { badminton: 'Badminton', turnier: 'Turnier', gymOber: 'Gym Oberkörper', gymBeine: 'Gym Beine', intervalle: 'Intervalle', fahrrad: 'Fahrrad' };
const KIND = { technik: 'Technik / Drills', footwork: 'Footwork / Athletik', spiel: 'Spielformen / Matches', punktspiel: 'Punktspiel / Turnier' };
const FMT = { einzel: 'Einzel', doppel: 'Doppel', mixed: 'Mixed', gemischt: 'Gemischt' };
const PAIN = { schulter: 'Schulter', ellbogen: 'Ellbogen', hand: 'Handgelenk', ruecken: 'Unterer Rücken', leiste: 'Leiste / Adduktoren', knie: 'Knie', sprung: 'Sprunggelenk', achilles: 'Achilles / Wade' };
const WELL = [
  ['schlaf', 'Wie gut hast du geschlafen?', ['mies', 'schlecht', 'okay', 'gut', 'super']],
  ['muede', 'Wie frisch fühlst du dich?', ['platt', 'müde', 'normal', 'frisch', 'top']],
  ['kater', 'Muskelkater?', ['stark', 'deutlich', 'etwas', 'kaum', 'keiner']],
  ['stress', 'Stress (Uni, Alltag)?', ['sehr hoch', 'hoch', 'mittel', 'gering', 'keiner']],
  ['stimmung', 'Stimmung / Lust auf Training?', ['keine', 'wenig', 'okay', 'gut', 'richtig Bock']]
];

const rec = () => load('tf-rec', { days: {} });
const recSave = r => save('tf-rec', r);
const recDay = (r, d) => r.days[d] = r.days[d] || { sess: [] };
function addRecSession(s) {
  const r = rec(), day = recDay(r, today());
  day.sess = day.sess.filter(x => !s.ref || x.ref !== s.ref);
  day.sess.push({ ...s, at: nowMin(), load: s.dur * s.rpe });
  recSave(r);
}
const loadOf = (r, d) => ((r.days[d] || {}).sess || []).reduce((a, s) => a + (s.load || 0), 0);

// Heute geplante/erledigte Einheiten, die vorbei sind und noch keine Bewertung haben
function pending(r) {
  let t = null;
  try { t = window.Modules.essen && window.Modules.essen._today && window.Modules.essen._today(); } catch (e) {}
  if (!t) return [];
  const done = ((r.days[today()] || {}).sess || []).map(s => s.ref);
  const now = nowMin();
  return t.filter(s => !s.flex && s.end != null && s.end <= now && s.type !== 'gymOber' && s.type !== 'gymBeine')
    .map(s => ({ ...s, ref: `${s.type}-${s.start}` })).filter(s => !done.includes(s.ref));
}

let rd = null; // Entwurf der Intensitätsabfrage
const isBad = t => t === 'badminton' || t === 'turnier';
function rateSheet() {
  const bad = isBad(rd.type);
  const durs = rd.type === 'turnier' ? [120, 180, 240, 300, 360, 420] : [45, 60, 75, 90, 120, 150];
  if (!durs.includes(rd.dur)) durs.push(rd.dur), durs.sort((a, b) => a - b);
  return `<div class="rec"><h3>${rd.fixed ? `Wie war ${TYPES[rd.type]}?` : 'Einheit bewerten'}</h3>
    ${rd.fixed ? `<p class="mini">${hm(rd.start)}–${hm(rd.end)}</p>` : `<div class="chips">${Object.entries(TYPES).map(([k, v]) => chip('data-rt', k, v, rd.type === k)).join('')}</div>`}
    ${bad ? `<div class="lbl2">Was stand im Vordergrund?</div>
      <div class="chips">${Object.entries(KIND).map(([k, v]) => chip('data-rk', k, v, rd.kind === k)).join('')}</div>
      <div class="lbl2">Gespielt</div>
      <div class="chips">${Object.entries(FMT).map(([k, v]) => chip('data-rf', k, v, rd.fmt === k)).join('')}</div>
      ${rd.kind === 'punktspiel' || rd.kind === 'spiel' ? `<div class="lbl2">Anzahl Spiele</div>
      <div class="chips">${[1, 2, 3, 4, 5, 6, 8].map(v => chip('data-rm', v, v === 8 ? '7+' : v, rd.matches === v)).join('')}</div>` : ''}` : ''}
    <div class="lbl2">Dauer (Minuten)</div>
    <div class="chips">${durs.map(v => chip('data-rd', v, v, rd.dur === v)).join('')}</div>
    <div class="lbl2">Wie anstrengend war es insgesamt? (1–10)</div>
    <div class="chips rpe">${RPE.map((t, i) => `<button class="chip${rd.rpe === i + 1 ? ' on' : ''}" data-rr="${i + 1}"><b>${i + 1}</b><small>${t}</small></button>`).join('')}</div>
    ${bad ? `<div class="lbl2">Beine am Ende</div>
      <div class="chips">${['frisch', 'okay', 'schwer', 'leer'].map((v, i) => chip('data-rl', i, v, rd.legs === i)).join('')}</div>` : ''}
    <div class="lbl2">Zwickt oder schmerzt etwas?</div>
    <div class="chips">${chip('data-rp', 'none', 'Nichts', rd.pain && !rd.pain.length)}${Object.entries(PAIN).map(([k, v]) => chip('data-rp', k, v, (rd.pain || []).includes(k))).join('')}</div>
    <button class="cta" data-ra="rsave"${rd.rpe ? '' : ' disabled'}>Speichern</button></div>`;
}

function morningPanel(day) {
  const w = day.wellDraft || {};
  return `<div class="panel ask"><div class="ask-q">Morgen-Check</div><p class="mini">Dauert 20 Sekunden. Zusammen mit Schlaf und Puls ergibt das deine Tagesform.</p>
    ${WELL.map(([k, q, opts]) => `<div class="lbl2">${q}</div><div class="chips w5">${opts.map((o, i) => chip('data-rw', `${k}:${i + 1}`, o, w[k] === i + 1)).join('')}</div>`).join('')}
    <div class="lbl2">Beschwerden?</div>
    <div class="chips">${chip('data-rwp', 'none', 'Keine', w.pain && !w.pain.length)}${Object.entries(PAIN).map(([k, v]) => chip('data-rwp', k, v, (w.pain || []).includes(k))).join('')}</div>
    <button class="cta" data-ra="wsave"${WELL.every(([k]) => w[k]) ? '' : ' disabled'}>Speichern</button></div>`;
}
const wellScore = w => WELL.reduce((a, [k]) => a + (w[k] || 0), 0);

function renderRec() {
  const r = rec(), day = r.days[today()] || { sess: [] };
  let h = '<div class="rec">';

  // 1) Intensitätsabfrage nach Einheiten
  const p = pending(r);
  p.forEach(s => {
    h += `<div class="panel ask"><div class="ask-q">Wie hart war ${TYPES[s.type] || s.type}?</div>
      <p class="mini">${hm(s.start)}–${hm(s.end)} · kurz bewerten, damit die Erholung stimmt</p>
      <button class="cta" data-rate="${s.ref}">Jetzt bewerten</button></div>`;
  });

  // 2) Morgen-Check
  if (!day.well && nowMin() >= 300) h += morningPanel(day);
  else if (day.well) {
    const sc = wellScore(day.well);
    h += `<div class="panel"><h3>Tagesform (Gefühl)</h3>
      <div class="bar"><div class="bar-h"><span>Morgen-Check</span><b>${sc} / 25</b></div><div class="track"><i class="eat rc" data-w="${sc / 25 * 100}%"></i></div></div>
      ${day.well.pain && day.well.pain.length ? `<p class="mini warn">Beschwerden: ${day.well.pain.map(k => PAIN[k]).join(', ')}</p>` : ''}
      <button class="undo" data-ra="wredo">Neu ausfüllen</button></div>`;
  }

  // 3) Belastung
  const l7 = [...Array(7)].map((_, i) => loadOf(r, daysAgo(i))).reduce((a, b) => a + b, 0);
  const l28 = [...Array(28)].map((_, i) => loadOf(r, daysAgo(i))).reduce((a, b) => a + b, 0);
  const haveDays = Object.keys(r.days).filter(d => (r.days[d].sess || []).length).length;
  const ratio = l28 ? l7 / (l28 / 4) : null;
  const days7 = [...Array(7)].map((_, i) => daysAgo(6 - i));
  const max = Math.max(1, ...days7.map(d => loadOf(r, d)));
  h += `<div class="panel"><h3>Belastung</h3>
    <div class="kpis"><div><b>${loadOf(r, today())}</b><small>heute</small></div><div><b>${l7}</b><small>7 Tage</small></div>
      <div><b>${ratio != null && haveDays >= 10 ? ratio.toFixed(2).replace('.', ',') : '–'}</b><small>Woche ÷ Ø 4 Wochen</small></div></div>
    <div class="bars7">${days7.map(d => `<div><i style="height:${Math.max(3, loadOf(r, d) / max * 100)}%"></i><small>${new Date(d + 'T12:00').toLocaleDateString('de-DE', { weekday: 'short' }).slice(0, 2)}</small></div>`).join('')}</div>
    <p class="mini">Belastung = Minuten × Anstrengung (1–10). Das Verhältnis wird nach ca. 2 Wochen Daten aussagekräftig.</p>
    ${(day.sess || []).map(s => `<div class="tl"><div class="tl-t">${hm(s.at)}</div><div class="tl-b">${TYPES[s.type] || s.type}${s.kind ? ' · ' + KIND[s.kind] : ''}<small>${s.dur} min · RPE ${s.rpe}${s.fmt ? ' · ' + FMT[s.fmt] : ''}${s.pain && s.pain.length ? ' · ⚠︎ ' + s.pain.map(k => PAIN[k]).join(', ') : ''}</small></div></div>`).join('')}
    <button class="ghost" data-ra="manual" style="width:100%">Einheit nachtragen</button></div>`;

  // 4) Rohwerte von Uhr & Gurt stehen in der Datenzentrale
  h += `<p class="note">Schlaf, HRV, Ruhepuls und Pulsdaten findest du in der Datenzentrale.</p>`;
  return h + '</div>';
}

function clickRec(e) {
  const b = e.target.closest('[data-ra],[data-rate],[data-rt],[data-rk],[data-rf],[data-rm],[data-rd],[data-rr],[data-rl],[data-rp],[data-rw],[data-rwp]');
  if (!b) return false;
  const r = rec(), a = b.dataset.ra, ds = b.dataset;
  const re = () => { Shell.sheet(rateSheet()); Shell.buzz(); return true; };
  if (ds.rate) {
    const s = pending(r).find(x => x.ref === ds.rate); if (!s) return false;
    rd = { fixed: true, ref: s.ref, type: s.type, start: s.start, end: s.end, dur: Math.round((s.end - s.start) / 15) * 15, pain: null };
    return re();
  }
  if (a === 'manual') { rd = { type: 'badminton', dur: 120, pain: null }; return re(); }
  if (ds.rt) { rd.type = ds.rt; rd.dur = { badminton: 120, turnier: 360, gymOber: 75, gymBeine: 75, intervalle: 45, fahrrad: 60 }[rd.type]; return re(); }
  if (ds.rk) { rd.kind = ds.rk; return re(); }
  if (ds.rf) { rd.fmt = ds.rf; return re(); }
  if (ds.rm) { rd.matches = +ds.rm; return re(); }
  if (ds.rd) { rd.dur = +ds.rd; return re(); }
  if (ds.rr) { rd.rpe = +ds.rr; return re(); }
  if (ds.rl != null) { rd.legs = +ds.rl; return re(); }
  if (ds.rp) {
    if (ds.rp === 'none') rd.pain = [];
    else { rd.pain = rd.pain || []; const i = rd.pain.indexOf(ds.rp); if (i >= 0) rd.pain.splice(i, 1); else rd.pain.push(ds.rp); }
    return re();
  }
  if (a === 'rsave' && rd && rd.rpe) {
    const { fixed, start, end, ...s } = rd;
    addRecSession({ ...s, ref: rd.ref || ('man-' + Date.now()), pain: rd.pain || [] });
    rd = null; Shell.closeSheet(); Shell.toast('Gespeichert – danke!');
  }
  else if (ds.rw) {
    const day = recDay(r, today()), [k, v] = ds.rw.split(':');
    day.wellDraft = day.wellDraft || {}; day.wellDraft[k] = +v; recSave(r);
  }
  else if (ds.rwp) {
    const day = recDay(r, today()), w = day.wellDraft = day.wellDraft || {};
    if (ds.rwp === 'none') w.pain = [];
    else { w.pain = w.pain || []; const i = w.pain.indexOf(ds.rwp); if (i >= 0) w.pain.splice(i, 1); else w.pain.push(ds.rwp); }
    recSave(r);
  }
  else if (a === 'wsave') { const day = recDay(r, today()); day.well = { ...day.wellDraft, pain: (day.wellDraft || {}).pain || [], at: nowMin() }; delete day.wellDraft; recSave(r); Shell.toast('Morgen-Check gespeichert'); }
  else if (a === 'wredo') { const day = recDay(r, today()); day.wellDraft = { ...day.well }; delete day.well; recSave(r); }
  else return false;
  Shell.buzz(); Shell.refresh();
  return true;
}

function glanceRec() {
  const r = rec(), day = r.days[today()] || {};
  if (pending(r).length) return { num: '!', hint: 'Einheit bewerten' };
  if (!day.well && nowMin() >= 300) return { num: '?', hint: 'Morgen-Check offen' };
  if (day.well) return { num: wellScore(day.well), hint: 'Tagesform von 25' };
  return { num: '–', hint: 'Erholung & Schlaf' };
}

window.Modules.recovery = { render: renderRec, click: clickRec, glance: glanceRec };

// =====================================================================
// DATEN – Zentrale: Gewicht (selbst eintragen) + alle Messwerte von Uhr & Gurt
// =====================================================================
const body = () => load('tf-body', { w: {} });
const bodySave = b => save('tf-body', b);
const avgW = (b, from, to) => { const v = Object.entries(b.w).filter(([d]) => d >= from && d <= to).map(([, x]) => x); return v.length ? v.reduce((a, c) => a + c, 0) / v.length : null; };
const lastW = b => { const k = Object.keys(b.w).sort(); return k.length ? b.w[k[k.length - 1]] : null; };
let wDraft = null;

function weightChart(b) {
  const days = [...Array(28)].map((_, i) => daysAgo(27 - i));
  const pts = days.map((d, i) => [i, b.w[d]]).filter(p => p[1] != null);
  if (pts.length < 2) return '';
  const avg = days.map((d, i) => { const v = avgW(b, daysAgo(27 - i + 6), d); return v != null ? [i, v] : null; }).filter(Boolean);
  const vals = pts.map(p => p[1]), lo = Math.min(...vals) - .3, hi = Math.max(...vals) + .3;
  const X = i => 6 + i * (288 / 27), Y = v => 82 - (v - lo) / (hi - lo) * 74;
  return `<svg class="wchart" viewBox="0 0 300 90" preserveAspectRatio="none">
    <polyline points="${avg.map(p => X(p[0]) + ',' + Y(p[1])).join(' ')}" fill="none" stroke="var(--acc2)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke"/>
    ${pts.map(p => `<circle cx="${X(p[0])}" cy="${Y(p[1])}" r="2.6" fill="#8d8d93"/>`).join('')}</svg>
    <div class="ax"><span>vor 4 Wochen</span><span>heute</span></div>`;
}

function renderData() {
  const b = body(), r = rec(), t = today(), day = r.days[t] || {};
  if (wDraft == null) wDraft = b.w[t] ?? lastW(b) ?? 75;
  const wk = avgW(b, daysAgo(6), t), prev = avgW(b, daysAgo(13), daysAgo(7));
  const n7 = Object.keys(b.w).filter(d => d >= daysAgo(6)).length;
  const diff = wk != null && prev != null ? wk - prev : null;
  let h = `<div class="panel"><h3>Gewicht</h3>
    <div class="kpis"><div><b>${wk != null ? fmtKg(Math.round(wk * 10) / 10) : '–'}</b><small>Ø 7 Tage (${n7} ${n7 === 1 ? 'Wert' : 'Werte'})</small></div>
      <div><b>${diff != null ? (diff > 0 ? '+' : '') + fmtKg(Math.round(diff * 10) / 10) : '–'}</b><small>kg zur Vorwoche</small></div>
      <div><b>${diff != null && prev ? (diff > 0 ? '+' : '') + (diff / prev * 100).toFixed(1).replace('.', ',') : '–'}</b><small>% · Ziel −0,25 bis −0,5</small></div></div>
    ${weightChart(b)}
    <div class="lbl2">${b.w[t] != null ? 'Heute eingetragen – ändern?' : 'Heute morgens, nüchtern'}</div>
    <div class="step w4"><button data-da="-1">−1</button><button data-da="-0.1">−,1</button><b>${fmtKg(wDraft)}<small> kg</small></b><button data-da="0.1">+,1</button><button data-da="1">+1</button></div>
    <button class="cta rc" data-da="save">${b.w[t] != null ? 'Aktualisieren' : 'Gewicht speichern'}</button></div>`;

  // Auf einen Blick
  const gm = day.garmin || {}, well = day.well;
  const l7 = [...Array(7)].map((_, i) => loadOf(r, daysAgo(i))).reduce((a, c) => a + c, 0);
  const k = (v, lbl) => `<div><b>${v != null ? v : '–'}</b><small>${lbl}</small></div>`;
  h += `<div class="panel"><h3>Heute auf einen Blick</h3><div class="kpis k6">
    ${k(well ? wellScore(well) + '/25' : null, 'Tagesform (Gefühl)')}${k(gm.score, 'Schlafscore')}${k(gm.sleep, 'Schlafdauer')}
    ${k(gm.hrv, 'HRV nachts')}${k(gm.rhr, 'Ruhepuls')}${k(gm.bb, 'Body Battery')}
    ${k(gm.stress, 'Stress Ø')}${k(loadOf(r, t) || null, 'Belastung heute')}${k(l7 || null, 'Belastung 7 Tage')}</div></div>`;

  // Schlaf & Erholung (Uhr) – 7 Tage
  const days7 = [...Array(7)].map((_, i) => daysAgo(6 - i));
  const wd = d => new Date(d + 'T12:00').toLocaleDateString('de-DE', { weekday: 'short' }).slice(0, 2);
  const series = (key, max) => `<div class="bars7">${days7.map(d => { const v = ((r.days[d] || {}).garmin || {})[key]; return `<div><i style="height:${v ? Math.max(4, v / max * 100) : 3}%;${v ? '' : 'opacity:.25'}"></i><small>${wd(d)}</small></div>`; }).join('')}</div>`;
  const anyG = days7.some(d => (r.days[d] || {}).garmin);
  h += `<div class="panel"><h3>Schlaf · 7 Tage</h3>${series('scoreN', 100)}
    <p class="mini">${anyG ? 'Schlafscore je Nacht' : 'Schlafdauer, Schlafscore, Tief- und REM-Schlaf – kommt von der Uhr.'}</p></div>
    <div class="panel"><h3>Erholung · 7 Tage</h3>${series('hrvN', 120)}
    <p class="mini">${anyG ? 'HRV je Nacht – das Band zeigt deinen Normalbereich' : 'HRV mit deinem Normalbereich, Ruhepuls, Body Battery und Stress – kommt von der Uhr.'}</p></div>`;

  // Training (Gurt)
  const hrS = days7.flatMap(d => ((r.days[d] || {}).sess || []).filter(s => s.hr).map(s => ({ ...s, d })));
  h += `<div class="panel"><h3>Training · Brustgurt</h3>${hrS.length ? hrS.map(s => `<div class="tl"><div class="tl-t">${wd(s.d)}</div><div class="tl-b">${TYPES[s.type] || s.type}<small>Ø ${s.hr.avg} / max ${s.hr.max} bpm · Zone 4–5: ${s.hr.z45} min · ${s.hr.kcal} kcal</small></div></div>`).join('')
    : '<p class="mini">Pro Einheit: Ø- und Maximalpuls, Zeit in den Pulszonen, kcal und Puls-Erholung – kommt vom Polar H10.</p>'}</div>`;

  // Verbrauch
  h += `<div class="panel"><h3>Verbrauch</h3>
    <p class="mini">Hier steht nach 2–3 Wochen dein echter Tagesverbrauch – errechnet aus dem, was du gegessen hast, und deinem Gewichtstrend. Danach passe ich die kcal im Ernährungsplan an (kleines Defizit, an Badminton-Tagen volle Energie).</p></div>`;
  return h;
}

function clickData(e) {
  const btn = e.target.closest('[data-da]');
  if (!btn) return false;
  const v = btn.dataset.da;
  if (v === 'save') { const b = body(); b.w[today()] = Math.round(wDraft * 10) / 10; bodySave(b); wDraft = null; Shell.toast('Gewicht gespeichert'); }
  else wDraft = Math.max(30, Math.round((wDraft + parseFloat(v)) * 10) / 10);
  Shell.buzz(); Shell.refresh();
  return true;
}

function glanceData() {
  const r = rec(), day = r.days[today()] || {};
  const g = glanceRec();
  let ring = null, num = '–';
  if (day.well) { ring = wellScore(day.well) / 25; num = Math.round(ring * 100); }
  const b = body(), wk = avgW(b, daysAgo(6), today());
  const hint = b.w[today()] == null && nowMin() < 720 ? 'Gewicht heute noch eintragen' : (wk != null ? `Ø ${fmtKg(Math.round(wk * 10) / 10)} kg · 7 Tage` : g.hint === 'Einheit bewerten' ? 'Einheit bewerten' : 'Schlaf, Stress, Belastung, Gewicht');
  return { num, hint, ring };
}

window.Modules.daten = { render: renderData, click: clickData, glance: glanceData };
})();
