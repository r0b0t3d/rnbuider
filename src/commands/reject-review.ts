/* eslint-disable no-negated-condition */
import { Command, flags } from '@oclif/command';
import * as shell from 'shelljs';
import { getDirectories } from '../utils/common';
import * as inquirer from 'inquirer';

inquirer.registerPrompt(
  'checkbox-plus',
  require('inquirer-checkbox-plus-prompt'),
);

export default class RejectReview extends Command {
  static description = 'Reject current App Store review version (In Review or Pending Developer Release)';

  static examples = [
    `$ rnbuilder reject-review
`,
  ];

  static flags = {
    help: flags.help({ char: 'h' }),
    client: flags.string({
      char: 'c',
      description: 'Select client to reject App Store review version',
    }),
  };

  static args = [{ name: 'reject-review' }];

  async run() {
    const clients = getDirectories('./fastlane/clients');
    if (clients.length > 0) {
      const questions = [];
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
            const filtered = clients.filter(client =>
              client.toLowerCase().includes(input.toLowerCase()),
            );
            resolve(['all', ...filtered]);
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
      const answers = await inquirer.prompt(questions);
      const selectedClients = answers.client.includes('all') ? clients : answers.client;
      if (selectedClients.length > 0) {
        selectedClients.forEach((c: string) => {
          const envPath = `./fastlane/clients/${c}/fastlane`;
          shell.exec('pwd');
          shell.cd(envPath);
          shell.exec('bundle exec fastlane ios reject_review');
          shell.cd('../../../../');
          shell.exec('pwd');
        });
      }
    } else {
      shell.cd('fastlane');
      shell.exec('bundle exec fastlane ios reject_review');
    }
  }
}
