/**
 * base class of save/jar/server, provide some function
 */

import _ from 'lodash';

class Entity {
  constructor(store) {
    this._autoSaveKeys = Object.keys(store);
    this.store = store;

    for (let key of this._autoSaveKeys) {
      if (this[key] && _.isPlainObject(this[key])) {
        _.merge(this[key], store[key]);
      } else {
        this[key] = store[key] || this[key];
      }
    }
  }

  save() {
    for (let key of this._autoSaveKeys) {
      this.store[key] = this[key];
    }
  }
}

export default Entity;
