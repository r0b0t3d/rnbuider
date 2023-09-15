/* eslint-disable no-negated-condition */
import { Command } from '@oclif/command';
import * as shell from 'shelljs'

export default class Initialize extends Command {
  static description = 'Initialize the environment for first run';

  static examples = [
    `$ rnbuilder initialize
initialize environment for first run from ./src/initialize.ts!
`,
  ];

  static flags = {};

  static args = [];

  async run() {
    shell.cd('~')
    shell.exec(`curl --remote-name https://raw.githubusercontent.com/monfresh/install-ruby-on-macos/master/install-ruby
    /usr/bin/env bash install-ruby 2>&1 | tee ~/laptop.log`)
    this.warn('You need to open new termial window to apply your changes')
  }
}
