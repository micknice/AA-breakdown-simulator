const turf = require('@turf/turf');

const swCoords = [50.100258, -5.756572]

const seCoords = [51.924729, 2.395283]

const nwCoords = [58.637598, -5.998272]

const neCoords = [58.649032, -2.834209]

const bbox = [-7.57216793459, 49.959999905, 1.68153079591, 58.6350001085];
const lineOptions = {unit: 'miles'}
const from1 = turf.point(swCoords)
const to1 = turf.point(nwCoords)
const from2 = turf.point(nwCoords)
const to2 = turf.point(neCoords)

const distance1 = turf.distance(from1, to1, lineOptions)
const distance2 = turf.distance(from2, to2, lineOptions)
const bboxPolygon = turf.bboxPolygon(bbox);
const area = turf.area(bboxPolygon);

const areaMiles = area * 0.00000038610215855

function calculateSquareSideLength(radius) {
    const diameter = radius * 2;
    const diagonal = diameter;
    const sideLength = diagonal / Math.sqrt(2);
    return sideLength;
  }

  function calculateNumberOfSquares(xLength, yLength, sqrLength) {
    const totalArea = xLength * yLength;
    const squareArea = sqrLength * sqrLength;
    const numSquares = Math.ceil(totalArea / squareArea);
    return numSquares;
  }

  function generateRandomPointWithinBounds() {
    const swCoords = [50.100258, -5.756572]
    const seCoords = [51.924729, 2.395283]
    const nwCoords = [58.637598, -5.998272]
    const neCoords = [58.649032, -2.834209]
    const randomLat = Math.random() * (nwCoords[0] - swCoords[0]) + swCoords[0];
    const randomLon = Math.random() * (seCoords[1] - swCoords[1]) + swCoords[1];
    return [randomLat, randomLon];
  }
  
const rangesCount = calculateNumberOfSquares(distance1, distance2, calculateSquareSideLength(100))
  
const squareSideLength = calculateSquareSideLength(100)

console.log('Area:', areaMiles, 'X, Y:', distance1, distance2, 'squareside:', squareSideLength, 'rangesCount:', rangesCount);

module.exports = {generateRandomPointWithinBounds}

