'use strict'
const request = require('co-request');

const _wx_access_token_ = {};

/**
* return one token.
*/
module.exports = function token(appid, secret, cb) {
  // 1. if token is valid.
  if (isValid(appid)) {
    return cb(null, _wx_access_token_[appid]);
  }
  // 2. refresh token
  refresh(appid, secret, cb)
}

/**
* get one new token.
*/
function refresh(appid, secret, cb) {
  return request('https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=' + appid + '&secret=' + secret, function (error, response, body) {
    if (error) return error;
    body = JSON.parse(body);
    if (body && body.errcode) {
      var err = new Error(body.errmsg);
      err.name = 'WechatAPIError';
      err.status = body.errcode;
      return cb(err);
    }
    _wx_access_token_[appid] = {
      access_token: body.access_token,
      expires_in: new Date().getTime() + (body.expires_in - 10) * 1000
    }
    return cb(null, _wx_access_token_[appid]);
  });
}

/**
* check token is valid.
*/
function isValid(appid) {
  return _wx_access_token_[appid] && new Date().getTime() < _wx_access_token_[appid].expires_in;
}
