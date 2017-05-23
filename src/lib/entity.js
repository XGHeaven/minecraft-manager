/**
 * base class of save/jar/server, provide some function
 */

import _ from 'lodash';

class Entity {
  constructor(store) {
    this._autoSaveKeys = Object.keys(store);
    this.store = store;

    _.merge(this, store);
  }

  save() {
    for (let key of this._autoSaveKeys) {
      this.store[key] = this[key];
    }
  }

  getManager() {
    return null;
  }
}

export default Entity;
