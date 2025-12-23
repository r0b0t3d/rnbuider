/* eslint-disable no-negated-condition */
import { Command, flags } from '@oclif/command';
import * as shell from 'shelljs';
import { getDirectories } from '../utils/common';
import * as inquirer from 'inquirer';

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
            const result = clients.filter(client =>
              client.toLowerCase().includes(input.toLowerCase()),
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
      const answers = await inquirer.prompt(questions);
      if (answers.client.length > 0) {
        answers.client.forEach((c: string) => {
          const envPath = `./fastlane/clients/${c}/fastlane`;
          shell.exec('pwd');
          shell.cd(envPath);
          shell.exec('bundle exec fastlane match_check');
          shell.cd('../../../../');
          shell.exec('pwd');
        });
      }
    } else {
      shell.cd('fastlane');
      shell.exec('bundle exec fastlane match_check');
    }
  }
}
