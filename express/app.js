'use strict';

const http = require('http')
	, url = require('url')
	, express = require('express')
	, app = express()
	;

let sendMailEnabled = false;

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
	global.KServerApi.CheckAccess(100005, req)
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

// PickPermissions
app.use(function (req, res, next) {
	global.KServerApi.PickPermissions([
			[555100000, 0], ['555100000', '1'], 555100001, '555100002'
		],	req)
	.then(access => {
		try {
			req.pickPermissions = JSON.parse(access);
		} catch (err) {
			req.pickPermissions = err.toString();
		}
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
		try {
			req.setLicensedParameter = 'set' + result ? '' : ' with "overuse" status';
		} catch (err) {
			req.setLicensedParameter = err.toString();
		}
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
		try {
			req.incLicensedParameter = result;
		} catch (err) {
			req.incLicensedParameter = err.toString();
		}
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
		try {
			req.decLicensedParameter = result;
		} catch (err) {
			req.decLicensedParameter = err.toString();
		}
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
		try {
			req.checkLicensedParameter = result;
		} catch (err) {
			req.checkLicensedParameter = err.toString();
		}
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
		try {
			req.validateLicense = result;
		} catch (err) {
			req.validateLicense = err.toString();
		}
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
	global.KServerApi.KodeksProductStatus(10913, req)
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
		try {
			req.sendMail = result;
		} catch (err) {
			req.sendMail = err.toString();
		}
		return next();
	})
	.catch(error => {
		req.sendMail = error.toString();
		return next();
	});
});
/**///*

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