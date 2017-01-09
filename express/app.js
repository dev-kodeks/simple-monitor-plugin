'use strict';

const http = require('http')
	, url = require('url')
	, express = require('express')
	, app = express()
	, cookieParser = require('cookie-parser')
	;

app.use(cookieParser());

app.use(function (req, res, next) {
	if (!req.cookies) return next();

	let userId = null;
	if (req.cookies.ClientUser) {
		req.userId = req.cookies.ClientUser;
	} else if (req.cookies.Auth) {
		req.userId = new Buffer(req.cookies.Auth, 'base64').toString('ascii').split(':')[0];
	}
	
	if (!req.userId) return next();

	global.KodeksApi.UserInfo(req.userId)
	.then(userInfo => {
		try {
			req.userInfo = JSON.parse(userInfo);
		} catch (err) {
			req.userInfo = { error: err.toString() };
		}
		return next();
	})
	.catch(error => {
		try {
			req.userInfo = JSON.parse(error);
		} catch (err) {
			req.userInfo = { error: error.toString() };
		}
		return next();
	});
});

const kPadding = 4;

app.all('*', function (req, res) {
	console.log(`plugin ${global.KodeksApi.Name} , request`);
	res.type('html');
	res.status(200);
	let str = '<html><body>';
	str += `<h1>Plugin ${global.KodeksApi.Name}</h1>`;
	str += `<h2>${req.method} ${url.format(req.url)}</h2>`;
	str += '<hr>';
	str += `<h3>User info:</h3>
		<pre>${req.userInfo ? JSON.stringify(req.userInfo, null, kPadding) : 'no user id'}</pre>`;
	str += '<hr>';
	str += `<h3>Request headers:</h3><pre>${JSON.stringify(req.headers, null, kPadding)}</pre>`;
	str += '<hr>';
	str += `<h3>KodeksApi:</h3><pre>${JSON.stringify(KodeksApi
		, (k, v) => (typeof v === 'function') ? 'FUNCTION' : v, kPadding)}</pre>`;
	str += '</body></html>';
	res.send(str);
});

app.listen(global.KodeksApi.SocketPath, function () {
	console.log(`Example app listening on ${global.KodeksApi.SocketPath}!`);
});