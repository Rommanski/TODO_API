var Sequelize = require('sequelize');
var env = process.env.NODE_ENV || 'development';
var sequalize;

if (env === 'production') {
    sequelize = new Sequelize(process.env.DATABASE_URL, {
        dialect : 'postgres',
    });
} else {
    sequelize = new Sequelize(undefined, undefined, undefined, {
        'dialect' : 'sqlite',
        'storage' : __dirname + '/data/database.squlite'
    });
}

var db = {};
db.todo = sequelize.import(__dirname + '/models/todo.js');
db.user = sequelize.import(__dirname + '/models/user.js');
db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
