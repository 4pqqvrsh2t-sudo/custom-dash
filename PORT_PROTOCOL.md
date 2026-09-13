# Surface Port — external sensors

The Port tab is a read-only Web Serial client, not a firmware flasher or a universal socket detector. It reads one device you explicitly select. It does not write serial commands, scan networks, or upload sensor data. Opening a serial port can reset some development boards.

## First connection

1. Use Chrome on your Chromebook or another host exposing Web Serial. Open the dashboard directly, not inside the viewport test iframe. If the API is absent or blocked, the Connect button is disabled or an explanatory error is shown.
2. Back up existing ESP32 firmware. Open `esp32/SurfacePort/SurfacePort.ino` in your normal ESP32 Arduino programming workflow, choose your exact board, and upload. Native-USB ESP32 boards may require board-specific USB CDC settings. This starter has not been compiled or physically tested on your board.
3. Close the programming tool's serial monitor. Plug in a USB data cable, open Port, select 115200, and tap Connect ESP32 / Serial. Select only your intended board in the browser's device picker.
4. Confirm DEVICE ONLINE, the board's self-reported identity, increasing packet count, and `board_uptime`. Uptime is real board status, not an attached sensor.
5. Add a sensor library/read function to your sketch. Send its name, numeric reading, and unit using the format below. It appears automatically in Port without changing the dashboard.

No GPIO pins are assumed; ESP32 variants and sensors differ. Check your exact board/sensor wiring and voltage requirements. Do not connect vehicle 12 V or CAN wiring directly to the board. This client does not control vehicle systems.

## Packet format

UTF-8 JSON, one complete packet per newline, at most 4096 characters per line. Send identification and updates about once a second. Values become STALE after five seconds without fresh data. Sensors and power have independent freshness timers. Disconnect leaves last sensor readings explicitly stale. A new connection clears previous readings.

```json
{"type":"hello","protocol":"surface-port/1","device":"ESP32","firmware":"my-sensors-1.0"}
{"type":"sensors","values":[{"id":"temperature","value":23.5,"unit":"C"}]}
{"type":"power","usb_present":true}
```

These numbers are format examples, not measurements. A sensor packet replaces the whole sensor list; send all current channels together. Maximum 24 channels, unique IDs of 1–32 letters/digits/underscores/hyphens, finite numeric values within ±1e9, units up to 12 characters. Empty arrays clear the list. Unsupported or malformed lines increment REJECTED LINES. Oversized lines are discarded through their newline. Boot logs may therefore increase that counter without preventing later valid packets.

Only send `power` if firmware actually senses USB power; omit it otherwise. USB VID/PID identifies the USB interface, not necessarily the ESP32 behind a USB-UART chip. Device and firmware names are self-reported, not authenticated hardware identity. Valid sensor packets without a hello remain DATA / UNIDENTIFIED.

## What is and is not detected

| Readout | Source / limitation |
| --- | --- |
| Data link | Serial port this page successfully opened, with waiting, live, stale and closed states |
| Sensor channels | Valid serial packets only; never blended into the simulated driving gauges |
| Host battery/power | Browser Battery API report when available; may use platform defaults |
| Charging cable | Not detectable here; battery charging is not evidence of a particular wired charger |
| ESP32 USB power | Firmware report requiring actual sensing hardware; otherwise NOT REPORTED |
| AUX, dash USB sockets, arbitrary Bluetooth devices | Not inventoried by this web build |

iPhone and unsupported hosts need a native or compatible network bridge for sensor access; that bridge is not implemented here. Android head-unit support must be tested before choosing its transport. Port is designed around a reusable packet format for that later integration, not a claim that every browser can open USB.

Packet validation in the Port tab checks format only; it never changes connection state or inserts test values into live readings.

Reference: [Chrome Web Serial documentation](https://developer.chrome.com/docs/capabilities/serial), [Battery Status API](https://developer.mozilla.org/en-US/docs/Web/API/Battery_Status_API).

## Local checks

Run `node tests/port-protocol.test.js`. The tests cover validation, malformed data, bounds, route clipping and the starter's packet format. Physical serial transport, sensor calibration and device audio still require hardware testing.
