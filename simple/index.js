'use strict';

const http = require('http')
	, url = require('url')
	;

const kPadding = 4;

function finalHandler(req, res) {
	res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
	res.write('<html><body>');
	res.write(`<h1>Plugin ${global.KServerApi.Name}</h1>`);
	res.write(`<h2>Request: ${req.method} ${url.format(req.url)}</h2>`);
	res.write('<hr>');
	res.write(`<h3>Request body: ${req.body}</h3>`);
	res.write('<hr>');
	res.write(`<h3>User info:</h3>
		<pre>${req.userInfo ? JSON.stringify(req.userInfo, null, kPadding) : 'some problem'}</pre>`);
	res.write('<hr>');
	res.write(`<h3>User list:</h3>
		<pre>${req.userList ? JSON.stringify(req.userList, null, kPadding) : 'some problem'}</pre>`);
	res.write('<hr>');
	res.write(`<h3>Check access:</h3>
		<pre>${req.checkAccess ? JSON.stringify(req.checkAccess, null, kPadding) : 'some problem'}</pre>`);
	res.write('<hr>');
	res.write(`<h3>Pick permissions:</h3>
		<pre>${req.pickPermissions ? JSON.stringify(req.pickPermissions, null, kPadding) : 'some problem'}</pre>`);
	res.write('<hr>');
	res.write(`<h3>Kodeks doc info:</h3>
		<pre>${req.kodeksDocInfo ? JSON.stringify(req.kodeksDocInfo, null, kPadding) : 'some problem'}</pre>`);
	res.write('<hr>');
	res.write(`<h3>Kodeks product status:</h3>
		<pre>${req.kodeksProductStatus ? JSON.stringify(req.kodeksProductStatus, null, kPadding) : 'some problem'}</pre>`);
	res.write('<hr>');
	res.write(`<h3>Non existing API method:</h3>
		<pre>${req.nonExistingAPIMethod ? JSON.stringify(req.nonExistingAPIMethod, null, kPadding) : 'some problem'}</pre>`);
	res.write('<hr>');
	res.write(`<h3>Request headers:</h3><pre>${JSON.stringify(req.headers, null, kPadding)}</pre>`);
	res.write('<hr>');
	res.write(`<h3>KServerApi:</h3><pre>${JSON.stringify(KServerApi
		, (k, v) => (typeof v === 'function') ? 'FUNCTION' : v, kPadding)}</pre>`);
	res.write('</body></html>');
	res.end();
}

const server = http.createServer((req, res) => {
	console.log(`plugin ${global.KServerApi.Name} , request`);

	let body = [];
	req.on('data', chunk => body.push(chunk))
	.on('end', () => {
		if (body) req.body = Buffer.concat(body).toString();

		// UserInfo 
		global.KServerApi.UserInfo(req)
		.then(userInfo => {
			try {
				req.userInfo = JSON.parse(userInfo);
			} catch (err) {
				req.userInfo = err.toString();
			}
		})
		.catch(error => {
			req.userInfo = error.toString();
		})

		// UserList 
		global.KServerApi.UserList()
		.then(userList => {
			try {
				req.userList = JSON.parse(userList);
			} catch (err) {
				req.userList = err.toString();
			}
		})
		.catch(error => {
			req.userInfo = error.toString();
		})

		// CheckAccess
		.then(() => {
			return global.KServerApi.CheckAccess(4360, req);
		})
		.then(access => {
			try {
				req.checkAccess = JSON.parse(access);
			} catch (err) {
				req.checkAccess = err.toString();
			}
		})
		.catch(error => {
			req.checkAccess = error.toString();
		})

		// PickPermissions
		.then(() => {
			return global.KServerApi.PickPermissions([
				[555100000, 0], ['555100000', '1'], 555100001, '555100002'
			], req);
		})
		.then(access => {
			try {
				req.pickPermissions = JSON.parse(access);
			} catch (err) {
				req.pickPermissions = err.toString();
			}
		})
		.catch(error => {
			req.pickPermissions = error.toString();
		})

		// KodeksDocInfo
		.then(() => {
			return global.KServerApi.KodeksDocInfo(9027690, req);
		})
		.then(access => {
			try {
				req.kodeksDocInfo = JSON.parse(access);
			} catch (err) {
				req.kodeksDocInfo = { error: err.toString() };
			}
		})
		.catch(error => {
			req.kodeksDocInfo = error.toString();
		})

		// KodeksProductStatus
		.then(() => {
			return global.KServerApi.KodeksProductStatus(10913, req);
		})
		.then(access => {
			try {
				req.kodeksProductStatus = JSON.parse(access);
			} catch (err) {
				req.kodeksProductStatus = err.toString();
			}
		})
		.catch(error => {
			req.kodeksProductStatus = error.toString();
		})

		// NonExistingAPIMethod
		.then(() => {
			return global.KServerApi.NonExistingAPIMethod();
		})
		.then(access => {
			try {
				req.nonExistingAPIMethod = JSON.parse(access);
			} catch (err) {
				req.nonExistingAPIMethod = err.toString();
			}
		})
		.catch(error => {
			req.nonExistingAPIMethod = error.toString();
		})

		// final
		.then(() => {
			return finalHandler(req, res);
		});
	})
	.on('error', e => console.error(`request error: ${e.toString()}`));
})
.on('error', e => console.error(`plugin ${global.KServerApi.Name} error: ${e.toString()}`));

server.listen(global.KServerApi.SocketPath, function () {
	console.log(`plugin ${global.KServerApi.Name} opened server on ${server.address()}`);
});
