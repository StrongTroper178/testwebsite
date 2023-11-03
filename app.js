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

app.get('/chatPage.html', (req, res) => {
  console.log("requested page: chatPage.html");
res.sendFile(__dirname + '/chatPage.html');
});

app.get('/deleteAccount.html', (req, res) => {
  console.log("requested page: deleteAccount.html");
res.sendFile(__dirname + '/deleteAccount.html');
});

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
  getUsernameFromToken(sessionKeyCode, function(resName){
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
    console.log('session key code: ' + sessionKeyCode);
    signUpNewUser(username, password, keyCode, function(callbackVal){
      socket.emit('signup-logs', callbackVal);
    });
  });
  socket.on('delete-user', (username, password1, password2) => {
    console.log("attempting to delete user:" + username + "...");
    deleteAccount(username, password1, password2, function(callbackVal){
      console.log("finished attempting to delete user:" + username);
      if(callbackVal == "1x1"){
        console.log("successfully deleted user: " + username);
        socket.emit('password-match', true);
      }else if(callbackVal == "1x0"){
        console.log("failed finding account from database!");
        socket.emit('password-match', false);
        socket.emit('send message to delete account page', "failed finding account from database!");
      }else if(callbackVal == "0x0"){
        console.log("passwords dont match!");
        socket.emit('password-match', false);
        socket.emit('send message to delete account page', "passwords dont match!");
      }else{
        console.log("failed reading callback value!");
        socket.emit('password-match', false);
        socket.emit('send message to delete account page', "failed reading callback value!");
      }
    });
  });
});
userIo.use((socket, next) => {
  if (socket.handshake.auth.token){
    socket.username = getUsernameFromToken(socket.handshake.auth.token);
    console.log("user socket username has been set to: " + socket.username);
    next();
  }else{
    next(new Error('token wasnt sent'));
  }
});

function signUpNewUser(username, password, keyCode, callback){
  var funcName = "signUpNewUser";
  con.connect(function(err) {
    console.log("Connected! via signUpNewUser");
    printVal(funcName, {keyCode}, __line);
    //console.log("key code: " + keyCode);
    var command = "INSERT INTO authTable (token, username, password) VALUES ('" + keyCode + "', '" + username + "', '" + password + "')";
    con.query(command, function (err, result, fields) {
      if(err){
        console.log("an error occured: " + err);
        //socket.emit('signup-logs', false);
      }
      printVal(funcName, {result}, __line);
      //console.log(result);
      callback(true);
    });
  });
}

function getUsernameFromToken(token, callback){
  var funcName = "getUsernameFromToken";
  var username = "";
  con.connect(function(err) {
    console.log("Connected! via getUsernameFromToken");
    con.query("SELECT username FROM authTable WHERE token = '" + token + "'", function (err, result, fields) {
      if(err){
        console.log("an error occured in getUsernameFromToken: " + err);
      }
      printVal(funcName, {token}, __line);
      printVal(funcName, {result}, __line);
      printValForUndercoverCases(funcName, "typeof(result)", typeof(result), __line);
      if(result[0] !== undefined){
        printValForUndercoverCases(funcName, "result[0].username", result[0].username, __line);
        //console.log("result[0].username from getUsernameFromToken: " + result[0].username);
        username = result[0].username;
        callback(result[0].username);
      }
    });
  });
}

function logIn(username, password, callback){
  var validateUser;
  con.connect(function(err) {
    console.log("Connected! via logIn");
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

function deleteAccount(username, password1, password2, callback){
  var funcName = "deleteAccount";
  var validateUser;
  if(password1 == password2){
    validateUser = true;
    con.connect(function(err) {
      console.log("Connected! via deleteAccount");
      var command = 'DELETE FROM authTable WHERE username = ? AND password = ?';
      con.query(command, [username, password1], function(err, result){
        printValForUndercoverCases(funcName, "result[0]", result[0], __line);
        validateUser = true;
        printVal(funcName, {validateUser}, __line);
        callback("1x1");
      });
    });
  }else{
    callback("0x0");
  }
}

function logInToken(username, password, callback){
  var funcName = "logInToken";
  con.connect(function(err) {
    console.log("Connected! via logInToken");
    var command = "SELECT token FROM authTable WHERE username = '" + username + "' AND password = '" + password + "'";
    con.query(command, function(err, result){
      if(err){
        console.log("an error occured in logInToken: " + err);
      }
      console.log(result);
      if(result[0] !== null && result[0] !== undefined){
        printValForUndercoverCases(funcName, "result[0].token", result[0].token, __line);
        //console.log("result[0].token from logInToken: " + result[0].token);
        callback(result[0].token);
      }
    });
  });
}

//creates connection between html and node.js
io.on('connection', (socket) => {
  socket.emit('recv-msg', "your id is: " + socket.id);
    socket.on('chat message', (msg) => {
      io.emit('recv-msg', "hi" + msg);
        console.log('message: ' + msg);
      });
    /*
    socket.on('signup', (username, password) => {
        console.log('username: ' + username);
        console.log('password: ' + password);
    });
    */
});

function printVal(funcName, hashedVal, line="not declared"){
  var valName = Object.keys(hashedVal)[0];
  var val = hashedVal[valName];
  console.log(valName + " from " + funcName +" in line " + line + ": " + val);
}
function printValForUndercoverCases(funcName, valName, val, line="not declared"){
  console.log(valName + " from " + funcName +" in line " + line + ": " + val);
}
Object.defineProperty(global, '__stack', {
  get: function() {
          var orig = Error.prepareStackTrace;
          Error.prepareStackTrace = function(_, stack) {
              return stack;
          };
          var err = new Error;
          Error.captureStackTrace(err, arguments.callee);
          var stack = err.stack;
          Error.prepareStackTrace = orig;
          return stack;
      }
});
  
Object.defineProperty(global, '__line', {
  get: function() {
          return __stack[1].getLineNumber();
      }
});
  
Object.defineProperty(global, '__function', {
  get: function() {
          return __stack[1].getFunctionName();
      }
});

server.listen(8080, () => {
  console.log('listening on *:8080');
});