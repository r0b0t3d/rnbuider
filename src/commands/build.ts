/* eslint-disable operator-linebreak */
/* eslint-disable complexity */
/* eslint-disable no-negated-condition */
import { Command, flags } from '@oclif/command';
import * as inquirer from 'inquirer';
import * as shell from 'shelljs';
import {
  buildKeyValuePairs,
  getDirectories,
  getFastlaneConfigs,
  getJsonFile,
} from '../utils/common';

inquirer.registerPrompt(
  'checkbox-plus',
  require('inquirer-checkbox-plus-prompt'),
);

export default class Build extends Command {
  static description = 'Build react native apps';

  static examples = [
    `$ rnbuilder build
hello world from ./src/build.ts!
`,
  ];

  static flags = {
    help: flags.help({ char: 'h' }),
    client: flags.string({
      char: 'c',
      description: 'Set client that you want to build app',
    }),
    target: flags.string({
      char: 't',
      description: 'Set the build target: android, ios or both',
      options: ['android', 'ios', 'both'],
    }),
    env: flags.string({
      char: 'e',
      description: 'Set the environment: prod, staging, dev',
    }),
    branch: flags.string({
      char: 'b',
      description: 'Set the source branch used to build the app',
    }),
    version: flags.string({
      char: 'v',
      description: 'Set the version number for this build',
    }),
    installr: flags.string({
      char: 'i',
      description: 'If enabled, the build will be uploaded to installR',
    }),
    distribute: flags.string({
      char: 'd',
      description: 'Specify where to distribute app',
    }),
    firebase: flags.boolean({
      char: 'f',
      description: 'If enabled, the build will be uploaded to firebase',
    }),
    testersIos: flags.string({
      char: 't',
      description: 'Tester ids for iOS distribution',
    }),
    testersAndroid: flags.string({
      char: 'u',
      description: 'Tester ids for Android distribution',
    }),
    ignore_git_reset: flags.boolean({
      char: 'g',
      description: 'Ignore git reset when building',
    }),
    ignore_cleanup: flags.boolean({
      char: 's',
      description: 'Ignore cleanup when building',
    }),
    groupsIos: flags.string({
      description: 'Groups ids for iOS distribution',
    }),
    groupsAndroid: flags.string({
      description: 'Groups ids for Android distribution',
    }),
    skipCheckVersion: flags.boolean({
      description: 'Skip checking current version on stores',
    }),
  };

  static args = [{ name: 'build' }];

  askForMissingFields = async (flags: any) => {
    const fastlaneConfigs = getFastlaneConfigs();
    let questions = [];
    if (!flags.client) {
      const clients = getDirectories('./fastlane/clients');
      if (clients.length > 0) {
        const appVersions = require(process.cwd() + '/app.json');
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
              const result = clients
                .map(
                  client =>
                    `${client}${
                      appVersions[client]?.name
                        ? ` - ${appVersions[client]?.name}`
                        : ''
                    }`,
                )
                .filter(client =>
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
      }
    }
    if (!flags.target) {
      questions.push({
        type: 'checkbox',
        name: 'target',
        message: 'What is the build target?',
        default: ['android', 'ios'],
        choices: ['android', 'ios'],
      });
    }
    if (!flags.env) {
      questions.push({
        type: 'list',
        name: 'env',
        message: 'What is the environment?',
        choices: fastlaneConfigs.env ?? ['dev', 'staging', 'prod'],
        filter(val: string) {
          return val.toLowerCase();
        },
      });
    }
    if (!flags.branch) {
      questions.push({
        type: 'list',
        name: 'branch',
        message: 'What is the source branch?',
        default: '',
        choices: ['', ...(fastlaneConfigs.branches ?? ['dev', 'master'])],
        filter(val: string) {
          return val.toLowerCase();
        },
      });
    }
    let result = flags;
    if (questions.length > 0) {
      const answers = await inquirer.prompt(questions);
      result = {
        ...flags,
        ...answers,
      };
    }
    questions = [];
    if (result.env === 'prod' && !flags.distribute) {
      questions.push({
        type: 'list',
        name: 'distribute',
        message: 'What would you like to distribute to?',
        default: 'store',
        choices: ['store', 'firebase'],
        filter(val: string) {
          return val.toLowerCase();
        },
      });
      const answers = await inquirer.prompt(questions);
      result = {
        ...result,
        ...answers,
        firebase: answers.distribute === 'firebase',
      };
    }
    const postQuestions = [];
    if (result.env !== 'prod') {
      if (!flags.firebase) {
        postQuestions.push({
          type: 'confirm',
          name: 'firebase',
          message: 'Would you like to upload to firebase?',
          default: true,
        });
      }
      if (process.env.INSTALLR_TOKEN) {
        postQuestions.push({
          type: 'confirm',
          name: 'installr',
          message: 'Would you like to upload to installr?',
          default: true,
        });
      }
    } else if (result.distribute === 'store' && !flags.version) {
      postQuestions.push({
        type: 'list',
        name: 'version',
        message: 'What is the version bump?',
        choices: ['patch', 'minor', 'major'],
        validate: (input: string) => {
          if (!input) {
            return 'You need to specify the version';
          }
          return true;
        },
      });
    }
    if (postQuestions.length > 0) {
      const answers = await inquirer.prompt(postQuestions);
      result = {
        ...result,
        ...answers,
        distribute: answers.firebase ? 'firebase' : result.distribute,
      };
    }
    if (
      result.installr ||
      (result.distribute !== 'store' &&
        result.firebase &&
        !flags.groupsIos &&
        !flags.groupsAndroid)
    ) {
      const testersAnswer = await inquirer.prompt([
        {
          type: 'expand',
          name: 'testers',
          message: 'Add testers to download the app?',
          choices: [
            {
              key: 'g',
              name: 'Test groups',
              value: 'groups',
            },
            {
              key: 't',
              name: 'Tester emails',
              value: 'testers',
            },
            {
              key: 'n',
              name: 'No',
              value: 'no-tester',
            },
          ],
          default: 'no-tester',
        },
      ]);
      if (testersAnswer.testers) {
        if (testersAnswer.testers !== 'no-tester') {
          const androidBuild = result.target.includes('android');
          const iosBuild = result.target.includes('ios');
          const bothPlatforms = androidBuild && iosBuild;
          const name = `${testersAnswer.testers}${
            androidBuild ? 'Android' : 'Ios'
          }`;
          const answers = await inquirer.prompt([
            {
              type: 'input',
              name,
              message:
                'Please enter tester ' +
                (testersAnswer.testers === 'groups' ? 'group(s)' : 'email(s)'),
              suffix: ` for ${
                androidBuild ? 'Android' : 'iOS'
              } (separated by commas)`,
              default:
                testersAnswer.testers === 'groups'
                  ? fastlaneConfigs.testerGroups
                  : '',
            },
          ]);
          result = {
            ...result,
            ...answers,
          };
          if (bothPlatforms) {
            const anotherAnswer = await inquirer.prompt([
              {
                type: 'input',
                name: `${testersAnswer.testers}Ios`,
                message:
                  'Please enter tester ' +
                  (testersAnswer.testers === 'groups'
                    ? 'group(s)'
                    : 'email(s)'),
                suffix: ' for iOS (separated by commas)',
                default:
                  testersAnswer.testers === 'groups'
                    ? answers.groupsAndroid ?? fastlaneConfigs.testerGroups
                    : answers.testersAndroid,
              },
            ]);
            result = {
              ...result,
              ...anotherAnswer,
            };
          }
        }
      }
    }
    return result;
  };

  runPlatforms(target: string[], parameters: any, otherParams: any) {
    target.forEach((t: string) => {
      const cmd = `bundle exec fastlane ${t} build ${parameters.join(
        ' ',
      )} --env ${otherParams.env}`;
      console.log({ cmd });
      shell.exec(cmd);
    });
  }

  async run() {
    const { flags } = this.parse(Build);
    const params = await this.askForMissingFields(flags);
    const { client, target: originalTarget, ...otherParams } = params;
    let target = originalTarget;
    if (typeof target === 'string') {
      if (target === 'both') {
        target = ['ios', 'android'];
      } else {
        target = [target];
      }
    }
    const jsonFile = getJsonFile(otherParams.env);
    const parameters: any = buildKeyValuePairs({
      ...otherParams,
      json_file: jsonFile,
    });

    if (!flags.ignore_git_reset) {
      if (params.branch) {
        shell.exec(`git reset --hard && git checkout ${params.branch}`);
      }
      shell.exec('git pull');
      shell.exec('bundle update --bundler');
      shell.exec('bundle install');
    }

    // Clean fastlane builds
    shell.exec('rm -rf fastlane/builds');
    if (!flags.ignore_cleanup) {
      shell.exec('yarn install');
      // Clean android if any
      if (target.includes('android')) {
        shell.cd('./android');
        shell.exec('./gradlew clean');
        shell.exec('rm -rf .gradle');
        shell.cd('../');
      }
    }

    if (client) {
      client.forEach((cl: string) => {
        const c = cl.split(' ')[0];
        shell.cd(`fastlane/clients/${c}`);
        shell.exec('pwd');
        this.runPlatforms(target, [...parameters, `client:${c}`], otherParams);
        shell.cd('../../..');
        shell.exec('pwd');
      });
    } else {
      shell.cd('fastlane');
      this.runPlatforms(target, parameters, otherParams);
      shell.cd('..');
      shell.exec('pwd');
    }
  }
}
