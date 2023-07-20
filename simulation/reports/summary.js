class IterationSummary {
    constructor(iteration, simTime, total, completed, live, assigned, unassigned) {
        this.iteration = iteration;
        this.simTime = simTime;
        this.totalJobs = total;
        this.completedJobs =completed;
        this.liveJobs = live;
        this.assignedPatrols = assigned;
        this.unassignedPatrols = unassigned;
    }
}

module.exports = IterationSummary