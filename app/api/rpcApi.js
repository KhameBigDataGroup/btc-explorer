var debug = require('debug');

var debugLog = debug("btcexp:rpc");

var async = require("async");

var utils = require("../utils.js");
var config = require("../config.js");
var coins = require("../coins.js");

var activeQueueTasks = 0;

var rpcQueue = async.queue(function(task, callback) {
	activeQueueTasks++;

	task.rpcCall(function() {
		callback();

		activeQueueTasks--;
	});

}, config.rpcConcurrency);



function getBlockchainInfo() {
	return getRpcData("getblockchaininfo");
}

function getNetworkInfo() {
	return getRpcData("getnetworkinfo");
}

function getNetTotals() {
	return getRpcData("getnettotals");
}

function getMempoolInfo() {
	return getRpcData("getmempoolinfo");
}

function getMiningInfo() {
	return getRpcData("getmininginfo");
}

function getUptimeSeconds() {
	return getRpcData("uptime");
}

function getPeerInfo() {
	return getRpcData("getpeerinfo");
}

function getRawMempool() {
	return getRpcDataWithParams({method:"getrawmempool", parameters:[true]});
}

function getChainTxStats(blockCount) {
	return getRpcDataWithParams({method:"getchaintxstats", parameters:[blockCount]});
}

function getBlockByHeight(blockHeight) {
	return new Promise(function(resolve, reject) {
		getRpcDataWithParams({method:"getblockhash", parameters:[blockHeight]}).then(function(blockhash) {
			getBlockByHash(blockhash).then(function(block) {
				resolve(block);

			}).catch(function(err) {
				reject(err);
			});
		}).catch(function(err) {
			reject(err);
		});
	});
}

function getBlockByHash(blockHash) {
	debugLog("getBlockByHash: %s", blockHash);

	return new Promise(function(resolve, reject) {
		getRpcDataWithParams({method:"getblock", parameters:[blockHash]}).then(function(block) {
			getRawTransaction(block.tx[0]).then(function(tx) {
				block.coinbaseTx = tx;
				block.totalFees = utils.getBlockTotalFeesFromCoinbaseTxAndBlockHeight(tx, block.height);
				block.miner = utils.getMinerFromCoinbaseTx(tx);

				resolve(block);

			}).catch(function(err) {
				reject(err);
			});
		}).catch(function(err) {
			reject(err);
		});
	});
}

function getAddress(address) {
	return getRpcDataWithParams({method:"validateaddress", parameters:[address]});
}

function getRawTransaction(txid) {
	debugLog("getRawTransaction: %s", txid);

	return new Promise(function(resolve, reject) {
		if (coins[config.coin].genesisCoinbaseTransactionId && txid == coins[config.coin].genesisCoinbaseTransactionId) {
			getBlockchainInfo().then(function(blockchainInfoResult) {
				var result = coins[config.coin].genesisCoinbaseTransaction;
				result.confirmations = blockchainInfoResult.blocks;

				resolve(result);

			}).catch(function(err) {
				reject(err);
			});

		} else {
			getRpcDataWithParams({method:"getrawtransaction", parameters:[txid, 1]}).then(function(result) {
				if (result == null || result.code && result.code < 0) {
					reject(result);

					return;
				}

				resolve(result);

			}).catch(function(err) {
				reject(err);
			});
		}
	});
}

function getUtxo(txid, outputIndex) {
	debugLog("getUtxo: %s (%d)", txid, outputIndex);

	return new Promise(function(resolve, reject) {
		getRpcDataWithParams({method:"gettxout", parameters:[txid, outputIndex]}).then(function(result) {
			if (result == null) {
				resolve("0");

				return;
			}

			if (result.code && result.code < 0) {
				reject(result);

				return;
			}

			resolve(result);

		}).catch(function(err) {
			reject(err);
		});
	});
}

function getMempoolTxDetails(txid) {
	debugLog("getMempoolTxDetails: %s", txid);

	var promises = [];

	var mempoolDetails = {};

	promises.push(new Promise(function(resolve, reject) {
		getRpcDataWithParams({method:"getmempoolentry", parameters:[txid]}).then(function(result) {
			mempoolDetails.entry = result;

			resolve();

		}).catch(function(err) {
			reject(err);
		});
	}));

	promises.push(new Promise(function(resolve, reject) {
		getRpcDataWithParams({method:"getmempoolancestors", parameters:[txid]}).then(function(result) {
			mempoolDetails.ancestors = result;

			resolve();

		}).catch(function(err) {
			reject(err);
		});
	}));

	promises.push(new Promise(function(resolve, reject) {
		getRpcDataWithParams({method:"getmempooldescendants", parameters:[txid]}).then(function(result) {
			mempoolDetails.descendants = result;

			resolve();

		}).catch(function(err) {
			reject(err);
		});
	}));

	return new Promise(function(resolve, reject) {
		Promise.all(promises).then(function() {
			resolve(mempoolDetails);

		}).catch(function(err) {
			reject(err);
		});
	});
}

function getHelp() {
	return getRpcData("help");
}

function getRpcMethodHelp(methodName) {
	return getRpcDataWithParams({method:"help", parameters:[methodName]});
}



function getRpcData(cmd) {
	return new Promise(function(resolve, reject) {
		debugLog(`RPC: ${cmd}`);

		rpcCall = function(callback) {
			client.command(cmd, function(err, result, resHeaders) {
				if (err) {
					utils.logError("32euofeege", err, {cmd:cmd});

					reject(err);

					callback();

					return;
				}

				resolve(result);

				callback();
			});
		};
		
		rpcQueue.push({rpcCall:rpcCall});
	});
}

function getRpcDataWithParams(request) {
	return new Promise(function(resolve, reject) {
		debugLog(`RPC: ${JSON.stringify(request)}`);

		rpcCall = function(callback) {
			client.command([request], function(err, result, resHeaders) {
				if (err != null) {
					utils.logError("38eh39hdee", err, {result:result, headers:resHeaders});

					reject(err);

					callback();

					return;
				}

				resolve(result[0]);

				callback();
			});
		};
		
		rpcQueue.push({rpcCall:rpcCall});
	});
}


module.exports = {
	getBlockchainInfo: getBlockchainInfo,
	getNetworkInfo: getNetworkInfo,
	getNetTotals: getNetTotals,
	getMempoolInfo: getMempoolInfo,
	getMiningInfo: getMiningInfo,
	getBlockByHeight: getBlockByHeight,
	getBlockByHash: getBlockByHash,
	getRawTransaction: getRawTransaction,
	getUtxo: getUtxo,
	getMempoolTxDetails: getMempoolTxDetails,
	getRawMempool: getRawMempool,
	getUptimeSeconds: getUptimeSeconds,
	getHelp: getHelp,
	getRpcMethodHelp: getRpcMethodHelp,
	getAddress: getAddress,
	getPeerInfo: getPeerInfo,
	getChainTxStats: getChainTxStats
};