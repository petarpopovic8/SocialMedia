const User = require("../../database_models/user_model");



module.exports.register = function(server, options, next){
	server.route([
	{
		method: "POST",
		path: "/sign_up",
		handler: function(request, h) {
			User.findOne({"email": request.payload.email}, function(err, existing_user){
				if(existing_user){
					return 'Ova email adresa je već korištena! Pokušajte ponovo s drugim email-om'.code(400);
				} else{

					var user = new User({"email": request.payload.email,
					"name": request.payload.name,
					"password": request.payload.password, "user_profile": {}});

					user.save(function(err, save_user_record){
						if(err){
							return 'Nastao je error pri registraciji'.code(400);
						} else{
							return 'Uspješna registracija!';
						}
					})
				}
			})
		}
	}

	]);


	next();
};

module.exports.register.attributes = {
	pkg: require("./package.json")
}