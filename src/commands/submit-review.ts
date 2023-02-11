/* eslint-disable no-negated-condition */
import { Command, flags } from '@oclif/command';
import * as shell from 'shelljs';
import * as inquirer from 'inquirer';
import { getAppVersion, getDirectories } from '../utils/common';
i;
nquirer.registerPrompt(
  'checkbox-plus',
  require('inquirer-checkbox-plus-prompt'),
);
export default class SubmitReview extends Command {
  static description = 'Submit ios for review';

  static examples = [
    `$ rnbuilder submit-review
    Push changes to existing apps ./src/firebase-sync-udids.ts!
`,
  ];

  static flags = {
    help: flags.help({ char: 'h' }),
    client: flags.string({
      char: 'c',
      description: 'Select client that you want to push update',
    }),
  };

  static args = [{ name: 'submit-review' }];

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
    const { flags } = this.parse(SubmitReview);
    const params = await this.askForMissingFields(flags);
    const { client, target } = params;
    if (client) {
      client.forEach((c: string) => {
        const appVersion = getAppVersion('prod', client, target);
        shell.cd(`fastlane/clients/${c}`);
        shell.exec('pwd');
        shell.exec(
          `bundle exec fastlane ios submit_review app_version:${appVersion.version} build_number:${appVersion.build}`,
        );
        shell.cd('../../..');
        shell.exec('pwd');
      });
    } else {
      const appVersion = getAppVersion('prod', client, target);
      shell.cd('fastlane');
      shell.exec(
        `bundle exec fastlane ios submit_review app_version:${appVersion.version} build_number:${appVersion.build}`,
      );
    }
  }
}
