import { Server } from "socket.io";
import type { BroadcastOperator, ServerOptions, Socket } from "socket.io";

export class Player {
  readonly socketId: string;
  lives: number;
  accept: boolean;
  played: boolean;
  gamesWon: number;

  constructor(socketId: string) {
    this.socketId = socketId;
    this.lives = 3;
  }
}

export class GameRoom {
  readonly id: string;
  readonly player1: Player;
  readonly player2: Player;
  readonly gamesToWin: number;

  constructor(id: string, player1: Player, player2: Player, gamesToWin: number = 3) {
    this.id = id;
    this.player1 = player1;
    this.player2 = player2;
    this.gamesToWin = gamesToWin;
  }
}

export class Game {
  readonly queue: Array<string>
  readonly gameRooms: Map<string, GameRoom>;
  readonly io: Server

  constructor(opts: Partial<ServerOptions>) {
    this.io = new Server(opts);
    this.gameRooms = new Map();
    this.queue = [];
  }

  getSocketById(socketId: string): Socket {
    return this.io.sockets.sockets.get(socketId);
  }

  createGameRoom(player1: Player, player2: Player): string {
    const socket1 = this.getSocketById(player1.socketId);
    const socket2 = this.getSocketById(player2.socketId);
    const roomId = "room" + this.gameRooms.size;
    socket1.join(roomId);
    socket2.join(roomId);
    const newGameRoom = new GameRoom(roomId, player1, player2);
    this.gameRooms.set(roomId, newGameRoom);
    return roomId;
  }
}
