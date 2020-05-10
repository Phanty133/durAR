import { Socket } from "socket.io";
import { Game } from "./Game";
import * as express from "express";

let games: Map<string, Game> = new Map<string, Game>();
let sockets: Map<string, Socket[]> = new Map<string, Socket[]>(); //used for game wide socket broadcasts

const app = express();
app.set("port", process.env.PORT || 3000);

let http = require("http").Server(app);
let io = require('socket.io')(http, {
	transports: ['websocket'],
});

io.on('connection', (socket) => {
	console.log("Connection received!");
	let keyy: string;

	socket.on('game create', (msg) => {
		let key = Math.floor((Math.random() * 899999) + 100000).toString(); //generate a random id
		while (sockets.has(key)) {
			key = Math.floor((Math.random() * 899999) + 100000).toString(); //make sure it's not already in use
		}
		sockets[key] = [];
		sockets[key].push(socket); //push the socket to the id
		socket.emit('game key', {"key": key}); //give the client the id
		keyy = key;
	});

	socket.on('game join', (msg) => {
		if (sockets[msg].length == 4) {
			socket.emit('server full');
			return;
		}
		if (games.has(keyy)) {
			socket.emit('invalid request');
			return;
		}
		sockets[msg].push(socket);
		keyy = msg;
		for (let x = 0; x < sockets[msg].length; x++) {
			sockets[msg][x].emit('player join', sockets[keyy].length)
		}
	});

	socket.on('game start', (msg) => {
		if (games.has(keyy) || sockets[keyy][0].id != socket.id || sockets[keyy].length < 2) {
			socket.emit('invalid request');
			return;
		}
		games[keyy] = new Game(sockets[keyy].length);
		for (let x = 0; x < sockets[keyy].length; x++) {
			let arr = [];
			for (let y = 0; y < games[keyy].players.length; y++) {
				arr.push(games[keyy].players[y].hand)
			}
			sockets[keyy][x].emit('hand', arr);
			sockets[keyy][x].emit('attack', games[keyy].currAttacker);
			sockets[keyy][x].emit('defend', games[keyy].currDefender);
		}
	});

	socket.on('add attack', (msg) => {
		let card = JSON.parse(msg);
		let data = "";
		if (!card.suit || !card.rank || card.isJoker) {
			// socket.emit('invalid request');
			data = "false";
		} else {
			let res = games[keyy].addToAttack(card);

			if (res == 0) {
				// socket.emit('invalid request');
				data = "false";
			}
			else{
				for (let x = 0; x < sockets[keyy].length; x++) {
					if(sockets[keyy][x] == card.owner){
						sockets[keyy][x].emit("attack response", {response: data});
					}
					else{
						sockets[keyy][x].emit('tableBottom', games[keyy].tableBottom);
					}

					let arr = [];
					for (let y = 0; y < games[keyy].players.length; y++) {
						arr.push(games[keyy].players[y].hand)
					}

					sockets[keyy][x].emit("hand", arr)
				}
			}
		}
	});

	socket.on('add defend', (msg) => {
		let msgObj = JSON.parse(msg);
		let card = msgObj.card;
		let pos = msgObj.position;
		if (!card.suit || !card.rank) {
			socket.emit('invalid request');
		} else {
			let res = games[keyy].addToDefend(card, pos);
			if (res == 0) {
				socket.emit('invalid request');
				return;
			}
			for (let x = 0; x < sockets[keyy].length; x++) {
				sockets[keyy][x].emit('tableTop', games[keyy].tableTop);
			}
		}
	});

	socket.on('forfeit', (msg) => {
		if (socket.id != sockets[keyy][games[keyy].currDefender].id) {
			socket.emit('invalid request');
			return;
		}
		let res = games[keyy].forfeit();
		if (res == 1) {
			for (let x = 0; x < sockets[keyy].length; x++) {
				sockets[keyy][x].emit('game over');
			}
			sockets.delete(keyy);
			games.delete(keyy);
			return;
		}
		for (let x = 0; x < sockets[keyy].length; x++) {
			let arr = [];
			for (let y = 0; y < games[keyy].players.length; y++) {
				arr.push(games[keyy].players[y].hand)
			}
			sockets[keyy][x].emit('hand', arr);
			sockets[keyy][x].emit('attack', games[keyy].currAttacker);
			sockets[keyy][x].emit('defend', games[keyy].currDefender);
		}
	});

	socket.on('endTurn', (msg) => { //should probably add a timeout *somewhere* but can't figure out where
		if (socket.id != sockets[keyy][games[keyy].currAttacker].id) {
			socket.emit('invalid request');
			return;
		}
		let res = games[keyy].endTurn();
		if (res == 1) {
			for (let x = 0; x < sockets[keyy].length; x++) {
				sockets[keyy][x].emit('game over');
			}
			sockets.delete(keyy);
			games.delete(keyy);
			return;
		}
		for (let x = 0; x < sockets[keyy].length; x++) {
			let arr = [];
			for (let y = 0; y < games[keyy].players.length; y++) {
				arr.push(games[keyy].players[y].hand)
			}
			sockets[keyy][x].emit('hand', arr);
			sockets[keyy][x].emit('attack', games[keyy].currAttacker);
			sockets[keyy][x].emit('defend', games[keyy].currDefender);
		}
	});

	socket.emit('init');
	socket.emit("connected");
});

const server = http.listen(3000, function () {
	console.log("Listening on *:3000");
});