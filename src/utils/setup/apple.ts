import * as inquirer from 'inquirer';
import * as shell from 'shelljs';

export const getAppleTeam = async () => {
  const { account } = await inquirer.prompt([
    {
      type: 'input',
      name: 'account',
      message: 'What is Apple account?',
    },
  ]);
  if (!account) {
    return {};
  }
  const { team } = await inquirer.prompt([
    {
      type: 'input',
      name: 'team',
      message: 'What is Apple team name?',
    },
  ]);
  shell.exec(`fastlane get_team_names search:${team} id:${account}`);
  return inquirer.prompt([
    {
      type: 'input',
      name: 'appleTeamId',
      message: 'What is Developer Team Id?',
    },
    {
      type: 'input',
      name: 'itcTeamId',
      message: 'What is Appstore Connect Team Id?',
    },
  ]);
};
