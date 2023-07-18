const {checkValidMainlandLocation} = require('../../api/api')
class Patrol {
    constructor(patrolId,  onJob=false) {
        this.patrolId = patrolId;
        this.onJob = onJob;
        this.assignedJob = null;
        this.assignedJobLoc = null;
        this.spawnLocation = this.generateRandomPointWithinBounds()
        this.currentLocation = null;
        this.spawnLocationDetails = null;
    }

    generateRandomPointWithinBounds() {
        const swCoords = [50.100258, -5.756572]
        const seCoords = [51.924729, 2.395283]
        const nwCoords = [58.637598, -5.998272]
        const neCoords = [58.649032, -2.834209]
        const randomLat = Math.random() * (nwCoords[0] - swCoords[0]) + swCoords[0];
        const randomLon = Math.random() * (seCoords[1] - swCoords[1]) + swCoords[1];
        checkValidMainlandLocation(randomLat, randomLon)
        .then(resArr => {
            if (resArr.length === 0) {
                console.log('invalid spawn loc- RE-ROLLING!!!')
                this.generateRandomPointWithinBounds();
            } else {
                console.log('SPAWN LOC VALID!!')
                this.spawnLocationDetails = resArr[0];
                // console.log('resArr[0]', this.spawnLocationDetails)
                this.currentLocation = [resArr[0].latitude, resArr[0].longitude]
                // console.log('!!!current', this.currentLocation)
                // this.spawnLocation = [resArr[0].latitude, resArr[0].longitude]
                return [resArr[0].latitude, resArr[0].longitude];
            }

        })
      }
    updateLocation(newCoords) {
        this.currentLocation = newCoords
    }

}

module.exports = Patrol