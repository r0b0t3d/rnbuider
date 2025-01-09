/* eslint-disable no-negated-condition */
import { Command, flags } from '@oclif/command';
import * as shell from 'shelljs';
import * as inquirer from 'inquirer';
import { getDirectories } from '../utils/common';

inquirer.registerPrompt(
  'checkbox-plus',
  require('inquirer-checkbox-plus-prompt'),
);
export default class FirebaseSyncUDIDs extends Command {
  static description = 'Sync device UDIDs from firebase';

  static examples = [
    `$ rnbuilder sync-udids
    Sync device UDIDs from firebase from ./src/firebase-sync-udids.ts!
`,
  ];

  static flags = {
    help: flags.help({ char: 'h' }),
    client: flags.string({
      char: 'c',
      description: 'Select client that you want to sync udids',
    }),
  };

  static args = [{ name: 'build' }];

  askForMissingFields = async (flags: any) => {
    const questions = [];
    if (!flags.client) {
      const clients = getDirectories('./fastlane/clients');
      if (clients.length > 0) {
        questions.push({
          type: 'checkbox-plus',
          name: 'client',
          message: 'What is the client?',
          pageSize: 100,
          highlight: true,
          searchable: true,
          default: [],
          source: (answersSoFar: string, input: string) => {
            input = input || '';
            return new Promise(resolve => {
              const result = clients.filter(client =>
                client.includes(input.toLowerCase()),
              );
              resolve(result);
            });
          },
          validate: (input: string[]) => {
            return new Promise(resolve => {
              if (input.length === 0) {
                resolve('You need to select at least 1 client');
              } else {
                resolve(true);
              }
            });
          },
        });
      }
    }
    let result = flags;
    if (questions.length > 0) {
      const answers = await inquirer.prompt(questions);
      result = {
        ...flags,
        ...answers,
      };
    }
    return result;
  };

  async run() {
    const { flags } = this.parse(FirebaseSyncUDIDs);
    const params = await this.askForMissingFields(flags);
    const { client } = params;
    shell.cd('fastlane');
    shell.exec('bundle install');
    if (client) {
      client.forEach((c: string) => {
        shell.cd(`clients/${c}`);
        shell.exec('bundle exec fastlane sync_udids');
        shell.cd('../..');
      });
    } else {
      shell.exec('bundle exec fastlane sync_udids');
    }
  }
}
