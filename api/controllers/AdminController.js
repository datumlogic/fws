/**
 * AdminController
 *
 * @description :: Server-side logic for managing admins
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */
var passport = require('passport'), bcrypt = require('bcrypt'), queryS = require('url');
module.exports = {
  /**
   * `AdminController.index()`
   */
  index: function (req, res) {
	Admin.destroy({username:'fezzee'}).then(function(){
		console.log("user deleted");
	}).finally(function(){
		var user = {};
		user.username = 'fezzee';
		user.password = '123456fezz';
		user.status=true;
		user.is_admin=true;
		Admin.create(user).then(function(){
			return res.json({success: "user has been created in database"});
		}, function(err){
			return res.json({error: "error in saving the record "+err});
		}); 
	}, function(err){
			console.log("user doesn't exist");
	});
  },
  
  /**
   * Login Function
   **/
   login: function(req, res) {
        var is_auth = req.isAuthenticated();
        if (is_auth) {
             req.flash('info', res.i18n('Already signed in'));
             return res.redirect('/admin/home');
        } else {
            res.header('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
            if (req.cookies._auth_remember_me != undefined && req.cookies._auth_remember_me != null) {
                var rembrMeCk = req.cookies._auth_remember_me;
				Admin.findOne({rememberme_token: rembrMeCk}).done(function(err, user) {
					if (!err) {
						req.login(user, function(err) {
							if (err) {
								sails.log.error(err);
								res.view();
							} else {
								req.session.user = user;
								var rdrct = req.session.originalUrl != null ? req.session.originalUrl : '/';
								return res.redirect(rdrct);
							}
						});
					}
				});               
            } else {
                res.view();
            }
        }
    },
   process: function(req, res) {
        passport.authenticate('local', function(err, user, info) {
            if ((err) || (!user)) {
                res.redirect('/admin/login');
            }
            req.logIn(user, function(err) {
                if (err) {
                    sails.log.error(err);
                    //var errormsg = req.__('Invalid login credentials');
                    req.flash('error', res.i18n('Invalid login credentials'));
                    req.logout();
                    return res.redirect('/admin/login');
                }
                user.password = null;
                var rememberMe = function(callback) {
                    if (req.body.rememberme) {
                        var hashS = user.username + Math.round((new Date().valueOf() * Math.random()));
                        bcrypt.genSalt(10, function(err, salt) {
                            bcrypt.hash(hashS, salt, function(err, hash) {
                                if (!err) {
                                    Admin.findOne(user.id).done(function(err, usr) {
                                        if (!err) {
                                            usr.rememberme_token = hash;
                                            usr.save(function(err) {
                                                if (!err) {
                                                    res.cookie('_auth_remember_me', hash, {maxAge: 900000, httpOnly: true});
                                                }
                                                callback(err);
                                            });
                                        } else {
                                            sails.log("remeber me user error : " + err);
                                            callback(err);
                                        }
                                    });
                                } else {
                                    sails.log("remeber me token generation error : " + err);
                                    callback(err);
                                }
                            });
                        });
                    } else {
                        req.session.cookie.expires = false;
                        callback(null);
                    }
                }
                rememberMe(function(err) {
                    req.session.user = user;
                    req.flash('info', res.i18n('Successfully sign in'));
                    return res.redirect('/admin/home');
                });
            });
        })(req, res);
    },
    logout: function(req, res) {
        req.session.user = req.session.originalUrl = null;
        req.session.cookie.expires = false;
        res.clearCookie('_auth_remember_me');
        req.logout();
        req.flash('info', res.i18n('Successfully sign out'));
        return res.redirect(req.headers['referer']);
    }, 
    home: function(req,res){
		var is_auth = req.isAuthenticated();
		if(is_auth){
			if(req.method == "POST"){
				var section = req.param('Sections');
				if(section.id == ''){
					Section.create({section : section.section, detail:section.detail, order : section.order})
					.then(function(){
						req.flash('info',"New Section has been created");
					}, function(err){
						req.flash('error',"New Section couldn\'t be created. Please use unique order for every section");
					}).finally(function(){
						return res.redirect('/admin/listing');
					})
				} else{
					Section.findOne({id:section.id}).then(function(sectionData){
						sectionData.section = section.section;
						sectionData.detail = section.detail;
						sectionData.order = section.order;
						sectionData.save().then(function(){
							req.flash("info","Section has been saved successfully");
						}, function(err){
							req.flash("error","Section couldn\'t be saved successfully. Please use unique order for every section");
						}).finally(function(){
							return res.redirect('/admin/listing');
						})
					}, function(err){
						req.flash("error","Section doesn\'t exist!");
						return res.redirect('/admin/listing');
					});
						
				}
			} else{
				res.view();
			}
		} else{
			var rdrct = req.session.originalUrl != null ? req.session.originalUrl : '/';
			return res.redirect(rdrct);
		}
	},
	listing : function(req,res){
		var is_auth = req.isAuthenticated();
		if(is_auth){
			Section.find().then(function(sections){
				res.view({sections:sections});
			});
		} else{
			return res.redirect('/');
		}
	},
	deletes : function(req,res){
		var is_auth = req.isAuthenticated();
		var secId = req.param('id');
		if(is_auth){
			Section.destroy({id:secId}).then(function(){
				req.flash('info','Section has been deleted!');
			}, function(err){
				req.flash('error','Section couldn\'t be deleted!');	
			}).finally(function(){
				return res.redirect('/admin/listing');
			});
		}
	},
	edit:function(req,res){
		var is_auth = req.isAuthenticated();
		var secId = req.param('id');
		if(is_auth){	
			Section.findOne({id:secId}).then(function(section){
				res.view('admin/home',{section:section, edit:true});
			}, function(err){
				req.flash('error','Section doesn\'t exist!');	
			});
		} else{
			return res.redirect('/admin/login');
		}
	},
	newhome:function(req,res){
		Section.find().sort('order asc').then(function(sections){
				res.view('home/page',{layout: 'layout_homepage', sections:sections});
		});
	}
};

