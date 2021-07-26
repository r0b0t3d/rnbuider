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
        default: 'staging',
        choices: ['staging', 'adhoc', 'prod'],
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
    const postQuestions = []
    if (result.env !== 'prod') {
      postQuestions.push({
        type: 'confirm',
        name: 'installr',
        message: 'Would you like to upload to installr?',
        default: true,
      })
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

      if (result.installr) {
        const testersAnswers = await inquirer.prompt([{
          type: 'input',
          name: 'testers',
          message: 'Add tester(s)to download the app',
          suffix: ' (emails separated by commas)',
        }])
        result = {
          ...result,
          testers: testersAnswers.testers.replace(/\s+/g, ''),
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
        appVersions[result.client][result.target] = newVersion
      } else {
        appVersions[result.target] = newVersion
      }
      const json = JSON.stringify(appVersions, null, 2)
      fs.writeFileSync(process.cwd() + '/app.json', json)
    }
    return result
  };

  async run() {
    const {flags} = this.parse(Build)
    const params = await this.askForMissingFields(flags)
    const {client, target, env, ...otherParams} = params
    const parameters = buildKeyValuePairs(otherParams)
    shell.cd('fastlane')
    shell.exec('bundle update --bundler')
    shell.exec('bundle install')
    shell.exec('bundle update fastlane')
    if (client) {
      shell.cd(`clients/${client}`)
    }
    shell.exec(`bundle exec fastlane ${target} ${env} ${parameters.join(' ')}`)
  }
}
