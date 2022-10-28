rnbuilder
=========

React Native builder tool

[![oclif](https://img.shields.io/badge/cli-oclif-brightgreen.svg)](https://oclif.io)
[![Version](https://img.shields.io/npm/v/rnbuilder.svg)](https://npmjs.org/package/rnbuilder)
[![CircleCI](https://circleci.com/gh/r0b0t3d/rnbuilder/tree/master.svg?style=shield)](https://circleci.com/gh/r0b0t3d/rnbuilder/tree/master)
[![Downloads/week](https://img.shields.io/npm/dw/rnbuilder.svg)](https://npmjs.org/package/rnbuilder)
[![License](https://img.shields.io/npm/l/rnbuilder.svg)](https://github.com/r0b0t3d/rnbuilder/blob/master/package.json)

<!-- toc -->
* [Usage](#usage)
* [Commands](#commands)
<!-- tocstop -->
# Usage
<!-- usage -->
```sh-session
$ npm install -g rnbuilder
$ rnbuilder COMMAND
running command...
$ rnbuilder (-v|--version|version)
rnbuilder/0.5.12 darwin-arm64 node-v18.4.0
$ rnbuilder --help [COMMAND]
USAGE
  $ rnbuilder COMMAND
...
```
<!-- usagestop -->
# Commands
<!-- commands -->
* [`rnbuilder build [BUILD]`](#rnbuilder-build-build)
* [`rnbuilder codepush [BUILD]`](#rnbuilder-codepush-build)
* [`rnbuilder help [COMMAND]`](#rnbuilder-help-command)
* [`rnbuilder initialize`](#rnbuilder-initialize)
* [`rnbuilder match-nuke [BUILD]`](#rnbuilder-match-nuke-build)
* [`rnbuilder sync-udids [BUILD]`](#rnbuilder-sync-udids-build)

## `rnbuilder build [BUILD]`

Build react native apps

```
USAGE
  $ rnbuilder build [BUILD]

OPTIONS
  -b, --branch=branch           Set the source branch used to build the app
  -c, --client=client           Set client that you want to build app
  -e, --env=staging|adhoc|prod  Set the environment: prod, adhoc, staging
  -h, --help                    show CLI help
  -i, --installr=installr       If enabled, the build will be uploaded to installR
  -t, --target=android|ios      Set the build target: android, ios or both
  -v, --version=version         Set the version number for this build

EXAMPLE
  $ rnbuilder build
  hello world from ./src/build.ts!
```

_See code: [src/commands/build.ts](https://github.com/r0b0t3d/rnbuilder/blob/v0.5.12/src/commands/build.ts)_

## `rnbuilder codepush [BUILD]`

Push changes to existing apps

```
USAGE
  $ rnbuilder codepush [BUILD]

OPTIONS
  -c, --client=client  Select client that you want to push update
  -h, --help           show CLI help

EXAMPLE
  $ rnbuilder codepush
       Push changes to existing apps ./src/firebase-sync-udids.ts!
```

_See code: [src/commands/codepush.ts](https://github.com/r0b0t3d/rnbuilder/blob/v0.5.12/src/commands/codepush.ts)_

## `rnbuilder help [COMMAND]`

display help for rnbuilder

```
USAGE
  $ rnbuilder help [COMMAND]

ARGUMENTS
  COMMAND  command to show help for

OPTIONS
  --all  see all commands in CLI
```

_See code: [@oclif/plugin-help](https://github.com/oclif/plugin-help/blob/v3.2.2/src/commands/help.ts)_

## `rnbuilder initialize`

Initialize the environment for first run

```
USAGE
  $ rnbuilder initialize

EXAMPLE
  $ rnbuilder initialize
  initialize environment for first run from ./src/initialize.ts!
```

_See code: [src/commands/initialize.ts](https://github.com/r0b0t3d/rnbuilder/blob/v0.5.12/src/commands/initialize.ts)_

## `rnbuilder match-nuke [BUILD]`

Nuke certificates

```
USAGE
  $ rnbuilder match-nuke [BUILD]

OPTIONS
  -c, --client=client  Select client that you want to sync udids
  -h, --help           show CLI help

EXAMPLE
  $ rnbuilder match-nuke
       Nuke certificates ./src/match-nuke.ts!
```

_See code: [src/commands/match-nuke.ts](https://github.com/r0b0t3d/rnbuilder/blob/v0.5.12/src/commands/match-nuke.ts)_

## `rnbuilder sync-udids [BUILD]`

Sync device UDIDs from firebase

```
USAGE
  $ rnbuilder sync-udids [BUILD]

OPTIONS
  -c, --client=client  Select client that you want to sync udids
  -h, --help           show CLI help

EXAMPLE
  $ rnbuilder sync-udids
       Sync device UDIDs from firebase from ./src/firebase-sync-udids.ts!
```

_See code: [src/commands/sync-udids.ts](https://github.com/r0b0t3d/rnbuilder/blob/v0.5.12/src/commands/sync-udids.ts)_
<!-- commandsstop -->
