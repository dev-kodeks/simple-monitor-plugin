'use strict';

const http = require('http')
	, url = require('url')
	;

const kPadding = 4;

let sendMailEnabled = false;

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
	res.write(`<h3>Set licensed parameter:</h3>
		<pre>${req.setLicensedParameter ? JSON.stringify(req.setLicensedParameter, null, kPadding) : 'some problem'}</pre>`);

	res.write('<hr>');
	res.write(`<h3>Increase licensed parameter:</h3>
		<pre>${req.incLicensedParameter ? JSON.stringify(req.incLicensedParameter, null, kPadding) : 'some problem'}</pre>`);

	res.write('<hr>');
	res.write(`<h3>Decrease licensed parameter:</h3>
		<pre>${req.decLicensedParameter ? JSON.stringify(req.decLicensedParameter, null, kPadding) : 'some problem'}</pre>`);

	res.write('<hr>');
	res.write(`<h3>Check licensed parameter:</h3>
		<pre>${req.checkLicensedParameter ? JSON.stringify(req.checkLicensedParameter, null, kPadding) : 'some problem'}</pre>`);

	res.write('<hr>');
	res.write(`<h3>Validate license:</h3>
		<pre>${req.validateLicense ? JSON.stringify(req.validateLicense, null, kPadding) : 'some problem'}</pre>`);

	res.write('<hr>');
	res.write(`<h3>Kodeks doc info:</h3>
		<pre>${req.kodeksDocInfo ? JSON.stringify(req.kodeksDocInfo, null, kPadding) : 'some problem'}</pre>`);

	res.write('<hr>');
	res.write(`<h3>Kodeks product status:</h3>
		<pre>${req.kodeksProductStatus ? JSON.stringify(req.kodeksProductStatus, null, kPadding) : 'some problem'}</pre>`);

	res.write('<hr>');
	res.write(`<h3>Server info:</h3>
		<pre>${req.serverInfo ? JSON.stringify(req.serverInfo, null, kPadding) : 'some problem'}</pre>`);

	res.write('<hr>');
	res.write(`<h3>Service name:</h3>
		<pre>${req.serviceName ? JSON.stringify(req.serviceName, null, kPadding) : 'some problem'}</pre>`);

	if (sendMailEnabled) {
		res.write('<hr>');
		res.write(`<h3>Send mail:</h3>
			<pre>${req.sendMail ? JSON.stringify(req.sendMail, null, kPadding) : 'some problem'}</pre>`);
	}

	res.write('<hr>');
	res.write(`<h3>Nonexistent API method:</h3>
		<pre>${req.nonexistentAPIMethod ? JSON.stringify(req.nonexistentAPIMethod, null, kPadding) : 'some problem'}</pre>`);

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
		if (req.url.endsWith('exit')) return process.exit();
		else if (req.url.endsWith('abort')) return process.abort();

		if (body) req.body = Buffer.concat(body).toString();

		// UserInfo 
		global.KServerApi.UserInfo(req)
		.then(userInfo => {
			req.userInfo = userInfo;
		})
		.catch(error => {
			req.userInfo = error.toString();
		});

		// UserList 
		global.KServerApi.UserList()
		.then(userList => {
			req.userList = userList;
		})
		.catch(error => {
			req.userList = error.toString();
		})

		// CheckAccess
		.then(() => {
			return global.KServerApi.CheckAccess(100005, req); // old lic: 4360
		})
		.then(access => {
			req.checkAccess = access;
		})
		.catch(error => {
			req.checkAccess = error.toString();
		})

		// PickPermissions
		.then(() => {
			return global.KServerApi.PickPermissions([
				[555100000, 0], ['555100000', '1'], 555100001, '555100002', 333101000, 333101101, [333101102], 333101103, 333101105
			], req);
		})
		.then(access => {
				req.pickPermissions = access;
		})
		.catch(error => {
			req.pickPermissions = error.toString();
		})

		// SetLicensedParameter
		.then(() => {
			return global.KServerApi.SetLicensedParameter(100002, 0, 50, 123456789);
		})
		.then(result => {
			req.setLicensedParameter = 'set' + (result ? '' : ' with "overuse" status');
		})
		.catch(error => {
			req.setLicensedParameter = error.toString();
		})

		// IncLicensedParameter (+5)
		.then(() => {
			return global.KServerApi.IncLicensedParameter(100002, 0, 5, 123456789);
		})
		.then(result => {
			req.incLicensedParameter = result;
		})
		.catch(error => {
			req.incLicensedParameter = error.toString();
		})

		// IncLicensedParameter (-60)
		.then(() => {
			return global.KServerApi.IncLicensedParameter(100002, 0, -60, 123456789);
		})
		.then(result => {
			req.decLicensedParameter = result;
		})
		.catch(error => {
			req.decLicensedParameter = error.toString();
		})

		// CheckLicensedParameter
		.then(() => {
			return global.KServerApi.CheckLicensedParameter(100002);
		})
		.then(result => {
			req.checkLicensedParameter = result;
		})
		.catch(error => {
			req.checkLicensedParameter = error.toString();
		})

		// ValidateLicense
		.then(() => {
			return global.KServerApi.ValidateLicense(100002);
		})
		.then(result => {
			req.validateLicense = result;
		})
		.catch(error => {
			req.validateLicense = error.toString();
		})

		// KodeksDocInfo
		.then(() => {
			return global.KServerApi.KodeksDocInfo(9027690, req);
		})
		.then(access => {
			req.kodeksDocInfo = access;
		})
		.catch(error => {
			req.kodeksDocInfo = error.toString();
		})

		// KodeksProductStatus
		.then(() => {
			return global.KServerApi.KodeksProductStatus(10913, req);
		})
		.then(status => {
			req.kodeksProductStatus = status;
		})
		.catch(error => {
			req.kodeksProductStatus = error.toString();
		})

		
		// GetServerInfo
		.then(() => {
			return global.KServerApi.GetServerInfo();
		})
		.then(info => {
			req.serverInfo = info;
		})
		.catch(error => {
			req.serverInfo = error.toString();
		})

		// GetServiceName
		.then(() => {
			return global.KServerApi.GetServiceName("333101000");
		})
		.then(names => {
			req.serviceName = names;
		})
		.catch(error => {
			req.serviceName = error.toString();
		})

		// SendMail
		/* uncomment this block to enable the test *//*
		.then(() => {
			sendMailEnabled = true;
			return global.KServerApi.SendMail(
				'garry@kodeks.ru' // to
				, 'тестовое письмо (plugins API)' // subj
				, `Тестовое письмо:\n  plugin: ${global.KServerApi.Name} on ${server.address()}` // body
				//, '' // cc
				//, [] // attachment
			);
		})
		.then(result => {
			req.sendMail = result;
		})
		.catch(error => {
			req.sendMail = error.toString();
		})
		/**///*

		// NonexistentAPIMethod
		.then(() => {
			return global.KServerApi.NonexistentAPIMethod();
		})
		.then(result => {
			req.nonexistentAPIMethod = result;
		})
		.catch(error => {
			req.nonexistentAPIMethod = error.toString();
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

global.onShutdown = () => {
	console.log(`custom 'onShutdown' called`);
	return new Promise((resolve, reject) => {
		server.close(err => {
			console.log(`custom 'onShutdown' complete`);
			err ? rejest(err) : resolve();
		});
	});
};
