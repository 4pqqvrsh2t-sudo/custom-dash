# Surface Command / ED-inspired dashboard

An interactive, phone-first dashboard under development for a 2016 Nissan Frontier. Plain HTML, CSS and JavaScript; no web build step, embedded API keys or frameworks.

## Run

Open `index.html`, or serve this directory with `python3 -m http.server 8080`. If this repository has GitHub Pages enabled at the main-branch root, the updated interface is served there automatically.

The interface adapts to iPhone portrait and landscape viewports and safe-area insets. In Safari, Share → Add to Home Screen provides a standalone launch. No offline service worker is installed.

## Working interactions

- Cockpit, navigation, data, radio, Spotify, cargo, proximity, port and systems panels with edge-swipe navigation.
- Start, pause, resume and replay a 90-second route simulation; destination presets, zoom and recenter.
- Three synthesized ambient audio demos with playback, volume, track selection and timeline; load your own audio file for real local playback and seeking. Generated ambience has no recorded soundtrack, so its timeline is a demo timeline.
- Permission-gated GPS speed input, exact MPH-to-m/s or km/s conversion, measured-data history, and a validated external telemetry bridge. Missing inputs display as unavailable.
- Parked-gated cargo camera capture, verified categorized inventory stored locally, and an injectable vision-analyzer bridge. No recognition provider or API key is bundled.
- Backgrounded visual simulation pauses; generated ambience stops when the page is hidden.

## Deliberate mock boundaries

The HTML map and route are still a clearly labeled layout demonstration, not live navigation. The Android build now opens a real Mapbox map with build-time token injection; destination search, guidance, map-matched posted limits and the location puck remain explicitly unavailable until their native callbacks are implemented and road-tested. GPS speed is measured when permission and a usable device fix are available; it can be noisy and is not a substitute for the factory speedometer. RPM, coolant, fuel, gear and other vehicle channels stay blank until an OBD/ESP32/native bridge supplies verified values. Cargo recognition remains unavailable until a real vision provider is connected, and every suggestion requires confirmation. There is no Spotify authorization. Loaded audio and captured cargo frames are not uploaded by this build. Settings and the verified cargo manifest are local; loaded audio files must be selected again after reload.

Original vector artwork inspired by Elite Dangerous cockpit styling; not an official Frontier Developments product. No game screenshots or extracted game assets are bundled.

The unrelated `python-refresher/` project is preserved. The previous dashboard is recoverable through Git history before this replacement commit.
