import type { CapacitorConfig } from "@capacitor/cli";

// Loads the live production site directly, so the Android app always shows
// the exact same data as the web URL — there is no bundled/offline copy and
// nothing to keep in sync.
const config: CapacitorConfig = {
  appId: "com.yogapratishthan.app",
  appName: "Yogapratishthan",
  webDir: "www",
  server: {
    url: "https://yogapratishthan.vercel.app",
    cleartext: false,
  },
};

export default config;
