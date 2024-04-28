const express = require("express");
const morgan = require("morgan");
const session = require("express-session");
const flash = require("express-flash");
const store = require("connect-loki");
const QuickGame = require("./lib/twentyone.js");

const app = express();
const PORT = 3000;
const HOST = "localhost";
const LokiStore = store(session);

const buttons = {
  "human": ["hit", "stay"],
  "dealer": ["continue"],
  "end": ["play again", "home"],
};

const capitalize = str => {
  let words = str.split(" ").map(word => {
    return word[0].toUpperCase() + word.slice(1);
  });

  return words.join(" ");
}

app.locals.capitalize = capitalize;

app.set("views", "./views");
app.set("view engine", "pug");

app.use(flash());
app.use(morgan("common"));
app.use(express.static("public"));
app.use(express.urlencoded({ extended: false }));
app.use(session({
  cookie: {
    httpOnly: true,
    maxAge: 31 * 24 * 60 * 60 * 1000, // 31 days in milliseconds
    path: "/",
    secure: false,
  },
  name: "twenty-one-player-session-id",
  resave: false,
  saveUninitialized: true,
  secret: "this is not very secure",
  store: new LokiStore({}),
}));

app.use((req, res, next) => {
  res.locals.flash = req.session.flash;
  delete req.session.flash;
  next();
});

app.use((req, res, next) => {
  if ("quickGame" in req.session) {
    let quickGame = QuickGame.makeQuickGame(req.session.quickGame);
    req.session.quickGame = quickGame;
  }
  next();
});

app.use((req, res, next) => {
  let choice = req.body.choice;

  if (choice === "quickgame" || choice === "play again") {
    req.session.quickGame = new QuickGame();
    let game = req.session.quickGame;
    game.deck.initialize();
    game.dealCards();
  }

  next();
});

app.get("/", (req, res) => {
  res.redirect("/welcome");
});

app.get("/welcome", (req, res) => {
  res.render("welcome");
});

app.get("/gamemodes", (req, res) => {
  res.render("gamemodes");
});

app.post("/gamemodes", (req, res) => {
  let choice = req.body.choice;

  if (choice === "quickgame") {
    res.redirect("/quickgame");
  } else {
    res.redirect("/fullgame");
  }
});

app.get("/instructions", (req, res) => {
  res.render("instructions");
});

app.get("/quickgame", (req, res) => {
  let game = req.session.quickGame;
  let turn = game.getTurn();

  res.render("quickgame", {
    dealer: game.dealer,
    human: game.human,
    buttons: buttons[turn],
    player: turn,
  });
});

app.post("/quickgame", (req, res) => {
  let game = req.session.quickGame;
  let choice = req.body.choice;
  let player = req.body.player;

  if (choice === "hit" || choice === "continue") {
    game.hit(player);
    if (game.isBusted(player)) {
      req.flash("busted", `${capitalize(player)} busted!`)
      res.redirect("/quickgame/winner");
    } else {
      req.flash("hit", `${capitalize(player)} chose to hit!`);
      res.redirect("/quickgame");
    }
  } else if (choice === "stay") {
    if (player === "human") {
      req.flash("stay", `Human chose to stay!`)
      game.human.makeMove(choice);
      game.dealerTurn()
      res.redirect("/quickgame");
    } else {
      req.flash("stay", `Both players chose to stay!`)
      game.determineWinner()
      game.redirect("/quickgame/winner");
    }
  }
});

app.get("/quickgame/winner", (req, res) => {
  let game = req.session.quickGame;

  res.render("quick-winner", {
    human: game.human,
    dealer: game.dealer,
    winner: game.determineWinner(),
    buttons: buttons["end"],
  });
});

app.post("/quickgame/winner", (req, res) => {
  let choice = req.body.choice;

  if (choice === "play again") {
    res.redirect("/quickgame");
  } else {
    res.redirect("/welcome");
  }
});

// Listener
app.listen(PORT, HOST, () => {
  console.log(`Server is listening on port ${PORT} on host ${HOST}`);
});