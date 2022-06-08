/* eslint-disable no-negated-condition */
import {Command, flags} from '@oclif/command'
import * as shell from 'shelljs'
import * as inquirer from 'inquirer'
import {getAppVersion, getDirectories} from '../utils'

export default class CodePush extends Command {
  static description = 'Push changes to existing apps';

  static examples = [
    `$ rnbuilder codepush
    Push changes to existing apps ./src/firebase-sync-udids.ts!
`,
  ];

  static flags = {
    help: flags.help({char: 'h'}),
    client: flags.string({char: 'c', description: 'Select client that you want to push update'}),
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
    if (!flags.env) {
      questions.push({
        type: 'list',
        name: 'env',
        message: 'What is the environment?',
        default: 'staging',
        choices: ['staging', 'prod'],
        filter(val: string) {
          return val.toLowerCase()
        },
      })
    }
    if (!flags.target) {
      questions.push({
        type: 'list',
        name: 'target',
        message: 'What is the platform?',
        // default: 'both',
        choices: ['android', 'ios'],
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
    return result
  }

  async run() {
    const {flags} = this.parse(CodePush)
    const params = await this.askForMissingFields(flags)
    const {client, target, env} = params
    let envPath = 'fastlane'
    if (client) {
      envPath += `/clients/${client}/fastlane`
    }
    const appVersion = getAppVersion(env, client, target)
    require('dotenv').config({path: process.cwd() + '/' + envPath + '/.env'})

    const project = target === 'ios' ? process.env.CODE_PUSH_IOS_PROJECT : process.env.CODE_PUSH_ANDROID_PROJECT
    shell.exec(`appcenter codepush release-react -a ${project} -d ${env === 'staging' ? 'Staging' : 'Production'} --target-binary-version ${appVersion.version} --token ${process.env.CODE_PUSH_TOKEN}`)
  }
}
