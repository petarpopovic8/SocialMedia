const User = require("../../database_models/user_model");
const Mongoose = require("Mongoose");
const Boom = require("Boom");


module.exports = {
	name: "friends",
	register: async(plugin, options) => {
		plugin.route([
		{
			method: "GET",
			path: "/find_friends",
			config: {
				auth: "simple-cookie-strategy",
				handler: async(request, h) => {
					var odgovor;
					var ids = [];
					await new Promise((resolve, reject) => User.findOne({"member_id": request.auth.credentials.member_id}, function(err, user){
						ids.push(user.member_id);
						user.friends.forEach(function(friend){
							ids.push(friend.member_id);
						})
						user.friend_requests.forEach(function(request){
							ids.push(request.member_id);
						})
						user.sent_requests.forEach(function(request){
							ids.push(request.member_id);
						})
						resolve();
					}));
					console.log("ids", ids);
					await new Promise((resolve, reject) => User.find({"member_id": {$nin: ids}}, function(err, users){
						
						console.log("users:", users);
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
						sending_user[0].update({$push: {"sent_requests": {"member_id": request.payload.friend_member_id}}}, function(err){
						})
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
		},
		{
			method: "GET",
			path: "/friends",
			config: {
				auth: "simple-cookie-strategy",
				handler: async(request, h) => {
					var odgovor;
					await new Promise((resolve, reject) => User.find({"email": request.auth.credentials.user}, function(err, user){
						user[0].friends.forEach(function(friend){
							User.findOne({"member_id": friend.member_id}, function(err, myfriend){
								if(friend.profile_pic != myfriend.user_profile[0].profile_pic)
									friend.profile_pic = myfriend.user_profile[0].profile_pic;
								if(friend.location != myfriend.user_profile[0].location)
									friend.location = myfriend.user_profile[0].location;
								if(friend.name != myfriend.name)
									friend.name = myfriend.name;
							})
						})
						user[0].save(function(err, result){
							if(err)
								odgovor = Boom.badRequest('Došlo je do pogreške pri osvježavanju korisnikovih prijatelja');
						})
						var friends = user[0].friends.sort(function(a, b) {
   								var textA = a.friend_name;
    							var textB = b.friend_name;
   								return (textA < textB) ? -1 : (textA > textB) ? 1 : 0;
						});
						odgovor = h.view("partials/friends", {friends: friends});
						resolve();
					}));
					return odgovor;
				}
			}
		}	
		])
	}
}

module.exports.register.attributes = {
	pkg: require("./package.json")
}