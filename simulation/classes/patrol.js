const {checkValidMainlandLocation} = require('../../api/api')
const fs = require('fs')
// class Patrol {
//     constructor(patrolId,  onJob=false) {
//         this.patrolId = patrolId;
//         this.onJob = onJob;
//         this.assignedJob = null;
//         this.assignedJobLoc = null;
//         this.spawnLocation = this.generateRandomPointWithinBounds()
//         this.currentLocation = null;
//         this.spawnLocationDetails = null;
//         this.routePath = null;
//         this.travelTimeActualMins = null;
//         this.routeInterval = null;
//         this.assignedSimIteration = null
//         this.currentRouteIndex = 0
        
//     }

//      generateRandomPointWithinBounds() {
//         const swCoords = [50.100258, -5.756572]
//         const seCoords = [51.924729, 2.395283]
//         const nwCoords = [58.637598, -5.998272]
//         const neCoords = [58.649032, -2.834209]
//         const randomLat = Math.random() * (nwCoords[0] - swCoords[0]) + swCoords[0];
//         const randomLon = Math.random() * (seCoords[1] - swCoords[1]) + swCoords[1];
//         checkValidMainlandLocation(randomLat, randomLon)
//         .then(resArr => {
//             if (resArr.length === 0) {
//                 console.log('invalid spawn loc- RE-ROLLING!!!')
//                 this.generateRandomPointWithinBounds();
//             } else {
//                 if (resArr[0].countryIso2 !== "GB") {
//                     console.log('invalid spawn loc- RE-ROLLING!!!')
//                     this.generateRandomPointWithinBounds();                   
//                 } else {
//                     console.log('SPAWN LOC VALID!!')
//                     this.spawnLocationDetails = resArr[0];
//                     // console.log('resArr[0]', this.spawnLocationDetails)
//                     this.currentLocation = [resArr[0].latitude, resArr[0].longitude]
//                     // console.log('!!!current', this.currentLocation)
//                     // this.spawnLocation = [resArr[0].latitude, resArr[0].longitude]
//                     this.logLocData();
//                     return [resArr[0].latitude, resArr[0].longitude];
//                 }
//             }
//         })
//       }

//     logLocData() {
//         const jsonData = {
//             patrolId: this.patrolId,
//             spawnLocationDetails: this.spawnLocationDetails,
//             currentLoc: this.currentLocation
//           };
//           const jsonString = JSON.stringify(jsonData, null, 2);
//           const filePath = `./logs/${this.patrolId}.json`;
//           fs.writeFile(filePath, jsonString, (err) => {
//             if (err) {
//               console.error('Error logging patrol loc data @ Patrol class:', err);
//             } else {
//               console.log('patrol loc data logged @ Patrol Class');
//             }
//           });
//     }
//     updateLocation(newCoords) {
//         this.currentLocation = newCoords
//     }

// }

class Patrol {
    constructor(patrolId, onJob = false) {
      this.patrolId = patrolId;
      this.onJob = onJob;
      this.assignedJob = null;
      this.assignedJobLoc = null;
      this.spawnLocation = null; 
      this.currentLocation = null;
      this.spawnLocationDetails = null;
      this.routePath = null;
      this.travelTimeActualMins = null;
      this.routeInterval = null;
      this.assignedSimIteration = null;
      this.currentRouteIndex = 0;
  
      
      this.initSpawnLocation().then(() => {
        console.log('Spawn location set, class instantiation completed.');
      });
    }
  
    async initSpawnLocation() {
        try {
          this.spawnLocation = await this.generateRandomPointWithinBounds();
          console.log('Spawn Location:', this.spawnLocation); // Debugging: Check if spawnLocation is set
        } catch (error) {
          console.error('Error setting spawn location:', error);
        }
      }
  
    async generateRandomPointWithinBounds() {
      const swCoords = [50.100258, -5.756572];
      const seCoords = [51.924729, 2.395283];
      const nwCoords = [58.637598, -5.998272];
      const neCoords = [58.649032, -2.834209];
      const randomLat = Math.random() * (nwCoords[0] - swCoords[0]) + swCoords[0];
      const randomLon = Math.random() * (seCoords[1] - swCoords[1]) + swCoords[1];
  
      try {
        const resArr = await checkValidMainlandLocation(randomLat, randomLon);
        if (resArr.length === 0 || resArr[0].countryIso2 !== 'GB') {
          console.log('Invalid spawn loc- RE-ROLLING!!!');
          return this.generateRandomPointWithinBounds();
        } else {
          console.log('SPAWN LOC VALID!!');
          this.spawnLocationDetails = resArr[0];
          this.currentLocation = [resArr[0].latitude, resArr[0].longitude];
          this.logLocData();
          return [resArr[0].latitude, resArr[0].longitude];
        }
      } catch (error) {
        console.error('Error generating random point:', error);
        throw error;
      }
    }

    logLocData() {
      const jsonData = {
        patrolId: this.patrolId,
        spawnLocationDetails: this.spawnLocationDetails,
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

module.exports = Patrol