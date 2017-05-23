import os from 'os';
import _ from 'lodash';
import { Event } from './event';
import Rx from 'rxjs';

const debug = require('debug')('MM:lib:os-usage');

let cpuHistory = cpuUsage();
let usageHistory = currentUsage();

function cpuUsage() {
  const cpus = os.cpus();
  return {
    user: Number.parseInt(_.meanBy(cpus, _.property('times.user'))),
    nice: Number.parseInt(_.meanBy(cpus, _.property('times.nice'))),
    sys: Number.parseInt(_.meanBy(cpus, _.property('times.sys'))),
    idle: Number.parseInt(_.meanBy(cpus, _.property('times.idle'))),
    irq: Number.parseInt(_.meanBy(cpus, _.property('times.irq'))),
    time: new Date().getTime(),
  };
}

function currentCpuUsage() {
  const cpu = cpuUsage();
  // prevent timeDiff === 0
  const timeDiff = (cpu.time - cpuHistory.time + 1) / 1000;

  const temp = _.mergeWith(cpuHistory, cpu, (oV, nV) => {
    return Number.parseInt((nV - oV) / timeDiff);
  });
  cpuHistory = cpu;
  delete temp['time'];

  return temp;
}

function currentUsage() {
  return {
    cpu: currentCpuUsage(),
    mem: {
      free: os.freemem(),
      total: os.totalmem(),
      process: process.memoryUsage(),
    },
    loadavg: os.loadavg(),
  };
}

export function usage() {
  return currentUsage();
}

export const observer = Rx.Observable
  .create(observer => {
    observer.next(currentUsage());
    const timer = setInterval(
      () => {
        observer.next(currentUsage());
      },
      1000,
    );

    return clearInterval.bind(global, timer);
  })
  .multicast(new Rx.Subject())
  .refCount();

export const event = observer.map(v => new Event('message', v));
