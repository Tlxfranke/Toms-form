// Sync: schickt den App-Stand (alle tf-*-Einträge) an den privaten Cloudflare-Dienst und holt ihn bei Bedarf zurück.
// Zugangscode wird einmal in der Datenzentrale eingefügt und nur auf diesem Gerät gespeichert.
(function () {
'use strict';
const URL_DEFAULT = 'https://toms-form-sync.tlh-franke.workers.dev';
const CFG = 'tf-sync';
const SKIP = [CFG, 'tf-schedule'];
const isData = k => k && k.startsWith('tf-') && !SKIP.includes(k);

const rawGet = Storage.prototype.getItem, rawSet = Storage.prototype.setItem;
const cfg = () => { try { return JSON.parse(rawGet.call(localStorage, CFG)) || {}; } catch (e) { return {}; } };
const saveCfg = c => { try { rawSet.call(localStorage, CFG, JSON.stringify(c)); } catch (e) {} };

let timer = null, pulled = false, status = { state: 'idle', at: 0, msg: '' };
const setStatus = (state, msg) => { status = { state, at: Date.now(), msg: msg || '' }; const el = document.getElementById('syncStatus'); if (el) el.textContent = statusText(); };

// Jede Änderung an App-Daten merken und gebündelt hochladen
Storage.prototype.setItem = function (k, v) {
  rawSet.call(this, k, v);
  // Erst nach dem ersten Abgleich als Änderung zählen – sonst würde ein frisches Gerät mit seinen Start-Einstellungen die Cloud überschreiben
  if (this === localStorage && isData(k) && k !== 'tf-gate' && pulled) { const fast = updateGate(); const c = cfg(); c.changed = Date.now(); saveCfg(c); schedule(fast); }
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
      Object.entries(remote.data).forEach(([k, v]) => { if (isData(k)) rawSet.call(localStorage, k, v); });
      const c2 = cfg(); c2.changed = remote.updated; c2.synced = remote.updated; saveCfg(c2);
      setStatus('ok');
      window.Shell && Shell.refresh();
    } else if (localChanged > (remote.updated || 0)) push();
    else setStatus('ok');
    pulled = true;
  } catch (e) { setStatus('error', 'offline'); }
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
    <div class="row2"><button class="ghost" data-sync="now">Jetzt sichern</button><button class="ghost" data-sync="disconnect">Trennen</button></div></div>`;
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
    await pull();
    if (status.state === 'error') { const c2 = cfg(); delete c2.token; saveCfg(c2); Shell.toast(status.msg || 'Verbindung fehlgeschlagen'); }
    else { await push(); Shell.toast('Sync aktiv'); }
  } else if (a === 'now') { await push(); Shell.toast(status.state === 'ok' ? 'Gesichert' : 'Nicht gesichert'); }
  else if (a === 'disconnect') { const c = cfg(); delete c.token; saveCfg(c); Shell.toast('Sync getrennt'); }
  Shell.buzz(); Shell.refresh();
  return true;
}

window.Sync = { panel, click, push, pull };
if (!cfg().token) pulled = true;
addEventListener('load', () => setTimeout(() => pull(), 800));
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') pull(); else if (cfg().changed > (cfg().synced || 0)) push(); });
addEventListener('online', () => pull());
})();
