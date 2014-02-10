// external api commands

var api_commands = {}; // hash with youre API commands
var result = {}; // hash with result and result status

api_commands['external_test2'] = 'external_test2()';

exports.api_commands = {}; // hash with youre API commands
exports.api_commands['external_test2'] = 'api_commands_external.external_test2(res)';
exports.api_commands['external_test2_1'] = 'api_commands_external.external_test2_1(res)';

exports.external_test2 = function(res) {
	result.result = 'external test #2 passed';
	result.status = 'ok';
	return res.json(result);
};
exports.external_test2_1 = function(res) {
	result.result = 'external test #2_1 passed';
	result.status = 'ok';
	return res.json(result);
};

