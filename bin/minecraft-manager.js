#!/usr/bin/env node
'use strict'

const is = require('is-there')
const path = require('path')
const debug = require('debug')('MM:bin')
const logger = require('../dist/lib/logger').Logger

const option = {
}

const argv = require('yargs')
  .usage('Usage $0 [option]')
  .version()
  .option('dir', {
    alias: 'd',
    desc: 'where base directory',
    demandOption: true,
    type:' string',
  })
  .option('api', {
    alias: 'I',
    desc: 'which port for api listen',
    type: 'number',
    default: 8080,
  })
  .option('auth', {
    desc: 'username for api auth, [name]:[pwd]',
    type: 'string'
  })
  .argv

const MinecraftManager = require('../').default

console.log(argv.dir)
option.basePath = path.join(process.cwd(), argv.dir)

if (path.isAbsolute(argv.dir)) {
  option.basePath = argv.dir
}

option.useAPI = !!argv.api
option.apiPort = argv.api

if (argv.auth) {
  let auth = argv.auth.split(':')
  option.auth = {
    name: auth[0],
    pwd: auth[1]
  }
}

const mm = new MinecraftManager(option)

mm.start()
