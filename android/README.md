# Android head-unit preparation

Preview app source. Not yet compiled, installed, or tested on the Q91 unit. Requires Android 8+ with a working current WebView and internet to load the hosted dashboard. It is an ordinary app and does not replace the default launcher or flash head-unit firmware.

Open this `android` directory in Android Studio with JDK 17, Android SDK 35 and Gradle 8.9 (AGP 8.7.3). Build the debug APK via Android Studio or `gradle :app:assembleDebug` from this directory. There is no bundled Gradle wrapper. The APK output is `app/build/outputs/apk/debug/app-debug.apk`. Install only after checking the actual Android API level on the head unit.

The app's ORIGINAL DASH button opens Android's current default Home app. Keep the original radio launcher as the default. If the original interface is a separate proprietary activity instead of Home, its actual package/component is needed to target it.

ENABLE RETURN BUTTON adds a notification with RETURN TO COCKPIT. Android 13+ asks for notification permission. The original launcher also has a Surface Command app icon. Notification availability varies by head-unit firmware; this is not a floating button over other apps and does not request overlay access. If notifications are unavailable, use that app icon to return.

This shell now passes trusted GitHub Pages camera and geolocation requests through Android runtime permissions. GPS speed still depends on the head unit having a usable location provider; cargo camera support depends on its camera/WebView implementation. It does not yet supply native USB/serial, background audio, file upload or guaranteed speech synthesis. The Web Serial Port client may be unavailable in Android WebView. ESP32/OBD access still needs a native USB bridge or compatible network bridge; neither is implemented in this shell. Do not treat this as finished vehicle integration.

Before installation, obtain the head unit's actual Android API level and identify the original launcher. Verify home/return switching, display bounds, audio, standby/wake and rear-camera takeover while parked. Do not update MCU/Android firmware as part of this app installation.
