import Save from './save';
import { transparentMethod } from '../lib/decorator';
import mkdirp from 'mkdirp';

class SaveManager {
  @transparentMethod('get', 'forEach', 'delete')
  saves = new Map();

  constructor(context) {
    this.context = context;
    this.db = context.db;
    this.store = this.db.save;
  }

  async init() {
    for (let store of this.db.save) {
      this.saves.set(store.name, new Save(this.context, store));
    }

    mkdirp.sync(this.context.savePath);
  }

  create(name) {
    let save = this.saves.get(name);
    if (!save) {
      save = new Save(this.context, name);
      this.saves.set(name, save);
      this.store.push(save.store);
    }
    return save;
  }

  remove(save) {
    if (typeof save === 'string') {
      save = this.get(save);
    }
    save.remove();
    this.saves.delete(save.name);
  }

  save() {
    this.forEach(save => save.save());
    return this;
  }

  toJSONObject() {
    const saves = [];
    this.forEach(save => {
      saves.push(save.toJSONObject());
    });
    return saves;
  }
}

export default SaveManager;
