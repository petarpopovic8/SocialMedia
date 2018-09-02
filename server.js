const Hapi = require("hapi");
const server = new Hapi.Server({
	host:'localhost',
	port: 3000
})
const mongoose = require("mongoose");
const User = require("./database_models/user_model");
const node_connect_db = mongoose.connect("mongodb://localhost/node_connect");
const Boom = require("Boom");
const sync = require("sync");

server.start(console.log("test"));

server.route({
	method: "GET",
	path: "/",
	handler: function(request, h){
		return h.view('landing')
	}
});

server.route({
	method: "GET",
	path: "/sign-up",
	handler: function(request, h){
		return h.view('signup')
	}
})

server.route({
	method: "GET",
	path: "/sign-in",
	handler: function(request, h){
		return h.view('signin')
	}
})


server.register({
	plugin: require('vision')
}).then(() => {server.views({
	engines: {
		ejs: require("ejs")
	},
	relativeTo: __dirname,
	path:"views"
	});
 });

server.register({
	plugin: require('inert')
});

server.register(require('hapi-auth-cookie'));
server.auth.strategy("simple-cookie-strategy", "cookie",{
	cookie: "node_connect_cookie",
	password: "abcdefgjaksčodfkapsldkfajowpispa",
	isSecure: false
})

server.register({	
	plugin: require('./routes/home')
})

server.register({	
	plugin: require('./routes/user_profile')
})

server.register({
	plugin: require('./routes/friends')
})


server.route({
	method: "GET",
	path: "/{param*}",
	handler: {
		directory: {
			path: "public"
		}
	}
});

server.route({
	method: "GET",
	path: "/user_profile_images/{param*}",
	handler: {
		directory: {
			path: "user_profile_images"
		}
	}
});

server.register({
	plugin: require("./routes/user")
})
 

const start = async() => {
	await server.register(require("./routes/user"));
}