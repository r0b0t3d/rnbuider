import * as inquirer from 'inquirer';
import { addProductFlavor } from './android';
import { createXcodeScheme } from './ios-scheme';

export const createClientConfig = async (client: string) => {
  const { appName, bundleId, applicationId } = await inquirer.prompt([
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
        'What is application id (android, if different from bundle id)?',
      default: `com.edular.${client}`,
    },
  ]);

  addProductFlavor({ client });
  createXcodeScheme({ client, bundleId });

  return { appName, bundleId, applicationId };
};
