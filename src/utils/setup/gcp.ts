import { spawnSync } from 'child_process';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { getFastlaneConfigs } from '../common';

const ADC_DIR = path.join(os.homedir(), '.config/gcloud');

// Impersonated ADC files created by scripts/setup_gcp_impersonation.sh
export const listAdcFiles = () =>
  fs.existsSync(ADC_DIR)
    ? fs
        .readdirSync(ADC_DIR)
        .filter(file => /^adc_.+\.json$/.test(file))
        .sort()
        .map(file => `~/.config/gcloud/${file}`)
    : [];

export const runGcpSetup = () => {
  const gcp = getFastlaneConfigs().gcp ?? {};
  const scriptPath = path.join(
    __dirname,
    '../../../scripts/setup_gcp_impersonation.sh',
  );
  return spawnSync('bash', [scriptPath], {
    stdio: 'inherit',
    env: {
      ...process.env,
      GCP_PROJECT_ID: gcp.projectId ?? '',
      GCP_USER_EMAIL: gcp.userEmail ?? '',
      GCP_SERVICE_ACCOUNTS: (gcp.serviceAccounts ?? []).join(','),
    },
  }).status;
};
