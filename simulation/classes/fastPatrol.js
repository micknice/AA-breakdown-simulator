const {checkValidMainlandLocation} = require('../../api/api')
const fs = require('fs')

class FastPatrol {
    constructor(patrolId, spawnLoc, onJob = false) {
      this.patrolId = patrolId;
      this.onJob = onJob;
      this.assignedJob = null;
      this.assignedJobLoc = null;
      this.spawnLocation = spawnLoc; 
      this.currentLocation = spawnLoc;
      // this.spawnLocationDetails = null;
      this.routePath = null;
      this.travelTimeActualMins = null;
      this.routeInterval = null;
      this.assignedSimIteration = null;
      this.currentRouteIndex = 0;    
    }

    logLocData() {
      const jsonData = {
        patrolId: this.patrolId,
        // spawnLocationDetails: this.spawnLocationDetails,
        currentLoc: this.currentLocation
      };
      const jsonString = JSON.stringify(jsonData, null, 2);
      const filePath = `./logs/${this.patrolId}.json`;
      fs.writeFile(filePath, jsonString, (err) => {
        if (err) {
          console.error('Error logging patrol loc data @ Patrol class:', err);
        } else {
          console.log('patrol loc data logged @ Patrol Class');
        }
      });
    }
   
    updateLocation(newCoords) {
      this.currentLocation = newCoords;
    }
  }

module.exports = FastPatrol