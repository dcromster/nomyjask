nomyjask
========

node + mysql json api starter kit

* [About](#about)
* [How to use](#howtouse)
* [Author](#author)
* [ToDo](#todo)
* [Database](#sql)

# <a name="about"></a>About
This starter kit to start programming json api in your project

# <a name="howtouse"></a>How to use

## Files:
* api.js - main application;
* config.js - here you must write paths to external API files;
* api_external.js - example of external API file;
* api_external2.js - another example with 2 functions.

## Test it!
Example of running: 
* Make base API call:
curl -X POST http://localhost:3000/api -d 'data={"action":"user_password_reset", "login":"email@mail.com", "password":"2"}'
* Make external API call from '''api_external2.js''':
> curl -X POST http://localhost:3000/api -d 'data={"action":"external_test2_1", "login":"email@mail.com", "password":"2"}' 

## Base API calls:
All base API calls return hash: 
> { result: 'result of request or error text', status: 'status of request: "ok" or "error"'}

* user_login - login. Returns a session id.
* user_register - Register user. Returns 'ok'.
* user_password_reset - Reset password. Returns hash of new password.


# <a name="author"></a>Author
* Roman Milovskiy dcromster@gmail.com

# <a name="todo"></a>ToDo
I'll think about it :)

* Translate comments in api.js;
* Some 'FIXIT' to fix.

# <a name="sql"></a>SQL

> CREATE TABLE IF NOT EXISTS `users` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `email` varchar(256) NOT NULL,
  `password` varchar(256) NOT NULL,
  `session` varchar(256) NOT NULL COMMENT 'session',
  `first_login` datetime NOT NULL DEFAULT '0000-00-00 00:00:00' COMMENT 'date and time of registration',
  `last_login` datetime NOT NULL DEFAULT '0000-00-00 00:00:00' COMMENT 'date and time of last login',
  `last_action` datetime NOT NULL DEFAULT '0000-00-00 00:00:00' COMMENT 'date and time of last action',
  `register_date` datetime NOT NULL COMMENT 'дата регистрации',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 COMMENT='Пользователи-сессии' AUTO_INCREMENT=0 ;