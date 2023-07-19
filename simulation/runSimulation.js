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
    // random seeding of patrols within
    initializePatrols() {
        for (let i = 0; i < this.patrolCount; i++) {
            const patrolId = `patrol${i}`
            const newPatrol = new Patrol(patrolId)
            this.patrols[patrolId] = newPatrol
            
        }
    }

    async logNewBreakdown() {
        console.log('new job logged!!!!');
        const randomId = Math.floor(Math.random() * 1200);
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
                  console.log('JobCount:', this.jobCount, 'Set job:', setJob);
                  this.jobCount += 1;
                })
                .catch(error => {
                  console.log(error);
                });
            }
          });
      }

      async assignFreePatrolsToQueued() {
        console.log('assign patrol invoked');
        // loop through jobs map and check for patrolAssigned
        this.jobMap.forEach((value, key) => {
            //ASSIGNING ACTIVE JOB VALUES TO DOWN THERE!!
            const activeJob = value;
            const jobLoc = `${value.coordinates[0]},${value.coordinates[1]}`;
            console.log('ACTIVE JOB LOC', jobLoc);
            // console.log(`Key: ${key}, Value: ${value}`);
            // if no patrol assigned map through patrols, check if patrol currently assigned
            // if not assigned then add to a list of Promises to get distance and estimated travel time from API
            if (value.patrolAssigned === false && value.jobCompleted === false) {               
                const closestPatrolPromises = Object.entries(this.patrols).map(([patrolKey, patrolValue]) => {
                    console.log('patrols key-value:', patrolKey, patrolValue);
                    if (patrolValue.onJob === false) {
                        const patrolLoc = `${patrolValue.currentLocation[0]},${patrolValue.currentLocation[1]}`;
                        console.log('patrolLoc-jobLoc', patrolLoc, jobLoc);
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
                        console.log('CLOSEST PATROL PROVISIONAL!!!!', filteredClosestPatrols);
    
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
                        console.log('CURRENT tIME!!!', this.currentTime)
                        console.log('FINAL CLOSEST PATROL!!!!', finalClosestPatrol);
                        // assign closest patrol to job
                        this.patrols[finalClosestPatrol.patrolId].onJob = true;
                        this.patrols[finalClosestPatrol.patrolId].assignedJob = activeJob.jobId;
                        this.patrols[finalClosestPatrol.patrolId].assignedJobLoc = activeJob.coordinates;
                        this.patrols[finalClosestPatrol.patrolId].routePath = finalClosestPatrol.routePath;
                        this.patrols[finalClosestPatrol.patrolId].travelTimeActualMins = travelTimeMins;
                        this.patrols[finalClosestPatrol.patrolId].routeInterval = this.getRouteInterval(travelTimeMins, finalClosestPatrol.routePath.length);
                        this.patrols[finalClosestPatrol.patrolId].assignedSimIteration = this.iteration;
                        
                        console.log('ASSIGNED PATROL', this.patrols[finalClosestPatrol.patrolId])
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
                        // console.log('!!!!! update active', updateActiveJob)
                        this.jobMap.set(activeJob.jobId, updateActiveJob)
                        const check = {...this.jobMap.get(activeJob.jobId)}
                        // console.log('check', check)
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
        if (this.currentTime < activeJob.completionTime) {
          console.log(`job: ${activeJob.jobId} completed`)
          activeJob.jobCompleted = true;
          this.jobMap.set(activeJob.jobId, activeJob)
          this.patrols[activeJob.patrolId].onJob = false;
          this.patrols[activeJob.patrolId].assignedJob = null;
          this.patrols[activeJob.patrolId].assignedJobLoc = null;
          this.patrols[activeJob.patrolId].currentLocation = activeJob.coordinates;
          // console.log('COMPLETED JOB:', this.jobMap.get(activeJob.jobId));
          console.log('COMPLETED JOB:', activeJob.jobId);
          console.log('DE-ALLOCATED PATROL:', this.patrols[activeJob.patrolId]);         
          console.log('DE-ALLOCATED PATROL:', activeJob.patrolId);         
        }
      })
    }
    updateActivePatrolsLocation() {
      for (const patrol in this.patrols) {
        if (patrol.onJob && this.iteration > patrol.assignedSimIteration) {
          patrol.currentRouteIndex += patrol.routeInterval;
          patrol.currentLocation = patrol.routePath[patrol.currentRouteIndex];
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
        console.log('!!!')
        const prob = (this.projectedJobCountForDuration/this.simDurationHours)/20;
        const roll = Math.random();
        console.log(prob, roll)
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
      // Making a copy with the Date() constructor
      const dateCopy = new Date(date);
      dateCopy.setSeconds(date.getSeconds() + seconds);
    
      return dateCopy;
    }

  
    startSimulation() {
      this.interval = setInterval(async () => {
        // Perform the actions for each iteration here
        const hours = this.currentTime.getHours().toString().padStart(2, '0');
        const minutes = this.currentTime.getMinutes().toString().padStart(2, '0');
        const seconds = this.currentTime.getSeconds().toString().padStart(2, '0');
        await this.rollForNewJob()
        await this.assignFreePatrolsToQueued();
        this.completeJobsAndDeassignPatrols();
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


  
  
  // run sim
  const simulation = new Simulation();
  simulation.initializePatrols();
  simulation.startSimulation();
  

