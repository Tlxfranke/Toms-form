// Sync: schickt den App-Stand (alle tf-*-Einträge) an den privaten Cloudflare-Dienst und holt ihn bei Bedarf zurück.
// Zugangscode wird einmal in der Datenzentrale eingefügt und nur auf diesem Gerät gespeichert.
(function () {
'use strict';
const URL_DEFAULT = 'https://toms-form-sync.tlh-franke.workers.dev';
const CFG = 'tf-sync';
const SKIP = [CFG, 'tf-schedule'];
const isData = k => k && k.startsWith('tf-') && !SKIP.includes(k);
const BAK = 'tfbak'; // Sicherheitskopie des Gerätestands vor jedem Überschreiben durch die Cloud (kein tf-Präfix → wird nicht synchronisiert)

const rawGet = Storage.prototype.getItem, rawSet = Storage.prototype.setItem;
const cfg = () => { try { return JSON.parse(rawGet.call(localStorage, CFG)) || {}; } catch (e) { return {}; } };
const saveCfg = c => { try { rawSet.call(localStorage, CFG, JSON.stringify(c)); } catch (e) {} };

let timer = null, pulled = false, status = { state: 'idle', at: 0, msg: '' };
const setStatus = (state, msg) => { status = { state, at: Date.now(), msg: msg || '' }; const el = document.getElementById('syncStatus'); if (el) el.textContent = statusText(); };

// Jede Änderung an App-Daten merken und gebündelt hochladen
Storage.prototype.setItem = function (k, v) {
  rawSet.call(this, k, v);
  // Erst nach dem ersten Abgleich als Änderung zählen – sonst würde ein frisches Gerät mit seinen Start-Einstellungen die Cloud überschreiben
  // Ohne Zugangscode nichts als Änderung merken – sonst wirkt ein frisches Gerät „neuer“ als die Cloud und überschreibt sie beim Verbinden
  if (this === localStorage && isData(k) && k !== 'tf-gate' && pulled && cfg().token) { const fast = updateGate(); const c = cfg(); c.changed = Date.now(); saveCfg(c); schedule(fast); }
};
function schedule(fast) { clearTimeout(timer); timer = setTimeout(push, fast ? 400 : 2500); }

// Status für die Handy-Sperre: Gewicht + Morgen-Supplemente, Mobility – wird mitsynchronisiert
const pad = n => String(n).padStart(2, '0');
const dkey = () => { const d = new Date(); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; };
const MORNING_SUPPS = ['kreatin', 'd3k2'];
function gateNow() {
  const t = dkey(), j = k => { try { return JSON.parse(rawGet.call(localStorage, k)) || {}; } catch (e) { return {}; } };
  const body = j('tf-body'), day = j('tf-day-' + t), mob = j('tf-mob');
  return { d: t, weight: !!(body.w && body.w[t] != null), supps: MORNING_SUPPS.every(id => day.supps && day.supps[id]), mobility: !!(mob.done && mob.done[t]) };
}
function updateGate() {
  const g = JSON.stringify(gateNow()), old = rawGet.call(localStorage, 'tf-gate');
  if (g !== old) { rawSet.call(localStorage, 'tf-gate', g); return true; }
  return false;
}

function collect() {
  updateGate();
  const data = {};
  for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (isData(k)) data[k] = rawGet.call(localStorage, k); }
  return data;
}
const ready = () => { const c = cfg(); return c.token && /^https?:\/\//.test(c.url || URL_DEFAULT); };
const endpoint = () => (cfg().url || URL_DEFAULT).replace(/\/$/, '') + '/state';

async function push() {
  if (!ready() || !navigator.onLine || !pulled) return;
  const c = cfg(), updated = c.changed || Date.now();
  setStatus('busy');
  try {
    const r = await fetch(endpoint(), { method: 'PUT', headers: { 'Authorization': 'Bearer ' + c.token, 'Content-Type': 'application/json' }, body: JSON.stringify({ updated, device: navigator.platform || '', data: collect() }) });
    if (r.status === 401) return setStatus('error', 'Zugangscode falsch');
    if (r.status === 409) { await pull(true); return; }
    if (!r.ok) return setStatus('error', 'Fehler ' + r.status);
    const c2 = cfg(); c2.synced = updated; saveCfg(c2); setStatus('ok');
  } catch (e) { setStatus('error', 'offline'); }
}

async function pull(force) {
  if (!ready() || !navigator.onLine) { if (!cfg().token) pulled = true; return; }
  const c = cfg();
  try {
    const r = await fetch(endpoint(), { headers: { 'Authorization': 'Bearer ' + c.token } });
    if (r.status === 401) return setStatus('error', 'Zugangscode falsch');
    if (!r.ok) return setStatus('error', 'Fehler ' + r.status);
    const remote = await r.json();
    const localChanged = c.changed || 0;
    if (remote.updated && remote.data && (force || remote.updated > localChanged)) {
      backupLocal(remote.data);
      Object.entries(remote.data).forEach(([k, v]) => { if (isData(k)) rawSet.call(localStorage, k, v); });
      const c2 = cfg(); c2.changed = remote.updated; c2.synced = remote.updated; saveCfg(c2);
      setStatus('ok');
      window.Shell && Shell.refresh();
    } else if (localChanged > (remote.updated || 0)) push();
    else setStatus('ok');
    pulled = true;
  } catch (e) { setStatus('error', 'offline'); }
}

// Vor dem Überschreiben den bisherigen Gerätestand sichern (nur wenn sich echte Tagesdaten vom Cloud-Stand unterscheiden)
function backupLocal(remoteData) {
  const local = {};
  for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (isData(k) && k !== 'tf-gate') local[k] = rawGet.call(localStorage, k); }
  // Start-Einstellungen eines frischen Geräts brauchen keine Sicherheitskopie
  const differs = Object.keys(local).some(k => k.startsWith('tf-day-') && local[k] !== remoteData[k]);
  if (!differs) return;
  try { rawSet.call(localStorage, BAK, JSON.stringify({ at: Date.now(), data: local })); } catch (e) {}
}
const backup = () => { try { return JSON.parse(rawGet.call(localStorage, BAK)); } catch (e) { return null; } };
async function restoreBackup() {
  const b = backup();
  if (!b || !b.data) return false;
  Object.keys(b.data).forEach(k => rawSet.call(localStorage, k, b.data[k]));
  updateGate();
  const c = cfg(); c.changed = Date.now(); saveCfg(c);
  pulled = true;
  await push();
  if (status.state === 'ok') { try { localStorage.removeItem(BAK); } catch (e) {} }
  return status.state === 'ok';
}

function statusText() {
  const c = cfg();
  if (!c.token) return 'Noch nicht verbunden';
  if (status.state === 'busy') return 'Synchronisiere …';
  if (status.state === 'error') return 'Nicht synchronisiert: ' + status.msg;
  if (c.synced) { const d = new Date(c.synced); return 'Gesichert · ' + d.toLocaleDateString('de-DE', { day: 'numeric', month: 'short' }) + ', ' + d.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }); }
  return 'Verbunden';
}

function panel() {
  const c = cfg();
  if (!c.token) return `<div class="panel"><h3>Sync & Sicherung</h3>
    <p class="mini">Einmal den Zugangscode einfügen (steht im privaten Repo toms-form-data unter setup/app-token.txt). Danach wird alles automatisch gesichert.</p>
    <input id="syncTok" class="txtin" type="text" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="Zugangscode einfügen">
    <button class="cta rc" data-sync="connect">Verbinden</button></div>`;
  return `<div class="panel"><h3>Sync & Sicherung</h3>
    <p class="mini" id="syncStatus">${statusText()}</p>
    <div class="row2"><button class="ghost" data-sync="now">Jetzt sichern</button><button class="ghost" data-sync="disconnect">Trennen</button></div>
    ${bakHtml()}</div>`;
}
function bakHtml() {
  const b = backup();
  if (!b || !b.at) return '';
  const d = new Date(b.at), when = d.toLocaleDateString('de-DE', { day: 'numeric', month: 'short' }) + ', ' + d.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
  return `<p class="mini" style="margin-top:12px">Der Stand dieses Geräts wurde am ${when} durch den Cloud-Stand ersetzt. Falls dabei etwas verloren ging, kannst du ihn zurückholen – er wird dann auf allen Geräten übernommen.</p>
    <button class="cta rc" data-sync="restore">Stand dieses Geräts wiederherstellen</button>`;
}

async function click(e) {
  const b = e.target.closest('[data-sync]');
  if (!b) return false;
  const a = b.dataset.sync;
  if (a === 'connect') {
    const t = (document.getElementById('syncTok') || {}).value || '';
    if (t.trim().length < 20) { Shell.toast('Zugangscode unvollständig'); return true; }
    const c = cfg(); c.token = t.trim(); saveCfg(c);
    Shell.toast('Verbinde …');
    // Neues Gerät: immer erst den Cloud-Stand übernehmen (eigener Stand bleibt als Sicherheitskopie)
    await pull(!c.synced);
    if (status.state === 'error') { const c2 = cfg(); delete c2.token; saveCfg(c2); Shell.toast(status.msg || 'Verbindung fehlgeschlagen'); }
    else { await push(); Shell.toast('Sync aktiv'); }
  } else if (a === 'now') { await push(); Shell.toast(status.state === 'ok' ? 'Gesichert' : 'Nicht gesichert'); }
  else if (a === 'restore') { Shell.toast('Stelle wieder her …'); const ok = await restoreBackup(); Shell.toast(ok ? 'Wiederhergestellt & gesichert' : 'Wiederherstellen fehlgeschlagen'); }
  else if (a === 'disconnect') { const c = cfg(); delete c.token; saveCfg(c); Shell.toast('Sync getrennt'); }
  Shell.buzz(); Shell.refresh();
  return true;
}

// Apple-Watch-Werte (vom Kurzbefehl an den Dienst geschickt) holen und in tf-rec einsortieren
async function watchPull() {
  if (!ready() || !navigator.onLine || !pulled) return;
  try {
    const r = await fetch((cfg().url || URL_DEFAULT).replace(/\/$/, '') + '/watch', { headers: { 'Authorization': 'Bearer ' + cfg().token } });
    if (!r.ok) return;
    const w = await r.json();
    if (!w || !w.days) return;
    let rec; try { rec = JSON.parse(rawGet.call(localStorage, 'tf-rec')) || { days: {} }; } catch (e) { rec = { days: {} }; }
    rec.days = rec.days || {};
    let changed = false;
    Object.entries(w.days).forEach(([d, v]) => {
      const cur = rec.days[d] || {};
      if (!cur.watch || cur.watch.at !== v.at) { rec.days[d] = { ...cur, watch: v }; changed = true; }
    });
    // Trainings (Puls/kcal je Einheit)
    try {
      const r2 = await fetch((cfg().url || URL_DEFAULT).replace(/\/$/, '') + '/workout', { headers: { 'Authorization': 'Bearer ' + cfg().token } });
      const wl = r2.ok ? await r2.json() : null;
      (wl && wl.list || []).forEach(x => {
        const cur = rec.days[x.d] || {}, wo = cur.wo || [];
        if (wo.some(y => y.id === x.id && y.kcal === x.kcal && y.min === x.min)) return;
        rec.days[x.d] = { ...cur, wo: wo.filter(y => y.id !== x.id).concat([x]).sort((p, q) => p.id - q.id) };
        changed = true;
      });
    } catch (e) {}
    if (changed) { localStorage.setItem('tf-rec', JSON.stringify(rec)); window.Shell && Shell.refresh(); }
  } catch (e) {}
}

window.Sync = { panel, click, push, pull, watchPull };
if (!cfg().token) pulled = true;
addEventListener('load', () => setTimeout(() => pull().then(watchPull), 800));
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') pull().then(watchPull); else if (cfg().changed > (cfg().synced || 0)) push(); });
addEventListener('online', () => pull());
})();
