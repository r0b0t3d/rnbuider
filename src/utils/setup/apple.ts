import * as inquirer from 'inquirer';
import * as shell from 'shelljs';

function stripAnsi(input: string): string {
  // eslint-disable-next-line no-control-regex
  return input.replace(/\x1b\[[0-9;]*m/g, '');
}

function parseTeamIds(
  output: string,
  sectionHeader: string,
): { name: string; id: string }[] {
  const startIdx = output.indexOf(sectionHeader);
  if (startIdx === -1) return [];
  const lineEndIdx = output.indexOf('\n', startIdx);
  const restStart = lineEndIdx === -1 ? output.length : lineEndIdx + 1;
  const rest = output.slice(restStart);
  const nextSectionIdx = rest.indexOf('----');
  const section = nextSectionIdx === -1 ? rest : rest.slice(0, nextSectionIdx);
  const matches = [...section.matchAll(/([^\r\n(]+?)\s+\(([A-Za-z0-9]+)\)/g)];
  return matches.map(m => ({
    name: m[1].trim().replace(/^\[\d{2}:\d{2}:\d{2}\]:\s*/, ''),
    id: m[2],
  }));
}

async function resolveTeamId(
  candidates: { name: string; id: string }[],
  label: string,
): Promise<string | undefined> {
  if (candidates.length === 0) return undefined;
  if (candidates.length === 1) return candidates[0].id;
  const { chosen } = await inquirer.prompt([
    {
      type: 'list',
      name: 'chosen',
      message: `Multiple ${label} found — pick one:`,
      choices: candidates.map(c => ({ name: `${c.name} (${c.id})`, value: c.id })),
    },
  ]);
  return chosen;
}

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
      message: 'What is Apple team name (using for searching)?',
    },
  ]);
  const result = shell.exec(`fastlane get_team_names search:${team} id:${account}`);
  const output = stripAnsi(`${result.stdout}\n${result.stderr}`);

  const devTeams = parseTeamIds(output, 'Developer teams for');
  const itcTeams = parseTeamIds(output, 'Appstore Connect teams for');

  const appleTeamId = await resolveTeamId(devTeams, 'Apple Developer teams');
  const itcTeamId = await resolveTeamId(itcTeams, 'App Store Connect teams');

  if (appleTeamId && itcTeamId) {
    return { appleTeamId, itcTeamId };
  }

  const manualQuestions = [];
  if (!appleTeamId) {
    manualQuestions.push({
      type: 'input',
      name: 'appleTeamId',
      message: 'What is Developer Team Id?',
    });
  }
  if (!itcTeamId) {
    manualQuestions.push({
      type: 'input',
      name: 'itcTeamId',
      message: 'What is Appstore Connect Team Id?',
    });
  }
  const manual: any = manualQuestions.length
    ? await inquirer.prompt(manualQuestions)
    : {};

  return {
    appleTeamId: appleTeamId || manual.appleTeamId,
    itcTeamId: itcTeamId || manual.itcTeamId,
  };
};
