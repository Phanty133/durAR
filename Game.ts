enum Suit {
	spade,
	clubs,
	diamonds,
	hearts
}
class Card {
	suit: Suit;
	rank: number; //for all intents and purposes, we start from 2 to 14 where 11, 12, 13 and 14 are J Q K and A
	isJoker: boolean;
	owner: number;
	constructor(suit: number, rank: number, isJoker: boolean) {
		this.suit = suit;
		this.rank = rank;
		this.isJoker = isJoker;
		this.owner = null;
	}
	equals(x: Card) {
		return this.suit == x.suit && this.suit == x.suit;
	}
}
class Player {
	//some variable storing a websocket to the player's device
	id: number;
	hand: Card[] = [];

	constructor(id: number) {
		this.id = id;
	}
}
class Game {
	players: Player[] = []; //2 - 4, anything above that is no-no
	deck: Card[] = [];
	trump: Card;
	trumpDealt: boolean;
	currAttacker: number;
	currDefender: number;
	tableBottom: Card[] = [];
	tableTop: Map<number, Card> = new Map<number, Card>(); //the top part of the table is much more nuanced, so a Map is more fitting
	cardDebt: Map<number, number> = new Map<number, number>(); //keeps track which players need to be given how many cards at the end of turn

	fillDeck() {
		for (let x = 0; x < 4; x++) {
			for (let y = 2; y < 15; y++) {
				this.deck.push(new Card(x, y, false)); //creates a standard 52-card deck
			}
		}
		this.deck.push(new Card(0, 15, true)); //black joker will be considered a spade
		this.deck.push(new Card(2, 15, true)); //red joker will be considered a diamond
		//why are they given a suit? because shoving wildcards into arbitrary boxes is my jam
	}
	shuffleDeck() {
		for (let i = this.deck.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[this.deck[i], this.deck[j]] = [this.deck[j], this.deck[i]]; //shuffles the deck using the Fisher-Yates shuffling algo
		}
	}
	dealCardToPlayer(player: number) {
		if (this.deck.length == 0 && !this.trumpDealt) { //if the deck is empty and the trump still hasn't been dealt, deal the trump
			let card = this.trump;
			card.owner = player;
			this.players[player].hand.push(card);
			return;
		} else if (this.trumpDealt) {
			return;
		}
		let card = this.deck.pop();
		card.owner = player;
		this.players[player].hand.push(card);
	}
	compare(a: Card, b: Card) { // -1 means a is better; 0 means uncomparable; 1 means b is better
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
		} else {
			return -1; //if a is not larger than b, that means b is larger because there are no 2 equal cards (aside from joker but a joker on joker play can't be made)
		}
	}
	findLowestTrump() { //returns the player with the lowest trump in hand
		let currLowest: Card;
		for (let x = 0; x < this.players.length; x++) {
			let trumpHand = this.players[x].hand.filter((card) => card.suit == this.trump.suit).sort((a, b) => a.rank - b.rank);
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
	}
	findNextPlayer() { //function made to iterate through the players array and find the next player who is still in the game
		let x = this.currAttacker + 1;
		if (x == this.players.length)
			x = 0;
		while (this.players[x].hand.length == 0) {
			if (x < this.players.length) {
				x++;
			} else {
				x = 0;
			}
			if (x == this.currAttacker) {
				throw "Game is Over.";
			}
		}
		return x;
	}
	addToAttack(card: Card) { //called when someone makes an attack or a card is thrown in
		if (this.tableBottom.length == 0 && card.owner == this.currAttacker) {
			let x = this.players[card.owner].hand.indexOf(card);
			if (x == -1)
				return 0;
			this.players[card.owner].hand.splice(x);
			this.tableBottom.push(card);
			this.cardDebt[card.owner] = 1;
			return 1;
		} else if (card.owner != this.currAttacker) {
			return 0;
		}

		if (this.tableBottom.filter((x) => x.rank == card.rank) || Object.values(this.tableTop).filter((x) => x.rank == card.rank)) {
			if (this.tableBottom.length != this.players[this.currDefender].hand.length) {
				let x = this.players[card.owner].hand.indexOf(card);
				if (x == null)
					return 0;
				this.players[card.owner].hand.splice(x);
				this.tableBottom.push(card);
				if (this.cardDebt.has(card.owner)) {
					this.cardDebt[card.owner]++;
				} else {
					this.cardDebt[card.owner] = 1;
				}
				return 1;
			}
		}
		return 0;
	}
	addToDefend(card: Card, defendPos: number) { //called when the defending player defends
		if (card.owner != this.findNextPlayer())
			return 0;
		if (defendPos < this.tableBottom.length) {
			if (this.compare(this.tableBottom[defendPos], card) == 1) {
				let x = this.players[card.owner].hand.indexOf(card);
				if (x == null)
					return 0;
				this.players[card.owner].hand.splice(x);
				this.tableBottom[defendPos] = card;
				if (this.cardDebt.has(card.owner)) {
					this.cardDebt[card.owner]++;
				} else {
					this.cardDebt[card.owner] = 1;
				}
				return 1;
			}
		}
		return 0;
	}
	repayDebt() {
		for (const [x, y] of Object.entries(this.cardDebt)) {
			let deal = 6 - this.players[x].hand.length;
			let max = y < deal ? y : deal;
			for (let c = 0; c < y; c++) {
				this.dealCardToPlayer(parseInt(x));
			}
		}
	}
	forfeit() {
		for (let x = 0; x < this.tableBottom.length; x++) {
			this.players[this.currDefender].hand.push(this.tableBottom[x]);
		}
		this.tableBottom = [];
		for (let x = 0; x < this.tableTop.size; x++) {
			this.players[this.currDefender].hand.push(this.tableTop.values[x]);
		}
		this.tableTop = new Map<number, Card>();
		this.repayDebt();
		try {
			this.currAttacker = this.currDefender;
			this.currAttacker = this.findNextPlayer(); //run this twice, as we are skipping the defender.
			this.currDefender = this.findNextPlayer();
		} catch {
			return 1;
		}
		return 0;
	}
	endTurn() {
		this.tableBottom = [];
		this.tableTop = new Map<number, Card>();
		this.repayDebt();
		try {
			this.currAttacker = this.findNextPlayer();
			this.currDefender = this.findNextPlayer();
		} catch {
			return 1;
		}
		return 0;
	}

	constructor(playerCount: number) {
		this.fillDeck();
		this.shuffleDeck();
		this.trump = this.deck.pop();
		for (let x = 0; x < playerCount; x++) {
			this.players.push(new Player(x));
			for (let y = 0; y < 6; y++) {
				this.dealCardToPlayer(x);
			}
		}
		this.currAttacker = this.findLowestTrump();
		this.currDefender = this.findNextPlayer();
	}
}

export { Game };