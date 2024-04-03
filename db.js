const postgres = require("postgres");
require('dotenv').config();

const connectionString = process.env.DATABASE_URL;
console.log(process.env.DATABASE_URL)
const sql = postgres(connectionString);

module.exports = sql;
