/* eslint-disable no-negated-condition */
import {Command, flags} from '@oclif/command'
import * as shell from 'shelljs'
import * as inquirer from 'inquirer'
import {getDirectories} from '../utils'

export default class MatchNuke extends Command {
  static description = 'Nuke certificates';

  static examples = [
    `$ rnbuilder match-nuke
    Nuke certificates ./src/match-nuke.ts!
`,
  ];

  static flags = {
    help: flags.help({char: 'h'}),
    client: flags.string({char: 'c', description: 'Select client that you want to sync udids'}),
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
    const {flags} = this.parse(MatchNuke)
    const params = await this.askForMissingFields(flags)
    const {client} = params
    let envPath = 'fastlane'
    if (client) {
      envPath += `/clients/${client}/fastlane`
    }
    require('dotenv').config({path: process.cwd() + '/' + envPath + '/.env'})
    shell.cd('fastlane')
    const command = `bundle exec fastlane run match_nuke type:adhoc username:${process.env.APPLE_ID} team_id:${process.env.APPLE_TEAM_ID} git_url:${process.env.MATCH_GIT_URL} git_branch:${process.env.CLIENT} app_identifier:${process.env.APP_IDENTIFIER}.staging`
    console.log({command})
  }
}
