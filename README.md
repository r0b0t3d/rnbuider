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
rnbuilder/0.6.61 darwin-arm64 node-v24.9.0
$ rnbuilder --help [COMMAND]
USAGE
  $ rnbuilder COMMAND
...
```
<!-- usagestop -->
# Commands
<!-- commands -->
* [`rnbuilder build [BUILD]`](#rnbuilder-build-build)
* [`rnbuilder check-version [MATCH-CHECK]`](#rnbuilder-check-version-match-check)
* [`rnbuilder codepush [BUILD]`](#rnbuilder-codepush-build)
* [`rnbuilder google-key [MATCH-CHECK]`](#rnbuilder-google-key-match-check)
* [`rnbuilder help [COMMAND]`](#rnbuilder-help-command)
* [`rnbuilder initialize`](#rnbuilder-initialize)
* [`rnbuilder match-check [MATCH-CHECK]`](#rnbuilder-match-check-match-check)
* [`rnbuilder match-nuke [BUILD]`](#rnbuilder-match-nuke-build)
* [`rnbuilder onesignal [BUILD]`](#rnbuilder-onesignal-build)
* [`rnbuilder setup [SETUP]`](#rnbuilder-setup-setup)
* [`rnbuilder submit-review [SUBMIT-REVIEW]`](#rnbuilder-submit-review-submit-review)
* [`rnbuilder sync-udids [BUILD]`](#rnbuilder-sync-udids-build)

## `rnbuilder build [BUILD]`

Build react native apps

```
USAGE
  $ rnbuilder build [BUILD]

OPTIONS
  -b, --branch=branch                   Set the source branch used to build the app
  -c, --client=client                   Set client that you want to build app
  -d, --distribute=distribute           Specify where to distribute app
  -e, --env=env                         Set the environment: prod, staging, dev
  -f, --firebase                        If enabled, the build will be uploaded to firebase
  -g, --ignore_git_reset                Ignore git reset when building
  -h, --help                            show CLI help
  -i, --installr=installr               If enabled, the build will be uploaded to installR
  -s, --cleanup                         Do cleanup when building
  -t, --target=android|ios|android,ios  Set the build target: android, ios or both
  -t, --testersIos=testersIos           Tester ids for iOS distribution
  -u, --testersAndroid=testersAndroid   Tester ids for Android distribution
  -v, --version=version                 Set the version number for this build
  --groupsAndroid=groupsAndroid         Groups ids for Android distribution
  --groupsIos=groupsIos                 Groups ids for iOS distribution
  --skipCheckVersion                    Skip checking current version on stores

EXAMPLE
  $ rnbuilder build
  hello world from ./src/build.ts!
```

_See code: [src/commands/build.ts](https://github.com/r0b0t3d/rnbuilder/blob/v0.6.61/src/commands/build.ts)_

## `rnbuilder check-version [MATCH-CHECK]`

Check live versions

```
USAGE
  $ rnbuilder check-version [MATCH-CHECK]

OPTIONS
  -c, --client=client  Select client that you want to sync udids
  -h, --help           show CLI help

EXAMPLE
  $ rnbuilder check-version
       Nuke certificates ./src/match-check.ts!
```

_See code: [src/commands/check-version.ts](https://github.com/r0b0t3d/rnbuilder/blob/v0.6.61/src/commands/check-version.ts)_

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

_See code: [src/commands/codepush.ts](https://github.com/r0b0t3d/rnbuilder/blob/v0.6.61/src/commands/codepush.ts)_

## `rnbuilder google-key [MATCH-CHECK]`

Nuke certificates

```
USAGE
  $ rnbuilder google-key [MATCH-CHECK]

OPTIONS
  -c, --client=client  Select client that you want to sync udids
  -h, --help           show CLI help

EXAMPLE
  $ rnbuilder match-check
       Nuke certificates ./src/match-check.ts!
```

_See code: [src/commands/google-key.ts](https://github.com/r0b0t3d/rnbuilder/blob/v0.6.61/src/commands/google-key.ts)_

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

_See code: [src/commands/initialize.ts](https://github.com/r0b0t3d/rnbuilder/blob/v0.6.61/src/commands/initialize.ts)_

## `rnbuilder match-check [MATCH-CHECK]`

Nuke certificates

```
USAGE
  $ rnbuilder match-check [MATCH-CHECK]

OPTIONS
  -c, --client=client  Select client that you want to sync udids
  -h, --help           show CLI help

EXAMPLE
  $ rnbuilder match-check
       Nuke certificates ./src/match-check.ts!
```

_See code: [src/commands/match-check.ts](https://github.com/r0b0t3d/rnbuilder/blob/v0.6.61/src/commands/match-check.ts)_

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

_See code: [src/commands/match-nuke.ts](https://github.com/r0b0t3d/rnbuilder/blob/v0.6.61/src/commands/match-nuke.ts)_

## `rnbuilder onesignal [BUILD]`

Create and upload push cerfiticate to One Signal

```
USAGE
  $ rnbuilder onesignal [BUILD]

OPTIONS
  -c, --client=client                            Select client that you want to sync udids
  -h, --help                                     show CLI help
  --android_gcm_sender_id=android_gcm_sender_id
  --android_token=android_token
  --auth_token=auth_token                        Auth token for OneSignal

EXAMPLE
  $ rnbuilder onesignal
       Create and upload push certificate to One Signal from ./src/commands/onesignal.ts!
```

_See code: [src/commands/onesignal.ts](https://github.com/r0b0t3d/rnbuilder/blob/v0.6.61/src/commands/onesignal.ts)_

## `rnbuilder setup [SETUP]`

Setup new client

```
USAGE
  $ rnbuilder setup [SETUP]

OPTIONS
  -h, --help  show CLI help

EXAMPLE
  $ rnbuilder build
  hello world from ./src/setup.ts!
```

_See code: [src/commands/setup.ts](https://github.com/r0b0t3d/rnbuilder/blob/v0.6.61/src/commands/setup.ts)_

## `rnbuilder submit-review [SUBMIT-REVIEW]`

Submit ios for review

```
USAGE
  $ rnbuilder submit-review [SUBMIT-REVIEW]

OPTIONS
  -c, --client=client  Select client that you want to push update
  -h, --help           show CLI help

EXAMPLE
  $ rnbuilder submit-review
       Push changes to existing apps ./src/firebase-sync-udids.ts!
```

_See code: [src/commands/submit-review.ts](https://github.com/r0b0t3d/rnbuilder/blob/v0.6.61/src/commands/submit-review.ts)_

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

_See code: [src/commands/sync-udids.ts](https://github.com/r0b0t3d/rnbuilder/blob/v0.6.61/src/commands/sync-udids.ts)_
<!-- commandsstop -->
