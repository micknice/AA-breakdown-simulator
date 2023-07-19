const ENV = process.env.NODE_ENV || 'dev'

require('dotenv').config({
  path: `${__dirname}/../.env.${ENV}`,
});
const axios = require('axios');

function getLatandLongByQuery(address, postCode) {
    const apiKey = process.env.BING_MAPS_API_KEY;
  
    return new Promise((resolve, reject) => {
      axios.get(`http://dev.virtualearth.net/REST/v1/Locations?countryRegion=uk&postalCode=${postCode}&addressLine=${address}&key=${apiKey}`)
        .then((response) => {
          const coordinates = response.data.resourceSets[0].resources[0].geocodePoints[0].coordinates;
          resolve(coordinates);
        })
        .catch((error) => {
          console.log(error, 'error');
          reject(error);
        });
    });
  }

  function getDistanceAndTime(jobLoc, patrolLoc) {
    console.log('get distance invoked!!!!!!!');
    console.log('api args!!!!!', jobLoc, patrolLoc)
    const apiKey = process.env.BING_MAPS_API_KEY;
  
    return new Promise((resolve, reject) => {
      // axios.get(`http://dev.virtualearth.net/REST/v1/Routes?wayPoint.1=${jobLoc}&wayPoint.2=${patrolLoc}&optimize=time&routeAttributes=routeSummariesOnly&maxSolutions=1&distanceUnit=Mile&key=${apiKey}`)
      axios.get(`http://dev.virtualearth.net/REST/v1/Routes?wayPoint.1=${jobLoc}&wayPoint.2=${patrolLoc}&optimize=time&routeAttributes=excludeItinerary,routePath&maxSolutions=1&distanceUnit=Mile&key=${apiKey}`)
        .then((response) => {
          
          const resObj = response.data.resourceSets[0].resources[0];
        //DISTANCE IN MILES ETA IN SECONDS
          const result = {
            'distance': resObj.travelDistance,
            'eta': resObj.travelDuration,
            'etaWithTraffic': resObj.travelDurationTraffic,
            'routePath': resObj.routePath.line.coordinates
          };
          resolve(result);
        })
        .catch((error) => {
          console.log(error, 'error');
          reject(error);
        });
    });
  }
  
  function checkValidMainlandLocation(lat, long) {
    console.log('!!!!!!process env', process.env.BING_MAPS_API_KEY)
    const latLong = `${lat},${long}`
    const apiKey = process.env.BING_MAPS_API_KEY;
  
    return new Promise((resolve, reject) => {
      axios.get(`http://dev.virtualearth.net/REST/v1/locationrecog/${latLong}?key=${apiKey}&includeEntityTypes=address&output=json`)
        .then((response) => {
        //   resArr contains object with address details if valid latLong else empty arr
          const resArr = response.data.resourceSets[0].resources[0].addressOfLocation
          resolve(resArr);
        })
        .catch((error) => {
          console.log(error, 'error');
          reject(error);
        });
    });
  }


  

module.exports = {getLatandLongByQuery, getDistanceAndTime, checkValidMainlandLocation}

