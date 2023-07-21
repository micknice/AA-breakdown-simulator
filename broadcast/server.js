
const http = require('http');
const socketIO = require('socket.io');
const Simulation = require('../simulation/runSimulation');

const server = http.createServer();
const io = socketIO(server, {cors: {origin: "*"}});

const simulation = new Simulation();
// io.on('', (socket) => {
  //   console.log('START SIMULATION!!!!!')
  // })
  io.on('connection', (socket) => {
    console.log('connected')
    socket.on('sim', (msg) => {
      console.log('START SIM TRIGGERED')
      simulation.initializePatrols();
      simulation.startSimulation();
      setInterval(() => {
          // console.log('patrolData@ socket out', simulation.getPatrolCoordsForGUI())
          // io.emit('patrolData', simulation.getPatrolCoordsForGUI());
          
          io.emit('patrolData', simulation.getPatrolDataForGUI());
        }, 5000);
  })
})



const port = 7071; 
server.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
