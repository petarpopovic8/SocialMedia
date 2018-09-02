const User = require("../../database_models/user_model");
const Mongoose = require("Mongoose");


module.exports = {
	name: "find_friends",
	register: async(plugin, options) => {
		plugin.route([
		{
			method: "GET",
			path: "/find_friends",
			config: {
				auth: "simple-cookie-strategy",
				handler: async(request, h) => {
					var odgovor;
					await new Promise((resolve, reject) => User.find({"email": {$ne: request.auth.credentials.user}}, function(err, users){
						odgovor = h.view("partials/find_friends", {users: users});
						resolve();
					}));
					return odgovor;
				}
			}
		},
		{
			method: "POST",
			path: "/friend_request",
			config: {
				auth: "simple-cookie-strategy",
				handler: async(request, h) => {
					var odgovor = null;
					await new Promise((resolve, reject) => User.find({"email": request.auth.credentials.user}, function(err, sending_user){
						if(err) reject();
						User.find({"member_id" : request.payload.friend_member_id}, function(err, added_user){
							added_user[0].update({$push: {"friend_requests": {"member_id": sending_user[0].member_id, 
							"friend_name": sending_user[0].name, "isRead" : false}}}, function(err){

							})
							console.log(added_user);})

							if(err)
								odgovor = err;
												resolve();
					}));
					return odgovor;
				}
			}
		},
		{
		method: "POST",
			path: "/accept_friend_request",
			config: {
				auth: "simple-cookie-strategy",
				handler: async(request, h) => {
					console.log(request.payload);
					await new Promise((resolve, reject) => User.find({"email": request.auth.credentials.user}, function(err, user){
						if(err) reject();
						User.find({"member_id" : request.payload.member_id}, function(err, accepted_user){

							user[0].update({$push: {"friends": {"member_id": accepted_user[0].member_id, 
							"friend_name": accepted_user[0].name, "profile_pic": accepted_user[0].user_profile[0].profile_pic,
							 "location": accepted_user[0].location}}, 
							$pull: {"friend_requests": {"member_id": accepted_user[0].member_id}}}, function(err){
																									});

							accepted_user[0].update({$push: {"friends": {"member_id": user[0].member_id, 
							"friend_name": user[0].name, "profile_pic": user[0].user_profile[0].profile_pic,
							"location": user[0].location}}}, function(err){
															 });
							})
						resolve();
					}))
					return null;
				}		
			}
		}	
		])
	}
}

module.exports.register.attributes = {
	pkg: require("./package.json")
}