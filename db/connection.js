const { Pool } = require('pg');
const ENV = process.env.NODE_ENV || 'dev'

require('dotenv').config({
  path: `${__dirname}/../.env.${ENV}`,
});

const config = 
  {
    database: 'breakdown_service',
    max: 2
}
                        
                      


module.exports = new Pool(config);