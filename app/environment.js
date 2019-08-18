var os = require('os');
var path = require('path');

module.exports = {
	rpc: {
		host: "172.17.0.1",
		port: 8332,
		username: 'bitcoin',
		password: 'password',
		cookie: path.join(os.homedir(), '.bitcoin', '.cookie'),
		timeout: 5000,
	},
	ipStackComApiAccessKey: 'ab572047e00dddc4c98b3c045f59a9ff',
	redisUrl:"redis://172.17.0.1:6379",
	currentCoin: "BTC",
};
