const express = require("express");
const app = express();
const server = require("http").Server(app);
const io = require("socket.io")(server);

let messages = [];

io.on("connection", socket => {
    const { id } = socket.client;
    console.log(`User connected: ${id}`);

    socket.on('connected', function () {
        socket.join('room1');
        socket.emit('connected',messages);
    })

    socket.on("chat message", msg => {
        // console.log('msg',msg);
        messages.push(msg);
        io.in('room1').emit("chat message",msg);
        socket.broadcast.to('room1').emit("generated notification",{ title: 'You Got a New Message', body: msg.text, username: msg.user.name });
    });

  });
const PORT = process.env.PORT || 8000;
server.listen(PORT, () => console.log(`Listen on *: ${PORT}`));
