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
					var odgovor
					var name = request.auth.credentials.name;
					var user_statuses;
					await UserStatus.find({}, function(err, statuses){
						user_statuses = statuses;
						console.log("user_statuses", user_statuses);
					})
					console.log("pozz: ", name);	
					return h.view('home', {name: name, user_statuses: user_statuses});
				}
			}
			
		},
		{
			method: "POST",
			path: "/user_status/create",
			config: {
				auth: "simple-cookie-strategy",
				handler: async(request, h) => {
					var odgovor = null;
					await new Promise((resolve, reject) => User.findOne({"email": request.auth.credentials.user}, function(err, user){
						var user_status = new UserStatus({"user_email": request.auth.credentials.user,
							"user_status": request.payload.user_status,
							"name": request.auth.credentials.name,
							"profile_pic": user.user_profile[0].profile_pic
						})
						user_status.save(function(err, result){
							if(err){
								odgovor = Boom.badRequest('Došlo je do pogreške pri spremanju statusa!');
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
		}
		]);
	}
}	


module.exports.register.attributes = {
	pkg: require("./package.json")
}; 