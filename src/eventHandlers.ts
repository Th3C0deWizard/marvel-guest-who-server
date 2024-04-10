import type { Server, Socket } from "socket.io";
import { type Game, type Player, type Character } from "./gameClasses";

export function onMatchAccept(game: Game, player: Player, matchedPlayer: Player) {
  return (_socket: Socket) => {
    console.log("match Accept")
    if (matchedPlayer.accept === true) {
      player.accept = true;
      const roomId = game.createGameRoom(matchedPlayer, player);
    } else {
      player.accept = true;
    }
  }
}

export function onMatchDisconnect(game: Game, player: Player, matchedPlayer: Player) {
  return (reason) => {
    console.log("match cancel");
    if (player.accept === true && matchedPlayer.accept === true) return;
    matchedPlayer.socket?.emit("cancel");
  }
}

export function onMatchTimeOut(game: Game, player: Player, matchedPlayer: Player) {
  return (reason) => {
    console.log("match timeout")
    if (player.accept === false && matchedPlayer.accept === false) {
      player.socket?.disconnect();
      matchedPlayer.socket?.disconnect();
    } else if (matchedPlayer.accept === false && player.accept === true) {
      console.log("test1")
      matchedPlayer.socket?.disconnect();
    } else if (player.accept === false && matchedPlayer.accept === true) {
      player.socket?.disconnect();
    }
  }
}
export function onPlayerReady(roomID: string, characters: Array<Character>, player: Player, matchedPlayer: Player) {
  return (_socket: Socket, characterID) => {
    if (matchedPlayer.ready === true) {
      player.ready = true;
      player.characterID = characterID;
      player.socket.emit("goToGuessGame", roomID);
      matchedPlayer.socket.emit("goToGuessGame", roomID);
      setTimeout(() => {
        console.log(characters)
        player.socket.emit("startGuess", characters, player.characterID);
        matchedPlayer.socket.emit("startGuess", characters, matchedPlayer.characterID);
      }, 2000);

      console.log("Player ready if")
    } else {
      player.ready = true;
      player.characterID = characterID;
      console.log("Player ready else")
    }
  }
}
