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
  const androidIcon = normalise(
    launchScreen === 'icon' ? inputFile : fallbackFile,
  );
  if (androidIcon) {
    const densities = [
      { folder: 'drawable-xxxhdpi', size: 960, padding: 144 },
      { folder: 'drawable-xxhdpi', size: 720, padding: 108 },
      { folder: 'drawable-xhdpi', size: 480, padding: 72 },
      { folder: 'drawable-hdpi', size: 360, padding: 54 },
      { folder: 'drawable-mdpi', size: 240, padding: 36 },
    ];
    densities.map(({ folder, size, padding }) => {
      ensureDir(path.join(androidAssetFolder, folder));
      const logoSize = size - padding * 2;
      return sharp(androidIcon)
        .resize({ width: logoSize })
        .extend({
          top: padding,
          bottom: padding,
          left: padding,
          right: padding,
          background: { r: 0, g: 0, b: 0, alpha: 0 }, // transparent padding
        })
        .png()
        .toFile(path.join(androidAssetFolder, `${folder}/bootsplash_logo.png`));
    });
  }

  return { launchScreen, launchScreenColor };
};
