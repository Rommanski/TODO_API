var _ = require('underscore');
var bcrypt = require('bcrypt');
var crypto = require('crypto-js');
var jwt = require('jsonwebtoken');

module.exports = function (sequelise, DataTypes) {
    var user = sequelize.define('user', {
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
        classMethods : {
            authentificate : function(body) {
                return new Promise(function(resolve, reject) {
                    if ( !_.isString(body.email) || !_.isString(body.password) ) {
                        return reject();
                    }

                    user.findOne( {
                        where : {
                            email : body.email
                        }
                    } ).then( function(user) {
                        if ( !!user ) {
                            if ( bcrypt.compareSync(body.password, user.password_hash ) ) {
                                resolve(user);
                            } else {
                                return reject();
                            }
                        } else {
                            return reject();
                        }
                    }, function(e) {
                        reject();
                    } );
                });
            },
            findByToken : function(token) {
                return new Promise(function(resolve, reject) {
                    try {
                        var decotedJWT = jwt.verify(token, 'qwerty123');
                        var bytes = crypto.AES.decrypt(decotedJWT.token, 'qwerty');
                        var tokenData = JSON.parse(bytes.toString(crypto.enc.Utf8));

                        user.findById(tokenData.id).then(function(user) {
                            if (user) {
                                resolve(user);
                            } else {
                                console.log("User doen't find");
                                reject();
                            }
                        }, function(e) {
                            console.error(e);
                            reject();
                        });
                    } catch(err) {
                        console.error(err);
                        reject();
                    }
                });
            }
        },
        instanceMethods : {
            toPublicJSON : function() {
                var json = this.toJSON();
                return _.pick(json, 'id', 'email', 'updatedAt', 'createdAt');
            },
            generateToken : function(type) {
                if (!_.isString(type)) {
                    return undefined;
                }

                try {
                    var stringData = JSON.stringify({id : this.get('id'), type : type});
                    var encryptedData = crypto.AES.encrypt(stringData, 'qwerty').toString();
                    var token = jwt.sign({
                        token : encryptedData,
                    }, 'qwerty123');

                    return token;
                } catch (e) {
                    console.error(e);
                    return undefined;
                }
            }
        }
    });

    return user;
};
