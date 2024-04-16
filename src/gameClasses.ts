import { Server } from "socket.io";
import type { BroadcastOperator, ServerOptions, Socket } from "socket.io";
import { onPlayerAction, onPlayerAnswer, onPlayerReady } from "./eventHandlers";

export interface Character {
  id: number;
  name: string;
  thumbnail: {
    path: string;
    extension: string;
  };
}

export interface ChatMessage {
  message: string;
  playerId: string;
}

export class Player {
  readonly socket: Socket;
  nombre: string;
  lives: number;
  accept: boolean;
  ready: boolean;
  gamesWon: number;
  characterID: number;
  isMyTurn: boolean;
  asking: boolean;

  constructor(socket: Socket) {
    this.accept = false;
    this.ready = false;
    this.socket = socket;
    this.lives = 3;
  }
}

export class GameRoom {
  readonly id: string;
  readonly player1: Player;
  readonly player2: Player;
  readonly gamesToWin: number;
  characters: Array<Character>;
  chatHistory: Array<ChatMessage>;

  constructor(
    id: string,
    player1: Player,
    player2: Player,
    gamesToWin: number = 3
  ) {
    this.id = id;
    this.player1 = player1;
    this.player2 = player2;
    this.gamesToWin = gamesToWin;
    this.characters = [];
    this.chatHistory = [];
  }

  handleEvents(server: Server): void {
    this.player1.socket.on("disconnect", () =>
      this.player2.socket.disconnect()
    );
    this.player2.socket.on("disconnect", () =>
      this.player1.socket.disconnect()
    );
    this.player1.socket.on("playerAction", onPlayerAction(this, this.player1, this.player2))
    this.player2.socket.on("playerAction", onPlayerAction(this, this.player2, this.player1))
    this.player1.socket.on("playerAnswer", onPlayerAnswer(this, this.player1, this.player2))
    this.player2.socket.on("playerAnswer", onPlayerAnswer(this, this.player2, this.player1))

  }

  async initGame(server: Server) {
    const offset: number = Math.floor(Math.random() * 30) * 50;
    const response = await fetch(
      "https://gateway.marvel.com//v1/public/characters?ts=1&apikey=95d22bad7531c452ae4f5c1ac9bae9ce&hash=1ea8bd47f0bb37318aeb0e21e3af9950&limit=100" +
      "&offset=" +
      offset
    );
    const data = await response.json();
    let characters = data.data.results.map((character): Character => {
      return {
        id: character.id,
        name: character.name,
        thumbnail: character.thumbnail,
      };
    });
    characters = characters.filter((character) => {
      return (
        !character.thumbnail.path.match(/image_not_available/) &&
        character.thumbnail.extension !== "gif"
      );
    });
    characters = characters.sort((_a: Character, _b: Character) => {
      return Math.random() - 0.5;
    });
    this.characters = characters.slice(0, 25);
    server.in(this.id).emit("start", this.characters);

    this.player1.socket.on(
      "playerReady",
      onPlayerReady(this.id, this.characters, this.player1, this.player2)
    );
    this.player2.socket.on(
      "playerReady",
      onPlayerReady(this.id, this.characters, this.player2, this.player1)
    );
  }
}

export class Game {
  readonly queue: Array<Socket>;
  readonly gameRooms: Map<string, GameRoom>;
  readonly io: Server;

  constructor(opts: Partial<ServerOptions>) {
    this.io = new Server(opts);
    this.gameRooms = new Map();
    this.queue = [];
  }

  getSocketById(socketId: string): Socket {
    return this.io.sockets.sockets.get(socketId);
  }

  createGameRoom(player1: Player, player2: Player): string {
    const roomId = "room" + this.gameRooms.size;
    player1.socket.join(roomId);
    player2.socket.join(roomId);
    const newGameRoom = new GameRoom(roomId, player1, player2);
    this.gameRooms.set(roomId, newGameRoom);
    this.io.in(roomId).emit("toGameRoom");
    newGameRoom.handleEvents(this.io);
    newGameRoom.initGame(this.io);
    return roomId;
  }
}
