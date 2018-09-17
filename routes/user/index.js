const User = require("../../database_models/user_model");
const Boom = require("Boom");
const shortid = require("shortid");
const fs = require("fs");

 
module.exports = {
	
	name: "Register/Sign_in",
	register: async (server, options) => {
		server.route([
		{
			method: "POST",
			path: "/sign_up",
			handler: async (request, h) => {
				var odgovor = null;
				await new Promise((resolve, reject) => User.findOne({"email": request.payload.email}, function(err, existing_user){
					if(existing_user){
						odgovor = Boom.badRequest('Email adresa već je registrirana');
						resolve();	
					}  //vidi šta je s ovim, kako vratit tekst i code?
					else{
						var user = new User({"email": request.payload.email,
						"name": request.payload.name,
						"password": request.payload.password, "user_profile": {
							"bio": request.payload.bio, "interests": request.payload.interests
						}});
						if( request.payload.image_data == "" || request.payload.image_type == "" || request.payload.image_type =="null" || request.payload.image == null){
							user.user_profile[0].profile_pic = "default_profile.png";
							request.cookieAuth.set({"user": user.email, "member_id": user.member_id, "name": user.name});
							user.save(function(err, save_user_record){
								if(err){
								 	return Boom.badRequest('Ups! Nastao je error pri registraciji!');
								 	resolve();
								}
								else{
									odgovor = "default_profile.png";
									resolve();
								}		
							})
						}
						else{
							var user_profile_image = "user_" + user.member_id + "_" + shortid.generate() + "." + request.payload.image_type.replace(/['"]+/g, '');
						 	fs.writeFile("user_profile_images/" + user_profile_image, new Buffer(request.payload.image_data, "base64"), function(err){
								if(!err){
									user.user_profile[0].profile_pic = user_profile_image;
									request.cookieAuth.set({"user": user.email, "member_id": user.member_id, "name": user.name});
									user.save(function(err, save_user_record){
										if(err){
										 	return Boom.badRequest('Ups! Nastao je error pri registraciji!');
										 	resolve();
										}
										else{
											odgovor = user_profile_image;
											resolve();
										}		
									})
				  	 			}
							})
						};
					}
				}))		
				return odgovor;				
			}			
		}, 
		{
			method: "POST",
			path: "/login",
			handler: async(request,h) => {
				var odgovor = null;
				console.log(request.payload);
				await new Promise((resolve, reject) => User.findOne({"email": request.payload.email, "password": request.payload.password}, function(err, valid_user){
					if(valid_user){
						request.cookieAuth.set({"user": valid_user.email, "member_id": valid_user.member_id, "name": valid_user.name});
						resolve();
						
					} else {
						odgovor = Boom.badRequest('Krivi username ili šifra');
						resolve();
					}
				}));
				return odgovor;
			}
		},
		{
			method: "POST",
			path: "/logout",
			handler: async(request, h) => {
				request.cookieAuth.clear();
				return null;
			}
		}
		]);
	}
} 




module.exports.register.attributes = {
	pkg: require("./package.json")
}