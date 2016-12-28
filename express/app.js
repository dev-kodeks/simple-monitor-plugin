'use strict';

const http = require('http')
	, url = require('url')
	, inspect = require('util').inspect
	, express = require('express')
	, app = express()
	, bodyParser = require('body-parser')
	, cookieParser = require('cookie-parser')
	;

app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true })); 
app.use(bodyParser.json({ type: 'application/*+json' })); 
app.use(bodyParser.text({ type: 'text/html' }));

app.use(function (req, res, next) {
	if (!req.cookies || !req.cookies.Auth) return next();
	req.userId = new Buffer(req.cookies.Auth, 'base64').toString('ascii').split(':')[0];
	global.KodeksApi.UserInfo(req.userId)
		.then(userInfo => {
			req.userInfo = userInfo;
			return next();
		})
		.catch(error => {
			req.userInfo = { error: error };
			return next();
		});
});

app.all('*', function (req, res) {
	console.log(`plugin ${global.KodeksApi.Name} , request`);

	res.send(`plugin ${global.KodeksApi.Name}<br>
		userId: ${req.userId}<br>
		userInfo: ${inspect(req.userInfo)}<br>
		request: ${req.method} ${url.format(req.url)}<br>
		request.headers: ${inspect(req.headers)}<br>
		responce: okay from plugin ${global.KodeksApi.Name}`);
});

app.listen(global.KodeksApi.SocketPath, function () {
	console.log(`Example app listening on ${global.KodeksApi.SocketPath}!`);
});