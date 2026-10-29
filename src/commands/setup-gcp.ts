import { Command, flags } from '@oclif/command';
import { runGcpSetup } from '../utils/setup/gcp';

export default class SetupGcp extends Command {
  static description = 'Setup GCP service account impersonation';

  static flags = {
    help: flags.help({ char: 'h' }),
  };

  async run() {
    const status = runGcpSetup();
    if (status !== 0) {
      this.exit(status ?? 1);
    }
  }
}
