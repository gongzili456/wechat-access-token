'use strict';
const request = require('co-request');

const _wx_access_token_ = {};

/*
 * Store token's key as `appid|secret` format, becuase the secret can be updated in MP.
 */
function build_key(appid, secret){
  return appid + "|" + secret;
}

/**
 * return one token.
 */
module.exports = function token(appid, secret, cb) {
  if(!appid || !secret){
    var err = new Error();
    err.name = 'WechatAccessTokenError';
    return cb(err);
  }
  // 1. Return token if it is valid.
  var key = build_key(appid, secret);
  if (isValid(key)) {
    return cb(null, _wx_access_token_[key]);
  }
  // 2. refresh token
  return refresh(appid, secret, cb);
};

/**
 * get one new token.
 */
function refresh(appid, secret, cb) {
  var url = 'https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=' + appid + '&secret=' + secret;
  return request(url, function (error, response, body) {
    if (error){
      return cb(error);
    }
    body = JSON.parse(body);
    if (body && body.errcode) {
      var err = new Error(body.errmsg);
      err.name = 'WechatAPIError';
      err.code = body.errcode;
      return cb(err);
    }
    var key = build_key(appid, secret);
    _wx_access_token_[key] = {
      access_token: body.access_token,
      expires_in: new Date().getTime() + (body.expires_in - 10) * 1000
    };
    return cb(null, _wx_access_token_[key]);
  });
}

/**
 * check key is valid.
 */
function isValid(key) {
  return _wx_access_token_[key] && new Date().getTime() < _wx_access_token_[key].expires_in;
}
