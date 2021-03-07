import fs from 'fs';
import path from 'path';
import Sequelize from 'sequelize';
import enVariables from '../config/config.js';
// import Variables from '../config/smtp.config.js';

const basename = path.basename(__filename);
const env = process.env.NODE_ENV || 'development';
const config = enVariables[env];
const db = {};

let sequelize;
if (config.use_env_variable) {
  sequelize = new Sequelize(process.env[config.use_env_variable], config);
} else {
  sequelize = new Sequelize(config.database, config.username, config.password, config);
}

// sequelize = new Sequelize({
//   dialect: 'postgres',
//   host: '127.0.0.1',
//   port: '5432',
//   username: 'postgres',
//   password: 'password',
//   dbname: 'nodeauth'
// })

fs
  .readdirSync(__dirname)
  .filter(file => {
    return (file.indexOf('.') !== 0) && (file !== basename) && (file.slice(-3) === '.js');
  })
  .forEach(file => {
    const model = require(path.join(__dirname, file)).default(sequelize, Sequelize.DataTypes);
    db[model.name] = model;
  });

  // console.log(Variables.smtpOptions.auth.user)

Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

sequelize.authenticate().then( ()=>
console.log('Connection has been established successfully.')).catch(
(error)=>{
  console.error('Unable to connect to the database:', error);
})

// db["User"].sync({ alter: true }).then(()=>{
//   console.log("Table altered");
// }).catch((error)=>console.log(error))

db.sequelize = sequelize;
db.Sequelize = Sequelize;

export default db;
