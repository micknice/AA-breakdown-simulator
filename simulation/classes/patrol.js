
class Patrol {
    constructor(patrolId,  onJob=false) {
        this.patrolId = patrolId;
        this.onJob = onJob;
        this.assignedJob = null;
        this.spawnLocation = this.generateRandomPointWithinBounds()
        this.currentLocation = this.spawnLocation
    }

    generateRandomPointWithinBounds() {
        const swCoords = [50.100258, -5.756572]
        const seCoords = [51.924729, 2.395283]
        const nwCoords = [58.637598, -5.998272]
        const neCoords = [58.649032, -2.834209]
        const randomLat = Math.random() * (nwCoords[0] - swCoords[0]) + swCoords[0];
        const randomLon = Math.random() * (seCoords[1] - swCoords[1]) + swCoords[1];
        return [randomLat, randomLon];
      }
    updateLocation(newCoords) {
        this.currentLocation = newCoords
    }

}

module.exports = Patrol