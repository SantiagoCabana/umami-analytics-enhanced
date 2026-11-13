// Enhanced is private by default. Enabling Umami telemetry requires an explicit opt-in.
/** @param {{ DISABLE_TELEMETRY?: string, ENABLE_UMAMI_TELEMETRY?: string }} env */
export function isTelemetryDisabled(env = process.env) {
  return !!env.DISABLE_TELEMETRY || env.ENABLE_UMAMI_TELEMETRY !== '1';
}
