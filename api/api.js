const axios = require('axios');

function getLatandLongByQuery(address, postCode) {
    const apiKey = 'Ar9kKaB9YZmOVKisMev3y_uwZjSiP6UqlVwDSweBa4QZfpxnKr27cHzDWBy0Vg44';
  
    return new Promise((resolve, reject) => {
      axios.get(`http://dev.virtualearth.net/REST/v1/Locations?countryRegion=uk&postalCode=${postCode}&addressLine=${address}&key=${apiKey}`)
        .then((response) => {
          console.log('bing api response recieved!');
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
    console.log('get distance invoked');
    const apiKey = 'Ar9kKaB9YZmOVKisMev3y_uwZjSiP6UqlVwDSweBa4QZfpxnKr27cHzDWBy0Vg44';
  
    return new Promise((resolve, reject) => {
      axios.get(`http://dev.virtualearth.net/REST/v1/Routes?wayPoint.1=${jobLoc}&wayPoint.2=${patrolLoc}&optimize=time&routeAttributes=routeSummariesOnly&maxSolutions=1&distanceUnit=Mile&key=${apiKey}`)
        .then((response) => {
          const resObj = response.data.resourceSets[0].resources[0];
        //   console.log('distance @ api', response.data.resourceSets[0].resources[0]);
          const result = {
            'distance': resObj.travelDistance,
            'eta': resObj.travelDuration,
            'etaWithTraffic': resObj.travelDurationTraffic
          };
          resolve(result);
        })
        .catch((error) => {
          console.log(error, 'error');
          reject(error);
        });
    });
  }


module.exports = {getLatandLongByQuery, getDistanceAndTime}

