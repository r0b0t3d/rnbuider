import * as fs from 'fs'

export const buildKeyValuePairs = (params: any) =>
  Object.keys(params).map(key => `${key}:${params[key]}`)

export const getDirectories = (path: string) => {
  try {
    const directories = fs.readdirSync(path).filter(file => fs.statSync(`${path}/${file}`).isDirectory())
    return directories
  } catch (error) {
  }
  return []
}

const defaultVersion = {
  version: '0.0.1',
  build: 1,
}

export const getAppVersion = (client?: string, target = 'ios') => {
  const appVersions = require(process.cwd() + '/app.json')
  let version = defaultVersion
  if (client) {
    const clientVersion = appVersions[client]
    if (clientVersion && clientVersion[target]) {
      version = clientVersion[target]
    }
  } else if (appVersions[target]) {
    version = appVersions[target]
  }
  return version
}
