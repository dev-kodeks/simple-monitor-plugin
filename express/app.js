'use strict';

const http = require('http')
	, url = require('url')
	, express = require('express')
	, app = express()
	;

// UserInfo
app.use(function (req, res, next) {
	global.KServerApi.UserInfo(req)
	.then(userInfo => {
		try {
			req.userInfo = JSON.parse(userInfo);
		} catch (err) {
			req.userInfo = err.toString();
		}
		return next();
	})
	.catch(error => {
		req.userInfo = error.toString();
		return next();
	});
});

// UserList
app.use(function (req, res, next) {
	global.KServerApi.UserList(req)
	.then(userList => {
		try {
			req.userList = JSON.parse(userList);
		} catch (err) {
			req.userList = err.toString();
		}
		return next();
	})
	.catch(error => {
		req.userList = error.toString();
		return next();
	});
});

// CheckAccess
app.use(function (req, res, next) {
	global.KServerApi.CheckAccess(4360, req)
	.then(access => {
		try {
			req.checkAccess = JSON.parse(access);
		} catch (err) {
			req.checkAccess = err.toString();
		}
		return next();
	})
	.catch(error => {
		req.checkAccess = error.toString();
		return next();
	});
});

// KodeksDocInfo
app.use(function (req, res, next) {
	global.KServerApi.KodeksDocInfo(9027690, req)
	.then(docInfo => {
		try {
			req.kodeksDocInfo = JSON.parse(docInfo);
		} catch (err) {
			req.kodeksDocInfo = err.toString();
		}
		return next();
	})
	.catch(error => {
		req.kodeksDocInfo = error.toString();
		return next();
	});
});

// KodeksProductStatus
app.use(function (req, res, next) {
	global.KServerApi.KodeksProductStatus(777714430, req)
	.then(productStatus => {
		try {
			req.kodeksProductStatus = JSON.parse(productStatus);
		} catch (err) {
			req.kodeksProductStatus = err.toString();
		}
		return next();
	})
	.catch(error => {
		req.kodeksProductStatus = error.toString();
		return next();
	});
});

// NonExistingAPIMethod
app.use(function (req, res, next) {
	global.KServerApi.NonExistingAPIMethod()
	.then(nonExistingAPIMethod => {
		try {
			req.nonExistingAPIMethod = JSON.parse(nonExistingAPIMethod);
		} catch (err) {
			req.nonExistingAPIMethod = err.toString();
		}
		return next();
	})
	.catch(error => {
		req.nonExistingAPIMethod = error.toString();
		return next();
	});
});

const kPadding = 4;

app.all('*', function (req, res) {
	console.log(`plugin ${global.KServerApi.Name} , request`);
	res.type('html');
	res.status(200);
	let str = '<html><body>';
	str += `<h1>Plugin ${global.KServerApi.Name}</h1>`;
	str += `<h2>${req.method} ${url.format(req.url)}</h2>`;
	str += '<hr>';
	str += `<h3>User info:</h3>
		<pre>${req.userInfo ? JSON.stringify(req.userInfo, null, kPadding) : 'some problem'}</pre>`;
	str += '<hr>';
	str += `<h3>User list:</h3>
		<pre>${req.userList ? JSON.stringify(req.userList, null, kPadding) : 'some problem'}</pre>`;
	str += '<hr>';
	str += `<h3>Check access:</h3>
		<pre>${req.checkAccess ? JSON.stringify(req.checkAccess, null, kPadding) : 'some problem'}</pre>`;
	str += '<hr>';
	str += `<h3>Kodeks doc info:</h3>
		<pre>${req.kodeksDocInfo ? JSON.stringify(req.kodeksDocInfo, null, kPadding) : 'some problem'}</pre>`;
	str += '<hr>';
	str += `<h3>Kodeks product status:</h3>
		<pre>${req.kodeksProductStatus ? JSON.stringify(req.kodeksProductStatus, null, kPadding) : 'some problem'}</pre>`;
	str += '<hr>';
	str += `<h3>Non existing API method:</h3>
		<pre>${req.nonExistingAPIMethod ? JSON.stringify(req.nonExistingAPIMethod, null, kPadding) : 'some problem'}</pre>`;
	str += '<hr>';
	str += `<h3>Request headers:</h3><pre>${JSON.stringify(req.headers, null, kPadding)}</pre>`;
	str += '<hr>';
	str += `<h3>KServerApi:</h3><pre>${JSON.stringify(KServerApi
		, (k, v) => (typeof v === 'function') ? 'FUNCTION' : v, kPadding)}</pre>`;
	str += '</body></html>';
	res.send(str);
});

app.listen(global.KServerApi.SocketPath, function () {
	console.log(`Example app listening on ${global.KServerApi.SocketPath}!`);
});