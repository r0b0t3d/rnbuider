import { copyDir, copyFile, normalise } from '../common';
import * as path from 'path';
import * as inquirer from 'inquirer';

export const setupFastlane = async ({ client }: { client: string }) => {
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
        message: 'Firebase Service Account file (for App Distribution)?',
        default: process.env.FIREBASE_SERVICE_ACCOUNT_FILE,
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
};
