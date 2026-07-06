import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.leitnix.app",
  appName: "leitnix",
  webDir: "dist",
  plugins: {
    SplashScreen: {
      launchShowDuration: 0,
    },
    // Add this block below to enable native network requests
    CapacitorHttp: {
      enabled: true,
    },
  },
};

export default config;
