import { onMatchAccept, onMatchCancel } from "./eventHandlers";
import { Game, Player } from "./gameClasses";

const game = new Game({
  cors: {
    origin: "*",
  }
})

game.io.on("connection", (socket) => {
  if (game.queue.length === 0) {
    // waiting for players
    console.log("user with id %s has enter the queue", socket.id);
    game.queue.push(socket.id);
  } else {
    // basic matchmaking
    console.log("user with id %s has found a match", socket.id);
    const player1 = new Player(game.queue.shift());
    const player2 = new Player(socket.id);
    const p1Socket = game.getSocketById(player1.socketId);
    const p2Socket = socket;
    p1Socket.emit("matched");
    p2Socket.emit("matched");

    // registering events

    p1Socket.on("matchAccept", onMatchAccept(game, player1, player2));
    p2Socket.on("matchAccept", onMatchAccept(game, player2, player1));

    p1Socket.on("matchCancel", onMatchCancel(game, player1, player2));
    p2Socket.on("matchCancel", onMatchCancel(game, player2, player1));

    setTimeout(onMatchCancel(game, player1, player2), 10000);

    socket.on("disconnect", () => {
      console.log("se ha desconectado el usuario con id : " + socket.id);
    })
  }
});


game.io.listen(3000);
