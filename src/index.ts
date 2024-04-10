import { onMatchAccept, onMatchDisconnect, onMatchTimeOut } from "./eventHandlers";
import { Game, Player } from "./gameClasses";

const game = new Game({
  cors: {
    origin: "*",
  }
})

game.io.on("connection", (socket) => {
  socket.on("match", () => {
    if (game.queue.length === 0) {
      // waiting for players
      console.log("user with id %s has enter the queue", socket.id);
      game.queue.push(socket);
      socket.on("disconnect", () => {
        game.queue.shift();
      });
    } else {
      // basic matchmaking
      console.log("user with id %s has found a match", socket.id);
      const player1 = new Player(game.queue.shift());
      const player2 = new Player(socket);
      player1.socket.emit("matched");
      player2.socket.emit("matched");

      // registering events

      player1.socket.on("matchAccept", onMatchAccept(game, player1, player2));
      player2.socket.on("matchAccept", onMatchAccept(game, player2, player1));

      player1.socket.on("disconnect", onMatchDisconnect(game, player1, player2));
      player2.socket.on("disconnect", onMatchDisconnect(game, player2, player1));

      setTimeout(onMatchTimeOut(game, player1, player2), 10000);
    }
  });
  socket.on("disconnect", () => {
    console.log("se ha desconectado el usuario con id : " + socket.id);
  });
});


game.io.listen(3000);
