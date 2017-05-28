import nbt from 'prismarine-nbt';

class Player {
  constructor(server) {
    this.server = server;
  }

  async find(pid) {
    let players = await this.server.save_.getPlayer(pid);
    const ops = await this.server.save_.getOps();
    const onlines = (this.server.status === 'started' && (await this.server.monitor.listCommand())) || [];
    const usercaches = await this.server.save_.getUserCache();
    if (pid) {
      players = nbt.simplify(players.nbt);
      players.isOp = !!ops.find(op => op.uuid === pid);
      players.displayName = usercaches.find(user => user.uuid === players.uuid).name;
      players.isOnline = onlines.includes(players.displayName);
      return players;
    }
    return players.map(p => {
      let player = nbt.simplify(p.nbt);
      player.uuid = p.uuid;
      player.isOp = !!ops.find(op => op.uuid === player.uuid);
      player.displayName = usercaches.find(user => user.uuid === player.uuid).name;
      player.isOnline = onlines.includes(player.displayName);
      return player;
    });
  }
}

export default Player;
