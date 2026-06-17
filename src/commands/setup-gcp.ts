import { Command, flags } from '@oclif/command';
import { spawnSync } from 'child_process';
import * as path from 'path';

export default class SetupGcp extends Command {
  static description = 'Setup GCP service account impersonation';

  static flags = {
    help: flags.help({ char: 'h' }),
  };

  async run() {
    const scriptPath = path.join(__dirname, '../../scripts/setup_gcp_impersonation.sh');
    const result = spawnSync('bash', [scriptPath], { stdio: 'inherit' });
    if (result.status !== 0) {
      this.exit(result.status ?? 1);
    }
  }
}
