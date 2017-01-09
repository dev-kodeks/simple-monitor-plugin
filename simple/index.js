'use strict';

const http = require('http')
	, url = require('url')
	, querystring = require(('querystring'))
	;

const kPadding = 4;

function finalHandler(req, res) {
	res.writeHead(200, { 'Content-Type': 'Content-Type: text/html; charset=utf-8' });
	res.write('<html><body>');
	res.write(`<h1>Plugin ${global.KodeksApi.Name}</h1>`);
	res.write(`<h2>Request: ${req.method} ${url.format(req.url)}</h2>`);
	res.write('<hr>');
	res.write(`<h3>Request body: ${req.body}</h3>`);
	res.write('<hr>');
	res.write(`<h3>User info:</h3>
		<pre>${req.userInfo ? JSON.stringify(req.userInfo, null, kPadding) : 'no user id'}</pre>`);
	res.write('<hr>');
	res.write(`<h3>Request headers:</h3><pre>${JSON.stringify(req.headers, null, kPadding)}</pre>`);
	res.write('<hr>');
	res.write(`<h3>KodeksApi:</h3><pre>${JSON.stringify(KodeksApi
		, (k, v) => (typeof v === 'function') ? 'FUNCTION' : v, kPadding)}</pre>`);
	res.write('</body></html>');
	res.end();
}

function getUserId(cookie) {
	let userId = null;
	const obj = querystring.parse(cookie, '; ');
	if (obj.ClientUser) userId = obj.ClientUser;
	else if (obj.Auth) userId = new Buffer(obj.Auth, 'base64').toString('ascii').split(':')[0];
	return userId;
}

const server = http.createServer((req, res) => {
	console.log(`plugin ${global.KodeksApi.Name} , request`);

	let body = [];
	req.on('data', chunk => body.push(chunk))
	.on('end', () => {
		if (body) req.body = Buffer.concat(body).toString();
		
		if (!req.headers.cookie) return finalHandler(req, res);

		const userId = getUserId(req.headers.cookie);
		if (!userId) return finalHandler(req, res);

		req.userId = userId;
		global.KodeksApi.UserInfo(req.userId)
		.then(userInfo => {
			try {
				req.userInfo = JSON.parse(userInfo);
			} catch (err) {
				req.userInfo = { error: err.toString() };
			}
			return finalHandler(req, res);
		})
		.catch(error => {
			try {
				req.userInfo = JSON.parse(error);
			} catch (err) {
				req.userInfo = error.toString();
			}
			return finalHandler(req, res);
		});
	})
	.on('error', e => console.error(`request error: ${e.toString()}`));
})
.on('error', e => console.error(`plugin ${global.KodeksApi.Name} error: ${e.toString()}`));

server.listen(global.KodeksApi.SocketPath, function () {
	console.log(`plugin ${global.KodeksApi.Name} opened server on ${server.address()}`);
});
