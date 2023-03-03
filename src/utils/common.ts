import * as fs from 'fs';

export const buildKeyValuePairs = (params: any) =>
  Object.keys(params).map(key => `${key}:${params[key]}`);

export const getDirectories = (path: string) => {
  try {
    const directories = fs
      .readdirSync(path)
      .filter(file => fs.statSync(`${path}/${file}`).isDirectory());
    return directories;
  } catch (error) {}
  return [];
};

const defaultVersion = {
  version: '0.0.1',
  build: 1,
};

export const getAppVersion = (env: string, client?: string, target = 'ios') => {
  let fileName = 'app';
  if (env !== 'prod') {
    fileName = `${fileName}.${env}`;
  }
  const appVersions = require(process.cwd() + `/${fileName}.json`);
  let version = defaultVersion;
  if (client) {
    const clientVersion = appVersions[client];
    if (clientVersion && clientVersion[target]) {
      version = clientVersion[target];
    }
  } else if (appVersions[target]) {
    version = appVersions[target];
  }
  return version;
};

export const copyDir = (src: string, dest: string) =>
  new Promise((resolve, reject) => {
    fs.cp(src, dest, { recursive: true }, (err: any) => {
      if (err) {
        reject(err);
      } else {
        resolve(true);
      }
    });
  });

export const ensureDir = (path: string) => {
  if (!fs.existsSync(path)) {
    fs.mkdirSync(path, { recursive: true });
  }
};

export const exists = (path: string) => fs.existsSync(path);

export const copyFile = (srcFile: string, destFile: string) =>
  new Promise((resolve, reject) => {
    fs.cp(srcFile, destFile, (err: any) => {
      if (err) {
        reject(err);
      } else {
        resolve(true);
      }
    });
  });

export const checkFileExists = (path: string) => fs.existsSync(path);

export const normalise = (input: string) => input.replace(/'/g, '').trim();

export const capitalize = (string: string) => {
  return string.charAt(0).toUpperCase() + string.slice(1);
};
