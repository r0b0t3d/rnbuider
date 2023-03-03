/* eslint-disable no-negated-condition */
import { Command, flags } from '@oclif/command';
import * as shell from 'shelljs';
import * as inquirer from 'inquirer';
import { getDirectories } from '../utils/common';

inquirer.registerPrompt(
  'checkbox-plus',
  require('inquirer-checkbox-plus-prompt'),
);

export default class OneSignalCertificate extends Command {
  static description = 'Create and upload push cerfiticate to One Signal';

  static examples = [
    `$ rnbuilder onesignal
    Create and upload push certificate to One Signal from ./src/commands/onesignal.ts!
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
    const { flags } = this.parse(OneSignalCertificate);
    const params = await this.askForMissingFields(flags);
    const { client } = params;
    shell.exec('bundle install');
    if (client) {
      shell.cd(`fastlane/clients/${client}`);
    }
    shell.exec('bundle exec fastlane sync_onesignal');
  }
}
