const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 7071 });

const clients = new Map();

wss.on('connection', (ws) => {
    console.log('WEB SOCKET CONNECTED')

    ws.send(JSON.stringify({ type: 'patrols', data: simulation.patrols }));

    ws.on('message', message => {
        ws.send(`outgoing, ${message}`)

    });
    
})


module.exports = wss;