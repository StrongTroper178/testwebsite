//adds required without dependencies
const fs = require('fs');
const http = require('http');

//adds required with dependencies
const express = require('express');
const app = express();

app.set('port', process.env.PORT || 8080);

//creates http server called app
const server = http.createServer(app);
//adds socket.io dependency
const { Server } = require("socket.io");
const io = new Server(server);

//declare page by url
app.get('/', (req, res) => {
    console.log("requested page: index.html");
  res.sendFile(__dirname + '/index.html');
});

app.get('/index.html', (req, res) => {
    console.log("requested page: index.html");
  res.sendFile(__dirname + '/index.html');
});

app.get('/page2.html', (req, res) => {
    console.log("requested page: page2.html");
  res.sendFile(__dirname + '/page2.html');
});

app.get('/signup.html', (req, res) => {
    console.log("requested page: signup.html");
  res.sendFile(__dirname + '/signup.html');
});

//creates connection between html and node.js
io.on('connection', (socket) => {
    socket.on('chat message', (msg) => {
        console.log('message: ' + msg);
      });
    socket.on('signup username', (username) => {
        console.log('username: ' + username);
    });
    socket.on('signup password', (password) => {
        console.log('password: ' + password);
    });
});

server.listen(8080, () => {
  console.log('listening on *:8080');
});