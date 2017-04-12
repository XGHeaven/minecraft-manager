#!/usr/bin/env node
'use strict'

const is = require('is-there')
const path = require('path')
const debug = require('debug')('MM:bin')
const logger = require('../dist/lib/logger').Logger

const MinecraftManager = require('../').default

const option = {
}

const argv = require('yargs')
  .usage('Usage $0 [option]')
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

option.basePath = path.join(process.cwd(), argv.dir)
option.useAPI = !!argv.api
option.apiPort = argv.api

const mm = new MinecraftManager(option)
mm.start()
