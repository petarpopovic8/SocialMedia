const Hapi = require("hapi");
const server = new Hapi.Server({
	host:'localhost',
	port: 3000
})
const mongoose = require("mongoose");
const User = require("./database_models/user_model");
const node_connect_db = mongoose.connect("mongodb://localhost/node_connect");
const Boom = require("Boom");
const io = require("socket.io")(server.listener);

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

io.on("connection", function(socket){   //listener for successfuly established websocket connection
										//callback will run once successful connection has been made
	socket.on("attach_user_info", function(user_info){		//atttaching user information so users can send messages to each other
		socket.member_id = user_info.member_id;
		socket.user_name = user_info.user_name;
	})


	socket.on("message_from_client", function(usr_msg){    //returning a message from the connected client
		var all_connected_clients = io.sockets.connected;	//all open websocket connections
		for(var socket_id in all_connected_clients){
			if(all_connected_clients[socket_id].member_id === usr_msg.friend_member_id){	//iteriramo kroz objekt, ne polje
				var message_object = {"msg": usr_msg.msg, "user_name": socket.user_name};	//što je onda [socket_id]??
				all_connected_clients[socket_id].emit("message_from_server", message_object);
				break; 												//once we find out the recieving user's information
			}
		}
	})
})