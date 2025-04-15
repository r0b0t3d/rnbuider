import * as sharp from 'sharp';
import * as path from 'path';
import * as inquirer from 'inquirer';
import { copyDir, ensureDir, normalise } from '../common';

export const prepareLaunchScreen = async ({
  iosAssetFolder,
  androidAssetFolder,
  fallbackFile,
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
      message: 'Launch screen file (3:4 ratio for fullscreen)?',
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
    if (inputFile) {
      await copyDir(
        './template/BootSplashLogo.imageset',
        path.join(iosAssetFolder, 'BootSplashLogo.imageset'),
      );
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
    } else if (launchScreen === 'fullscreen') {
      if (inputFile) {
        // ios
        await copyDir(
          './template/BootSplashImage.imageset',
          path.join(iosAssetFolder, 'BootSplashImage.imageset'),
        );
        await sharp(inputFile)
          .png()
          .toFile(
            path.join(
              iosAssetFolder,
              'BootSplashImage.imageset/splashTablet.png',
            ),
          );
      }
    }
  }

  // There is no full screen for android, so generate icon
  // Android
  const androidIcon = launchScreen === 'icon' ? inputFile : fallbackFile;
  if (androidIcon) {
    ensureDir(path.join(androidAssetFolder, 'drawable-xxxhdpi'));
    ensureDir(path.join(androidAssetFolder, 'drawable-xxhdpi'));
    ensureDir(path.join(androidAssetFolder, 'drawable-xhdpi'));
    ensureDir(path.join(androidAssetFolder, 'drawable-hdpi'));
    ensureDir(path.join(androidAssetFolder, 'drawable-mdpi'));
    await Promise.all([
      sharp(androidIcon)
        .resize({
          width: 1024,
        })
        .png()
        .toFile(
          path.join(androidAssetFolder, 'drawable-xxxhdpi/bootsplash_logo.png'),
        ),
      sharp(androidIcon)
        .resize({
          width: 768,
        })
        .png()
        .toFile(
          path.join(androidAssetFolder, 'drawable-xxhdpi/bootsplash_logo.png'),
        ),
      sharp(androidIcon)
        .resize({
          width: 512,
        })
        .png()
        .toFile(
          path.join(androidAssetFolder, 'drawable-xhdpi/bootsplash_logo.png'),
        ),
      sharp(androidIcon)
        .resize({
          width: 384,
        })
        .png()
        .toFile(
          path.join(androidAssetFolder, 'drawable-hdpi/bootsplash_logo.png'),
        ),
      sharp(androidIcon)
        .resize({
          width: 341,
        })
        .png()
        .toFile(
          path.join(androidAssetFolder, 'drawable-mdpi/bootsplash_logo.png'),
        ),
    ]);
  }

  return { launchScreen, launchScreenColor };
};
