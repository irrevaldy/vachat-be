const app = require("express")();
const http = require("http").Server(app);
//const io = require("socket.io")(http);
const io = require('socket.io')(http, {
    cors: {
      origin: '*',
    }
});
const mongoose = require('mongoose');

let users = [];
let messages = [];
//let index = 0;

mongoose.connect("mongodb://localhost:27017/vachat-be");

const ChatSchema = mongoose.Schema({
    username: String,
    msg: String,
    roomID: String
})

const ChatModel = mongoose.model("chats", ChatSchema);

ChatModel.find((err, result) => {
    if (err) throw err;

    messages = result;
});

io.on("connection", socket => {
    socket.emit('loggedIn', {
        users: users.map(s => s.username),
        messages: messages
    });

    socket.on('newuser', ({username, roomID}) => {
        //console.log(`${username} has arrived at the party.`);
        console.log(`${username} has arrived at room ${roomID}.`);
        
        socket.username = username;
        socket.roomID = roomID;
        users.push(socket);

        io.emit('userOnline', socket.username);
    });

    socket.on('msg', msg => {
        let message = new ChatModel({
            username: socket.username,
            msg: msg,
            roomID: socket.roomID
        })

        message.save((err, result) => {
            if (err) throw err;

            messages.push(result);

            io.emit('msg', result);
        });
    });

    //Disconnect
    socket.on("disconnect", () => {
        if (socket.username != ""){
            console.log(`${socket.username} has left the party.`);
            io.emit("userLeft", socket.username);
            users.splice(users.indexOf(socket), 1);
        }  
    });
});

http.listen(process.env.PORT || 3000, () => {
    console.log("Listening on port %s", process.env.PORT || 3000);
})

