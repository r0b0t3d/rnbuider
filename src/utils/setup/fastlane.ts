import { copyDir, normalise } from '../common';
import * as path from 'path';
import * as inquirer from 'inquirer';

export const setupFastlane = async ({ client }: any) => {
  const fastlaneDir = path.join(process.cwd(), `fastlane/${client}/fastlane`);
  // Copy template folders
  await copyDir(path.join(process.cwd(), 'template/fastlane'), fastlaneDir);

  const {
    firebaseServiceAccountFile,
    firebaseIosApp,
    firebaseAndroidApp,
    jsonKeyFile,
  }: any = inquirer.prompt([
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
        'Path to json file? See https://docs.fastlane.tools/actions/supply/#setup',
    },
  ]);
  if (firebaseServiceAccountFile) {
    await copyDir(
      normalise(firebaseServiceAccountFile),
      path.join(fastlaneDir, 'firebase.json'),
    );
  }
  if (jsonKeyFile) {
    await copyDir(
      normalise(jsonKeyFile),
      path.join(fastlaneDir, '../key.json'),
    );
  }
  return {
    firebaseIosApp,
    firebaseAndroidApp,
  };
};
