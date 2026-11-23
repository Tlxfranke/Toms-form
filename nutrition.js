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
  kaese: { n: 'Käse', m: [360, 24, 0, 29], u: 25, un: ['Scheibe Käse', 'Scheiben Käse'] }
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
  intervalle: 'Intervalle 15:15', fahrrad: 'Fahrrad Zone 2', turnier: 'Turnier'
};
const TT_DUR = { badminton: 120, gymOber: 75, gymBeine: 75, intervalle: 45, fahrrad: 60, turnier: 360 };
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

// Gym und Intervalle sind zeitlich flexibel, Badminton ist fest, Fahrrad optional.
const FLEX = ['gymOber', 'gymBeine', 'intervalle'];
function rawSessions(st) {
  if (st.sess) return st.sess;
  const cal = (SCHEDULE.days || {})[dkey(new Date())];
  if (cal && cal.length) return cal.map(x => ({ type: x.type, start: toMin(x.start), end: toMin(x.end), title: x.title, src: 'cal' }));
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
  const pri = s => (s.type === 'badminton' || s.type === 'turnier' ? 1000 : 0) + (s.end - s.start);
  return sess.filter(s => s.type !== 'fahrrad').sort((a, b) => pri(b) - pri(a))[0] || sess[0] || null;
}

// ---------- Tagesablauf ----------
function buildDay(st, now) {
  const sess = sessionsToday(st, now);
  if (!sess) return { unknown: true };
  const T = tplFor(sess), tpl = TPL[T], main = mainSess(sess);
  const s = main ? main.start : null, e = main ? main.end : null;
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
  slots.push({ id: 'fr', name: 'Frühstück', t: s != null && s < 630 ? Math.max(390, s - 150) : 450, kind: 'fr' });
  const rad = sess.find(x => x.type === 'fahrrad');
  if (rad) slots.push({ id: 'rad', name: 'Nach dem Radfahren', t: rad.end + 15, kind: 'rad' });

  let lt = 750, after = false;
  if (main) { if (s - PRE_BIG >= 660) lt = Math.min(750, s - PRE_BIG); else { lt = e + 30; after = true; } }
  const mi = { id: 'mi', name: 'Mittagessen', t: lt, kind: 'mi', after };
  slots.push(mi);

  // Zwischenmahlzeit, damit Fett/Kalorien voll werden (nur wenn genug Abstand zum Training)
  if (!main) slots.push({ id: 'zw', name: 'Zwischenmahlzeit', t: 960, kind: 'zw' });
  else if (!after && s - PRE_BIG - lt >= 120) slots.push({ id: 'zw', name: 'Zwischenmahlzeit', t: Math.min(lt + 180, s - PRE_BIG), kind: 'zw' });

  if (main && tpl.snack) {
    const pre = tpl.snack === 'pre';
    slots.push({ id: 'sn', name: pre ? 'Pre-Workout' : 'Rund ums Training', t: s - (pre ? 75 : 45), kind: 'sn', snack: tpl.snack });
  }
  if (main && e - s >= 180) {
    let i = 1;
    for (let t = s + 120; t <= e - 60; t += 150, i++) slots.push({ id: 'wa' + i, name: 'Während des Trainings', t, kind: 'wa' });
  }
  let dt = !main ? 19 * 60 : after ? Math.max(lt + 180, 19 * 60) : Math.max(e + (lateEnd ? 30 : 45), 18 * 60 + 30);
  const ab = { id: 'ab', name: 'Abendessen', t: Math.min(dt, SLEEP - 60), kind: 'ab', variant: tpl.dinner };
  if (lateEnd && !after) ab.name = 'Abendessen (nach der Halle, fettarm)';
  slots.push(ab);

  // Mittag verpasst und Training rückt näher → leicht vorher, groß danach
  if (main && !main.flex && !after && !done('mi') && now >= s - PRE_BIG && now < e) {
    mi.t = e + 30; mi.after = true; mi.swapped = true;
    mi.name = 'Große Mahlzeit nach dem Training';
    if (!done('ab')) {
      if (now <= s - PRE_LIGHT) { ab.t = now; ab.variant = 'quark'; ab.light = true; ab.name = 'Leichte Mahlzeit vor dem Training'; }
      else ab.merged = true;
    }
  }
  // Training vorbei, Mittag und Abend beide offen → zu einer Mahlzeit zusammenlegen (nicht zu viel vor dem Schlafen)
  if (main && now >= e && !done('mi') && !done('ab')) { ab.merged = true; mi.t = Math.max(mi.t, e + 30); mi.after = true; mi.name = 'Große Mahlzeit nach dem Training'; }
  // Sobald das Training vorbei ist, Vorher-Snacks, die nicht gegessen wurden, streichen
  slots.forEach(x => { if (((x.kind === 'sn' && x.snack === 'pre') || x.kind === 'wa') && main && now >= e && !done(x.id)) x.merged = true; });
  // Snack „vor oder direkt nach“ dem Gym: nie überfällig, rutscht notfalls direkt hinter das Training
  slots.forEach(x => { if (x.kind === 'sn' && x.snack !== 'pre' && !done(x.id)) x.t = now < s ? Math.max(x.t, now) : now < e ? e : now; });
  slots.forEach(x => { if (x.kind === 'zw' && main && now > s - PRE_BIG && !done(x.id)) x.merged = true; });
  if (main && now >= e && !done('mi') && ab.merged) mi.mergedDinner = true;
  if (mi.after && lateEnd != null && mi.t >= lateEnd) mi.noFat = true;
  if (ab.light === undefined && lateEnd != null && ab.t >= lateEnd) ab.noFat = true;

  slots = slots.filter(x => !x.merged).sort((a, b) => a.t - b.t);
  slots.forEach(x => { x.t = Math.min(x.t, SLEEP - 30); });
  return { slots, ctx, T, tpl, sess, main };
}

// ---------- Zusammensetzung einer Mahlzeit ----------
function compose(slot, day, ch) {
  const { tpl } = day;
  switch (slot.kind) {
    case 'fr': return [{ f: 'hafer', g: 120 }, { f: 'skyr', g: 200 }, { f: 'whey', g: 30 }, { f: 'apfel200', n: 1 }, { f: 'beeren', g: 150 }, { f: 'schoko', g: 20 }, { f: 'zimt', g: 0 }];
    case 'mi': {
      let p = ch.mi_p || 'haehnchen';
      if (slot.noFat && p === 'lachs') p = 'haehnchen';
      const items = [{ f: ch.mi_c || 'reis', g: tpl.lunch, sc: { min: tpl.lunch - 50, max: Math.max(tpl.lunch + 50, 210), step: 10 } }, { f: p, g: 200 }, { f: 'gemuese', g: 300 }];
      if (p !== 'lachs' && !slot.noFat) items.push({ f: 'oel', g: 5 });
      return items;
    }
    case 'zw': return [{ f: 'apfel', n: 1 }];
    case 'sn':
      if (slot.snack === 'bh') return [{ f: 'banane', n: 1 }, { f: 'honig', g: 15 }];
      return [{ f: 'maiswaffel', n: 5, sc: { min: 3, max: 7, step: 1 } }, { f: 'honig', g: 20 }, { f: 'banane', n: 1 }];
    case 'wa': return (ch[slot.id] || 'mw') === 'da' ? [{ f: 'datteln', g: 40 }] : [{ f: 'maiswaffel', n: 3 }, { f: 'banane', n: 1 }];
    case 'rad': return (ch.rad || 'da') === 'gr' ? [{ f: 'griess', g: 100 }] : [{ f: 'datteln', g: 50 }];
    case 'ab': {
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
function optionsFor(slot, ch) {
  if (slot.kind === 'mi') return [
    { key: 'mi_c', label: 'Kohlenhydrate', val: ch.mi_c || 'reis', opts: [['reis', 'Reis'], ['nudeln', 'Nudeln']] },
    { key: 'mi_p', label: 'Protein', val: ch.mi_p || 'haehnchen', opts: [['haehnchen', 'Hähnchen'], ['hack', 'Rinderhack'], ...(slot.noFat ? [] : [['lachs', 'Lachs']])] }
  ];
  if (slot.kind === 'ab' && slot.variant !== 'eier') return [
    { key: 'ab_p', label: 'Protein', val: ch.ab_p || 'quark', opts: [['quark', 'Magerquark'], ['skyrA', 'Skyr'], ['frischkaese', 'Körniger Frischkäse']] },
    { key: 'ab_c', label: 'Beilage', val: ch.ab_c || 'toast', opts: [['toast', 'Toast'], ['mehrkorn', 'Mehrkornbrot'], ['reiswaffel', 'Reiswaffeln']] }
  ];
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
  rem.forEach(x => { x.items = compose(x, day, st.choice); x.te = Math.max(x.t, now); });
  rem.forEach(x => { if (x.mergedDinner && (tpl.P - total0(eaten, rem)[1]) > 25) x.items.push({ f: 'quark', g: 250, fill: 'p' }); });
  const total = () => rem.reduce((s, x) => add(s, sumItems(x.items)), eaten);
  function total0(e0, r) { return r.reduce((s, x) => add(s, sumItems(x.items)), e0); }
  const Cmid = (tpl.C[0] + tpl.C[1]) / 2, Fmid = (tpl.F[0] + tpl.F[1]) / 2;
  const isCarbFill = it => it.fill === 'c';

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
    for (let i = 0; i < 20 && sumItems(x.items)[0] > LATE_CAP; i++) {
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

function bars(p) {
  const { tpl, total, eaten } = p;
  const rows = [
    ['Kalorien', eaten[0], total[0], Math.round(tpl.kcal * 0.97 / 10) * 10, Math.round(tpl.kcal * 1.03 / 10) * 10, 'kcal'],
    ['Kohlenhydrate', eaten[2], total[2], tpl.C[0], tpl.C[1], 'g'],
    ['Protein', eaten[1], total[1], tpl.P, tpl.P, 'g'],
    ['Fett', eaten[3], total[3], tpl.F[0], tpl.F[1], 'g']
  ];
  return `<div class="panel"><h3>Heute</h3>${rows.map(([n, e, t, lo, hi, u]) => {
    const max = hi * 1.15, w1 = Math.min(100, e / max * 100), w2 = Math.min(100, t / max * 100);
    const ok = t >= lo * 0.95 && t <= hi * (n === 'Protein' ? 1.2 : 1.08);
    const tgt = lo === hi ? `${lo}` : `${lo}–${hi}`;
    return `<div class="bar"><div class="bar-h"><span>${n}</span><span><b>${Math.round(e)}</b> / ${tgt} ${u}</span></div>
      <div class="track"><i class="plan" data-w="${w2}%" style="width:${w2}%"></i><i class="eat" data-w="${w1}%" style="width:${w1}%"></i><s style="left:${lo / max * 100}%;width:${(hi - lo) / max * 100 || 0.6}%"></s></div>
      <div class="bar-f ${ok ? 'good' : 'warn'}">mit Plan: ${Math.round(t)} ${u}${ok ? '' : (t < lo ? ' · reicht heute nicht ganz' : ' · etwas drüber')}</div></div>`;
  }).join('')}</div>`;
}

function itemsHtml(items) {
  return `<ul class="ing">${items.filter(it => !FOOD[it.f].free || true).map(it => `<li class="${it.fill ? 'fill' : ''}"><span>${label(it)}</span>${it.fill ? `<em>${it.fill === 'p' ? 'statt Abendbrot' : 'Auffüller'}</em>` : ''}</li>`).join('')}</ul>`;
}

// ---------- Extra gegessen (+ Snack, Freitext) ----------
// Grobe Schätzung über Größe und Art; Claude kann den Freitext später genauer auswerten.
const SN_SIZE = [[150, 'Klein', 'z. B. Riegel, Obst'], [300, 'Mittel', 'z. B. Brötchen, Eis'], [500, 'Groß', 'z. B. Döner-Hälfte, Kuchen'], [800, 'Mahlzeit', 'z. B. Mensa, Pizza']];
const SN_KIND = { suess: ['Süß', [.05, .55, .40]], herzhaft: ['Herzhaft', [.15, .40, .45]], protein: ['Eiweißreich', [.40, .35, .25]], getraenk: ['Getränk', [0, 1, 0]] };
let snd = null;
const snMacros = (kcal, kind) => { const [p, c, f] = SN_KIND[kind][1]; return [kcal, kcal * p / 4, kcal * c / 4, kcal * f / 9]; };
function snackSheet() {
  return `<h3>Extra gegessen</h3>
    <div class="lbl2">Was war's?</div>
    <input id="snTxt" class="txtin" type="text" placeholder="z. B. Croissant vom Bäcker" value="${esc(snd.txt || '')}" autocomplete="off" enterkeyhint="done">
    <div class="lbl2">Wie viel ungefähr?</div>
    <div class="chips">${SN_SIZE.map(([k, l, ex]) => `<button class="chip big sz${snd.kcal === k ? ' on' : ''}" data-act="snsz" data-v="${k}"><b>${l}</b><small>~${k} kcal · ${ex}</small></button>`).join('')}</div>
    <div class="lbl2">Eher …</div>
    <div class="chips">${Object.entries(SN_KIND).map(([k, [l]]) => `<button class="chip${snd.kind === k ? ' on' : ''}" data-act="snk" data-v="${k}">${l}</button>`).join('')}</div>
    <button class="cta" data-act="snsave"${snd.kcal ? '' : ' disabled'}>Eintragen</button>
    <p class="mini">Die restlichen Mahlzeiten von heute passen sich automatisch an.</p>`;
}

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
  const overdue = p.slots.find(x => !st.log[x.id] && x.t < now - 30 && p.rem.includes(x));
  if (overdue) {
    h += `<div class="panel ask"><div class="ask-q">Hast du ${overdue.kind === 'fr' ? 'dein Frühstück' : 'die Mahlzeit „' + esc(overdue.name) + '“'} (${hm(overdue.t)}) schon gegessen?</div>
      <div class="ask-b"><button class="chip big" data-act="log" data-id="${overdue.id}" data-st="eaten">Ja, wie geplant</button>
      <button class="chip big" data-act="log" data-id="${overdue.id}" data-st="half">Nur die Hälfte</button>
      <button class="chip big" data-act="notyet" data-id="${overdue.id}">Noch nicht</button>
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
    </div>`;
  }

  h += `<button class="ghost" data-act="snack" style="width:100%;margin:0 0 12px">+ Snack / extra gegessen</button>`;
  h += bars(p);

  // Restlicher Tag
  if (p.rem.length > 1) {
    h += `<div class="panel"><h3>Danach</h3>${p.rem.slice(1).map(x => {
      const m = sumItems(x.items);
      return `<div class="tl"><div class="tl-t">${hm(x.t)}</div><div class="tl-b"><b>${esc(x.name)}</b><span>${x.items.filter(i => !FOOD[i.f].free).map(label).join(', ')}</span><small>${Math.round(m[0])} kcal</small></div></div>`;
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
      ${ex.map((x, i) => `<div class="tl"><div class="tl-t">${hm(x.at)}</div><div class="tl-b"><b>${esc(x.txt || 'Snack')}</b><span>extra · ~${x.kcal} kcal · ${SN_KIND[x.kind][0]}</span></div><button class="undo" data-act="snundo" data-i="${i}">Rückgängig</button></div>`).join('')}</div>`;
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
  if (act === 'snack') { snd = { txt: '', kcal: null, kind: 'herzhaft' }; Shell.sheet(snackSheet()); Shell.buzz(); setTimeout(() => { const i = document.getElementById('snTxt'); if (i) i.focus(); }, 450); return true; }
  if (act === 'snsz') { snd.kcal = +b.dataset.v; Shell.sheet(snackSheet()); Shell.buzz(); return true; }
  if (act === 'snk') { snd.kind = b.dataset.v; Shell.sheet(snackSheet()); Shell.buzz(); return true; }
  if (act === 'snsave') {
    if (!snd || !snd.kcal) return true;
    st.extra = st.extra || []; st.extra.push({ at: now, txt: (snd.txt || '').trim().slice(0, 80), kcal: snd.kcal, kind: snd.kind, m: snMacros(snd.kcal, snd.kind) });
    store(st); snd = null; Shell.closeSheet(); Shell.toast('Snack eingetragen'); Shell.buzz(); Shell.refresh(); return true;
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
