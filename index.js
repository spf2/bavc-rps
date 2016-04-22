var websocket = require("nodejs-websocket")

// A list of ongoing games.
var games = [];

// Find the game that corresponds to this connection.
function findGame(conn) {
  for (var i = 0; i < games.length; i++) {
    for (var j = 0; j < 2; j++) {
      if (games[i][j] == conn) {
        return games[i];
      }
    }
  }
  return null;
}

var server = websocket.createServer(function (conn) {
  console.log("conn " + conn);
  // Look for a game to join...
  var game = findGame(null);
  // If found, join it, and tell self and other guy.
  if (game != null) {
    for (var i = 0; i < 2; i++) {
      if (game[i] == null) {
        game[i] = conn;
      }
      game[i].sendText("👍");
    }
  // Otherwise, create a new game and wait for opponent.
  } else {
    games.push([conn, null])
    conn.sendText("🖐");
  }

  // If receive a message forward it to opponent.
  conn.on("text", function (str) {
    console.log("text " + str);
    var game = findGame(conn);
    var other = (game[0] == conn) ? game[1] : game[0];
    other.sendText(str);
  });

  // Handle closing connection. If have opponent, tell him.
  // If not, delete the game.
  conn.on("close", function (code, reason) {
    console.log("close " + code + " " + reason);
    var game = findGame(conn);
    for (var i = 0; i < 2; i++) {
      if (game[i] == conn) {
        game[i] = null;
      } else if (game[i] != null) {
        game[i].sendText("🖐");
      }
    }
    if (game[0] == null && game[1] == null) {
      games = games.filter(function(g) {
        return g != game;
      })
    }
  });
})

// Run the server.
server.listen(process.env.PORT || 3001);
