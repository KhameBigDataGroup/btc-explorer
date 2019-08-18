var redis = require("redis");
var bluebird = require("bluebird");

var config = require("./config.js");
var utils = require("./utils.js");

var redisClient = null;
if (config.credentials.redisUrl) {
	bluebird.promisifyAll(redis.RedisClient.prototype);

	redisClient = redis.createClient({url:config.credentials.redisUrl});
}

var redisCache = {
	get:function(key) {
		return new Promise(function(resolve, reject) {
			redisClient.getAsync(key).then(function(result) {
				if (result == null) {
					resolve(null);

					return;
				}

				resolve(JSON.parse(result));

			}).catch(function(err) {
				utils.logError("328rhwefghsdgsdss", err);

				reject(err);
			});
		});
	},
	set:function(key, obj, maxAgeMillis) {
		redisClient.set(key, JSON.stringify(obj), "PX", maxAgeMillis);
	}
};

module.exports = {
	active: (redisClient != null),
	get: redisCache.get,
	set: redisCache.set
}