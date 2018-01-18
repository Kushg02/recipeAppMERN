'use strict';

var path = process.cwd();
var ClickHandler = require(path + '/app/controllers/clickHandler.server.js');
var Users=require(path + '/app/models/users.js');
//var Recipes=require(path + '/app/models/recipes.js');

module.exports = function (app, passport) {

	function isLoggedIn (req, res, next) {
		if (req.isAuthenticated()) {
			return next();
		} else {
			console.log(req.url);
			//res.redirect('/login');
			//res.json({message:'Not logged in'});
			res.redirect('/');
		}
	}
	
	function parseMongooseErr (errMsg){
		
		//console.log("START HEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEERERERERERERERR");
		//console.log(typeof(errMsg.errors));
		console.log(errMsg.errors);
		//var stringMsg='';
		for (var error in errMsg.errors) {
			//console.log("TM error is" + errMsg.errors[error].message);
			//stringMsg+=errMsg.errors[error].message;
			var errToReport=errMsg.errors[error].message;
			if (errMsg.errors[error].message.includes('Cast')) {
				errToReport="Please provide a number.";
			}
			//stringMsg=stringMsg.concat(errToReport).concat('\n');
			//stringMsg=errMsg.errors[error].message;
		}
		return {errors:errToReport};
	}

	var clickHandler = new ClickHandler();

	app.route('/')
		.get(function (req, res) {
		//.get(isLoggedIn, function (req, res) {
			//res.sendFile(path + '/public/index.html');
			if (process.env.NODE_ENV==='production') {
				console.log('production url');
				res.sendFile(path + '/client/build/index.html');
			} else {
				res.redirect(process.env.APP_URL.substring(0,process.env.APP_URL.length-1)+":"+process.env.REACT_PORT);
			}
		});


	
	app.route('/login')
		.get(function (req, res) {
			//res.sendFile(path + '/public/login.html');
			res.redirect('/');
		});


	app.route('/logout')
		.get(function (req, res) {
			req.logout();
			res.redirect('/');
			//res.redirect('https://fccwebapps-mtanzim.c9users.io:8081');
		});

	/*
	app.route('/profile')
		.get(isLoggedIn, function (req, res) {
			res.sendFile(path + '/public/profile.html');
		});
	*/
	
	//signup route test
	/*
	app.route('/signup')
		.post( function (req, res){
			//console.log(req.body);
			res.json({'email':req.params.email, 'pass':req.params.password});
		});
	*/
	//signup route
	
	/*
	app.post('/signup',
			passport.authenticate('local-signup',
			{
				//successRedirect: '/test',
				//failureRedirect: '/login',
				failureFlash: 'Invalid username or password.',
				succesFlash: 'Welcome!'
			})
		);
		*/
	
	/*
	app.post('/signup', passport.authenticate('local-signup', {
	  successRedirect : '/profile', // redirect to the secure profile section
	  failureRedirect : '/test', // redirect back to the signup page if there is an error
	  failureFlash : true // allow flash messages
	}));
	*/

/*	
app.post('/signup',
  passport.authenticate('local', { successRedirect: '/',
  																 failureRedirect: '/',
  																 failureFlash: 'Invalid username or password.', 
                                   }));
                                   
*/
 //passport docs, local sign up/login
	app.post('/signup', function(req, res, next) {
		console.log(req.auth);
	  passport.authenticate('local', function(err, user, info) {
	    if (err) { return next(err); }
	    if (!user) { 
	    	//return res.send('Incorrect password!'); 
	    	return res.send(403, { error: "Invalid password!" });
	    }
	    req.logIn(user, function(err) {
	      if (err) { return next(err); }
	      return res.redirect('/');
	    });
	  })(req, res, next);
	});


	app.route('/api/:id')
		.get(isLoggedIn, function (req, res) {
			//res.json(req.user.facebook);
			res.json(req.user);
		});

	app.route('/auth/github')
		.get(passport.authenticate('github'));

	app.route('/auth/github/callback')
		.get(passport.authenticate('github', {
			successRedirect: '/',
			failureRedirect: '/login'
		}));
		
		
		//facebook login routes
		app.get('/auth/facebook', passport.authenticate('facebook', { 
      scope : ['public_profile', 'email']
    }));

    // handle the callback after facebook has authenticated the user
    app.get('/auth/facebook/callback',
        passport.authenticate('facebook', {
            successRedirect: '/',
						failureRedirect: '/login'
        }));


	/*
	app.route('/api/:id/clicks')
		.get(isLoggedIn, clickHandler.getClicks)
		.post(isLoggedIn, clickHandler.addClick)
		.delete(isLoggedIn, clickHandler.resetClicks);
	*/
	app.route('/test')
		.get(function(req, res) {
	    	res.send('Hello World!');
		});
	
	
	//get all recipes for user
	app.route('/getRecipes')
		.get(isLoggedIn, function(req, res) {
				Users.findById(req.user.id, function (err, user) {
		    //Users.findOne({ 'facebook.id': req.user.facebook.id }, function (err, user) {
		    	if (err) {
		    		res.json({isError:true});
		    	} else {
			    	console.log(user);
		    		res.json({isError:false, content:user.recipes});
		    	}
		    });
		})
	//add recipe
	app.route('/api/:id/recipe')
		.post(function (req, res){
			//console.log(req.params.recipeID);
			console.log(req.body);
			//console.log(req.params.id);
			Users.findById(req.user.id, function (err, user) {
			//Users.findOne({ 'facebook.id': req.user.facebook.id }, function (err, user) {
				console.log(user);
				if (err){
					res.json({isError:true, content:parseMongooseErr(err)});
				} else {
					user.recipes.unshift(req.body);
					user.save(function(err) {
						if (err) {
							res.json({isError:true, content:parseMongooseErr(err)});
						} else {
							console.log('New recipe added successfully!');
							res.json({isError:false, content:user.recipes});
						}
					});
				}
			});
		})
	//delete all recipes
	app.route('/api/:id/recipeDelAll')
		.delete( function(req,res){
			Users.findById(req.user.id, function (err, user) {
			//Users.findOne({ 'facebook.id': req.user.facebook.id }, function (err, user) {
				if (err){
					res.json({isError:true, content:parseMongooseErr(err)});
				} else {
					console.log(user);
					var recipeL=user.recipes.length-1;
					for (let i=recipeL; i > -1 ; i--){
						user.recipes.id(user.recipes[i]._id).remove();
					};
					user.save(function(err) {
						if (err) {
							res.json({isError:true, content:parseMongooseErr(err)});
						} else {
						//res.json({ message: 'All recipes deleted'});
							res.json({isError:false, content:'All recipes deleted'});
						}
					});
				}
				
			});
		});
	
	//delete one ingredient; edit ingredient name
	app.route('/api/:id/recipe/:recipeID/:ingID')
		//edit ingredient name
		.put (function(req, res){
			console.log(req.body);
			Users.findById(req.user.id, function (err, user) {
			//Users.findOne({ 'facebook.id': req.user.facebook.id }, function (err, user) {
				if (err){
					res.json({isError:true, content:parseMongooseErr(err)});
				} else {
					var editRecipe= user.recipes.id(req.params.recipeID);
					//console.log(recipe);
					editRecipe.ingredients.id(req.params.ingID).set(req.body);
					//console.log(recipe);
					user.save(function(err) {
						if (err) {
							res.json({isError:true, content:parseMongooseErr(err)});
						} else {
							console.log('Ingredient edited successfully!');
							//res.json(req.body);
							res.json({isError:false, content:req.body});
						}
					});
				}

			});
		})
		//delete ingredient
		.delete( function(req,res){
			//console.log(req.params.recipeID);
			//console.log(req.params.ingID);
			Users.findById(req.user.id, function (err, user) {
			//Users.findOne({ 'facebook.id': req.user.facebook.id }, function (err, user) {
				if (err) {
					res.json({isError:true, content:parseMongooseErr(err)});
				} else {
					var editRecipe= user.recipes.id(req.params.recipeID);
					editRecipe.ingredients.id(req.params.ingID).remove();
					console.log(editRecipe);
					user.save(function(err) {
						if (err) {
							res.json({isError:true, content:parseMongooseErr(err)});
						} else {
							console.log('Ingredient removed successfully!');
							//res.json(editRecipe);
							res.json({isError:false, content:editRecipe});
							//res.json({ message: 'Ingredient ' +req.params.ingID + ' has been deleted from recipe '+req.params.recipeID });
						}
					});
				}
			});
	});
	//delete all ingredients
	app.route('/api/:id/recipeDelAllIng/:recipeID')
		.delete( function(req,res){
			//console.log(req.params.recipeID);
			//console.log(req.params.ingID);
			Users.findById(req.user.id, function (err, user) {
			//Users.findOne({ 'facebook.id': req.user.facebook.id }, function (err, user) {
				if (err) {
					res.json({isError:true, content:parseMongooseErr(err)});
				} else {
					var editRecipe= user.recipes.id(req.params.recipeID);
					var ingredientL=editRecipe.ingredients.length-1;
					for (let i=ingredientL; i > -1 ; i--){
						editRecipe.ingredients.id(editRecipe.ingredients[i]._id).remove();
					};
					console.log('New Recipe:');
					console.log(editRecipe);
					user.save(function(err) {
						if (err) {
							res.json({isError:true, content:parseMongooseErr(err)});
						} else {
							console.log('All ingredients removed successfully!');
							//res.json(editRecipe);
							res.json({isError:false, content:editRecipe});
						}
					});
				}
			});
	});

	//add new ingredients, edit recipe name, or delete recipe
	app.route('/api/:id/recipe/:recipeID')
		.put (function(req, res){
			console.log(req.params.recipeID);
			console.log(req.body);
			Users.findById(req.user.id, function (err, user) {
			//Users.findOne({ 'facebook.id': req.user.facebook.id }, function (err, user) {
				if (err) {
					res.json({isError:true, content:parseMongooseErr(err)});
				} else {
					var editRecipe= user.recipes.id(req.params.recipeID);
					editRecipe.title=req.body.title;
					user.save(function(err) {
						if (err){
							res.json({isError:true, content:parseMongooseErr(err)});
						} else {
							console.log('New ingredient added successfully!');
							res.json({isError:false, content:editRecipe});
						} 
						//res.json(editRecipe);
					});
				}
			})
			//res.json({ message: 'Added ingredient to '+req.params.recipeID});
		})
		.post(function(req,res){
			console.log(req.params.recipeID);
			console.log(req.body);
			Users.findById(req.user.id, function (err, user) {
			//Users.findOne({ 'facebook.id': req.user.facebook.id }, function (err, user) {
				if (err) {
					res.json({isError:true, content:parseMongooseErr(err)});
				} else {
					var editRecipe= user.recipes.id(req.params.recipeID);
					console.log(editRecipe);
					editRecipe.ingredients.push(req.body);
					user.save(function(err) {
						if (err){
							res.json({isError:true, content:parseMongooseErr(err)});
						} else {
							console.log('New ingredient added successfully!');
							res.json({isError:false, content:editRecipe});
						} 
					});
				}
			})
			//res.json({ message: 'Added ingredient to '+req.params.recipeID});
		})
		.delete( function(req,res){
			Users.findById(req.user.id, function (err, user) {
			//Users.findOne({ 'facebook.id': req.user.facebook.id }, function (err, user) {
				if (err) {
					res.json({isError:true, content:parseMongooseErr(err)});
				} else {
					var editRecipe= user.recipes.id(req.params.recipeID);
					console.log(editRecipe);
					editRecipe.remove({ _id: req.params.recipeID }, function(err, recipe) {
					 if (err) {
						res.json({isError:true, content:parseMongooseErr(err)});
					} else {
						 user.save(function(err) {
		 					if (err){
								res.json({isError:true, content:parseMongooseErr(err)});
							} else {
								//res.json({isError:false, content:editRecipe});
								res.json({isError:false, content: 'Recipe ' +req.params.recipeID + ' has been deleted' });
							} 
						});
					}
						 
				 });
				}	
			});
	});

};
