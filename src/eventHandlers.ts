import type { Server, Socket } from "socket.io";
import { type Game, type Player, type Character, GameRoom, ChatMessage } from "./gameClasses";

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
  return (_reason) => {
    console.log("match cancel");
    if (player.accept === true && matchedPlayer.accept === true) return;
    matchedPlayer.socket?.emit("cancel");
  }
}

export function onMatchTimeOut(game: Game, player: Player, matchedPlayer: Player) {
  return (_reason) => {
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
  return (characterID) => {
    if (matchedPlayer.ready === true) {
      player.ready = true;
      player.characterID = characterID;
      player.socket.emit("goToGuessGame", roomID);
      matchedPlayer.socket.emit("goToGuessGame", roomID);
      player.socket.emit("startGuess", characters, player.characterID);
      matchedPlayer.socket.emit("startGuess", characters, matchedPlayer.characterID);
      matchedPlayer.isMyTurn = true;
      matchedPlayer.socket.emit("yourTurn", false);
    } else {
      player.ready = true;
      player.characterID = characterID;
    }
  }
}


export function onPlayerAction(room: GameRoom, player: Player, matchedPlayer: Player) {
  return (actionData: { action: "ask" | "guess", message: string | undefined, characterId: number | undefined }) => {
    console.log(actionData)
    if (actionData.action === "ask") {
      console.log(actionData.message)
      room.chatHistory.push({ message: actionData.message, playerId: player.socket.id })
      const chatHistoryProccesed = processChatHistory(room.chatHistory, matchedPlayer.socket.id)
      matchedPlayer.socket.emit("playerAsk", chatHistoryProccesed)
    } else if (actionData.action === "guess") {
      console.log(actionData.characterId)
      if (matchedPlayer.characterID === actionData.characterId) {
        player.socket.emit("guessResult", true)
        matchedPlayer.socket.emit("youLose")
      } else {
        player.socket.emit("guessResult", false)
        matchedPlayer.socket.emit("yourTurn", true)
      }
    }
  };
}

export function onPlayerAnswer(room: GameRoom, player: Player, matchedPlayer: Player) {
  return (message: string) => {
    room.chatHistory.push({ message, playerId: player.socket.id })
    const chatHistoryProcessed = processChatHistory(room.chatHistory, matchedPlayer.socket.id)
    matchedPlayer.socket.emit("opponentAnswer", chatHistoryProcessed);
    player.socket.emit("yourTurn", false);
  };
}

function processChatHistory(chatHistory: Array<ChatMessage>, playerId: string) {
  return chatHistory.map((element) => {
    return {
      message: element.message, itsMe: element.playerId === playerId
    }
  }
  );
}
