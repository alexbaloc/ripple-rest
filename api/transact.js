'use strict';
var _ = require('lodash');
var async = require('async');
var asyncify = require('simple-asyncify');
var sign = require('./transaction/sign');
var createTxJSON = require('./transaction/utils').createTxJSON;
var transactions = require('./transactions');
var validate = require('./lib/validate');

function signIfSecretExists(secret, prepared) {
  var signResponse = secret ? sign(prepared.tx_json, secret) : {};
  return _.assign({}, prepared, signResponse);
}

function formatResponse(converter, prepared) {
  return _.assign({}, prepared, converter(prepared, {}));
}

function prepareAndOptionallySign(transaction, api, secret, options,
    converter, callback) {
  var address = transaction.tx_json.Account;
  validate.addressAndMaybeSecret({address: address, secret: secret});
  validate.options(options);
  async.waterfall([
    _.partial(createTxJSON, transaction, api.remote, options),
    _.partial(asyncify(signIfSecretExists), secret),
    _.partial(asyncify(formatResponse), converter)
  ], callback);
}

function prepareAndSignAndSubmit(transaction, api, secret, options, converter,
    callback) {
  var address = transaction.tx_json.Account;
  validate.addressAndSecret({address: address, secret: secret});
  validate.options(options);
  async.waterfall([
    _.partial(transactions.submit, api, transaction, secret, options),
    asyncify(converter)
  ], callback);
}

/* eslint-disable no-unused-vars */
function transact(transaction, api, secret, options, converter, callback) {
  if (options.submit === false) {
    prepareAndOptionallySign.apply(this, arguments);
  } else {
    prepareAndSignAndSubmit.apply(this, arguments);
  }
}
/* eslint-enable no-unused-vars */

module.exports = transact;
