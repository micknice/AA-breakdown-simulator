
const http = require('http');
const socketIO = require('socket.io');
const Simulation = require('../simulation/runSimulation');

const server = http.createServer();
const io = socketIO(server, {cors: {origin: "*"}});

// io.on('', (socket) => {
  //   console.log('START SIMULATION!!!!!')
  // })
  io.on('connection', (socket) => {
    console.log('connected')
    let simulation; 
    console.log('simulation var pre instance', simulation)
    if (!simulation) {
      simulation = new Simulation();
    }
    console.log('simulation var post instance', simulation)
    socket.on('sim', (patrolCount, startStop) => {

      // simulation.patrolCount = patrolCount
      simulation.patrolCount = 1
      
      console.log('START SIM TRIGGERED')
      simulation.initializePatrols();
      simulation.startSimulation();
      setInterval(() => {
        // console.log('patrolData@ socket out', simulation.getPatrolCoordsForGUI())
        // io.emit('patrolData', simulation.getPatrolCoordsForGUI());
        
        io.emit('patrolData', simulation.getPatrolDataForGUI());
        io.emit('iterationSummary', simulation.getIterationSummary());
      }, 5000);
    })
    
    socket.on('stopSim', () => {
      simulation.stopSimulation();
      console.log('stop sim recieved')
    })
})



const port = 7071; 
server.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
