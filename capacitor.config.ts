import type { CapacitorConfig } from "@capacitor/cli";

// Production shells must load the packaged, versioned web assets.
// Never grant remote preview-site content the privileged Capacitor app origin.
const config: CapacitorConfig = {
  appId: "app.lovable.6cb077ae3f124268a5d692c43dd2e85d",
  appName: "STEMCoach",
  webDir: "dist",
};

export default config;
