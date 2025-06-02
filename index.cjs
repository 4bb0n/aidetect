//basic socket.io server
const express = require('express');
const http = require('http');
const socketio = require('socket.io');
const app = express();
const server = http.createServer(app);
const io = socketio(server);
const port = process.env.PORT || 3000;
let users = [];
let writings = {}

app.use(express.static(__dirname + '/public'));

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});
app.get('/secret', (req, res) => {
    res.sendFile(__dirname + '/admin.html');
});

io.on('connection', (socket) => {
    console.log('a user connected');
    socket.on('userjoin', (username) => {
        for(let user of users) {
            if(user.username === username) {
                console.log('Username already taken');
                socket.emit('usernameTaken', username);
                return;
            }
        }
        console.log(users)
        console.log('No username taken');
        users.push({ id: socket.id, username: username });
        writings[username] = "";
        socket.broadcast.emit("userList", users);
    });
    socket.on("teacher_connected", () => {
        console.log(`Teacher connected`);
        socket.emit("userList", users);
    });
    socket.on('get_writing', user => {
        console.log(writings)
        socket.emit('writingEvent', writings[user], user);
    });
    socket.on('editedWriting', (user, content) => {
        writings[user] = content;
    });
    socket.on('pasteDetected', (user, pasteContent) => {
        console.log(`User ${user} pasted content: ${pasteContent}`);
        socket.broadcast.emit('pasteEvent', user, pasteContent );
    })
    socket.on('disconnect', () => {
        console.log('user disconnected');
        const leftUserObj = users.find(user => user.id === socket.id);
        const leftUsername = leftUserObj ? leftUserObj.username : null;
        if (leftUsername) {
            socket.broadcast.emit("userLeft", leftUsername); // Notify others
            delete writings[leftUsername]; // Remove their writing
        }
        users = users.filter(user => user.id !== socket.id);
        socket.broadcast.emit("userList", users);
    });
        socket.on("get_all_writings", () => {
        socket.emit("allWritingsEvent", writings);
    });
});

server.listen(port, () => {
    console.log('listening on *:' + port);
});
