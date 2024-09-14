export const domain =
  {
    production: "[[APP_DOMAIN]]",
    dev: "dev.[[APP_DOMAIN]]",
  }[$app.stage] || $app.stage + ".dev.[[APP_DOMAIN]]";

export const zone = cloudflare.getZoneOutput({
  name: "[[APP_DOMAIN]]",
});
