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
    desc: 'which port for api listen, 0 for not listen',
    type: 'number',
    default: 0,
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

const mm = new MinecraftManager(option)

mm.start()
