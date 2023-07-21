const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const Simulation = require('../simulation/runSimulation');
const app = express();
const server = http.createServer(app);
const io = socketIO(server, {cors: {origin: "*"}});

const simulation = new Simulation();
simulation.initializePatrols();

simulation.startSimulation();


    setInterval(() => {
        // console.log('patrolData@ socket out', simulation.getPatrolCoordsForGUI())
        // io.emit('patrolData', simulation.getPatrolCoordsForGUI());
        io.emit('patrolData', simulation.getPatrolDataForGUI());
      }, 5000);


app.get('/socket.io/socket.io.js', (req, res) => {
  res.sendFile(__dirname + '/node_modules/socket.io-client/dist/socket.io.js');
});

const port = 7071; 
server.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
