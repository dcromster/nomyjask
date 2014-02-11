// configuration file for v110214
var config = {};

config.apis = ['api_external.js','api_external2.js','filenotfound.js']; // here write external api's filenames.
config.mysql = {
	    host     : 'localhost',
	    user     : 'user',
	    password : 'password',
	    database : 'db',
	    //~ debug : true,
    };
config.application = {}; // all configs for you application
config.application.port = 3000; // application port
config.application.salt = 'hqgUAeOrY25t3knXhOhPHzQQsCcoJOUiphd5mv0UeEOuxuPPpKWxIL32pDDvVufDIHMfqX0wmE55pEP3R8XAjKojTd1yDqhjvANc'; // salt for hashing

module.exports = config;
