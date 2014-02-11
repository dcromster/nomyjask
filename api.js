// 110214

var express = require('express');
var http = require('http');
var path = require('path');
var routes = require('routes');
var app = express();
var dateFormat = require('dateformat');

var config = require('./config.js');

app.use(express.bodyParser());
app.set('port', config.application.port);

var mysql = require('mysql');
var db = mysql.createConnection(config.mysql);

db.connect(function(err) {
	if ( !err ) {
		console.log("Connected to MySQL");
	} else if ( err ) {
		console.log(err);
	}
});

var salt = config.application.salt;
var md5 = require('MD5');

var api_commands = {}; // хэш с командами для API
var api_commands_external = {};// = require('./api_external.js');
var external_apis = []; // храним подключенные API

http.createServer(app).listen(app.get('port'), function() {
    console.log('7lf.ru listening on port ' + 3000);
    //-- команды API
    // базовые команды
    api_commands[''] = perror(0);
    api_commands['user_login'] = 'user_login(res, data.login, data.password)';
    api_commands['user_register'] = 'user_register(res, data.login, data.password)';
    api_commands['user_password_reset'] = 'user_password_reset(res, data.login, data.password)';
    // присоединяем сторонние
    for (index = 0; index < config.apis.length; ++index) {
			try {
			    external_apis[index] = require('./'+config.apis[index]);
			    api_commands = merge_options(api_commands, external_apis[index]['api_commands']);
			    // перебрать все ключи и добавлять только те, кто не api_commands - добавляем функции из внешних API
			    for (var key in external_apis[index]) {
						if (key != 'api_commands') {
							api_commands_external[key] = external_apis[index][key];
						};
			    }
			}
			catch (e) {
			    console.log("Can't find external API module")
			    console.log(e)
			}
    };
    api_commands = merge_options(api_commands, api_commands_external.api_commands);
});


//----------------------------------------------------------------------
app.use(function(req,res, next) {
    var was_action = 0;
    //~ console.log("\nRequest:"+req.url);
    //~ console.log('API request');
    var result = {};

    if (req.body.data === undefined) { res.send(500, 'data undefined')}; // FIXIT - сделать по другому
    var data = JSON.parse(req.body.data);
    if (!data) {
			result.status = 'error';
			result.result = 'no data';
			console.log('No data');
    } else {
			var data = JSON.parse(req.body.data);
			if (api_commands[data.action] === undefined) {
				result.status = 'error';
		    result.result = perror(0);
		    res.json(result);
			} else {
				eval(api_commands[data.action]); // выполняем команды
			};
    };

});
//----------------------------------------------------------------------
function user_password_reset(res, login, password) {
	var result = {};

	if (password === '') { // пароль не задан - генерируем
		password = password_encode(Math.random() + curtime());
	};

	// проверяем есть ли такой пользователь
	var querystring = 'select id from users where email = ?';
	db.query(querystring, [login], function(err, rows, fields) {
		if (err) throw err;
		if (rows[0] === undefined) { // пользователя нет
			result.result = perror(104);
			result.status = 'error';
			res.json(result);
		} else {
			user_log(rows[0],'Reset password to:'+password);
			password = password_encode(password);
			// апдейтим бд
			var querystring = 'update users set password = ? where email = ?';
			db.query(querystring, [password, login], function(err, rows, fields) {
				result.result = password;
				result.status = 'ok';
				res.json(result);
				//~ return(result);
			});
		};
	});
};
//----------------------------------------------------------------------
function user_login(res, login, password) {

    var result = {};
    var err = ''; // код ошибки
    var matcher = /.+\@.+\..+/;

    if (!login) { err = perror(100)};
    if (!password) { err = perror(101)};
    if (!(matcher.test(login))) { err = perror(102)};
    if (err != '') {
		result.result = err;
		result.status = 'error';
		res.json(result);
    };

    var encoded_pasword = password_encode(password); // кодируем пароль
    var querystring = 'select id from users where email = ?';
    db.query(querystring, [login], function(err, rows, fields) {
	    if (err) throw err;
	    if (rows[0] === undefined) { // пользователя нет
		    result.result = perror(104);
		    result.status = 'error';
		    return res.json(result);
	    } else { //пользователь есть
		    var user_id = rows[0]['id'];
		    // проверяем пароль
		    var querystring = 'select password from users where id = ?';
		    db.query(querystring, [user_id], function(err, rows, fields) {
			    if (rows[0]['password'] != encoded_pasword) {
				    result.result = perror(105);
				    result.status = 'error';
				    console.log(perror(105));
				    return res.json(result);
			    } else { //пароль совпал
				    // обновляем дату последнего логина
				    var querystring = 'update users set last_login ='+curtime()+' where id=?';
				    db.query(querystring, [user_id], function(err, rows, fields) {});

				    //~ user_last_action(user_id); // записываю время последнего действия пользователя
				    result.result = gen_session(user_id); // возвращаем сессию
				    user_log(user_id, 'login:'+result.result); //записываю в лог действие
				    result.status = 'ok';
				    return res.json(result);
			    }
		    });
	    };
    });
};
//----------------------------------------------------------------------
function user_register(res, login, password) {
    var err = ''; // код ошибки
    var result = {};
	var matcher = /.+\@.+\..+/;

    if (!login) { err = perror(100)};
    if (!password) { err = perror(101)};
    if (!(matcher.test(login))) { err = perror(102)};
    if (err != '') {
		result.result = err;
		result.status = 'error';
		return res.json(result);
    };

	var querystring = 'select id from users where email = ?';
	db.query(querystring, [login], function(err, rows, fields) {
	    if (err) throw err;
	    if (rows[0] === undefined) { // пользователя нет - регистрируем
			querystring = 'insert into users (email,password,register_date,last_action) values (?,?,?,?)';
		    var encoded_pasword = password_encode(password); // кодируем пароль
		    var cur_datetime = curtime();
			db.query(querystring, [login, encoded_pasword, cur_datetime, cur_datetime], function(err, rows, fields) {
				// TODO: add action to log
				// TODO: error checking
				result.result = 'ok';
				result.status = 'ok';
				return res.json(result);
			});
	    } else { // пользователь есть - ошибка
			result.result = perror(103);
			result.status = 'error';
			console.log(perror(103));
			return res.json(result);
	    }

	});
};
//----------------------------------------------------------------------
function user_log(user_id, comment) { // записываем действия пользователя в лог и дату-время последнего действия
	// записываем действия пользователя в лог
	// записываем дату-время последнего действия
	var querystring = 'update `users` set `last_action` =\''+curtime()+'\' where id = ?';
	db.query(querystring, [user_id.id], function(err, rows, fields) {if (err) throw err});
};
//----------------------------------------------------------------------
function curtime() { // текущая дата-время в формате mysql
	var now = new Date();
    return(dateFormat(now, "yyyy-mm-dd HH:MM:ss"));
};
//----------------------------------------------------------------------
function gen_session(user_id) { // генерация сесии
	return(md5(user_id + salt + curtime()));
};
//----------------------------------------------------------------------
function password_encode(password) { // шифрование пароля
	return(md5(password + salt));
};
//----------------------------------------------------------------------
function perror(code) { // возвращаем ошибки
	if (code == 0) { return 'command is not supported' };
	if (code == 100) { return 'login is undefined' };
	if (code == 101) { return 'password is undefined' };
	if (code == 102) { return 'login is not e-mail' };
	if (code == 103) { return 'user alreay exist' };
	if (code == 104) { return 'user not found' };
	if (code == 105) { return 'bad password' };
	if (code == 106) { return 'unknown request' };
	return 'unknown error';
};
//----------------------------------------------------------------------
app.use(function(err,req,res,next){
// внутренняя ошибка сервера
  if (app.get('env') == 'development') { // сервер разработки
    var errorHandler = express.errorHandler();
    errorHandler(err,req,res,next);
  } else { // poduction
    res.send(500);
  }
});
//----------------------------------------------------------------------
/**
 * Overwrites obj1's values with obj2's and adds obj2's if non existent in obj1
 * @param obj1
 * @param obj2
 * @returns obj3 a new object based on obj1 and obj2
 */
function merge_options(obj1,obj2){
    var obj3 = {};
    for (var attrname in obj1) { obj3[attrname] = obj1[attrname]; }
    for (var attrname in obj2) { obj3[attrname] = obj2[attrname]; }
    return obj3;
}
