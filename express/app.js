'use strict';

const http = require('http')
	, https = require('https')
	, url = require('url')
	, util = require('util')
	, express = require('express')
	, app = express()
	;

let sendMailEnabled = false;

let httpModule = http;
let srvrProtocol = '';
let srvrPort = '';
global.KServerApi.GetServerInfo()
.then(info => {
	let defport = 80;
	srvrProtocol = info.Protocol || 'http';
	if (srvrProtocol == 'https') {
		httpModule = https;
		defport = 443;
	}
	srvrPort = !info.Port ? defport : info.Port;
	srvrProtocol = `${srvrProtocol}://`;
});

app.get(`/${global.KServerApi.Route}/loopback-test`, function (req, res, next) {
	console.log('/loopback-test request');
	res.end(`request on '${req.protocol}://${req.headers.host}${req.originalUrl}': ok`);
});

// GetServerInfo
app.use(function (req, res, next) {
	global.KServerApi.GetServerInfo()
	.then(info => {
		req.serverInfo = info;
		return next();
	})
	.catch(error => {
		req.serverInfo = error.message;
		return next();
	});
});

// UserInfo
app.use(function (req, res, next) {
	global.KServerApi.UserInfo(req)
	.then(userInfo => {
		req.userInfo = userInfo;
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
			req.userList = userList;
		return next();
	})
	.catch(error => {
		req.userList = error.toString();
		return next();
	});
});

// CheckAccess
app.use(function (req, res, next) {
	global.KServerApi.CheckAccess(100005, req)
	.then(access => {
		req.checkAccess = access;
		return next();
	})
	.catch(error => {
		req.checkAccess = error.toString();
		return next();
	});
});

// PickPermissions
app.use(function (req, res, next) {
	global.KServerApi.PickPermissions([
			[555100000, 0], ['555100000', '1'], 555100001, '555100002'
		],	req)
	.then(access => {
		req.pickPermissions = access;
		return next();
	})
	.catch(error => {
		req.pickPermissions = error.toString();
		return next();
	});
});

// SetLicensedParameter
app.use(function (req, res, next) {
	global.KServerApi.SetLicensedParameter(100002, 0, 50, 123456789)
	.then(result => {
		req.setLicensedParameter = 'set' + result ? '' : ' with "overuse" status';
		return next();
	})
	.catch(error => {
		req.setLicensedParameter = error.toString();
		return next();
	});
});

// IncLicensedParameter (+5)
app.use(function (req, res, next) {
	global.KServerApi.IncLicensedParameter(100002, 0, 5, 123456789)
	.then(result => {
		req.incLicensedParameter = result;
		return next();
	})
	.catch(error => {
		req.incLicensedParameter = error.toString();
		return next();
	});
});

// IncLicensedParameter (-15)
app.use(function (req, res, next) {
	global.KServerApi.IncLicensedParameter(100002, 0, -15, 123456789)
	.then(result => {
		req.decLicensedParameter = result;
		return next();
	})
	.catch(error => {
		req.decLicensedParameter = error.toString();
		return next();
	});
});

// CheckLicensedParameter
app.use(function (req, res, next) {
	global.KServerApi.CheckLicensedParameter(100002)
	.then(result => {
		req.checkLicensedParameter = result;
		return next();
	})
	.catch(error => {
		req.checkLicensedParameter = error.toString();
		return next();
	});
});

// ValidateLicense
app.use(function (req, res, next) {
	global.KServerApi.ValidateLicense(100002)
	.then(result => {
		req.validateLicense = result;
		return next();
	})
	.catch(error => {
		req.validateLicense = error.toString();
		return next();
	});
});

// KodeksDocInfo
app.use(function (req, res, next) {
	global.KServerApi.KodeksDocInfo(9027690, req)
	.then(docInfo => {
		req.kodeksDocInfo = docInfo;
		return next();
	})
	.catch(error => {
		req.kodeksDocInfo = error.toString();
		return next();
	});
});

// KodeksProductStatus
app.use(function (req, res, next) {
	global.KServerApi.KodeksProductStatus(10913, req)
	.then(productStatus => {
		req.kodeksProductStatus = productStatus;
		return next();
	})
	.catch(error => {
		req.kodeksProductStatus = error.toString();
		return next();
	});
});

// GetServiceName
app.use(function (req, res, next) {
	global.KServerApi.GetServiceName("333101000")
	.then(serviceName => {
		req.kodeksServiceName = serviceName;
		return next();
	})
	.catch(error => {
		req.kodeksServiceName = error.message;
		return next();
	});
});

// SendMail
/* uncomment this block to enable the test *//*
sendMailEnabled = true;
app.use(function (req, res, next) {
	global.KServerApi.SendMail(
		'garry@kodeks.ru' // to
		, 'тестовое письмо (plugins API)' // subj
		, `Тестовое письмо:\n  plugin: ${global.KServerApi.Name} on ${global.KServerApi.SocketPath}` // body
		//, '' // cc
		//, [] // attachment
	)
	.then(result => {
		req.sendMail = result;
		return next();
	})
	.catch(error => {
		req.sendMail = error.toString();
		return next();
	});
});
/**///*

// NonexistentAPIMethod
app.use(function (req, res, next) {
	global.KServerApi.NonexistentAPIMethod()
	.then(result => {
		req.nonexistentAPIMethod = result;
		return next();
	})
	.catch(error => {
		req.nonExistingAPIMethod = error.toString();
		return next();
	});
});

// Loopback (over IPv6)
app.use(function (req, res, next) {
	httpModule.get({
		host: `[::1]`,
		port: srvrPort,
		path: `/${global.KServerApi.Route}/loopback-test`,
		headers: {
			cookie: req.headers.cookie
		}		
	}, answer => {
		const data = [];
		answer.on('data', chunk => {
			console.log(`/loopback-test (IPv6) answer chunk: ${chunk}`);
			data.push(chunk);
		});
		answer.on('end', () => {
			console.log(`/loopback-test (IPv6) answer end`);
			req.loopbackTest_ipv6 = data.join('');
			next();
		});
	})
	.on('error', err => {
		req.loopbackTest_ipv6 = `failed: ${err}`;
		next();
	});
});

// Loopback (over IPv4)
app.use(function (req, res, next) {
	httpModule.get({
		host: `127.0.0.1`,
		port: srvrPort,
		path: `/${global.KServerApi.Route}/loopback-test`,
		headers: {
			cookie: req.headers.cookie
		}		
	}, answer => {
		const data = [];
		answer.on('data', chunk => {
			console.log(`/loopback-test (PIv4) answer chunk: ${chunk}`);
			data.push(chunk);
		});
		answer.on('end', () => {
			console.log(`/loopback-test (PIv4) answer end`);
			req.loopbackTest_ipv4 = data.join('');
			next();
		});
	})
	.on('error', err => {
		req.loopbackTest_ipv4 = `failed: ${err}`;
		next();
	});;
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
	str += `<h3>Server info:</h3>
		<pre>${req.serverInfo ? JSON.stringify(req.serverInfo, null, kPadding) : 'some problem'}</pre>`;

	str += '<hr>';
	str += `<h3>Service name:</h3>
		<pre>${req.kodeksServiceName ? JSON.stringify(req.kodeksServiceName, null, kPadding) : 'some problem'}</pre>`;

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
	str += `<h3>Pick permissions:</h3>
		<pre>${req.checkAccess ? JSON.stringify(req.pickPermissions, null, kPadding) : 'some problem'}</pre>`;

	str += '<hr>';
	str += `<h3>Set licensed parameter:</h3>
		<pre>${req.setLicensedParameter ? JSON.stringify(req.setLicensedParameter, null, kPadding) : 'some problem'}</pre>`;

	str += '<hr>';
	str += `<h3>Increase licensed parameter:</h3>
		<pre>${req.incLicensedParameter ? JSON.stringify(req.incLicensedParameter, null, kPadding) : 'some problem'}</pre>`;

	str += '<hr>';
	str += `<h3>Decrease licensed parameter:</h3>
		<pre>${req.decLicensedParameter ? JSON.stringify(req.decLicensedParameter, null, kPadding) : 'some problem'}</pre>`;

	str += '<hr>';
	str += `<h3>Check licensed parameter:</h3>
		<pre>${req.checkLicensedParameter ? JSON.stringify(req.checkLicensedParameter, null, kPadding) : 'some problem'}</pre>`;

	str += '<hr>';
	str += `<h3>Validate license:</h3>
		<pre>${req.validateLicense ? JSON.stringify(req.validateLicense, null, kPadding) : 'some problem'}</pre>`;

	str += '<hr>';
	str += `<h3>Kodeks doc info:</h3>
		<pre>${req.kodeksDocInfo ? JSON.stringify(req.kodeksDocInfo, null, kPadding) : 'some problem'}</pre>`;

	str += '<hr>';
	str += `<h3>Kodeks product status:</h3>
		<pre>${req.kodeksProductStatus ? JSON.stringify(req.kodeksProductStatus, null, kPadding) : 'some problem'}</pre>`;

	if (sendMailEnabled) {
		str += '<hr>';
		str += `<h3>Send mail:</h3>
			<pre>${req.sendMail ? JSON.stringify(req.sendMail, null, kPadding) : 'some problem'}</pre>`;
	}

	str += '<hr>';
	str += `<h3>Nonexistent API method:</h3>
		<pre>${req.nonexistentAPIMethod ? JSON.stringify(req.nonexistentAPIMethod, null, kPadding) : 'some problem'}</pre>`;

	str += '<hr>';
	str += `<h3>Loopback test (IPv6):</h3>
		<pre>${req.loopbackTest_ipv6 ? JSON.stringify(req.loopbackTest_ipv6, null, kPadding) : 'some problem'}</pre>`;

	str += '<hr>';
	str += `<h3>Loopback test (IPv4):</h3>
		<pre>${req.loopbackTest_ipv4 ?  JSON.stringify(req.loopbackTest_ipv4, null, kPadding) : 'some problem'}</pre>`;

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