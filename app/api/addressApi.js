var config = require("./../config.js");
var coins = require("../coins.js");
var utils = require("../utils.js");

function getAddressDetails(address, scriptPubkey, sort, limit, offset) {
	return new Promise(function(resolve, reject) {
		var promises = [];

		promises.push(getAddressDetailsPromise(address, limit, offset));

		Promise.all(promises).then(function(results) {
			if (results && results.length > 0) {
				resolve(results[0]);

			} else {
				resolve(null);
			}
		}).catch(function(err) {
			utils.logError("239x7rhsd0gs", err);

			reject(err);
		});
	});
}

function getAddressDetailsPromise(address, limit, offset) {
	return new Promise(function(resolve, reject) {
		if (address.startsWith("bc1")) {
			reject({userText:"API does not support native Segwit addresses"});
			return;
		}

		var limitOffset = limit + offset;

		var options = {
			url: `https://api.blockcypher.com/v1/btc/main/addrs/${address}?limit=${limitOffset}`,
			headers: {
				'User-Agent': 'request'
			}
		};

		request(options, function(error, response, body) {
			if (error == null && response && response.statusCode && response.statusCode == 200) {
				var responseJson = JSON.parse(body);

				var response = {};

				response.txids = [];
				response.blockHeightsByTxid = {};

				for (var i = offset; i < Math.min(responseJson.txrefs.length, limitOffset); i++) {
					var tx = responseJson.txrefs[i];

					response.txids.push(tx.tx_hash);
					response.blockHeightsByTxid[tx.tx_hash] = tx.block_height;
				}

				response.txCount = responseJson.n_tx;
				response.totalReceivedSat = responseJson.total_received;
				response.totalSentSat = responseJson.total_sent;
				response.balanceSat = responseJson.final_balance;
				response.source = "blockcypher.com";

				resolve({addressDetails:response});

			} else {
				var fullError = {error:error, response:response, body:body};

				utils.logError("097wef0adsgadgs", fullError);

				reject(fullError);
			}
		});
	});
}

module.exports = {
	getAddressDetails: getAddressDetails
};