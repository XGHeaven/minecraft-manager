import { transparentMethod } from '../lib/decorator';

class Manager {
  @transparentMethod('set', 'get', 'forEach', 'delete')
  data = new Map();

  constructor(context) {
    this.context = context;
    this.db = context.db;
  }

  save(): Manager {
    this.forEach(entity => entity.save());
    return this;
  }

  toJSONObject(sortCallback) {
    let datas = Array.from(this.data.values());
    if (sortCallback) {
      datas.sort(sortCallback);
    }
    return datas.map(entity => entity.toJSONObject());
  }
}

export default Manager;
