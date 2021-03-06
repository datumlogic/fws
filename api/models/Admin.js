/**
* Admin.js
*
* @description :: TODO: You might write a short summary of how this model works and what it represents here.
* @docs        :: http://sailsjs.org/#!documentation/models
*/

module.exports = {

  attributes: {
		username: {
		  type: 'string',
		  unique: true,
		  required: true
		},
		password: {
		  type: 'string',
		  required: true,
		  minLength: 6
		},
		status: 'BOOLEAN',
        is_admin: 'BOOLEAN',
        rememberme_token: {
            type: 'STRING',
            unique: true
        },
        reset_password_token: {
            type: 'STRING',
            unique: true
        },
        reset_password_sent_at: 'DATETIME',
        toJSON: function() {
            var obj = this.toObject();
            delete obj.password;
            return obj;
        }
  },
  beforeCreate: function (attrs, next) {
    var bcrypt = require('bcrypt');

    bcrypt.genSalt(10, function(err, salt) {
      if (err) return next(err);

      bcrypt.hash(attrs.password, salt, function(err, hash) {
        if (err) return next(err);
        attrs.password = hash;
        next();
      });
    });
  }
};

