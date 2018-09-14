const User = require("../../database_models/user_model");
const shortid = require("shortid");
const fs = require("fs");
const UserStatus = require("../../database_models/user_status_model");
const Boom = require("Boom");




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
						user.user_profile[0].friends = null;
						odgovor = h.view('user_profile', {name: request.auth.credentials.name, 
						member_id: request.auth.credentials.member_id,  user: user});
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
						console.log("Lokacija", request.payload.location);
						console.log("Bio", request.payload.bio);
						console.log("Interesi", request.payload.interests);
						user.save(function(err, result){
							if(err){
								console.log("greška");
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
										UserStatus.update({"user_email": request.auth.credentials.user}, {"profile_pic": user_profile_image}, {multi: true}, function(err, result){
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
		},
		{
			method: "GET",
			path: "/user_profile/{member_id}",
			config: {
				auth: "simple-cookie-strategy",
				handler: async(request, h) => {
					var isFriend;
					if(request.params.member_id === request.auth.credentials.member_id)
						isFriend = 1;
					else isFriend = 0;

					var odgovor = null;
					await new Promise((resolve, reject) => User.findOne({"email": request.auth.credentials.user}, function(err, user){
						user.friends.forEach(function(friend){
							if(friend.member_id === request.params.member_id){
								isFriend = 2;
								User.findOne({"member_id": friend.member_id}, function(err, visiting_friend){
									visiting_friend.friends = null;
									odgovor = h.view("user_profile_visit", {name: user.name, member_id: user.member_id,
									 user: visiting_friend, isFriend: isFriend});
									resolve();
								})

							}
						})
						if(isFriend == 0){
							User.findOne({"member_id": request.params.member_id}, function(err, visiting_user){
								visiting_user.friends = visiting_user.user_profile[0].location =
								visiting_user.user_profile[0].interests = null;
								odgovor = h.view("user_profile_visit", {name: user.name, member_id: member_id, user: visiting_user, isFriend: isFriend});
								resolve();
							})
						}
						if(isFriend == 1){
							user.friends = null;
							odgovor = h.view("user_profile_visit", {name: user.name, member_id: user.member_id, user: user, isFriend: isFriend});
							resolve();
						}
					}));
					return odgovor;
				}
			}
		},
		{
			method: "GET",
			path: "/user_profile/{member_id}/friends",
			config: {
				auth: "simple-cookie-strategy",
				handler: async(request, h) => {
					var odgovor;
					await new Promise((resolve, reject) => User.find({"member_id": request.params.member_id}, function(err, user){
						user[0].friends.forEach(function(friend){
							User.findOne({"member_id": friend.member_id}, function(err, myfriend){
								console.log("profile_pic", myfriend.user_profile[0].profile_pic);
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
};