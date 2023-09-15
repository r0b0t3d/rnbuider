/* eslint-disable no-negated-condition */
import { Command, flags } from '@oclif/command';
import * as shell from 'shelljs';
import { getDirectories } from '../utils/common';

export default class MatchNuke extends Command {
  static description = 'Nuke certificates';

  static examples = [
    `$ rnbuilder match-check
    Nuke certificates ./src/match-check.ts!
`,
  ];

  static flags = {
    help: flags.help({ char: 'h' }),
    client: flags.string({
      char: 'c',
      description: 'Select client that you want to sync udids',
    }),
  };

  static args = [{ name: 'match-check' }];

  async run() {
    const clients = getDirectories('./fastlane/clients');
    clients.forEach(client => {
      const envPath = `fastlane/clients/${client}/fastlane`;
      require('dotenv').config({
        path: process.cwd() + '/' + envPath + '/.env',
      });
      shell.cd(envPath);
      shell.exec('bundle exec fastlane match_check');
      shell.cd('../../../../');
    });
  }
}
