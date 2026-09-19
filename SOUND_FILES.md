# Custom sound checklist

Load files in **Systems → Custom Sound Files**. Choose an event, select an audio file, and use Preview. Each slot is optional; missing files keep their synthesized default. Restore Default removes that event's custom file. Files are saved locally in this browser when storage is available; they do not transfer automatically to the Android dash. Keep your originals.

WAV or MP3 recommended. Suggested durations below are creative targets, not requirements. Maximum 8 MB each; loops up to 30 seconds and other cues up to 15 seconds. Give short cues little or no leading silence; make loops seamless. Export the names below for easy organization; assignment uses the selected event, not the filename.

| Filename | Used for | Suggested length |
|---|---|---|
| ui-tap.wav | Buttons and tab changes | 0.05–0.15 s |
| ui-zoom.wav | Map/scanner zoom controls | 0.1–0.2 s |
| ui-port.wav | Port controls | 0.15–0.3 s |
| ui-engage.wav | Route engage control | 0.3–0.6 s |
| ui-lock.wav | Radio signal lock / confirmation | 0.2–0.4 s |
| radar-arrival.wav | New target / group appears | 0.1–0.2 s |
| radar-departure.wav | Target / group leaves; distinct from arrival | 0.1–0.2 s |
| sensor-info.wav | Informational disconnect | 0.15–0.3 s |
| sensor-warning.wav | Lost sensor input | 0.3–0.5 s |
| sensor-critical.wav | Lost important input (e.g. speed/coolant feed) | 0.4–0.7 s |
| boot-hum.wav | Startup background loop | 4–10 s, seamless |
| boot-module.wav | A startup module finishes its check | 0.2–0.4 s |
| boot-ready.wav | Final startup module completes | 0.6–1.2 s |
| idle-hum.wav | Electrical background when music is inactive | 5–15 s, seamless |
| radio-scan.wav | Radio tuning scan loop | 1–3 s, seamless |
| commission-rumble.wav | Commissioning power-bus charge and low mechanical bed | 4–12 s, seamless |
| commission-vent.wav | Pressure purge / steam discharge | 0.6–1.5 s |
| commission-pass.wav | Final integrity confirmation | 0.5–1.2 s |
| voice-start.wav | “Starting route.” | Natural spoken length |
| voice-resume.wav | “Resuming route.” | Natural spoken length |
| voice-pause.wav | “Route paused.” | Natural spoken length |
| voice-arrive.wav | “Destination reached. Route complete.” | Natural spoken length |
| voice-online.wav | “Voice interface online.” | Natural spoken length |

There are **18 effects/loops plus 5 optional voice clips**. Radar sounds retain grouping, cooldown and repeated-target muting. Interface and voice preferences still apply; test previews deliberately play the selected file. Audio needs a user gesture to unlock. The idle loop plays quietly and stops while music is active. Sensor tones report data loss, not a diagnosis of mechanical failure. Backup Radio music remains a separate upload feature.

# Display stress test

Systems → Run Commissioning Sequence / Parked opens a full-screen pre-flight sequence. It charges the power bus, purges the pressure manifold, aligns every scanner renderer, fills the perception scope with 25 moving tracks, sweeps speed and RPM instruments, checks navigation, enumerates the ESP32 interface, verifies camera and audio routes, and finishes with an integrity pass. These are synthetic display loads, not vehicle measurements. Chart samples remain separate from recorded driving data. The speed dial spans 0–160 MPH to display the full test range. Abort remains available throughout the sequence.

Cancel, completion, page hiding or received vehicle motion restores real telemetry, the original speed-limit display and prior pin-preview state. This is a visual/audio software test, not a hardware qualification test.
