const {getLatandLongByQuery} = require('../../api/api')

class Breakdown {
    constructor(jobId, member, coordinates) {
        this.jobId = jobId
        this.address = member.address;
        this.postCode = member.postcode ; 
        this.coordinates = coordinates;
        this.date = new Date();
        this.logTime = `${this.date.getHours()} : ${this.date.getMinutes()}`;
        this.patrolAssigned = false;
        this.jobCompleted = false;
        this.completionTime = null;
    }
}

module.exports = Breakdown