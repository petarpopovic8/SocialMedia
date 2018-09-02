const User = require("../../database_models/user_model");

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
		}])
	}
}

module.exports.register.attributes = {
	pkg: require("./package.json")
}