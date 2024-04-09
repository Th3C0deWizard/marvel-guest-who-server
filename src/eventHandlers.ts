import type { Socket } from "socket.io";
import { GameRoom, type Game, type Player } from "./gameClasses";

export function onMatchAccept(game: Game, player: Player, matchedPlayer: Player) {
  return (_socket: Socket) => {
    if (matchedPlayer.accept === true) {
      player.accept = true;
      const roomId = game.createGameRoom(matchedPlayer, player);
      game.io.in(roomId).emit("start");
    } else {
      player.accept = true;
    }
  }
}

export function onMatchCancel(game: Game, player: Player, matchedPlayer: Player) {
  return (_socket: Socket) => {
    game.getSocketById(player.socketId).disconnect();
    game.getSocketById(matchedPlayer.socketId).disconnect();
  }
}
