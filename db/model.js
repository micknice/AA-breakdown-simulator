const format = require('pg-format');
const db = require('./connection');


const getMemberDetailsById = (id) => {
    return db.query(
        `SELECT * FROM addresses
        WHERE address_id = $1`, [id]
        )
    .then(result => {
        // console.log('model output', result.rows[0])
        return result.rows[0];
    })
}


module.exports = {getMemberDetailsById}