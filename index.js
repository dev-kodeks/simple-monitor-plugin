'use strict';

const inspect = require('util').inspect
	, http = require('http')
	, url = require('url')
	;

console.log('test plugin, index.js file executed');

const server = http.createServer((req, res) => {
	console.log(`plugin ${global.KodeksApi.Name} , request`);
	res.writeHead(200, {'Content-Type': 'text/plain'});
	res.end(`request: ${url.format(req.url)}
		, responce: okay from plugin ${global.KodeksApi.Name}`);
});
server.on('error', (e) => {
	console.error(`plugin ${global.KodeksApi.Name} error: ${inspect(e)}`);
});
server.listen(global.KodeksApi.SocketPath, function () {
	console.log(`plugin ${global.KodeksApi.Name} opened server on ${server.address()}`);
});
