import * as fs from 'fs';
import * as inquirer from 'inquirer';
import * as path from 'path';
import * as shell from 'shelljs';
import { copyDir, copyFile, getFastlaneConfigs } from '../common';
import { listAdcFiles } from './gcp';
import { readEnvVars, saveEnvValues, setEnvValue } from '../env';

// Firebase apps are provisioned by the project's own script with the operator's
// `firebase login`. The client → Firebase project mapping lives in the project too.
const CLIENTS_FILE = 'scripts/firebase-clients.json';
const PROVISION_SCRIPT = 'scripts/firebase-provision.js';

const pickProject = async (clients: Record<string, { project: string }>) => {
  const counts: Record<string, number> = {};
  Object.values(clients).forEach(({ project }) => {
    counts[project] = (counts[project] || 0) + 1;
  });
  const { project } = await inquirer.prompt([
    {
      type: 'list',
      name: 'project',
      message:
        'Firebase project for this client? (2 apps per client, max 30 apps per project)',
      choices: Object.keys(counts).map(p => ({
        name: `${p} (${counts[p]} clients)`,
        value: p,
      })),
    },
  ]);
  return project as string;
};

export const setupFastlane = async ({ client }: { client: string }) => {
  const fastlaneDir = path.join(
    process.cwd(),
    `fastlane/clients/${client}/fastlane`,
  );
  // Merge template files in without overwriting existing client files —
  // fills gaps left by a partial/previous setup run (e.g. missing .env).
  await copyDir(
    path.join(process.cwd(), 'template/fastlane'),
    fastlaneDir,
    false,
  );

  const adcFiles = listAdcFiles();
  if (!adcFiles.length) {
    console.warn(
      'No impersonated ADC file found in ~/.config/gcloud. Run the setup-gcp command, then set GOOGLE_APPLICATION_CREDENTIALS in the client fastlane .env.',
    );
    return { googleApplicationCredentials: undefined };
  }

  const { googleApplicationCredentials }: any = await inquirer.prompt([
    {
      type: 'list',
      name: 'googleApplicationCredentials',
      message: 'Impersonated ADC file for Google Play?',
      choices: adcFiles,
      default: '~/.config/gcloud/adc_fastlane.json',
    },
  ]);

  return { googleApplicationCredentials: googleApplicationCredentials as string };
};

// fastlane/configs.json maps each Firebase project to its service account key
// under `serviceAccounts`; the key is copied into the client's fastlane dir.
const copyServiceAccountFile = async (project: string, fastlaneDir: string) => {
  const file = getFastlaneConfigs().serviceAccounts?.[project];
  if (!file) {
    throw new Error(
      `No service account key for ${project}; add it under serviceAccounts in fastlane/configs.json`,
    );
  }
  await copyFile(
    path.resolve(process.cwd(), file),
    path.join(fastlaneDir, 'firebase.json'),
  );
};

// Needs configs/<client>/.env.prod and fastlane/clients/<client>/fastlane/.env written:
// the script reads the package / bundle IDs and writes FIREBASE_ANDROID_APP / FIREBASE_IOS_APP.
export const provisionFirebase = async ({
  client,
  fastlaneDir,
}: {
  client: string;
  fastlaneDir: string;
}) => {
  const clientsPath = path.join(process.cwd(), CLIENTS_FILE);
  if (
    !fs.existsSync(clientsPath) ||
    !fs.existsSync(path.join(process.cwd(), PROVISION_SCRIPT))
  ) {
    throw new Error(
      `Firebase setup needs ${PROVISION_SCRIPT} and ${CLIENTS_FILE} in the project`,
    );
  }

  const clients = JSON.parse(fs.readFileSync(clientsPath, 'utf-8'));
  if (clients[client]) {
    console.log(`${client} is mapped to ${clients[client].project}`);
  } else {
    clients[client] = { project: await pickProject(clients) };
    const sorted: Record<string, unknown> = {};
    Object.keys(clients)
      .sort()
      .forEach(key => {
        sorted[key] = clients[key];
      });
    fs.writeFileSync(clientsPath, JSON.stringify(sorted, null, 2) + '\n');
  }

  const result = shell.exec(`node ${PROVISION_SCRIPT} ${client}`);
  if (result.code !== 0) {
    console.warn(
      `Firebase provisioning failed; fix the error above and re-run: node ${PROVISION_SCRIPT} ${client}`,
    );
  }

  const fastlaneEnvPath = path.join(fastlaneDir, '.env');
  const fastlaneEnvVars = readEnvVars(fastlaneEnvPath);
  await copyServiceAccountFile(clients[client].project, fastlaneDir);
  setEnvValue('FIREBASE_SERVICE_ACCOUNT_FILE', 'firebase.json', fastlaneEnvVars);
  saveEnvValues(fastlaneEnvVars, fastlaneEnvPath);

  const { apnsKey } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'apnsKey',
      message:
        'Create or reuse the APNs key via fastlane sync_apns_key now (Apple ID login)?',
      default: true,
    },
  ]);
  if (apnsKey) {
    shell.exec('bundle exec fastlane sync_apns_key', { cwd: fastlaneDir } as any);
  }
};
