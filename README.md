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

## Fortschritt & Recovery (`training.js`) – getrennte Bereiche
- **Fortschritt (Gym):** Einheit starten (Oberkörper/Beine), je Übung Sätze per Regler: Gewicht, Wdh., Reserve-Wdh. (RIR). Auswertung: geschätztes 1RM je Übung (Epley inkl. RIR) mit Veränderung zu den Wochen davor, harte Sätze je Muskelgruppe (7 Tage).
- **Recovery:** Intensitätsabfrage nach jeder Einheit (RPE 1–10, Dauer; Badminton zusätzlich Schwerpunkt, Einzel/Doppel, Spiele, Beine, Beschwerden). Belastung = Minuten × RPE, 7 Tage vs. Ø 4 Wochen. Morgen-Check (Schlaf, Frische, Muskelkater, Stress, Stimmung, Beschwerden). Felder für Garmin (Schlaf, Ruhepuls, HRV, Body Battery) und Polar H10 (Puls, Zonen, TRIMP, Puls-Erholung).
- Speicher: `tf-gym`, `tf-rec` (localStorage)
