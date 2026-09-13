# Surface Command / ED-inspired cockpit mockup

An interactive, phone-first dashboard prototype for a 2016 Nissan Frontier. Plain HTML, CSS and JavaScript; no install, build step, external assets, API keys or frameworks.

## Run

Open `index.html`, or serve this directory with `python3 -m http.server 8080`. If this repository has GitHub Pages enabled at the main-branch root, the updated interface is served there automatically.

The interface adapts to iPhone portrait and landscape viewports and safe-area insets. In Safari, Share → Add to Home Screen provides a standalone launch. No offline service worker is installed.

## Working interactions

- Four panels: cockpit, navigation, media, systems; hash links and current-tab state.
- Start, pause, resume and replay a 90-second route simulation; destination presets, zoom and recenter.
- Three synthesized ambient audio demos with playback, volume, track selection and timeline; load your own audio file for real local playback and seeking. Generated ambience has no recorded soundtrack, so its timeline is a demo timeline.
- Simulated speed and RPM; stationary mode, glow, intensity and interface sound settings saved locally when storage is available.
- Backgrounded visual simulation pauses; generated ambience stops when the page is hidden.

## Deliberate mock boundaries

The map is a hand-drawn schematic, not geographic navigation. Destination names do not change its geometry. All gauges, route distances, fuel, system integrity and diagnostic values are simulated. There is no Spotify authorization, phone integration, vehicle connection, GPS tracking or live routing. Loaded audio stays on the device and is not uploaded. Settings are local; loaded files must be selected again after reload.

Original vector artwork inspired by Elite Dangerous cockpit styling; not an official Frontier Developments product. No game screenshots or extracted game assets are bundled.

The unrelated `python-refresher/` project is preserved. The previous dashboard is recoverable through Git history before this replacement commit.
