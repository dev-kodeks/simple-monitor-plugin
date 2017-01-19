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
		<pre>${req.userInfo ? JSON.stringify(req.userInfo, null, kPadding) : 'no user id'}</pre>`);
	res.write('<hr>');
	res.write(`<h3>Check access:</h3>
		<pre>${req.checkAccess ? JSON.stringify(req.checkAccess, null, kPadding) : 'some problem'}</pre>`);
	res.write('<hr>');
	res.write(`<h3>Kodeks doc info:</h3>
		<pre>${req.kodeksDocInfo ? JSON.stringify(req.kodeksDocInfo, null, kPadding) : 'some problem'}</pre>`);
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
				req.userInfo = { error: err.toString() };
			}
		})
		.catch(error => {
			try {
				req.userInfo = JSON.parse(error);
			} catch (err) {
				req.userInfo = error.toString();
			}
		})

		// CheckAccess	
		.then(() => {
			return global.KServerApi.CheckAccess(4360, req);
		})
		.then(access => {
			try {
				req.checkAccess = JSON.parse(access);
			} catch (err) {
				req.checkAccess = { error: err.toString() };
			}
		})
		.catch(error => {
			try {
				req.checkAccess = JSON.parse(error);
			} catch (err) {
				req.checkAccess = { error: error.toString() };
			}
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
			try {
				req.kodeksDocInfo = JSON.parse(error);
			} catch (err) {
				req.kodeksDocInfo = { error: error.toString() };
			}
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
