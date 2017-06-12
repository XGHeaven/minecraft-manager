import boom from 'boom'

export class MinecraftManagerError extends Error {
  name = 'MinecraftManagerError'
  mm = true
}

export class PortCannotListenError extends MinecraftManagerError {
  name = 'PortCannotListenError'
  message = 'Port cannot listen'
  code = 412
}

export class ServerNotStartError extends MinecraftManagerError {
  name = 'ServerNotStartError'
  message = 'Server not start before action'
  code = 412
}
