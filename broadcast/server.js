const http = require('http');
const socketIO = require('socket.io');
const Simulation = require('../simulation/runSimulation');
const FastSimulation = require('../simulation/runSimulationFast')

const server = http.createServer();
const io = socketIO(server, { cors: { origin: "*" } });

let simulation;
let intervalId; 

io.on('connection', (socket) => {
  console.log('connected');

  socket.on('sim', (patrolCount, startStop) => {
    console.log('simulation var pre instance', simulation);
    if (!simulation) {
      simulation = new Simulation();
      // simulation = new FastSimulation();
    }
    console.log('simulation var post instance', simulation);
    simulation.patrolCount = patrolCount;
    console.log('START SIM TRIGGERED');
    simulation.initializePatrols();
    simulation.startSimulation();

    intervalId = setInterval(() => {
      io.emit('patrolData', simulation.getPatrolDataForGUI());
      io.emit('iterationSummary', simulation.getIterationSummary());
      io.emit('activeJobLocs', simulation.getJobLocs());
    }, 5000);
  });

  socket.on('stopSim', () => {
    simulation.stopSimulation();
    console.log('stop sim received');
    clearInterval(intervalId);
  });
});

const port = 7071;
server.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
