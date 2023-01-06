import * as sharp from 'sharp';
import * as path from 'path';
import * as inquirer from 'inquirer';
import { copyDir, normalise } from '../common';

export const prepareLaunchScreen = async ({
  iosAssetFolder,
  androidAssetFolder,
}: any) => {
  const questions = [
    {
      type: 'list',
      name: 'launchScreen',
      message: 'What is the launch screen?',
      // @ts-ignore
      choices: [
        {
          name: 'Icon in the middle',
          value: 'icon',
        },
        {
          name: 'Image fullscreen',
          value: 'fullscreen',
        },
      ],
    },
    {
      type: 'input',
      name: 'launchScreenFile',
      message: 'Launch screen file (1400 x1867 for fullscreen)?',
    },
    {
      type: 'input',
      name: 'launchScreenColor',
      message: 'Launch screen background hex color?',
      default: '#ffffff',
    },
  ];
  const { launchScreen, launchScreenFile, launchScreenColor } =
    await inquirer.prompt(questions);
  const inputFile = normalise(launchScreenFile);
  // Copy template files
  if (launchScreen === 'icon') {
    await copyDir(
      './template/BootSplashLogo.imageset',
      path.join(iosAssetFolder, 'BootSplashLogo.imageset'),
    );
    if (inputFile) {
      await sharp(inputFile)
        .resize(512, 512)
        .png()
        .toFile(
          path.join(
            iosAssetFolder,
            'BootSplashLogo.imageset/bootsplash_logo.png',
          ),
        );
      // iOS
      await sharp(inputFile)
        .resize({
          width: 512,
        })
        .png()
        .toFile(
          path.join(
            iosAssetFolder,
            'BootSplashLogo.imageset/bootsplash_logo.png',
          ),
        );
      // Android
      await Promise.all([
        sharp(inputFile)
          .resize({
            width: 1024,
          })
          .png()
          .toFile(
            path.join(androidAssetFolder, 'mipmap-xxxhdpi/bootsplash_logo.png'),
          ),
        sharp(inputFile)
          .resize({
            width: 768,
          })
          .png()
          .toFile(
            path.join(androidAssetFolder, 'mipmap-xxhdpi/bootsplash_logo.png'),
          ),
        sharp(inputFile)
          .resize({
            width: 512,
          })
          .png()
          .toFile(
            path.join(androidAssetFolder, 'mipmap-xhdpi/bootsplash_logo.png'),
          ),
        sharp(inputFile)
          .resize({
            width: 384,
          })
          .png()
          .toFile(
            path.join(androidAssetFolder, 'mipmap-hdpi/bootsplash_logo.png'),
          ),
        sharp(inputFile)
          .resize({
            width: 341,
          })
          .png()
          .toFile(
            path.join(androidAssetFolder, 'mipmap-mdpi/bootsplash_logo.png'),
          ),
      ]);
    }
  } else if (launchScreen === 'fullscreen') {
    await copyDir(
      './template/BootSplashImage.imageset',
      path.join(iosAssetFolder, 'BootSplashImage.imageset'),
    );
    if (inputFile) {
      await sharp(inputFile)
        .resize(512, 512)
        .png()
        .toFile(
          path.join(
            iosAssetFolder,
            'BootSplashImage.imageset/splashTablet.png',
          ),
        );
    }
  }

  return { launchScreen, launchScreenColor };
};
