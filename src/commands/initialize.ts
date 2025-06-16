/* eslint-disable no-negated-condition */
import { Command } from '@oclif/command';
import * as shell from 'shelljs';

export default class Initialize extends Command {
  static description = 'Initialize the environment for first run';

  static examples = [
    `$ rnbuilder initialize
initialize environment for first run from ./src/initialize.ts!
`,
  ];

  static flags = {};

  static args = [];

  async run() {
    // Get the project root directory
    const projectRoot = __dirname + '/../..';
    shell.cd(projectRoot);

    shell.chmod('+x', './scripts/setup_dev_env.sh');
    const result = shell.exec('./scripts/setup_dev_env.sh');
    if (result.code !== 0) {
      this.error('Failed to setup environment');
    }
    this.warn('You need to open new termial window to apply your changes');
  }
}
