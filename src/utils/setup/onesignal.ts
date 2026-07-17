import * as inquirer from 'inquirer';
import * as shell from 'shelljs';
import { buildKeyValuePairs, getFastlaneConfigs } from '../common';

function parseValue(output: string, key: string): string | undefined {
  const match = output.match(new RegExp(`^${key}=(.*)$`, 'm'));
  const value = match?.[1]?.trim();
  return value ? value : undefined;
}

async function askAppIdManually(): Promise<{
  onesignal?: string;
  onesignalRestApiKey?: string;
}> {
  const { onesignal } = await inquirer.prompt([
    {
      type: 'input',
      name: 'onesignal',
      message: 'What is OneSignal App Id?',
    },
  ]);
  return { onesignal, onesignalRestApiKey: undefined };
}

export const prepareOneSignal = async ({
  client,
  fastlaneDir,
  appleTeamId,
}: {
  client: string;
  fastlaneDir: string;
  appleTeamId?: string;
}) => {
  const fastlaneConfigs = getFastlaneConfigs();
  let authToken = fastlaneConfigs.onesignalAuthToken;
  if (!authToken) {
    const { inputToken } = await inquirer.prompt([
      {
        type: 'input',
        name: 'inputToken',
        message:
          'OneSignal Organization Auth Token (add "onesignalAuthToken" to fastlane/configs.json to skip this prompt)?',
      },
    ]);
    authToken = inputToken;
  }

  if (!authToken) {
    return askAppIdManually();
  }

  const { autoCreate } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'autoCreate',
      message: `Create OneSignal app "${client}" + push certificate via fastlane now?`,
      default: true,
    },
  ]);
  if (!autoCreate) {
    return askAppIdManually();
  }

  const { androidToken, androidGcmSenderId } = await inquirer.prompt([
    {
      type: 'input',
      name: 'androidToken',
      message: 'Android GCM key (optional)?',
    },
    {
      type: 'input',
      name: 'androidGcmSenderId',
      message: 'Android GCM Sender Id (optional)?',
    },
  ]);

  let teamId = appleTeamId;
  if (!teamId) {
    const { inputTeamId } = await inquirer.prompt([
      {
        type: 'input',
        name: 'inputTeamId',
        message: 'Apple Developer Team ID (for the push certificate)?',
      },
    ]);
    teamId = inputTeamId;
  }

  const parameters = buildKeyValuePairs({
    auth_token: authToken,
    ...(teamId ? { team_id: teamId } : {}),
    ...(androidToken ? { android_token: androidToken } : {}),
    ...(androidGcmSenderId ? { android_gcm_sender_id: androidGcmSenderId } : {}),
  });

  // shell.exec('bundle install', { cwd: fastlaneDir } as any);
  const result = shell.exec(
    `bundle exec fastlane sync_onesignal ${parameters.join(' ')}`,
    { cwd: fastlaneDir } as any,
  );
  const output = `${result.stdout}\n${result.stderr}`;
  const onesignal = parseValue(output, 'ONESIGNAL_APP_ID');
  const onesignalRestApiKey = parseValue(output, 'ONESIGNAL_APP_AUTH_KEY');

  if (!onesignal) {
    console.warn(
      'Could not parse OneSignal App Id from fastlane output — check the logs above and set ONESIGNAL_APP_ID manually if needed.',
    );
  }

  return { onesignal, onesignalRestApiKey };
};
