"use strict";
exports.__esModule = true;
var Suit;
(function (Suit) {
    Suit[Suit["spade"] = 0] = "spade";
    Suit[Suit["clubs"] = 1] = "clubs";
    Suit[Suit["diamonds"] = 2] = "diamonds";
    Suit[Suit["hearts"] = 3] = "hearts";
})(Suit || (Suit = {}));
var Card = /** @class */ (function () {
    function Card(suit, rank, isJoker) {
        this.suit = suit;
        this.rank = rank;
        this.isJoker = isJoker;
        this.owner = null;
    }
    Card.prototype.equals = function (x) {
        return this.suit == x.suit && this.suit == x.suit;
    };
    return Card;
}());
var Player = /** @class */ (function () {
    function Player(id) {
        this.hand = [];
        this.id = id;
    }
    return Player;
}());
var Game = /** @class */ (function () {
    function Game(playerCount) {
        this.players = []; //2 - 4, anything above that is no-no
        this.deck = [];
        this.tableBottom = [];
        this.tableTop = new Map(); //the top part of the table is much more nuanced, so a Map is more fitting
        this.cardDebt = new Map(); //keeps track which players need to be given how many cards at the end of turn
        this.fillDeck();
        this.shuffleDeck();
        this.trump = this.deck.pop();
        for (var x = 0; x < playerCount; x++) {
            this.players.push(new Player(x));
            for (var y = 0; y < 6; y++) {
                this.dealCardToPlayer(x);
            }
        }
        this.currAttacker = this.findLowestTrump();
        this.currDefender = this.findNextPlayer();
    }
    Game.prototype.fillDeck = function () {
        for (var x = 0; x < 4; x++) {
            for (var y = 2; y < 15; y++) {
                this.deck.push(new Card(x, y, false)); //creates a standard 52-card deck
            }
        }
        this.deck.push(new Card(0, 15, true)); //black joker will be considered a spade
        this.deck.push(new Card(2, 15, true)); //red joker will be considered a diamond
        //why are they given a suit? because shoving wildcards into arbitrary boxes is my jam
    };
    Game.prototype.shuffleDeck = function () {
        var _a;
        for (var i = this.deck.length - 1; i > 0; i--) {
            var j = Math.floor(Math.random() * (i + 1));
            _a = [this.deck[j], this.deck[i]], this.deck[i] = _a[0], this.deck[j] = _a[1]; //shuffles the deck using the Fisher-Yates shuffling algo
        }
    };
    Game.prototype.dealCardToPlayer = function (player) {
        if (this.deck.length == 0 && !this.trumpDealt) { //if the deck is empty and the trump still hasn't been dealt, deal the trump
            var card_1 = this.trump;
            card_1.owner = player;
            this.players[player].hand.push(card_1);
            return;
        }
        else if (this.trumpDealt) {
            return;
        }
        var card = this.deck.pop();
        card.owner = player;
        this.players[player].hand.push(card);
    };
    Game.prototype.compare = function (a, b) {
        //we need to check whether b (which will always be the defenders side) is a joker
        if (b.isJoker)
            return 1;
        //we then need to handle all the cases where the suits can differ
        if (a.suit == this.trump.suit && b.suit != this.trump.suit)
            return -1;
        if (a.suit != this.trump.suit && b.suit == this.trump.suit)
            return 1;
        if (a.suit != b.suit)
            return 0;
        //at this point, we can fully assume that the suits of both cards are equal, so we need to compare only numbers
        if (a.rank > b.rank) {
            return 1;
        }
        else {
            return -1; //if a is not larger than b, that means b is larger because there are no 2 equal cards (aside from joker but a joker on joker play can't be made)
        }
    };
    Game.prototype.findLowestTrump = function () {
        var _this = this;
        var currLowest;
        for (var x = 0; x < this.players.length; x++) {
            var trumpHand = this.players[x].hand.filter(function (card) { return card.suit == _this.trump.suit; }).sort(function (a, b) { return a.rank - b.rank; });
            if (trumpHand.length == 0)
                continue;
            if (!currLowest && trumpHand.length > 0) {
                currLowest = trumpHand[0];
                continue;
            }
            if (trumpHand[0].rank < currLowest.rank)
                currLowest = trumpHand[0];
        }
        if (!currLowest)
            return 0; //if nobody has any trumps, let the first player start
        return currLowest.owner;
    };
    Game.prototype.findNextPlayer = function () {
        var x = this.currAttacker + 1;
        if (x == this.players.length)
            x = 0;
        while (this.players[x].hand.length == 0) {
            if (x < this.players.length) {
                x++;
            }
            else {
                x = 0;
            }
            if (x == this.currAttacker) {
                throw "Game is Over.";
            }
        }
        return x;
    };
    Game.prototype.addToAttack = function (card) {
        if (this.tableBottom.length == 0 && card.owner == this.currAttacker) {
            var x = this.players[card.owner].hand.indexOf(card);
            if (x == -1)
                return 0;
            this.players[card.owner].hand.splice(x);
            this.tableBottom.push(card);
            this.cardDebt[card.owner] = 1;
            return 1;
        }
        else if (card.owner != this.currAttacker) {
            return 0;
        }
        if (this.tableBottom.filter(function (x) { return x.rank == card.rank; }) || Object.values(this.tableTop).filter(function (x) { return x.rank == card.rank; })) {
            if (this.tableBottom.length != this.players[this.currDefender].hand.length) {
                var x = this.players[card.owner].hand.indexOf(card);
                if (x == null)
                    return 0;
                this.players[card.owner].hand.splice(x);
                this.tableBottom.push(card);
                if (this.cardDebt.has(card.owner)) {
                    this.cardDebt[card.owner]++;
                }
                else {
                    this.cardDebt[card.owner] = 1;
                }
                return 1;
            }
        }
        return 0;
    };
    Game.prototype.addToDefend = function (card, defendPos) {
        if (card.owner != this.findNextPlayer())
            return 0;
        if (defendPos < this.tableBottom.length) {
            if (this.compare(this.tableBottom[defendPos], card) == 1) {
                var x = this.players[card.owner].hand.indexOf(card);
                if (x == null)
                    return 0;
                this.players[card.owner].hand.splice(x);
                this.tableBottom[defendPos] = card;
                if (this.cardDebt.has(card.owner)) {
                    this.cardDebt[card.owner]++;
                }
                else {
                    this.cardDebt[card.owner] = 1;
                }
                return 1;
            }
        }
        return 0;
    };
    Game.prototype.repayDebt = function () {
        for (var _i = 0, _a = Object.entries(this.cardDebt); _i < _a.length; _i++) {
            var _b = _a[_i], x = _b[0], y = _b[1];
            var deal = 6 - this.players[x].hand.length;
            var max = y < deal ? y : deal;
            for (var c = 0; c < y; c++) {
                this.dealCardToPlayer(parseInt(x));
            }
        }
    };
    Game.prototype.forfeit = function () {
        for (var x = 0; x < this.tableBottom.length; x++) {
            this.players[this.currDefender].hand.push(this.tableBottom[x]);
        }
        this.tableBottom = [];
        for (var x = 0; x < this.tableTop.size; x++) {
            this.players[this.currDefender].hand.push(this.tableTop.values[x]);
        }
        this.tableTop = new Map();
        this.repayDebt();
        try {
            this.currAttacker = this.currDefender;
            this.currAttacker = this.findNextPlayer(); //run this twice, as we are skipping the defender.
            this.currDefender = this.findNextPlayer();
        }
        catch (_a) {
            return 1;
        }
        return 0;
    };
    Game.prototype.endTurn = function () {
        this.tableBottom = [];
        this.tableTop = new Map();
        this.repayDebt();
        try {
            this.currAttacker = this.findNextPlayer();
            this.currDefender = this.findNextPlayer();
        }
        catch (_a) {
            return 1;
        }
        return 0;
    };
    return Game;
}());
exports.Game = Game;
