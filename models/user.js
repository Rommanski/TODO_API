var _ = require('underscore');
var bcrypt = require('bcrypt');

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
        salt : {
            type : DataTypes.STRING,
        },
        password_hash : {
            type : DataTypes.STRING,
        },
        password : {
            type : DataTypes.VIRTUAL,
            allowNull : false,
            validate : {
                len : [7, 100]
            },
            set : function(value) {
                var salt = bcrypt.genSaltSync(10);
                var hashedPassword = bcrypt.hashSync(value, salt);

                this.setDataValue('password', value);
                this.setDataValue('salt', salt);
                this.setDataValue('password_hash', hashedPassword);
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
        },
        instanceMethods : {
            toPublicJSON : function() {
                var json = this.toJSON();
                return _.pick(json, 'id', 'email', 'updatedAt', 'createdAt');
            }
        }
    });
};
