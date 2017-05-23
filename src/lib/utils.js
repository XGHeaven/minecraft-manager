import fs from 'fs';
import archiver from 'archiver';
import decompress from 'decompress';

const VERSIONREG = /^[\d]+\.[\d]+(\.[\d]+)?$/;

export function cp(from, to) {
  return new Promise((resolve, reject) => {
    fs.readFile(from, (err, data) => {
      if (err) reject(err);
      fs.writeFile(to, data, err => {
        if (err) reject(err);
        resolve();
      });
    });
  });
}

export function compressFolder(from, to, onProgress) {
  const archive = archiver('zip');
  archive.pipe(fs.createWriteStream(to));
  archive.on('data', data => {
    onProgress && onProgress(archive.pointer());
  });
  archive.directory(from, '/');
  archive.finalize();
  return new Promise((resolve, reject) => {
    archive.on('end', resolve);
    archive.on('error', reject);
  });
}

export function decompressFolder(from, to) {
  return decompress(from, to);
}

export function isVersion(version) {
  return VERSIONREG.test(version);
}

export function callAsPromise(target, method, ...args) {
  return new Promise((resolve, reject) => {
    target[method](...args, (err, data) => {
      if (err) return reject(err);
      resolve(data);
    });
  });
}
