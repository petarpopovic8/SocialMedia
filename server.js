const Hapi = require("hapi");
const server = new Hapi.Server({
	host:'localhost',
	port: 3000
})
const mongoose = require("mongoose");
const User = require("./database_models/user_model");
const node_connect_db = mongoose.connect("mongodb://localhost/node_connect");

server.start(console.log("test"));

server.route({
	method: "GET",
	path: "/",
	handler: function(request, h){
		return h.view('landing')
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

server.route({
	method: "GET",
	path: "/{param*}",
	handler: {
		directory: {
			path: "public"
		}
	}
});

const start = async() => {
	await server.register(require("./routes/user"));
}


/*server.register({
	register: require("./routes/user")
}).then(() => {server.views({
		function(err){
			if(err)
				return;
		}
	});
}); */