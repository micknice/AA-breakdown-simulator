const Patrol = require('./classes/patrol')
const Breakdown = require('./classes/breakdown')
const {getMemberDetailsById} = require('../db/model')
const {getLatandLongByQuery, getDistanceAndTime} = require('../api/api')

class Simulation {
    constructor(simDurationHours= 24, patrolCount=17, jobsPer24 = 300) {
        this.simDurationHours = simDurationHours;
        this.simulationDuration = simDurationHours * 60 * 60 * 1000; 
        this.iterationDuration = 5 * 60 * 1000; // 5 minutes reali-time equivalent iteration
        this.numIterations = this.simulationDuration / this.iterationDuration;  
        this.iteration = 1;
        this.currentTime = new Date();
        this.currentTime.setHours(0, 0, 0, 0); // Set the initial time to 00:00:00  
        this.interval = null;
        this.projectedJobCountForDuration = (jobsPer24/ 24) * simDurationHours;
        
        this.patrolCount = patrolCount
        this.patrols = {};        
        
        this.jobMap = new Map();
        this.jobCount = 0;
        
        

    }

    initializePatrols() {
        for (let i = 0; i < this.patrolCount; i++) {
            const patrolId = `patrol${i}`
            const newPatrol = new Patrol(patrolId)
            this.patrols.patrolId = newPatrol
        }
        console.log(this.patrols)
    }

    async logNewBreakdown() {
        console.log('new job logged!!!!');
        const randomId = Math.floor(Math.random() * 1200);
        getMemberDetailsById(randomId)
          .then(member => {
            console.log('member:', member, randomId);
            if (this.jobMap.has(randomId)) {
              console.log(`Job in with memberID: ${randomId} - Re-rolling!!!`);
              this.logNewBreakdown();
            } else {
              getLatandLongByQuery(member.address, member.postcode)
                .then(coordinates => {
                  const newBreakdown = new Breakdown(this.jobCount, member, coordinates);
                  this.jobMap.set(randomId, newBreakdown);
                  this.jobCount += 1;
                  const setJob = this.jobMap.get(randomId);
                  console.log('JobCount:', this.jobCount, 'Set job:', setJob);
                })
                .catch(error => {
                  console.log(error);
                });
            }
          });
      }

    async assignFreePatrolsToQueued() {
        console.log('assign patrol invoked')
            this.jobMap.forEach((value, key) => {
                const jobLoc = `${value.coordinates[0]},${value.coordinates[1]}`;
                console.log('jobLoc', jobLoc)
                console.log(`Key: ${key}, Value: ${value}`)
                if (value.patrolAssigned === false) {
                    let closestPatrolId = '';
                    Object.entries(this.patrols).forEach(entry => {
                        const [key, value] = entry;
                        console.log('patrols key-value:', key, value)
                        if (value.onJob === false) {
                            const patrolLoc = `${value.currentLocation[0]},${value.currentLocation[1]}`
                            console.log('!!!!!!????????')
                            getDistanceAndTime(jobLoc, patrolLoc)
                            .then(resObj => {
                                console.log('distance @ sim', resObj.distance)

                            })
                            .catch(error => {
                                console.log(error)
                            })
                            
                        }
                    })
                }
            })

        

    }

    rollForNewJob() {
        console.log('!!!')
        const prob = (this.projectedJobCountForDuration/this.simDurationHours)/20;
        const roll = Math.random();
        console.log(prob, roll)
        if (roll < prob) {
            this.logNewBreakdown();
        } 
    }

  
    startSimulation() {
      this.interval = setInterval(async () => {
        // Perform the actions for each iteration here
        const hours = this.currentTime.getHours().toString().padStart(2, '0');
        const minutes = this.currentTime.getMinutes().toString().padStart(2, '0');
        const seconds = this.currentTime.getSeconds().toString().padStart(2, '0');
        await this.rollForNewJob()
        await this.assignFreePatrolsToQueued();
        console.log(`Iteration: ${this.iteration}, Time: ${hours}:${minutes}:${seconds}`);
  
        // Increment iteration and time
        this.iteration++;
        this.currentTime.setTime(this.currentTime.getTime() + this.iterationDuration);
  
        // Check if the simulation is complete
        if (this.iteration > this.numIterations) {
          this.stopSimulation();
          console.log('Simulation complete');
        }
      }, 5000); // 5 seconds (5000 milliseconds)
    }
  
    stopSimulation() {
      clearInterval(this.interval);
    }
  }


  class LogSystem{

    constructor() {
        this.jobQueue = [];
    }

    newJobToQueue(job) {
        this.jobQueue.push(job)
    }

    removeJobFromQueue() {

    }
  }
  
  // run sim
  const simulation = new Simulation();
  simulation.initializePatrols();
//   simulation.rollForNewJob();
  simulation.startSimulation();
  

