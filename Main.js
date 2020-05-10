"use strict";
exports.__esModule = true;
var Game_1 = require("./Game");
var express = require("express");
var games = new Map();
var sockets = new Map(); //used for game wide socket broadcasts
var app = express();
app.set("port", process.env.PORT || 3000);
var http = require("http").Server(app);
var io = require('socket.io')(http, {
    transports: ['websocket']
});
io.on('connection', function (socket) {
    console.log("Connection received!");
    var keyy;
    socket.on('game create', function (msg) {
        var key = Math.floor((Math.random() * 899999) + 100000).toString(); //generate a random id
        while (sockets.has(key)) {
            key = Math.floor((Math.random() * 899999) + 100000).toString(); //make sure it's not already in use
        }
        sockets[key] = [];
        sockets[key].push(socket); //push the socket to the id
        socket.emit('game key', { "key": key }); //give the client the id
        keyy = key;
    });
    socket.on('game join', function (msg) {
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
        for (var x = 0; x < sockets[msg].length; x++) {
            sockets[msg][x].emit('player join', sockets[keyy].length);
        }
    });
    socket.on('game start', function (msg) {
        if (games.has(keyy) || sockets[keyy][0].id != socket.id || sockets[keyy].length < 2) {
            socket.emit('invalid request');
            return;
        }
        games[keyy] = new Game_1.Game(sockets[keyy].length);
        for (var x = 0; x < sockets[keyy].length; x++) {
            var arr = [];
            for (var y = 0; y < games[keyy].players.length; y++) {
                arr.push(games[keyy].players[y].hand);
            }
            sockets[keyy][x].emit('hand', arr);
            sockets[keyy][x].emit('attack', games[keyy].currAttacker);
            sockets[keyy][x].emit('defend', games[keyy].currDefender);
        }
    });
    socket.on('add attack', function (msg) {
        var card = JSON.parse(msg);
        var data = "";
        if (!card.suit || !card.rank || card.isJoker) {
            // socket.emit('invalid request');
            data = "false";
        }
        else {
            var res = games[keyy].addToAttack(card);
            if (res == 0) {
                // socket.emit('invalid request');
                data = "false";
            }
            else {
                for (var x = 0; x < sockets[keyy].length; x++) {
                    if (sockets[keyy][x] == card.owner) {
                        sockets[keyy][x].emit("attack response", { response: data });
                    }
                    else {
                        sockets[keyy][x].emit('tableBottom', games[keyy].tableBottom);
                    }
                    var arr = [];
                    for (var y = 0; y < games[keyy].players.length; y++) {
                        arr.push(games[keyy].players[y].hand);
                    }
                    sockets[keyy][x].emit("hand", arr);
                }
            }
        }
    });
    socket.on('add defend', function (msg) {
        var msgObj = JSON.parse(msg);
        var card = msgObj.card;
        var pos = msgObj.position;
        if (!card.suit || !card.rank) {
            socket.emit('invalid request');
        }
        else {
            var res = games[keyy].addToDefend(card, pos);
            if (res == 0) {
                socket.emit('invalid request');
                return;
            }
            for (var x = 0; x < sockets[keyy].length; x++) {
                sockets[keyy][x].emit('tableTop', games[keyy].tableTop);
            }
        }
    });
    socket.on('forfeit', function (msg) {
        if (socket.id != sockets[keyy][games[keyy].currDefender].id) {
            socket.emit('invalid request');
            return;
        }
        var res = games[keyy].forfeit();
        if (res == 1) {
            for (var x = 0; x < sockets[keyy].length; x++) {
                sockets[keyy][x].emit('game over');
            }
            sockets["delete"](keyy);
            games["delete"](keyy);
            return;
        }
        for (var x = 0; x < sockets[keyy].length; x++) {
            var arr = [];
            for (var y = 0; y < games[keyy].players.length; y++) {
                arr.push(games[keyy].players[y].hand);
            }
            sockets[keyy][x].emit('hand', arr);
            sockets[keyy][x].emit('attack', games[keyy].currAttacker);
            sockets[keyy][x].emit('defend', games[keyy].currDefender);
        }
    });
    socket.on('endTurn', function (msg) {
        if (socket.id != sockets[keyy][games[keyy].currAttacker].id) {
            socket.emit('invalid request');
            return;
        }
        var res = games[keyy].endTurn();
        if (res == 1) {
            for (var x = 0; x < sockets[keyy].length; x++) {
                sockets[keyy][x].emit('game over');
            }
            sockets["delete"](keyy);
            games["delete"](keyy);
            return;
        }
        for (var x = 0; x < sockets[keyy].length; x++) {
            var arr = [];
            for (var y = 0; y < games[keyy].players.length; y++) {
                arr.push(games[keyy].players[y].hand);
            }
            sockets[keyy][x].emit('hand', arr);
            sockets[keyy][x].emit('attack', games[keyy].currAttacker);
            sockets[keyy][x].emit('defend', games[keyy].currDefender);
        }
    });
    socket.emit('init');
    socket.emit("connected");
});
var server = http.listen(3000, function () {
    console.log("Listening on *:3000");
});
