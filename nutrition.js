// Ernährung: Vorschlag der nächsten Mahlzeit nach Uhrzeit, Training, Schlaf und Makros.
// Grundlage: Toms Wochen-Ernährungsplan (Google Drive). Alles wird per Antippen eingetragen.
window.Modules = window.Modules || {};
(function () {
'use strict';

// ---------- Einstellungen ----------
const SLEEP = 23 * 60 + 30;      // Schlafenszeit
const CREATINE = 7 * 60 + 30;    // Kreatin-Erinnerung
const PRE_BIG = 180;             // große Mahlzeit frühestens 3 h vor Training
const PRE_LIGHT = 90;            // leichte Mahlzeit bis 90 min vor Training
const LATE_CAP = 1000;           // max. kcal pro Mahlzeit in den letzten 2,5 h vor dem Schlafen

// ---------- Lebensmittel (pro 100 g: kcal, Protein, KH, Fett) ----------
const FOOD = {
  hafer: { n: 'Haferflocken', m: [370, 13.5, 58.7, 7] },
  skyr: { n: 'Skyr', m: [63, 11, 4, 0.2] },
  whey: { n: 'Whey Protein', m: [380, 78, 6, 5] },
  apfel: { n: 'Apfel', m: [52, 0.3, 12, 0.2], u: 150, un: ['Apfel', 'Äpfel'] },
  apfel200: { n: 'Apfel', m: [52, 0.3, 12, 0.2], u: 200, un: ['Apfel (ca. 200 g)', 'Äpfel'] },
  beeren: { n: 'Beeren', m: [45, 1, 9, 0.4] },
  schoko: { n: 'Bitterschokolade 70 %', m: [580, 8, 34, 42] },
  zimt: { n: 'Zimt', m: [0, 0, 0, 0], free: true },
  reis: { n: 'Basmatireis (trocken)', m: [350, 8, 77, 0.6] },
  nudeln: { n: 'Nudeln (trocken)', m: [355, 12.5, 70, 1.5] },
  haehnchen: { n: 'Hähnchenbrust', m: [110, 23.5, 0, 1.2] },
  hack: { n: 'Rinderhack 5 %', m: [125, 21, 0, 5] },
  lachs: { n: 'Lachs (ohne Öl)', m: [200, 20, 0, 13] },
  oel: { n: 'Olivenöl', m: [884, 0, 0, 100] },
  gemuese: { n: 'Gemüse (z. B. Brokkoli, Paprika, Zucchini)', m: [28, 2, 4, 0.3] },
  maiswaffel: { n: 'Maiswaffeln', m: [385, 8, 80, 3], u: 8, un: ['Maiswaffel', 'Maiswaffeln'] },
  honig: { n: 'Honig', m: [304, 0.3, 80, 0] },
  banane: { n: 'Banane', m: [93, 1.1, 20, 0.3], u: 120, un: ['Banane', 'Bananen'] },
  quark: { n: 'Magerquark (mit etwas Wasser glattgerührt)', m: [67, 12, 4, 0.3] },
  skyrA: { n: 'Skyr', m: [63, 11, 4, 0.2] },
  frischkaese: { n: 'Körniger Frischkäse', m: [98, 12.5, 2.5, 4.3] },
  toast: { n: 'Toast', m: [265, 8, 48, 3.5], u: 25, un: ['Scheibe Toast', 'Scheiben Toast'] },
  mehrkorn: { n: 'Mehrkornbrot', m: [245, 8.5, 41, 4], u: 45, un: ['Scheibe Mehrkornbrot', 'Scheiben Mehrkornbrot'] },
  reiswaffel: { n: 'Reiswaffeln', m: [385, 8, 81, 3] },
  ei: { n: 'Eier', m: [143, 12.6, 0.7, 9.5], u: 60, un: ['Ei', 'Eier'] },
  vollkorn: { n: 'Vollkornbrot', m: [220, 7, 40, 2], u: 50, un: ['Scheibe Vollkornbrot', 'Scheiben Vollkornbrot'] },
  rohkost: { n: 'Rohkost / Tomaten', m: [20, 1, 3, 0.2] },
  datteln: { n: 'Datteln', m: [280, 2, 63, 0.4] },
  griess: { n: 'Grießbrei / Reispudding', m: [105, 3.5, 17, 2.5] },
  mandeln: { n: 'Mandeln / Nüsse', m: [600, 21, 7, 52] },
  kaese: { n: 'Käse', m: [360, 24, 0, 29], u: 25, un: ['Scheibe Käse', 'Scheiben Käse'] },
  muesli: { n: 'Müsli (ungezuckert)', m: [360, 10, 60, 6] },
  milch: { n: 'Milch 1,5 %', m: [47, 3.4, 4.8, 1.5] },
  fruechte: { n: 'Obst (z. B. Banane, Apfel, Beeren, Kiwi)', m: [60, 0.8, 13, 0.3] },
  griess: { n: 'Grießbrei / Milchreis (fertig zubereitet)', m: [105, 3.5, 18, 2] }
};

// ---------- Tagesarten aus dem Plan ----------
const TPL = {
  badminton2: { kcal: 3150, name: 'Badminton-Tag (2 h)', C: [390, 410], P: 165, F: [65, 75], lunch: 170, snack: 'pre', dinner: 'quark' },
  radBad: { kcal: 3350, name: 'Fahrrad + Badminton', C: [430, 450], P: 165, F: [65, 75], lunch: 170, snack: 'pre', dinner: 'quark' },
  badminton15: { kcal: 3050, name: 'Badminton-Tag (1,5 h)', C: [370, 390], P: 165, F: [65, 75], lunch: 170, snack: 'pre', dinner: 'quark' },
  turnier: { kcal: 3350, name: 'Turniertag', C: [430, 450], P: 165, F: [65, 75], lunch: 170, snack: 'pre', dinner: 'quark', note: 'Nicht im Plan, Werte wie am Mittwoch (höchster Bedarf).' },
  gymBeine: { kcal: 3100, name: 'Gym Beine', C: [380, 400], P: 165, F: [65, 75], lunch: 170, snack: 'split', dinner: 'eier' },
  gymPush: { kcal: 2850, name: 'Gym Oberkörper', C: [310, 330], P: 165, F: [70, 80], lunch: 115, snack: 'bh', dinner: 'eier' },
  intervalle: { kcal: 2900, name: 'Intervalle / Gym', C: [320, 340], P: 165, F: [70, 80], lunch: 115, snack: 'bh', dinner: 'eier' },
  rest: { kcal: 2700, name: 'Ruhetag', C: [260, 280], P: 165, F: [70, 80], lunch: 115, snack: null, dinner: 'eier' }
};
const TT = {
  badminton: 'Badminton', gymOber: 'Gym Oberkörper', gymBeine: 'Gym Beine',
  intervalle: 'Intervalle 15:15', laufen: 'Laufen', fahrrad: 'Fahrrad Zone 2', turnier: 'Turnier'
};
const TT_DUR = { badminton: 120, gymOber: 75, gymBeine: 75, intervalle: 45, laufen: 60, fahrrad: 60, turnier: 360 };
// Was laut Plan an welchem Wochentag dran ist (0 = Sonntag)
const WEEK = [
  { type: 'intervalle' }, { type: 'badminton', dur: 120 }, { type: 'gymOber' },
  { type: 'badminton', dur: 120, rad: true }, { type: 'gymBeine' }, { type: 'badminton', dur: 90 }, { type: 'intervalle' }
];

// ---------- Hilfen ----------
const pad = n => String(n).padStart(2, '0');
const hm = t => pad(Math.floor(((t % 1440) + 1440) % 1440 / 60)) + ':' + pad(Math.round(t) % 60);
const toMin = s => { const [h, m] = s.split(':').map(Number); return h * 60 + m; };
const dkey = d => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
const nowMin = () => { const d = new Date(); return d.getHours() * 60 + d.getMinutes(); };
const dur = m => { const h = Math.floor(m / 60), r = m % 60; return h ? (r ? `${h} h ${r} min` : `${h} h`) : `${r} min`; };
const grams = it => it.n != null ? it.n * FOOD[it.f].u : it.g;
const mac = it => FOOD[it.f].m.map(v => v * grams(it) / 100);
const add = (a, b, k = 1) => a.map((v, i) => v + b[i] * k);
const sumItems = items => items.reduce((s, it) => add(s, mac(it)), [0, 0, 0, 0]);
const label = it => {
  const F = FOOD[it.f];
  if (F.free) return F.n;
  if (it.n != null) return `${it.n} ${it.n === 1 ? F.un[0] : F.un[1]}`;
  return `${Math.round(it.g)} g ${F.n}`;
};
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

// ---------- Speicher ----------
const load = (k, d) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } };
const save = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };
const dayState = () => {
  const k = 'tf-day-' + dkey(new Date());
  const st = load(k, null) || { sess: null, log: {}, asked: {}, supps: {}, choice: {} };
  st._k = k; return st;
};
const store = st => { const { _k, ...rest } = st; save(_k, rest); };

// Trainings aus dem Kalender (schedule.json, wird von Claude aus Google Kalender geschrieben)
let SCHEDULE = load('tf-schedule', { days: {} });
fetch('schedule.json', { cache: 'no-store' }).then(r => r.ok ? r.json() : null).then(j => {
  if (j && j.days) { SCHEDULE = j; save('tf-schedule', j); window.Shell && Shell.refresh(); }
}).catch(() => {});

// Wochenplan (Teil A) gilt im Zeitraum from–until, Einzeltermine (Teil B / Google) ergänzen
const inPlan = k => SCHEDULE.week && (!SCHEDULE.from || k >= SCHEDULE.from) && (!SCHEDULE.until || k <= SCHEDULE.until);
// Blöcke, in denen Tom unterwegs ist und nicht essen kann (Arbeit, Uni, inkl. Fahrzeit)
function busyToday() {
  const k = dkey(new Date()), out = [];
  if (!((SCHEDULE.days || {})[k] || []).some(x => x.type === 'turnier')) {
    const wk = inPlan(k) && SCHEDULE.week[new Date().getDay()];
    if (wk && wk.busy) out.push(...wk.busy);
  }
  out.push(...((SCHEDULE.busy || {})[k] || []));
  return out.map(b => ({ start: toMin(b.start), end: toMin(b.end), title: b.title })).sort((a, b) => a.start - b.start);
}
// Gym und Intervalle sind zeitlich flexibel, Badminton ist fest, Fahrrad optional.
const FLEX = ['gymOber', 'gymBeine', 'intervalle'];
function rawSessions(st) {
  if (st.sess) return st.sess;
  const k = dkey(new Date());
  const conv = x => ({ type: x.type, start: toMin(x.start), end: toMin(x.end), title: x.title, travel: x.travel || 0, src: 'cal' });
  const cal = (SCHEDULE.days || {})[k];
  if (cal && cal.length) return cal.map(conv);
  const wk = inPlan(k) && SCHEDULE.week[new Date().getDay()];
  if (wk) return wk.sess.map(conv);
  const def = WEEK[new Date().getDay()];
  if (FLEX.includes(def.type)) return [{ type: def.type, flex: true, auto: true }];
  return null; // Badminton-Tag ohne Zeit → fragen
}
// Flexibles Training: ideal 3 h nach dem Mittagessen, nie in der Vergangenheit
function flexStart(st, now) {
  const l = st.log.mi;
  const lunch = l && l.st !== 'notyet' && l.st !== 'skip' ? l.at : Math.max(750, now);
  const t = Math.max(lunch + PRE_BIG, now);
  return Math.ceil(t / 15) * 15;
}
function sessionsToday(st, now = nowMin()) {
  let base = rawSessions(st);
  if (!base) return null;
  base = base.slice();
  if (st.rad && st.rad.done && !base.some(x => x.type === 'fahrrad')) base.push({ type: 'fahrrad', start: st.rad.start, end: st.rad.end });
  return base.map(x => {
    if (!x.flex) return x;
    const start = flexStart(st, now);
    return { ...x, start, end: start + TT_DUR[x.type] };
  });
}
function tplFor(sess) {
  if (!sess.length) return 'rest';
  const d = s => s.end - s.start;
  const bad = sess.filter(s => s.type === 'badminton' || s.type === 'turnier');
  if (sess.some(s => s.type === 'turnier' || (s.type === 'badminton' && d(s) >= 240))) return 'turnier';
  if (bad.length && sess.some(s => s.type === 'fahrrad')) return 'radBad';
  if (bad.length) return Math.max(...bad.map(d)) >= 105 ? 'badminton2' : 'badminton15';
  if (sess.some(s => s.type === 'gymBeine')) return 'gymBeine';
  if (sess.some(s => s.type === 'gymOber')) return 'gymPush';
  return 'intervalle';
}
function mainSess(sess) {
  const pri = s => (s.type === 'badminton' || s.type === 'turnier' ? 1000 : s.type === 'gymOber' || s.type === 'gymBeine' ? 500 : 0) + (s.end - s.start);
  return sess.filter(s => s.type !== 'fahrrad').sort((a, b) => pri(b) - pri(a))[0] || sess[0] || null;
}

// ---------- Tagesablauf ----------
function buildDay(st, now) {
  const sess = sessionsToday(st, now);
  if (!sess) return { unknown: true };
  const T = tplFor(sess), tpl = TPL[T], main = mainSess(sess);
  const s = main ? main.start - (main.travel || 0) : null, e = main ? main.end + (main.travel || 0) : null;
  const busy = busyToday();
  const post = main && main.travel ? 10 : 30; // nach Fahrt zu Hause direkt essen
  // Zeit aus Arbeit/Uni-Blöcken herausschieben (an deren Ende)
  const free = t => { for (const b of busy) if (t >= b.start && t < b.end) t = b.end; return t; };
  const isBad = x => x.type === 'badminton' || x.type === 'turnier';
  const late = sess.filter(x => isBad(x) && x.end >= 18 * 60);
  const lateEnd = late.length ? Math.min(...late.map(x => x.end)) : null;
  const done = id => st.log[id] && st.log[id].st !== 'notyet';
  const ctx = {
    T, tpl, sess, main, now,
    fatOK: t => !sess.some(x => t > x.start - PRE_BIG && t < x.end) && !(lateEnd != null && t >= lateEnd) && t <= SLEEP - 120,
    carbOK: t => t <= SLEEP - 45
  };

  let slots = [];
  let frT = s != null && s < 630 ? Math.max(390, s - 150) : 450;
  const morning = sess.find(x => x !== main && x.start <= frT + 30 && x.end > frT - 30 && x.start < 600);
  if (morning) frT = morning.end + 15;
  const b0 = busy.find(b => frT >= b.start && frT < b.end);
  if (b0 && b0.start - 15 >= 360) frT = b0.start - 15;
  slots.push({ id: 'fr', name: 'Frühstück', t: frT, kind: 'fr' });
  const rad = sess.find(x => x.type === 'fahrrad');
  if (rad) slots.push({ id: 'rad', name: 'Nach dem Radfahren', t: rad.end + 15, kind: 'rad' });

  let lt = 750, after = false;
  if (main) { if (s - PRE_BIG >= 630) lt = Math.min(750, s - PRE_BIG); else { lt = e + post; after = true; } }
  const mi = { id: 'mi', name: 'Mittagessen', t: lt, kind: 'mi', after };
  slots.push(mi);

  // Zwischenmahlzeit, damit Fett/Kalorien voll werden (nur wenn genug Abstand zum Training)
  if (!main) slots.push({ id: 'zw', name: 'Zwischenmahlzeit', t: 960, kind: 'zw' });
  else if (!after && s - PRE_BIG - lt >= 120) slots.push({ id: 'zw', name: 'Zwischenmahlzeit', t: Math.min(lt + 180, s - PRE_BIG), kind: 'zw' });

  if (main && tpl.snack) {
    const pre = tpl.snack === 'pre';
    slots.push({ id: 'sn', name: pre ? 'Pre-Workout' : 'Rund ums Training', t: s - (pre ? 75 : 45), kind: 'sn', snack: tpl.snack });
  }
  if (main && main.end - main.start >= 180) {
    let i = 1;
    for (let t = main.start + 120; t <= main.end - 60; t += 150, i++) slots.push({ id: 'wa' + i, name: 'Während des Trainings', t, kind: 'wa' });
  }
  let dt = !main ? 19 * 60 : after ? Math.max(lt + 180, 19 * 60) : Math.max(e + (lateEnd ? 30 : 45), 18 * 60 + 30);
  const ab = { id: 'ab', name: 'Abendessen', t: Math.min(dt, SLEEP - 60), kind: 'ab', variant: tpl.dinner };
  if (lateEnd && !after) ab.name = 'Abendessen (nach der Halle, fettarm)';
  slots.push(ab);

  slots.forEach(x => { x.t0 = x.t; });
  const fr = slots.find(x => x.id === 'fr');
  const eatenAt = id => done(id) ? (st.log[id].at || now) : null;

  // ---- Feste Regeln: Reihenfolge Porridge → warme Mahlzeit (Mittagessen) → Abendessen zum Auffüllen ----
  // Vorgeschlagen wird immer die nächste noch offene Mahlzeit, egal wie spät es ist. Die Uhrzeit verschiebt nur.
  // 1) Porridge offen → er ist jetzt dran, alles andere rückt nach hinten
  if (!done('fr')) fr.t = Math.min(fr.t0, now);
  const frEnd = done('fr') ? eatenAt('fr') : Math.max(fr.t, now);
  if (!done('mi') && !mi.after) mi.t = Math.max(mi.t0, frEnd + 150);
  if (!done('mi') && !mi.after) { const f = free(mi.t); if (f !== mi.t) { mi.t = f; mi.busyShift = true; } }

  // 2) Ausnahme Training: ≤ 2 h bis zum Training und Mittagessen offen → leicht vorher, warme Mahlzeit danach
  const PRE_SWAP = 120;
  const swapNow = main && !main.flex && !after && !done('mi') && done('fr') && now >= s - PRE_SWAP && now < e;
  const missedBefore = main && !main.flex && !after && !done('mi') && mi.t >= s - PRE_SWAP && now < s;
  if (swapNow || missedBefore) {
    mi.t = e + post; mi.after = true; mi.swapped = true;
    mi.name = 'Warme Mahlzeit nach dem Training';
    if (!done('ab')) {
      if (now <= s - PRE_LIGHT || !swapNow) { ab.t = swapNow ? now : free(Math.max(frEnd + 120, s - 120)); ab.variant = 'quark'; ab.light = true; ab.name = 'Leichte Mahlzeit vor dem Training'; }
      else ab.merged = true;
    }
  }
  // Training vorbei und Mittagessen noch offen → warme Mahlzeit jetzt, Abendessen nur noch, wenn Zeit bleibt
  if (main && now >= e && !done('mi')) { mi.t = Math.max(Math.min(mi.t, now), e + 15); mi.after = true; if (!mi.swapped) mi.name = 'Warme Mahlzeit nach dem Training'; }

  // 2b) Zu spät für die warme Mahlzeit (z. B. Arbeit bis abends, Training danach): statt Reis/Fleisch/Gemüse
  //     ein leicht verdauliches spätes Essen, das Kalorien und Makros trotzdem füllt
  if (!done('mi') && Math.max(mi.t, now) >= SLEEP - 150) {
    mi.late = true; mi.noFat = true;
    mi.name = 'Spätes Essen – leicht verdaulich';
  }
  // 3) Mittagessen gibt es jeden Tag: solange offen, kommt das Abendessen erst danach
  if (!done('mi') && !ab.light && !done('ab')) {
    const miAt = Math.max(mi.t, now);
    if (miAt >= SLEEP - 150) { ab.merged = true; mi.mergedDinner = true; }
    else ab.t = Math.max(ab.t, miAt + 150);
  }
  // Zwischenmahlzeit nur zwischen Mittag und Abend, sonst weglassen
  slots.forEach(x => {
    if (x.kind !== 'zw' || done(x.id)) return;
    const miAt = done('mi') ? eatenAt('mi') : Math.max(mi.t, now);
    x.t = Math.max(x.t0, miAt + 120);
    if ((main && x.t > s - PRE_BIG && x.t < e) || x.t > ab.t - 60) x.merged = true;
    // verpasst: ab Trainingsbeginn oder 90 min nach geplanter Zeit nicht mehr vorschlagen
    if ((main && now >= s - 60) || now > x.t + 90) x.merged = true;
  });
  // Vorher-Snacks, die bis zum Trainingsende nicht gegessen wurden, streichen
  slots.forEach(x => { if (((x.kind === 'sn' && x.snack === 'pre') || x.kind === 'wa') && main && now >= e && !done(x.id)) x.merged = true; });
  // Snack „vor oder direkt nach“ dem Gym: rutscht notfalls direkt hinter das Training
  slots.forEach(x => { if (x.kind === 'sn' && x.snack !== 'pre' && !done(x.id)) x.t = now < s ? Math.max(x.t, now) : now < e ? e : now; });
  // Pre-Workout-Snack erst, wenn Porridge gegessen ist
  slots.forEach(x => { if (x.kind === 'sn' && !done('fr') && !done(x.id)) x.t = Math.max(x.t, frEnd + 60); });
  // Leichte Mahlzeit vor dem Training ersetzt den Pre-Workout-Snack, wenn beide kurz hintereinander lägen
  slots.forEach(x => { if (x.kind === 'sn' && x.snack === 'pre' && ab.light && !done(x.id) && Math.abs(x.t - ab.t) < 75) x.merged = true; });
  // Nichts in Arbeit/Uni-Zeiten legen (außer es ist gerade jetzt dran)
  slots.forEach(x => { if ((x.kind === 'zw' || x.kind === 'ab') && !done(x.id) && !x.merged && x.t > now) x.t = free(x.t); });
  // Abendessen immer als letzte Mahlzeit des Tages
  if (!done('ab') && !ab.light && !ab.merged) ab.t = Math.max(ab.t, ...slots.filter(x => x !== ab && !x.merged && !done(x.id)).map(x => x.t + 60));
  if (mi.after && lateEnd != null && mi.t >= lateEnd) mi.noFat = true;
  if (ab.light === undefined && lateEnd != null && ab.t >= lateEnd) ab.noFat = true;

  slots = slots.filter(x => !x.merged).sort((a, b) => a.t - b.t);
  slots.forEach(x => { x.t = Math.min(x.t, SLEEP - 30); });
  return { slots, ctx, T, tpl, sess, main, busy };
}

// ---------- Zusammensetzung einer Mahlzeit ----------
function compose(slot, day, ch) {
  const { tpl } = day;
  switch (slot.kind) {
    case 'fr': return [{ f: 'hafer', g: 120 }, { f: 'skyr', g: 200 }, { f: 'whey', g: 30 }, { f: 'apfel200', n: 1 }, { f: 'beeren', g: 150 }, { f: 'schoko', g: 20 }, { f: 'zimt', g: 0 }];
    case 'mi': {
      if (slot.late) {
        const v = ch.late_v || 'quark';
        if (v === 'griess') return [{ f: 'griess', g: 400, sc: { min: 250, max: 600, step: 50 } }, { f: 'whey', g: 30 }, { f: 'banane', n: 1 }];
        if (v === 'toast') return [{ f: 'toast', n: 4, sc: { min: 2, max: 6, step: 1 } }, { f: 'honig', g: 20 }, { f: 'whey', g: 40 }, { f: 'milch', g: 300 }];
        if (v === 'reis') return [{ f: 'reis', g: 100, sc: { min: 60, max: 150, step: 10 } }, { f: 'haehnchen', g: 150 }];
        return [{ f: 'quark', g: 400 }, { f: 'hafer', g: 60, sc: { min: 30, max: 100, step: 10 } }, { f: 'banane', n: 1 }, { f: 'honig', g: 20 }];
      }
      let p = ch.mi_p || 'haehnchen';
      if (slot.noFat && p === 'lachs') p = 'haehnchen';
      const items = [{ f: ch.mi_c || 'reis', g: tpl.lunch, sc: { min: tpl.lunch - 50, max: Math.max(tpl.lunch + 50, 210), step: 10 } }, { f: p, g: 200 }, { f: 'gemuese', g: 300 }];
      if (p !== 'lachs' && !slot.noFat) items.push({ f: 'oel', g: 5 });
      return items;
    }
    case 'zw': {
      const v = ch.zw_v || 'apfel';
      if (v === 'banane') return [{ f: 'banane', n: 1 }];
      if (v === 'skyr') return [{ f: 'skyrA', g: 200 }, { f: 'beeren', g: 100 }];
      if (v === 'shake') return [{ f: 'whey', g: 30 }, { f: 'milch', g: 250 }];
      if (v === 'muesli') return [{ f: 'skyrA', g: 150 }, { f: 'muesli', g: 40 }];
      return [{ f: 'apfel', n: 1 }];
    }
    case 'sn': {
      const v = ch.sn_v || (slot.snack === 'bh' ? 'bh' : 'mw');
      if (v === 'bh') return [{ f: 'banane', n: 1 }, { f: 'honig', g: 15 }];
      if (v === 'toast') return [{ f: 'toast', n: 3, sc: { min: 2, max: 4, step: 1 } }, { f: 'honig', g: 20 }, { f: 'banane', n: 1 }];
      if (v === 'datteln') return [{ f: 'datteln', g: 50, sc: { min: 30, max: 80, step: 10 } }, { f: 'banane', n: 1 }];
      if (v === 'fruechte') return [{ f: 'fruechte', g: 250, sc: { min: 150, max: 400, step: 50 } }];
      return [{ f: 'maiswaffel', n: 5, sc: { min: 3, max: 7, step: 1 } }, { f: 'honig', g: 20 }, { f: 'banane', n: 1 }];
    }
    case 'wa': return (ch[slot.id] || 'mw') === 'da' ? [{ f: 'datteln', g: 40 }] : [{ f: 'maiswaffel', n: 3 }, { f: 'banane', n: 1 }];
    case 'rad': return (ch.rad || 'da') === 'gr' ? [{ f: 'griess', g: 100 }] : [{ f: 'datteln', g: 50 }];
    case 'ab': {
      if (slot.variant === 'muesli') return [{ f: 'skyrA', g: 250 }, { f: 'muesli', g: 60, sc: { min: 30, max: 100, step: 10 } }, { f: 'beeren', g: 100 }];
      if (slot.variant === 'fruechte') return [{ f: 'skyrA', g: 300 }, { f: 'fruechte', g: 250, sc: { min: 150, max: 400, step: 50 } }];
      if (slot.variant === 'shake') return [{ f: 'whey', g: 40 }, { f: 'milch', g: 300, sc: { min: 200, max: 500, step: 100 } }, { f: 'banane', n: 1, sc: { min: 1, max: 2, step: 1 } }, { f: 'hafer', g: 40, sc: { min: 20, max: 80, step: 20 } }];
      if (slot.variant === 'eier') return [{ f: 'ei', n: 3, sc: { min: 3, max: 4, step: 1 }, fatScale: true }, { f: 'vollkorn', n: 2, sc: { min: 2, max: 4, step: 1 } }, { f: 'rohkost', g: 100 }];
      const p = ch.ab_p || 'quark', c = ch.ab_c || 'toast';
      const items = [p === 'frischkaese' ? { f: 'frischkaese', g: 200 } : { f: p, g: 250 }];
      if (c === 'reiswaffel') items.push({ f: 'reiswaffel', g: 50, sc: { min: 30, max: 80, step: 10 } });
      else items.push({ f: c, n: c === 'toast' ? 3 : 2, sc: { min: 2, max: 4, step: 1 } });
      return items;
    }
  }
  return [];
}
// Abendessen / leichte Mahlzeit: Variante wählbar (Eier nur, wo Fett erlaubt ist)
const AB_VARS = [['eier', 'Eier + Brot'], ['quark', 'Quark/Skyr + Brot'], ['muesli', 'Skyr + Müsli'], ['fruechte', 'Skyr + Obst'], ['shake', 'Protein-Shake']];
function applyAbVariant(x, ch) {
  const v = ch.ab_v;
  if (!v) return;
  if (v === 'eier' && (x.light || x.noFat)) return;
  x.variant = v;
}
function optionsFor(slot, ch) {
  if (slot.kind === 'mi' && slot.late) return [{ key: 'late_v', label: 'Was gibt es?', val: ch.late_v || 'quark', opts: [['quark', 'Quark + Haferflocken + Banane'], ['griess', 'Grießbrei/Milchreis + Shake'], ['toast', 'Toast + Honig + Shake'], ['reis', 'Reis + Hähnchen (ohne Öl, ohne Gemüse)']] }];
  if (slot.kind === 'mi') return [
    { key: 'mi_c', label: 'Kohlenhydrate', val: ch.mi_c || 'reis', opts: [['reis', 'Reis'], ['nudeln', 'Nudeln']] },
    { key: 'mi_p', label: 'Protein', val: ch.mi_p || 'haehnchen', opts: [['haehnchen', 'Hähnchen'], ['hack', 'Rinderhack'], ...(slot.noFat ? [] : [['lachs', 'Lachs']])] }
  ];
  if (slot.kind === 'zw') return [{ key: 'zw_v', label: 'Was gibt es?', val: ch.zw_v || 'apfel', opts: [['apfel', 'Apfel'], ['banane', 'Banane'], ['skyr', 'Skyr + Beeren'], ['muesli', 'Skyr + Müsli'], ['shake', 'Protein-Shake']] }];
  if (slot.kind === 'sn') return [{ key: 'sn_v', label: 'Was gibt es?', val: ch.sn_v || (slot.snack === 'bh' ? 'bh' : 'mw'), opts: [['mw', 'Maiswaffeln + Honig + Banane'], ['toast', 'Toast + Honig + Banane'], ['datteln', 'Datteln + Banane'], ['bh', 'Banane + Honig'], ['fruechte', 'Obst']] }];
  if (slot.kind === 'ab') {
    const vars = AB_VARS.filter(([v]) => v !== 'eier' || !(slot.light || slot.noFat));
    const rows = [{ key: 'ab_v', label: 'Variante', val: slot.variant, opts: vars }];
    if (slot.variant === 'quark') rows.push(
      { key: 'ab_p', label: 'Protein', val: ch.ab_p || 'quark', opts: [['quark', 'Magerquark'], ['skyrA', 'Skyr'], ['frischkaese', 'Körniger Frischkäse']] },
      { key: 'ab_c', label: 'Beilage', val: ch.ab_c || 'toast', opts: [['toast', 'Toast'], ['mehrkorn', 'Mehrkornbrot'], ['reiswaffel', 'Reiswaffeln']] });
    return rows;
  }
  if (slot.kind === 'wa') return [{ key: slot.id, label: 'Snack', val: ch[slot.id] || 'mw', opts: [['mw', 'Maiswaffeln + Banane'], ['da', 'Datteln']] }];
  if (slot.kind === 'rad') return [{ key: 'rad', label: 'Snack', val: ch.rad || 'da', opts: [['da', 'Datteln'], ['gr', 'Grießbrei']] }];
  return [];
}

// ---------- Makros auffüllen ----------
function plan(st, now) {
  const day = buildDay(st, now);
  if (day.unknown) return day;
  const { tpl, ctx } = day;
  let eaten = [0, 0, 0, 0];
  Object.values(st.log).forEach(l => { if (l.m && l.st !== 'notyet') eaten = add(eaten, l.m, l.st === 'half' ? 0.5 : l.st === 'skip' ? 0 : 1); });
  (st.extra || []).forEach(x => { eaten = add(eaten, x.m, 1); });
  const rem = day.slots.filter(x => !st.log[x.id] || st.log[x.id].st === 'notyet');
  rem.forEach(x => { if (x.kind === 'ab') applyAbVariant(x, st.choice); x.items = compose(x, day, st.choice); x.te = Math.max(x.t, now); });
  rem.forEach(x => { if (x.mergedDinner && (tpl.P - total0(eaten, rem)[1]) > 25) x.items.push({ f: 'quark', g: 250, fill: 'p' }); });
  const total = () => rem.reduce((s, x) => add(s, sumItems(x.items)), eaten);
  function total0(e0, r) { return r.reduce((s, x) => add(s, sumItems(x.items)), e0); }
  const Cmid = (tpl.C[0] + tpl.C[1]) / 2, Fmid = (tpl.F[0] + tpl.F[1]) / 2;
  const isCarbFill = it => it.fill === 'c';

  // Eiweiß: Tagesziel ist eine Untergrenze. Fehlt etwas, erst die Eiweißquellen der restlichen Mahlzeiten vergrößern,
  // dann einen Eiweiß-Auffüller dazu (Quark/Skyr abends, sonst Whey). So steht das ganze Eiweiß schon im Vorschlag.
  const PSTEP = { quark: 50, skyrA: 50, frischkaese: 50, haehnchen: 25, hack: 25, lachs: 25, whey: 10 };
  const PCAP = { quark: 500, skyrA: 500, frischkaese: 400, haehnchen: 300, hack: 300, lachs: 250, whey: 60 };
  for (let i = 0; i < 40; i++) {
    if (tpl.P - total()[1] < 8) break;
    let did = false;
    for (const x of rem) {
      const it = x.items.find(it => PSTEP[it.f] && it.g != null && it.g < PCAP[it.f]);
      if (it) { it.g += PSTEP[it.f]; did = true; break; }
    }
    if (!did) {
      const x = rem.slice().reverse().find(x => x.items.filter(it => it.fill === 'p').length < 2);
      if (!x) break;
      const dairy = x.items.some(it => ['quark', 'skyrA'].includes(it.f));
      const evening = x.kind === 'ab' || x.te >= SLEEP - 180;
      x.items.push(evening && !dairy ? { f: 'quark', g: 250, fill: 'p' } : { f: 'whey', g: 30, fill: 'p' });
    }
  }

  // Kohlenhydrate: erst Portionen anpassen, dann Auffüller (Datteln, Obst, Maiswaffeln)
  for (let i = 0; i < 60; i++) {
    const gap = Cmid - total()[2];
    if (Math.abs(gap) < 10) break;
    if (gap > 0) {
      let did = false;
      for (const x of rem) {
        if (!ctx.carbOK(x.te)) continue;
        const it = x.items.find(it => it.sc && !it.fatScale && (it.n != null ? it.n : it.g) < it.sc.max);
        if (it) { if (it.n != null) it.n += it.sc.step; else it.g += it.sc.step; did = true; break; }
      }
      if (!did) {
        const order = ['sn', 'wa', 'rad', 'zw', 'mi', 'ab'];
        const x = rem.filter(x => ctx.carbOK(x.te) && x.items.filter(isCarbFill).length < 2 && !(x.light))
          .sort((a, b) => order.indexOf(a.kind) - order.indexOf(b.kind))[0];
        if (!x) break;
        const have = x.items.filter(isCarbFill).map(i => i.f);
        const pick = ['datteln', 'banane', 'maiswaffel', 'apfel'].find(f => !have.includes(f) && !x.items.some(i => i.f === f));
        if (!pick) break;
        x.items.push(pick === 'datteln' ? { f: 'datteln', g: 40, fill: 'c' } : pick === 'maiswaffel' ? { f: 'maiswaffel', n: 3, fill: 'c' } : { f: pick, n: 1, fill: 'c' });
      }
    } else {
      let did = false;
      for (const x of rem.slice().reverse()) {
        const it = x.items.find(it => it.sc && !it.fatScale && (it.n != null ? it.n : it.g) > it.sc.min);
        if (it) { if (it.n != null) it.n -= it.sc.step; else it.g -= it.sc.step; did = true; break; }
      }
      if (!did) break;
    }
  }

  // Fett: Auffüller nur, wo es die Regeln erlauben (nicht vor dem Training, nicht nach später Halle, nicht spät abends)
  for (let i = 0; i < 12; i++) {
    const gap = Fmid - total()[3];
    if (gap < 4) break;
    let did = false;
    for (const x of rem) {
      if (!ctx.fatOK(x.te) || x.noFat || x.light) continue;
      const fills = x.items.filter(it => it.fill === 'f');
      const has = f => x.items.some(it => it.f === f && it.fill === 'f');
      let pick = null;
      if (x.kind === 'mi' && !x.items.some(it => it.f === 'lachs')) {
        const oil = x.items.find(it => it.f === 'oel');
        if (oil && oil.g < 15) { oil.g += 5; oil.fill = oil.fill || 'f'; oil.boost = true; did = true; break; }
        if (!has('mandeln')) pick = { f: 'mandeln', g: 30, fill: 'f' };
      } else if (x.kind === 'mi') { if (!has('mandeln')) pick = { f: 'mandeln', g: 30, fill: 'f' }; }
      else if (x.kind === 'zw') { const m = x.items.find(it => it.f === 'mandeln'); if (!m) pick = { f: 'mandeln', g: 30, fill: 'f' }; else if (m.g < 45) { m.g += 15; did = true; break; } }
      else if (x.kind === 'ab' && x.variant === 'eier') {
        const ei = x.items.find(it => it.f === 'ei');
        if (ei.n < 4) { ei.n += 1; did = true; break; }
        if (!has('kaese')) pick = { f: 'kaese', n: 2, fill: 'f' };
      } else if (x.kind === 'ab') { if (!has('kaese') && x.items.some(it => ['toast', 'mehrkorn'].includes(it.f))) pick = { f: 'kaese', n: 2, fill: 'f' }; }
      if (pick && fills.length < 2) { x.items.push(pick); did = true; break; }
    }
    if (!did) break;
  }

  // Nicht zu viel kurz vor dem Schlafen
  rem.forEach(x => {
    if (x.te < SLEEP - 150) return;
    for (let i = 0; i < 20 && sumItems(x.items)[0] > (x.late ? LATE_CAP + 300 : LATE_CAP); i++) {
      const f = x.items.findIndex(it => it.fill === 'c' || it.fill === 'f');
      if (f >= 0) { x.items.splice(f, 1); continue; }
      const it = x.items.find(it => it.sc && (it.n != null ? it.n : it.g) > it.sc.min);
      if (!it) break;
      if (it.n != null) it.n -= it.sc.step; else it.g -= it.sc.step;
    }
    x.capped = true;
  });

  return { ...day, rem, eaten, total: total() };
}

// ---------- Supplements ----------
function supps(day, st) {
  const list = [{ id: 'kreatin', n: 'Kreatin 5 g', t: CREATINE, note: 'jeden Morgen' }];
  list.push({ id: 'd3k2', n: 'Vitamin D3 + K2', t: (day.slots.find(x => x.id === 'fr') || { t: 450 }).t, note: 'zum Frühstück', meal: 'fr' });
  const fish = Object.values(st.log).some(l => l.items && l.items.some(i => i.f === 'lachs')) || st.choice.mi_p === 'lachs';
  if (!fish) {
    const mi = day.slots.find(x => x.id === 'mi');
    list.push({ id: 'omega3', n: 'Omega-3 (1,5–2 g EPA/DHA)', t: mi ? mi.t : 750, note: 'fischfreier Tag', meal: 'mi' });
  }
  day.sess.filter(x => (x.type === 'badminton' || x.type === 'turnier') && x.end - x.start >= 90).forEach((x, i) => {
    list.push({ id: 'elek' + i, n: 'Elektrolyte: 1–2 g Salz in die Trainingsflasche', t: x.start - 30, note: 'lange Einheit', meal: 'sn' });
  });
  list.push({ id: 'magnesium', n: 'Magnesium 300–400 mg', t: SLEEP - 60, note: 'abends' });
  return list.sort((a, b) => a.t - b.t);
}

// ---------- Darstellung ----------
let draft = null; // Auswahl im Trainings-Dialog

function trainingAsk(st, inSheet) {
  const wd = new Date().getDay();
  if (!draft) {
    const def = WEEK[wd];
    draft = { type: def.type, dur: def.dur || TT_DUR[def.type], start: FLEX.includes(def.type) ? 'flex' : null, rad: false };
  }
  const times = []; for (let t = 15 * 60; t <= 21 * 60 + 30; t += 30) times.push(t); for (let t = 6 * 60; t < 15 * 60; t += 30) times.push(t);
  const chip = (act, val, on, txt) => `<button class="chip${on ? ' on' : ''}" data-act="${act}" data-v="${val}">${txt}</button>`;
  return `<div class="panel ask">
    <div class="ask-q">${inSheet ? 'Training heute ändern' : 'Trainierst du heute?'}</div>
    <p class="mini">${inSheet ? 'Änderung gilt nur für heute.' : `Laut Plan ist heute ${TT[WEEK[wd].type]} dran. Im Kalender steht nichts.`}</p>
    <div class="lbl2">Was</div>
    <div class="chips">${Object.keys(TT).map(k => chip('tt', k, draft.type === k, TT[k])).join('')}</div>
    ${draft.type === 'badminton' ? `<div class="lbl2">Dauer</div><div class="chips">${[90, 120].map(d => chip('td', d, draft.dur === d, dur(d))).join('')}</div>` : ''}
    ${draft.type === 'badminton' ? `<div class="chips">${chip('trad', draft.rad ? 0 : 1, draft.rad, 'plus Fahrrad Zone 2 vorher')}</div>` : ''}
    <div class="lbl2">Beginn</div>
    <div class="chips scroll-x">${FLEX.includes(draft.type) ? chip('ts', 'flex', draft.start === 'flex', 'Flexibel') : ''}${times.map(t => chip('ts', t, draft.start === t, hm(t))).join('')}</div>
    ${draft.start === 'flex' ? '<p class="mini">Die App schlägt dir die beste Zeit vor (3 h nach dem Mittagessen).</p>' : ''}
    <button class="cta" data-act="tsave" ${draft.start == null ? 'disabled' : ''}>Übernehmen</button>
    <button class="ghost" data-act="tnone">Heute kein Training</button>
  </div>`;
}

const RING_COL = { kcal: '#ff5a36', C: '#ffb020', P: '#2fd4c0', F: '#a98bff' };
function bars(p, st) {
  const { tpl, total, eaten } = p;
  const rows = [
    ['kcal', 'Kalorien', eaten[0], total[0], Math.round(tpl.kcal * 0.97 / 10) * 10, Math.round(tpl.kcal * 1.03 / 10) * 10, 'kcal'],
    ['C', 'Kohlenhydrate', eaten[2], total[2], tpl.C[0], tpl.C[1], 'g'],
    ['P', 'Protein', eaten[1], total[1], tpl.P, tpl.P, 'g'],
    ['F', 'Fett', eaten[3], total[3], tpl.F[0], tpl.F[1], 'g']
  ];
  const R = [86, 68, 50, 32];
  const arcs = rows.map(([k, , e, t, lo, hi], i) => {
    const C = 2 * Math.PI * R[i], tgt = (lo + hi) / 2;
    const fe = Math.min(1, e / tgt), ft = Math.min(1, t / tgt);
    return `<circle cx="100" cy="100" r="${R[i]}" fill="none" stroke="#26262b" stroke-width="13"/>
      <circle class="arc" cx="100" cy="100" r="${R[i]}" fill="none" stroke="${RING_COL[k]}" stroke-opacity=".28" stroke-width="13" stroke-linecap="round" stroke-dasharray="${C}" stroke-dashoffset="${C * (1 - ft)}" data-off="${C * (1 - ft)}" data-full="${C}"/>
      <circle class="arc" cx="100" cy="100" r="${R[i]}" fill="none" stroke="${RING_COL[k]}" stroke-width="13" stroke-linecap="round" stroke-dasharray="${C}" stroke-dashoffset="${C * (1 - fe)}" data-off="${C * (1 - fe)}" data-full="${C}"/>`;
  }).join('');
  const legend = rows.map(([k, n, e, t, lo, hi, u]) => {
    const ok = t >= lo * 0.95 && t <= hi * (k === 'P' ? 1.2 : 1.08);
    const tg = lo === hi ? `${lo}` : `${lo}–${hi}`;
    return `<div class="lg"><i style="background:${RING_COL[k]}"></i><div><b>${Math.round(e)}</b> / ${tg} ${u}<small>${n}</small><small class="${ok ? '' : 'warn'}">mit Plan ${Math.round(t)}${ok ? '' : t < lo ? ' · zu wenig' : ' · etwas drüber'}</small></div></div>`;
  }).join('');
  return `<div class="panel"><h3>Heute</h3>
    <div class="dayring"><svg viewBox="0 0 200 200">${arcs}</svg><div class="legend">${legend}</div></div>
    <p class="mini">Kräftig = gegessen · blass = was mit dem Rest des Plans dazukommt</p>
    ${sources(st)}</div>`;
}
// Woher die Werte kommen: alles Eingetragene nach Lebensmittel zusammengefasst
function sources(st) {
  const agg = {};
  const put = (name, m) => { const k = name.replace(/\s*\(.*?\)/g, ''); agg[k] = add(agg[k] || [0, 0, 0, 0], m); };
  Object.values(st.log).forEach(l => {
    if (l.custom && l.st === 'eaten') {
      const x = l.custom;
      if (x.kind === 'list' && x.items) x.items.forEach(i => { const it = SN[i.id]; if (it) put(it.n, snM(it, i.q)); });
      else if (x.kind === 'alt' && x.items) x.items.forEach(i => put(i.n, i.m.map(v => v * i.g / 100)));
      else if (x.kind === 'macro') put(x.txt || 'Eigene Angabe', x.m);
      else put(x.txt ? x.txt + ' (grob)' : 'Mahlzeit (grob)', x.m);
      return;
    }
    if (!l.items || l.st === 'notyet' || l.st === 'skip') return;
    const k = l.st === 'half' ? 0.5 : 1;
    l.items.forEach(it => { if (!FOOD[it.f] || FOOD[it.f].free) return; put(FOOD[it.f].n, mac(it).map(v => v * k)); });
  });
  (st.extra || []).forEach(x => {
    if (x.kind === 'list' && x.items) x.items.forEach(i => { const it = SN[i.id]; if (it) put(it.n, snM(it, i.q)); });
    else put(x.txt ? x.txt + ' (grob)' : 'Snack (grob)', x.m);
  });
  const list = Object.entries(agg).sort((a, b) => b[1][0] - a[1][0]);
  if (!list.length) return '<p class="mini">Noch nichts eingetragen.</p>';
  return `<div class="lbl2">Woher es kommt</div><div class="src">${list.map(([n, m]) =>
    `<div><span>${esc(n)}</span><b>${Math.round(m[0])}</b><em>${Math.round(m[1])} P · ${Math.round(m[2])} KH · ${Math.round(m[3])} F</em></div>`).join('')}</div>`;
}

function itemsHtml(items) {
  return `<ul class="ing">${items.filter(it => !FOOD[it.f].free || true).map(it => `<li class="${it.fill ? 'fill' : ''}"><span>${label(it)}</span>${it.fill ? `<em>${it.fill === 'p' ? 'für dein Eiweiß-Ziel' : 'Auffüller'}</em>` : ''}</li>`).join('')}</ul>`;
}

// ---------- Snacks: feste Liste (Werte pro 100 g von den Packungen), wird nach und nach länger ----------
// m = [kcal, Protein, KH, Fett] pro 100 g · unit 'stk' (mit Gramm pro Stück) oder 'g' · def = Startmenge · step = Regler-Schritt
const SNACKS = [
  { id: 'ei', n: 'Eier (Größe M)', m: [143, 12.6, 0.7, 9.5], unit: 'stk', g: 58, def: 2, step: 1, src: 'Durchschnitt Hühnerei' },
  { id: 'haehnchenAuf', n: 'Hähnchenbrust-Aufschnitt', m: [101, 20, 1, 1.9], unit: 'g', def: 50, step: 10, src: 'Herta Finesse' },
  { id: 'mozzarella', n: 'Mozzarella', m: [247, 18, 1, 19], unit: 'g', def: 125, step: 25, src: 'Cucina Nobile (Aldi), 1 Kugel = 125 g' },
  { id: 'mozzarellaLight', n: 'Mozzarella light', m: [167, 20, 1.6, 9], unit: 'g', def: 125, step: 25, src: 'Galbani light, 1 Kugel = 125 g' },
  { id: 'parmesan', n: 'Parmesan', m: [402, 32, 0, 30], unit: 'g', def: 20, step: 5, src: 'Parmigiano Reggiano' },
  { id: 'geramontSkyr', n: 'Géramont mit Skyr', m: [215, 20, 0.5, 15], unit: 'g', def: 30, step: 10, src: 'Géramont, Packung 180 g' },
  { id: 'chipsAldi', n: 'Protein Chips Aldi Sports', m: [401, 41, 28, 11], unit: 'g', def: 60, step: 10, src: 'Aldi Sports, 1 Tüte = 60 g' },
  { id: 'chipsMore', n: 'More Protein Tortilla Chips', m: [408, 29, 43, 11], unit: 'g', def: 50, step: 10, src: 'More Nutrition, 1 Tüte = 50 g' }
];
const SN = Object.fromEntries(SNACKS.map(x => [x.id, x]));
const snGrams = (it, q) => it.unit === 'stk' ? q * it.g : q;
const snM = (it, q) => it.m.map(v => v * snGrams(it, q) / 100);
const snQty = (it, q) => it.unit === 'stk' ? `${q} ${q === 1 ? 'Stück' : 'Stück'}` : `${Math.round(q)} g`;
// Fallback, wenn etwas nicht auf der Liste steht
const SN_SIZE = [[150, 'Klein'], [300, 'Mittel'], [500, 'Groß'], [800, 'Mahlzeit']];
const SN_KIND = { suess: ['Süß', [.05, .55, .40]], herzhaft: ['Herzhaft', [.15, .40, .45]], protein: ['Eiweißreich', [.40, .35, .25]], getraenk: ['Getränk', [0, 1, 0]] };
let snd = null;
const snMacros = (kcal, kind) => { const [p, c, f] = SN_KIND[kind][1]; return [kcal, kcal * p / 4, kcal * c / 4, kcal * f / 9]; };
const snTotal = () => Object.entries(snd.sel).reduce((a, [id, q]) => add(a, snM(SN[id], q), 1), [0, 0, 0, 0]);
const mLine = m => `${Math.round(m[0])} kcal · ${Math.round(m[1])} g P · ${Math.round(m[2])} g KH · ${Math.round(m[3])} g F`;

function snackSheet() {
  const ids = Object.keys(snd.sel);
  let h = `<h3>${snd.meal ? 'Was hast du stattdessen gegessen?' : 'Snack eintragen'}</h3>
    <div class="chips">${SNACKS.map(x => `<button class="chip${snd.sel[x.id] != null ? ' on' : ''}" data-act="snpick" data-v="${x.id}">${esc(x.n)}</button>`).join('')}</div>`;
  if (ids.length) {
    h += `<div class="snrows">${ids.map(id => {
      const it = SN[id], q = snd.sel[id];
      return `<div class="snrow"><div class="snn"><b>${esc(it.n)}</b><small id="snm-${id}">${mLine(snM(it, q))}</small></div>
        <div class="snq-w"><button data-act="snminus" data-v="${id}" aria-label="weniger">−</button>
        <input class="snq" data-id="${id}" type="number" inputmode="${it.unit === 'stk' ? 'numeric' : 'decimal'}" min="0" step="${it.unit === 'stk' ? 1 : 1}" value="${q}">
        <span>${it.unit === 'stk' ? 'Stk' : 'g'}</span><button data-act="snplus" data-v="${id}" aria-label="mehr">+</button></div></div>`;
    }).join('')}</div>
    <div class="macro" id="snSum">Zusammen: ${mLine(snTotal())}</div>`;
  }
  h += `<button class="cta" data-act="snsave"${ids.length ? '' : ' disabled'}>Eintragen</button>`;
  if (snd.meal) {
    const mv = snd.mac || {};
    h += `<div class="panel" style="margin-top:14px"><div class="lbl2">Makros selbst eintragen (z. B. von der Packung oder aus einer App)</div>
      <input id="mmN" class="txtin" placeholder="Was war's? (optional)" value="${esc(mv.n || '')}" autocomplete="off">
      <div class="mgrid"><label>kcal<input id="mmK" class="snq" type="number" inputmode="decimal" value="${mv.k ?? ''}" placeholder="auto"></label><label>Eiweiß g<input id="mmP" class="snq" type="number" inputmode="decimal" value="${mv.p ?? ''}"></label><label>KH g<input id="mmC" class="snq" type="number" inputmode="decimal" value="${mv.c ?? ''}"></label><label>Fett g<input id="mmF" class="snq" type="number" inputmode="decimal" value="${mv.f ?? ''}"></label></div>
      <p class="mini">kcal leer lassen = wird aus Eiweiß, KH und Fett berechnet.</p>
      <button class="ghost" data-act="snmacro" style="width:100%">Mit diesen Makros eintragen</button></div>`;
  }
  h += `<div class="panel" style="margin-top:14px"><div class="lbl2">Oder frei eintragen (kommt danach auf die Liste)</div>
    <input id="snTxt" class="txtin" type="text" placeholder="z. B. Croissant vom Bäcker" value="${esc(snd.txt || '')}" autocomplete="off" enterkeyhint="done">
    <div class="lbl2">Ungefähr</div><div class="chips">${(snd.meal ? [[300, 'Klein'], [600, 'Mittel'], [900, 'Groß'], [1200, 'Sehr groß']] : SN_SIZE).map(([k, l]) => `<button class="chip${snd.kcal === k ? ' on' : ''}" data-act="snsz" data-v="${k}">${l} ~${k} kcal</button>`).join('')}</div>
    <div class="lbl2">Eher …</div><div class="chips">${Object.entries(SN_KIND).map(([k, [l]]) => `<button class="chip${snd.kind === k ? ' on' : ''}" data-act="snk" data-v="${k}">${l}</button>`).join('')}</div>
    <button class="ghost" data-act="snsaveother"${snd.kcal ? '' : ' disabled'} style="width:100%">Grob eintragen</button></div>`;
  return h;
}
// Mengen-Eingabe live übernehmen, ohne das Feld neu zu zeichnen
document.addEventListener('input', e => {
  const el = e.target.closest && e.target.closest('#sheet .snq[data-id]');
  if (!el || !snd) return;
  const id = el.dataset.id, v = parseFloat(String(el.value).replace(',', '.'));
  snd.sel[id] = isNaN(v) ? 0 : Math.max(0, v);
  const m = document.getElementById('snm-' + id); if (m) m.textContent = mLine(snM(SN[id], snd.sel[id]));
  const sum = document.getElementById('snSum'); if (sum) sum.textContent = 'Zusammen: ' + mLine(snTotal());
});


// ---------- Alternative berechnen: was du da hast → wie viel davon ----------
const FOOD_API = 'https://toms-form-sync.tlh-franke.workers.dev/food';
const vorrat = () => load('tf-foods', {});
const vorratSave = v => save('tf-foods', v);
let altd = null;
const altSum = () => altd.picks.reduce((a, x) => add(a, x.m.map(v => v * x.g / 100), 1), [0, 0, 0, 0]);
// Mengen so wählen, dass Eiweiß, KH, Fett und kcal möglichst nah am Ziel der Mahlzeit liegen
function altSolve() {
  const t = altd.target, W = [2, 4, 1, 1]; // kcal (skaliert), Protein, KH, Fett
  const tv = [t[0] / 10, t[1], t[2], t[3]];
  const A = altd.picks.map(x => [x.m[0] / 1000, x.m[1] / 100, x.m[2] / 100, x.m[3] / 100]);
  const g = altd.picks.map(x => x.g || 50);
  for (let it = 0; it < 300; it++) {
    for (let i = 0; i < g.length; i++) {
      let num = 0, den = 0;
      for (let j = 0; j < 4; j++) {
        let r = -tv[j];
        for (let k = 0; k < g.length; k++) if (k !== i) r += A[k][j] * g[k];
        num += W[j] * A[i][j] * r; den += W[j] * A[i][j] * A[i][j];
      }
      g[i] = den > 0 ? Math.min(800, Math.max(0, -num / den)) : 0;
    }
  }
  altd.picks.forEach((x, i) => { x.g = Math.round(g[i] / 5) * 5; });
}
const mL = m => `${Math.round(m[0])} kcal · ${Math.round(m[1])} g P · ${Math.round(m[2])} g KH · ${Math.round(m[3])} g F`;
function altSheet() {
  const v = vorrat(), t = altd.target;
  const quick = [...Object.entries(v).map(([k, x]) => ({ key: 'v:' + k, n: x.n, b: x.b, m: x.m })), ...SNACKS.filter(x => x.unit === 'g').map(x => ({ key: 's:' + x.id, n: x.n, m: x.m }))];
  const picked = k => altd.picks.some(x => x.key === k);
  let h = `<h3>Alternative für „${esc(altd.name)}“</h3>
    <p class="mini">Ziel dieser Mahlzeit: <b>${mL(t)}</b></p>
    <div class="lbl2">Was hast du da?</div>
    <div class="srch"><input id="altQ" class="txtin" type="search" enterkeyhint="search" placeholder="z. B. Hüttenkäse, Wraps, Joghurt" value="${esc(altd.q || '')}" autocomplete="off"><button class="ghost" data-act="altsearch">Suchen</button></div>`;
  if (altd.loading) h += `<p class="mini">Suche …</p>`;
  if (altd.err) h += `<p class="mini warn">${altd.err}</p>`;
  if (altd.results && altd.results.length) h += `<div class="altres">${altd.results.map((x, i) => `<button class="altr${picked('o:' + x.id) ? ' on' : ''}" data-act="altadd" data-i="${i}"><b>${esc(x.n)}</b><small>${esc([x.b, x.q].filter(Boolean).join(' · '))}</small><em>pro 100 g: ${mL(x.m)}</em></button>`).join('')}</div>`;
  if (quick.length) h += `<div class="lbl2">Schon bekannt</div><div class="chips">${quick.map(x => `<button class="chip${picked(x.key) ? ' on' : ''}" data-act="altquick" data-k="${x.key}">${esc(x.n)}</button>`).join('')}</div>`;
  h += altd.manual ? `<div class="panel" style="margin-top:12px"><div class="lbl2">Werte von der Packung (pro 100 g)</div>
      <input id="mN" class="txtin" placeholder="Name, z. B. Wraps" autocomplete="off">
      <div class="mgrid"><label>kcal<input id="mK" class="snq" type="number" inputmode="decimal"></label><label>Eiweiß<input id="mP" class="snq" type="number" inputmode="decimal"></label><label>KH<input id="mC" class="snq" type="number" inputmode="decimal"></label><label>Fett<input id="mF" class="snq" type="number" inputmode="decimal"></label></div>
      <button class="ghost" data-act="altmanualadd" style="width:100%">Hinzufügen</button></div>`
    : `<button class="undo" data-act="altmanual" style="display:block;margin:8px auto 0">Nicht gefunden? Werte von der Packung eintragen</button>`;
  if (altd.picks.length) {
    const sm = altSum();
    h += `<div class="lbl2">So viel davon essen</div><div class="snrows">${altd.picks.map((x, i) => `<div class="snrow"><div class="snn"><b>${esc(x.n)}</b><small id="altm-${i}">${mL(x.m.map(v => v * x.g / 100))}</small></div>
      <div class="snq-w"><button data-act="altminus" data-i="${i}">−</button><input class="snq altg" data-i="${i}" type="number" inputmode="numeric" value="${x.g}"><span>g</span><button data-act="altplus" data-i="${i}">+</button></div></div>`).join('')}</div>
      <div class="macro" id="altSum">Zusammen: ${mL(sm)}</div>
      <p class="mini" id="altHint">${altHint(sm)}</p>
      <div class="row2"><button class="ghost" data-act="altcalc">Neu berechnen</button><button class="ghost" data-act="altdrop">Leeren</button></div>
      <button class="cta" data-act="altsave">So gegessen – eintragen</button>`;
  } else h += `<p class="mini">Wähle 1–3 Lebensmittel, die du da hast. Die App rechnet aus, wie viel du von jedem essen solltest.</p>`;
  return h;
}
function altHint(sm) {
  const t = altd.target, d = i => Math.round(sm[i] - t[i]);
  const parts = [];
  if (Math.abs(d(1)) >= 8) parts.push(`Eiweiß ${d(1) > 0 ? '+' : ''}${d(1)} g`);
  if (Math.abs(d(2)) >= 15) parts.push(`KH ${d(2) > 0 ? '+' : ''}${d(2)} g`);
  if (Math.abs(d(3)) >= 8) parts.push(`Fett ${d(3) > 0 ? '+' : ''}${d(3)} g`);
  return parts.length ? 'Abweichung zum Ziel: ' + parts.join(', ') + '. Ein weiteres Lebensmittel kann das ausgleichen.' : 'Passt gut zum Ziel.';
}
async function altSearch() {
  const q = (altd.q || '').trim(); if (q.length < 2) return;
  altd.loading = true; altd.err = ''; altd.results = []; Shell.sheet(altSheet());
  try {
    const r = await fetch(FOOD_API + '?q=' + encodeURIComponent(q));
    const d = await r.json();
    altd.results = d.items || [];
    if (!altd.results.length) altd.err = 'Nichts gefunden – anderer Begriff oder Werte von der Packung eintragen.';
  } catch (e) { altd.err = 'Suche gerade nicht erreichbar – Werte von der Packung eintragen.'; }
  altd.loading = false; if (altd) Shell.sheet(altSheet());
}
function altAdd(x) {
  if (altd.picks.some(p => p.key === x.key)) { altd.picks = altd.picks.filter(p => p.key !== x.key); return; }
  if (altd.picks.length >= 3) { Shell.toast('Maximal 3 Lebensmittel'); return; }
  altd.picks.push({ key: x.key, n: x.n, m: x.m, g: 50 });
  if (x.save) { const v = vorrat(); v[x.save] = { n: x.n, b: x.b || '', m: x.m }; vorratSave(v); }
  altSolve();
}
document.addEventListener('input', e => {
  if (!altd) return;
  const q = e.target.closest && e.target.closest('#altQ'); if (q) { altd.q = q.value; return; }
  const el = e.target.closest && e.target.closest('#sheet .altg'); if (!el) return;
  const i = +el.dataset.i, v = parseFloat(String(el.value).replace(',', '.'));
  altd.picks[i].g = isNaN(v) ? 0 : Math.max(0, v);
  const m = document.getElementById('altm-' + i); if (m) m.textContent = mL(altd.picks[i].m.map(x => x * altd.picks[i].g / 100));
  const sm = altSum(); const s1 = document.getElementById('altSum'); if (s1) s1.textContent = 'Zusammen: ' + mL(sm);
  const s2 = document.getElementById('altHint'); if (s2) s2.textContent = altHint(sm);
});
document.addEventListener('keydown', e => { if (e.key === 'Enter' && e.target.id === 'altQ') { e.preventDefault(); altd.q = e.target.value; altSearch(); } });

function render() {
  const st = dayState(), now = nowMin();
  const p = plan(st, now);
  if (p.unknown) return trainingAsk(st, false);
  const { tpl, main, sess } = p;
  const sp = supps(p, st);
  let h = '';

  // Kontextzeile
  const ctxTxt = !sess.length ? 'Kein Training heute' :
    sess.map(x => x.flex ? `${TT[x.type]} · flexibel, ideal ab ${hm(x.start)}` : `${TT[x.type]} ${hm(x.start)}–${hm(x.end)}`).join(' · ');
  h += `<button class="daychip" data-act="tedit"><span>${esc(tpl.name)}</span><small>${esc(ctxTxt)}${sess.some(x => x.src === 'cal') ? ' · aus Kalender' : ''}</small><b>ändern</b></button>`;
  if (p.busy && p.busy.length) h += `<p class="mini">Unterwegs (inkl. Fahrt): ${p.busy.map(b => esc(b.title) + ' ' + hm(b.start) + '–' + hm(b.end)).join(' · ')}</p>`;
  if (tpl.note) h += `<p class="mini">${tpl.note}</p>`;
  const flex = sess.find(x => x.flex);
  if (flex) {
    const lunchDone = st.log.mi && st.log.mi.st !== 'notyet';
    h += `<div class="panel ask"><div class="ask-q">${TT[flex.type]}: ideal ab ${hm(flex.start)}</div>
      <p class="mini">${lunchDone ? '3 h nach deinem Mittagessen' : 'Plan: erst Mittagessen, dann 3 h Pause'}. Tipp an, wenn du losgehst, dann passt sich der Rest des Tages an.</p>
      <div class="ask-b"><button class="chip big" data-act="fgo">Ich gehe jetzt</button><button class="chip big" data-act="fdone">Schon erledigt</button><button class="chip big" data-act="fnone">Heute kein ${flex.type === 'intervalle' ? 'Training' : 'Gym'}</button></div></div>`;
  }
  if (WEEK[new Date().getDay()].rad && !st.rad && sess.some(x => x.type === 'badminton')) {
    h += `<div class="panel ask"><div class="ask-q">Fahrrad (Zone 2) heute?</div><p class="mini">Optional laut Plan. Nur wenn du fährst, gibt es mehr Kohlenhydrate und den Snack danach.</p>
      <div class="ask-b"><button class="chip big" data-act="rad" data-v="1">Gerade gefahren</button><button class="chip big" data-act="rad" data-v="0">Heute nicht</button></div></div>`;
  }

  // Rückfrage: schon gegessen?
  const overdue = null; // feste Reihenfolge: offene Mahlzeiten bleiben einfach der aktuelle Vorschlag
  if (overdue) {
    h += `<div class="panel ask"><div class="ask-q">Hast du ${overdue.kind === 'fr' ? 'dein Frühstück' : 'die Mahlzeit „' + esc(overdue.name) + '“'} (${hm(overdue.t)}) schon gegessen?</div>
      <div class="ask-b"><button class="chip big" data-act="log" data-id="${overdue.id}" data-st="eaten">Ja, wie geplant</button>
      <button class="chip big" data-act="log" data-id="${overdue.id}" data-st="half">Nur die Hälfte</button>
      <button class="chip big" data-act="notyet" data-id="${overdue.id}">Noch nicht – Tag anpassen</button>
      <button class="chip big" data-act="other" data-id="${overdue.id}">Etwas anderes gegessen</button>
      <button class="chip big" data-act="log" data-id="${overdue.id}" data-st="skip">Fällt aus</button></div></div>`;
  }

  // Vorschlag
  const cur = p.rem.find(x => x !== overdue);
  if (overdue) { /* erst die Rückfrage beantworten */ }
  else if (!cur) {
    h += `<div class="panel now"><div class="now-l">Für heute erledigt</div><div class="now-t">Küche zu</div><p class="mini">Alle Mahlzeiten sind eingetragen.</p></div>`;
  } else if (now >= SLEEP - 45) {
    h += `<div class="panel now"><div class="now-l">Gleich Schlafenszeit</div><div class="now-t">Nichts mehr essen</div><p class="mini">Weniger als 45 min bis ${hm(SLEEP)}. Nur noch Magnesium.</p></div>`;
  } else {
    const m = sumItems(cur.items);
    const nxt = main ? (now < main.start ? `noch ${dur(main.start - now)} bis zum Training` : now < main.end ? 'Training läuft' : `Training vor ${dur(now - main.end)} beendet`) : '';
    const toSleep = `${dur(Math.max(0, SLEEP - Math.max(now, cur.t)))} bis zum Schlafen`;
    const when = cur.t <= now + 10 ? 'Jetzt' : `Um ${hm(cur.t)} · in ${dur(cur.t - now)}`;
    const why = [];
    if (cur.swapped) why.push('Mittag ist verschoben: so kurz vor dem Training nichts Großes, die große Mahlzeit gibt es danach.');
    if (cur.light) why.push('Leicht, weil das Training bald beginnt. Die große Mahlzeit gibt es nach dem Training.');
    if (cur.noFat) why.push('Nach der späten Halle fettarm.');
    if (cur.capped) why.push('Portion begrenzt, weil es schon spät ist.');
    if (cur.items.some(i => i.fill)) why.push('Auffüller sind drin, damit deine Makros heute voll werden.');
    const opts = optionsFor(cur, st.choice);
    const cs = sp.filter(s => s.meal === cur.id);
    h += `<div class="panel now">
      <div class="now-l">${when}</div>
      <div class="now-t">${esc(cur.name)}</div>
      <div class="now-c">${[nxt, toSleep].filter(Boolean).join(' · ')}</div>
      ${opts.map(o => `<div class="lbl2">${o.label}</div><div class="chips">${o.opts.map(([v, t]) => `<button class="chip${o.val === v ? ' on' : ''}" data-act="ch" data-k="${o.key}" data-v="${v}">${t}</button>`).join('')}</div>`).join('')}
      ${itemsHtml(cur.items)}
      <div class="macro">${Math.round(m[0])} kcal · ${Math.round(m[2])} g KH · ${Math.round(m[1])} g P · ${Math.round(m[3])} g F</div>
      ${cs.length ? `<div class="lbl2">Dazu nehmen</div>${cs.map(s => suppRow(s, st)).join('')}` : ''}
      ${why.length ? `<p class="mini why">${why.join(' ')}</p>` : ''}
      <button class="cta" data-act="log" data-id="${cur.id}" data-st="eaten">Gegessen</button>
      <div class="row2"><button class="ghost" data-act="log" data-id="${cur.id}" data-st="half">Nur die Hälfte</button><button class="ghost" data-act="log" data-id="${cur.id}" data-st="skip">Fällt aus</button></div>
      <button class="ghost" data-act="alt" data-id="${cur.id}" style="width:100%;margin-top:8px">Hab ich nicht da – Alternative berechnen</button>
      <button class="undo" data-act="other" data-id="${cur.id}" style="display:block;margin:10px auto 0">Etwas anderes gegessen</button>
    </div>`;
  }

  h += `<button class="ghost" data-act="snack" style="width:100%;margin:0 0 12px">+ Snack eintragen</button>`;
  h += bars(p, st);

  // Restlicher Tag
  if (p.rem.length > 1) {
    h += `<div class="panel"><h3>Danach</h3>${p.rem.slice(1).map(x => {
      const m = sumItems(x.items);
      return `<div class="tl"><div class="tl-t">${hm(x.t)}</div><div class="tl-b"><b>${esc(x.name)}</b><span>${x.items.filter(i => !FOOD[i.f].free).map(label).join(', ')}</span><small>${Math.round(m[0])} kcal</small></div><button class="undo" data-act="log" data-id="${x.id}" data-st="eaten">✓ gegessen</button></div>`;
    }).join('')}</div>`;
  }

  // Supps
  h += `<div class="panel"><h3>Supplements</h3>${sp.map(s => suppRow(s, st, true)).join('')}</div>`;

  // Eingetragen
  const logged = p.slots.filter(x => st.log[x.id] && st.log[x.id].st !== 'notyet');
  const ex = st.extra || [];
  if (logged.length || ex.length) {
    const lab = { eaten: 'gegessen', half: 'halbe Portion', skip: 'ausgefallen' };
    h += `<div class="panel"><h3>Eingetragen</h3>${logged.map(x => `<div class="tl"><div class="tl-t">${hm(st.log[x.id].at)}</div><div class="tl-b"><b>${esc(x.name)}</b><span>${lab[st.log[x.id].st]}</span></div><button class="undo" data-act="undo" data-id="${x.id}">Rückgängig</button></div>`).join('')}
      ${ex.map((x, i) => `<div class="tl"><div class="tl-t">${hm(x.at)}</div><div class="tl-b"><b>${esc(x.txt || 'Snack')}</b><span>extra · ${x.kind === 'list' ? mLine(x.m) : '~' + x.kcal + ' kcal · ' + (SN_KIND[x.kind] ? SN_KIND[x.kind][0] : '')}</span></div><button class="undo" data-act="snundo" data-i="${i}">Rückgängig</button></div>`).join('')}</div>`;
  }
  return h;
}

function suppRow(s, st, withTime) {
  const on = !!st.supps[s.id];
  return `<button class="supp${on ? ' on' : ''}" data-act="supp" data-id="${s.id}"><i></i><span><b>${esc(s.n)}</b><small>${withTime ? hm(s.t) + ' · ' : ''}${esc(s.note)}</small></span></button>`;
}

// ---------- Aktionen ----------
function click(e) {
  const b = e.target.closest('[data-act]');
  if (!b) return false;
  const st = dayState(), act = b.dataset.act, now = nowMin();
  const ti = document.getElementById('snTxt'); if (snd && ti) snd.txt = ti.value;
  if (snd && document.getElementById('mmP')) {
    const gv = id => { const v = document.getElementById(id).value; return v === '' ? undefined : parseFloat(String(v).replace(',', '.')); };
    snd.mac = { n: document.getElementById('mmN').value, k: gv('mmK'), p: gv('mmP'), c: gv('mmC'), f: gv('mmF') };
  }
  if (act === 'snmacro') {
    const mv = snd.mac || {}, P = mv.p, C = mv.c, F = mv.f;
    if ([P, C, F].some(v => v === undefined || isNaN(v) || v < 0)) { Shell.toast('Eiweiß, KH und Fett eintragen'); return true; }
    const K = mv.k !== undefined && !isNaN(mv.k) ? mv.k : Math.round(P * 4 + C * 4 + F * 9);
    const m = [K, P, C, F], txt = (mv.n || '').trim().slice(0, 80);
    st.log[snd.meal] = { st: 'eaten', at: now, m, items: [], custom: { kind: 'macro', txt, kcal: Math.round(K), m } };
    store(st); snd = null; Shell.closeSheet(); Shell.toast('Mahlzeit eingetragen'); Shell.buzz(); Shell.refresh(); return true;
  }
  if (act && act.startsWith('alt')) {
    const qi = document.getElementById('altQ'); if (altd && qi) altd.q = qi.value;
    if (act === 'alt') {
      const p = plan(st, now), slot = p.rem.find(x => x.id === b.dataset.id); if (!slot) return true;
      altd = { meal: slot.id, name: slot.name, target: sumItems(slot.items), picks: [], results: [], q: '' };
    } else if (act === 'altsearch') { altSearch(); return true; }
    else if (act === 'altadd') { const x = altd.results[+b.dataset.i]; altAdd({ key: 'o:' + x.id, n: x.n + (x.b ? ' (' + x.b + ')' : ''), b: x.b, m: x.m, save: x.id }); }
    else if (act === 'altquick') { const k = b.dataset.k; const [t, id] = [k.slice(0, 1), k.slice(2)]; const x = t === 'v' ? vorrat()[id] : SN[id]; if (x) altAdd({ key: k, n: x.n, m: x.m }); }
    else if (act === 'altmanual') altd.manual = true;
    else if (act === 'altmanualadd') {
      const g = id => parseFloat(String((document.getElementById(id) || {}).value || '').replace(',', '.'));
      const n = ((document.getElementById('mN') || {}).value || '').trim(), m = [g('mK'), g('mP'), g('mC'), g('mF')];
      if (!n || m.some(v => isNaN(v))) { Shell.toast('Name und alle 4 Werte eintragen'); return true; }
      altd.manual = false; altAdd({ key: 'm:' + n, n, m, save: 'm-' + n.toLowerCase().replace(/[^a-z0-9äöüß]+/g, '-') });
    }
    else if (act === 'altminus' || act === 'altplus') { const x = altd.picks[+b.dataset.i]; x.g = Math.max(0, x.g + (act === 'altplus' ? 10 : -10)); }
    else if (act === 'altcalc') altSolve();
    else if (act === 'altdrop') altd.picks = [];
    else if (act === 'altsave') {
      const items = altd.picks.filter(x => x.g > 0).map(x => ({ n: x.n, g: x.g, m: x.m }));
      if (!items.length) return true;
      const m = altSum();
      st.log[altd.meal] = { st: 'eaten', at: now, m, items: [], custom: { kind: 'alt', items, txt: items.map(x => `${x.g} g ${x.n}`).join(', '), kcal: Math.round(m[0]), m } };
      store(st); altd = null; Shell.closeSheet(); Shell.toast('Eingetragen'); Shell.buzz(); Shell.refresh(); return true;
    }
    Shell.sheet(altSheet()); Shell.buzz(); return true;
  }
  if (act === 'other') { snd = { sel: {}, txt: '', kcal: null, kind: 'herzhaft', meal: b.dataset.id }; Shell.sheet(snackSheet()); Shell.buzz(); return true; }
  if (act === 'snack') { snd = { sel: {}, other: false, txt: '', kcal: null, kind: 'herzhaft' }; Shell.sheet(snackSheet()); Shell.buzz(); return true; }
  if (act === 'snpick') { const id = b.dataset.v; if (snd.sel[id] != null) delete snd.sel[id]; else snd.sel[id] = SN[id].def; Shell.sheet(snackSheet()); Shell.buzz(); return true; }
  if (act === 'snminus' || act === 'snplus') { const it = SN[b.dataset.v]; const q = snd.sel[b.dataset.v] || 0; snd.sel[b.dataset.v] = Math.max(0, Math.round((q + (act === 'snplus' ? it.step : -it.step)) * 10) / 10); Shell.sheet(snackSheet()); Shell.buzz(); return true; }
  if (act === 'snother') { snd.other = true; Shell.sheet(snackSheet()); Shell.buzz(); setTimeout(() => { const i = document.getElementById('snTxt'); if (i) i.focus(); }, 300); return true; }
  if (act === 'snsz') { snd.kcal = +b.dataset.v; Shell.sheet(snackSheet()); Shell.buzz(); return true; }
  if (act === 'snk') { snd.kind = b.dataset.v; Shell.sheet(snackSheet()); Shell.buzz(); return true; }
  if (act === 'snsave') {
    const items = Object.entries(snd.sel).filter(([, q]) => q > 0).map(([id, q]) => ({ id, q }));
    if (!items.length) return true;
    const m = items.reduce((a, x) => add(a, snM(SN[x.id], x.q), 1), [0, 0, 0, 0]);
    const entry = { at: now, kind: 'list', items, txt: items.map(x => `${snQty(SN[x.id], x.q)} ${SN[x.id].n}`).join(', '), kcal: Math.round(m[0]), m };
    if (snd.meal) st.log[snd.meal] = { st: 'eaten', at: now, m, items: [], custom: entry };
    else { st.extra = st.extra || []; st.extra.push(entry); }
    const wasMeal = !!snd.meal;
    store(st); snd = null; Shell.closeSheet(); Shell.toast(wasMeal ? 'Mahlzeit eingetragen' : 'Snack eingetragen'); Shell.buzz(); Shell.refresh(); return true;
  }
  if (act === 'snsaveother') {
    if (!snd || !snd.kcal) return true;
    const entry = { at: now, txt: (snd.txt || '').trim().slice(0, 80), kcal: snd.kcal, kind: snd.kind, m: snMacros(snd.kcal, snd.kind), todo: true };
    if (snd.meal) st.log[snd.meal] = { st: 'eaten', at: now, m: entry.m, items: [], custom: entry };
    else { st.extra = st.extra || []; st.extra.push(entry); }
    store(st); snd = null; Shell.closeSheet(); Shell.toast('Notiert – kommt auf die Liste'); Shell.buzz(); Shell.refresh(); return true;
  }
  if (act === 'snundo') { (st.extra || []).splice(+b.dataset.i, 1); store(st); Shell.buzz(); Shell.refresh(); return true; }
  if (act === 'tt') { draft.type = b.dataset.v; draft.dur = TT_DUR[draft.type]; if (draft.type !== 'badminton') draft.rad = false; draft.start = FLEX.includes(draft.type) ? 'flex' : (draft.start === 'flex' ? null : draft.start); }
  else if (act === 'td') draft.dur = +b.dataset.v;
  else if (act === 'trad') draft.rad = b.dataset.v === '1';
  else if (act === 'ts') draft.start = b.dataset.v === 'flex' ? 'flex' : +b.dataset.v;
  else if (act === 'tsave') {
    if (draft.start == null) return true;
    const sess = [];
    if (draft.start === 'flex') sess.push({ type: draft.type, flex: true });
    else {
      if (draft.rad) sess.push({ type: 'fahrrad', start: Math.max(360, draft.start - 240), end: Math.max(420, draft.start - 180) });
      sess.push({ type: draft.type, start: draft.start, end: draft.start + draft.dur });
    }
    st.sess = sess; draft = null; store(st); Shell.closeSheet && Shell.closeSheet(); Shell.toast('Training gespeichert');
  }
  else if (act === 'tnone') { st.sess = []; draft = null; store(st); Shell.closeSheet && Shell.closeSheet(); Shell.toast('Ruhetag eingetragen'); }
  else if (act === 'tedit') {
    const cur = sessionsToday(st) || [], m = cur.length ? mainSess(cur) : null;
    draft = m ? { type: m.type, dur: m.end - m.start, start: m.flex ? 'flex' : m.start, rad: cur.some(x => x.type === 'fahrrad') } : null;
    Shell.sheet(trainingAsk(st, true)); return true;
  }
  else if (act === 'fgo' || act === 'fdone') {
    const cur = rawSessions(st) || [];
    st.sess = cur.map(x => x.flex ? (act === 'fgo' ? { type: x.type, start: now, end: now + TT_DUR[x.type] } : { type: x.type, start: Math.max(0, now - TT_DUR[x.type] - 15), end: Math.max(15, now - 15) }) : x);
    store(st); Shell.toast(act === 'fgo' ? 'Viel Erfolg beim Training' : 'Training eingetragen');
  }
  else if (act === 'fnone') { st.sess = (rawSessions(st) || []).filter(x => !x.flex); store(st); Shell.toast('Heute ohne Gym'); }
  else if (act === 'rad') { st.rad = b.dataset.v === '1' ? { done: true, start: Math.max(0, now - 75), end: now } : { done: false }; store(st); }
  else if (act === 'ch') { st.choice[b.dataset.k] = b.dataset.v; store(st); }
  else if (act === 'notyet') { st.log[b.dataset.id] = { st: 'notyet', at: now }; store(st); }
  else if (act === 'log') {
    const p = plan(st, now);
    const slot = (p.rem || []).find(x => x.id === b.dataset.id);
    const items = slot ? slot.items : [];
    st.log[b.dataset.id] = { st: b.dataset.st, at: now, items, m: sumItems(items) };
    // Supps zur Mahlzeit automatisch abhaken
    if (b.dataset.st !== 'skip') supps(p, st).filter(s => s.meal === b.dataset.id).forEach(s => { st.supps[s.id] = st.supps[s.id] || now; });
    store(st);
    Shell.toast(b.dataset.st === 'skip' ? 'Ausgelassen, Rest wird angepasst' : 'Eingetragen');
  }
  else if (act === 'undo') { delete st.log[b.dataset.id]; store(st); }
  else if (act === 'supp') { if (st.supps[b.dataset.id]) delete st.supps[b.dataset.id]; else st.supps[b.dataset.id] = now; store(st); }
  else return false;
  Shell.buzz(); Shell.refresh();
  if (document.querySelector('#sheet.on .ask')) Shell.sheet(trainingAsk(dayState(), true));
  return true;
}

function glance() {
  const st = dayState(), now = nowMin(), p = plan(st, now);
  if (p.unknown) return { num: '?', hint: 'Training heute eintragen' };
  const cur = p.rem[0];
  if (!cur || now >= SLEEP - 45) return { num: '✓', hint: 'Für heute erledigt' };
  return { num: cur.t <= now + 10 ? 'Jetzt' : hm(cur.t), hint: cur.name };
}

window.Modules.essen = { render, click, glance, _plan: plan, _supps: supps, _today: () => sessionsToday(dayState()) };
})();
