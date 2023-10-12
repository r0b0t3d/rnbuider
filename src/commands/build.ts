/* eslint-disable operator-linebreak */
/* eslint-disable complexity */
/* eslint-disable no-negated-condition */
import { Command, flags } from '@oclif/command';
import * as inquirer from 'inquirer';
import * as shell from 'shelljs';
import { buildKeyValuePairs, getDirectories } from '../utils/common';

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
      options: ['android', 'ios'],
    }),
    env: flags.string({
      char: 'e',
      description: 'Set the environment: prod, adhoc, staging',
      options: ['staging', 'adhoc', 'prod'],
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
    ignore_git_reset: flags.boolean({
      char: 'g',
      description: 'Ignore git reset when building',
    }),
    ignore_cleanup: flags.boolean({
      char: 's',
      description: 'Ignore cleanup when building',
    }),
  };

  static args = [{ name: 'build' }];

  askForMissingFields = async (flags: any) => {
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
                      appVersions[client].name
                        ? ` - ${appVersions[client].name}`
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
        default: 'internal',
        choices: ['internal', 'staging', 'prod'],
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
        default: 'dev',
        choices: ['dev', 'master'],
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
    if (result.env === 'prod') {
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
      postQuestions.push({
        type: 'confirm',
        name: 'firebase',
        message: 'Would you like to upload to firebase?',
        default: true,
      });
      if (process.env.INSTALLR_TOKEN) {
        postQuestions.push({
          type: 'confirm',
          name: 'installr',
          message: 'Would you like to upload to installr?',
          default: true,
        });
      }
    } else if (result.distribute === 'store') {
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
      };
    }
    if (result.installr || result.firebase) {
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
                default: answers.testersAndroid,
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

  getJsonFile(env: string) {
    let fileName = 'app';
    if (env !== 'prod') {
      fileName = `${fileName}.${env}`;
    }
    const file = process.cwd() + `/${fileName}.json`;
    return file;
  }

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
    const { client, target, ...otherParams } = params;
    const jsonFile = this.getJsonFile(otherParams.env);
    const parameters: any = buildKeyValuePairs({
      ...otherParams,
      json_file: jsonFile,
    });

    if (!flags.ignore_git_reset) {
      shell.exec(
        `git reset --hard && git checkout ${params.branch} && git pull`,
      );
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
        shell.cd('../');
      }
      if (target.includes('ios')) {
        shell.exec('npx pod-install');
      }
    }

    if (client) {
      client.forEach((c: string) => {
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
