/* eslint-disable no-negated-condition */
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

// read .env file & convert to array
export const readEnvVars = (envFilePath: string) => {
  const envVars: string[] = fs.readFileSync(envFilePath, 'utf-8').split(os.EOL);
  const envObject: any = {};
  envVars.forEach((line, index) => {
    if (!line) {
      return;
    }
    const result = line.split('=');
    envObject[result[0]] = {
      key: result[0],
      value: result[1],
      order: index,
    };
  });
  return envObject;
};

/**
 * Updates value for existing key or creates a new key=value line
 *
 * This function is a modified version of https://stackoverflow.com/a/65001580/3153583
 *
 * @param {string} key Key to update/insert
 * @param {string} value Value to update/insert
 */
export const saveEnvValues = (newValues: any, destFilePath: string) => {
  const payload = Object.values(newValues)
    .sort((a: any, b: any) => a.order - b.order)
    .map((data: any) => `${data.key}=${data.value}`);
  // write everything back to the file system
  const dirname = path.dirname(destFilePath);
  fs.mkdirSync(dirname, { recursive: true });
  fs.writeFileSync(destFilePath, payload.join(os.EOL));
};

/**
 * Updates value for existing key or creates a new key=value line
 *
 * This function is a modified version of https://stackoverflow.com/a/65001580/3153583
 *
 * @param {string} key Key to update/insert
 * @param {string} value Value to update/insert
 */
export const setEnvValue = (key: string, value: string, envVars: any) => {
  envVars[key] = {
    ...envVars[key],
    key,
    value,
  };
};

export const updateServiceDomain = (envVars: any, domain: string) => {
  const result: any = {};
  Object.keys(envVars).forEach(key => {
    let data = envVars[key];
    if (data.value?.includes('[domain]')) {
      data = {
        ...data,
        key,
        value: data.value.replace('[domain]', domain),
      };
    }
    result[key] = data;
  });
  return result;
};
