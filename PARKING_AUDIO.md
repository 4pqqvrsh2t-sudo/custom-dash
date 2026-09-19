# Parking and audio checks

Parking is available from Cockpit, Navigation and the expanded scanner. Enable Camera requests video-only permission, then the selector lists video devices exposed by the browser. Switching releases the previous stream; leaving Parking or hiding the page also releases it. Native analog head-unit cameras are not automatically browser cameras: those need a native bridge. The ESP-WROOM-32 pictured is configured as a 30-pin sensor-board diagram, not assumed to provide a camera or object recognition.

The parking scope shows a 5-meter display radius and the nearest reported contact in each direction. Missing measurements remain unavailable, not clear. The sensor bridge must supply measured distances; no calibrated parking guides or collision avoidance is provided.

Map mode shows roads/buildings, Road mode hides buildings and optionally shows vehicle contacts, Vehicle mode filters vehicles, and Proximity includes all target types. The expanded scanner shares mode selection and 5-meter zoom steps with the cockpit. Road geometry is still clearly labeled schematic, not a live map. Use native navigation for real map data.

The system test lasts about 16 seconds (actual scheduling depends on device load), with a compact Stop control. Test readings never enter real telemetry history.

Systems → Enable / Test Audio explicitly unlocks audio and plays a 660 Hz test tone. Web Audio now requests the playback audio-session type when supported; this may pause other apps’ audio. See https://developer.mozilla.org/en-US/docs/Web/API/AudioSession/type . This experimental API is feature-detected; it does not select the physical output. If the speaker remains silent, turn off Silent Mode, check media volume and choose iPhone rather than AirPods in the system output selector. Phone-speaker output has not been physically verified remotely.
