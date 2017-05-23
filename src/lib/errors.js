export class MinecraftManagerError extends Error {
  name = 'MinecraftManagerError';
  mm = true;
}

export class PortCannotListenError extends MinecraftManagerError {
  name = 'PortCannotListenError';
  message = 'Port cannot listen';
}
