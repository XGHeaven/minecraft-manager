import Save from './save'
import mkdirp from 'mkdirp'
import Manager from '../lib/manager'

class SaveManager extends Manager {
  constructor(context) {
    super(context)
    this.store = this.db.save
  }

  async init() {
    for (let store of this.db.save) {
      this.set(store.name, new Save(this.context, store))
    }

    mkdirp.sync(this.context.savePath)
  }

  create(name) {
    let save = this.get(name)
    if (!save) {
      save = new Save(this.context, name)
      this.set(name, save)
      this.store.push(save.store)
    }
    return save
  }

  remove(save) {
    if (typeof save === 'string') {
      save = this.get(save)
    }
    if (!save.remove(true)) return false
    this.delete(save.name)
    this.store.splice(this.store.indexOf(save))
    return true
  }
}

export default SaveManager
