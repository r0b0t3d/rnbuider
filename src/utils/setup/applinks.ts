import * as fs from 'fs';
import * as inquirer from 'inquirer';
import * as path from 'path';
import * as shell from 'shelljs';
import { normalise } from '../common';

const DEFAULT_APPLINKS = '../../edular/edular-web/applinks.js';
const TABLE_END = '\n}\n\nmodule.exports';

const readKeystoreInfo = (infoPath: string) => {
  const info: Record<string, string> = {};
  fs.readFileSync(infoPath, 'utf-8')
    .split('\n')
    .forEach(line => {
      const index = line.indexOf('=');
      if (index !== -1) {
        info[line.slice(0, index)] = line.slice(index + 1);
      }
    });
  return info;
};

const getKeystoreSha256 = (configFolder: string) => {
  const keystorePath = path.join(configFolder, 'prod.keystore');
  const infoPath = path.join(configFolder, 'keystore.info');
  if (!fs.existsSync(keystorePath) || !fs.existsSync(infoPath)) {
    return undefined;
  }
  const { storePassword, keyAlias } = readKeystoreInfo(infoPath);
  const result = shell.exec(
    `keytool -list -v -keystore "${keystorePath}" -storepass "${storePassword}" -alias "${keyAlias}"`,
    { silent: true },
  );
  return /SHA256:\s*([0-9A-F:]+)/.exec(result.stdout)?.[1];
};

// The Play App Signing fingerprint is not known yet; add it by hand after the first upload.
export const addApplinksEntry = async ({
  client,
  packageName,
  configFolder,
}: {
  client: string;
  packageName: string;
  configFolder: string;
}) => {
  const sha256 = getKeystoreSha256(configFolder);
  if (!sha256) {
    console.warn(
      'No readable prod.keystore and keystore.info; skipping applinks.js update.',
    );
    return;
  }

  const { applinksPath } = await inquirer.prompt([
    {
      type: 'input',
      name: 'applinksPath',
      message: 'Path to edular-web applinks.js (empty to skip)?',
      default: path.resolve(process.cwd(), DEFAULT_APPLINKS),
      filter: normalise,
    },
  ]);
  if (!applinksPath) {
    return;
  }
  if (!fs.existsSync(applinksPath)) {
    console.warn(`${applinksPath} not found; skipping applinks.js update.`);
    return;
  }

  const source = fs.readFileSync(applinksPath, 'utf-8');
  const tableStart = source.indexOf('const androidTargetParams');
  const tableEnd = source.indexOf(TABLE_END);
  if (tableStart === -1 || tableEnd === -1) {
    console.warn('Unexpected applinks.js layout; skipping applinks.js update.');
    return;
  }
  if (new RegExp(`\\n    ${client}: \\{`).test(source.slice(tableStart))) {
    console.log(`${client} already in applinks.js; add fingerprints by hand.`);
    return;
  }

  const entry = [
    `    ${client}: {`,
    `        package_name: "${packageName}",`,
    '        sha256_cert_fingerprints: [',
    '            ...baseSha256,',
    `            "${sha256}" // prod keystore`,
    '        ]',
    '    }',
  ].join('\n');
  fs.writeFileSync(
    applinksPath,
    `${source.slice(0, tableEnd)},\n${entry}${source.slice(tableEnd)}`,
    'utf-8',
  );
  console.log(
    `Added ${client} to ${applinksPath}. Add the Play App Signing SHA-256 after the first Play upload.`,
  );
};
