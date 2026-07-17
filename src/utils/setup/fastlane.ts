import { copyDir, copyFile, normalise } from '../common';
import * as path from 'path';
import * as inquirer from 'inquirer';
import {
  createFirebaseApp,
  getAccessToken,
  getProjectId,
} from './firebase';

export const setupFastlane = async ({
  client,
  bundleId,
  applicationId,
  appName,
}: {
  client: string;
  bundleId?: string;
  applicationId?: string;
  appName?: string;
}) => {
  const clientDir = path.join(process.cwd(), `fastlane/clients/${client}`);
  const fastlaneDir = path.join(clientDir, 'fastlane');
  // Merge template files in without overwriting existing client files —
  // fills gaps left by a partial/previous setup run (e.g. missing .env).
  await copyDir(
    path.join(process.cwd(), 'template/fastlane'),
    fastlaneDir,
    false,
  );

  const { firebaseServiceAccountFile, jsonKeyFile }: any =
    await inquirer.prompt([
      {
        type: 'input',
        name: 'firebaseServiceAccountFile',
        message: 'Firebase Service Account file?',
        default: process.env.FIREBASE_SERVICE_ACCOUNT_FILE,
      },
      {
        type: 'input',
        name: 'jsonKeyFile',
        message:
          'Path to Google json file? See https://docs.fastlane.tools/actions/supply/#setup',
      },
    ]);

  let firebaseIosApp = '';
  let firebaseAndroidApp = '';

  const resolvedServiceAccount =
    normalise(firebaseServiceAccountFile) ||
    process.env.FIREBASE_SERVICE_ACCOUNT_FILE;

  if (resolvedServiceAccount) {
    const { autoCreate } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'autoCreate',
        message: 'Auto-create Firebase apps?',
        default: true,
      },
    ]);

    if (autoCreate) {
      const accessToken = await getAccessToken(resolvedServiceAccount);
      const projectId = getProjectId(resolvedServiceAccount);
      const displayName = appName || client;
      console.log(`Creating Firebase apps in project ${projectId}...`);

      const [iosAppId, androidAppId] = await Promise.all([
        createFirebaseApp({
          accessToken,
          projectId,
          platform: 'ios',
          bundleId,
          displayName,
        }),
        createFirebaseApp({
          accessToken,
          projectId,
          platform: 'android',
          packageName: applicationId,
          displayName,
        }),
      ]);

      firebaseIosApp = iosAppId;
      firebaseAndroidApp = androidAppId;
      console.log(`Firebase iOS App ID: ${iosAppId}`);
      console.log(`Firebase Android App ID: ${androidAppId}`);
    } else {
      const result: any = await inquirer.prompt([
        {
          type: 'input',
          name: 'firebaseIosApp',
          message: 'What is Firebase iOS App Id?',
        },
        {
          type: 'input',
          name: 'firebaseAndroidApp',
          message: 'What is Firebase Android App Id?',
        },
      ]);
      firebaseIosApp = result.firebaseIosApp;
      firebaseAndroidApp = result.firebaseAndroidApp;
    }
  } else {
    const result: any = await inquirer.prompt([
      {
        type: 'input',
        name: 'firebaseIosApp',
        message: 'What is Firebase iOS App Id?',
      },
      {
        type: 'input',
        name: 'firebaseAndroidApp',
        message: 'What is Firebase Android App Id?',
      },
    ]);
    firebaseIosApp = result.firebaseIosApp;
    firebaseAndroidApp = result.firebaseAndroidApp;
  }

  if (firebaseServiceAccountFile) {
    await copyFile(
      normalise(firebaseServiceAccountFile),
      path.join(fastlaneDir, 'firebase.json'),
    );
  }
  if (jsonKeyFile) {
    await copyFile(normalise(jsonKeyFile), path.join(clientDir, 'key.json'));
  }

  return {
    firebaseIosApp,
    firebaseAndroidApp,
  };
};
