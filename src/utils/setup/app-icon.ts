import * as inquirer from 'inquirer';
import * as path from 'path';
import * as sharp from 'sharp';
import { copyDir, normalise } from '../common';

export const prepareAppIcon = async ({ iosAssetFolder }: any) => {
  const questions = [
    {
      type: 'confirm',
      name: 'android-icon',
      message:
        'It is recommend to use Android Studio to create App icon and notification icon for android',
    },
    {
      type: 'input',
      name: 'appIconFile',
      message: 'App Icon file for iOS?',
    },
  ];
  const { appIconFile } = await inquirer.prompt(questions);
  if (appIconFile) {
    // Generate app icon for ios
    // Copy template files
    await copyDir(
      './template/AppIcon.appiconset',
      path.join(iosAssetFolder, 'AppIcon.appiconset'),
    );
    await sharp(normalise(appIconFile))
      .resize(1024, 1024)
      .png()
      .toFile(
        path.join(iosAssetFolder, 'AppIcon.appiconset/ItunesArtwork@2x.png'),
      );
  }
};
