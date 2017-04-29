import os from 'os';
import _ from 'lodash';

let cpuHistory = cpuUsage();

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

export default function() {
  const cpus = os.cpus();
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
