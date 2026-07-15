import { Command, flags } from '@oclif/command';
import { spawnSync } from 'child_process';
import * as path from 'path';
import { getFastlaneConfigs } from '../utils/common';

export default class SetupGcp extends Command {
  static description = 'Setup GCP service account impersonation';

  static flags = {
    help: flags.help({ char: 'h' }),
  };

  async run() {
    const configs = getFastlaneConfigs();
    const gcp = configs.gcp ?? {};

    const scriptPath = path.join(__dirname, '../../scripts/setup_gcp_impersonation.sh');
    const result = spawnSync('bash', [scriptPath], {
      stdio: 'inherit',
      env: {
        ...process.env,
        GCP_PROJECT_ID: gcp.projectId ?? '',
        GCP_USER_EMAIL: gcp.userEmail ?? '',
        GCP_SERVICE_ACCOUNTS: (gcp.serviceAccounts ?? []).join(','),
      },
    });
    if (result.status !== 0) {
      this.exit(result.status ?? 1);
    }
  }
}
