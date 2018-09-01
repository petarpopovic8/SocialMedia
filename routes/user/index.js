const User = require("../../database_models/user_model");
const Boom = require("Boom");

 
module.exports = {
	
	name: "Register/Sign_in",
	register: async (server, options) => {
		server.route([
		{
			method: "POST",
			path: "/sign_up",
			handler: async (request, h) => {
				var odgovor = null;
				console.log(request.payload.email);
				await User.findOne({"email": request.payload.email}, function(err, existing_user){
					if(existing_user){
						console.log("već postoji");
						odgovor = Boom.badRequest('Email adresa već je registrirana');	
						Boom.badRequest('Email adresa je zauzeta');
					}  //vidi šta je s ovim, kako vratit tekst i code?
					 else{

						var user = new User({"email": request.payload.email,
						"name": request.payload.name,
						"password": request.payload.password, "user_profile": {}});

						user.save(function(err, save_user_record){
							if(err)
							 	return Boom.badRequest('Ups! Nastao je error pri registraciji!');
							else
								return {message: "Uspjeh!"}						
						})
				  	}
				})
				return odgovor;				
			}			
		}, 
		{
			method: "POST",
			path: "/login",
			handler: async(request,h) => {
				var odgovor = null;
				console.log("request_payload", request.payload);
				await User.findOne({"email": request.payload.email, "password": request.payload.password}, function(err, valid_user){
					if(valid_user){
						request.cookieAuth.set({"user": valid_user.email, "member_id": valid_user.member_id, "name": valid_user.name});
						
					} else {
						odgovor = Boom.badRequest('Krivi username ili šifra');
					}
				})
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