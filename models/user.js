var _ = require('underscore');

module.exports = function (sequelise, DataTypes) {
    return sequelize.define('user', {
        email : {
            type : DataTypes.STRING,
            allowNull : false,
            unique : true,
            validate : {
                isEmail : true
            }
        },
        password : {
            type : DataTypes.STRING,
            allowNull : false,
            validate : {
                len : [7, 100]
            }
        }
    }, {
        hooks : {
            beforeValidate: function(user, options) {
                // convert email to lowercase
                if ( _.isString(user.email) ) {
                    user.email = user.email.toLowerCase();
                }
            }
        }
    });
};
