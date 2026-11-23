# Toms Form

Persönliche Fitness- & Health-App als installierbare Web-App (PWA) fürs iPhone.

- Läuft über GitHub Pages: https://tlxfranke.github.io/toms-form/
- Installation: Link in Safari öffnen → Teilen → „Zum Home-Bildschirm“
- `index.html` – die App (Design, Navigation, Bereiche)
- `manifest.webmanifest` – Name, Icon, Vollbild
- `sw.js` – Offline-Unterstützung (bei Änderungen `VERSION` hochzählen)

## Ernährung (`nutrition.js`)
- Grundlage: Wochen-Ernährungsplan im Google Drive (Makros je Tagesart, Mahlzeiten, Supplements, Regeln)
- Vorschlag nach Uhrzeit, Abstand zum Training (große Mahlzeit ≥ 3 h vorher, leichte ≥ 90 min), Schlafenszeit 23:30 und bisher Gegessenem
- Auffüller (Öl, Nüsse, Käse, Eier, Maiswaffeln, Obst, Datteln) nur, wo die Regeln es erlauben
- `schedule.json`: Trainings aus dem Google Kalender (Typen: badminton, gymOber, gymBeine, intervalle, fahrrad, turnier)
