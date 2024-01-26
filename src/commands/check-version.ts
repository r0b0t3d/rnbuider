/* eslint-disable no-negated-condition */
import { Command, flags } from '@oclif/command';
import * as shell from 'shelljs';
import {
  buildKeyValuePairs,
  getDirectories,
  getJsonFile,
} from '../utils/common';

export default class MatchNuke extends Command {
  static description = 'Check live versions';

  static examples = [
    `$ rnbuilder check-version
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
    const jsonFile = getJsonFile('prod');
    const parameters: any = buildKeyValuePairs({
      json_file: jsonFile,
    });
    clients.forEach(client => {
      const envPath = `fastlane/clients/${client}/fastlane`;
      shell.cd(envPath);
      shell.exec(`bundle exec fastlane check_version ${parameters.join(' ')}`);
      shell.cd('../../../../');
      shell.exec('pwd');
    });
  }
}
