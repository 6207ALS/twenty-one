class Card {
  constructor(value, suit) {
    this.value = value;
    this.suit = suit;
  }

  static SUITS = ["clubs", "diamonds", "hearts", "spades"];
  
  static VALUES = [
    2, 3, 4, 5, 6, 7, 8, 9, 10, "jack", "queen", "king", "ace",
  ];

  static makeCard(rawCard) {
    return Object.assign(new Card(), rawCard);
  } 
}

class Deck {
  constructor() {
    this.deck = [];
  }

  initialize() {
    this.deck = [];

    // Initialize array with standard 52-card deck
    for (let suit of Card.SUITS) {
      for (let value of Card.VALUES) {
        this.add(new Card(value, suit));
      }
    }

    let deck = this.deck;

    // Fisher-Yates Array Shuffle Algorithm
    for (let i = deck.length; i > 0; i--) {
      let randomIndex = Math.floor(Math.random() * i);
      
      [deck[i - 1], deck[randomIndex]] = [deck[randomIndex], deck[i - 1]];
    }
  }

  add(card) {
    this.deck.push(card);
  }

  reset() {
    this.initialize();
  }

  draw() {
    return this.deck.pop();
  }

  static makeDeck(rawDeck) {
    let deck = new Deck();
    rawDeck.deck.forEach(card => deck.add(Card.makeCard(card)));
    return deck;
  }
}

class Player {
  constructor() {
    this.hand = [];
    this.move = "";
  }

  handTotal() {
    let aceCards = this.hand.filter(card => card.value === "ace");
    let nonAceCards = this.hand.filter(card => card.value !== "ace");
    let totalValue = 0;

    // add value of every non-Ace card to hand total
    totalValue += nonAceCards.reduce((acc, card) => {
      return acc + ((typeof card.value) === "number" ? card.value : 10);
    }, 0);

    // add 1 or 11 to hand total for every ace card, depending on outcome
    aceCards.forEach(_ => {
      totalValue += ((totalValue + 11 > 21) ? 1 : 11);
    })

    return totalValue;
  }

  addToHand(card) {
    this.hand.push(card);
  }

  isBusted() {
    return this.handTotal() > 21;
  }
  
  roundReset() {
    this.hand = [];
  }

  gameReset() {
    this.roundWins = 0;
    this.roundReset();
  }

  static makePlayer(rawData) {
    return Object.assign(new Player(), rawData);
  }
}

class Human extends Player {
  makeMove(choice) {
    this.choice = choice;
  }

  static makeHuman(rawHuman) {
    return Object.assign(new Human(), rawHuman);
  }
}

class Dealer extends Player {
  makeMove() {
    this.move = (this.handTotal() < 17 ? "hit" : "stay");
  }

  static makeDealer(rawDealer) {
    return Object.assign(new Human(), rawDealer);
  }
}

class QuickGame {
  constructor() {
    this.human = new Human();
    this.dealer = new Dealer();
    this.deck = new Deck();
    this.turn = "human";
    this.winner = "";
  }

  static makeQuickGame(rawQuickGame) {
    let quickGame = Object.assign(new QuickGame(), rawQuickGame);
    quickGame.human = Human.makeHuman(quickGame.human);
    quickGame.dealer = Dealer.makeDealer(quickGame.dealer);
    quickGame.deck = Deck.makeDeck(quickGame.deck);
    return quickGame;
  }

  hit(player) {
    if (player === "human") {
      this.human.addToHand(this.deck.draw());
    } else {
      this.dealer.addToHand(this.deck.draw());
    }
  }

  dealerTurn() {
    this.turn = "dealer";
  }

  isBusted(player) {
    if (player === "human") {
      return this.human.handTotal() > 21;
    } else {
      return this.dealer.handTotal() > 21;
    }
  }

  getTurn() {
    return this.turn;
  }

  dealCards() {
    for (let i = 0; i < 2; i++) {
      this.human.addToHand(this.deck.draw());
      this.dealer.addToHand(this.deck.draw());
    }
  }

  determineWinner() {
    if (this.human.isBusted()) {
      return "dealer";
    } else if (this.dealer.isBusted()) {
      return "human";
    } else {
      return "tie";
    }
  }

  reset() {
    this.human.roundReset();
    this.dealer.roundReset();
    this.deck.reset();
    this.turn = "human";
    this.winner = "";
  }
}

module.exports = QuickGame;