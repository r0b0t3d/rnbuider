import * as inquirer from 'inquirer';

export const createClientConfig = (client: string) => {
  return inquirer.prompt([
    {
      type: 'confirm',
      name: 'android-client',
      message: `Please add **${client}** to **productFlavors** in android>app>build.gradle`,
    },
    {
      type: 'confirm',
      name: 'ios-client',
      message: `Please add **${client} prod** scheme and config`,
    },
    {
      type: 'input',
      name: 'appName',
      message: 'What is app name?',
    },
    {
      type: 'input',
      name: 'bundleId',
      message: 'What is bundle id?',
      default: `com.edular.${client}`,
    },
    {
      type: 'input',
      name: 'applicationId',
      message:
        'What is application id (this is for android in case you need difference id for platforms)?',
      default: `com.edular.${client}`,
    },
  ]);
};
