/* eslint-disable complexity */
/* eslint-disable no-negated-condition */
import { Command, flags } from '@oclif/command';
import * as inquirer from 'inquirer';
import * as path from 'path';
import { prepareAppIcon } from '../utils/setup/app-icon';
import { prepareLaunchScreen } from '../utils/setup/launch-screen';
import { createClientConfig } from '../utils/setup/client';
import {
  readEnvVars,
  saveEnvValues,
  setEnvValue,
  updateServiceDomain,
} from '../utils/env';
import { getAppleTeam } from '../utils/setup/apple';
import { prepareOneSignal } from '../utils/setup/onesignal';
import { capitalize, copyDir } from '../utils/common';
import { setupFastlane } from '../utils/setup/fastlane';

export default class Setup extends Command {
  static description = 'Setup new client';

  static examples = [
    `$ rnbuilder build
hello world from ./src/setup.ts!
`,
  ];

  static flags = {
    help: flags.help({ char: 'h' }),
  };

  static args = [{ name: 'setup' }];

  async run() {
    const envVars = readEnvVars(
      path.join(process.cwd(), 'template/env.template'),
    );

    const questions = [
      {
        type: 'input',
        name: 'client',
        message: 'What is client name (slug)?',
        validate: (input: string[]) => {
          return new Promise(resolve => {
            if (!input) {
              resolve('You need to input client');
            } else {
              resolve(true);
            }
          });
        },
      },
    ];
    const { client } = await inquirer.prompt(questions);
    const { bundleId, applicationId, appName } = await createClientConfig(
      client,
    );
    setEnvValue('CLIENT', client, envVars);
    setEnvValue('BUNDLE_ID', bundleId, envVars);
    setEnvValue('APPLICATION_ID', applicationId, envVars);
    const deeplinkHost = envVars.DEEP_LINK_HOST.value.replace(
      '[client]',
      client,
    );
    setEnvValue('DEEP_LINK_HOST', deeplinkHost, envVars);

    const { appleTeamId, itcTeamId } = await getAppleTeam();
    if (appleTeamId) {
      setEnvValue('APPLE_TEAM_ID', appleTeamId, envVars);
    }

    const iosAssetFolder = path.join(
      process.cwd(),
      `/ios/edular/assets/${client}`,
    );
    const androidAssetFolder = path.join(
      process.cwd(),
      `/android/app/src/${client}/res`,
    );
    // Create client env files
    // shell.exec(`mkdir configs/${client}`);
    await prepareAppIcon({
      iosAssetFolder,
    });
    const { launchScreen, launchScreenColor } = await prepareLaunchScreen({
      iosAssetFolder,
      androidAssetFolder,
    });
    if (launchScreen) {
      setEnvValue(
        'LAUNCH_SCREEN',
        launchScreen === 'icon' ? 'IconBootSplash' : 'FullScreenBootSplash',
        envVars,
      );
    }
    if (launchScreenColor) {
      setEnvValue('LAUNCH_SCREEN_BACKGROUND_COLOR', launchScreenColor, envVars);
    }

    // Onesignal
    const { onesignal } = await prepareOneSignal();
    if (onesignal) {
      setEnvValue('ONESIGNAL_APP_ID', onesignal, envVars);
    }

    // Store dev env
    setEnvValue('ENV', 'dev', envVars);
    const devEnvVars = updateServiceDomain(envVars, 'app');
    setEnvValue('APP_NAME', `${appName} Dev`, devEnvVars);
    saveEnvValues(
      devEnvVars,
      path.join(process.cwd(), `/configs/${client}/.env.dev`),
    );

    // Store staging env
    setEnvValue('ENV', 'staging', envVars);
    const stagingEnvVars = updateServiceDomain(envVars, 'app');
    setEnvValue('APP_NAME', `${appName} Staging`, stagingEnvVars);
    saveEnvValues(
      stagingEnvVars,
      path.join(process.cwd(), `/configs/${client}/.env.staging`),
    );

    // Store prod env
    setEnvValue('ENV', 'prod', envVars);
    const prodEnvVars = updateServiceDomain(envVars, 'app');
    setEnvValue('APP_NAME', appName, prodEnvVars);
    saveEnvValues(
      prodEnvVars,
      path.join(process.cwd(), `/configs/${client}/.env.prod`),
    );

    // Setup fastlane
    const { firebaseIosApp, firebaseAndroidApp } = await setupFastlane({
      client,
    });
    const fastlaneDir = path.join(process.cwd(), `fastlane/${client}/fastlane`);
    const fastlaneEnvVars = readEnvVars(path.join(fastlaneDir, '/.env'));
    setEnvValue('CLIENT', client, fastlaneEnvVars);
    setEnvValue('APP_IDENTIFIER', bundleId, fastlaneEnvVars);
    setEnvValue('APP_NAME', appName, fastlaneEnvVars);
    setEnvValue('XCODEPROJ_SCHEME', `${client} prod`, fastlaneEnvVars);
    setEnvValue('APPLE_TEAM_ID', appleTeamId, fastlaneEnvVars);
    setEnvValue('ITC_TEAM_ID', itcTeamId, fastlaneEnvVars);
    setEnvValue('FLAVOR', capitalize(client), fastlaneEnvVars);
    setEnvValue('FIREBASE_IOS_APP', firebaseIosApp, fastlaneEnvVars);
    setEnvValue('FIREBASE_ANDROID_APP', firebaseAndroidApp, fastlaneEnvVars);

    saveEnvValues(fastlaneEnvVars, fastlaneDir + '/.env');
  }
}
