import * as fs from 'fs';
import * as inquirer from 'inquirer';
import * as path from 'path';
import * as shell from 'shelljs';
import { ensureDir } from '../common';

const randomPassword = () =>
  `Edular${new Date().getFullYear()}!${Math.random().toString(36).slice(2, 8)}`;

export const prepareAndroidKeystore = async ({
  client,
  appName,
  configFolder,
}: {
  client: string;
  appName?: string;
  configFolder: string;
}) => {
  const keystorePath = path.join(configFolder, 'prod.keystore');
  const keystoreInfoPath = path.join(configFolder, 'keystore.info');

  if (fs.existsSync(keystorePath)) {
    const { overwrite } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'overwrite',
        message: `Keystore already exists at ${keystorePath}, overwrite?`,
        default: false,
      },
    ]);
    if (!overwrite) {
      return;
    }
    fs.unlinkSync(keystorePath);
  }

  const { generate } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'generate',
      message: 'Generate Android release keystore now?',
      default: true,
    },
  ]);
  if (!generate) {
    return;
  }

  const { storePassword, keyAlias, keyPassword } = await inquirer.prompt([
    {
      type: 'input',
      name: 'storePassword',
      message: 'Keystore store password?',
      default: randomPassword(),
    },
    {
      type: 'input',
      name: 'keyAlias',
      message: 'Keystore key alias?',
      default: client,
    },
    {
      type: 'input',
      name: 'keyPassword',
      message: 'Keystore key password?',
      default: (answers: any) => answers.storePassword,
    },
  ]);

  ensureDir(configFolder);

  const dname = `CN=${appName || client}, OU=Mobile, O=Edular, L=NA, ST=NA, C=US`;
  const result = shell.exec(
    `keytool -genkey -v -keystore ${keystorePath} -storepass ${storePassword} -alias ${keyAlias} -keypass ${keyPassword} -keyalg RSA -keysize 2048 -validity 10000 -dname "${dname}"`,
  );
  if (result.code !== 0) {
    console.warn('keytool failed — check the log above and generate the keystore manually.');
    return;
  }

  const keystoreInfo = [
    `storeFile=../../configs/${client}/prod.keystore`,
    `storePassword=${storePassword}`,
    `keyAlias=${keyAlias}`,
    `keyPassword=${keyPassword}`,
    '',
  ].join('\n');
  fs.writeFileSync(keystoreInfoPath, keystoreInfo, 'utf-8');
  console.log(`Wrote ${keystoreInfoPath}`);
};
