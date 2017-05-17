import MinecraftManager from '../src'
import path from 'path'

const mm = new MinecraftManager({
  basePath: path.resolve(__dirname, '../test/runtime'),
  useAPI: true,
  apiPort: 8000,
})

mm.start()
