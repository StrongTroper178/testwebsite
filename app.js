//adds required without dependencies
const fs = require('fs');
const http = require('http');

//adds required with dependencies
const mysql = require('mysql2');
const express = require('express');//express@4
const app = express();

//declares mysql login information

var con = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "testos",
  database: "testdb"
});

var name = 'shlomo';

//sets server port to 8080
app.set('port', process.env.PORT || 8080);

//creates http server called app
const server = http.createServer(app);

//adds socket.io dependency
const { Server } = require("socket.io");//socket.io
const { Socket } = require('dgram');
const io = new Server(server);


//declare page(s) reference by url requested by client
app.get('/', (req, res) => {
    console.log("requested page: index.html");
  res.sendFile(__dirname + '/index.html');
  //res.render(__dirname + '/index.html');
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

app.get('/login.html', (req, res) => {
    console.log("requested page: login.html");
  res.sendFile(__dirname + '/login.html');
});

var userInfo = {
  username: "username",
  password: "password"
}

const userIo = io.of("/user");
userIo.on('connection', (socket) => {
  var token1 = '';
  var userKeyCode = '';
  var sessionKeyCode = '';
  socket.on('local-key', (localKey) => {
    token1 = localKey;
    console.log("local key: " + token1);
  });
  socket.on('session-key', (sessionKey) => {
    sessionKeyCode = sessionKey;
    console.log("session key code: " + sessionKeyCode);
  });
  getUsernameFromToken(token1, function(resName){
    socket.username = resName;
  });
  console.log("connected to user namespace " + socket.username);
  socket.on('request-user-info', () => {
    console.log("requested user info");
    socket.emit('user-info', socket.username, "random password");
  });
  socket.on('login', (username, password) => {
    console.log('username: ' + username);
    console.log('password: ' + password);
    socket.password = password;
    //token1 = logInToken(username, password);
    logInToken(username, password, function(userCode){
      console.log("client code: " + userCode);
      userKeyCode = userCode;
      console.log("client new key code2: " + userKeyCode);
    });
    console.log("client new key code: " + userKeyCode);
    
    logIn(username, password, function(valid){
      console.log("valid: " + valid);
      console.log("validating user...");
      if(valid){
        socket.username = username;
        socket.emit('user-valid', true);
        console.log("successfully logged!");
      }else{
        socket.emit('user-valid', false);
        console.log("failed validate");
      }
    });
  });
  socket.on('signup', (username, password, keyCode) => {
    console.log('username: ' + username);
    console.log('password: ' + password);
    console.log('session key code: ' + keyCode);
    signUpNewUser(username, password, keyCode);
});
});
userIo.use((socket, next) => {
  if (socket.handshake.auth.token){
    socket.username = getUsernameFromToken(socket.handshake.auth.token);
    next();
  }else{
    next(new Error('token wasnt sent'));
  }
});

function signUpNewUser(username, password, token){
  con.connect(function(err) {
    console.log("Connected!");
    var command = "INSERT INTO authTable (token, username, password) VALUES ('" + token + "', '" + username + "', '" + password + "')";
    con.query(command, function (err, result, fields) {
      if(err){
        console.log("an error occured: " + err);
        socket.emit('signup-logs', false);
      }
      console.log(result);
      socket.emit('signup-logs', true);
    });
  });
}

function getUsernameFromToken(token, callback){
  try{
    var username = "";
    con.connect(function(err) {
      console.log("Connected!");
      con.query("SELECT username FROM authTable WHERE token = '" + token + "'", function (err, result, fields) {
        if(err){
          console.log("an error occured: " + err);
        }
        console.log(token);
        console.log(result);
        console.log(typeof(result));
        if(result[0] !== undefined){
          console.log(result[0].username);
          username = result[0].username;
        }
        //callback(username);
      });
    });
    //callback(username);
    return username;
  }catch{
    return "0e1"
  }
}


function logIn(username, password, callback){
var validateUser;
  con.connect(function(err) {
    var command = 'SELECT token FROM authTable WHERE username = ? AND password = ?';
    con.query(command, [username, password], function(err, result){
      if(result[0] !== null && result[0] !== undefined){
        validateUser = true;
        callback(true);
      }else{
        validateUser = false;
        callback(false);
      }
    });
  });
}

function logInToken(username, password, callback){
  con.connect(function(err) {
    var command = "SELECT token FROM authTable WHERE username = '" + username + "' AND password = '" + password + "'";
    con.query(command, function(err, result){
      if(err){
        console.log("an error occured: " + err);
      }
      console.log(result);
      if(result[0] !== null && result[0] !== undefined){
        console.log(result[0].token);
        callback(result[0].token);
        //return result[0].token;
      }
    });
  });
}

//creates connection between html and node.js
io.on('connection', (socket) => {
  //socket.emit('user-info', userInfo.username, userInfo.password);
  socket.emit('recv-msg', "your id is: " + socket.id);
    socket.on('chat message', (msg) => {
      io.emit('recv-msg', "hi" + msg);
        console.log('message: ' + msg);
      });
    socket.on('signup', (username, password) => {
        console.log('username: ' + username);
        console.log('password: ' + password);
    });
    /*
    socket.on('login', (username, password) => {
        console.log('username: ' + username);
        console.log('password: ' + password);
        userInfo.username = username;
        userInfo.password = password;
        socket.emit('user-info', userInfo.username, userInfo.password);
    });
    socket.on('request-user-info', () => {
      socket.emit('user-info', userInfo.username, userInfo.password);
    });
    */
});


server.listen(8080, () => {
  console.log('listening on *:8080');
});