import * as fs from 'fs';
import * as inquirer from 'inquirer';
import * as path from 'path';
import * as shell from 'shelljs';
import { normalise } from '../common';

const DEFAULT_APPLINKS = '../../edular/edular-web/applinks.js';

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

// Appends `client` to the top-level table `const <table> = {...}` unless it is already there.
const addTableEntry = (
  source: string,
  table: string,
  client: string,
  entry: string,
) => {
  const tableStart = source.indexOf(`const ${table}`);
  const tableEnd = source.indexOf('\n}\n', tableStart);
  if (tableStart === -1 || tableEnd === -1) {
    console.warn(`Unexpected applinks.js layout; skipping ${table}.`);
    return source;
  }
  if (
    new RegExp(`\\n    ${client}: \\{`).test(
      source.slice(tableStart, tableEnd),
    )
  ) {
    console.log(`${client} already in ${table}; edit it by hand.`);
    return source;
  }
  return `${source.slice(0, tableEnd)},\n${entry}${source.slice(tableEnd)}`;
};

// The Play App Signing fingerprint is not known yet; add it by hand after the first upload.
export const addApplinksEntry = async ({
  client,
  packageName,
  bundleId,
  appleTeamId,
  configFolder,
}: {
  client: string;
  packageName: string;
  bundleId: string;
  appleTeamId?: string;
  configFolder: string;
}) => {
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

  let source = fs.readFileSync(applinksPath, 'utf-8');

  if (appleTeamId) {
    source = addTableEntry(
      source,
      'appleConfigs',
      client,
      `    ${client}: { production: "${appleTeamId}.${bundleId}" }`,
    );
  } else {
    console.warn('No Apple team ID; skipping appleConfigs.');
  }

  const sha256 = getKeystoreSha256(configFolder);
  if (sha256) {
    source = addTableEntry(
      source,
      'androidTargetParams',
      client,
      [
        `    ${client}: {`,
        `        package_name: "${packageName}",`,
        '        sha256_cert_fingerprints: [',
        '            ...baseSha256,',
        `            "${sha256}" // prod keystore`,
        '        ]',
        '    }',
      ].join('\n'),
    );
  } else {
    console.warn(
      'No readable prod.keystore and keystore.info; skipping androidTargetParams.',
    );
  }

  fs.writeFileSync(applinksPath, source, 'utf-8');
  console.log(
    `Updated ${applinksPath}. Add the Play App Signing SHA-256 after the first Play upload.`,
  );
};
