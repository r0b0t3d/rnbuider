import * as fs from 'fs'

export const buildKeyValuePairs = (params: any) =>
  Object.keys(params).map(key => `${key}:${params[key]}`)

export const getDirectories = (path: string) =>
  fs
  .readdirSync(path)
  .filter(file => fs.statSync(`${path}/${file}`).isDirectory())
