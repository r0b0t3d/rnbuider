import * as inquirer from 'inquirer';

export const prepareOneSignal = () => {
  return inquirer.prompt([
    {
      type: 'input',
      name: 'onesignal',
      message: 'What is OneSignal App Id?',
    },
  ]);
};
