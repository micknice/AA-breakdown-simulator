const {getLatandLongByQuery} = require('../../api/api')

class Breakdown {
    constructor(jobId, member, coordinates, memberId, logTime) {
        this.jobId = jobId
        this.memberId = memberId
        this.address = member.address;
        this.postCode = member.postcode ; 
        this.coordinates = coordinates;
        // Date here might be a problem
        // this.date = new Date();
        this.logTime = logTime;
        this.patrolAssigned = false;
        this.patrolId = null;
        this.assignmentTime = null;
        this.eta = null;
        this.etaWithTraffic = null;
        this.jobCompleted = false;
        this.completionTime = null;
    }
}

module.exports = Breakdown