/* eslint-disable complexity */
/* eslint-disable no-negated-condition */
import {Command, flags} from '@oclif/command'
import * as inquirer from 'inquirer'
import * as shell from 'shelljs'
import {buildKeyValuePairs, getAppVersion, getDirectories} from '../utils'
import * as fs from 'fs'

export default class Build extends Command {
  static description = 'Build react native apps'

  static examples = [
    `$ rnbuilder build
hello world from ./src/build.ts!
`,
  ]

  static flags = {
    help: flags.help({char: 'h'}),
    client: flags.string({char: 'c', description: 'Set client that you want to build app'}),
    target: flags.string({char: 't', description: 'Set the build target: android, ios or both', options: ['android', 'ios']}),
    env: flags.string({char: 'e', description: 'Set the environment: prod, adhoc, staging', options: ['staging', 'adhoc', 'prod']}),
    branch: flags.string({char: 'b', description: 'Set the source branch used to build the app'}),
    version: flags.string({char: 'v', description: 'Set the version number for this build'}),
    installr: flags.string({char: 'i', description: 'If enabled, the build will be uploaded to installR'}),
  }

  static args = [{name: 'build'}]

  askForMissingFields = async (flags: any) => {
    const questions = []
    if (!flags.client) {
      const clients = getDirectories('./fastlane/clients')
      if (clients.length > 0) {
        questions.push({
          type: 'list',
          name: 'client',
          message: 'What is the client?',
          choices: clients,
        })
      }
    }
    if (!flags.target) {
      questions.push({
        type: 'list',
        name: 'target',
        message: 'What is the build target?',
        // default: 'both',
        choices: ['android', 'ios'],
      })
    }
    if (!flags.env) {
      questions.push({
        type: 'list',
        name: 'env',
        message: 'What is the environment?',
        default: 'internal',
        choices: ['internal', 'staging', 'prod'],
        filter(val: string) {
          return val.toLowerCase()
        },
      })
    }
    if (!flags.branch) {
      questions.push({
        type: 'list',
        name: 'branch',
        message: 'What is the source branch?',
        default: 'dev',
        choices: ['dev', 'master'],
        filter(val: string) {
          return val.toLowerCase()
        },
      })
    }
    let result = flags
    if (questions.length > 0) {
      const answers = await inquirer.prompt(questions)
      result = {
        ...flags,
        ...answers,
      }
    }
    if (result.branch) {
      shell.exec(`git checkout ${result.branch} && git pull --rebase`)
    }
    const postQuestions = []
    if (result.env !== 'prod') {
      let envPath = 'fastlane'
      if (result.client) {
        envPath += `/clients/${result.client}/fastlane`
      }

      require('dotenv').config({path: process.cwd() + '/' + envPath + '/.env'})

      if (process.env.FIREBASE_SERVICE_ACCOUNT_FILE) {
        postQuestions.push({
          type: 'confirm',
          name: 'firebase',
          message: 'Would you like to upload to firebase?',
          default: true,
        })
      }
      if (process.env.INSTALLR_TOKEN) {
        postQuestions.push({
          type: 'confirm',
          name: 'installr',
          message: 'Would you like to upload to installr?',
          default: true,
        })
      }
    } else {
      const appVersion = getAppVersion(result.client, result.target)
      postQuestions.push({
        type: 'input',
        name: 'version_number',
        message: 'What is the version number?',
        suffix: appVersion ? ` (latest: ${appVersion.version})` : ' (e.g: 1.0.0)',
        validate: (input: string) => {
          if (!input) {
            return 'You need to specify the version'
          }
          return true
        },
      })
    }
    if (postQuestions.length > 0) {
      const answers = await inquirer.prompt(postQuestions)
      result = {
        ...result,
        ...answers,
      }

      if (result.installr || result.firebase) {
        const testersAnswer = await inquirer.prompt([{
          type: 'expand',
          name: 'testers',
          message: 'Add testers to download the app?',
          choices: [{
            key: 'g',
            name: 'Test groups',
            value: 'groups',
          }, {
            key: 't',
            name: 'Tester emails',
            value: 'testers',
          }, {
            key: 'n',
            name: 'No',
            value: 'no-tester',
          }],
          default: 'no-tester',
        }])
        if (testersAnswer.testers) {
          if (testersAnswer.testers !== 'no-tester') {
            const answers = await inquirer.prompt([{
              type: 'input',
              name: 'testers',
              message: 'Please enter tester ' + (testersAnswer.testers === 'groups' ? 'group(s)' : 'email(s)'),
              suffix: ' (separated by commas)',
            }])
            result = {
              ...result,
              [testersAnswer.testers]: answers.testers,
            }
          }
        }
      }

      const appVersion = getAppVersion(result.client, result.target)
      const newVersion = {
        ...appVersion,
        build: appVersion.build + 1,
        buildDate: new Date().toDateString(),
      }
      if (result.version_number) {
        newVersion.version = result.version_number
      }
      const appVersions = require(process.cwd() + '/app.json')
      if (result.client) {
        appVersions[result.client] = {
          ...appVersions[result.client],
          [result.target]: newVersion,
        }
      } else {
        appVersions[result.target] = newVersion
      }
      const json = JSON.stringify(appVersions, null, 2)
      fs.writeFileSync(process.cwd() + '/app.json', json)
      shell.exec('git add . && git commit -m "bump version" && git push')
    }
    return result
  };

  async run() {
    const {flags} = this.parse(Build)
    const params = await this.askForMissingFields(flags)
    const {client, target, ...otherParams} = params
    const parameters = buildKeyValuePairs(otherParams)
    shell.cd('fastlane')
    shell.exec('bundle update --bundler')
    shell.exec('bundle install')
    shell.exec('bundle update fastlane')
    shell.exec('bundle update cocoapods')
    if (client) {
      shell.cd(`clients/${client}`)
    }
    shell.exec(`bundle exec fastlane ${target} build ${parameters.join(' ')} --env ${otherParams.env}`)
  }
}
