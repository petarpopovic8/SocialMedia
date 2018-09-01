const User = require("../../database_models/user_model");
const shortid = require("shortid");
const fs = require("fs");
const UserStatus = require("../../database_models/user_status_model");




module.exports = {
	name: "UserProfile",
	register: async (plugin, options) => {
		plugin.route([
		{
			method: "GET",
			path: "/user_profile",
			config: {
				auth: "simple-cookie-strategy",
				handler: async (request, h) => {
					var odgovor = null;
					await User.findOne({"email": request.auth.credentials.user}, function(err, user){
						odgovor = h.view('user_profile', {name: request.auth.credentials.name, user: user});
					})
					return odgovor;
				}
			}


		},
		{
			method: "POST",
			path: "/user_profile/edit",
			config: {
				auth: "simple-cookie-strategy",
				handler: async (request, h) => {
					var odgovor;
					await new Promise((resolve, reject) => User.findOne({"email": request.auth.credentials.user}, function(err,user){
						user.name = request.payload.name;
						user.user_profile[0].location = request.payload.location;
						user.user_profile[0].bio = request.payload.bio;
						user.user_profile[0].interests = request.payload.interests;
						user.save(function(err, result){
							if(err){
								odgovor = Boom.badRequest('Došlo je do pogreške pri spremanju korisnikovih promjena!');
								resolve();
							} else {
								odgovor = result;
								resolve();
							} 
						})
					}));
					return odgovor;
				}
			}
		}, 
		{
			method: "POST",
			path: "/profile_pic/upload",
			config: {
				auth: "simple-cookie-strategy",
				handler: async(request, h) => {
					var odgovor;
					console.log("image_data", request.payload.image_data);
					var user_profile_image = "user_" + request.auth.credentials.member_id + "_" + shortid.generate() + "." + request.payload.image_type;
					await new Promise((resolve, reject) => fs.writeFile("user_profile_images/" + user_profile_image, new Buffer(request.payload.image_data, "base64"), function(err){
						if(!err){
							User.findOne({"email": request.auth.credentials.user}, function(err,user){
								user.user_profile[0].profile_pic = user_profile_image;
								user.save(function(err, result){
									if(err){
										odgovor = Boom.badRequest('Došlo je do pogreške pri spremanju korisnikovih promjena!');
										resolve();
									} else {
										UserStatus.updateOne({"user_email": request.auth.credentials.user}, {"profile_pic": user_profile_image}, function(err, result){
											odgovor = user_profile_image;
											resolve();
									  	})
									  }
								}); 
							});
						}
					}))
					return odgovor;
				}
			}
		}

		])
	}
}

module.exports.register.attributes = {
	pkg: require("./package.json")
};