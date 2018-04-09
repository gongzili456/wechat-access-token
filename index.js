'use strict'
const request = require('co-request')

const _wx_access_token_ = {}

/*
 * Store token's key as `appid|secret` format, becuase the secret can be updated in MP.
 */
function build_key(appid, secret) {
  return appid + '|' + secret
}

/**
 * return one token.
 */
module.exports = function token(params, cb) {
  const appid = params.appid
  const secret = params.secret

  if (!appid || !secret) {
    var err = new Error('appid and secret is required.')
    err.name = 'WechatAccessTokenError'
    return cb(err)
  }

  // 1. Return token if it is valid.
  var key = build_key(appid, secret)

  const store = params.store || new Store()

  store.load(key).then(function(token) {
    if (isValid(token)) {
      return cb(null, token)
    }
    // 2. refresh token
    return refresh(appid, secret, store, key, cb)
  })
}

/**
 * check key is valid.
 */
function isValid(token) {
  return token && new Date().getTime() < token.expires_in
}

class Store {
  load(key) {
    return new Promise(function(resolve, reject) {
      return resolve(_wx_access_token_[key])
    })
  }

  save(key, value) {
    return new Promise(function(resolve, reject) {
      _wx_access_token_[key] = value
      return resolve(value)
    })
  }

  remove(key) {
    _wx_access_token_[key] = null
  }
}

/**
 * get one new token.
 */
function refresh(appid, secret, store, key, cb) {
  var url =
    'https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=' +
    appid +
    '&secret=' +
    secret
  return request(url, function(error, response, body) {
    if (error) {
      return cb(error)
    }
    body = JSON.parse(body)
    if (body && body.errcode) {
      var err = new Error(body.errmsg)
      err.name = 'WechatAPIError'
      err.code = body.errcode
      return cb(err)
    }

    const token = {
      access_token: body.access_token,
      expires_in: new Date().getTime() + (body.expires_in - 10) * 1000,
    }

    store.save(key, token).then(function(t) {
      cb(null, token)
    })
  })
}
