const WebSocket = require('ws');
const server = new WebSocket.Server({ port: 7071 });

const clients = new Map();

server.on('connection', (socket) => {

    socket.on('message', message => {
        socket.send(`outgoing, ${message}`)

    });
    
})