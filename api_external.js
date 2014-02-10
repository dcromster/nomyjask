// external api commands

var api_commands = {}; // hash with youre API commands
var result = {}; // hash with result and result status

api_commands['external_test'] = 'external_test()';

exports.api_commands = {}; // hash with youre API commands
exports.api_commands['external_test'] = 'api_commands_external.external_test(res)';

exports.external_test = function(res) {
	result.result = 'external test passed';
	result.status = 'ok';
	return res.json(result);
};

