const Patrol = require('./classes/patrol')
const Breakdown = require('./classes/breakdown')
const IterationSummary = require('./reports/summary')
const {getMemberDetailsById} = require('../db/model')
const {getLatandLongByQuery, getDistanceAndTime} = require('../api/api')
const wss = require('../broadcast/server')

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
        this.jobCount = 0;
        this.jobMap = new Map();
        this.completedJobMap = new Map();       
    }

    // random seeding of patrols within
    initializePatrols() {
        for (let i = 0; i < this.patrolCount; i++) {
            const patrolId = `patrol${i}`
            const newPatrol = new Patrol(patrolId)
            this.patrols[patrolId] = newPatrol            
        }
    }

    async logNewBreakdown() {
      const randomId = Math.floor(Math.random() * 1999);
      console.log(`LOGGING NEW BREAKDOWN: mbr id: ${randomId}`);
        
        getMemberDetailsById(randomId)
          .then(member => {
            if (this.jobMap.has(randomId)) {
              console.log(`Job in with memberID: ${randomId} - Re-rolling!!!`);
              this.logNewBreakdown();
            } else {
              getLatandLongByQuery(member.address, member.postcode)
                .then(coordinates => {
                  const newBreakdown = new Breakdown(this.jobCount, member, coordinates, randomId, this.currentTime);
                  this.jobMap.set(this.jobCount, newBreakdown);
                  const setJob = this.jobMap.get(this.jobCount);
                  this.jobCount += 1;
                })
                .catch(error => {
                  console.log(error);
                });
            }
          });
      }

      async assignFreePatrolsToQueued() {
        console.log('ASSIGNING PATROLS');
        // loop through jobs map and check for patrolAssigned
        this.jobMap.forEach((value, key) => {
            //ASSIGNING ACTIVE JOB VALUES TO DOWN THERE!!
            const activeJob = value;
            const jobLoc = `${value.coordinates[0]},${value.coordinates[1]}`;     
            // if no patrol assigned map through patrols, check if patrol currently assigned
            // if not assigned then add to a list of Promises to get distance and estimated travel time from API
            if (value.patrolAssigned === false && value.jobCompleted === false) {
              // const patrolsCopy = {...this.patrols}             
                const closestPatrolPromises = Object.entries(this.patrols).map(([patrolKey, patrolValue]) => {
                    if (patrolValue.onJob === false) {
                        const patrolLoc = `${patrolValue.currentLocation[0]},${patrolValue.currentLocation[1]}`;
                        return getDistanceAndTime(jobLoc, patrolLoc)
                            .then((resObj) => ({
                                patrolId: patrolValue.patrolId,
                                distance: Number(resObj.distance), // Convert distance to a number
                                eta: resObj.eta,
                                etaWithTraffic: resObj.etaWithTraffic,
                                routePath: resObj.routePath
                            }))
                            .catch((error) => {
                                console.log(error);
                                return null;
                            });
                    }
                    return null;
                });
                // cash in promises
                Promise.all(closestPatrolPromises)
                    .then((closestPatrols) => {
                        const filteredClosestPatrols = closestPatrols.filter((patrol) => patrol !== null);
                        if(filteredClosestPatrols.length > 0) {
                          // Find the closest patrol
                          let finalClosestPatrol = null;
                          filteredClosestPatrols.forEach((patrol) => {
                              if (finalClosestPatrol === null || patrol.distance < finalClosestPatrol.distance) {
                                  finalClosestPatrol = patrol;
                              }
                          });
                          const fixTimeMins = this.rollForFixTimeInMinutes()
                          const travelTimeMins = this.rollForTravelTimeInMinutes(finalClosestPatrol.eta, finalClosestPatrol.etaWithTraffic)
                          const totalTimeFromAssignment = fixTimeMins + travelTimeMins;
                          const completionTime = this.addSeconds(this.currentTime, totalTimeFromAssignment*60)
                          
                          // assign closest patrol to job
                          this.patrols[finalClosestPatrol.patrolId].onJob = true;
                          this.patrols[finalClosestPatrol.patrolId].assignedJob = activeJob.jobId;
                          this.patrols[finalClosestPatrol.patrolId].assignedJobLoc = activeJob.coordinates;
                          this.patrols[finalClosestPatrol.patrolId].routePath = finalClosestPatrol.routePath;
                          this.patrols[finalClosestPatrol.patrolId].travelTimeActualMins = travelTimeMins;
                          this.patrols[finalClosestPatrol.patrolId].routeInterval = this.getRouteInterval(travelTimeMins, finalClosestPatrol.routePath.length);
                          this.patrols[finalClosestPatrol.patrolId].assignedSimIteration = this.iteration;
                          
                          // update job as assigned with eta, patrolAssigned etc.
                          const updateActiveJob = {...this.jobMap.get(activeJob.jobId)}
                          updateActiveJob.patrolAssigned = true;
                          const dateCopy = new Date(this.currentTime);
                          updateActiveJob.assignmentTime = dateCopy;
                          updateActiveJob.travelTimeActual = travelTimeMins;
                          updateActiveJob.completionTime = completionTime;                                               
                          updateActiveJob.eta = finalClosestPatrol.eta;
                          updateActiveJob.etaWithTraffic = finalClosestPatrol.etaWithTraffic;
                          updateActiveJob.patrolId = finalClosestPatrol.patrolId;
                          this.jobMap.set(activeJob.jobId, updateActiveJob)                                              
                        }
                    })
                    .catch((error) => {
                        console.log(error);
                    });
            }
        });
    }

    completeJobsAndDeassignPatrols() {
      this.jobMap.forEach((value, key) => {
        const activeJob = {...this.jobMap.get(value.jobId)};
        // console.log('ACTIVE JOB', activeJob)
        if (activeJob.patrolAssigned && this.currentTime > activeJob.completionTime) {
          console.log('COMPLETING AND DEASSIGNING')
          activeJob.jobCompleted = true;
          this.completedJobMap.set(activeJob.jobId, activeJob)
          this.patrols[activeJob.patrolId].onJob = false;
          this.patrols[activeJob.patrolId].assignedJob = null;
          this.patrols[activeJob.patrolId].assignedJobLoc = null;
          this.patrols[activeJob.patrolId].currentLocation = activeJob.coordinates;
          this.jobMap.delete(value.jobId)
        }
      })
    }
    
    updateActivePatrolsLocation() {
      console.log('UPDATING PATROL LOCATIONS')
      for (const patrol in this.patrols) {
        if (this.patrols[patrol].onJob && this.iteration > this.patrols[patrol].assignedSimIteration) {
          this.patrols[patrol].currentRouteIndex += this.patrols[patrol].routeInterval;
          this.patrols[patrol].currentLocation = this.patrols[patrol].routePath[this.patrols[patrol].currentRouteIndex];
        }
      }
    }

    //generate time for fix
    rollForFixTimeInMinutes() {
      const fixTime = Math.random() * (60 - 10) + 10;
      return fixTime
    }

    //generate time for travel
    rollForTravelTimeInMinutes(eta, etaWithTraffic) {
      const travelTime = Math.random() * (etaWithTraffic - eta) + eta
      return travelTime /60
    }   
    
    rollForNewJob() {
        const prob = (this.projectedJobCountForDuration/this.simDurationHours)/20;
        const roll = Math.random();
        // console.log(prob, roll)
        if (roll < prob) {
            this.logNewBreakdown();
        } 
    }
    getRouteInterval(travelTimeActualMins, routePathArrLength) {
      const intervalMins = travelTimeActualMins / 5;
      const arrInterval = Math.floor(routePathArrLength / intervalMins)
      return arrInterval;
    }

    addSeconds(date, seconds) {
      const dateCopy = new Date(date);
      dateCopy.setSeconds(date.getSeconds() + seconds);    
      return dateCopy;
    }

    getUnassignedPatrols() {
      let count = 0;
      for (const [key, value] of Object.entries(this.patrols)) {
        if (value.onJob === false) {
          count += 1;
        }
      }
      return count;
    }

    getAssignedPatrols() {
      let count = 0;
      for (const [key, value] of Object.entries(this.patrols)) {
        if (value.onJob === true) {
          count += 1;
        }
      }
      return count;
    }

    sendWebSocketUpdate() {
      const patrolsData = JSON.stringify({ type: 'patrols', data: this.patrols });
      wss.clients.forEach(function each(client) {
        if (client.readyState === WebSocket.OPEN) {
          client.send(patrolsData);
        }
      });
    }
 
    startSimulation() {
      this.interval = setInterval(async () => {
        // Perform the actions for each iteration here
        const hours = this.currentTime.getHours().toString().padStart(2, '0');
        const minutes = this.currentTime.getMinutes().toString().padStart(2, '0');
        const seconds = this.currentTime.getSeconds().toString().padStart(2, '0');
        this.updateActivePatrolsLocation();
        await this.rollForNewJob()
        await this.assignFreePatrolsToQueued();
        await this.completeJobsAndDeassignPatrols();

        const iterationSummary = new IterationSummary(this.iteration, this.currentTime, this.jobCount, this.completedJobMap.size, this.jobMap.size, this.getAssignedPatrols(), this.getUnassignedPatrols())
        console.log(iterationSummary);
        // Increment iteration and time
        this.iteration++;
        this.currentTime.setTime(this.currentTime.getTime() + this.iterationDuration);
        this.sendWebSocketUpdate
  
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


  
  
  // run sim
  const simulation = new Simulation();
  simulation.initializePatrols();
  simulation.startSimulation();
  

