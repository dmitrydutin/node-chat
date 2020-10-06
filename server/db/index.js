const mysql = require('mysql2')

const pool = mysql.createPool({
    connectionLimit: 10,
    host: 'us-cdbr-iron-east-01.cleardb.net',
    user: 'b86a7d62459dee',
    password: 'b5350c7c',
    database: 'heroku_553be57f57b5053'
})

module.exports = pool