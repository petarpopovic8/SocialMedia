const User = require("../../database_models/user_model");
const UserStatus = require("../../database_models/user_status_model");
const Boom = require("Boom");


module.exports = {
	name: "Homepage",
	register: async (plugin, options) => {
		plugin.route([
		{
			method: "GET",
			path:"/home",
			config: {
				auth: "simple-cookie-strategy",
				handler: async (request, h) => {
					var members = [];
					var user_statuses = [];
					var friend_requests = [];
					await new Promise((resolve,reject) => User.findOne({"email": request.auth.credentials.user}, function(err, user){
						members.push(user.member_id);
						user.friends.forEach(function(friend){
							members.push(friend.member_id);
						})
						user.friend_requests.forEach(x => friend_requests.push({member_id : x.member_id, friend_name: x.friend_name, profile_pic: x.profile_pic,
						 isRead: x.isRead}));
						user.friend_requests.forEach(x => x.isRead = true);
						user.save(function(err, result){
						});
						resolve();
					}));
					await new Promise((resolve, reject) => UserStatus.find({"member_id": {$in: members}}, function(err, statuses){
							user_statuses = statuses;
							user_statuses.sort(function(a, b) {
								return b.status_date - a.status_date;
							});
							resolve();
					}))
					return h.view('home', {date_now: new Date(), name: request.auth.credentials.name, member_id: request.auth.credentials.member_id, user_statuses: user_statuses, friend_requests: friend_requests});
				}
			}
			
		},
		{
			method: "POST",
			path: "/user_status/create",
			config: {
				auth: "simple-cookie-strategy",
				handler: async(request, h) => {
					var odgovor;
					await new Promise((resolve, reject) => User.findOne({"email": request.auth.credentials.user}, function(err, user){
						var user_status = new UserStatus({"member_id": request.auth.credentials.member_id,
							"user_status": request.payload.user_status,
							"name": request.auth.credentials.name,
							"profile_pic": user.user_profile[0].profile_pic
						})
						user_status.save(function(err, result){
							if(err){
								odgovor = Boom.badRequest('Došlo je do pogreške pri spremanju statusa!');
								resolve();
							} else {
								console.log("sejvali smo");
								odgovor = result;
								resolve();
							} 
						})
					}));
					return odgovor;
				}
				
			}
		}
		]);
	}
}	


module.exports.register.attributes = {
	pkg: require("./package.json")
}; 