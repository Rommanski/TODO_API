var crypto = require('crypto-js');

module.exports = function(sequelize, DataTypes) {
    return sequelize.define('token', {
        token : {
            type : DataTypes.VIRTUAL,
            allowNull : false,
            validate : {
                len: [1]
            },
            set : function(value) {
                var hash = crypto.MD5(value).toString();
                console.log('crea a token');

                this.setDataValue('token', value);
                this.setDataValue('hash', hash);
            }
        },
        hash : DataTypes.STRING
    });
};
