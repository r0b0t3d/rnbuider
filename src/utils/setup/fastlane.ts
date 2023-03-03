import { copyDir, copyFile, exists, normalise } from '../common';
import * as path from 'path';
import * as inquirer from 'inquirer';

export const setupFastlane = async ({ client }: any) => {
  const clientDir = path.join(process.cwd(), `fastlane/clients/${client}`);
  const fastlaneDir = path.join(clientDir, 'fastlane');
  if (!exists(fastlaneDir)) {
    // Copy template folders
    await copyDir(path.join(process.cwd(), 'template/fastlane'), fastlaneDir);
  }

  const {
    firebaseServiceAccountFile,
    firebaseIosApp,
    firebaseAndroidApp,
    jsonKeyFile,
  }: any = await inquirer.prompt([
    {
      type: 'input',
      name: 'firebaseServiceAccountFile',
      message: 'Firebase Service Account file?',
    },
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
    {
      type: 'input',
      name: 'jsonKeyFile',
      message:
        'Path to Google json file? See https://docs.fastlane.tools/actions/supply/#setup',
    },
  ]);
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
    firebaseIosApp: normalise(firebaseIosApp),
    firebaseAndroidApp: normalise(firebaseAndroidApp),
  };
};
