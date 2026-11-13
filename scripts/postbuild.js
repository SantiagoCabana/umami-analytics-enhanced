import 'dotenv/config';
import { isTelemetryDisabled } from '../src/lib/telemetry-policy.js';
import { sendTelemetry } from './telemetry.js';

async function run() {
  if (!isTelemetryDisabled()) {
    await sendTelemetry('build');
  }
}

run();
