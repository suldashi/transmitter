'use strict';

const express = require("express");
const app = express();
const fs = require('fs');
var privateKey  = fs.readFileSync('sslcert/server.key', 'utf8');
var certificate = fs.readFileSync('sslcert/server.crt', 'utf8');
var credentials = {key: privateKey, cert: certificate};

const server = require("https").createServer(credentials,app);
const path = require("path");
const io = require("socket.io")(server);



const socketHandler = require("./socket-handler");

const port = 8080;

app.use('/public', express.static(path.resolve(__dirname,"..",'public')));

app.get("*",(req,res) => {
	res.sendFile(path.resolve("public/index.html"));
});

app.set("x-powered-by",false);

socketHandler(io);

server.listen(port);
console.log("started on " + port);